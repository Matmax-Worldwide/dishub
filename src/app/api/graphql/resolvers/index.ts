import { NextRequest } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { dashboardResolvers } from './dashboard';
import { documentResolvers } from './documents';
import { timeEntryResolvers } from './timeEntries';
import { appointmentResolvers } from './appointments';
import { performanceResolvers } from './performance';
import { notificationResolvers } from './notifications';
import { settingsResolvers } from './settings';
import { helpResolvers } from './help';
import { taskResolvers } from './tasks';
import { projectResolvers } from './projects';
import externalLinksResolvers from './externalLinks';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Basic auth resolvers
const authResolvers = {
  Query: {
    me: async (_parent: unknown, _args: unknown, context: { req: NextRequest }) => {
      try {
        const token = context.req.headers.get('authorization')?.split(' ')[1];
        
        if (!token) {
          throw new Error('Not authenticated');
        }

        console.log('Verifying token in me query:', token.substring(0, 10) + '...');
        const decoded = await verifyToken(token) as { userId: string; role?: string };
        console.log('Token verified, userId:', decoded.userId, 'role:', decoded.role);
        
        const user = await prisma.user.findUnique({
          where: { id: decoded.userId },
          include: {
            role: true
          }
        });

        if (!user) {
          console.error('User not found for id:', decoded.userId);
          throw new Error('User not found');
        }

        // Convert role to string for the response
        return {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          phoneNumber: user.phoneNumber,
          role: user.role?.name || 'USER',
          createdAt: user.createdAt,
          updatedAt: user.updatedAt
        };
      } catch (error) {
        console.error('GraphQL resolver error:', error);
        throw new Error('Invalid token');
      }
    }
  },
  
  Mutation: {
    login: async (_parent: unknown, { email, password: inputPassword }: { email: string, password: string }) => {
      const user = await prisma.user.findUnique({ 
        where: { email },
        include: {
          role: true
        }
      });
      
      if (!user) {
        throw new Error('No user found with this email');
      }
      
      const valid = await bcrypt.compare(inputPassword, user.password);
      
      if (!valid) {
        throw new Error('Invalid password');
      }
      
      // Get role name for the token payload
      const roleName = user.role?.name || 'USER';
      
      // Include role in the token payload
      const token = jwt.sign({ userId: user.id, role: roleName }, JWT_SECRET, { expiresIn: '7d' });
      console.log('Generated JWT with role:', roleName);
      
      // Create a new object with just the fields we need (omitting password)
      const userResponse = {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phoneNumber: user.phoneNumber,
        role: roleName,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      };
      
      return {
        token,
        user: userResponse,
      };
    },
    
    register: async (_parent: unknown, args: { 
      email: string, 
      password: string, 
      firstName: string, 
      lastName: string, 
      phoneNumber?: string 
    }) => {
      const { email, password, firstName, lastName, phoneNumber } = args;
      
      const existingUser = await prisma.user.findUnique({ where: { email } });
      
      if (existingUser) {
        throw new Error('User with this email already exists');
      }
      
      const hashedPassword = await bcrypt.hash(password, 10);
      
      // Find USER role
      const userRole = await prisma.roleModel.findFirst({
        where: { name: 'USER' },
      });
      
      if (!userRole) {
        throw new Error('Default USER role not found');
      }
      
      // Create user with role relationship
      const user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          firstName,
          lastName,
          phoneNumber,
          role: {
            connect: {
              id: userRole.id
            }
          }
        },
        include: {
          role: true
        }
      });
      
      // Get role name for token
      const roleName = user.role?.name || 'USER';
      console.log('User registered:', email, 'with role:', roleName);
      
      const token = jwt.sign({ userId: user.id, role: roleName }, JWT_SECRET, { expiresIn: '7d' });
      
      const userWithoutPassword = {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phoneNumber: user.phoneNumber,
        role: roleName,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      };
      
      return {
        token,
        user: userWithoutPassword,
      };
    },
    
    updateUser: async (_parent: unknown, { input }: { input: UpdateUserInput }, context: { req: NextRequest }) => {
      try {
        const token = context.req.headers.get('authorization')?.split(' ')[1];
        
        if (!token) {
          throw new Error('Not authenticated');
        }
        
        const decoded = await verifyToken(token) as { userId: string; role?: string };
        
        if (!decoded || !decoded.userId) {
          console.error('Invalid token payload:', decoded);
          throw new Error('Invalid token');
        }
        
        const userData: {
          firstName?: string;
          lastName?: string;
          phoneNumber?: string;
          email?: string;
          password?: string;
        } = {};
        
        // Only update fields that are provided
        if (input.firstName) userData.firstName = input.firstName;
        if (input.lastName) userData.lastName = input.lastName;
        if (input.phoneNumber) userData.phoneNumber = input.phoneNumber;
        
        // Handle email update
        if (input.email) {
          const existingUser = await prisma.user.findUnique({ 
            where: { 
              email: input.email,
              NOT: {
                id: decoded.userId
              }
            } 
          });
          
          if (existingUser) {
            throw new Error('Email already in use');
          }
          
          userData.email = input.email;
        }
        
        // Handle password update
        if (input.currentPassword && input.newPassword) {
          const user = await prisma.user.findUnique({ 
            where: { id: decoded.userId },
            select: { password: true }
          });
          
          if (!user) {
            throw new Error('User not found');
          }
          
          const valid = await bcrypt.compare(input.currentPassword, user.password);
          
          if (!valid) {
            throw new Error('Current password is incorrect');
          }
          
          userData.password = await bcrypt.hash(input.newPassword, 10);
        }
        
        const updatedUser = await prisma.user.update({
          where: { id: decoded.userId },
          data: userData,
          include: {
            role: true
          }
        });
        
        // Get role name for response
        return {
          id: updatedUser.id,
          email: updatedUser.email, 
          firstName: updatedUser.firstName,
          lastName: updatedUser.lastName,
          phoneNumber: updatedUser.phoneNumber,
          role: updatedUser.role?.name || 'USER',
          createdAt: updatedUser.createdAt,
          updatedAt: updatedUser.updatedAt
        };
      } catch (error) {
        console.error('GraphQL resolver error:', error);
        throw error;
      }
    },
    
    updateUserProfile: async (_parent: unknown, { input }: { input: UpdateUserProfileInput }, context: { req: NextRequest }) => {
      try {
        const token = context.req.headers.get('authorization')?.split(' ')[1];
        
        // Return empty user if not authenticated
        if (!token) {
          console.log('No authentication token found for updateUserProfile mutation');
          throw new Error('Not authenticated');
        }
        
        try {
          console.log('Verifying token for updateUserProfile...');
          const decoded = await verifyToken(token) as { userId: string; role?: string };
          
          if (!decoded || !decoded.userId) {
            console.error('Invalid token payload:', decoded);
            throw new Error('Invalid token');
          }
          
          console.log('Token verified, updating profile for user:', decoded.userId);
          
          const userData: {
            firstName?: string;
            lastName?: string;
            phoneNumber?: string;
            bio?: string;
            position?: string;
            department?: string;
          } = {};
          
          // Only update fields that are provided
          if (input.firstName !== undefined) userData.firstName = input.firstName;
          if (input.lastName !== undefined) userData.lastName = input.lastName;
          if (input.phoneNumber !== undefined) userData.phoneNumber = input.phoneNumber;
          if (input.bio !== undefined) userData.bio = input.bio;
          if (input.position !== undefined) userData.position = input.position;
          if (input.department !== undefined) userData.department = input.department;
          
          console.log('Updating user with data:', userData);
          
          // First check if user exists
          const userExists = await prisma.user.findUnique({
            where: { id: decoded.userId },
            select: { id: true }
          });
          
          if (!userExists) {
            console.error('User not found for profile update:', decoded.userId);
            throw new Error('User not found');
          }
          
          // Update user
          const updatedUser = await prisma.user.update({
            where: { id: decoded.userId },
            data: userData,
            include: {
              role: true
            }
          });
          
          console.log('User profile updated successfully');
          
          // Return user with role name
          return {
            id: updatedUser.id,
            email: updatedUser.email,
            firstName: updatedUser.firstName,
            lastName: updatedUser.lastName,
            phoneNumber: updatedUser.phoneNumber,
            role: updatedUser.role?.name || 'USER',
            bio: updatedUser.bio,
            position: updatedUser.position,
            department: updatedUser.department,
            createdAt: updatedUser.createdAt,
            updatedAt: updatedUser.updatedAt
          };
        } catch (tokenError) {
          console.error('Token validation error in updateUserProfile:', tokenError);
          throw new Error('Invalid token');
        }
      } catch (error) {
        console.error('Update user profile error:', error);
        throw error;
      }
    }
  }
};

