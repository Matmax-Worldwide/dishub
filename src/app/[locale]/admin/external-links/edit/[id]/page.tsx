'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { gql, useMutation, useQuery } from '@apollo/client';
import { client } from '@/app/lib/apollo-client';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Loader2, ArrowLeft, Search, X, ChevronDown, ChevronUp } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Link from 'next/link';
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

// GraphQL queries
const GET_EXTERNAL_LINK = gql`
  query GetExternalLink($id: ID!) {
    externalLink(id: $id) {
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
      createdAt
      updatedAt
    }
  }
`;

const GET_ROLES = gql`
  query GetRoles {
    roles {
      id
      name
      description
    }
  }
`;

const GET_USERS = gql`
  query GetUsers {
    users {
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

const UPDATE_EXTERNAL_LINK = gql`
  mutation UpdateExternalLink($id: ID!, $input: ExternalLinkInput!) {
    updateExternalLink(id: $id, input: $input) {
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

// Form schema
const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  url: z.string().url("Please enter a valid URL"),
  icon: z.string().min(1, "Icon name is required"),
  description: z.string().optional(),
  isActive: z.boolean(),
  order: z.number().int(),
  accessType: z.enum(['PUBLIC', 'ROLES', 'USERS', 'MIXED']),
  accessControl: z.object({
    type: z.enum(['PUBLIC', 'ROLES', 'USERS', 'MIXED']),
    allowedRoles: z.array(z.string()).optional(),
    allowedUsers: z.array(z.string()).optional(),
    deniedUsers: z.array(z.string()).optional()
  }).optional()
});

// Define type based on the schema
type FormValues = z.infer<typeof formSchema>;

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

