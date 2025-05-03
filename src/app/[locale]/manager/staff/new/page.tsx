'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { gql, useMutation, useQuery } from '@apollo/client';
import { client } from '@/app/lib/apollo-client';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { 
  ArrowLeft, 
  UserPlus, 
  Save,
  Building
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';

// Define Role interface
interface Role {
  id: string;
  name: string;
  description?: string;
}

// Definir roles
const GET_ROLES = gql`
  query GetRoles {
    roles {
      id
      name
      description
    }
  }
`;

// Definir mutación para crear un usuario con rol EMPLOYEE
const CREATE_USER = gql`
  mutation CreateUser($email: String!, $password: String!, $firstName: String!, $lastName: String!, $phoneNumber: String, $role: String!) {
    createUser(input: {
      email: $email,
      password: $password,
      firstName: $firstName,
      lastName: $lastName,
      phoneNumber: $phoneNumber,
      role: $role
    }) {
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

// Definir esquema de validación con Zod
const formSchema = z.object({
  firstName: z.string().min(2, {
    message: 'El nombre debe tener al menos 2 caracteres.',
  }),
  lastName: z.string().min(2, {
    message: 'El apellido debe tener al menos 2 caracteres.',
  }),
  email: z.string().email({
    message: 'Ingrese un correo electrónico válido.',
  }),
  password: z.string().min(8, {
    message: 'La contraseña debe tener al menos 8 caracteres.',
  }),
  confirmPassword: z.string(),
  phoneNumber: z.string().optional(),
  role: z.string({
    required_error: 'Por favor seleccione un departamento.',
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Las contraseñas no coinciden.',
  path: ['confirmPassword'],
});

export default function AddEmployeePage() {
  const { locale } = useParams();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Consultar roles
  const { data: rolesData, loading: rolesLoading } = useQuery(GET_ROLES, {
    client,
    fetchPolicy: 'network-only',
  });

  // Filtrar solo roles con name = EMPLOYEE
  const employeeRoles = rolesData?.roles.filter((role: Role) => role.name === 'EMPLOYEE') || [];

  // Configurar react-hook-form con zod
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      confirmPassword: '',
      phoneNumber: '',
      role: '',
    },
  });

  // Mutación para crear empleado
  const [createUser] = useMutation(CREATE_USER, {
    client,
    onCompleted: (data) => {
      toast.success('Empleado creado correctamente');
      // Redireccionar a la página de detalles del empleado creado
      router.push(`/${locale}/manager/staff/${data.createUser.id}`);
    },
    onError: (error) => {
      toast.error(`Error al crear el empleado: ${error.message}`);
      setIsSubmitting(false);
    }
  });

  // Manejar envío del formulario
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);
    try {
      await createUser({
        variables: {
          email: values.email,
          password: values.password,
          firstName: values.firstName,
          lastName: values.lastName,
          phoneNumber: values.phoneNumber || '',
          role: values.role, // ID del rol
        }
      });
    } catch (error) {
      setIsSubmitting(false);
      console.error('Error al crear empleado:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Cabecera */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => router.push(`/${locale}/manager/staff`)}
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Volver
          </Button>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <UserPlus className="h-6 w-6 text-blue-600" />
            Agregar Nuevo Empleado
          </h1>
        </div>
      </div>

      {/* Formulario */}
      <Card>
        <CardHeader>
          <CardTitle>Información del Empleado</CardTitle>
          <CardDescription>
            Ingrese los datos del nuevo empleado. Todos los campos marcados con * son obligatorios.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Información Personal */}
              <div>
                <h3 className="text-lg font-medium">Información Personal</h3>
                <Separator className="my-4" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nombre *</FormLabel>
                        <FormControl>
                          <Input placeholder="Nombre" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Apellido *</FormLabel>
                        <FormControl>
                          <Input placeholder="Apellido" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Información de contacto */}
              <div>
                <h3 className="text-lg font-medium">Información de Contacto</h3>
                <Separator className="my-4" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Correo Electrónico *</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="correo@ejemplo.com" {...field} />
                        </FormControl>
                        <FormDescription>
                          Este correo se usará para el inicio de sesión.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="phoneNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Teléfono</FormLabel>
                        <FormControl>
                          <Input placeholder="+34 612 345 678" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Información de acceso */}
              <div>
                <h3 className="text-lg font-medium">Información de Acceso</h3>
                <Separator className="my-4" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Contraseña *</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="********" {...field} />
                        </FormControl>
                        <FormDescription>
                          Mínimo 8 caracteres.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirmar Contraseña *</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="********" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Información laboral */}
              <div>
                <h3 className="text-lg font-medium">Información Laboral</h3>
                <Separator className="my-4" />
                <div className="grid grid-cols-1 gap-6">
                  <FormField
                    control={form.control}
                    name="role"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Departamento *</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                          disabled={rolesLoading}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccionar departamento" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {employeeRoles.map((role: Role) => (
                              <SelectItem key={role.id} value={role.id}>
                                <div className="flex items-center gap-2">
                                  <Building className="h-4 w-4" />
                                  <span>{role.description || 'Departamento General'}</span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          El empleado estará asignado a este departamento.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Acciones */}
              <div className="flex justify-end gap-4">
                <Button type="button" variant="outline" onClick={() => router.push(`/${locale}/manager/staff`)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  <Save className="h-4 w-4 mr-2" />
                  Guardar Empleado
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
} 