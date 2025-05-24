import { updateCMSSection } from './cms-update';
import { deletePageWithSections } from './cms-page-delete';

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

import { Blog, Post } from '@/types/blog';

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

    // Check if this is a public operation that doesn't require authentication
    const isPublicOperation = (
      query.includes('getPageBySlug') || 
      query.includes('getSectionComponents') || 
      query.includes('submitForm') || 
      query.includes('getMenus') ||
      query.includes('formBySlug') ||
      query.includes('getFormById') ||
      query.includes('form(id:') ||
      query.includes('forms') ||
      query.includes('formFields') ||
      query.includes('formSteps') ||
      query.includes('formStep') ||
      query.includes('GetForm') ||
      query.includes('FormStep') ||
      query.includes('FormField') ||
      query.includes('menus') ||
      query.includes('getAllCMSPages')
    );

    // Get session token from cookies if available and not a public operation
    const getToken = () => {
      if (!isPublicOperation && typeof document !== 'undefined') {
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
        
        // For public operations, return empty result instead of throwing
        if (isPublicOperation) {
          console.warn(`HTTP error in public operation [${requestId}], returning empty result`);
          return {} as T;
        }
        
        throw new Error(`HTTP error ${response.status}: ${errorText}`);
      }
      
      console.log(`✅ GraphQL request completed [${requestId}]`);
      const responseData = await response.json();
      
      // Check for GraphQL errors
      if (responseData.errors && responseData.errors.length > 0) {
        const errorMessages = responseData.errors.map((e: { message: string }) => e.message).join(', ');
        console.error(`GraphQL errors for [${requestId}]:`, errorMessages);
        
        // For public operations, handle auth errors gracefully
        if (isPublicOperation && (errorMessages.includes('Not authenticated') || errorMessages.includes('Unauthorized'))) {
          console.warn(`Authentication error in public operation [${requestId}], continuing with partial data`);
          // Return partial data if available, or empty object
          return (responseData.data || {}) as T;
        }
        
        // For form operations, don't throw to prevent UI breakage
        if ((query.includes('form') || query.includes('Form')) && 
            (errorMessages.includes('Not authenticated') || errorMessages.includes('Unauthorized'))) {
          console.warn(`Form auth error [${requestId}], returning empty result`);
          return {} as T;
        }
        
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
      
      // For public operations, swallow errors and return empty result
      if (isPublicOperation) {
        console.warn(`Error in public operation [${requestId}], returning empty result:`, error);
        return {} as T;
      }
      
      throw error;
    }
  } catch (error) {
    // Format the error for better debugging
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`GraphQL error [${requestId}]:`, errorMessage);
    
    // Check if this is a query about forms and return empty data instead of throwing
    if (query.toLowerCase().includes('form')) {
      console.warn(`Form query error, returning empty result:`, errorMessage);
      return {} as T;
    }
    
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
  isDefault?: boolean;
  sections?: Array<{
    id: string;
    sectionId: string;
    name?: string;
    order: number;
    // Otra metadata relevante
  }>; // Adaptado a la estructura de CMSSection
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

export interface SectionData {
  id: string;
  title?: string;
  order: number;
  components: CMSComponent[];
  backgroundImage?: string;
  backgroundType?: string;
}

// Generic GraphQL response type
interface GraphQLResponse<T> {
  data?: {
    [key: string]: T;
  };
  errors?: Array<{ message: string }>;
}


// Función de utilidad para validar la pertenencia de secciones
export const validateSectionOwnership = (sectionId: string, pageId: string): boolean => {
  return sectionId.startsWith(`page-${pageId}-`);
};


