
import { verifyToken } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { GraphQLContext } from '../route';

// Define input types to avoid 'any'
interface CreateNotificationInput {
  userId: string;
  type: 'DOCUMENT' | 'TASK' | 'APPOINTMENT' | 'SYSTEM';
  title: string;
  message: string;
  relatedItemId?: string;
  relatedItemType?: string;
}

interface User {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role?: {
    id: string;
    name: string;
    description?: string | null;
    createdAt?: Date;
    updatedAt?: Date;
  } | null;
}


interface UpdateNotificationInput {
  isRead?: boolean;
}

export const notificationResolvers = {
  Query: {
    notifications: async (_parent: unknown, _args: unknown, context: GraphQLContext) => {
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
        
        // Ensure dates are properly serialized
        return notifications.map(notification => ({
          ...notification,
          createdAt: notification.createdAt.toISOString(),
          updatedAt: notification.updatedAt.toISOString()
        }));
      } catch (error) {
        console.error('Get notifications error:', error);
        throw error;
      }
    },
    
    notification: async (_parent: unknown, { id }: { id: string }, context: GraphQLContext) => {
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
        
        return {
          ...notification,
          createdAt: notification.createdAt.toISOString(),
          updatedAt: notification.updatedAt.toISOString()
        };
      } catch (error) {
        console.error('Get notification error:', error);
        throw error;
      }
    },
    
    unreadNotificationsCount: async (_parent: unknown, _args: unknown, context: GraphQLContext) => {
      try {
        // Try to get token from Authorization header first, then from cookies
        let token = context.req.headers.get('authorization')?.split(' ')[1];
        
        if (!token) {
          // Try to get token from cookies
          const cookies = context.req.headers.get('cookie');
          if (cookies) {
            const authTokenMatch = cookies.match(/auth-token=([^;]+)/);
            token = authTokenMatch ? authTokenMatch[1] : undefined;
          }
        }
        
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
    },
    
    // Admin query to get all notifications in the system
    allNotifications: async (_parent: unknown, _args: unknown, context: GraphQLContext) => {
      try {
        const token = context.req.headers.get('authorization')?.split(' ')[1];
        
        if (!token) {
          throw new Error('Not authenticated');
        }

        const decoded = await verifyToken(token) as { userId: string; role?: string };
        
        // Check if user is an admin
        const user = await prisma.user.findUnique({
          where: { id: decoded.userId },
          select: { role: { select: { name: true } } }
        });
        
        if (user?.role?.name !== 'ADMIN') {
          throw new Error('Unauthorized: Only admins can access all notifications');
        }
        
        const notifications = await prisma.notification.findMany({
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
        
        // Ensure dates are properly serialized
        return notifications.map(notification => ({
          ...notification,
          createdAt: notification.createdAt.toISOString(),
          updatedAt: notification.updatedAt.toISOString()
        }));
      } catch (error) {
        console.error('Get all notifications error:', error);
        throw error;
      }
    }
  },
  
  Mutation: {
    createNotification: async (
      _parent: unknown, 
      { input }: { input: CreateNotificationInput }, 
      context: GraphQLContext
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
        if (user?.role?.name !== 'ADMIN' && input.userId !== decoded.userId && input.userId !== 'ALL_USERS') {
          throw new Error('Unauthorized: Only admins can send notifications to other users');
        }
        
        // Handle the special case for sending to all users
        if (input.userId === 'ALL_USERS') {
          // Only admins can send to all users
          if (user?.role?.name !== 'ADMIN') {
            throw new Error('Unauthorized: Only admins can send notifications to all users');
          }
          
          console.log('Creating notifications for all users');
          
          // Get all active users
          const users = await prisma.user.findMany({
            where: { isActive: true },
            select: { 
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              role: {
                select: {
                  id: true,
                  name: true
                }
              }
            }
          });
          
          // Create a notification for each user
          const notifications = await Promise.all(
            users.map(async (user: User) => {
              return prisma.notification.create({
                data: {
                  userId: user.id,
                  type: input.type,
                  title: input.title,
                  message: input.message,
                  isRead: false,
                  relatedItemId: input.relatedItemId || null,
                  relatedItemType: input.relatedItemType || null,
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
            })
          );
          
          // Return the first notification as a result (since GraphQL can't return an array here)
          if (notifications.length > 0) {
            console.log(`Created ${notifications.length} notifications for all users`);
            const firstNotification = notifications[0];
            return {
              ...firstNotification,
              createdAt: firstNotification.createdAt.toISOString(),
              updatedAt: firstNotification.updatedAt.toISOString()
            };
          } else {
            throw new Error('No users found to send notifications to');
          }
        } 
        
        // Regular case - single user notification
        let targetUserId = input.userId;
        
        // For non-admins, enforce they can only create notifications for themselves
        if (user?.role?.name !== 'ADMIN') {
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
        
        return {
          ...notification,
          createdAt: notification.createdAt.toISOString(),
          updatedAt: notification.updatedAt.toISOString()
        };
      } catch (error) {
        console.error('Create notification error:', error);
        throw error;
      }
    },
    
    updateNotification: async (
      _parent: unknown, 
      { id, input }: { id: string, input: UpdateNotificationInput }, 
      context: GraphQLContext
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
        
        return {
          ...updatedNotification,
          createdAt: updatedNotification.createdAt.toISOString(),
          updatedAt: updatedNotification.updatedAt.toISOString()
        };
      } catch (error) {
        console.error('Update notification error:', error);
        throw error;
      }
    },
    
    markAllNotificationsAsRead: async (_parent: unknown, _args: unknown, context: GraphQLContext) => {
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
    
    deleteNotification: async (_parent: unknown, { id }: { id: string }, context: GraphQLContext) => {
      try {
        const token = context.req.headers.get('authorization')?.split(' ')[1];
        
        if (!token) {
          throw new Error('Not authenticated');
        }

        const decoded = await verifyToken(token) as { userId: string; role?: string };
        
        // Get user role
        const user = await prisma.user.findUnique({
          where: { id: decoded.userId },
          select: { role: { select: { name: true } } }
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
        if (notification.userId !== decoded.userId && user?.role?.name !== 'ADMIN') {
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
    },
    
    // Admin mutation to delete multiple notifications 
    deleteMultipleNotifications: async (_parent: unknown, { ids }: { ids: string[] }, context: GraphQLContext) => {
      try {
        const token = context.req.headers.get('authorization')?.split(' ')[1];
        
        if (!token) {
          throw new Error('Not authenticated');
        }

        const decoded = await verifyToken(token) as { userId: string; role?: string };
        
        // Verify admin permissions
        const user = await prisma.user.findUnique({
          where: { id: decoded.userId },
          select: { role: true }
        });
        
        if (user?.role?.name !== 'ADMIN') {
          throw new Error('Unauthorized: Only admins can perform bulk deletion');
        }
        
        if (!ids || ids.length === 0) {
          throw new Error('No notification IDs provided');
        }
        
        // Delete notifications
        const { count } = await prisma.notification.deleteMany({
          where: {
            id: { in: ids }
          }
        });
        
        return count;
      } catch (error) {
        console.error('Delete multiple notifications error:', error);
        throw error;
      }
    }
  }
}; 