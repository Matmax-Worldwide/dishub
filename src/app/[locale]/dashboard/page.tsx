'use client';

import { useParams } from 'next/navigation';
import { useQuery, gql } from '@apollo/client';
import { client } from '@/app/lib/apollo-client';
import { useEffect, useState } from 'react';

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
  const [isLoggedOut, setIsLoggedOut] = useState(false);
  const [debugInfo, setDebugInfo] = useState<{
    error?: string;
    graphQLErrors?: string[];
    networkError?: string;
    stack?: string;
  } | null>(null);
  
  const { loading, error, data, refetch } = useQuery(GET_USER, {
    client,
    onError: (error) => {
      console.error('GraphQL Error:', error);
      console.error('Error details:', error.graphQLErrors);
      console.error('Network error:', error.networkError);
      
      // Show debug info to help troubleshoot
      setDebugInfo({
        error: error.message,
        graphQLErrors: error.graphQLErrors?.map(e => e.message),
        networkError: error.networkError?.message,
        stack: error.stack
      });
      
      // If the error is related to an invalid token, clear the token and redirect to login
      if (error.message.includes('Invalid token') || error.message.includes('Not authenticated')) {
        console.log('Authentication error detected, redirecting to login');
        handleLogout();
      }
    },
    onCompleted: (data) => {
      console.log('User query completed successfully');
      console.log('User data:', data?.me);
      
      // If we have valid user data, we're logged in
      if (data?.me) {
        console.log('User is logged in:', data.me.email, 'with role:', data.me.role);
        setDebugInfo(null); // Clear debug info
      }
    },
    fetchPolicy: 'network-only',
    notifyOnNetworkStatusChange: true,
  });

  // Check for cookie on component mount and when needed
  useEffect(() => {
    const checkLoginStatus = () => {
      const cookies = document.cookie;
      const hasToken = cookies.includes('session-token=');
      console.log('Session token present in cookies:', hasToken);
      console.log('All cookies:', cookies);
      
      if (!hasToken && !isLoggedOut) {
        console.log('No session token detected, redirecting to login');
        window.location.href = `/${locale}/login`;
      }
      
      // If the token exists but we got an error, let's retry the query once
      if (hasToken && error && !isLoggedOut) {
        console.log('Token exists but query failed, retrying...');
        setTimeout(() => refetch(), 1000);
      }
    };
    
    checkLoginStatus();
  }, [locale, error, isLoggedOut, refetch]);

  useEffect(() => {
    console.log('Query status:', {
      loading,
      error: error?.message,
      data: data?.me,
    });
    
    // If we have an authentication error, redirect to login
    if (error && (error.message.includes('Invalid token') || error.message.includes('Not authenticated'))) {
      handleLogout();
    }
  }, [loading, error, data]);

  const handleLogout = async () => {
    try {
      setIsLoggedOut(true);
      console.log('Logging out user - clearing session token');
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
    
    // Display debug info instead of redirecting
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="max-w-2xl text-xl text-red-600">
          <h1 className="text-2xl mb-4">Error loading user data</h1>
          <p className="mb-2">{error.message}</p>
          
          {debugInfo && (
            <div className="mt-4 p-4 bg-gray-100 rounded text-sm text-left">
              <h2 className="text-lg mb-2">Debug Information:</h2>
              <pre className="overflow-auto max-h-80">
                {JSON.stringify(debugInfo, null, 2)}
              </pre>
              <p className="mt-4 text-gray-700">
                Please try logging in again or contact support with this information.
              </p>
            </div>
          )}
          
          <div className="mt-6 flex space-x-4">
            <button 
              onClick={handleLogout}
              className="px-4 py-2 bg-blue-600 text-white rounded"
            >
              Go to Login
            </button>
            <button 
              onClick={() => refetch()}
              className="px-4 py-2 bg-gray-600 text-white rounded"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  const user = data?.me;
  console.log('Rendering dashboard with user data:', user);

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