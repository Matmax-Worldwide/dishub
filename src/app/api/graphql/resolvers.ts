import { NextRequest } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import resolvers from './resolvers/index';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

const resolvers = {
  Query: {
    // User queries
    me: async (_parent: unknown, _args: unknown, context: { req: NextRequest }) => {
      try {
        const token = context.req.headers.get('authorization')?.split(' ')[1];
        
        if (!token) {
          throw new Error('Not authenticated');
        }

        const decoded = await verifyToken(token) as { userId: string };
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
          throw new Error('User not found');
        }

        return user;
      } catch (error) {
        console.error('GraphQL resolver error:', error);
        throw new Error('Invalid token');
      }
    },
  },
  
  Mutation: {
    // Auth mutations
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
      
      const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
      
      // Remove password from returned user object
      const { password: _, ...userWithoutPassword } = user;
      
      return {
        token,
        user: userWithoutPassword,
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
    
    updateUser: async (_parent: unknown, { input }: { input: any }, context: { req: NextRequest }) => {
      try {
        const token = context.req.headers.get('authorization')?.split(' ')[1];
        
        if (!token) {
          throw new Error('Not authenticated');
        }
        
        const decoded = await verifyToken(token) as { userId: string };
        
        const userData: any = {};
        
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
    }
  }
};

export default resolvers; 