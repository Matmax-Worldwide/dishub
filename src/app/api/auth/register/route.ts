import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword, generateToken } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    console.log('Register request received');
    const { name, email, password } = await request.json();
    console.log('Register attempt for email:', email);

    if (!email || !password) {
      console.log('Missing email or password');
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
      console.log('User already exists for email:', email);
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      );
    }

    // Get the default USER role
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

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Split name into firstName and lastName
    const nameParts = name ? name.split(' ') : ['', ''];
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    // Create new user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName,
        lastName,
        roleId: userRole.id
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

    console.log('User created successfully:', user.id);

    // Create role info object for token generation
    const roleInfo = {
      id: user.roleId || '',
      name: user.role?.name || 'USER'
    };

    // Generate JWT token
    const token = await generateToken(user.id, roleInfo);
    console.log('Generated token for new user');

    // Create session in database
    try {
      await prisma.session.create({
        data: {
          sessionToken: token,
          userId: user.id,
          expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
        }
      });
      console.log('Created session for new user');
    } catch (sessionError) {
      console.error('Session creation error:', sessionError);
      // Continue even if session creation fails, as we'll use localStorage as backup
    }

    // Remove password from response
    // eslint-disable-next-line @typescript-eslint/no-unused-vars, no-unused-vars
    const { password: _password, ...userWithoutPassword } = user;

    return NextResponse.json({
      user: {
        ...userWithoutPassword,
        role: user.role?.name || 'USER'
      },
      token
    });
  } catch (error) {
    console.error('Registration error:', error);
    
    // Provide a more detailed error message if possible
    let errorMessage = 'Internal server error';
    
    if (error instanceof Error) {
      // Provide more specific error messages based on common errors
      if (error.message.includes('P2002')) {
        errorMessage = 'Email already exists';
      } else {
        // Log the full error for debugging but don't expose it to clients
        console.error('Detailed error:', error);
        errorMessage = 'Registration failed. Please try again.';
      }
    }
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
} 