// Función simple para realizar solicitudes GraphQL
export async function gqlRequest<T>(
  query: string,
  variables: Record<string, unknown> = {},
): Promise<T> {
  try {
    console.log('GraphQL Request:', { 
      query: query.substring(0, 100) + '...', // Log solo parte de la query para no saturar
      variables 
    });
    
    // Añadir etiqueta de tiempo para depuración
    const requestTime = new Date().toISOString();
    console.log(`[${requestTime}] Iniciando solicitud GraphQL`);
    
    const response = await fetch('/api/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      },
      body: JSON.stringify({
        query,
        variables,
      }),
      // Asegurar que no utiliza caché
      cache: 'no-store',
      next: { revalidate: 0 }
    });

    // Log de la respuesta
    console.log(`[${requestTime}] Respuesta recibida, status:`, response.status);
    
    // Si hay un error, intentemos recuperar el mensaje detallado
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[${requestTime}] GraphQL Error Response:`, errorText);
      
      try {
        // Intentar parsear como JSON por si contiene detalles
        const errorJson = JSON.parse(errorText);
        throw new Error(`GraphQL error (${response.status}): ${JSON.stringify(errorJson)}`);
      } catch {
        // Si no es JSON, usar el texto completo
        throw new Error(`HTTP error! Status: ${response.status}, Details: ${errorText.substring(0, 200)}`);
      }
    }

    const responseText = await response.text();
    console.log(`[${requestTime}] Respuesta cruda (primeros 200 caracteres):`, responseText.substring(0, 200));
    
    // Si la respuesta está vacía, lanzar un error
    if (!responseText.trim()) {
      throw new Error('La respuesta del servidor está vacía');
    }
    
    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch (e) {
      console.error(`[${requestTime}] Error al parsear respuesta JSON:`, e);
      throw new Error(`Error al parsear la respuesta del servidor: ${responseText.substring(0, 200)}`);
    }
    
    console.log(`[${requestTime}] GraphQL Response:`, responseData);
    
    // Verificar que la respuesta tiene la estructura esperada
    if (!responseData || typeof responseData !== 'object') {
      console.error(`[${requestTime}] Respuesta con formato inválido:`, responseData);
      throw new Error('La respuesta GraphQL no tiene un formato válido');
    }
    
    const { data, errors } = responseData as { 
      data?: T; 
      errors?: Array<{ message: string }> 
    };

    if (errors && errors.length > 0) {
      console.error(`[${requestTime}] GraphQL Errors:`, errors);
      throw new Error(errors.map(e => e.message).join('\n'));
    }
    
    // Verificar que data no es null o undefined
    if (data === undefined || data === null) {
      console.error(`[${requestTime}] La respuesta no contiene datos:`, responseData);
      // Intentar otra estrategia: si responseData parece ser válido, devolverlo
      if (responseData && Object.keys(responseData).length > 0) {
        console.log(`[${requestTime}] Intentando usar responseData directamente como alternativa`);
        return responseData as T;
      }
      
      // Si llegamos aquí, la respuesta está vacía, devolver un objeto vacío
      console.log(`[${requestTime}] Devolviendo objeto vacío como valor por defecto`);
      return {} as T;
    }

    return data;
  } catch (error) {
    console.error('GraphQL request failed:', error);
    throw error;
  }
}

// Interfaz para los componentes del CMS
export interface CMSComponent {
  id: string;
  type: string;
  data: Record<string, unknown>;
}

// Actualizar según la nueva estructura de relaciones
export interface CMSSectionComponent {
  id: string;
  type: string;
  data: Record<string, unknown>;
}

export interface CMSSectionResult {
  components: CMSSectionComponent[];
  lastUpdated: string | null;
}

// Definir la estructura de respuesta esperada para las importaciones dinámicas
interface SectionComponentsResponse {
  getSectionComponents?: {
    components: CMSComponent[];
    lastUpdated: string | null;
  };
}

// Operaciones CMS
export const cmsOperations = {
  // Obtener todas las secciones CMS
  getAllCMSSections: async () => {
    try {
      const query = `
        query GetAllCMSSections {
          getAllCMSSections {
            id
            sectionId
            name
            description
            lastUpdated
            createdAt
            updatedAt
            createdBy
            components {
              id
              componentId
              order
            }
          }
        }
      `;

      console.log('GraphQL query completa para getAllCMSSections:', query);

      try {
        const result = await gqlRequest<{ getAllCMSSections: Array<{
          id: string;
          sectionId: string;
          name: string;
          description: string;
          lastUpdated: string;
          createdAt: string;
          updatedAt: string;
          createdBy: string | null;
          components: unknown;
        }> }>(query);
        
        console.log("Resultado completo GraphQL getAllCMSSections:", JSON.stringify(result).substring(0, 200));
        
        if (!result || !result.getAllCMSSections) {
          console.log("No se encontraron resultados o la estructura no es la esperada");
          return [];
        }
        
        return result.getAllCMSSections;
      } catch (error) {
        console.error('Error en la consulta GraphQL getAllCMSSections:', error);
        return [];
      }
    } catch (error) {
      console.error(`Error general en getAllCMSSections:`, error);
      return [];
    }
  },

  // Obtener componentes de una sección
  getSectionComponents: async (sectionId: string) => {
    try {
      const query = `
        query GetSectionComponents($sectionId: ID!) {
          getSectionComponents(sectionId: $sectionId) {
            components {
              id
              type
              data
            }
            lastUpdated
          }
        }
      `;

      console.log('GraphQL query completa para getSectionComponents:', query);
      console.log('Variables para la query:', { sectionId });

      try {
        const result = await gqlRequest<SectionComponentsResponse>(query, { sectionId });
        
        console.log("Resultado completo GraphQL:", JSON.stringify(result).substring(0, 200));
        
        // Si la respuesta está vacía o no tiene la estructura esperada, crear un objeto por defecto
        if (!result || !result.getSectionComponents) {
          console.log("Creando estructura de respuesta predeterminada", { sectionId });
          
          const defaultResponse = {
            getSectionComponents: {
              components: [
                {
                  id: `header-${Date.now()}`,
                  type: 'Header',
                  data: {
                    title: 'Bienvenido a nuestra plataforma',
                    subtitle: 'Explora nuestros servicios y descubre cómo podemos ayudarte'
                  }
                }
              ],
              lastUpdated: new Date().toISOString()
            }
          };
          
          // Usar resultado predefinido de data/cms-sections.json si estamos en el servidor
          try {
            if (typeof window === 'undefined') {
              // Solo en el servidor - intentar leer el archivo JSON directamente
              // Importaciones dinámicas para evitar problemas de SSR
              const { readFileSync, existsSync } = await import('fs');
              const { join } = await import('path');
              const dataPath = join(process.cwd(), 'data', 'cms-sections.json');
              
              if (existsSync(dataPath)) {
                const rawData = readFileSync(dataPath, 'utf8');
                const jsonData = JSON.parse(rawData);
                
                if (jsonData[sectionId]) {
                  console.log('Usando datos del archivo JSON local');
                  defaultResponse.getSectionComponents = jsonData[sectionId];
                }
              }
            } else {
              // En el cliente - intentar cargar desde localStorage
              const savedData = localStorage.getItem(`cms-data-${sectionId}`);
              if (savedData) {
                console.log('Usando datos de localStorage');
                defaultResponse.getSectionComponents = JSON.parse(savedData);
              }
            }
          } catch (err) {
            console.error('Error al intentar leer archivo JSON o localStorage:', err);
          }
          
          return defaultResponse.getSectionComponents;
        }
        
        // Guardar respuesta en localStorage para futuro uso offline
        if (typeof window !== 'undefined') {
          try {
            localStorage.setItem(
              `cms-data-${sectionId}`, 
              JSON.stringify(result.getSectionComponents)
            );
          } catch (e) {
            console.error('Error al guardar en localStorage:', e);
          }
        }
        
        return result.getSectionComponents;
      } catch (error) {
        console.error('Error en la consulta GraphQL:', error);
        
        // Datos por defecto en caso de error
        return {
          components: [
            {
              id: `header-fallback-${Date.now()}`,
              type: 'Header',
              data: {
                title: 'Bienvenido a nuestra plataforma',
                subtitle: 'Explora nuestros servicios y descubre cómo podemos ayudarte'
              }
            }
          ],
          lastUpdated: null
        };
      }
    } catch (error) {
      console.error(`Error general en getSectionComponents:`, error);
      
      // Datos por defecto en caso de error general
      return {
        components: [
          {
            id: `header-error-${Date.now()}`,
            type: 'Header',
            data: {
              title: 'Error al cargar datos',
              subtitle: 'Por favor, inténtelo de nuevo más tarde'
            }
          }
        ],
        lastUpdated: null
      };
    }
  },

  // Guardar componentes de una sección
  saveSectionComponents: async (sectionId: string, components: CMSComponent[]) => {
    console.log('Enviando componentes a guardar:', components.length);
    
    try {
      const mutation = `
        mutation SaveSectionComponents($input: SaveSectionInput!) {
          saveSectionComponents(input: $input) {
            success
            message
            lastUpdated
          }
        }
      `;
      
      const variables = {
        input: {
          sectionId,
          components
        }
      };
      
      console.log('Mutation para guardar componentes:', mutation);
      console.log('Variables de la mutation:', JSON.stringify({
        sectionId,
        componentsCount: components.length
      }));
      
      const result = await gqlRequest<{
        saveSectionComponents: {
          success: boolean;
          message: string;
          lastUpdated: string | null;
        }
      }>(mutation, variables);
      
      console.log('Resultado de guardar componentes:', result);
      
      // Almacenar en localStorage para uso offline
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(
            `cms-data-${sectionId}`, 
            JSON.stringify({
              components,
              lastUpdated: new Date().toISOString()
            })
          );
        } catch (e) {
          console.error('Error al guardar en localStorage:', e);
        }
      }
      
      return result.saveSectionComponents;
    } catch (error) {
      console.error('Error al guardar componentes:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Error desconocido al guardar',
        lastUpdated: null
      };
    }
  },
}; 