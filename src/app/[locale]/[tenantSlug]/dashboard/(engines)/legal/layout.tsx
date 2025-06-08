'use client';

import { UnsavedChangesProvider } from '@/contexts/UnsavedChangesContext';
import LegalSidebar from '@/app/components/engines/legal/LegalSidebar';

interface LegalLayoutProps {
  children: React.ReactNode;
  params: Promise<{
    locale: string;
  }>;
}

export default function LegalLayout({ children }: LegalLayoutProps) {  
  return (
    <UnsavedChangesProvider>
      <div className="flex h-screen bg-gray-50">
        <LegalSidebar/>
        <main className="flex-1 overflow-auto">
          {/* This is a nested layout inside the dashboard layout */}
          {children}
        </main>
      </div>
    </UnsavedChangesProvider>
  );
} 