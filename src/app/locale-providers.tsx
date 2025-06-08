'use client';

import { ReactNode } from 'react';
import { PermissionProvider } from '@/hooks/usePermission';
import { NextIntlClientProvider } from 'next-intl';
import { AuthInitializer } from '@/components/auth/AuthInitializer';

type LocaleProvidersProps = {
  children: ReactNode;
  locale: string;
  messages: Record<string, unknown>;
};

export function LocaleProviders({ children, locale, messages }: LocaleProvidersProps) {
  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <PermissionProvider>
        <AuthInitializer />
        {children}
      </PermissionProvider>
    </NextIntlClientProvider>
  );
} 