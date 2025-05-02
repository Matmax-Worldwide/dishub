"use client";

import { useState, useEffect } from 'react';
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
      accessType
      createdAt
      updatedAt
    }
  }
`;

const CREATE_EXTERNAL_LINK = gql`
  mutation CreateExternalLink($input: ExternalLinkInput!) {
    createExternalLink(input: $input) {
      id
      name
      url
      icon
      description
      isActive
      order
      accessType
      createdBy
      createdAt
    }
  }
`;

const UPDATE_EXTERNAL_LINK = gql`
  mutation UpdateExternalLink($id: ID!, $input: ExternalLinkInput!) {
    updateExternalLink(id: $id, input: $input) {
      id
      name
      accessType
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
  accessType: z.enum(['PUBLIC', 'ROLES', 'USERS', 'MIXED']),
});

// Define type based on the schema
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
  accessType?: string;
  createdAt: string;
  updatedAt: string;
}

// Helper function to check the authentication token
function checkAuthToken() {
  if (typeof window !== 'undefined') {
    const cookieValue = document.cookie
      .split('; ')
      .find(row => row.startsWith('session-token='))
      ?.split('=')[1];
      
    const token = cookieValue && cookieValue.trim();
    console.log('Auth token check:', token ? `Found (${token.substring(0, 10)}...)` : 'Not found');
    return token ? true : false;
  }
  return false;
}

// Check auth token and role
function checkUserRole() {
  if (typeof window !== 'undefined') {
    try {
      const cookieValue = document.cookie
        .split('; ')
        .find(row => row.startsWith('session-token='))
        ?.split('=')[1];
      
      if (!cookieValue) return null;
      
      // Decode JWT to check role (this doesn't validate signature, just reads payload)
      const token = cookieValue.trim();
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      
      const payload = JSON.parse(jsonPayload);
      console.log('Token payload:', payload);
      return payload.role;
    } catch (error) {
      console.error('Error decoding token:', error);
      return null;
    }
  }
  return null;
}

