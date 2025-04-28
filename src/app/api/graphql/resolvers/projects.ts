import { NextRequest } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// Define input types for TypeScript
interface CreateProjectInput {
  name: string;
  description?: string;
  status?: 'ACTIVE' | 'COMPLETED' | 'ON_HOLD';
  clientId?: string;
}

interface UpdateProjectInput {
  name?: string;
  description?: string;
  status?: 'ACTIVE' | 'COMPLETED' | 'ON_HOLD';
  clientId?: string;
}

// Helper function to safely access prisma
const getPrismaClient = () => {
  if (!prisma) {
    console.error('Prisma client is not available');
    return null;
  }
  return prisma;
};

export const projectResolvers = {
  Query: {
    projects: async (_parent: unknown, _args: unknown, context: { req: NextRequest }) => {
      console.log('Projects resolver called');
      try {
        const token = context.req.headers.get('authorization')?.split(' ')[1];
        
        console.log('Projects resolver - token present:', !!token);
        
        if (!token) {
          console.log('Projects resolver - no token, returning empty array');
          return [];
        }

        try {
          const decoded = await verifyToken(token) as { userId: string };
          console.log('Projects resolver - token verified for user:', decoded.userId);
          
          const db = getPrismaClient();
          if (!db) {
            console.error('Projects resolver - database client not available');
            return [];
          }
          
          try {
            // Get all projects for the user
            const projects = await db.project.findMany({
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
            return projects;
          } catch (dbError) {
            console.error('Projects resolver - database error:', dbError);
            return [];
          }
        } catch (tokenError) {
          console.error('Projects resolver - token verification error:', tokenError);
          return [];
        }
      } catch (error) {
        console.error('Projects resolver - error:', error);
        return [];
      }
    },
    
    project: async (_parent: unknown, { id }: { id: string }, context: { req: NextRequest }) => {
      try {
        const token = context.req.headers.get('authorization')?.split(' ')[1];
        
        if (!token) {
          throw new Error('Not authenticated');
        }

        try {
          const decoded = await verifyToken(token) as { userId: string };
          
          const db = getPrismaClient();
          if (!db) {
            throw new Error('Database service is temporarily unavailable');
          }
          
          const project = await db.project.findUnique({
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
        } catch (dbError) {
          console.error('Database error in project query:', dbError);
          throw dbError;
        }
      } catch (error) {
        console.error('Get project error:', error);
        throw error;
      }
    }
  },
  
  Mutation: {
    createProject: async (_parent: unknown, { input }: { input: CreateProjectInput }, context: { req: NextRequest }) => {
      try {
        const token = context.req.headers.get('authorization')?.split(' ')[1];
        
        if (!token) {
          throw new Error('Not authenticated');
        }

        const decoded = await verifyToken(token) as { userId: string };
        
        const db = getPrismaClient();
        if (!db) {
          throw new Error('Database service is temporarily unavailable');
        }
        
        try {
          // Check if client exists if clientId is provided
          if (input.clientId) {
            const client = await db.client.findUnique({
              where: { id: input.clientId }
            });
            
            if (!client) {
              throw new Error('The specified client does not exist');
            }
            
            // Verify client belongs to user
            if (client.userId !== decoded.userId) {
              throw new Error('You do not have access to the specified client');
            }
          }
          
          const project = await db.project.create({
            data: {
              name: input.name,
              description: input.description || null,
              status: input.status || 'ACTIVE',
              clientId: input.clientId || null,
              userId: decoded.userId
            },
            include: {
              client: {
                select: {
                  id: true,
                  name: true
                }
              }
            }
          });
          
          return project;
        } catch (dbError) {
          console.error('Database error in createProject:', dbError);
          throw new Error(`Failed to create project: ${dbError instanceof Error ? dbError.message : 'Unknown error'}`);
        }
      } catch (error) {
        console.error('Create project error:', error);
        throw error;
      }
    },
    
    updateProject: async (_parent: unknown, { id, input }: { id: string, input: UpdateProjectInput }, context: { req: NextRequest }) => {
      try {
        const token = context.req.headers.get('authorization')?.split(' ')[1];
        
        if (!token) {
          throw new Error('Not authenticated');
        }

        const decoded = await verifyToken(token) as { userId: string };
        
        const db = getPrismaClient();
        if (!db) {
          throw new Error('Database service is temporarily unavailable');
        }
        
        try {
          // Make sure the project exists and belongs to the user
          const existingProject = await db.project.findUnique({
            where: { id }
          });
          
          if (!existingProject) {
            throw new Error('Project not found');
          }
          
          if (existingProject.userId !== decoded.userId) {
            throw new Error('You do not have permission to update this project');
          }
          
          // Check if client exists if clientId is provided
          if (input.clientId) {
            const client = await db.client.findUnique({
              where: { id: input.clientId }
            });
            
            if (!client) {
              throw new Error('The specified client does not exist');
            }
            
            // Verify client belongs to user
            if (client.userId !== decoded.userId) {
              throw new Error('You do not have access to the specified client');
            }
          }
          
          const updateData: Record<string, string | null> = {};
          
          // Only update fields that are provided
          if (input.name !== undefined) updateData.name = input.name;
          if (input.description !== undefined) updateData.description = input.description;
          if (input.status !== undefined) updateData.status = input.status;
          if (input.clientId !== undefined) updateData.clientId = input.clientId;
          
          const updatedProject = await db.project.update({
            where: { id },
            data: updateData,
            include: {
              client: {
                select: {
                  id: true,
                  name: true
                }
              }
            }
          });
          
          return updatedProject;
        } catch (dbError) {
          console.error('Database error in updateProject:', dbError);
          throw new Error(`Failed to update project: ${dbError instanceof Error ? dbError.message : 'Unknown error'}`);
        }
      } catch (error) {
        console.error('Update project error:', error);
        throw error;
      }
    },
    
    deleteProject: async (_parent: unknown, { id }: { id: string }, context: { req: NextRequest }) => {
      try {
        const token = context.req.headers.get('authorization')?.split(' ')[1];
        
        if (!token) {
          throw new Error('Not authenticated');
        }

        const decoded = await verifyToken(token) as { userId: string };
        
        const db = getPrismaClient();
        if (!db) {
          throw new Error('Database service is temporarily unavailable');
        }
        
        try {
          // Make sure the project exists and belongs to the user
          const existingProject = await db.project.findUnique({
            where: { id }
          });
          
          if (!existingProject) {
            throw new Error('Project not found');
          }
          
          if (existingProject.userId !== decoded.userId) {
            throw new Error('You do not have permission to delete this project');
          }
          
          await db.project.delete({
            where: { id }
          });
          
          return true;
        } catch (dbError) {
          console.error('Database error in deleteProject:', dbError);
          throw new Error(`Failed to delete project: ${dbError instanceof Error ? dbError.message : 'Unknown error'}`);
        }
      } catch (error) {
        console.error('Delete project error:', error);
        throw error;
      }
    }
  }
}; 