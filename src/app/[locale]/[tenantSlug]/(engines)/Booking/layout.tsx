'use client';

import { UnsavedChangesProvider } from '@/contexts/UnsavedChangesContext';
import BookingsSidebar from '@/app/components/engines/booking/BookingsSidebar';

interface BookingsLayoutProps {
  children: React.ReactNode;
  params:  Promise<{
    locale: string;
  }>;
}

export default function BookingsLayout({ children }: BookingsLayoutProps) {  
  return (
    <UnsavedChangesProvider>
      <div className="flex h-screen bg-gray-50">
        <BookingsSidebar/>
        <main className="flex-1 overflow-auto">
          {/* This is a nested layout inside the dashboard layout */}
          {children}
        </main>
      </div>
    </UnsavedChangesProvider>
  );
} 