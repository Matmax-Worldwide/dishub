import { NextRequest } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// Import individual resolver modules
import { appointmentResolvers } from './resolvers/appointments';
import { dashboardResolvers } from './resolvers/dashboard';
import { documentResolvers } from './resolvers/documents';
import { helpResolvers } from './resolvers/help';
import { notificationResolvers } from './resolvers/notifications';
import { performanceResolvers } from './resolvers/performance';
import { settingsResolvers } from './resolvers/settings';
import { timeEntryResolvers } from './resolvers/timeEntries';
import { taskResolvers } from './resolvers/tasks';
import { projectResolvers } from './resolvers/projects';
import { contactResolvers } from './resolvers/contact';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Helper function to ensure system permissions exist
async function ensureSystemPermissions() {
  const defaultPermissions = [
    { name: 'user:read', description: 'View user information' },
    { name: 'user:write', description: 'Create or update users' },
    { name: 'user:delete', description: 'Delete users' },
    { name: 'role:read', description: 'View roles' },
    { name: 'role:write', description: 'Create or update roles' },
    { name: 'role:delete', description: 'Delete roles' },
    { name: 'permission:read', description: 'View permissions' },
    { name: 'permission:write', description: 'Create or update permissions' },
    { name: 'permission:delete', description: 'Delete permissions' },
  ];

  // Check if permissions exist, if not create them
  for (const perm of defaultPermissions) {
    const existingPerm = await prisma.permission.findFirst({
      where: { name: perm.name }
    });

    if (!existingPerm) {
      await prisma.permission.create({
        data: perm
      });
    }
  }
}

