import { NextRequest } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

// Define input types for TypeScript
interface CreateUserInput {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  role: string;
}

interface UpdateUserInput {
  firstName?: string;
  lastName?: string;
  email?: string;
  phoneNumber?: string;
  role?: string;
}

export const userResolvers = {
  Query: {
    // User queries are already in the main resolvers.ts file
  },
  
  Mutation: {
    // Create a new user (Admin only)
    createUser: async (_parent: unknown, 
      { input }: { input: CreateUserInput }, 
      context: { req: NextRequest }
    ) => {
      try {
        const token = context.req.headers.get('authorization')?.split(' ')[1];
        
        if (!token) {
          throw new Error('Not authenticated');
        }
        
        const decoded = await verifyToken(token) as { userId: string; role?: string };
        
        if (!decoded || !decoded.userId) {
          throw new Error('Invalid token');
        }
        
        // Check if user is an admin
        const roleResult = await prisma.$queryRaw`
          SELECT role FROM "User" WHERE id = ${decoded.userId}
        `;
        
        const userRole = roleResult && Array.isArray(roleResult) && roleResult.length > 0 
          ? String(roleResult[0].role)
          : 'USER';
        
        // Only allow admins to create users
        if (userRole !== 'ADMIN') {
          throw new Error('Unauthorized: Admin access required');
        }
        
        const { email, password, firstName, lastName, phoneNumber, role } = input;
        
        // Check if user with email already exists
        const existingUser = await prisma.user.findUnique({ 
          where: { email }
        });
        
        if (existingUser) {
          throw new Error('User with this email already exists');
        }
        
        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Create the user
        const user = await prisma.user.create({
          data: {
            email,
            password: hashedPassword,
            firstName,
            lastName,
            phoneNumber,
            role,
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
        
        // Return user with role converted to string
        return {
          ...user,
          role: String(user.role)
        };
      } catch (error) {
        console.error('Create user error:', error);
        throw error;
      }
    },
    
    // Update an existing user (Admin only)
    updateUser: async (_parent: unknown, 
      { id, input }: { id: string; input: UpdateUserInput }, 
      context: { req: NextRequest }
    ) => {
      try {
        const token = context.req.headers.get('authorization')?.split(' ')[1];
        
        if (!token) {
          throw new Error('Not authenticated');
        }
        
        const decoded = await verifyToken(token) as { userId: string; role?: string };
        
        if (!decoded || !decoded.userId) {
          throw new Error('Invalid token');
        }
        
        // Check if user is an admin
        const roleResult = await prisma.$queryRaw`
          SELECT role FROM "User" WHERE id = ${decoded.userId}
        `;
        
        const userRole = roleResult && Array.isArray(roleResult) && roleResult.length > 0 
          ? String(roleResult[0].role)
          : 'USER';
        
        // Only allow admins to update users
        if (userRole !== 'ADMIN') {
          throw new Error('Unauthorized: Admin access required');
        }
        
        // Check if user exists
        const existingUser = await prisma.user.findUnique({
          where: { id }
        });
        
        if (!existingUser) {
          throw new Error('User not found');
        }
        
        // If email is being updated, check for duplicates
        if (input.email && input.email !== existingUser.email) {
          const duplicateEmail = await prisma.user.findUnique({
            where: { email: input.email }
          });
          
          if (duplicateEmail) {
            throw new Error('Email is already in use');
          }
        }
        
        // Update the user
        const updatedUser = await prisma.user.update({
          where: { id },
          data: {
            firstName: input.firstName,
            lastName: input.lastName,
            email: input.email,
            phoneNumber: input.phoneNumber,
            role: input.role,
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
        
        // Return user with role converted to string
        return {
          ...updatedUser,
          role: String(updatedUser.role)
        };
      } catch (error) {
        console.error('Update user error:', error);
        throw error;
      }
    },
    
    // Delete a user (Admin only)
    deleteUser: async (_parent: unknown, 
      { id }: { id: string }, 
      context: { req: NextRequest }
    ) => {
      try {
        const token = context.req.headers.get('authorization')?.split(' ')[1];
        
        if (!token) {
          throw new Error('Not authenticated');
        }
        
        const decoded = await verifyToken(token) as { userId: string; role?: string };
        
        if (!decoded || !decoded.userId) {
          throw new Error('Invalid token');
        }
        
        // Check if user is an admin
        const roleResult = await prisma.$queryRaw`
          SELECT role FROM "User" WHERE id = ${decoded.userId}
        `;
        
        const userRole = roleResult && Array.isArray(roleResult) && roleResult.length > 0 
          ? String(roleResult[0].role)
          : 'USER';
        
        // Only allow admins to delete users
        if (userRole !== 'ADMIN') {
          throw new Error('Unauthorized: Admin access required');
        }
        
        // Check if user exists
        const existingUser = await prisma.user.findUnique({
          where: { id }
        });
        
        if (!existingUser) {
          throw new Error('User not found');
        }
        
        // Prevent deleting own account
        if (id === decoded.userId) {
          throw new Error('You cannot delete your own account');
        }
        
        // Delete the user
        await prisma.user.delete({
          where: { id }
        });
        
        return true;
      } catch (error) {
        console.error('Delete user error:', error);
        throw error;
      }
    }
  }
}; 