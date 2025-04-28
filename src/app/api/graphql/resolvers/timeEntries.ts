import { NextRequest } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const timeEntryResolvers = {
  Query: {
    timeEntries: async (_parent: unknown, _args: unknown, context: { req: NextRequest }) => {
      try {
        const token = context.req.headers.get('authorization')?.split(' ')[1];
        
        if (!token) {
          throw new Error('Not authenticated');
        }

        const decoded = await verifyToken(token) as { userId: string };
        
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
      } catch (error) {
        console.error('Get time entries error:', error);
        throw error;
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
        throw error;
      }
    }
  },
  
  Mutation: {
    createTimeEntry: async (_parent: unknown, { input }: { input: any }, context: { req: NextRequest }) => {
      try {
        const token = context.req.headers.get('authorization')?.split(' ')[1];
        
        if (!token) {
          throw new Error('Not authenticated');
        }

        const decoded = await verifyToken(token) as { userId: string };
        
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
      } catch (error) {
        console.error('Create time entry error:', error);
        throw error;
      }
    },
    
    updateTimeEntry: async (_parent: unknown, { id, input }: { id: string, input: any }, context: { req: NextRequest }) => {
      try {
        const token = context.req.headers.get('authorization')?.split(' ')[1];
        
        if (!token) {
          throw new Error('Not authenticated');
        }

        const decoded = await verifyToken(token) as { userId: string };
        
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
        
        const updateData: any = {};
        
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
        
        // Make sure the time entry exists and belongs to the user
        const existingTimeEntry = await prisma.timeEntry.findUnique({
          where: { 
            id,
            userId: decoded.userId
          }
        });
        
        if (!existingTimeEntry) {
          throw new Error('Time entry not found or you do not have permission to delete it');
        }
        
        await prisma.timeEntry.delete({
          where: { id }
        });
        
        return true;
      } catch (error) {
        console.error('Delete time entry error:', error);
        return false;
      }
    }
  }
}; 