// Get a page by its slug
async function getPageBySlug(slug: string): Promise<PageData | null> {
  try {
    console.log(`[getPageBySlug] Attempting to fetch page with slug: "${slug}"`);
    
    // Check cache first
    const cacheKey = `page_slug_${slug}`;
    const cachedPage = getCachedResponse<PageData>(cacheKey);
    
    if (cachedPage) {
      console.log(`[getPageBySlug] Found cached page: ${cachedPage.title}`);
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
          isDefault
          createdAt
          updatedAt
          sections {
            id
            sectionId
            name
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
    
    console.log(`[getPageBySlug] Executing GraphQL query with variables:`, variables);
    const result = await gqlRequest<{ 
      getPageBySlug?: PageData; 
      data?: { getPageBySlug: PageData };
      errors?: Array<{ message: string }>
    }>(query, variables);
    
    console.log(`[getPageBySlug] GraphQL result:`, result);
    
    // Check for errors in the response
    if (result.errors && result.errors.length > 0) {
      console.error(`[getPageBySlug] GraphQL errors: ${result.errors.map(e => e.message).join(', ')}`);
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
      console.log(`[getPageBySlug] Found page: ID=${page.id}, Title="${page.title}"`);
      
      // Filtrar las secciones con sectionId null para evitar errores GraphQL
      if (page.sections && Array.isArray(page.sections)) {
        page.sections = page.sections.filter(section => 
          section && typeof section === 'object' && 'sectionId' in section && section.sectionId !== null
        );
      }
      
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
    
    console.log(`[getPageBySlug] No page found with slug: "${slug}"`);
    return null;
  } catch (error) {
    console.error(`[getPageBySlug] Error retrieving page with slug "${slug}":`, error);
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
  isDefault?: boolean;
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
  sectionIds?: string[]; // This is used by client code but converted to sections
  sections?: string[]; // This matches the GraphQL schema
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

    // Convert sectionIds to sections format if present
    const inputData = { ...input };
    
    // If sectionIds is provided but sections isn't, move the values
    if (inputData.sectionIds && !inputData.sections) {
      inputData.sections = inputData.sectionIds;
      delete inputData.sectionIds;
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
            isDefault
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

    console.log('Updating page with data:', { id, input: inputData });
    const variables = { id, input: inputData };
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
      // Make sure to filter out sections with null sectionId
      if (page.sections && Array.isArray(page.sections)) {
        page.sections = page.sections.filter(section => 
          section && typeof section === 'object' && 'sectionId' in section && section.sectionId !== null
        );
      }
      
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
        title: 'title' in section ? (section.title as string) : `Section ${section.order || 0}`,
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

// Update the component edit function to handle background properties
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
    console.log('Edit data:', editedData);
    
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
    const currentComponent = updatedComponents[componentIndex];
    
    // Merge the new data with existing data, preserving all properties
    const mergedData = {
      ...currentComponent.data,
      ...editedData
    };
    
    // Special handling for background properties to ensure they persist
    if (editedData.backgroundImage !== undefined) {
      mergedData.backgroundImage = editedData.backgroundImage;
    }
    if (editedData.backgroundType !== undefined) {
      mergedData.backgroundType = editedData.backgroundType;
    }
    
    updatedComponents[componentIndex] = {
      ...currentComponent,
      data: mergedData
    };
    
    console.log(`Saving updated component with merged data:`, {
      id: updatedComponents[componentIndex].id,
      type: updatedComponents[componentIndex].type,
      dataKeys: Object.keys(updatedComponents[componentIndex].data || {}),
      backgroundImage: mergedData.backgroundImage,
      backgroundType: mergedData.backgroundType
    });
    
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

export interface FooterStyleInput {
  transparency?: number;
  columnLayout?: 'stacked' | 'grid' | 'flex';
  socialAlignment?: 'left' | 'center' | 'right';
  borderTop?: boolean;
  alignment?: 'left' | 'center' | 'right';
  padding?: 'small' | 'medium' | 'large';
  width?: 'full' | 'container' | 'narrow';
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
              sectionId
              name
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
        
        // Filtrar las secciones con sectionId null para evitar errores GraphQL
        const pagesWithValidSections = result.getAllCMSPages.map(page => {
          if (page.sections && Array.isArray(page.sections)) {
            // Asegurar que todas las secciones tengan sectionId válido
            page.sections = page.sections.filter(section => 
              section && typeof section === 'object' && 'sectionId' in section && section.sectionId !== null
            );
          }
          return page;
        });
        
        return pagesWithValidSections;
      } catch (error) {
        console.error('Error en la consulta GraphQL getAllCMSPages:', error);
        return [];
      }
    } catch (error) {
      console.error(`Error general en getAllPages:`, error);
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

  // Create a new CMS page with an automatic section
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
    
    console.log(`🔍 [${requestId}] GraphQL CLIENT - createPage - Starting request with auto-section`);
    
    try {
      // Step 1: Create the page first
      const pageQuery = `
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
      
      const pageVariables = {
        input: pageInput
      };
      
      const pageResult = await gqlRequest<{
        createPage: {
          success: boolean;
          message: string;
          page: {
            id: string;
            title: string;
            slug: string;
          } | null;
        }
      }>(pageQuery, pageVariables);
      
      console.log(`✅ [${requestId}] GraphQL CLIENT - createPage - Page created:`, pageResult);
      
      if (!pageResult || !pageResult.createPage || !pageResult.createPage.success || !pageResult.createPage.page) {
        console.error(`❌ [${requestId}] GraphQL CLIENT - createPage - Error: Failed to create page`);
        return { 
          success: false, 
          message: pageResult?.createPage?.message || 'Failed to create page', 
          page: null 
        };
      }
      
      const createdPage = pageResult.createPage.page;
      
      // Step 2: Create a default section for the page
      console.log(`🔧 [${requestId}] Creating default section for page ${createdPage.id}`);
      
      // Generate section ID based on page
      const generatePageSectionId = (pageId: string, sectionName: string): string => {
        const cleanName = sectionName
          .toLowerCase()
          .replace(/\s+/g, '-')
          .replace(/[^a-z0-9-]/g, '');
        return `${pageId.substring(0, 8)}-${cleanName}-${Date.now().toString(36)}`;
      };
      
      const defaultSectionName = 'Contenido Principal';
      const sectionIdentifier = generatePageSectionId(createdPage.id, defaultSectionName);
      
      // Create the CMS section
      const sectionResult = await cmsOperations.createCMSSection({
        sectionId: sectionIdentifier,
        name: defaultSectionName,
        description: `Sección principal para la página "${createdPage.title}"`
      });
      
      console.log(`🔧 [${requestId}] Section creation result:`, sectionResult);
      
      if (sectionResult.success && sectionResult.section) {
        // Step 3: Associate the section with the page
        console.log(`🔗 [${requestId}] Associating section ${sectionResult.section.id} to page ${createdPage.id}`);
        
        const associateResult = await cmsOperations.associateSectionToPage(
          createdPage.id,
          sectionResult.section.id,
          0 // First section, order 0
        );
        
        console.log(`🔗 [${requestId}] Association result:`, associateResult);
        
        if (associateResult.success) {
          console.log(`✅ [${requestId}] Page and section created successfully`);
          return {
            success: true,
            message: `Página "${createdPage.title}" creada con sección inicial`,
            page: createdPage
          };
        } else {
          console.warn(`⚠️ [${requestId}] Page created but section association failed: ${associateResult.message}`);
          return {
            success: true,
            message: `Página creada. ${associateResult.message || 'La sección se creará automáticamente al editar.'}`,
            page: createdPage
          };
        }
      } else {
        console.warn(`⚠️ [${requestId}] Page created but section creation failed: ${sectionResult.message}`);
        return {
          success: true,
          message: `Página creada. ${sectionResult.message || 'La sección se creará automáticamente al editar.'}`,
          page: createdPage
        };
      }
      
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
    console.log(`Eliminando página con ID: ${id} y sus secciones asociadas`);
    return deletePageWithSections(id);
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
              sectionId
              name
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
        
        // Filtrar las secciones con sectionId null para evitar errores GraphQL
        const pagesWithValidSections = result.getPagesUsingSectionId.map(page => {
          if (page.sections && Array.isArray(page.sections)) {
            // Asegurar que todas las secciones tengan sectionId válido
            page.sections = page.sections.filter(section => 
              section && typeof section === 'object' && 'sectionId' in section && section.sectionId !== null
            );
          }
          return page;
        });
        
        return pagesWithValidSections;
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
    section: { id: string; sectionId: string; name: string; order?: number } | null;
  }> => {
    try {
      if (!input.sectionId || !input.name) {
        console.error('Missing required fields for createCMSSection', input);
        return {
          success: false,
          message: 'sectionId and name are required',
          section: null
        };
      }

      console.log('Starting createCMSSection mutation with:', JSON.stringify(input));
      
      const mutation = `
        mutation CreateCMSSection($input: CreateCMSSectionInput!) {
          createCMSSection(input: $input) {
            success
            message
            section {
              id
              sectionId
              name
              order
            }
          }
        }
      `;
      
      // Use a longer timeout for section creation - increase from 15s to 30s
      const result = await gqlRequest<{ 
        createCMSSection?: { 
          success: boolean; 
          message: string; 
          section: { id: string; sectionId: string; name: string; order?: number } | null;
        }
      }>(mutation, { input }, 30000);
      
      console.log('createCMSSection raw result:', JSON.stringify(result));
      
      if (!result) {
        console.error('No result from GraphQL request in createCMSSection');
        return {
          success: false,
          message: 'No result received from server',
          section: null
        };
      }
      
      if (!result.createCMSSection) {
        console.error('Missing createCMSSection in result:', JSON.stringify(result));
        return {
          success: false,
          message: 'Invalid response format: missing createCMSSection field',
          section: null
        };
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



  updateComponentTitle,
  updateSectionName,
  
  // Update section background
  updateSectionBackground: async (sectionId: string, backgroundImage: string, backgroundType: 'image' | 'gradient') => {
    try {
      // Use the updateCMSSection function from cms-update.ts
      const result = await updateCMSSection(sectionId, { backgroundImage, backgroundType });
      
      return {
        success: result.success,
        message: result.message,
        lastUpdated: result.lastUpdated
      };
    } catch (error) {
      console.error('Error updating section background:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error updating section background'
      };
    }
  },
  
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
      footerStyle?: {
        id: string;
        transparency: number;
        columnLayout: string;
        socialAlignment: string;
        borderTop: boolean;
        alignment: string;
        padding: string;
        width: string;
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
            footerStyle {
              id
              transparency
              columnLayout
              socialAlignment
              borderTop
              alignment
              padding
              width
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
        footerStyle?: {
          id: string;
          transparency: number;
          columnLayout: string;
          socialAlignment: string;
          borderTop: boolean;
          alignment: string;
          padding: string;
          width: string;
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
      if (!pageId || !sectionId) {
        console.error('Missing required parameters in associateSectionToPage', { pageId, sectionId });
        return {
          success: false,
          message: 'Los IDs de la página y la sección son requeridos',
          page: null
        };
      }

      console.log(`Asociando sección ${sectionId} a página ${pageId} con orden ${order}`);
      
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
      
      // Usar un timeout más largo para esta operación
      const result = await gqlRequest<{ 
        associateSectionToPage?: {
          success: boolean;
          message: string;
          page: PageData | null;
        } 
      }>(mutation, variables, 30000); // Increased timeout to 30 seconds

      console.log('Respuesta de associateSectionToPage:', JSON.stringify(result, null, 2));
      
      if (!result) {
        console.error('No se recibió respuesta del servidor');
        return {
          success: false,
          message: 'No se recibió respuesta del servidor al asociar la sección a la página',
          page: null
        };
      }
      
      if (!result.associateSectionToPage) {
        console.error('Respuesta sin el campo associateSectionToPage:', result);
        return {
          success: false,
          message: 'Respuesta no válida del servidor: campo associateSectionToPage no encontrado',
          page: null
        };
      }

      return result.associateSectionToPage;
    } catch (error) {
      console.error('Error associating section to page:', error);
      return {
        success: false,
        message: error instanceof Error 
          ? `Error al asociar sección a página: ${error.message}` 
          : 'Error desconocido al asociar sección a página',
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

  // Header and footer style update methods are defined earlier in the cmsOperations object

  // Update Footer Style
  async updateFooterStyle(menuId: string, styleData: FooterStyleInput): Promise<{
    success: boolean;
    message: string;
    footerStyle?: Record<string, unknown>;
  }> {
    try {
      const query = `
        mutation UpdateFooterStyle($menuId: ID!, $input: FooterStyleInput!) {
          updateFooterStyle(menuId: $menuId, input: $input) {
            success
            message
            footerStyle {
              id
              menuId
              transparency
              columnLayout
              socialAlignment
              borderTop
              alignment
              padding
              width
              advancedOptions
              createdAt
              updatedAt
            }
          }
        }
      `;

      const variables = {
        menuId,
        input: styleData
      };

      const response = await gqlRequest<{
        updateFooterStyle: {
          success: boolean;
          message: string;
          footerStyle: Record<string, unknown> | null;
        };
      }>(query, variables);

      return {
        success: response.updateFooterStyle.success,
        message: response.updateFooterStyle.message,
        footerStyle: response.updateFooterStyle.footerStyle || undefined
      };
    } catch (error) {
      console.error('Error updating footer style:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  },

  // Get menu with Footer style
  async getMenuWithFooterStyle(menuId: string): Promise<{
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
      parentId: string | null;
      children?: Array<{
        id: string;
        title: string;
        url: string | null;
        pageId: string | null;
        target: string | null;
        icon: string | null;
        order: number;
      }>;
      page?: { slug: string } | null;
    }>;
    footerStyle?: {
      transparency?: number;
      columnLayout?: string;
      socialAlignment?: string;
      borderTop?: boolean;
      alignment?: string;
      padding?: string;
      width?: string;
      advancedOptions?: Record<string, unknown>;
    } | null;
  } | null> {
    try {
      const query = `
        query GetMenuWithFooterStyle($id: ID!) {
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
              parentId
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
                slug
              }
            }
            footerStyle {
              id
              transparency
              columnLayout
              socialAlignment
              borderTop
              alignment
              padding
              width
              advancedOptions
            }
          }
        }
      `;

      const variables = { id: menuId };
      // Use a longer timeout for this query
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
            parentId: string | null;
            children?: Array<{
              id: string;
              title: string;
              url: string | null;
              pageId: string | null;
              target: string | null;
              icon: string | null;
              order: number;
            }>;
            page?: { slug: string } | null;
          }>;
          footerStyle: {
            id: string;
            transparency?: number;
            columnLayout?: string;
            socialAlignment?: string;
            borderTop?: boolean;
            alignment?: string;
            padding?: string;
            width?: string;
            advancedOptions?: Record<string, unknown>;
          } | null;
        } | null;
      }>(query, variables, 20000); // Increase timeout to 20 seconds

      return result?.menu || null;
    } catch (error) {
      console.error('Error fetching menu with footer style:', error);
      return null;
    }
  },

  // Expose the clearCache function
  clearCache,

  // Get the default page for a locale
  getDefaultPage,
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
  try {
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
      console.warn('Error fetching form by ID, creating fallback:', error);
      // Return a minimal fallback form to prevent UI breakage
      return {
        id,
        title: 'Form Unavailable',
        description: 'This form could not be loaded.',
        slug: 'unavailable-form',
        isMultiStep: false,
        isActive: true,
        fields: [],
        steps: [],
        submitButtonText: 'Submit',
        createdById: 'system',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      } as FormBase;
    }
  } catch (error) {
    console.error('Error in getFormById:', error);
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

  // Blog operations
  async getBlogs() {
    const query = `
      query GetBlogs {
        blogs {
          id
          title
          description
          slug
          isActive
          createdAt
          updatedAt
        }
      }
    `;

    try {
      const response = await gqlRequest<{ blogs: Blog[] }>(query);
      return response.blogs;
    } catch (error) {
      console.error('Error fetching blogs:', error);
      return [];
    }
  },

  async createBlog(input: {
    title: string;
    description?: string | null;
    slug: string;
    isActive: boolean;
  }) {
    const query = `
      mutation CreateBlog($input: BlogInput!) {
        createBlog(input: $input) {
          success
          message
          blog {
            id
            title
            description
            slug
            isActive
            createdAt
            updatedAt
          }
        }
      }
    `;

    try {
      const response = await gqlRequest<{
        createBlog: {
          success: boolean;
          message: string;
          blog: Blog | null;
        };
      }>(query, { input });
      return response.createBlog;
    } catch (error) {
      console.error('Error creating blog:', error);
      return {
        success: false,
        message: 'An error occurred while creating the blog',
        blog: null
      };
    }
  },

  async deleteBlog(id: string) {
    const query = `
      mutation DeleteBlog($id: ID!) {
        deleteBlog(id: $id) {
          success
          message
        }
      }
    `;
    const response = await gqlRequest<{ deleteBlog: { success: boolean; message: string } }>(query, { id });
    return response.deleteBlog;
  },

  async updateBlog(id: string, input: {
    title?: string;
    description?: string | null;
    slug?: string;
    isActive?: boolean;
  }) {
    try {
      // Try using GraphQL first
      const query = `
        mutation UpdateBlog($id: ID!, $input: BlogInput!) {
          updateBlog(id: $id, input: $input) {
            success
            message
            blog {
              id
              title
              description
              slug
              isActive
              createdAt
              updatedAt
            }
          }
        }
      `;
      
      const response = await gqlRequest<{
        updateBlog: {
          success: boolean;
          message: string;
          blog: Blog | null;
        };
      }>(query, { id, input });
      
      return response.updateBlog;
    } catch (error) {
      console.error('GraphQL updateBlog error:', error);
      
      // Fallback to REST API
      try {
        const response = await fetch(`/api/blogs/${id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(input),
        });
        
        const result = await response.json();
        return {
          success: result.success,
          message: result.message,
          blog: result.blog
        };
      } catch (fallbackError) {
        console.error('REST fallback error:', fallbackError);
        return {
          success: false,
          message: 'Failed to update blog',
          blog: null
        };
      }
    }
  },

  // Post operations
  async createPost(input: {
    title: string;
    slug: string;
    content: string;
    excerpt?: string;
    featuredImage?: string;
    status: string;
    blogId: string;
    authorId: string;
    publishedAt?: string | null;
    metaTitle?: string;
    metaDescription?: string;
    tags?: string[];
    categories?: string[];
  }) {
    const mutation = `
      mutation CreatePost($input: CreatePostInput!) {
        createPost(input: $input) {
          success
          message
          post {
            id
            title
            slug
            content
            excerpt
            featuredImage
            status
            blogId
            authorId
            publishedAt
            metaTitle
            metaDescription
            tags
            categories
            createdAt
            updatedAt
          }
        }
      }
    `;
    const response = await gqlRequest<{ createPost: { success: boolean; message: string; post: Post | null } }>(mutation, { input });
    return response.createPost;
  },

  async getPosts(filter?: {
    blogId?: string;
    status?: string;
    authorId?: string;
    tags?: string[];
    categories?: string[];
    search?: string;
    limit?: number;
    offset?: number;
  }) {
    const query = `
      query GetPosts($filter: PostFilter) {
        posts(filter: $filter) {
          id
          title
          slug
          content
          excerpt
          featuredImage
          status
          blogId
          authorId
          publishedAt
          metaTitle
          metaDescription
          tags
          categories
          readTime
          createdAt
          updatedAt
          author {
            id
            firstName
            lastName
            email
            profileImageUrl
          }
          blog {
            id
            title
            slug
          }
        }
      }
    `;
    const response = await gqlRequest<{ posts: Post[] }>(query, { filter });
    return response.posts || [];
  },

  async getPostBySlug(slug: string) {
    const query = `
      query GetPostBySlug($slug: String!) {
        postBySlug(slug: $slug) {
          id
          title
          slug
          content
          excerpt
          featuredImage
          status
          blogId
          authorId
          publishedAt
          metaTitle
          metaDescription
          tags
          categories
          readTime
          createdAt
          updatedAt
          author {
            id
            firstName
            lastName
            email
            profileImageUrl
          }
          blog {
            id
            title
            slug
          }
        }
      }
    `;
    const response = await gqlRequest<{ postBySlug: Post | null }>(query, { slug });
    return response.postBySlug;
  },

  async updatePost(id: string, input: {
    title?: string;
    slug?: string;
    content?: string;
    excerpt?: string;
    featuredImage?: string;
    status?: string;
    publishedAt?: string | null;
    metaTitle?: string;
    metaDescription?: string;
    tags?: string[];
    categories?: string[];
  }) {
    const mutation = `
      mutation UpdatePost($id: ID!, $input: UpdatePostInput!) {
        updatePost(id: $id, input: $input) {
          success
          message
          post {
            id
            title
            slug
            status
            updatedAt
          }
        }
      }
    `;
    const response = await gqlRequest<{ updatePost: { success: boolean; message: string; post: Post | null } }>(mutation, { id, input });
    return response.updatePost;
  },

  async deletePost(id: string) {
    const mutation = `
      mutation DeletePost($id: ID!) {
        deletePost(id: $id) {
          success
          message
        }
      }
    `;
    const response = await gqlRequest<{ deletePost: { success: boolean; message: string } }>(mutation, { id });
    return response.deletePost;
  },
};

