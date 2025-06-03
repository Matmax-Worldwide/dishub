// src/app/api/graphql/authorization/index.ts
import { rule, shield, and, or, allow, deny, not } from 'graphql-shield';
import { GraphQLContext } from '../route'; // Assuming GraphQLContext is exported from route.ts
import { RoleName } from '@/config/rolePermissions'; // Assuming RoleName is defined

// Rule: Is the user authenticated?
const isAuthenticated = rule({ cache: 'contextual' })(
  async (parent, args, ctx: GraphQLContext, info) => {
    if (!ctx.user) {
      return new Error('Authentication required.');
    }
    return true;
  }
);

// Rule: Is the user a platform super admin?
const isPlatformSuperAdmin = rule({ cache: 'contextual' })(
  async (parent, args, ctx: GraphQLContext, info) => {
    return ctx.user?.role === 'SUPER_ADMIN'; // Assuming 'SUPER_ADMIN' is a defined RoleName
  }
);

// Rule: Is the user an admin of the current tenant context?
// This means they are an ADMIN/MANAGER for the tenant identified by ctx.tenantId
const isTenantAdmin = rule({ cache: 'contextual' })(
  async (parent, args, ctx: GraphQLContext, info) => {
    if (!ctx.user || !ctx.tenantId) return false; // Requires user and a resolved tenant context

    // Check if user's JWT tenantId matches the context's tenantId
    // AND their role within that tenant is ADMIN or MANAGER
    if (ctx.user.currentTenantIdFromJwt === ctx.tenantId) {
      return ctx.user.role === 'ADMIN' || ctx.user.role === 'MANAGER';
    }
    // If user is a SUPER_ADMIN, they can act as admin for any tenant context
    if (ctx.user.role === 'SUPER_ADMIN') return true;

    return new Error('User is not an admin for the current tenant.');
  }
);

// Rule: Is the user a member of the current tenant?
const isTenantMember = rule({ cache: 'contextual' })(
  async (parent, args, ctx: GraphQLContext, info) => {
    if (!ctx.user) return new Error('User not authenticated.');
    if (!ctx.tenantId) return new Error('Tenant context not resolved.'); // Requires a tenant context

    // SUPER_ADMIN can access any tenant's data as a member
    if (ctx.user.role === 'SUPER_ADMIN') return true;

    // Check if the user's JWT tenantId (the tenant they logged into)
    // matches the currently resolved tenantId from the request (e.g. subdomain)
    if (ctx.user.currentTenantIdFromJwt === ctx.tenantId) {
      return true; // User is a member of the currently resolved tenant
    }

    return new Error('User is not a member of this tenant.');
  }
);

// Rule: Is the user accessing their own resource? (Simplified, context dependent)
const isSelf = rule({ cache: 'contextual' })(async (parent, args, ctx: GraphQLContext) => {
  if (!ctx.user) return false;
  const targetUserId = args.id || args.userId || parent?.userId || parent?.id;
  return ctx.user.id === targetUserId;
});

// Rule: Does the user have a specific permission?
// This rule now implicitly works within the tenant scope because ctx.user.permissions
// should be loaded based on their role within their tenant (ctx.user.currentTenantIdFromJwt).
// The `ctx.prisma` is already tenant-scoped by `tenantScopeExtension` based on `ctx.tenantId`.
const hasPermission = (permission: string) =>
  rule({ cache: 'contextual' })(async (parent, args, ctx: GraphQLContext) => {
    if (!ctx.user?.permissions?.includes(permission)) {
      return new Error(`Missing permission: ${permission}`);
    }
    return true;
  });

// Default Fallback Rule: Deny access if no other rule explicitly allows it.
// This is a good security practice.
const defaultFallbackRule = deny;

