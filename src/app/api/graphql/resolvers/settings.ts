import { NextRequest } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

import { AuthenticationError, ForbiddenError } from 'apollo-server-errors'; // Or your project's error types

// Define input types to avoid 'any'
interface UpdateUserSettingsInput {
  emailNotifications?: boolean;
  theme?: string;
  language?: string;
  timeFormat?: string;
  dateFormat?: string;
}

interface UpdateSiteSettingsInput {
  siteName?: string;
  siteDescription?: string;
  logoUrl?: string;
  faviconUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  googleAnalyticsId?: string;
  facebookPixelId?: string;
  customCss?: string;
  customJs?: string;
  contactEmail?: string;
  contactPhone?: string;
  address?: string;
  accentColor?: string;
  defaultLocale?: string;
  footerText?: string;
  maintenanceMode?: boolean;
  metaDescription?: string;
  metaTitle?: string;
  ogImage?: string;
  socialLinks?: string; // JSON string
  supportedLocales?: string[];
  twitterCardType?: string;
  twitterHandle?: string;
}

interface DecodedToken {
  userId: string;
  role?: string; // Assuming role is part of the token
  // Add other fields from your token payload if necessary
}


export const settingsResolvers = {
  Query: {
    userSettings: async (_parent: unknown, _args: unknown, context: { req: NextRequest }) => {
      try {
        const tokenHeader = context.req.headers.get('authorization');
        if (!tokenHeader) {
          throw new AuthenticationError('Authorization header missing');
        }
        const token = tokenHeader.split(' ')[1];
        if (!token) {
          throw new AuthenticationError('Token missing');
        }

        const decoded = await verifyToken(token) as DecodedToken;
        if (!decoded || !decoded.userId) {
          throw new AuthenticationError('Invalid token');
        }
        
        // Find user settings, or create if they don't exist (upsert logic)
        // Prisma's findUniqueOrThrow might be an option if settings are guaranteed post-creation
        let settings = await prisma.userSettings.findUnique({
          where: { userId: decoded.userId },
          include: {
            user: {
              select: { id: true, firstName: true, lastName: true, email: true }
            }
          }
        });
        
        if (!settings) {
          settings = await prisma.userSettings.create({
            data: {
              userId: decoded.userId,
              emailNotifications: true, // Default value
              theme: 'light', // Default value
              language: 'en', // Default value
              timeFormat: '12h', // Default value
              dateFormat: 'MM/DD/YYYY' // Default value
            },
            include: {
              user: {
                select: { id: true, firstName: true, lastName: true, email: true }
              }
            }
          });
        }
        
        return settings;
      } catch (error) {
        console.error('Get user settings error:', error);
        if (error instanceof AuthenticationError) throw error;
        throw new Error('Could not fetch user settings.');
      }
    },
    getSiteSettings: async (_parent: unknown, _args: unknown, _context: { req: NextRequest }) => {
      try {
        const settings = await prisma.siteSettings.findFirst();
        // It's okay if settings are null (e.g., not configured yet)
        // Client-side should handle null and perhaps prompt for setup if user is admin
        return settings;
      } catch (error) {
        console.error('Get site settings error:', error);
        throw new Error('Could not fetch site settings.');
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
        const tokenHeader = context.req.headers.get('authorization');
        if (!tokenHeader) {
          throw new AuthenticationError('Authorization header missing');
        }
        const token = tokenHeader.split(' ')[1];
        if (!token) {
          throw new AuthenticationError('Token missing');
        }

        const decoded = await verifyToken(token) as DecodedToken;
         if (!decoded || !decoded.userId) {
          throw new AuthenticationError('Invalid token');
        }
        
        const { userId } = decoded;

        const updatedSettings = await prisma.userSettings.upsert({
          where: { userId: userId },
          update: input,
          create: {
            userId: userId,
            emailNotifications: input.emailNotifications !== undefined ? input.emailNotifications : true,
            theme: input.theme || 'light',
            language: input.language || 'en',
            timeFormat: input.timeFormat || '12h',
            dateFormat: input.dateFormat || 'MM/DD/YYYY',
          },
          include: {
            user: {
              select: { id: true, firstName: true, lastName: true, email: true }
            }
          }
        });
        
        return updatedSettings;
      } catch (error) {
        console.error('Update user settings error:', error);
        if (error instanceof AuthenticationError) throw error;
        throw new Error('Could not update user settings.');
      }
    },
    updateSiteSettings: async (
      _parent: unknown,
      { input }: { input: UpdateSiteSettingsInput },
      context: { req: NextRequest }
    ) => {
      try {
        const tokenHeader = context.req.headers.get('authorization');
        if (!tokenHeader) {
          throw new AuthenticationError('Authorization header missing');
        }
        const token = tokenHeader.split(' ')[1];
        if (!token) {
          throw new AuthenticationError('Token missing');
        }

        const decoded = await verifyToken(token) as DecodedToken;
        if (!decoded || !decoded.userId || !decoded.role) {
          throw new AuthenticationError('Invalid token or role missing');
        }

        // Authorization: Check if user is admin
        // TODO: Standardize role names, e.g., use an enum or constants
        if (decoded.role !== 'ADMIN' && decoded.role !== 'SUPER_ADMIN') { 
          throw new ForbiddenError('Not authorized to update site settings.');
        }

        const currentSettings = await prisma.siteSettings.findFirst();
        
        let updatedSiteSettings;
        if (currentSettings) {
          updatedSiteSettings = await prisma.siteSettings.update({
            where: { id: currentSettings.id },
            data: input,
          });
        } else {
          // If no settings exist, create them.
          // Ensure all required fields for SiteSettings are present in input or have defaults
          // For this example, assuming input might be partial for creation too,
          // which might fail if Prisma schema has non-nullable fields not in input.
          // A robust implementation would merge input with defaults for creation.
          const createData: any = { ...input };
          if (createData.supportedLocales && Array.isArray(createData.supportedLocales)) {
            // Ensure it's not empty if the schema requires it
             if(createData.supportedLocales.length === 0) createData.supportedLocales = ['en'];
          } else {
            createData.supportedLocales = ['en']; // Default if not provided
          }
          if (typeof createData.maintenanceMode !== 'boolean') createData.maintenanceMode = false;
          if (!createData.defaultLocale) createData.defaultLocale = 'en';


          updatedSiteSettings = await prisma.siteSettings.create({
            data: createData as any, // Cast to any to bypass strict type checking if input is partial
          });
        }
        return updatedSiteSettings;
      } catch (error) {
        console.error('Update site settings error:', error);
        if (error instanceof AuthenticationError || error instanceof ForbiddenError) throw error;
        throw new Error('Could not update site settings.');
      }
    }
  }
};