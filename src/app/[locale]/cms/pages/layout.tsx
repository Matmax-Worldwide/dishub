'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { PagesEditor } from '@/components/cms/page-editor';

// Crear un contexto para el estado de las tabs
interface TabContextType {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const TabContext = createContext<TabContextType | undefined>(undefined);

// Hook para usar el contexto de tabs
export function useTabContext() {
  const context = useContext(TabContext);
  if (context === undefined) {
    throw new Error('useTabContext must be used within a TabProvider');
  }
  return context;
}

export default function PagesLayout({ children }: { children: React.ReactNode }) {
  const [activeTab, setActiveTab] = useState('details');
  
  // Usar useCallback para evitar regeneración de la función setActiveTab
  const handleSetActiveTab = useCallback((tab: string) => {
    console.log('Layout: Setting active tab to', tab);
    setActiveTab(tab);
  }, []);

  // Log cuando cambia el activeTab
  useEffect(() => {
    console.log('Layout: Active tab changed to', activeTab);
  }, [activeTab]);

  // Crear el valor del contexto fuera del render para evitar recreaciones
  const contextValue = React.useMemo(() => ({
    activeTab,
    setActiveTab: handleSetActiveTab
  }), [activeTab, handleSetActiveTab]);

  return (
    <TabContext.Provider value={contextValue}>
      <PagesEditor>{children}</PagesEditor>
    </TabContext.Provider>
  );
} 