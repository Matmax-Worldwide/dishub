'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { gql, useQuery } from '@apollo/client';
import { client } from '@/app/lib/apollo-client';
import { DashboardSidebar } from '@/components/Navigation/DashboardSidebar';
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
      role {
        id
        name
        description
      }
    }
  }
`;

export default function ManagerLayout({
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
      console.error('Authentication error:', error);
      router.push(`/${locale}/login`);
    }
  });

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
            No tienes permisos de gestión para acceder a esta sección.
          </AlertDescription>
        </Alert>
        <p className="text-gray-600 mb-6">
          Esta área está reservada para gerentes y administradores. 
          Si crees que deberías tener acceso, contacta al administrador del sistema.
        </p>
        <Button 
          className="w-full flex items-center justify-center gap-2"
          onClick={() => router.push(`/${locale}/dashboard`)}
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Volver al dashboard
        </Button>
      </div>
    </div>
  );

  // Verificación directa del rol para mayor compatibilidad
  const isManager = userData?.me?.role?.name === 'MANAGER';
  const isAdmin = userData?.me?.role?.name === 'ADMIN';

  if (!isManager && !isAdmin) {
    return <AccessDenied />;
  }

  return (
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
  );
} 