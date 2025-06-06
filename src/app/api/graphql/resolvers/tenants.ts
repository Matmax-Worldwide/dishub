import { prisma } from '@/lib/prisma';
import { GraphQLContext } from '../route';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Prisma } from '@prisma/client';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

interface CreateTenantInput {
  name: string;
  slug: string;
  domain?: string;
  status?: 'PENDING' | 'ACTIVE' | 'SUSPENDED' | 'ARCHIVED';
  planId?: string;
  features?: string[];
  settings?: Record<string, unknown>;
  // Admin user data (extracted from settings for easier handling)
  adminEmail?: string;
  adminFirstName?: string;
  adminLastName?: string;
  adminPassword?: string;
}

interface RegisterUserWithTenantInput {
  // User data
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  
  // Tenant data
  tenantName: string;
  tenantSlug: string;
  tenantDomain?: string;
  tenantFeatures?: string[];
}

interface UpdateTenantInput {
  id: string;
  name?: string;
  slug?: string;
  domain?: string;
  status?: 'PENDING' | 'ACTIVE' | 'SUSPENDED' | 'ARCHIVED';
  planId?: string;
  features?: string[];
  settings?: Record<string, unknown>;
}

interface AddUserToTenantInput {
  userId: string;
  tenantId: string;
  role: 'OWNER' | 'ADMIN' | 'MANAGER' | 'MEMBER' | 'VIEWER';
}

interface UpdateUserTenantRoleInput {
  userId: string;
  tenantId: string;
  role: 'OWNER' | 'ADMIN' | 'MANAGER' | 'MEMBER' | 'VIEWER';
}

interface RemoveUserFromTenantInput {
  userId: string;
  tenantId: string;
}

// Helper function to get tenant statistics
async function getTenantStats(tenantId: string) {
  try {
    const [userCount, pageCount, postCount] = await Promise.all([
      prisma.userTenant.count({ where: { tenantId, isActive: true } }),
      prisma.page.count({ where: { tenantId } }),
      prisma.post.count({ where: { blog: { tenantId } } })
    ]);

    return { userCount, pageCount, postCount };
  } catch (error) {
    console.error('Error getting tenant stats:', error);
    // Return default values if there's an error
    return { userCount: 0, pageCount: 0, postCount: 0 };
  }
}

// Helper function to check if user has access to tenant
async function userHasAccessToTenant(userId: string, tenantId: string): Promise<boolean> {
  const userTenant = await prisma.userTenant.findUnique({
    where: {
      userId_tenantId: {
        userId,
        tenantId
      }
    }
  });
  
  return userTenant?.isActive === true;
}

