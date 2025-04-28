import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';
import { comparePasswords, generateToken } from '../../../lib/auth';

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

    // First find the user without selecting the role to avoid enum conversion issues
    const userExists = await prisma.user.findUnique({
      where: { email },
      select: { id: true }
    });

    if (!userExists) {
      console.log('User not found for email:', email);
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Then get the full user with all necessary fields
    const user = await prisma.user.findUnique({
      where: { id: userExists.id },
      select: {
        id: true,
        email: true,
        password: true,
        role: true,
      }
    });

    if (!user) {
      console.log('User not found');
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    console.log('User found, verifying password');
    const isValidPassword = await comparePasswords(password, user.password);

    if (!isValidPassword) {
      console.log('Invalid password for user:', email);
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    console.log('Password verified, generating token');
    // Pass the role as is - the generateToken function will handle conversion
    const token = await generateToken(user.id, user.role);
    const expires = new Date();
    expires.setDate(expires.getDate() + 7); // 7 days from now

    // Create session in database
    console.log('Creating session in database');
    await prisma.session.create({
      data: {
        sessionToken: token,
        userId: user.id,
        expires,
      },
    });

    console.log('Login successful for user:', email);
    // Convert the role to string for JSON response
    const roleStr = String(user.role);
    

    
    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        role: roleStr,
      },
      session: {
        token,
        expires,
      },
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