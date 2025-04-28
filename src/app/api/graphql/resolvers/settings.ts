import { NextRequest } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// Define input types to avoid 'any'
interface UpdateUserSettingsInput {
  emailNotifications?: boolean;
  theme?: string;
  language?: string;
  timeFormat?: string;
  dateFormat?: string;
}

export const settingsResolvers = {
  Query: {
    userSettings: async (_parent: unknown, _args: unknown, context: { req: NextRequest }) => {
      try {
        const token = context.req.headers.get('authorization')?.split(' ')[1];
        
        if (!token) {
          throw new Error('Not authenticated');
        }

        const decoded = await verifyToken(token) as { userId: string };
        
        // Find user settings
        let settings = await prisma.userSettings.findUnique({
          where: { userId: decoded.userId },
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
        
        // If settings don't exist, create default settings
        if (!settings) {
          settings = await prisma.userSettings.create({
            data: {
              userId: decoded.userId,
              emailNotifications: true,
              theme: 'light',
              language: 'en',
              timeFormat: '12h',
              dateFormat: 'MM/DD/YYYY'
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
        
        return settings;
      } catch (error) {
        console.error('Get user settings error:', error);
        throw error;
      }
    }
  },
  
  Mutation: {
    updateUserSettings: async (
      _parent: unknown, 
      { input }: { input: UpdateUserSettingsInput }, 
      context: { req: NextRequest }
    ) => {
      try {
        const token = context.req.headers.get('authorization')?.split(' ')[1];
        
        if (!token) {
          throw new Error('Not authenticated');
        }

        const decoded = await verifyToken(token) as { userId: string };
        
        // Check if user settings exist
        const existingSettings = await prisma.userSettings.findUnique({
          where: { userId: decoded.userId }
        });
        
        // If settings don't exist, create new settings with the provided input
        if (!existingSettings) {
          // Set default values for any missing input properties
          const settings = await prisma.userSettings.create({
            data: {
              userId: decoded.userId,
              emailNotifications: input.emailNotifications !== undefined ? input.emailNotifications : true,
              theme: input.theme || 'light',
              language: input.language || 'en',
              timeFormat: input.timeFormat || '12h',
              dateFormat: input.dateFormat || 'MM/DD/YYYY'
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
          
          return settings;
        }
        
        // Otherwise, update existing settings
        const updateData: {
          emailNotifications?: boolean;
          theme?: string;
          language?: string;
          timeFormat?: string;
          dateFormat?: string;
        } = {};
        
        // Only update fields that are provided
        if (input.emailNotifications !== undefined) updateData.emailNotifications = input.emailNotifications;
        if (input.theme !== undefined) updateData.theme = input.theme;
        if (input.language !== undefined) updateData.language = input.language;
        if (input.timeFormat !== undefined) updateData.timeFormat = input.timeFormat;
        if (input.dateFormat !== undefined) updateData.dateFormat = input.dateFormat;
        
        const updatedSettings = await prisma.userSettings.update({
          where: { userId: decoded.userId },
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
        
        return updatedSettings;
      } catch (error) {
        console.error('Update user settings error:', error);
        throw error;
      }
    }
  }
}; 