'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { cmsOperations, PageData } from '@/lib/graphql-client';
import { 
  Loader2Icon, 
  AlertCircleIcon,
  FileTextIcon 
} from 'lucide-react';
import ManageableSection from '@/components/cms/ManageableSection';

export default function PublicPage() {
  const params = useParams();
  const { locale, slug } = params;
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pageData, setPageData] = useState<PageData | null>(null);
  const [sectionIds, setSectionIds] = useState<string[]>([]);

  // Load page data
  useEffect(() => {
    const loadPage = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        console.log(`⏳ INICIO CARGA: Página con slug: '${slug}'`);
        
        // Normalize slug
        const normalizedSlug = String(slug).trim();
        const page = await cmsOperations.getPageBySlug(normalizedSlug);
        
        if (!page) {
          console.error(`❌ ERROR: Página no encontrada con slug '${normalizedSlug}'`);
          setError('Página no encontrada');
          setIsLoading(false);
          return;
        }
        
        console.log(`✅ Página encontrada: "${page.title}" (ID: ${page.id})`);
        console.log(`📊 Datos de página:`, {
          title: page.title,
          slug: page.slug,
          template: page.template,
          sections: Array.isArray(page.sections) ? page.sections.length : 'no es array'
        });
        
        setPageData(page);
        
        // Extract section IDs from the page data
        if (page.sections && Array.isArray(page.sections)) {
          // Handle both string[] and object[] formats for sections
          const ids = page.sections.map(section => {
            if (typeof section === 'string') {
              return section;
            } else if (typeof section === 'object' && section !== null) {
              return section.id;
            }
            return null;
          }).filter(Boolean) as string[];
          
          console.log(`✅ Extraídos ${ids.length} IDs de secciones:`, ids);
          setSectionIds(ids);
        } else {
          console.log('⚠️ La página no tiene secciones');
          setSectionIds([]);
        }
      } catch (error) {
        console.error('❌ ERROR al cargar la página:', error);
        setError(error instanceof Error ? error.message : 'Error al cargar la página');
      } finally {
        setIsLoading(false);
      }
    };

    if (slug) {
      loadPage();
    } else {
      setError('URL inválida');
      setIsLoading(false);
    }
  }, [slug]);

  // Display loading state
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen py-12">
        <Loader2Icon className="h-12 w-12 animate-spin text-blue-500 mb-4" />
        <h2 className="text-xl font-medium text-gray-700">Cargando página...</h2>
      </div>
    );
  }

  // Display error state
  if (error || !pageData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen py-12">
        <div className="max-w-lg w-full bg-white p-8 rounded-lg shadow-md">
          <div className="flex items-center justify-center mb-6">
            <AlertCircleIcon className="h-12 w-12 text-red-500" />
          </div>
          <h1 className="text-2xl font-bold text-center text-gray-900 mb-4">
            {error || 'La página no se encuentra disponible'}
          </h1>
          <p className="text-center text-gray-600 mb-6">
            Lo sentimos, no se pudo cargar la página solicitada.
          </p>
          <div className="flex justify-center">
            <a 
              href={`/${locale}`}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Volver al inicio
            </a>
          </div>
        </div>
      </div>
    );
  }

  // Get template class based on the page template
  const getTemplateClass = (template: string = 'default') => {
    switch (template) {
      case 'full-width':
        return 'max-w-full';
      case 'sidebar':
        return 'max-w-7xl grid grid-cols-1 lg:grid-cols-4 gap-8';
      case 'landing':
        return 'max-w-full px-0';
      default:
        return 'max-w-4xl';
    }
  };

  // Determine if the page has a sidebar
  const hasSidebar = pageData.template === 'sidebar';

  // Render page
  return (
    <div className="min-h-screen">
      {/* Page content */}
      <main className={`mx-auto px-4 py-8 ${getTemplateClass(pageData.template)}`}>
        {/* Page header - only shown for non-landing pages */}
        {pageData.template !== 'landing' && (
          <header className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">{pageData.title}</h1>
            {pageData.description && (
              <p className="mt-2 text-xl text-gray-600">{pageData.description}</p>
            )}
          </header>
        )}

        {/* Debug information */}
        <div className="mb-4 p-4 bg-blue-50 rounded-md text-xs text-blue-800 font-mono">
          <p>📄 Página: {pageData.title} ({pageData.id})</p>
          <p>🔢 Secciones: {sectionIds.length}</p>
          <p>🧩 IDs: {sectionIds.join(', ') || 'ninguna'}</p>
        </div>

        {/* Page content with optional sidebar */}
        {hasSidebar ? (
          <>
            {/* Main content */}
            <div className="col-span-1 lg:col-span-3">
              {sectionIds.length > 0 ? (
                sectionIds.map((sectionId, index) => (
                  <div key={sectionId} className="mb-8 border border-gray-200 rounded-lg p-4">
                    <div className="mb-2 text-xs text-gray-500 p-1 bg-gray-50 rounded">
                      ID Sección #{index + 1}: {sectionId}
                    </div>
                    <ManageableSection
                      sectionId={sectionId}
                      isEditing={false}
                      autoSave={false}
                    />
                  </div>
                ))
              ) : (
                <div className="py-12 text-center bg-gray-50 rounded-lg border border-dashed border-gray-300">
                  <FileTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-1">No hay contenido</h3>
                  <p className="text-gray-500">Esta página no tiene secciones de contenido todavía.</p>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="col-span-1 space-y-6">
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <h3 className="font-medium text-gray-900 mb-2">Sidebar</h3>
                <p className="text-sm text-gray-600">Contenido adicional o navegación puede ir aquí.</p>
              </div>
            </div>
          </>
        ) : (
          /* Regular content layout */
          <div>
            {sectionIds.length > 0 ? (
              sectionIds.map((sectionId, index) => (
                <div key={sectionId} className="mb-8 border border-gray-200 rounded-lg p-4">
                  <div className="mb-2 text-xs text-gray-500 p-1 bg-gray-50 rounded">
                    ID Sección #{index + 1}: {sectionId}
                  </div>
                  <ManageableSection
                    sectionId={sectionId}
                    isEditing={false}
                    autoSave={false}
                  />
                </div>
              ))
            ) : (
              <div className="py-12 text-center bg-gray-50 rounded-lg border border-dashed border-gray-300">
                <FileTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-1">No hay contenido</h3>
                <p className="text-gray-500">Esta página no tiene secciones de contenido todavía.</p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
