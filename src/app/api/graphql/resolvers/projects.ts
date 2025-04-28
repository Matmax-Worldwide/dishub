import { NextRequest } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const projectResolvers = {
  Query: {
    projects: async (_parent: unknown, _args: unknown, context: { req: NextRequest }) => {
      console.log('Projects resolver called');
      try {
        const token = context.req.headers.get('authorization')?.split(' ')[1];
        
        console.log('Projects resolver - token present:', !!token);
        
        if (!token) {
          console.log('Projects resolver - no token, returning empty array');
          // Return an empty array instead of null when not authenticated
          return [];
        }

        try {
          const decoded = await verifyToken(token) as { userId: string };
          console.log('Projects resolver - token verified for user:', decoded.userId);
          
          // Get all projects for the user
          const projects = await prisma.project.findMany({
            where: {
              userId: decoded.userId
            },
            select: {
              id: true,
              name: true,
              description: true,
              status: true,
              clientId: true,
              client: {
                select: {
                  id: true,
                  name: true
                }
              },
              createdAt: true,
              updatedAt: true
            },
            orderBy: {
              name: 'asc'
            }
          });
          
          console.log(`Projects resolver - found ${projects.length} projects`);
          return projects || []; // Ensure we always return an array
        } catch (tokenError) {
          console.error('Projects resolver - token verification error:', tokenError);
          // Return empty array instead of null when token is invalid
          return [];
        }
      } catch (error) {
        console.error('Projects resolver - error:', error);
        // Return empty array instead of null on error
        return [];
      }
    },
    
    project: async (_parent: unknown, { id }: { id: string }, context: { req: NextRequest }) => {
      try {
        const token = context.req.headers.get('authorization')?.split(' ')[1];
        
        if (!token) {
          throw new Error('Not authenticated');
        }

        const decoded = await verifyToken(token) as { userId: string };
        
        const project = await prisma.project.findUnique({
          where: { id },
          include: {
            client: {
              select: {
                id: true,
                name: true
              }
            }
          }
        });
        
        if (!project) {
          throw new Error(`Project with ID ${id} not found`);
        }
        
        // Check if the user is authorized to view this project
        if (project.userId !== decoded.userId) {
          throw new Error('Not authorized to view this project');
        }
        
        return project;
      } catch (error) {
        console.error('Get project error:', error);
        throw error;
      }
    }
  }
}; 