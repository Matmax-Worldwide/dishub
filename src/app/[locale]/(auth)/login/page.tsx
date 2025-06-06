'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { client } from '@/lib/apollo-client';
import { setGlobalAuthorizationHeader } from '@/lib/auth-header';
import { gql } from '@apollo/client';

// GraphQL mutation for login - Fixed to request Role subfields
const LOGIN_MUTATION = gql`
  mutation Login($email: String!, $password: String!) {
    login(email: $email, password: $password) {
      token
      user {
        id
        email
        firstName
        lastName
        phoneNumber
        tenantId
        role {
          id
          name
          description
        }
        createdAt
        updatedAt
      }
    }
  }
`;

// Helper function to set a cookie with better security practices
function setCookie(name: string, value: string, days: number) {
  try {
    const expires = new Date();
    expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
    document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;SameSite=Strict`;
    return true;
  } catch (error) {
    console.error('Error setting cookie:', error);
    return false;
  }
}

export default function LoginPage() {
  const { locale } = useParams();
  const { login } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData(event.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    try {
      console.log('Sending GraphQL login mutation...');
      
      // Use Apollo Client to execute the login mutation
      const { data } = await client.mutate({
        mutation: LOGIN_MUTATION,
        variables: { email, password },
        errorPolicy: 'all'
      });

      console.log('Login response received:', data);

      if (!data?.login) {
        throw new Error('Login failed - no data returned');
      }

      const { token, user } = data.login;

      if (!token || !user) {
        throw new Error('Invalid response from server');
      }

      // Keep user data as received (role as object)
      const transformedUser = {
        ...user,
        role: user.role || { id: '', name: 'User' } // Keep role as object
      };

      console.log('=== User Role Debug ===');
      console.log('Raw user from GraphQL:', user);
      console.log('User role object:', user.role);
      console.log('User role name:', user.role?.name);
      console.log('Transformed user role (keeping as object):', transformedUser.role);
      console.log('User tenantId:', transformedUser.tenantId);
      console.log('======================');

      // Store the user and token in the auth context
      // First set the cookie
      const cookieSet = setCookie('session-token', token, 7); // 7 days expiry
      console.log('Set session-token cookie:', cookieSet ? 'Success' : 'Failed');
      
      // Set authorization header globally for immediate use
      setGlobalAuthorizationHeader(token);
      console.log('Set authorization header: Success');
      
      // Clear Apollo cache and refetch queries to use new token
      await client.clearStore();
      
      // Then update auth context
      login(transformedUser, token);
      
      // Store login success in sessionStorage (this persists across a page refresh)
      sessionStorage.setItem('justLoggedIn', 'true');
      
      // Determine redirect path based on user role
      let redirectPath = `/${locale}`; // Fallback path if tenant not found
      
      if (transformedUser.role?.name === 'SuperAdmin') {
        redirectPath = `/${locale}/super-admin/dashboard`;
      } else {
        // For all other roles (TenantAdmin, TenantManager, TenantUser, TenantEmployee, TenantUser), get tenant info
        if (transformedUser.tenantId) {
          try {
            console.log(`Fetching tenant data for tenantId: ${transformedUser.tenantId}`);
            const { data: tenantData } = await client.query({
              query: gql`
                query GetTenant($id: ID!) {
                  tenant(id: $id) {
                    id
                    slug
                    name
                  }
                }
              `,
              variables: { id: transformedUser.tenantId }
            });
            
            console.log('GraphQL Tenant Query Response:', tenantData);
            
            if (tenantData?.tenant?.slug) {
              console.log(`Tenant found: ${tenantData.tenant.name} with slug: ${tenantData.tenant.slug}`);
              
              // Store tenant information in sessionStorage for fallback usage
              sessionStorage.setItem('currentTenant', JSON.stringify({
                id: tenantData.tenant.id,
                slug: tenantData.tenant.slug,
                name: tenantData.tenant.name
              }));
              
              // Redirect based on role using actual tenant slug
              if (transformedUser.role?.name === 'TenantAdmin') {
                redirectPath = `/${locale}/tenants/${tenantData.tenant.slug}/dashboard`;
                console.log(`TenantAdmin redirect path: ${redirectPath}`);
              } else if (transformedUser.role?.name === 'TenantManager') {
                redirectPath = `/${locale}/tenants/${tenantData.tenant.slug}/dashboard`;
                console.log(`TenantManager redirect path: ${redirectPath}`);
              } else if (transformedUser.role?.name === 'TenantEmployee') {
                // TenantEmployee ahora va al mismo dashboard que TenantAdmin
                redirectPath = `/${locale}/tenants/${tenantData.tenant.slug}`;
                console.log(`TenantEmployee redirect path: ${redirectPath}`);
              } else {
                // For USER and other roles, redirect to general dashboard (por definir)
                // Log the actual tenant but use dashboard for now
                console.log(`User belongs to tenant: ${tenantData.tenant.slug}, but redirecting to dashboard`);
                sessionStorage.setItem('userTenantSlug', tenantData.tenant.slug);
                sessionStorage.setItem('userTenantName', tenantData.tenant.name);
                redirectPath = `/${locale}/admin/dashboard`;
                console.log(`User redirect path: ${redirectPath}`);
              }
              console.log(`User with role ${transformedUser.role?.name} from tenant ${tenantData.tenant.slug} redirecting to: ${redirectPath}`);
            } else {
              console.warn(`Tenant query returned but no slug found. tenantData:`, tenantData);
              console.warn(`User has tenantId ${transformedUser.tenantId} but tenant slug not found, redirecting to default`);
              redirectPath = `/${locale}/admin/dashboard`;
            }
          } catch (tenantError) { 
            console.error('GraphQL Tenant Query Error:', tenantError);
            console.error('Error details:', JSON.stringify(tenantError, null, 2));
            redirectPath = `/${locale}/admin/dashboard`;
          }
        } else {
          console.warn(`User ${transformedUser.email} without tenantId, redirecting to default dashboard`);
          redirectPath = `/${locale}/admin/dashboard`;
        }
      }
      
      // Use window.location for a full page refresh instead of Next.js router
      // This prevents React hydration issues when transitioning after login
      window.location.href = redirectPath;
      
    } catch (err) {
      console.error('Login error:', err);
      
      // Handle GraphQL errors
      if (err && typeof err === 'object' && 'graphQLErrors' in err) {
        const graphQLErrors = (err as { graphQLErrors: Array<{ message: string }> }).graphQLErrors;
        if (graphQLErrors && graphQLErrors.length > 0) {
          setError(graphQLErrors[0].message);
        } else {
          setError('Error de autenticación');
        }
      } else if (err && typeof err === 'object' && 'networkError' in err) {
        setError('Error de conexión. Por favor, intenta de nuevo.');
      } else {
        setError(err instanceof Error ? err.message : 'Ocurrió un error durante el inicio de sesión');
      }
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center">
      <div
        className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b z-10 pointer-events-none"
        style={{ background: `linear-gradient(to bottom, #1a253b, rgba(26, 37, 59, 0.5), transparent)` }}
      />
      <div className="absolute inset-0 bg-gradient-to-br from-[#01112A] via-[#01319c] to-[#1E0B4D] opacity-95 z-0" />
      
      {/* Stars animation effect */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 30 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-white"
            style={{
              width: `${Math.random() * 3 + 1}px`,
              height: `${Math.random() * 3 + 1}px`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{ opacity: [0.1, 0.8, 0.1], scale: [1, 1.2, 1] }}
            transition={{
              duration: Math.random() * 3 + 2,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>

      <div className="max-w-md w-full space-y-8 relative z-10 px-4">
        <div className="flex flex-col items-center">
          <Link href={`/${locale}`}>
          </Link>
          <motion.h2 
            className="text-center text-3xl font-extrabold text-white"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            Welcome Back
          </motion.h2>
          <motion.p
            className="mt-2 text-center text-sm text-gray-200"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            Sign in to access your account
          </motion.p>
        </div>
        
        <motion.div
          className="bg-white/10 backdrop-blur-md p-8 rounded-xl border border-white/20 shadow-2xl shadow-blue-500/10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="rounded-md bg-red-400/30 backdrop-blur-sm p-4 border border-red-400/50">
                <div className="text-sm text-white">{error}</div>
              </div>
            )}
            
            <div className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-white mb-1">
                  Email address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="w-full px-4 py-3 border-white/20 bg-white/10 text-white rounded-md focus:ring-2 focus:ring-blue-400 focus:border-transparent placeholder-white/50 transition-all duration-300"
                  placeholder="Enter your email"
                />
              </div>
              
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-white mb-1">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  className="w-full px-4 py-3 border-white/20 bg-white/10 text-white rounded-md focus:ring-2 focus:ring-blue-400 focus:border-transparent placeholder-white/50 transition-all duration-300"
                  placeholder="Enter your password"
                />
              </div>
            </div>

            <motion.button
              type="submit"
              disabled={loading}
              whileHover={{ scale: 1.03, boxShadow: '0 0 15px 5px rgba(59, 130, 246, 0.3)' }}
              whileTap={{ scale: 0.98 }}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white py-3 px-6 rounded-md font-bold text-lg shadow-lg shadow-blue-500/30 transition-all duration-300 disabled:opacity-50"
            >
              {loading ? 'Iniciando sesión...' : 'Iniciar sesión'}
            </motion.button>
          </form>
        </motion.div>
      </div>
    </div>
  );
} 