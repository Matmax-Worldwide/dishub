'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import { cmsOperations } from '@/lib/graphql-client';
import SectionManager from '@/components/cms/SectionManager';
import { Loader2Icon, AlertCircle, AlertTriangle } from 'lucide-react';

// Add the ComponentType type import
type ComponentType = 'Hero' | 'Text' | 'Image' | 'Feature' | 'Testimonial' | 'Header' | 'Card' | 'Benefit';

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
  const [activeSection, setActiveSection] = useState(0);
  const sectionRefs = useRef<(HTMLElement | null)[]>([]);
  const isScrolling = useRef<boolean>(false);
  
  // Set up smooth scroll effect if needed
  useEffect(() => {
    if (!pageData || pageData.pageType !== 'LANDING' || sections.length === 0) {
      // Reset any scroll behavior if not using smooth scroll
      document.body.style.overflow = '';
      return;
    }
    
    // Reset scroll position when the page loads
    window.scrollTo(0, 0);
    
    const handleResize = () => {
      // Adjust any height-based calculations if needed
      const vh = window.innerHeight;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    };
    
    // Call once on mount
    handleResize();
    
    // Add resize listener
    window.addEventListener('resize', handleResize);
    
    // Add indicators based on scroll position
    const handleScroll = () => {
      // Get all section elements
      const sectionElements = Array.from(document.querySelectorAll('section[data-section-id]'));
      
      // Calculate the viewport height
      const viewportHeight = window.innerHeight;
      
      // Determine which section is most visible in the viewport
      let currentSection = 0;
      let maxVisibility = 0;
      
      sectionElements.forEach((section, index) => {
        const rect = section.getBoundingClientRect();
        
        // Calculate how much of the section is visible in the viewport
        const visibleHeight = Math.min(
          rect.bottom, 
          viewportHeight
        ) - Math.max(rect.top, 0);
        
        // If this section has more visible area than previous max, select it
        if (visibleHeight > maxVisibility) {
          maxVisibility = visibleHeight;
          currentSection = index;
        }
      });
      
      if (!isScrolling.current) {
        setActiveSection(currentSection);
      }
    };
    
    window.addEventListener('scroll', handleScroll);
    
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
    };
  }, [pageData, sections.length]);
  
  // Scroll to active section when it changes
  useEffect(() => {
    if (pageData?.pageType === 'LANDING') {
      // Make sure we're not already scrolling
      if (isScrolling.current) return;
      isScrolling.current = true;
      
      // Find components rather than sections
      const componentElements = document.querySelectorAll('[data-component-type]');
      
      if (componentElements && componentElements.length > activeSection) {
        const component = componentElements[activeSection];
        
        // Scroll to the component with smooth behavior
        component.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
      
      // Reset the scrolling flag after animation completes
      setTimeout(() => {
        isScrolling.current = false;
      }, 1000);
    }
  }, [activeSection, pageData?.pageType]);
  
  // Add keyboard navigation
  useEffect(() => {
    if (!pageData || pageData.pageType !== 'LANDING' || sections.length === 0) {
      return;
    }
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isScrolling.current) return;
      
      if ((e.key === 'ArrowDown' || e.key === 'PageDown') && activeSection < sections.length - 1) {
        isScrolling.current = true;
        setActiveSection(prev => Math.min(prev + 1, sections.length - 1));
        setTimeout(() => { isScrolling.current = false; }, 800);
      } else if ((e.key === 'ArrowUp' || e.key === 'PageUp') && activeSection > 0) {
        isScrolling.current = true;
        setActiveSection(prev => Math.max(prev - 1, 0));
        setTimeout(() => { isScrolling.current = false; }, 800);
      } else if (e.key === 'Home') {
        isScrolling.current = true;
        setActiveSection(0);
        setTimeout(() => { isScrolling.current = false; }, 800);
      } else if (e.key === 'End') {
        isScrolling.current = true;
        setActiveSection(sections.length - 1);
        setTimeout(() => { isScrolling.current = false; }, 800);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [pageData, sections.length, activeSection]);
  
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
      <div className="container mx-auto py-16 px-4 flex flex-col items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center">
          <Loader2Icon className="h-12 w-12 text-muted-foreground/60 animate-spin mb-4" />
          <h2 className="text-xl font-medium text-foreground">Cargando página</h2>
          <p className="text-muted-foreground mt-2">Por favor espere mientras cargamos el contenido</p>
        </div>
      </div>
    );
  }
  
  if (error || !pageData) {
    return (
      <div className="container mx-auto py-16 px-4">
        <div className="bg-destructive/5 border border-destructive/20 p-6 rounded-lg text-center max-w-2xl mx-auto">
          <div className="flex justify-center mb-4">
            <AlertCircle className="h-12 w-12 text-destructive" />
          </div>
          <h1 className="text-2xl font-semibold text-destructive mb-3">Error</h1>
          <p className="text-destructive-foreground">{error || 'Hubo un error al cargar esta página. Por favor, inténtelo de nuevo más tarde.'}</p>
        </div>
      </div>
    );
  }
  
  // If page is not published
  if (!pageData.isPublished) {
    return (
      <div className="container mx-auto py-16 px-4">
        <div className="bg-warning/5 border border-warning/20 p-6 rounded-lg text-center max-w-2xl mx-auto">
          <div className="flex justify-center mb-4">
            <AlertTriangle className="h-12 w-12 text-warning" />
          </div>
          <h1 className="text-2xl font-semibold text-warning-foreground mb-3">Vista previa</h1>
          <p className="text-warning-foreground/90 mb-2">Esta página no está publicada y solo es visible en modo vista previa.</p>
          <p className="text-warning-foreground/90">Para publicarla, vaya al CMS y cambie el estado de la página.</p>
        </div>
      </div>
    );
  }
  
  // Function to convert component type to proper case for SectionManager
  const formatComponentType = (type: string): ComponentType => {
    // Convert types like 'hero', 'text', etc. to 'Hero', 'Text', etc.
    const lowercaseType = type.toLowerCase();
    // Handle special cases for our custom types
    if (lowercaseType === 'benefit' || lowercaseType === 'benefits') {
      return 'Benefit' as ComponentType;
    }
    return (lowercaseType.charAt(0).toUpperCase() + lowercaseType.slice(1)) as ComponentType;
  };
  
  // Apply section styles
  const sectionClassName = pageData?.pageType === 'LANDING' 
    ? "w-full snap-start" // La sección tendrá el ancho completo pero no altura fija
    : "cms-section w-full";
    
  // Apply container style for smooth scroll
  const containerClassName = pageData?.pageType === 'LANDING'
    ? "w-full overflow-x-hidden scroll-smooth"
    : "flex-1 flex flex-col";
    
  // Return the component
  return (
    <div className="cms-page">
      {/* Banner for unpublished pages in preview mode */}
      {!pageData.isPublished && (
        <div className="bg-warning text-white py-2 px-4 text-center">
          Vista previa - Esta página no está publicada
        </div>
      )}
      
      {/* Page content with sections */}
      <main className={containerClassName}>
        {sections.length > 0 ? (
          <>
            {sections.map((section, index) => (
              <div 
                key={section.id} 
                className={sectionClassName}
                data-section-id={section.id} 
                data-section-title={section.title}
                id={`section-${index}`}
                ref={(el: HTMLElement | null) => {
                  if (el) sectionRefs.current[index] = el;
                }}
              >
                {section.components.length > 0 ? (
                  <SectionManager 
                    initialComponents={section.components.map(comp => ({
                      id: comp.id,
                      // Convert component types like 'hero' to 'Hero' for SectionManager
                      type: formatComponentType(comp.type),
                      data: comp.data || {}
                    }))}
                    isEditing={false}
                  />
                ) : (
                  <div className="py-8 text-center bg-accent/5 rounded-lg border border-dashed border-muted my-4 max-w-5xl mx-auto">
                    <p className="text-muted-foreground">Esta sección no tiene componentes disponibles.</p>
                  </div>
                )}
              </div>
            ))}
          </>
        ) : (
          <div className="container mx-auto py-16 px-4 text-center">
            <h1 className="text-3xl font-bold mb-4">{pageData.title}</h1>
            <p className="text-muted-foreground">Esta página no tiene secciones.</p>
          </div>
        )}
      </main>
    </div>
  );
}
