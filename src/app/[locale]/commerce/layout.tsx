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
        {/* Sidebar */}
        <CommerceSidebar locale={locale} />
        
        {/* Main Content Area */}
        <main className="flex-1 overflow-auto">
          <div className="min-h-full">
            {children}
          </div>
        </main>
      </div>
    </UnsavedChangesProvider>
  );
} 