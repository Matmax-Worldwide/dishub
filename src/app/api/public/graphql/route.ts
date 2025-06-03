// src/app/api/public/graphql/route.ts
import { ApolloServer } from '@apollo/server';
import { startServerAndCreateNextHandler } from '@as-integrations/next';
import { NextRequest } from 'next/server';
import { publicTypeDefs } from './typeDefs';
import { publicResolvers } from './resolvers';
import { prismaManager } from '@/lib/prisma';
import { tenantScopeExtension } from '@/lib/prisma-extensions/tenant-scope';
import { TenantResolver } from '@/lib/tenant/resolver';
import { verifyToken, UserJwtPayload } from '@/lib/auth'; // UserJwtPayload is used for typing decoded JWT
import { getPermissionsForRole, RoleName } from '@/config/rolePermissions';
// Reusing main GraphQLContext structure. Consider defining a PublicGraphQLContext if it diverges significantly.
import { GraphQLContext } from '@/app/api/graphql/route';
import { PrismaClient } from '@prisma/client';
import { GraphQLError } from 'graphql'; // For custom error handling

const publicServer = new ApolloServer<GraphQLContext>({
  typeDefs: publicTypeDefs,
  resolvers: publicResolvers,
  introspection: process.env.NODE_ENV !== 'production', // Enable introspection for non-production
  formatError: (formattedError, error) => {
    // Log the full error server-side for debugging
    // console.error("GraphQL Public API Error (Original):", error);
    // if (error?.originalError) {
    //   console.error("GraphQL Public API Original Error (Extensions):", (error.originalError as any)?.extensions);
    //   console.error("GraphQL Public API Original Error (Full):", error.originalError);
    // }

    // Customize error response for the client
    const code = (formattedError.extensions?.code ||
                  (error?.originalError as any)?.extensions?.code ||
                  'INTERNAL_SERVER_ERROR') as string;

    const message = formattedError.message || (error?.originalError as any)?.message || "An unexpected error occurred.";

    // Avoid overly verbose console logging for common errors like NOT_FOUND or FORBIDDEN in production
    if (process.env.NODE_ENV === 'development' || !['NOT_FOUND', 'FORBIDDEN', 'TENANT_IDENTIFICATION_FAILED', 'BAD_REQUEST'].includes(code)) {
        console.error(`GraphQL Public API Error: Message: ${message}, Code: ${code}, Path: ${formattedError.path}`);
        if (error?.originalError) {
            console.error("Original error details:", error.originalError);
        }
    }


    return {
      message: message,
      locations: formattedError.locations,
      path: formattedError.path,
      extensions: {
        code: code,
        timestamp: new Date().toISOString(),
      },
    };
  },
});

const publicApiHandler = startServerAndCreateNextHandler<NextRequest, GraphQLContext>(publicServer, {
  context: async (req) => {
    const tenantResolver = new TenantResolver(req);
    const resolvedTenantId = await tenantResolver.resolveTenantId();
    // console.log(`Public GraphQL Context: Tenant ID from TenantResolver: ${resolvedTenantId}`);

    let currentPrismaClient: PrismaClient;
    if (resolvedTenantId) {
      currentPrismaClient = prismaManager.getClient(resolvedTenantId).$extends(tenantScopeExtension(resolvedTenantId));
      // console.log(`Public GraphQL Context: Using tenant-scoped Prisma client for tenant: ${resolvedTenantId}`);
    } else {
      // For public API, if no tenant is resolved (e.g. accessing global site config from main domain)
      // some queries might still work if they don't strictly require tenantId (e.g. siteConfig resolver handles this)
      currentPrismaClient = prismaManager.getClient();
      // console.log('Public GraphQL Context: No tenant resolved, using default Prisma client.');
    }

    let userContext = null;
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;

    if (token) {
      try {
        const decodedJwt = await verifyToken(token) as UserJwtPayload | null; // verifyToken returns UserJwtPayload or null
        if (decodedJwt) {
          const userRoleName = decodedJwt.role as RoleName; // Assuming role in JWT is valid RoleName
          const resolvedPermissions = getPermissionsForRole(userRoleName);
          userContext = {
            id: decodedJwt.userId,
            role: userRoleName,
            permissions: resolvedPermissions,
            currentTenantIdFromJwt: decodedJwt.tenantId || null,
            // tenants: decodedJwt.tenants || [], // If using a tenants array in JWT
          };
          // console.log(`Public GraphQL Context: User context created for user ID: ${decodedJwt.userId}, role: ${userRoleName}`);
        }
      } catch (error) {
        // console.warn('Public GraphQL Context: Error or invalid token for user context:', error);
      }
    }

    // For public API, DataLoaders might not be needed or a different set could be used.
    // Keeping it minimal for now. If any public resolvers have N+1 issues, DataLoaders can be added.
    // The GraphQLContext type expects loaders, so we provide a compatible structure.
    return {
      req,
      prisma: currentPrismaClient,
      tenantId: resolvedTenantId,
      user: userContext,
      loaders: { // Provide a loaders object that matches the GraphQLContext interface
        // @ts-ignore - These are intentionally null/minimal for the public API
        sectionLoader: null,
        // @ts-ignore
        postsByBlogIdLoader: null,
        // @ts-ignore
        orderItemsByOrderIdLoader: null,
        // @ts-ignore
        userByIdLoader: null,
      },
    };
  },
});

export async function GET(request: NextRequest) {
  return publicApiHandler(request);
}

export async function POST(request: NextRequest) {
  const requestClone = request.clone();
  try {
    const text = await requestClone.text();
    if (!text || text.trim() === '') {
      return Response.json({
        errors: [{ message: 'Request body is empty or contains only whitespace', extensions: { code: 'BAD_REQUEST' }}]
      }, {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  } catch (error) {
    console.error("Error reading request body in public GraphQL POST:", error);
    return Response.json({
        errors: [{ message: 'Failed to read request body', extensions: { code: 'INTERNAL_SERVER_ERROR' }}]
      }, {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
  }
  return publicApiHandler(request);
}
