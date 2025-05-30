'use client';

import { UnsavedChangesProvider } from '@/contexts/UnsavedChangesContext';
import CommerceSidebar from '@/components/CommerceSidebar';
import { use } from 'react';

interface CommerceLayoutProps {
  children: React.ReactNode;
  params: Promise<{
    locale: string;
  }>;
}

export default function CommerceLayout({ children, params }: CommerceLayoutProps) {
  const { locale } = use(params);
  return (
    <UnsavedChangesProvider>
      <div className="flex h-screen bg-gray-50">
        <CommerceSidebar locale={locale} />
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </UnsavedChangesProvider>
  );
} 