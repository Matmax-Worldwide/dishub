import { NextRequest } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { GraphQLScalarType, Kind } from 'graphql';

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
import { externalLinksResolvers } from './resolvers/externalLinks';
import { userResolvers } from './resolvers/users';
import { roleResolvers } from './resolvers/roles';
import { permissionResolvers } from './resolvers/permissions';
import { userPermissionResolvers } from './resolvers/userPermissions';
import { cmsResolvers } from './resolvers/cms';

// DateTime scalar type resolver
const dateTimeScalar = new GraphQLScalarType({
  name: 'DateTime',
  description: 'Date custom scalar type',
  serialize(value) {
    if (value instanceof Date) {
      return value.toISOString(); // Convert outgoing Date to ISO string
    }
    return value;
  },
  parseValue(value) {
    if (typeof value === 'string') {
      return new Date(value); // Convert incoming string to Date
    }
    return null;
  },
  parseLiteral(ast) {
    if (ast.kind === Kind.STRING) {
      return new Date(ast.value); // Convert AST string to Date
    }
    return null;
  },
});

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Helper function to ensure system roles exist
async function ensureSystemRoles() {
  const defaultRoles = [
    { name: 'USER', description: 'Basic user with limited permissions' },
    { name: 'ADMIN', description: 'Administrator with full system access' },
    { name: 'MANAGER', description: 'Manager with access to team resources' },
    { name: 'EMPLOYEE', description: 'Employee with standard workspace access' },
  ];
  
  // Check if roles exist, if not create them
  for (const role of defaultRoles) {
    const existingRole = await prisma.roleModel.findFirst({
      where: { name: role.name }
    });
    
    if (!existingRole) {
      await prisma.roleModel.create({
        data: role
      });
      console.log(`Created default role: ${role.name}`);
    } else {
      console.log(`Role ${role.name} already exists`);
    }
  }
  
  // Return all roles
  return await prisma.roleModel.findMany();
}

// Helper function to ensure system permissions exist
async function ensureSystemPermissions() {
  // First ensure that default roles exist
  await ensureSystemRoles();
  
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
      console.log(`Created default permission: ${perm.name}`);
    }
  }
  
  // Get admin role
  const adminRole = await prisma.roleModel.findFirst({
    where: { name: 'ADMIN' }
  });
  
  if (adminRole) {
    // Give admin role all permissions
    const allPermissions = await prisma.permission.findMany();
    
    for (const permission of allPermissions) {
      // Check if the permission is already assigned to the role
      const isAssigned = await prisma.roleModel.findFirst({
        where: {
          id: adminRole.id,
          permissions: {
            some: {
              id: permission.id
            }
          }
        }
      });
      
      if (!isAssigned) {
        await prisma.roleModel.update({
          where: { id: adminRole.id },
          data: {
            permissions: {
              connect: { id: permission.id }
            }
          }
        });
        console.log(`Assigned permission ${permission.name} to ADMIN role`);
      }
    }
  }
  
  // Get manager role
  const managerRole = await prisma.roleModel.findFirst({
    where: { name: 'MANAGER' }
  });
  
  if (managerRole) {
    // Give manager role read permissions
    const readPermissions = await prisma.permission.findMany({
      where: {
        name: {
          endsWith: ':read'
        }
      }
    });
    
    for (const permission of readPermissions) {
      // Check if the permission is already assigned to the role
      const isAssigned = await prisma.roleModel.findFirst({
        where: {
          id: managerRole.id,
          permissions: {
            some: {
              id: permission.id
            }
          }
        }
      });
      
      if (!isAssigned) {
        await prisma.roleModel.update({
          where: { id: managerRole.id },
          data: {
            permissions: {
              connect: { id: permission.id }
            }
          }
        });
        console.log(`Assigned permission ${permission.name} to MANAGER role`);
      }
    }
  }
}

