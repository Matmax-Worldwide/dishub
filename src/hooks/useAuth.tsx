import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { setGlobalAuthorizationHeader, clearGlobalAuthorizationHeader } from '@/lib/auth-header';

interface AuthUser {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  tenantId?: string;
  role: {
    id: string;
    name: string;
  }; // role name (USER, ADMIN, etc.)
  roleId?: string; // Added roleId
}

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  token: string | null;
  login: (user: AuthUser, token: string) => void;
  logout: () => void;
  isAuthenticated: boolean;
  setAuthorizationHeader: (token: string) => void;
  refreshUser: () => Promise<void>;
}

// Extend Window interface to include our custom properties
declare global {
  interface Window {
    __originalFetch?: typeof fetch;
  }
}

// Create a context with a default value
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// SSR safe storage check
const isBrowser = typeof window !== 'undefined';

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Initialize auth state from localStorage
    if (isBrowser) {
      const storedUser = localStorage.getItem('auth_user');
      const storedToken = localStorage.getItem('auth_token');
      
      if (storedUser && storedToken) {
        try {
          setUser(JSON.parse(storedUser));
          setToken(storedToken);
          // Set authorization header for stored token
          setGlobalAuthorizationHeader(storedToken);
        } catch (e) {
          console.error('Failed to parse stored user:', e);
          // Clear invalid data
          localStorage.removeItem('auth_user');
          localStorage.removeItem('auth_token');
        }
      }
      
      setIsLoading(false);
    }
  }, []);

  const login = (userData: AuthUser, authToken: string) => {
    setUser(userData);
    setToken(authToken);
    
    if (isBrowser) {
      localStorage.setItem('auth_user', JSON.stringify(userData));
      localStorage.setItem('auth_token', authToken);
    }
    
    // Set global authorization header
    setGlobalAuthorizationHeader(authToken);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    
    if (isBrowser) {
      localStorage.removeItem('auth_user');
      localStorage.removeItem('auth_token');
      // Clear session cookie
      document.cookie = 'session-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    }
    
    // Clear authorization header
    clearGlobalAuthorizationHeader();
  };

  const setAuthorizationHeader = (authToken: string) => {
    setGlobalAuthorizationHeader(authToken);
  };

  const refreshUser = async () => {
    if (!token) return;
    
    try {
      const response = await fetch('/api/graphql', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: `
            query Me {
              me {
                id
                email
                firstName
                lastName
                phoneNumber
                tenantId
                role {
                  id
                  name
                }
                createdAt
                updatedAt
              }
            }
          `
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        if (result.data?.me) {
          setUser(result.data.me);
          if (isBrowser) {
            localStorage.setItem('auth_user', JSON.stringify(result.data.me));
          }
        }
      }
    } catch (error) {
      console.error('Failed to refresh user data:', error);
    }
  };

  const value = {
    user,
    isLoading,
    token,
    login,
    logout,
    isAuthenticated: !!user && !!token,
    setAuthorizationHeader,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 