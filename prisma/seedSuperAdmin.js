import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function createSuperAdmin() {
  console.log('Creating initial SuperAdmin user...');
  
  try {
    // Find SuperAdmin role
    const superAdminRole = await prisma.roleModel.findUnique({
      where: { name: 'SuperAdmin' }
    });

    if (!superAdminRole) {
      throw new Error('SuperAdmin role not found. Please run seedRoles.js first.');
    }

    // Check if SuperAdmin already exists
    const existingSuperAdmin = await prisma.user.findFirst({
      where: { roleId: superAdminRole.id }
    });

    if (existingSuperAdmin) {
      console.log('SuperAdmin user already exists:', existingSuperAdmin.email);
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

    console.log('✓ SuperAdmin user created successfully!');
    console.log('Email:', superAdmin.email);
    console.log('Password: SuperAdmin123!');
    console.log('⚠️  Please change the password after first login!');

    return superAdmin;
  } catch (error) {
    console.error('Error creating SuperAdmin:', error);
    throw error;
  }
}

async function main() {
  try {
    await createSuperAdmin();
  } catch (error) {
    console.error('Failed to create SuperAdmin:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
    console.log('Prisma connection closed.');
  }
}

if (require.main === module) {
  main();
}

module.exports = createSuperAdmin; 