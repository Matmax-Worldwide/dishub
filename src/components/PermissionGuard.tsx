'use client';

import { ReactNode } from 'react';
import { usePermission } from '@/hooks/usePermission';

interface PermissionGuardProps {
  permission: string;
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * Un componente que renderiza su contenido solo si el usuario tiene el permiso especificado.
 * Si no tiene el permiso, muestra el fallback si se proporciona, o no renderiza nada.
 */
export default function PermissionGuard({ 
  permission, 
  children, 
  fallback 
}: PermissionGuardProps) {
  const { hasPermission } = usePermission();
  
  // Si el usuario tiene el permiso, mostrar el contenido
  if (hasPermission(permission)) {
    return <>{children}</>;
  }
  
  // Si no tiene permiso y hay un fallback, mostrar el fallback
  if (fallback) {
    return <>{fallback}</>;
  }
  
  // Si no tiene permiso y no hay fallback, no mostrar nada
  return null;
} 