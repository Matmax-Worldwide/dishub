'use client';

import { useEffect, useState, ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter, useParams } from 'next/navigation';

interface AuthenticationGuardProps {
  children: ReactNode;
  redirectTo?: string;
}

const AuthenticationGuard = ({ children, redirectTo = '/login' }: AuthenticationGuardProps) => {
  const { isAuthenticated, isLoading } = useAuth();
  const [isChecking, setIsChecking] = useState(true);
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string || 'en';

  useEffect(() => {
    // Only check once auth loading is complete
    if (!isLoading) {
      if (!isAuthenticated) {
        // Redirect to login page with the current locale
        const localizedRedirect = `/${locale}${redirectTo}`;
        router.replace(localizedRedirect);
      }
      setIsChecking(false);
    }
  }, [isAuthenticated, isLoading, router, redirectTo, locale]);

  // While we're checking authentication or loading, show a loading state
  if (isLoading || isChecking) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="bg-white p-8 rounded-lg shadow-md">
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
            <p className="text-gray-600">Verificando autenticación...</p>
          </div>
        </div>
      </div>
    );
  }

  // If the user is authenticated, render the children
  return isAuthenticated ? <>{children}</> : null;
};

export default AuthenticationGuard; 