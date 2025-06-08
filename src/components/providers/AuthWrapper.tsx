'use client';

import React, { ReactNode } from 'react';
import { AuthProvider } from '@/hooks/useAuth';

interface AuthWrapperProps {
  children: ReactNode;
}

export default function AuthWrapper({ children }: AuthWrapperProps) {
  return (
    <div className="w-full h-full">
      <AuthProvider>
        {children}
      </AuthProvider>
    </div>
  );
} 