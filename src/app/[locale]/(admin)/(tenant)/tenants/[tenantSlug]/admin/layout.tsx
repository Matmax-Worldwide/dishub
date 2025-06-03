'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { gql, useQuery } from '@apollo/client';
import { client } from '@/lib/apollo-client';
import { FeatureProvider, FeatureType } from '@/hooks/useFeatureAccess';
import { DashboardSidebar } from '@/components/Navigation/dashboardSidebar/DashboardSidebar';

const GET_USER = gql`
  query GetUser {
    me {
      id
      email
      firstName
      lastName
      tenantId
      role {
        id
        name
        description
      }
    }
  }
`;

const GET_TENANT_FEATURES = gql`
  query GetTenantFeatures($tenantId: ID!) {
    tenant(id: $tenantId) {
      id
      name
      features
    }
  }
`;

export default function TenantAdminLayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const { locale } = useParams();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  const { loading, data: userData } = useQuery(GET_USER, {
    client,
    fetchPolicy: 'network-only',
    errorPolicy: 'all',
    notifyOnNetworkStatusChange: true,
    context: {
      headers: {
        credentials: 'include'
      }
    },
    onCompleted: (data) => {
      console.log('User data loaded:', data);
      setIsLoading(false);
    },
    onError: (error) => {
      // Redirect to login on error
      console.error('Authentication error:', error);
      router.push(`/${locale}/login`);
    }
  });

  // Get tenant features
  const { data: tenantData } = useQuery(GET_TENANT_FEATURES, {
    client,
    variables: { tenantId: userData?.me?.tenantId || '' },
    skip: !userData?.me?.tenantId,
    errorPolicy: 'all',
    fetchPolicy: 'cache-first',
    onCompleted: (tenantData) => {
      console.log('Tenant features loaded:', tenantData?.tenant?.features);
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

  if (loading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading tenant admin...</p>
        </div>
      </div>
    );
  }

  if (!userData?.me) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600 mb-4">Access denied</p>
          <button 
            onClick={() => router.push(`/${locale}/login`)}
            className="px-4 py-2 bg-blue-500 text-white rounded"
          >
            Go to Login
          </button>
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