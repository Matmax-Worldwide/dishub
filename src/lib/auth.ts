// src/lib/auth.ts
import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify, JWTPayload } from 'jose';
import { cookies } from 'next/headers';
import { prisma } from './prisma';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const secret = new TextEncoder().encode(JWT_SECRET);

// Updated role names to match the new role system
const VALID_ROLES = [
  // Global Platform Roles
  'SuperAdmin', 'PlatformAdmin', 'SupportAgent',
  // Tenant Level Roles
  'TenantAdmin', 'TenantManager', 'TenantUser',
  // CMS Module Roles
  'ContentManager', 'ContentEditor',
  // HRMS Module Roles
  'HRAdmin', 'HRManager', 'Employee',
  // Booking Module Roles
  'BookingAdmin', 'Agent', 'Customer',
  // E-Commerce Module Roles
  'StoreAdmin', 'StoreManager',
  // Future/Complementary Roles
  'FinanceManager', 'SalesRep', 'Instructor', 'ProjectLead'
];

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
  try {
    const cookieStore = await cookies(); // Await the cookies() call
    const token = cookieStore.get('session-token')?.value;

    if (!token) {
      return null;
    }

    const payload = await verifyToken(token);
    return payload;
  } catch (error) {
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

// Define a type for the permission object
type UserPermissionItem = {
  permissionName: string;
  granted: boolean;
};

// Processing permissions
function processPermission(permission: UserPermissionItem, userPermissions: string[]): void {
  if (permission.granted) {
    // Add permission if it doesn't already exist
    if (!userPermissions.includes(permission.permissionName)) {
      userPermissions.push(permission.permissionName);
    }
  } else {
    // Remove permission if it exists
    const index = userPermissions.indexOf(permission.permissionName);
    if (index !== -1) {
      userPermissions.splice(index, 1);
    }
  }
}

/**
 * Verifica la sesión del usuario a partir del token de autenticación
 * @param req Solicitud Next.js
 * @returns Sesión del usuario o null si no está autenticado
 */
export async function verifySession(req: { headers: { get: (name: string) => string | null } }): Promise<{ user: { id: string; email: string; firstName?: string; lastName?: string; role: { id: string; name: string }; permissions: string[]; createdAt: Date; updatedAt: Date } } | null> {
  try {
    // Obtener el token de autenticación
    const token = req.headers.get('authorization')?.split(' ')[1];
    
    if (!token) {
      return null;
    }
    
    // Verificar el token
    const decoded = await verifyToken(token) as { userId: string; role?: string };
    
    if (!decoded || !decoded.userId) {
      return null;
    }
    
    // Obtener información del usuario
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        createdAt: true,
        updatedAt: true,
        role: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
    
    if (!user) {
      return null;
    }
    
    // Si no tiene rol, no se puede continuar
    if (!user.role) {
      return null;
    }
    
    // Obtener permisos del usuario basados en su rol
    let userPermissions: string[] = [];
    
    // Obtener los permisos asociados al rol
    const rolePermissions = await prisma.permission.findMany({
      where: {
        roles: {
          some: {
            id: user.role.id,
          },
        },
      },
      select: {
        name: true,
      },
    });
    
    userPermissions = rolePermissions.map((permission: { name: string }) => permission.name);
    
    // Obtener permisos específicos del usuario
    const userSpecificPermissions = await prisma.userPermission.findMany({
      where: {
        userId: user.id,
      },
      select: {
        permissionName: true,
        granted: true
      }
    }) as UserPermissionItem[];
    
    // Process each permission using the helper function
    userSpecificPermissions.forEach(function(permission: UserPermissionItem) {
      processPermission(permission, userPermissions);
    });
    
    // Devolver la sesión del usuario con sus permisos
    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName || undefined,
        lastName: user.lastName || undefined,
        role: {
          id: user.role.id,
          name: user.role.name,
        },
        permissions: userPermissions,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      },
    };
  } catch (error) {
    console.error('Error verifying session:', error);
    return null;
  }
}