// Merge all resolvers
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
    
    // Get all users - admin only
    users: async (_parent: unknown, _args: unknown, context: { req: NextRequest }) => {
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
        
        // Only allow admins to access this endpoint
        if (userRole !== 'ADMIN') {
          throw new Error('Unauthorized: Admin access required');
        }
        
        // Get all users
        const users = await prisma.user.findMany({
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
          orderBy: {
            createdAt: 'desc'
          }
        });
        
        // Convert role to string for each user
        return users.map((user: { id: string; email: string; firstName: string; lastName: string; phoneNumber: string | null; role: unknown; createdAt: Date; updatedAt: Date }) => ({
          ...user,
          role: String(user.role)
        }));
      } catch (error) {
        console.error('Get users error:', error);
        throw error;
      }
    },
    
    // Role and permission queries
    role: async (_parent: unknown, args: { id: string }, context: { req: NextRequest }) => {
      try {
        const token = context.req.headers.get('authorization')?.split(' ')[1];
        
        if (!token) {
          throw new Error('Not authenticated');
        }
        
        const decoded = await verifyToken(token) as { userId: string; role?: string };
        
        if (!decoded || !decoded.userId) {
          throw new Error('Invalid token');
        }
        
        return prisma.role.findUnique({
          where: { id: args.id }
        });
      } catch (error) {
        console.error('Get role error:', error);
        throw error;
      }
    },
    
    roles: async (_parent: unknown, _args: unknown, context: { req: NextRequest }) => {
      try {
        const token = context.req.headers.get('authorization')?.split(' ')[1];
        
        if (!token) {
          throw new Error('Not authenticated');
        }
        
        const decoded = await verifyToken(token) as { userId: string; role?: string };
        
        if (!decoded || !decoded.userId) {
          throw new Error('Invalid token');
        }
        
        return prisma.role.findMany();
      } catch (error) {
        console.error('Get roles error:', error);
        throw error;
      }
    },
    
    permissions: async (_parent: unknown, _args: unknown, context: { req: NextRequest }) => {
      try {
        const token = context.req.headers.get('authorization')?.split(' ')[1];
        
        if (!token) {
          throw new Error('Not authenticated');
        }
        
        const decoded = await verifyToken(token) as { userId: string; role?: string };
        
        if (!decoded || !decoded.userId) {
          throw new Error('Invalid token');
        }
        
        // Ensure default permissions exist
        await ensureSystemPermissions();
        
        return prisma.permission.findMany();
      } catch (error) {
        console.error('Get permissions error:', error);
        throw error;
      }
    },
    
    rolePermissions: async (_parent: unknown, args: { roleId: string }, context: { req: NextRequest }) => {
      try {
        const token = context.req.headers.get('authorization')?.split(' ')[1];
        
        if (!token) {
          throw new Error('Not authenticated');
        }
        
        const decoded = await verifyToken(token) as { userId: string; role?: string };
        
        if (!decoded || !decoded.userId) {
          throw new Error('Invalid token');
        }
        
        return prisma.permission.findMany({
          where: { 
            roles: {
              some: {
                id: args.roleId
              }
            }
          }
        });
      } catch (error) {
        console.error('Get role permissions error:', error);
        throw error;
      }
    },
    
    // Include other Query resolvers from imported modules - using type assertion
    ...((appointmentResolvers.Query as object) || {}),
    ...((dashboardResolvers.Query as object) || {}),
    ...((documentResolvers.Query as object) || {}),
    ...((helpResolvers.Query as object) || {}),
    ...((notificationResolvers.Query as object) || {}),
    ...((performanceResolvers.Query as object) || {}),
    ...((settingsResolvers.Query as object) || {}),
    ...((timeEntryResolvers.Query as object) || {}),
    ...((taskResolvers.Query as object) || {}),
    ...((projectResolvers.Query as object) || {}),
    ...((contactResolvers.Query as object) || {}),
    
    // Add explicit fallback for projects query to ensure it exists
    projects: async (_parent: unknown, _args: unknown, context: { req: NextRequest }) => {
      try {
        if (projectResolvers.Query.projects) {
          return await projectResolvers.Query.projects(_parent, _args, context);
        } else {
          console.error("Project resolver missing - returning fallback empty array");
          return [];
        }
      } catch (error) {
        console.error("Error in projects resolver fallback:", error);
        return [];
      }
    }
  },
  
  Mutation: {
    // Auth mutations
    login: async (_parent: unknown, args: { email: string, password: string }) => {
      const { email, password: inputPassword } = args;
      
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
      
      const valid = await bcrypt.compare(inputPassword, user.password);
      
      if (!valid) {
        throw new Error('Invalid password');
      }
      
      // Convert role to string before adding to token
      const roleAsString = user.role.toString();
      console.log('Login successful for:', email, 'with role:', roleAsString);
      const token = jwt.sign({ userId: user.id, role: roleAsString }, JWT_SECRET, { expiresIn: '7d' });
      
      // Remove password from returned user object
      const userWithoutPassword = {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phoneNumber: user.phoneNumber,
        role: roleAsString,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      };
      
      // Return user with role converted to string
      return {
        token,
        user: userWithoutPassword,
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
      
      const userWithoutPassword = {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phoneNumber: user.phoneNumber,
        role: roleAsString,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      };
      
      return {
        token,
        user: userWithoutPassword,
      };
    },

    // Include other Mutation resolvers - using type assertion for safety
    ...('Mutation' in appointmentResolvers ? (appointmentResolvers.Mutation as object) : {}),
    ...('Mutation' in dashboardResolvers ? (dashboardResolvers.Mutation as object) : {}),
    ...('Mutation' in documentResolvers ? (documentResolvers.Mutation as object) : {}),
    ...('Mutation' in helpResolvers ? (helpResolvers.Mutation as object) : {}),
    ...('Mutation' in notificationResolvers ? (notificationResolvers.Mutation as object) : {}),
    ...('Mutation' in performanceResolvers ? (performanceResolvers.Mutation as object) : {}),
    ...('Mutation' in settingsResolvers ? (settingsResolvers.Mutation as object) : {}),
    ...('Mutation' in timeEntryResolvers ? (timeEntryResolvers.Mutation as object) : {}),
    ...('Mutation' in taskResolvers ? (taskResolvers.Mutation as object) : {}),
    ...('Mutation' in projectResolvers ? (projectResolvers.Mutation as object) : {}),
    ...('Mutation' in contactResolvers ? (contactResolvers.Mutation as object) : {}),
  },
};

export default resolvers; 