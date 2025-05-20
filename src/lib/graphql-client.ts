import { updateCMSSection } from './cms-update';

// Import form types
import {
  FormBase,
  FormStepBase,
  FormFieldBase,
  FormSubmissionBase,
  FormResult,
  FormStepResult,
  FormFieldResult,
  FormSubmissionResult,
  FormInput,
  FormStepInput,
  FormFieldInput,
  FormSubmissionInput,
  FormSubmissionStats
} from '@/types/forms';

// Función simple para realizar solicitudes GraphQL
export async function gqlRequest<T>(
  query: string,
  variables: Record<string, unknown> = {},
  timeout: number = 10000 // Default 10 second timeout
): Promise<T> {
  // Generar un ID único para esta solicitud para facilitar el seguimiento en logs
  const requestId = `req-${Math.random().toString(36).substring(2, 9)}`;
  
  try {
    // Only log in development mode
    if (process.env.NODE_ENV === 'development') {
      console.log(`🔍 gqlRequest [${requestId}] - Query: ${query.substring(0, 50).replace(/\s+/g, ' ')}...`);
      console.log(`🔍 gqlRequest [${requestId}] - Variables: ${JSON.stringify(variables).substring(0, 100)}...`);
      console.log(`🔍 gqlRequest [${requestId}] - Timeout: ${timeout}ms`);
    }
    
    // Create an AbortController to handle request timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      console.error(`⏱️ Request timeout: ${timeout}ms exceeded for [${requestId}]`);
      controller.abort();
    }, timeout);

    // Get session token from cookies if available
    const getToken = () => {
      if (typeof document !== 'undefined') {
        const cookies = document.cookie.split(';');
        const tokenCookie = cookies.find(cookie => cookie.trim().startsWith('session-token='));
        if (tokenCookie) {
          return tokenCookie.split('=')[1].trim();
        }
      }
      return null;
    };
    
    const token = getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    try {
      console.log(`🔄 Starting GraphQL request [${requestId}]`);
      const response = await fetch('/api/graphql', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          query,
          variables,
        }),
        signal: controller.signal,
        // Add cache control to improve performance for repeated queries
        cache: 'default',
      });
      
      // Clear the timeout as the request completed
      clearTimeout(timeoutId);
      
      // Handle non-ok responses
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`GraphQL HTTP error ${response.status} for [${requestId}]:`, errorText);
        throw new Error(`HTTP error ${response.status}: ${errorText}`);
      }
      
      console.log(`✅ GraphQL request completed [${requestId}]`);
      const responseData = await response.json();
      
      // Check for GraphQL errors
      if (responseData.errors && responseData.errors.length > 0) {
        const errorMessages = responseData.errors.map((e: { message: string }) => e.message).join(', ');
        console.error(`GraphQL errors for [${requestId}]:`, errorMessages);
        throw new Error(`GraphQL errors: ${errorMessages}`);
      }
      
      // Return the data property or the entire response if data is not present
      return responseData.data || responseData as T;
    } catch (error) {
      // Clear the timeout to prevent memory leaks
      clearTimeout(timeoutId);
      
      // Special handling for abort errors (timeouts)
      if (error instanceof DOMException && error.name === 'AbortError') {
        console.error(`⚠️ Request timed out after ${timeout}ms [${requestId}]`);
        throw new Error(`La solicitud GraphQL excedió el tiempo límite de ${timeout}ms`);
      }
      
      throw error;
    }
  } catch (error) {
    // Format the error for better debugging
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`GraphQL error [${requestId}]:`, errorMessage);
    
    // Rethrow with more context
    throw new Error(`Error en solicitud GraphQL: ${errorMessage}`);
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
  seo?: {
    title?: string; // Add title (same as metaTitle)
    description?: string; // Add description (same as metaDescription)
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
  pageId: string;  // Añadir referencia a la página
  sectionId: string;
  order: number;
  title?: string;
  componentType?: string;
  data?: Record<string, unknown>;
  isVisible?: boolean;
}

// Función de utilidad para validar la pertenencia de secciones
export const validateSectionOwnership = (sectionId: string, pageId: string): boolean => {
  return sectionId.startsWith(`page-${pageId}-`);
};

// Función de utilidad para generar IDs de sección únicos por página
export const generatePageSectionId = (pageId: string, sectionName: string): string => {
  const timestamp = Date.now();
  const sanitizedName = sectionName
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
  return `page-${pageId}-section-${sanitizedName}-${timestamp}`;
};

