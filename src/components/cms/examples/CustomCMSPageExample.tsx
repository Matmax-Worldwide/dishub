'use client';

import { useState } from 'react';
import CMSPageRenderer from '@/components/cms/CMSPageRenderer';
import { PageData } from '@/hooks/useCMSPage';
import { Loader2, AlertCircle } from 'lucide-react';

interface CustomCMSPageExampleProps {
  slug?: string;
  locale?: string;
  showAnalytics?: boolean;
}

export default function CustomCMSPageExample({ 
  slug, 
  locale, 
  showAnalytics = false 
}: CustomCMSPageExampleProps) {
  const [pageInfo, setPageInfo] = useState<PageData | null>(null);
  const [loadTime, setLoadTime] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handlePageLoad = (pageData: PageData) => {
    setPageInfo(pageData);
    setLoadTime(Date.now());
    console.log('📄 Página cargada:', pageData.title);
    
    // Aquí podrías enviar analytics, actualizar el título de la página, etc.
    if (typeof window !== 'undefined') {
      document.title = pageData.metaTitle || pageData.title;
      
      if (pageData.metaDescription) {
        const metaDescription = document.querySelector('meta[name="description"]');
        if (metaDescription) {
          metaDescription.setAttribute('content', pageData.metaDescription);
        }
      }
    }
  };

  const handleError = (error: string) => {
    setErrorMessage(error);
    console.error('❌ Error en la página:', error);
    
    // Aquí podrías enviar el error a un servicio de monitoreo
    // trackError('cms_page_error', { error, slug, locale });
  };

  const customLoader = (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="text-center">
        <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-800 mb-2">Cargando experiencia personalizada</h2>
        <p className="text-gray-600">Preparando el contenido para ti...</p>
      </div>
    </div>
  );

  const customErrorComponent = (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-red-50 to-pink-100">
      <div className="text-center max-w-md mx-auto p-8">
        <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-800 mb-4">¡Oops! Algo salió mal</h2>
        <p className="text-gray-600 mb-6">{errorMessage || 'No pudimos cargar esta página.'}</p>
        <button 
          onClick={() => window.location.reload()}
          className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-lg transition-colors"
        >
          Intentar de nuevo
        </button>
      </div>
    </div>
  );

  return (
    <div className="relative">
      {/* Analytics Panel (opcional) */}
      {showAnalytics && pageInfo && (
        <div className="fixed top-4 left-4 bg-white/90 backdrop-blur-sm border border-gray-200 rounded-lg p-4 shadow-lg z-50 max-w-xs">
          <h3 className="font-semibold text-sm text-gray-800 mb-2">📊 Info de la página</h3>
          <div className="space-y-1 text-xs text-gray-600">
            <div><strong>Título:</strong> {pageInfo.title}</div>
            <div><strong>Tipo:</strong> {pageInfo.pageType}</div>
            <div><strong>Publicada:</strong> {pageInfo.isPublished ? '✅' : '❌'}</div>
            {loadTime && (
              <div><strong>Cargada:</strong> {new Date(loadTime).toLocaleTimeString()}</div>
            )}
          </div>
        </div>
      )}

      {/* Componente CMS Headless */}
      <CMSPageRenderer
        slug={slug}
        locale={locale}
        enablePreloading={true}
        enableSmoothScroll={true}
        className="custom-cms-page"
        onPageLoad={handlePageLoad}
        onError={handleError}
        customLoader={customLoader}
        customErrorComponent={customErrorComponent}
      />
    </div>
  );
} 