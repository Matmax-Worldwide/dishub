'use client';

import React from 'react';
import BookingsSidebar from '@/components/BookingsSidebar';
import { useParams } from 'next/navigation';
import { UnsavedChangesProvider } from '@/contexts/UnsavedChangesContext';

export default function BookingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const locale = params.locale as string;

  return (
    <UnsavedChangesProvider>
      <div className="flex h-screen">
        <BookingsSidebar locale={locale} />
        <div className="flex-1 overflow-auto">
          {/* This is a nested layout inside the dashboard layout */}
          {children}
        </div>
      </div>
    </UnsavedChangesProvider>
  );
} 