'use client';

import { useEffect, useState } from 'react';
import Navbar from '../../components/Navigation/Navbar';
import Benefits from '../../components/Benefits';
import Footer from '../../components/Footer';
import CopyrightFooter from '../../components/CopyrightFooter';
import { Dictionary } from '../i18n';
import { cmsOperations } from '@/lib/graphql-client';
import SectionManager from '@/components/cms/SectionManager';
import { Loader2Icon } from 'lucide-react';

interface ClientPageProps {
  locale: string;
  dictionary: Dictionary;
}

// Define component type for SectionManager
type ComponentType = 'Hero' | 'Text' | 'Image' | 'Feature' | 'Testimonial' | 'Header' | 'Card' | 'Benefit' | 'Form' | 'Footer' | 'Article' | 'Blog';

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

  // Apply global overflow hidden using useEffect
  useEffect(() => {
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
  }, []);
  
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
    // Render CMS page content
    return (
      <main className="flex-1 flex flex-col">
        {sections.map((section, index) => (
          <div 
            key={section.id} 
            className="w-full cms-section"
            data-section-id={section.id}
            data-section-title={section.title}
            id={`section-${index}`}
          >
            {section.components.length > 0 ? (
              <div className="w-full">
                <SectionManager 
                  initialComponents={sortComponentsByPriority(section.components).map(comp => ({
                    id: comp.id,
                    type: formatComponentType(comp.type),
                    data: comp.data || {}
                  }))}
                  isEditing={false}
                />
              </div>
            ) : (
              <div className="py-8 text-center bg-accent/5 rounded-lg border border-dashed border-muted my-4 max-w-5xl mx-auto">
                <p className="text-muted-foreground">Esta sección no tiene componentes disponibles.</p>
              </div>
            )}
          </div>
        ))}
      </main>
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