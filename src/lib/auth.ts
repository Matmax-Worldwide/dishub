// src/lib/auth.ts
import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify, JWTPayload } from 'jose'; // Import JWTPayload
import { cookies } from 'next/headers';
import { prisma } from './prisma';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const secret = new TextEncoder().encode(JWT_SECRET);

// Valid role values based on the Prisma schema
const VALID_ROLES = ['USER', 'ADMIN', 'MANAGER', 'EMPLOYEE', 'SUPER_ADMIN', 'STAFF']; // Added SUPER_ADMIN, STAFF

// Define a more specific type for our JWT payload
export interface UserJwtPayload extends JWTPayload {
  userId: string;
  roleId?: string;
  role: string; // Role should always be a string
  tenantId?: string | null; // tenantId is optional
  // Potentially add other fields like tenants array from the guide if needed in future
  // tenants?: Array<{ id: string; role: string; status: string }>;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function comparePasswords(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

// Updated generateToken to accept tenantId
export async function generateToken(
  userId: string,
  roleInfo?: { id?: string, name?: string } | string | null,
  tenantId?: string | null // Added tenantId parameter
): Promise<string> {
  let roleId: string | undefined = undefined;
  let roleName: string = 'USER'; // Default role

  if (roleInfo != null) {
    if (typeof roleInfo === 'string') {
      if (VALID_ROLES.includes(roleInfo.toUpperCase())) {
        roleName = roleInfo.toUpperCase();
      }
    } else if (typeof roleInfo === 'object' && roleInfo.name) {
      if (VALID_ROLES.includes(roleInfo.name.toUpperCase())) {
        roleName = roleInfo.name.toUpperCase();
      }
      roleId = roleInfo.id;
    }
  }

  console.log(`Generating token with userId: ${userId}, roleId: ${roleId}, roleName: ${roleName}, tenantId: ${tenantId}`);

  const tokenPayload: UserJwtPayload = {
    userId,
    role: roleName,
  };
  if (roleId) {
    tokenPayload.roleId = roleId;
  }
  if (tenantId) {
    tokenPayload.tenantId = tenantId;
  }

  const token = await new SignJWT(tokenPayload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d') // Consider making this configurable
    .sign(secret);

  return token.toString();
}

// Updated verifyToken to return the more specific UserJwtPayload
export async function verifyToken(token: string): Promise<UserJwtPayload | null> {
  try {
    if (!token || typeof token !== 'string' || token.trim() === '') {
      console.error('Token validation error: Empty or invalid token');
      return null;
    }

    const { payload } = await jwtVerify(token, secret);

    if (!payload.userId || typeof payload.userId !== 'string') {
      console.error('Token missing or invalid userId in payload');
      return null;
    }
    if (!payload.role || typeof payload.role !== 'string' || !VALID_ROLES.includes((payload.role as string).toUpperCase())) {
        // If role is missing or invalid, we might still allow it but log a warning,
        // or treat it as a default role. For now, let's ensure it's a valid string.
        console.warn(`Token has missing or invalid role: ${payload.role}. Proceeding with caution or defaulting.`);
        // If strict role validation is needed here, return null or throw error.
    }


    // Cast to UserJwtPayload. Ensure all required fields are present or handled.
    const userPayload: UserJwtPayload = {
        userId: payload.userId as string,
        role: payload.role ? (payload.role as string).toUpperCase() : 'USER', // Default to USER if role is missing/invalid
        roleId: payload.roleId as string | undefined,
        tenantId: payload.tenantId as string | null | undefined, // tenantId is optional
    };
    
    // If tenantId is explicitly undefined in payload, convert to null for consistency
    if (userPayload.tenantId === undefined) {
        userPayload.tenantId = null;
    }

    return userPayload;
  } catch (error) {
    console.error('Token verification failed:', error);
    return null;
  }
}

// Updated getSession to use UserJwtPayload
export async function getSession(): Promise<UserJwtPayload | null> {
  const cookieStore = cookies(); // Correctly call cookies()
  const token = cookieStore.get('session-token')?.value;

  if (!token) {
    return null;
  }

  try {
    const payload = await verifyToken(token);
    return payload;
  } catch (error) { // Catching potential errors from verifyToken if it throws
    console.error('Error getting session:', error);
    return null;
  }
}

// Updated createSession to pass tenantId to generateToken
// The tenantId should be determined at the point of login/session creation.
// For now, this function might not know the tenantId directly unless passed.
// This might require changes in the login API route that calls createSession.
// For this subtask, we'll assume tenantId might be passed to createSession if available.
export async function createSession(userId: string, tenantId?: string | null) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      roleId: true,
      role: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  const roleInfo = {
    id: user?.role?.id, // roleId from user object
    name: user?.role?.name || 'USER', // roleName from user object, default to 'USER'
  };
  
  // Pass tenantId to generateToken
  const sessionToken = await generateToken(userId, roleInfo, tenantId);
  const expires = new Date();
  expires.setDate(expires.getDate() + 7); // 7 days from now

  // This creates a session record in the DB, not directly setting a cookie here.
  // Cookie setting is typically done in an API route response.
  return prisma.session.create({
    data: {
      sessionToken,
      userId,
      expires,
    },
  });
}