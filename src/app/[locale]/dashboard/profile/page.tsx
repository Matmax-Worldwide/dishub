'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, gql } from '@apollo/client';
import { client } from '@/app/lib/apollo-client';
import Image from 'next/image';

// GraphQL queries y mutations
const GET_USER_PROFILE = gql`
  query GetUserProfile {
    me {
      id
      email
      firstName
      lastName
      phoneNumber
      role {
        id
        name
        description
      }
      createdAt
      updatedAt
    }
  }
`;

const UPDATE_USER_PROFILE = gql`
  mutation UpdateUserProfile($input: UpdateUserProfileInput!) {
    updateUserProfile(input: $input) {
      id
      firstName
      lastName
      phoneNumber
      role {
        id
        name
      }
    }
  }
`;

export default function ProfilePage() {
  
  // State
  const router = useRouter();
  const { locale } = useParams();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phoneNumber: '',
  });
  const [debugInfo, setDebugInfo] = useState<{ 
    error?: string;
    graphQLErrors?: string[];
    networkError?: string;
  } | null>(null);
  
  // Check for authentication token
  useEffect(() => {
    const cookies = document.cookie;
    const hasToken = cookies.includes('session-token=');
    console.log('Session token present in cookies:', hasToken);
    console.log('All cookies:', cookies);
    
    if (!hasToken) {
      console.log('No session token detected, redirecting to login');
      router.push(`/${locale}/login`);
    }
  }, [locale, router]);

  // Cargar datos del perfil
  const { loading, error, data, refetch } = useQuery(GET_USER_PROFILE, {
    client,
    errorPolicy: 'all',
    fetchPolicy: 'network-only',
    context: {
      headers: {
        // This ensures the authorization header is added correctly
        credentials: 'include',
      }
    },
    onCompleted: (data) => {
      console.log('Profile data loaded:', data?.me);
      if (data?.me) {
        setFormData({
          firstName: data.me.firstName || '',
          lastName: data.me.lastName || '',
          phoneNumber: data.me.phoneNumber || '',
        });
        setDebugInfo(null);
      }
    },
    onError: (error) => {
      console.error('Profile query error:', error);
      setDebugInfo({
        error: error.message,
        graphQLErrors: error.graphQLErrors?.map(e => e.message),
        networkError: error.networkError?.message,
      });
    }
  });

  // Mutation para actualizar perfil
  const [updateProfile, { loading: updating, error: updateError }] = useMutation(UPDATE_USER_PROFILE, {
    client,
    errorPolicy: 'all',
    context: {
      headers: {
        credentials: 'include',
      }
    },
    onCompleted: (data) => {
      console.log('Profile updated successfully:', data);
      setIsEditing(false);
      // Refresh profile data
      refetch();
    },
    onError: (error) => {
      console.error('Profile update error:', error);
      setDebugInfo({
        error: error.message,
        graphQLErrors: error.graphQLErrors?.map(e => e.message),
        networkError: error.networkError?.message,
      });
    }
  });

  // Manejadores
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Submitting profile update:', formData);
    updateProfile({
      variables: {
        input: { ...formData },
      },
    });
  };

  const handleRetry = () => {
    setDebugInfo(null);
    refetch({ fetchPolicy: 'network-only' });
    
    // Check for token and redirect if not found
    const cookies = document.cookie;
    const hasToken = cookies.includes('session-token=');
    if (!hasToken) {
      router.push(`/${locale}/login`);
    }
  };

  // Only show non-authentication related errors
  let errorMessage = null;
  if (error) {
    console.error('Profile error:', error);
    if (!error.message.includes('Not authenticated') && 
        !error.message.includes('non-nullable field') &&
        !error.message.includes('null for non-nullable')) {
      errorMessage = error.message;
    }
  }

  if (loading) return <div className="p-4 text-center">Loading profile...</div>;
  
  if (errorMessage || debugInfo) {
    return (
      <div className="max-w-2xl mx-auto p-4 bg-white shadow-md rounded-lg">
        <div className="p-4 text-red-600">
          <h2 className="text-xl font-bold mb-4">Error loading profile</h2>
          <p className="mb-2">{errorMessage || debugInfo?.error}</p>
          
          {debugInfo && (
            <div className="mt-4 p-4 bg-gray-100 rounded text-sm text-left">
              <h3 className="text-lg mb-2">Debug Information:</h3>
              <pre className="overflow-auto max-h-60 text-xs">
                {JSON.stringify(debugInfo, null, 2)}
              </pre>
            </div>
          )}
          
          <button 
            onClick={handleRetry}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Use empty data if not authenticated
  const user = data?.me || {
    id: '',
    firstName: '',
    lastName: '',
    email: '',
    role: {
      id: '',
      name: 'USER',
      description: null
    },
    phoneNumber: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  return (
    <div className="max-w-4xl mx-auto bg-white shadow-md rounded-lg overflow-hidden">
      <div className="bg-gray-800 text-white p-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Profile</h1>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="px-4 py-2 bg-indigo-600 rounded-md hover:bg-indigo-700 transition-colors"
          >
            {isEditing ? 'Cancel' : 'Edit Profile'}
          </button>
        </div>
      </div>

      <div className="p-6">
        <div className="flex flex-col md:flex-row gap-8">
          <div className="w-full md:w-1/3 flex flex-col items-center">
            <div className="relative w-40 h-40 rounded-full overflow-hidden border-4 border-gray-200 mb-4">
              <Image
                src={`https://ui-avatars.com/api/?name=${user.firstName}+${user.lastName}&background=0D8ABC&color=fff`}
                alt={`${user.firstName} ${user.lastName}`}
                className="w-full h-full object-cover"
                width={160}
                height={160}
              />
            </div>
            <h2 className="text-xl font-semibold text-gray-800">
              {user.firstName} {user.lastName}
            </h2>
            <p className="text-gray-600">{user.role?.name || 'USER'}</p>
            <p className="text-gray-500 text-sm mt-1">{user.email}</p>
            <p className="text-gray-500 text-sm mt-1">Member since {new Date(user.createdAt).toLocaleDateString()}</p>
          </div>

          <div className="w-full md:w-2/3">
            {isEditing ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">First Name</label>
                    <input
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Last Name</label>
                    <input
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Phone Number</label>
                  <input
                    type="text"
                    name="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                  />
                </div>

                {updateError && (
                  <div className="text-red-600 text-sm p-2 bg-red-50 rounded">
                    Error: {updateError.message}
                  </div>
                )}

                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={updating}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
                  >
                    {updating ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">Personal Information</h3>
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-6">
                    <div>
                      <p className="text-sm font-medium text-gray-500">First Name</p>
                      <p className="mt-1 text-gray-900">{user.firstName || 'Not provided'}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Last Name</p>
                      <p className="mt-1 text-gray-900">{user.lastName || 'Not provided'}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Email</p>
                      <p className="mt-1 text-gray-900">{user.email || 'Not provided'}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Phone Number</p>
                      <p className="mt-1 text-gray-900">{user.phoneNumber || 'Not provided'}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 