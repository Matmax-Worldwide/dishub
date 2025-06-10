'use client';

import React, { useState, useMemo } from 'react';
import { usePathname, useParams } from 'next/navigation';
import EngineSidebar from '@/components/engines/EngineSidebar';
import { UnsavedChangesProvider } from '@/contexts/UnsavedChangesContext';
import { FeatureProvider, FeatureType } from '@/hooks/useFeatureAccess';
import { useQuery, gql } from '@apollo/client';

// GraphQL queries (same as dashboard layout)
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

const GET_TENANT_FEATURES = gql`
  query GetTenantFeatures($tenantId: ID!) {
    tenant(id: $tenantId) {
      id
      features
    }
  }
`;

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

interface EnginesLayoutProps {
  children: React.ReactNode;
}

export default function EnginesLayout({ children }: EnginesLayoutProps) {
  const [isLoading, setIsLoading] = useState(true);
  const pathname = usePathname();
  const params = useParams();
  const tenantSlug = params.tenantSlug as string;
  
  // Extract current engine from pathname
  // pathname format: /[locale]/[tenantSlug]/[engine]/...
  const pathSegments = pathname.split('/').filter(Boolean);
  const currentEngine = pathSegments[2]; // [locale, tenantSlug, engine, ...]

  // Get user data first (same logic as dashboard layout)
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
      console.log('Tenant features loaded for tenant (engines):', tenantSlug, data?.tenant?.features);
    },
    onError: (error) => {
      console.error('Error loading tenant features (engines):', error);
    }
  });

  // For SuperAdmin without direct tenant relationship, get all tenants and find by slug
  const { data: allTenantsData } = useQuery(GET_ALL_TENANTS, {
    skip: !isSuperAdmin || !!targetTenantId || !tenantSlug,
    onCompleted: (data) => {
      const targetTenant = data?.allTenants?.items?.find((t: { slug: string }) => t.slug === tenantSlug);
      console.log('Tenant found for SuperAdmin (engines):', tenantSlug, targetTenant?.features);
    },
    onError: (error) => {
      console.error('Error loading tenants for SuperAdmin (engines):', error);
    }
  });

  // Parse tenant features - Use actual tenant features, not all possible features
  const tenantFromAllTenants = allTenantsData?.allTenants?.items?.find((t: { slug: string }) => t.slug === tenantSlug);
  const effectiveTenantData = tenantData?.tenant || tenantFromAllTenants;
  
  const tenantFeatures: FeatureType[] = effectiveTenantData?.features 
    ? (Array.isArray(effectiveTenantData.features) 
        ? effectiveTenantData.features as FeatureType[]
        : [effectiveTenantData.features as FeatureType])
    : ['CMS_ENGINE']; // Only CMS_ENGINE as default, not all features

  // Debug logging for feature access
  console.log('=== ENGINES LAYOUT FEATURES DEBUG ===');
  console.log('Tenant slug:', tenantSlug);
  console.log('Current engine:', currentEngine);
  console.log('Is SuperAdmin:', isSuperAdmin);
  console.log('Current user tenant:', currentUserTenant);
  console.log('Target tenant ID:', targetTenantId);
  console.log('Effective tenant data:', effectiveTenantData);
  console.log('Final tenant features:', tenantFeatures);
  console.log('=====================================');

  if (!currentEngine) {
    return <div>Invalid engine route</div>;
  }

  return (
    <FeatureProvider features={tenantFeatures} isLoading={isLoading || userLoading}>
      <UnsavedChangesProvider>
        <div className="flex h-screen">
          <EngineSidebar currentEngine={currentEngine} />
          <div className="flex-1 overflow-auto">
            {children}
          </div>
        </div>
      </UnsavedChangesProvider>
    </FeatureProvider>
  );
} 