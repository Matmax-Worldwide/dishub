'use client';

import { useState } from 'react';
import { gql, useQuery, useMutation } from '@apollo/client';
import { client } from '@/app/lib/apollo-client';
import { 
  LinkIcon, 
  PlusCircleIcon, 
  TrashIcon, 
  EditIcon, 
  Loader2 
} from 'lucide-react';
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
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

// GraphQL queries y mutations
const GET_EXTERNAL_LINKS = gql`
  query GetExternalLinks {
    externalLinks {
      id
      name
      url
      icon
      description
      isActive
      order
      createdAt
      updatedAt
    }
  }
`;

const CREATE_EXTERNAL_LINK = gql`
  mutation CreateExternalLink($input: CreateExternalLinkInput!) {
    createExternalLink(input: $input) {
      id
      name
      url
    }
  }
`;

const UPDATE_EXTERNAL_LINK = gql`
  mutation UpdateExternalLink($id: ID!, $input: UpdateExternalLinkInput!) {
    updateExternalLink(id: $id, input: $input) {
      id
      name
    }
  }
`;

const DELETE_EXTERNAL_LINK = gql`
  mutation DeleteExternalLink($id: ID!) {
    deleteExternalLink(id: $id)
  }
`;

// Definir el esquema de validación para el formulario
const externalLinkSchema = z.object({
  name: z.string().min(1, 'El nombre es obligatorio'),
  url: z.string().url('Debe ser una URL válida'),
  icon: z.string().min(1, 'El ícono es obligatorio'),
  description: z.string().optional(),
  isActive: z.boolean().default(true),
  order: z.number().int().default(0),
});

type ExternalLinkFormValues = z.infer<typeof externalLinkSchema>;

