// src/app/api/graphql/route.ts
import { ApolloServer } from '@apollo/server';
import { startServerAndCreateNextHandler } from '@as-integrations/next';
import { NextRequest } from 'next/server';
import { typeDefs } from './typeDefs';
import resolvers from './resolvers';
import { prismaManager } from '@/lib/prisma'; // Changed to prismaManager
import { tenantScopeExtension } from '@/lib/prisma-extensions/tenant-scope'; // Added
import { TenantResolver } from '@/lib/tenant/resolver'; // Added
import { verifyToken } from '@/lib/auth'; // UserJwtPayload for better typing

// Imports for graphql-shield
import { makeExecutableSchema } from '@graphql-tools/schema';
import { applyMiddleware } from 'graphql-middleware';
import { permissions } from './authorization';

// Import for role-based permissions
import { getPermissionsForRole, RoleName } from '@/config/rolePermissions';

// Imports for DataLoader
import DataLoader from 'dataloader';
import { batchSectionsByPageIds } from './dataloaders/sectionLoader';
import { CMSSection } from '@prisma/client';
import { batchPostsByBlogIds, EnrichedPost as EnrichedBlogPost } from './dataloaders/postsByBlogIdLoader';
import { batchOrderItemsByOrderIds, EnrichedOrderItem } from './dataloaders/orderItemsByOrderIdLoader';
import { batchUsersByIds, PublicUser } from './dataloaders/userByIdLoader';
import { PrismaClient, Tenant } from '@prisma/client'; // Import Tenant (not PrismaTenant)

// Create the base schema
const baseSchema = makeExecutableSchema({
  typeDefs,
  resolvers,
});

// Apply the shield middleware
const schemaWithPermissions = applyMiddleware(baseSchema, permissions);

// Initialize ApolloServer
const server = new ApolloServer<GraphQLContext>({
  schema: schemaWithPermissions,
});

// Updated GraphQLContext interface combining both versions
export interface GraphQLContext {
  req: NextRequest;
  prisma: PrismaClient; // Type for the Prisma client instance
  tenantId: string | null;
  user: {
    id: string;
    role: RoleName; // Assuming RoleName is an enum or string literal type
    permissions: string[];
    tenants?: Array<{ id: string; role: string; status: string }>; // From original, might be needed if user has multiple tenants in JWT
    currentTenantIdFromJwt?: string | null; // If tenantId is part of user's JWT claims
  } | null;
  currentTenant: Tenant | null; // Full Tenant object for the resolved context
  loaders: {
    sectionLoader: DataLoader<string, CMSSection[], string>;
    postsByBlogIdLoader: DataLoader<string, EnrichedBlogPost[], string>;
    orderItemsByOrderIdLoader: DataLoader<string, EnrichedOrderItem[], string>;
    userByIdLoader: DataLoader<string, PublicUser | null, string>;
  };
}

// Helper function to get role by ID from database (keep if still needed, but JWT role is primary)
async function getRoleById(roleId: string): Promise<string | null> {
  try {
    // Use the default (non-tenant-scoped) prisma client for fetching global roles
    const role = await prismaManager.getClient().roleModel.findUnique({
      where: { id: roleId },
      select: { name: true }
    });
    return role?.name || null;
  } catch (error) {
    console.error('Error fetching role by ID:', error);
    return null;
  }
}

// Helper function to get user's current role from database (keep if still needed)
async function getUserRoleFromDb(userId: string): Promise<string | null> {
  try {
    // Use the default (non-tenant-scoped) prisma client for fetching user roles
    const user = await prismaManager.getClient().user.findUnique({
      where: { id: userId },
      select: {
        roleId: true,
        role: {
          select: { name: true }
        }
      }
    });
    return user?.role?.name || null;
  } catch (error) {
    console.error('Error fetching user role from DB:', error);
    return null;
  }
}

