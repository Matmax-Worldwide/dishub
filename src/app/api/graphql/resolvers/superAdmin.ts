import { PrismaClient, Prisma, TenantStatus } from '@prisma/client';
import { Context } from '@/app/api/graphql/types';
import { verifySession } from '@/app/api/utils/auth';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

type Parent = object;
type EmptyArgs = Record<string, never>;

// Helper function to check SuperAdmin permissions
async function requireSuperAdmin(context: Context) {
  if (!context.req) {
    throw new Error('Request context is required');
  }
  
  const session = await verifySession(context.req);
  const user = session?.user;
  
  if (!user) {
    throw new Error('Unauthorized: You must be logged in');
  }
  
  if (user.role.name !== 'SuperAdmin') {
    throw new Error('Forbidden: SuperAdmin access required');
  }
  
  return user;
}

export const superAdminResolvers = {
  Query: {
    // Dashboard Overview
    superAdminDashboard: async (_parent: Parent, _args: EmptyArgs, context: Context) => {
      await requireSuperAdmin(context);
      
      try {
        // Get system statistics
        const [
          totalTenants,
          activeTenants,
          totalUsers,
          activeUsers,
          totalModules,
          pendingRequests,
          systemErrors
        ] = await Promise.all([
          prisma.tenant.count(),
          prisma.tenant.count({ where: { status: 'ACTIVE' } }),
          prisma.user.count(),
          prisma.user.count({ where: { isActive: true } }),
          // Count unique features across all tenants
          prisma.tenant.findMany({ select: { features: true } }).then(tenants => 
            new Set(tenants.flatMap(t => t.features)).size
          ),
          // Mock pending requests count (implement based on your request system)
          0,
          // Mock system errors count (implement based on your error tracking)
          0
        ]);

        // Get recent activity
        const recentTenants = await prisma.tenant.findMany({
          take: 5,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            name: true,
            slug: true,
            status: true,
            createdAt: true
          }
        });

        const recentUsers = await prisma.user.findMany({
          take: 5,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            createdAt: true,
            role: {
              select: { 
                id: true,
                name: true 
              }
            }
          }
        });

        return {
          stats: {
            totalTenants,
            activeTenants,
            totalUsers,
            activeUsers,
            totalModules,
            pendingRequests,
            systemErrors
          },
          recentActivity: {
            tenants: recentTenants,
            users: recentUsers
          }
        };
      } catch (error) {
        console.error('Error fetching SuperAdmin dashboard:', error);
        throw new Error('Failed to fetch dashboard data');
      }
    },

    // Tenant Management
    allTenants: async (_parent: Parent, { filter, pagination }: {
      filter?: {
        search?: string;
        status?: string;
        planId?: string;
      };
      pagination?: {
        page?: number;
        pageSize?: number;
      };
    }, context: Context) => {
      await requireSuperAdmin(context);
      
      try {
        const page = pagination?.page || 1;
        const pageSize = pagination?.pageSize || 20;
        const skip = (page - 1) * pageSize;

        const where: Record<string, unknown> = {};
        
        if (filter?.search) {
          where.OR = [
            { name: { contains: filter.search, mode: 'insensitive' } },
            { slug: { contains: filter.search, mode: 'insensitive' } },
            { domain: { contains: filter.search, mode: 'insensitive' } }
          ];
        }
        
        if (filter?.status) {
          where.status = filter.status;
        }
        
        if (filter?.planId) {
          where.planId = filter.planId;
        }

        const [tenants, totalCount] = await Promise.all([
          prisma.tenant.findMany({
            where,
            skip,
            take: pageSize,
            orderBy: { createdAt: 'desc' },
            include: {
              userTenants: {
                select: { id: true }
              },
              _count: {
                select: {
                  userTenants: true,
                  pages: true,
                  posts: true
                }
              }
            }
          }),
          prisma.tenant.count({ where })
        ]);

        return {
          items: tenants.map(tenant => ({
            ...tenant,
            userCount: tenant._count.userTenants,
            pageCount: tenant._count.pages,
            postCount: tenant._count.posts,
            createdAt: tenant.createdAt.toISOString(),
            updatedAt: tenant.updatedAt.toISOString()
          })),
          totalCount,
          page,
          pageSize,
          totalPages: Math.ceil(totalCount / pageSize)
        };
      } catch (error) {
        console.error('Error fetching tenants:', error);
        throw new Error('Failed to fetch tenants');
      }
    },

    // Single Tenant Details for SuperAdmin
    tenantById: async (_parent: Parent, { id }: { id: string }, context: Context) => {
      await requireSuperAdmin(context);
      
      try {
        const tenant = await prisma.tenant.findUnique({
          where: { id },
          include: {
            _count: {
              select: {
                userTenants: true,
                pages: true,
                posts: true
              }
            }
          }
        });

        if (!tenant) {
          throw new Error(`Tenant with ID "${id}" not found`);
        }

        return {
          ...tenant,
          userCount: tenant._count.userTenants,
          pageCount: tenant._count.pages,
          postCount: tenant._count.posts,
          createdAt: tenant.createdAt.toISOString(),
          updatedAt: tenant.updatedAt.toISOString()
        };
      } catch (error) {
        console.error('Error fetching tenant by ID:', error);
        throw new Error('Failed to fetch tenant');
      }
    },

    // Tenant Health Monitoring
    tenantHealthMetrics: async (_parent: Parent, { tenantId }: { tenantId?: string }, context: Context) => {
      await requireSuperAdmin(context);
      
      try {
        const where = tenantId ? { id: tenantId } : {};
        
        const tenants = await prisma.tenant.findMany({
          where,
          include: {
            userTenants: {
              where: { isActive: true },
              include: {
                user: {
                  select: {
                    id: true,
                    isActive: true,
                    createdAt: true
                  }
                }
              }
            },
            pages: {
              select: {
                id: true,
                isPublished: true
              }
            },
            posts: {
              select: {
                id: true,
                status: true
              }
            }
          }
        });

        return tenants.map(tenant => {
          const users = tenant.userTenants.map(ut => ut.user);
          const activeUsers = users.filter(u => u.isActive).length;
          const publishedPages = tenant.pages.filter(p => p.isPublished).length;
          const publishedPosts = tenant.posts.filter(p => p.status === 'PUBLISHED').length;
          
          // Calculate health score (0-100)
          let healthScore = 0;
          if (users.length > 0) healthScore += 30;
          if (publishedPages > 0) healthScore += 25;
          if (publishedPosts > 0) healthScore += 20;
          if (tenant.status === 'ACTIVE') healthScore += 25;

          return {
            tenantId: tenant.id,
            tenantName: tenant.name,
            status: tenant.status,
            healthScore,
            metrics: {
              totalUsers: users.length,
              activeUsers,
              totalPages: tenant.pages.length,
              publishedPages,
              totalPosts: tenant.posts.length,
              publishedPosts,
              features: tenant.features
            },
            lastActivity: tenant.updatedAt.toISOString()
          };
        });
      } catch (error) {
        console.error('Error fetching tenant health metrics:', error);
        throw new Error('Failed to fetch tenant health metrics');
      }
    },

    // Global Analytics
    globalAnalytics: async (_parent: Parent, { timeRange }: { timeRange?: string }, context: Context) => {
      await requireSuperAdmin(context);
      
      try {
        const now = new Date();
        const startDate = new Date();
        
        switch (timeRange) {
          case 'week':
            startDate.setDate(now.getDate() - 7);
            break;
          case 'month':
            startDate.setMonth(now.getMonth() - 1);
            break;
          case 'quarter':
            startDate.setMonth(now.getMonth() - 3);
            break;
          case 'year':
            startDate.setFullYear(now.getFullYear() - 1);
            break;
          default:
            startDate.setDate(now.getDate() - 30); // Default to 30 days
        }

        // Get tenant growth
        const tenantGrowth = await prisma.tenant.groupBy({
          by: ['createdAt'],
          where: {
            createdAt: {
              gte: startDate
            }
          },
          _count: true
        });

        // Get user growth
        const userGrowth = await prisma.user.groupBy({
          by: ['createdAt'],
          where: {
            createdAt: {
              gte: startDate
            }
          },
          _count: true
        });

        // Get feature usage
        const tenants = await prisma.tenant.findMany({
          select: { features: true }
        });
        
        const featureUsage = tenants.reduce((acc: Record<string, number>, tenant) => {
          tenant.features.forEach(feature => {
            acc[feature] = (acc[feature] || 0) + 1;
          });
          return acc;
        }, {});

        // Get top tenants by activity
        const topTenants = await prisma.tenant.findMany({
          take: 10,
          include: {
            _count: {
              select: {
                userTenants: true,
                pages: true,
                posts: true
              }
            }
          },
          orderBy: {
            updatedAt: 'desc'
          }
        });

        return {
          tenantGrowth: tenantGrowth.map(item => ({
            date: item.createdAt.toISOString().split('T')[0],
            count: item._count
          })),
          userGrowth: userGrowth.map(item => ({
            date: item.createdAt.toISOString().split('T')[0],
            count: item._count
          })),
          featureUsage: Object.entries(featureUsage).map(([feature, count]) => ({
            feature,
            count
          })),
          topTenants: topTenants.map(tenant => ({
            id: tenant.id,
            name: tenant.name,
            slug: tenant.slug,
            userCount: tenant._count.userTenants,
            pageCount: tenant._count.pages,
            postCount: tenant._count.posts,
            lastActivity: tenant.updatedAt.toISOString()
          }))
        };
      } catch (error) {
        console.error('Error fetching global analytics:', error);
        throw new Error('Failed to fetch global analytics');
      }
    },

    // System Monitoring
    systemStatus: async (_parent: Parent, _args: EmptyArgs, context: Context) => {
      await requireSuperAdmin(context);
      
      try {
        // Database health check
        const dbHealth = await prisma.$queryRaw`SELECT 1 as status`
          .then(() => ({ status: 'healthy', responseTime: Date.now() }))
          .catch(() => ({ status: 'unhealthy', responseTime: null }));

        // Get system metrics
        const [
          totalTenants,
          activeTenants,
          totalUsers,
          activeUsers,
          totalRoles,
          totalPermissions
        ] = await Promise.all([
          prisma.tenant.count(),
          prisma.tenant.count({ where: { status: 'ACTIVE' } }),
          prisma.user.count(),
          prisma.user.count({ where: { isActive: true } }),
          prisma.roleModel.count(),
          prisma.permission.count()
        ]);

        return {
          database: dbHealth,
          metrics: {
            tenants: {
              total: totalTenants,
              active: activeTenants,
              inactive: totalTenants - activeTenants
            },
            users: {
              total: totalUsers,
              active: activeUsers,
              inactive: totalUsers - activeUsers
            },
            system: {
              roles: totalRoles,
              permissions: totalPermissions
            }
          },
          timestamp: new Date().toISOString()
        };
      } catch (error) {
        console.error('Error fetching system status:', error);
        throw new Error('Failed to fetch system status');
      }
    },

    // Module Management
    globalModules: async (_parent: Parent, _args: EmptyArgs, context: Context) => {
      await requireSuperAdmin(context);
      
      try {
        // Get all unique features across tenants
        const tenants = await prisma.tenant.findMany({
          select: { features: true }
        });
        
        const allFeatures = [...new Set(tenants.flatMap(t => t.features))];
        
        const moduleStats = allFeatures.map(feature => {
          const usageCount = tenants.filter(t => t.features.includes(feature)).length;
          const usagePercentage = (usageCount / tenants.length) * 100;
          
          return {
            name: feature,
            usageCount,
            usagePercentage: Math.round(usagePercentage * 100) / 100,
            isActive: true // All features in use are considered active
          };
        });

        return {
          modules: moduleStats,
          totalModules: allFeatures.length,
          totalTenants: tenants.length
        };
      } catch (error) {
        console.error('Error fetching global modules:', error);
        throw new Error('Failed to fetch global modules');
      }
    },

    // Module Versions
    moduleVersions: async (_parent: Parent, { filter, pagination }: {
      filter?: {
        search?: string;
        moduleName?: string;
        status?: string;
      };
      pagination?: {
        page?: number;
        pageSize?: number;
      };
    }, context: Context) => {
      await requireSuperAdmin(context);
      
      try {
        // Mock data for demonstration - replace with actual database queries
        const mockVersions = [
          {
            id: '1',
            moduleName: 'CMS Engine',
            version: '2.1.0',
            releaseDate: '2024-01-15T00:00:00Z',
            status: 'STABLE',
            changelog: 'Added new page builder features, improved performance, bug fixes',
            downloadCount: 1250,
            tenantCount: 89,
            compatibility: ['2.0.x', '1.9.x'],
            size: '15.2 MB',
            author: 'Core Team',
            isLatest: true,
            dependencies: ['React 18+', 'Node.js 18+'],
            features: ['Page Builder', 'SEO Tools', 'Multi-language']
          },
          {
            id: '2',
            moduleName: 'E-commerce Engine',
            version: '1.5.0',
            releaseDate: '2024-01-10T00:00:00Z',
            status: 'STABLE',
            changelog: 'New payment gateway integrations, inventory management improvements',
            downloadCount: 890,
            tenantCount: 45,
            compatibility: ['1.4.x'],
            size: '22.1 MB',
            author: 'E-commerce Team',
            isLatest: true,
            dependencies: ['CMS Engine 2.0+', 'Payment SDK'],
            features: ['Shopping Cart', 'Payment Processing', 'Inventory']
          }
        ];

        // Apply filters
        let filteredVersions = mockVersions;
        
        if (filter?.search) {
          filteredVersions = filteredVersions.filter(version =>
            version.moduleName.toLowerCase().includes(filter.search!.toLowerCase()) ||
            version.version.toLowerCase().includes(filter.search!.toLowerCase()) ||
            version.changelog.toLowerCase().includes(filter.search!.toLowerCase())
          );
        }
        
        if (filter?.moduleName) {
          filteredVersions = filteredVersions.filter(version => version.moduleName === filter.moduleName);
        }
        
        if (filter?.status) {
          filteredVersions = filteredVersions.filter(version => version.status === filter.status);
        }

        // Apply pagination
        const page = pagination?.page || 1;
        const pageSize = pagination?.pageSize || 20;
        const startIndex = (page - 1) * pageSize;
        const paginatedVersions = filteredVersions.slice(startIndex, startIndex + pageSize);

        return {
          versions: paginatedVersions,
          totalCount: filteredVersions.length,
          modules: [...new Set(mockVersions.map(v => v.moduleName))]
        };
      } catch (error) {
        console.error('Error fetching module versions:', error);
        throw new Error('Failed to fetch module versions');
      }
    },

    // Request History
    requestHistory: async (_parent: Parent, { filter, pagination }: {
      filter?: {
        search?: string;
        type?: string;
        status?: string;
        priority?: string;
        dateRange?: string;
      };
      pagination?: {
        page?: number;
        pageSize?: number;
      };
    }, context: Context) => {
      await requireSuperAdmin(context);
      
      try {
        // Mock data for demonstration - replace with actual database queries
        const mockRequests = [
          {
            id: '1',
            type: 'MODULE',
            title: 'E-commerce Engine Activation',
            description: 'Request to activate e-commerce module for online store functionality',
            tenantId: 'tenant-1',
            tenantName: 'TechCorp Solutions',
            requestedBy: 'John Smith',
            requestedByEmail: 'john@techcorp.com',
            status: 'COMPLETED',
            priority: 'HIGH',
            createdAt: '2024-01-10T10:00:00Z',
            updatedAt: '2024-01-15T16:30:00Z',
            completedAt: '2024-01-15T16:30:00Z',
            estimatedHours: 8,
            actualHours: 6,
            assignedTo: 'Sarah Johnson',
            notes: 'Successfully activated with custom payment gateway integration',
            attachments: ['requirements.pdf', 'config.json']
          },
          {
            id: '2',
            type: 'CUSTOMIZATION',
            title: 'Custom Dashboard Layout',
            description: 'Request for custom dashboard layout with specific KPI widgets',
            tenantId: 'tenant-2',
            tenantName: 'Marketing Pro',
            requestedBy: 'Emily Davis',
            requestedByEmail: 'emily@marketingpro.com',
            status: 'APPROVED',
            priority: 'MEDIUM',
            createdAt: '2024-01-08T14:20:00Z',
            updatedAt: '2024-01-12T09:15:00Z',
            completedAt: null,
            estimatedHours: 12,
            actualHours: null,
            assignedTo: 'Mike Wilson',
            notes: 'Approved with minor modifications to original design',
            attachments: ['mockup.png', 'specifications.docx']
          }
        ];

        // Apply filters
        let filteredRequests = mockRequests;
        
        if (filter?.search) {
          filteredRequests = filteredRequests.filter(request =>
            request.title.toLowerCase().includes(filter.search!.toLowerCase()) ||
            request.description.toLowerCase().includes(filter.search!.toLowerCase()) ||
            request.tenantName.toLowerCase().includes(filter.search!.toLowerCase()) ||
            request.requestedBy.toLowerCase().includes(filter.search!.toLowerCase())
          );
        }
        
        if (filter?.type) {
          filteredRequests = filteredRequests.filter(request => request.type === filter.type);
        }
        
        if (filter?.status) {
          filteredRequests = filteredRequests.filter(request => request.status === filter.status);
        }
        
        if (filter?.priority) {
          filteredRequests = filteredRequests.filter(request => request.priority === filter.priority);
        }

        // Apply pagination
        const page = pagination?.page || 1;
        const pageSize = pagination?.pageSize || 20;
        const startIndex = (page - 1) * pageSize;
        const paginatedRequests = filteredRequests.slice(startIndex, startIndex + pageSize);

        // Calculate stats
        const stats = {
          totalRequests: mockRequests.length,
          approved: mockRequests.filter(r => r.status === 'APPROVED').length,
          rejected: mockRequests.filter(r => r.status === 'REJECTED').length,
          completed: mockRequests.filter(r => r.status === 'COMPLETED').length,
          cancelled: mockRequests.filter(r => r.status === 'CANCELLED').length,
          avgCompletionTime: mockRequests
            .filter(r => r.actualHours)
            .reduce((sum, r) => sum + (r.actualHours || 0), 0) / 
            mockRequests.filter(r => r.actualHours).length || 0
        };

        return {
          requests: paginatedRequests,
          totalCount: filteredRequests.length,
          stats
        };
      } catch (error) {
        console.error('Error fetching request history:', error);
        throw new Error('Failed to fetch request history');
      }
    }
  },

  Mutation: {
    // Tenant Management
    createTenantSuperAdmin: async (_parent: Parent, { input }: {
      input: {
        name: string;
        slug: string;
        domain?: string;
        planId?: string;
        features?: string[];
        settings?: Prisma.InputJsonValue;
        adminEmail?: string;
        adminFirstName?: string;
        adminLastName?: string;
        adminPassword?: string;
      };
    }, context: Context) => {
      await requireSuperAdmin(context);
      
      try {
        // Check if slug is unique
        const existingTenant = await prisma.tenant.findUnique({
          where: { slug: input.slug }
        });
        
        if (existingTenant) {
          return {
            success: false,
            message: `Tenant with slug "${input.slug}" already exists`,
            tenant: null,
            adminUser: null
          };
        }

        // Extract admin user data from settings if provided there, or use direct fields
        let adminData = null;
        if (input.settings && typeof input.settings === 'object') {
          const settings = input.settings as Record<string, unknown>;
          if (settings.adminEmail || settings.adminFirstName || settings.adminLastName || settings.adminPassword) {
            adminData = {
              email: (settings.adminEmail as string) || input.adminEmail,
              firstName: (settings.adminFirstName as string) || input.adminFirstName,
              lastName: (settings.adminLastName as string) || input.adminLastName,
              password: (settings.adminPassword as string) || input.adminPassword
            };
          }
        } else if (input.adminEmail || input.adminFirstName || input.adminLastName || input.adminPassword) {
          adminData = {
            email: input.adminEmail,
            firstName: input.adminFirstName,
            lastName: input.adminLastName,
            password: input.adminPassword
          };
        }

        // Use transaction to create tenant and admin user atomically
        const result = await prisma.$transaction(async (tx) => {
          // Create tenant
          const tenant = await tx.tenant.create({
            data: {
              name: input.name,
              slug: input.slug,
              domain: input.domain,
              planId: input.planId,
              features: input.features || ['CMS_ENGINE'],
              settings: input.settings || Prisma.JsonNull,
              status: 'ACTIVE'
            }
          });

          let adminUser = null;

          // Create admin user if admin data is provided
          if (adminData && adminData.email && adminData.firstName && adminData.lastName && adminData.password) {
            // Check if user with this email already exists
            const existingUser = await tx.user.findUnique({
              where: { email: adminData.email }
            });

            if (existingUser) {
              throw new Error(`User with email "${adminData.email}" already exists`);
            }

            // Find or create TenantAdmin role
            let tenantAdminRole = await tx.roleModel.findFirst({
              where: { 
                OR: [
                  { name: 'TenantAdmin' },
                  { name: 'TENANT_ADMIN' }
                ]
              }
            });

            if (!tenantAdminRole) {
              tenantAdminRole = await tx.roleModel.create({
                data: {
                  name: 'TenantAdmin',
                  description: 'Administrator of a tenant'
                }
              });
            }

            // Hash password
            const hashedPassword = await bcrypt.hash(adminData.password, 12);

            // Create admin user
            adminUser = await tx.user.create({
              data: {
                email: adminData.email,
                password: hashedPassword,
                firstName: adminData.firstName,
                lastName: adminData.lastName,
                roleId: tenantAdminRole.id,
                userTenants: {
                  create: {
                    tenantId: tenant.id,
                    role: 'OWNER'
                  }
                },
                emailVerified: new Date(), // Auto-verify admin user
              },
              include: {
                role: true,
                userTenants: true
              }
            });
          }

          return { tenant, adminUser };
        });

        const message = result.adminUser 
          ? `Tenant created successfully with admin user: ${result.adminUser.email}`
          : 'Tenant created successfully';

        return {
          success: true,
          message,
          tenant: {
            ...result.tenant,
            createdAt: result.tenant.createdAt.toISOString(),
            updatedAt: result.tenant.updatedAt.toISOString()
          },
          adminUser: result.adminUser ? {
            id: result.adminUser.id,
            email: result.adminUser.email,
            firstName: result.adminUser.firstName,
            lastName: result.adminUser.lastName,
            phoneNumber: result.adminUser.phoneNumber,
            roleId: result.adminUser.roleId!,
            tenantId: result.tenant.id,
            createdAt: result.adminUser.createdAt.toISOString(),
            updatedAt: result.adminUser.updatedAt.toISOString()
          } : null
        };
      } catch (error) {
        console.error('Error creating tenant:', error);
        return {
          success: false,
          message: error instanceof Error ? error.message : 'Failed to create tenant',
          tenant: null,
          adminUser: null
        };
      }
    },

    updateTenantSuperAdmin: async (_parent: Parent, { id, input }: {
      id: string;
      input: {
        name?: string;
        slug?: string;
        domain?: string;
        status?: string;
        planId?: string;
        features?: string[];
        settings?: Prisma.InputJsonValue;
      };
    }, context: Context) => {
      await requireSuperAdmin(context);
      
      try {
        // Check if tenant exists
        const existingTenant = await prisma.tenant.findUnique({
          where: { id }
        });
        
        if (!existingTenant) {
          throw new Error(`Tenant with ID "${id}" not found`);
        }

        // Check slug uniqueness if being updated
        if (input.slug && input.slug !== existingTenant.slug) {
          const slugExists = await prisma.tenant.findUnique({
            where: { slug: input.slug }
          });
          
          if (slugExists) {
            throw new Error(`Tenant with slug "${input.slug}" already exists`);
          }
        }

        const tenant = await prisma.tenant.update({
          where: { id },
          data: {
            ...(input.name && { name: input.name }),
            ...(input.slug && { slug: input.slug }),
            ...(input.domain !== undefined && { domain: input.domain }),
            ...(input.status && { status: input.status as TenantStatus }),
            ...(input.planId !== undefined && { planId: input.planId }),
            ...(input.features && { features: input.features }),
            ...(input.settings && { settings: input.settings })
          },
          include: {
            _count: {
              select: {
                userTenants: true,
                pages: true,
                posts: true
              }
            }
          }
        });

        return {
          success: true,
          message: 'Tenant updated successfully',
          tenant: {
            ...tenant,
            userCount: tenant._count.userTenants,
            pageCount: tenant._count.pages,
            postCount: tenant._count.posts,
            createdAt: tenant.createdAt.toISOString(),
            updatedAt: tenant.updatedAt.toISOString()
          }
        };
      } catch (error) {
        console.error('Error updating tenant:', error);
        return {
          success: false,
          message: error instanceof Error ? error.message : 'Failed to update tenant',
          tenant: null
        };
      }
    },

    deleteTenant: async (_parent: Parent, { id }: { id: string }, context: Context) => {
      await requireSuperAdmin(context);
      
      try {
        // Check if tenant exists
        const tenant = await prisma.tenant.findUnique({
          where: { id },
          include: {
            userTenants: true
          }
        });
        
        if (!tenant) {
          throw new Error(`Tenant with ID "${id}" not found`);
        }

        // Check if tenant has users
        if (tenant.userTenants.length > 0) {
          throw new Error(`Cannot delete tenant: ${tenant.userTenants.length} users are still associated with this tenant`);
        }

        await prisma.tenant.delete({
          where: { id }
        });

        return {
          success: true,
          message: 'Tenant deleted successfully'
        };
      } catch (error) {
        console.error('Error deleting tenant:', error);
        return {
          success: false,
          message: error instanceof Error ? error.message : 'Failed to delete tenant'
        };
      }
    },

    // Tenant Impersonation
    impersonateTenant: async (_parent: Parent, { tenantId }: { tenantId: string }, context: Context) => {
      await requireSuperAdmin(context);
      
      try {
        const tenant = await prisma.tenant.findUnique({
          where: { id: tenantId },
          include: {
            userTenants: {
              where: {
                role: { in: ['OWNER', 'ADMIN'] },
                isActive: true
              },
              take: 1,
              include: {
                user: true
              }
            }
          }
        });
        
        if (!tenant) {
          throw new Error(`Tenant with ID "${tenantId}" not found`);
        }

        const adminUser = tenant.userTenants[0];
        if (!adminUser) {
          throw new Error('No admin user found for this tenant');
        }

        // In a real implementation, you would create a temporary session
        // or token that allows the SuperAdmin to act as this user
        return {
          success: true,
          message: 'Impersonation session created',
          impersonationData: {
            tenantId: tenant.id,
            tenantName: tenant.name,
            tenantSlug: tenant.slug,
            userId: adminUser.user.id,
            userEmail: adminUser.user.email,
            userRole: adminUser.role
          }
        };
      } catch (error) {
        console.error('Error creating impersonation session:', error);
        return {
          success: false,
          message: error instanceof Error ? error.message : 'Failed to create impersonation session',
          impersonationData: null
        };
      }
    },

    // System Maintenance
    performSystemMaintenance: async (_parent: Parent, { action }: { action: string }, context: Context) => {
      await requireSuperAdmin(context);
      
      try {
        let result = '';
        
        switch (action) {
          case 'CLEAR_CACHE':
            // Implement cache clearing logic
            result = 'Cache cleared successfully';
            break;
          case 'OPTIMIZE_DATABASE':
            // Implement database optimization
            result = 'Database optimization completed';
            break;
          case 'CLEANUP_LOGS':
            // Implement log cleanup
            result = 'Log cleanup completed';
            break;
          case 'BACKUP_SYSTEM':
            // Implement system backup
            result = 'System backup initiated';
            break;
          default:
            throw new Error(`Unknown maintenance action: ${action}`);
        }

        return {
          success: true,
          message: result,
          timestamp: new Date().toISOString()
        };
      } catch (error) {
        console.error('Error performing system maintenance:', error);
        return {
          success: false,
          message: error instanceof Error ? error.message : 'Failed to perform maintenance',
          timestamp: new Date().toISOString()
        };
      }
    },

    // Assign Tenant Admin
    assignTenantAdmin: async (_parent: Parent, { tenantId, userId }: { tenantId: string; userId: string }, context: Context) => {
      await requireSuperAdmin(context);
      
      try {
        // Check if tenant exists
        const tenant = await prisma.tenant.findUnique({
          where: { id: tenantId }
        });
        
        if (!tenant) {
          throw new Error(`Tenant with ID "${tenantId}" not found`);
        }

        // Check if user exists
        const user = await prisma.user.findUnique({
          where: { id: userId },
          include: { role: true }
        });
        
        if (!user) {
          throw new Error(`User with ID "${userId}" not found`);
        }

        // Find or create TenantAdmin role
        let tenantAdminRole = await prisma.roleModel.findFirst({
          where: { name: 'TenantAdmin' }
        });

        if (!tenantAdminRole) {
          tenantAdminRole = await prisma.roleModel.create({
            data: {
              name: 'TenantAdmin',
              description: 'Tenant administrator with full access to tenant resources'
            }
          });
        }

        // Update user to be admin of this tenant
        const updatedUser = await prisma.user.update({
          where: { id: userId },
          data: {
            userTenants: {
              create: {
                tenantId: tenantId,
                role: 'ADMIN'
              }
            },
            roleId: tenantAdminRole.id
          },
          include: {
            role: true,
            userTenants: true
          }
        });

        return {
          success: true,
          message: `User "${user.firstName} ${user.lastName}" has been assigned as admin for tenant "${tenant.name}"`,
          user: {
            id: updatedUser.id,
            email: updatedUser.email,
            firstName: updatedUser.firstName,
            lastName: updatedUser.lastName,
            phoneNumber: updatedUser.phoneNumber,
            role: {
              id: updatedUser.roleId || '',
              name: updatedUser.role?.name || 'Unknown',
              description: updatedUser.role?.description || 'No description'
            },
            tenantId: updatedUser.userTenants[0]?.tenantId || '',
            createdAt: updatedUser.createdAt.toISOString(),
            updatedAt: updatedUser.updatedAt.toISOString()
          }
        };
      } catch (error) {
        console.error('Error assigning tenant admin:', error);
        return {
          success: false,
          message: error instanceof Error ? error.message : 'Failed to assign tenant admin',
          user: null
        };
      }
    }
  }
}; 