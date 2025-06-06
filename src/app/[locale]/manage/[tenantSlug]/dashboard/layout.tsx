'use client';

import { ReactNode, useState } from 'react';
import { DashboardSidebar } from '@/components/Navigation/dashboardSidebar/DashboardSidebar';
import { FeatureProvider, FeatureType } from '@/hooks/useFeatureAccess';
import { useQuery, gql } from '@apollo/client';

// GraphQL query to get current user
const GET_USER_DATA = gql`
  query GetUserData {
    me {
      id
      tenantId
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

  // Get tenant features based on user's tenantId
  const { data: tenantData } = useQuery(GET_TENANT_FEATURES, {
    variables: { tenantId: userData?.me?.tenantId || '' },
    skip: !userData?.me?.tenantId,
    onCompleted: (data) => {
      console.log('Tenant features loaded:', data?.tenant?.features);
    },
    onError: (error) => {
      console.error('Error loading tenant features:', error);
    }
  });

  // Parse tenant features - provide defaults for tenant dashboard
  const tenantFeatures: FeatureType[] = tenantData?.tenant?.features 
    ? (Array.isArray(tenantData.tenant.features) 
        ? tenantData.tenant.features as FeatureType[]
        : [tenantData.tenant.features as FeatureType])
    : ['CMS_ENGINE', 'BLOG_MODULE', 'FORMS_MODULE', 'BOOKING_ENGINE', 'ECOMMERCE_ENGINE']; // Default features for tenant

  return (
    <FeatureProvider features={tenantFeatures} isLoading={isLoading || userLoading}>
      <div className="min-h-screen bg-gray-50 flex">
        {/* Sidebar */}
        <DashboardSidebar />
        
        {/* Main content area */}
        <div className="flex-1 lg:ml-0">
          {children}
        </div>
      </div>
    </FeatureProvider>
  );
}