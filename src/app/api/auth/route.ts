import { NextRequest } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Session } from '../graphql/types';

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
export async function verifySession(req: NextRequest): Promise<Session | null> {
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

 