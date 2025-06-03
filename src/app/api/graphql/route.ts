import { ApolloServer } from '@apollo/server';
import { startServerAndCreateNextHandler } from '@as-integrations/next';
import { NextRequest } from 'next/server';
import { typeDefs } from './typeDefs';
import resolvers from './resolvers';
import { verifyToken } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// Imports for graphql-shield
import { makeExecutableSchema } from '@graphql-tools/schema';
import { applyMiddleware } from 'graphql-middleware';
import { permissions } from './authorization';

// Import for role-based permissions
import { getPermissionsForRole, RoleName } from '@/config/rolePermissions';

// Imports for DataLoader
import DataLoader from 'dataloader';
import { batchSectionsByPageIds } from './dataloaders/sectionLoader';
import { CMSSection } from '@prisma/client'; // Prisma type for sectionLoader
import { batchPostsByBlogIds, EnrichedPost as EnrichedBlogPost } from './dataloaders/postsByBlogIdLoader'; // Aliased EnrichedPost
import { batchOrderItemsByOrderIds, EnrichedOrderItem } from './dataloaders/orderItemsByOrderIdLoader'; // New
import { batchUsersByIds, PublicUser } from './dataloaders/userByIdLoader'; // New


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

// Define DecodedToken interface
interface DecodedToken {
  userId: string;
  roleId?: string;
  role?: RoleName;
  tenants?: Array<{ id: string; role: string; status: string }>;
}

// Define the structure of your context, including loaders
export interface GraphQLContext {
  req: NextRequest;
  user: {
    id: string;
    role: RoleName;
    permissions: string[];
    tenants: Array<{ id: string; role: string; status: string }>;
  } | null;
  loaders: {
    sectionLoader: DataLoader<string, CMSSection[], string>;
    postsByBlogIdLoader: DataLoader<string, EnrichedBlogPost[], string>;
    orderItemsByOrderIdLoader: DataLoader<string, EnrichedOrderItem[], string>; // Added
    userByIdLoader: DataLoader<string, PublicUser | null, string>; // Added
  };
  // tenantId?: string | null;
}

// Helper function to get role by ID from database
async function getRoleById(roleId: string): Promise<string | null> {
  try {
    const role = await prisma.roleModel.findUnique({
      where: { id: roleId },
      select: { name: true }
    });
    return role?.name || null;
  } catch (error) {
    console.error('Error fetching role by ID:', error);
    return null;
  }
}

// Helper function to get user's current role from database
async function getUserRole(userId: string): Promise<string | null> {
  try {
    const user = await prisma.user.findUnique({
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
    console.error('Error fetching user role:', error);
    return null;
  }
}

const handler = startServerAndCreateNextHandler<NextRequest, GraphQLContext>(server, {
  context: async (req) => {
    const loaders = {
      sectionLoader: new DataLoader<string, CMSSection[], string>(
        (keys) => batchSectionsByPageIds(keys),
        { cacheKeyFn: (key: string) => key }
      ),
      postsByBlogIdLoader: new DataLoader<string, EnrichedBlogPost[], string>(
        (keys) => batchPostsByBlogIds(keys),
        { cacheKeyFn: (key: string) => key }
      ),
      orderItemsByOrderIdLoader: new DataLoader<string, EnrichedOrderItem[], string>( // New
        (keys) => batchOrderItemsByOrderIds(keys),
        { cacheKeyFn: (key: string) => key }
      ),
      userByIdLoader: new DataLoader<string, PublicUser | null, string>( // New
        (keys) => batchUsersByIds(keys),
        { cacheKeyFn: (key: string) => key }
      ),
    };

    const token = req.headers.get('authorization')?.split(' ')[1];
    let userContext = null;
    
    if (token) {
      try {
        const decoded = await verifyToken(token) as unknown as DecodedToken;
        
        // Try to get role from token first
        let userRoleName = decoded.role;
        
        console.log('Token decoded role:', userRoleName);
        console.log('Token decoded roleId:', decoded.roleId);
        console.log('Actual role:', userRoleName);
        
        // If role is undefined or invalid, try to get it from database
        if (!userRoleName || !['USER', 'ADMIN', 'MANAGER', 'EMPLOYEE', 'SUPER_ADMIN', 'STAFF'].includes(userRoleName)) {
          console.log('Role undefined or invalid, fetching from database...');
          
          // First try to get role by roleId if available
          if (decoded.roleId) {
            console.log('Trying to get role by roleId:', decoded.roleId);
            userRoleName = await getRoleById(decoded.roleId) as RoleName;
            console.log('Role from roleId:', userRoleName);
          }
          
          // If still no role, get user's current role from database
          if (!userRoleName) {
            console.log('Getting user role from database for userId:', decoded.userId);
            userRoleName = await getUserRole(decoded.userId) as RoleName;
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
          id: decoded.userId,
          role: userRoleName,
          permissions: resolvedPermissions,
          tenants: decoded.tenants || [],
        };
      } catch (error) {
        console.error('Error verifying token for GraphQL context:', error instanceof Error ? error.message : 'Unknown error');
      }
    }

    return {
      req,
      user: userContext,
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
