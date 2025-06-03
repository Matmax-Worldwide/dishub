'use client';

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { gql, useMutation, useQuery } from "@apollo/client";
import { client } from "@/app/lib/apollo-client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { ShieldIcon, UserIcon, CheckIcon, XIcon, AlertTriangleIcon, InfoIcon, ArrowLeftIcon } from "lucide-react";
import PermissionGuard from "@/components/PermissionGuard";
import type { RoleName } from "@/hooks/usePermission";

// Consultas GraphQL
const GET_USER_QUERY = gql`
  query GetUser($userId: ID!) {
    user(id: $userId) {
      id
      email
      firstName
      lastName
      role {
        id
        name
        description
      }
    }
  }
`;

const GET_ALL_PERMISSIONS_QUERY = gql`
  query GetAllPermissions {
    permissions {
      id
      name
      description
    }
  }
`;

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

// Mutaciones GraphQL
const SET_USER_PERMISSION_MUTATION = gql`
  mutation SetUserPermission($input: UserPermissionInput!) {
    setUserPermission(input: $input) {
      id
      permissionName
      granted
      userId
    }
  }
`;

// Definición de tipos
interface Permission {
  id: string;
  name: string;
  description?: string;
}

interface UserPermission {
  id?: string;
  permissionName: string;
  granted: boolean;
  userId: string;
}

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: {
    id: string;
    name: string;
    description?: string;
  };
}

