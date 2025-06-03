'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { ShieldXIcon } from 'lucide-react';

// Force dynamic rendering to prevent prerendering issues
export const dynamic = 'force-dynamic';

export default function AccessDeniedPage() {
  const { locale } = useParams();
  const { user, isAuthenticated } = useAuth();
  const [redirectPath, setRedirectPath] = useState('/evoque/dashboard');

  useEffect(() => {
    // Establecer la página a donde redirigir según el rol del usuario
    if (isAuthenticated && user) {
      if (user.role.name === 'ADMIN') {
        setRedirectPath(`/${locale}/admin`);
      } else {
        setRedirectPath(`/${locale}/evoque/dashboard`);
      }
    } else {
      setRedirectPath(`/${locale}/login`);
    }
  }, [isAuthenticated, user, locale]);

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
            {isAuthenticated 
              ? `Iniciaste sesión como ${user?.name || user?.email} con el rol ${user?.role?.name || 'Usuario'}.`
              : 'No has iniciado sesión.'}
          </p>
          
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