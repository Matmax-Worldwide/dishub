'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import { cmsOperations } from '@/lib/graphql-client';
import SectionManager from '@/components/cms/SectionManager';
import { Loader2Icon, AlertCircle, AlertTriangle } from 'lucide-react';
import NavigationHeader from '@/components/Navigation/NavigationHeader';
import Sidebar from '@/components/Navigation/Sidebar';
import Footer from '@/components/Navigation/Footer';
import { Menu } from '@/app/api/graphql/types';

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
  scrollType?: 'normal' | 'smooth';
  metaTitle?: string | null;
  metaDescription?: string | null;
  featuredImage?: string | null;
  sections?: Array<{id: string; sectionId: string; order?: number; name?: string}>;
}

// Define section data type for rendering
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
  const [menus, setMenus] = useState<Menu[]>([]);
  const sectionRefs = useRef<(HTMLElement | null)[]>([]);
  const isScrolling = useRef<boolean>(false);
  
  // Load menus for the page
  useEffect(() => {
    async function loadMenus() {
      try {
        const menusData = await cmsOperations.getMenus();
        if (Array.isArray(menusData)) {
          setMenus(menusData as Menu[]);
        }
      } catch (error) {
        console.error('Error loading menus:', error);
      }
    }
    
    loadMenus();
  }, []);
  
  // Set up smooth scroll effect if needed
  useEffect(() => {
    if (!pageData || pageData.pageType !== 'LANDING' || sections.length === 0) {
      // Reset any scroll behavior if not using smooth scroll
      document.body.style.overflow = '';
      return;
    }
    
    // Reset scroll position when the page loads
    window.scrollTo(0, 0);
    
    // Initialize component index tracking
    let activeComponentIndex = 0;
    
    // Create a map of all component elements for navigation
    const componentElementsMap = new Map();
    
    // Collect all TikTok-style scrollable components (Hero, Benefit)
    const updateComponentsMap = () => {
      // Clear the map first
      componentElementsMap.clear();
      
      // Find all component elements and map them
      let index = 0;
      
      // For each section, find its components
      sections.forEach((section, sectionIndex) => {
        const sectionElement = document.getElementById(`section-${sectionIndex}`);
        if (!sectionElement) return;
        
        // Get all components in this section
        const componentElements = Array.from(sectionElement.querySelectorAll('[data-component-type]'));
        
        // Filter and keep only full-height components (Hero and Benefit)
        const scrollableComponents = componentElements.filter(comp => {
          const type = comp.getAttribute('data-component-type')?.toLowerCase();
          return type === 'hero' || type === 'benefit';
        });
        
        // Add them to our map
        scrollableComponents.forEach(comp => {
          componentElementsMap.set(index, comp);
          index++;
        });
      });
      
      return index; // Return total count
    };
    
    // Set up the initial component map
    const totalComponents = updateComponentsMap();
    
    // Handle wheel event to precisely control scrolling component by component
    const handleWheel = (e: WheelEvent) => {
      // Don't interrupt an ongoing scroll
      if (isScrolling.current) {
        e.preventDefault();
        return;
      }
      
      // Determine scroll direction
      const isScrollingDown = e.deltaY > 0;
      
      // Only respond to significant scroll movements
      // This prevents accidental scrolling with trackpads
      if (Math.abs(e.deltaY) < 10) return;
      
      // Calculate the target component
      const targetComponentIndex = isScrollingDown
        ? Math.min(activeComponentIndex + 1, totalComponents - 1)
        : Math.max(activeComponentIndex - 1, 0);
      
      // Only do something if we're actually moving to a different component
      if (targetComponentIndex !== activeComponentIndex) {
        // Prevent default scrolling
        e.preventDefault();
        
        // Mark that we're in a scrolling transition
        isScrolling.current = true;
        
        // Get the target component element
        const targetElement = componentElementsMap.get(targetComponentIndex);
        
        if (targetElement) {
          // Scroll to the component with smooth behavior
          targetElement.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          });
          
          // Update active component index
          activeComponentIndex = targetComponentIndex;
        }
        
        // Reset scrolling flag after animation completes
        setTimeout(() => {
          isScrolling.current = false;
        }, 1000);
      }
    };
    
    // Add wheel event listener with passive: false to allow preventDefault
    window.addEventListener('wheel', handleWheel, { passive: false });
    
    // Add resize handler to update the component map if the layout changes
    const handleResize = () => {
      // Adjust any height-based calculations
      const vh = window.innerHeight;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
      
      // Rebuild the component map in case anything changed
      updateComponentsMap();
    };
    
    // Initial call
    handleResize();
    
    // Add resize listener
    window.addEventListener('resize', handleResize);
    
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('resize', handleResize);
    };
  }, [pageData, sections.length]);
  
  // Scroll to active section when it changes
  useEffect(() => {
    if (pageData?.pageType === 'LANDING') {
      // Make sure we're not already scrolling
      if (isScrolling.current) return;
      isScrolling.current = true;
      
      // Find the section by ID
      const sectionElement = document.getElementById(`section-${activeSection}`);
      
      if (sectionElement) {
        // Scroll to the section with smooth behavior
        sectionElement.scrollIntoView({
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
        const nextSection = document.getElementById(`section-${activeSection + 1}`);
        if (nextSection) {
          nextSection.scrollIntoView({ behavior: 'smooth' });
          setActiveSection(prev => Math.min(prev + 1, sections.length - 1));
        }
        setTimeout(() => { isScrolling.current = false; }, 800);
      } else if ((e.key === 'ArrowUp' || e.key === 'PageUp') && activeSection > 0) {
        isScrolling.current = true;
        const prevSection = document.getElementById(`section-${activeSection - 1}`);
        if (prevSection) {
          prevSection.scrollIntoView({ behavior: 'smooth' });
          setActiveSection(prev => Math.max(prev - 1, 0));
        }
        setTimeout(() => { isScrolling.current = false; }, 800);
      } else if (e.key === 'Home') {
        isScrolling.current = true;
        const firstSection = document.getElementById('section-0');
        if (firstSection) {
          firstSection.scrollIntoView({ behavior: 'smooth' });
          setActiveSection(0);
        }
        setTimeout(() => { isScrolling.current = false; }, 800);
      } else if (e.key === 'End') {
        isScrolling.current = true;
        const lastSection = document.getElementById(`section-${sections.length - 1}`);
        if (lastSection) {
          lastSection.scrollIntoView({ behavior: 'smooth' });
          setActiveSection(sections.length - 1);
        }
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
        
        // Use type assertion to handle type mismatch
        setPageData(pageData as unknown as PageData);
        console.log('Page data retrieved:', pageData);
        
        try {
          // Create array to store section data for rendering
          const pageSectionsData: SectionData[] = [];
          
          if (pageData.sections && pageData.sections.length > 0) {
            console.log(`Procesando ${pageData.sections.length} secciones`);
            
            // Process each section
            for (const section of pageData.sections) {
              try {
                console.log(`Cargando componentes para sección: ${section.sectionId}`);
                
                // Load components for this section from the CMS
                const componentResult = await cmsOperations.getSectionComponents(section.sectionId);
                
                if (componentResult && componentResult.components) {
                  console.log(`Recibidos ${componentResult.components.length} componentes para ${section.name || section.id}`);
                  
                  // Add section with its components to our rendering data
                  pageSectionsData.push({
                    id: section.id,
                    order: section.order || 0,
                    title: section.name,
                    components: componentResult.components
                  });
                } else {
                  console.warn(`No se encontraron componentes para la sección: ${section.sectionId}`);
                  pageSectionsData.push({
                    id: section.id,
                    order: section.order || 0,
                    title: section.name,
                    components: []
                  });
                }
              } catch (error) {
                console.error(`Error al cargar componentes para sección ${section.id}:`, error);
                // Still add the section, but with empty components
                pageSectionsData.push({
                  id: section.id,
                  order: section.order || 0,
                  title: section.name,
                  components: []
                });
              }
            }
            
            // Sort sections by order
            pageSectionsData.sort((a, b) => a.order - b.order);
            
            // Log summary
            console.log(`${pageSectionsData.length} secciones procesadas y ordenadas`);
          }
          
          setSections(pageSectionsData);
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
  
  // Apply section styles - for LANDING, make the section a container for scroll snapping
  const sectionClassName = pageData?.pageType === 'LANDING' 
    ? "w-full h-auto flex flex-col items-center justify-start overflow-hidden" // Allow height to accommodate all components
    : "cms-section w-full";
    
  // Apply container style for smooth scroll
  const containerClassName = pageData?.pageType === 'LANDING'
    ? "w-full h-screen overflow-x-hidden overflow-y-auto scroll-smooth snap-y snap-mandatory"
    : "flex-1 flex flex-col";
    
  // Return the component
  return (
    <div className="cms-page">
      {/* Add spacer for fixed header */}
      <div className="h-[4rem]"></div>
      
      {/* Header Menu + Section Header components */}
      {sections.some(section => 
        section.components.some(comp => comp.type.toLowerCase() === 'header')
      ) ? (
        // If we have Header components in sections, they will be rendered by SectionManager
        // We still need a spacer if any Header is fixed
        sections.some(section => 
          section.components.some(comp => 
            comp.type.toLowerCase() === 'header' && 
            (comp.data?.transparentHeader === true || comp.data?.transparentHeader === 'true')
          )
        ) && <div className="h-16"></div>
      ) : (
        // Otherwise, use the menu directly for navigation
        <>
          {menus.filter(menu => menu.location === 'HEADER').map((menu) => (
            <NavigationHeader 
              key={menu.id}
              menu={menu as Menu}
              // Find sections with Header components to extract logo and subtitle if available
              logoUrl={sections.flatMap(section => 
                section.components.filter(comp => 
                  comp.type.toLowerCase() === 'header' && comp.data?.logoUrl
                ).map(comp => comp.data.logoUrl as string)
              )[0] || ''}
              subtitle={sections.flatMap(section => 
                section.components.filter(comp => 
                  comp.type.toLowerCase() === 'header' && comp.data?.subtitle
                ).map(comp => comp.data.subtitle as string)
              )[0] || ''}
            />
          ))}

          {/* Spacer for fixed headers from menus */}
          {menus.some(menu => 
            menu.location === 'HEADER' && 
            (menu.headerStyle?.transparentHeader)
          ) && (
            <div className="h-16"></div>
          )}
        </>
      )}

      {/* Sidebar Menu */}
      {menus.filter(menu => menu.location === 'SIDEBAR').map((menu) => (
        <Sidebar
          key={menu.id}
          menu={menu as Menu}
          // Find sections with Header components to extract logo and subtitle if available
          logoUrl={sections.flatMap(section => 
            section.components.filter(comp => 
              comp.type.toLowerCase() === 'header' && comp.data?.logoUrl
            ).map(comp => comp.data.logoUrl as string)
          )[0] || ''}
        />
      ))}

      {/* Banner for unpublished pages in preview mode */}
      {!pageData?.isPublished && (
        <div className="bg-warning text-white py-2 px-4 text-center">
          Vista previa - Esta página no está publicada
        </div>
      )}
      
      {/* Page content with sections */}
      <main className={containerClassName}>
        {sections.length > 0 ? (
          <>
            {/* Section Navigation Indicators for LANDING pages */}
            {pageData.pageType === 'LANDING' && sections.length > 1 && (
              <div className="fixed right-5 top-1/2 transform -translate-y-1/2 z-50 flex flex-col gap-2">
                {sections.map((section, index) => (
                  <button
                    key={`nav-${section.id}`}
                    className={`w-3 h-3 rounded-full transition-all duration-300 ${
                      activeSection === index 
                        ? 'bg-primary w-4 h-4' 
                        : 'bg-gray-300 hover:bg-gray-400'
                    }`}
                    aria-label={`Navigate to section ${index + 1}`}
                    onClick={() => {
                      isScrolling.current = true;
                      const targetSection = document.getElementById(`section-${index}`);
                      if (targetSection) {
                        targetSection.scrollIntoView({ behavior: 'smooth' });
                        setActiveSection(index);
                      }
                      setTimeout(() => { isScrolling.current = false; }, 800);
                    }}
                  />
                ))}
              </div>
            )}

            {sections.map((section, index) => {
              // Check if this section contains a fixed Header component
              const hasFixedHeader = section.components.some(comp => 
                comp.type.toLowerCase() === 'header' && 
                (comp.data?.transparentHeader === true || comp.data?.transparentHeader === 'true')
              );
              
              // Find Header components in this section
              const headerComponents = section.components.filter(comp => 
                comp.type.toLowerCase() === 'header'
              );
              
              // For Header components, make sure they have the menu information
              if (headerComponents.length > 0) {
                headerComponents.forEach(header => {
                  // If the header has a menuId but no menu items, we can find a matching menu
                  const menuId = header.data?.menuId as string | undefined;
                  const hasMenu = typeof header.data?.menu === 'object' && header.data.menu !== null;
                  const hasMenuItems = hasMenu && Array.isArray((header.data.menu as Menu)?.items);
                  
                  if (menuId && (!hasMenu || !hasMenuItems)) {
                    const matchingMenu = menus.find(m => m.id === menuId);
                    if (matchingMenu) {
                      console.log(`Found matching menu for header: ${matchingMenu.name}`);
                      // Update the header data with the full menu (this won't mutate the actual data)
                      header.data.menu = matchingMenu;
                    }
                  }
                });
              }
              
              return (
                <div 
                  key={section.id} 
                  className={`${sectionClassName} ${hasFixedHeader ? 'has-fixed-header' : ''}`}
                  data-section-id={section.id} 
                  data-section-title={section.title}
                  id={`section-${index}`}
                  ref={(el: HTMLElement | null) => {
                    if (el) sectionRefs.current[index] = el;
                  }}
                >
                  {section.components.length > 0 ? (
                    <div className={pageData.pageType === 'LANDING' ? 'w-full flex flex-col snap-y snap-mandatory' : 'w-full'}>
                      <SectionManager 
                        initialComponents={section.components.map(comp => ({
                          id: comp.id,
                          // Convert component types like 'hero' to 'Hero' for SectionManager
                          type: formatComponentType(comp.type),
                          data: comp.data || {}
                        }))}
                        isEditing={false}
                        componentClassName={(type: string) => {
                          const isHeroOrBenefit = type.toLowerCase() === 'hero' || type.toLowerCase() === 'benefit';
                          const isFixedHeader = type.toLowerCase() === 'header' && 
                            section.components.some(c => 
                              c.type.toLowerCase() === 'header' && 
                              (c.data?.transparentHeader === true || c.data?.transparentHeader === 'true')
                            );
                          
                          let classNames = '';
                          
                          if (pageData.pageType === 'LANDING' && isHeroOrBenefit) {
                            classNames = 'min-h-screen h-screen snap-center flex items-center justify-center relative w-full';
                          } else {
                            classNames = `w-full component-${type.toLowerCase()}`;
                          }
                          
                          if (isFixedHeader) {
                            classNames += ' fixed-header z-[50]';
                          }

                          // Add scale effect for "Aplica aquí" button in second section
                          if (type.toLowerCase() === 'button' && activeSection === 1) {
                            classNames += ' transition-transform duration-500 transform scale-200';
                          }
                          
                          return classNames;
                        }}
                      />
                    </div>
                  ) : (
                    <div className="py-8 text-center bg-accent/5 rounded-lg border border-dashed border-muted my-4 max-w-5xl mx-auto">
                      <p className="text-muted-foreground">Esta sección no tiene componentes disponibles.</p>
                    </div>
                  )}
                </div>
              );
            })}
          </>
        ) : (
          <div className="container mx-auto py-16 px-4 text-center">
            <h1 className="text-3xl font-bold mb-4">{pageData.title}</h1>
            <p className="text-muted-foreground">Esta página no tiene secciones.</p>
          </div>
        )}
      </main>

      {/* Footer Menu */}
      {menus.filter(menu => menu.location === 'FOOTER').map((menu) => (
        <Footer
          key={menu.id}
          menu={menu as Menu}
          // Find sections with Header components to extract logo info if available
          logoUrl={sections.flatMap(section => 
            section.components.filter(comp => 
              comp.type.toLowerCase() === 'header' && comp.data?.logoUrl
            ).map(comp => comp.data.logoUrl as string)
          )[0] || ''}
          subtitle={sections.flatMap(section => 
            section.components.filter(comp => 
              comp.type.toLowerCase() === 'header' && comp.data?.subtitle
            ).map(comp => comp.data.subtitle as string)
          )[0] || ''}
          copyright={pageData.title}
        />
      ))}
    </div>
  );
}
