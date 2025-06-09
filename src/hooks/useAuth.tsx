'use client';

import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: {
    id: string;
    name: string;
  };
  tenantId?: string | null;
  tenantSlug?: string | null;
  tenantName?: string | null;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string; redirectUrl?: string }>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  autoLogin: (email: string, hash: string) => Promise<{ success: boolean; error?: string; redirectUrl?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const searchParams = useSearchParams();

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/me', {
        method: 'GET',
        credentials: 'include',
      });

      if (response.ok) {
        const userData = await response.json();
        setUser(userData.user);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setUser(data.user);
        return { 
          success: true, 
          redirectUrl: data.redirectUrl || '/dashboard' 
        };
      } else {
        return { 
          success: false, 
          error: data.message || 'Login failed' 
        };
      }
    } catch (error) {
      console.error('Login error:', error);
      return { 
        success: false, 
        error: 'Network error occurred' 
      };
    }
  };

  const autoLogin = async (email: string, hash: string) => {
    try {
      const response = await fetch('/api/auth/auto-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ email, hash }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setUser(data.user);
        
        // Limpiar los parámetros de la URL después de la autenticación exitosa
        const url = new URL(window.location.href);
        url.searchParams.delete('user');
        url.searchParams.delete('hash');
        window.history.replaceState({}, '', url.toString());
        
        return { 
          success: true, 
          redirectUrl: data.redirectUrl || '/dashboard' 
        };
      } else {
        return { 
          success: false, 
          error: data.message || 'Auto-login failed' 
        };
      }
    } catch (error) {
      console.error('Auto-login error:', error);
      return { 
        success: false, 
        error: 'Network error occurred' 
      };
    }
  };

  const logout = async () => {
    try {
      // Clear all auth-related cookies
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

      // Call logout API
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });

      setUser(null);
      
      // Redirect to home page
      router.push('/');
      router.refresh();
    } catch (error) {
      console.error('Logout error:', error);
      // Even if API call fails, clear local state
      setUser(null);
      router.push('/');
    }
  };

  // Función para verificar y manejar autenticación automática desde URL
  const handleAutoLoginFromURL = async () => {
    // Solo ejecutar en el cliente
    if (typeof window === 'undefined') return;
    
    const userParam = searchParams?.get('user');
    const hashParam = searchParams?.get('hash');

    if (userParam && hashParam) {
      try {
        console.log('Attempting auto-login for user:', userParam);
        const result = await autoLogin(userParam, hashParam);
        
        if (result.success) {
          console.log('Auto-login successful, redirecting...');
          if (result.redirectUrl) {
            router.push(result.redirectUrl);
          }
        } else {
          console.error('Auto-login failed:', result.error);
          // Limpiar parámetros incluso si falla
          if (typeof window !== 'undefined') {
            const url = new URL(window.location.href);
            url.searchParams.delete('user');
            url.searchParams.delete('hash');
            window.history.replaceState({}, '', url.toString());
          }
        }
      } catch (error) {
        console.error('Error in auto-login process:', error);
      }
    }
  };

  useEffect(() => {
    const initializeAuth = async () => {
      // Solo ejecutar en el cliente para evitar problemas de SSR
      if (typeof window === 'undefined') return;
      
      // Primero verificar si hay parámetros de autenticación automática
      const userParam = searchParams?.get('user');
      const hashParam = searchParams?.get('hash');

      if (userParam && hashParam) {
        // Si hay parámetros de auto-login, intentar autenticación automática
        await handleAutoLoginFromURL();
      } else {
        // Si no hay parámetros, hacer verificación normal de autenticación
        await checkAuth();
      }
    };

    initializeAuth();
  }, [searchParams]);

  const value = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    logout,
    checkAuth,
    autoLogin,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 