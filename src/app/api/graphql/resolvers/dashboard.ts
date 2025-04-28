import { NextRequest } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dashboardResolvers = {
  Query: {
    dashboardStats: async (_parent: unknown, _args: unknown, context: { req: NextRequest }) => {
      try {
        const token = context.req.headers.get('authorization')?.split(' ')[1];
        
        // If no token, return default values instead of throwing an error
        if (!token) {
          console.log('No authentication token found, returning default dashboard stats');
          return {
            totalDocuments: 0,
            documentsThisMonth: 0,
            totalAppointments: 0,
            appointmentsThisWeek: 0,
            completedTasks: 0,
            pendingTasks: 0,
            totalHoursLogged: 0,
            hoursLoggedThisWeek: 0
          };
        }

        try {
          const decoded = await verifyToken(token) as { userId: string; role?: string };
          if (!decoded || !decoded.userId) {
            throw new Error('Invalid token payload');
          }
          
          // Get current date information for filtering
          const now = new Date();
          const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
          const startOfWeek = new Date(now);
          startOfWeek.setDate(now.getDate() - now.getDay()); // Start of the current week (Sunday)
          
          // Total documents and documents this month
          const totalDocuments = await prisma.document.count({
            where: { userId: decoded.userId }
          });
          
          const documentsThisMonth = await prisma.document.count({
            where: { 
              userId: decoded.userId,
              createdAt: { gte: startOfMonth }
            }
          });
          
          // Total appointments and appointments this week
          const totalAppointments = await prisma.appointment.count({
            where: { userId: decoded.userId }
          });
          
          const appointmentsThisWeek = await prisma.appointment.count({
            where: {
              userId: decoded.userId,
              startTime: { gte: startOfWeek }
            }
          });
          
          // Tasks - completed and pending
          const completedTasks = await prisma.task.count({
            where: {
              assigneeId: decoded.userId,
              status: 'COMPLETED'
            }
          });
          
          const pendingTasks = await prisma.task.count({
            where: {
              assigneeId: decoded.userId,
              status: { not: 'COMPLETED' }
            }
          });
          
          // Time entries - total and this week
          const timeEntries = await prisma.timeEntry.findMany({
            where: { userId: decoded.userId }
          });
          
          const totalHoursLogged = timeEntries.reduce((total: number, entry: { hours: number }) => total + entry.hours, 0);
          
          const timeEntriesThisWeek = await prisma.timeEntry.findMany({
            where: {
              userId: decoded.userId,
              date: { gte: startOfWeek }
            }
          });
          
          const hoursLoggedThisWeek = timeEntriesThisWeek.reduce((total: number, entry: { hours: number }) => total + entry.hours, 0);
          
          return {
            totalDocuments,
            documentsThisMonth,
            totalAppointments,
            appointmentsThisWeek,
            completedTasks,
            pendingTasks,
            totalHoursLogged,
            hoursLoggedThisWeek
          };
        } catch (tokenError) {
          // If token verification fails, return default values
          console.error('Token verification error:', tokenError);
          return {
            totalDocuments: 0,
            documentsThisMonth: 0,
            totalAppointments: 0,
            appointmentsThisWeek: 0,
            completedTasks: 0,
            pendingTasks: 0,
            totalHoursLogged: 0,
            hoursLoggedThisWeek: 0
          };
        }
      } catch (error) {
        console.error('Dashboard stats error:', error);
        // Always return a valid DashboardStats object to satisfy the non-nullable requirement
        return {
          totalDocuments: 0,
          documentsThisMonth: 0,
          totalAppointments: 0,
          appointmentsThisWeek: 0,
          completedTasks: 0,
          pendingTasks: 0,
          totalHoursLogged: 0,
          hoursLoggedThisWeek: 0
        };
      }
    },
    
    documentsByStatus: async (_parent: unknown, _args: unknown, context: { req: NextRequest }) => {
      try {
        const token = context.req.headers.get('authorization')?.split(' ')[1];
        
        // If no token, return default values instead of throwing an error
        if (!token) {
          console.log('No authentication token found, returning default document status data');
          return [
            { status: 'DRAFT', count: 0 },
            { status: 'PENDING_REVIEW', count: 0 },
            { status: 'APPROVED', count: 0 },
            { status: 'REJECTED', count: 0 }
          ];
        }

        try {
          const decoded = await verifyToken(token) as { userId: string };
          
          // Get documents grouped by status
          const documents = await prisma.document.groupBy({
            by: ['status'],
            _count: {
              status: true
            },
            where: { userId: decoded.userId }
          });
          
          // Format the results to match the expected schema
          return documents.map((doc: { status: string; _count: { status: number } }) => ({
            status: doc.status,
            count: doc._count.status
          }));
        } catch (tokenError) {
          console.error('Token verification error:', tokenError);
          return [
            { status: 'DRAFT', count: 0 },
            { status: 'PENDING_REVIEW', count: 0 },
            { status: 'APPROVED', count: 0 },
            { status: 'REJECTED', count: 0 }
          ];
        }
      } catch (error) {
        console.error('Documents by status error:', error);
        return [
          { status: 'DRAFT', count: 0 },
          { status: 'PENDING_REVIEW', count: 0 },
          { status: 'APPROVED', count: 0 },
          { status: 'REJECTED', count: 0 }
        ];
      }
    },
    
    timeEntriesByDay: async (_parent: unknown, _args: unknown, context: { req: NextRequest }) => {
      try {
        const token = context.req.headers.get('authorization')?.split(' ')[1];
        
        // If no token, return default values instead of throwing an error
        if (!token) {
          console.log('No authentication token found, returning default time entries data');
          const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
          return dayNames.map(day => ({ day, hours: 0 }));
        }

        try {
          const decoded = await verifyToken(token) as { userId: string };
          
          // Get current date information for filtering
          const now = new Date();
          const startOfWeek = new Date(now);
          startOfWeek.setDate(now.getDate() - now.getDay()); // Start of current week (Sunday)
          
          // Get time entries for the current week
          const timeEntries = await prisma.timeEntry.findMany({
            where: {
              userId: decoded.userId,
              date: { gte: startOfWeek }
            }
          });
          
          // Group time entries by day
          const entriesByDay = new Map();
          const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
          
          // Initialize all days with 0 hours
          dayNames.forEach(day => {
            entriesByDay.set(day, 0);
          });
          
          // Add hours for each time entry
          timeEntries.forEach((entry: { date: string | Date; hours: number }) => {
            const date = new Date(entry.date);
            const dayName = dayNames[date.getDay()];
            entriesByDay.set(dayName, (entriesByDay.get(dayName) || 0) + entry.hours);
          });
          
          // Convert to the expected format
          return Array.from(entriesByDay).map(([day, hours]) => ({
            day,
            hours
          }));
        } catch (tokenError) {
          console.error('Token verification error:', tokenError);
          const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
          return dayNames.map(day => ({ day, hours: 0 }));
        }
      } catch (error) {
        console.error('Time entries by day error:', error);
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        return dayNames.map(day => ({ day, hours: 0 }));
      }
    },
    
    tasksByStatus: async (_parent: unknown, _args: unknown, context: { req: NextRequest }) => {
      try {
        const token = context.req.headers.get('authorization')?.split(' ')[1];
        
        // If no token, return default values instead of throwing an error
        if (!token) {
          console.log('No authentication token found, returning default task status data');
          return [
            { status: 'NOT_STARTED', count: 0 },
            { status: 'IN_PROGRESS', count: 0 },
            { status: 'COMPLETED', count: 0 },
            { status: 'CANCELLED', count: 0 }
          ];
        }

        try {
          const decoded = await verifyToken(token) as { userId: string };
          
          // Get tasks grouped by status
          const tasks = await prisma.task.groupBy({
            by: ['status'],
            _count: {
              status: true
            },
            where: { assigneeId: decoded.userId }
          });
          
          // Format the results to match the expected schema
          return tasks.map((task: { status: string; _count: { status: number } }) => ({
            status: task.status,
            count: task._count.status
          }));
        } catch (tokenError) {
          console.error('Token verification error:', tokenError);
          return [
            { status: 'NOT_STARTED', count: 0 },
            { status: 'IN_PROGRESS', count: 0 },
            { status: 'COMPLETED', count: 0 },
            { status: 'CANCELLED', count: 0 }
          ];
        }
      } catch (error) {
        console.error('Tasks by status error:', error);
        return [
          { status: 'NOT_STARTED', count: 0 },
          { status: 'IN_PROGRESS', count: 0 },
          { status: 'COMPLETED', count: 0 },
          { status: 'CANCELLED', count: 0 }
        ];
      }
    }
  }
}; 