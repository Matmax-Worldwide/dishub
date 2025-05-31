import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // First, ensure we have basic roles
  const userRole = await prisma.roleModel.upsert({
    where: { name: 'USER' },
    update: {},
    create: {
      name: 'USER',
      description: 'Standard user role'
    }
  });

  const adminRole = await prisma.roleModel.upsert({
    where: { name: 'ADMIN' },
    update: {},
    create: {
      name: 'ADMIN',
      description: 'Administrator role'
    }
  });

  const managerRole = await prisma.roleModel.upsert({
    where: { name: 'MANAGER' },
    update: {},
    create: {
      name: 'MANAGER',
      description: 'Manager role'
    }
  });

  console.log('✅ Roles created/updated');

  // Create 10 test users
  const users = [
    {
      email: 'john.doe@example.com',
      firstName: 'John',
      lastName: 'Doe',
      phoneNumber: '+1-555-0101',
      role: userRole.id
    },
    {
      email: 'jane.smith@example.com',
      firstName: 'Jane',
      lastName: 'Smith',
      phoneNumber: '+1-555-0102',
      role: userRole.id
    },
    {
      email: 'mike.johnson@example.com',
      firstName: 'Mike',
      lastName: 'Johnson',
      phoneNumber: '+1-555-0103',
      role: managerRole.id
    },
    {
      email: 'sarah.wilson@example.com',
      firstName: 'Sarah',
      lastName: 'Wilson',
      phoneNumber: '+1-555-0104',
      role: userRole.id
    },
    {
      email: 'david.brown@example.com',
      firstName: 'David',
      lastName: 'Brown',
      phoneNumber: '+1-555-0105',
      role: userRole.id
    },
    {
      email: 'lisa.davis@example.com',
      firstName: 'Lisa',
      lastName: 'Davis',
      phoneNumber: '+1-555-0106',
      role: adminRole.id
    },
    {
      email: 'robert.miller@example.com',
      firstName: 'Robert',
      lastName: 'Miller',
      phoneNumber: '+1-555-0107',
      role: userRole.id
    },
    {
      email: 'emily.garcia@example.com',
      firstName: 'Emily',
      lastName: 'Garcia',
      phoneNumber: '+1-555-0108',
      role: userRole.id
    },
    {
      email: 'james.martinez@example.com',
      firstName: 'James',
      lastName: 'Martinez',
      phoneNumber: '+1-555-0109',
      role: managerRole.id
    },
    {
      email: 'amanda.taylor@example.com',
      firstName: 'Amanda',
      lastName: 'Taylor',
      phoneNumber: '+1-555-0110',
      role: userRole.id
    }
  ];

  const hashedPassword = await bcrypt.hash('password123', 10);

  for (const userData of users) {
    try {
      const existingUser = await prisma.user.findUnique({
        where: { email: userData.email }
      });

      if (!existingUser) {
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

        console.log(`✅ Created user: ${user.firstName} ${user.lastName} (${user.email}) - Role: ${user.role?.name}`);
      } else {
        console.log(`⚠️  User already exists: ${userData.email}`);
      }
    } catch (error) {
      console.error(`❌ Error creating user ${userData.email}:`, error);
    }
  }

  console.log('🎉 Database seeding completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 