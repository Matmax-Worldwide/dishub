'use client';

import React from 'react';
import CMSSidebar from '@/components/CMSSidebar';
import { UnsavedChangesProvider } from '@/contexts/UnsavedChangesContext';

export default function CMSLayout({
  children,
}: {
  children: React.ReactNode;
}) {

  return (
    <UnsavedChangesProvider>
      <div className="flex h-screen">
        <CMSSidebar />
        <div className="flex-1 overflow-auto">
        {/* This is a nested layout inside the admin layout */}
        {children}
        </div>
      </div>
    </UnsavedChangesProvider>
  );
} 