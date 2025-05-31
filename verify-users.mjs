import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verifyUsers() {
  try {
    const users = await prisma.user.findMany({
      include: {
        role: true
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 15 // Get the last 15 users to see our new ones
    });

    console.log(`\n📊 Found ${users.length} users in the database:\n`);
    
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.firstName} ${user.lastName}`);
      console.log(`   📧 Email: ${user.email}`);
      console.log(`   📱 Phone: ${user.phoneNumber || 'N/A'}`);
      console.log(`   👤 Role: ${user.role?.name || 'No Role'}`);
      console.log(`   ✅ Active: ${user.isActive ? 'Yes' : 'No'}`);
      console.log(`   📅 Created: ${user.createdAt.toLocaleDateString()}`);
      console.log('');
    });

    // Count by role
    const roleStats = await prisma.user.groupBy({
      by: ['roleId'],
      _count: {
        id: true
      }
    });

    console.log('📈 User Statistics by Role:');
    for (const stat of roleStats) {
      if (stat.roleId) {
        const role = await prisma.roleModel.findUnique({
          where: { id: stat.roleId }
        });
        console.log(`   ${role?.name || 'Unknown'}: ${stat._count.id} users`);
      } else {
        console.log(`   No Role: ${stat._count.id} users`);
      }
    }

  } catch (error) {
    console.error('❌ Error verifying users:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verifyUsers(); 