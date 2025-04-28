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
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true, 
            phoneNumber: true,
            role: true,
            createdAt: true,
            updatedAt: true,
          },
        });

        if (!user) {
          console.error('User not found for id:', decoded.userId);
          throw new Error('User not found');
        }

        // Convert role to string for the response to avoid enum serialization issues
        return {
          ...user,
          role: user.role.toString(),
        };
      } catch (error) {
        console.error('GraphQL resolver error:', error);
        throw new Error('Invalid token');
      }
    }
  },
  
  Mutation: {
    login: async (_parent: unknown, { email, password }: { email: string, password: string }) => {
      const user = await prisma.user.findUnique({ 
        where: { email },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phoneNumber: true,
          role: true,
          password: true,
          createdAt: true,
          updatedAt: true,
        }
      });
      
      if (!user) {
        throw new Error('No user found with this email');
      }
      
      const valid = await bcrypt.compare(password, user.password);
      
      if (!valid) {
        throw new Error('Invalid password');
      }
      
      // Include role in the token payload
      const token = jwt.sign({ userId: user.id, role: user.role.toString() }, JWT_SECRET, { expiresIn: '7d' });
      console.log('Generated JWT with role:', user.role.toString());
      
      // Remove password from returned user object
      const userWithoutPassword = { ...user };
      delete userWithoutPassword.password;
      
      // Convert enum to string for consistent serialization
      const userResponse = {
        ...userWithoutPassword,
        role: userWithoutPassword.role.toString()
      };
      
      return {
        token,
        user: userResponse,
      };
    },
    
    register: async (_parent: unknown, { 
      email, 
      password, 
      firstName, 
      lastName, 
      phoneNumber 
    }: { 
      email: string, 
      password: string, 
      firstName: string, 
      lastName: string, 
      phoneNumber?: string 
    }) => {
      const existingUser = await prisma.user.findUnique({ where: { email } });
      
      if (existingUser) {
        throw new Error('User with this email already exists');
      }
      
      const hashedPassword = await bcrypt.hash(password, 10);
      
      const user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          firstName,
          lastName,
          phoneNumber,
          role: 'USER', // Default role
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phoneNumber: true,
          role: true,
          createdAt: true,
          updatedAt: true,
        }
      });
      
      const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
      
      return {
        token,
        user,
      };
    },
    
    updateUser: async (_parent: unknown, { input }: { input: UpdateUserInput }, context: { req: NextRequest }) => {
      try {
        const token = context.req.headers.get('authorization')?.split(' ')[1];
        
        if (!token) {
          throw new Error('Not authenticated');
        }
        
        const decoded = await verifyToken(token) as { userId: string };
        
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
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phoneNumber: true,
            role: true,
            createdAt: true,
            updatedAt: true,
          }
        });
        
        return updatedUser;
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
          const decoded = await verifyToken(token) as { userId: string };
          
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
          
          const updatedUser = await prisma.user.update({
            where: { id: decoded.userId },
            data: userData,
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              phoneNumber: true,
              role: true,
              bio: true,
              position: true,
              department: true,
              createdAt: true,
              updatedAt: true,
            }
          });
          
          return updatedUser;
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
  }
};

export default resolvers; 