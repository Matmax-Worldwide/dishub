import { NextRequest } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// Define input types to avoid 'any'
interface CreateTaskInput {
  title: string;
  description?: string;
  dueDate?: string;
  status?: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  priority?: number;
  projectId?: string;
}

interface UpdateTaskInput {
  title?: string;
  description?: string;
  dueDate?: string;
  status?: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  priority?: number;
  projectId?: string;
}

export const taskResolvers = {
  Query: {
    tasks: async (_parent: unknown, _args: unknown, context: { req: NextRequest }) => {
      try {
        const token = context.req.headers.get('authorization')?.split(' ')[1];
        
        if (!token) {
          throw new Error('Not authenticated');
        }

        const decoded = await verifyToken(token) as { userId: string };
        
        // Get all tasks where the user is the creator or assignee
        const tasks = await prisma.task.findMany({
          where: {
            OR: [
              { creatorId: decoded.userId },
              { assigneeId: decoded.userId }
            ]
          },
          include: {
            project: {
              select: {
                id: true,
                name: true
              }
            }
          },
          orderBy: [
            { dueDate: 'asc' },
            { createdAt: 'desc' }
          ]
        });
        
        return tasks;
      } catch (error) {
        console.error('Get tasks error:', error);
        throw error;
      }
    },
    
    task: async (_parent: unknown, { id }: { id: string }, context: { req: NextRequest }) => {
      try {
        const token = context.req.headers.get('authorization')?.split(' ')[1];
        
        if (!token) {
          throw new Error('Not authenticated');
        }

        const decoded = await verifyToken(token) as { userId: string };
        
        const task = await prisma.task.findUnique({
          where: { id },
          include: {
            project: {
              select: {
                id: true,
                name: true
              }
            }
          }
        });
        
        if (!task) {
          throw new Error(`Task with ID ${id} not found`);
        }
        
        // Check if the user is authorized to view this task
        if (task.creatorId !== decoded.userId && task.assigneeId !== decoded.userId) {
          throw new Error('Not authorized to view this task');
        }
        
        return task;
      } catch (error) {
        console.error('Get task error:', error);
        throw error;
      }
    }
  },
  
  Mutation: {
    createTask: async (
      _parent: unknown, 
      { input }: { input: CreateTaskInput }, 
      context: { req: NextRequest }
    ) => {
      try {
        const token = context.req.headers.get('authorization')?.split(' ')[1];
        
        if (!token) {
          throw new Error('Not authenticated');
        }

        const decoded = await verifyToken(token) as { userId: string };
        
        // For simplicity, the creator is also the assignee
        const task = await prisma.task.create({
          data: {
            title: input.title,
            description: input.description,
            status: input.status || 'NOT_STARTED',
            dueDate: input.dueDate ? new Date(input.dueDate) : undefined,
            priority: input.priority || 1,
            projectId: input.projectId,
            creatorId: decoded.userId,
            assigneeId: decoded.userId, // Self-assigned task
          },
          include: {
            project: {
              select: {
                id: true,
                name: true
              }
            }
          }
        });
        
        return task;
      } catch (error) {
        console.error('Create task error:', error);
        throw error;
      }
    },
    
    updateTask: async (
      _parent: unknown, 
      { id, input }: { id: string; input: UpdateTaskInput }, 
      context: { req: NextRequest }
    ) => {
      try {
        const token = context.req.headers.get('authorization')?.split(' ')[1];
        
        if (!token) {
          throw new Error('Not authenticated');
        }

        const decoded = await verifyToken(token) as { userId: string };
        
        // Check if the task exists and user has permission
        const existingTask = await prisma.task.findUnique({
          where: { id }
        });
        
        if (!existingTask) {
          throw new Error(`Task with ID ${id} not found`);
        }
        
        // Check if the user is authorized to update this task
        if (existingTask.creatorId !== decoded.userId && existingTask.assigneeId !== decoded.userId) {
          throw new Error('Not authorized to update this task');
        }
        
        const task = await prisma.task.update({
          where: { id },
          data: {
            title: input.title,
            description: input.description,
            status: input.status,
            dueDate: input.dueDate ? new Date(input.dueDate) : undefined,
            priority: input.priority,
            projectId: input.projectId,
          },
          include: {
            project: {
              select: {
                id: true,
                name: true
              }
            }
          }
        });
        
        // If task was completed, create a notification
        if (input.status === 'COMPLETED' && existingTask.status !== 'COMPLETED') {
          await prisma.notification.create({
            data: {
              userId: decoded.userId,
              type: 'TASK',
              title: 'Task Completed',
              message: `You marked "${task.title}" as completed`,
              relatedItemId: task.id,
              relatedItemType: 'TASK',
            }
          });
        }
        
        return task;
      } catch (error) {
        console.error('Update task error:', error);
        throw error;
      }
    },
    
    deleteTask: async (
      _parent: unknown, 
      { id }: { id: string }, 
      context: { req: NextRequest }
    ) => {
      try {
        const token = context.req.headers.get('authorization')?.split(' ')[1];
        
        if (!token) {
          throw new Error('Not authenticated');
        }

        const decoded = await verifyToken(token) as { userId: string };
        
        // Check if the task exists and user has permission
        const existingTask = await prisma.task.findUnique({
          where: { id }
        });
        
        if (!existingTask) {
          throw new Error(`Task with ID ${id} not found`);
        }
        
        // Check if the user is authorized to delete this task
        if (existingTask.creatorId !== decoded.userId) {
          throw new Error('Not authorized to delete this task');
        }
        
        await prisma.task.delete({
          where: { id }
        });
        
        return true;
      } catch (error) {
        console.error('Delete task error:', error);
        throw error;
      }
    },
  }
}; 