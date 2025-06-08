'use client';

import { useState } from 'react';
import { HelpCircle, RefreshCw, X } from 'lucide-react';

export const CacheHelpButton = () => {
  const [isOpen, setIsOpen] = useState(false);

  const getRefreshInstructions = () => {
    const userAgent = navigator.userAgent;
    const isMac = /Mac|iPhone|iPad|iPod/.test(userAgent);
    return isMac ? 'Cmd + Shift + R' : 'Ctrl + Shift + R';
  };

  const handleClearCache = () => {
    // Clear caches
    if ('caches' in window) {
      caches.keys().then(names => {
        names.forEach(name => caches.delete(name));
      });
    }

    // Clear relevant localStorage
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('s3-cache-') || key.startsWith('media-cache-')) {
        localStorage.removeItem(key);
      }
    });

    // Reload page
    window.location.reload();
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 z-40 bg-blue-500 hover:bg-blue-600 text-white p-3 rounded-full shadow-lg transition-colors"
        title="Ayuda con problemas de caché"
      >
        <HelpCircle className="h-5 w-5" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-40 bg-white border border-gray-200 rounded-lg shadow-lg p-4 max-w-sm">
      <div className="flex items-start justify-between mb-3">
        <h3 className="text-sm font-medium text-gray-900">Problemas de caché</h3>
        <button
          onClick={() => setIsOpen(false)}
          className="text-gray-400 hover:text-gray-600"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      
      <div className="text-sm text-gray-600 space-y-2">
        <p>Si los archivos no cargan correctamente:</p>
        
        <div className="bg-gray-50 p-2 rounded text-xs">
          <p className="font-medium mb-1">Soluciones rápidas:</p>
          <ul className="space-y-1">
            <li>• Presiona <kbd className="bg-gray-200 px-1 rounded">{getRefreshInstructions()}</kbd></li>
            <li>• Usa modo incógnito</li>
            <li>• Limpia caché del navegador</li>
          </ul>
        </div>

        <button
          onClick={handleClearCache}
          className="w-full flex items-center justify-center px-3 py-2 bg-blue-500 text-white text-xs rounded hover:bg-blue-600 transition-colors"
        >
          <RefreshCw className="h-3 w-3 mr-1" />
          Limpiar caché y recargar
        </button>
      </div>
    </div>
  );
}; 