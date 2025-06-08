import { PrismaClient, UserTenantRole } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Roles data
const roles = [
  // Global Platform Roles
  {
    name: 'SuperAdmin',
    description: 'Super administrator with full system access across all tenants and platform control'
  },
  {
    name: 'PlatformAdmin',
    description: 'Manages modules, plans, pricing and usage analytics. Cannot delete tenants'
  },
  {
    name: 'SupportAgent',
    description: 'Access to support dashboards to help users. No access to sensitive data or critical configuration'
  },
  
  // Tenant Level Roles
  {
    name: 'TenantAdmin',
    description: 'General tenant administrator with access to all activated modules'
  },
  {
    name: 'TenantManager',
    description: 'Limited administrative permissions. Can view reports and approve actions'
  },
  {
    name: 'TenantUser',
    description: 'Regular system user with access according to specific module permissions'
  },
  
  // CMS Module Roles
  {
    name: 'ContentManager',
    description: 'Creates, edits and publishes content in CMS'
  },
  {
    name: 'ContentEditor',
    description: 'Only edits content, cannot publish in CMS'
  },
  
  // HRMS Module Roles
  {
    name: 'HRAdmin',
    description: 'Manages employees, schedules and HR reports'
  },
  {
    name: 'HRManager',
    description: 'Approves requests and modifies schedules in HRMS'
  },
  {
    name: 'Employee',
    description: 'Access to own profile and assigned schedules'
  },
  
  // Booking Module Roles
  {
    name: 'BookingAdmin',
    description: 'Defines services, agents and booking rules'
  },
  {
    name: 'Agent',
    description: 'Manages assigned booking sessions'
  },
  {
    name: 'Customer',
    description: 'Books, modifies or cancels reservations'
  },
  
  // E-Commerce Module Roles
  {
    name: 'StoreAdmin',
    description: 'Manages products, inventory and store reports'
  },
  {
    name: 'StoreManager',
    description: 'Handles orders and dispatches'
  },
  
  // Future/Complementary Roles
  {
    name: 'FinanceManager',
    description: 'Manages billing and financial operations'
  },
  {
    name: 'SalesRep',
    description: 'CRM and sales management'
  },
  {
    name: 'Instructor',
    description: 'LMS and training management'
  },
  {
    name: 'ProjectLead',
    description: 'Project management and coordination'
  },
  
  // Basic roles
  {
    name: 'USER',
    description: 'Standard user role'
  },
  {
    name: 'ADMIN',
    description: 'Administrator role'
  },
  {
    name: 'MANAGER',
    description: 'Manager role'
  }
];

async function seedRoles() {
  console.log('🔧 Starting role seeding...');
  
  try {
    for (const role of roles) {
      // Check if role already exists
      const existingRole = await prisma.roleModel.findUnique({
        where: { name: role.name }
      });

      if (existingRole) {
        console.log(`   Role "${role.name}" already exists, skipping...`);
        continue;
      }

      // Create the role if it doesn't exist
      const createdRole = await prisma.roleModel.create({
        data: {
          name: role.name,
          description: role.description
        }
      });

      console.log(`   ✓ Created role: ${createdRole.name}`);
    }

    console.log('✅ Role seeding completed successfully!');
  } catch (error) {
    console.error('❌ Error seeding roles:', error);
    throw error;
  }
}