export default function ExternalLinksPage() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedLink, setSelectedLink] = useState<ExternalLinkType | null>(null);

  // Check authentication on component mount
  useEffect(() => {
    const hasAuthToken = checkAuthToken();
    console.log('Component mounted, authentication token present:', hasAuthToken);
  }, []);

  // GraphQL hooks
  const { data, loading, refetch } = useQuery(GET_EXTERNAL_LINKS, {
    client,
    fetchPolicy: 'network-only',
  });

  // Refresh data when dialogs close
  useEffect(() => {
    if (!isAddDialogOpen && !isEditDialogOpen && !isDeleteDialogOpen) {
      console.log('Refreshing external links data');
      refetch();
    }
  }, [isAddDialogOpen, isEditDialogOpen, isDeleteDialogOpen, refetch]);

  const [createExternalLink, { loading: createLoading }] = useMutation(CREATE_EXTERNAL_LINK, {
    client,
    fetchPolicy: 'no-cache', // Ensure no caching
    context: {
      headers: {
        // Include token in header for authentication
        authorization: typeof window !== 'undefined' 
          ? `Bearer ${document.cookie.split('; ').find(row => row.startsWith('session-token='))?.split('=')[1]}` 
          : '',
      },
    },
    onCompleted: (data) => {
      console.log('Raw mutation response:', JSON.stringify(data));
      
      if (data?.createExternalLink) {
        console.log('External link created successfully:', data.createExternalLink);
        refetch();
        setIsAddDialogOpen(false);
        toast.success("External link created successfully");
        form.reset(); // Reset the form
      } else {
        // Handle null response by clearly showing it in the UI
        console.error("Failed to create external link - received null response");
        console.error("Check your server logs for authentication or authorization issues");
        console.error("Verify that the context user is being passed correctly to the resolver");
        toast.error("Server returned null - check server logs");
      }
    },
    onError: (error) => {
      // Enhanced error logging
      console.error('GraphQL error creating external link:', error);
      console.error('Network error details:', error.networkError);
      console.error('GraphQL error details:', error.graphQLErrors);
      
      // More helpful error message
      let errorMessage = "Failed to create external link";
      if (error.graphQLErrors?.length > 0) {
        errorMessage = `Error: ${error.graphQLErrors[0].message}`;
        console.error('GraphQL error extensions:', error.graphQLErrors[0].extensions);
      } else if (error.networkError) {
        errorMessage = "Network error: Check your connection and try again";
      }
      
      toast.error(errorMessage);
    },
  });
  
  const [updateExternalLink, { loading: updateLoading }] = useMutation(UPDATE_EXTERNAL_LINK, {
    client,
    fetchPolicy: 'no-cache', // Ensure no caching
    context: {
      headers: {
        // Include token in header for authentication
        authorization: typeof window !== 'undefined' 
          ? `Bearer ${document.cookie.split('; ').find(row => row.startsWith('session-token='))?.split('=')[1]}` 
          : '',
      },
    },
    onCompleted: (data) => {
      console.log('Update response:', JSON.stringify(data));
      
      if (data?.updateExternalLink) {
        console.log('External link updated successfully:', data.updateExternalLink);
        refetch();
        setIsEditDialogOpen(false);
        toast.success("External link updated successfully");
        form.reset(); // Reset the form
      } else {
        console.error("Failed to update external link - received null response");
        toast.error("Server returned null - check server logs");
      }
    },
    onError: (error) => {
      // Enhanced error logging
      console.error('GraphQL error updating external link:', error);
      console.error('Network error details:', error.networkError);
      console.error('GraphQL error details:', error.graphQLErrors);
      
      // More helpful error message
      let errorMessage = "Failed to update external link";
      if (error.graphQLErrors?.length > 0) {
        errorMessage = `Error: ${error.graphQLErrors[0].message}`;
      } else if (error.networkError) {
        errorMessage = "Network error: Check your connection and try again";
      }
      
      toast.error(errorMessage);
    },
  });

  const [deleteExternalLink, { loading: deleteLoading }] = useMutation(DELETE_EXTERNAL_LINK, {
    client,
    fetchPolicy: 'no-cache', // Ensure no caching
    context: {
      headers: {
        // Include token in header for authentication
        authorization: typeof window !== 'undefined' 
          ? `Bearer ${document.cookie.split('; ').find(row => row.startsWith('session-token='))?.split('=')[1]}` 
          : '',
      },
    },
    onCompleted: (data) => {
      console.log('Delete response:', JSON.stringify(data));
      
      if (data?.deleteExternalLink) {
        console.log('External link deleted successfully:', data.deleteExternalLink);
        refetch();
        setIsDeleteDialogOpen(false);
        toast.success("External link deleted successfully");
      } else {
        console.error("Failed to delete external link - received null response");
        toast.error("Server returned null - check server logs");
      }
    },
    onError: (error) => {
      // Enhanced error logging
      console.error('GraphQL error deleting external link:', error);
      console.error('Network error details:', error.networkError);
      console.error('GraphQL error details:', error.graphQLErrors);
      
      // More helpful error message
      let errorMessage = "Failed to delete external link";
      if (error.graphQLErrors?.length > 0) {
        errorMessage = `Error: ${error.graphQLErrors[0].message}`;
      } else if (error.networkError) {
        errorMessage = "Network error: Check your connection and try again";
      }
      
      toast.error(errorMessage);
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
      accessType: "PUBLIC",
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
      accessType: "PUBLIC",
    },
  });

  // Handlers
  const handleAddSubmit = (values: FormValues) => {
    // Check if we have a token before submitting
    if (!checkAuthToken()) {
      console.error('No authentication token found when attempting to create external link');
      toast.error('Authentication error: Please log in again');
      return;
    }
    
    // Check user role
    const role = checkUserRole();
    console.log('Current user role:', role);
    
    if (role !== 'ADMIN') {
      console.error(`Authorization error: User role is ${role}, not ADMIN`);
      toast.error('Permission denied: You need ADMIN role to create external links');
      return;
    }
    
    // Prepare the input object exactly as GraphQL expects
    const inputData = {
      name: values.name,
      url: values.url,
      icon: values.icon,
      description: values.description || "",
      isActive: values.isActive,
      order: values.order,
      accessType: values.accessType,
    };
    
    console.log('Submitting external link with exact input:', JSON.stringify(inputData));
    
    // Call the mutation with correctly formatted values
    createExternalLink({
      variables: {
        input: inputData
      }
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

  const handleDelete = (link: ExternalLinkType) => {
    setSelectedLink(link);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (!selectedLink) return;
    
    deleteExternalLink({
      variables: {
        id: selectedLink.id
      }
    });
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
      accessType: (link.accessType as 'PUBLIC' | 'ROLES' | 'USERS' | 'MIXED') || 'PUBLIC',
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
        <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
          setIsAddDialogOpen(open);
          if (!open) {
            // Reset the form when dialog is closed
            form.reset();
          }
        }}>
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
                <FormField
                  control={form.control}
                  name="accessType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Access Type</FormLabel>
                      <FormControl>
                        <select
                          className="w-full p-2 border border-gray-300 rounded-md"
                          {...field}
                        >
                          {['PUBLIC', 'ROLES', 'USERS', 'MIXED'].map((type) => (
                            <option key={type} value={type}>
                              {type}
                            </option>
                          ))}
                        </select>
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
                            onClick={() => handleDelete(link)}
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
      <Dialog open={isEditDialogOpen} onOpenChange={(open) => {
        setIsEditDialogOpen(open);
        if (!open) {
          // Reset the form when dialog is closed
          editForm.reset();
        }
      }}>
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
              <FormField
                control={editForm.control}
                name="accessType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Access Type</FormLabel>
                    <FormControl>
                      <select
                        className="w-full p-2 border border-gray-300 rounded-md"
                        {...field}
                      >
                        {['PUBLIC', 'ROLES', 'USERS', 'MIXED'].map((type) => (
                          <option key={type} value={type}>
                            {type}
                          </option>
                        ))}
                      </select>
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

      {/* Add Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &ldquo;{selectedLink?.name}&rdquo;? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={confirmDelete} disabled={deleteLoading}>
              {deleteLoading ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 