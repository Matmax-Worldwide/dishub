'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { cmsOperations } from '@/lib/graphql-client';
import { optimizedQueries, graphqlOptimizer } from '@/lib/graphql-optimizations';
import SectionManager from '@/components/engines/cms/SectionManager';
import ModernLoader from '@/components/ui/ModernLoader';
import Navbar from '@/components/Navigation/Navbar';
import Benefits from '@/components/Benefits';
import { Dictionary } from '@/app/i18n';
import { Menu } from '@/app/api/graphql/types';
import { ComponentType } from '@/types/cms';

interface ClientPageProps {
  locale: string;
  dictionary: Dictionary;
}

// Global cache for preloaded pages
const globalPageCache = new Map<string, {
  page: PageData;
  sections: SectionData[];
  timestamp: number;
}>();

// Global cache for all pages list
let allPagesCache: Array<{ slug: string; locale: string; id: string }> | null = null;

// Navigation function type
interface NavigationFunction {
  (targetSlug: string, targetLocale?: string): void;
}

// Extend window interface for navigation function
declare global {
  interface Window {
    navigateToPage?: NavigationFunction;
  }
}

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
  isDefault: boolean;
}

// Define section data type for rendering
interface SectionData {
  id: string;
  title?: string;
  order: number;
  backgroundImage?: string;
  backgroundType?: string;
  components: Array<{
    id: string;
    type: string;
    data: Record<string, unknown>;
  }>;
}

// Define GraphQL section result type
interface SectionComponentsResult {
  getSectionComponents?: {
    components: Array<{
      id: string;
      type: string;
      data: Record<string, unknown>;
    }>;
    lastUpdated?: string;
  };
}

