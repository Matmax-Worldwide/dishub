'use client';

import { ReactNode, Suspense } from 'react';
import { AuthProvider } from '@/hooks/useAuth';
import { ApolloProvider } from '@apollo/client';
import { client } from '@/lib/apollo-client';

type ClientProvidersProps = {
  children: ReactNode;
};

function AuthProviderWrapper({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AuthProvider>
        {children}
      </AuthProvider>
    </Suspense>
  );
}

export function ClientProviders({ children }: ClientProvidersProps) {
  return (
    <ApolloProvider client={client}>
      <AuthProviderWrapper>
        {children}
      </AuthProviderWrapper>
    </ApolloProvider>
  );
} 