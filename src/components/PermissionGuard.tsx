'use client';

import { ReactNode, useState } from 'react';
import { usePermission, RoleName } from '@/hooks/usePermission';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ShieldIcon } from 'lucide-react';

interface PermissionGuardProps {
  permission?: string;
  permissions?: string[];
  role?: RoleName;
  roles?: RoleName[];
  requireAll?: boolean;
  fallback?: ReactNode;
  children: ReactNode;
}

/**
 * PermissionGuard - Componente que protege su contenido basado en permisos
 * 
 * @param permission - Un permiso único a verificar
 * @param permissions - Lista de permisos a verificar
 * @param role - Un rol único a verificar
 * @param roles - Lista de roles a verificar
 * @param requireAll - Si es true, el usuario debe tener todos los permisos; si es false, solo uno (default: false)
 * @param fallback - Componente a mostrar si el usuario no tiene permisos
 * @param children - Contenido a mostrar si el usuario tiene permisos
 */
export default function PermissionGuard({
  permission,
  permissions = [],
  role,
  roles = [],
  requireAll = false,
  fallback,
  children,
}: PermissionGuardProps) {
  const { hasPermission, hasAnyPermission, hasAllPermissions, hasRole, isLoading, userPermissions } = usePermission();
  const [showDebug, setShowDebug] = useState(false);
  
  // Si está cargando, no mostrar nada todavía
  if (isLoading) {
    return <div>Cargando permisos...</div>;
  }
  
  let hasAccess = false;
  const debugInfo = {
    roleChecks: [] as {role: string, hasRole: boolean}[],
    permissionChecks: [] as {permission: string, hasPermission: boolean}[],
    finalDecision: false
  };
  
  // Verificar por rol específico
  if (role) {
    const result = hasRole(role);
    debugInfo.roleChecks.push({role, hasRole: result});
    hasAccess = result;
  } 
  
  // Verificar por lista de roles
  if (!hasAccess && roles.length > 0) {
    for (const r of roles) {
      const result = hasRole(r);
      debugInfo.roleChecks.push({role: r, hasRole: result});
      if (result) {
        hasAccess = true;
        break;
      }
    }
  }
  
  // Si no tiene acceso por rol, verificar permisos
  if (!hasAccess) {
    // Si se proporciona un permiso único
    if (permission) {
      const result = hasPermission(permission);
      debugInfo.permissionChecks.push({permission, hasPermission: result});
      hasAccess = result;
    } 
    // Si se proporciona una lista de permisos
    else if (permissions.length > 0) {
      if (requireAll) {
        hasAccess = hasAllPermissions(permissions);
        permissions.forEach(p => {
          const result = hasPermission(p);
          debugInfo.permissionChecks.push({permission: p, hasPermission: result});
        });
      } else {
        hasAccess = hasAnyPermission(permissions);
        permissions.forEach(p => {
          const result = hasPermission(p);
          debugInfo.permissionChecks.push({permission: p, hasPermission: result});
        });
      }
    } 
    // Si no se proporcionan permisos ni roles, permitir acceso
    else if (!role && roles.length === 0) {
      hasAccess = true;
    }
  }
  
  debugInfo.finalDecision = hasAccess;
  
  // Componente de depuración
  const DebugPanel = () => (
    <div className="fixed bottom-2 right-2 z-50 p-4 bg-black bg-opacity-80 text-white rounded-lg max-w-md text-xs overflow-auto max-h-[80vh]">
      <div className="flex justify-between items-center mb-2">
        <h4 className="font-bold">PermissionGuard Debug</h4>
        <button 
          onClick={() => setShowDebug(false)}
          className="px-2 py-1 bg-red-500 text-white rounded"
        >
          Close
        </button>
      </div>
      
      <div className="mb-2">
        <p className="font-semibold">Checking for:</p>
        {role && <p>Role: {role}</p>}
        {roles.length > 0 && <p>Roles: {roles.join(', ')}</p>}
        {permission && <p>Permission: {permission}</p>}
        {permissions.length > 0 && (
          <p>Permissions: {permissions.join(', ')} ({requireAll ? 'Require ALL' : 'Require ANY'})</p>
        )}
      </div>
      
      <div className="mb-2">
        <p className="font-semibold">User has permissions:</p>
        <ul className="list-disc list-inside">
          {userPermissions.map(p => (
            <li key={p}>{p}</li>
          ))}
        </ul>
      </div>
      
      {debugInfo.roleChecks.length > 0 && (
        <div className="mb-2">
          <p className="font-semibold">Role Checks:</p>
          <ul className="list-disc list-inside">
            {debugInfo.roleChecks.map(({role, hasRole}, i) => (
              <li key={i} className={hasRole ? 'text-green-400' : 'text-red-400'}>
                {role}: {hasRole ? '✓' : '✗'}
              </li>
            ))}
          </ul>
        </div>
      )}
      
      {debugInfo.permissionChecks.length > 0 && (
        <div className="mb-2">
          <p className="font-semibold">Permission Checks:</p>
          <ul className="list-disc list-inside">
            {debugInfo.permissionChecks.map(({permission, hasPermission}, i) => (
              <li key={i} className={hasPermission ? 'text-green-400' : 'text-red-400'}>
                {permission}: {hasPermission ? '✓' : '✗'}
              </li>
            ))}
          </ul>
        </div>
      )}
      
      <div className={`font-bold mt-2 ${debugInfo.finalDecision ? 'text-green-400' : 'text-red-400'}`}>
        Final Decision: {debugInfo.finalDecision ? 'ACCESS GRANTED' : 'ACCESS DENIED'}
      </div>
    </div>
  );
  
  // Si tiene acceso, mostrar el contenido
  if (hasAccess) {
    return (
      <>
        {process.env.NODE_ENV !== 'production' && (
          <>
            <button
              onClick={() => setShowDebug(!showDebug)}
              className="fixed bottom-2 left-2 z-50 px-3 py-1 bg-blue-500 text-white rounded text-xs"
            >
              Debug Permissions
            </button>
            {showDebug && <DebugPanel />}
          </>
        )}
        {children}
      </>
    );
  }
  
  // Si el usuario no tiene los permisos necesarios, mostrar el fallback o una alerta por defecto
  if (fallback) {
    return (
      <>
        {process.env.NODE_ENV !== 'production' && (
          <>
            <button
              onClick={() => setShowDebug(!showDebug)}
              className="fixed bottom-2 left-2 z-50 px-3 py-1 bg-blue-500 text-white rounded text-xs"
            >
              Debug Permissions
            </button>
            {showDebug && <DebugPanel />}
          </>
        )}
        {fallback}
      </>
    );
  }
  
  // Fallback por defecto
  return (
    <Alert className="my-4">
      <ShieldIcon className="h-4 w-4 mr-2" />
      <AlertDescription>
        No tienes permisos para acceder a este contenido.
      </AlertDescription>
    </Alert>
  );
} 