// Merge all resolvers
const resolvers = {
  // Add DateTime scalar resolver
  DateTime: dateTimeScalar,
  
  // Add JSON scalar resolver
  JSON: {
    __serialize(value: unknown) {
      return value;
    },
  },
  
  Query: {
    // User queries
    me: async (_parent: unknown, _args: unknown, context: { req: NextRequest }) => {
      try {
        const token = context.req.headers.get('authorization')?.split(' ')[1];
        
        if (!token) {
          throw new Error('Not authenticated');
        }

        console.log('Resolving me query with token:', token.substring(0, 10) + '...');
        const decoded = await verifyToken(token) as { userId: string; roleId?: string };
        
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
        
        // Then get the user with role relationship
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
              roleId: true,
              role: {
                select: {
                  id: true,
                  name: true,
                  description: true
                }
              },
              createdAt: true,
              updatedAt: true,
            },
          });
          
          if (!user) {
            throw new Error('User not found');
          }
          
          console.log('User found:', user?.email, 'with role:', user?.role);
          
          // Mantener la estructura del rol como un objeto para que coincida con la definición del tipo
          return {
            ...user,
            // En lugar de devolver role: roleName, devolvemos el objeto role completo
            role: user.role || { id: "default", name: "USER", description: null }
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

    // Get a single user by ID
    user: async (_parent: unknown, args: { id: string }, context: { req: NextRequest }) => {
      try {
        const token = context.req.headers.get('authorization')?.split(' ')[1];
        
        if (!token) {
          throw new Error('Not authenticated');
        }

        const decoded = await verifyToken(token) as { userId: string; roleId?: string };
        
        if (!decoded || !decoded.userId) {
          throw new Error('Invalid token');
        }
        
        // Check if requester is admin or manager
        const requester = await prisma.user.findUnique({
          where: { id: decoded.userId },
          select: {
            role: {
              select: {
                name: true
              }
            }
          }
        });
        
        const requesterRole = requester?.role?.name || 'USER';
        
        // Only admin and manager can see any user
        // Normal users can only see themselves
        if (requesterRole !== 'ADMIN' && requesterRole !== 'MANAGER' && decoded.userId !== args.id) {
          throw new Error('Unauthorized: You can only view your own profile');
        }
        
        // Get the requested user
        const user = await prisma.user.findUnique({
          where: { id: args.id },
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phoneNumber: true,
            isActive: true,
            roleId: true,
            role: {
              select: {
                id: true,
                name: true,
                description: true
              }
            },
            createdAt: true,
            updatedAt: true,
          }
        });
        
        if (!user) {
          throw new Error(`User with ID ${args.id} not found`);
        }
        
        // Return user with formatted dates
        return {
          ...user,
          role: user.role || { id: "default", name: "USER", description: null },
          createdAt: user.createdAt.toISOString(),
          updatedAt: user.updatedAt.toISOString()
        };
      } catch (error) {
        console.error('Get user error:', error);
        throw error;
      }
    },
    
    // Get all users - admin only
    users: async (_parent: unknown, _args: unknown, context: { req: NextRequest }) => {
      try {
        const token = context.req.headers.get('authorization')?.split(' ')[1];
        
        if (!token) {
          throw new Error('Not authenticated');
        }

        const decoded = await verifyToken(token) as { userId: string; roleId?: string };
        
        if (!decoded || !decoded.userId) {
          throw new Error('Invalid token');
        }
        
        // Check if user is an admin by fetching the user and their role
        const currentUser = await prisma.user.findUnique({
          where: { id: decoded.userId },
          select: {
            role: {
              select: {
                name: true
              }
            }
          }
        });
        
        const userRole = currentUser?.role?.name || 'USER';
        
        // Only allow admins to access this endpoint
        if (userRole !== 'ADMIN') {
          throw new Error('Unauthorized: Admin access required');
        }
        
        // Get all users with their roles
        const users = await prisma.user.findMany({
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phoneNumber: true,
            roleId: true,
            isActive: true,
            role: {
              select: {
                id: true,
                name: true,
                description: true
              }
            },
            createdAt: true,
            updatedAt: true,
          },
          orderBy: {
            createdAt: 'desc'
          }
        });
        
        // Mantener la estructura del rol como un objeto para que coincida con la definición del tipo
        return users.map(user => ({
          ...user,
          // Asegurar que el role es siempre un objeto completo
          role: user.role || { id: "default", name: "USER", description: null },
          createdAt: user.createdAt.toISOString(),
          updatedAt: user.updatedAt.toISOString()
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
        
        return prisma.roleModel.findUnique({
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
        
        // Ensure default roles exist
        await ensureSystemRoles();
        
        // Add more detailed logging for debugging
        console.log('Fetching roles with count information');
        
        try {
          // Try to get roles with count data first
          const rolesWithCount = await prisma.roleModel.findMany({
            include: {
              _count: {
                select: {
                  users: true,
                  permissions: true
                }
              }
            }
          });
          console.log('Successfully fetched roles with count data');
          return rolesWithCount;
        } catch (countError) {
          // If that fails, fall back to just getting the roles without count
          console.error('Failed to get roles with count, falling back to basic query:', countError);
          return prisma.roleModel.findMany();
        }
      } catch (error) {
        console.error('Get roles error:', error);
        throw error;
      }
    },
    
    rolesWithCounts: async (_parent: unknown, _args: unknown, context: { req: NextRequest }) => {
      try {
        const token = context.req.headers.get('authorization')?.split(' ')[1];
        
        if (!token) {
          throw new Error('Not authenticated');
        }
        
        const decoded = await verifyToken(token) as { userId: string; role?: string };
        
        if (!decoded || !decoded.userId) {
          throw new Error('Invalid token');
        }
        
        // Ensure default roles exist
        await ensureSystemRoles();
        
        // Get all roles
        const roles = await prisma.roleModel.findMany();
        
        // For each role, get user count and permission count
        const rolesWithCounts = await Promise.all(
          roles.map(async (role) => {
            // Get user count
            const userCount = await prisma.user.count({
              where: {
                roleId: role.id
              }
            });
            
            // Get permission count
            const permissionCount = await prisma.permission.count({
              where: {
                roles: {
                  some: {
                    id: role.id
                  }
                }
              }
            });
            
            return {
              ...role,
              userCount,
              permissionCount
            };
          })
        );
        
        return rolesWithCounts;
      } catch (error) {
        console.error('Get roles with counts error:', error);
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
    ...((externalLinksResolvers.Query as object) || {}),
    ...((userResolvers.Query as object) || {}),
    ...((roleResolvers.Query as object) || {}),
    ...((permissionResolvers.Query as object) || {}),
    ...((userPermissionResolvers.Query as object) || {}),
    
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
    },
    
    // Add CMS queries explicitly
    getSectionComponents: cmsResolvers.Query.getSectionComponents,
    getAllCMSSections: cmsResolvers.Query.getAllCMSSections,
    getAllCMSComponents: cmsResolvers.Query.getAllCMSComponents,
    getCMSComponent: cmsResolvers.Query.getCMSComponent,
    getCMSComponentsByType: cmsResolvers.Query.getCMSComponentsByType,
    getAllCMSPages: cmsResolvers.Query.getAllCMSPages,
    getPagesUsingSectionId: cmsResolvers.Query.getPagesUsingSectionId,
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
          password: true,
          roleId: true,
          role: {
            select: {
              id: true,
              name: true
            }
          },
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
      
      // Get role name and ID for the token
      const roleName = user.role?.name || 'USER';
      console.log('Login successful for:', email, 'with role:', roleName);
      
      // Include both roleId and role name in the token
      const token = jwt.sign({ 
        userId: user.id, 
        roleId: user.roleId,
        role: roleName 
      }, JWT_SECRET, { expiresIn: '7d' });
      
      // Remove password from returned user object
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
      
      // Return user with role as string
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
      
      // Find the USER role
      const userRole = await prisma.roleModel.findFirst({
        where: { name: 'USER' }
      });
      
      if (!userRole) {
        // Create default roles if they don't exist
        await ensureSystemRoles();
      }
      
      // Try to get the role again
      const defaultRole = await prisma.roleModel.findFirst({
        where: { name: 'USER' }
      });
      
      const hashedPassword = await bcrypt.hash(password, 10);
      
      const user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          firstName,
          lastName,
          phoneNumber,
          roleId: defaultRole?.id, // Connect to the USER role
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phoneNumber: true,
          roleId: true,
          role: {
            select: {
              id: true,
              name: true
            }
          },
          createdAt: true,
          updatedAt: true,
        }
      });
      
      // Get role name
      const roleName = user.role?.name || 'USER';
      console.log('User registered:', email, 'with role:', roleName);
      
      // Include both roleId and role name in token
      const token = jwt.sign({ 
        userId: user.id, 
        roleId: user.roleId, 
        role: roleName 
      }, JWT_SECRET, { expiresIn: '7d' });
      
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
    ...('Mutation' in externalLinksResolvers ? (externalLinksResolvers.Mutation as object) : {}),
    ...('Mutation' in userResolvers ? (userResolvers.Mutation as object) : {}),
    ...('Mutation' in roleResolvers ? (roleResolvers.Mutation as object) : {}),
    ...('Mutation' in permissionResolvers ? (permissionResolvers.Mutation as object) : {}),
    ...('Mutation' in userPermissionResolvers ? (userPermissionResolvers.Mutation as object) : {}),

    // Role and permission mutations
    createRole: async (_parent: unknown, { input }: { input: { name: string; description?: string } }, context: { req: NextRequest }) => {
      try {
        const token = context.req.headers.get('authorization')?.split(' ')[1];
        
        if (!token) {
          throw new Error('Not authenticated');
        }
        
        const decoded = await verifyToken(token) as { userId: string; roleId?: string; role?: string };
        
        if (!decoded || !decoded.userId) {
          throw new Error('Invalid token');
        }
        
        // Only admin can create roles - check using relationship
        const user = await prisma.user.findUnique({
          where: { id: decoded.userId },
          select: {
            role: {
              select: {
                name: true
              }
            }
          }
        });
        
        if (user?.role?.name !== 'ADMIN') {
          throw new Error('Unauthorized: Only admins can create roles');
        }
        
        const { name, description } = input;
        
        const role = await prisma.roleModel.create({
          data: {
            name,
            description
          }
        });
        
        return role;
      } catch (error) {
        console.error('Create role error:', error);
        throw error;
      }
    },

    createPermission: async (_parent: unknown, { input }: { input: { name: string; description?: string; roleId?: string } }, context: { req: NextRequest }) => {
      try {
        const token = context.req.headers.get('authorization')?.split(' ')[1];
        
        if (!token) {
          throw new Error('Not authenticated');
        }
        
        const decoded = await verifyToken(token) as { userId: string; roleId?: string; role?: string };
        
        if (!decoded || !decoded.userId) {
          throw new Error('Invalid token');
        }
        
        // Only admin can create permissions - check via relationship
        const user = await prisma.user.findUnique({
          where: { id: decoded.userId },
          select: {
            role: {
              select: {
                name: true
              }
            }
          }
        });
        
        if (user?.role?.name !== 'ADMIN') {
          throw new Error('Unauthorized: Only admins can create permissions');
        }
        
        const { name, description, roleId } = input;
        
        // If roleId is provided, we'll connect this permission to that role
        const permissionData: { 
          name: string; 
          description?: string; 
          roles?: { 
            connect: { id: string } 
          }
        } = {
          name,
          description
        };
        
        if (roleId) {
          permissionData.roles = {
            connect: { id: roleId }
          };
        }
        
        const permission = await prisma.permission.create({
          data: permissionData
        });
        
        return permission;
      } catch (error) {
        console.error('Create permission error:', error);
        throw error;
      }
    },

    assignPermissionToRole: async (_parent: unknown, { roleId, permissionId }: { roleId: string; permissionId: string }, context: { req: NextRequest }) => {
      try {
        const token = context.req.headers.get('authorization')?.split(' ')[1];
        
        if (!token) {
          throw new Error('Not authenticated');
        }
        
        const decoded = await verifyToken(token) as { userId: string; roleId?: string; role?: string };
        
        if (!decoded || !decoded.userId) {
          throw new Error('Invalid token');
        }
        
        // Only admin can assign permissions
        const user = await prisma.user.findUnique({
          where: { id: decoded.userId },
          select: {
            role: {
              select: {
                name: true
              }
            }
          }
        });
        
        if (user?.role?.name !== 'ADMIN') {
          throw new Error('Unauthorized: Only admins can assign permissions to roles');
        }
        
        // First, check if both the role and permission exist
        const role = await prisma.roleModel.findUnique({
          where: { id: roleId }
        });
        
        if (!role) {
          throw new Error('Role not found');
        }
        
        const permission = await prisma.permission.findUnique({
          where: { id: permissionId }
        });
        
        if (!permission) {
          throw new Error('Permission not found');
        }
        
        // Add the permission to the role
        await prisma.roleModel.update({
          where: { id: roleId },
          data: {
            permissions: {
              connect: { id: permissionId }
            }
          }
        });
        
        return permission;
      } catch (error) {
        console.error('Assign permission error:', error);
        throw error;
      }
    },

    removePermissionFromRole: async (_parent: unknown, { roleId, permissionId }: { roleId: string; permissionId: string }, context: { req: NextRequest }) => {
      try {
        const token = context.req.headers.get('authorization')?.split(' ')[1];
        
        if (!token) {
          throw new Error('Not authenticated');
        }
        
        const decoded = await verifyToken(token) as { userId: string; roleId?: string; role?: string };
        
        if (!decoded || !decoded.userId) {
          throw new Error('Invalid token');
        }
        
        // Only admin can remove permissions
        const user = await prisma.user.findUnique({
          where: { id: decoded.userId },
          select: {
            role: {
              select: {
                name: true
              }
            }
          }
        });
        
        if (user?.role?.name !== 'ADMIN') {
          throw new Error('Unauthorized: Only admins can remove permissions from roles');
        }
        
        // First, check if both the role and permission exist
        const role = await prisma.roleModel.findUnique({
          where: { id: roleId }
        });
        
        if (!role) {
          throw new Error('Role not found');
        }
        
        const permission = await prisma.permission.findUnique({
          where: { id: permissionId }
        });
        
        if (!permission) {
          throw new Error('Permission not found');
        }
        
        // Remove the permission from the role
        await prisma.roleModel.update({
          where: { id: roleId },
          data: {
            permissions: {
              disconnect: { id: permissionId }
            }
          }
        });
        
        return true;
      } catch (error) {
        console.error('Remove permission error:', error);
        throw error;
      }
    },

    // Settings mutations
    
    // Add CMS mutations explicitly
    saveSectionComponents: cmsResolvers.Mutation.saveSectionComponents,
    deleteCMSSection: cmsResolvers.Mutation.deleteCMSSection,
    updateCMSSection: cmsResolvers.Mutation.updateCMSSection,
    createCMSComponent: cmsResolvers.Mutation.createCMSComponent,
    updateCMSComponent: cmsResolvers.Mutation.updateCMSComponent,
    deleteCMSComponent: cmsResolvers.Mutation.deleteCMSComponent,
    createPage: cmsResolvers.Mutation.createPage,
    updatePage: cmsResolvers.Mutation.updatePage,
    deletePage: cmsResolvers.Mutation.deletePage,
  },
};

// Verificar resolvers CMS al iniciar
try {
  console.log('==== APOLLO SERVER RESOLVER DIAGNOSTICS ====');
  console.log('CMS Query resolvers:', Object.keys(cmsResolvers.Query || {}).join(', '));
  console.log('CMS Mutation resolvers:', Object.keys(cmsResolvers.Mutation || {}).join(', '));
  
  console.log('Final merged resolvers - Query:', Object.keys(resolvers.Query || {}).join(', '));
  console.log('Final merged resolvers - Mutation:', Object.keys(resolvers.Mutation || {}).join(', '));
  
  // Comprobación de resolvers específicos
  console.log('CMS Query resolver getSectionComponents merged:', 
    Object.keys(resolvers.Query || {}).includes('getSectionComponents'));
  console.log('CMS Mutation resolver saveSectionComponents merged:', 
    Object.keys(resolvers.Mutation || {}).includes('saveSectionComponents'));
  console.log('===========================================');
} catch (error) {
  console.error('Error during resolver diagnostics:', error);
}

export default resolvers; 