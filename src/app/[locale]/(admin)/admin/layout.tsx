'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { gql, useQuery } from '@apollo/client';
import { client } from '@/lib/apollo-client';
import { DashboardSidebar } from '@/components/Navigation/dashboardSidebar/DashboardSidebar';
import PermissionGuard from '@/components/PermissionGuard';
import { FeatureProvider } from '@/hooks/useFeatureAccess';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { ShieldIcon, ArrowLeftIcon } from 'lucide-react';

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
  query GetTenantFeatures($tenantId: String!) {
    tenant(id: $tenantId) {
      id
      name
      features
    }
  }
`;

export default function AdminLayout({
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
  const tenantFeatures = tenantData?.tenant?.features || ['CMS_ENGINE'];
  const tenantId = userData?.me?.tenantId || null;

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

  // Componente de acceso denegado
  const AccessDenied = () => (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="max-w-md w-full p-8 bg-white rounded-lg shadow-lg">
        <Alert variant="destructive" className="mb-6">
          <ShieldIcon className="h-5 w-5 mr-2" />
          <AlertTitle>Acceso denegado</AlertTitle>
          <AlertDescription>
            No tienes los permisos necesarios para acceder a esta sección.
          </AlertDescription>
        </Alert>
        <p className="text-gray-600 mb-6">
          Esta área está reservada para usuarios con permisos de administración. 
          Si crees que deberías tener acceso, contacta al administrador del sistema.
        </p>
        <Button 
          className="w-full flex items-center justify-center gap-2"
          onClick={() => router.push(`/${locale}/evoque/dashboard`)}
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Volver al dashboard
        </Button>
      </div>
    </div>
  );

  return (
    <>
      {/* Debug information */}
        {/* {process.env.NODE_ENV !== 'production' && userData?.me && (
          <div className="fixed top-2 right-2 z-50 p-4 bg-black bg-opacity-80 text-white rounded-lg max-w-md text-xs">
            <h4 className="font-bold mb-1">Debug Info:</h4>
            <p>User: {userData.me.firstName} {userData.me.lastName}</p>
            <p>Email: {userData.me.email}</p>
            <p>Role: {userData.me.role?.name || 'No role'}</p>
            <p>Role ID: {userData.me.role?.id || 'No role ID'}</p>
            <button 
              onClick={() => router.push(`/${locale}/evoque/dashboard`)}
              className="mt-2 px-2 py-1 bg-blue-500 text-white rounded text-xs"
            >
              Back to Dashboard
            </button>
          </div>
        )} */}

      {/* Solución temporal: Optar por no usar PermissionGuard para administradores */}
      {userData?.me?.role?.name === 'ADMIN' ? (
        <FeatureProvider tenantFeatures={tenantFeatures} tenantId={tenantId}>
          <div className="flex min-h-screen bg-gray-50">
            <DashboardSidebar />
            <div className="lg:pl-64 flex flex-col flex-1">
              {process.env.NODE_ENV !== 'production' && (
                <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-4">
                  <p className="font-bold">Administrador verificado directamente</p>
                  <p className="text-sm">
                    Estás accediendo con rol de administrador. Verificación de permisos omitida temporalmente.
                  </p>
                  <p className="text-xs mt-2">
                    Tenant Features: {tenantFeatures.join(', ')}
                  </p>
                </div>
              )}
              <main className="flex-1">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                  {children}
                </div>
              </main>
            </div>
          </div>
        </FeatureProvider>
      ) : (
        <PermissionGuard
          permissions={['admin:view']}
          role="ADMIN"
          fallback={<AccessDenied />}
        >
          <FeatureProvider tenantFeatures={tenantFeatures} tenantId={tenantId}>
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
          </FeatureProvider>
        </PermissionGuard>
      )}
    </>
  );
} 