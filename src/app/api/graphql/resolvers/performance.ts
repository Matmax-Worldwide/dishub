
import { verifyToken } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { GraphQLContext } from '../route';

// Define input types to avoid 'any'
interface CreatePerformanceInput {
  period: string;
  completedTasks: number;
  totalHours: number;
  efficiency?: number;
  notes?: string;
}

interface UpdatePerformanceInput {
  period?: string;
  completedTasks?: number;
  totalHours?: number;
  efficiency?: number;
  notes?: string;
}

export const performanceResolvers = {
  Query: {
    performances: async (_parent: unknown, _args: unknown, context: GraphQLContext) => {
      try {
        const token = context.req.headers.get('authorization')?.split(' ')[1];
        
        if (!token) {
          throw new Error('Not authenticated');
        }

        const decoded = await verifyToken(token) as { userId: string };
        
        const performances = await prisma.performance.findMany({
          where: { userId: decoded.userId },
          orderBy: { period: 'desc' },
          include: {
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
        
        return performances;
      } catch (error) {
        console.error('Get performances error:', error);
        throw error;
      }
    },
    
    performance: async (_parent: unknown, { id }: { id: string }, context: GraphQLContext) => {
      try {
        const token = context.req.headers.get('authorization')?.split(' ')[1];
        
        if (!token) {
          throw new Error('Not authenticated');
        }

        const decoded = await verifyToken(token) as { userId: string };
        
        const performance = await prisma.performance.findUnique({
          where: { 
            id,
            userId: decoded.userId
          },
          include: {
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
        
        if (!performance) {
          throw new Error('Performance record not found');
        }
        
        return performance;
      } catch (error) {
        console.error('Get performance error:', error);
        throw error;
      }
    },
    
    currentPerformance: async (_parent: unknown, _args: unknown, context: GraphQLContext) => {
      try {
        const token = context.req.headers.get('authorization')?.split(' ')[1];
        
        if (!token) {
          throw new Error('Not authenticated');
        }

        const decoded = await verifyToken(token) as { userId: string };
        
        // Get current month in YYYY-MM format
        const now = new Date();
        const currentPeriod = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        
        // Find performance record for current month
        let performance = await prisma.performance.findFirst({
          where: { 
            userId: decoded.userId,
            period: currentPeriod
          },
          include: {
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
        
        // If no current performance record exists, create one
        if (!performance) {
          // Count completed tasks for current month
          const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
          const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
          
          const completedTasks = await prisma.task.count({
            where: {
              assigneeId: decoded.userId,
              status: 'COMPLETED',
              updatedAt: {
                gte: startOfMonth,
                lte: endOfMonth
              }
            }
          });
          
          // Sum hours logged for current month
          const timeEntries = await prisma.timeEntry.findMany({
            where: {
              userId: decoded.userId,
              date: {
                gte: startOfMonth.toISOString(),
                lte: endOfMonth.toISOString()
              }
            }
          });
          
          const totalHours = timeEntries.reduce((sum: number, entry: { hours: number }) => sum + entry.hours, 0);
          
          // Create new performance record
          performance = await prisma.performance.create({
            data: {
              userId: decoded.userId,
              period: currentPeriod,
              completedTasks,
              totalHours,
              efficiency: completedTasks > 0 ? totalHours / completedTasks : 0,
              notes: '',
              tenantId: context.tenantId || ''
            },
            include: {
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
        }
        
        return performance;
      } catch (error) {
        console.error('Get current performance error:', error);
        throw error;
      }
    }
  },
  
  Mutation: {
    createPerformance: async (
      _parent: unknown, 
      { input }: { input: CreatePerformanceInput }, 
      context: GraphQLContext
    ) => {
      try {
        const token = context.req.headers.get('authorization')?.split(' ')[1];
        
        if (!token) {
          throw new Error('Not authenticated');
        }

        const decoded = await verifyToken(token) as { userId: string };
        
        // Check if a performance record already exists for this period
        const existingPerformance = await prisma.performance.findFirst({
          where: {
            userId: decoded.userId,
            period: input.period
          }
        });
        
        if (existingPerformance) {
          throw new Error(`A performance record already exists for period ${input.period}`);
        }
        
        const performance = await prisma.performance.create({
          data: {
            userId: decoded.userId,
            period: input.period,
            completedTasks: input.completedTasks,
            totalHours: input.totalHours,
            efficiency: input.efficiency || 0,
            notes: input.notes || '',
            tenantId: context.tenantId || ''
          },
          include: {
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
        
        return performance;
      } catch (error) {
        console.error('Create performance error:', error);
        throw error;
      }
    },
    
    updatePerformance: async (
      _parent: unknown, 
      { id, input }: { id: string, input: UpdatePerformanceInput }, 
      context: GraphQLContext
    ) => {
      try {
        const token = context.req.headers.get('authorization')?.split(' ')[1];
        
        if (!token) {
          throw new Error('Not authenticated');
        }

        const decoded = await verifyToken(token) as { userId: string };
        
        // Make sure the performance record exists and belongs to the user
        const existingPerformance = await prisma.performance.findUnique({
          where: { 
            id,
            userId: decoded.userId
          }
        });
        
        if (!existingPerformance) {
          throw new Error('Performance record not found or you do not have permission to update it');
        }
        
        const updateData: {
          period?: string;
          completedTasks?: number;
          totalHours?: number;
          efficiency?: number;
          notes?: string;
        } = {};
        
        // Only update fields that are provided
        if (input.period !== undefined) updateData.period = input.period;
        if (input.completedTasks !== undefined) updateData.completedTasks = input.completedTasks;
        if (input.totalHours !== undefined) updateData.totalHours = input.totalHours;
        if (input.efficiency !== undefined) updateData.efficiency = input.efficiency;
        if (input.notes !== undefined) updateData.notes = input.notes;
        
        const updatedPerformance = await prisma.performance.update({
          where: { id },
          data: updateData,
          include: {
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
        
        return updatedPerformance;
      } catch (error) {
        console.error('Update performance error:', error);
        throw error;
      }
    },
    
    deletePerformance: async (_parent: unknown, { id }: { id: string }, context: GraphQLContext) => {
      try {
        const token = context.req.headers.get('authorization')?.split(' ')[1];
        
        if (!token) {
          throw new Error('Not authenticated');
        }

        const decoded = await verifyToken(token) as { userId: string };
        
        // Make sure the performance record exists and belongs to the user
        const existingPerformance = await prisma.performance.findUnique({
          where: { 
            id,
            userId: decoded.userId
          }
        });
        
        if (!existingPerformance) {
          throw new Error('Performance record not found or you do not have permission to delete it');
        }
        
        await prisma.performance.delete({
          where: { id }
        });
        
        return true;
      } catch (error) {
        console.error('Delete performance error:', error);
        return false;
      }
    }
  }
}; 