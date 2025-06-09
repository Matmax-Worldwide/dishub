'use client';

import { ReactNode, useState, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { TenantDashboard } from '@/components/navigation/tenantDashboard/TenantDashboard';
import { FeatureProvider, FeatureType } from '@/hooks/useFeatureAccess';
import { useQuery, gql } from '@apollo/client';

// GraphQL query to get current user
const GET_USER_DATA = gql`
  query GetUserData {
    me {
      id
      userTenants {
        tenantId
        role
        tenant {
          id
          slug
          name
        }
      }
      role {
        name
      }
    }
  }
`;

// GraphQL query to get tenant features  
const GET_TENANT_FEATURES = gql`
  query GetTenantFeatures($tenantId: ID!) {
    tenant(id: $tenantId) {
      id
      features
    }
  }
`;

// GraphQL query to get all tenants (for SuperAdmin to find by slug)
const GET_ALL_TENANTS = gql`
  query GetAllTenants {
    allTenants {
      items {
        id
        slug
        name
        features
      }
    }
  }
`;

interface TenantDashboardLayoutProps {
  children: ReactNode;
  params: Promise<{
    locale: string;
    tenantSlug: string;
  }>;
}

export default function TenantDashboardLayout({ 
  children 
}: TenantDashboardLayoutProps) {
  const [isLoading, setIsLoading] = useState(true);
  const params = useParams();
  const tenantSlug = params.tenantSlug as string;

  // Get user data first
  const { data: userData, loading: userLoading } = useQuery(GET_USER_DATA, {
    onCompleted: () => {
      setIsLoading(false);
    },
    onError: (error) => {
      console.error('Error loading user data:', error);
      setIsLoading(false);
    }
  });

  // Find the current tenant from user's tenant relationships using the URL slug
  const currentUserTenant = useMemo(() => {
    if (!userData?.me?.userTenants || !tenantSlug) return null;
    return userData.me.userTenants.find(
      (ut: { tenant: { slug: string } }) => ut.tenant.slug === tenantSlug
    );
  }, [userData?.me?.userTenants, tenantSlug]);

  // Check if user is SuperAdmin
  const isSuperAdmin = userData?.me?.role?.name === 'SuperAdmin';
  
  // Get the target tenant ID from the current user tenant relationship
  const targetTenantId = currentUserTenant?.tenantId;
  
  // Get tenant features based on the current tenant being accessed
  const { data: tenantData } = useQuery(GET_TENANT_FEATURES, {
    variables: { tenantId: targetTenantId || '' },
    skip: !targetTenantId,
    onCompleted: (data) => {
      console.log('Tenant features loaded for tenant:', tenantSlug, data?.tenant?.features);
    },
    onError: (error) => {
      console.error('Error loading tenant features:', error);
    }
  });

  // For SuperAdmin without direct tenant relationship, get all tenants and find by slug
  const { data: allTenantsData } = useQuery(GET_ALL_TENANTS, {
    skip: !isSuperAdmin || !!targetTenantId || !tenantSlug,
    onCompleted: (data) => {
      const targetTenant = data?.allTenants?.items?.find((t: { slug: string }) => t.slug === tenantSlug);
      console.log('Tenant found for SuperAdmin:', tenantSlug, targetTenant?.features);
    },
    onError: (error) => {
      console.error('Error loading tenants for SuperAdmin:', error);
    }
  });

  // Parse tenant features - IMPORTANT: Only use actual tenant features, no defaults for SuperAdmin
  // Use tenant data from direct relationship or fallback to all tenants query for SuperAdmin
  const tenantFromAllTenants = allTenantsData?.allTenants?.items?.find((t: { slug: string }) => t.slug === tenantSlug);
  const effectiveTenantData = tenantData?.tenant || tenantFromAllTenants;
  
  const tenantFeatures: FeatureType[] = effectiveTenantData?.features 
    ? (Array.isArray(effectiveTenantData.features) 
        ? effectiveTenantData.features as FeatureType[]
        : [effectiveTenantData.features as FeatureType])
    : ['CMS_ENGINE']; // Only CMS_ENGINE as default, not all features

  // Debug logging for feature access
  console.log('=== TENANT FEATURES DEBUG ===');
  console.log('Tenant slug:', tenantSlug);
  console.log('Is SuperAdmin:', isSuperAdmin);
  console.log('Current user tenant:', currentUserTenant);
  console.log('Target tenant ID:', targetTenantId);
  console.log('Tenant data from relationship:', tenantData?.tenant);
  console.log('Tenant data from all tenants query:', tenantFromAllTenants);
  console.log('Effective tenant data:', effectiveTenantData);
  console.log('Final tenant features:', tenantFeatures);
  console.log('=============================');

  return (
    <FeatureProvider features={tenantFeatures} isLoading={isLoading || userLoading}>
      <div className="min-h-screen bg-gray-50 flex">
        {/* Tenant-specific Sidebar */}
        <TenantDashboard />
        
        {/* Main content area */}
        <div className="flex-1 lg:ml-0">
          {children}
        </div>
      </div>
    </FeatureProvider>
  );
}