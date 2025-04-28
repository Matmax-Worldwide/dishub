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

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      console.log('User not found for email:', email);
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
    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      session: {
        token,
        expires,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 