// Interface for UpdateUserInput to satisfy TypeScript
interface UpdateUserInput {
  firstName?: string;
  lastName?: string;
  email?: string;
  phoneNumber?: string;
  currentPassword?: string;
  newPassword?: string;
}

// Interface for UpdateUserProfileInput to satisfy TypeScript
interface UpdateUserProfileInput {
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  bio?: string;
  position?: string;
  department?: string;
}

// Merge all resolvers
const resolvers = {
  Query: {
    ...authResolvers.Query,
    ...dashboardResolvers.Query,
    ...documentResolvers.Query,
    ...timeEntryResolvers.Query,
    ...appointmentResolvers.Query,
    ...performanceResolvers.Query,
    ...notificationResolvers.Query,
    ...settingsResolvers.Query,
    ...helpResolvers.Query,
    ...taskResolvers.Query,
    ...projectResolvers.Query,
    ...externalLinksResolvers.Query,
  },
  Mutation: {
    ...authResolvers.Mutation,
    ...documentResolvers.Mutation,
    ...timeEntryResolvers.Mutation,
    ...appointmentResolvers.Mutation,
    ...performanceResolvers.Mutation,
    ...notificationResolvers.Mutation,
    ...settingsResolvers.Mutation,
    ...helpResolvers.Mutation,
    ...taskResolvers.Mutation,
    ...projectResolvers.Mutation,
    ...externalLinksResolvers.Mutation,
  }
};

// Check if the external links resolver exists
console.log('External links resolver check:', {
  hasResolvers: Boolean(externalLinksResolvers),
  hasMutation: Boolean(externalLinksResolvers?.Mutation),
  hasCreateFn: Boolean(externalLinksResolvers?.Mutation?.createExternalLink)
});

// EMERGENCY FIX: Double-check the mutation is included
try {
  if (resolvers.Mutation && typeof resolvers.Mutation.createExternalLink !== 'function') {
    console.log('WARNING: createExternalLink resolver missing, adding directly');
    resolvers.Mutation.createExternalLink = externalLinksResolvers.Mutation.createExternalLink;
  }
} catch (e) {
  console.error('Error adding resolver directly:', e);
}

export default resolvers; 