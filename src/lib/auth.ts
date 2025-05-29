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
  let roleId: string | undefined = undefined;
  let roleName: string = 'USER'; // Default role

  console.log(`Initial roleInfo for token generation (userId: ${userId}):`, roleInfo);

  if (typeof roleInfo === 'object' && roleInfo !== null) {
    // Case 1: roleInfo is an object (e.g., { id: "role_xyz", name: "ADMIN" })
    if (roleInfo.name && VALID_ROLES.includes(roleInfo.name)) {
      // Valid name provided in object
      roleName = roleInfo.name;
      roleId = roleInfo.id; // Use id from object, could be undefined if not provided.
    } else if (roleInfo.name) {
      // An invalid role name was provided in the object (e.g., name: "SUPER_ADMIN_INVALID")
      // Default to 'USER' and discard the provided roleInfo.id, as it's associated with an invalid role name.
      console.warn(`Invalid role name '${roleInfo.name}' in object for userId '${userId}'. Defaulting to roleName 'USER' and undefined roleId.`);
      // roleName is already 'USER' (default), roleId remains undefined.
    } else {
      // roleInfo.name is undefined or null, but roleInfo.id might be present (e.g., { id: "role_xyz" })
      // Use default roleName 'USER', but preserve roleInfo.id if provided.
      // This implies the caller might have specific use for an id with a default user role.
      // createSession will typically provide both name and id, so this path is less common for session creation.
      roleId = roleInfo.id;
      // roleName is already 'USER' (default).
    }
  } else if (typeof roleInfo === 'string') {
    // Case 2: roleInfo is a string (e.g., "ADMIN", assumed to be roleName)
    if (VALID_ROLES.includes(roleInfo)) {
      roleName = roleInfo;
      // roleId remains undefined.
      // Fetching roleId from DB based on roleName is not done here to keep the function simpler
      // and avoid I/O. Callers like createSession are expected to provide a full roleInfo object (id and name)
      // if the roleId is known and required in the token payload.
    } else {
      // Invalid role name string (e.g., "SUPER_ADMIN_INVALID")
      console.warn(`Invalid role name string '${roleInfo}' for userId '${userId}'. Defaulting to roleName 'USER'.`);
      // roleName is already 'USER' (default), roleId remains undefined.
    }
  }
  // Case 3: roleInfo is null, undefined, or any other type not explicitly handled.
  // The initial defaults (roleName = 'USER', roleId = undefined) will apply.

  console.log(`Final token parameters for userId: ${userId} - roleId: ${roleId}, roleName: ${roleName}`);
  
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