import { ApolloServer } from '@apollo/server';
import { startServerAndCreateNextHandler } from '@as-integrations/next';
import { NextRequest } from 'next/server';
import { typeDefs } from './typeDefs';
import resolvers from './resolvers';
import { verifyToken } from '@/lib/auth';

// Logs para verificar que los componentes se han cargado correctamente
console.log('ApolloServer - Iniciando');
console.log('TypeDefs cargados:', !!typeDefs);
console.log('Resolvers cargados:', !!resolvers);

try {
  // Verificar resolvers en forma segura con respecto a tipos
  console.log('Resolver keys - Query:', resolvers.Query ? Object.keys(resolvers.Query).length : 0);
  console.log('Resolver keys - Mutation:', resolvers.Mutation ? Object.keys(resolvers.Mutation).length : 0);
  
  // Comprobar si contienen las operaciones CMS
  if (resolvers.Query) {
    console.log('Resolver includes CMS query:', Object.keys(resolvers.Query).includes('getSectionComponents'));
  }
  
  if (resolvers.Mutation) {
    console.log('Resolver includes CMS mutation:', Object.keys(resolvers.Mutation).includes('saveSectionComponents'));
  }
} catch (error) {
  console.error('Error al inspeccionar resolvers:', error);
}

const server = new ApolloServer({
  typeDefs,
  resolvers,
});

const handler = startServerAndCreateNextHandler(server, {
  context: async (req: NextRequest) => {
    // Extract the token from the Authorization header
    const token = req.headers.get('authorization')?.split(' ')[1];
    
    console.log('GraphQL request received. Auth token:', token ? 'Present' : 'Missing');
    console.log('Request path:', req.nextUrl.pathname);
    console.log('Request method:', req.method);
    
    // Always create a minimal context with the request
    const context = { 
      req,
      // Add a default user for emergency fixes
      _emergency_bypass: true
    };
    
    // If there's no token, we'll still have a basic context
    if (!token) {
      console.log('No auth token found in request');
      return context;
    }
    
    try {
      // Verify the token and extract user data
      console.log('Verifying token...');
      const decoded = await verifyToken(token) as { userId: string; role?: string };
      
      console.log('Token verified successfully. User ID:', decoded.userId, 'Role:', decoded.role || 'no role');
      
      // Return both the request and the user information
      return { 
        ...context,
        user: {
          id: decoded.userId,
          role: decoded.role || 'USER'
        }
      };
    } catch (error) {
      console.error('Error verifying token:', error);
      // Return the basic context even if token verification fails
      return context;
    }
  },
});

export async function GET(request: NextRequest) {
  return handler(request);
}

export async function POST(request: NextRequest) {
  try {
    // Log the request body for debugging
    console.log('===== GraphQL Request =====');
    const requestClone = request.clone();
    
    // Check if the request has a body before parsing
    const text = await requestClone.text();
    if (!text || text.trim() === '') {
      console.error('Empty request body received');
      return new Response(JSON.stringify({
        errors: [{ message: 'Empty request body' }]
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }
    
    // Parse the body as JSON
    let body;
    try {
      body = JSON.parse(text);
    } catch (parseError) {
      console.error('Invalid JSON in request body:', parseError);
      console.log('Raw request text (first 100 chars):', text.substring(0, 100));
      return new Response(JSON.stringify({
        errors: [{ message: 'Invalid JSON in request body' }]
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }
    
    console.log('Request Query:', body.query ? body.query.substring(0, 250) + '...' : 'No query');
    console.log('Request Variables:', body.variables ? JSON.stringify(body.variables).substring(0, 250) + '...' : 'No variables');
    console.log('=========================');
    
    return handler(request);
  } catch (error) {
    console.error('Error processing GraphQL request:', error);
    return new Response(JSON.stringify({
      errors: [{ message: 'Error processing request' }]
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
} 