// Get a page by its slug
async function getPageBySlug(slug: string): Promise<PageData | null> {
  try {
    // Check cache first
    const cacheKey = `page_slug_${slug}`;
    const cachedPage = getCachedResponse<PageData>(cacheKey);
    
    if (cachedPage) {
      return cachedPage;
    }
    
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
          seo {
            title
            description
            keywords
            ogTitle
            ogDescription
            ogImage
            twitterTitle
            twitterDescription
            twitterImage
            canonicalUrl
            structuredData
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
      // Ensure there's always at least an empty SEO object
      if (!page.seo) {
        page.seo = {};
      }
      
      // Cache the page data
      setCachedResponse(cacheKey, page);
      
      return page;
    }
    
    // Try to find by ID as a fallback (less verbose)
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
          // Try to fetch by ID as a fallback
          const foundPage = await getPageById(matchingPage.id);
          if (foundPage) {
            // Cache the page data
            setCachedResponse(cacheKey, foundPage);
            return foundPage;
          }
        }
      }
    } catch (listError) {
      console.error(`Error listing pages:`, listError);
    }
    
    return null;
  } catch (error) {
    console.error(`Error retrieving page:`, error);
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
  seo?: {
    title?: string;
    description?: string;
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
  sectionIds?: string[]; // Usar sectionIds en lugar de sections
}): Promise<{
  success: boolean;
  message: string;
  page: PageData | null;
}> {
  try {
    // Preprocess SEO data for consistency
    const seoData = input.seo || {};
    const titleValue = input.metaTitle || seoData.title;
    const descriptionValue = input.metaDescription || seoData.description;
    
    if (titleValue) {
      if (!seoData.title) seoData.title = titleValue;
      if (!input.metaTitle) input.metaTitle = titleValue;
    }
    
    if (descriptionValue) {
      if (!seoData.description) seoData.description = descriptionValue;
      if (!input.metaDescription) input.metaDescription = descriptionValue;
    }

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
            metaTitle
            metaDescription
            featuredImage
            publishDate
            updatedAt
            sections {
              id
              sectionId
              name
              order
            }
            seo {
              title
              description
              keywords
              ogTitle
              ogDescription
              ogImage
              twitterTitle
              twitterDescription
              twitterImage
              canonicalUrl
              structuredData
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
  // Check cache first
  const cacheKey = `page_id_${id}`;
  const cachedPage = getCachedResponse<PageData>(cacheKey);
  
  if (cachedPage) {
    return cachedPage;
  }
  
  try {
    // First try to get all pages and filter by ID
    const allPages = await cmsOperations.getAllPages();
    const page = allPages.find(p => p.id === id);
    
    if (page) {
      // Cache the found page
      setCachedResponse(cacheKey, page as PageData);
      return page as PageData;
    }
    
    return null;
  } catch (error) {
    console.error(`Error in getPageById for ID ${id}:`, error);
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
      const result = await cmsOperations.getSectionComponents(cmsSection.sectionId);
      const { components } = result;
      
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
          components.map((c: CMSComponent) => c.type).join(', '));
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

// Get section components for editing
export async function loadSectionComponentsForEdit(sectionId: string): Promise<{
  sectionId: string;
  components: CMSComponent[];
  lastUpdated: string | null;
}> {
  try {
    console.log(`Loading components for section ${sectionId} in editor`);
    
    // Fetch the components for this section
    const result = await cmsOperations.getSectionComponents(sectionId);
    const { components, lastUpdated } = result;
    
    console.log(`Editor: Loaded ${components.length} components for section ${sectionId}`);
    
    if (components.length > 0) {
      // Log types and data structure to help with editing
      console.log(`Component types for editing:`, components.map((c: CMSComponent) => c.type));
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
    const result = await cmsOperations.getSectionComponents(sectionId);
    const { components } = result;
    
    if (!components || components.length === 0) {
      return {
        success: false,
        message: `No components found in section ${sectionId}`,
        lastUpdated: null
      };
    }
    
    // Find the component to update
    const componentIndex = components.findIndex((c: CMSComponent) => c.id === componentId);
    
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
    const result2 = await cmsOperations.saveSectionComponents(sectionId, updatedComponents);
    
    return result2;
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
    
    if (!sectionData.components || !Array.isArray(sectionData.components)) {
      return {
        success: false,
        message: 'Failed to get section components'
      };
    }
    
    // Find the component by ID and update its title
    const updatedComponents = sectionData.components.map((component: CMSComponent) => {
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


// Create a simple in-memory cache for API responses
const apiCache: Record<string, { data: unknown; timestamp: number }> = {};
const CACHE_TTL = 60000; // 1 minute cache TTL by default

// Get a cached response or undefined if expired or not found
function getCachedResponse<T>(cacheKey: string): T | undefined {
  const cachedItem = apiCache[cacheKey];
  
  if (!cachedItem) return undefined;
  
  const now = Date.now();
  if (now - cachedItem.timestamp > CACHE_TTL) {
    // Cache expired, remove it
    delete apiCache[cacheKey];
    return undefined;
  }
  
  return cachedItem.data as T;
}

// Cache an API response
function setCachedResponse<T>(cacheKey: string, data: T): void {
  apiCache[cacheKey] = {
    data,
    timestamp: Date.now()
  };
}

// Clear cache for a specific key or pattern
function clearCache(keyPattern?: string): void {
  if (!keyPattern) {
    // Clear all cache
    Object.keys(apiCache).forEach(key => delete apiCache[key]);
    return;
  }
  
  // Clear matching cache entries
  Object.keys(apiCache).forEach(key => {
    if (key.includes(keyPattern)) {
      delete apiCache[key];
    }
  });
}

// Define a type for the section components result
interface SectionComponentsResult {
  components: CMSComponent[];
  lastUpdated: string | null;
}

// Add this new type for HeaderStyle input
export interface HeaderStyleInput {
  transparency?: number;
  headerSize?: 'sm' | 'md' | 'lg';
  menuAlignment?: 'left' | 'center' | 'right';
  menuButtonStyle?: 'default' | 'filled' | 'outline';
  mobileMenuStyle?: 'fullscreen' | 'dropdown' | 'sidebar';
  mobileMenuPosition?: 'left' | 'right';
  transparentHeader?: boolean;
  borderBottom?: boolean;
  advancedOptions?: Record<string, unknown>;
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

        if (!result || !result.getAllCMSSections) {
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
  getSectionComponents: async (sectionId: string): Promise<SectionComponentsResult> => {
    try {
      // Exit early if sectionId is invalid
      if (!sectionId) {
        return { components: [], lastUpdated: null };
      }
      
      // Clean the sectionId by removing any query parameters or hashes
      let cleanedSectionId = sectionId;
      if (cleanedSectionId.includes('?')) {
        cleanedSectionId = cleanedSectionId.split('?')[0];
      }
      if (cleanedSectionId.includes('#')) {
        cleanedSectionId = cleanedSectionId.split('#')[0];
      }
      
      // Check cache first
      const cacheKey = `section_components_${cleanedSectionId}`;
      const cachedData = getCachedResponse<SectionComponentsResult>(cacheKey);
      
      if (cachedData) {
        return cachedData;
      }
      
      // Define the GraphQL query
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

      try {
        // Execute the GraphQL query
        const result = await gqlRequest<SectionComponentsResponse>(query, { sectionId: cleanedSectionId });
        
        if (!result || !result.getSectionComponents) {
          return { components: [], lastUpdated: null };
        }
        
        const { components = [], lastUpdated } = result.getSectionComponents;
        
        const response = { components, lastUpdated };
        
        // Store in cache
        setCachedResponse(cacheKey, response);
        
        return response;
      } catch (error) {
        console.error('Error fetching section components:', error);
        return { components: [], lastUpdated: null };
      }
    } catch (error) {
      console.error('Error in getSectionComponents:', error);
      return { components: [], lastUpdated: null };
    }
  },

  // Guardar componentes de una sección
  saveSectionComponents: async (
    sectionId: string, 
    components: CMSComponent[]
  ): Promise<{ 
    success: boolean; 
    message: string; 
    lastUpdated: string | null 
  }> => {
    try {
      // Ensure all components have an ID and remove any 'title' properties
      // since the GraphQL schema doesn't accept 'title' in ComponentInput
      const validComponents = components.map(comp => {
        // Ensure component has an ID
        const componentWithId = !comp.id 
          ? { ...comp, id: crypto.randomUUID() } 
          : comp;
        
        // Remove 'title' property if it exists
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { title, ...componentWithoutTitle } = componentWithId as { title?: string } & CMSComponent;
        
        return componentWithoutTitle;
      });
      
      const mutation = `
        mutation SaveSectionComponents($input: SaveSectionInput!) {
          saveSectionComponents(input: $input) {
            success
            message
            lastUpdated
          }
        }
      `;
      
      const input = {
        sectionId,
        components: validComponents
      };
      
      console.log(`Starting saveSectionComponents mutation for section ${sectionId} with ${components.length} components`);
      
      // Use a longer timeout for saving components - increase from 15s to 30s
      const result = await gqlRequest<{ 
        saveSectionComponents: { 
          success: boolean; 
          message: string; 
          lastUpdated: string | null;
        }
      }>(mutation, { input }, 30000);
      
      if (!result) {
        console.error('No result from GraphQL request in saveSectionComponents');
        throw new Error('No result received from server');
      }
      
      if (!result.saveSectionComponents) {
        console.error('Missing saveSectionComponents in result:', result);
        throw new Error('Invalid response format: missing saveSectionComponents field');
      }
      
      // Clear cache for this section
      clearCache(`section_components_${sectionId}`);
      
      return result.saveSectionComponents;
    } catch (error) {
      console.error('Error saving section components:', error);
      return {
        success: false,
        message: `Error al guardar componentes: "${error instanceof Error ? error.message : 'Error desconocido'}"`,
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

  // Create a new CMS page
  createPage: async (pageInput: {
    title: string;
    slug: string;
    description?: string;
    template?: string;
    isPublished?: boolean;
    pageType?: string;
    locale?: string;
    metaTitle?: string;
    metaDescription?: string;
    featuredImage?: string;
    sections?: string[];
  }): Promise<{
    success: boolean;
    message: string;
    page: {
      id: string;
      title: string;
      slug: string;
    } | null;
  }> => {
    // Generate a unique request ID for logging
    const requestId = `createPage-${Math.random().toString(36).substring(2, 9)}`;
    
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
        return { success: false, message: 'Failed to create page', page: null };
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
      console.error(`Error in getPagesUsingSectionId:`, error);
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
    // Check cache first
    const cacheKey = `section_${id}`;
    const cachedSection = getCachedResponse<{
      id: string;
      sectionId: string;
      name: string;
      description: string;
      lastUpdated: string;
      createdAt: string;
      updatedAt: string;
      createdBy: string | null;
      components: unknown;
    }>(cacheKey);
    
    if (cachedSection) {
      return cachedSection;
    }
    
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
    
    const result = response?.getCMSSection || null;
    
    // Cache the result
    if (result) {
      setCachedResponse(cacheKey, result);
    }
    
    return result;
  },

  // Create CMS Section
  createCMSSection: async (input: { 
    sectionId: string; 
    name: string; 
    description?: string; 
  }): Promise<{ 
    success: boolean; 
    message: string; 
    section: { id: string; sectionId: string; name: string } | null;
  }> => {
    try {
      const mutation = `
        mutation CreateCMSSection($input: CreateCMSSectionInput!) {
          createCMSSection(input: $input) {
            success
            message
            section {
              id
              sectionId
              name
            }
          }
        }
      `;
      
      console.log('Starting createCMSSection mutation with:', input);
      
      // Use a longer timeout for section creation - increase from 15s to 30s
      const result = await gqlRequest<{ 
        createCMSSection: { 
          success: boolean; 
          message: string; 
          section: { id: string; sectionId: string; name: string } | null;
        }
      }>(mutation, { input }, 30000);
      
      if (!result) {
        console.error('No result from GraphQL request in createCMSSection');
        throw new Error('No result received from server');
      }
      
      if (!result.createCMSSection) {
        console.error('Missing createCMSSection in result:', result);
        throw new Error('Invalid response format: missing createCMSSection field');
      }
      
      // Clear cache for related data
      clearCache(`section_${input.sectionId}`);
      
      return result.createCMSSection;
    } catch (error) {
      console.error('Error creating CMS section:', error);
      return {
        success: false,
        message: `Error al crear CMSSection: "${error instanceof Error ? error.message : 'Error desconocido'}"`,
        section: null
      };
    }
  },

  // Create a Page section - used in automatic page creation
  createPageSection: async (input: {
    pageId: string;
    title: string;
    componentType: string;
    order: number;
    isVisible?: boolean;
    data?: Record<string, unknown>;
    sectionId?: string;
    componentId?: string;
  }): Promise<{
    success: boolean;
    message: string;
    section: {
      id: string;
      title: string;
      order: number;
    } | null;
  }> => {
    try {
      const mutation = `
        mutation CreatePageSection($input: CreatePageSectionInput!) {
          createPageSection(input: $input) {
            success
            message
            section {
              id
              title
              order
            }
          }
        }
      `;
      
      console.log(`Starting createPageSection mutation with data:`, JSON.stringify(input, null, 2));
      
      const variables = { input };
      
      // Define a type for the GraphQL response
      type CreatePageSectionResponse = {
        createPageSection?: {
          success: boolean;
          message: string;
          section: {
            id: string;
            title: string;
            order: number;
          } | null;
        };
        data?: {
          createPageSection: {
            success: boolean;
            message: string;
            section: {
              id: string;
              title: string;
              order: number;
            } | null;
          }
        };
        errors?: Array<{ message: string }>;
      };
      
      // Use a longer timeout for this operation (30 seconds)
      const response = await gqlRequest<CreatePageSectionResponse>(mutation, variables, 30000);
      
      console.log('Raw GraphQL response for createPageSection:', JSON.stringify(response, null, 2));
      
      // Check for different possible response structures
      let result = null;
      
      // Direct structure: { createPageSection: { ... } }
      if (response && response.createPageSection) {
        console.log('Found direct createPageSection result in response');
        result = response.createPageSection;
      }
      // Nested in data: { data: { createPageSection: { ... } } }
      else if (response && response.data && response.data.createPageSection) {
        console.log('Found nested createPageSection result in response.data');
        result = response.data.createPageSection;
      }
      // Handle errors if present in response
      else if (response && response.errors) {
        const errorMessages = response.errors.map((e: { message: string }) => e.message).join(', ');
        console.error('GraphQL errors in createPageSection:', errorMessages);
        throw new Error(`GraphQL errors: ${errorMessages}`);
      }
      else {
        console.error('Unexpected response structure (missing createPageSection):', response);
      }
      
      // If we found a valid result, return it
      if (result) {
        // Clear cache for related data
        clearCache(`page_id_${input.pageId}`);
        return result;
      }
      
      // If we get here, the response didn't have the expected structure
      console.error('Could not extract valid createPageSection result from response:', response);
      
      // Create a defensively consistent response object
      return {
        success: false,
        message: 'La sección no pudo ser creada debido a un problema con la respuesta del servidor',
        section: null
      };
    } catch (error) {
      console.error('Error creating Page section:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error creating Page section',
        section: null
      };
    }
  },

  updateComponentTitle,
  updateSectionName,
  
  // Get all menus with their items
  getMenus: async () => {
    // Check cache first
    const cacheKey = 'all_menus';
    const cachedMenus = getCachedResponse<Array<{
      id: string;
      name: string;
      location: string | null;
      items: Array<{
        id: string;
        title: string;
        url: string | null;
        pageId: string | null;
        target: string | null;
        icon: string | null;
        order: number;
        children?: Array<{
          id: string;
          title: string;
          url: string | null;
          pageId: string | null;
          target: string | null;
          icon: string | null;
          order: number;
        }>;
        page?: {
          id: string;
          title: string;
          slug: string;
        };
      }>;
      headerStyle?: {
        id: string;
        transparency: number;
        headerSize: string;
        menuAlignment: string;
        menuButtonStyle: string;
        mobileMenuStyle: string;
        mobileMenuPosition: string;
        transparentHeader: boolean;
        borderBottom: boolean;
        advancedOptions?: Record<string, unknown>;
      };
    }>>(cacheKey);
    
    if (cachedMenus) {
      return cachedMenus;
    }
    
    try {
      const query = `
        query GetMenus {
          menus {
            id
            name
            location
            items {
              id
              title
              url
              pageId
              target
              icon
              order
              children {
                id
                title
                url
                pageId
                target
                icon
                order
              }
              page {
                id
                title
                slug
              }
            }
            headerStyle {
              id
              transparency
              headerSize
              menuAlignment
              menuButtonStyle
              mobileMenuStyle
              mobileMenuPosition
              transparentHeader
              borderBottom
              advancedOptions
            }
          }
        }
      `;

      const result = await gqlRequest<{ menus: Array<{
        id: string;
        name: string;
        location: string | null;
        items: Array<{
          id: string;
          title: string;
          url: string | null;
          pageId: string | null;
          target: string | null;
          icon: string | null;
          order: number;
          children?: Array<{
            id: string;
            title: string;
            url: string | null;
            pageId: string | null;
            target: string | null;
            icon: string | null;
            order: number;
          }>;
          page?: {
            id: string;
            title: string;
            slug: string;
          };
        }>;
        headerStyle?: {
          id: string;
          transparency: number;
          headerSize: string;
          menuAlignment: string;
          menuButtonStyle: string;
          mobileMenuStyle: string;
          mobileMenuPosition: string;
          transparentHeader: boolean;
          borderBottom: boolean;
          advancedOptions?: Record<string, unknown>;
        };
      }> }>(query);
      
      if (!result || !result.menus) {
        return [];
      }
      
      // Cache the menus
      setCachedResponse(cacheKey, result.menus);
      
      return result.menus;
    } catch (error) {
      console.error('Error in getMenus GraphQL query:', error);
      return [];
    }
  },

  // Update header style for a menu
  updateHeaderStyle: async (menuId: string, styleInput: HeaderStyleInput): Promise<{
    success: boolean;
    message: string;
    headerStyle?: {
      id: string;
      menuId: string;
      transparency: number;
      headerSize: string;
      menuAlignment: string;
      menuButtonStyle: string;
      mobileMenuStyle: string;
      mobileMenuPosition: string;
      transparentHeader: boolean;
      borderBottom: boolean;
      advancedOptions?: Record<string, unknown>;
    };
  }> => {
    try {
      const mutation = `
        mutation UpdateHeaderStyle($menuId: ID!, $input: HeaderStyleInput!) {
          updateHeaderStyle(menuId: $menuId, input: $input) {
            id
            menuId
            transparency
            headerSize
            menuAlignment
            menuButtonStyle
            mobileMenuStyle
            mobileMenuPosition
            transparentHeader
            borderBottom
            advancedOptions
            createdAt
            updatedAt
          }
        }
      `;

      const variables = {
        menuId,
        input: styleInput
      };

      const result = await gqlRequest<{
        updateHeaderStyle: {
          id: string;
          menuId: string;
          transparency: number;
          headerSize: string;
          menuAlignment: string;
          menuButtonStyle: string;
          mobileMenuStyle: string;
          mobileMenuPosition: string;
          transparentHeader: boolean;
          borderBottom: boolean;
          advancedOptions?: Record<string, unknown>;
          createdAt: string;
          updatedAt: string;
        }
      }>(mutation, variables);

      if (!result || !result.updateHeaderStyle) {
        return {
          success: false,
          message: 'Failed to update header style'
        };
      }

      return {
        success: true,
        message: 'Header style updated successfully',
        headerStyle: result.updateHeaderStyle
      };
    } catch (error) {
      console.error('Error updating header style:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error updating header style'
      };
    }
  },
  
  // Get menu with its header style
  getMenuWithHeaderStyle: async (menuId: string) => {
    try {
      const query = `
        query GetMenu($id: ID!) {
          menu(id: $id) {
            id
            name
            location
            items {
              id
              title
              url
              pageId
              target
              icon
              order
            }
            headerStyle {
              id
              transparency
              headerSize
              menuAlignment
              menuButtonStyle
              mobileMenuStyle
              mobileMenuPosition
              transparentHeader
              borderBottom
              advancedOptions
            }
          }
        }
      `;

      const variables = { id: menuId };
      const result = await gqlRequest<{
        menu: {
          id: string;
          name: string;
          location: string | null;
          items: Array<{
            id: string;
            title: string;
            url: string | null;
            pageId: string | null;
            target: string | null;
            icon: string | null;
            order: number;
          }>;
          headerStyle: {
            id: string;
            transparency: number;
            headerSize: string;
            menuAlignment: string;
            menuButtonStyle: string;
            mobileMenuStyle: string;
            mobileMenuPosition: string;
            transparentHeader: boolean;
            borderBottom: boolean;
            advancedOptions?: Record<string, unknown>;
          } | null;
        } | null;
      }>(query, variables);

      return result?.menu || null;
    } catch (error) {
      console.error('Error getting menu with header style:', error);
      return null;
    }
  },

  // Añadir referencia a la función getForms
  getForms,

  // Asociar una sección a una página
  associateSectionToPage: async (pageId: string, sectionId: string, order: number): Promise<{
    success: boolean;
    message: string;
    page: PageData | null;
  }> => {
    try {
      const mutation = `
        mutation AssociateSectionToPage($pageId: ID!, $sectionId: ID!, $order: Int!) {
          associateSectionToPage(pageId: $pageId, sectionId: $sectionId, order: $order) {
            success
            message
            page {
              id
              title
              sections {
                id
                sectionId
                name
                order
              }
            }
          }
        }
      `;

      const variables = { pageId, sectionId, order };
      const result = await gqlRequest<{ 
        associateSectionToPage: {
          success: boolean;
          message: string;
          page: PageData | null;
        } 
      }>(mutation, variables);

      return result.associateSectionToPage;
    } catch (error) {
      console.error('Error associating section to page:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Error desconocido',
        page: null
      };
    }
  },

  // Desasociar una sección de una página
  dissociateSectionFromPage: async (pageId: string, sectionId: string): Promise<{
    success: boolean;
    message: string;
    page: PageData | null;
  }> => {
    try {
      const mutation = `
        mutation DissociateSectionFromPage($pageId: ID!, $sectionId: ID!) {
          dissociateSectionFromPage(pageId: $pageId, sectionId: $sectionId) {
            success
            message
            page {
              id
              title
              sections {
                id
                sectionId
                name
                order
              }
            }
          }
        }
      `;

      const variables = { pageId, sectionId };
      const result = await gqlRequest<{ 
        dissociateSectionFromPage: {
          success: boolean;
          message: string;
          page: PageData | null;
        } 
      }>(mutation, variables);

      return result.dissociateSectionFromPage;
    } catch (error) {
      console.error('Error dissociating section from page:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Error desconocido',
        page: null
      };
    }
  },
};

// Form Builder API functions
async function getForms(): Promise<FormBase[]> {
  const query = `
    query GetForms {
      forms {
        id
        title
        description
        slug
        isMultiStep
        isActive
        successMessage
        redirectUrl
        submitButtonText
        submitButtonStyle
        layout
        styling
        pageId
        createdById
        updatedById
        createdAt
        updatedAt
        fields {
          id
        }
        steps {
          id
          fields {
            id
          }
        }
      }
    }
  `;

  try {
    const response = await gqlRequest<{ forms: FormBase[] }>(query);
    
    // Calcular el número total de campos para cada formulario
    const formsWithFieldCount = response.forms?.map(form => {
      // Campos directos del formulario
      const directFields = form.fields || [];
      
      // Campos en los pasos (si es un formulario de múltiples pasos)
      const stepFields = form.steps?.flatMap(step => step.fields || []) || [];
      
      // Asegurar que fields sea al menos un array vacío
      return {
        ...form,
        fields: directFields,
        totalFieldCount: directFields.length + stepFields.length
      };
    }) || [];
    
    return formsWithFieldCount;
  } catch (error) {
    console.error('Error fetching forms:', error);
    return [];
  }
}

async function getFormById(id: string): Promise<FormBase | null> {
  const query = `
    query GetForm($id: ID!) {
      form(id: $id) {
        id
        title
        description
        slug
        isMultiStep
        isActive
        successMessage
        redirectUrl
        submitButtonText
        submitButtonStyle
        layout
        styling
        pageId
        createdById
        updatedById
        createdAt
        updatedAt
        fields {
          id
          label
          name
          type
          placeholder
          defaultValue
          helpText
          isRequired
          order
          options
          validationRules
          styling
          width
          createdAt
          updatedAt
        }
        steps {
          id
          title
          description
          order
          isVisible
          validationRules
          createdAt
          updatedAt
          fields {
            id
            label
            name
            type
            placeholder
            defaultValue
            helpText
            isRequired
            order
            options
            validationRules
            styling
            width
            createdAt
            updatedAt
          }
        }
      }
    }
  `;

  const variables = { id };

  try {
    const response = await gqlRequest<{ form: FormBase }>(query, variables);
    return response.form || null;
  } catch (error) {
    console.error('Error fetching form by ID:', error);
    return null;
  }
}

async function getFormBySlug(slug: string): Promise<FormBase | null> {
  const query = `
    query GetFormBySlug($slug: String!) {
      formBySlug(slug: $slug) {
        id
        title
        description
        slug
        isMultiStep
        isActive
        successMessage
        redirectUrl
        submitButtonText
        submitButtonStyle
        layout
        styling
        pageId
        createdById
        updatedById
        createdAt
        updatedAt
        fields {
          id
          label
          name
          type
          placeholder
          defaultValue
          helpText
          isRequired
          order
          options
          validationRules
          styling
          width
          createdAt
          updatedAt
        }
        steps {
          id
          title
          description
          order
          isVisible
          validationRules
          createdAt
          updatedAt
          fields {
            id
            label
            name
            type
            placeholder
            defaultValue
            helpText
            isRequired
            order
            options
            validationRules
            styling
            width
            createdAt
            updatedAt
          }
        }
      }
    }
  `;

  const variables = { slug };

  try {
    const response = await gqlRequest<{ formBySlug: FormBase }>(query, variables);
    return response.formBySlug || null;
  } catch (error) {
    console.error('Error fetching form by slug:', error);
    return null;
  }
}

async function getFormSteps(formId: string): Promise<FormStepBase[]> {
  const query = `
    query GetFormSteps($formId: ID!) {
      formSteps(formId: $formId) {
        id
        formId
        title
        description
        order
        isVisible
        validationRules
        createdAt
        updatedAt
        fields {
          id
          label
          name
          type
          placeholder
          defaultValue
          helpText
          isRequired
          order
          options
          validationRules
          styling
          width
          createdAt
          updatedAt
        }
      }
    }
  `;

  const variables = { formId };

  try {
    const response = await gqlRequest<{ formSteps: FormStepBase[] }>(query, variables);
    return response.formSteps || [];
  } catch (error) {
    console.error('Error fetching form steps:', error);
    return [];
  }
}

async function getFormFields(formId: string, stepId?: string): Promise<FormFieldBase[]> {
  const query = `
    query GetFormFields($formId: ID!, $stepId: ID) {
      formFields(formId: $formId, stepId: $stepId) {
        id
        formId
        stepId
        label
        name
        type
        placeholder
        defaultValue
        helpText
        isRequired
        order
        options
        validationRules
        styling
        width
        createdAt
        updatedAt
      }
    }
  `;

  const variables = { formId, stepId };

  try {
    const response = await gqlRequest<{ formFields: FormFieldBase[] }>(query, variables);
    return response.formFields || [];
  } catch (error) {
    console.error('Error fetching form fields:', error);
    return [];
  }
}

async function getFormSubmissions(formId: string, limit?: number, offset?: number): Promise<FormSubmissionBase[]> {
  const query = `
    query GetFormSubmissions($formId: ID!, $limit: Int, $offset: Int) {
      formSubmissions(formId: $formId, limit: $limit, offset: $offset) {
        id
        formId
        data
        metadata
        status
        createdAt
        updatedAt
      }
    }
  `;

  const variables = { formId, limit, offset };

  try {
    const response = await gqlRequest<{ formSubmissions: FormSubmissionBase[] }>(query, variables);
    return response.formSubmissions || [];
  } catch (error) {
    console.error('Error fetching form submissions:', error);
    return [];
  }
}

async function getFormSubmissionStats(formId: string): Promise<FormSubmissionStats | null> {
  const query = `
    query GetFormSubmissionStats($formId: ID!) {
      formSubmissionStats(formId: $formId)
    }
  `;

  const variables = { formId };

  try {
    const response = await gqlRequest<{ formSubmissionStats: FormSubmissionStats }>(query, variables);
    return response.formSubmissionStats || null;
  } catch (error) {
    console.error('Error fetching form submission stats:', error);
    return null;
  }
}

async function createForm(input: FormInput): Promise<FormResult> {
  const mutation = `
    mutation CreateForm($input: FormInput!) {
      createForm(input: $input) {
        success
        message
        form {
          id
          title
          description
          slug
          isMultiStep
          isActive
          successMessage
          redirectUrl
          submitButtonText
          submitButtonStyle
          layout
          styling
          pageId
          createdById
          updatedById
          createdAt
          updatedAt
        }
      }
    }
  `;

  const variables = { input };

  try {
    const response = await gqlRequest<{ createForm: FormResult }>(mutation, variables);
    return response.createForm || { success: false, message: 'Failed to create form', form: null };
  } catch (error) {
    console.error('Error creating form:', error);
    return { success: false, message: 'Error creating form', form: null };
  }
}

async function updateForm(id: string, input: Partial<FormInput>): Promise<FormResult> {
  const mutation = `
    mutation UpdateForm($id: ID!, $input: UpdateFormInput!) {
      updateForm(id: $id, input: $input) {
        success
        message
        form {
          id
          title
          description
          slug
          isMultiStep
          isActive
          successMessage
          redirectUrl
          submitButtonText
          submitButtonStyle
          layout
          styling
          pageId
          createdById
          updatedById
          createdAt
          updatedAt
        }
      }
    }
  `;

  const variables = { id, input };

  try {
    const response = await gqlRequest<{ updateForm: FormResult }>(mutation, variables);
    return response.updateForm || { success: false, message: 'Failed to update form', form: null };
  } catch (error) {
    console.error('Error updating form:', error);
    return { success: false, message: 'Error updating form', form: null };
  }
}

async function deleteForm(id: string): Promise<FormResult> {
  const mutation = `
    mutation DeleteForm($id: ID!) {
      deleteForm(id: $id) {
        success
        message
      }
    }
  `;

  const variables = { id };

  try {
    const response = await gqlRequest<{ deleteForm: FormResult }>(mutation, variables);
    return response.deleteForm || { success: false, message: 'Failed to delete form', form: null };
  } catch (error) {
    console.error('Error deleting form:', error);
    return { success: false, message: 'Error deleting form', form: null };
  }
}

async function createFormStep(input: FormStepInput): Promise<FormStepResult> {
  const mutation = `
    mutation CreateFormStep($input: FormStepInput!) {
      createFormStep(input: $input) {
        success
        message
        step {
          id
          formId
          title
          description
          order
          isVisible
          validationRules
          createdAt
          updatedAt
        }
      }
    }
  `;

  const variables = { input };

  try {
    const response = await gqlRequest<{ createFormStep: FormStepResult }>(mutation, variables);
    return response.createFormStep || { success: false, message: 'Failed to create form step', step: null };
  } catch (error) {
    console.error('Error creating form step:', error);
    return { success: false, message: 'Error creating form step', step: null };
  }
}

async function createFormField(input: FormFieldInput): Promise<FormFieldResult> {
  const mutation = `
    mutation CreateFormField($input: FormFieldInput!) {
      createFormField(input: $input) {
        success
        message
        field {
          id
          formId
          stepId
          label
          name
          type
          placeholder
          defaultValue
          helpText
          isRequired
          order
          options
          validationRules
          styling
          width
          createdAt
          updatedAt
        }
      }
    }
  `;

  const variables = { input };

  try {
    const response = await gqlRequest<{ createFormField: FormFieldResult }>(mutation, variables);
    return response.createFormField || { success: false, message: 'Failed to create form field', field: null };
  } catch (error) {
    console.error('Error creating form field:', error);
    return { success: false, message: 'Error creating form field', field: null };
  }
}

// Update a form field
async function updateFormField(id: string, input: FormFieldInput): Promise<FormFieldResult> {
  const mutation = `
    mutation UpdateFormField($id: ID!, $input: UpdateFormFieldInput!) {
      updateFormField(id: $id, input: $input) {
        success
        message
        field {
          id
          formId
          stepId
          label
          name
          type
          placeholder
          defaultValue
          helpText
          isRequired
          order
          options
          validationRules
          styling
          width
          createdAt
          updatedAt
        }
      }
    }
  `;

  const variables = { id, input };

  try {
    const response = await gqlRequest<{ updateFormField: FormFieldResult }>(mutation, variables);
    return response.updateFormField || { success: false, message: 'Failed to update form field', field: null };
  } catch (error) {
    console.error('Error updating form field:', error);
    return { success: false, message: 'Error updating form field', field: null };
  }
}

// Delete a form field
async function deleteFormField(id: string): Promise<{success: boolean; message: string}> {
  const mutation = `
    mutation DeleteFormField($id: ID!) {
      deleteFormField(id: $id) {
        success
        message
      }
    }
  `;

  const variables = { id };

  try {
    const response = await gqlRequest<{ deleteFormField: {success: boolean; message: string} }>(mutation, variables);
    return response.deleteFormField || { success: false, message: 'Failed to delete form field' };
  } catch (error) {
    console.error('Error deleting form field:', error);
    return { success: false, message: 'Error deleting form field' };
  }
}

async function submitForm(input: FormSubmissionInput): Promise<FormSubmissionResult> {
  const mutation = `
    mutation SubmitForm($input: FormSubmissionInput!) {
      submitForm(input: $input) {
        success
        message
        submission {
          id
          formId
          data
          metadata
          status
          createdAt
          updatedAt
        }
      }
    }
  `;

  const variables = { input };

  try {
    const response = await gqlRequest<{ submitForm: FormSubmissionResult }>(mutation, variables);
    return response.submitForm || { success: false, message: 'Failed to submit form', submission: null };
  } catch (error) {
    console.error('Error submitting form:', error);
    return { success: false, message: 'Error submitting form', submission: null };
  }
}

// Update field order
async function updateFieldOrder(id: string, newOrder: number): Promise<FormFieldResult> {
  const mutation = `
    mutation UpdateFieldOrder($id: ID!, $order: Int!) {
      updateFormField(id: $id, input: { order: $order }) {
        success
        message
        field {
          id
          formId
          stepId
          label
          name
          type
          order
          isRequired
          createdAt
          updatedAt
        }
      }
    }
  `;

  const variables = { id, order: newOrder };

  try {
    const response = await gqlRequest<{ updateFormField: FormFieldResult }>(mutation, variables);
    return response.updateFormField || { success: false, message: 'Failed to update field order', field: null };
  } catch (error) {
    console.error('Error updating field order:', error);
    return { success: false, message: 'Error updating field order', field: null };
  }
}

// Update multiple field orders at once
async function updateFieldOrders(updates: Array<{ id: string; order: number }>): Promise<{
  success: boolean;
  message: string;
}> {
  const mutation = `
    mutation UpdateFieldOrders($updates: [FieldOrderUpdate!]!) {
      updateFieldOrders(updates: $updates) {
        success
        message
      }
    }
  `;

  const variables = { updates };

  try {
    const response = await gqlRequest<{ 
      updateFieldOrders: {
        success: boolean;
        message: string;
      }
    }>(mutation, variables);
    
    return response.updateFieldOrders || { 
      success: false, 
      message: 'Failed to update field orders' 
    };
  } catch (error) {
    console.error('Error updating field orders:', error);
    return { 
      success: false, 
      message: 'Error updating field orders' 
    };
  }
}

// Create a variable for the exported object
const graphqlClient = {
  // CMS Operations
  ...cmsOperations,
  
  // Form Builder functions
  getForms,
  getFormById,
  getFormBySlug,
  getFormSteps,
  getFormFields,
  getFormSubmissions,
  getFormSubmissionStats,
  createForm,
  updateForm,
  deleteForm,
  createFormStep,
  createFormField,
  updateFormField,
  updateFieldOrder,
  updateFieldOrders,
  deleteFormField,
  submitForm,
};

// Export all functions
export default graphqlClient;