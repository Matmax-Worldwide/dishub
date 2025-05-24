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
type ComponentType = 'Hero' | 'Text' | 'Image' | 'Feature' | 'Testimonial' | 'Header' | 'Card' | 'Benefit' | 'Form' | 'Footer';

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
  
  // Function to convert component type to proper case for SectionManager
  const formatComponentType = (type: string): ComponentType => {
    // Convert types like 'hero', 'text', etc. to 'Hero', 'Text', etc.
    const lowercaseType = type.toLowerCase();
    // Handle special cases for custom types
    if (lowercaseType === 'benefit' || lowercaseType === 'benefits') {
      return 'Benefit' as ComponentType;
    }
    return (lowercaseType.charAt(0).toUpperCase() + lowercaseType.slice(1)) as ComponentType;
  };

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

  if (error && !pageData) {
    // If there's an error but no page data, render the original homepage as fallback
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
                  initialComponents={section.components.map(comp => ({
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
        
        {/* Footer de copyright (más pequeño, solo muestra al final) */}
        <div className={`copyright-footer ${showCopyright ? 'visible' : ''}`}>
          <CopyrightFooter dictionary={dictionary} />
        </div>
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