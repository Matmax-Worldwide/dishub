'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { gql, useQuery, useMutation } from '@apollo/client';
import { client } from '@/app/lib/apollo-client';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import PermissionGuard from '@/components/PermissionGuard';
import { ShieldIcon, LinkIcon, UsersIcon, Check, X, Lock, Globe, Edit } from 'lucide-react';

// Consultas GraphQL
const GET_ALL_EXTERNAL_LINKS = gql`
  query GetExternalLinks {
    externalLinks {
      id
      name
      url
      icon
      description
      isActive
      order
      accessType
      allowedRoles
      allowedUsers
      deniedUsers
    }
  }
`;

const GET_ALL_USERS = gql`
  query GetAllUsers {
    users {
      id
      email
      firstName
      lastName
      role {
        id
        name
      }
    }
  }
`;

const UPDATE_LINK_ACCESS = gql`
  mutation UpdateLinkAccess($id: ID!, $accessControl: AccessControlInput!) {
    updateLinkAccess(id: $id, accessControl: $accessControl) {
      id
      name
      accessType
      allowedRoles
      allowedUsers
      deniedUsers
    }
  }
`;

// Tipos
interface ExternalLink {
  id: string;
  name: string;
  url: string;
  icon: string;
  description?: string;
  isActive: boolean;
  order: number;
  accessType: 'PUBLIC' | 'ROLES' | 'USERS' | 'MIXED';
  allowedRoles: string[];
  allowedUsers: string[];
  deniedUsers: string[];
}

interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role?: {
    id: string;
    name: string;
  };
}

interface AccessControl {
  type: 'PUBLIC' | 'ROLES' | 'USERS' | 'MIXED';
  allowedRoles: string[];
  allowedUsers: string[];
  deniedUsers: string[];
}

