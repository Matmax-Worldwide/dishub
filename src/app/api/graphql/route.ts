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
    
    // If there's no token, return just the request
    if (!token) {
      return { req };
    }
    
    try {
      // Verify the token and extract user data
      const decoded = await verifyToken(token) as { userId: string; role?: string };
      
      // Return both the request and the user information
      return { 
        req,
        user: {
          id: decoded.userId,
          role: decoded.role || 'USER'
        }
      };
    } catch (error) {
      console.error('Error verifying token:', error);
      // If token verification fails, return just the request
      return { req };
    }
  },
});

export async function GET(request: NextRequest) {
  return handler(request);
}

export async function POST(request: NextRequest) {
  return handler(request);
} 