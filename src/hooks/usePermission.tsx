'use client';

import { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { gql } from '@apollo/client';
import { client } from '@/lib/apollo-client';

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
  ],
  MANAGER: [
    'dashboard:view',
    'staff:view',
    'staff:manage',
    'reports:view',
    'approvals:manage',
    'notifications:read',
    'notifications:create',
    'cms:access',
    'cms:pages',
    'cms:media',
    'cms:menus',
    'cms:settings',
    'benefits:view',
    'help:view',
    'settings:view',
  ],
  EMPLOYEE: [
    'dashboard:view',
    'notifications:read',
    'benefits:view',
    'help:view',
    'settings:view',
  ],
  USER: [
    'dashboard:view',
    'profile:view',
    'profile:edit',
    'notifications:read',
    'benefits:view',
    'help:view',
    'settings:view',
  ],
};

// Consulta GraphQL para obtener los permisos específicos del usuario
const GET_USER_SPECIFIC_PERMISSIONS = gql`
  query GetUserPermissions($userId: ID!) {
    userSpecificPermissions(userId: $userId) {
      id
      permissionName
      granted
      userId
    }
  }
`;

interface UserPermission {
  id: string;
  permissionName: string;
  granted: boolean;
  userId: string;
}

interface PermissionContextType {
  hasPermission: (permission: string) => boolean;
  hasAnyPermission: (permissions: string[]) => boolean;
  hasAllPermissions: (permissions: string[]) => boolean;
  hasRole: (role: RoleName) => boolean;
  userPermissions: string[];
  userSpecificPermissions: UserPermission[];
  isLoading: boolean;
  refreshPermissions: () => Promise<void>;
}

const PermissionContext = createContext<PermissionContextType | null>(null);

export function PermissionProvider({ children }: { children: ReactNode }) {
  const { user, isAuthenticated } = useAuth();
  const [roleBasedPermissions, setRoleBasedPermissions] = useState<string[]>([]);
  const [userSpecificPermissions, setUserSpecificPermissions] = useState<UserPermission[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Función para cargar permisos específicos del usuario desde la API
  const loadUserSpecificPermissions = async () => {
    if (!isAuthenticated || !user?.id) {
      return [];
    }
    
    try {
      const { data } = await client.query({
        query: GET_USER_SPECIFIC_PERMISSIONS,
        variables: { userId: user.id },
        fetchPolicy: 'network-only'
      });
      
      if (data?.userSpecificPermissions) {
        return data.userSpecificPermissions;
      }
      return [];
    } catch (error) {
      console.error('Error loading user specific permissions:', error);
      return [];
    }
  };

  // Función para refrescar los permisos (útil después de actualizarlos)
  const refreshPermissions = async () => {
    setIsLoading(true);
    await loadPermissions();
    setIsLoading(false);
  };

  // Cargar permisos del usuario
  const loadPermissions = async () => {
    setIsLoading(true);
    
    if (isAuthenticated && user?.role) {
      // 1. Obtener permisos basados en el rol
      const roleName = user.role.name as RoleName;
      console.log('Loading permissions for role:', roleName);
      
      const permissionsFromRole = roleName in rolePermissions 
        ? rolePermissions[roleName] 
        : rolePermissions.USER;
      
      console.log('Permissions for role:', permissionsFromRole);
      setRoleBasedPermissions(permissionsFromRole);
      
      // 2. Obtener permisos específicos del usuario
      const userPermissions = await loadUserSpecificPermissions();
      setUserSpecificPermissions(userPermissions);
    } else {
      console.log('No auth or role information available, clearing permissions');
      setRoleBasedPermissions([]);
      setUserSpecificPermissions([]);
    }
    
    setIsLoading(false);
  };

  useEffect(() => {
    loadPermissions();
  }, [isAuthenticated, user]);

  // Calcula los permisos efectivos combinando permisos de rol y específicos de usuario
  const getEffectivePermissions = (): string[] => {
    if (!isAuthenticated) return [];
    
    // Comenzar con permisos basados en rol
    const effectivePermissions = new Set(roleBasedPermissions);
    
    // Aplicar permisos específicos del usuario (tienen prioridad)
    userSpecificPermissions.forEach((permission) => {
      if (permission.granted) {
        // Agregar permisos explícitamente concedidos
        effectivePermissions.add(permission.permissionName);
      } else {
        // Eliminar permisos explícitamente denegados
        effectivePermissions.delete(permission.permissionName);
      }
    });
    
    return Array.from(effectivePermissions);
  };

  // Verifica si el usuario tiene un permiso específico
  const hasPermission = (permission: string): boolean => {
    if (!isAuthenticated) {
      console.log('hasPermission check failed - user not authenticated');
      return false;
    }
    
    const effectivePermissions = getEffectivePermissions();
    const hasPermission = effectivePermissions.includes(permission);
    
    console.log('hasPermission check:', {
      permission,
      effectivePermissions,
      hasPermission
    });
    
    return hasPermission;
  };

  // Verifica si el usuario tiene al menos uno de los permisos listados
  const hasAnyPermission = (permissions: string[]): boolean => {
    if (!isAuthenticated) return false;
    const effectivePermissions = getEffectivePermissions();
    return permissions.some(permission => effectivePermissions.includes(permission));
  };

  // Verifica si el usuario tiene todos los permisos listados
  const hasAllPermissions = (permissions: string[]): boolean => {
    if (!isAuthenticated) return false;
    const effectivePermissions = getEffectivePermissions();
    return permissions.every(permission => effectivePermissions.includes(permission));
  };

  // Verifica si el usuario tiene un rol específico
  const hasRole = (role: RoleName): boolean => {
    if (!isAuthenticated || !user || !user.role) {
      console.log('hasRole check failed - user not authenticated or missing role info');
      return false;
    }
    
    // Obtener el nombre del rol del usuario y el rol a verificar (ambos en mayúsculas para comparación insensible a mayúsculas)
    const userRoleName = user.role.name.toUpperCase();
    const roleName = role.toUpperCase();
    
    console.log('hasRole check:', {
      userRole: user.role,
      userRoleName,
      roleName,
      isMatch: userRoleName === roleName
    });
    
    // Verificación especial para ADMIN
    if (roleName === 'ADMIN') {
      return userRoleName === 'ADMIN';
    }
    
    return userRoleName === roleName;
  };

  return (
    <PermissionContext.Provider
      value={{
        hasPermission,
        hasAnyPermission,
        hasAllPermissions,
        hasRole,
        userPermissions: getEffectivePermissions(),
        userSpecificPermissions,
        isLoading,
        refreshPermissions,
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