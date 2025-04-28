import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';
import { prisma } from './prisma';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const secret = new TextEncoder().encode(JWT_SECRET);

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function comparePasswords(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

export async function generateToken(userId: string, role: string | { toString(): string }): Promise<string> {
  // Convert role to string if it's not already a string
  const roleStr = typeof role === 'object' ? role.toString() : role;
  
  const token = await new SignJWT({ userId, role: roleStr })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(secret);
  
  return token.toString();
}

export async function verifyToken(token: string) {
  try {
    console.log('Verifying token...');
    console.log('Token:', token);
    
    const { payload } = await jwtVerify(token, secret);
    console.log('Token decoded successfully:', payload);
    
    return payload;
  } catch (error) {
    console.error('Token verification failed:', error);
    return null;
  }
}

export async function createSession(userId: string) {
  // Get the user to access the correct role
  const user = await prisma.user.findUnique({ 
    where: { id: userId },
    select: { role: true }
  });
  
  const sessionToken = await generateToken(userId, user?.role || 'USER');
  const expires = new Date();
  expires.setDate(expires.getDate() + 7); // 7 days from now

  return prisma.session.create({
    data: {
      sessionToken,
      userId,
      expires,
    },
  });
} 