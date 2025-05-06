import { prisma } from '@/lib/prisma';

// Logs para depuración al inicio
console.log('CMS resolver loaded');

// Definición de los resolvers para CMS
export const cmsResolvers = {
  Query: {
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
          let sectionFromDB;
          try {
            sectionFromDB = await prisma.cMSSection.findUnique({
              where: { sectionId }
            });
            console.log('Raw query complete');
          } catch (queryError) {
            console.error('DATABASE QUERY ERROR:', queryError);
            // Try to get more details about the error
            console.error('Error details:', JSON.stringify(queryError, null, 2));
            throw queryError;
          }
          
          console.log('Query executed, result:', sectionFromDB ? 'found' : 'not found');
          
          if (sectionFromDB) {
            console.log('Section found in database:', sectionId);
            // Parsear los componentes de JSON a objeto
            const components = sectionFromDB.components as unknown as Array<unknown>;
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
            // Log the existing components 
            console.log('Existing components:', JSON.stringify(existingSection.components).substring(0, 100) + '...');
                        
            await prisma.cMSSection.update({
              where: { id: existingSection.id },
              data: {
                // @ts-expect-error The components are a valid JSON structure that Prisma can store
                components: components || [],
                lastUpdated: timestamp,
                updatedAt: timestamp
              }
            });
            
            console.log('Section updated successfully with new components');
          } else {
            // Crear una nueva sección
            console.log('Creating new section in database:', sectionId);
            await prisma.cMSSection.create({
              data: {
                sectionId,
                // @ts-expect-error The components are a valid JSON structure that Prisma can store
                components: components || [],
                lastUpdated: timestamp,
                createdAt: timestamp,
                updatedAt: timestamp
              }
            });
            
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
  },
  
  // Scalar resolver
  JSON: {
    __serialize(value: unknown) {
      return value;
    },
  },
}; 