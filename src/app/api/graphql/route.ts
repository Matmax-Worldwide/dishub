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
  // Note: typeDefs and resolvers are now part of makeExecutableSchema,
  // so they are not passed directly to ApolloServer constructor here.
});

// Define a more specific type for the decoded token payload
interface DecodedToken {
  userId: string;
  role?: string;
  permissions?: string[]; // Crucial for hasPermission rules
  tenants?: Array<{ id: string; role: string; status: string }>; // For isTenantMember rules
  // Add any other fields your JWT might contain and rules might need
}

// Context function to provide necessary data to resolvers and shield rules
const handler = startServerAndCreateNextHandler(server, {
  context: async (req: NextRequest) => {
    const token = req.headers.get('authorization')?.split(' ')[1];
    
    // TODO: Implement robust tenantId extraction if needed for rules like isTenantMember
    // This could come from a subdomain, path, custom header, etc.
    // const currentTenantId = extractTenantIdFromRequest(req);

    const baseContext = {
      req,
      // tenantId: currentTenantId || null, // Make tenantId available
      user: null, // Initialize user as null for unauthenticated requests
    };
    
    if (!token) {
      // console.log('No auth token found. Proceeding with unauthenticated context.');
      return baseContext;
    }
    
    try {
      // Verify the token and cast to the more specific DecodedToken type
      const decoded = await verifyToken(token) as DecodedToken;

      // Populate user object in context, ensuring necessary fields for rules are present
      return { 
        ...baseContext,
        user: {
          id: decoded.userId,
          role: decoded.role || 'USER', // Provide a default role if none in token
          permissions: decoded.permissions || [], // Ensure permissions is an array
          tenants: decoded.tenants || [], // Ensure tenants is an array
          // ... other relevant user properties from token
        }
      };
    } catch (error) {
      // Log the error but don't expose details to client unless intended
      console.error('Error verifying token for GraphQL context:', error.message);
      // Return the base context (unauthenticated user) if token verification fails
      return baseContext;
    }
  },
});

// Standard Next.js API route handlers for GET and POST
export async function GET(request: NextRequest) {
  return handler(request);
}

export async function POST(request: NextRequest) {
  // Basic check for empty request body from original file
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
