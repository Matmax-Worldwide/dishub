import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createRoles() {
  try {
    console.log('Creating roles...');

    // Define the roles to create
    const roles = [
      {
        name: 'ADMIN',
        description: 'Administrator with full system access'
      },
      {
        name: 'USER',
        description: 'Regular user with basic access'
      },
      {
        name: 'MANAGER',
        description: 'Manager with elevated permissions'
      },
      {
        name: 'EMPLOYEE',
        description: 'Employee with limited access'
      },
      {
        name: 'SUPER_ADMIN',
        description: 'Super Administrator with platform-wide access across all tenants'
      }
    ];

    // Create each role
    for (const roleData of roles) {
      try {
        const existingRole = await prisma.roleModel.findUnique({
          where: { name: roleData.name }
        });

        if (existingRole) {
          console.log(`Role ${roleData.name} already exists, skipping...`);
          continue;
        }

        const role = await prisma.roleModel.create({
          data: roleData
        });

        console.log(`✅ Created role: ${role.name} (ID: ${role.id})`);
      } catch (error) {
        console.error(`❌ Error creating role ${roleData.name}:`, error.message);
      }
    }

    console.log('\n📋 Current roles in database:');
    const allRoles = await prisma.roleModel.findMany({
      select: {
        id: true,
        name: true,
        description: true,
        createdAt: true
      }
    });

    allRoles.forEach(role => {
      console.log(`- ${role.name}: ${role.description} (ID: ${role.id})`);
    });

  } catch (error) {
    console.error('❌ Error in createRoles:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createRoles(); 