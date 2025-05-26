// Utility functions for managing authorization headers

// Extend Window interface to include our custom properties
declare global {
  interface Window {
    __originalFetch?: typeof fetch;
  }
}

// SSR safe check
const isBrowser = typeof window !== 'undefined';

/**
 * Get the current session token from cookies
 */
export function getSessionToken(): string | null {
  if (!isBrowser) return null;
  
  try {
    const cookies = document.cookie.split(';');
    const tokenCookie = cookies.find(cookie => cookie.trim().startsWith('session-token='));
    if (tokenCookie) {
      return tokenCookie.split('=')[1].trim();
    }
  } catch (error) {
    console.error('Error reading session token:', error);
  }
  
  return null;
}

/**
 * Set authorization header globally for all fetch requests
 */
export function setGlobalAuthorizationHeader(token: string | null): void {
  if (!isBrowser) return;
  
  try {
    // Store the original fetch if not already stored
    if (!window.__originalFetch) {
      window.__originalFetch = window.fetch;
    }
    
    // Set up fetch interceptor
    window.fetch = function(input: RequestInfo | URL, init?: RequestInit) {
      const headers = new Headers(init?.headers);
      
      // Only add authorization header if not already present and token exists
      if (!headers.has('authorization') && token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      
      return window.__originalFetch!(input, { ...init, headers });
    };
    
    console.log('Global authorization header configured:', token ? 'with token' : 'cleared');
  } catch (error) {
    console.error('Error setting global authorization header:', error);
  }
}

/**
 * Clear the global authorization header
 */
export function clearGlobalAuthorizationHeader(): void {
  setGlobalAuthorizationHeader(null);
}

/**
 * Initialize authorization header from stored token
 */
export function initializeAuthorizationHeader(): void {
  const token = getSessionToken();
  if (token) {
    setGlobalAuthorizationHeader(token);
  }
}

/**
 * Create headers object with authorization if token is available
 */
export function createAuthHeaders(additionalHeaders: Record<string, string> = {}): Record<string, string> {
  const token = getSessionToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...additionalHeaders,
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return headers;
} 