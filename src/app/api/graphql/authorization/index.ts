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
    page: allow, 
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
    
    // Blog/Post Query Rules (assuming most are public or covered by isAuthenticated initially)
    // Specific rules can be added if needed, e.g., for drafts vs published
    blogs: allow, // Example: Publicly listable blogs
    blog: allow,  // Example: Publicly viewable single blog
    blogBySlug: allow, // Example: Publicly viewable single blog by slug
    post: allow, // Example: Publicly viewable single post
    posts: allow, // Example: Publicly listable posts (might add filter for status)
    postBySlug: allow, // Example: Publicly viewable single post by slug

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

    // Blog and Post Mutation Rules
    createBlog: and(isAuthenticated, hasPermission('create:blog')),
    updateBlog: and(isAuthenticated, hasPermission('update:blog')),
    deleteBlog: and(isAuthenticated, hasPermission('delete:blog')),
    createPost: and(isAuthenticated, hasPermission('create:post')),
    updatePost: and(isAuthenticated, hasPermission('update:any_post')), // or more specific like 'update:own_post'
    deletePost: and(isAuthenticated, hasPermission('delete:post')),
    
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
  // Blog and Post type field resolvers can be added if needed
  // e.g., Post: { content: isAuthenticated } // if content is sensitive
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
