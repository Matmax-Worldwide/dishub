import { NextRequest } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// Define input types for TypeScript
interface CreateTimeEntryInput {
  date: string;
  hours: number;
  description: string;
  projectId?: string;
}

interface UpdateTimeEntryInput {
  date?: string;
  hours?: number;
  description?: string;
  projectId?: string;
}

// Helper function to safely access prisma
const getPrismaClient = () => {
  console.log('getPrismaClient called, prisma is:', prisma ? 'defined' : 'undefined');
  
  if (!prisma) {
    console.error('Prisma client is not available');
    return null;
  }
  
  // Check if timeEntry model exists
  console.log('Prisma models available:', Object.keys(prisma).filter(key => !key.startsWith('_')));
  console.log('timeEntry model is:', prisma.timeEntry ? 'defined' : 'undefined');
  
  if (!prisma.timeEntry) {
    console.error('Prisma timeEntry model is not available');
    return null;
  }
  
  return prisma;
};

export const timeEntryResolvers = {
  Query: {
    timeEntries: async (_parent: unknown, _args: unknown, context: { req: NextRequest }) => {
      try {
        const token = context.req.headers.get('authorization')?.split(' ')[1];
        
        if (!token) {
          console.log('No authentication token provided');
          return [];
        }

        try {
          const decoded = await verifyToken(token) as { userId: string };
          const db = getPrismaClient();
          
          if (!db) {
            console.error('Database client unavailable');
            return [];
          }
          
          try {
            const timeEntries = await db.timeEntry.findMany({
              where: { userId: decoded.userId },
              orderBy: { date: 'desc' },
              include: {
                project: true,
                user: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true
                  }
                }
              }
            });
            
            return timeEntries;
          } catch (dbError) {
            console.error('Database error in timeEntries query:', dbError);
            return []; // Return empty array on database error
          }
        } catch (tokenError) {
          console.error('Token verification error:', tokenError);
          return [];
        }
      } catch (error) {
        console.error('Get time entries error:', error);
        return [];
      }
    },
    
    timeEntry: async (_parent: unknown, { id }: { id: string }, context: { req: NextRequest }) => {
      try {
        const token = context.req.headers.get('authorization')?.split(' ')[1];
        
        if (!token) {
          console.log('No authentication token provided');
          return null;
        }

        try {
          const decoded = await verifyToken(token) as { userId: string };
          const db = getPrismaClient();
          
          if (!db) {
            console.error('Database client unavailable');
            return null;
          }
          
          try {
            const timeEntry = await db.timeEntry.findUnique({
              where: { 
                id
              },
              include: {
                project: true,
                user: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true
                  }
                }
              }
            });
            
            // Check if entry belongs to user
            if (!timeEntry || timeEntry.userId !== decoded.userId) {
              console.log('Time entry not found or not accessible by user');
              return null;
            }
            
            return timeEntry;
          } catch (dbError) {
            console.error('Database error fetching time entry:', dbError);
            return null;
          }
        } catch (tokenError) {
          console.error('Token verification error:', tokenError);
          return null;
        }
      } catch (error) {
        console.error('Get time entry error:', error);
        return null;
      }
    }
  },
  
  Mutation: {
    createTimeEntry: async (_parent: unknown, { input }: { input: CreateTimeEntryInput }, context: { req: NextRequest }) => {
      try {
        const token = context.req.headers.get('authorization')?.split(' ')[1];
        
        if (!token) {
          throw new Error('Not authenticated');
        }


        const decoded = await verifyToken(token) as { userId: string };
        console.log('createTimeEntry: Token verified for user:', decoded.userId);
        
        console.log('createTimeEntry: Getting Prisma client...');
        const db = getPrismaClient();
        
        if (!db) {
          console.error('createTimeEntry: Database client unavailable');
          throw new Error('Database service is temporarily unavailable. Please try again later.');
        }
        
        console.log('createTimeEntry: Prisma client obtained successfully');
        
        try {
          // If a project is specified, ensure it exists
          if (input.projectId) {
            console.log('createTimeEntry: Checking project:', input.projectId);
            try {
              const project = await db.project.findUnique({
                where: { id: input.projectId }
              });
              
              if (!project) {
                throw new Error('The specified project does not exist');
              }
              
              // Verify project belongs to user
              if (project.userId !== decoded.userId) {
                throw new Error('You do not have access to the specified project');
              }
              
              console.log('createTimeEntry: Project validation successful');
            } catch (projectError) {
              console.error('createTimeEntry: Project validation error:', projectError);
              throw new Error(`Project validation failed: ${projectError instanceof Error ? projectError.message : 'Unknown error'}`);
            }
          }
          
          console.log('createTimeEntry: Creating time entry with data:', { 
            date: input.date,
            hours: input.hours,
            description: input.description ? input.description.substring(0, 20) + '...' : 'empty',
            projectId: input.projectId || 'none',
            userId: decoded.userId
          });
          
          console.log('createTimeEntry: Confirming db.timeEntry exists before calling create:', !!db.timeEntry);
          
          // Wrap in try-catch to get detailed info if create fails
          try {
            const timeEntry = await db.timeEntry.create({
              data: {
                date: input.date,
                hours: input.hours,
                description: input.description,
                projectId: input.projectId || null,
                userId: decoded.userId
              },
              include: {
                project: true,
                user: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true
                  }
                }
              }
            });
            
            console.log('createTimeEntry: Time entry created successfully with ID:', timeEntry.id);
            return timeEntry;
          } catch (createError) {
            console.error('createTimeEntry: Create operation failed:', createError);
            console.error('createTimeEntry: Create error details:', JSON.stringify(createError));
            throw new Error(`Database operation failed: ${createError instanceof Error ? createError.message : 'Unknown error'}`);
          }
        } catch (dbError: unknown) {
          console.error('Database error in createTimeEntry:', dbError);
          throw new Error(`Failed to create time entry: ${dbError instanceof Error ? dbError.message : 'Unknown error'}`);
        }
      } catch (error) {
        console.error('Create time entry error:', error);
        throw error;
      }
    },
    
    updateTimeEntry: async (_parent: unknown, { id, input }: { id: string, input: UpdateTimeEntryInput }, context: { req: NextRequest }) => {
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
          // Make sure the time entry exists and belongs to the user
          const existingTimeEntry = await db.timeEntry.findUnique({
            where: { id }
          });
          
          if (!existingTimeEntry) {
            throw new Error('Time entry not found');
          }
          
          if (existingTimeEntry.userId !== decoded.userId) {
            throw new Error('You do not have permission to update this time entry');
          }
          
          // If a project is specified, ensure it exists
          if (input.projectId) {
            const project = await db.project.findUnique({
              where: { id: input.projectId }
            });
            
            if (!project) {
              throw new Error('The specified project does not exist');
            }
            
            // Verify project belongs to user
            if (project.userId !== decoded.userId) {
              throw new Error('You do not have access to the specified project');
            }
          }
          
          const updateData: Record<string, unknown> = {};
          
          // Only update fields that are provided
          if (input.date !== undefined) updateData.date = input.date;
          if (input.hours !== undefined) updateData.hours = input.hours;
          if (input.description !== undefined) updateData.description = input.description;
          if (input.projectId !== undefined) updateData.projectId = input.projectId;
          
          const updatedTimeEntry = await db.timeEntry.update({
            where: { id },
            data: updateData,
            include: {
              project: true,
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true
                }
              }
            }
          });
          
          return updatedTimeEntry;
        } catch (dbError: unknown) {
          console.error('Database error in updateTimeEntry:', dbError);
          throw new Error(`Failed to update time entry: ${dbError instanceof Error ? dbError.message : 'Unknown error'}`);
        }
      } catch (error) {
        console.error('Update time entry error:', error);
        throw error;
      }
    },
    
    deleteTimeEntry: async (_parent: unknown, { id }: { id: string }, context: { req: NextRequest }) => {
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
          // Make sure the time entry exists and belongs to the user
          const existingTimeEntry = await db.timeEntry.findUnique({
            where: { id }
          });
          
          if (!existingTimeEntry) {
            throw new Error('Time entry not found');
          }
          
          if (existingTimeEntry.userId !== decoded.userId) {
            throw new Error('You do not have permission to delete this time entry');
          }
          
          await db.timeEntry.delete({
            where: { id }
          });
          
          return true;
        } catch (dbError: unknown) {
          console.error('Database error in deleteTimeEntry:', dbError);
          throw new Error(`Failed to delete time entry: ${dbError instanceof Error ? dbError.message : 'Unknown error'}`);
        }
      } catch (error) {
        console.error('Delete time entry error:', error);
        throw error;
      }
    }
  }
}; 