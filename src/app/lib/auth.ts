import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';
import { prisma } from './prisma';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const secret = new TextEncoder().encode(JWT_SECRET);

// Valid role values based on the Prisma schema
const VALID_ROLES = ['USER', 'ADMIN', 'MANAGER', 'EMPLOYEE'];

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function comparePasswords(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

export async function generateToken(userId: string, role?: string | object | null): Promise<string> {
  // Handle different role types properly
  let roleValue: string = 'USER'; // Default role
  
  if (role != null) {
    if (typeof role === 'string') {
      // If it's already a string, use it directly (after validation)
      if (VALID_ROLES.includes(role)) {
        roleValue = role;
      }
    } else if (typeof role === 'object') {
      // Handle potential enum object
      const roleStr = String(role);
      if (VALID_ROLES.includes(roleStr)) {
        roleValue = roleStr;
      }
    }
  }
  
  console.log('Generating token with role:', roleValue);
  
  const token = await new SignJWT({ userId, role: roleValue })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(secret);
  
  return token.toString();
}

export async function verifyToken(token: string) {
  try {
    console.log('Verifying token...');
    
    if (!token || typeof token !== 'string' || token.trim() === '') {
      console.error('Token validation error: Empty or invalid token');
      return null;
    }
    
    console.log('Token length:', token.length);
    console.log('Token first 10 chars:', token.substring(0, 10) + '...');
    
    const { payload } = await jwtVerify(token, secret);
    console.log('Token decoded successfully:', payload);
    
    // Validate payload contains required fields
    if (!payload.userId) {
      console.error('Token missing userId in payload');
      return null;
    }
    
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
  
  const sessionToken = await generateToken(userId, user?.role?.name || 'USER');
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