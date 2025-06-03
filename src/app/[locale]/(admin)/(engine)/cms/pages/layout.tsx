'use client';

import React from 'react';
import { PagesEditor } from '@/components/engines/cms/pages/page-editor';
import { TabProvider } from '@/contexts/TabContext';

export default function PagesLayout({ children }: { children: React.ReactNode }) {
  return (
    <TabProvider>
      <PagesEditor>{children}</PagesEditor>
    </TabProvider>
  );
} 