export const tenantResolvers = {
  Query: {
    tenants: async (_parent: unknown, _args: unknown, context: GraphQLContext) => {
      try {
        // Only super admins can see all tenants
        if (!context.user || context.user.role !== 'SuperAdmin') {
          throw new Error('Unauthorized: Super admin access required');
        }

        const tenants = await prisma.tenant.findMany({
          orderBy: { createdAt: 'desc' }
        });

        return tenants;
      } catch (error) {
        console.error('Get all tenants error:', error);
        throw error;
      }
    },

    tenant: async (_parent: unknown, { id }: { id: string }, context: GraphQLContext) => {
      try {
        // Users can only see their own tenant or super admins can see any
        if (!context.user) {
          throw new Error('Unauthorized: Authentication required');
        }

        // Super admins can access any tenant
        if (context.user.role === 'SuperAdmin') {
          const tenant = await prisma.tenant.findUnique({
            where: { id }
          });
          return tenant;
        }

        // Check if user has access to this tenant
        const hasAccess = await userHasAccessToTenant(context.user.id, id);

        if (!hasAccess) {
          console.log(`Access denied for user ${context.user.id} with role ${context.user.role} to tenant ${id}.`);
          throw new Error('Unauthorized: Access denied');
        }

        const tenant = await prisma.tenant.findUnique({
          where: { id }
        });

        return tenant;
      } catch (error) {
        console.error('Get tenant error:', error);
        throw error;
      }
    },

    tenantUsers: async (_parent: unknown, { tenantId }: { tenantId: string }, context: GraphQLContext) => {
      try {
        console.log('TenantUsers query - User context:', context.user);
        console.log('TenantUsers query - User role:', context.user?.role);
        
        // Check if user is authenticated
        if (!context.user) {
          throw new Error('Unauthorized: Authentication required');
        }

        // Allow super admins or users with access to the tenant
        const userRole = context.user.role;
        const allowedRoles = ['SuperAdmin', 'ADMIN', 'Admin'];
        
        if (!allowedRoles.includes(userRole)) {
          // Check if user has access to this tenant
          const hasAccess = await userHasAccessToTenant(context.user.id, tenantId);
          if (!hasAccess) {
          console.log(`Access denied for role: ${userRole}. Allowed roles:`, allowedRoles);
            throw new Error(`Unauthorized: Access denied. Current role: ${userRole}`);
          }
        }

        console.log(`TenantUsers query - Access granted for role: ${userRole}`);

        const userTenants = await prisma.userTenant.findMany({
          where: { tenantId, isActive: true },
          include: {
            user: {
              include: {
                role: true
              }
            }
          },
          orderBy: {
            joinedAt: 'desc'
          }
        });

        console.log(`TenantUsers query - Found ${userTenants.length} users for tenant ${tenantId}`);

        return userTenants.map(userTenant => ({
          ...userTenant.user,
          role: userTenant.user.role || { id: "default", name: "USER", description: null },
          createdAt: userTenant.user.createdAt.toISOString(),
          updatedAt: userTenant.user.updatedAt.toISOString()
        }));
      } catch (error) {
        console.error('Get tenant users error:', error);
        throw error;
      }
    },

    userTenants: async (_parent: unknown, { userId }: { userId: string }, context: GraphQLContext) => {
      try {
        // Users can only see their own tenants or super admins can see any
        if (!context.user) {
          throw new Error('Unauthorized: Authentication required');
        }

        if (context.user.role !== 'SuperAdmin' && context.user.id !== userId) {
          throw new Error('Unauthorized: Can only view your own tenants');
        }

        const userTenants = await prisma.userTenant.findMany({
          where: { userId, isActive: true },
          include: {
            tenant: true,
            user: true
          },
          orderBy: {
            joinedAt: 'desc'
          }
        });

        return userTenants;
      } catch (error) {
        console.error('Get user tenants error:', error);
        throw error;
      }
    },

    tenantMembers: async (_parent: unknown, { tenantId }: { tenantId: string }, context: GraphQLContext) => {
      try {
        if (!context.user) {
          throw new Error('Unauthorized: Authentication required');
        }

        // Check if user has access to this tenant or is super admin
        if (context.user.role !== 'SuperAdmin') {
          const hasAccess = await userHasAccessToTenant(context.user.id, tenantId);
          if (!hasAccess) {
            throw new Error('Unauthorized: Access denied');
          }
        }

        const userTenants = await prisma.userTenant.findMany({
          where: { tenantId, isActive: true },
          include: {
            user: {
              include: {
                role: true
              }
            },
            tenant: true
          },
          orderBy: {
            joinedAt: 'desc'
          }
        });

        return userTenants;
      } catch (error) {
        console.error('Get tenant members error:', error);
        throw error;
      }
    },

    userTenant: async (_parent: unknown, { userId, tenantId }: { userId: string, tenantId: string }, context: GraphQLContext) => {
      try {
        if (!context.user) {
          throw new Error('Unauthorized: Authentication required');
        }

        // Users can only see their own relationship or super admins can see any
        if (context.user.role !== 'SuperAdmin' && context.user.id !== userId) {
          throw new Error('Unauthorized: Access denied');
        }

        const userTenant = await prisma.userTenant.findUnique({
          where: {
            userId_tenantId: {
              userId,
              tenantId
            }
          },
          include: {
            user: {
              include: {
                role: true
              }
            },
            tenant: true
          }
        });

        return userTenant;
      } catch (error) {
        console.error('Get user tenant error:', error);
        throw error;
      }
    },
  },

  // Add resolvers for computed fields on Tenant type
  Tenant: {
    userCount: async (parent: { id: string }) => {
      const stats = await getTenantStats(parent.id);
      return stats.userCount;
    },
    pageCount: async (parent: { id: string }) => {
      const stats = await getTenantStats(parent.id);
      return stats.pageCount;
    },
    postCount: async (parent: { id: string }) => {
      const stats = await getTenantStats(parent.id);
      return stats.postCount;
    },
    userTenants: async (parent: { id: string }) => {
      try {
        const userTenants = await prisma.userTenant.findMany({
          where: { tenantId: parent.id, isActive: true },
          include: {
            user: {
              include: {
                role: true
              }
            },
            tenant: true
          },
          orderBy: {
            joinedAt: 'desc'
          }
        });
        
        return userTenants;
      } catch (error) {
        console.error('Error resolving tenant.userTenants:', error);
        return [];
      }
    },
    users: async (parent: { id: string }) => {
      try {
        const userTenants = await prisma.userTenant.findMany({
          where: { tenantId: parent.id, isActive: true },
          include: {
            user: {
          include: {
            role: true
              }
            }
          },
          orderBy: {
            joinedAt: 'desc'
          }
        });
        
        return userTenants.map(userTenant => ({
          ...userTenant.user,
          role: userTenant.user.role || { id: "default", name: "USER", description: null },
          createdAt: userTenant.user.createdAt.toISOString(),
          updatedAt: userTenant.user.updatedAt.toISOString()
        }));
      } catch (error) {
        console.error('Error resolving tenant.users:', error);
        return [];
      }
    }
  },

  // Add resolvers for User type
  User: {
    userTenants: async (parent: { id: string }) => {
      try {
        const userTenants = await prisma.userTenant.findMany({
          where: { userId: parent.id, isActive: true },
          include: {
            user: {
              include: {
                role: true
              }
            },
            tenant: true
          },
          orderBy: {
            joinedAt: 'desc'
          }
        });
        
        return userTenants;
      } catch (error) {
        console.error('Error resolving user.userTenants:', error);
        return [];
      }
    },
    tenants: async (parent: { id: string }) => {
      try {
        const userTenants = await prisma.userTenant.findMany({
          where: { userId: parent.id, isActive: true },
          include: {
            tenant: true
          },
          orderBy: {
            joinedAt: 'desc'
          }
        });
        
        return userTenants.map(userTenant => userTenant.tenant);
      } catch (error) {
        console.error('Error resolving user.tenants:', error);
        return [];
      }
    }
  },

  // Add resolvers for TenantDetails type
  TenantDetails: {
    userCount: async (parent: { id: string }) => {
      const stats = await getTenantStats(parent.id);
      return stats.userCount;
    },
    pageCount: async (parent: { id: string }) => {
      const stats = await getTenantStats(parent.id);
      return stats.pageCount;
    },
    postCount: async (parent: { id: string }) => {
      const stats = await getTenantStats(parent.id);
      return stats.postCount;
    }
  },

  Mutation: {
    createTenant: async (_parent: unknown, { input }: { input: CreateTenantInput }, context: GraphQLContext) => {
      try {
        // Only super admins can create tenants directly
        if (!context.user || context.user.role !== 'SuperAdmin') {
          throw new Error('Unauthorized: Super admin access required');
        }

        const tenant = await prisma.tenant.create({
          data: {
            name: input.name,
            slug: input.slug,
            domain: input.domain,
            status: input.status || 'ACTIVE',
            planId: input.planId,
            features: input.features || [],
            settings: (input.settings as Prisma.JsonValue) || {}
          }
        });

        return tenant;
      } catch (error) {
        console.error('Create tenant error:', error);
        throw error;
      }
    },

    updateTenant: async (_parent: unknown, { input }: { input: UpdateTenantInput }, context: GraphQLContext) => {
      try {
        // Only super admins can update tenants directly
        if (!context.user || context.user.role !== 'SuperAdmin') {
          throw new Error('Unauthorized: Super admin access required');
        }

        const { id, ...updateData } = input;

        const tenant = await prisma.tenant.update({
          where: { id },
          data: updateData as Prisma.TenantUpdateInput
        });

        return tenant;
      } catch (error) {
        console.error('Update tenant error:', error);
        throw error;
      }
    },

    registerUserWithTenant: async (_parent: unknown, { input }: { input: RegisterUserWithTenantInput }) => {
      try {
        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
          where: { email: input.email }
        });

        if (existingUser) {
          throw new Error('User with this email already exists');
        }

        // Check if tenant slug is available
        const existingTenant = await prisma.tenant.findUnique({
          where: { slug: input.tenantSlug }
        });

        if (existingTenant) {
          throw new Error('Tenant slug is already taken');
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(input.password, 12);

        // Create user and tenant in a transaction
        const result = await prisma.$transaction(async (tx) => {
          // Create tenant
          const tenant = await tx.tenant.create({
            data: {
              name: input.tenantName,
              slug: input.tenantSlug,
              domain: input.tenantDomain,
              status: 'ACTIVE',
              features: input.tenantFeatures || []
            }
          });

          // Find or create TenantAdmin role
          let tenantAdminRole = await tx.roleModel.findFirst({
            where: { 
              OR: [
                { name: 'TenantAdmin' }
              ]
            }
          });

          if (!tenantAdminRole) {
            tenantAdminRole = await tx.roleModel.create({
              data: {
                name: 'TenantAdmin',
                description: 'Administrator of a tenant with full access to tenant resources'
              }
            });
          }

          // Create user with TenantAdmin role
          const user = await tx.user.create({
            data: {
              email: input.email,
              password: hashedPassword,
              firstName: input.firstName,
              lastName: input.lastName,
              phoneNumber: input.phoneNumber,
              roleId: tenantAdminRole.id,
              isActive: true
            },
            include: {
              role: true
            }
          });

          // Create user-tenant relationship with OWNER role
          await tx.userTenant.create({
            data: {
              userId: user.id,
              tenantId: tenant.id,
              role: 'OWNER',
              isActive: true
            }
          });

          return { user, tenant };
        });

        // Generate JWT token
        const token = jwt.sign(
          { 
            userId: result.user.id, 
            role: result.user.role?.name || 'USER',
            roleId: result.user.roleId,
            tenantId: result.tenant.id
          },
          JWT_SECRET,
          { expiresIn: '7d' }
        );

        // Fetch complete user data with all relationships
        const completeUser = await prisma.user.findUnique({
          where: { id: result.user.id },
          include: {
            role: true,
            userTenants: {
              where: { isActive: true },
              include: {
                tenant: true
              }
            }
          }
        });

        return {
          token,
          user: {
            ...completeUser!,
            role: completeUser!.role || { id: "default", name: "USER", description: null },
            createdAt: completeUser!.createdAt.toISOString(),
            updatedAt: completeUser!.updatedAt.toISOString()
          },
          tenant: result.tenant
        };
      } catch (error) {
        console.error('Register user with tenant error:', error);
        throw error;
      }
    },

    addUserToTenant: async (_parent: unknown, { input }: { input: AddUserToTenantInput }, context: GraphQLContext) => {
      try {
        if (!context.user) {
          throw new Error('Unauthorized: Authentication required');
        }

        // Check if user has permission to add users to this tenant
        if (context.user.role !== 'SuperAdmin') {
          const userTenant = await prisma.userTenant.findUnique({
            where: {
              userId_tenantId: {
                userId: context.user.id,
                tenantId: input.tenantId
              }
            }
          });

          if (!userTenant || !['OWNER', 'ADMIN'].includes(userTenant.role)) {
            throw new Error('Unauthorized: Only tenant owners and admins can add users');
          }
        }

        // Check if user exists
        const user = await prisma.user.findUnique({
          where: { id: input.userId }
        });

        if (!user) {
          throw new Error('User not found');
        }

        // Check if tenant exists
        const tenant = await prisma.tenant.findUnique({
          where: { id: input.tenantId }
        });

        if (!tenant) {
          throw new Error('Tenant not found');
        }

        // Check if relationship already exists
        const existingUserTenant = await prisma.userTenant.findUnique({
          where: {
            userId_tenantId: {
              userId: input.userId,
              tenantId: input.tenantId
            }
          }
        });

        if (existingUserTenant) {
          if (existingUserTenant.isActive) {
            throw new Error('User is already a member of this tenant');
          } else {
            // Reactivate the relationship
            const userTenant = await prisma.userTenant.update({
              where: {
                userId_tenantId: {
                  userId: input.userId,
                  tenantId: input.tenantId
                }
              },
              data: {
                role: input.role,
                isActive: true,
                leftAt: null
              },
              include: {
                user: {
                  include: {
                    role: true
                  }
                },
                tenant: true
              }
            });

            return {
              success: true,
              message: 'User successfully re-added to tenant',
              userTenant
            };
          }
        }

        // Create new user-tenant relationship
        const userTenant = await prisma.userTenant.create({
          data: {
            userId: input.userId,
            tenantId: input.tenantId,
            role: input.role,
            isActive: true
          },
          include: {
            user: {
              include: {
                role: true
              }
            },
            tenant: true
          }
        });

        return {
          success: true,
          message: 'User successfully added to tenant',
          userTenant
        };
      } catch (error) {
        console.error('Add user to tenant error:', error);
        return {
          success: false,
          message: error instanceof Error ? error.message : 'Failed to add user to tenant',
          userTenant: null
        };
      }
    },

    updateUserTenantRole: async (_parent: unknown, { input }: { input: UpdateUserTenantRoleInput }, context: GraphQLContext) => {
      try {
        if (!context.user) {
          throw new Error('Unauthorized: Authentication required');
        }

        // Check if user has permission to update roles in this tenant
        if (context.user.role !== 'SuperAdmin') {
          const userTenant = await prisma.userTenant.findUnique({
            where: {
              userId_tenantId: {
                userId: context.user.id,
                tenantId: input.tenantId
              }
            }
          });

          if (!userTenant || !['OWNER', 'ADMIN'].includes(userTenant.role)) {
            throw new Error('Unauthorized: Only tenant owners and admins can update user roles');
          }
        }

        // Check if user-tenant relationship exists
        const existingUserTenant = await prisma.userTenant.findUnique({
          where: {
            userId_tenantId: {
              userId: input.userId,
              tenantId: input.tenantId
            }
          }
        });

        if (!existingUserTenant || !existingUserTenant.isActive) {
          throw new Error('User is not a member of this tenant');
        }

        // Update the role
        const userTenant = await prisma.userTenant.update({
          where: {
            userId_tenantId: {
              userId: input.userId,
              tenantId: input.tenantId
            }
          },
          data: {
            role: input.role
          },
          include: {
            user: {
              include: {
                role: true
              }
            },
            tenant: true
          }
        });

        return {
          success: true,
          message: 'User role successfully updated',
          userTenant
        };
      } catch (error) {
        console.error('Update user tenant role error:', error);
        return {
          success: false,
          message: error instanceof Error ? error.message : 'Failed to update user role',
          userTenant: null
        };
      }
    },

    removeUserFromTenant: async (_parent: unknown, { input }: { input: RemoveUserFromTenantInput }, context: GraphQLContext) => {
      try {
        if (!context.user) {
          throw new Error('Unauthorized: Authentication required');
        }

        // Check if user has permission to remove users from this tenant
        if (context.user.role !== 'SuperAdmin') {
          const userTenant = await prisma.userTenant.findUnique({
            where: {
              userId_tenantId: {
                userId: context.user.id,
                tenantId: input.tenantId
              }
            }
          });

          if (!userTenant || !['OWNER', 'ADMIN'].includes(userTenant.role)) {
            throw new Error('Unauthorized: Only tenant owners and admins can remove users');
          }
        }

        // Check if user-tenant relationship exists
        const existingUserTenant = await prisma.userTenant.findUnique({
          where: {
            userId_tenantId: {
              userId: input.userId,
              tenantId: input.tenantId
            }
          }
        });

        if (!existingUserTenant || !existingUserTenant.isActive) {
          throw new Error('User is not a member of this tenant');
        }

        // Prevent removing the last owner
        if (existingUserTenant.role === 'OWNER') {
          const ownerCount = await prisma.userTenant.count({
            where: {
              tenantId: input.tenantId,
              role: 'OWNER',
              isActive: true
            }
          });

          if (ownerCount <= 1) {
            throw new Error('Cannot remove the last owner of the tenant');
          }
        }

        // Soft delete by setting isActive to false and leftAt timestamp
        const userTenant = await prisma.userTenant.update({
          where: {
            userId_tenantId: {
              userId: input.userId,
              tenantId: input.tenantId
            }
          },
          data: {
            isActive: false,
            leftAt: new Date()
          },
          include: {
            user: {
              include: {
                role: true
              }
            },
            tenant: true
          }
        });

        return {
          success: true,
          message: 'User successfully removed from tenant',
          userTenant
        };
      } catch (error) {
        console.error('Remove user from tenant error:', error);
        return {
          success: false,
          message: error instanceof Error ? error.message : 'Failed to remove user from tenant',
          userTenant: null
        };
      }
    },
  }
}; 