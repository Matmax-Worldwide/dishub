'use client';

import { ReactNode } from 'react';
import { AuthProvider } from '@/hooks/useAuth';
import { PermissionProvider } from '@/hooks/usePermission';
import { NextIntlClientProvider } from 'next-intl';
import { ApolloProvider } from '@apollo/client';
import { client } from '@/app/lib/apollo-client';

type ProvidersProps = {
  children: ReactNode;
  locale: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  messages: Record<string, any>;
};

export function Providers({ children, locale, messages }: ProvidersProps) {
  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <ApolloProvider client={client}>
        <AuthProvider>
          <PermissionProvider>
            {children}
          </PermissionProvider>
        </AuthProvider>
      </ApolloProvider>
    </NextIntlClientProvider>
  );
} 