// Mapeo de roles a permisos (copia del usePermission.tsx)
const rolePermissionsMap: Record<RoleName, string[]> = {
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
    'tasks:view',
    'tasks:create',
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

// Componente principal
export default function UserPermissionsPage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.id as string;
  const { locale } = params;
  const [activeTab, setActiveTab] = useState("all");
  const [user, setUser] = useState<User | null>(null);
  const [allPermissions, setAllPermissions] = useState<Permission[]>([]);
  const [userPermissions, setUserPermissions] = useState<UserPermission[]>([]);
  const [rolePermissions, setRolePermissions] = useState<Record<string, boolean>>({});
  const [effectivePermissions, setEffectivePermissions] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Cargar datos del usuario, permisos y permisos específicos
  const { loading: userLoading } = useQuery(GET_USER_QUERY, {
    client,
    variables: { userId },
    fetchPolicy: 'network-only',
    onCompleted: (data) => {
      if (data?.user) {
        setUser(data.user);
      }
    },
    onError: (error) => {
      toast.error("Error al cargar los datos del usuario");
      console.error("Error loading user data:", error);
    },
  });

  const { loading: permissionsLoading } = useQuery(GET_ALL_PERMISSIONS_QUERY, {
    client,
    fetchPolicy: 'network-only',
    onCompleted: (data) => {
      if (data?.permissions) {
        setAllPermissions(data.permissions);
      }
    },
    onError: (error) => {
      toast.error("Error al cargar la lista de permisos");
      console.error("Error loading permissions:", error);
    },
  });

  const { loading: userPermissionsLoading, refetch: refetchUserPermissions } = useQuery(GET_USER_SPECIFIC_PERMISSIONS, {
    client,
    variables: { userId },
    fetchPolicy: 'network-only',
    onCompleted: (data) => {
      if (data?.userSpecificPermissions) {
        setUserPermissions(data.userSpecificPermissions);
      }
    },
    onError: (error) => {
      toast.error("Error al cargar los permisos específicos del usuario");
      console.error("Error loading user permissions:", error);
    },
  });

  // Función para establecer/actualizar un permiso específico de usuario
  const [setUserPermission, { loading: settingPermission }] = useMutation(SET_USER_PERMISSION_MUTATION, {
    client,
    onCompleted: () => {
      refetchUserPermissions();
      toast.success("Permiso actualizado correctamente");
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    },
    onError: (error) => {
      toast.error("Error al actualizar el permiso");
      console.error("Error setting user permission:", error);
    },
  });

  // Determinar los permisos basados en el rol del usuario (reemplazando el import dinámico)
  useEffect(() => {
    if (user?.role?.name && allPermissions.length > 0) {
      const roleName = user.role.name as RoleName;
      
      const rolePerms: Record<string, boolean> = {};
      allPermissions.forEach(permission => {
        // Verificar si el rol tiene este permiso
        const hasPermission = rolePermissionsMap[roleName]?.includes(permission.name) || false;
        rolePerms[permission.name] = hasPermission;
      });
      
      setRolePermissions(rolePerms);
      calculateEffectivePermissions(rolePerms, userPermissions);
    }
  }, [user, allPermissions, userPermissions]);

  // Calcular los permisos efectivos (combinación de rol y específicos)
  const calculateEffectivePermissions = (rolePerms: Record<string, boolean>, userPerms: UserPermission[]) => {
    const effective: Record<string, boolean> = { ...rolePerms };
    
    // Aplicar permisos específicos del usuario (tienen prioridad)
    userPerms.forEach(permission => {
      effective[permission.permissionName] = permission.granted;
    });
    
    setEffectivePermissions(effective);
    setLoading(false);
  };

  // Manejar el cambio de un permiso específico
  const handlePermissionChange = (permissionName: string, granted: boolean | null) => {
    setUserPermission({
      variables: {
        input: {
          userId,
          permissionName,
          granted,
        },
      },
    });
  };

  // Obtener las categorías de permisos
  const getPermissionCategories = () => {
    const categories = new Set<string>();
    allPermissions.forEach(permission => {
      // Extraer la categoría del nombre del permiso (ej: 'dashboard:view' => 'dashboard')
      const category = permission.name.split(':')[0];
      categories.add(category);
    });
    return ['all', ...Array.from(categories)].sort();
  };

  // Filtrar permisos por categoría
  const getFilteredPermissions = () => {
    if (selectedCategory === 'all') {
      return allPermissions;
    }
    return allPermissions.filter(permission => permission.name.startsWith(`${selectedCategory}:`));
  };

  // Verificar si hay permisos específicos establecidos para un permiso
  const hasSpecificPermission = (permissionName: string) => {
    return userPermissions.some(p => p.permissionName === permissionName);
  };

  // Obtener el estado de un permiso específico
  const getSpecificPermissionState = (permissionName: string) => {
    const userPermission = userPermissions.find(p => p.permissionName === permissionName);
    return userPermission ? userPermission.granted : null;
  };

  if (loading || userLoading || permissionsLoading || userPermissionsLoading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-center h-full">
          <p className="text-lg font-medium">Cargando permisos...</p>
        </div>
      </div>
    );
  }

  return (
    <PermissionGuard permissions={['users:update', 'permissions:update']} requireAll={true}>
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => router.push(`/${locale}/admin/users`)}
              className="mr-2"
            >
              <ArrowLeftIcon className="h-4 w-4 mr-1" />
              Volver
            </Button>
            <h1 className="text-3xl font-bold">Permisos de Usuario</h1>
          </div>
          <Badge variant="outline" className="px-3 py-1">
            <UserIcon className="w-4 h-4 mr-2" />
            {user?.firstName} {user?.lastName}
          </Badge>
        </div>

        {saveSuccess && (
          <Alert className="mb-6 bg-green-50 border-green-200">
            <CheckIcon className="h-4 w-4 text-green-600" />
            <AlertTitle>Guardado exitoso</AlertTitle>
            <AlertDescription>
              Los permisos del usuario han sido actualizados correctamente.
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Información del Usuario
              </CardTitle>
              <UserIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Nombre:</span>
                  <span className="text-sm font-medium">{user?.firstName} {user?.lastName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Email:</span>
                  <span className="text-sm font-medium">{user?.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Rol:</span>
                  <Badge variant="secondary">{user?.role?.name}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Permisos Personalizados
              </CardTitle>
              <ShieldIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{userPermissions.length}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Permisos específicos asignados a este usuario
              </p>
              <div className="mt-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Concedidos:</span>
                  <Badge className="bg-green-100 text-green-800 hover:bg-green-200">
                    {userPermissions.filter(p => p.granted).length}
                  </Badge>
                </div>
                <div className="flex justify-between items-center mt-1">
                  <span className="text-sm text-gray-500">Denegados:</span>
                  <Badge className="bg-red-100 text-red-800 hover:bg-red-200">
                    {userPermissions.filter(p => !p.granted).length}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Filtrar por Categoría
              </CardTitle>
              <InfoIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Seleccionar categoría" />
                </SelectTrigger>
                <SelectContent>
                  {getPermissionCategories().map(category => (
                    <SelectItem key={category} value={category}>
                      {category === 'all' ? 'Todas las categorías' : category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="all">Todos los Permisos</TabsTrigger>
            <TabsTrigger value="custom">Permisos Personalizados</TabsTrigger>
            <TabsTrigger value="granted">Permisos Concedidos</TabsTrigger>
            <TabsTrigger value="denied">Permisos Denegados</TabsTrigger>
          </TabsList>
          
          <Card>
            <CardHeader>
              <CardTitle>Gestión de Permisos por Usuario</CardTitle>
              <CardDescription>
                Los permisos específicos de usuario tienen prioridad sobre los permisos del rol.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Alert className="mb-4">
                <AlertTriangleIcon className="h-4 w-4 mr-2" />
                <AlertDescription>
                  Al establecer un permiso específico para este usuario, sobrescribirá los permisos que provienen de su rol.
                </AlertDescription>
              </Alert>
              
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Permiso</TableHead>
                    <TableHead>Descripción</TableHead>
                    <TableHead className="text-center">Por Rol</TableHead>
                    <TableHead className="text-center">Específico</TableHead>
                    <TableHead className="text-center">Efectivo</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {getFilteredPermissions()
                    .filter(permission => {
                      // Filtrar por la pestaña seleccionada
                      if (activeTab === 'all') return true;
                      if (activeTab === 'custom') return hasSpecificPermission(permission.name);
                      if (activeTab === 'granted') return effectivePermissions[permission.name] === true;
                      if (activeTab === 'denied') return effectivePermissions[permission.name] === false;
                      return true;
                    })
                    .map(permission => (
                    <TableRow key={permission.id}>
                      <TableCell className="font-medium">{permission.name}</TableCell>
                      <TableCell>{permission.description || '-'}</TableCell>
                      <TableCell className="text-center">
                        {rolePermissions[permission.name] ? (
                          <CheckIcon className="mx-auto h-5 w-5 text-green-500" />
                        ) : (
                          <XIcon className="mx-auto h-5 w-5 text-red-500" />
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {hasSpecificPermission(permission.name) ? (
                          getSpecificPermissionState(permission.name) ? (
                            <Badge className="mx-auto bg-green-100 text-green-800">Concedido</Badge>
                          ) : (
                            <Badge className="mx-auto bg-red-100 text-red-800">Denegado</Badge>
                          )
                        ) : (
                          <Badge className="mx-auto bg-gray-100 text-gray-600">No definido</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {effectivePermissions[permission.name] ? (
                          <CheckIcon className="mx-auto h-5 w-5 text-green-500" />
                        ) : (
                          <XIcon className="mx-auto h-5 w-5 text-red-500" />
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="w-full py-1 px-2 h-8 text-xs bg-green-50 text-green-700 border-green-200 hover:bg-green-100 hover:text-green-800"
                            onClick={() => handlePermissionChange(permission.name, true)}
                            disabled={settingPermission}
                          >
                            Conceder
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="w-full py-1 px-2 h-8 text-xs bg-red-50 text-red-700 border-red-200 hover:bg-red-100 hover:text-red-800"
                            onClick={() => handlePermissionChange(permission.name, false)}
                            disabled={settingPermission}
                          >
                            Denegar
                          </Button>
                          {hasSpecificPermission(permission.name) && (
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="w-full py-1 px-2 h-8 text-xs"
                              onClick={() => handlePermissionChange(permission.name, null)}
                              disabled={settingPermission}
                            >
                              Eliminar
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </Tabs>
      </div>
    </PermissionGuard>
  );
} 