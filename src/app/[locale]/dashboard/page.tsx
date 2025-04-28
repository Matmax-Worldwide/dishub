'use client';

import { useParams } from 'next/navigation';
import { useQuery, gql } from '@apollo/client';
import { client } from '@/app/lib/apollo-client';
import { useEffect } from 'react';

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

export default function DashboardPage() {
  const { locale } = useParams();
  const { loading, error, data } = useQuery(GET_USER, {
    client,
    onError: (error) => {
      console.error('GraphQL Error:', error);
      console.error('Error details:', error.graphQLErrors);
      console.error('Network error:', error.networkError);
      console.error('Error stack:', error.stack);
      console.error('Error message:', error.message);
    },
    onCompleted: (data) => {
      console.log('Query completed successfully');
      console.log('Response data:', data);
      console.log('User data:', data?.me);
    },
    fetchPolicy: 'network-only',
    notifyOnNetworkStatusChange: true,
  });

  useEffect(() => {
    console.log('Query status:', {
      loading,
      error: error?.message,
      data: data?.me,
    });
  }, [loading, error, data]);

  const handleLogout = async () => {
    try {
      document.cookie = 'session-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      window.location.href = `/${locale}/login`;
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  if (error) {
    console.error('Dashboard Error:', error);
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-red-600">
          Error loading user data: {error.message}
          <div className="mt-4 text-sm">
            Please try logging in again or contact support if the problem persists.
          </div>
        </div>
      </div>
    );
  }

  const user = data?.me;
  console.log('User data:', user);

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-start pt-6 sm:pt-10 md:pt-12">
      <div className="w-full max-w-full sm:max-w-2xl md:max-w-3xl lg:max-w-4xl px-2 sm:px-4 md:px-6">
        <div className="bg-white shadow rounded-lg p-4 sm:p-6 md:p-8">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Dashboard</h1>
            <button
              onClick={handleLogout}
              className="mt-4 sm:mt-0 px-4 sm:px-6 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
            >
              Logout
            </button>
          </div>

          {user && (
            <div className="space-y-4 sm:space-y-6">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-2 sm:mb-4">User Information</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-gray-500">Name</p>
                  <p className="mt-1 text-base sm:text-lg text-gray-900 font-semibold">{`${user.firstName} ${user.lastName}`}</p>
                </div>
                <div>
                  <p className="text-xs sm:text-sm font-medium text-gray-500">Email</p>
                  <p className="mt-1 text-base sm:text-lg text-gray-900 font-semibold break-all">{user.email}</p>
                </div>
                <div>
                  <p className="text-xs sm:text-sm font-medium text-gray-500">Role</p>
                  <p className="mt-1 text-base sm:text-lg text-gray-900 font-semibold uppercase">{user.role}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 