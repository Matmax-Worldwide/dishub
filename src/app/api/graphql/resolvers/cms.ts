import { prisma } from '@/lib/prisma';
import { Prisma, PageType, ComponentType } from '@prisma/client';
import crypto from 'crypto';

// Tipo para los componentes de una sección
type SectionComponentWithRelation = {
  id: string;
  componentId: string;
  order: number;
  data: Record<string, unknown> | null;
  component: {
    id: string;
    slug: string;
    name: string;
  };
};

// Type for SEO input data - add this to fix linter errors
type PageSEOInput = {
  title?: string | null;
  description?: string | null;
  keywords?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  twitterTitle?: string;
  twitterDescription?: string;
  twitterImage?: string;
  canonicalUrl?: string;
  structuredData?: Record<string, unknown>;
};

// Definición de los resolvers para CMS
export const cmsResolvers = {
  Query: {
    getAllCMSSections: async () => {
      console.log('======== START getAllCMSSections resolver ========');
      try {
        // Obtener las secciones de la base de datos con sus relaciones
        const sections = await prisma.cMSSection.findMany({
          include: {
            components: {
              include: {
                component: true
              }
            }
          },
          orderBy: {
            updatedAt: 'desc'
          }
        });
        
        console.log(`Se encontraron ${sections.length} secciones`);
        
        return sections;
      } catch (error) {
        console.error('Error al obtener secciones CMS:', error);
        return [];
      }
    },
    
    getPageBySlug: async (_parent: unknown, args: { slug: string }) => {
      console.log('======== START getPageBySlug resolver ========');
      try {
        const { slug } = args;
        
        if (!slug) {
          console.log('Error: Slug is missing');
          return null;
        }
        
        console.log(`Looking for page with slug: ${slug}`);
        
        // Normalize the slug
        const normalizedSlug = slug.replace(/\s+/g, '-').toLowerCase();
        
        // Find page by slug
        const page = await prisma.page.findFirst({
          where: { 
            slug: {
              equals: normalizedSlug,
              mode: 'insensitive'
            }
          },
          include: {
            sections: {
              orderBy: {
                order: 'asc'
              }
            },
            seo: true // Include SEO data
          }
        });
        
        if (!page) {
          console.log(`No page found with slug: ${normalizedSlug}`);
          return null;
        }
        
        // Enhanced logging for SEO data debugging
        console.log(`Page found: ID=${page.id}, Title=${page.title}`);
        console.log(`Direct Meta Data: Title=${page.metaTitle}, Description=${page.metaDescription}`);
        console.log(`Page has SEO relationship: ${page.seo ? 'Yes' : 'No'}`);
        
        // If page doesn't have a SEO record, try to find it explicitly
        if (!page.seo) {
          console.log(`No SEO data found in relationship. Looking up separately by pageId=${page.id}`);
          
          try {
            const seoRecord = await prisma.pageSEO.findUnique({
              where: { pageId: page.id }
            });
            
            if (seoRecord) {
              console.log('Found SEO record separately:', seoRecord);
              // Attach the SEO record to the page
              page.seo = seoRecord;
            } else {
              console.log(`No SEO record found for pageId=${page.id}. Creating a new one.`);
              
              // Create a new SEO record for this page
              // Initialize with values from the page's metaTitle and metaDescription
              const newSeoRecord = await prisma.pageSEO.create({
                data: {
                  pageId: page.id,
                  title: page.metaTitle || '',
                  description: page.metaDescription || '',
                  keywords: '',
                  createdAt: new Date(),
                  updatedAt: new Date()
                }
              });
              
              console.log('Created new SEO record:', newSeoRecord);
              page.seo = newSeoRecord;
            }
          } catch (seoError) {
            console.error('Error finding/creating SEO record:', seoError);
            // Instead of creating an empty SEO object, use a metadata structure
            // that's compatible with the GraphQL schema but not attempting to be a Prisma model
            console.log('Creating a metadata SEO object for client use');
          }
        } else {
          console.log('SEO data found in relationship:', page.seo);
        }
        
        // Make sure the fields in SEO are synced with metaTitle/metaDescription
        if (page.seo) {
          // If seo.title is missing but metaTitle exists, use metaTitle
          if (!page.seo.title && page.metaTitle) {
            page.seo.title = page.metaTitle;
          }
          // If metaTitle is missing but seo.title exists, use seo.title
          else if (!page.metaTitle && page.seo.title) {
            page.metaTitle = page.seo.title;
          }
          
          // Same for description
          if (!page.seo.description && page.metaDescription) {
            page.seo.description = page.metaDescription;
          }
          else if (!page.metaDescription && page.seo.description) {
            page.metaDescription = page.seo.description;
          }
        } else {
          // If there's no SEO object at all, create one based on page meta fields
          console.log('No SEO data found for page, creating a placeholder object');
          page.seo = {
            id: '',
            pageId: '',
            createdAt: new Date(),
            updatedAt: new Date(),
            title: page.metaTitle || '',
            description: page.metaDescription || '',
            keywords: '',
            ogTitle: '',
            ogDescription: '',
            ogImage: '',
            twitterTitle: '',
            twitterDescription: '',
            twitterImage: '',
            canonicalUrl: '',
            structuredData: {}
          };
        }
        
        // Final log of the data being returned
        console.log('Returning page with SEO data:', {
          pageId: page.id,
          metaTitle: page.metaTitle,
          metaDescription: page.metaDescription,
          seoPresent: !!page.seo,
          seoTitle: page.seo?.title || 'none',
          seoDescription: page.seo?.description || 'none'
        });
        
        return page;
      } catch (error) {
        console.error('Error en getPageBySlug:', error);
        return null;
      }
    },
    
    getSectionComponents: async (_parent: unknown, args: { sectionId: string }) => {
      console.log('======== START getSectionComponents resolver ========');
      try {
        console.log('========================================');
        
        // Eliminar parámetros de consulta si existen (para evitar problemas con cache busting)
        let { sectionId } = args;
        if (!sectionId) {
          console.error('Error: sectionId is missing or undefined');
          return { components: [], lastUpdated: null };
        }
        
        if (sectionId && sectionId.includes('?')) {
          sectionId = sectionId.split('?')[0];
          console.log('Limpiando sectionId de parámetros de consulta:', sectionId);
        }
        
        if (sectionId && sectionId.includes('#')) {
          sectionId = sectionId.split('#')[0];
          console.log('Limpiando sectionId de hash:', sectionId);
        }
        
        console.log('CMS RESOLVER: Getting section components for section ID:', sectionId);
        
        // Obtener los datos de la base de datos
        try {
          console.log('Executing database query with sectionId:', sectionId);
          
          // Buscar la sección con sus componentes
          const sectionFromDB = await prisma.cMSSection.findUnique({
            where: { sectionId },
            include: {
              components: {
                include: {
                  component: true
                },
                orderBy: {
                  order: 'asc'
                }
              }
            }
          });
          
          console.log('Query executed, result:', sectionFromDB ? 'found' : 'not found');
          
          if (sectionFromDB) {
            console.log('Section found in database:', sectionId);
            console.log('Raw section data from DB:', JSON.stringify(sectionFromDB, null, 2));
            console.log('Components count:', sectionFromDB.components.length);
            
            // Log each component for debugging
            if (sectionFromDB.components.length > 0) {
              console.log('Components in database:');
              sectionFromDB.components.forEach((sc, index) => {
                console.log(`Component ${index + 1}:`, {
                  id: sc.id,
                  sectionId: sc.sectionId,
                  componentId: sc.componentId,
                  order: sc.order,
                  componentName: sc.component?.name || 'N/A',
                  componentSlug: sc.component?.slug || 'N/A',
                  hasData: sc.data ? true : false
                });
              });
              
              // Transformar los componentes al formato esperado por el cliente
              const components = (sectionFromDB.components as SectionComponentWithRelation[]).map((sc) => ({
                id: sc.id,
                type: sc.component.slug,
                data: sc.data ? sc.data as Prisma.InputJsonValue : Prisma.JsonNull
              }));
              
              console.log('Number of components in section:', components.length);
              console.log('Returning data from database');
              
              return {
                components,
                lastUpdated: sectionFromDB.lastUpdated.toISOString()
              };
            } else {
              console.log('No components found for this section in the database');
              console.log('Section exists but has no components. Initializing with empty array.');
              
              // Section exists but has no components
              return { 
                components: [], 
                lastUpdated: sectionFromDB.lastUpdated.toISOString() 
              };
            }
          } else {
            // Check if the section ID exists but doesn't have the right format
            // Try to find it by matching with the start of the ID
            console.log('Section not found by exact ID, trying to match by prefix...');
            
            const allSections = await prisma.cMSSection.findMany({
              select: { sectionId: true, name: true, id: true }
            });
            
            console.log('All available section IDs:', allSections.map(s => s.sectionId).join(', '));
            
            // Check if any of the existing IDs start with our sectionId or vice versa
            const matchingSection = allSections.find(s => 
              sectionId.startsWith(s.sectionId) || s.sectionId.startsWith(sectionId)
            );
            
            if (matchingSection) {
              console.log('Found potential match!', matchingSection.sectionId);
              console.log('Original sectionId:', sectionId);
              console.log('Matched sectionId:', matchingSection.sectionId);
              
              // Retry with the matched ID
              const matchedSectionData = await prisma.cMSSection.findUnique({
                where: { sectionId: matchingSection.sectionId },
                include: {
                  components: {
                    include: {
                      component: true
                    },
                    orderBy: {
                      order: 'asc'
                    }
                  }
                }
              });
              
              if (matchedSectionData && matchedSectionData.components.length > 0) {
                const components = (matchedSectionData.components as SectionComponentWithRelation[]).map((sc) => ({
                  id: sc.id,
                  type: sc.component.slug,
                  data: sc.data ? sc.data as Prisma.InputJsonValue : Prisma.JsonNull
                }));
                
                console.log('Found components through prefix matching!', components.length);
                
                return {
                  components,
                  lastUpdated: matchedSectionData.lastUpdated.toISOString()
                };
              }
            }
            
            // Check if we need to create a new section with this ID
            console.log('Creating new empty section for ID:', sectionId);
            try {
              const timestamp = new Date();
              
              // Create a new section with the provided ID
              const newSection = await prisma.cMSSection.create({
                data: {
                  sectionId,
                  name: `Sección ${sectionId}`,
                  description: `Sección creada automáticamente`,
                  lastUpdated: timestamp,
                  createdAt: timestamp,
                  updatedAt: timestamp
                }
              });
              
              console.log('Created new section with ID:', newSection.id);
              
              // Return empty components but with the new section's timestamp
              return { 
                components: [], 
                lastUpdated: newSection.lastUpdated.toISOString() 
              };
            } catch (createError) {
              console.error('Error creating new section:', createError);
            }
          }
        } catch (dbError) {
          console.error('Error querying database:', dbError);
          throw dbError;
        }
      } catch (error) {
        console.error('========================================');
        console.error('ERROR: Error fetching section data:', error);
        console.error('========================================');
        return { components: [], lastUpdated: null };
      }
    },

    // Nuevo resolver para obtener todos los componentes CMS
    getAllCMSComponents: async () => {
      console.log('======== START getAllCMSComponents resolver ========');
      try {
        console.log('Obteniendo todos los componentes CMS');
        
        // Obtener los componentes de la base de datos
        const components = await prisma.cMSComponent.findMany({
          orderBy: {
            updatedAt: 'desc'
          }
        });
        
        console.log(`Se encontraron ${components.length} componentes`);
        
        return components;
      } catch (error) {
        console.error('Error al obtener componentes CMS:', error);
        return [];
      }
    },

    // Obtener un componente CMS por ID
    getCMSComponent: async (_parent: unknown, args: { id: string }) => {
      console.log('======== START getCMSComponent resolver ========');
      try {
        const { id } = args;
        console.log(`Obteniendo componente con ID: ${id}`);
        
        const component = await prisma.cMSComponent.findUnique({
          where: { id }
        });
        
        if (!component) {
          console.log(`No se encontró ningún componente con ID: ${id}`);
          return null;
        }
        
        console.log(`Componente encontrado: ${component.name}`);
        return component;
      } catch (error) {
        console.error('Error al obtener componente CMS:', error);
        return null;
      }
    },

    // Obtener componentes CMS por tipo
    getCMSComponentsByType: async (_parent: unknown, args: { type: string }) => {
      console.log('======== START getCMSComponentsByType resolver ========');
      try {
        const { type } = args;
        console.log(`Obteniendo componentes de tipo: ${type}`);
        
        const components = await prisma.cMSComponent.findMany({
          where: {
            category: type
          },
          orderBy: {
            name: 'asc'
          }
        });
        
        console.log(`Se encontraron ${components.length} componentes de tipo ${type}`);
        return components;
      } catch (error) {
        console.error(`Error al obtener componentes de tipo ${args.type}:`, error);
        return [];
      }
    },

    // Obtener todas las páginas CMS
    getAllCMSPages: async () => {
      try {
        // Obtener las páginas de la base de datos con sus secciones
        const pages = await prisma.page.findMany({
          include: {
            sections: {
              select: {
                id: true,
                order: true
              },
              orderBy: {
                order: 'asc'
              }
            }
          },
          orderBy: {
            updatedAt: 'desc'
          }
        });
        return pages;
      } catch (error) {
        console.error('Error al obtener páginas CMS:', error);
        return [];
      }
    },

    // Obtener páginas que usan una sección específica
    getPagesUsingSectionId: async (_parent: unknown, args: { sectionId: string }) => {
      console.log('======== START getPagesUsingSectionId resolver ========');
      try {
        const { sectionId } = args;
        console.log(`Buscando páginas que usan la sección con ID: ${sectionId}`);
        
        // Obtener la sección de la base de datos
        const section = await prisma.cMSSection.findFirst({
          where: { sectionId }
        });
        
        if (!section) {
          console.log(`No se encontró ninguna sección con ID: ${sectionId}`);
          return [];
        }
        
        console.log(`Sección encontrada: ${section.id} (${section.name})`);
        
        // Buscar todas las páginas que tienen secciones con datos que contienen el sectionId
        // La búsqueda es más compleja porque el campo data es de tipo JSON
        const pages = await prisma.$queryRaw`
          SELECT p.* 
          FROM "Page" p 
          JOIN "PageSection" ps ON p."id" = ps."pageId" 
          WHERE ps."data"::jsonb ? 'sectionId' 
          AND ps."data"->>'sectionId' = ${sectionId}
          ORDER BY p."updatedAt" DESC
        `;
        
        console.log(`Se encontraron ${Array.isArray(pages) ? pages.length : 0} páginas que usan la sección ${sectionId}`);
        
        // Si no es un array o está vacío, devolver un array vacío
        if (!Array.isArray(pages) || pages.length === 0) {
          return [];
        }
        
        // Para cada página, cargar sus secciones
        const pagesWithSections = await Promise.all(
          pages.map(async (page) => {
            const sections = await prisma.pageSection.findMany({
              where: {
                pageId: page.id
              },
              select: {
                id: true,
                order: true,
                data: true
              },
              orderBy: {
                order: 'asc'
              }
            });
            
            return {
              ...page,
              sections
            };
          })
        );
        
        return pagesWithSections;
      } catch (error) {
        console.error(`Error al obtener páginas usando sectionId ${args.sectionId}:`, error);
        return [];
      }
    },
  },
  
  Mutation: {
    saveSectionComponents: async (_parent: unknown, args: { 
      input: { 
        sectionId: string; 
        components: Array<{ id: string; type: string; data: Record<string, unknown> }> 
      } 
    }) => {
      try {
        console.log('========================================');
        const { input } = args;
        const { components } = input;
        let { sectionId } = input;
        
        // Eliminar parámetros de consulta si existen (para evitar problemas con cache busting)
        if (sectionId && sectionId.includes('?')) {
          sectionId = sectionId.split('?')[0];
          console.log('Limpiando sectionId de parámetros de consulta:', sectionId);
        }
        
        console.log(`CMS RESOLVER: Saving ${components?.length || 0} components for section ${sectionId}`);
        
        // Check if components array is valid
        if (!components || !Array.isArray(components)) {
          console.error('No valid components array provided');
          return {
            success: false,
            message: 'No valid components array provided',
            lastUpdated: null
          };
        }
        
        // Validate component data
        const validComponents = components.filter(c => {
          if (!c.id) {
            console.error('Component without ID found, skipping');
            return false;
          }
          if (!c.type) {
            console.error(`Component ${c.id} has no type, skipping`);
            return false;
          }
          return true;
        });
        
        if (validComponents.length !== components.length) {
          console.warn(`Found ${components.length - validComponents.length} invalid components, will only save valid ones`);
        }
        
        // Check if components array is not empty before trying to log the first component
        if (validComponents.length > 0) {
          console.log('First component:', JSON.stringify(validComponents[0]).substring(0, 100) + '...');
          console.log('Components to save:', validComponents.map(c => `${c.id} (${c.type})`).join(', '));
        } else {
          console.log('No components to save');
        }
        
        const timestamp = new Date();
        
        // Guardar en la base de datos utilizando Prisma
        try {
          // Buscar si ya existe la sección
          const existingSection = await prisma.cMSSection.findUnique({
            where: { sectionId }
          });
          
          if (existingSection) {
            // Actualizar la sección existente
            console.log('Updating existing section in database:', sectionId);
            
            // 1. Eliminar las relaciones existentes para recrearlas
            await prisma.$executeRaw(
              Prisma.sql`DELETE FROM "SectionComponent" WHERE "sectionId" = ${existingSection.id}`
            );
            
            // 2. Actualizar la sección
            const updatedSection = await prisma.cMSSection.update({
              where: { id: existingSection.id },
              data: {
                lastUpdated: timestamp,
                updatedAt: timestamp
              }
            });
            
            // 3. Crear nuevas relaciones con componentes
            if (validComponents.length > 0) {
              // Por cada componente, buscar si existe o crearlo
              for (let i = 0; i < validComponents.length; i++) {
                const component = validComponents[i];
                
                // Buscar el componente por tipo o crearlo si no existe
                let cmsComponent = await prisma.cMSComponent.findFirst({
                  where: { slug: component.type }
                });
                
                if (!cmsComponent) {
                  // Crear el componente si no existe
                  cmsComponent = await prisma.cMSComponent.create({
                    data: {
                      name: component.type,
                      slug: component.type,
                      description: `Componente tipo ${component.type}`,
                      schema: {}, // Schema vacío por defecto
                      isActive: true,
                      createdAt: timestamp,
                      updatedAt: timestamp
                    }
                  });
                }
                
                console.log(`Creating relationship for component ${component.id || 'new'} (type: ${component.type})`);
                
                // Use provided component ID if it exists, otherwise generate a new one
                const componentId = component.id || crypto.randomUUID();
                
                // Crear la relación entre sección y componente
                await prisma.$executeRaw(
                  Prisma.sql`
                  INSERT INTO "SectionComponent" 
                  ("id", "sectionId", "componentId", "order", "data", "createdAt", "updatedAt") 
                  VALUES (
                    ${componentId}, 
                    ${updatedSection.id}, 
                    ${cmsComponent.id}, 
                    ${i}, 
                    ${Prisma.sql`${JSON.stringify(component.data || {})}::jsonb`}, 
                    ${timestamp}, 
                    ${timestamp}
                  )
                  ON CONFLICT ("sectionId", "componentId", "order") 
                  DO UPDATE SET 
                    "data" = ${Prisma.sql`${JSON.stringify(component.data || {})}::jsonb`},
                    "updatedAt" = ${timestamp}
                  `
                );
              }
            }
            
            console.log('Section updated successfully with new components');
          } else {
            // Crear una nueva sección
            console.log('Creating new section in database:', sectionId);
            
            // 1. Crear la sección
            const newSection = await prisma.cMSSection.create({
              data: {
                sectionId,
                name: sectionId.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
                description: `Sección "${sectionId}"`,
                lastUpdated: timestamp,
                createdAt: timestamp,
                updatedAt: timestamp
              }
            });
            
            // 2. Crear relaciones con componentes
            if (validComponents.length > 0) {
              // Por cada componente, buscar si existe o crearlo
              for (let i = 0; i < validComponents.length; i++) {
                const component = validComponents[i];
                
                // Buscar el componente por tipo o crearlo si no existe
                let cmsComponent = await prisma.cMSComponent.findFirst({
                  where: { slug: component.type }
                });
                
                if (!cmsComponent) {
                  // Crear el componente si no existe
                  cmsComponent = await prisma.cMSComponent.create({
                    data: {
                      name: component.type,
                      slug: component.type,
                      description: `Componente tipo ${component.type}`,
                      schema: {}, // Schema vacío por defecto
                      isActive: true,
                      createdAt: timestamp,
                      updatedAt: timestamp
                    }
                  });
                }
                
                console.log(`Creating relationship for component ${component.id || 'new'} (type: ${component.type})`);
                
                // Use provided component ID if it exists, otherwise generate a new one
                const componentId = component.id || crypto.randomUUID();
                
                // Crear la relación entre sección y componente
                await prisma.$executeRaw(
                  Prisma.sql`
                  INSERT INTO "SectionComponent" 
                  ("id", "sectionId", "componentId", "order", "data", "createdAt", "updatedAt") 
                  VALUES (
                    ${componentId}, 
                    ${newSection.id}, 
                    ${cmsComponent.id}, 
                    ${i}, 
                    ${Prisma.sql`${JSON.stringify(component.data || {})}::jsonb`}, 
                    ${timestamp}, 
                    ${timestamp}
                  )
                  ON CONFLICT ("sectionId", "componentId", "order") 
                  DO UPDATE SET 
                    "data" = ${Prisma.sql`${JSON.stringify(component.data || {})}::jsonb`},
                    "updatedAt" = ${timestamp}
                  `
                );
              }
            }
            
            console.log('New section created successfully with components');
          }
          
          const result = {
            success: true,
            message: 'Components saved successfully',
            lastUpdated: timestamp.toISOString(),
          };
          
          console.log('Save result:', result);
          console.log('========================================');
          return result;
        } catch (dbError) {
          console.error('Error saving to database:', dbError);
          throw dbError;
        }
      } catch (error) {
        console.error('========================================');
        console.error('ERROR: Error saving section data:', error);
        console.error('========================================');
        return {
          success: false,
          message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
          lastUpdated: null,
        };
      }
    },

    deleteCMSSection: async (_parent: unknown, args: { sectionId: string }) => {
      console.log('======== START deleteCMSSection resolver ========');
      try {
        const { sectionId } = args;
        console.log(`Intentando eliminar la sección con ID: ${sectionId}`);
        
        // Verificar si la sección existe antes de intentar eliminarla
        const existingSection = await prisma.cMSSection.findFirst({
          where: { sectionId }
        });
        
        if (!existingSection) {
          console.log(`No se encontró ninguna sección con ID: ${sectionId}`);
          return {
            success: false,
            message: `No se encontró ninguna sección con ID: ${sectionId}`
          };
        }
        
        // Contar los componentes asociados
        const countResult = await prisma.$queryRaw<[{count: number}]>(
          Prisma.sql`SELECT COUNT(*) as count FROM "SectionComponent" WHERE "sectionId" = ${existingSection.id}`
        );
        
        const componentCount = Number(countResult[0]?.count || 0);
        
        // Eliminar las relaciones primero (debería eliminarse automáticamente por CASCADE pero por seguridad)
        await prisma.$executeRaw(
          Prisma.sql`DELETE FROM "SectionComponent" WHERE "sectionId" = ${existingSection.id}`
        );
        
        // Eliminar la sección
        await prisma.cMSSection.delete({
          where: { id: existingSection.id }
        });
        
        console.log(`Sección con ID: ${sectionId} eliminada correctamente`);
        console.log(`Se desvincularon ${componentCount} componentes de la sección`);
        
        return {
          success: true,
          message: `Sección eliminada correctamente. Se desvincularon ${componentCount} componentes.`
        };
      } catch (error) {
        console.error('Error al eliminar la sección CMS:', error);
        return {
          success: false,
          message: `Error al eliminar la sección: ${error instanceof Error ? error.message : 'Error desconocido'}`
        };
      }
    },

    // Nuevo mutation para crear un componente CMS
    createCMSComponent: async (_parent: unknown, args: { 
      input: { 
        name: string;
        slug: string;
        description?: string;
        category?: string;
        schema?: Record<string, unknown>;
        icon?: string;
      } 
    }) => {
      console.log('======== START createCMSComponent resolver ========');
      try {
        const { input } = args;
        console.log(`Creando nuevo componente: ${input.name}`);
        
        // Validar campos obligatorios
        if (!input.name || !input.slug) {
          throw new Error('Nombre y slug son campos requeridos');
        }
        
        // Verificar si ya existe un componente con el mismo slug
        const existingComponent = await prisma.cMSComponent.findFirst({
          where: { slug: input.slug }
        });
        
        if (existingComponent) {
          return {
            success: false,
            message: `Ya existe un componente con el slug: ${input.slug}`,
            component: null
          };
        }
        
        const timestamp = new Date();
        
        // Crear el nuevo componente
        const newComponent = await prisma.cMSComponent.create({
          data: {
            name: input.name,
            slug: input.slug,
            description: input.description || `Componente ${input.name}`,
            category: input.category || null,
            schema: input.schema as Prisma.InputJsonValue || Prisma.JsonNull,
            icon: input.icon || null,
            isActive: true,
            createdAt: timestamp,
            updatedAt: timestamp
          }
        });
        
        console.log(`Componente creado correctamente: ${newComponent.id}`);
        
        return {
          success: true,
          message: `Componente ${input.name} creado correctamente`,
          component: newComponent
        };
      } catch (error) {
        console.error('Error al crear componente CMS:', error);
        return {
          success: false,
          message: `Error al crear componente: ${error instanceof Error ? error.message : 'Error desconocido'}`,
          component: null
        };
      }
    },

    // Mutation para actualizar un componente CMS
    updateCMSComponent: async (_parent: unknown, args: { 
      id: string;
      input: { 
        name?: string;
        description?: string;
        category?: string;
        schema?: Record<string, unknown>;
        icon?: string;
        isActive?: boolean;
      } 
    }) => {
      console.log('======== START updateCMSComponent resolver ========');
      try {
        const { id, input } = args;
        console.log(`Actualizando componente con ID: ${id}`);
        
        // Verificar si el componente existe
        const existingComponent = await prisma.cMSComponent.findUnique({
          where: { id }
        });
        
        if (!existingComponent) {
          return {
            success: false,
            message: `No se encontró ningún componente con ID: ${id}`,
            component: null
          };
        }
        
        // Actualizar el componente
        const updatedComponent = await prisma.cMSComponent.update({
          where: { id },
          data: {
            ...(input.name && { name: input.name }),
            ...(input.description && { description: input.description }),
            ...(input.category !== undefined && { category: input.category }),
            ...(input.schema !== undefined && { schema: input.schema as Prisma.InputJsonValue }),
            ...(input.icon !== undefined && { icon: input.icon }),
            ...(input.isActive !== undefined && { isActive: input.isActive }),
            updatedAt: new Date()
          }
        });
        
        console.log(`Componente actualizado correctamente: ${updatedComponent.id}`);
        
        return {
          success: true,
          message: `Componente actualizado correctamente`,
          component: updatedComponent
        };
      } catch (error) {
        console.error('Error al actualizar componente CMS:', error);
        return {
          success: false,
          message: `Error al actualizar componente: ${error instanceof Error ? error.message : 'Error desconocido'}`,
          component: null
        };
      }
    },

    // Mutation para eliminar un componente CMS
    deleteCMSComponent: async (_parent: unknown, args: { id: string }) => {
      console.log('======== START deleteCMSComponent resolver ========');
      try {
        const { id } = args;
        console.log(`Intentando eliminar el componente con ID: ${id}`);
        
        // Verificar si el componente existe
        const existingComponent = await prisma.cMSComponent.findUnique({
          where: { id }
        });
        
        if (!existingComponent) {
          return {
            success: false,
            message: `No se encontró ningún componente con ID: ${id}`
          };
        }
        
        // Verificar si el componente está siendo utilizado en secciones
        const usageCount = await prisma.sectionComponent.count({
          where: { componentId: id }
        });
        
        if (usageCount > 0) {
          return {
            success: false,
            message: `No se puede eliminar el componente porque está siendo utilizado en ${usageCount} secciones`
          };
        }
        
        // Eliminar el componente
        await prisma.cMSComponent.delete({
          where: { id }
        });
        
        console.log(`Componente con ID: ${id} eliminado correctamente`);
        
        return {
          success: true,
          message: `Componente eliminado correctamente`
        };
      } catch (error) {
        console.error('Error al eliminar componente CMS:', error);
        return {
          success: false,
          message: `Error al eliminar componente: ${error instanceof Error ? error.message : 'Error desconocido'}`
        };
      }
    },

    // Mutation para actualizar una sección CMS
    updateCMSSection: async (_parent: unknown, args: { 
      sectionId: string;
      input: { 
        name?: string;
        description?: string;
      } 
    }) => {
      console.log('======== START updateCMSSection resolver ========');
      try {
        const { sectionId, input } = args;
        console.log(`Actualizando sección con ID: ${sectionId}`);
        
        // Verificar si la sección existe
        const existingSection = await prisma.cMSSection.findFirst({
          where: { sectionId }
        });
        
        if (!existingSection) {
          console.log(`No se encontró ninguna sección con ID: ${sectionId}`);
          return {
            success: false,
            message: `No se encontró ninguna sección con ID: ${sectionId}`
          };
        }
        
        // Actualizar la sección
        const timestamp = new Date();
        const updatedSection = await prisma.cMSSection.update({
          where: { id: existingSection.id },
          data: {
            ...(input.name && { name: input.name }),
            ...(input.description && { description: input.description }),
            lastUpdated: timestamp,
            updatedAt: timestamp
          }
        });
        
        console.log(`Sección "${updatedSection.name}" actualizada correctamente`);
        
        return {
          success: true,
          message: `Sección actualizada correctamente`,
          lastUpdated: timestamp.toISOString()
        };
      } catch (error) {
        console.error('Error al actualizar sección CMS:', error);
        return {
          success: false,
          message: `Error al actualizar sección: ${error instanceof Error ? error.message : 'Error desconocido'}`,
          lastUpdated: null
        };
      }
    },

    // Crear página CMS
    createPage: async (_parent: unknown, args: { 
      input: { 
        title: string;
        slug: string;
        description?: string;
        template?: string;
        isPublished?: boolean;
        publishDate?: string | null;
        featuredImage?: string | null;
        metaTitle?: string | null;
        metaDescription?: string | null;
        parentId?: string | null;
        order?: number;
        pageType?: string;
        locale?: string;
        sections?: string[];
      } 
    }) => {
      console.log('======== START createPage resolver ========');
      try {
        const { input } = args;
        console.log(`Creando nueva página: ${input.title} (${input.slug})`);
        
        // Validar campos obligatorios
        if (!input.title || !input.slug) {
          throw new Error('El título y el slug son campos requeridos');
        }
        
        // Verificar si ya existe una página con el mismo slug
        const existingPage = await prisma.page.findFirst({
          where: { slug: input.slug }
        });
        
        if (existingPage) {
          return {
            success: false,
            message: `Ya existe una página con el slug: ${input.slug}`,
            page: null
          };
        }
        
        const timestamp = new Date();
        
        // Crear la página en la base de datos
        const newPage = await prisma.page.create({
          data: {
            title: input.title,
            slug: input.slug,
            description: input.description || null,
            template: input.template || "default",
            isPublished: input.isPublished || false,
            publishDate: input.publishDate ? new Date(input.publishDate) : null,
            featuredImage: input.featuredImage || null,
            metaTitle: input.metaTitle || null,
            metaDescription: input.metaDescription || null,
            parentId: input.parentId || null,
            order: input.order !== undefined ? input.order : 0,
            pageType: (input.pageType as PageType) || PageType.CONTENT,
            locale: input.locale || "en",
            createdById: "system",
            createdAt: timestamp,
            updatedAt: timestamp
          }
        });
        
        // Si hay secciones, crear relaciones
        if (input.sections && input.sections.length > 0) {
          for (let i = 0; i < input.sections.length; i++) {
            const sectionId = input.sections[i];
            
            // Buscar la sección en la base de datos
            const section = await prisma.cMSSection.findFirst({
              where: { sectionId }
            });
            
            if (section) {
              // Crear relación entre la página y la sección
              await prisma.pageSection.create({
                data: {
                  pageId: newPage.id,
                  title: `Section ${i + 1}`,
                  componentType: "CUSTOM",
                  order: i,
                  isVisible: true,
                  data: { sectionId },
                  createdAt: timestamp,
                  updatedAt: timestamp
                }
              });
            } else {
              console.warn(`Sección con ID ${sectionId} no encontrada, omitiendo`);
            }
          }
        }
        
        console.log(`Página creada correctamente: ${newPage.id}`);
        
        // Obtener la página completa con sus secciones
        const pageWithSections = await prisma.page.findUnique({
          where: { id: newPage.id },
          include: {
            sections: {
              select: {
                id: true,
                order: true
              },
              orderBy: {
                order: 'asc'
              }
            }
          }
        });
        
        return {
          success: true,
          message: `Página "${input.title}" creada correctamente`,
          page: pageWithSections
        };
      } catch (error) {
        console.error('Error al crear página CMS:', error);
        return {
          success: false,
          message: `Error al crear página: ${error instanceof Error ? error.message : 'Error desconocido'}`,
          page: null
        };
      }
    },

    // Update page mutation
    updatePage: async (_parent: unknown, args: { 
      id: string;
      input: { 
        title?: string;
        slug?: string;
        description?: string | null;
        template?: string;
        isPublished?: boolean;
        publishDate?: string | null;
        featuredImage?: string | null;
        metaTitle?: string | null;
        metaDescription?: string | null;
        parentId?: string | null;
        order?: number;
        pageType?: string;
        locale?: string;
        seo?: PageSEOInput;
        sectionIds?: string[]; // Lista de IDs de secciones
      } 
    }) => {
      console.log('======== START updatePage resolver ========');
      try {
        const { id, input } = args;
        
        // Verificar si la página existe
        const existingPage = await prisma.page.findUnique({
          where: { id },
          include: {
            sections: true,
            seo: true
          }
        });
        
        if (!existingPage) {
          return {
            success: false,
            message: `No se encontró ninguna página con ID: ${id}`,
            page: null
          };
        }

        // Synchronize metaTitle/metaDescription with SEO fields if needed
        const seoData = input.seo || {};
        
        // If metaTitle/metaDescription are provided, use them to update SEO title/description
        if (input.metaTitle !== undefined && seoData.title === undefined) {
          seoData.title = input.metaTitle;
        } else if (seoData.title !== undefined && input.metaTitle === undefined) {
          input.metaTitle = seoData.title;
        }
        
        if (input.metaDescription !== undefined && seoData.description === undefined) {
          seoData.description = input.metaDescription;
        } else if (seoData.description !== undefined && input.metaDescription === undefined) {
          input.metaDescription = seoData.description;
        }
        
        // Actualizar la página básica
        const updatedPage = await prisma.page.update({
          where: { id },
          data: {
            ...(input.title !== undefined && { title: input.title }),
            ...(input.slug !== undefined && { slug: input.slug }),
            ...(input.description !== undefined && { description: input.description }),
            ...(input.template !== undefined && { template: input.template }),
            ...(input.isPublished !== undefined && { isPublished: input.isPublished }),
            ...(input.publishDate !== undefined && { 
              publishDate: input.publishDate && input.publishDate.trim && input.publishDate.trim() !== '' 
                ? (new Date(input.publishDate)).toString() !== 'Invalid Date' 
                  ? new Date(input.publishDate) 
                  : null
                : null 
            }),
            ...(input.featuredImage !== undefined && { featuredImage: input.featuredImage }),
            ...(input.metaTitle !== undefined && { metaTitle: input.metaTitle }),
            ...(input.metaDescription !== undefined && { metaDescription: input.metaDescription }),
            ...(input.parentId !== undefined && { parentId: input.parentId }),
            ...(input.order !== undefined && { order: input.order }),
            ...(input.pageType !== undefined && { pageType: input.pageType as PageType }),
            ...(input.locale !== undefined && { locale: input.locale }),
            updatedAt: new Date()
          },
          include: {
            sections: true,
            seo: true
          }
        });
        
        // Handle SEO data if provided or synchronized from meta fields
        if (input.seo || input.metaTitle !== undefined || input.metaDescription !== undefined) {
          try {
            // Prepare SEO data with synchronized fields
            const seoUpdateData = {
              ...(seoData.keywords !== undefined && { keywords: seoData.keywords }),
              ...(seoData.title !== undefined && { title: seoData.title }),
              ...(seoData.description !== undefined && { description: seoData.description }),
              ...(seoData.ogTitle !== undefined && { ogTitle: seoData.ogTitle }),
              ...(seoData.ogDescription !== undefined && { ogDescription: seoData.ogDescription }),
              ...(seoData.ogImage !== undefined && { ogImage: seoData.ogImage }),
              ...(seoData.twitterTitle !== undefined && { twitterTitle: seoData.twitterTitle }),
              ...(seoData.twitterDescription !== undefined && { twitterDescription: seoData.twitterDescription }),
              ...(seoData.twitterImage !== undefined && { twitterImage: seoData.twitterImage }),
              ...(seoData.canonicalUrl !== undefined && { canonicalUrl: seoData.canonicalUrl }),
              ...(seoData.structuredData !== undefined && { 
                structuredData: seoData.structuredData as Prisma.InputJsonValue 
              }),
              updatedAt: new Date()
            };
            
            // Check if page already has SEO data
            if (existingPage.seo) {
              // Update existing SEO record
              await prisma.pageSEO.update({
                where: { pageId: id },
                data: seoUpdateData
              });
              console.log(`Updated existing SEO data for page ${id}`);
            } else {
              // Create new SEO record
              await prisma.pageSEO.create({
                data: {
                  pageId: id,
                  ...seoUpdateData
                }
              });
              console.log(`Created new SEO data for page ${id}`);
            }
          } catch (seoError) {
            console.error('Error updating SEO data:', seoError);
            // Continue with the rest of the update even if SEO fails
          }
        }
        
        // Si se proporcionan sectionIds, actualizar las secciones de la página
        if (input.sectionIds && Array.isArray(input.sectionIds)) {
          console.log(`Actualizando secciones para la página: ${input.sectionIds.join(', ')}`);
          
          try {
            // Primero desconectar todas las secciones actuales
            await prisma.page.update({
              where: { id },
              data: {
                sections: {
                  set: [] // Desconectar todas las secciones existentes
                }
              }
            });
            
            // Ahora conectar las nuevas secciones
            if (input.sectionIds.length > 0) {
              await prisma.page.update({
                where: { id },
                data: {
                  sections: {
                    connect: input.sectionIds.map(sectionId => ({ id: sectionId }))
                  }
                }
              });
            }
            
            console.log(`Secciones actualizadas correctamente para la página ${id}`);
          } catch (sectionError) {
            console.error('Error actualizando secciones:', sectionError);
          }
        }
        
        // Obtener la página actualizada con sus secciones
        const pageWithSections = await prisma.page.findUnique({
          where: { id },
          include: {
            sections: {
              orderBy: {
                order: 'asc'
              }
            },
            seo: true
          }
        });
        
        console.log(`Página "${updatedPage.title}" actualizada correctamente`);
        
        return {
          success: true,
          message: `Página "${updatedPage.title}" actualizada correctamente`,
          page: pageWithSections
        };
      } catch (error) {
        console.error('Error al actualizar página CMS:', error);
        return {
          success: false,
          message: `Error al actualizar página: ${error instanceof Error ? error.message : 'Error desconocido'}`,
          page: null
        };
      }
    },

    // Eliminar página CMS
    deletePage: async (_parent: unknown, args: { id: string }) => {
      console.log('======== START deletePage resolver ========');
      try {
        const { id } = args;
        console.log(`Eliminando página con ID: ${id}`);
        
        // Verificar si la página existe
        const existingPage = await prisma.page.findUnique({
          where: { id },
          include: {
            sections: true
          }
        });
        
        if (!existingPage) {
          return {
            success: false,
            message: `No se encontró ninguna página con ID: ${id}`,
          };
        }
        
        // Eliminar primero las secciones asociadas a la página
        if (existingPage.sections.length > 0) {
          const sectionIds = existingPage.sections.map(section => section.id);
          
          // Eliminar todas las secciones de la página
          await prisma.pageSection.deleteMany({
            where: {
              id: {
                in: sectionIds
              }
            }
          });
          
          console.log(`Se eliminaron ${sectionIds.length} secciones asociadas a la página`);
        }
        
        // Eliminar la página
        await prisma.page.delete({
          where: { id }
        });
        
        console.log(`Página "${existingPage.title}" eliminada correctamente`);
        
        return {
          success: true,
          message: `Página "${existingPage.title}" eliminada correctamente`,
        };
      } catch (error) {
        console.error('Error al eliminar página CMS:', error);
        return {
          success: false,
          message: `Error al eliminar página: ${error instanceof Error ? error.message : 'Error desconocido'}`,
        };
      }
    },

    // Crear una sección CMS
    createCMSSection: async (_parent: unknown, args: { 
      input: { 
        sectionId: string;
        name: string;
        description?: string;
      } 
    }, context: { user?: { id: string } }) => {
      // Registrar la operación
      console.log('📝 Starting createCMSSection resolver');
      console.log('Input data:', JSON.stringify(args.input, null, 2));
      
      try {
        const { input } = args;
        
        // Validar que los campos obligatorios estén presentes
        if (!input.sectionId || !input.name) {
          console.error('❌ Missing required fields in createCMSSection');
          return {
            success: false,
            message: 'Los campos sectionId y name son requeridos',
            section: null
          };
        }
        
        // Verificar si ya existe una sección con el mismo sectionId
        const existingSection = await prisma.cMSSection.findFirst({
          where: { sectionId: input.sectionId }
        });
        
        if (existingSection) {
          console.log(`⚠️ Section with sectionId ${input.sectionId} already exists`);
          return {
            success: false,
            message: `Ya existe una sección con el ID: ${input.sectionId}`,
            section: null
          };
        }
        
        console.log(`🔍 Creating new CMS section: ${input.name} (${input.sectionId})`);
        
        // Crear un nuevo timestamp para createdAt y updatedAt
        const timestamp = new Date();
        
        try {
          // Crear la sección CMS en la base de datos
          const newSection = await prisma.cMSSection.create({
            data: {
              sectionId: input.sectionId,
              name: input.name,
              description: input.description || '',
              lastUpdated: timestamp.toISOString(),
              createdAt: timestamp,
              updatedAt: timestamp,
              createdBy: context?.user?.id || 'system'
            }
          });
          
          console.log(`✅ CMS section created successfully: ${newSection.id}`);
          
          // Devolver el resultado exitoso
          return {
            success: true,
            message: 'Sección CMS creada correctamente',
            section: {
              id: newSection.id,
              sectionId: newSection.sectionId,
              name: newSection.name
            }
          };
        } catch (dbError) {
          console.error('❌ Database error in createCMSSection:', dbError);
          return {
            success: false,
            message: `Error al crear la sección en la base de datos: ${dbError instanceof Error ? dbError.message : 'Error desconocido'}`,
            section: null
          };
        }
      } catch (error) {
        console.error('❌ Unexpected error in createCMSSection resolver:', error);
        return {
          success: false,
          message: error instanceof Error ? error.message : 'Error inesperado al crear la sección CMS',
          section: null
        };
      }
    },

    // Create Page Section mutation - needed for automatic page setup
    createPageSection: async (_parent: unknown, args: { 
      input: { 
        pageId: string;
        title: string;
        componentType: string;
        order: number;
        isVisible?: boolean;
        data?: Record<string, unknown>;
        sectionId?: string;
        componentId?: string;
      } 
    }) => {
      console.log('======== START createPageSection resolver ========');
      try {
        const { input } = args;
        console.log(`Creando nueva sección de página: ${input.title} para página: ${input.pageId}`);
        console.log('Input completo recibido:', JSON.stringify(input, null, 2));
        
        // Validar campos obligatorios
        if (!input.pageId || !input.title) {
          console.error('Error: El ID de página y el título son campos requeridos');
          return {
            success: false,
            message: 'El ID de página y el título son campos requeridos',
            section: null
          };
        }
        
        // Verificar si la página existe
        const existingPage = await prisma.page.findUnique({
          where: { id: input.pageId }
        });
        
        if (!existingPage) {
          console.error(`Error: No se encontró ninguna página con ID: ${input.pageId}`);
          return {
            success: false,
            message: `No se encontró ninguna página con ID: ${input.pageId}`,
            section: null
          };
        }

        // If sectionId is provided, verify the CMSSection exists
        let cmsSectionId = null;
        if (input.sectionId) {
          console.log(`Buscando CMSSection con sectionId: ${input.sectionId}`);
          
          // Primero intentamos buscar por id exacto
          let existingSection = await prisma.cMSSection.findFirst({
            where: { id: input.sectionId }
          });
          
          if (existingSection) {
            console.log(`Encontrada CMSSection por ID exacto: ${existingSection.id} (${existingSection.name || 'sin nombre'})`);
            cmsSectionId = existingSection.id;
          } else {
            // Si no encontramos por ID, intentamos por sectionId
            existingSection = await prisma.cMSSection.findFirst({
              where: { sectionId: input.sectionId }
            });
            
            if (existingSection) {
              console.log(`Encontrada CMSSection por sectionId: ${existingSection.id} (${existingSection.name || 'sin nombre'})`);
              cmsSectionId = existingSection.id;
            } else {
              // Intentemos crear una sección específica para esta página
              const pageSectionId = `page-${input.pageId}-section-${Date.now()}`;
              console.log(`Creando nueva CMSSection específica para esta página con ID: ${pageSectionId}`);
              
              try {
                const newSection = await prisma.cMSSection.create({
                  data: {
                    sectionId: pageSectionId,
                    name: `Sección ${input.title} (Page: ${existingPage.title})`,
                    description: `Sección específica para página: ${existingPage.title}`,
                    lastUpdated: new Date(),
                    createdAt: new Date(),
                    updatedAt: new Date()
                  }
                });
                
                console.log(`Creada nueva CMSSection específica con ID: ${newSection.id}, sectionId: ${newSection.sectionId}`);
                cmsSectionId = newSection.id;
              } catch (createError) {
                console.error('Error al crear nueva CMSSection:', createError);
                // Continuamos sin sectionId si hay error al crear
              }
            }
          }
        } else {
          // Si no se proporciona un sectionId, siempre debemos crear uno específico para esta página
          // para evitar que las secciones aparezcan en todas las páginas
          const pageSectionId = `page-${input.pageId}-section-${Date.now()}`;
          console.log(`No se proporcionó sectionId. Creando uno específico para esta página: ${pageSectionId}`);
          
          try {
            const newSection = await prisma.cMSSection.create({
              data: {
                sectionId: pageSectionId,
                name: `Sección ${input.title} (Page: ${existingPage.title})`,
                description: `Sección automática para página: ${existingPage.title}`,
                lastUpdated: new Date(),
                createdAt: new Date(),
                updatedAt: new Date()
              }
            });
            
            console.log(`Creada nueva CMSSection específica con ID: ${newSection.id}, sectionId: ${newSection.sectionId}`);
            cmsSectionId = newSection.id;
          } catch (createError) {
            console.error('Error al crear nueva CMSSection:', createError);
            // Continuamos sin sectionId si hay error al crear
          }
        }

        // If componentId is provided, verify the CMSComponent exists
        if (input.componentId) {
          const existingComponent = await prisma.cMSComponent.findUnique({
            where: { id: input.componentId }
          });

          if (!existingComponent) {
            console.error(`Error: No se encontró ningún componente CMS con ID: ${input.componentId}`);
            return {
              success: false,
              message: `No se encontró ningún componente CMS con ID: ${input.componentId}`,
              section: null
            };
          }
        }
        
        const timestamp = new Date();
        
        // Asegurarse de incluir información de la página en los datos
        const pageMetadata = {
          pageId: input.pageId,
          pageTitle: existingPage.title,
          pageSpecificSectionId: cmsSectionId
        };
        
        const sectionData = {
          ...(input.data || {}),
          _pageMetadata: pageMetadata
        };
        
        // Crear la sección de página en la base de datos
        const newPageSection = {
          pageId: input.pageId,
          title: input.title,
          componentType: input.componentType as ComponentType,
          order: input.order,
          isVisible: input.isVisible !== false, // default to true if undefined
          data: sectionData as Prisma.InputJsonValue,
          createdAt: timestamp,
          updatedAt: timestamp,
          sectionId: cmsSectionId, // Use the found or created CMSSection ID
          componentId: input.componentId || undefined
        };
        
        console.log('Creando PageSection con datos:', JSON.stringify(newPageSection, null, 2));
        
        const newSection = await prisma.pageSection.create({
          data: newPageSection
        });
        
        console.log(`Sección de página creada correctamente: ${newSection.id} con sectionId: ${cmsSectionId}`);
        
        // Crear el objeto de respuesta con la estructura esperada
        const responseObject = {
          success: true,
          message: `Sección "${input.title}" creada correctamente`,
          section: {
            id: newSection.id,
            title: newSection.title || '',
            order: newSection.order
          }
        };
        
        console.log('Objeto de respuesta final:', JSON.stringify(responseObject, null, 2));
        console.log('======== END createPageSection resolver ========');
        
        return responseObject;
      } catch (error) {
        console.error('Error al crear sección de página:', error);
        return {
          success: false,
          message: `Error al crear sección: ${error instanceof Error ? error.message : 'Error desconocido'}`,
          section: null
        };
      }
    },

    // Asociar una sección a una página directamente
    associateSectionToPage: async (_parent: unknown, args: { 
      pageId: string; 
      sectionId: string;
      order: number;
    }) => {
      console.log('======== START associateSectionToPage resolver ========');
      try {
        const { pageId, sectionId, order } = args;
        
        // Verificar si la página existe
        const existingPage = await prisma.page.findUnique({
          where: { id: pageId }
        });
        
        if (!existingPage) {
          return {
            success: false,
            message: `No se encontró ninguna página con ID: ${pageId}`,
            page: null
          };
        }
        
        // Verificar si la sección existe
        const existingSection = await prisma.cMSSection.findUnique({
          where: { id: sectionId }
        });
        
        if (!existingSection) {
          return {
            success: false,
            message: `No se encontró ninguna sección con ID: ${sectionId}`,
            page: null
          };
        }
        
        // Actualizar la sección con el orden proporcionado
        await prisma.$executeRaw`
          UPDATE "CMSSection" 
          SET "order" = ${order}
          WHERE "id" = ${sectionId}
        `;
        
        // Asociar la sección a la página usando la relación many-to-many
        await prisma.page.update({
          where: { id: pageId },
          data: {
            sections: {
              connect: { id: sectionId }
            }
          }
        });
        
        // Obtener la página actualizada con sus secciones
        const updatedPage = await prisma.page.findUnique({
          where: { id: pageId },
          include: {
            sections: true
          }
        });
        
        return {
          success: true,
          message: 'Sección asociada a la página correctamente',
          page: updatedPage
        };
      } catch (error) {
        console.error('Error al asociar sección a página:', error);
        return {
          success: false,
          message: error instanceof Error ? error.message : 'Error desconocido al asociar sección',
          page: null
        };
      }
    },

    // Desasociar una sección de una página
    dissociateSectionFromPage: async (_parent: unknown, args: { 
      pageId: string; 
      sectionId: string;
    }) => {
      console.log('======== START dissociateSectionFromPage resolver ========');
      try {
        const { pageId, sectionId } = args;
        
        // Verificar si la página existe
        const existingPage = await prisma.page.findUnique({
          where: { id: pageId },
          include: {
            sections: true
          }
        });
        
        if (!existingPage) {
          return {
            success: false,
            message: `No se encontró ninguna página con ID: ${pageId}`,
            page: null
          };
        }
        
        // Verificar si la página tiene la sección
        const hasSection = existingPage.sections.some(s => s.id === sectionId);
        
        if (!hasSection) {
          return {
            success: false,
            message: `La página no tiene asociada la sección con ID: ${sectionId}`,
            page: null
          };
        }
        
        // Desasociar la sección de la página
        await prisma.page.update({
          where: { id: pageId },
          data: {
            sections: {
              disconnect: { id: sectionId }
            }
          }
        });
        
        // Obtener la página actualizada
        const updatedPage = await prisma.page.findUnique({
          where: { id: pageId },
          include: {
            sections: true
          }
        });
        
        return {
          success: true,
          message: 'Sección desasociada de la página correctamente',
          page: updatedPage
        };
      } catch (error) {
        console.error('Error al desasociar sección de página:', error);
        return {
          success: false,
          message: error instanceof Error ? error.message : 'Error desconocido al desasociar sección',
          page: null
        };
      }
    }
  },
  
  // Scalar resolver
  JSON: {
    __serialize(value: unknown) {
      return value;
    },
  },
}; 