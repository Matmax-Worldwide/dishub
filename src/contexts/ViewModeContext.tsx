'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

type ViewMode = 'edit' | 'preview';

interface ViewModeContextType {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  isPreviewLoaded: boolean;
  setIsPreviewLoaded: (loaded: boolean) => void;
}

const ViewModeContext = createContext<ViewModeContextType | undefined>(undefined);

export const useViewMode = () => {
  const context = useContext(ViewModeContext);
  if (context === undefined) {
    throw new Error('useViewMode must be used within a ViewModeProvider');
  }
  return context;
};

interface ViewModeProviderProps {
  children: ReactNode;
}

export const ViewModeProvider: React.FC<ViewModeProviderProps> = ({ children }) => {
  const [viewMode, setViewMode] = useState<ViewMode>('edit');
  const [isPreviewLoaded, setIsPreviewLoaded] = useState(false);

  return (
    <ViewModeContext.Provider
      value={{
        viewMode,
        setViewMode,
        isPreviewLoaded,
        setIsPreviewLoaded,
      }}
    >
      {children}
    </ViewModeContext.Provider>
  );
}; 