'use client';

import { useEffect } from 'react';
import { initializeAuthorizationHeader } from '@/lib/auth-header';

/**
 * Component that initializes the authorization header on app load
 * This ensures that the authorization header is set up properly
 * when the user has a valid session token
 */
export function AuthInitializer() {
  useEffect(() => {
    // Initialize authorization header from stored token
    initializeAuthorizationHeader();
  }, []);

  // This component doesn't render anything
  return null;
} 