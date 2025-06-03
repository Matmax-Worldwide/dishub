import { GraphQLClient, gql } from 'graphql-request';

// Type definitions
interface SiteConfig {
  siteName: string;
  logoUrl?: string;
  faviconUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  defaultLocale: string;
  supportedLocales: string[];
}

interface Page {
  id: string;
  title: string;
  slug: string;
  description?: string;
  locale: string;
  featuredImage?: {
    url: string;
    altText?: string;
  };
  sections: Array<{
    id: string;
    sectionId: string;
    backgroundImage?: string;
    backgroundType?: string;
    gridDesign?: string;
    order: number;
    components: Array<{
      id: string;
      type: string;
      data: unknown;
      order: number;
    }>;
  }>;
}

interface Menu {
  name: string;
  items: Array<{
    id: string;
    title: string;
    url: string;
    target?: string;
    children?: Array<{
      id: string;
      title: string;
      url: string;
      target?: string;
    }>;
  }>;
}

const CMS_GRAPHQL_URL = process.env.NEXT_PUBLIC_CMS_GRAPHQL_URL || '/api/graphql'; // Fallback for local dev if main app serves it
const TENANT_ID = process.env.NEXT_PUBLIC_TENANT_ID; // This will be set at build time per tenant

if (!CMS_GRAPHQL_URL) {
  throw new Error('CMS_GRAPHQL_URL is not defined. Please set it in your environment variables.');
}
if (!TENANT_ID && process.env.NODE_ENV === 'production') {
  // In development, TENANT_ID might not be set if running template directly
  // In production build, it's crucial
  console.warn('TENANT_ID is not defined. This is required for production builds of tenant sites.');
}

const headers: Record<string, string> = {};
if (TENANT_ID) {
  headers['X-Tenant-ID'] = TENANT_ID;
}
// Note: Preview token header logic will be handled per-request if needed, not globally here.

const client = new GraphQLClient(CMS_GRAPHQL_URL, { headers });

export async function getSiteConfig() {
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
  // For siteConfig, the tenant is resolved by the API from the hostname
  // or X-Tenant-ID if the API is called directly with it.
  // If CMS_GRAPHQL_URL is a full URL to a specific tenant's endpoint, that's another way.
  const data = await client.request<{ siteConfig: SiteConfig }>(query);
  return data.siteConfig;
}

export async function getPage(slug: string, preview: boolean = false) {
  const query = gql`
    query GetPage($slug: String!, $preview: Boolean) {
      page(slug: $slug, preview: $preview) {
        id
        title
        slug
        description
        locale
        featuredImage {
          url
          altText
        }
        sections {
          id
          sectionId
          backgroundImage
          backgroundType
          gridDesign
          order
          components {
            id
            type
            data
            order
          }
        }
      }
    }
  `;
  const variables = { slug, preview };
  // Add preview token header if in preview mode
  // This preview secret mechanism is basic. A more robust solution (e.g. signed JWTs) is recommended for production.
  // The preview token might need to be specific per tenant or globally verifiable by the public API.
  const previewSecret = process.env.PREVIEW_SECRET_TOKEN; // A generic preview secret
  const requestHeaders: Record<string, string> = {};
  if (preview && previewSecret) {
    requestHeaders['X-Preview-Token'] = previewSecret;
  }

  const data = await client.request<{ page: Page }>(query, variables, requestHeaders);
  return data.page;
}

export async function getAllPageSlugs(): Promise<Array<{ slug: string }>> { // Ensure return type matches generateStaticParams
  const query = gql`
    query GetAllPublishedPageSlugs {
      allPublishedPageSlugs
    }
  `;
  try {
    // No variables needed for this specific query if it's correctly tenant-scoped by header
    const data = await client.request<{ allPublishedPageSlugs: string[] }>(query);
    return data.allPublishedPageSlugs.map(slug => ({ slug })); // Match expected structure for generateStaticParams
  } catch (error) {
    console.error("Error fetching all page slugs:", error);
    // Return empty array or re-throw, depending on how build failures should be handled
    return [];
  }
}

export async function getMenu(location: string) {
    const query = gql`
        query GetMenu($location: String!) { # Ensure this query is tenant-scoped by the API
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
                        # Add another level of children if your menu structure requires it and GQL supports it
                        # children {
                        #   id
                        #   title
                        #   url
                        #   target
                        # }
                    }
                }
            }
        }
    `;
    const variables = { location };
    const data = await client.request<{ menu: Menu }>(query, variables);
    return data.menu;
}

// Add more functions as needed, e.g., getPosts, getPostBySlug, etc.
