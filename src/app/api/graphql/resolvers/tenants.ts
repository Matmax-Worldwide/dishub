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

// Helper function to get tenant statistics
async function getTenantStats(tenantId: string) {
  try {
    const [userCount, pageCount, postCount] = await Promise.all([
      prisma.user.count({ where: { tenantId } }),
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



export const tenantResolvers = {
  Query: {
    tenants: async (_parent: unknown, _args: unknown, context: GraphQLContext) => {
      try {
        // Only super admins can see all tenants
        if (!context.user || context.user.role !== 'SUPER_ADMIN') {
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

        if (context.user.role !== 'SUPER_ADMIN' && !context.user.tenants?.some(tenant => tenant.id === id)) {
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
        if (!context.user || context.user.role !== 'SUPER_ADMIN') {
          throw new Error('Unauthorized: Super admin access required');
        }

        // Check if slug is already taken
        const existingTenant = await prisma.tenant.findUnique({
          where: { slug: input.slug }
        });

        if (existingTenant) {
          throw new Error(`Tenant with slug "${input.slug}" already exists`);
        }

        const tenant = await prisma.tenant.create({
          data: {
            name: input.name,
            slug: input.slug,
            domain: input.domain,
            status: input.status || 'ACTIVE',
            planId: input.planId,
            features: input.features || [],
            settings: input.settings as Prisma.InputJsonValue
          }
        });

        return tenant;
      } catch (error) {
        console.error('Create tenant error:', error);
        throw error;
      }
    },

    createTenantSuperAdmin: async (_parent: unknown, { input }: { input: CreateTenantInput }, context: GraphQLContext) => {
      try {
        // Only super admins can create tenants directly
        if (!context.user || context.user.role !== 'SUPER_ADMIN') {
          throw new Error('Unauthorized: Super admin access required');
        }

        // Check if slug is already taken
        const existingTenant = await prisma.tenant.findUnique({
          where: { slug: input.slug }
        });

        if (existingTenant) {
          return {
            success: false,
            message: `Tenant with slug "${input.slug}" already exists`,
            tenant: null
          };
        }

        const tenant = await prisma.tenant.create({
          data: {
            name: input.name,
            slug: input.slug,
            domain: input.domain,
            status: input.status || 'ACTIVE',
            planId: input.planId,
            features: input.features || [],
            settings: input.settings as Prisma.InputJsonValue
          }
        });

        return {
          success: true,
          message: 'Tenant created successfully',
          tenant
        };
      } catch (error) {
        console.error('Create tenant error:', error);
        return {
          success: false,
          message: `Failed to create tenant: ${error instanceof Error ? error.message : 'Unknown error'}`,
          tenant: null
        };
      }
    },

    updateTenant: async (_parent: unknown, { id, input }: { id: string; input: UpdateTenantInput }, context: GraphQLContext) => {
      try {
        // Check authentication
        if (!context.user) {
          throw new Error('Unauthorized: Authentication required');
        }

        // For non-super admins, they can only update their own tenant
        if (context.user.role !== 'SUPER_ADMIN' && !context.user.tenants?.some(tenant => tenant.id === id)) {
          throw new Error('Unauthorized: You can only update your own tenant');
        }

        // Check if the tenant exists
        const existingTenant = await prisma.tenant.findUnique({
          where: { id }
        });

        if (!existingTenant) {
          throw new Error('Tenant not found');
        }

        // If slug is being changed, check if the new slug is available
        if (input.slug && input.slug !== existingTenant.slug) {
          const slugTaken = await prisma.tenant.findUnique({
            where: { slug: input.slug }
          });

          if (slugTaken) {
            throw new Error(`Tenant with slug "${input.slug}" already exists`);
          }
        }

        const updatedTenant = await prisma.tenant.update({
          where: { id },
          data: {
            ...(input.name && { name: input.name }),
            ...(input.slug && { slug: input.slug }),
            ...(input.domain !== undefined && { domain: input.domain }),
            ...(input.status && { status: input.status }),
            ...(input.planId !== undefined && { planId: input.planId }),
            ...(input.features && { features: input.features }),
            ...(input.settings && { settings: input.settings as Prisma.InputJsonValue })
          }
        });

        return updatedTenant;
      } catch (error) {
        console.error('Update tenant error:', error);
        throw error;
      }
    },

    updateTenantSuperAdmin: async (_parent: unknown, { id, input }: { id: string; input: UpdateTenantInput }, context: GraphQLContext) => {
      try {
        // Only super admins can use this mutation
        if (!context.user || context.user.role !== 'SUPER_ADMIN') {
          throw new Error('Unauthorized: Super admin access required');
        }

        // Check if the tenant exists
        const existingTenant = await prisma.tenant.findUnique({
          where: { id }
        });

        if (!existingTenant) {
          return {
            success: false,
            message: 'Tenant not found',
            tenant: null
          };
        }

        // If slug is being changed, check if the new slug is available
        if (input.slug && input.slug !== existingTenant.slug) {
          const slugTaken = await prisma.tenant.findUnique({
            where: { slug: input.slug }
          });

          if (slugTaken) {
            return {
              success: false,
              message: `Tenant with slug "${input.slug}" already exists`,
              tenant: null
            };
          }
        }

        const updatedTenant = await prisma.tenant.update({
          where: { id },
          data: {
            ...(input.name && { name: input.name }),
            ...(input.slug && { slug: input.slug }),
            ...(input.domain !== undefined && { domain: input.domain }),
            ...(input.status && { status: input.status }),
            ...(input.planId !== undefined && { planId: input.planId }),
            ...(input.features && { features: input.features }),
            ...(input.settings && { settings: input.settings as Prisma.InputJsonValue })
          }
        });

        return {
          success: true,
          message: 'Tenant updated successfully',
          tenant: updatedTenant
        };
      } catch (error) {
        console.error('Update tenant error:', error);
        return {
          success: false,
          message: `Failed to update tenant: ${error instanceof Error ? error.message : 'Unknown error'}`,
          tenant: null
        };
      }
    },

    assignTenantAdmin: async (_parent: unknown, { tenantId, userId }: { tenantId: string; userId: string }, context: GraphQLContext) => {
      try {
        // Only super admins can assign tenant admins
        if (!context.user || context.user.role !== 'SUPER_ADMIN') {
          throw new Error('Unauthorized: Super admin access required');
        }

        // Check if tenant exists
        const tenant = await prisma.tenant.findUnique({
          where: { id: tenantId }
        });

        if (!tenant) {
          return {
            success: false,
            message: 'Tenant not found',
            user: null
          };
        }

        // Check if user exists
        const user = await prisma.user.findUnique({
          where: { id: userId },
          include: { role: true }
        });

        if (!user) {
          return {
            success: false,
            message: 'User not found',
            user: null
          };
        }

        // Find the TenantAdmin role
        const tenantAdminRole = await prisma.roleModel.findUnique({
          where: { name: 'TenantAdmin' }
        });

        if (!tenantAdminRole) {
          return {
            success: false,
            message: 'TenantAdmin role not found in the system',
            user: null
          };
        }

        // Update user to assign them to the tenant and make them a TenantAdmin
        const updatedUser = await prisma.user.update({
          where: { id: userId },
          data: {
            tenantId: tenantId,
            roleId: tenantAdminRole.id
          },
          include: {
            role: true,
            tenant: true
          }
        });

        return {
          success: true,
          message: `User ${user.firstName} ${user.lastName} has been assigned as admin for tenant ${tenant.name}`,
          user: updatedUser
        };
      } catch (error) {
        console.error('Assign tenant admin error:', error);
        return {
          success: false,
          message: `Failed to assign tenant admin: ${error instanceof Error ? error.message : 'Unknown error'}`,
          user: null
        };
      }
    },

    registerWithTenant: async (_parent: unknown, { input }: { input: RegisterUserWithTenantInput }) => {
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
          throw new Error(`Tenant with slug "${input.tenantSlug}" already exists`);
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(input.password, 12);

        // Create tenant and user in a transaction
        const result = await prisma.$transaction(async (tx) => {
          // Create tenant
          const tenant = await tx.tenant.create({
            data: {
              name: input.tenantName,
              slug: input.tenantSlug,
              domain: input.tenantDomain,
              status: 'ACTIVE',
              features: input.tenantFeatures || ['CMS_ENGINE']
            }
          });

          // Find or create TenantAdmin role
          let tenantAdminRole = await tx.roleModel.findUnique({
            where: { name: 'TenantAdmin' }
          });

          if (!tenantAdminRole) {
            tenantAdminRole = await tx.roleModel.create({
              data: {
                name: 'TenantAdmin',
                description: 'Administrator of a tenant'
              }
            });
          }

          // Create user
          const user = await tx.user.create({
            data: {
              email: input.email,
              password: hashedPassword,
              firstName: input.firstName,
              lastName: input.lastName,
              phoneNumber: input.phoneNumber,
              tenantId: tenant.id,
              roleId: tenantAdminRole.id,
              emailVerified: new Date() // Auto-verify for tenant admin
            },
            include: {
              role: true,
              tenant: true
            }
          });

          return { tenant, user };
        });

        // Generate JWT token
        const token = jwt.sign(
          { 
            userId: result.user.id, 
            email: result.user.email,
            tenantId: result.tenant.id,
            role: result.user.role?.name 
          },
          JWT_SECRET,
          { expiresIn: '7d' }
        );

        return {
          token,
          user: result.user,
          tenant: result.tenant
        };
      } catch (error) {
        console.error('Register with tenant error:', error);
        throw error;
      }
    }
  }
}; 