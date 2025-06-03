// import { NextRequest } from 'next/server'; // No longer needed if all mutations are refactored
// import { verifyToken } from '@/lib/auth'; // No longer needed if all mutations are refactored
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

// Define input types for TypeScript (from original)
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

interface UserUpdateData {
  firstName?: string;
  lastName?: string;
  email?: string;
  phoneNumber?: string;
  role?: {
    connect: {
      id: string;
    };
  };
}

// Context type for refactored mutations, assuming enhanced context from route.ts
interface ResolverContext {
  user?: { // User will be present if resolver is reached past isAuthenticated shield rule
    id: string;
    role: string;
    permissions: string[];
  };
  // req?: NextRequest; // Could still be part of the context if needed for non-auth reasons
}

export const userResolvers = {
  Query: {
    // User queries are already in the main resolvers.ts file (as per original comment)
  },
  
  Mutation: {
    // createUser (Already Refactored)
    createUser: async (_parent: unknown, 
      { input }: { input: CreateUserInput }, 
    ) => {
      try {
        // Auth handled by graphql-shield
        const { email, password, firstName, lastName, phoneNumber, role } = input;
        
        const existingUser = await prisma.user.findUnique({ 
          where: { email }
        });
        
        if (existingUser) {
          throw new Error('User with this email already exists');
        }
        
        const hashedPassword = await bcrypt.hash(password, 10);
        
        let roleId: string | undefined;
        if (role) {
          const roleRecord = await prisma.roleModel.findFirst({
            where: { OR: [{ id: role }, { name: role }] }
          });
            
          if (roleRecord) {
            roleId = roleRecord.id;
          } else {
            throw new Error(`Role "${role}" not found`);
          }
        }
        
        const user = await prisma.user.create({
          data: {
            email,
            password: hashedPassword,
            firstName,
            lastName,
            phoneNumber,
            ...(roleId ? {
              role: { connect: { id: roleId } }
            } : {})
          },
          include: { role: true }
        });
        
        return {
          ...user,
          role: user.role || null,
          createdAt: user.createdAt.toISOString(),
          updatedAt: user.updatedAt.toISOString()
        };
      } catch (error) {
        console.error('Create user error:', error instanceof Error ? error.message : 'Unknown error');
        throw error;
      }
    },
    
    // updateUser (Already Refactored)
    updateUser: async (_parent: unknown, 
      { id, input }: { id: string; input: UpdateUserInput }, 
    ) => {
      try {
        // Auth handled by graphql-shield
        const existingUser = await prisma.user.findUnique({
          where: { id }
        });
        
        if (!existingUser) {
          throw new Error('User not found');
        }
        
        if (input.email && input.email !== existingUser.email) {
          const duplicateEmailUser = await prisma.user.findUnique({
            where: { email: input.email }
          });
          if (duplicateEmailUser) {
            throw new Error('Email is already in use');
          }
        }
        
        const updateData: UserUpdateData = {
          ...(input.firstName !== undefined ? { firstName: input.firstName } : {}),
          ...(input.lastName !== undefined ? { lastName: input.lastName } : {}),
          ...(input.email !== undefined ? { email: input.email } : {}),
          ...(input.phoneNumber !== undefined ? { phoneNumber: input.phoneNumber } : {})
        };
        
        if (input.role) {
          const roleRecord = await prisma.roleModel.findFirst({
            where: { OR: [{ id: input.role }, { name: input.role }] }
          });
          if (roleRecord) {
            updateData.role = { connect: { id: roleRecord.id } };
          } else {
            throw new Error(`Role "${input.role}" not found`);
          }
        }
        
        const updatedUser = await prisma.user.update({
          where: { id },
          data: updateData,
          include: { role: true }
        });
        
        return {
          ...updatedUser,
          role: updatedUser.role || null,
          createdAt: updatedUser.createdAt.toISOString(),
          updatedAt: updatedUser.updatedAt.toISOString()
        };
      } catch (error) {
        console.error('Update user error:', error instanceof Error ? error.message : 'Unknown error');
        throw error;
      }
    },
    
    // deleteUser (Refactored)
    deleteUser: async (_parent: unknown, 
      { id }: { id: string }, 
      context: ResolverContext
    ) => {
      try {
        // Auth handled by graphql-shield
        // Ensure context.user and context.user.id are available for self-deletion check.
        if (!context.user || !context.user.id) {
          // This case should ideally be caught by an isAuthenticated rule in graphql-shield
          // if the intent is to only allow authenticated users to even attempt deletion.
          // If shield allows unauthenticated users here, this check is critical.
          console.error('DeleteUser: User context not available. This might indicate a shield misconfiguration if authentication is expected.');
          throw new Error('Authentication required to perform this action.');
        }

        const userToDelete = await prisma.user.findUnique({
          where: { id }
        });
        
        if (!userToDelete) {
          throw new Error('User not found');
        }
        
        // Prevent deleting own account
        if (id === context.user.id) {
          throw new Error('You cannot delete your own account. This action must be performed by another authorized user.');
        }
        
        await prisma.user.delete({
          where: { id }
        });
        
        return true; // Successfully deleted
      } catch (error) {
        console.error('Delete user error:', error instanceof Error ? error.message : 'Unknown error');
        // Consider specific error types for client if needed
        // e.g., throw new GraphQLError(error.message, { extensions: { code: 'INTERNAL_SERVER_ERROR' } });
        throw error;
      }
    }
  }
};
