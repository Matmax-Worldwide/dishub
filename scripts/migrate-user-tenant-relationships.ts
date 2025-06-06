import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function migrateUserTenantRelationships() {
  console.log('🔄 Starting migration of user-tenant relationships...');

  try {
    // Find all users that don't have any UserTenant relationships
    const usersWithoutTenantRelationships = await prisma.user.findMany({
      where: {
        userTenants: {
          none: {}
        }
      },
      include: {
        role: true
      }
    });

    console.log(`📊 Found ${usersWithoutTenantRelationships.length} users without tenant relationships`);

    // Get all tenants
    const tenants = await prisma.tenant.findMany();
    console.log(`📊 Found ${tenants.length} tenants in the system`);

    if (tenants.length === 0) {
      console.log('⚠️  No tenants found. Creating a default tenant...');
      
      const defaultTenant = await prisma.tenant.create({
        data: {
          name: 'Default Tenant',
          slug: 'default',
          status: 'ACTIVE',
          features: ['CMS_ENGINE', 'BLOG_MODULE', 'FORMS_MODULE']
        }
      });
      
      tenants.push(defaultTenant);
      console.log(`✅ Created default tenant: ${defaultTenant.name}`);
    }

    // For each user without tenant relationships, create appropriate relationships
    for (const user of usersWithoutTenantRelationships) {
      console.log(`🔄 Processing user: ${user.email} (${user.role?.name || 'No Role'})`);

      // Determine the appropriate role and tenant assignment
      let tenantRole: 'OWNER' | 'ADMIN' | 'MANAGER' | 'MEMBER' | 'VIEWER' = 'MEMBER';
      const targetTenant = tenants[0]; // Default to first tenant

      // Assign roles based on user's current role
      switch (user.role?.name) {
        case 'SuperAdmin':
          // SuperAdmins don't need tenant relationships, skip them
          console.log(`⏭️  Skipping SuperAdmin user: ${user.email}`);
          continue;
        
        case 'TenantAdmin':
        case 'TENANTADMIN':
          tenantRole = 'OWNER';
          break;
        
        case 'TenantManager':
        case 'TENANTMANAGER':
          tenantRole = 'ADMIN';
          break;
        
        case 'Manager':
        case 'MANAGER':
          tenantRole = 'MANAGER';
          break;
        
        case 'Employee':
        case 'EMPLOYEE':
          tenantRole = 'MEMBER';
          break;
        
        case 'User':
        case 'USER':
        default:
          tenantRole = 'VIEWER';
          break;
      }

      // Create the user-tenant relationship
      try {
        await prisma.userTenant.create({
          data: {
            userId: user.id,
            tenantId: targetTenant.id,
            role: tenantRole,
            isActive: true
          }
        });

        console.log(`✅ Created relationship: ${user.email} -> ${targetTenant.name} (${tenantRole})`);
      } catch (error) {
        console.error(`❌ Failed to create relationship for ${user.email}:`, error);
      }
    }

    // Clean up any orphaned data
    console.log('🧹 Cleaning up orphaned data...');
    
    // Remove any inactive user-tenant relationships older than 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const deletedRelationships = await prisma.userTenant.deleteMany({
      where: {
        isActive: false,
        leftAt: {
          lt: thirtyDaysAgo
        }
      }
    });

    console.log(`🗑️  Cleaned up ${deletedRelationships.count} old inactive relationships`);

    // Summary
    const totalUserTenants = await prisma.userTenant.count({
      where: { isActive: true }
    });
    
    console.log('\n📊 Migration Summary:');
    console.log(`✅ Total active user-tenant relationships: ${totalUserTenants}`);
    console.log(`✅ Total tenants: ${tenants.length}`);
    console.log(`✅ Migration completed successfully!`);

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the migration
if (require.main === module) {
  migrateUserTenantRelationships()
    .then(() => {
      console.log('🎉 Migration completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Migration failed:', error);
      process.exit(1);
    });
}

export { migrateUserTenantRelationships }; 