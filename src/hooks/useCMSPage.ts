import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { cmsOperations } from '@/lib/graphql-client';
import { optimizedQueries, graphqlOptimizer } from '@/lib/graphql-optimizations';
import { Menu } from '@/app/api/graphql/types';

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

interface UseCMSPageOptions {
  slug?: string;
  locale?: string;
  enablePreloading?: boolean;
  enableSmoothScroll?: boolean;
}

interface UseCMSPageReturn {
  // Data
  pageData: PageData | null;
  sections: SectionData[];
  menus: Menu[];
  
  // Loading states
  isLoading: boolean;
  isPreloading: boolean;
  preloadProgress: number;
  error: string | null;
  
  // Navigation
  activeSection: number;
  setActiveSection: (index: number) => void;
  navigateToPage: NavigationFunction;
  
  // Refs for scroll management
  sectionRefs: React.MutableRefObject<(HTMLElement | null)[]>;
  isScrolling: React.MutableRefObject<boolean>;
  
  // Methods
  loadCurrentPage: () => Promise<void>;
  preloadAllPages: () => Promise<void>;
}

export function useCMSPage(options: UseCMSPageOptions = {}): UseCMSPageReturn {
  const params = useParams();
  const router = useRouter();
  
  const slug = options.slug || (params?.slug as string);
  const locale = options.locale || (params?.locale as string);
  const enablePreloading = options.enablePreloading ?? true;
  
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
    if (hasPreloaded.current || !enablePreloading) return;
    
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
  
  // Load current page from cache or fetch
  const loadCurrentPage = async () => {
    if (!slug) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      const cacheKey = `${locale}-${slug}`;
      
      // Check if page is in cache
      if (globalPageCache.has(cacheKey)) {
        const cached = globalPageCache.get(cacheKey)!;
        console.log(`⚡ Cargando página desde caché: ${slug}`);
        
        setPageData(cached.page);
        setSections(cached.sections);
        setIsLoading(false);
        return;
      }
      
      // If not in cache, load normally
      console.log(`📥 Cargando página desde servidor: ${slug}`);
      
      const optimizedPageData = await optimizedQueries.loadPage(slug);
      
      if (!optimizedPageData.page) {
        // Try fallback method
        const pageData = await cmsOperations.getPageBySlug(slug);
        
        if (pageData) {
          console.log('Found page using fallback method:', pageData.title);
          setPageData(pageData as unknown as PageData);
          
          // Load sections using OPTIMIZED batch fetching via graphqlOptimizer
          let pageSectionsData: SectionData[] = [];
          
          if (pageData.sections && pageData.sections.length > 0) {
            const sectionIds = pageData.sections
              .map(s => s.sectionId)
              .filter((id): id is string => !!id); // Ensure IDs are strings and filter out null/undefined

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

                pageSectionsData = (sectionsDataResults as SectionComponentsResult[]).map((result: SectionComponentsResult, index: number) => {
                  // Find the original section info using the sectionId, as the order might not be guaranteed
                  // or some sections might have failed to load, Promise.allSettled would be better for that.
                  // For now, assuming sectionIds[index] corresponds to result.
                  const originalSectionInfo = pageData.sections?.find(s => s.sectionId === sectionIds[index]);
                  const components = result?.getSectionComponents?.components || [];
                  return {
                    id: originalSectionInfo?.id || `fallback-id-${index}`, // Use original section's CMS ID
                    order: originalSectionInfo?.order || 0,
                    title: originalSectionInfo?.name,
                    components: components
                  };
                }).sort((a, b) => a.order - b.order);
              
              } catch (sectionError) {
                console.error('Error fetching sections in fallback using graphqlOptimizer:', sectionError);
                // pageSectionsData will remain empty or partially filled if some succeeded before error
              }
            }
          }
          
          setSections(pageSectionsData);
          
          // Cache for future use
          globalPageCache.set(cacheKey, {
            page: pageData as unknown as PageData, // pageData is from cmsOperations.getPageBySlug
            sections: pageSectionsData, // sections are now from graphqlOptimizer
            timestamp: Date.now()
          });
          
        } else {
          console.error(`Page not found with any method: ${slug}`);
          setError('Página no encontrada');
        }
      } else {
        // Process optimized page data
        setPageData(optimizedPageData.page as unknown as PageData);
        
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
        
        setSections(pageSectionsData);
        
        // Cache for future use
        globalPageCache.set(cacheKey, {
          page: optimizedPageData.page as unknown as PageData,
          sections: pageSectionsData,
          timestamp: Date.now()
        });
        
        // Preload videos if any video sections were detected
        if (optimizedPageData.videoSections && optimizedPageData.videoSections.length > 0) {
          optimizedQueries.preloadVideos(optimizedPageData.videoSections).catch(console.warn);
        }
      }
      
    } catch (error) {
      console.error('Error al cargar la página:', error);
      setError('Error al cargar la página');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Navigation function for instant page switching
  const navigateToPage = (targetSlug: string, targetLocale: string = locale) => {
    const cacheKey = `${targetLocale}-${targetSlug}`;
    
    if (globalPageCache.has(cacheKey)) {
      // Instant navigation using Next.js router
      router.push(`/${targetLocale}/${targetSlug}`);
    } else {
      // If not cached, still navigate but it will load normally
      router.push(`/${targetLocale}/${targetSlug}`);
    }
  };

  // Expose navigation function globally for HeaderSection
  useEffect(() => {
    window.navigateToPage = navigateToPage;
    return () => {
      delete window.navigateToPage;
    };
  }, [navigateToPage]);
  
  // Initial preload and current page load
  useEffect(() => {
    if (enablePreloading) {
      preloadAllPages();
    }
  }, [enablePreloading]);
  
  useEffect(() => {
    loadCurrentPage();
  }, [slug, locale]);
  
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
        // Continue with empty menus rather than failing
        setMenus([]);
      }
    }
    
    loadMenus();
  }, []);
  
  return {
    // Data
    pageData,
    sections,
    menus,
    
    // Loading states
    isLoading,
    isPreloading,
    preloadProgress,
    error,
    
    // Navigation
    activeSection,
    setActiveSection,
    navigateToPage,
    
    // Refs for scroll management
    sectionRefs,
    isScrolling,
    
    // Methods
    loadCurrentPage,
    preloadAllPages,
  };
}

export type { PageData, SectionData, NavigationFunction, UseCMSPageReturn }; 