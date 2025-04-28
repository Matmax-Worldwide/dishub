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

export const timeEntryResolvers = {
  Query: {
    timeEntries: async (_parent: unknown, _args: unknown, context: { req: NextRequest }) => {
      try {
        const token = context.req.headers.get('authorization')?.split(' ')[1];
        
        if (!token) {
          throw new Error('Not authenticated');
        }

        const decoded = await verifyToken(token) as { userId: string };
        
        try {
          if (!prisma || !prisma.timeEntry) {
            console.error('Prisma client or timeEntry model is not available');
            return []; // Return empty array instead of throwing an error
          }
          
          const timeEntries = await prisma.timeEntry.findMany({
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
      } catch (error) {
        console.error('Get time entries error:', error);
        // Return empty array instead of throwing error
        return [];
      }
    },
    
    timeEntry: async (_parent: unknown, { id }: { id: string }, context: { req: NextRequest }) => {
      try {
        const token = context.req.headers.get('authorization')?.split(' ')[1];
        
        if (!token) {
          throw new Error('Not authenticated');
        }

        const decoded = await verifyToken(token) as { userId: string };
        
        const timeEntry = await prisma.timeEntry.findUnique({
          where: { 
            id,
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
        
        if (!timeEntry) {
          throw new Error('Time entry not found');
        }
        
        return timeEntry;
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
        
        try {
          // Check if Prisma client is available
          if (!prisma || !prisma.timeEntry) {
            console.error('Prisma client or timeEntry model is not available');
            throw new Error('Database connection error');
          }
          
          // If a project is specified, ensure it exists
          if (input.projectId) {
            const project = await prisma.project.findUnique({
              where: { id: input.projectId }
            });
            
            if (!project) {
              throw new Error('The specified project does not exist');
            }
          }
          
          const timeEntry = await prisma.timeEntry.create({
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
          
          return timeEntry;
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
        
        try {
          // Check if Prisma client is available
          if (!prisma || !prisma.timeEntry) {
            console.error('Prisma client or timeEntry model is not available');
            throw new Error('Database connection error');
          }
          
          // Make sure the time entry exists and belongs to the user
          const existingTimeEntry = await prisma.timeEntry.findUnique({
            where: { 
              id,
              userId: decoded.userId
            }
          });
          
          if (!existingTimeEntry) {
            throw new Error('Time entry not found or you do not have permission to update it');
          }
          
          // If a project is specified, ensure it exists
          if (input.projectId) {
            const project = await prisma.project.findUnique({
              where: { id: input.projectId }
            });
            
            if (!project) {
              throw new Error('The specified project does not exist');
            }
          }
          
          const updateData: Record<string, unknown> = {};
          
          // Only update fields that are provided
          if (input.date !== undefined) updateData.date = input.date;
          if (input.hours !== undefined) updateData.hours = input.hours;
          if (input.description !== undefined) updateData.description = input.description;
          if (input.projectId !== undefined) updateData.projectId = input.projectId;
          
          const updatedTimeEntry = await prisma.timeEntry.update({
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
        
        try {
          // Check if Prisma client is available
          if (!prisma || !prisma.timeEntry) {
            console.error('Prisma client or timeEntry model is not available');
            throw new Error('Database connection error');
          }
          
          // Ensure the time entry exists and belongs to the user
          const timeEntry = await prisma.timeEntry.findUnique({
            where: {
              id,
              userId: decoded.userId
            }
          });
          
          if (!timeEntry) {
            throw new Error('Time entry not found or you do not have permission to delete it');
          }
          
          await prisma.timeEntry.delete({
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