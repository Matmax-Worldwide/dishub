import { prisma } from '@/lib/prisma';
import { GraphQLContext } from '../route';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

interface CreateTenantInput {
  name: string;
  slug: string;
  domain?: string;
  status?: 'PENDING' | 'ACTIVE' | 'SUSPENDED' | 'ARCHIVED';
  planId?: string;
  features?: string[];
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

export const tenantResolvers = {
  Query: {
    allTenants: async (_parent: unknown, _args: unknown, context: GraphQLContext) => {
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
          throw new Error('Not authenticated');
        }

        if (context.user.role !== 'SUPER_ADMIN' && context.tenantId !== id) {
          throw new Error('Unauthorized: You can only view your own tenant');
        }

        const tenant = await prisma.tenant.findUnique({
          where: { id }
        });

        if (!tenant) {
          throw new Error(`Tenant with ID ${id} not found`);
        }

        return tenant;
      } catch (error) {
        console.error('Get tenant error:', error);
        throw error;
      }
    },
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
          }
        });

        return tenant;
      } catch (error) {
        console.error('Create tenant error:', error);
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

        // Check if tenant slug is already taken
        const existingTenant = await prisma.tenant.findUnique({
          where: { slug: input.tenantSlug }
        });

        if (existingTenant) {
          throw new Error(`Tenant with slug "${input.tenantSlug}" already exists`);
        }

        // Validate slug format
        if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(input.tenantSlug)) {
          throw new Error('Tenant slug must be lowercase alphanumeric with hyphens only');
        }

        // Find the ADMIN role for the tenant owner
        let adminRole = await prisma.roleModel.findFirst({
          where: { name: 'ADMIN' }
        });

        if (!adminRole) {
          // Create ADMIN role if it doesn't exist
          adminRole = await prisma.roleModel.create({
            data: {
              name: 'ADMIN',
              description: 'Administrator with full system access'
            }
          });
        }

        // Use transaction to ensure both user and tenant are created together
        const result = await prisma.$transaction(async (tx) => {
          // Create the tenant first
          const tenant = await tx.tenant.create({
            data: {
              name: input.tenantName,
              slug: input.tenantSlug,
              domain: input.tenantDomain,
              status: 'ACTIVE',
              features: input.tenantFeatures || [],
            }
          });

          // Hash the password
          const hashedPassword = await bcrypt.hash(input.password, 10);

          // Create the user as admin of the tenant
          const user = await tx.user.create({
            data: {
              email: input.email,
              password: hashedPassword,
              firstName: input.firstName,
              lastName: input.lastName,
              phoneNumber: input.phoneNumber,
              roleId: adminRole!.id,
              tenantId: tenant.id, // Associate user with the tenant
            },
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              phoneNumber: true,
              roleId: true,
              tenantId: true,
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

          return { user, tenant };
        });

        // Generate JWT token with tenant information
        const token = jwt.sign({
          userId: result.user.id,
          roleId: result.user.roleId,
          role: result.user.role?.name || 'ADMIN',
          tenantId: result.tenant.id
        }, JWT_SECRET, { expiresIn: '7d' });

        const userWithoutPassword = {
          id: result.user.id,
          email: result.user.email,
          firstName: result.user.firstName,
          lastName: result.user.lastName,
          phoneNumber: result.user.phoneNumber,
          role: result.user.role?.name || 'ADMIN',
          tenantId: result.user.tenantId,
          createdAt: result.user.createdAt,
          updatedAt: result.user.updatedAt
        };

        return {
          token,
          user: userWithoutPassword,
          tenant: result.tenant
        };
      } catch (error) {
        console.error('Register user with tenant error:', error);
        throw error;
      }
    },
  },
}; 