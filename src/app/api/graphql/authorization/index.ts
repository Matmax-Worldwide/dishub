import { rule, shield, and, or, not, allow, deny } from 'graphql-shield';
import { GraphQLError } from 'graphql';

// --- Reusable Rule Fragments ---
const isAuthenticated = rule({ cache: 'contextual' })(
  async (parent: any, args: any, ctx: any, info: any) => {
    if (!ctx.user || !ctx.user.id) {
      return new Error('Not authenticated!');
    }
    return true;
  }
);

const isAdmin = rule({ cache: 'contextual' })(
  async (parent: any, args: any, ctx: any, info: any) => {
    if (!ctx.user || ctx.user.role !== 'ADMIN') {
      return new Error('User is not an Admin!');
    }
    return true;
  }
);

const isTenantMember = rule({ cache: 'contextual' })(
  async (parent: any, args: any, ctx: any, info: any) => {
    if (!ctx.user || !ctx.tenantId || !ctx.user.tenants?.some((t: any) => t.id === ctx.tenantId && t.status === 'ACTIVE')) {
        return new Error('User is not an active member of this tenant!');
    }
    return true;
  }
);

const isSelf = rule({ cache: 'contextual' })(
  async (parent: any, args: any, ctx: any, info: any) => {
    const targetUserId = args.id || parent?.userId || parent?.id;
    if (!ctx.user || !targetUserId || ctx.user.id !== targetUserId) {
        return new Error('Cannot access resource belonging to another user!');
    }
    return true;
  }
);

const hasPermission = (permission: string) => {
  return rule({ cache: 'contextual' })(async (parent: any, args: any, ctx: any, info: any) => {
    if (!ctx.user || !ctx.user.permissions || !ctx.user.permissions.includes(permission)) {
      return new Error(`Missing required permission: ${permission}`);
    }
    return true;
  });
};

export const permissionsShield = shield({
  Query: {
    // User related
    viewerProfile: isAuthenticated,
    userById: and(isAuthenticated, or(isAdmin, isSelf)),

    // CMS Query Rules
    getAllCMSSections: and(isAuthenticated, hasPermission('read:cms_section_definitions')),
    getPageBySlug: allow,
    page: allow, // Assuming public access, could be: and(isAuthenticated, hasPermission('read:any_page')),
    getSectionComponents: allow,
    getAllCMSComponents: and(isAuthenticated, hasPermission('browse:cms_components')),
    getCMSComponent: and(isAuthenticated, hasPermission('read:cms_component_definition')),
    getCMSComponentsByType: and(isAuthenticated, hasPermission('browse:cms_components')),
    getAllCMSPages: and(isAuthenticated, hasPermission('list:all_pages')),
    getPagesUsingSectionId: and(isAuthenticated, hasPermission('find:pages_by_section')),
    getDefaultPage: allow,

    // Settings Query Rules
    userSettings: isAuthenticated,
    getSiteSettings: allow,

    '*': isAuthenticated, // Default for other unspecified queries
  },
  Mutation: {
    // User related
    createUser: and(isAuthenticated, hasPermission('create:user')),
    updateUser: and(isAuthenticated, hasPermission('update:user')),
    deleteUser: and(isAuthenticated, hasPermission('delete:user')),

    // CMS Mutation Rules
    saveSectionComponents: and(isAuthenticated, hasPermission('edit:cms_content')),
    deleteCMSSection: and(isAuthenticated, hasPermission('delete:cms_section')),
    createCMSComponent: and(isAuthenticated, hasPermission('create:cms_component_definition')),
    updateCMSComponent: and(isAuthenticated, hasPermission('update:cms_component_definition')),
    deleteCMSComponent: and(isAuthenticated, hasPermission('delete:cms_component_definition')),
    updateCMSSection: and(isAuthenticated, hasPermission('update:cms_section_metadata')),
    createPage: and(isAuthenticated, hasPermission('create:page')),
    updatePage: and(isAuthenticated, hasPermission('edit:page')),
    deletePage: and(isAuthenticated, hasPermission('delete:page')),
    associateSectionToPage: and(isAuthenticated, hasPermission('edit:page_structure')),
    dissociateSectionFromPage: and(isAuthenticated, hasPermission('edit:page_structure')),

    // Settings Mutation Rules
    updateUserSettings: isAuthenticated,
    updateSiteSettings: and(isAuthenticated, hasPermission('update:site_settings')),

    '*': isAuthenticated, // Default for other unspecified mutations
  },
  User: {
    email: or(isSelf, isAdmin),
  },
  CMSSection: {
    components: isAuthenticated,
  },
  Page: {
    sections: isAuthenticated,
  }
}, {
  allowExternalErrors: true,
  debug: process.env.NODE_ENV === 'development',
  fallbackRule: deny,
  fallbackError: (error: any, parent: any, args: any, context: any, info: any) => {
    const pathKey = info.path?.key || 'unknown path';
    if (error && error.message && error.message !== 'Not Authorised!') {
      console.error(`GraphQL Shield Triggered Error at path '${pathKey}':`, error.message);
      return error;
    }
    return new GraphQLError(`Not authorized to access '${pathKey}'. Access denied.`, {
      extensions: { code: 'FORBIDDEN' }
    });
  }
});