export default function ExternalLinksAccessPage() {
  const { locale } = useParams();
  const router = useRouter();
  const [links, setLinks] = useState<ExternalLink[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedLink, setSelectedLink] = useState<ExternalLink | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [accessControl, setAccessControl] = useState<AccessControl>({
    type: 'PUBLIC',
    allowedRoles: [],
    allowedUsers: [],
    deniedUsers: []
  });
  const [showPreview, setShowPreview] = useState(false);
  const [userAccessStatuses, setUserAccessStatuses] = useState<Record<string, boolean>>({});

  // Roles disponibles en la aplicación
  const availableRoles = ['ADMIN', 'MANAGER', 'EMPLOYEE', 'USER'];

  // Consultar datos
  const { loading: linksLoading, error: linksError, refetch: refetchLinks } = useQuery(GET_ALL_EXTERNAL_LINKS, {
    client,
    onCompleted: (data) => {
      if (data?.externalLinks) {
        setLinks(data.externalLinks);
      }
    },
    fetchPolicy: 'network-only',
  });

  const { loading: usersLoading, error: usersError } = useQuery(GET_ALL_USERS, {
    client,
    onCompleted: (data) => {
      if (data?.users) {
        setUsers(data.users);
      }
    },
    fetchPolicy: 'network-only'
  });

  // Mutación para actualizar el acceso
  const [updateLinkAccess, { loading: updating }] = useMutation(UPDATE_LINK_ACCESS, {
    client,
    onCompleted: () => {
      toast.success('Acceso actualizado correctamente');
      setEditDialogOpen(false);
      refetchLinks();
    },
    onError: (error) => {
      toast.error(`Error al actualizar el acceso: ${error.message}`);
    }
  });

  // Preparar diálogo de edición
  const openEditDialog = (link: ExternalLink) => {
    setSelectedLink(link);
    setAccessControl({
      type: link.accessType,
      allowedRoles: link.allowedRoles || [],
      allowedUsers: link.allowedUsers || [],
      deniedUsers: link.deniedUsers || []
    });
    setEditDialogOpen(true);
  };

  // Manejar cambios en el control de acceso
  const handleAccessTypeChange = (type: 'PUBLIC' | 'ROLES' | 'USERS' | 'MIXED') => {
    setAccessControl(prev => ({
      ...prev,
      type
    }));
  };

  const handleRoleToggle = (role: string) => {
    setAccessControl(prev => {
      const isSelected = prev.allowedRoles.includes(role);
      return {
        ...prev,
        allowedRoles: isSelected
          ? prev.allowedRoles.filter(r => r !== role)
          : [...prev.allowedRoles, role]
      };
    });
  };

  const handleUserToggle = (userId: string, list: 'allowedUsers' | 'deniedUsers') => {
    setAccessControl(prev => {
      const currentList = prev[list];
      const isSelected = currentList.includes(userId);
      
      // Si está añadiendo a la lista de permitidos, asegurarse de quitar de la lista de denegados
      if (list === 'allowedUsers' && !isSelected) {
        return {
          ...prev,
          allowedUsers: [...prev.allowedUsers, userId],
          deniedUsers: prev.deniedUsers.filter(id => id !== userId)
        };
      }
      
      // Si está añadiendo a la lista de denegados, asegurarse de quitar de la lista de permitidos
      if (list === 'deniedUsers' && !isSelected) {
        return {
          ...prev,
          deniedUsers: [...prev.deniedUsers, userId],
          allowedUsers: prev.allowedUsers.filter(id => id !== userId)
        };
      }
      
      // Si está quitando de cualquier lista
      return {
        ...prev,
        [list]: isSelected ? currentList.filter(id => id !== userId) : [...currentList, userId]
      };
    });
  };

  // Guardar cambios
  const handleSaveChanges = () => {
    if (!selectedLink) return;
    
    updateLinkAccess({
      variables: {
        id: selectedLink.id,
        accessControl: {
          type: accessControl.type,
          allowedRoles: accessControl.type === 'PUBLIC' ? [] : accessControl.allowedRoles,
          allowedUsers: accessControl.type === 'PUBLIC' || accessControl.type === 'ROLES' 
            ? [] 
            : accessControl.allowedUsers,
          deniedUsers: accessControl.type === 'PUBLIC' ? [] : accessControl.deniedUsers
        }
      }
    });
  };
   
  // Obtener acceso de previsualización
  const simulateUserAccess = () => {
    const accessStatuses: Record<string, boolean> = {};
    
    // Para cada enlace, simular si cada usuario tendría acceso
    links.forEach(link => {
      users.forEach(user => {
        const userId = user.id;
        const userRole = user.role?.name || 'USER';
        
        let hasAccess = true;
        
        // Aplicar reglas de acceso según el tipo
        if (link.accessType !== 'PUBLIC') {
          hasAccess = false;
          
          // Verificar si está en la lista de denegados
          if (link.deniedUsers.includes(userId)) {
            hasAccess = false;
          } 
          // Verificar acceso por rol
          else if ((link.accessType === 'ROLES' || link.accessType === 'MIXED') && link.allowedRoles.includes(userRole)) {
            hasAccess = true;
          } 
          // Verificar acceso por usuario específico
          else if ((link.accessType === 'USERS' || link.accessType === 'MIXED') && link.allowedUsers.includes(userId)) {
            hasAccess = true;
          }
        }
        
        const key = `${link.id}-${userId}`;
        accessStatuses[key] = hasAccess;
      });
    });
    
    setUserAccessStatuses(accessStatuses);
    setShowPreview(true);
  };

  if (linksLoading || usersLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (linksError || usersError) {
    return (
      <div className="text-red-500 p-4">
        Error al cargar los datos: {linksError?.message || usersError?.message}
      </div>
    );
  }

  return (
    <PermissionGuard permission="admin:view">
      <div className="container mx-auto py-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">Control de Acceso a Enlaces Externos</h1>
            <p className="text-gray-500">Administre quién puede ver cada enlace externo</p>
          </div>
          
          <div className="flex gap-2">
            <Button onClick={simulateUserAccess} variant="outline">
              <UsersIcon className="w-4 h-4 mr-2" />
              Previsualizar Acceso
            </Button>
            <Button onClick={() => router.push(`/${locale}/admin/external-links`)}>
              <LinkIcon className="w-4 h-4 mr-2" />
              Gestionar Enlaces
            </Button>
          </div>
        </div>

        {/* Tabla de enlaces y su configuración de acceso */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Enlaces Externos</CardTitle>
            <CardDescription>
              Configure quién puede ver cada enlace externo en el sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Tipo de Acceso</TableHead>
                  <TableHead>Roles Permitidos</TableHead>
                  <TableHead>Usuarios Permitidos</TableHead>
                  <TableHead>Usuarios Denegados</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {links.map((link) => (
                  <TableRow key={link.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center">
                        {link.isActive ? (
                          <Badge variant="outline" className="mr-2 bg-green-50">Activo</Badge>
                        ) : (
                          <Badge variant="outline" className="mr-2 bg-gray-50">Inactivo</Badge>
                        )}
                        {link.name}
                      </div>
                    </TableCell>
                    <TableCell>
                      {link.accessType === 'PUBLIC' && (
                        <Badge className="bg-green-100 text-green-800 hover:bg-green-200">
                          <Globe className="w-3 h-3 mr-1" />
                          Público
                        </Badge>
                      )}
                      {link.accessType === 'ROLES' && (
                        <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200">
                          <ShieldIcon className="w-3 h-3 mr-1" />
                          Roles
                        </Badge>
                      )}
                      {link.accessType === 'USERS' && (
                        <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-200">
                          <UsersIcon className="w-3 h-3 mr-1" />
                          Usuarios
                        </Badge>
                      )}
                      {link.accessType === 'MIXED' && (
                        <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-200">
                          <Lock className="w-3 h-3 mr-1" />
                          Mixto
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {link.allowedRoles && link.allowedRoles.length > 0 ? (
                          link.allowedRoles.map(role => (
                            <Badge key={role} variant="outline">
                              {role}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-gray-400 text-sm">-</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {link.allowedUsers && link.allowedUsers.length > 0 ? (
                          <Badge variant="outline" className="bg-blue-50">
                            {link.allowedUsers.length} {link.allowedUsers.length === 1 ? 'usuario' : 'usuarios'}
                          </Badge>
                        ) : (
                          <span className="text-gray-400 text-sm">-</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {link.deniedUsers && link.deniedUsers.length > 0 ? (
                          <Badge variant="outline" className="bg-red-50">
                            {link.deniedUsers.length} {link.deniedUsers.length === 1 ? 'usuario' : 'usuarios'}
                          </Badge>
                        ) : (
                          <span className="text-gray-400 text-sm">-</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm" onClick={() => openEditDialog(link)}>
                        <Edit className="h-4 w-4 mr-1" />
                        Configurar Acceso
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Vista previa de acceso */}
        {showPreview && (
          <Card>
            <CardHeader>
              <CardTitle>Vista Previa de Acceso</CardTitle>
              <CardDescription>
                Esta tabla muestra qué usuarios tienen acceso a qué enlaces con la configuración actual
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Usuario</TableHead>
                    <TableHead>Rol</TableHead>
                    {links.map(link => (
                      <TableHead key={link.id} className="text-center">
                        {link.name}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map(user => (
                    <TableRow key={user.id}>
                      <TableCell>
                        {user.firstName && user.lastName 
                          ? `${user.firstName} ${user.lastName}` 
                          : user.email}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {user.role?.name || 'USER'}
                        </Badge>
                      </TableCell>
                      {links.map(link => {
                        const key = `${link.id}-${user.id}`;
                        const hasAccess = userAccessStatuses[key];
                        
                        return (
                          <TableCell key={`access-${key}`} className="text-center">
                            {hasAccess ? (
                              <div className="mx-auto flex h-6 w-6 items-center justify-center rounded-full bg-green-100">
                                <Check className="h-4 w-4 text-green-600" />
                              </div>
                            ) : (
                              <div className="mx-auto flex h-6 w-6 items-center justify-center rounded-full bg-red-100">
                                <X className="h-4 w-4 text-red-600" />
                              </div>
                            )}
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* Diálogo de edición */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Configurar Acceso para {selectedLink?.name}</DialogTitle>
              <DialogDescription>
                Determine quién puede ver este enlace en la barra lateral
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-6 py-4">
              <div>
                <Label htmlFor="accessType">Tipo de Acceso</Label>
                <Select
                  value={accessControl.type}
                  onValueChange={(value) => handleAccessTypeChange(value as 'PUBLIC' | 'ROLES' | 'USERS' | 'MIXED')}
                >
                  <SelectTrigger id="accessType">
                    <SelectValue placeholder="Seleccione tipo de acceso" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PUBLIC">
                      <div className="flex items-center">
                        <Globe className="w-4 h-4 mr-2" />
                        <span>Público (Todos pueden ver)</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="ROLES">
                      <div className="flex items-center">
                        <ShieldIcon className="w-4 h-4 mr-2" />
                        <span>Basado en Roles</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="USERS">
                      <div className="flex items-center">
                        <UsersIcon className="w-4 h-4 mr-2" />
                        <span>Usuarios Específicos</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="MIXED">
                      <div className="flex items-center">
                        <Lock className="w-4 h-4 mr-2" />
                        <span>Mixto (Roles y Usuarios)</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {accessControl.type !== 'PUBLIC' && (
                <>
                  {/* Roles permitidos */}
                  {(accessControl.type === 'ROLES' || accessControl.type === 'MIXED') && (
                    <div>
                      <Label className="text-base">Roles con acceso</Label>
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        {availableRoles.map(role => (
                          <div key={role} className="flex items-center space-x-2">
                            <Checkbox
                              id={`role-${role}`}
                              checked={accessControl.allowedRoles.includes(role)}
                              onCheckedChange={() => handleRoleToggle(role)}
                            />
                            <Label htmlFor={`role-${role}`} className="text-sm font-normal">
                              {role}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Usuarios permitidos/denegados */}
                  {(accessControl.type === 'USERS' || accessControl.type === 'MIXED') && (
                    <div>
                      <Label className="text-base">Gestión de usuarios</Label>
                      <div className="mt-2 border rounded-md">
                        <div className="p-2 bg-gray-50 border-b">
                          <Input
                            placeholder="Buscar usuarios..."
                            className="max-w-sm"
                          />
                        </div>
                        <div className="max-h-60 overflow-y-auto">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Usuario</TableHead>
                                <TableHead>Rol</TableHead>
                                <TableHead>Acceso</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {users.map(user => (
                                <TableRow key={user.id}>
                                  <TableCell>
                                    {user.firstName && user.lastName 
                                      ? `${user.firstName} ${user.lastName}` 
                                      : user.email}
                                  </TableCell>
                                  <TableCell>
                                    <Badge variant="outline">
                                      {user.role?.name || 'USER'}
                                    </Badge>
                                  </TableCell>
                                  <TableCell>
                                    <div className="flex justify-end gap-2">
                                      <Button
                                        size="sm"
                                        variant={accessControl.allowedUsers.includes(user.id) ? "default" : "outline"}
                                        className={accessControl.allowedUsers.includes(user.id) ? "bg-green-600" : ""}
                                        onClick={() => handleUserToggle(user.id, 'allowedUsers')}
                                      >
                                        <Check className="h-4 w-4 mr-1" />
                                        Permitir
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant={accessControl.deniedUsers.includes(user.id) ? "default" : "outline"}
                                        className={accessControl.deniedUsers.includes(user.id) ? "bg-red-600" : ""}
                                        onClick={() => handleUserToggle(user.id, 'deniedUsers')}
                                      >
                                        <X className="h-4 w-4 mr-1" />
                                        Denegar
                                      </Button>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditDialogOpen(false)}>Cancelar</Button>
              <Button onClick={handleSaveChanges} disabled={updating}>
                {updating ? 'Guardando...' : 'Guardar Cambios'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </PermissionGuard>
  );
}