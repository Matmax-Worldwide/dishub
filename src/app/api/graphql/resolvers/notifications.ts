import { NextRequest } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// Define input types to avoid 'any'
interface CreateNotificationInput {
  userId: string;
  type: 'DOCUMENT' | 'TASK' | 'APPOINTMENT' | 'SYSTEM';
  title: string;
  message: string;
  relatedItemId?: string;
  relatedItemType?: string;
}

interface UpdateNotificationInput {
  isRead?: boolean;
}

export const notificationResolvers = {
  Query: {
    notifications: async (_parent: unknown, _args: unknown, context: { req: NextRequest }) => {
      try {
        const token = context.req.headers.get('authorization')?.split(' ')[1];
        
        if (!token) {
          throw new Error('Not authenticated');
        }

        const decoded = await verifyToken(token) as { userId: string };
        
        const notifications = await prisma.notification.findMany({
          where: { userId: decoded.userId },
          orderBy: { createdAt: 'desc' },
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
        
        return notifications;
      } catch (error) {
        console.error('Get notifications error:', error);
        throw error;
      }
    },
    
    notification: async (_parent: unknown, { id }: { id: string }, context: { req: NextRequest }) => {
      try {
        const token = context.req.headers.get('authorization')?.split(' ')[1];
        
        if (!token) {
          throw new Error('Not authenticated');
        }

        const decoded = await verifyToken(token) as { userId: string };
        
        const notification = await prisma.notification.findUnique({
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
        
        if (!notification) {
          throw new Error('Notification not found');
        }
        
        return notification;
      } catch (error) {
        console.error('Get notification error:', error);
        throw error;
      }
    },
    
    unreadNotificationsCount: async (_parent: unknown, _args: unknown, context: { req: NextRequest }) => {
      try {
        const token = context.req.headers.get('authorization')?.split(' ')[1];
        
        if (!token) {
          throw new Error('Not authenticated');
        }

        const decoded = await verifyToken(token) as { userId: string };
        
        const count = await prisma.notification.count({
          where: { 
            userId: decoded.userId,
            isRead: false
          }
        });
        
        return count;
      } catch (error) {
        console.error('Get unread notifications count error:', error);
        throw error;
      }
    }
  },
  
  Mutation: {
    createNotification: async (
      _parent: unknown, 
      { input }: { input: CreateNotificationInput }, 
      context: { req: NextRequest }
    ) => {
      try {
        const token = context.req.headers.get('authorization')?.split(' ')[1];
        
        if (!token) {
          throw new Error('Not authenticated');
        }

        // For security, we'll always use the decoded userId for user-created notifications
        // except for admin users who can create notifications for other users
        const decoded = await verifyToken(token) as { userId: string };
        
        // Check if the user has admin rights
        const user = await prisma.user.findUnique({
          where: { id: decoded.userId },
          select: { role: true }
        });
        
        let targetUserId = decoded.userId;
        
        // If the user is an admin, they can create notifications for other users
        if (user?.role === 'ADMIN' && input.userId) {
          targetUserId = input.userId;
        }
        
        const notification = await prisma.notification.create({
          data: {
            userId: targetUserId,
            type: input.type,
            title: input.title,
            message: input.message,
            isRead: false,
            relatedItemId: input.relatedItemId || null,
            relatedItemType: input.relatedItemType || null,
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
        
        return notification;
      } catch (error) {
        console.error('Create notification error:', error);
        throw error;
      }
    },
    
    updateNotification: async (
      _parent: unknown, 
      { id, input }: { id: string, input: UpdateNotificationInput }, 
      context: { req: NextRequest }
    ) => {
      try {
        const token = context.req.headers.get('authorization')?.split(' ')[1];
        
        if (!token) {
          throw new Error('Not authenticated');
        }

        const decoded = await verifyToken(token) as { userId: string };
        
        // Make sure the notification exists and belongs to the user
        const existingNotification = await prisma.notification.findUnique({
          where: { 
            id,
            userId: decoded.userId
          }
        });
        
        if (!existingNotification) {
          throw new Error('Notification not found or you do not have permission to update it');
        }
        
        const updateData: { isRead?: boolean } = {};
        
        // Only update fields that are provided
        if (input.isRead !== undefined) updateData.isRead = input.isRead;
        
        const updatedNotification = await prisma.notification.update({
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
        
        return updatedNotification;
      } catch (error) {
        console.error('Update notification error:', error);
        throw error;
      }
    },
    
    markAllNotificationsAsRead: async (_parent: unknown, _args: unknown, context: { req: NextRequest }) => {
      try {
        const token = context.req.headers.get('authorization')?.split(' ')[1];
        
        if (!token) {
          throw new Error('Not authenticated');
        }

        const decoded = await verifyToken(token) as { userId: string };
        
        await prisma.notification.updateMany({
          where: { 
            userId: decoded.userId,
            isRead: false
          },
          data: { isRead: true }
        });
        
        return true;
      } catch (error) {
        console.error('Mark all notifications as read error:', error);
        return false;
      }
    },
    
    deleteNotification: async (_parent: unknown, { id }: { id: string }, context: { req: NextRequest }) => {
      try {
        const token = context.req.headers.get('authorization')?.split(' ')[1];
        
        if (!token) {
          throw new Error('Not authenticated');
        }

        const decoded = await verifyToken(token) as { userId: string };
        
        // Make sure the notification exists and belongs to the user
        const existingNotification = await prisma.notification.findUnique({
          where: { 
            id,
            userId: decoded.userId
          }
        });
        
        if (!existingNotification) {
          throw new Error('Notification not found or you do not have permission to delete it');
        }
        
        await prisma.notification.delete({
          where: { id }
        });
        
        return true;
      } catch (error) {
        console.error('Delete notification error:', error);
        return false;
      }
    }
  }
}; 