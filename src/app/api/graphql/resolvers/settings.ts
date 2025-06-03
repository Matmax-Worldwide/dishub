// import { NextRequest } from 'next/server'; // No longer needed if all resolvers refactored from direct req access
// import { verifyToken } from '@/lib/auth'; // No longer needed
import { prisma } from '@/lib/prisma';
// import { JWTPayload } from 'jose'; // No longer needed if DecodedToken is removed or not used

// Using GraphQLError for consistency if specific Apollo errors are not essential
import { GraphQLError } from 'graphql';
// Keep AuthenticationError if it's used by refactored resolvers for non-shield auth issues
import { AuthenticationError } from 'apollo-server-errors';
import { Prisma } from '@prisma/client';
import { GraphQLContext } from '../route';


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


export const settingsResolvers = {
  Query: {
    // userSettings (Already Refactored)
    userSettings: async (_parent: unknown, _args: unknown, context: GraphQLContext) => {
      try {
        if (!context.user || !context.user.id) {
          console.error('UserSettings: User context not available.');
          throw new AuthenticationError('Authentication required: User context not available.');
        }
        const userId = context.user.id;

        let settings = await prisma.userSettings.findUnique({
          where: { userId: userId },
          include: {
            user: {
              select: { id: true, firstName: true, lastName: true, email: true }
            }
          }
        });
        
        if (!settings) {
          settings = await prisma.userSettings.create({
            data: {
              userId: userId,
              emailNotifications: true,
              theme: 'light',
              language: 'en',
              timeFormat: '12h',
              dateFormat: 'MM/DD/YYYY',
              tenantId: context.tenantId || ''
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
        console.error('Get user settings error:', error instanceof Error ? error.message : 'Unknown error');
        if (error instanceof AuthenticationError) throw error;
        throw new GraphQLError('Could not fetch user settings.');
      }
    },
    // getSiteSettings (Original - public)
    getSiteSettings: async () => {
      try {
        const settings = await prisma.siteSettings.findFirst();
        return settings;
      } catch (error) {
        console.error('Get site settings error:', error);
        throw new GraphQLError('Could not fetch site settings.');
      }
    }
  },
  
  Mutation: {
    // updateUserSettings (Refactored)
    updateUserSettings: async (
      _parent: unknown, 
      { input }: { input: UpdateUserSettingsInput }, 
      context: GraphQLContext
    ) => {
      try {
        if (!context.user || !context.user.id) {
          console.error('UpdateUserSettings: User context not available.');
          throw new AuthenticationError('Authentication required: User context not available.');
        }
        const userId = context.user.id;

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
            tenantId: context.tenantId || ''
          },
          include: {
            user: {
              select: { id: true, firstName: true, lastName: true, email: true }
            }
          }
        });
        
        return updatedSettings;
      } catch (error) {
        console.error('Update user settings error:', error instanceof Error ? error.message : 'Unknown error');
        if (error instanceof AuthenticationError) throw error;
        throw new GraphQLError('Could not update user settings.');
      }
    },

    // updateSiteSettings (Already Refactored)
    updateSiteSettings: async (
      _parent: unknown,
      { input }: { input: UpdateSiteSettingsInput }
    ) => {
      try {
        // Auth handled by graphql-shield
        // if (!context.user) { // This check might be redundant if shield ensures isAuthenticated
        //   throw new AuthenticationError("Authentication required for updateSiteSettings.");
        // }
        const currentSettings = await prisma.siteSettings.findFirst();
        let updatedSiteSettings;

        const createData = {
            siteName: input.siteName || 'My Website',
            siteDescription: input.siteDescription || null,
            logoUrl: input.logoUrl || null,
            faviconUrl: input.faviconUrl || null,
            primaryColor: input.primaryColor || null,
            secondaryColor: input.secondaryColor || null,
            googleAnalyticsId: input.googleAnalyticsId || null,
            facebookPixelId: input.facebookPixelId || null,
            customCss: input.customCss || null,
            customJs: input.customJs || null,
            contactEmail: input.contactEmail || null,
            contactPhone: input.contactPhone || null,
            address: input.address || null,
            accentColor: input.accentColor || null,
            defaultLocale: input.defaultLocale || 'en',
            footerText: input.footerText || null,
            maintenanceMode: input.maintenanceMode ?? false,
            metaDescription: input.metaDescription || null,
            metaTitle: input.metaTitle || null,
            ogImage: input.ogImage || null,
            socialLinks: input.socialLinks || Prisma.JsonNull,
            supportedLocales: input.supportedLocales && input.supportedLocales.length > 0 ? input.supportedLocales : ['en'],
            twitterCardType: input.twitterCardType || null,
            twitterHandle: input.twitterHandle || null,
        };
        if (createData.supportedLocales.length === 0) {
            createData.supportedLocales = ['en'];
        }

        if (currentSettings) {
          updatedSiteSettings = await prisma.siteSettings.update({
            where: { id: currentSettings.id },
            data: input,
          });
        } else {
          updatedSiteSettings = await prisma.siteSettings.create({
            data: createData,
          });
        }
        return updatedSiteSettings;
      } catch (error) {
        console.error('Update site settings error:', error instanceof Error ? error.message : 'Unknown error');
        throw new GraphQLError('Could not update site settings.');
      }
    }
  }
};
