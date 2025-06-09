'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, ArrowRight } from 'lucide-react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useI18n } from '@/hooks/useI18n';
import { useAuth } from '@/hooks/useAuth';
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

interface InlineLoginFormProps {
  onClose: () => void;
  buttonText: string;
  className?: string;
  position?: 'top' | 'bottom' | 'center';
  buttonClassName?: string;
}

export default function InlineLoginForm({ 
  onClose, 
  buttonText, 
  className = '',
  position = 'top',
  buttonClassName = ''
}: InlineLoginFormProps) {
  const { t } = useI18n();
  const params = useParams();
  const { login: contextLogin } = useAuth();
  
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showForm, setShowForm] = useState(false);

  const handleShowForm = () => {
    setShowForm(true);
    setLoginError(null);
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
      setShowForm(false);
      setEmail('');
      setPassword('');
      setLoginLoading(false);
      onClose();
      
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
    setShowForm(false);
    setEmail('');
    setPassword('');
    setLoginError(null);
    onClose();
  };



  const getPositionClasses = () => {
    switch (position) {
      case 'bottom':
        return 'top-full mt-4';
      case 'center':
        return 'top-1/2 -translate-y-1/2';
      default:
        return 'bottom-full mb-4';
    }
  };

  return (
    <div className={`relative ${className}`}>
      {/* Main Action Button */}
      <motion.button 
        onClick={handleShowForm}
        animate={{
          width: showForm ? '48px' : 'auto',
          paddingLeft: showForm ? '12px' : '32px',
          paddingRight: showForm ? '12px' : '32px'
        }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className={`bg-gradient-to-r from-purple-600 to-cyan-600 rounded-full font-bold hover:shadow-2xl hover:shadow-purple-500/50 transition-all duration-300 hover:scale-105 relative cursor-pointer pointer-events-auto flex items-center justify-center min-h-[48px] ${buttonClassName}`}
      >
        <motion.span
          animate={{ opacity: showForm ? 0 : 1 }}
          transition={{ duration: 0.2 }}
          className="whitespace-nowrap"
        >
          {showForm ? '' : buttonText}
        </motion.span>
        <motion.div
          animate={{ opacity: showForm ? 1 : 0 }}
          transition={{ duration: 0.2, delay: showForm ? 0.1 : 0 }}
          className="absolute inset-0 flex items-center justify-center"
        >
          <ArrowRight className="w-5 h-5" />
        </motion.div>
      </motion.button>

      {/* Inline Login Form - Mobile First Design */}
      <AnimatePresence>
        {showForm && (
          <>
            {/* Mobile Fullscreen Form */}
            <motion.div
              initial={{ opacity: 0, y: '100%' }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: '100%' }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-xl md:hidden"
            >
              {/* Close button */}
              <button
                onClick={handleCloseForm}
                className="absolute top-6 right-6 text-white/70 hover:text-white transition-colors z-10"
              >
                <span className="text-2xl">×</span>
              </button>

              {/* Mobile Form Content */}
              <div className="flex flex-col justify-center min-h-screen px-6 py-12">
                <div className="max-w-sm mx-auto w-full">
                  <div className="text-center mb-8">
                    <h3 className="text-2xl font-bold text-white mb-2">
                      {t('auth.login.welcomeBack')}
                    </h3>
                    <p className="text-gray-300">
                      {t('auth.login.signInMessage')}
                    </p>
                  </div>

                  <form onSubmit={handleLogin} className="space-y-6">
                    {loginError && (
                      <motion.div 
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="rounded-lg bg-red-500/20 backdrop-blur-sm p-4 border border-red-400/50"
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
                        className="w-full px-4 py-4 border border-white/20 bg-white/10 text-white rounded-xl focus:ring-2 focus:ring-purple-400 focus:border-transparent placeholder-white/60 transition-all duration-300 text-base"
                      />
                    </div>

                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder={t('auth.login.passwordPlaceholder')}
                        required
                        className="w-full px-4 py-4 pr-12 border border-white/20 bg-white/10 text-white rounded-xl focus:ring-2 focus:ring-purple-400 focus:border-transparent placeholder-white/60 transition-all duration-300 text-base"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 px-4 flex items-center text-white/60 hover:text-white transition-colors"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>

                    <motion.button
                      type="submit"
                      disabled={loginLoading}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      className="w-full bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 text-white py-4 px-6 rounded-xl font-semibold text-base shadow-xl hover:shadow-2xl transition-all duration-300 disabled:opacity-50"
                    >
                      {loginLoading ? (
                        <div className="flex items-center justify-center space-x-2">
                          <div className="w-5 h-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                          <span>{t('auth.login.signingIn')}</span>
                        </div>
                      ) : (
                        t('auth.login.signIn')
                      )}
                    </motion.button>
                  </form>

                  {/* No Account Section - Simplified for Mobile */}
                  <div className="mt-8 pt-6 border-t border-white/20">
                    <div className="text-center">
                      <p className="text-white font-medium mb-4">
                        {t('auth.login.noAccount')}
                      </p>
                      <Link href={`/${params.locale}/login`}>
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white py-4 px-6 rounded-xl font-bold text-base shadow-xl hover:shadow-2xl transition-all duration-300 flex items-center justify-center space-x-2"
                        >
                          <span>{t('auth.login.startFreeTrial')}</span>
                          <span className="text-xl">🚀</span>
                        </motion.button>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Desktop Form (unchanged for larger screens) */}
            <motion.div
              initial={{ opacity: 0, x: 100, y: position === 'bottom' ? -20 : 20 }}
              animate={{ opacity: 1, x: 0, y: 0 }}
              exit={{ opacity: 0, x: 100, y: position === 'bottom' ? -20 : 20 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className={`absolute ${getPositionClasses()} right-0 w-80 backdrop-blur-xl bg-black/80 border border-white/20 rounded-2xl p-6 shadow-2xl z-[100] hidden md:block`}
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

              {/* No Account Section - More Prominent */}
              <div className="mt-5 pt-4 border-t border-white/20">
                <div className="text-center space-y-3">
                  <div className="bg-gradient-to-r from-purple-500/10 to-cyan-500/10 rounded-lg p-3 border border-purple-400/20">
                    <p className="text-sm text-white font-medium mb-2">
                      {t('auth.login.noAccount')}
                    </p>
                    <p className="text-xs text-gray-300 mb-3">
                      {t('auth.login.joinThousands')}
                    </p>
                    <Link href={`/${params.locale}/login`}>
                      <motion.button
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white py-2.5 px-4 rounded-lg font-bold text-sm shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center space-x-2"
                      >
                        <span>{t('auth.login.startFreeTrial')}</span>
                        <span className="text-lg">🚀</span>
                      </motion.button>
                    </Link>
                  </div>
                  
                  {/* Additional Benefits */}
                  <div className="text-xs text-gray-400 space-y-1">
                    <div className="flex items-center justify-center space-x-1">
                      <span>✨</span>
                      <span>{t('auth.login.noCredit')}</span>
                    </div>
                    <div className="flex items-center justify-center space-x-1">
                      <span>⚡</span>
                      <span>{t('auth.login.setupInMinutes')}</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
} 