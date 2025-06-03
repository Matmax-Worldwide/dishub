'use client';

import { useParams, useRouter } from 'next/navigation';
import { useQuery, gql } from '@apollo/client';
import { client } from '@/lib/apollo-client';
import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import SuperAdminDashboard from './super-admin-dashboard';

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

const GET_TENANT = gql`
  query GetTenant($tenantId: String!) {
    tenant(id: $tenantId) {
      id
      name
      slug
    }
  }
`;

export default function AdminPage() {
  const router = useRouter();
  const { locale } = useParams();
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [debugInfo, setDebugInfo] = useState<{
    error?: string;
    graphQLErrors?: string[];
    networkError?: string;
  } | null>(null);

  const { loading: userLoading, error: userError, data: userData } = useQuery(GET_USER, {
    client,
    onError: (error) => {
      console.error('GraphQL Error:', error);
      setDebugInfo({
        error: error.message,
        graphQLErrors: error.graphQLErrors?.map(e => e.message),
        networkError: error.networkError?.message,
      });
      
      // If authentication error, redirect to login
      if (error.message.includes('Invalid token') || error.message.includes('Not authenticated')) {
        console.log('Authentication error detected, redirecting to login');
        localStorage.removeItem('token');
        router.replace(`/${locale}/login`);
      }
    },
    fetchPolicy: 'network-only',
  });

  const { loading: tenantLoading, data: tenantData } = useQuery(GET_TENANT, {
    client,
    variables: { tenantId: userData?.me?.tenantId || '' },
    skip: !userData?.me?.tenantId,
    fetchPolicy: 'network-only',
  });

  useEffect(() => {
    if (userLoading || tenantLoading || isRedirecting) return;
    
    if (userData?.me) {
      const user = userData.me;
      const userRole = user.role?.name;
      
      console.log('User role detected:', userRole);
      console.log('User tenant ID:', user.tenantId);
      
      // SUPER_ADMIN stays in this dashboard
      if (userRole === 'SUPER_ADMIN') {
        console.log('SUPER_ADMIN detected, staying in admin dashboard');
        return; // Stay on this page to show SuperAdminDashboard
      }
      
      // Other roles need to be redirected to tenant-specific admin
      if (['ADMIN', 'MANAGER', 'EMPLOYEE'].includes(userRole)) {
        setIsRedirecting(true);
        
        if (user.tenantId && tenantData?.tenant?.slug) {
          const tenantSlug = tenantData.tenant.slug;
          console.log(`Redirecting ${userRole} to tenant admin:`, `/${locale}/tenants/${tenantSlug}/admin`);
          router.replace(`/${locale}/tenants/${tenantSlug}/admin`);
        } else if (user.tenantId) {
          // If we have tenantId but no slug yet, wait for tenant query
          if (!tenantLoading) {
            console.error('Tenant not found for ID:', user.tenantId);
            router.replace(`/${locale}/access-denied`);
          }
        } else {
          console.error('User has no tenantId, redirecting to access denied');
          router.replace(`/${locale}/access-denied`);
        }
      } else {
        // Unknown role
        console.error('Unknown role:', userRole);
        router.replace(`/${locale}/access-denied`);
      }
    }
  }, [userData, tenantData, userLoading, tenantLoading, router, locale, isRedirecting]);

  // Handle loading states
  if (userLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto" />
          <p className="text-muted-foreground">Verificando autenticación...</p>
        </div>
      </div>
    );
  }

  if (userError) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4 max-w-md">
          <div className="text-red-600">
            <h2 className="text-xl font-semibold mb-2">Error de Autenticación</h2>
            <p className="text-sm">{userError.message}</p>
          </div>
          {debugInfo && (
            <details className="text-left text-xs bg-gray-100 p-4 rounded">
              <summary className="cursor-pointer font-medium mb-2">Información de Debug</summary>
              <pre className="whitespace-pre-wrap">{JSON.stringify(debugInfo, null, 2)}</pre>
            </details>
          )}
          <button
            onClick={() => router.push(`/${locale}/login`)}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Ir a Login
          </button>
        </div>
      </div>
    );
  }

  if (tenantLoading && userData?.me?.tenantId) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto" />
          <p className="text-muted-foreground">Cargando información del tenant...</p>
        </div>
      </div>
    );
  }

  if (isRedirecting) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto" />
          <p className="text-muted-foreground">Redirigiendo...</p>
        </div>
      </div>
    );
  }

  // Only SUPER_ADMIN should reach this point
  if (userData?.me?.role?.name === 'SUPER_ADMIN') {
    return <SuperAdminDashboard />;
  }

  // Fallback - should not normally reach here
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center space-y-4">
        <h2 className="text-xl font-semibold">Acceso No Autorizado</h2>
        <p className="text-muted-foreground">No tienes permisos para acceder a esta página.</p>
        <button
          onClick={() => router.push(`/${locale}/login`)}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Ir a Login
        </button>
      </div>
    </div>
  );
} 