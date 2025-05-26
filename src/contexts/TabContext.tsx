'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

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

// Provider component
export function TabProvider({ children }: { children: React.ReactNode }) {
  const [activeTab, setActiveTab] = useState('details');
  
  // Usar useCallback para evitar regeneración de la función setActiveTab
  const handleSetActiveTab = useCallback((tab: string) => {
    console.log('TabProvider: Setting active tab to', tab);
    setActiveTab(tab);
  }, []);

  // Log cuando cambia el activeTab
  useEffect(() => {
    console.log('TabProvider: Active tab changed to', activeTab);
  }, [activeTab]);

  // Crear el valor del contexto fuera del render para evitar recreaciones
  const contextValue = React.useMemo(() => ({
    activeTab,
    setActiveTab: handleSetActiveTab
  }), [activeTab, handleSetActiveTab]);

  return (
    <TabContext.Provider value={contextValue}>
      {children}
    </TabContext.Provider>
  );
} 