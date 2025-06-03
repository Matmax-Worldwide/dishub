// src/app/api/public/graphql/resolvers.ts
import { GraphQLContext } from '@/app/api/graphql/route'; // Main GraphQL context
import { prismaManager } from '@/lib/prisma';
import { GraphQLError } from 'graphql';
import { Prisma } from '@prisma/client'; // Import Prisma for types if needed

// Helper to verify preview token
const isValidPreviewToken = (req: any, tenantId: string | null): boolean => {
  const previewToken = req.headers.get('X-Preview-Token');
  if (!previewToken || !tenantId) return false;

  // Example: Check against an environment variable specific to the tenant
  // For production, this should be a more secure mechanism, like a signed JWT or DB lookup.
  // Make sure tenantId is sanitized if used directly in env var name (e.g. only alphanumeric)
  const sanitizedTenantId = tenantId.replace(/[^a-zA-Z0-9_]/g, '');
  const expectedToken = process.env[`PREVIEW_TOKEN_TENANT_${sanitizedTenantId.toUpperCase()}`];

  if (expectedToken && previewToken === expectedToken) {
    return true;
  }
  // Fallback for a global preview token during development
  if (process.env.NODE_ENV === 'development' && process.env.DEV_GLOBAL_PREVIEW_TOKEN && previewToken === process.env.DEV_GLOBAL_PREVIEW_TOKEN) {
    console.warn("Using global development preview token. Do not use in production.");
    return true;
  }
  return false;
};

// Define a more specific type for Menu items with populated children and page
interface MenuItemWithChildrenAndPage extends Prisma.MenuItemGetPayload<{
  include: {
    page: { select: { slug: true, isPublished: true } },
    children: {
      include: {
        page: { select: { slug: true, isPublished: true } },
        children: true // For deeper recursion, this needs to be typed properly or handled iteratively
      }
    }
  }
}> {}


