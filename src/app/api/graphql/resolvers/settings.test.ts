import { settingsResolvers } from './settings';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { AuthenticationError, ForbiddenError } from 'apollo-server-errors';

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    userSettings: {
      findUnique: jest.fn(),
      create: jest.fn(),
      upsert: jest.fn(),
    },
    siteSettings: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  },
}));

// Mock auth verifyToken
jest.mock('@/lib/auth', () => ({
  verifyToken: jest.fn(),
}));

// Mock NextRequest for context
const mockReq = {
  headers: {
    get: jest.fn(),
  },
} as any;


describe('Settings Resolvers', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    (mockReq.headers.get as jest.Mock).mockReturnValue('Bearer testtoken'); // Default mock for token
  });

  describe('Query: userSettings', () => {
    it('should return user settings for an authenticated user', async () => {
      const mockUserSettings = {
        userId: 'user1',
        theme: 'dark',
        language: 'en',
        emailNotifications: true,
        timeFormat: '24h',
        dateFormat: 'YYYY-MM-DD',
        user: { id: 'user1', firstName: 'Test', lastName: 'User', email: 'test@example.com' }
      };
      (prisma.userSettings.findUnique as jest.Mock).mockResolvedValue(mockUserSettings);
      (verifyToken as jest.Mock).mockResolvedValue({ userId: 'user1' });

      const context = { req: mockReq };
      const result = await settingsResolvers.Query.userSettings(null, {}, context);

      expect(verifyToken).toHaveBeenCalledWith('testtoken');
      expect(prisma.userSettings.findUnique).toHaveBeenCalledWith({
        where: { userId: 'user1' },
        include: { user: { select: { id: true, firstName: true, lastName: true, email: true } } },
      });
      expect(result).toEqual(mockUserSettings);
    });

    it('should create and return default settings if none exist', async () => {
      (prisma.userSettings.findUnique as jest.Mock).mockResolvedValue(null);
      const defaultSettings = {
        userId: 'user1',
        emailNotifications: true,
        theme: 'light',
        language: 'en',
        timeFormat: '12h',
        dateFormat: 'MM/DD/YYYY',
        user: { id: 'user1', firstName: 'Test', lastName: 'User', email: 'test@example.com' }
      };
      (prisma.userSettings.create as jest.Mock).mockResolvedValue(defaultSettings);
      (verifyToken as jest.Mock).mockResolvedValue({ userId: 'user1' });
      
      const context = { req: mockReq };
      const result = await settingsResolvers.Query.userSettings(null, {}, context);

      expect(prisma.userSettings.create).toHaveBeenCalledWith(expect.objectContaining({
        userId: 'user1',
        emailNotifications: true,
        theme: 'light',
        language: 'en',
        timeFormat: '12h',
        dateFormat: 'MM/DD/YYYY',
      }));
      expect(result).toEqual(defaultSettings);
    });

    it('should throw AuthenticationError if no token is provided', async () => {
      (mockReq.headers.get as jest.Mock).mockReturnValue(null);
      const context = { req: mockReq };
      await expect(settingsResolvers.Query.userSettings(null, {}, context))
        .rejects.toThrow(AuthenticationError);
    });
  });

  describe('Mutation: updateUserSettings', () => {
    const input = { theme: 'dark', language: 'es' };
    const mockUpdatedSettings = {
      userId: 'user1',
      theme: 'dark',
      language: 'es',
      emailNotifications: true,
      timeFormat: '12h',
      dateFormat: 'MM/DD/YYYY',
      user: { id: 'user1', firstName: 'Test', lastName: 'User', email: 'test@example.com' }
    };

    it('should update user settings successfully', async () => {
      (verifyToken as jest.Mock).mockResolvedValue({ userId: 'user1' });
      (prisma.userSettings.upsert as jest.Mock).mockResolvedValue(mockUpdatedSettings);
      
      const context = { req: mockReq };
      const result = await settingsResolvers.Mutation.updateUserSettings(null, { input }, context);

      expect(prisma.userSettings.upsert).toHaveBeenCalledWith(expect.objectContaining({
        where: { userId: 'user1' },
        update: input,
        create: expect.objectContaining({ userId: 'user1' }),
      }));
      expect(result).toEqual(mockUpdatedSettings);
    });

    it('should throw AuthenticationError if no token for update', async () => {
      (mockReq.headers.get as jest.Mock).mockReturnValue(null);
      const context = { req: mockReq };
      await expect(settingsResolvers.Mutation.updateUserSettings(null, { input }, context))
        .rejects.toThrow(AuthenticationError);
    });
  });

  describe('Query: getSiteSettings', () => {
    it('should return site settings if they exist', async () => {
      const mockSiteSettings = { siteName: 'Test Site', defaultLocale: 'en' };
      (prisma.siteSettings.findFirst as jest.Mock).mockResolvedValue(mockSiteSettings);
      
      const result = await settingsResolvers.Query.getSiteSettings(null, {}, { req: mockReq });
      expect(result).toEqual(mockSiteSettings);
      expect(prisma.siteSettings.findFirst).toHaveBeenCalled();
    });

    it('should return null if no site settings exist', async () => {
      (prisma.siteSettings.findFirst as jest.Mock).mockResolvedValue(null);
      
      const result = await settingsResolvers.Query.getSiteSettings(null, {}, { req: mockReq });
      expect(result).toBeNull();
    });
  });

  describe('Mutation: updateSiteSettings', () => {
    const input = { siteName: 'New Site Name', defaultLocale: 'fr' };
    const mockSiteSettings = { id: 'site1', ...input };

    it('should update site settings if user is admin and settings exist', async () => {
      (verifyToken as jest.Mock).mockResolvedValue({ userId: 'admin1', role: 'ADMIN' });
      (prisma.siteSettings.findFirst as jest.Mock).mockResolvedValue({ id: 'site1', siteName: 'Old Name' });
      (prisma.siteSettings.update as jest.Mock).mockResolvedValue(mockSiteSettings);

      const context = { req: mockReq };
      const result = await settingsResolvers.Mutation.updateSiteSettings(null, { input }, context);
      
      expect(prisma.siteSettings.update).toHaveBeenCalledWith({
        where: { id: 'site1' },
        data: input,
      });
      expect(result).toEqual(mockSiteSettings);
    });

    it('should create site settings if user is admin and no settings exist', async () => {
      (verifyToken as jest.Mock).mockResolvedValue({ userId: 'admin1', role: 'ADMIN' });
      (prisma.siteSettings.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.siteSettings.create as jest.Mock).mockResolvedValue(mockSiteSettings);

      const context = { req: mockReq };
      const result = await settingsResolvers.Mutation.updateSiteSettings(null, { input }, context);
      
      // Check if create was called with input merged with defaults
      expect(prisma.siteSettings.create).toHaveBeenCalledWith(expect.objectContaining({
        siteName: 'New Site Name',
        defaultLocale: 'fr',
        // ensure defaults for required fields are present if not in input
        supportedLocales: expect.arrayContaining(['fr']), 
        maintenanceMode: false, 
      }));
      expect(result).toEqual(mockSiteSettings);
    });
    
    it('should throw AuthenticationError if no token for updateSiteSettings', async () => {
      (mockReq.headers.get as jest.Mock).mockReturnValue(null);
      const context = { req: mockReq };
      await expect(settingsResolvers.Mutation.updateSiteSettings(null, { input }, context))
        .rejects.toThrow(AuthenticationError);
    });

    it('should throw ForbiddenError if user is not admin', async () => {
      (verifyToken as jest.Mock).mockResolvedValue({ userId: 'user1', role: 'USER' });
      const context = { req: mockReq };
      await expect(settingsResolvers.Mutation.updateSiteSettings(null, { input }, context))
        .rejects.toThrow(ForbiddenError);
    });
  });
});
