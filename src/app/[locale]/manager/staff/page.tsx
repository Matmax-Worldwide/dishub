'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { gql, useQuery } from '@apollo/client';
import { client } from '@/app/lib/apollo-client';
import { 
  UserCogIcon, 
  SearchIcon, 
  FilterIcon,
  UserPlusIcon,
  BuildingIcon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

// Definición de consulta GraphQL para obtener usuarios con rol EMPLOYEE
const GET_USERS_WITH_EMPLOYEE_ROLE = gql`
  query GetUsersWithEmployeeRole {
    users {
      id
      firstName
      lastName
      email
      phoneNumber
      isActive
      createdAt
      role {
        id
        name
        description
      }
    }
  }
`;

// Tipos para la interfaz
type User = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  isActive: boolean;
  createdAt: string;
  role: {
    id: string;
    name: string;
    description: string;
  };
};

export default function StaffManagement() {
  const { locale } = useParams();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Consulta GraphQL para obtener usuarios
  const { data, loading: usersLoading } = useQuery(GET_USERS_WITH_EMPLOYEE_ROLE, {
    client,
    fetchPolicy: 'cache-and-network',
    context: {
      headers: {
        credentials: 'include'
      }
    }
  });

  // Usar datos reales si están disponibles, sino usar datos de ejemplo
  const users: User[] = data?.users || [];


  // Filtrar empleados
  const filteredUsers = users.filter(user => {
    // Solo incluir usuarios con rol EMPLOYEE
    if (user.role.name !== 'EMPLOYEE') return false;
    
    // Aplicar filtro de búsqueda
    if (searchQuery && !`${user.firstName} ${user.lastName} ${user.email} ${user.phoneNumber || ''}`.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }

    
    // Aplicar filtro de estado
    if (statusFilter === 'active' && !user.isActive) return false;
    if (statusFilter === 'inactive' && user.isActive) return false;
    
    return true;
  });

  const getStatusBadgeColor = (isActive: boolean) => {
    return isActive 
      ? 'bg-green-100 text-green-800' 
      : 'bg-red-100 text-red-800';
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <UserCogIcon className="h-8 w-8 text-blue-600" />
            Gestión de Personal
          </h1>
          <p className="text-muted-foreground mt-1">
            Administración de empleados y cargos
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            className="gap-1"
            onClick={() => router.push(`/${locale}/manager/staff/new`)}
          >
            <UserPlusIcon className="h-4 w-4" />
            <span>Nuevo Empleado</span>
          </Button>
          <Button variant="outline" className="gap-1">
            <BuildingIcon className="h-4 w-4" />
            <span>Departamentos</span>
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <FilterIcon className="h-4 w-4" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="flex items-center gap-2">
              <SearchIcon className="text-gray-400 h-4 w-4 absolute ml-3 pointer-events-none" />
              <Input
                placeholder="Buscar por nombre, email, teléfono..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onClick={(e) => e.stopPropagation()}
              />
            </div>
            <div onClick={(e) => e.stopPropagation()}>
              <Select 
                value={departmentFilter} 
                onValueChange={setDepartmentFilter}
              >
                {/* Content here */}
              </Select>
            </div>
            <div onClick={(e) => e.stopPropagation()}>
              <Select 
                value={statusFilter} 
                onValueChange={setStatusFilter}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Filtrar por estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  <SelectItem value="active">Activo</SelectItem>
                  <SelectItem value="inactive">Inactivo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabla de Empleados */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            Empleados ({filteredUsers.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {usersLoading ? (
            // Esqueleto de carga
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center space-x-4">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-[250px]" />
                    <Skeleton className="h-4 w-[200px]" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Empleado</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Fecha contratación</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        No se encontraron empleados con estos criterios
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
                              <span className="text-gray-600 font-medium">
                                {user.firstName[0]}{user.lastName[0]}
                              </span>
                            </div>
                            <div>
                              <div className="font-medium">{user.firstName} {user.lastName}</div>
                              <div className="text-sm text-muted-foreground">{user.email}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusBadgeColor(user.isActive)}>
                            {user.isActive ? 'Activo' : 'Inactivo'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(user.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            asChild
                          >
                            <Link href={`/${locale}/manager/staff/${user.id}`}>
                              Ver Detalles
                            </Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 