export default function EditExternalLinkPage() {
  const router = useRouter();
  const params = useParams();
  const linkId = params.id as string;
  const { locale } = params;
  
  const [roles, setRoles] = useState<Array<{id: string, name: string, description?: string}>>([]);
  const [users, setUsers] = useState<Array<{id: string, email: string, firstName?: string, lastName?: string, role?: {id: string, name: string}}>>([]);
  const [searchRole, setSearchRole] = useState('');
  const [searchUser, setSearchUser] = useState('');
  const [searchDeniedUser, setSearchDeniedUser] = useState('');
  const [expandedRoles, setExpandedRoles] = useState<string[]>([]);
  const [filterByRole, setFilterByRole] = useState('');

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
      accessControl: {
        type: "PUBLIC",
        allowedRoles: [],
        allowedUsers: [],
        deniedUsers: []
      }
    },
  });

  // Get external link data
  const { loading: linkLoading } = useQuery(GET_EXTERNAL_LINK, {
    client,
    fetchPolicy: 'network-only',
    variables: { id: linkId },
    onCompleted: (data) => {
      if (data?.externalLink) {
        const link = data.externalLink;
        
        // Update form with retrieved data
        form.reset({
          name: link.name,
          url: link.url,
          icon: link.icon,
          description: link.description || "",
          isActive: link.isActive,
          order: link.order,
          accessType: link.accessType,
          accessControl: {
            type: link.accessType,
            allowedRoles: link.allowedRoles || [],
            allowedUsers: link.allowedUsers || [],
            deniedUsers: link.deniedUsers || []
          }
        });
      } else {
        toast.error("External link not found");
        router.push(`/${locale}/admin/external-links`);
      }
    },
    onError: (error) => {
      console.error('Error loading external link:', error);
      toast.error(`Error loading external link: ${error.message}`);
      router.push(`/${locale}/admin/external-links`);
    }
  });

  // Get roles and users
  const { loading: rolesLoading } = useQuery(GET_ROLES, {
    client,
    fetchPolicy: 'network-only',
    onCompleted: (data) => {
      if (data?.roles) {
        setRoles(data.roles);
      }
    },
    onError: (error) => {
      console.error('Error fetching roles:', error);
      toast.error('Failed to load roles');
    }
  });

  const { loading: usersLoading } = useQuery(GET_USERS, {
    client,
    fetchPolicy: 'network-only',
    onCompleted: (data) => {
      if (data?.users) {
        setUsers(data.users);
      }
    },
    onError: (error) => {
      console.error('Error fetching users:', error);
      toast.error('Failed to load users');
    }
  });

  // GraphQL mutations
  const [updateExternalLink, { loading: updateLoading }] = useMutation(UPDATE_EXTERNAL_LINK, {
    client,
    fetchPolicy: 'no-cache',
    context: {
      headers: {
        authorization: typeof window !== 'undefined' 
          ? `Bearer ${document.cookie.split('; ').find(row => row.startsWith('session-token='))?.split('=')[1]}` 
          : '',
      },
    },
    onCompleted: (data) => {
      if (data?.updateExternalLink) {
        toast.success("External link updated successfully");
        router.push(`/${locale}/admin/external-links`);
      } else {
        console.error("Failed to update external link - received null response");
        toast.error("Server returned null - check server logs");
      }
    },
    onError: (error) => {
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

  // Filter roles based on search
  const filteredRoles = roles.filter(role => 
    role.name.toLowerCase().includes(searchRole.toLowerCase()) ||
    (role.description && role.description.toLowerCase().includes(searchRole.toLowerCase()))
  );

  // Filter users based on search and role filter
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.email.toLowerCase().includes(searchUser.toLowerCase()) ||
      (user.firstName && user.firstName.toLowerCase().includes(searchUser.toLowerCase())) ||
      (user.lastName && user.lastName.toLowerCase().includes(searchUser.toLowerCase()));
    
    if (filterByRole && user.role) {
      return matchesSearch && user.role.id === filterByRole;
    }
    
    return matchesSearch;
  });

  const filteredDeniedUsers = users.filter(user => {
    const matchesSearch = user.email.toLowerCase().includes(searchDeniedUser.toLowerCase()) ||
      (user.firstName && user.firstName.toLowerCase().includes(searchDeniedUser.toLowerCase())) ||
      (user.lastName && user.lastName.toLowerCase().includes(searchDeniedUser.toLowerCase()));
    
    if (filterByRole && user.role) {
      return matchesSearch && user.role.id === filterByRole;
    }
    
    return matchesSearch;
  });

  // Group users by role for easier selection
  const usersByRole = users.reduce((acc, user) => {
    if (user.role) {
      if (!acc[user.role.id]) {
        acc[user.role.id] = {
          role: user.role,
          users: []
        };
      }
      acc[user.role.id].users.push(user);
    } else {
      if (!acc['unassigned']) {
        acc['unassigned'] = {
          role: { id: 'unassigned', name: 'Sin rol asignado' },
          users: []
        };
      }
      acc['unassigned'].users.push(user);
    }
    return acc;
  }, {} as Record<string, { role: { id: string, name: string }, users: typeof users }>);

  // Toggle a role expansion
  const toggleRoleExpansion = (roleId: string) => {
    setExpandedRoles(prev => 
      prev.includes(roleId) 
        ? prev.filter(id => id !== roleId)
        : [...prev, roleId]
    );
  };

  // Handle form submission
  const handleSubmit = (values: FormValues) => {
    // Check if we have a token before submitting
    if (!checkAuthToken()) {
      console.error('No authentication token found when attempting to update external link');
      toast.error('Authentication error: Please log in again');
      return;
    }
    
    // Check user role
    const role = checkUserRole();
    console.log('Current user role:', role);
    
    if (role !== 'ADMIN') {
      console.error(`Authorization error: User role is ${role}, not ADMIN`);
      toast.error('Permission denied: You need ADMIN role to update external links');
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
      accessControl: {
        type: values.accessType,
        allowedRoles: values.accessType === 'PUBLIC' ? [] : (values.accessControl?.allowedRoles || []),
        allowedUsers: values.accessType === 'PUBLIC' ? [] : (values.accessControl?.allowedUsers || []),
        deniedUsers: values.accessType === 'PUBLIC' ? [] : (values.accessControl?.deniedUsers || [])
      }
    };
    
    console.log('Updating external link with input:', JSON.stringify(inputData));
    
    // Call the mutation with correctly formatted values
    updateExternalLink({
      variables: {
        id: linkId,
        input: inputData
      }
    });
  };

  // Determine if data is still loading
  const isLoading = linkLoading || rolesLoading || usersLoading;

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center mb-6">
        <Button
          variant="outline"
          size="sm"
          asChild
          className="mr-4"
        >
          <Link href={`/${locale}/admin/external-links`}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to List
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">Edit External Link</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>External Link Details</CardTitle>
          <CardDescription>
            Update the details of this external link.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
            </div>
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                </div>

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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="isActive"
                    render={({ field }) => (
                      <FormItem className="flex items-center space-x-2">
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <FormLabel>Active</FormLabel>
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
                            onChange={(e) => {
                              field.onChange(e);
                              // Reset access control fields when changing type
                              form.setValue("accessControl", {
                                type: e.target.value as 'PUBLIC' | 'ROLES' | 'USERS' | 'MIXED',
                                allowedRoles: [],
                                allowedUsers: [],
                                deniedUsers: []
                              });
                            }}
                          >
                            <option value="PUBLIC">PUBLIC</option>
                            <option value="ROLES">ROLES</option>
                            <option value="USERS">USERS</option>
                            <option value="MIXED">MIXED</option>
                          </select>
                        </FormControl>
                        <FormDescription>
                          {field.value === "PUBLIC" ? 
                            "Accessible to all users without restrictions" : 
                            "Configure which users/roles can access this link"}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Conditional Access Control Fields */}
                {form.watch("accessType") !== "PUBLIC" && (
                  <div className="space-y-6 p-4 border border-gray-200 rounded-md">
                    <h3 className="text-lg font-medium">Access Control Configuration</h3>
                    
                    {/* Role Selection - Show for ROLES and MIXED */}
                    {(form.watch("accessType") === "ROLES" || form.watch("accessType") === "MIXED") && (
                      <FormField
                        control={form.control}
                        name="accessControl.allowedRoles"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Allowed Roles</FormLabel>
                            <FormControl>
                              <div className="border border-gray-300 rounded-md">
                                <div className="flex items-center px-3 py-2 border-b border-gray-200">
                                  <Search className="w-4 h-4 mr-2 text-gray-500" />
                                  <Input 
                                    placeholder="Search roles..." 
                                    value={searchRole}
                                    onChange={(e) => setSearchRole(e.target.value)}
                                    className="border-0 shadow-none focus-visible:ring-0 h-8"
                                  />
                                  {searchRole && (
                                    <X 
                                      className="w-4 h-4 text-gray-500 cursor-pointer" 
                                      onClick={() => setSearchRole('')}
                                    />
                                  )}
                                </div>
                                <ScrollArea className="h-60 p-2">
                                  {filteredRoles.length > 0 ? (
                                    <div className="space-y-2">
                                      {filteredRoles.map((role) => (
                                        <div key={role.id} className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded">
                                          <Checkbox 
                                            id={`role-${role.id}`}
                                            checked={(field.value || []).includes(role.id)}
                                            onCheckedChange={(checked) => {
                                              const newValue = checked 
                                                ? [...(field.value || []), role.id]
                                                : (field.value || []).filter(id => id !== role.id);
                                              field.onChange(newValue);
                                            }}
                                          />
                                          <label 
                                            htmlFor={`role-${role.id}`}
                                            className="cursor-pointer flex-1 text-sm"
                                          >
                                            <div className="font-medium">{role.name}</div>
                                            {role.description && (
                                              <div className="text-gray-500 text-xs">{role.description}</div>
                                            )}
                                          </label>
                                          <Badge variant="outline" className="ml-auto">
                                            {users.filter(u => u.role?.id === role.id).length} users
                                          </Badge>
                                        </div>
                                      ))}
                                      
                                      <div className="mt-4 pt-2 border-t border-gray-200">
                                        <Button
                                          type="button"
                                          variant="outline"
                                          size="sm"
                                          onClick={() => {
                                            // Select all roles
                                            field.onChange(roles.map(r => r.id));
                                          }}
                                          className="mr-2"
                                        >
                                          Select All
                                        </Button>
                                        <Button
                                          type="button"
                                          variant="outline"
                                          size="sm"
                                          onClick={() => {
                                            // Clear selection
                                            field.onChange([]);
                                          }}
                                        >
                                          Clear All
                                        </Button>
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="p-4 text-center text-gray-500">
                                      No roles match your search
                                    </div>
                                  )}
                                </ScrollArea>
                              </div>
                            </FormControl>
                            <FormDescription>
                              Select the roles that should have access to this link
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                    
                    {/* User Selection - Show for USERS and MIXED */}
                    {(form.watch("accessType") === "USERS" || form.watch("accessType") === "MIXED") && (
                      <>
                        <FormField
                          control={form.control}
                          name="accessControl.allowedUsers"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Allowed Users</FormLabel>
                              <FormControl>
                                <div className="border border-gray-300 rounded-md">
                                  <div className="flex items-center justify-between px-3 py-2 border-b border-gray-200">
                                    <div className="flex items-center flex-1">
                                      <Search className="w-4 h-4 mr-2 text-gray-500" />
                                      <Input 
                                        placeholder="Search users..." 
                                        value={searchUser}
                                        onChange={(e) => setSearchUser(e.target.value)}
                                        className="border-0 shadow-none focus-visible:ring-0 h-8"
                                      />
                                      {searchUser && (
                                        <X 
                                          className="w-4 h-4 text-gray-500 cursor-pointer" 
                                          onClick={() => setSearchUser('')}
                                        />
                                      )}
                                    </div>
                                    <div className="ml-2">
                                <select
                                        className="text-xs p-1 border rounded"
                                        value={filterByRole}
                                        onChange={(e) => setFilterByRole(e.target.value)}
                                      >
                                        <option value="">All Roles</option>
                                        {roles.map(role => (
                                          <option key={role.id} value={role.id}>{role.name}</option>
                                        ))}
                                      </select>
                                    </div>
                                  </div>
                                  
                                  <Tabs defaultValue="list" className="w-full">
                                    <TabsList className="w-full grid grid-cols-2">
                                      <TabsTrigger value="list">List View</TabsTrigger>
                                      <TabsTrigger value="byRole">By Role</TabsTrigger>
                                    </TabsList>
                                    
                                    <TabsContent value="list" className="mt-0">
                                      <ScrollArea className="h-60 p-2">
                                        {filteredUsers.length > 0 ? (
                                          <div className="space-y-2">
                                            {filteredUsers.map((user) => (
                                              <div key={user.id} className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded">
                                                <Checkbox 
                                                  id={`allowed-user-${user.id}`}
                                                  checked={(field.value || []).includes(user.id)}
                                                  onCheckedChange={(checked) => {
                                                    const newValue = checked 
                                                      ? [...(field.value || []), user.id]
                                                      : (field.value || []).filter(id => id !== user.id);
                                                    field.onChange(newValue);
                                                  }}
                                                />
                                                <label 
                                                  htmlFor={`allowed-user-${user.id}`}
                                                  className="cursor-pointer flex-1 text-sm"
                                                >
                                                  <div className="font-medium">{user.email}</div>
                                                  <div className="text-gray-500 text-xs flex items-center justify-between">
                                                    <span>{user.firstName} {user.lastName}</span>
                                                    {user.role && (
                                                      <Badge variant="secondary" className="ml-2 text-xs">
                                                        {user.role.name}
                                                      </Badge>
                                                    )}
                                                  </div>
                                                </label>
                                              </div>
                                            ))}
                                            
                                            <div className="mt-4 pt-2 border-t border-gray-200">
                                              <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={() => {
                                                  // Select all visible users
                                                  const visibleUserIds = filteredUsers.map(u => u.id);
                                                  const currentSelection = field.value || [];
                                                  const newSelection = [
                                                    ...currentSelection.filter(id => !visibleUserIds.includes(id)),
                                                    ...visibleUserIds
                                                  ];
                                                  field.onChange(newSelection);
                                                }}
                                                className="mr-2"
                                              >
                                                Select All Visible
                                              </Button>
                                              <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={() => {
                                                  // Clear selection of visible users
                                                  const visibleUserIds = filteredUsers.map(u => u.id);
                                                  const currentSelection = field.value || [];
                                                  field.onChange(currentSelection.filter(id => !visibleUserIds.includes(id)));
                                                }}
                                              >
                                                Clear Visible
                                              </Button>
                                            </div>
                                          </div>
                                        ) : (
                                          <div className="p-4 text-center text-gray-500">
                                            No users match your search
                                          </div>
                                        )}
                                      </ScrollArea>
                                    </TabsContent>
                                    
                                    <TabsContent value="byRole" className="mt-0">
                                      <ScrollArea className="h-60 p-2">
                                        {Object.values(usersByRole).length > 0 ? (
                                          <div className="space-y-4">
                                            {Object.values(usersByRole).map((roleGroup) => (
                                              <div key={roleGroup.role.id} className="border rounded-md overflow-hidden">
                                                <div 
                                                  className="bg-gray-50 p-2 font-medium cursor-pointer flex items-center justify-between"
                                                  onClick={() => toggleRoleExpansion(roleGroup.role.id)}
                                                >
                                                  <div className="flex items-center">
                                                    <Checkbox 
                                                      id={`role-group-${roleGroup.role.id}`}
                                                      checked={roleGroup.users.every(u => (field.value || []).includes(u.id))}
                                                      onCheckedChange={(checked) => {
                                                        const userIds = roleGroup.users.map(u => u.id);
                                                        const currentSelection = field.value || [];
                                                        
                                                        if (checked) {
                                                          // Add all users from this role that aren't already selected
                                                          const newSelection = [
                                                            ...currentSelection.filter(id => !userIds.includes(id)),
                                                            ...userIds
                                                          ];
                                                          field.onChange(newSelection);
                                                        } else {
                                                          // Remove all users from this role
                                                          field.onChange(currentSelection.filter(id => !userIds.includes(id)));
                                                        }
                                                      }}
                                                      className="mr-2"
                                                      onClick={(e) => e.stopPropagation()}
                                                    />
                                                    <span>{roleGroup.role.name} ({roleGroup.users.length})</span>
                                                  </div>
                                                  {expandedRoles.includes(roleGroup.role.id) ? (
                                                    <ChevronUp className="h-4 w-4" />
                                                  ) : (
                                                    <ChevronDown className="h-4 w-4" />
                                                  )}
                                                </div>
                                                
                                                {expandedRoles.includes(roleGroup.role.id) && (
                                                  <div className="p-2 space-y-1 max-h-40 overflow-y-auto">
                                                    {roleGroup.users.map(user => (
                                                      <div key={user.id} className="flex items-center space-x-2 p-1 hover:bg-gray-50 rounded text-sm">
                                                        <Checkbox 
                                                          id={`role-user-${user.id}`}
                                                          checked={(field.value || []).includes(user.id)}
                                                          onCheckedChange={(checked) => {
                                                            const newValue = checked 
                                                              ? [...(field.value || []), user.id]
                                                              : (field.value || []).filter(id => id !== user.id);
                                                            field.onChange(newValue);
                                                          }}
                                                        />
                                                        <label 
                                                          htmlFor={`role-user-${user.id}`}
                                                          className="cursor-pointer flex-1"
                                                        >
                                      {user.email} {user.firstName && user.lastName ? `(${user.firstName} ${user.lastName})` : ''}
                                                        </label>
                                                      </div>
                                                    ))}
                                                  </div>
                                                )}
                                              </div>
                                  ))}
                                          </div>
                                        ) : (
                                          <div className="p-4 text-center text-gray-500">
                                            No users found
                                          </div>
                                        )}
                                      </ScrollArea>
                                    </TabsContent>
                                  </Tabs>
                                </div>
                              </FormControl>
                              <FormDescription>
                                Select users who should have access to this link
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="accessControl.deniedUsers"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Denied Users (Overrides allowed roles and users)</FormLabel>
                              <FormControl>
                                <div className="border border-gray-300 rounded-md">
                                  <div className="flex items-center justify-between px-3 py-2 border-b border-gray-200">
                                    <div className="flex items-center flex-1">
                                      <Search className="w-4 h-4 mr-2 text-gray-500" />
                                      <Input 
                                        placeholder="Search users to deny..." 
                                        value={searchDeniedUser}
                                        onChange={(e) => setSearchDeniedUser(e.target.value)}
                                        className="border-0 shadow-none focus-visible:ring-0 h-8"
                                      />
                                      {searchDeniedUser && (
                                        <X 
                                          className="w-4 h-4 text-gray-500 cursor-pointer" 
                                          onClick={() => setSearchDeniedUser('')}
                                        />
                                      )}
                                    </div>
                                    <div className="ml-2">
                                <select
                                        className="text-xs p-1 border rounded"
                                        value={filterByRole}
                                        onChange={(e) => setFilterByRole(e.target.value)}
                                      >
                                        <option value="">All Roles</option>
                                        {roles.map(role => (
                                          <option key={role.id} value={role.id}>{role.name}</option>
                                  ))}
                                </select>
                                    </div>
                                  </div>
                                  
                                  <ScrollArea className="h-60 p-2">
                                    {filteredDeniedUsers.length > 0 ? (
                                      <div className="space-y-2">
                                        {filteredDeniedUsers.map((user) => (
                                          <div key={user.id} className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded">
                                            <Checkbox 
                                              id={`denied-user-${user.id}`}
                                              checked={(field.value || []).includes(user.id)}
                                              onCheckedChange={(checked) => {
                                                const newValue = checked 
                                                  ? [...(field.value || []), user.id]
                                                  : (field.value || []).filter(id => id !== user.id);
                                                field.onChange(newValue);
                                              }}
                                            />
                                            <label 
                                              htmlFor={`denied-user-${user.id}`}
                                              className="cursor-pointer flex-1 text-sm"
                                            >
                                              <div className="font-medium">{user.email}</div>
                                              <div className="text-gray-500 text-xs flex items-center justify-between">
                                                <span>{user.firstName} {user.lastName}</span>
                                                {user.role && (
                                                  <Badge variant="secondary" className="ml-2 text-xs">
                                                    {user.role.name}
                                                  </Badge>
                                                )}
                                              </div>
                                            </label>
                                          </div>
                                        ))}
                                        
                                        <div className="mt-4 pt-2 border-t border-gray-200">
                                          <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() => {
                                              // Select all visible users
                                              const visibleUserIds = filteredDeniedUsers.map(u => u.id);
                                              const currentSelection = field.value || [];
                                              const newSelection = [
                                                ...currentSelection.filter(id => !visibleUserIds.includes(id)),
                                                ...visibleUserIds
                                              ];
                                              field.onChange(newSelection);
                                            }}
                                            className="mr-2"
                                          >
                                            Select All Visible
                                          </Button>
                                          <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() => {
                                              // Clear selection of visible users
                                              const visibleUserIds = filteredDeniedUsers.map(u => u.id);
                                              const currentSelection = field.value || [];
                                              field.onChange(currentSelection.filter(id => !visibleUserIds.includes(id)));
                                            }}
                                          >
                                            Clear Visible
                                          </Button>
                                        </div>
                                      </div>
                                    ) : (
                                      <div className="p-4 text-center text-gray-500">
                                        No users match your search
                                      </div>
                                    )}
                                  </ScrollArea>
                                </div>
                              </FormControl>
                              <FormDescription>
                                Select users who should be denied access to this link regardless of roles
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </>
                    )}
                  </div>
                )}

                <CardFooter className="flex justify-between px-0">
                  <Button 
                    variant="outline" 
                    type="button"
                    onClick={() => router.push(`/${locale}/admin/external-links`)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={updateLoading}>
                    {updateLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      "Save Changes"
                    )}
                  </Button>
                </CardFooter>
              </form>
            </Form>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 