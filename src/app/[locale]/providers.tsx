'use client';

import { ReactNode } from 'react';
import { AuthProvider } from '@/hooks/useAuth';
import { PermissionProvider } from '@/hooks/usePermission';
import { NextIntlClientProvider } from 'next-intl';
import { ApolloProvider } from '@apollo/client';
import { client } from '@/lib/apollo-client';
import { AuthInitializer } from '@/components/auth/AuthInitializer';

type ProvidersProps = {
  children: ReactNode;
  locale: string;
  messages: Record<string, unknown>;
};

export function Providers({ children, locale, messages }: ProvidersProps) {
  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <ApolloProvider client={client}>
        <AuthProvider>
          <PermissionProvider>
            <AuthInitializer />
            {children}
          </PermissionProvider>
        </AuthProvider>
      </ApolloProvider>
    </NextIntlClientProvider>
  );
} 