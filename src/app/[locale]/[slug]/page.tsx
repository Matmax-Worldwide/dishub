'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import { cmsOperations } from '@/lib/graphql-client';
import SectionManager from '@/components/cms/SectionManager';
import { Loader2Icon, AlertCircle, AlertTriangle } from 'lucide-react';

import { Menu } from '@/app/api/graphql/types';

// Add the ComponentType type import
type ComponentType = 'Hero' | 'Text' | 'Image' | 'Feature' | 'Testimonial' | 'Header' | 'Card' | 'Benefit' | 'Form' | 'Footer' | 'Article' | 'Blog';

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
          setIsLoading(false);
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
                
                // Get section background data
                let sectionBackgroundImage;
                let sectionBackgroundType;
                
                try {
                  // Get all sections and find this one to get its background
                  const allSections = await cmsOperations.getAllCMSSections();
                  const sectionData = allSections.find(s => s.sectionId === section.sectionId) as unknown as {
                    backgroundImage?: string;
                    backgroundType?: string;
                  };
                  
                  if (sectionData) {
                    sectionBackgroundImage = sectionData.backgroundImage;
                    sectionBackgroundType = sectionData.backgroundType;
                    console.log(`Found background for section ${section.sectionId}:`, { 
                      backgroundImage: sectionBackgroundImage, 
                      backgroundType: sectionBackgroundType 
                    });
                  }
                } catch (bgError) {
                  console.warn(`Could not load background for section ${section.sectionId}:`, bgError);
                }
                
                if (componentResult && componentResult.components) {
                  console.log(`Recibidos ${componentResult.components.length} componentes para ${section.name || section.id}`);
                  
                  // Add section with its components to our rendering data
                  pageSectionsData.push({
                    id: section.id,
                    order: section.order || 0,
                    title: section.name,
                    // Include background data from the section
                    backgroundImage: sectionBackgroundImage,
                    backgroundType: sectionBackgroundType,
                    components: componentResult.components
                  });
                } else {
                  console.warn(`No se encontraron componentes para la sección: ${section.sectionId}`);
                  pageSectionsData.push({
                    id: section.id,
                    order: section.order || 0,
                    title: section.name,
                    backgroundImage: sectionBackgroundImage,
                    backgroundType: sectionBackgroundType,
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
                  backgroundImage: undefined,
                  backgroundType: undefined,
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
          // Continue with empty sections instead of failing completely
          setSections([]);
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
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        {/* Header Skeleton */}
        <div className="w-full bg-white border-b shadow-sm">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-8 h-8 bg-gray-200 rounded animate-pulse"></div>
                <div className="w-24 h-6 bg-gray-200 rounded animate-pulse"></div>
              </div>
              <div className="flex items-center space-x-6">
                <div className="w-16 h-4 bg-gray-200 rounded animate-pulse"></div>
                <div className="w-16 h-4 bg-gray-200 rounded animate-pulse"></div>
                <div className="w-16 h-4 bg-gray-200 rounded animate-pulse"></div>
                <div className="w-20 h-8 bg-gray-200 rounded animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Skeleton - Adaptive based on page type */}
        <div className="flex-1">
          {/* Hero Section Skeleton */}
          <div className="relative min-h-[600px] bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
            <div className="container mx-auto px-4">
              <div className="max-w-4xl mx-auto text-center">
                <div className="w-20 h-6 bg-gray-200 rounded mx-auto mb-6 animate-pulse"></div>
                <div className="w-4/5 h-16 bg-gray-200 rounded mx-auto mb-6 animate-pulse"></div>
                <div className="w-3/4 h-6 bg-gray-200 rounded mx-auto mb-8 animate-pulse"></div>
                <div className="flex justify-center gap-4">
                  <div className="w-36 h-12 bg-gray-200 rounded animate-pulse"></div>
                  <div className="w-36 h-12 bg-gray-200 rounded animate-pulse"></div>
                </div>
              </div>
            </div>
            
            {/* Floating elements for visual interest */}
            <div className="absolute top-20 left-10 w-4 h-4 bg-gray-300 rounded-full animate-pulse"></div>
            <div className="absolute top-40 right-20 w-6 h-6 bg-gray-300 rounded-full animate-pulse"></div>
            <div className="absolute bottom-20 left-20 w-3 h-3 bg-gray-300 rounded-full animate-pulse"></div>
          </div>

          {/* Benefits/Features Section Skeleton */}
          <div className="py-20 bg-white">
            <div className="container mx-auto px-4">
              <div className="text-center mb-16">
                <div className="w-56 h-10 bg-gray-200 rounded mx-auto mb-4 animate-pulse"></div>
                <div className="w-96 h-6 bg-gray-200 rounded mx-auto animate-pulse"></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="text-center group">
                    <div className="w-20 h-20 bg-gradient-to-br from-gray-200 to-gray-300 rounded-full mx-auto mb-6 animate-pulse"></div>
                    <div className="w-40 h-6 bg-gray-200 rounded mx-auto mb-3 animate-pulse"></div>
                    <div className="w-56 h-4 bg-gray-200 rounded mx-auto mb-2 animate-pulse"></div>
                    <div className="w-48 h-4 bg-gray-200 rounded mx-auto animate-pulse"></div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Form/CTA Section Skeleton */}
          <div className="py-20 bg-gradient-to-br from-purple-50 to-pink-50">
            <div className="container mx-auto px-4">
              <div className="max-w-2xl mx-auto">
                <div className="text-center mb-12">
                  <div className="w-64 h-10 bg-gray-200 rounded mx-auto mb-4 animate-pulse"></div>
                  <div className="w-80 h-6 bg-gray-200 rounded mx-auto animate-pulse"></div>
                </div>
                <div className="bg-white p-8 rounded-xl shadow-lg">
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <div className="w-20 h-4 bg-gray-200 rounded mb-2 animate-pulse"></div>
                        <div className="w-full h-12 bg-gray-200 rounded animate-pulse"></div>
                      </div>
                      <div>
                        <div className="w-16 h-4 bg-gray-200 rounded mb-2 animate-pulse"></div>
                        <div className="w-full h-12 bg-gray-200 rounded animate-pulse"></div>
                      </div>
                    </div>
                    <div>
                      <div className="w-24 h-4 bg-gray-200 rounded mb-2 animate-pulse"></div>
                      <div className="w-full h-12 bg-gray-200 rounded animate-pulse"></div>
                    </div>
                    <div>
                      <div className="w-28 h-4 bg-gray-200 rounded mb-2 animate-pulse"></div>
                      <div className="w-full h-32 bg-gray-200 rounded animate-pulse"></div>
                    </div>
                    <div className="w-40 h-12 bg-gradient-to-r from-gray-200 to-gray-300 rounded animate-pulse mx-auto"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Additional Content Sections */}
          <div className="py-16 bg-gray-50">
            <div className="container mx-auto px-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                {[...Array(2)].map((_, i) => (
                  <div key={i} className="bg-white p-8 rounded-lg shadow-sm">
                    <div className="w-full h-48 bg-gray-200 rounded-lg mb-6 animate-pulse"></div>
                    <div className="w-3/4 h-8 bg-gray-200 rounded mb-4 animate-pulse"></div>
                    <div className="space-y-3">
                      <div className="w-full h-4 bg-gray-200 rounded animate-pulse"></div>
                      <div className="w-full h-4 bg-gray-200 rounded animate-pulse"></div>
                      <div className="w-2/3 h-4 bg-gray-200 rounded animate-pulse"></div>
                    </div>
                    <div className="flex items-center space-x-4 mt-6">
                      <div className="w-12 h-12 bg-gray-200 rounded-full animate-pulse"></div>
                      <div>
                        <div className="w-24 h-4 bg-gray-200 rounded mb-1 animate-pulse"></div>
                        <div className="w-32 h-3 bg-gray-200 rounded animate-pulse"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer Skeleton */}
        <div className="bg-gray-900 text-white py-16">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
              <div>
                <div className="w-32 h-8 bg-gray-700 rounded mb-6 animate-pulse"></div>
                <div className="w-48 h-4 bg-gray-700 rounded mb-3 animate-pulse"></div>
                <div className="w-40 h-4 bg-gray-700 rounded animate-pulse"></div>
              </div>
              {[...Array(3)].map((_, i) => (
                <div key={i}>
                  <div className="w-28 h-6 bg-gray-700 rounded mb-6 animate-pulse"></div>
                  <div className="space-y-3">
                    <div className="w-24 h-4 bg-gray-700 rounded animate-pulse"></div>
                    <div className="w-28 h-4 bg-gray-700 rounded animate-pulse"></div>
                    <div className="w-20 h-4 bg-gray-700 rounded animate-pulse"></div>
                    <div className="w-32 h-4 bg-gray-700 rounded animate-pulse"></div>
                  </div>
                </div>
              ))}
            </div>
            <div className="border-t border-gray-700 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="w-56 h-4 bg-gray-700 rounded animate-pulse"></div>
              <div className="flex space-x-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="w-8 h-8 bg-gray-700 rounded-full animate-pulse"></div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Dots Skeleton for Landing Pages */}
        <div className="fixed right-6 top-1/2 transform -translate-y-1/2 z-50 flex flex-col gap-3">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className={`w-3 h-3 rounded-full bg-gray-300 animate-pulse ${
                i === 0 ? 'w-4 h-4 bg-gray-400' : ''
              }`}
            />
          ))}
        </div>

        {/* Enhanced Loading Indicator */}
        <div className="fixed bottom-8 right-8 bg-white rounded-2xl shadow-xl p-6 z-50 border border-gray-200">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Loader2Icon className="h-8 w-8 text-primary animate-spin" />
              <div className="absolute inset-0 rounded-full border-2 border-primary/20 animate-ping"></div>
            </div>
            <div>
              <div className="text-sm font-semibold text-gray-800">Cargando página</div>
              <div className="text-xs text-gray-500">Preparando contenido...</div>
            </div>
          </div>
          
          {/* Progress bar */}
          <div className="mt-4 w-48 h-1 bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-primary to-primary/60 rounded-full animate-pulse"></div>
          </div>
        </div>

        {/* Shimmer overlay effect */}
        <div className="fixed inset-0 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent transform -skew-x-12 animate-shimmer"></div>
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
  
  // Function to sort components in a very specific order with detailed priorities
  const sortComponentsByPriority = (components: Array<{id: string; type: string; data: Record<string, unknown>}>) => {
    const getComponentPriority = (type: string): number => {
      const lowercaseType = type.toLowerCase();
      switch (lowercaseType) {
        // Navigation and Header (Always first)
        case 'header': return 1;
        case 'navbar': return 2;
        case 'navigation': return 3;
        
        // Hero sections (Main landing content)
        case 'hero': return 10;
        case 'banner': return 11;
        case 'landing': return 12;
        
        // Benefits and Features (Core value proposition)
        case 'benefit': return 20;
        case 'benefits': return 21;
        case 'feature': return 22;
        case 'features': return 23;
        
        // Content sections (Main content)
        case 'text': return 30;
        case 'article': return 31;
        case 'blog': return 32;
        case 'content': return 33;
        
        // Media and visual elements
        case 'image': return 40;
        case 'gallery': return 41;
        case 'video': return 42;
        
        // Interactive elements
        case 'form': return 50;
        case 'contact': return 51;
        case 'newsletter': return 52;
        case 'subscription': return 53;
        
        // Social proof and testimonials
        case 'testimonial': return 60;
        case 'testimonials': return 61;
        case 'review': return 62;
        case 'reviews': return 63;
        
        // Cards and listings
        case 'card': return 70;
        case 'cards': return 71;
        case 'list': return 72;
        case 'grid': return 73;
        
        // Call-to-action elements
        case 'cta': return 80;
        case 'button': return 81;
        case 'action': return 82;
        
        // Footer elements (Always last)
        case 'footer': return 90;
        case 'copyright': return 91;
        
        // Any other components get medium priority
        default: return 75;
      }
    };

    return [...components].sort((a, b) => {
      const priorityA = getComponentPriority(a.type);
      const priorityB = getComponentPriority(b.type);
      
      // If priorities are the same, maintain original order
      if (priorityA === priorityB) {
        return 0;
      }
      
      return priorityA - priorityB;
    });
  };
  
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
                        initialComponents={sortComponentsByPriority(section.components).map(comp => ({
                          id: comp.id,
                          // Convert component types like 'hero' to 'Hero' for SectionManager
                          type: formatComponentType(comp.type),
                          data: comp.data || {}
                        }))}
                        isEditing={false}
                        sectionBackground={section.backgroundImage}
                        sectionBackgroundType={section.backgroundType as 'image' | 'gradient'}
                        componentClassName={(type: string) => {
                          const isScrollable = type.toLowerCase() === 'hero' || type.toLowerCase() === 'benefit' || type.toLowerCase() === 'form' || type.toLowerCase() === 'blog';
                          const isFixedHeader = type.toLowerCase() === 'header' && 
                            section.components.some(c => 
                              c.type.toLowerCase() === 'header' && 
                              (c.data?.transparentHeader === true || c.data?.transparentHeader === 'true')
                            );
                          
                          let classNames = '';
                          
                          if (pageData.pageType === 'LANDING' && isScrollable) {
                            classNames = 'min-h-screen h-screen snap-center items-center justify-center relative w-full';
                          } else {
                            classNames = `w-full component-${type.toLowerCase()}`;
                          }
                          
                          if (isFixedHeader) {
                            classNames += ' fixed-header z-[1000]';
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
    </div>
  );
}