export default function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState("external-links");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedLink, setSelectedLink] = useState<any>(null);

  // GraphQL Hooks
  const { data, loading, error, refetch } = useQuery(GET_EXTERNAL_LINKS, {
    client,
    fetchPolicy: 'network-only',
  });

  const [createExternalLink, { loading: createLoading }] = useMutation(CREATE_EXTERNAL_LINK, {
    client,
    onCompleted: () => {
      refetch();
      setIsAddDialogOpen(false);
      toast.success("Enlace externo creado exitosamente");
      form.reset({
        name: "",
        url: "",
        icon: "UserIcon",
        description: "",
        isActive: true,
        order: 0,
      });
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const [updateExternalLink, { loading: updateLoading }] = useMutation(UPDATE_EXTERNAL_LINK, {
    client,
    onCompleted: () => {
      refetch();
      setIsEditDialogOpen(false);
      setSelectedLink(null);
      toast.success("Enlace externo actualizado exitosamente");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const [deleteExternalLink] = useMutation(DELETE_EXTERNAL_LINK, {
    client,
    onCompleted: () => {
      refetch();
      toast({
        title: "Éxito",
        description: "Enlace externo eliminado exitosamente",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // React Hook Form
  const form = useForm<ExternalLinkFormValues>({
    resolver: zodResolver(externalLinkSchema),
    defaultValues: {
      name: "",
      url: "",
      icon: "UserIcon",
      description: "",
      isActive: true,
      order: 0,
    },
  });

  const editForm = useForm<ExternalLinkFormValues>({
    resolver: zodResolver(externalLinkSchema),
    defaultValues: {
      name: "",
      url: "",
      icon: "UserIcon",
      description: "",
      isActive: true,
      order: 0,
    },
  });

  // Manejadores de eventos
  const handleAddSubmit = (values: ExternalLinkFormValues) => {
    createExternalLink({
      variables: {
        input: values,
      },
    });
  };

  const handleEditSubmit = (values: ExternalLinkFormValues) => {
    if (!selectedLink) return;
    
    updateExternalLink({
      variables: {
        id: selectedLink.id,
        input: values,
      },
    });
  };

  const handleDeleteLink = (id: string) => {
    if (confirm("¿Estás seguro de que deseas eliminar este enlace? Esta acción no se puede deshacer.")) {
      deleteExternalLink({
        variables: {
          id,
        },
      });
    }
  };

  const handleEditLink = (link: any) => {
    setSelectedLink(link);
    editForm.reset({
      name: link.name,
      url: link.url,
      icon: link.icon,
      description: link.description || "",
      isActive: link.isActive,
      order: link.order,
    });
    setIsEditDialogOpen(true);
  };

  // Lista de íconos disponibles
  const iconOptions = [
    "HomeIcon", 
    "UserIcon", 
    "CalendarIcon", 
    "SettingsIcon", 
    "HelpCircleIcon", 
    "BellIcon", 
    "UsersIcon", 
    "MessageSquareIcon", 
    "ClipboardListIcon", 
    "BarChartIcon", 
    "ShieldIcon", 
    "UserPlusIcon", 
    "LineChartIcon",
    "LinkIcon",
  ];

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold mb-6">Configuración de Administrador</h1>
      
      <Tabs defaultValue="external-links" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="external-links" className="flex items-center gap-2">
            <LinkIcon className="h-4 w-4" />
            <span>Enlaces Externos</span>
          </TabsTrigger>
          {/* Se pueden agregar más pestañas para otras configuraciones administrativas */}
        </TabsList>
        
        <TabsContent value="external-links">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Enlaces Externos</CardTitle>
                  <CardDescription>Gestiona los enlaces externos que se muestran en la barra lateral.</CardDescription>
                </div>
                <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="default" className="flex items-center gap-2">
                      <PlusCircleIcon className="h-4 w-4" />
                      <span>Añadir Enlace</span>
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Añadir Nuevo Enlace Externo</DialogTitle>
                      <DialogDescription>
                        Crea un nuevo enlace externo que aparecerá en la barra lateral.
                      </DialogDescription>
                    </DialogHeader>
                    <Form {...form}>
                      <form onSubmit={form.handleSubmit(handleAddSubmit)} className="space-y-4">
                        <FormField
                          control={form.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Nombre</FormLabel>
                              <FormControl>
                                <Input placeholder="E-Voque Benefits" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="url"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>URL</FormLabel>
                              <FormControl>
                                <Input placeholder="https://example.com" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="icon"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Ícono</FormLabel>
                              <FormControl>
                                <select
                                  className="w-full p-2 border border-gray-300 rounded-md"
                                  {...field}
                                >
                                  {iconOptions.map((icon) => (
                                    <option key={icon} value={icon}>
                                      {icon}
                                    </option>
                                  ))}
                                </select>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="description"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Descripción (Opcional)</FormLabel>
                              <FormControl>
                                <Textarea placeholder="Descripción del enlace" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="isActive"
                          render={({ field }) => (
                            <FormItem className="flex items-center justify-between">
                              <FormLabel>Activo</FormLabel>
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="order"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Orden de visualización</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  placeholder="0" 
                                  {...field} 
                                  onChange={e => field.onChange(parseInt(e.target.value, 10) || 0)}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <DialogFooter>
                          <DialogClose asChild>
                            <Button type="button" variant="outline">
                              Cancelar
                            </Button>
                          </DialogClose>
                          <Button type="submit" disabled={createLoading}>
                            {createLoading ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Creando...
                              </>
                            ) : (
                              "Crear Enlace"
                            )}
                          </Button>
                        </DialogFooter>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center items-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
                </div>
              ) : error ? (
                <div className="text-center py-4 text-red-500">
                  Error al cargar los enlaces externos. Por favor, intenta de nuevo.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Orden</TableHead>
                      <TableHead>Nombre</TableHead>
                      <TableHead>URL</TableHead>
                      <TableHead>Ícono</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data?.externalLinks?.length > 0 ? (
                      data.externalLinks.map((link: any) => (
                        <TableRow key={link.id}>
                          <TableCell>{link.order}</TableCell>
                          <TableCell className="font-medium">{link.name}</TableCell>
                          <TableCell className="max-w-[200px] truncate">
                            <a href={link.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                              {link.url}
                            </a>
                          </TableCell>
                          <TableCell>{link.icon}</TableCell>
                          <TableCell>
                            <span className={`px-2 py-1 rounded-full text-xs ${link.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                              {link.isActive ? 'Activo' : 'Inactivo'}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button 
                                variant="outline" 
                                size="icon" 
                                onClick={() => handleEditLink(link)}
                              >
                                <EditIcon className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="destructive" 
                                size="icon" 
                                onClick={() => handleDeleteLink(link.id)}
                              >
                                <TrashIcon className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-4">
                          No hay enlaces externos configurados. Haz clic en "Añadir Enlace" para crear uno.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Diálogo de edición */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Enlace Externo</DialogTitle>
            <DialogDescription>
              Actualiza los detalles de este enlace externo.
            </DialogDescription>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(handleEditSubmit)} className="space-y-4">
              <FormField
                control={editForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre</FormLabel>
                    <FormControl>
                      <Input placeholder="E-Voque Benefits" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>URL</FormLabel>
                    <FormControl>
                      <Input placeholder="https://example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="icon"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ícono</FormLabel>
                    <FormControl>
                      <select
                        className="w-full p-2 border border-gray-300 rounded-md"
                        {...field}
                      >
                        {iconOptions.map((icon) => (
                          <option key={icon} value={icon}>
                            {icon}
                          </option>
                        ))}
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descripción (Opcional)</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Descripción del enlace" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between">
                    <FormLabel>Activo</FormLabel>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="order"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Orden de visualización</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="0" 
                        {...field} 
                        onChange={e => field.onChange(parseInt(e.target.value, 10) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <DialogClose asChild>
                  <Button type="button" variant="outline">
                    Cancelar
                  </Button>
                </DialogClose>
                <Button type="submit" disabled={updateLoading}>
                  {updateLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Actualizando...
                    </>
                  ) : (
                    "Guardar Cambios"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
} 