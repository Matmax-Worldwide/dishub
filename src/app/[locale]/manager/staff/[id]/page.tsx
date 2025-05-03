'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { gql, useQuery, useMutation } from '@apollo/client';
import { client } from '@/app/lib/apollo-client';
import { 
  Mail, 
  Phone, 
  Calendar, 
  Shield, 
  CheckCircle, 
  XCircle,
  ArrowLeft,
  Building,
  Edit,
  Briefcase,
  FileText,
  Clock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';

// Query to get a single user
const GET_USER = gql`
  query GetUser($userId: ID!) {
    user(id: $userId) {
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

const UPDATE_USER_STATUS = gql`
  mutation UpdateUser($id: ID!, $isActive: Boolean) {
    updateUser(id: $id, input: { isActive: $isActive }) {
      id
      isActive
    }
  }
`;

export default function StaffDetailsPage() {
  const { id, locale } = useParams();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('information');

  // Get employee data
  const { data, loading, error, refetch } = useQuery(GET_USER, {
    client,
    variables: { userId: id },
    fetchPolicy: 'network-only',
    onCompleted: (data) => {
      console.log("User data received:", data);
      if (!data?.user) {
        console.error("User not found in query response");
      }
    },
    onError: (error) => {
      console.error("GraphQL error in user query:", error.message);
    }
  });

  // Update user status mutation
  const [updateUserStatus, { loading: updatingStatus }] = useMutation(UPDATE_USER_STATUS, {
    client,
    onCompleted: () => {
      toast.success('Estado del empleado actualizado correctamente');
      refetch();
    },
    onError: (error) => {
      toast.error(`Error al actualizar el estado: ${error.message}`);
    }
  });

  const user = data?.user;

  // Add debug log
  useEffect(() => {
    console.log("Query result:", { data, loading, error, userId: id });
  }, [data, loading, error, id]);

  const handleStatusChange = async (newStatus: boolean) => {
    try {
      await updateUserStatus({
        variables: {
          id,
          isActive: newStatus
        }
      });
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-10 w-24" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-48" />
          <Skeleton className="h-48 md:col-span-2" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Error al cargar los datos</h2>
          <p className="text-muted-foreground mb-6">{error.message}</p>
          <Button onClick={() => router.push(`/${locale}/manager/staff`)}>
            Volver a la lista
          </Button>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Empleado no encontrado</h2>
          <p className="text-muted-foreground mb-6">El empleado que buscas no existe o no tienes permisos para verlo.</p>
          <Button onClick={() => router.push(`/${locale}/manager/staff`)}>
            Volver a la lista
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with back button */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => router.push(`/${locale}/manager/staff`)}
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Volver
          </Button>
          <h1 className="text-2xl font-bold">Detalles del Empleado</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="gap-1">
            <Edit className="h-4 w-4" />
            <span>Editar</span>
          </Button>
          {user.isActive ? (
            <Button 
              variant="destructive" 
              className="gap-1" 
              onClick={() => handleStatusChange(false)}
              disabled={updatingStatus}
            >
              <XCircle className="h-4 w-4" />
              <span>Desactivar</span>
            </Button>
          ) : (
            <Button 
              variant="default" 
              className="gap-1" 
              onClick={() => handleStatusChange(true)}
              disabled={updatingStatus}
            >
              <CheckCircle className="h-4 w-4" />
              <span>Activar</span>
            </Button>
          )}
        </div>
      </div>

      {/* Employee information */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Profile card */}
        <Card>
          <CardHeader className="flex flex-row items-center gap-2 pb-2">
            <div className="h-16 w-16 rounded-full bg-gray-100 flex items-center justify-center">
              <span className="text-xl font-medium text-gray-600">
                {user.firstName[0]}{user.lastName[0]}
              </span>
            </div>
            <div>
              <CardTitle>{user.firstName} {user.lastName}</CardTitle>
              <CardDescription>
                <Badge variant={user.isActive ? "default" : "destructive"} className="mt-1">
                  {user.isActive ? 'Activo' : 'Inactivo'}
                </Badge>
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 mt-2">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{user.email}</span>
              </div>
              {user.phoneNumber && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{user.phoneNumber}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Contratado: {new Date(user.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center gap-2">
                <Building className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Departamento: {user.role.description || 'No asignado'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Posición: {user.role.name}</span>
              </div>
              <Separator />
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Rol: {user.role.name}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs with additional information */}
        <Card className="md:col-span-2">

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <CardHeader>
              <TabsList className="grid grid-cols-3">
                <TabsTrigger value="information">Información</TabsTrigger>
                <TabsTrigger value="time">Horarios</TabsTrigger>
                <TabsTrigger value="documents">Documentos</TabsTrigger>
              </TabsList>
          </CardHeader>
          <CardContent>
            <TabsContent value="information" className="space-y-4">
              <div>
                <h3 className="text-lg font-medium mb-2">Información Personal</h3>
                <p className="text-muted-foreground text-sm">
                  Información detallada sobre {user.firstName} {user.lastName}.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Información de Contacto</CardTitle>
                    </CardHeader>
                    <CardContent className="pb-4">
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Email:</span>
                          <span className="text-sm font-medium">{user.email}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Teléfono:</span>
                          <span className="text-sm font-medium">{user.phoneNumber || 'No registrado'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Dirección:</span>
                          <span className="text-sm font-medium">No registrada</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Información Laboral</CardTitle>
                    </CardHeader>
                    <CardContent className="pb-4">
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Cargo:</span>
                          <span className="text-sm font-medium">Empleado</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Departamento:</span>
                          <span className="text-sm font-medium">{user.role.description || 'No asignado'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Fecha de contratación:</span>
                          <span className="text-sm font-medium">{new Date(user.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>
            <TabsContent value="time" className="space-y-4">
              <div>
                <h3 className="text-lg font-medium mb-2">Registro de Horarios</h3>
                <p className="text-muted-foreground text-sm mb-4">
                  Historial de horarios y asistencia del empleado.
                </p>
                <div className="flex items-center justify-center p-8 border border-dashed rounded-lg">
                  <div className="text-center">
                    <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="font-medium text-lg mb-1">No hay registros de horario</h3>
                    <p className="text-muted-foreground text-sm">
                      No se han registrado horarios para este empleado.
                    </p>
                    <Button className="mt-4" variant="outline">
                      Registrar Horario
                    </Button>
                  </div>
                </div>
              </div>
            </TabsContent>
            <TabsContent value="documents" className="space-y-4">
              <div>
                <h3 className="text-lg font-medium mb-2">Documentos</h3>
                <p className="text-muted-foreground text-sm mb-4">
                  Documentos relacionados con el empleado.
                </p>
                <div className="flex items-center justify-center p-8 border border-dashed rounded-lg">
                  <div className="text-center">
                    <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="font-medium text-lg mb-1">No hay documentos</h3>
                    <p className="text-muted-foreground text-sm">
                      No se han subido documentos para este empleado.
                    </p>
                    <Button className="mt-4" variant="outline">
                      Subir Documento
                    </Button>
                  </div>
                </div>
              </div>
            </TabsContent>
          </CardContent>

          </Tabs>
        </Card>
      </div>
    </div>
  );
} 