// Export all functions
export default graphqlClient;

// Get the default page for a locale
async function getDefaultPage(locale: string = 'en'): Promise<PageData | null> {
  try {
    console.log(`[getDefaultPage] Attempting to fetch default page for locale: "${locale}"`);
    
    // Check cache first
    const cacheKey = `default_page_${locale}`;
    const cachedPage = getCachedResponse<PageData>(cacheKey);
    
    if (cachedPage) {
      console.log(`[getDefaultPage] Found cached default page: ${cachedPage.title}`);
      return cachedPage;
    }
    
    const query = `
      query GetDefaultPage($locale: String!) {
        getDefaultPage(locale: $locale) {
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
          isDefault
          createdAt
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
    `;

    const variables = { locale };
    
    console.log(`[getDefaultPage] Executing GraphQL query with variables:`, variables);
    const result = await gqlRequest<{ 
      getDefaultPage?: PageData; 
      data?: { getDefaultPage: PageData };
      errors?: Array<{ message: string }>
    }>(query, variables);
    
    console.log(`[getDefaultPage] GraphQL result:`, result);
    
    // Check for errors in the response
    if (result.errors && result.errors.length > 0) {
      console.error(`[getDefaultPage] GraphQL errors: ${result.errors.map(e => e.message).join(', ')}`);
      return null;
    }
    
    // Try to extract page data from different possible response structures
    let page: PageData | null = null;
    
    if (result.getDefaultPage) {
      page = result.getDefaultPage;
    } else if (result.data?.getDefaultPage) {
      page = result.data.getDefaultPage;
    } else {
      console.log(`[getDefaultPage] No default page found for locale "${locale}"`);
      return null;
    }
    
    if (page) {
      // Cache the result for future requests
      setCachedResponse(cacheKey, page);
      console.log(`[getDefaultPage] Found and cached default page: ${page.title}`);
    }
    
    return page;
  } catch (error) {
    console.error('[getDefaultPage] Error fetching default page:', error);
    return null;
  }
}