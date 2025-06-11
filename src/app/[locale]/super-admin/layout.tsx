'use client';

import { ReactNode } from 'react';
import { DashboardSidebar } from '@/components/sidebar/dashboardSidebar/DashboardSidebar';

interface SuperAdminLayoutProps {
  children: ReactNode;
  params: Promise<{
    locale: string;
  }>;
}

export default function SuperAdminLayout({ 
  children
}: SuperAdminLayoutProps) {
  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <DashboardSidebar />
      
      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50">
          {children}
        </main>
      </div>
    </div>
  );
} 