import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
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

export async function generateToken(userId: string, roleInfo?: { id?: string, name?: string } | string | null): Promise<string> {
  // Handle different role types properly
  let roleId: string | undefined = undefined;
  let roleName: string = 'USER'; // Default role
  
  if (roleInfo != null) {
    if (typeof roleInfo === 'string') {
      // If it's already a string, use it as the role name
      if (VALID_ROLES.includes(roleInfo)) {
        roleName = roleInfo;
      }
    } else if (typeof roleInfo === 'object') {
      // Handle role object with id and name
      if (roleInfo.id) {
        roleId = roleInfo.id;
      }
      
      if (roleInfo.name && VALID_ROLES.includes(roleInfo.name)) {
        roleName = roleInfo.name;
      }
    }
  }
  
  console.log('Generating token with roleId:', roleId, 'roleName:', roleName);
  
  const token = await new SignJWT({ userId, roleId, role: roleName })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(secret);
  
  return token.toString();
}

export async function verifyToken(token: string) {
  try {

    if (!token || typeof token !== 'string' || token.trim() === '') {
      console.error('Token validation error: Empty or invalid token');
      return null;
    }
    

    const { payload } = await jwtVerify(token, secret);

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

export async function getSession() {
  const cookieStore = await cookies()
  const token = cookieStore.get('session-token')?.value

  if (!token) {
    return null
  }

  try {
    const payload = await verifyToken(token)
    return payload
  } catch {
    return null
  }
}

export async function createSession(userId: string) {
  // Get the user to access the role
  const user = await prisma.user.findUnique({ 
    where: { id: userId },
    select: { 
      roleId: true,
      role: {
        select: {
          id: true,
          name: true
        }
      }
    }
  });
  
  // Create a role object with both id and name
  const roleInfo = {
    id: user?.roleId || undefined,
    name: user?.role?.name || 'USER'
  };
  
  const sessionToken = await generateToken(userId, roleInfo);
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