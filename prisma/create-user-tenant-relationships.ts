import { PrismaClient, UserTenantRole } from '@prisma/client';

const prisma = new PrismaClient();

async function createUserTenantRelationships() {
  console.log('🔗 Creating UserTenant relationships...');
  
  try {
    // Get the test tenant
    const testTenant = await prisma.tenant.findUnique({
      where: { slug: 'test-company' }
    });

    if (!testTenant) {
      throw new Error('Test tenant not found');
    }

    // Get all users except SuperAdmin
    const users = await prisma.user.findMany({
      include: {
        role: true
      },
      where: {
        role: {
          name: {
            not: 'SuperAdmin'
          }
        }
      }
    });

    console.log(`Found ${users.length} users to create tenant relationships for`);

    // Define user-role mappings
    const userRoleMappings: Record<string, UserTenantRole> = {
      'admin@test-company.com': UserTenantRole.TenantAdmin,
      'manager@test-company.com': UserTenantRole.TenantManager,
      'john.doe@test-company.com': UserTenantRole.TenantUser,
      'jane.smith@test-company.com': UserTenantRole.TenantUser,
      'mike.johnson@test-company.com': UserTenantRole.Employee
    };

    let createdCount = 0;

    for (const user of users) {
      // Check if relationship already exists
      const existingRelation = await prisma.userTenant.findUnique({
        where: {
          userId_tenantId: {
            userId: user.id,
            tenantId: testTenant.id
          }
        }
      });

      if (existingRelation) {
        console.log(`   ✓ Relationship already exists for ${user.email}: ${existingRelation.role}`);
        continue;
      }

      // Get the tenant role for this user
      const tenantRole = userRoleMappings[user.email] || 'TenantUser';

      // Create the relationship
      await prisma.userTenant.create({
        data: {
          userId: user.id,
          tenantId: testTenant.id,
          role: tenantRole,
          isActive: true
        }
      });

      console.log(`   ✓ Created relationship for ${user.email}: ${tenantRole}`);
      createdCount++;
    }

    console.log(`✅ Created ${createdCount} new UserTenant relationships!`);
  } catch (error) {
    console.error('❌ Error creating relationships:', error);
    throw error;
  }
}

async function main() {
  try {
    await createUserTenantRelationships();
  } catch (error) {
    console.error('❌ Script failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 