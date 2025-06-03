'use client';

import { useState, useEffect } from 'react';
import { AlertTriangle, RefreshCw, X } from 'lucide-react';
import { useCacheDetection } from '@/hooks/useCacheDetection';

interface CacheWarningProps {
  onDismiss?: () => void;
  showRefreshButton?: boolean;
}

export const CacheWarning = ({ onDismiss, showRefreshButton = true }: CacheWarningProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const { hasCacheIssues, dismissIssue, forceRefresh } = useCacheDetection();

  useEffect(() => {
    // Check if we should show cache warning
    const checkCacheIssues = () => {
      const now = Date.now();
      const lastCheck = localStorage.getItem('lastCacheCheck');
      const cacheWarningDismissed = localStorage.getItem('cacheWarningDismissed');
      
      // Show warning if:
      // 1. Cache issues detected, or
      // 2. Never checked before, or
      // 3. Last check was more than 1 hour ago, or
      // 4. User hasn't dismissed it in the last 24 hours
      const shouldShow = hasCacheIssues ||
                        !lastCheck || 
                        (now - parseInt(lastCheck)) > 3600000 || // 1 hour
                        !cacheWarningDismissed ||
                        (now - parseInt(cacheWarningDismissed)) > 86400000; // 24 hours

      if (shouldShow) {
        setIsVisible(true);
        localStorage.setItem('lastCacheCheck', now.toString());
      }
    };

    // Check on component mount
    checkCacheIssues();

    // Also check when the page becomes visible again (user switches tabs)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        checkCacheIssues();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [hasCacheIssues]);

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem('cacheWarningDismissed', Date.now().toString());
    dismissIssue();
    onDismiss?.();
  };

  const handleRefresh = () => {
    forceRefresh();
  };

  const getRefreshInstructions = () => {
    const userAgent = navigator.userAgent;
    const isMac = /Mac|iPhone|iPad|iPod/.test(userAgent);

    if (isMac) {
      return 'Cmd + Shift + R';
    } else {
      return 'Ctrl + Shift + R';
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed top-4 right-4 z-50 max-w-md bg-yellow-50 border border-yellow-200 rounded-lg shadow-lg p-4">
      <div className="flex items-start space-x-3">
        <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <h3 className="text-sm font-medium text-yellow-800">
            {hasCacheIssues ? '⚠️ Problema de caché detectado' : '¿Problemas visualizando archivos?'}
          </h3>
          <div className="mt-2 text-sm text-yellow-700">
            <p className="mb-2">
              {hasCacheIssues 
                ? 'Se detectaron errores al cargar archivos. Esto suele deberse a problemas de caché del navegador.'
                : 'Si ves controles de video vacíos o archivos que no cargan correctamente, puede ser un problema de caché del navegador.'
              }
            </p>
            <div className="space-y-1">
              <p><strong>Soluciones rápidas:</strong></p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Presiona <kbd className="px-1 py-0.5 bg-yellow-100 rounded text-xs font-mono">{getRefreshInstructions()}</kbd> para recargar sin caché</li>
                <li>Abre una ventana de incógnito/privada</li>
                <li>Limpia la caché del navegador en Configuración</li>
              </ul>
            </div>
          </div>
          {showRefreshButton && (
            <div className="mt-3 flex space-x-2">
              <button
                onClick={handleRefresh}
                className="inline-flex items-center px-3 py-1.5 border border-yellow-300 text-xs font-medium rounded text-yellow-700 bg-yellow-100 hover:bg-yellow-200 focus:outline-none focus:ring-2 focus:ring-yellow-500"
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                Limpiar caché y recargar
              </button>
            </div>
          )}
        </div>
        <button
          onClick={handleDismiss}
          className="flex-shrink-0 text-yellow-400 hover:text-yellow-600"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

export default CacheWarning; 