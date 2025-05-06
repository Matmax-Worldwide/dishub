import React from 'react';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import ManageableSection from '@/components/cms/ManageableSection';

// Metadata generation based on page data
export async function generateMetadata({ params }: { params: { slug: string, locale: string } }) {
  const { slug, locale } = params;
  
  // Check if we're in development mode
  const isDev = process.env.NODE_ENV === 'development';
  
  // Fetch page from database
  const page = await prisma.page.findFirst({
    where: {
      slug,
      locale,
      ...(isDev ? {} : { isPublished: true }) // Only filter published in production
    }
  });

  if (!page) {
    return {
      title: 'Page Not Found',
      description: 'The requested page does not exist.'
    };
  }

  return {
    title: page.metaTitle || page.title,
    description: page.metaDescription || page.description,
  };
}

async function getPageData(slug: string, locale: string) {
  console.log(`Fetching page with slug: ${slug}, locale: ${locale}`);
  
  try {
    // Check if we're in development mode
    const isDev = process.env.NODE_ENV === 'development';
    
    // First try to find the page without the isPublished filter in dev mode
    const page = await prisma.page.findFirst({
      where: {
        slug,
        locale,
        ...(isDev ? {} : { isPublished: true }) // Only filter published in production
      },
      include: {
        sections: {
          orderBy: {
            order: 'asc'
          }
        }
      }
    });

    console.log(`Page query result:`, page ? `Found page: ${page.title}` : 'Page not found');
    
    if (!page) {
      // If not found, let's check if ANY page exists with this slug (ignoring locale)
      const anyPageWithSlug = await prisma.page.findFirst({
        where: { slug }
      });
      
      console.log(`Any page with slug ${slug}?`, anyPageWithSlug ? 'Yes' : 'No');
      
      // List all available pages for debugging
      const allPages = await prisma.page.findMany({
        select: { id: true, title: true, slug: true, locale: true, isPublished: true }
      });
      
      console.log(`All available pages:`, allPages);
      
      return null;
    }

    // Check if any navigation menus reference this page
    const menus = await prisma.navigationMenu.findMany({
      where: {
        isActive: true,
        items: {
          some: {
            href: `/${locale}/${slug}`
          }
        }
      },
      include: {
        items: {
          where: {
            isActive: true
          },
          orderBy: {
            order: 'asc'
          }
        }
      }
    });

    console.log(`Found ${menus.length} menus that reference this page`);
    
    return { page, menus };
  } catch (error) {
    console.error('Error fetching page data:', error);
    return null;
  }
}

export default async function DynamicPage({ params }: { params: { slug: string, locale: string } }) {
  const { slug, locale } = params;
  const pageData = await getPageData(slug, locale);
  
  if (!pageData) {
    // For debugging only - let's check if our hard-coded page exists
    try {
      if (slug === 'pagina-de-prueba') {
        // Directly fetch the test page
        const testPage = await prisma.page.findFirst({
          where: { slug },
          include: {
            sections: true
          }
        });
        
        console.log('Direct test page query result:', testPage);
        
        if (testPage) {
          return (
            <main className="min-h-screen">
              <div className="py-8 px-4 bg-yellow-100 text-center">
                <h1 className="text-3xl font-bold">{testPage.title}</h1>
                <p className="mt-4">This page is visible in development mode only (not published)</p>
                <pre className="mt-4 text-left bg-white p-4 rounded overflow-auto max-h-96">
                  {JSON.stringify(testPage, null, 2)}
                </pre>
              </div>
            </main>
          );
        }
      }
    } catch (error) {
      console.error('Error in fallback handler:', error);
    }
    
    notFound();
  }
  
  const { page, menus } = pageData;
  
  return (
    <main className="min-h-screen w-full">
      {/* Navigation Menus if any */}
      {menus.length > 0 && (
        <div className="bg-gray-100 py-4">
          <div className="w-full mx-auto">
            {menus.map(menu => (
              <div key={menu.id} className="mb-4">
                <nav className="flex space-x-4 px-4">
                  {menu.items.map(item => (
                    <a 
                      key={item.id}
                      href={item.href || '#'}
                      target={item.target || '_self'}
                      className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-200"
                    >
                      {item.label}
                    </a>
                  ))}
                </nav>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Page Content Sections - No titles, full width */}
      <div className="w-full">
        {page.sections.map(section => {
          // Extract sectionId from data field if it exists
          const sectionData = section.data as { sectionId?: string } | null;
          const sectionId = sectionData?.sectionId;
          
          if (!sectionId) {
            return null; // Don't render sections without ID
          }
          
          return (
            <div key={section.id}>
              <ManageableSection
                sectionId={sectionId}
                isEditing={false}
                autoSave={false}
              />
            </div>
          );
        })}
        
        {page.sections.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">This page has no content sections.</p>
          </div>
        )}
      </div>
    </main>
  );
}
