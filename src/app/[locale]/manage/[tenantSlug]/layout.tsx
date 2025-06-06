'use client';

import { ReactNode, useState } from 'react';
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

interface TenantLayoutProps {
  children: ReactNode;
  params: Promise<{
    locale: string;
    tenantSlug: string;
  }>;
}

export default function TenantLayout({ 
  children 
}: TenantLayoutProps) {
  const [isLoading, setIsLoading] = useState(true);

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

  // Get first tenant from user's tenant relationships
  const firstTenantId = userData?.me?.userTenants?.[0]?.tenantId;
  
  // Get tenant features based on user's first tenantId
  const { data: tenantData } = useQuery(GET_TENANT_FEATURES, {
    variables: { tenantId: firstTenantId || '' },
    skip: !firstTenantId,
    onCompleted: (data) => {
      console.log('Tenant features loaded:', data?.tenant?.features);
    },
    onError: (error) => {
      console.error('Error loading tenant features:', error);
    }
  });

  // Parse tenant features - provide defaults for tenant
  const tenantFeatures: FeatureType[] = tenantData?.tenant?.features 
    ? (Array.isArray(tenantData.tenant.features) 
        ? tenantData.tenant.features as FeatureType[]
        : [tenantData.tenant.features as FeatureType])
    : ['CMS_ENGINE', 'BLOG_MODULE', 'FORMS_MODULE', 'BOOKING_ENGINE', 'ECOMMERCE_ENGINE']; // Default features for tenant

  return (
    <FeatureProvider features={tenantFeatures} isLoading={isLoading || userLoading}>
      <div className="min-h-screen bg-gray-50">
        {children}
      </div>
    </FeatureProvider>
  );
} 