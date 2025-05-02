'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { RoleName } from '@/hooks/usePermission';
import { ShieldIcon, UsersIcon, KeyIcon, CheckIcon } from 'lucide-react';
import PermissionGuard from '@/components/PermissionGuard';

// Define los roles y permisos disponibles
const roles: RoleName[] = ['ADMIN', 'MANAGER', 'EMPLOYEE', 'USER'];

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

// Define categorías para agrupar permisos
const permissionCategories = {
  dashboard: ['dashboard:view'],
  admin: ['admin:view'],
  users: ['users:create', 'users:read', 'users:update', 'users:delete'],
  roles: ['roles:create', 'roles:read', 'roles:update', 'roles:delete'],
  permissions: ['permissions:create', 'permissions:read', 'permissions:update', 'permissions:delete'],
  staff: ['staff:view', 'staff:manage'],
  tasks: ['tasks:view', 'tasks:create', 'tasks:update', 'tasks:delete'],
  notifications: ['notifications:create', 'notifications:read', 'notifications:update', 'notifications:delete'],
  reports: ['reports:view'],
  approvals: ['approvals:manage'],
  profile: ['profile:view', 'profile:edit'],
  cms: ['cms:access'],
};

// Función para obtener todos los permisos únicos
function getAllPermissions() {
  const allPermissions = new Set<string>();
  Object.values(rolePermissions).forEach(permissions => {
    permissions.forEach(permission => allPermissions.add(permission));
  });
  return Array.from(allPermissions).sort();
}

export default function PermissionsPage() {
  const [activeTab, setActiveTab] = useState('roles');
  const allPermissions = getAllPermissions();

  // Función auxiliar para verificar si un rol tiene un permiso específico
  const hasPermission = (role: RoleName, permission: string) => {
    return rolePermissions[role].includes(permission);
  };

  // Función para agrupar permisos por categoría
  const getPermissionsByCategory = () => {
    const result: Record<string, string[]> = {};
    
    // Primero añadir las categorías definidas
    Object.entries(permissionCategories).forEach(([category, permissions]) => {
      result[category] = permissions.filter(p => allPermissions.includes(p));
    });
    
    // Luego agregar permisos no categorizados
    const categorizedPermissions = Object.values(permissionCategories).flat();
    const uncategorized = allPermissions.filter(p => !categorizedPermissions.includes(p));
    
    if (uncategorized.length > 0) {
      result['otros'] = uncategorized;
    }
    
    return result;
  };

  return (
    <PermissionGuard permission="admin:view">
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Roles y Permisos</h1>
          <Badge variant="outline" className="px-3 py-1">
            <ShieldIcon className="w-4 h-4 mr-2" />
            Vista de administrador
          </Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Roles Disponibles
              </CardTitle>
              <UsersIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{roles.length}</div>
              <div className="flex flex-wrap gap-2 mt-2">
                {roles.map(role => (
                  <Badge key={role} variant="secondary">
                    {role}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Permisos Únicos
              </CardTitle>
              <KeyIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{allPermissions.length}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Distribuidos en {Object.keys(getPermissionsByCategory()).length} categorías
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Mayor Nivel de Acceso
              </CardTitle>
              <ShieldIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">ADMIN</div>
              <p className="text-xs text-muted-foreground mt-1">
                {rolePermissions.ADMIN.length} permisos totales
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="roles">Vista por Roles</TabsTrigger>
            <TabsTrigger value="permissions">Vista por Permisos</TabsTrigger>
            <TabsTrigger value="matrix">Matriz de Permisos</TabsTrigger>
          </TabsList>
          
          {/* Vista por Roles */}
          <TabsContent value="roles">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {roles.map(role => (
                <Card key={role}>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <ShieldIcon className="w-5 h-5 mr-2" />
                      {role}
                    </CardTitle>
                    <CardDescription>
                      {rolePermissions[role].length} permisos asignados
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {rolePermissions[role].map(permission => (
                        <div key={permission} className="flex items-center">
                          <CheckIcon className="w-4 h-4 mr-2 text-green-500" />
                          <span className="text-sm">{permission}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
          
          {/* Vista por Permisos */}
          <TabsContent value="permissions">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {Object.entries(getPermissionsByCategory()).map(([category, permissions]) => (
                <Card key={category}>
                  <CardHeader>
                    <CardTitle className="capitalize">
                      {category.replace(':', ' ')}
                    </CardTitle>
                    <CardDescription>
                      {permissions.length} permisos en esta categoría
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Permiso</TableHead>
                          <TableHead>Roles con acceso</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {permissions.map(permission => (
                          <TableRow key={permission}>
                            <TableCell className="font-medium">{permission}</TableCell>
                            <TableCell>
                              <div className="flex flex-wrap gap-1">
                                {roles.filter(role => 
                                  rolePermissions[role].includes(permission)
                                ).map(role => (
                                  <Badge key={role} variant="outline" className="text-xs">
                                    {role}
                                  </Badge>
                                ))}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
          
          {/* Vista Matriz */}
          <TabsContent value="matrix">
            <Card>
              <CardHeader>
                <CardTitle>Matriz de Permisos por Rol</CardTitle>
                <CardDescription>
                  Vista completa de todos los permisos asignados a cada rol
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[250px]">Permiso</TableHead>
                        {roles.map(role => (
                          <TableHead key={role}>{role}</TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {allPermissions.map(permission => (
                        <TableRow key={permission}>
                          <TableCell className="font-medium">{permission}</TableCell>
                          {roles.map(role => (
                            <TableCell key={role} className="text-center">
                              {hasPermission(role, permission) ? (
                                <div className="mx-auto flex h-5 w-5 items-center justify-center rounded-full bg-green-100">
                                  <CheckIcon className="h-3 w-3 text-green-600" />
                                </div>
                              ) : (
                                <div className="mx-auto h-5 w-5 rounded-full bg-gray-100" />
                              )}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        
        <Alert className="mt-6">
          <ShieldIcon className="h-4 w-4" />
          <AlertTitle>Importante</AlertTitle>
          <AlertDescription>
            Los cambios en esta página son solo visuales. Para modificar roles y permisos, utilice la 
            administración de roles en la sección correspondiente.
          </AlertDescription>
        </Alert>
      </div>
    </PermissionGuard>
  );
} 