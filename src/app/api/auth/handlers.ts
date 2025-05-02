import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';
import { generateToken, hashPassword, comparePasswords } from '@/lib/auth';

const prisma = new PrismaClient();

// Get the USER role ID (create it if it doesn't exist)
async function getDefaultUserRole() {
  // Find the USER role
  let userRole = await prisma.roleModel.findFirst({
    where: { name: 'USER' }
  });

  // If the USER role doesn't exist, create it
  if (!userRole) {
    userRole = await prisma.roleModel.create({
      data: {
        name: 'USER',
        description: 'Default user role with basic permissions'
      }
    });
    console.log('Created default USER role');
  }

  return userRole.id;
}

export async function loginHandler(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Find the user
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        role: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Verify password
    const passwordValid = await comparePasswords(password, user.password);

    if (!passwordValid) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Create role info object for token generation
    const roleInfo = {
      id: user.roleId || undefined,
      name: user.role?.name || 'USER'
    };

    // Generate JWT token
    const token = await generateToken(user.id, roleInfo);

    // Return user data (excluding password) and token
    // eslint-disable-next-line @typescript-eslint/no-unused-vars, no-unused-vars
    const { password: _password, ...userWithoutPassword } = user;
    const userData = {
      ...userWithoutPassword,
      role: user.role?.name || 'USER' // Include role name as string for backward compatibility
    };

    return NextResponse.json({
      user: userData,
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'An error occurred during login' },
      { status: 500 }
    );
  }
}

export async function registerHandler(req: Request) {
  try {
    const { name, email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      );
    }

    // Get the default USER roleId
    const userRoleId = await getDefaultUserRole();

    // Hash the password
    const hashedPassword = await hashPassword(password);

    // Create the new user with proper field mapping
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName: name?.split(' ')[0] || '',
        lastName: name?.split(' ').slice(1).join(' ') || '',
        roleId: userRoleId, // Connect to the USER role
      },
      include: {
        role: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    // Create role info object for token generation
    const roleInfo = {
      id: user.roleId || undefined,
      name: user.role?.name || 'USER'
    };

    // Generate JWT token
    const token = await generateToken(user.id, roleInfo);

    // Return user data (excluding password) and token
    // eslint-disable-next-line @typescript-eslint/no-unused-vars, no-unused-vars
    const { password: _password, ...userWithoutPassword } = user;
    const userData = {
      ...userWithoutPassword,
      role: user.role?.name || 'USER' // Include role name as string for backward compatibility
    };

    return NextResponse.json({
      user: userData,
      token
    });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'An error occurred during registration' },
      { status: 500 }
    );
  }
} 