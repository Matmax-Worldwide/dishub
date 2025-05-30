import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { comparePasswords, generateToken } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    console.log('Login request received');
    const { email, password } = await request.json();
    console.log('Login attempt for email:', email);

    if (!email || !password) {
      console.log('Missing email or password');
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Find the user with role relationship
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
      console.log('User not found for email:', email);
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    console.log('User found, verifying password');
    
    // Check if user has a password set
    if (!user.password) {
      console.log('User has no password set for email:', email);
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }
    
    const isValidPassword = await comparePasswords(password, user.password);

    if (!isValidPassword) {
      console.log('Invalid password for user:', email);
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Create role info object for token generation
    const roleInfo = {
      id: user.roleId || undefined,
      name: user.role?.name || 'USER'
    };

    console.log('Password verified, generating token');
    // Generate token with roleInfo
    const token = await generateToken(user.id, roleInfo);
    console.log('Generating token with role:', roleInfo.name);
    
    // Create session in database
    console.log('Creating session in database');
    try {
      await prisma.session.create({
        data: {
          sessionToken: token,
          userId: user.id,
          expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        },
      });
    } catch (sessionError) {
      console.error('Session creation error:', sessionError);
      // Continue even if session creation fails, as we'll use localStorage as backup
    }

    // Return user data (excluding password) and token directly
    // eslint-disable-next-line @typescript-eslint/no-unused-vars, no-unused-vars
    const { password: _password, ...userWithoutPassword } = user;
    
    console.log('Login successful for user:', email);
    return NextResponse.json({
      user: {
        ...userWithoutPassword,
        role: user.role?.name || 'USER'
      },
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    
    // Provide a more detailed error message if possible
    let errorMessage = 'Internal server error';
    
    if (error instanceof Error) {
      // Provide more specific error messages
      if (error.message.includes('P2002')) {
        errorMessage = 'Email already exists';
      } else if (error.message.includes('P2025')) {
        errorMessage = 'Record not found';
      } else if (error.message.includes('P2032')) {
        errorMessage = 'Database schema error - Please contact support';
      } else {
        // Log the full error for debugging but don't expose it to clients
        console.error('Detailed error:', error);
        errorMessage = 'Authentication failed. Please try again.';
      }
    }
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
} 