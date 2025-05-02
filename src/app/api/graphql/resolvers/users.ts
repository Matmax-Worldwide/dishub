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
          SELECT "roleId", r.name as role_name FROM "User" u
          LEFT JOIN "RoleTable" r ON u."roleId" = r.id
          WHERE u.id = ${decoded.userId}
        `;
        
        const userRole = roleResult && Array.isArray(roleResult) && roleResult.length > 0 
          ? String(roleResult[0].role_name)
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
        
        // Check if role is an ID or a name
        let roleId: string | undefined;
        if (role) {
          const isId = /^[0-9a-f-]+$/i.test(role);
          
          if (isId) {
            roleId = role;
          } else {
            const roleRecord = await prisma.roleModel.findFirst({
              where: { name: role }
            });
            
            if (roleRecord) {
              roleId = roleRecord.id;
            } else {
              throw new Error(`Role "${role}" not found`);
            }
          }
        }
        
        // Create the user
        const user = await prisma.user.create({
          data: {
            email,
            password: hashedPassword,
            firstName,
            lastName,
            phoneNumber,
            ...(roleId ? {
              role: {
                connect: {
                  id: roleId
                }
              }
            } : {})
          },
          include: {
            role: true
          }
        });
        
        // Return user with role converted to string
        return {
          ...user,
          role: user.role || { id: "default", name: "USER", description: null },
          createdAt: user.createdAt.toISOString(),
          updatedAt: user.updatedAt.toISOString()
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
          SELECT "roleId", r.name as role_name FROM "User" u
          LEFT JOIN "RoleTable" r ON u."roleId" = r.id
          WHERE u.id = ${decoded.userId}
        `;
        
        const userRole = roleResult && Array.isArray(roleResult) && roleResult.length > 0 
          ? String(roleResult[0].role_name)
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
        
        // Prepare update data with correct Prisma types
        const updateData = {
          ...(input.firstName !== undefined ? { firstName: input.firstName } : {}),
          ...(input.lastName !== undefined ? { lastName: input.lastName } : {}),
          ...(input.email !== undefined ? { email: input.email } : {}),
          ...(input.phoneNumber !== undefined ? { phoneNumber: input.phoneNumber } : {})
        };
        
        // Only add role connection if it exists
        if (input.role) {
          // Check if the role is a valid ID or a role name
          const isId = /^[0-9a-f-]+$/i.test(input.role); // Check if it looks like a UUID
          
          if (isId) {
            // If it's an ID, connect directly
            Object.assign(updateData, {
              role: {
                connect: { id: input.role }
              }
            });
          } else {
            // If it's a role name, find the role first
            const roleRecord = await prisma.roleModel.findFirst({
              where: { name: input.role }
            });
            
            if (roleRecord) {
              Object.assign(updateData, {
                role: {
                  connect: { id: roleRecord.id }
                }
              });
            } else {
              throw new Error(`Role "${input.role}" not found`);
            }
          }
        }
        
        const updatedUser = await prisma.user.update({
          where: { id },
          data: updateData,
          include: {
            role: true
          }
        });
        
        // Return user with role converted to string
        return {
          ...updatedUser,
          role: updatedUser.role || { id: "default", name: "USER", description: null },
          createdAt: updatedUser.createdAt.toISOString(),
          updatedAt: updatedUser.updatedAt.toISOString()
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
          SELECT "roleId", r.name as role_name FROM "User" u
          LEFT JOIN "RoleTable" r ON u."roleId" = r.id
          WHERE u.id = ${decoded.userId}
        `;
        
        const userRole = roleResult && Array.isArray(roleResult) && roleResult.length > 0 
          ? String(roleResult[0].role_name)
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