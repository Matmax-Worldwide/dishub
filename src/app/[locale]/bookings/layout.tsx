'use client';

import { UnsavedChangesProvider } from '@/contexts/UnsavedChangesContext';
import BookingsSidebar from '@/components/BookingsSidebar';
import { use } from 'react';

interface BookingsLayoutProps {
  children: React.ReactNode;
  params:  Promise<{
    locale: string;
  }>;
}

export default function BookingsLayout({ children, params }: BookingsLayoutProps) {
  const { locale } = use(params);
  return (
    <UnsavedChangesProvider>
      <div className="flex h-screen bg-gray-50">
        <BookingsSidebar locale={locale} />
        <main className="flex-1 overflow-auto">
          {/* This is a nested layout inside the dashboard layout */}
          {children}
        </main>
      </div>
    </UnsavedChangesProvider>
  );
} 