// Permissions Shield Definition
export const permissions = shield({
  Query: {
    // Platform Super Admin Queries
    allTenants: isPlatformSuperAdmin,
    tenant: isPlatformSuperAdmin,

    // Tenant-aware queries:
    // Most queries will now need to ensure they are accessed within a tenant context
    // and the user is a member of that tenant.
    // The actual data filtering is handled by Prisma TenantScopeExtension.
    // These rules are more about "can this user attempt this type of query in this tenant context?"

    // Example: viewerProfile should be accessible if authenticated and part of the tenant context
    viewerProfile: and(isAuthenticated, isTenantMember),

    // Example: users list within a tenant
    // users: and(isAuthenticated, isTenantMember, or(isTenantAdmin, hasPermission('list:all_users'))),
    // user: and(isAuthenticated, isTenantMember, or(isTenantAdmin, isSelf, hasPermission('read:user'))),

    // Allow public queries (like getPageBySlug) to bypass auth,
    // but they must be explicitly marked.
    // The resolver for public queries must ensure it only returns PUBLISHED data for the resolved tenant.
    getPageBySlug: allow, // Publicly accessible, resolver handles tenant scoping and published status
    page: allow,          // Publicly accessible
    getDefaultPage: allow, // Publicly accessible
    blogBySlug: allow,    // Publicly accessible
    postBySlug: allow,    // Publicly accessible
    blogs: allow,
    posts: allow,
    // Add other public queries here...

    // Secure other queries by default.
    // For example, if a query is not public, it should at least require isAuthenticated and isTenantMember.
    // Specific permissions can be added on top.
    // '*': and(isAuthenticated, isTenantMember, defaultFallbackRule) // Too restrictive as a global fallback for Query
    // Instead, list queries and apply rules, or have a more granular fallback.
    // For now, let's use a less restrictive default for Query and secure Mutations more.
    // Individual queries not listed will be denied by the fallbackRule of the shield itself.

    // Keeping existing rules from previous file, but they need to be adapted for tenancy.
    // This will be a simplification for the subtask, real implementation needs careful review of each.
    users: and(isAuthenticated, isTenantMember, or(isTenantAdmin, hasPermission('list:all_users'))), // Ensures users are listed within the tenant
    user: and(isAuthenticated, isTenantMember, or(isTenantAdmin, isSelf, hasPermission('read:user'))), // Ensures user is viewed within their tenant context or self
    userById: and(isAuthenticated, isTenantMember, or(isTenantAdmin, isSelf, hasPermission('read:user'))), // Ensures user is viewed within their tenant context or self

    dashboardStats: and(isAuthenticated, isTenantMember, or(isTenantAdmin, hasPermission('view:dashboard_stats'))),
    // ... (other queries from existing shield, wrapped with isTenantMember and appropriate permissions)
    // It's important to review all previously "isAdmin" protected queries.
    // They might become "isPlatformSuperAdmin" or "isTenantAdmin" or a combination.
    // For now, many existing "isAdmin" rules are effectively replaced by "isTenantAdmin" or "isPlatformSuperAdmin"
    // combined with "isTenantMember".

    // Example for a query that should only be available to platform super admins
    // listAllTenants: isPlatformSuperAdmin, // Assuming a query like this exists for other platform data

    // Fallback for any query not explicitly defined or allowed above.
    '*': defaultFallbackRule, // Deny all other queries by default
  },
  Mutation: {
    // Platform Super Admin Mutations
    createTenant: isPlatformSuperAdmin,
    updateTenant: isPlatformSuperAdmin,
    provisionTenantSite: isPlatformSuperAdmin,
    addOrUpdateTenantCustomDomain: isPlatformSuperAdmin,
    checkTenantCustomDomainStatus: isPlatformSuperAdmin,
    removeTenantCustomDomain: isPlatformSuperAdmin,

    // All mutations should require authentication and tenant membership at a minimum.
    // Platform Super Admin might bypass tenant membership for certain platform-wide mutations.

    // Example: updateUser
    // updateUser: and(isAuthenticated, isTenantMember, or(isTenantAdmin, and(isSelf, hasPermission('update:user')))),
    // Example: createPage within a tenant
    // createPage: and(isAuthenticated, isTenantMember, or(isTenantAdmin, hasPermission('create:page'))),

    // A general rule for most mutations:
    // '*': and(isAuthenticated, isTenantMember, defaultFallbackRule) // Too restrictive as a global fallback for Mutation
    // Instead, list mutations and apply rules.
    // For now, let's use a less restrictive default for Mutation and secure with fallbackRule of the shield.
    // Individual mutations not listed will be denied by the fallbackRule of the shield itself.

    // Keeping existing rules from previous file, but they need to be adapted for tenancy.
    // This will be a simplification for the subtask, real implementation needs careful review of each.
    // For tenant-specific resources, isTenantMember is crucial.
    // For creating global resources (e.g. a new Tenant by a super admin), these rules would differ.

    createUser: and(isAuthenticated, isTenantMember, or(isTenantAdmin, hasPermission('create:user'))), // Creates user within the current tenant
    updateUser: and(isAuthenticated, isTenantMember, or(isTenantAdmin, isSelf, hasPermission('update:user'))),
    deleteUser: and(isAuthenticated, isTenantMember, or(isTenantAdmin, hasPermission('delete:user'))),

    createPage: and(isAuthenticated, isTenantMember, or(isTenantAdmin, hasPermission('create:page'))),
    updatePage: and(isAuthenticated, isTenantMember, or(isTenantAdmin, hasPermission('update:page'))),
    deletePage: and(isAuthenticated, isTenantMember, or(isTenantAdmin, hasPermission('delete:page'))),
    // ... (other mutations from existing shield, wrapped with isTenantMember and appropriate permissions)

    // Example for a mutation that should only be available to platform super admins
    // createTenant: isPlatformSuperAdmin, // This is now active above

    // Fallback for any mutation not explicitly defined or allowed above.
    '*': defaultFallbackRule, // Deny all other mutations by default
  },
  User: { // Field-level permissions on the User type
    // Example: email is visible only to self, tenant admins, or platform super admins.
    // email: or(isPlatformSuperAdmin, isTenantAdmin, isSelf),
    // Other fields can be set to `allow` if the main User query was allowed,
    // or also have specific field-level rules.
    // For simplicity, if the User object is resolved, allow its fields for now,
    // unless specific sensitive fields need stricter rules.
    // '*': allow
    // More secure: deny fields by default if not specified.
    // However, this can be verbose. A common pattern is to allow if type is resolved.
    // For now, let's assume if a user can query a User object, they can see its basic fields.
    // Sensitive fields like 'password' should never be exposed by GraphQL schema.
    // For this subtask, we will keep it simple.
    email: or(isPlatformSuperAdmin, and(isTenantMember, or(isTenantAdmin, isSelf))), // Ensures email is seen in correct tenant context or by self/super-admin
    '*': allow, // Allow other user fields if User object itself is accessible based on Query rules
  },
  // Add rules for other types as needed.
  // By default, if a type is resolvable, its fields are also resolvable unless specified otherwise.
  // For tenant-specific types, their parent query rule (e.g., for a Page) should enforce tenant membership.
  // Example:
  // Page: {
  //   '*': isTenantMember, // Ensures any field on Page type is only accessible if user is member of the tenant owning the page.
  //                        // This might be redundant if top-level Page queries already have this.
  // },

  // Global fallback rule for the entire shield.
  // Any path not covered by the rules above will be denied.
}, {
  fallbackRule: defaultFallbackRule,
  allowExternalErrors: process.env.NODE_ENV === 'development', // Show shield errors during dev
  debug: process.env.NODE_ENV === 'development',
});