import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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
  }
];

async function seedRoles() {
  console.log('Starting role seeding...');
  
  try {
    for (const role of roles) {
      // Check if role already exists
      const existingRole = await prisma.roleModel.findUnique({
        where: { name: role.name }
      });

      if (existingRole) {
        console.log(`Role "${role.name}" already exists, skipping...`);
        continue;
      }

      // Create the role if it doesn't exist
      const createdRole = await prisma.roleModel.create({
        data: {
          name: role.name,
          description: role.description
        }
      });

      console.log(`✓ Created role: ${createdRole.name}`);
    }

    console.log('Role seeding completed successfully!');
  } catch (error) {
    console.error('Error seeding roles:', error);
    throw error;
  }
}

async function main() {
  try {
    await seedRoles();
  } catch (error) {
    console.error('Failed to seed roles:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
    console.log('Prisma connection closed.');
  }
}

// Execute main function if this file is run directly
if (require.main === module) {
  main();
}

module.exports = seedRoles; 