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
  const [selectedBenefit, setSelectedBenefit] = useState<string | null>(null);

  
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
              <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-2 sm:mb-4">Beneficios E-Voque</h2>
              <div className="flex gap-4 mb-8 justify-center flex-wrap">
                {/* Beneficios E-Voque */}
  {/* Beneficios E-Voque */}
  <button
    className={`relative overflow-hidden flex flex-col items-center justify-end w-60 h-24 rounded-lg bg-contain bg-center transition-all duration-300 ${
      selectedBenefit === 'benefits' 
        ? 'ring-4 ring-blue-500' 
        : 'opacity-80 hover:opacity-100'
    }`}
    style={{
      backgroundImage: "url('/images/evoque-benefits.png')",
    }}
    onClick={() => setSelectedBenefit(selectedBenefit === 'benefits' ? null : 'benefits')}
  >
    <div className="absolute inset-0 bg-black/30" />
    <span className="relative text-xs font-semibold text-white mb-2 px-2 py-1 rounded-full bg-black/50">
      Beneficios
    </span>
  </button>

  {/* Wellness */}
  <button
    className={`relative overflow-hidden flex flex-col items-center justify-end w-40 h-24 rounded-lg bg-green-200 transition-all duration-300 ${
      selectedBenefit === 'wellness' 
        ? 'ring-4 ring-green-500' 
        : 'opacity-80 hover:opacity-100'
    }`}
    style={{
      backgroundImage: "url('/images/wellness-background.png')", // O puedes poner otro fondo si tienes
      backgroundSize: 'cover',
      backgroundPosition: 'center',
    }}
    onClick={() => setSelectedBenefit(selectedBenefit === 'wellness' ? null : 'wellness')}
  >
    <div className="absolute inset-0 bg-black/20" />
    <span className="relative text-xs font-semibold text-white mb-2 px-2 py-1 rounded-full bg-black/50">
      Wellness
    </span>
  </button>

  {/* Círculo Extra (Próximamente) */}
  <div className="flex flex-col items-center justify-center w-40 h-24 rounded-lg bg-gray-100 text-gray-400 cursor-not-allowed">
    <span className="text-xs font-medium text-center">Próximamente</span>
  </div>
</div>
              
              {/* Iframe container */}
              {selectedBenefit && (
  <div className="mt-6 w-full">
    <div className="bg-gray-50 p-3 mb-3 flex justify-between items-center rounded-t-lg border border-gray-200">
      <a
        href={selectedBenefit === 'benefits' ? 'https://pe.e-voquebenefit.com/' : 'https://wellness.e-voque.com/'}
        target="_blank"
        rel="noopener noreferrer"
        className="text-lg font-medium text-blue-600 hover:underline"
      >
        {selectedBenefit === 'benefits' ? 'E-Voque Beneficios' : 'E-Voque Wellness'}
      </a>
      <button 
        onClick={() => setSelectedBenefit(null)}
        className="text-gray-500 hover:text-gray-700"
      >
        ✕
      </button>
    </div>

    <div className="text-center p-8 bg-white border border-gray-200 rounded-b-lg">
      <p className="text-gray-600 text-lg">
        Abre la plataforma en una nueva pestaña:
      </p>
      <a
        href={selectedBenefit === 'benefits' ? 'https://pe.e-voquebenefit.com/' : 'https://wellness.e-voque.com/'}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-block mt-4 px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
      >
        Ir a {selectedBenefit === 'benefits' ? 'E-Voque Beneficios' : 'E-Voque Wellness'}
      </a>
    </div>
  </div>
)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 