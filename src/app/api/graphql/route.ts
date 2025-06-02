import { ApolloServer } from '@apollo/server';
import { startServerAndCreateNextHandler } from '@as-integrations/next';
import { NextRequest } from 'next/server';
import { typeDefs } from './typeDefs'; 
import resolvers from './resolvers'; 
import { verifyToken } from '@/lib/auth'; 

// Imports for graphql-shield
import { makeExecutableSchema } from '@graphql-tools/schema';
import { applyMiddleware } from 'graphql-middleware';
import { permissionsShield } from './authorization'; 

// Import for role-based permissions
import { getPermissionsForRole, RoleName } from '@/config/rolePermissions'; 

// Imports for DataLoader
import DataLoader from 'dataloader';
import { batchSectionsByPageIds } from './dataloaders/sectionLoader'; // Path relative to route.ts
import { CMSSection } from '@prisma/client'; // For DataLoader typing

// Create the base schema
const baseSchema = makeExecutableSchema({
  typeDefs,
  resolvers,
});

// Apply the shield middleware
const schemaWithPermissions = applyMiddleware(baseSchema, permissionsShield);

// Initialize ApolloServer
const server = new ApolloServer({
  schema: schemaWithPermissions,
});

// Define DecodedToken interface
interface DecodedToken {
  userId: string;
  role?: RoleName; 
  tenants?: Array<{ id: string; role: string; status: string }>; 
}

// Define the structure of your context, including loaders
// This would ideally be in a types.ts file and imported.
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
    // userLoader?: DataLoader<string, User, string>; // Example for another loader
  };
  // tenantId?: string | null; // Example if you add tenantId to context
}


const handler = startServerAndCreateNextHandler<NextRequest, GraphQLContext>(server, { // Specify GraphQLContext
  context: async (req) => {
    // Initialize loaders for each request for request-scoped caching
    const loaders = {
      sectionLoader: new DataLoader<string, CMSSection[], string>(
        (keys) => batchSectionsByPageIds(keys), 
        { cacheKeyFn: (key: string) => key }
      ),
      // userLoader: new DataLoader(...) // etc.
    };

    const token = req.headers.get('authorization')?.split(' ')[1];
    
    // Base context structure for unauthenticated user
    let userContext = null;
    
    if (token) {
      try {
        const decoded = await verifyToken(token) as DecodedToken;
        const userRoleName = decoded.role || 'USER'; 
        const resolvedPermissions = getPermissionsForRole(userRoleName);

        userContext = {
          id: decoded.userId,
          role: userRoleName,
          permissions: resolvedPermissions, 
          tenants: decoded.tenants || [], 
        };
      } catch (error) {
        console.error('Error verifying token for GraphQL context:', error.message);
        // User remains null if token is invalid
      }
    }
    
    return { 
      req,
      user: userContext,
      loaders, // Add loaders to the context
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
