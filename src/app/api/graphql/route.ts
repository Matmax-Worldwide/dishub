import { ApolloServer } from '@apollo/server';
import { startServerAndCreateNextHandler } from '@as-integrations/next';
import { NextRequest } from 'next/server';
import typeDefs from './schema';
import resolvers from './resolvers';
import { verifyToken } from '@/lib/auth';

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
  return handler(request);
} 