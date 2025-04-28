import { NextRequest } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

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

        console.log('Resolving me query with token:', token.substring(0, 10) + '...');
        const decoded = await verifyToken(token) as { userId: string; role?: string };
        
        if (!decoded || !decoded.userId) {
          console.error('Invalid token payload:', decoded);
          throw new Error('Invalid token');
        }
        
        // First check if user exists without selecting the problematic role field
        console.log('Checking if user exists with ID:', decoded.userId);
        const userExists = await prisma.user.findUnique({
          where: { id: decoded.userId },
          select: { id: true }
        });
        
        if (!userExists) {
          console.error('User not found for ID:', decoded.userId);
          throw new Error('User not found');
        }
        
        // Then get the user fields separately
        console.log('Fetching user with ID:', decoded.userId);
        try {
          const user = await prisma.user.findUnique({
            where: { id: decoded.userId },
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              phoneNumber: true,
              createdAt: true,
              updatedAt: true,
            },
          });
          
          // Get the role as a raw value using Prisma's raw queries
          const roleResult = await prisma.$queryRaw`
            SELECT role FROM "User" WHERE id = ${decoded.userId}
          `;
          
          const roleValue = roleResult && Array.isArray(roleResult) && roleResult.length > 0 
            ? roleResult[0].role
            : 'USER';
          
          console.log('User found:', user?.email, 'with role:', roleValue);
          
          return {
            ...user,
            role: String(roleValue), // Convert to string explicitly
          };
        } catch (prismaError) {
          console.error('Prisma error:', prismaError);
          throw new Error('Database error');
        }
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
      
      // Convert role to string before adding to token
      const roleAsString = user.role.toString();
      console.log('Login successful for:', email, 'with role:', roleAsString);
      const token = jwt.sign({ userId: user.id, role: roleAsString }, JWT_SECRET, { expiresIn: '7d' });
      
      // Remove password from returned user object and ignore the password field
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password, ...userWithoutPassword } = user;
      
      // Return user with role converted to string
      return {
        token,
        user: {
          ...userWithoutPassword,
          role: roleAsString
        },
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
      
      // Convert role to string
      const roleAsString = user.role.toString();
      console.log('User registered:', email, 'with role:', roleAsString);
      const token = jwt.sign({ userId: user.id, role: roleAsString }, JWT_SECRET, { expiresIn: '7d' });
      
      return {
        token,
        user: {
          ...user,
          role: roleAsString
        },
      };
    },
    
    updateUser: async (_parent: unknown, { input }: { input: { firstName?: string; lastName?: string; phoneNumber?: string; email?: string; currentPassword?: string; newPassword?: string } }, context: { req: NextRequest }) => {
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
          password?: string 
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
        
        // Convert role to string for consistent serialization
        return {
          ...updatedUser,
          role: updatedUser.role.toString()
        };
      } catch (error) {
        console.error('GraphQL resolver error:', error);
        throw error;
      }
    }
  }
};

export default resolvers; 