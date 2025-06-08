'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { createAuthHeaders, getSessionToken } from '@/lib/auth-header';

/**
 * Test component to verify authorization header functionality
 * This component can be temporarily added to any page to test auth
 */
export function AuthTest() {
  const { user, isAuthenticated } = useAuth();
  const [testResult, setTestResult] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const testAuthHeader = async () => {
    setLoading(true);
    setTestResult('Testing...');

    try {
      // Test 1: Check if session token exists in cookies
      const sessionToken = getSessionToken();
      console.log('Session token from cookies:', sessionToken ? 'Found' : 'Not found');

      // Test 2: Check authentication status
      console.log('Is authenticated:', isAuthenticated);

      // Test 3: Test GraphQL query with authorization
      const headers = createAuthHeaders();
      console.log('Generated headers:', headers);

      const response = await fetch('/api/graphql', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          query: `
            query Me {
              me {
                id
                email
                firstName
                lastName
                role {
                  id
                  name
                }
              }
            }
          `,
        }),
      });

      const result = await response.json();
      console.log('GraphQL response:', result);

      if (result.errors) {
        setTestResult(`❌ GraphQL Error: ${result.errors[0].message}`);
      } else if (result.data?.me) {
        setTestResult(`✅ Success! User: ${result.data.me.email} (${result.data.me.role.name})`);
      } else {
        setTestResult('❓ Unexpected response format');
      }
    } catch (error) {
      console.error('Auth test error:', error);
      setTestResult(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="p-4 bg-yellow-100 border border-yellow-400 rounded">
        <h3 className="font-bold text-yellow-800">Auth Test</h3>
        <p className="text-yellow-700">User not authenticated. Please log in first.</p>
      </div>
    );
  }

  return (
    <div className="p-4 bg-blue-100 border border-blue-400 rounded">
      <h3 className="font-bold text-blue-800 mb-2">Authorization Header Test</h3>
      <div className="space-y-2 text-sm">
        <p><strong>User:</strong> {user?.email}</p>
        <p><strong>Role:</strong> {user?.role?.name}</p>
          <p><strong>Session Cookie:</strong> {getSessionToken() ? '✅' : '❌'}</p>
      </div>
      
      <button
        onClick={testAuthHeader}
        disabled={loading}
        className="mt-3 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? 'Testing...' : 'Test GraphQL Auth'}
      </button>
      
      {testResult && (
        <div className="mt-3 p-2 bg-white border rounded">
          <strong>Result:</strong> {testResult}
        </div>
      )}
    </div>
  );
} 