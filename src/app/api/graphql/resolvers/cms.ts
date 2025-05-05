import path from 'path';
import { promises as fs } from 'fs';
import { prisma } from '@/lib/prisma';

// Ruta donde guardaremos los datos
const dataFilePath = path.join(process.cwd(), 'data', 'cms-sections.json');

// Logs para depuración al inicio
console.log('CMS resolver loaded');
console.log('Data file path:', dataFilePath);

// Función auxiliar para garantizar que existe el directorio de datos
async function ensureDataDir() {
  const dataDir = path.join(process.cwd(), 'data');
  try {
    await fs.access(dataDir);
    console.log('Data directory exists:', dataDir);
  } catch {
    console.log('Creating data directory:', dataDir);
    try {
      await fs.mkdir(dataDir, { recursive: true });
      console.log('Data directory created successfully');
    } catch (err) {
      console.error('Error creating data directory:', err);
      // Try a fallback location in /tmp for environments with limited write access
      const tempDir = '/tmp/evoque-cms-data';
      console.log('Trying fallback directory:', tempDir);
      await fs.mkdir(tempDir, { recursive: true });
      return tempDir;
    }
  }
  return dataDir;
}

// Función para leer datos
async function readData() {
  const dataDir = await ensureDataDir();
  const filePath = path.join(dataDir, 'cms-sections.json');
  
  try {
    await fs.access(filePath);
    console.log('Data file exists, reading it');
  } catch {
    console.log('Data file does not exist, creating empty one');
    await fs.writeFile(filePath, JSON.stringify({}));
  }
  
  const rawData = await fs.readFile(filePath, 'utf-8');
  console.log('Raw data length:', rawData.length);
  const parsed = JSON.parse(rawData) as Record<string, unknown>;
  console.log('Parsed data keys:', Object.keys(parsed));
  return parsed;
}

// Función para escribir datos
async function writeData(data: Record<string, unknown>) {
  const dataDir = await ensureDataDir();
  const filePath = path.join(dataDir, 'cms-sections.json');
  
  console.log('Writing data with keys:', Object.keys(data));
  await fs.writeFile(filePath, JSON.stringify(data, null, 2));
  console.log('Data written successfully');
}

// Definición de los resolvers para CMS
export const cmsResolvers = {
  Query: {
    getSectionComponents: async (_parent: unknown, args: { sectionId: string }) => {
      try {
        console.log('========================================');
        
        // Eliminar parámetros de consulta si existen (para evitar problemas con cache busting)
        let { sectionId } = args;
        if (sectionId && sectionId.includes('?')) {
          sectionId = sectionId.split('?')[0];
          console.log('Limpiando sectionId de parámetros de consulta:', sectionId);
        }
        
        console.log('CMS RESOLVER: Getting section components for section ID:', sectionId);
        
        // Primero intentar obtener los datos de la base de datos
        try {
          // Use type casting to suppress TypeScript errors
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const prismaAny = prisma as any;
          const sectionFromDB = await prismaAny.cMSSection.findUnique({
            where: { sectionId }
          });
          
          if (sectionFromDB) {
            console.log('Section found in database:', sectionId);
            // Parsear los componentes de JSON a objeto
            const components = sectionFromDB.components as unknown as Array<unknown>;
            return {
              components,
              lastUpdated: sectionFromDB.lastUpdated.toISOString()
            };
          } else {
            console.log('Section not found in database:', sectionId);
          }
        } catch (dbError) {
          console.error('Error querying database:', dbError);
          // Continuar con el fallback a archivos
        }
        
        // Fallback: Obtener datos del sistema de archivos
        const data = await readData();
        
        console.log('Section data found in file system:', data[sectionId] ? 'YES' : 'NO');
        if (data[sectionId]) {
          const sectionData = data[sectionId] as { components?: Array<unknown>; lastUpdated?: string };
          console.log('Components count:', sectionData.components?.length || 0);
        }
        
        const result = data[sectionId] || { components: [] };
        console.log('Returning result from file system:', JSON.stringify(result).substring(0, 100) + '...');
        console.log('========================================');
        return result;
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
        } else {
          console.log('No components to save');
        }
        
        const timestamp = new Date();
        
        // Guardar en la base de datos utilizando Prisma
        try {
          // Use type casting to suppress TypeScript errors
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const prismaAny = prisma as any;
          // Buscar si ya existe la sección
          const existingSection = await prismaAny.cMSSection.findUnique({
            where: { sectionId }
          });
          
          if (existingSection) {
            // Actualizar la sección existente
            console.log('Updating existing section in database:', sectionId);
            await prismaAny.cMSSection.update({
              where: { id: existingSection.id },
              data: {
                components: components || [],
                lastUpdated: timestamp,
                updatedAt: timestamp
              }
            });
          } else {
            // Crear una nueva sección
            console.log('Creating new section in database:', sectionId);
            await prismaAny.cMSSection.create({
              data: {
                sectionId,
                components: components || [],
                lastUpdated: timestamp,
                createdAt: timestamp,
                updatedAt: timestamp
              }
            });
          }
          
          console.log('Section saved successfully to database:', sectionId);
        } catch (dbError) {
          console.error('Error saving to database:', dbError);
          // Continuar con el guardado en archivo como fallback
        }
        
        // Backup: Guardar también en el sistema de archivos
        try {
          const data = await readData();
          
          data[sectionId] = {
            components: components || [],
            lastUpdated: timestamp.toISOString(),
          };
          
          await writeData(data);
          console.log('Backup: Section saved to file system:', sectionId);
        } catch (fileError) {
          console.error('Error saving to file system:', fileError);
        }
        
        const result = {
          success: true,
          message: 'Components saved successfully',
          lastUpdated: timestamp.toISOString(),
        };
        
        console.log('Save result:', result);
        console.log('========================================');
        return result;
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