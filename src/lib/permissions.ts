import { Session } from '@/app/api/graphql/types';

/**
 * Verifica si un usuario tiene un permiso específico
 * @param session Sesión del usuario
 * @param permissionName Nombre del permiso a verificar
 * @returns true si el usuario tiene el permiso, false en caso contrario
 */
export function hasPermission(session: Session | null, permissionName: string): boolean {
  if (!session || !session.user) {
    return false;
  }
  
  // Administradores tienen todos los permisos
  if (session.user.role.name === 'ADMIN' || session.user.role.name === 'SuperAdmin') {
    return true;
  }
  
  // Verificar si el usuario tiene el permiso específico
  return session.user.permissions?.includes(permissionName) || false;
}

/**
 * Verifica si un usuario tiene todos los permisos de una lista
 * @param session Sesión del usuario
 * @param permissionNames Lista de permisos a verificar
 * @returns true si el usuario tiene todos los permisos, false en caso contrario
 */
export function hasAllPermissions(session: Session | null, permissionNames: string[]): boolean {
  if (!session || !session.user) {
    return false;
  }
  
  // Administradores tienen todos los permisos
  if (session.user.role.name === 'ADMIN' || session.user.role.name === 'SuperAdmin') {
    return true;
  }
  
  // Verificar si el usuario tiene todos los permisos de la lista
  return permissionNames.every(permissionName => 
    session.user.permissions?.includes(permissionName) || false
  );
}

/**
 * Verifica si un usuario tiene al menos uno de los permisos de una lista
 * @param session Sesión del usuario
 * @param permissionNames Lista de permisos a verificar
 * @returns true si el usuario tiene al menos un permiso, false en caso contrario
 */
export function hasAnyPermission(session: Session | null, permissionNames: string[]): boolean {
  if (!session || !session.user) {
    return false;
  }
  
  // Administradores tienen todos los permisos
  if (session.user.role.name === 'ADMIN' || session.user.role.name === 'SuperAdmin') {
    return true;
  }
  
  // Verificar si el usuario tiene al menos uno de los permisos de la lista
  return permissionNames.some(permissionName => 
    session.user.permissions?.includes(permissionName) || false
  );
} 