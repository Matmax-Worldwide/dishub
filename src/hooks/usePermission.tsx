'use client';

import { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';

// Definición de roles disponibles en la aplicación
export type RoleName = 'ADMIN' | 'MANAGER' | 'EMPLOYEE' | 'USER';

// Mapeo de roles a permisos
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

interface PermissionContextType {
  hasPermission: (permission: string) => boolean;
  hasAnyPermission: (permissions: string[]) => boolean;
  hasAllPermissions: (permissions: string[]) => boolean;
  hasRole: (role: RoleName) => boolean;
  userPermissions: string[];
  isLoading: boolean;
}

const PermissionContext = createContext<PermissionContextType | null>(null);

export function PermissionProvider({ children }: { children: ReactNode }) {
  const { user, isAuthenticated } = useAuth();
  const [userPermissions, setUserPermissions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Obtener los permisos del usuario basado en su rol
    const loadPermissions = () => {
      setIsLoading(true);
      
      if (isAuthenticated && user?.role) {
        // Obtener el nombre del rol desde el objeto de rol del usuario
        const roleName = user.role.name as RoleName;
        if (roleName in rolePermissions) {
          setUserPermissions(rolePermissions[roleName]);
        } else {
          // Si no se encuentra el rol, usar permisos de USER por defecto
          setUserPermissions(rolePermissions.USER);
        }
      } else {
        setUserPermissions([]);
      }
      
      setIsLoading(false);
    };

    loadPermissions();
  }, [isAuthenticated, user]);

  // Verifica si el usuario tiene un permiso específico
  const hasPermission = (permission: string): boolean => {
    if (!isAuthenticated) return false;
    return userPermissions.includes(permission);
  };

  // Verifica si el usuario tiene al menos uno de los permisos listados
  const hasAnyPermission = (permissions: string[]): boolean => {
    if (!isAuthenticated) return false;
    return permissions.some(permission => userPermissions.includes(permission));
  };

  // Verifica si el usuario tiene todos los permisos listados
  const hasAllPermissions = (permissions: string[]): boolean => {
    if (!isAuthenticated) return false;
    return permissions.every(permission => userPermissions.includes(permission));
  };

  // Verifica si el usuario tiene un rol específico
  const hasRole = (role: RoleName): boolean => {
    if (!isAuthenticated || !user || !user.role) return false;
    return user.role.name === role;
  };

  return (
    <PermissionContext.Provider
      value={{
        hasPermission,
        hasAnyPermission,
        hasAllPermissions,
        hasRole,
        userPermissions,
        isLoading,
      }}
    >
      {children}
    </PermissionContext.Provider>
  );
}

export function usePermission() {
  const context = useContext(PermissionContext);
  
  if (!context) {
    throw new Error('usePermission debe usarse dentro de un PermissionProvider');
  }
  
  return context;
} 