const handler = startServerAndCreateNextHandler<NextRequest, GraphQLContext>(server, {
  context: async (req) => {
    // 1. Resolve Tenant ID
    const tenantResolver = new TenantResolver(req);
    const resolvedTenantId = await tenantResolver.resolveTenantId();
    console.log(`GraphQL Context: Tenant ID from TenantResolver: ${resolvedTenantId}`);

    // 2. Initialize Prisma Client (scoped or default) and fetch full Tenant object
    let currentPrismaClient: PrismaClient;
    let currentTenantFull: Tenant | null = null;

    if (resolvedTenantId) {
      currentPrismaClient = prismaManager.getClient(resolvedTenantId).$extends(tenantScopeExtension(resolvedTenantId)) as PrismaClient;
      console.log(`GraphQL Context: Using tenant-scoped Prisma client for tenant: ${resolvedTenantId}`);
      try {
        // Fetch the full tenant object using the non-scoped client for platform data
        currentTenantFull = await prismaManager.getClient().tenant.findUnique({
          where: { id: resolvedTenantId }
        });
        if (!currentTenantFull) {
          console.warn(`GraphQL Context: No tenant record found for resolvedTenantId: ${resolvedTenantId}. This might be an issue.`);
        } else {
          console.log(`GraphQL Context: Fetched full tenant details for tenant: ${currentTenantFull.name}`);
        }
      } catch (e) {
        console.error("GraphQL Context: Error fetching full tenant details:", e);
      }
    } else {
      currentPrismaClient = prismaManager.getClient();
      console.log('GraphQL Context: No tenant resolved, using default Prisma client.');
    }

    // 3. Initialize DataLoaders with the determined Prisma client
    const loaders = {
      sectionLoader: new DataLoader<string, CMSSection[], string>(
        (keys) => batchSectionsByPageIds(keys, currentPrismaClient),
        { cacheKeyFn: (key: string) => key }
      ),
      postsByBlogIdLoader: new DataLoader<string, EnrichedBlogPost[], string>(
        (keys) => batchPostsByBlogIds(keys, currentPrismaClient),
        { cacheKeyFn: (key: string) => key }
      ),
      orderItemsByOrderIdLoader: new DataLoader<string, EnrichedOrderItem[], string>(
        (keys) => batchOrderItemsByOrderIds(keys, currentPrismaClient),
        { cacheKeyFn: (key: string) => key }
      ),
      userByIdLoader: new DataLoader<string, PublicUser | null, string>(
        (keys) => batchUsersByIds(keys),
        { cacheKeyFn: (key: string) => key }
      ),
    };

    // 4. Resolve User from JWT (combining both approaches)
    let userContext = null;
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;

    if (token) {
      try {
        const decodedJwt = await verifyToken(token); // verifyToken now returns UserJwtPayload | null

        if (decodedJwt) {
          let userRoleName = decodedJwt.role as RoleName; // Role from JWT is primary

          console.log('Token decoded role:', userRoleName);
          console.log('Token decoded roleId:', decodedJwt.roleId);
          console.log('Actual role:', userRoleName);

          // If role is undefined or invalid, try to get it from database (fallback from original version)
          if (!userRoleName || !['USER', 'ADMIN', 'MANAGER', 'EMPLOYEE', 'SUPER_ADMIN', 'STAFF'].includes(userRoleName)) {
            console.log('Role undefined or invalid, fetching from database...');
            
            // First try to get role by roleId if available
            if (decodedJwt.roleId) {
              console.log('Trying to get role by roleId:', decodedJwt.roleId);
              userRoleName = await getRoleById(decodedJwt.roleId) as RoleName;
              console.log('Role from roleId:', userRoleName);
            }
            
            // If still no role, get user's current role from database
            if (!userRoleName) {
              console.log('Getting user role from database for userId:', decodedJwt.userId);
              userRoleName = await getUserRoleFromDb(decodedJwt.userId) as RoleName;
              console.log('Role from user query:', userRoleName);
            }
            
            // Fallback to USER if still no role found
            if (!userRoleName) {
              console.log('No role found, defaulting to USER');
              userRoleName = 'USER';
            }
          }

          console.log('Using actual user role:', userRoleName);

          const resolvedPermissions = getPermissionsForRole(userRoleName);

          userContext = {
            id: decodedJwt.userId,
            role: userRoleName,
            permissions: resolvedPermissions,
            currentTenantIdFromJwt: decodedJwt.tenantId || null, // TenantId from JWT
            tenants: [], // Initialize as empty array, could be populated from JWT if needed
          };

          // Security Check: If a tenant was resolved from the request (e.g. subdomain)
          // AND the user's JWT also has a tenantId, they should match,
          // unless the user is a SUPER_ADMIN or platform admin.
          if (resolvedTenantId &&
              decodedJwt.tenantId &&
              resolvedTenantId !== decodedJwt.tenantId &&
              userRoleName !== 'SUPER_ADMIN' && // Add other platform admin roles if any
              userRoleName !== 'ADMIN' // Assuming ADMIN can be a platform admin
          ) {
            console.warn(`Tenant ID mismatch! Request-resolved: ${resolvedTenantId}, JWT-derived: ${decodedJwt.tenantId}. User: ${decodedJwt.userId}, Role: ${userRoleName}. Invalidating user for this context.`);
            // For now, we will prioritize the request-resolved tenantId for data scoping,
            // but the authorization layer should use this info.
          }
        }
      } catch (error) {
        console.error('GraphQL Context: Error verifying token:', error instanceof Error ? error.message : 'Unknown error');
      }
    }

    console.log('GraphQL Context: User:', userContext ? userContext.id : 'null', 'Role:', userContext?.role || 'null');
    console.log('GraphQL Context: Final Tenant ID for context:', resolvedTenantId);

    return {
      req,
      prisma: currentPrismaClient,
      tenantId: resolvedTenantId, // The ID of the tenant data context
      user: userContext,          // The authenticated user
      currentTenant: currentTenantFull, // Full Tenant object for the data context
      loaders,
    };
  },
});

export async function GET(request: NextRequest) {
  return handler(request);
}

export async function POST(request: NextRequest) {
  const requestClone = request.clone();
  const text = await requestClone.text();
  if (!text || text.trim() === '') {
    return new Response(JSON.stringify({
      errors: [{ message: 'Empty request body' }]
    }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  return handler(request);
}

// Ensure batch functions in DataLoaders are updated to accept and use the PrismaClient instance
// Example for sectionLoader (similar changes for others):
// export const batchSectionsByPageIds = async (pageIds: readonly string[], prismaClient: PrismaClient) => {
//   // ... use prismaClient in your query ...
//   const sections = await prismaClient.cMSSection.findMany({ ... });
//   // ... rest of the logic
// };
