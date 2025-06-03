// packages/tenant-site-template/src/lib/cms.ts
import { GraphQLClient, gql, ClientError } from 'graphql-request'; // Added ClientError for typing

const CMS_GRAPHQL_URL = process.env.NEXT_PUBLIC_CMS_GRAPHQL_URL || '/api/public/graphql';
const TENANT_ID = process.env.NEXT_PUBLIC_TENANT_ID; // Used for X-Tenant-ID header AND for tags

if (!CMS_GRAPHQL_URL) {
  throw new Error('CMS_GRAPHQL_URL is not defined. Please set it in your environment variables.');
}
// No strict error for missing TENANT_ID at build time for local dev flexibility, but crucial for proper tagging.

const headers: Record<string, string> = {};
if (TENANT_ID) {
  headers['X-Tenant-ID'] = TENANT_ID;
} else {
  // This warning is important for diagnosing issues during local dev or incorrect build setups
  console.warn("cms.ts: NEXT_PUBLIC_TENANT_ID is not set. API requests may fail or return incorrect data. Revalidation tags will be generic.");
}

const client = new GraphQLClient(CMS_GRAPHQL_URL, { headers });

// Define a generic type for API responses if needed, or use specific types per function
interface SiteConfig {
  siteName?: string | null; // Allow null for optional fields from GraphQL
  logoUrl?: string | null;
  faviconUrl?: string | null;
  primaryColor?: string | null;
  secondaryColor?: string | null;
  defaultLocale?: string | null;
  supportedLocales?: string[] | null;
}

interface MediaData { // Added MediaData interface
  url: string;
  altText?: string | null;
}

interface ComponentData { // Added ComponentData interface
  id: string;
  type: string;
  data: any;
  order: number;
}

interface SectionData { // Added SectionData interface
  id: string;
  sectionId: string;
  backgroundImage?: string | null;
  backgroundType?: string | null;
  gridDesign?: string | null;
  order: number;
  components: ComponentData[];
}

interface PageData {
  id: string;
  title: string;
  slug: string;
  description?: string | null;
  locale: string;
  featuredImage?: MediaData | null;
  sections: SectionData[];
}

interface MenuItem {
    id: string;
    title: string;
    url?: string | null;
    target?: string | null;
    children?: MenuItem[] | null;
}

interface MenuData {
    name: string;
    items: MenuItem[];
}


export async function getSiteConfig(): Promise<SiteConfig | null> {
  const query = gql`
    query GetSiteConfig {
      siteConfig {
        siteName
        logoUrl
        faviconUrl
        primaryColor
        secondaryColor
        defaultLocale
        supportedLocales
      }
    }
  `;
  try {
    // Ensure TENANT_ID is defined for meaningful tags, or use a general tag if it's truly global and not tenant-specific
    const tagTenantId = TENANT_ID || 'global';
    const data = await client.request<{ siteConfig: SiteConfig }>(
      query,
      {},
      {
        next: { tags: [`siteConfig:${tagTenantId}`] }
      }
    );
    return data.siteConfig;
  } catch (error: any) {
    console.error("Error fetching site config:", error.message);
    if (error instanceof ClientError) {
        console.error("GraphQL Error Details:", JSON.stringify(error.response.errors, null, 2));
    }
    return null; // Return null or a default config object as per application's error handling strategy
  }
}

export async function getPage(slug: string, preview: boolean = false): Promise<PageData | null> {
  const query = gql`
    query GetPage($slug: String!, $preview: Boolean) {
      page(slug: $slug, preview: $preview) {
        id
        title
        slug
        description
        locale
        featuredImage { url altText }
        sections {
          id
          sectionId
          backgroundImage
          backgroundType
          gridDesign
          order
          components { id type data order }
        }
      }
    }
  `;
  const variables = { slug, preview };

  const requestHeaders: Record<string, string> = {};
  if (preview && process.env.NEXT_PUBLIC_PREVIEW_TOKEN) {
    requestHeaders['X-Preview-Token'] = process.env.NEXT_PUBLIC_PREVIEW_TOKEN;
  }

  try {
    // Ensure TENANT_ID is defined for meaningful tags
    const tagTenantId = TENANT_ID || 'unknown_tenant'; // Fallback, but specific tenant ID is better
    const data = await client.request<{ page: PageData }>(
      query,
      variables,
      {
        next: { tags: [`page:${tagTenantId}:${slug}`, `page:${pageId}`] }, // Added pageId tag
        headers: requestHeaders
      }
    );
    return data.page;
  } catch (error: any) {
    console.error(`Error fetching page (slug: ${slug}, tenant: ${TENANT_ID || 'N/A'}):`, error.message);
     if (error instanceof ClientError) {
        console.error("GraphQL Error Details:", JSON.stringify(error.response.errors, null, 2));
    }
    return null;
  }
}

// Helper to get pageId from slug to add to tags in getPage, if needed before fetching the page
// This might be an extra DB call unless pageId is part of the slug or resolvable otherwise.
// For simplicity, if pageId is available on the 'page' object after fetch, use that for tagging if needed.
// The current getPage tags with slug. If pageId is needed for more granular revalidation,
// it should be added to the tags array. For now, pageId is added to the tags in getPage after fetch.
// For getAllPageSlugs, we don't have individual page IDs to tag, so we use a collection tag.
// This is a simplified approach. A more robust one might involve fetching page IDs along with slugs.

let pageId = ''; // This is a placeholder. In a real scenario, you'd get this from the page data.

export async function getAllPageSlugs(): Promise<Array<{ slug: string }>> {
  const query = gql`
    query GetAllPublishedPageSlugs {
      allPublishedPageSlugs # This query must be tenant-scoped by the API (using X-Tenant-ID header)
    }
  `;
  try {
    const tagTenantId = TENANT_ID || 'global'; // Fallback for tag
    const data = await client.request<{ allPublishedPageSlugs: string[] }>(
      query,
      {},
      { next: { tags: [`allPages:${tagTenantId}`, `tenant:${tagTenantId}:pages-collection`] } } // Added pages-collection tag
    );
    return data.allPublishedPageSlugs.map(s => ({ slug: s }));
  } catch (error: any) {
    console.error(`Error fetching all page slugs (tenant: ${TENANT_ID || 'N/A'}):`, error.message);
    if (error instanceof ClientError) {
        console.error("GraphQL Error Details:", JSON.stringify(error.response.errors, null, 2));
    }
    return []; // Return empty array on error to prevent build failures
  }
}

export async function getMenu(location: string): Promise<MenuData | null> {
    const query = gql`
        query GetMenu($location: String!) { # Tenant-scoped by API via X-Tenant-ID
            menu(location: $location) {
                name
                items {
                    id
                    title
                    url
                    target
                    children {
                        id
                        title
                        url
                        target
                        # Deeper nesting can be added here if schema supports it
                    }
                }
            }
        }
    `;
    const variables = { location };
    try {
        const tagTenantId = TENANT_ID || 'unknown_tenant';
        const data = await client.request<{ menu: MenuData }>(
            query,
            variables,
            { next: { tags: [`menu:${tagTenantId}:${location}`] } }
        );
        return data.menu;
    } catch (error: any) {
        console.error(`Error fetching menu (location: ${location}, tenant: ${TENANT_ID || 'N/A'}):`, error.message);
        if (error instanceof ClientError) {
            console.error("GraphQL Error Details:", JSON.stringify(error.response.errors, null, 2));
        }
        return null;
    }
}
