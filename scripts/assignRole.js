const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function assignTenantAdminRole() {
  console.log('🔧 Assigning TenantAdmin role to user...');
  
  try {
    // 1. Find the user
    const user = await prisma.user.findUnique({
      where: { email: 'rodrigovdev01@gmail.com' },
      include: { role: true }
    });

    if (!user) {
      throw new Error('User with email rodrigovdev01@gmail.com not found');
    }

    console.log('📧 Found user:', user.email);
    console.log('👤 Current role:', user.role?.name || 'No role');

    // 2. Find the TenantAdmin role
    const tenantAdminRole = await prisma.roleModel.findUnique({
      where: { name: 'TenantAdmin' }
    });

    if (!tenantAdminRole) {
      throw new Error('TenantAdmin role not found. Please run seedRoles.js first.');
    }

    console.log('🎭 Found TenantAdmin role:', tenantAdminRole.name);

    // 3. Find or create a default tenant
    let tenant = await prisma.tenant.findFirst();
    
    if (!tenant) {
      console.log('🏢 No tenant found, creating default tenant...');
      tenant = await prisma.tenant.create({
        data: {
          name: 'Default Tenant',
          slug: 'default',
          status: 'ACTIVE',
          settings: {},
          features: ['CMS', 'GDPR', 'HR', 'BOOKING']
        }
      });
      console.log('✅ Created default tenant:', tenant.name);
    } else {
      console.log('🏢 Found existing tenant:', tenant.name);
    }

    // 4. Update the user with role and tenant
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        roleId: tenantAdminRole.id,
        tenantId: tenant.id
      },
      include: { role: true, tenant: true }
    });

    console.log('✅ Successfully updated user:');
    console.log('   📧 Email:', updatedUser.email);
    console.log('   🎭 Role:', updatedUser.role.name);
    console.log('   🏢 Tenant:', updatedUser.tenant.name);
    console.log('   🆔 Tenant ID:', updatedUser.tenantId);

    return updatedUser;

  } catch (error) {
    console.error('❌ Error assigning role:', error);
    throw error;
  }
}

async function main() {
  try {
    await assignTenantAdminRole();
    console.log('🎉 Role assignment completed successfully!');
    console.log('🔄 Please refresh your browser and try accessing the dashboard again.');
  } catch (error) {
    console.error('💥 Failed to assign role:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
    console.log('📡 Prisma connection closed.');
  }
}

if (require.main === module) {
  main();
}

module.exports = assignTenantAdminRole; 