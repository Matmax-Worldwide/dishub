// Función simple para realizar solicitudes GraphQL
export async function gqlRequest<T>(
  query: string,
  variables: Record<string, unknown> = {},
): Promise<T> {
  // Generar un ID único para esta solicitud para facilitar el seguimiento en logs
  const requestId = `req-${Math.random().toString(36).substring(2, 9)}`;
  
  try {
    console.log(`🔍 gqlRequest [${requestId}] - Iniciando solicitud GraphQL`); 
    console.log(`🔍 gqlRequest [${requestId}] - Query: ${query.substring(0, 100).replace(/\s+/g, ' ')}...`);
    console.log(`🔍 gqlRequest [${requestId}] - Variables: ${JSON.stringify(variables)}`);
    
    // Añadir etiqueta de tiempo para depuración
    const requestTime = new Date().toISOString();
    console.log(`🔍 gqlRequest [${requestId}] [${requestTime}] - Enviando solicitud a /api/graphql`);
    
    const response = await fetch('/api/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'X-Request-ID': requestId // Añadir ID de seguimiento en cabeceras
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
    console.log(`🔍 gqlRequest [${requestId}] - Respuesta recibida, status:`, response.status);
    
    // Si hay un error, intentemos recuperar el mensaje detallado
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ gqlRequest [${requestId}] - Error HTTP ${response.status}: ${errorText.substring(0, 500)}`);
      
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
    
    // Tamaño de la respuesta para diagnóstico
    const responseSize = responseText.length;
    console.log(`🔍 gqlRequest [${requestId}] - Respuesta recibida, tamaño: ${responseSize} bytes`);
    console.log(`🔍 gqlRequest [${requestId}] - Respuesta cruda (primeros 500 caracteres):`, 
      responseText.substring(0, 500) + (responseText.length > 500 ? '...' : ''));
    
    // Si la respuesta está vacía, lanzar un error
    if (!responseText.trim()) {
      console.error(`❌ gqlRequest [${requestId}] - Respuesta vacía del servidor`);
      throw new Error('La respuesta del servidor está vacía');
    }
    
    let responseData;
    try {
      responseData = JSON.parse(responseText);
      console.log(`🔍 gqlRequest [${requestId}] - JSON parseado correctamente`);
    } catch (e) {
      console.error(`❌ gqlRequest [${requestId}] - Error al parsear respuesta JSON:`, e);
      console.error(`❌ gqlRequest [${requestId}] - Texto de respuesta problemático:`, responseText.substring(0, 500));
      throw new Error(`Error al parsear la respuesta del servidor: ${responseText.substring(0, 200)}`);
    }
    
    console.log(`🔍 gqlRequest [${requestId}] - Estructura de la respuesta:`, 
      Object.keys(responseData).join(', '));
    
    // Verificar que la respuesta tiene la estructura esperada
    if (!responseData || typeof responseData !== 'object') {
      console.error(`❌ gqlRequest [${requestId}] - Respuesta con formato inválido:`, responseData);
      throw new Error('La respuesta GraphQL no tiene un formato válido');
    }
    
    const { data, errors } = responseData as { 
      data?: T; 
      errors?: Array<{ message: string; path?: string[]; locations?: Array<{line: number; column: number}> }> 
    };

    if (errors && errors.length > 0) {
      console.error(`❌ gqlRequest [${requestId}] - Errores GraphQL:`, JSON.stringify(errors, null, 2));
      
      // Información más detallada sobre cada error
      errors.forEach((error, index) => {
        console.error(`❌ Error ${index + 1}: ${error.message}`);
        if (error.path) console.error(`  Path: ${error.path.join('.')}`);
        if (error.locations) {
          error.locations.forEach(loc => {
            console.error(`  Location: línea ${loc.line}, columna ${loc.column}`);
          });
        }
      });
      
      throw new Error(errors.map(e => e.message).join('\n'));
    }
    
    // Verificar que data no es null o undefined
    if (data === undefined || data === null) {
      console.error(`❌ gqlRequest [${requestId}] - La respuesta no contiene datos:`, responseData);
      
      // Intentar otra estrategia: si responseData parece ser válido, devolverlo
      if (responseData && Object.keys(responseData).length > 0) {
        console.log(`🔧 gqlRequest [${requestId}] - Intentando usar responseData directamente como alternativa`);
        return responseData as T;
      }
      
      // Si llegamos aquí, la respuesta está vacía, devolver un objeto vacío
      console.log(`🔧 gqlRequest [${requestId}] - Devolviendo objeto vacío como valor por defecto`);
      return {} as T;
    }

    console.log(`✅ gqlRequest [${requestId}] - Solicitud exitosa, devolviendo datos`);
    return data;
  } catch (error) {
    console.error(`❌ gqlRequest [${requestId}] - Fallo en solicitud GraphQL:`, error);
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
      // Identificador único para esta solicitud
      const requestId = `getSections-${Math.random().toString(36).substring(2, 9)}`;
      const startTime = Date.now();
      
      console.log(`🔍 [${requestId}] GraphQL CLIENT - getSectionComponents - INICIO PETICIÓN, sectionId: [${sectionId}]`);
      
      // Verificar si el sectionId es válido
      if (!sectionId) {
        console.error(`❌ [${requestId}] sectionId inválido o vacío`);
        return { components: [], lastUpdated: null };
      }
      
      // Definir la consulta GraphQL
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

      console.log(`🔍 [${requestId}] Query completa:`, query.replace(/\s+/g, ' '));
      console.log(`🔍 [${requestId}] Variables:`, { sectionId });

      try {
        // Agregar un timestamp para evitar caching
        const timestamp = Date.now();
        console.log(`🔍 [${requestId}] Enviando solicitud con timestamp ${timestamp}, tiempo transcurrido: ${timestamp - startTime}ms`);
        
        // Ejecutar la consulta GraphQL con el timestamp para evitar cachés
        const queryWithCache = `${query}#${timestamp}`;
        const result = await gqlRequest<SectionComponentsResponse>(queryWithCache, { sectionId });
        
        console.log(`🔍 [${requestId}] Respuesta recibida después de ${Date.now() - startTime}ms`);
        
        // Inspección profunda de la respuesta
        if (!result) {
          console.error(`❌ [${requestId}] Respuesta NULA`);
          return { components: [], lastUpdated: null };
        } 
        
        // Mostrar las claves disponibles en la respuesta
        console.log(`🔍 [${requestId}] Claves en respuesta:`, Object.keys(result).join(', '));
        
        // Verificar si la respuesta contiene getSectionComponents
        if (!result.hasOwnProperty('getSectionComponents')) {
          console.error(`❌ [${requestId}] Campo 'getSectionComponents' NO ENCONTRADO en la respuesta`);
          console.error(`❌ [${requestId}] Contenido de la respuesta:`, JSON.stringify(result, null, 2).substring(0, 1000));
          return { components: [], lastUpdated: null };
        }
        
        // Verificar si getSectionComponents es nulo o indefinido
        if (result.getSectionComponents === null || result.getSectionComponents === undefined) {
          console.error(`❌ [${requestId}] 'getSectionComponents' es ${result.getSectionComponents === null ? 'NULL' : 'UNDEFINED'}`);
          return { components: [], lastUpdated: null };
        }
        
        // Verificar que components existe y es un array
        const { components, lastUpdated } = result.getSectionComponents;
        
        if (!components) {
          console.error(`❌ [${requestId}] El campo 'components' NO EXISTE en getSectionComponents`);
          console.error(`❌ [${requestId}] Contenido de getSectionComponents:`, result.getSectionComponents);
          return { components: [], lastUpdated };
        }
        
        if (!Array.isArray(components)) {
          console.error(`❌ [${requestId}] 'components' NO ES UN ARRAY, es de tipo:`, typeof components);
          return { components: [], lastUpdated };
        }
        
        // Mostrar información sobre los componentes
        console.log(`✅ [${requestId}] ÉXITO! Se encontraron ${components.length} componentes`);
        
        if (components.length === 0) {
          console.warn(`⚠️ [${requestId}] Array de componentes VACÍO aunque la respuesta fue correcta`);
        } else {
          console.log(`🔍 [${requestId}] Primer componente:`, JSON.stringify(components[0], null, 2));
          
          // Verificar la estructura de cada componente
          components.forEach((comp, idx) => {
            console.log(`🔍 [${requestId}] Componente #${idx+1}: ID=${comp.id}, Type=${comp.type}`);
            
            if (!comp.id || !comp.type) {
              console.warn(`⚠️ [${requestId}] Componente #${idx+1} tiene estructura INCOMPLETA`);
            }
            
            if (!comp.data) {
              console.warn(`⚠️ [${requestId}] Componente #${idx+1} NO TIENE datos`);
            } else {
              console.log(`🔍 [${requestId}] Componente #${idx+1} data keys:`, Object.keys(comp.data).join(', '));
            }
          });
        }
        
        // Mostrar información sobre lastUpdated
        if (!lastUpdated) {
          console.warn(`⚠️ [${requestId}] El campo 'lastUpdated' es ${lastUpdated === null ? 'NULL' : 'UNDEFINED'}`);
        } else {
          console.log(`🔍 [${requestId}] lastUpdated:`, lastUpdated);
        }
        
        console.log(`✅ [${requestId}] COMPLETADO en ${Date.now() - startTime}ms - Devolviendo respuesta con ${components.length} componentes`);
        return { 
          components, 
          lastUpdated 
        };
      } catch (error) {
        console.error(`❌ [${requestId}] ERROR EN CONSULTA:`, error);
        
        // Datos por defecto en caso de error
        return {
          components: [],
          lastUpdated: null
        };
      }
    } catch (error) {
      console.error(`❌ ERROR GENERAL EN getSectionComponents:`, error);
      
      // Datos por defecto en caso de error general
      return {
        components: [],
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