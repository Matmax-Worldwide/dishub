'use client';

import { useEffect, useState, useRef } from 'react';
import Navbar from '../../components/Navigation/Navbar';
import Benefits from '../../components/Benefits';
import Footer from '../../components/Footer';
import CopyrightFooter from '../../components/CopyrightFooter';
import { Dictionary } from '../i18n';
import { cmsOperations } from '@/lib/graphql-client';
import SectionManager from '@/components/cms/SectionManager';
import { Loader2Icon } from 'lucide-react';
import { ComponentType } from '@/types/cms';

interface ClientPageProps {
  locale: string;
  dictionary: Dictionary;
}

// Define types for page data
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
  isDefault?: boolean;
  sections?: Array<{
    id: string;
    sectionId: string;
    name?: string;
    order: number;
  }>;
}

// Define section data type
interface SectionData {
  id: string;
  order: number;
  title?: string;
  backgroundImage?: string;
  backgroundType?: string;
  components: Array<{
    id: string;
    type: string;
    data: Record<string, unknown>;
  }>;
}

export default function ClientPage({ locale, dictionary }: ClientPageProps) {
  const [showCopyright, setShowCopyright] = useState(false);
  const [pageData, setPageData] = useState<PageData | null>(null);
  const [sections, setSections] = useState<SectionData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState(0);
  const isScrolling = useRef<boolean>(false);

  // Load default page for the current locale
  useEffect(() => {
    async function loadDefaultPage() {
      try {
        setIsLoading(true);
        setError(null);
        console.log(`Loading default page for locale: ${locale}`);
        
        // Fetch the default page data
        const pageData = await cmsOperations.getDefaultPage(locale);
        
        if (!pageData) {
          console.error(`Default page not found for locale: ${locale}`);
          setError('Default page not found');
          setIsLoading(false);
          // Fall back to the original homepage content
          return;
        }
        
        setPageData(pageData);
        console.log('Default page data retrieved:', pageData);
        
        try {
          // Create array to store section data for rendering
          const pageSectionsData: SectionData[] = [];
          
          if (pageData.sections && pageData.sections.length > 0) {
            console.log(`Processing ${pageData.sections.length} sections`);
            
            // Process each section
            for (const section of pageData.sections) {
              try {
                console.log(`Loading components for section: ${section.sectionId}`);
                
                // Load components for this section from the CMS
                const componentResult = await cmsOperations.getSectionComponents(section.sectionId);
                
                if (componentResult && componentResult.components) {
                  console.log(`Received ${componentResult.components.length} components for ${section.name || section.id}`);
                  
                  // Add section with its components to our rendering data
                  pageSectionsData.push({
                    id: section.id,
                    order: section.order || 0,
                    title: section.name,
                    components: componentResult.components
                  });
                } else {
                  console.warn(`No components found for section: ${section.sectionId}`);
                  pageSectionsData.push({
                    id: section.id,
                    order: section.order || 0,
                    title: section.name,
                    components: []
                  });
                }
              } catch (error) {
                console.error(`Error loading components for section ${section.id}:`, error);
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
            console.log(`${pageSectionsData.length} sections processed and sorted`);
          }
          
          setSections(pageSectionsData);
        } catch (sectionsError) {
          console.error('Error loading page sections:', sectionsError);
          setError('Error loading page sections');
          // Continue with empty sections instead of failing completely
          setSections([]);
        }
      } catch (pageError) {
        console.error('Error loading default page:', pageError);
        setError('Error loading default page');
      } finally {
        setIsLoading(false);
      }
    }
    
    loadDefaultPage();
  }, [locale]);

  // Set up smooth scroll effect for LANDING pages
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

  // Apply global overflow for non-LANDING pages
  useEffect(() => {
    if (!pageData || pageData.pageType !== 'LANDING') {
      document.body.style.overflow = 'hidden';
      
      // Función para detectar cuando el usuario ha scrolleado hasta el final
      const handleScroll = () => {
        // Determinar si hemos llegado cerca del final de la página
        const scrollPosition = window.scrollY + window.innerHeight;
        const documentHeight = document.documentElement.scrollHeight;
        
        // Mostrar el copyright cuando estamos muy cerca del final del documento
        if (documentHeight - scrollPosition < 50) {
          setShowCopyright(true);
        } else {
          setShowCopyright(false);
        }
      };
      
      // Agregar listener de scroll
      window.addEventListener('scroll', handleScroll);
      
      return () => {
        document.body.style.overflow = '';
        window.removeEventListener('scroll', handleScroll);
      };
    }
  }, [pageData]);
  
  // Scroll to active section when it changes (for LANDING pages)
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
  
  // Add keyboard navigation for LANDING pages
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
  
  // Add touch support for mobile (LANDING pages)
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
  
  // Function to convert component type to proper case for SectionManager
  const formatComponentType = (type: string): ComponentType => {
    // Convert types like 'hero', 'text', etc. to 'Hero', 'Text', etc.
    const lowercaseType = type.toLowerCase();
    // Handle special cases for custom types
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

        {/* Hero Section Skeleton */}
        <div className="relative min-h-[500px] bg-gradient-to-br from-blue-50 to-indigo-50">
          <div className="container mx-auto px-4 py-20">
            <div className="max-w-4xl mx-auto text-center">
              <div className="w-16 h-6 bg-gray-200 rounded mx-auto mb-6 animate-pulse"></div>
              <div className="w-3/4 h-12 bg-gray-200 rounded mx-auto mb-6 animate-pulse"></div>
              <div className="w-2/3 h-6 bg-gray-200 rounded mx-auto mb-8 animate-pulse"></div>
              <div className="flex justify-center gap-4">
                <div className="w-32 h-12 bg-gray-200 rounded animate-pulse"></div>
                <div className="w-32 h-12 bg-gray-200 rounded animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Benefits Section Skeleton */}
        <div className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <div className="w-48 h-8 bg-gray-200 rounded mx-auto mb-4 animate-pulse"></div>
              <div className="w-96 h-6 bg-gray-200 rounded mx-auto animate-pulse"></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="text-center">
                  <div className="w-16 h-16 bg-gray-200 rounded-full mx-auto mb-4 animate-pulse"></div>
                  <div className="w-32 h-6 bg-gray-200 rounded mx-auto mb-2 animate-pulse"></div>
                  <div className="w-48 h-4 bg-gray-200 rounded mx-auto animate-pulse"></div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Additional Content Skeleton */}
        <div className="py-16 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {[...Array(2)].map((_, i) => (
                <div key={i} className="bg-white p-6 rounded-lg shadow-sm">
                  <div className="w-full h-20 bg-gray-200 rounded mb-4 animate-pulse"></div>
                  <div className="flex items-center space-x-4">
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

        {/* Footer Skeleton */}
        <div className="bg-gray-900 text-white py-12">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
              <div>
                <div className="w-32 h-8 bg-gray-700 rounded mb-4 animate-pulse"></div>
                <div className="w-48 h-4 bg-gray-700 rounded animate-pulse"></div>
              </div>
              {[...Array(3)].map((_, i) => (
                <div key={i}>
                  <div className="w-24 h-5 bg-gray-700 rounded mb-4 animate-pulse"></div>
                  <div className="space-y-2">
                    <div className="w-20 h-4 bg-gray-700 rounded animate-pulse"></div>
                    <div className="w-24 h-4 bg-gray-700 rounded animate-pulse"></div>
                    <div className="w-16 h-4 bg-gray-700 rounded animate-pulse"></div>
                  </div>
                </div>
              ))}
            </div>
            <div className="border-t border-gray-700 pt-8 flex justify-between items-center">
              <div className="w-48 h-4 bg-gray-700 rounded animate-pulse"></div>
              <div className="flex space-x-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="w-6 h-6 bg-gray-700 rounded animate-pulse"></div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Loading Indicator Overlay */}
        <div className="fixed bottom-8 right-8 bg-white rounded-full shadow-lg p-4 z-50">
          <div className="flex items-center space-x-3">
            <Loader2Icon className="h-6 w-6 text-primary animate-spin" />
            <div className="text-sm font-medium text-gray-700">Cargando página...</div>
          </div>
        </div>
      </div>
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
      ? "w-full h-auto flex flex-col items-center justify-start" // Remove overflow-hidden
      : "cms-section w-full";
      
    // Apply container style for smooth scroll
    const containerClassName = pageData?.pageType === 'LANDING'
      ? "w-full h-screen scroll-smooth snap-y snap-mandatory" // Remove overflow properties
      : "flex-1 flex flex-col";

    // Render CMS page content
    return (
      <div className="cms-page w-full h-full"> {/* Add full height/width to the main container */}
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
            
            return (
              <div 
                key={section.id} 
                className={`${sectionClassName} ${hasFixedHeader ? 'has-fixed-header' : ''}`}
                data-section-id={section.id}
                data-section-title={section.title}
                id={`section-${index}`}
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
        </main>
      </div>
    );
  }

  // Fallback to original homepage if no CMS content is available
  return (
    <>
      <Navbar dictionary={dictionary} locale={locale} />
      <Benefits dictionary={dictionary} locale={locale} />
      
      {/* Footer completo (oculto por defecto) */}
      <div id="main-footer" className="hidden">
        <Footer dictionary={dictionary} locale={locale} />
      </div>
      
      {/* Footer de copyright (más pequeño, solo muestra al final) */}
      <div className={`copyright-footer ${showCopyright ? 'visible' : ''}`}>
        <CopyrightFooter dictionary={dictionary} />
      </div>
    </>
  );
} 