import { prisma } from '@/lib/prisma';
import { Prisma, PageType } from '@prisma/client';
import { verifySession } from '@/lib/auth';
import { GraphQLContext } from '../route';
import { GraphQLError } from 'graphql';

// Type definitions for Prisma includes
type PageWithSections = Prisma.PageGetPayload<{
  include: {
    sections: true;
    seo: true;
  };
}>;

type CMSSectionWithComponents = Prisma.CMSSectionGetPayload<{
  include: {
    components: {
      include: {
        component: true;
      };
    };
  };
}>;

// Tipo para los componentes de una sección
type SectionComponentWithRelation = Prisma.SectionComponentGetPayload<{
  include: {
    component: true;
  };
}>;

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
    
    getPageBySlug: async (_parent: unknown, args: { slug: string }, context: GraphQLContext) => {
      console.log('======== START getPageBySlug resolver ========');
      try {
        const { slug } = args;
        
        const page = await prisma.page.findUnique({
          where: { 
            tenantId_slug: {
              tenantId: context.tenantId || '',
              slug: slug
            }
          },
          include: {
            sections: true,
            seo: true
          }
        });
        
        if (!page) {
          return null;
        }
        
        // Filter out sections with null sectionId to prevent GraphQL errors
        const filteredPage = {
          ...page,
          sections: page.sections?.filter((section: PageWithSections['sections'][0]) => 
            section && typeof section === 'object' && 'sectionId' in section && section.sectionId !== null
          ) || []
        };
        
        return filteredPage;
      } catch (error) {
        console.error('Error in getPageBySlug:', error);
        return null;
      }
    },
    
    page: async (_parent: unknown, args: { id: string }) => {
      console.log('======== START page resolver ========');
      try {
        const { id } = args;
        console.log(`Looking for page with ID: ${id}`);
        
        const page = await prisma.page.findUnique({
          where: { id },
          include: {
            sections: true,
            seo: true
          }
        });
        
        if (!page) {
          console.log(`No page found with ID: ${id}`);
          return null;
        }
        
        console.log(`Found page: ${page.title} (${page.slug})`);
        
        // Filter out sections with null sectionId to prevent GraphQL errors
        const filteredPage = {
          ...page,
          sections: page.sections.filter(section => 
            section && typeof section === 'object' && 'sectionId' in section && section.sectionId !== null
          )
        };
        
        return filteredPage;
      } catch (error) {
        console.error('Error in page resolver:', error);
        return null;
      }
    },
    
    getSectionComponents: async (_parent: unknown, args: { sectionId: string }, context: GraphQLContext) => {
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
            where: { 
              tenantId_sectionId: {
                tenantId: context.tenantId || '',
                sectionId: sectionId
              }
            },
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
            console.log('Components count:', (sectionFromDB as CMSSectionWithComponents).components?.length || 0);
            
            // Log each component for debugging
            if ((sectionFromDB as CMSSectionWithComponents).components?.length > 0) {
              console.log('Components in database:');
              (sectionFromDB as CMSSectionWithComponents).components.forEach((sc: SectionComponentWithRelation, index: number) => {
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
              const components = ((sectionFromDB as CMSSectionWithComponents).components as SectionComponentWithRelation[]).map((sc) => ({
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
                where: { 
                  tenantId_sectionId: {
                    tenantId: context.tenantId || '',
                    sectionId: matchingSection.sectionId
                  }
                },
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
              
              if (matchedSectionData && (matchedSectionData as CMSSectionWithComponents).components?.length > 0) {
                const components = ((matchedSectionData as CMSSectionWithComponents).components as SectionComponentWithRelation[]).map((sc) => ({
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
                  updatedAt: timestamp,
                  tenantId: context.tenantId || '',
                  createdBy: context?.user?.id || 'system'
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
      console.log('======== START getAllCMSPages resolver ========');
      try {
        const pages = await prisma.page.findMany({
          include: {
            sections: true
          },
          orderBy: {
            createdAt: 'desc'
          }
        });
        
        // Filter out sections with null sectionId to prevent GraphQL errors
        return pages.map(page => {
          if (page.sections && Array.isArray(page.sections)) {
            // Filter out any sections with null sectionId
            page.sections = page.sections.filter(section => 
              section && typeof section === 'object' && 'sectionId' in section && section.sectionId !== null
            );
          }
          return page;
        });
      } catch (error) {
        console.error('Error in getAllCMSPages:', error);
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
        
        // Buscar todas las páginas que tienen relación con la sección dada
        const pages = await prisma.$queryRaw`
          SELECT p.* 
          FROM "Page" p 
          JOIN "_PageToSection" pts ON p."id" = pts."B" 
          JOIN "CMSSection" s ON s."id" = pts."A"
          WHERE s."id" = ${sectionId} OR s."sectionId" = ${sectionId}
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
            // Obtener las secciones directamente asociadas a la página
            const sectionsData = await prisma.page.findUnique({
              where: {
                id: page.id
              },
              select: {
                sections: {
                  select: {
                    id: true,
                    sectionId: true,
                    order: true,
                    name: true,
                    description: true
                  },
                  orderBy: {
                    order: 'asc'
                  }
                }
              }
            });
            
            // Filter out sections with null sectionId to prevent GraphQL errors
            let filteredSections: { id: string; sectionId: string; order: number; name: string | null; description: string | null }[] = [];
            if (sectionsData?.sections) {
              filteredSections = sectionsData.sections.filter(section => 
                section && typeof section === 'object' && 'sectionId' in section && section.sectionId !== null
              );
            }
            
            return {
              ...page,
              sections: filteredSections || []
            };
          })
        );
        
        return pagesWithSections;
      } catch (error) {
        console.error(`Error al obtener páginas usando sectionId ${args.sectionId}:`, error);
        return [];
      }
    },

    // New resolver for getting the default page
    getDefaultPage: async (_parent: unknown, args: { locale: string }) => {
      console.log('======== START getDefaultPage resolver ========');
      try {
        const { locale } = args;
        console.log(`Looking for default page with locale: ${locale}`);
        
        // Find the page marked as default for the specified locale
        const page = await prisma.page.findFirst({
          where: { 
            isDefault: true,
            locale,
            isPublished: true
          },
          include: {
            sections: true,
            seo: true
          }
        });
        
        if (!page) {
          console.log(`No default page found for locale: ${locale}`);
          return null;
        }
        
        console.log(`Found default page: ${page.title} (${page.slug})`);
        
        // Filter out sections with null sectionId to prevent GraphQL errors
        const filteredPage = {
          ...page,
          sections: page.sections.filter(section => 
            section && typeof section === 'object' && 'sectionId' in section && section.sectionId !== null
          )
        };
        
        return filteredPage;
      } catch (error) {
        console.error('Error in getDefaultPage:', error);
        return null;
      }
    },
  },
  
  Mutation: {
    saveSectionComponents: async (_parent: unknown, args: { 
      input: { 
        sectionId: string; 
        components: Array<{ id: string; type: string; data: Record<string, unknown> }> 
      } 
    }, context: GraphQLContext) => {
      // Require authentication for editing CMS content
      if (!context.req) {
        throw new GraphQLError('Request context is required for authentication', {
          extensions: { code: 'UNAUTHENTICATED' }
        });
      }
      
      const session = await verifySession(context.req);
      if (!session?.user) {
        throw new GraphQLError('Authentication required to edit CMS content', {
          extensions: { code: 'UNAUTHENTICATED' }
        });
      }

      // Only admins, managers, and employees can edit CMS content
      if (!['ADMIN', 'MANAGER', 'EMPLOYEE'].includes(session.user.role.name)) {
        throw new GraphQLError('Insufficient permissions to edit CMS content', {
          extensions: { code: 'FORBIDDEN' }
        });
      }

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
        
        // Optimized database operations using transactions and batch queries
        try {
          // Use a transaction to ensure data consistency and improve performance
          const result = await prisma.$transaction(async (tx) => {
            // 1. Find or create the section
            let section = await tx.cMSSection.findUnique({
              where: { 
                tenantId_sectionId: {
                  tenantId: context.tenantId || '',
                  sectionId: sectionId
                }
              }
            });
            
            if (!section) {
              console.log('Creating new section in database:', sectionId);
              section = await tx.cMSSection.create({
                data: {
                  sectionId,
                  name: sectionId.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
                  description: `Sección "${sectionId}"`,
                  lastUpdated: timestamp,
                  createdAt: timestamp,
                  updatedAt: timestamp,
                  tenantId: context.tenantId || '',
                  createdBy: context?.user?.id || 'system'
                }
              });
            } else {
              console.log('Updating existing section in database:', sectionId);
              section = await tx.cMSSection.update({
                where: { id: section.id },
                data: {
                  lastUpdated: timestamp,
                  updatedAt: timestamp
                }
              });
            }
            
            // 2. Get unique component types to batch-check existing components
            const uniqueTypes = [...new Set(validComponents.map(c => c.type))];
            console.log('Unique component types:', uniqueTypes);
            
            // 3. Batch-find existing components
            const existingComponents = await tx.cMSComponent.findMany({
              where: {
                slug: { in: uniqueTypes }
              }
            });
            
            const existingComponentMap = new Map(
              existingComponents.map(comp => [comp.slug, comp])
            );
            
            // 4. Batch-create missing components
            const missingTypes = uniqueTypes.filter(type => !existingComponentMap.has(type));
            if (missingTypes.length > 0) {
              console.log('Creating missing component types:', missingTypes);
              await tx.cMSComponent.createMany({
                data: missingTypes.map(type => ({
                  name: type,
                  slug: type,
                  description: `Componente tipo ${type}`,
                  schema: {},
                  isActive: true,
                  createdAt: timestamp,
                  updatedAt: timestamp,
                  tenantId: context.tenantId || '',
                  createdBy: context?.user?.id || 'system'
                }))
              });
              
              // Fetch the newly created components to add to our map
              const createdComponents = await tx.cMSComponent.findMany({
                where: {
                  slug: { in: missingTypes }
                }
              });
              
              createdComponents.forEach(comp => {
                existingComponentMap.set(comp.slug, comp);
              });
            }
            
            // 5. Delete existing section components to replace them
            await tx.sectionComponent.deleteMany({
              where: { sectionId: section.id }
            });
            
            // 6. Batch-create new section components
            if (validComponents.length > 0) {
              const sectionComponentsData = validComponents.map((component, index) => {
                const cmsComponent = existingComponentMap.get(component.type);
                if (!cmsComponent) {
                  throw new Error(`Component type ${component.type} not found after creation`);
                }
                
                return {
                  id: component.id,
                  sectionId: section.id,
                  componentId: cmsComponent.id,
                  order: index,
                  data: component.data as Prisma.InputJsonValue || {},
                  createdAt: timestamp,
                  updatedAt: timestamp
                };
              });
              
              console.log(`Creating ${sectionComponentsData.length} section component relationships`);
              await tx.sectionComponent.createMany({
                data: sectionComponentsData
              });
            }
            
            return {
              success: true,
              message: 'Components saved successfully',
              lastUpdated: timestamp.toISOString(),
            };
          });
          
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
    }, context: GraphQLContext) => {
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
            schema: (input.schema as Prisma.InputJsonValue) || {},
            icon: input.icon || null,
            isActive: true,
            createdAt: timestamp,
            updatedAt: timestamp,
            tenantId: context.tenantId || '',
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
        backgroundImage?: string;
        backgroundType?: string;
        gridDesign?: string;
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
            ...(input.backgroundImage !== undefined && { backgroundImage: input.backgroundImage }),
            ...(input.backgroundType !== undefined && { backgroundType: input.backgroundType }),
            ...(input.gridDesign !== undefined && { gridDesign: input.gridDesign }),
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
        isDefault?: boolean;
        sections?: string[];
      }
    }, context: GraphQLContext) => {
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

        const localeToUse = input.locale || "en";
        let shouldSetAsDefault = input.isDefault || false;

        // Check if this should be automatically set as default
        if (!shouldSetAsDefault) {
          // Count existing pages for this locale
          const existingPagesCount = await prisma.page.count({
            where: { locale: localeToUse }
          });
          
          console.log(`Found ${existingPagesCount} existing pages for locale ${localeToUse}`);
          
          // If no pages exist for this locale, set this as the default
          if (existingPagesCount === 0) {
            shouldSetAsDefault = true;
            console.log(`Setting page as default since no pages exist for locale ${localeToUse}`);
          }
        }

        // If setting this page as default, make sure no other page for the same locale is set as default
        if (shouldSetAsDefault) {
          console.log(`Setting page as default for locale ${localeToUse}`);
          
          // Find and update any existing default pages for this locale
          const existingDefault = await prisma.page.findFirst({
            where: {
              locale: localeToUse,
              isDefault: true
            }
          });
          
          if (existingDefault) {
            console.log(`Found existing default page ${existingDefault.id} (${existingDefault.title}), removing default status`);
            
            // Remove default status from the existing default page
            await prisma.page.update({
              where: { id: existingDefault.id },
              data: { isDefault: false }
            });
          }
        }
        
        const timestamp = new Date();
        
        // Crear la página en la base de datos
        const newPage = await prisma.page.create({
          data: {
            title: input.title,
            slug: input.slug,
            description: input.description || null,
            template: input.template || 'default',
            isPublished: input.isPublished || false,
            publishDate: input.publishDate ? new Date(input.publishDate) : null,
            featuredImage: input.featuredImage || null,
            metaTitle: input.metaTitle || null,
            metaDescription: input.metaDescription || null,
            createdAt: timestamp,
            updatedAt: timestamp,
            tenantId: context.tenantId || '',
            createdById: context?.user?.id || 'system'
          }
        });

        console.log(`Página creada correctamente: ${newPage.id}${shouldSetAsDefault ? ' (marcada como predeterminada)' : ''}`);
        
        // Si hay secciones, crear relaciones
        if (input.sections && input.sections.length > 0) {
          for (let i = 0; i < input.sections.length; i++) {
            const sectionId = input.sections[i];
            
            // Buscar la sección en la base de datos
            const section = await prisma.cMSSection.findFirst({
              where: { sectionId }
            });
            
            if (section) {
              // Asociar la sección a la página usando la relación many-to-many directa
              await prisma.page.update({
                where: { id: newPage.id },
                data: {
                  sections: {
                    connect: { id: section.id }
                  }
                }
              });
              
              // Actualizar el orden de la sección
              await prisma.$executeRaw`
                UPDATE "CMSSection" 
                SET "order" = ${i}
                WHERE "id" = ${section.id}
              `;
            } else {
              console.warn(`Sección con ID ${sectionId} no encontrada, omitiendo`);
            }
          }
        }
        
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
          message: `Página "${input.title}" creada correctamente${shouldSetAsDefault ? ' y marcada como predeterminada' : ''}`,
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
        ogTitle?: string | null;
        ogDescription?: string | null;
        ogImage?: string | null;
        parentId?: string | null;
        order?: number;
        pageType?: string;
        locale?: string;
        isDefault?: boolean;
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

        // If setting this page as default, make sure no other page for the same locale is set as default
        if (input.isDefault === true) {
          const localeToUse = input.locale || existingPage.locale;
          
          console.log(`Setting page ${id} as default for locale ${localeToUse}`);
          
          // Find and update any existing default pages for this locale
          const existingDefault = await prisma.page.findFirst({
            where: {
              locale: localeToUse,
              isDefault: true,
              id: { not: id } // Exclude the current page
            }
          });
          
          if (existingDefault) {
            console.log(`Found existing default page ${existingDefault.id} (${existingDefault.title}), removing default status`);
            
            // Remove default status from the existing default page
            await prisma.page.update({
              where: { id: existingDefault.id },
              data: { isDefault: false }
            });
          }
        }

        // If title is being updated, also update any menu items that link to this page
        if (input.title && input.title !== existingPage.title) {
          console.log(`Updating menu items for page ${id} with new title: ${input.title}`);
          
          try {
            // Find all menu items that reference this page
            const menuItems = await prisma.menuItem.findMany({
              where: {
                pageId: id
              }
            });
            
            if (menuItems.length > 0) {
              console.log(`Found ${menuItems.length} menu items referencing page ${id}`);
              
              // Update each menu item with the new page title
              for (const menuItem of menuItems) {
                await prisma.menuItem.update({
                  where: { id: menuItem.id },
                  data: {
                    title: input.title
                  }
                });
              }
              
              console.log(`Updated ${menuItems.length} menu items with new page title`);
            }
          } catch (menuUpdateError) {
            console.error('Error updating menu items:', menuUpdateError);
            // Continue with page update even if menu update fails
          }
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
            ...(input.ogTitle !== undefined && { ogTitle: input.ogTitle }),
            ...(input.ogDescription !== undefined && { ogDescription: input.ogDescription }),
            ...(input.ogImage !== undefined && { ogImage: input.ogImage }),
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
        
        // Procesar las secciones asociadas a la página
        if (existingPage.sections.length > 0) {
          const sectionIds = existingPage.sections.map(section => section.id);
          
          console.log(`La página tiene ${sectionIds.length} secciones asociadas que serán procesadas`);
          
          // Desasociar todas las secciones de la página
          await prisma.page.update({
            where: { id },
            data: {
              sections: {
                disconnect: sectionIds.map(sectionId => ({ id: sectionId }))
              }
            }
          });
          
          console.log(`Se desasociaron ${sectionIds.length} secciones de la página`);
          
          // Obtener las secciones que no están conectadas a otras páginas
          for (const sectionId of sectionIds) {
            // Verificar si la sección está conectada a otras páginas
            const pagesUsingSection = await prisma.page.count({
              where: {
                sections: {
                  some: {
                    id: sectionId
                  }
                }
              }
            });
            
            // Si la sección no está conectada a ninguna otra página, eliminarla
            if (pagesUsingSection === 0) {
              console.log(`La sección ${sectionId} no está conectada a ninguna otra página, eliminándola...`);
              
              try {
                // Eliminar los componentes de la sección primero
                await prisma.$executeRaw(
                  Prisma.sql`DELETE FROM "SectionComponent" WHERE "sectionId" = ${sectionId}`
                );
                
                // Eliminar la sección
                await prisma.cMSSection.delete({
                  where: { id: sectionId }
                });
                
                console.log(`Sección ${sectionId} eliminada correctamente`);
              } catch (error) {
                console.error(`Error al eliminar la sección ${sectionId}:`, error);
                // Continuar con las demás secciones aunque falle una
              }
            } else {
              console.log(`La sección ${sectionId} está conectada a ${pagesUsingSection} páginas, no se eliminará`);
            }
          }
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
        backgroundImage?: string;
        backgroundType?: string;
        pageId?: string; // Agregar pageId opcional
      } 
    }, context: GraphQLContext) => {
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
        if (input.pageId) {
          console.log(`🔗 Assigning to page: ${input.pageId}`);
        }
        
        // Crear un nuevo timestamp para createdAt y updatedAt
        const timestamp = new Date();
        
        try {
          // Crear la sección CMS en la base de datos
          const newSection = await prisma.cMSSection.create({
            data: {
              sectionId: input.sectionId,
              name: input.name,
              description: input.description || '',
              backgroundImage: input.backgroundImage || null,
              backgroundType: input.backgroundType || 'gradient',
              lastUpdated: timestamp.toISOString(),
              createdAt: timestamp,
              updatedAt: timestamp,
              tenantId: context.tenantId || '',
              createdBy: context?.user?.id || 'system',
              order: 0, // Establecer orden predeterminado
              pageId: input.pageId || null // Asignar pageId si se proporciona
            }
          });
          
          console.log(`✅ CMS section created successfully:`, {
            id: newSection.id,
            sectionId: newSection.sectionId,
            name: newSection.name,
            order: newSection.order,
            pageId: newSection.pageId
          });
          
          // Devolver el resultado exitoso con todos los campos necesarios
          return {
            success: true,
            message: 'Sección CMS creada correctamente',
            section: {
              id: newSection.id,
              sectionId: newSection.sectionId,
              name: newSection.name,
              order: newSection.order || 0, // Asegurar que order esté definido
              pageId: newSection.pageId
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


    // Asociar una sección a una página directamente
    associateSectionToPage: async (_parent: unknown, args: { 
      pageId: string; 
      sectionId: string;
      order: number;
    }) => {
      console.log('======== START associateSectionToPage resolver ========');
      console.log('📋 Argumentos recibidos:', args);
      try {
        const { pageId, sectionId, order } = args;
        
        console.log('🔍 Buscando página con ID:', pageId);
        console.log('🔍 Tipo de pageId:', typeof pageId);
        console.log('🔍 Valor exacto de pageId:', JSON.stringify(pageId));
        console.log('🔍 Longitud del pageId:', pageId ? pageId.length : 'null/undefined');
        
        // Verificar si la página existe
        console.log('🔎 Ejecutando consulta a la base de datos...');
        const existingPage = await prisma.page.findUnique({
          where: { id: pageId }
        });
        
        console.log('🔎 Resultado de búsqueda de página:', existingPage ? 'ENCONTRADA' : 'NO ENCONTRADA');
        if (existingPage) {
          console.log('📄 Página encontrada:', { 
            id: existingPage.id, 
            title: existingPage.title, 
            slug: existingPage.slug 
          });
        }
        
        if (!existingPage) {
          console.log('❌ Error: Página no encontrada en la base de datos');
          
          // Debug: Mostrar todas las páginas disponibles para comparar IDs
          try {
            const allPages = await prisma.page.findMany({
              select: { id: true, title: true, slug: true },
              take: 10
            });
            console.log('📚 Páginas disponibles en la base de datos:');
            allPages.forEach(page => {
              console.log(`   - ID: "${page.id}" | Title: "${page.title}" | Slug: "${page.slug}"`);
              console.log(`   - ID length: ${page.id.length} | Matches searched: ${page.id === pageId}`);
            });
          } catch (debugError) {
            console.error('Error al obtener páginas para debug:', debugError);
          }
          
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
        
        // Actualizar la sección con el orden proporcionado y el pageId
        await prisma.$executeRaw`
          UPDATE "CMSSection" 
          SET "order" = ${order}, "pageId" = ${pageId}
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
        
        // Limpiar el pageId de la sección cuando se desasocia
        await prisma.$executeRaw`
          UPDATE "CMSSection" 
          SET "pageId" = NULL 
          WHERE "id" = ${sectionId}
        `;
        
        // Verificar si la sección está conectada a otras páginas
        const pagesUsingSection = await prisma.page.count({
          where: {
            sections: {
              some: {
                id: sectionId
              }
            }
          }
        });
        
        // Si la sección no está conectada a ninguna otra página, eliminarla
        let sectionDeleted = false;
        if (pagesUsingSection === 0) {
          console.log(`La sección ${sectionId} no está conectada a ninguna otra página, eliminándola...`);
          
          try {
            // Eliminar los componentes de la sección primero
            await prisma.$executeRaw(
              Prisma.sql`DELETE FROM "SectionComponent" WHERE "sectionId" = ${sectionId}`
            );
            
            // Eliminar la sección
            await prisma.cMSSection.delete({
              where: { id: sectionId }
            });
            
            sectionDeleted = true;
            console.log(`Sección ${sectionId} eliminada correctamente`);
          } catch (error) {
            console.error(`Error al eliminar la sección ${sectionId}:`, error);
          }
        }
        
        // Obtener la página actualizada
        const updatedPage = await prisma.page.findUnique({
          where: { id: pageId },
          include: {
            sections: true
          }
        });
        
        return {
          success: true,
          message: sectionDeleted 
            ? 'Sección desasociada de la página y eliminada correctamente' 
            : 'Sección desasociada de la página correctamente',
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