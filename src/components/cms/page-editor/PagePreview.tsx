'use client';

import React, { useState, useEffect } from 'react';
import { cmsOperations } from '@/lib/graphql-client';
import SectionManager from '@/components/cms/SectionManager';
import { useParams } from 'next/navigation';
import NavigationHeader from '@/components/Navigation/NavigationHeader';
import Sidebar from '@/components/Navigation/Sidebar';
import Footer from '@/components/Navigation/Footer';

// Define the necessary interface types
interface MenuItem {
  id: string;
  title: string;
  url: string | null;
  pageId: string | null;
  target: string | null;
  icon: string | null;
  order: number;
  children?: MenuItem[];
  page?: { id: string; title: string; slug: string };
}

interface Menu {
  id: string;
  name: string;
  location: string | null;
  locationType: string | null;
  isFixed: boolean | null;
  backgroundColor: string | null;
  textColor: string | null;
  items: MenuItem[];
}

interface ComponentData {
  id: string;
  type: string;
  data: Record<string, unknown>;
}

interface SectionData {
  id: string;
  title?: string;
  order: number;
  components: ComponentData[];
}

interface PagePreviewProps {
  sections: SectionData[];
  pageTitle: string;
  pageType?: string;
}

const PagePreview: React.FC<PagePreviewProps> = ({ 
  sections,
  pageTitle,
  pageType = 'CONTENT'
}) => {
  const [menus, setMenus] = useState<Menu[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const params = useParams();
  const locale = params.locale as string || 'en';

  // Load menus for the page
  useEffect(() => {
    async function loadMenus() {
      try {
        setIsLoading(true);
        const menusData = await cmsOperations.getMenus();
        if (Array.isArray(menusData)) {
          setMenus(menusData);
        }
      } catch (error) {
        console.error('Error loading menus:', error);
      } finally {
        setIsLoading(false);
      }
    }
    
    loadMenus();
  }, []);

  // Format component type to match what SectionManager expects
  const formatComponentType = (type: string): 'Hero' | 'Text' | 'Image' | 'Feature' | 'Testimonial' | 'Header' | 'Card' | 'Benefit' => {
    const lowercaseType = type.toLowerCase();
    if (lowercaseType === 'benefit' || lowercaseType === 'benefits') {
      return 'Benefit';
    }
    return (lowercaseType.charAt(0).toUpperCase() + lowercaseType.slice(1)) as 'Hero' | 'Text' | 'Image' | 'Feature' | 'Testimonial' | 'Header' | 'Card' | 'Benefit';
  };

  // Determine container style based on page type
  const containerClassName = pageType === 'LANDING'
    ? "w-full h-screen overflow-x-hidden overflow-y-auto scroll-smooth snap-y snap-mandatory"
    : "flex-1 flex flex-col";

  // Check if we have a Header section or need to use a menu-based header
  const hasHeaderComponent = sections.some(section => 
    section.components.some(comp => comp.type.toLowerCase() === 'header')
  );

  // Check if we need a fixed header spacer
  const needsHeaderSpacer = 
    hasHeaderComponent ? 
      sections.some(section => 
        section.components.some(comp => 
          comp.type.toLowerCase() === 'header' && 
          (comp.data?.isFixed === true || comp.data?.isFixed === 'true')
        )
      ) :
      menus.some(menu => menu.locationType === 'HEADER' && menu.isFixed);

  return (
    <div className="cms-page-preview">
      {/* Show loading indicator if still loading menus */}
      {isLoading ? (
        <div className="flex items-center justify-center h-16 bg-muted">
          Loading page preview...
        </div>
      ) : (
        <>
          {/* Header Menu - only if no HeaderSection component exists */}
          {!hasHeaderComponent && menus.filter(menu => menu.locationType === 'HEADER').map((menu) => (
            <NavigationHeader 
              key={menu.id}
              menu={menu}
              // Extract logo and subtitle from any Header component
              logoUrl={sections.flatMap(section => 
                section.components.filter(comp => 
                  comp.type.toLowerCase() === 'header' && comp.data?.logoUrl
                ).map(comp => comp.data.logoUrl as string)
              )[0] || ''}
              subtitle={sections.flatMap(section => 
                section.components.filter(comp => 
                  comp.type.toLowerCase() === 'header' && comp.data?.subtitle
                ).map(comp => comp.data.subtitle as string)
              )[0] || pageTitle}
              // Pass the locale to NavigationHeader
              locale={locale}
            />
          ))}

          {/* Sidebar Menu */}
          {menus.filter(menu => menu.locationType === 'SIDEBAR').map((menu) => (
            <Sidebar
              key={menu.id}
              menu={menu}
              logoUrl={sections.flatMap(section => 
                section.components.filter(comp => 
                  comp.type.toLowerCase() === 'header' && comp.data?.logoUrl
                ).map(comp => comp.data.logoUrl as string)
              )[0] || ''}
              locale={locale}
            />
          ))}
          
          {/* Preview Notice */}
          <div className="bg-yellow-50 text-yellow-800 py-2 px-4 text-center text-sm border-b border-yellow-200">
            Vista previa - Los cambios no están guardados
          </div>
          
          {/* Page Content */}
          <main className={containerClassName}>
            {/* Fixed header spacer if needed */}
            {needsHeaderSpacer && <div className="h-16"></div>}
            
            {/* Sections with Components */}
            {sections.map((section, index) => (
              <div 
                key={section.id} 
                className="w-full"
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
                      componentClassName={(type: string) => {
                        const isFixedHeader = type.toLowerCase() === 'header' && 
                          section.components.some(c => 
                            c.type.toLowerCase() === 'header' && 
                            (c.data?.isFixed === true || c.data?.isFixed === 'true')
                          );
                        
                        let classNames = `w-full component-${type.toLowerCase()}`;
                        
                        if (isFixedHeader) {
                          classNames += ' fixed-header z-50';
                        }
                        
                        return classNames;
                      }}
                    />
                  </div>
                ) : (
                  <div className="py-8 text-center bg-gray-100 my-4">
                    <p className="text-gray-500">Esta sección no tiene componentes.</p>
                  </div>
                )}
              </div>
            ))}
            
            {/* Empty state if no sections */}
            {sections.length === 0 && (
              <div className="container mx-auto py-16 px-4 text-center">
                <h1 className="text-3xl font-bold mb-4">{pageTitle}</h1>
                <p className="text-gray-500">Esta página no tiene secciones.</p>
              </div>
            )}
          </main>

          {/* Footer Menu */}
          {menus.filter(menu => menu.locationType === 'FOOTER').map((menu) => (
            <Footer
              key={menu.id}
              menu={menu}
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
              copyright={pageTitle}
              locale={locale}
            />
          ))}
        </>
      )}
    </div>
  );
};

export default PagePreview; 