export default function ClientPage({ locale, dictionary }: ClientPageProps) {
  const router = useRouter();
  
  const [pageData, setPageData] = useState<PageData | null>(null);
  const [sections, setSections] = useState<SectionData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState(0);
  const [menus, setMenus] = useState<Menu[]>([]);
  const [preloadProgress, setPreloadProgress] = useState(0);
  const [isPreloading, setIsPreloading] = useState(true);
  const sectionRefs = useRef<(HTMLElement | null)[]>([]);
  const isScrolling = useRef<boolean>(false);
  const hasPreloaded = useRef<boolean>(false);
  
  // Preload all pages function
  const preloadAllPages = async () => {
    if (hasPreloaded.current) return;
    
    try {
      setIsPreloading(true);
      setPreloadProgress(0);
      
      console.log('🚀 Iniciando precarga de todas las páginas...');
      
      // Get all pages first
      if (!allPagesCache) {
        const allPages = await cmsOperations.getAllPageIdentifiers();
        // Ensure allPages is an array and each item has id, slug, and locale
        if (Array.isArray(allPages) && allPages.every(p => p && typeof p.id === 'string' && typeof p.slug === 'string' && typeof p.locale === 'string')) {
          allPagesCache = allPages.map(page => ({
            id: page.id,
            slug: page.slug,
            locale: page.locale, 
          }));
        } else {
          console.error("Failed to fetch or process page identifiers correctly.");
          allPagesCache = []; // Initialize as empty array to prevent further errors
        }
      }
      
      const totalPages = allPagesCache.length;
      let loadedPages = 0;
      
      // Preload pages in batches for better performance
      const batchSize = 3;
      for (let i = 0; i < allPagesCache.length; i += batchSize) {
        const batch = allPagesCache.slice(i, i + batchSize);
        
        await Promise.allSettled(
          batch.map(async (pageInfo) => {
            try {
              const cacheKey = `${pageInfo.locale}-${pageInfo.slug}`;
              
              // Skip if already cached
              if (globalPageCache.has(cacheKey)) {
                loadedPages++;
                return;
              }
              
              // Load page with optimized query
              const optimizedPageData = await optimizedQueries.loadPage(pageInfo.slug);
              
              if (optimizedPageData.page) {
                // Process sections data
                const pageSectionsData: SectionData[] = [];
                
                if (optimizedPageData.sections && optimizedPageData.sections.length > 0) {
                  (optimizedPageData.sections as Array<{ components: Array<{ id: string; type: string; data: Record<string, unknown> }> }>).forEach((sectionData, index: number) => {
                    const pageSection = (optimizedPageData.page as { sections: { id: string; order: number; name: string }[] }).sections[index];
                    
                    if (sectionData && sectionData.components) {
                      pageSectionsData.push({
                        id: pageSection.id,
                        order: pageSection.order || 0,
                        title: pageSection.name,
                        components: sectionData.components
                      });
                    }
                  });
                  
                  pageSectionsData.sort((a, b) => a.order - b.order);
                }
                
                // Cache the page
                globalPageCache.set(cacheKey, {
                  page: optimizedPageData.page as unknown as PageData,
                  sections: pageSectionsData,
                  timestamp: Date.now()
                });
                
                console.log(`✅ Página precargada: ${pageInfo.slug}`);
              }
              
              loadedPages++;
              setPreloadProgress(Math.round((loadedPages / totalPages) * 100));
              
            } catch (error) {
              console.warn(`⚠️ Error precargando página ${pageInfo.slug}:`, error);
              loadedPages++;
            }
          })
        );
        
        // Small delay between batches to prevent overwhelming the server
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      hasPreloaded.current = true;
      console.log(`🎉 Precarga completada: ${loadedPages}/${totalPages} páginas`);
      
      // Preload videos if any
      const allVideoSections: string[] = [];
      globalPageCache.forEach(({ sections }) => {
        sections.forEach(section => {
          const hasVideo = section.components.some(comp => 
            comp.type.toLowerCase() === 'video' || comp.type.toLowerCase() === 'videosection'
          );
          if (hasVideo) {
            allVideoSections.push(section.id);
          }
        });
      });
      
      if (allVideoSections.length > 0) {
        console.log(`🎬 Precargando ${allVideoSections.length} secciones de video...`);
        optimizedQueries.preloadVideos(allVideoSections).catch(console.warn);
      }
      
    } catch (error) {
      console.error('❌ Error en precarga general:', error);
    } finally {
      setIsPreloading(false);
    }
  };
  
  // Load default page from cache or fetch
  const loadDefaultPage = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const cacheKey = `${locale}-default`;
      
      // Check if default page is in cache
      if (globalPageCache.has(cacheKey)) {
        const cached = globalPageCache.get(cacheKey)!;
        console.log(`⚡ Cargando página por defecto desde caché: ${locale}`);
        
        setPageData(cached.page);
        setSections(cached.sections);
        setIsLoading(false);
        return;
      }
      
      // If not in cache, load normally
      console.log(`📥 Cargando página por defecto desde servidor: ${locale}`);
      
      // Try to fetch the default page for this locale
      const pageData = await cmsOperations.getDefaultPage(locale);
      
      if (!pageData) {
        console.error(`Default page not found for locale: ${locale}`);
        setError('Default page not found');
        setIsLoading(false);
        return;
      }
      
      setPageData(pageData as unknown as PageData);
      console.log('Default page data retrieved:', pageData);
      
      // Create array to store section data for rendering
      const pageSectionsData: SectionData[] = [];
      
      if (pageData.sections && pageData.sections.length > 0) {
        console.log(`Processing ${pageData.sections.length} sections`);
        
        const sectionIds = pageData.sections
          .map(s => s.sectionId)
          .filter((id): id is string => !!id);

        if (sectionIds.length > 0) {
          const GET_SECTION_COMPONENTS_OPTIMIZED_QUERY = `
            query GetSectionComponentsOptimized($sectionId: ID!) {
              getSectionComponents(sectionId: $sectionId) {
                components { id type data }
                lastUpdated
              }
            }
          `;
          try {
            const sectionsDataResults = await Promise.all(
              sectionIds.map(sectionId =>
                graphqlOptimizer.executeQuery( 
                  GET_SECTION_COMPONENTS_OPTIMIZED_QUERY,
                  { sectionId },
                  { cache: true, ttl: 5 * 60 * 1000, dependencies: [`section:${sectionId}`], batch: true }
                )
              )
            );

            pageSectionsData.push(...(sectionsDataResults as SectionComponentsResult[]).map((result: SectionComponentsResult, index: number) => {
              const originalSectionInfo = pageData.sections?.find(s => s.sectionId === sectionIds[index]);
              const components = result?.getSectionComponents?.components || [];
              return {
                id: originalSectionInfo?.id || `fallback-id-${index}`,
                order: originalSectionInfo?.order || 0,
                title: originalSectionInfo?.name,
                components: components
              };
            }).sort((a, b) => a.order - b.order));
          
          } catch (sectionError) {
            console.error('Error fetching sections using graphqlOptimizer:', sectionError);
          }
        }
      }
      
      setSections(pageSectionsData);
      
      // Cache for future use
      globalPageCache.set(cacheKey, {
        page: pageData as unknown as PageData,
        sections: pageSectionsData,
        timestamp: Date.now()
      });
      
    } catch (error) {
      console.error('Error al cargar la página por defecto:', error);
      setError('Error al cargar la página por defecto');
    } finally {
      setIsLoading(false);
    }
  }, [locale]);
  
  // Navigation function for instant page switching
  const navigateToPage = useCallback((targetSlug: string, targetLocale: string = locale) => {
    const cacheKey = `${targetLocale}-${targetSlug}`;
    
    if (globalPageCache.has(cacheKey)) {
      // Instant navigation using Next.js router
      router.push(`/${targetLocale}/${targetSlug}`);
    } else {
      // If not cached, still navigate but it will load normally
      router.push(`/${targetLocale}/${targetSlug}`);
    }
  }, [locale, router]);

  // Expose navigation function globally for HeaderSection
  useEffect(() => {
    window.navigateToPage = navigateToPage;
    return () => {
      delete window.navigateToPage;
    };
  }, [navigateToPage]);
  
  // Initial preload and current page load
  useEffect(() => {
    preloadAllPages();
  }, []);
  
  useEffect(() => {
    loadDefaultPage();
  }, [loadDefaultPage]);
  
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
        setMenus([]);
      }
    }
    
    loadMenus();
  }, []);
  
  // Set up smooth scroll effect if needed
  useEffect(() => {
    if (!pageData || pageData.pageType !== 'LANDING' || sections.length === 0) {
      document.body.style.overflow = '';
      document.body.classList.remove('snap-scroll');
      return;
    }
    
    document.body.classList.add('snap-scroll');
    window.scrollTo(0, 0);
    
    let activeComponentIndex = 0;
    let isScrolling = false;
    let lastScrollTime = 0;
    const scrollThrottleTime = 800;
    
    interface ScrollableComponent {
      element: Element;
      top: number;
      height: number;
    }
    
    const scrollableComponents: ScrollableComponent[] = [];
    
    const updateComponentsMap = () => {
      scrollableComponents.length = 0;
      const components = document.querySelectorAll('[data-component-type="Hero"], [data-component-type="Benefit"], [data-component-type="Form"], [data-component-type="Blog"]');
      
      components.forEach((component) => {
        scrollableComponents.push({
          element: component,
          top: component.getBoundingClientRect().top + window.scrollY,
          height: component.getBoundingClientRect().height
        });
      });
      
      scrollableComponents.sort((a, b) => a.top - b.top);
      return scrollableComponents.length;
    };
    
    updateComponentsMap();
    
    const updateActiveComponent = () => {
      const scrollPosition = window.scrollY + (window.innerHeight / 3);
      
      for (let i = 0; i < scrollableComponents.length; i++) {
        const component = scrollableComponents[i];
        const nextComponent = scrollableComponents[i + 1];
        
        if (
          scrollPosition >= component.top && 
          (!nextComponent || scrollPosition < nextComponent.top)
        ) {
          activeComponentIndex = i;
          break;
        }
      }
    };
    
    const handleWheel = (e: WheelEvent) => {
      const now = Date.now();
      if (isScrolling || now - lastScrollTime < scrollThrottleTime) {
        e.preventDefault();
        return;
      }
      
      updateActiveComponent();
      const isScrollingDown = e.deltaY > 0;
      
      if (Math.abs(e.deltaY) < 25) return;
      
      const targetIndex = isScrollingDown
        ? Math.min(activeComponentIndex + 1, scrollableComponents.length - 1)
        : Math.max(activeComponentIndex - 1, 0);
      
      if (targetIndex === activeComponentIndex) return;
      
      e.preventDefault();
      isScrolling = true;
      lastScrollTime = now;
      
      const targetComponent = scrollableComponents[targetIndex];
      
      if (targetComponent && targetComponent.element) {
        targetComponent.element.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
        
        activeComponentIndex = targetIndex;
        
        const sectionElement = targetComponent.element.closest('[data-section-id]');
        if (sectionElement) {
          const sectionIndex = parseInt(sectionElement.id.replace('section-', ''), 10);
          if (!isNaN(sectionIndex)) {
            setActiveSection(sectionIndex);
          }
        }
      }
      
      setTimeout(() => {
        isScrolling = false;
      }, scrollThrottleTime);
    };
    
    const handleResize = () => {
      document.documentElement.style.setProperty('--vh', `${window.innerHeight * 0.01}px`);
      updateComponentsMap();
    };
    
    handleResize();
    
    window.addEventListener('wheel', handleWheel, { passive: false });
    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', () => {
      if (!isScrolling) {
        updateActiveComponent();
      }
    });
    
    return () => {
      document.body.style.overflow = '';
      document.body.classList.remove('snap-scroll');
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', updateActiveComponent);
    };
  }, [pageData, sections.length, setActiveSection]);
  
  // Scroll to active section when it changes
  useEffect(() => {
    if (pageData?.pageType === 'LANDING') {
      if (isScrolling.current) return;
      isScrolling.current = true; 
      
      const sectionElement = document.getElementById(`section-${activeSection}`);
      
      if (sectionElement) {
        sectionElement.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
      
      setTimeout(() => {
        isScrolling.current = false;
      }, 1000);
    }
  }, [activeSection, pageData?.pageType]);
  
  // Apply snap-scroll class to body for landing pages
  useEffect(() => {
    if (pageData?.pageType === 'LANDING') {
      document.body.classList.add('snap-scroll');
    } else {
      document.body.classList.remove('snap-scroll');
    }
    
    return () => {
      document.body.classList.remove('snap-scroll');
    };
  }, [pageData?.pageType]);
  
  // Function to convert component type to proper case for SectionManager
  const formatComponentType = (type: string): ComponentType => {
    const lowercaseType = type.toLowerCase();
    if (lowercaseType === 'benefit' || lowercaseType === 'benefits') {
      return 'Benefit' as ComponentType;
    }
    if (lowercaseType === 'blog' || lowercaseType === 'blogs') {
      return 'Blog' as ComponentType;
    }
    if (lowercaseType === 'article' || lowercaseType === 'articles') {
      return 'Article' as ComponentType;
    }
    if (lowercaseType === 'video') {
      return 'Video' as ComponentType;
    }
    if (lowercaseType === 'gallery') {
      return 'Gallery' as ComponentType;
    }
    if (lowercaseType === 'calendar') {
      return 'Calendar' as ComponentType;
    }
    return (lowercaseType.charAt(0).toUpperCase() + lowercaseType.slice(1)) as ComponentType;
  };

  // Show modern Apple-style loader during initial preload or page load
  if (isLoading || isPreloading) {
    return (
      <ModernLoader 
        variant="apple"
        message={isPreloading ? `Cargando aplicación... ${preloadProgress}%` : "Cargando página..."}
        progress={isPreloading ? preloadProgress : undefined}
        showProgress={isPreloading}
      />
    );
  }

  if (error && !pageData) {
    // If there's an error but no page data, render the original homepage as fallback
    return (
      <>
        <Navbar dictionary={dictionary} locale={locale} />
        <Benefits dictionary={dictionary} locale={locale} />
      </>
    );
  }

  if (pageData && sections.length > 0) {
    // Apply section styles - for LANDING, make the section a container for scroll snapping
    const sectionClassName = pageData?.pageType === 'LANDING' 
      ? "w-full h-auto flex flex-col items-center justify-start"
      : "cms-section w-full";
      
    // Apply container style for smooth scroll
    const containerClassName = pageData?.pageType === 'LANDING'
      ? "w-full h-screen scroll-smooth snap-y snap-mandatory"
      : "flex-1 flex flex-col";

    // Render CMS page content
    return (
      <div className="cms-page w-full h-full">
        {/* Banner for default pages */}
        {pageData.isDefault && (
          <div className="bg-blue-600 text-white py-2 px-4 text-center">
            <span className="font-medium">Página por defecto</span> - Esta página se muestra en la URL raíz del sitio
          </div>
        )}
        
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

        {/* Page content with sections */}
        <main className={containerClassName}>
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
                const menuId = header.data?.menuId as string | undefined;
                const hasMenu = typeof header.data?.menu === 'object' && header.data.menu !== null;
                const hasMenuItems = hasMenu && Array.isArray((header.data.menu as Menu)?.items);
                
                if (menuId && (!hasMenu || !hasMenuItems)) {
                  const matchingMenu = menus.find(m => m.id === menuId);
                  if (matchingMenu) {
                    console.log(`Found matching menu for header: ${matchingMenu.name}`);
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
                      key={`section-${section.id}-${section.components.length}`}
                      initialComponents={section.components.map(component => ({
                        id: component.id,
                        type: formatComponentType(component.type),
                        data: component.data
                      }))}
                      isEditing={false}
                      componentClassName={(type) => {
                        const baseClasses = "w-full";
                        
                        if (type === 'Header' || type === 'Footer') {
                          return `${baseClasses} sticky top-0 z-40`;
                        }
                        
                        if (pageData?.pageType === 'LANDING') {
                          return `${baseClasses} min-h-screen flex items-center justify-center snap-start`;
                        }
                        
                        return baseClasses;
                      }}
                      sectionBackground={section.backgroundImage}
                      sectionBackgroundType={section.backgroundType as 'image' | 'gradient' | undefined}
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
        </main>
      </div>
    );
  }

  // Fallback to original homepage if no CMS content is available
  return (
    <>
      <Navbar dictionary={dictionary} locale={locale} />
      <Benefits dictionary={dictionary} locale={locale} />
    </>
  );
} 