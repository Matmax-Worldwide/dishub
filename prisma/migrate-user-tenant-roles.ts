import { PrismaClient, UserTenantRole } from '@prisma/client';

const prisma = new PrismaClient();

async function migrateUserTenantRoles() {
  console.log('🔄 Starting UserTenant role migration...');
  
  try {
    // Get all UserTenant records
    const userTenants = await prisma.userTenant.findMany({
      include: {
        user: true,
        tenant: true
      }
    });

    console.log(`Found ${userTenants.length} UserTenant relationships to check`);

    // Role mapping from old to new
    const roleMapping: Record<string, string> = {
      'OWNER': 'TenantAdmin',
      'ADMIN': 'TenantManager', 
      'MANAGER': 'TenantManager',
      'MEMBER': 'TenantUser',
      'VIEWER': 'TenantUser'
    };

    let updatedCount = 0;

    for (const userTenant of userTenants) {
      const currentRole = userTenant.role;
      const newRole = roleMapping[currentRole];

      if (newRole && newRole !== currentRole) {
        await prisma.userTenant.update({
          where: { id: userTenant.id },
          data: { role: newRole as UserTenantRole }
        });

        console.log(`   ✓ Updated ${userTenant.user.email} in ${userTenant.tenant.name}: ${currentRole} → ${newRole}`);
        updatedCount++;
      } else if (!newRole) {
        console.log(`   ⚠️  Unknown role "${currentRole}" for ${userTenant.user.email} in ${userTenant.tenant.name}`);
      } else {
        console.log(`   ✓ ${userTenant.user.email} in ${userTenant.tenant.name}: ${currentRole} (already correct)`);
      }
    }

    console.log(`✅ Migration completed! Updated ${updatedCount} UserTenant relationships.`);
  } catch (error) {
    console.error('❌ Error during migration:', error);
    throw error;
  }
}

async function main() {
  try {
    await migrateUserTenantRoles();
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 