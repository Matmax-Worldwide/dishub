"use client";

import { useState } from 'react';
import { gql, useQuery, useMutation } from '@apollo/client';
import { client } from '@/app/lib/apollo-client';
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
import { toast } from "sonner";
import { Loader2, Plus, Trash2, Edit } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

// GraphQL queries
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

// Form schema
const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  url: z.string().url("Please enter a valid URL"),
  icon: z.string().min(1, "Icon name is required"),
  description: z.string().optional(),
  isActive: z.boolean(),
  order: z.number().int(),
});

type FormValues = z.infer<typeof formSchema>;

// Define interface for external link
interface ExternalLinkType {
  id: string;
  name: string;
  url: string;
  icon: string;
  description?: string;
  isActive: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export default function ExternalLinksPage() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedLink, setSelectedLink] = useState<ExternalLinkType | null>(null);

  // GraphQL hooks
  const { data, loading, refetch } = useQuery(GET_EXTERNAL_LINKS, {
    client,
    fetchPolicy: 'network-only',
  });

  const [createExternalLink, { loading: createLoading }] = useMutation(CREATE_EXTERNAL_LINK, {
    client,
    onCompleted: (data) => {
      if (data?.createExternalLink) {
        refetch();
        setIsAddDialogOpen(false);
        toast.success("External link created successfully");
      } else {
        // Handle null response
        console.error("Failed to create external link - received null");
        toast.error("Failed to create external link");
      }
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const [updateExternalLink, { loading: updateLoading }] = useMutation(UPDATE_EXTERNAL_LINK, {
    client,
    onCompleted: (data) => {
      if (data?.updateExternalLink) {
        refetch();
        setIsEditDialogOpen(false);
        setSelectedLink(null);
        toast.success("External link updated successfully");
      } else {
        // Handle null response
        console.error("Failed to update external link - received null");
        toast.error("Failed to update external link");
      }
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const [deleteExternalLink, { loading: deleteLoading }] = useMutation(DELETE_EXTERNAL_LINK, {
    client,
    onCompleted: () => {
      refetch();
      toast.success("External link deleted successfully");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  // Form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      url: "",
      icon: "UserIcon",
      description: "",
      isActive: true,
      order: 0,
    },
  });

  const editForm = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      url: "",
      icon: "UserIcon",
      description: "",
      isActive: true,
      order: 0,
    },
  });

  // Handlers
  const handleAddSubmit = (values: FormValues) => {
    createExternalLink({
      variables: {
        input: values,
      },
    });
  };

  const handleEditSubmit = (values: FormValues) => {
    if (!selectedLink) return;
    
    updateExternalLink({
      variables: {
        id: selectedLink.id,
        input: values,
      },
    });
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this external link?")) {
      deleteExternalLink({
        variables: {
          id,
        },
      });
    }
  };

  const handleEdit = (link: ExternalLinkType) => {
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

  // Available icon options
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
    "LineChartIcon"
  ];

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">External Links Management</h1>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add External Link
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New External Link</DialogTitle>
              <DialogDescription>
                Create a new external link that will appear in the sidebar.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleAddSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
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
                      <FormLabel>Icon</FormLabel>
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
                      <FormLabel>Description (Optional)</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Description of the link" {...field} />
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
                      <FormLabel>Active</FormLabel>
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
                      <FormLabel>Display Order</FormLabel>
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
                      Cancel
                    </Button>
                  </DialogClose>
                  <Button type="submit" disabled={createLoading}>
                    {createLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      "Create Link"
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>External Links</CardTitle>
          <CardDescription>
            Manage links displayed in the dashboard sidebar.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>URL</TableHead>
                  <TableHead>Icon</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.externalLinks?.length > 0 ? (
                  data.externalLinks.map((link: ExternalLinkType) => (
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
                          {link.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button 
                            variant="outline" 
                            size="icon" 
                            onClick={() => handleEdit(link)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="destructive" 
                            size="icon" 
                            onClick={() => handleDelete(link.id)}
                            disabled={deleteLoading}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-4">
                      No external links found. Create one to get started.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      
      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit External Link</DialogTitle>
            <DialogDescription>
              Update the details of this external link.
            </DialogDescription>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(handleEditSubmit)} className="space-y-4">
              <FormField
                control={editForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
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
                    <FormLabel>Icon</FormLabel>
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
                    <FormLabel>Description (Optional)</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Description of the link" {...field} />
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
                    <FormLabel>Active</FormLabel>
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
                    <FormLabel>Display Order</FormLabel>
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
                    Cancel
                  </Button>
                </DialogClose>
                <Button type="submit" disabled={updateLoading}>
                  {updateLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    "Update Link"
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