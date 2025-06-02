import { rule, shield, and, or, not, allow, deny } from 'graphql-shield';
import { IRule } from 'graphql-shield/dist/types'; // Will cause error if graphql-shield not installed

// TODO: Import or define your GraphQL Context type. This is crucial.
// Example: import { Context } from '../context'; // Adjust to your actual context definition
// For now, we'll use 'any' for ctx type in rules for boilerplate purposes.

// --- Reusable Rule Fragments ---

const isAuthenticated = rule({ cache: 'contextual' })(
  async (parent: any, args: any, ctx: any, info: any) => {
    if (!ctx.user || !ctx.user.id) {
      // Consider throwing a specific error type or returning a boolean
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

// Placeholder - will need proper context.tenantId and user.tenants structure
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
    const targetUserId = args.id || parent?.userId || parent?.id; // Common patterns for ID
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

// Example resource access rule - highly dependent on actual data models and context
const canAccessResource = (resourceType: string) =>
  rule({ cache: 'contextual' })(async (parent: any, args: { id?: string }, ctx: any, info: any) => {
    const resourceId = args.id || parent?.id; // ID might be in args or parent
    // Placeholder: In a real scenario, this would involve checking user's rights to this specific resource,
    // potentially involving a database lookup using ctx.user.id, ctx.tenantId, resourceType, resourceId.
    console.log(`canAccessResource (placeholder): Checking access for user ${ctx.user?.id} to ${resourceType} ${resourceId}`);
    // For now, let's assume being a tenant member is enough for some resources.
    // This is a simplified placeholder.
    if (await isTenantMember(parent, args, ctx, info) === true) {
        return true;
    }
    return new Error(`Access to resource ${resourceType} denied.`);
});

export const permissionsShield = shield({
  Query: {
    // Public access examples:
    // somePublicData: allow,
    // specificPublicPost: allow,

    // Authenticated access examples:
    viewerProfile: isAuthenticated,
    userById: and(isAuthenticated, or(isAdmin, isSelf)),

    // Tenant-specific & permission-based examples:
    // tenantDashboardData: and(isAuthenticated, isTenantMember, hasPermission('read:dashboard')),
    // listTenantUsers: and(isAuthenticated, isTenantMember, isAdmin, hasPermission('list:users')),

    // Default for unspecified queries - choose allow or deny based on security posture
    '*': isAuthenticated, // Example: require auth for all other queries by default
  },
  Mutation: {
    // Examples:
    // updateProfile: and(isAuthenticated, isSelf, hasPermission('update:own_profile')),
    // createUser: and(isAuthenticated, isAdmin, hasPermission('create:user')),
    // publishPost: and(isAuthenticated, isTenantMember, hasPermission('publish:post')),

    // Default for unspecified mutations
    '*': isAuthenticated, // Example: require auth for all mutations by default
  },
  User: { // Field-level permissions on User type
    email: or(isSelf, isAdmin),
    // other fields on User might be 'allow' by default if the parent query was allowed.
  },
  // Add other Type specific field permissions as needed
  // Example:
  // Post: {
  //   authorEmail: and(isAuthenticated, or(isAdmin, isSelf /* if self is author */)),
  //   views: isAdmin,
  // },

  // Fallback Rules
}, {
  allowExternalErrors: true,
  debug: process.env.NODE_ENV === 'development',
  fallbackRule: deny, // Deny access if no rule explicitly allows for a field/type
  fallbackError: (error: any, parent: any, args: any, context: any, info: any) => {
    if (error) {
      console.error('GraphQL Shield Triggered Error:', error.message, { path: info.path });
      return error; // Return the specific error from the rule
    }
    console.warn('GraphQL Shield: Access denied by fallback rule for path:', info.path.key);
    return new Error(`Not authorized to access '${info.path.key}'.`);
  }
});
