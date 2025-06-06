'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { client } from '@/lib/apollo-client';
import { setGlobalAuthorizationHeader } from '@/lib/auth-header';
import { gql } from '@apollo/client';
import { Eye, EyeOff } from 'lucide-react';

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
        userTenants {
          tenantId
        }
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
  const [showPassword, setShowPassword] = useState(false);
  
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
      console.log('User role name type:', typeof user.role?.name);
      console.log('User role name length:', user.role?.name?.length);
      console.log('User role name === "TenantAdmin":', user.role?.name === 'TenantAdmin');
      console.log('Transformed user role (keeping as object):', transformedUser.role);
      console.log('User tenants:', transformedUser.userTenants?.map((ut: { tenantId: string }) => ut.tenantId));
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
      
      console.log('=== Redirection Logic Debug ===');
      console.log('User role name for redirection:', transformedUser.role?.name);
      console.log('Is SuperAdmin?', transformedUser.role?.name === 'SuperAdmin');
      console.log('Has userTenants?', !!transformedUser.userTenants?.length);
      
      if (transformedUser.role?.name === 'SuperAdmin') {
        redirectPath = `/${locale}/super-admin/dashboard`;
        console.log('SuperAdmin detected, redirecting to:', redirectPath);
      } else {
        // For all other roles, get tenant info from the first tenant relationship
        const firstTenant = transformedUser.userTenants?.[0];
        if (firstTenant?.tenantId) {
          try {
            console.log(`Fetching tenant data for tenantId: ${firstTenant.tenantId}`);
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
              variables: { id: firstTenant.tenantId }
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
              console.log('=== Role-based Redirect Debug ===');
              console.log('Role name for redirect logic:', transformedUser.role?.name);
              console.log('Tenant slug:', tenantData.tenant.slug);
              
              if (transformedUser.role?.name === 'TenantAdmin') {
                redirectPath = `/${locale}/manage/${tenantData.tenant.slug}/dashboard`;
                console.log(`✅ TenantAdmin redirect path: ${redirectPath}`);
              } else if (transformedUser.role?.name === 'TenantManager') {
                redirectPath = `/${locale}/manage/${tenantData.tenant.slug}/dashboard`;
                console.log(`✅ TenantManager redirect path: ${redirectPath}`);
              } else if (transformedUser.role?.name === 'TenantEmployee') {
                // TenantEmployee goes to the main tenant page
                redirectPath = `/${locale}/manage/${tenantData.tenant.slug}`;
                console.log(`✅ TenantEmployee redirect path: ${redirectPath}`);
              } else {
                // For any other role associated with a tenant, redirect to tenant dashboard
                console.log(`⚠️ Unknown role "${transformedUser.role?.name}" but user belongs to tenant: ${tenantData.tenant.slug}, redirecting to tenant dashboard`);
                sessionStorage.setItem('userTenantSlug', tenantData.tenant.slug);
                sessionStorage.setItem('userTenantName', tenantData.tenant.name);
                redirectPath = `/${locale}/manage/${tenantData.tenant.slug}/dashboard`;
                console.log(`✅ Fallback redirect path: ${redirectPath}`);
              }
              console.log(`User with role ${transformedUser.role?.name} from tenant ${tenantData.tenant.slug} redirecting to: ${redirectPath}`);
            } else {
              console.warn(`Tenant query returned but no slug found. tenantData:`, tenantData);
              console.warn(`User has tenantId ${firstTenant.tenantId} but tenant slug not found, redirecting to fallback`);
              redirectPath = `/${locale}`;
            }
          } catch (tenantError) { 
            console.error('GraphQL Tenant Query Error:', tenantError);
            console.error('Error details:', JSON.stringify(tenantError, null, 2));
            redirectPath = `/${locale}`;
          }
        } else {
          console.warn(`User ${transformedUser.email} without tenant relationships, redirecting to home page`);
          redirectPath = `/${locale}`;
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
    <div className="min-h-screen bg-black text-white overflow-x-hidden flex items-center justify-center">
      {/* Animated Background - Same as DishubLanding */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-black to-cyan-900/20" />
        <div className="absolute top-0 left-0 w-96 h-96 bg-purple-600 rounded-full filter blur-3xl opacity-20 animate-pulse" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-cyan-600 rounded-full filter blur-3xl opacity-20 animate-pulse" />
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
          className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-8 hover:bg-white/10 transition-all duration-500 shadow-2xl"
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
                  className="w-full px-4 py-3 border border-white/10 bg-white/5 text-white rounded-xl focus:ring-2 focus:ring-purple-400 focus:border-transparent placeholder-white/50 transition-all duration-300 hover:bg-white/10"
                  placeholder="Enter your email"
                />
              </div>
              
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-white mb-1">
                  Password
                </label>
                <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  className="w-full px-4 py-3 pr-12 border border-white/10 bg-white/5 text-white rounded-xl focus:ring-2 focus:ring-purple-400 focus:border-transparent placeholder-white/50 transition-all duration-300 hover:bg-white/10"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 px-3 flex items-center text-white/50 hover:text-white transition-colors"
                  aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              </div>
            </div>

            <motion.button
              type="submit"
              disabled={loading}
              whileHover={{ scale: 1.03, boxShadow: '0 0 20px 8px rgba(139, 92, 246, 0.5)' }}
              whileTap={{ scale: 0.98 }}
              className="w-full bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 text-white py-3 px-6 rounded-full font-bold text-lg shadow-lg hover:shadow-2xl hover:shadow-purple-500/50 transition-all duration-300 disabled:opacity-50"
            >
              {loading ? 'Iniciando sesión...' : 'Iniciar sesión'}
            </motion.button>
          </form>

          <div className="text-center mt-6">
            <p className="text-sm text-gray-200">
              ¿No tienes una cuenta?{' '}
              <Link href="/get-started" className="text-purple-300 hover:text-cyan-300 hover:underline transition-colors duration-300">
                Crea una cuenta aquí
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
} 