'use client';

import React, { useState } from 'react';
import { ArrowRight, LogOut, User, Eye, EyeOff } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useParams } from 'next/navigation';
import { useI18n } from '@/hooks/useI18n';
import { useAuth } from '@/hooks/useAuth';
import { motion, AnimatePresence } from 'framer-motion';
import { client } from '@/lib/apollo-client';
import { setGlobalAuthorizationHeader } from '@/lib/auth-header';
import { gql } from '@apollo/client';

// GraphQL mutation for login
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

// GraphQL mutation for logout
const LOGOUT_MUTATION = gql`
  mutation Logout {
    logout {
      success
      message
    }
  }
`;

// Helper function to set a cookie
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

export default function AuthNavigation() {
  const { t } = useI18n();
  const router = useRouter();
  const params = useParams();
  const { user, isAuthenticated, isLoading, logout, login: contextLogin } = useAuth();
  
  // States for inline login form
  const [showLoginForm, setShowLoginForm] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleAuthAction = () => {
    if (isAuthenticated && user) {
      // Redirect to appropriate dashboard based on user role and tenant
      if (user.role.name === 'SuperAdmin') {
        router.push(`/${params.locale}/super-admin/dashboard`);
      } else if (user.tenantSlug) {
        router.push(`/${params.locale}/${user.tenantSlug}/dashboard`);
      } else {
        router.push(`/${params.locale}/dashboard`);
      }
    } else {
      // Show inline login form instead of redirecting
      setShowLoginForm(true);
      setLoginError(null);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setLoginLoading(true);

    try {
      const { data } = await client.mutate({
        mutation: LOGIN_MUTATION,
        variables: { email, password },
        errorPolicy: 'all'
      });

      if (!data?.login) {
        throw new Error('Login failed - no data returned');
      }

      const { token, user: loginUser } = data.login;

      if (!token || !loginUser) {
        throw new Error('Invalid response from server');
      }

      // Transform user data
      const transformedUser = {
        ...loginUser,
        role: loginUser.role || { id: '', name: 'User' }
      };

      // Set cookie and authorization header
      setCookie('session-token', token, 7);
      setGlobalAuthorizationHeader(token);
      
      // Clear Apollo cache
      await client.clearStore();
      
      // Update auth context
      contextLogin(transformedUser, token);
      
      // Hide form and reset states
      setShowLoginForm(false);
      setEmail('');
      setPassword('');
      setLoginLoading(false);
      
      // Determine redirect path
      let redirectPath = `/${params.locale}`;
      
      if (transformedUser.role?.name === 'SuperAdmin') {
        redirectPath = `/${params.locale}/super-admin`;
      } else {
        const firstTenant = transformedUser.userTenants?.[0];
        if (firstTenant?.tenantId) {
          try {
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
            
            if (tenantData?.tenant?.slug) {
              sessionStorage.setItem('currentTenant', JSON.stringify({
                id: tenantData.tenant.id,
                slug: tenantData.tenant.slug,
                name: tenantData.tenant.name
              }));
              
              if (transformedUser.role?.name === 'TenantAdmin' || transformedUser.role?.name === 'TenantManager') {
                redirectPath = `/${params.locale}/${tenantData.tenant.slug}/dashboard`;
              } else if (transformedUser.role?.name === 'TenantEmployee') {
                redirectPath = `/${params.locale}/${tenantData.tenant.slug}`;
              } else {
                redirectPath = `/${params.locale}/${tenantData.tenant.slug}/dashboard`;
              }
            }
          } catch (tenantError) {
            console.error('Tenant query error:', tenantError);
          }
        }
      }
      
      // Use window.location for full page refresh
      window.location.href = redirectPath;
      
    } catch (err) {
      console.error('Login error:', err);
      
      if (err && typeof err === 'object' && 'graphQLErrors' in err) {
        const graphQLErrors = (err as { graphQLErrors: Array<{ message: string }> }).graphQLErrors;
        if (graphQLErrors && graphQLErrors.length > 0) {
          setLoginError(graphQLErrors[0].message);
        } else {
          setLoginError('Error de autenticación');
        }
      } else {
        setLoginError('Error de conexión. Por favor, intenta de nuevo.');
      }
      setLoginLoading(false);
    }
  };

  const handleCloseForm = () => {
    setShowLoginForm(false);
    setEmail('');
    setPassword('');
    setLoginError(null);
  };

    const handleLogout = async () => {
    setLogoutLoading(true);
    
    try {
      // 1. Intentar logout con GraphQL primero
      try {
        await client.mutate({
          mutation: LOGOUT_MUTATION,
          errorPolicy: 'all'
        });
      } catch (graphqlError) {
        console.warn('GraphQL logout failed, proceeding with API logout:', graphqlError);
      }

      // 2. Llamar a la API de logout para limpiar cookies del servidor
      try {
        await fetch('/api/auth/logout', {
          method: 'POST',
          credentials: 'include',
        });
      } catch (apiError) {
        console.warn('API logout failed, proceeding with local cleanup:', apiError);
      }

      // 3. Limpiar cookies manualmente (fallback)
      const cookiesToClear = [
        'session-token',
        'auth-token', 
        'user-session',
        'tenant-context'
      ];

      cookiesToClear.forEach(cookieName => {
        document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${window.location.hostname}; secure; samesite=strict`;
        document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; secure; samesite=strict`;
        document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
      });

      // 4. Limpiar almacenamiento local
      sessionStorage.removeItem('currentTenant');
      localStorage.removeItem('auth-state');
      
      // 5. Limpiar Apollo cache
      await client.clearStore();
      
      // 6. Remover authorization header
      setGlobalAuthorizationHeader('');
      
      // 7. Usar el logout del contexto (redirige y actualiza estado)
      await logout();
      
    } catch (error) {
      console.error('Logout error:', error);
      // Forzar logout local incluso si hay errores
      await logout();
    } finally {
      setLogoutLoading(false);
    }
  };

  return (
    <div className="flex items-center space-x-3 relative z-50">
      {isLoading ? (
        <div className="w-8 h-8 animate-spin rounded-full border-2 border-purple-500 border-t-transparent"></div>
      ) : isAuthenticated && user ? (
        <>
          <div className="hidden sm:flex items-center space-x-2 text-sm text-gray-300">
            <User className="w-4 h-4" />
            <span>{user.firstName} {user.lastName}</span>
          </div>
          <button 
            onClick={handleAuthAction}
            className="px-4 py-2 bg-gradient-to-r from-purple-600 to-cyan-600 rounded-full font-semibold hover:shadow-lg hover:shadow-purple-500/25 transition-all duration-300 hover:scale-105 flex items-center space-x-2 relative z-50 cursor-pointer pointer-events-auto"
          >
            <span>{t('dishub.nav.dashboard')}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          <motion.button 
            onClick={handleLogout}
            disabled={logoutLoading}
            whileHover={{ scale: logoutLoading ? 1 : 1.05 }}
            whileTap={{ scale: logoutLoading ? 1 : 0.95 }}
            className="px-4 py-2 border border-white/20 rounded-full font-semibold hover:bg-white/10 transition-all duration-300 flex items-center space-x-2 relative z-50 cursor-pointer pointer-events-auto disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {logoutLoading ? (
              <div className="w-4 h-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
            ) : (
              <LogOut className="w-4 h-4" />
            )}
            <span className="hidden sm:inline">
              {logoutLoading ? 'Signing out...' : t('dishub.nav.logout')}
            </span>
          </motion.button>
        </>
      ) : (
        <div className="relative">
          {/* Get Started Button */}
          <motion.button 
            onClick={handleAuthAction} 
            animate={{
              width: showLoginForm ? '48px' : 'auto',
              paddingLeft: showLoginForm ? '12px' : '24px',
              paddingRight: showLoginForm ? '12px' : '24px'
            }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="h-10 bg-gradient-to-r from-purple-600 to-cyan-600 rounded-full font-semibold hover:shadow-lg hover:shadow-purple-500/25 transition-all duration-300 hover:scale-105 relative z-50 cursor-pointer pointer-events-auto flex items-center justify-center"
          >
            <motion.span
              animate={{ opacity: showLoginForm ? 0 : 1 }}
              transition={{ duration: 0.2 }}
              className="whitespace-nowrap"
            >
              {showLoginForm ? '' : t('dishub.nav.getStarted')}
            </motion.span>
            <motion.div
              animate={{ opacity: showLoginForm ? 1 : 0 }}
              transition={{ duration: 0.2, delay: showLoginForm ? 0.1 : 0 }}
              className="absolute inset-0 flex items-center justify-center"
            >
              <ArrowRight className="w-5 h-5" />
            </motion.div>
          </motion.button>

          {/* Inline Login Form */}
          <AnimatePresence>
            {showLoginForm && (
              <motion.div
                initial={{ opacity: 0, x: 100, y: 20 }}
                animate={{ opacity: 1, x: 0, y: 0 }}
                exit={{ opacity: 0, x: 100, y: 20 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="absolute top-12 right-0 w-80 backdrop-blur-xl bg-black/80 border border-white/20 rounded-2xl p-6 shadow-2xl z-[100]"
              >
                {/* Close button */}
                <button
                  onClick={handleCloseForm}
                  className="absolute top-3 right-3 text-white/50 hover:text-white transition-colors"
                >
                  <span className="text-xl">×</span>
                </button>

                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="text-center mb-4">
                    <h3 className="text-lg font-bold text-white mb-1">
                      {t('auth.login.welcomeBack')}
                    </h3>
                    <p className="text-sm text-gray-300">
                      {t('auth.login.signInMessage')}
                    </p>
                  </div>

                  {loginError && (
                    <motion.div 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="rounded-md bg-red-400/30 backdrop-blur-sm p-3 border border-red-400/50"
                    >
                      <div className="text-sm text-white">{loginError}</div>
                    </motion.div>
                  )}

                  <div>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={t('auth.login.emailPlaceholder')}
                      required
                      className="w-full px-3 py-2 border border-white/10 bg-white/5 text-white rounded-lg focus:ring-2 focus:ring-purple-400 focus:border-transparent placeholder-white/50 transition-all duration-300 text-sm"
                    />
                  </div>

                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={t('auth.login.passwordPlaceholder')}
                      required
                      className="w-full px-3 py-2 pr-10 border border-white/10 bg-white/5 text-white rounded-lg focus:ring-2 focus:ring-purple-400 focus:border-transparent placeholder-white/50 transition-all duration-300 text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 px-3 flex items-center text-white/50 hover:text-white transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  <motion.button
                    type="submit"
                    disabled={loginLoading}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 text-white py-2 px-4 rounded-lg font-semibold text-sm shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50"
                  >
                    {loginLoading ? (
                      <div className="flex items-center justify-center space-x-2">
                        <div className="w-4 h-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                        <span>{t('auth.login.signingIn')}</span>
                      </div>
                    ) : (
                      t('auth.login.signIn')
                    )}
                  </motion.button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
} 