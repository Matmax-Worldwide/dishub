import { useEffect } from 'react';
import { useTabContext } from '@/app/[locale]/cms/pages/layout';

/**
 * Hook para sincronizar un estado local de tabs con el contexto global de tabs
 */
export function useSyncTabState(localTab: string, setLocalTab: (tab: string) => void) {
  const { activeTab: contextTab, setActiveTab: setContextTab } = useTabContext();

  // Sincronizar cambios locales al contexto global
  useEffect(() => {
    if (localTab !== contextTab) {
      setContextTab(localTab);
    }
  }, [localTab, contextTab, setContextTab]);

  // Sincronizar cambios del contexto global al estado local
  useEffect(() => {
    if (contextTab !== localTab) {
      setLocalTab(contextTab);
    }
  }, [contextTab, localTab, setLocalTab]);
} 