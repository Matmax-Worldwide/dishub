'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { cmsOperations, CMSPageDB } from '@/lib/graphql-client';
import { optimizedQueries } from '@/lib/graphql-optimizations';
import SectionManager from '@/components/cms/SectionManager';
import { AlertCircle, AlertTriangle } from 'lucide-react';
import ModernLoader from '@/components/ui/ModernLoader';

import { Menu } from '@/app/api/graphql/types';
import { ComponentType } from '@/types/cms';

// Global cache for preloaded pages
const globalPageCache = new Map<string, {
  page: PageData;
  sections: SectionData[];
  timestamp: number;
}>();

// Global cache for all pages list
let allPagesCache: Array<{ slug: string; locale: string; title: string }> | null = null;

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

export default function CMSPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const locale = params.locale as string;
  
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
        const allPages = await cmsOperations.getAllPages() as CMSPageDB[];
        allPagesCache = allPages.map(page => ({
          slug: page.slug,
          locale: page.locale || 'en', // Handle missing locale property
          title: page.title
        }));
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
                
                console.log(`✅ Página precargada: ${pageInfo.title} (${pageInfo.slug})`);
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
          
          // Load sections using traditional method
          const pageSectionsData: SectionData[] = [];
          
          if (pageData.sections && pageData.sections.length > 0) {
            for (const section of pageData.sections) {
              try {
                const componentResult = await cmsOperations.getSectionComponents(section.sectionId);
                
                if (componentResult && componentResult.components) {
                  pageSectionsData.push({
                    id: section.id,
                    order: section.order || 0,
                    title: section.name,
                    components: componentResult.components
                  });
                }
              } catch (error) {
                console.error(`Error al cargar componentes para sección ${section.id}:`, error);
              }
            }
            
            pageSectionsData.sort((a, b) => a.order - b.order);
          }
          
          setSections(pageSectionsData);
          
          // Cache for future use
          globalPageCache.set(cacheKey, {
            page: pageData as unknown as PageData,
            sections: pageSectionsData,
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
    preloadAllPages();
  }, []);
  
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
  
  // Set up smooth scroll effect if needed
  useEffect(() => {
    if (!pageData || pageData.pageType !== 'LANDING' || sections.length === 0) {
      // Reset any scroll behavior if not using smooth scroll
      document.body.style.overflow = '';
      document.body.classList.remove('snap-scroll');
      return;
    }
    
    // Add the snap-scroll class to enable scroll snapping
    document.body.classList.add('snap-scroll');
    
    // Reset scroll position when the page loads
    window.scrollTo(0, 0);
    
    // Track scroll state
    let activeComponentIndex = 0;
    let isScrolling = false;
    let lastScrollTime = 0;
    const scrollThrottleTime = 800; // Milliseconds to prevent rapid scrolling
    
    // Create a map of all scrollable components
    interface ScrollableComponent {
      element: Element;
      top: number;
      height: number;
    }
    
    const scrollableComponents: ScrollableComponent[] = [];
    
    // Function to rebuild the component map
    const updateComponentsMap = () => {
      // Clear the previous array
      scrollableComponents.length = 0;
      
      // Find all scrollable components
      const components = document.querySelectorAll('[data-component-type="Hero"], [data-component-type="Benefit"], [data-component-type="Form"], [data-component-type="Blog"]');
      
      components.forEach((component) => {
        scrollableComponents.push({
          element: component,
          top: component.getBoundingClientRect().top + window.scrollY,
          height: component.getBoundingClientRect().height
        });
      });
      
      // Sort by top position
      scrollableComponents.sort((a, b) => a.top - b.top);
      
      return scrollableComponents.length;
    };
    
    // Initial setup of component map
    updateComponentsMap();
    
    // Determine the current active component based on scroll position
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
    
    // Handle wheel event to control scrolling component by component
    const handleWheel = (e: WheelEvent) => {
      // Check if we should allow scrolling based on time elapsed
      const now = Date.now();
      if (isScrolling || now - lastScrollTime < scrollThrottleTime) {
        e.preventDefault();
        return;
      }
      
      // Update active component based on current scroll position
      updateActiveComponent();
      
      // Determine scroll direction
      const isScrollingDown = e.deltaY > 0;
      
      // Only respond to significant scroll movements
      if (Math.abs(e.deltaY) < 25) return;
      
      // Calculate target component
      const targetIndex = isScrollingDown
        ? Math.min(activeComponentIndex + 1, scrollableComponents.length - 1)
        : Math.max(activeComponentIndex - 1, 0);
      
      // Don't do anything if we're already at the edge
      if (targetIndex === activeComponentIndex) return;
      
      // Prevent default scrolling
      e.preventDefault();
      
      // Mark as scrolling
      isScrolling = true;
      lastScrollTime = now;
      
      // Get target element
      const targetComponent = scrollableComponents[targetIndex];
      
      if (targetComponent && targetComponent.element) {
        // Scroll to the component with smooth behavior
        targetComponent.element.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
        
        // Update active component index
        activeComponentIndex = targetIndex;
        
        // Set active section if component belongs to a section
        const sectionElement = targetComponent.element.closest('[data-section-id]');
        if (sectionElement) {
          const sectionIndex = parseInt(sectionElement.id.replace('section-', ''), 10);
          if (!isNaN(sectionIndex)) {
            setActiveSection(sectionIndex);
          }
        }
      }
      
      // Reset scrolling flag after animation completes
      setTimeout(() => {
        isScrolling = false;
      }, scrollThrottleTime);
    };
    
    // Add wheel event listener with passive: false to allow preventDefault
    window.addEventListener('wheel', handleWheel, { passive: false });
    
    // Add resize handler to update the component map if the layout changes
    const handleResize = () => {
      // Update vh units for mobile browsers
      document.documentElement.style.setProperty('--vh', `${window.innerHeight * 0.01}px`);
      
      // Rebuild component map
      updateComponentsMap();
    };
    
    // Initial call
    handleResize();
    
    // Add resize listener
    window.addEventListener('resize', handleResize);
    
    // Add scroll listener to update active component
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
  
  // Apply snap-scroll class to body for landing pages
  useEffect(() => {
    // Add the snap-scroll class to body for landing pages to enable page-level scroll snapping
    if (pageData?.pageType === 'LANDING') {
      document.body.classList.add('snap-scroll');
    } else {
      document.body.classList.remove('snap-scroll');
    }
    
    return () => {
      // Clean up by removing the class when component unmounts
      document.body.classList.remove('snap-scroll');
    };
  }, [pageData?.pageType]);
  
  // Add keyboard navigation
  useEffect(() => {
    if (!pageData || pageData.pageType !== 'LANDING' || sections.length === 0) {
      return;
    }
    
    let isNavigating = false;
    const navigationCooldown = 800; // ms
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isNavigating) return;
      
      const scrollableComponents = document.querySelectorAll('[data-component-type="Hero"], [data-component-type="Benefit"], [data-component-type="Form"], [data-component-type="Blog"]');
      if (scrollableComponents.length === 0) return;
      
      // Map components to their position data
      const components = Array.from(scrollableComponents).map(comp => ({
        element: comp,
        top: comp.getBoundingClientRect().top + window.scrollY
      }));
      
      // Sort by position
      components.sort((a, b) => a.top - b.top);
      
      // Find current component based on scroll position
      const scrollPosition = window.scrollY + (window.innerHeight / 3);
      let currentIndex = 0;
      
      for (let i = 0; i < components.length; i++) {
        const component = components[i];
        const nextComponent = components[i + 1];
        
        if (scrollPosition >= component.top && (!nextComponent || scrollPosition < nextComponent.top)) {
          currentIndex = i;
          break;
        }
      }
      
      // Handle navigation based on key
      let targetIndex = currentIndex;
      let targetSection = activeSection;
      
      if ((e.key === 'ArrowDown' || e.key === 'PageDown') && currentIndex < components.length - 1) {
        targetIndex = currentIndex + 1;
        targetSection = findSectionForComponent(components[targetIndex].element);
      } else if ((e.key === 'ArrowUp' || e.key === 'PageUp') && currentIndex > 0) {
        targetIndex = currentIndex - 1;
        targetSection = findSectionForComponent(components[targetIndex].element);
      } else if (e.key === 'Home') {
        targetIndex = 0;
        targetSection = 0;
      } else if (e.key === 'End') {
        targetIndex = components.length - 1;
        targetSection = sections.length - 1;
      } else {
        // No valid navigation key was pressed
        return;
      }
      
      // Prevent default scrolling
      e.preventDefault();
      
      // Scroll to target component
      if (targetIndex !== currentIndex) {
        isNavigating = true;
        
        components[targetIndex].element.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
        
        // Update active section if needed
        if (targetSection !== activeSection) {
          setActiveSection(targetSection);
        }
        
        // Reset navigation flag after animation
        setTimeout(() => {
          isNavigating = false;
        }, navigationCooldown);
      }
    };
    
    // Helper function to find the section index for a component
    const findSectionForComponent = (element: Element): number => {
      const sectionElement = element.closest('[data-section-id]');
      if (sectionElement) {
        const sectionId = sectionElement.id;
        const match = sectionId.match(/section-(\d+)/);
        if (match && match[1]) {
          return parseInt(match[1], 10);
        }
      }
      return activeSection; // Fallback to current active section
    };
    
    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [pageData, sections.length, activeSection, setActiveSection]);
  
  // Add touch support for mobile
  useEffect(() => {
    if (!pageData || pageData.pageType !== 'LANDING' || sections.length === 0) {
      return;
    }
    
    let touchStartY = 0;
    let touchEndY = 0;
    let isSwiping = false;
    const swipeCooldown = 800; // ms
    const minSwipeDistance = 50; // px
    
    const handleTouchStart = (e: TouchEvent) => {
      touchStartY = e.touches[0].clientY;
    };
    
    const handleTouchMove = (e: TouchEvent) => {
      // Prevent default only when actively swiping
      if (isSwiping) {
        e.preventDefault();
      }
    };
    
    const handleTouchEnd = (e: TouchEvent) => {
      if (isSwiping) return;
      
      touchEndY = e.changedTouches[0].clientY;
      const swipeDistance = touchEndY - touchStartY;
      
      // Only process if the swipe was significant
      if (Math.abs(swipeDistance) < minSwipeDistance) return;
      
      const isSwipingDown = swipeDistance > 0;
      
      // Find scrollable components
      const scrollableComponents = document.querySelectorAll(
        '[data-component-type="Hero"], [data-component-type="Benefit"], [data-component-type="Form"], [data-component-type="Blog"]'
      );
      
      if (scrollableComponents.length === 0) return;
      
      // Map components with their positions
      const components = Array.from(scrollableComponents).map(comp => ({
        element: comp,
        top: comp.getBoundingClientRect().top + window.scrollY,
        height: comp.getBoundingClientRect().height
      }));
      
      // Sort by position
      components.sort((a, b) => a.top - b.top);
      
      // Find current component
      const scrollPosition = window.scrollY + (window.innerHeight / 3);
      let currentIndex = 0;
      
      for (let i = 0; i < components.length; i++) {
        const component = components[i];
        const nextComponent = components[i + 1];
        
        if (scrollPosition >= component.top && (!nextComponent || scrollPosition < nextComponent.top)) {
          currentIndex = i;
          break;
        }
      }
      
      // Determine target based on swipe direction
      let targetIndex;
      
      if (isSwipingDown && currentIndex > 0) {
        // Swipe down (like scrolling up)
        targetIndex = currentIndex - 1;
      } else if (!isSwipingDown && currentIndex < components.length - 1) {
        // Swipe up (like scrolling down)
        targetIndex = currentIndex + 1;
      } else {
        // No valid target
        return;
      }
      
      // Scroll to the target component
      isSwiping = true;
      
      components[targetIndex].element.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
      
      // Update active section
      const sectionElement = components[targetIndex].element.closest('[data-section-id]');
      if (sectionElement) {
        const sectionId = sectionElement.id;
        const match = sectionId.match(/section-(\d+)/);
        if (match && match[1]) {
          const sectionIndex = parseInt(match[1], 10);
          setActiveSection(sectionIndex);
        }
      }
      
      // Reset swiping flag after animation
      setTimeout(() => {
        isSwiping = false;
      }, swipeCooldown);
    };
    
    // Add touch event listeners
    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });
    
    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [pageData, sections.length, setActiveSection]);
  
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
    return (lowercaseType.charAt(0).toUpperCase() + lowercaseType.slice(1)) as ComponentType;
  };
  
  // Apply section styles - for LANDING, make the section a container for scroll snapping
  const sectionClassName = pageData?.pageType === 'LANDING' 
    ? "w-full h-auto flex flex-col items-center justify-start" // Remove overflow-hidden
    : "cms-section w-full";
    
  // Apply container style for smooth scroll
  const containerClassName = pageData?.pageType === 'LANDING'
    ? "w-full h-screen scroll-smooth snap-y snap-mandatory" // Remove overflow properties
    : "flex-1 flex flex-col";
    
  // Return the component
  return (
    <div className="cms-page w-full h-full"> {/* Add full height/width to the main container */}
      <div className="relative z-[1000]">
        {sections.some(section => 
          section.components.some(comp => comp.type.toLowerCase() === 'header')
        )}
      </div>

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
                        key={`section-${section.id}-${section.components.length}`}
                        initialComponents={section.components.map(component => ({
                          id: component.id,
                          type: formatComponentType(component.type),
                          data: component.data
                        }))}
                        isEditing={false}
                        componentClassName={(type) => {
                          const baseClasses = "w-full";
                          
                          // Add specific classes based on component type
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
