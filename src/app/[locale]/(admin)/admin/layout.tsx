'use client';

import { useEffect, useState } from 'react';
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

export default function AdminLayoutWrapper({
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

  // Extract tenant features with default fallback
  const tenantFeatures = (tenantData?.tenant?.features || ['CMS_ENGINE']) as FeatureType[];

  useEffect(() => {
    // Check for session token
    const hasToken = document.cookie.includes('session-token=');
    if (!hasToken) {
      console.log('No session token, redirecting to login');
      router.push(`/${locale}/login`);
    }
  }, [locale, router]);

  if (isLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-2xl font-medium text-gray-700">Loading...</div>
      </div>
    );
  }

  return (
    <FeatureProvider features={tenantFeatures} isLoading={loading}>
      <div className="min-h-screen bg-gray-50">
        {/* Debug info */}
        <div className="bg-blue-50 p-2 text-xs text-blue-600 border-b">
          <strong>Debug:</strong> User: {userData?.me?.email || 'Not loaded'} | 
          Role: {userData?.me?.role?.name || 'Unknown'} | 
          Tenant: {tenantData?.tenant?.name || 'Not loaded'} |
          Features: {JSON.stringify(tenantFeatures)}
        </div>
        
        <div className="flex min-h-screen bg-gray-50">
          <DashboardSidebar />
          <div className="lg:pl-64 flex flex-col flex-1">
            <main className="flex-1">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                {children}
              </div>
            </main>
          </div>
        </div>
      </div>
    </FeatureProvider>
  );
} 