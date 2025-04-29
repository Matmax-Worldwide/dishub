'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { gql, useQuery } from '@apollo/client';
import { client } from '@/app/lib/apollo-client';
import { DashboardSidebar } from '@/components/DashboardSidebar';

const GET_USER = gql`
  query GetUser {
    me {
      id
      email
      firstName
      lastName
      role
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

  const { data, loading } = useQuery(GET_USER, {
    client,
    fetchPolicy: 'network-only',
    onCompleted: (data) => {
      // Check if user is admin
      if (data?.me?.role !== 'ADMIN') {
        console.log('User is not admin, redirecting to dashboard');
        router.push(`/${locale}/dashboard`);
      }
      setIsLoading(false);
    },
    onError: () => {
      // Redirect to login on error
      console.log('Authentication error, redirecting to login');
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

  // If we got here and user is not admin, we're still loading or redirecting
  if (data?.me?.role !== 'ADMIN') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-2xl font-medium text-gray-700">Access restricted...</div>
      </div>
    );
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