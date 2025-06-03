'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { gql, useQuery } from '@apollo/client';
import { client } from '@/lib/apollo-client';
import { FeatureProvider } from '@/hooks/useFeatureAccess';
import { DashboardSidebar } from '@/components/Navigation/dashboardSidebar/DashboardSidebar';
import { 
  SidebarProvider,
} from '@/components/ui/sidebar';

const GET_USER = gql`
  query GetMe {
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
      slug
      features
    }
  }
`;

export default function TenantAdminLayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const { locale, tenantSlug } = useParams();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  const { loading, data: userData } = useQuery(GET_USER, {
    client,
    fetchPolicy: 'network-only',
    errorPolicy: 'all'
  });

  const { 
    loading: featuresLoading, 
    data: tenantData 
  } = useQuery(GET_TENANT_FEATURES, {
    variables: { tenantId: userData?.me?.tenantId },
    skip: !userData?.me?.tenantId,
    client,
    errorPolicy: 'all'
  });

  // Security check: Verify the tenant slug matches the user's tenant
  useEffect(() => {
    if (!loading && !featuresLoading && userData && tenantData) {
      const userRole = userData.me?.role?.name;
      const userTenantId = userData.me?.tenantId;
      const tenantFromQuery = tenantData.tenant;

      console.log('Layout security check:', {
        userRole,
        userTenantId,
        tenantSlug,
        tenantFromQuery: tenantFromQuery?.slug
      });

      // Allow SUPER_ADMIN to access any tenant
      if (userRole === 'SUPER_ADMIN') {
        console.log('SUPER_ADMIN access granted');
        setIsLoading(false);
        return;
      }

      // For other roles, validate tenant access
      if (!userTenantId || !tenantFromQuery) {
        console.warn('No tenant data available');
        router.push(`/${locale}/access-denied`);
        return;
      }

      // Check if the tenant slug in URL matches the tenant from database
      if (tenantFromQuery.slug !== tenantSlug) {
        console.warn('Tenant slug mismatch:', {
          urlSlug: tenantSlug,
          dbSlug: tenantFromQuery.slug
        });
        router.push(`/${locale}/access-denied`);
        return;
      }

      // Check if user has appropriate role
      if (!['ADMIN', 'MANAGER'].includes(userRole)) {
        console.warn('Insufficient permissions:', userRole);
        router.push(`/${locale}/access-denied`);
        return;
      }

      setIsLoading(false);
    }
  }, [loading, featuresLoading, userData, tenantData, tenantSlug, locale, router]);

  // Show loading while we verify access
  if (loading || featuresLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  // Don't render anything if we don't have proper data
  if (!userData?.me || (!tenantData?.tenant && userData.me.role?.name !== 'SUPER_ADMIN')) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
          <p className="text-gray-600">Unable to load tenant information.</p>
        </div>
      </div>
    );
  }

  return (
    <FeatureProvider features={tenantData?.tenant?.features || []}>
      <SidebarProvider defaultCollapsed={false}>
        <div className="flex h-screen bg-gray-50">
          {/* Sidebar - Always visible on left */}
          <DashboardSidebar />
          
          {/* Main content area */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Header bar */}
            <header className="bg-white border-b border-gray-200 px-6 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-semibold text-gray-900">
                    {tenantData?.tenant?.name || 'Tenant Admin'}
                  </h1>
                  <p className="text-sm text-gray-600">
                    Admin Dashboard • {userData.me.role?.name}
                  </p>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">
                      {userData.me.firstName} {userData.me.lastName}
                    </p>
                    <p className="text-xs text-gray-500">{userData.me.email}</p>
                  </div>
                </div>
              </div>
            </header>
            
            {/* Main content */}
            <main className="flex-1 overflow-auto">
              <div className="container mx-auto px-6 py-8">
                {children}
              </div>
            </main>
          </div>
        </div>
      </SidebarProvider>
    </FeatureProvider>
  );
} 