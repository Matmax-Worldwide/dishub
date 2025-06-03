// packages/tenant-site-template/src/lib/cms.ts
import { GraphQLClient, gql } from 'graphql-request';

const CMS_GRAPHQL_URL = process.env.NEXT_PUBLIC_CMS_GRAPHQL_URL || '/api/public/graphql'; // Fallback for local dev if main app serves it
const TENANT_ID = process.env.NEXT_PUBLIC_TENANT_ID; // This will be set at build time per tenant

if (!CMS_GRAPHQL_URL) {
  throw new Error('CMS_GRAPHQL_URL is not defined. Please set it in your environment variables.');
}
if (!TENANT_ID && process.env.NODE_ENV === 'production') {
  // In development, TENANT_ID might not be set if running template directly
  // In production build, it's crucial
  console.warn('TENANT_ID is not defined. This is required for production builds of tenant sites.');
}

const client = new GraphQLClient(CMS_GRAPHQL_URL, {
  // Headers can be added here if needed, e.g., for preview tokens
  // For public queries, X-Tenant-ID is usually resolved by the API via domain/subdomain.
  // If running the template directly and need to specify tenant for API, this header might be needed.
  // However, the public API should ideally resolve tenant from hostname.
  // headers: {
  //   ...(TENANT_ID ? { 'X-Tenant-ID': TENANT_ID } : {}),
  // }
});

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
  const data = await client.request<{ siteConfig: any }>(query);
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
  const headers = preview && previewSecret
    ? { 'X-Preview-Token': previewSecret }
    : {};

  const data = await client.request<{ page: any }>(query, variables, headers);
  return data.page;
}

export async function getAllPageSlugs() {
  // This query needs to be implemented in the public GraphQL API
  // For now, it's a placeholder.
  // It should fetch all published page slugs for the current tenant.
  // Example (conceptual, API needs to support this):

  // const query = gql`
  //   query GetAllPageSlugsForTenant { // Ensure this query is tenant-scoped by the API
  //     allPublishedPages { # This query needs to exist on the public API
  //       slug
  //     }
  //   }
  // `;
  // const data = await client.request<{ allPublishedPages: Array<{ slug: string }> }>(query);
  // return data.allPublishedPages.map(page => ({ slug: page.slug }));

  console.warn("getAllPageSlugs: Placeholder implementation. Public API needs a query to fetch all published page slugs for the current tenant. Returning dummy data.");
  // Returning dummy data for now to allow build to pass.
  // Replace with actual API call when the endpoint is ready.
  return [{ slug: 'home' }, { slug: 'example-page' }];
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
    const data = await client.request<{ menu: any }>(query, variables);
    return data.menu;
}

// Add more functions as needed, e.g., getPosts, getPostBySlug, etc.
