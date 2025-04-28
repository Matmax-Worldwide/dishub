'use client';

import { DashboardSidebar } from '@/components/DashboardSidebar';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen overflow-hidden bg-gray-100">
      {/* Sidebar component - manages both desktop and mobile views */}
      <DashboardSidebar />
      
      {/* Main content - with padding to account for the fixed sidebar */}
      <div className="flex flex-col flex-1 w-full overflow-y-auto lg:pl-64">
        <main className="flex-1 p-4">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
