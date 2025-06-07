'use client';

import { SessionProvider } from 'next-auth/react';
import { Suspense, ReactNode } from 'react';
import { Skeleton } from '@/app/components/ui/skeleton';

interface ClientProvidersProps {
  children: ReactNode;
}

export default function ClientProviders({ children }: ClientProvidersProps) {
  return (
    <SessionProvider>
      <Suspense fallback={
        <div className="container mx-auto py-8 px-4 max-w-4xl">
          <div className="space-y-4">
            <Skeleton className="h-12 w-1/3" />
            <Skeleton className="h-96 w-full" />
          </div>
        </div>
      }>
        {children}
      </Suspense>
    </SessionProvider>
  );
} 