async function seedSuperAdmin() {
  console.log('👑 Creating initial SuperAdmin user...');
  
  try {
    // Find SuperAdmin role
    const superAdminRole = await prisma.roleModel.findUnique({
      where: { name: 'SuperAdmin' }
    });

    if (!superAdminRole) {
      throw new Error('SuperAdmin role not found. Please run seedRoles first.');
    }

    // Check if SuperAdmin already exists
    const existingSuperAdmin = await prisma.user.findFirst({
      where: { roleId: superAdminRole.id }
    });

    if (existingSuperAdmin) {
      console.log('   SuperAdmin user already exists:', existingSuperAdmin.email);
      return existingSuperAdmin;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash('SuperAdmin123!', 12);

    // Create SuperAdmin user
    const superAdmin = await prisma.user.create({
      data: {
        email: 'superadmin@dishub.com',
        password: hashedPassword,
        firstName: 'Super',
        lastName: 'Admin',
        bio: 'Platform SuperAdmin with full system access',
        isActive: true,
        emailVerified: new Date(),
        roleId: superAdminRole.id,
        // No tenantId - SuperAdmin is global
      }
    });

    console.log('   ✓ SuperAdmin user created successfully!');
    console.log('   Email:', superAdmin.email);
    console.log('   Password: SuperAdmin123!');
    console.log('   ⚠️  Please change the password after first login!');

    return superAdmin;
  } catch (error) {
    console.error('❌ Error creating SuperAdmin:', error);
    throw error;
  }
}

async function seedTestTenant() {
  console.log('🏢 Creating test tenant...');
  
  try {
    // Check if test tenant already exists
    const existingTenant = await prisma.tenant.findUnique({
      where: { slug: 'test-company' }
    });

    if (existingTenant) {
      console.log('   Test tenant already exists:', existingTenant.name);
      return existingTenant;
    }

    // Create test tenant
    const tenant = await prisma.tenant.create({
      data: {
        name: 'Test Company',
        slug: 'test-company',
        domain: 'test-company.dishub.com',
        status: 'ACTIVE',
        features: ['CMS_ENGINE', 'HRMS', 'BOOKING', 'ECOMMERCE']
      }
    });

    console.log('   ✓ Test tenant created:', tenant.name);
    return tenant;
  } catch (error) {
    console.error('❌ Error creating test tenant:', error);
    throw error;
  }
}

async function seedTestUsers() {
  console.log('👥 Creating test users...');
  
  try {
    // Get roles
    const userRole = await prisma.roleModel.findUnique({ where: { name: 'USER' } });
    const adminRole = await prisma.roleModel.findUnique({ where: { name: 'ADMIN' } });
    const managerRole = await prisma.roleModel.findUnique({ where: { name: 'MANAGER' } });
    const tenantAdminRole = await prisma.roleModel.findUnique({ where: { name: 'TenantAdmin' } });

    if (!userRole || !adminRole || !managerRole || !tenantAdminRole) {
      throw new Error('Required roles not found');
    }

    // Get test tenant
    const testTenant = await prisma.tenant.findUnique({ where: { slug: 'test-company' } });
    if (!testTenant) {
      throw new Error('Test tenant not found');
    }

    // Create test users
    const users = [
      {
        email: 'admin@test-company.com',
        firstName: 'Admin',
        lastName: 'User',
        phoneNumber: '+1-555-0001',
        role: tenantAdminRole.id,
        tenantRole: 'TenantAdmin'
      },
      {
        email: 'manager@test-company.com',
        firstName: 'Manager',
        lastName: 'User',
        phoneNumber: '+1-555-0002',
        role: managerRole.id,
        tenantRole: 'TenantManager'
      },
      {
        email: 'john.doe@test-company.com',
        firstName: 'John',
        lastName: 'Doe',
        phoneNumber: '+1-555-0101',
        role: userRole.id,
        tenantRole: 'TenantUser'
      },
      {
        email: 'jane.smith@test-company.com',
        firstName: 'Jane',
        lastName: 'Smith',
        phoneNumber: '+1-555-0102',
        role: userRole.id,
        tenantRole: 'TenantUser'
      },
      {
        email: 'mike.johnson@test-company.com',
        firstName: 'Mike',
        lastName: 'Johnson',
        phoneNumber: '+1-555-0103',
        role: managerRole.id,
        tenantRole: 'Employee'
      }
    ];

    const hashedPassword = await bcrypt.hash('password123', 10);

    for (const userData of users) {
      try {
        const existingUser = await prisma.user.findUnique({
          where: { email: userData.email }
        });

        if (!existingUser) {
          // Create user
          const user = await prisma.user.create({
            data: {
              email: userData.email,
              password: hashedPassword,
              firstName: userData.firstName,
              lastName: userData.lastName,
              phoneNumber: userData.phoneNumber,
              roleId: userData.role,
              isActive: true
            },
            include: {
              role: true
            }
          });

          // Create user-tenant relationship
          await prisma.userTenant.create({
            data: {
              userId: user.id,
              tenantId: testTenant.id,
              role: userData.tenantRole as UserTenantRole,
              isActive: true
            }
          });

          console.log(`   ✓ Created user: ${user.firstName} ${user.lastName} (${user.email}) - Role: ${user.role?.name} - Tenant Role: ${userData.tenantRole}`);
        } else {
          console.log(`   ⚠️  User already exists: ${userData.email}`);
        }
      } catch (error) {
        console.error(`   ❌ Error creating user ${userData.email}:`, error);
      }
    }

    console.log('✅ Test users created successfully!');
  } catch (error) {
    console.error('❌ Error creating test users:', error);
    throw error;
  }
}

async function main() {
  console.log('🌱 Starting database seeding...');

  try {
    // 1. Seed roles first
    await seedRoles();
    
    // 2. Create SuperAdmin
    await seedSuperAdmin();
    
    // 3. Create test tenant
    await seedTestTenant();
    
    // 4. Create test users with tenant relationships
    await seedTestUsers();

    console.log('🎉 Database seeding completed successfully!');
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 