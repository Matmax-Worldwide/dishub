import { updateCMSSection } from './cms-update';

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

// Estructura de un componente de la base de datos
export interface CMSComponentDB {
  id: string;
  name: string;
  slug: string;
  description?: string;
  category?: string;
  icon?: string;
  schema?: Record<string, unknown>;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Estructura de una página CMS
export interface CMSPageDB {
  id: string;
  title: string;
  slug: string;
  description?: string;
  template?: string;
  isPublished: boolean;
  publishDate?: string;
  featuredImage?: string;
  metaTitle?: string;
  metaDescription?: string;
  pageType: string;
  createdAt: string;
  updatedAt: string;
  sections?: Array<{id: string; order?: number}>;
}

// Input para crear/actualizar componentes
export interface CMSComponentInput {
  name: string;
  slug: string;
  description?: string;
  category?: string;
  schema?: Record<string, unknown>;
  icon?: string;
}

// Resultado de operaciones con componentes
export interface CMSComponentResult {
  success: boolean;
  message: string;
  component: CMSComponentDB | null;
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

// Interfaces for page data
export interface PageData {
  id: string;
  title: string;
  slug: string;
  description?: string | null;
  template?: string;
  isPublished: boolean;
  publishDate?: string | null;
  featuredImage?: string | null;
  metaTitle?: string | null;
  metaDescription?: string | null;
  parentId?: string | null;
  order?: number;
  pageType: string;
  locale?: string;
  scrollType?: 'normal' | 'smooth';
  createdAt?: string;
  updatedAt?: string;
  sections?: PageSectionData[]; // Allow for different structure
}

// Generic GraphQL response type
interface GraphQLResponse<T> {
  data?: {
    [key: string]: T;
  };
  errors?: Array<{ message: string }>;
}

export interface PageSectionData {
  id: string;
  sectionId: string;
  order: number;
  title?: string;
  componentType?: string;
  data?: Record<string, unknown>;
  isVisible?: boolean;
}

// Get a page by its slug
async function getPageBySlug(slug: string): Promise<PageData | null> {
  try {
    const query = `
      query GetPageBySlug($slug: String!) {
        getPageBySlug(slug: $slug) {
          id
          title
          slug
          description
          template
          isPublished
          publishDate
          featuredImage
          metaTitle
          metaDescription
          parentId
          order
          pageType
          locale
          scrollType
          createdAt
          updatedAt
          sections {
            id
            order
            title
            componentType
            data
            isVisible
          }
        }
      }
    `;

    const variables = { slug };
    
    const result = await gqlRequest<{ 
      getPageBySlug?: PageData; 
      data?: { getPageBySlug: PageData };
      errors?: Array<{ message: string }>
    }>(query, variables);
    
    // Check for errors in the response
    if (result.errors && result.errors.length > 0) {
      console.error(`Error in getPageBySlug: ${result.errors.map(e => e.message).join(', ')}`);
      return null;
    }
    
    // Try to extract page data from different possible response structures
    let page: PageData | null = null;
    
    // Direct property
    if (result.getPageBySlug) {
      page = result.getPageBySlug;
    } 
    // Nested under data
    else if (result.data?.getPageBySlug) {
      page = result.data.getPageBySlug;
    }
    // Check if data is the top-level property with getPageBySlug inside
    else if (typeof result === 'object' && result !== null && 'data' in result) {
      const data = (result as GraphQLResponse<PageData>).data;
      if (data && typeof data === 'object' && 'getPageBySlug' in data) {
        page = data.getPageBySlug;
      }
    }
    
    // Found a page
    if (page && page.id) {
      // Log section info if page has sections
      if (page.sections && Array.isArray(page.sections)) {
        console.log(`Page "${page.title}" has ${page.sections.length} sections`);
        page.sections.forEach((section, index) => {
          // Check if section is a PageSectionData type with componentType
          if ('componentType' in section) {
            console.log(`Section ${index + 1}: ID=${section.id}, Order=${section.order}, Type=${section.componentType || 'unknown'}`);
          } else {
            console.log(`Section ${index + 1}: ID=${section.id}, Order=${section.order || 0}`);
          }
        });
      } else {
        console.log(`Page "${page.title}" has no sections defined`);
      }
      return page;
    }
    
    // For debugging purposes, try to list available pages
    try {
      const listQuery = `
        query GetAllPages {
          getAllCMSPages {
            id
            slug
            title
          }
        }
      `;
      const listResult = await gqlRequest<{ 
        getAllCMSPages: Array<{ id: string; slug: string; title: string }> 
      }>(listQuery);
      
      // Check different possible structures for the getAllCMSPages result
      let pages: Array<{ id: string; slug: string; title: string }> = [];
      
      if (listResult.getAllCMSPages) {
        pages = listResult.getAllCMSPages;
      } else if (typeof listResult === 'object' && listResult !== null && 'data' in listResult) {
        const data = (listResult as GraphQLResponse<Array<{ id: string; slug: string; title: string }>>).data;
        if (data && typeof data === 'object' && 'getAllCMSPages' in data) {
          pages = data.getAllCMSPages;
        }
      }
      
      // Check if a matching page exists but wasn't returned correctly
      if (pages.length > 0) {
        const matchingPage = pages.find(p => 
          p.slug === slug || 
          p.slug.toLowerCase() === slug.toLowerCase() ||
          p.slug.replace(/-/g, '') === slug.replace(/-/g, '') ||
          p.slug.replace(/-/g, ' ') === slug.replace(/-/g, ' ')
        );
        
        if (matchingPage) {
          console.log(`Found matching page "${matchingPage.title}" but couldn't fetch its sections`);
          
          // Try to fetch by ID as a fallback
          try {
            const foundPage = await getPageById(matchingPage.id);
            if (foundPage) {
              // Log section info
              if (foundPage.sections && Array.isArray(foundPage.sections)) {
                console.log(`Page "${foundPage.title}" (fetched by ID) has ${foundPage.sections.length} sections`);
                foundPage.sections.forEach((section, index) => {
                  // Check if section is a PageSectionData type with componentType
                  if ('componentType' in section) {
                    console.log(`Section ${index + 1}: ID=${section.id}, Order=${section.order}, Type=${section.componentType || 'unknown'}`);
                  } else {
                    console.log(`Section ${index + 1}: ID=${section.id}, Order=${section.order || 0}`);
                  }
                });
              } else {
                console.log(`Page "${foundPage.title}" (fetched by ID) has no sections defined`);
              }
              return foundPage;
            }
          } catch (idError) {
            console.error(`Error fetching page sections by ID:`, idError);
          }
        }
      }
    } catch (listError) {
      console.error(`Error listing sections:`, listError);
    }
    
    return null;
  } catch (error) {
    console.error(`Error retrieving page sections:`, error);
    throw error;
  }
}

// Update a page
async function updatePage(id: string, input: {
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
  sections?: Array<{
    id?: string;
    order: number;
    title?: string;
    componentType?: string;
    data?: Record<string, unknown>;
    isVisible?: boolean;
  }>;
}): Promise<{
  success: boolean;
  message: string;
  page: PageData | null;
}> {
  try {
    // Preprocess sections data to ensure component titles and section names are preserved
    if (input.sections && input.sections.length > 0) {
      input.sections = input.sections.map(section => {
        // Make sure section data includes section name if available
        if (section.title) {
          if (!section.data) {
            section.data = {};
          }
          section.data.sectionName = section.title;
        }

        // Make sure data field exists
        if (!section.data) {
          section.data = {};
        }

        return section;
      });
    }

    console.log('Processed input for updatePage:', JSON.stringify(input, null, 2));

    const mutation = `
      mutation UpdatePage($id: ID!, $input: UpdatePageInput!) {
        updatePage(id: $id, input: $input) {
          success
          message
          page {
            id
            title
            slug
            description
            template
            isPublished
            pageType
            locale
            updatedAt
            sections {
              id
              order
              title
              data
            }
          }
        }
      }
    `;

    console.log('Updating page with data:', { id, input });
    const variables = { id, input };
    const result = await gqlRequest<{ 
      updatePage?: { success: boolean; message: string; page: PageData | null };
      data?: { updatePage: { success: boolean; message: string; page: PageData | null } }
    }>(mutation, variables);
    console.log('Update page result:', result);
    
    // Handle different response structures
    if (result.updatePage) {
      return result.updatePage;
    } else if (result.data?.updatePage) {
      return result.data.updatePage;
    }
    
    return {
      success: false,
      message: 'Failed to update page: Unexpected response format',
      page: null
    };
  } catch (error) {
    console.error('Error updating page:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error updating page',
      page: null
    };
  }
}

// Get a page by ID
async function getPageById(id: string): Promise<PageData | null> {
  const requestId = `req-${Math.random().toString(36).substring(2, 9)}`;
  console.log(`🔍 [${requestId}] GraphQL CLIENT - getPageById - Starting request for ID: "${id}"`);
  
  try {
    // First try to get all pages and filter by ID
    const allPages = await cmsOperations.getAllPages();
    const page = allPages.find(p => p.id === id);
    
    if (page) {
      console.log(`✅ [${requestId}] GraphQL CLIENT - getPageById - Found page with title: "${page.title}"`);
      return page as PageData;
    }
    
    console.log(`❓ [${requestId}] GraphQL CLIENT - getPageById - No page found with ID: ${id}`);
    return null;
  } catch (error) {
    console.error(`❌ [${requestId}] GraphQL CLIENT - getPageById - Error:`, error);
    return null;
  }
}

// Get page with detailed section components for preview
export async function getPagePreview(pageData: PageData): Promise<{
  page: PageData;
  sections: Array<{
    id: string;
    title?: string;
    order: number;
    components: CMSComponent[];
  }>;
}> {
  console.log(`Generating preview for page: "${pageData.title}"`);
  
  const sections: Array<{
    id: string;
    title?: string;
    order: number;
    components: CMSComponent[];
  }> = [];
  
  if (!pageData.sections || !Array.isArray(pageData.sections) || pageData.sections.length === 0) {
    console.log(`Page has no sections to preview`);
    return { page: pageData, sections: [] };
  }
  
  // Log all sections we're going to fetch
  console.log(`Fetching components for ${pageData.sections.length} sections`);
  
  // Process each section to get its components
  for (const section of pageData.sections) {
    try {
      // Only fetch if we have a section ID
      if (!section.id) {
        console.log(`Section missing ID, skipping component fetch`);
        continue;
      }
      
      // Get the CMSSection data first
      const cmsSection = await cmsOperations.getCMSSection(section.id);
      if (!cmsSection) {
        console.log(`CMSSection not found for ID: ${section.id}`);
        continue;
      }
      
      console.log(`Fetching components for section ID: ${cmsSection.sectionId}`);
      
      // Get section title if available
      const sectionTitle = cmsSection.name || `Section ${section.order || 0}`;
      
      // Fetch the components for this section using the CMSSection's sectionId
      const { components } = await cmsOperations.getSectionComponents(cmsSection.sectionId);
      
      console.log(`Fetched ${components.length} components for section "${sectionTitle}"`);
      
      // Add to our sections array with components
      sections.push({
        id: section.id,
        title: sectionTitle,
        order: section.order || 0,
        components
      });
      
      // Log component types for debugging
      if (components.length > 0) {
        console.log(`Component types in section "${sectionTitle}":`, 
          components.map(c => c.type).join(', '));
      }
    } catch (error) {
      console.error(`Error fetching components for section ${section.id}:`, error);
      
      // Add the section with empty components to maintain structure
      sections.push({
        id: section.id,
        title: 'title' in section ? section.title : `Section ${section.order || 0}`,
        order: section.order || 0,
        components: []
      });
    }
  }
  
  // Sort sections by order
  sections.sort((a, b) => a.order - b.order);
  
  console.log(`Page preview generated with ${sections.length} populated sections`);
  
  return {
    page: pageData,
    sections
  };
}

// Get section components for editing
export async function loadSectionComponentsForEdit(sectionId: string): Promise<{
  sectionId: string;
  components: CMSComponent[];
  lastUpdated: string | null;
}> {
  try {
    console.log(`Loading components for section ${sectionId} in editor`);
    
    // Fetch the components for this section
    const { components, lastUpdated } = await cmsOperations.getSectionComponents(sectionId);
    
    console.log(`Editor: Loaded ${components.length} components for section ${sectionId}`);
    
    if (components.length > 0) {
      // Log types and data structure to help with editing
      console.log(`Component types for editing:`, components.map(c => c.type));
      console.log(`First component data structure:`, 
        Object.keys(components[0].data || {}).join(', '));
    }
    
    return { 
      sectionId,
      components, 
      lastUpdated 
    };
  } catch (error) {
    console.error(`Error loading section components for edit:`, error);
    return { 
      sectionId,
      components: [], 
      lastUpdated: null 
    };
  }
}

// Apply edits to a component within a section
export async function applyComponentEdit(
  sectionId: string,
  componentId: string,
  editedData: Record<string, unknown>
): Promise<{
  success: boolean;
  message: string;
  lastUpdated: string | null;
}> {
  try {
    console.log(`Applying edits to component ${componentId} in section ${sectionId}`);
    
    // First fetch the current components
    const { components } = await cmsOperations.getSectionComponents(sectionId);
    
    if (!components || components.length === 0) {
      return {
        success: false,
        message: `No components found in section ${sectionId}`,
        lastUpdated: null
      };
    }
    
    // Find the component to update
    const componentIndex = components.findIndex(c => c.id === componentId);
    
    if (componentIndex === -1) {
      console.error(`Component ${componentId} not found in section ${sectionId}`);
      return {
        success: false,
        message: `Component ${componentId} not found in section`,
        lastUpdated: null
      };
    }
    
    console.log(`Found component at index ${componentIndex}, updating data`);
    
    // Create a new array with the updated component
    const updatedComponents = [...components];
    updatedComponents[componentIndex] = {
      ...updatedComponents[componentIndex],
      data: {
        ...updatedComponents[componentIndex].data,
        ...editedData
      }
    };
    
    console.log(`Saving updated component: ${JSON.stringify({
      id: updatedComponents[componentIndex].id,
      type: updatedComponents[componentIndex].type,
      dataKeys: Object.keys(updatedComponents[componentIndex].data || {})
    })}`);
    
    // Save all components back to the section
    const result = await cmsOperations.saveSectionComponents(sectionId, updatedComponents);
    
    return result;
  } catch (error) {
    console.error('Error applying component edit:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error updating component',
      lastUpdated: null
    };
  }
}

// Update a component title in a section
async function updateComponentTitle(sectionId: string, componentId: string, title: string): Promise<{
  success: boolean;
  message: string;
  lastUpdated?: string | null;
}> {
  try {
    // First get current section components
    const sectionData = await cmsOperations.getSectionComponents(sectionId);
    
    if (!sectionData || !sectionData.components || !Array.isArray(sectionData.components)) {
      return {
        success: false,
        message: 'Failed to get section components'
      };
    }
    
    // Find the component by ID and update its title
    const updatedComponents = sectionData.components.map(component => {
      if (component.id === componentId) {
        // Preserve the original data and add title
        return {
          ...component,
          data: {
            ...component.data,
            componentTitle: title
          }
        };
      }
      return component;
    });
    
    // Save the updated components
    const saveResult = await cmsOperations.saveSectionComponents(sectionId, updatedComponents);
    
    return {
      success: saveResult.success,
      message: saveResult.message || `Component title ${saveResult.success ? 'updated' : 'update failed'}`,
      lastUpdated: saveResult.lastUpdated
    };
  } catch (error) {
    console.error('Error updating component title:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error updating component title'
    };
  }
}

// Update a section name
async function updateSectionName(sectionId: string, name: string): Promise<{
  success: boolean;
  message: string;
  lastUpdated?: string | null;
}> {
  try {
    // Use the updateCMSSection function from cms-update.ts
    const result = await updateCMSSection(sectionId, { name });
    
    return {
      success: result.success,
      message: result.message,
      lastUpdated: result.lastUpdated
    };
  } catch (error) {
    console.error('Error updating section name:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error updating section name'
    };
  }
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

  // Obtener todas las páginas CMS
  getAllPages: async () => {
    try {
      const query = `
        query GetAllCMSPages {
          getAllCMSPages {
            id
            title
            slug
            description
            isPublished
            pageType
            createdAt
            updatedAt
            sections {
              id
              componentType
              content
              data
            }
          }
        }
      `;

      console.log('GraphQL query para getAllCMSPages');

      try {
        const result = await gqlRequest<{ getAllCMSPages: CMSPageDB[] }>(query);
        
        console.log("Resultado GraphQL getAllCMSPages:", JSON.stringify(result).substring(0, 200));
        
        if (!result || !result.getAllCMSPages) {
          console.log("No se encontraron páginas o la estructura no es la esperada");
          return [];
        }
        
        return result.getAllCMSPages;
      } catch (error) {
        console.error('Error en la consulta GraphQL getAllCMSPages:', error);
        return [];
      }
    } catch (error) {
      console.error(`Error general en getAllPages:`, error);
      return [];
    }
  },

  // Obtener todos los componentes CMS
  getAllComponents: async () => {
    try {
      const query = `
        query GetAllCMSComponents {
          getAllCMSComponents {
            id
            name
            slug
            description
            category
            icon
            isActive
            createdAt
            updatedAt
          }
        }
      `;

      console.log('GraphQL query para getAllCMSComponents');

      try {
        const result = await gqlRequest<{ getAllCMSComponents: CMSComponentDB[] }>(query);
        
        console.log("Resultado GraphQL getAllCMSComponents:", JSON.stringify(result).substring(0, 200));
        
        if (!result || !result.getAllCMSComponents) {
          console.log("No se encontraron componentes o la estructura no es la esperada");
          return [];
        }
        
        return result.getAllCMSComponents;
      } catch (error) {
        console.error('Error en la consulta GraphQL getAllCMSComponents:', error);
        return [];
      }
    } catch (error) {
      console.error(`Error general en getAllComponents:`, error);
      return [];
    }
  },

  // Obtener componentes por tipo
  getComponentsByType: async (type: string) => {
    try {
      const query = `
        query GetCMSComponentsByType($type: String!) {
          getCMSComponentsByType(type: $type) {
            id
            name
            slug
            description
            category
            icon
            isActive
            createdAt
            updatedAt
          }
        }
      `;

      console.log(`GraphQL query para getCMSComponentsByType, tipo: ${type}`);

      try {
        const result = await gqlRequest<{ getCMSComponentsByType: CMSComponentDB[] }>(query, { type });
        
        console.log(`Resultado GraphQL getCMSComponentsByType (${type}):`, JSON.stringify(result).substring(0, 200));
        
        if (!result || !result.getCMSComponentsByType) {
          console.log(`No se encontraron componentes de tipo ${type}`);
          return [];
        }
        
        return result.getCMSComponentsByType;
      } catch (error) {
        console.error(`Error en la consulta GraphQL getCMSComponentsByType (${type}):`, error);
        return [];
      }
    } catch (error) {
      console.error(`Error general en getComponentsByType:`, error);
      return [];
    }
  },

  // Obtener un componente por ID
  getComponentById: async (id: string) => {
    try {
      const query = `
        query GetCMSComponent($id: ID!) {
          getCMSComponent(id: $id) {
            id
            name
            slug
            description
            category
            icon
            schema
            isActive
            createdAt
            updatedAt
          }
        }
      `;

      console.log(`GraphQL query para getCMSComponent, id: ${id}`);

      try {
        const result = await gqlRequest<{ getCMSComponent: CMSComponentDB | null }>(query, { id });
        
        if (!result || !result.getCMSComponent) {
          console.log(`No se encontró el componente con id ${id}`);
          return null;
        }
        
        return result.getCMSComponent;
      } catch (error) {
        console.error(`Error en la consulta GraphQL getCMSComponent (${id}):`, error);
        return null;
      }
    } catch (error) {
      console.error(`Error general en getComponentById:`, error);
      return null;
    }
  },

  // Crear un nuevo componente
  createComponent: async (input: CMSComponentInput) => {
    try {
      const mutation = `
        mutation CreateCMSComponent($input: CreateCMSComponentInput!) {
          createCMSComponent(input: $input) {
            success
            message
            component {
              id
              name
              slug
              description
              category
              icon
              isActive
              createdAt
              updatedAt
            }
          }
        }
      `;

      console.log('Mutation para crear componente:', input.name);
      
      const result = await gqlRequest<{ createCMSComponent: CMSComponentResult }>(mutation, { input });
      
      console.log('Resultado de crear componente:', result);
      
      return result.createCMSComponent;
    } catch (error) {
      console.error('Error al crear componente:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Error desconocido al crear componente',
        component: null
      };
    }
  },

  // Actualizar un componente existente
  updateComponent: async (id: string, input: Partial<CMSComponentInput>) => {
    try {
      const mutation = `
        mutation UpdateCMSComponent($id: ID!, $input: UpdateCMSComponentInput!) {
          updateCMSComponent(id: $id, input: $input) {
            success
            message
            component {
              id
              name
              slug
              description
              category
              icon
              isActive
              createdAt
              updatedAt
            }
          }
        }
      `;

      console.log(`Mutation para actualizar componente: ${id}`);
      
      const result = await gqlRequest<{ updateCMSComponent: CMSComponentResult }>(mutation, { id, input });
      
      console.log('Resultado de actualizar componente:', result);
      
      return result.updateCMSComponent;
    } catch (error) {
      console.error('Error al actualizar componente:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Error desconocido al actualizar componente',
        component: null
      };
    }
  },

  // Eliminar un componente
  deleteComponent: async (id: string) => {
    try {
      const mutation = `
        mutation DeleteCMSComponent($id: ID!) {
          deleteCMSComponent(id: $id) {
            success
            message
          }
        }
      `;

      console.log(`Mutation para eliminar componente: ${id}`);
      
      const result = await gqlRequest<{ deleteCMSComponent: { success: boolean; message: string } }>(mutation, { id });
      
      console.log('Resultado de eliminar componente:', result);
      
      return result.deleteCMSComponent;
    } catch (error) {
      console.error('Error al eliminar componente:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Error desconocido al eliminar componente'
      };
    }
  },

  // Create a new page
  createPage: async (pageInput: {
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
    sections?: string[];
  }) => {
    const requestId = `req-${Math.random().toString(36).substring(2, 9)}`;
    console.log(`🔍 [${requestId}] GraphQL CLIENT - createPage - Starting request`);
    
    try {
      const query = `
        mutation CreatePage($input: CreatePageInput!) {
          createPage(input: $input) {
            success
            message
            page {
              id
              title
              slug
            }
          }
        }
      `;
      
      const variables = {
        input: pageInput
      };
      
      const result = await gqlRequest<{
        createPage: {
          success: boolean;
          message: string;
          page: {
            id: string;
            title: string;
            slug: string;
          } | null;
        }
      }>(query, variables);
      
      console.log(`✅ [${requestId}] GraphQL CLIENT - createPage - Result:`, result);
      
      if (!result || !result.createPage) {
        console.error(`❌ [${requestId}] GraphQL CLIENT - createPage - Error: No valid response`);
        return { success: false, message: 'Failed to create page' };
      }
      
      return result.createPage;
    } catch (error) {
      console.error(`❌ [${requestId}] GraphQL CLIENT - createPage - Error:`, error);
      return { 
        success: false, 
        message: error instanceof Error ? error.message : 'Unknown error creating page',
        page: null
      };
    }
  },

  applyComponentEdit,
  
  loadSectionComponentsForEdit,
  
  getPagePreview,
  
  getPageBySlug,
  updatePage,
  getPageById,

  // Eliminar una página CMS
  deletePage: async (id: string): Promise<{
    success: boolean;
    message: string;
  }> => {
    try {
      const mutation = `
        mutation DeletePage($id: ID!) {
          deletePage(id: $id) {
            success
            message
          }
        }
      `;
      
      console.log(`Eliminando página con ID: ${id}`);
      
      const variables = { id };
      const result = await gqlRequest<{ 
        deletePage: { 
          success: boolean; 
          message: string; 
        } 
      }>(mutation, variables);
      
      if (!result.deletePage) {
        return {
          success: false,
          message: 'Error: No se recibió respuesta del servidor'
        };
      }
      
      return result.deletePage;
    } catch (error) {
      console.error('Error al eliminar página:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Error desconocido al eliminar la página'
      };
    }
  },

  // Obtener páginas que usan una sección específica
  getPagesUsingSectionId: async (sectionId: string) => {
    try {
      const query = `
        query GetPagesUsingSectionId($sectionId: ID!) {
          getPagesUsingSectionId(sectionId: $sectionId) {
            id
            title
            slug
            description
            isPublished
            pageType
            locale
            updatedAt
            sections {
              id
              order
              data
            }
          }
        }
      `;

      console.log(`GraphQL query para getPagesUsingSectionId, sectionId: ${sectionId}`);

      try {
        const result = await gqlRequest<{ getPagesUsingSectionId: PageData[] }>(query, { sectionId });
        
        console.log(`Resultado GraphQL getPagesUsingSectionId (${sectionId}):`, JSON.stringify(result).substring(0, 200));
        
        if (!result || !result.getPagesUsingSectionId) {
          console.log(`No se encontraron páginas que usen la sección ${sectionId}`);
          return [];
        }
        
        return result.getPagesUsingSectionId;
      } catch (error) {
        console.error(`Error en la consulta GraphQL getPagesUsingSectionId (${sectionId}):`, error);
        return [];
      }
    } catch (error) {
      console.error(`Error general en getPagesUsingSectionId:`, error);
      return [];
    }
  },

  async getCMSSection(id: string): Promise<{
    id: string;
    sectionId: string;
    name: string;
    description: string;
    lastUpdated: string;
    createdAt: string;
    updatedAt: string;
    createdBy: string | null;
    components: unknown;
  } | null> {
    const query = `
      query GetCMSSection($id: String!) {
        getCMSSection(id: $id) {
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
    
    const response = await gqlRequest<{
      getCMSSection: {
        id: string;
        sectionId: string;
        name: string;
        description: string;
        lastUpdated: string;
        createdAt: string;
        updatedAt: string;
        createdBy: string | null;
        components: unknown;
      } | null;
    }>(query, { id });
    
    return response?.getCMSSection || null;
  },

  updateComponentTitle,
  updateSectionName
}; 