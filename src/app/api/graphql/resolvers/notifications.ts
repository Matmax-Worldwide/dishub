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

        // Decode token to get user info
        const decoded = await verifyToken(token) as { userId: string; role?: string };
        
        // Get the user's role
        const user = await prisma.user.findUnique({
          where: { id: decoded.userId },
          select: { role: true }
        });
        
        // Only admins can send notifications to all users or other users
        if (user?.role !== 'ADMIN' && input.userId !== decoded.userId && input.userId !== 'ALL_USERS') {
          throw new Error('Unauthorized: Only admins can send notifications to other users');
        }
        
        // Handle the special case for sending to all users
        if (input.userId === 'ALL_USERS') {
          // Only admins can send to all users
          if (user?.role !== 'ADMIN') {
            throw new Error('Unauthorized: Only admins can send notifications to all users');
          }
          
          console.log('Creating notifications for all users');
          
          // Get all active users
          const users = await prisma.user.findMany({
            where: { isActive: true },
            select: { id: true }
          });
          
          // Create a notification for each user
          const notifications = await Promise.all(
            users.map(async (user) => {
              return prisma.notification.create({
                data: {
                  userId: user.id,
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
            })
          );
          
          // Return the first notification as a result (since GraphQL can't return an array here)
          if (notifications.length > 0) {
            console.log(`Created ${notifications.length} notifications for all users`);
            return notifications[0];
          } else {
            throw new Error('No users found to send notifications to');
          }
        } 
        
        // Regular case - single user notification
        let targetUserId = input.userId;
        
        // For non-admins, enforce they can only create notifications for themselves
        if (user?.role !== 'ADMIN') {
          targetUserId = decoded.userId;
        }
        
        // Create the notification for a specific user
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

        const decoded = await verifyToken(token) as { userId: string; role?: string };
        
        // Get user role
        const user = await prisma.user.findUnique({
          where: { id: decoded.userId },
          select: { role: true }
        });
        
        // Find the notification
        const notification = await prisma.notification.findUnique({
          where: { id },
          select: { userId: true }
        });
        
        if (!notification) {
          throw new Error('Notification not found');
        }
        
        // Allow users to delete their own notifications and admins to delete any notification
        if (notification.userId !== decoded.userId && user?.role !== 'ADMIN') {
          throw new Error('You do not have permission to delete this notification');
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