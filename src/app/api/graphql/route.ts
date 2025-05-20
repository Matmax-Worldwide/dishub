import { ApolloServer } from '@apollo/server';
import { startServerAndCreateNextHandler } from '@as-integrations/next';
import { NextRequest } from 'next/server';
import { typeDefs } from './typeDefs';
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
      const decoded = await verifyToken(token) as { userId: string; role?: string };

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
    const requestClone = request.clone();
    
    // Check if the request has a body before parsing
    const text = await requestClone.text();
    if (!text || text.trim() === '') {
      return new Response(JSON.stringify({
        errors: [{ message: 'Empty request body' }]
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }
    


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