export const publicResolvers = {
  Query: {
    page: async (_parent: any, { slug, preview = false }: { slug: string, preview?: boolean }, ctx: GraphQLContext) => {
      if (!ctx.tenantId) {
        throw new GraphQLError('Tenant could not be identified.', { extensions: { code: 'TENANT_IDENTIFICATION_FAILED' } });
      }

      let isPreviewActive = false;
      if (preview) {
        const tokenIsValid = isValidPreviewToken(ctx.req, ctx.tenantId);
        // Check if user is authenticated and has permissions for the current tenant context
        const userHasSufficientPermissions = ctx.user &&
                                  ctx.user.currentTenantIdFromJwt === ctx.tenantId &&
                                  (ctx.user.role === 'ADMIN' ||
                                   ctx.user.role === 'MANAGER' ||
                                   ctx.user.role === 'SUPER_ADMIN' || // SUPER_ADMIN can preview any tenant
                                   ctx.user.permissions.includes('read:unpublished_content'));

        // If user is SUPER_ADMIN, they might preview content of ctx.tenantId even if their currentTenantIdFromJwt is different or null.
        const isSuperAdminViewingSpecificTenant = ctx.user?.role === 'SUPER_ADMIN' && !!ctx.tenantId;


        if (tokenIsValid || userHasSufficientPermissions || isSuperAdminViewingSpecificTenant) {
          isPreviewActive = true;
          console.log(`Preview mode active for page: ${slug}, tenant: ${ctx.tenantId}`);
        } else {
          console.log('Preview access denied.', { tokenIsValid, userHasSufficientPermissions, isSuperAdminViewingSpecificTenant, userId: ctx.user?.id, userRole: ctx.user?.role, userTenant: ctx.user?.currentTenantIdFromJwt, contextTenant: ctx.tenantId });
          throw new GraphQLError('Not authorized to view unpublished content.', { extensions: { code: 'FORBIDDEN' } });
        }
      }

      const pageData = await ctx.prisma.page.findFirst({
        where: {
          // tenantId: ctx.tenantId, // This is automatically applied by tenantScopeExtension if ctx.prisma is scoped
          slug: slug,
          ...(isPreviewActive ? {} : { isPublished: true }),
        },
        include: {
          sections: {
            orderBy: { order: 'asc' },
            include: {
              components: {
                orderBy: { order: 'asc' },
                include: {
                  component: true, // CMSComponent model
                },
              },
              media: true, // Media directly associated with CMSSection
            },
          },
        },
      });

      if (!pageData) return null;

      // Transform data to match PublicPage GraphQL type
      return {
        ...pageData,
        featuredImage: pageData.featuredImage ? { id: `featured-${pageData.id}`, url: pageData.featuredImage, altText: pageData.title, fileName: pageData.featuredImage.split('/').pop() || 'image', fileType: 'image' } : null,
        sections: pageData.sections.map(section => ({
          ...section,
          // Ensure media objects have an 'id' if it's non-nullable in PublicMedia, and map fileUrl to url
          media: section.media.map(m => ({ ...m, id: m.id, url: m.fileUrl, altText: m.altText || '', fileName: m.fileName || '', fileType: m.fileType || '' })),
          components: section.components.map(sc => ({
            id: sc.component.id, // Use the actual component's ID
            type: sc.component.slug, // Map to component's slug as 'type'
            data: sc.data,
            order: sc.order,
          })),
        })),
      };
    },

    siteConfig: async (_parent: any, _args: any, ctx: GraphQLContext) => {
      // Use non-scoped client for global SiteSettings
      const globalSettings = await prismaManager.getClient().siteSettings.findFirst();

      if (!ctx.tenantId) {
         // If no tenant identified, return only truly global site settings
         if (globalSettings) {
            return {
                siteName: globalSettings.siteName,
                logoUrl: globalSettings.logoUrl,
                faviconUrl: globalSettings.faviconUrl,
                primaryColor: globalSettings.primaryColor,
                secondaryColor: globalSettings.secondaryColor,
                defaultLocale: globalSettings.defaultLocale || 'en',
                supportedLocales: globalSettings.supportedLocales || ['en'],
            };
         }
        // If no tenant and no global settings, it's an issue or implies no config available.
        throw new GraphQLError('Site configuration not available.', { extensions: { code: 'NOT_FOUND' } });
      }

      // Tenant is identified, use tenant-scoped prisma (ctx.prisma)
      const tenantInfo = await ctx.prisma.tenant.findUnique({ where: { id: ctx.tenantId } });

      if (!tenantInfo && !globalSettings) { // If tenant specific info not found AND no global settings
        throw new GraphQLError('Tenant or default site configuration not found.', { extensions: { code: 'NOT_FOUND' } });
      }

      const tenantSettings = (tenantInfo?.settings as any) || {};

      return {
        siteName: tenantSettings.siteName || tenantInfo?.name || globalSettings?.siteName,
        logoUrl: tenantSettings.logoUrl || globalSettings?.logoUrl,
        faviconUrl: tenantSettings.faviconUrl || globalSettings?.faviconUrl,
        primaryColor: tenantSettings.primaryColor || globalSettings?.primaryColor,
        secondaryColor: tenantSettings.secondaryColor || globalSettings?.secondaryColor,
        defaultLocale: tenantSettings.defaultLocale || globalSettings?.defaultLocale || 'en',
        supportedLocales: tenantSettings.supportedLocales || globalSettings?.supportedLocales || ['en'],
      };
    },

    menu: async (_parent: any, { location }: { location: string }, ctx: GraphQLContext) => {
      if (!ctx.tenantId) {
        throw new GraphQLError('Tenant could not be identified for menu.', { extensions: { code: 'TENANT_IDENTIFICATION_FAILED' } });
      }

      // Fetch menu with two levels of children
      const menuData = await ctx.prisma.menu.findFirst({
        where: {
          // tenantId: ctx.tenantId, // Automatically applied by tenantScopeExtension
          location: location,
          isActive: true, // Assuming Menu model has an isActive flag (add to schema if not)
        },
        include: {
          items: {
            orderBy: { order: 'asc' },
            where: { isActive: true },
            include: {
              page: { select: { slug: true, isPublished: true } },
              children: { // First level children
                orderBy: { order: 'asc' },
                where: { isActive: true },
                include: {
                  page: { select: { slug: true, isPublished: true } },
                  children: { // Second level children
                    orderBy: { order: 'asc' },
                    where: { isActive: true },
                    include: {
                      page: { select: { slug: true, isPublished: true } },
                      // Deeper nesting would require more includes or a different fetching strategy
                    }
                  }
                }
              }
            }
          },
        },
      });

      if (!menuData) return null;

      // Recursive function to map menu items and their children
      const mapMenuItems = (items: MenuItemWithChildrenAndPage[]): any[] => {
        return items
          .filter(item => item.isActive && (item.url || (item.page && item.page.isPublished)))
          .map(item => {
            const mappedItem: any = {
              id: item.id,
              title: item.title,
              url: item.url,
              target: item.target,
              icon: item.icon,
              children: [], // Initialize children array
            };
            if (item.page?.slug && item.page.isPublished) {
              mappedItem.url = `/page/${item.page.slug}`; // Prioritize page link if page is published
            }
            if (item.children && item.children.length > 0) {
              mappedItem.children = mapMenuItems(item.children as any); // Recursively map children
            }
            return mappedItem;
          });
      };

      return {
        ...menuData,
        items: mapMenuItems(menuData.items as any), // Cast to any to handle recursive type
      };
    },
  },
  // Resolver for PublicMedia.url to ensure it prefers `url` if present, otherwise `fileUrl`
  PublicMedia: {
    url: (parentMedia: { fileUrl?: string, url?: string }) => parentMedia.url || parentMedia.fileUrl,
  },
  // Add resolvers for other Public types if they have fields that need custom resolution
  // For example, if PublicPage.featuredImage was just a string URL in DB but PublicMedia object in GQL:
  // PublicPage: {
  //   featuredImage: (parentPage: { featuredImage?: string; title?: string; id?: string }) => {
  //     if (!parentPage.featuredImage) return null;
  //     return {
  //       id: `featured-${parentPage.id}`, // Construct a stable ID
  //       url: parentPage.featuredImage,
  //       altText: parentPage.title,
  //       fileName: parentPage.featuredImage.split('/').pop() || 'image',
  //       fileType: 'image', // Assuming type based on context or could be derived
  //     };
  //   },
  // },
};
