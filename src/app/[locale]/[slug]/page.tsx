'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { cmsOperations } from '@/lib/graphql-client';
import SectionManager from '@/components/cms/SectionManager';

// Add the ComponentType type import
type ComponentType = 'Hero' | 'Text' | 'Image' | 'Feature' | 'Testimonial' | 'Header' | 'Card';

// Match the PageData type to what comes from the GraphQL client
interface PageData {
  id: string;
  title: string;
  slug: string;
  description?: string | null;
  template?: string;
  isPublished: boolean;
  pageType: string;
  locale?: string;
  metaTitle?: string | null;
  metaDescription?: string | null;
  featuredImage?: string | null;
  sections?: Array<{id: string; order?: number; data?: Record<string, unknown>}>;
}

interface SectionData {
  id: string;
  title?: string;
  order: number;
  components: Array<{
    id: string;
    type: string;
    data: Record<string, unknown>;
  }>;
}

export default function CMSPage() {
  const params = useParams();
  const slug = params.slug as string;
  const locale = params.locale as string;
  
  const [pageData, setPageData] = useState<PageData | null>(null);
  const [sections, setSections] = useState<SectionData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    async function loadPage() {
      try {
        setIsLoading(true);
        setError(null);
        console.log(`Cargando página con slug: ${slug} en locale: ${locale}`);
        
        // Fetch the page data from API
        const pageData = await cmsOperations.getPageBySlug(slug);
        
        if (!pageData) {
          console.error(`Page not found: ${slug}`);
          setError('Página no encontrada');
          return;
        }
        
        setPageData(pageData);
        console.log('Page data retrieved:', pageData);
        
        try {
          // Fetch components for each section directly instead of using getPagePreview
          const pageSections: SectionData[] = [];
          
          if (pageData.sections && pageData.sections.length > 0) {
            // Get all CMS sections first
            const allCMSSections = await cmsOperations.getAllCMSSections();
            console.log(`Obtenidas ${allCMSSections.length} secciones CMS disponibles:`, 
              allCMSSections.map(s => ({ id: s.id, sectionId: s.sectionId, name: s.name })));
            
            // Create detailed maps for lookup
            const idToSectionMap = new Map();
            const sectionIdToSectionMap = new Map();
            const idPrefixMap = new Map();
            
            // Function to strip any query parameters or hash from IDs
            const cleanId = (id: string) => id.split('?')[0].split('#')[0];
            
            // Build lookup maps
            allCMSSections.forEach(section => {
              // Store by exact id
              const cleanedId = cleanId(section.id);
              idToSectionMap.set(cleanedId, section);
              
              // Store by exact sectionId
              const cleanedSectionId = cleanId(section.sectionId);
              sectionIdToSectionMap.set(cleanedSectionId, section);
              
              // Store prefixes for fuzzy matching
              // Create prefix map for fuzzy matching (first 8 chars)
              if (cleanedId.length > 8) {
                idPrefixMap.set(cleanedId.substring(0, 8), section);
              }
              if (cleanedSectionId.length > 8) {
                idPrefixMap.set(cleanedSectionId.substring(0, 8), section);
              }
            });
            
            // Enhanced section lookup function
            const findCmsSection = (pageSection: {id: string; data?: Record<string, unknown>}): typeof allCMSSections[0] | null => {
              console.log(`🔍 Buscando CMS section para: ${pageSection.id}`);
              let foundSection = null;
              
              // Get cleaned IDs
              const sectionId = cleanId(pageSection.id);
              
              // 1. Direct ID lookups (fastest path)
              foundSection = idToSectionMap.get(sectionId);
              if (foundSection) {
                console.log(`✅ Encontrada por ID exacto: ${foundSection.name}`);
                return foundSection;
              }
              
              // 2. Check data.sectionId or data.cmsSection if available
              if (pageSection.data) {
                const data = pageSection.data as Record<string, unknown>;
                
                // Check various data field names
                const possibleIds = [
                  data.sectionId as string,
                  data.cmsSection as string,
                  data.cmsSectionId as string
                ].filter(Boolean);
                
                for (const id of possibleIds) {
                  const cleanDataId = cleanId(id);
                  foundSection = sectionIdToSectionMap.get(cleanDataId) || idToSectionMap.get(cleanDataId);
                  if (foundSection) {
                    console.log(`✅ Encontrada por data.ID: ${foundSection.name}`);
                    return foundSection;
                  }
                }
                
                // 3. Look in component data if available
                if (data.components && Array.isArray(data.components)) {
                  const components = data.components as Array<Record<string, unknown>>;
                  for (const comp of components) {
                    if (comp.sectionId) {
                      const cleanCompId = cleanId(comp.sectionId as string);
                      foundSection = sectionIdToSectionMap.get(cleanCompId);
                      if (foundSection) {
                        console.log(`✅ Encontrada por component.sectionId: ${foundSection.name}`);
                        return foundSection;
                      }
                    }
                  }
                }
              }
              
              // 4. Prefix matching for fuzzy lookups
              const sectionIdPrefix = sectionId.substring(0, Math.min(8, sectionId.length));
              foundSection = idPrefixMap.get(sectionIdPrefix);
              if (foundSection) {
                console.log(`✅ Encontrada por coincidencia de prefijo: ${foundSection.name}`);
                return foundSection;
              }
              
              // 5. Last resort: brute force substring matching
              for (const section of allCMSSections) {
                if (sectionId.includes(section.sectionId) || section.sectionId.includes(sectionId) ||
                    sectionId.includes(section.id) || section.id.includes(sectionId)) {
                  console.log(`✅ Encontrada por coincidencia parcial: ${section.name}`);
                  return section;
                }
              }
              
              // 6. If all else fails and we only have one section, use it
              if (allCMSSections.length === 1) {
                console.log(`✅ Usando la única sección disponible por defecto: ${allCMSSections[0].name}`);
                return allCMSSections[0];
              }
              
              // No match found
              console.log(`❌ No se pudo encontrar ninguna sección CMS para: ${sectionId}`);
              return null;
            };
            
            // Process sections with advanced lookup
            // Map to track which sections we've already processed
            const processedSections = new Map();
            
            for (const section of pageData.sections) {
              try {
                console.log(`\n📋 Procesando sección de página: ${section.id} (orden: ${section.order || 0})`);
                
                // Try to find matching CMS section with enhanced lookup
                const cmsSection = findCmsSection(section);
                
                if (cmsSection) {
                  // Store the mapping to avoid duplicate work
                  processedSections.set(section.id, cmsSection);
                  
                  // Fetch components for this section
                  console.log(`📥 Solicitando componentes para sección: ${cmsSection.sectionId}`);
                  try {
                    const componentResult = await cmsOperations.getSectionComponents(cmsSection.sectionId);
                    
                    if (componentResult && componentResult.components) {
                      console.log(`📦 Recibidos ${componentResult.components.length} componentes para ${cmsSection.name}`);
                      
                      pageSections.push({
                        id: section.id,
                        order: section.order || 0,
                        title: cmsSection.name || undefined,
                        components: componentResult.components
                      });
                    } else {
                      console.warn(`⚠️ No se encontraron componentes para la sección: ${cmsSection.sectionId}`);
                      pageSections.push({
                        id: section.id,
                        order: section.order || 0,
                        title: cmsSection.name || undefined,
                        components: []
                      });
                    }
                  } catch (compError) {
                    console.error(`❌ Error al cargar componentes: ${compError instanceof Error ? compError.message : String(compError)}`);
                    pageSections.push({
                      id: section.id,
                      order: section.order || 0,
                      title: cmsSection.name || undefined,
                      components: []
                    });
                  }
                } else {
                  // Emergency fallback: if we can't find a section, try ALL sections as a last resort
                  console.warn(`⚠️ Intento de emergencia: probando todas las secciones CMS para: ${section.id}`);
                  let foundComponents = false;
                  
                  for (const fallbackSection of allCMSSections) {
                    try {
                      const fallbackResult = await cmsOperations.getSectionComponents(fallbackSection.sectionId);
                      if (fallbackResult && fallbackResult.components && fallbackResult.components.length > 0) {
                        console.log(`🚨 Encontrados componentes en sección alternativa: ${fallbackSection.name}`);
                        
                        pageSections.push({
                          id: section.id,
                          order: section.order || 0,
                          title: fallbackSection.name || undefined,
                          components: fallbackResult.components
                        });
                        
                        foundComponents = true;
                        break;
                      }
                    } catch {
                      // Ignore errors during fallback attempts to try all sections
                      // We're just trying every section as a last resort
                    }
                  }
                  
                  if (!foundComponents) {
                    console.error(`❌ No se pudo encontrar ninguna sección con componentes para: ${section.id}`);
                    pageSections.push({
                      id: section.id,
                      order: section.order || 0,
                      title: `Sección ${section.order || 0}`,
                      components: []
                    });
                  }
                }
              } catch (sectionError) {
                console.error(`❌ Error al procesar sección ${section.id}:`, sectionError);
                pageSections.push({
                  id: section.id,
                  order: section.order || 0,
                  title: `Sección ${section.order || 0} (error)`,
                  components: []
                });
              }
            }
            
            // Sort sections by order
            pageSections.sort((a, b) => a.order - b.order);
            
            console.log(`📊 Resumen final: ${pageSections.length} secciones cargadas`);
            pageSections.forEach((s, i) => {
              console.log(`  ${i+1}. ${s.title || 'Sin título'} (${s.components.length} componentes)`);
            });
          }
          
          setSections(pageSections);
        } catch (sectionsError) {
          console.error('Error al cargar las secciones de la página:', sectionsError);
          setError('Error al cargar las secciones de la página');
        }
      } catch (pageError) {
        console.error('Error al cargar la página:', pageError);
        setError('Error al cargar la página');
      } finally {
        setIsLoading(false);
      }
    }
    
    loadPage();
  }, [slug, locale]);
  
  if (isLoading) {
    return (
      <div className="container mx-auto py-16 px-4 text-center">
        <div className="animate-pulse">
          <div className="h-8 w-64 bg-gray-200 rounded mx-auto mb-6"></div>
          <div className="h-4 w-full max-w-lg bg-gray-200 rounded mx-auto mb-4"></div>
          <div className="h-4 w-full max-w-md bg-gray-200 rounded mx-auto"></div>
        </div>
      </div>
    );
  }
  
  if (error || !pageData) {
    return (
      <div className="container mx-auto py-16 px-4">
        <div className="bg-red-50 border-2 border-red-200 p-6 rounded-lg text-center">
          <h1 className="text-2xl font-bold text-red-700 mb-4">Error</h1>
          <p className="text-red-600">{error || 'Hubo un error al cargar esta página. Por favor, inténtelo de nuevo más tarde.'}</p>
        </div>
      </div>
    );
  }
  
  // If page is not published
  if (!pageData.isPublished) {
    return (
      <div className="container mx-auto py-16 px-4">
        <div className="bg-amber-50 border-2 border-amber-200 p-6 rounded-lg text-center">
          <h1 className="text-2xl font-bold text-amber-700 mb-4">Vista previa</h1>
          <p className="text-amber-600 mb-2">Esta página no está publicada y solo es visible en modo vista previa.</p>
          <p className="text-amber-600">Para publicarla, vaya al CMS y cambie el estado de la página.</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="cms-page flex flex-col min-h-screen">
      {/* Banner for unpublished pages in preview mode */}
      {!pageData.isPublished && (
        <div className="bg-amber-500 text-white py-2 px-4 text-center">
          Vista previa - Esta página no está publicada
        </div>
      )}
      
      {/* Page content with sections */}
      <main className="flex-1 flex flex-col">
        {sections.length > 0 ? (
          <>
            {sections.map((section) => (
              <div key={section.id} className="cms-section w-full" data-section-id={section.id} data-section-title={section.title}>
                {section.components.length > 0 ? (
                  <SectionManager 
                    initialComponents={section.components.map(comp => ({
                      id: comp.id,
                      type: comp.type as ComponentType, // Cast string to ComponentType
                      data: comp.data || {}
                    }))}
                    isEditing={false}
                  />
                ) : (
                  <div className="py-8 text-center bg-gray-50 rounded-lg border border-dashed border-gray-300 my-4">
                    <p className="text-gray-600">Esta sección no tiene componentes disponibles.</p>
                  </div>
                )}
              </div>
            ))}
          </>
        ) : (
          <div className="container mx-auto py-16 px-4 text-center">
            <h1 className="text-3xl font-bold mb-4">{pageData.title}</h1>
            <p className="text-gray-500">Esta página no tiene secciones.</p>
          </div>
        )}
      </main>
    </div>
  );
}
