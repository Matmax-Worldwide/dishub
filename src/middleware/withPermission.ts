import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { RoleName } from '@/hooks/usePermission';

// Mapeo de roles a permisos (debe coincidir con el del hook usePermission)
const rolePermissions: Record<RoleName, string[]> = {
  ADMIN: [
    'dashboard:view',
    'admin:view',
    'users:create',
    'users:read',
    'users:update',
    'users:delete',
    'roles:create',
    'roles:read',
    'roles:update',
    'roles:delete',
    'permissions:create',
    'permissions:read',
    'permissions:update',
    'permissions:delete',
    'notifications:create',
    'notifications:read',
    'notifications:update',
    'notifications:delete',
    'cms:access',
    'cms:pages',
    'cms:media',
    'cms:menus',
    'cms:settings',
    'external-links:manage',
    'benefits:view',
    'benefits:manage',
    'help:view',
    'settings:view',
    'settings:manage',
    'staff:view',
    'staff:manage',
    'reports:view',
    'approvals:manage'
  ],
  MANAGER: [
    'dashboard:view',
    'staff:view',
    'staff:manage',
    'reports:view',
    'approvals:manage',
    'notifications:read',
    'notifications:create',
  ],
  EMPLOYEE: [
    'dashboard:view',
    'tasks:view',
    'tasks:create',
    'notifications:read',
  ],
  USER: [
    'dashboard:view',
    'profile:view',
    'profile:edit',
    'notifications:read',
  ],
};

export interface WithPermissionOptions {
  permission?: string;
  permissions?: string[];
  role?: RoleName;
  roles?: RoleName[];
  requireAll?: boolean;
  redirectTo?: string;
}

// Definir la estructura de usuario esperada
interface SessionUser {
  id?: string;
  name?: string;
  email?: string;
  role?: {
    name: RoleName;
  };
}

/**
 * Middleware para proteger rutas basado en permisos y roles
 */
export function withPermission(options: WithPermissionOptions) {
  return async function middleware(req: NextRequest) {
    // Obtener la sesión del usuario
    const session = await getServerSession();

    // Si no hay sesión, redirigir al login
    if (!session || !session.user) {
      const url = new URL('/login', req.url);
      url.searchParams.set('callbackUrl', req.url);
      return NextResponse.redirect(url);
    }

    // Obtener el rol del usuario
    const userRole = (session.user as SessionUser).role?.name;
    
    if (!userRole) {
      // Si el usuario no tiene rol, redirigir a página de acceso denegado
      return NextResponse.redirect(new URL(options.redirectTo || '/access-denied', req.url));
    }

    // Obtener los permisos del usuario basados en su rol
    const userPermissions = rolePermissions[userRole] || [];

    // Verificar si el usuario tiene los permisos necesarios
    let hasAccess = true;

    if (options.permission) {
      hasAccess = hasAccess && userPermissions.includes(options.permission);
    }

    if (options.permissions) {
      if (options.requireAll) {
        hasAccess = hasAccess && options.permissions.every(p => userPermissions.includes(p));
      } else {
        hasAccess = hasAccess && options.permissions.some(p => userPermissions.includes(p));
      }
    }

    if (options.role) {
      hasAccess = hasAccess && userRole === options.role;
    }

    if (options.roles) {
      hasAccess = hasAccess && options.roles.includes(userRole);
    }

    // Si el usuario no tiene acceso, redirigir a la página de acceso denegado
    if (!hasAccess) {
      return NextResponse.redirect(new URL(options.redirectTo || '/access-denied', req.url));
    }

    // Continuar con la solicitud
    return NextResponse.next();
  };
}

export default withPermission; 