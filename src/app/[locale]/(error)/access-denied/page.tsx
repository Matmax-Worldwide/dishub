'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { ShieldXIcon } from 'lucide-react';
import { useQuery, gql } from '@apollo/client';

// GraphQL query para obtener la información actual del usuario
const GET_ME = gql`
  query Me {
    me {
      id
      email
      firstName
      lastName
      role {
        id
        name
        description
      }
      tenantId
    }
  }
`;

// Query separada para obtener información del tenant
const GET_TENANT = gql`
  query GetTenant($id: ID!) {
    tenant(id: $id) {
      id
      name
      slug
    }
  }
`;

// Force dynamic rendering to prevent prerendering issues
export const dynamic = 'force-dynamic';

export default function AccessDeniedPage() {
  const { locale } = useParams();
  const { isAuthenticated, token } = useAuth();
  const [redirectPath, setRedirectPath] = useState('/dashboard');

  // Obtener datos reales del usuario desde GraphQL
  const { data: userData, loading: userLoading, error } = useQuery(GET_ME, {
    skip: !isAuthenticated || !token,
    errorPolicy: 'ignore' // Ignore errors if not authenticated
  });

  const user = userData?.me;

  // Obtener información del tenant si el usuario tiene tenantId
  const { data: tenantData, loading: tenantLoading } = useQuery(GET_TENANT, {
    variables: { id: user?.tenantId },
    skip: !user?.tenantId,
    errorPolicy: 'ignore'
  });

  const tenant = tenantData?.tenant;

  useEffect(() => {
    // Establecer la página a donde redirigir según el rol real del usuario
    if (isAuthenticated && user) {
      const userRole = user.role?.name;
      console.log('Usuario actual:', user.email, 'Rol:', userRole, 'Tenant:', tenant?.slug);
      
      if (userRole === 'SUPER_ADMIN') {
        setRedirectPath(`/${locale}/admin`);
      } else if (userRole === 'ADMIN' || userRole === 'MANAGER') {
        // Para ADMIN/MANAGER, necesitamos el tenant slug
        if (tenant?.slug) {
          setRedirectPath(`/${locale}/tenants/${tenant.slug}/admin`);
        } else if (user.tenantId) {
          // Si tenemos tenantId pero no el slug aún, usar dashboard general
          setRedirectPath(`/${locale}/admin/dashboard`);
        } else {
          setRedirectPath(`/${locale}/admin/dashboard`);
        }
      } else {
        // Para usuarios regulares, usar dashboard general por ahora
        // TODO: Implementar dashboard específico por tenant
        if (tenant?.slug) {
          console.log(`Usuario pertenece a tenant ${tenant.slug}, pero usando dashboard`);
        }
        setRedirectPath(`/${locale}/admin/dashboard`);
      }
    } else if (!isAuthenticated) {
      setRedirectPath(`/${locale}/login`);
    }
  }, [isAuthenticated, user, tenant, locale]);

  // Mostrar loading mientras se obtienen los datos del usuario o tenant
  if (isAuthenticated && (userLoading || (user?.tenantId && tenantLoading))) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-6 py-8">
        <div className="w-full max-w-md space-y-8 rounded-lg bg-white p-10 shadow-md">
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-center text-gray-600">
              Verificando permisos...
            </p>
          </div>
        </div>
      </div>
    );
  }

  const userName = user?.firstName && user?.lastName 
    ? `${user.firstName} ${user.lastName}` 
    : user?.email || 'Usuario';
  const userRole = user?.role?.name || 'Sin rol';

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-6 py-8">
      <div className="w-full max-w-md space-y-8 rounded-lg bg-white p-10 shadow-md">
        <div className="flex flex-col items-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
            <ShieldXIcon className="h-8 w-8 text-red-600" />
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Acceso denegado
          </h2>
          <p className="mt-2 text-center text-gray-600">
            No tienes permisos para acceder a esta página
          </p>
        </div>

        <div className="mt-8 space-y-4">
          <p className="text-center text-sm text-gray-500">
            {isAuthenticated && user
              ? `Iniciaste sesión como ${userName} con el rol ${userRole}.`
              : isAuthenticated && !user
              ? 'Sesión activa pero no se pudieron obtener los datos del usuario.'
              : 'No has iniciado sesión.'}
          </p>
          
          {error && (
            <p className="text-center text-sm text-red-500">
              Error al obtener información del usuario. Por favor, intenta iniciar sesión nuevamente.
            </p>
          )}
          
          <div className="flex flex-col space-y-3">
            <Link
              href={redirectPath}
              className="flex w-full justify-center rounded-md border border-transparent bg-blue-600 py-2 px-4 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              {isAuthenticated ? 'Ir al dashboard' : 'Iniciar sesión'}
            </Link>
            <Link
              href={`/${locale}`}
              className="flex w-full justify-center rounded-md border border-gray-300 bg-white py-2 px-4 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
              Volver a la página principal
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
} 