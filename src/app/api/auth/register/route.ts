import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';
import { hashPassword, generateToken } from '../../../lib/auth';

export async function POST(request: Request) {
  try {
    const { email, password, firstName, lastName, phoneNumber } = await request.json();

    if (!email || !password || !firstName || !lastName) {
      return NextResponse.json(
        { error: 'Email, password, first name, and last name are required' },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'User already exists' },
        { status: 400 }
      );
    }

    const hashedPassword = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName,
        lastName,
        phoneNumber,
      },
    });

    const token = await generateToken(user.id, user.role);
    const expires = new Date();
    expires.setDate(expires.getDate() + 7); // 7 days from now

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phoneNumber: user.phoneNumber,
        role: user.role,
      },
      session: {
        token,
        expires,
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 