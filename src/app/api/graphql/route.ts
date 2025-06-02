import { ApolloServer } from '@apollo/server';
import { startServerAndCreateNextHandler } from '@as-integrations/next';
import { NextRequest } from 'next/server';
import { typeDefs } from './typeDefs'; // Assuming typeDefs.ts is in the same directory
import resolvers from './resolvers'; // Assuming resolvers.ts is in the same directory
import { verifyToken } from '@/lib/auth'; // Path to existing auth helper

// Imports for graphql-shield
import { makeExecutableSchema } from '@graphql-tools/schema';
import { applyMiddleware } from 'graphql-middleware';
import { permissionsShield } from './authorization'; // Path to the shield setup

// Import for role-based permissions
import { getPermissionsForRole, RoleName } from '@/config/rolePermissions'; // Adjusted path

// Create the base schema from type definitions and resolvers
const baseSchema = makeExecutableSchema({
  typeDefs,
  resolvers,
});

// Apply the shield middleware to the schema
const schemaWithPermissions = applyMiddleware(baseSchema, permissionsShield);

// Initialize ApolloServer with the new schema that includes permissions
const server = new ApolloServer({
  schema: schemaWithPermissions,
});

// Define a more specific type for the decoded token payload
interface DecodedToken {
  userId: string;
  role?: RoleName; // Use RoleName type
  // permissions array from token is removed, as it will be derived from role.
  tenants?: Array<{ id: string; role: string; status: string }>; 
}

// Context function to provide necessary data to resolvers and shield rules
const handler = startServerAndCreateNextHandler(server, {
  context: async (req: NextRequest) => {
    const token = req.headers.get('authorization')?.split(' ')[1];
    
    const baseContext = { 
      req,
      user: null, 
    };
    
    if (!token) {
      return baseContext;
    }
    
    try {
      const decoded = await verifyToken(token) as DecodedToken;
      const userRoleName = decoded.role || 'USER'; // Default to 'USER' role
      const resolvedPermissions = getPermissionsForRole(userRoleName);

      return { 
        ...baseContext,
        user: {
          id: decoded.userId,
          role: userRoleName,
          permissions: resolvedPermissions, // Use permissions derived from role
          tenants: decoded.tenants || [], 
        }
      };
    } catch (error) {
      console.error('Error verifying token for GraphQL context:', error.message);
      return baseContext;
    }
  },
});

// Standard Next.js API route handlers for GET and POST
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
