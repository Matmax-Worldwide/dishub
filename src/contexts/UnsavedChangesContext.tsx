import React, { createContext, useContext, useState } from 'react';

interface UnsavedChangesContextType {
  hasUnsavedChanges: boolean;
  setHasUnsavedChanges: (hasChanges: boolean) => void;
  onSave: (() => Promise<boolean> | boolean) | null;
  setOnSave: (saveFunction: (() => Promise<boolean> | boolean) | null) => void;
  isSaving: boolean;
  setIsSaving: (saving: boolean) => void;
  pendingNavigation: string | null;
  setPendingNavigation: (path: string | null) => void;
  showUnsavedAlert: boolean;
  setShowUnsavedAlert: (show: boolean) => void;
}

const UnsavedChangesContext = createContext<UnsavedChangesContextType | undefined>(undefined);

export function UnsavedChangesProvider({ children }: { children: React.ReactNode }) {
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [onSave, setOnSave] = useState<(() => Promise<boolean> | boolean) | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null);
  const [showUnsavedAlert, setShowUnsavedAlert] = useState(false);

  return (
    <UnsavedChangesContext.Provider
      value={{
        hasUnsavedChanges,
        setHasUnsavedChanges,
        onSave,
        setOnSave,
        isSaving,
        setIsSaving,
        pendingNavigation,
        setPendingNavigation,
        showUnsavedAlert,
        setShowUnsavedAlert,
      }}
    >
      {children}
    </UnsavedChangesContext.Provider>
  );
}

export function useUnsavedChanges() {
  const context = useContext(UnsavedChangesContext);
  if (context === undefined) {
    throw new Error('useUnsavedChanges must be used within an UnsavedChangesProvider');
  }
  return context;
} 