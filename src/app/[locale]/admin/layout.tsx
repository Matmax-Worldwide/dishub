'use client';

import { DashboardSidebar } from '@/components/Navigation/dashboardSidebar/DashboardSidebar';
import { FeatureProvider, FeatureType } from '@/hooks/useFeatureAccess';
import { useQuery, gql } from '@apollo/client';
import { useState } from 'react';

// GraphQL query to get current user
const GET_USER_DATA = gql`
  query GetUserData {
    me {
      id
      tenantId
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

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isLoading, setIsLoading] = useState(true);

  // Get user data first
  const { data: userData, loading: userLoading, error: userError } = useQuery(GET_USER_DATA, {
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

  // Parse tenant features
  const tenantFeatures: FeatureType[] = tenantData?.tenant?.features 
    ? (Array.isArray(tenantData.tenant.features) 
        ? tenantData.tenant.features as FeatureType[]
        : [tenantData.tenant.features as FeatureType])
    : ['CMS_ENGINE']; // Default fallback

  if (userLoading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (userError || !userData?.me) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600 mb-4">Error loading user data</p>
          <p className="text-sm text-gray-600">Please try refreshing the page</p>
        </div>
      </div>
    );
  }

  return (
    <FeatureProvider features={tenantFeatures}>
      <div className="flex h-screen bg-gray-50">
        <DashboardSidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <main className="flex-1 overflow-auto p-6">
            {children}
          </main>
        </div>
      </div>
    </FeatureProvider>
  );
}
