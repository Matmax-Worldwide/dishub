import { prisma } from '@/lib/prisma';
import { Prisma, PageType } from '@prisma/client';
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

// Logs para depuración al inicio
console.log('CMS resolver loaded');

// Definición de los resolvers para CMS
export const cmsResolvers = {
  Query: {
    getAllCMSSections: async () => {
      console.log('======== START getAllCMSSections resolver ========');
      try {
        console.log('Obteniendo todas las secciones CMS');
        
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
    
    getSectionComponents: async (_parent: unknown, args: { sectionId: string }) => {
      console.log('======== START getSectionComponents resolver ========');
      try {
        console.log('========================================');
        
        // Eliminar parámetros de consulta si existen (para evitar problemas con cache busting)
        let { sectionId } = args;
        if (sectionId && sectionId.includes('?')) {
          sectionId = sectionId.split('?')[0];
          console.log('Limpiando sectionId de parámetros de consulta:', sectionId);
        }
        
        console.log('CMS RESOLVER: Getting section components for section ID:', sectionId);
        
        // Obtener los datos de la base de datos
        try {
          console.log('Executing database query...');
          
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
            
            // Transformar los componentes al formato esperado por el cliente
            const components = (sectionFromDB.components as SectionComponentWithRelation[]).map((sc) => ({
              id: sc.id,
              type: sc.component.slug,
              data: sc.data || {}
            }));
            
            console.log('Number of components in section:', components.length);
            console.log('Returning data from database');
            
            return {
              components,
              lastUpdated: sectionFromDB.lastUpdated.toISOString()
            };
          } else {
            console.log('Section not found in database:', sectionId);
            console.log('Returning empty components array');
            return { components: [], lastUpdated: null };
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
        console.log('Obteniendo todas las páginas CMS');
        
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
        
        console.log(`Se encontraron ${pages.length} páginas`);
        
        return pages;
      } catch (error) {
        console.error('Error al obtener páginas CMS:', error);
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
        
        // Check if components array is not empty before trying to log the first component
        if (components && components.length > 0) {
          console.log('First component:', JSON.stringify(components[0]).substring(0, 100) + '...');
          console.log('Components to save:', components.map(c => `${c.id} (${c.type})`).join(', '));
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
            if (components && components.length > 0) {
              // Por cada componente, buscar si existe o crearlo
              for (let i = 0; i < components.length; i++) {
                const component = components[i];
                
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
                
                // Crear la relación entre sección y componente
                await prisma.$executeRaw(
                  Prisma.sql`INSERT INTO "SectionComponent" 
                  ("id", "sectionId", "componentId", "order", "data", "createdAt", "updatedAt") 
                  VALUES (
                    ${crypto.randomUUID()}, 
                    ${updatedSection.id}, 
                    ${cmsComponent.id}, 
                    ${i}, 
                    ${Prisma.sql`${JSON.stringify(component.data || {})}::jsonb`}, 
                    ${timestamp}, 
                    ${timestamp}
                  )`
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
            if (components && components.length > 0) {
              // Por cada componente, buscar si existe o crearlo
              for (let i = 0; i < components.length; i++) {
                const component = components[i];
                
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
                
                // Crear la relación entre sección y componente
                await prisma.$executeRaw(
                  Prisma.sql`INSERT INTO "SectionComponent" 
                  ("id", "sectionId", "componentId", "order", "data", "createdAt", "updatedAt") 
                  VALUES (
                    ${crypto.randomUUID()}, 
                    ${newSection.id}, 
                    ${cmsComponent.id}, 
                    ${i}, 
                    ${Prisma.sql`${JSON.stringify(component.data || {})}::jsonb`}, 
                    ${timestamp}, 
                    ${timestamp}
                  )`
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

    // Crear página CMS
    createPage: async (_parent: unknown, args: { 
      input: { 
        title: string;
        slug: string;
        description?: string;
        template?: string;
        isPublished?: boolean;
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
            pageType: (input.pageType as PageType) || PageType.CONTENT,
            locale: input.locale || "en",
            order: 0,
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
  },
  
  // Scalar resolver
  JSON: {
    __serialize(value: unknown) {
      return value;
    },
  },
}; 