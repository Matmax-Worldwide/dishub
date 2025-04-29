"use client";

import { useState, useEffect } from "react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Plus, MoreHorizontal, Eye, Edit, Trash, Check, X, Link } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { toast } from "sonner";

// GraphQL queries and mutations
const ROLES_QUERY = `
  query GetRoles($tenantId: ID!) {
    roles(tenantId: $tenantId) {
      id
      name
      description
      tenantId
      _count {
        users
        permissions
      }
    }
  }
`;

const PERMISSIONS_QUERY = `
  query GetPermissions {
    permissions {
      id
      action
      subject
      description
    }
  }
`;

const ROLE_PERMISSIONS_QUERY = `
  query GetRolePermissions($roleId: ID!) {
    rolePermissions(roleId: $roleId) {
      id
      action
      subject
      description
    }
  }
`;

const CREATE_ROLE_MUTATION = `
  mutation CreateRole($input: RoleCreateInput!) {
    createRole(input: $input) {
      id
      name
      description
    }
  }
`;

const ASSIGN_PERMISSION_MUTATION = `
  mutation AssignPermission($roleId: ID!, $permissionId: ID!) {
    assignPermissionToRole(roleId: $roleId, permissionId: $permissionId) {
      id
      action
      subject
    }
  }
`;

const REMOVE_PERMISSION_MUTATION = `
  mutation RemovePermission($roleId: ID!, $permissionId: ID!) {
    removePermissionFromRole(roleId: $roleId, permissionId: $permissionId)
  }
`;

// Helper function for GraphQL requests
async function fetchGraphQL(query: string, variables = {}) {
  try {
    const response = await fetch('/api/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        variables,
      }),
    });
    
    const result = await response.json();
    
    if (result.errors) {
      throw new Error(result.errors[0].message);
    }
    
    return result.data;
  } catch (error) {
    console.error('GraphQL request failed:', error);
    toast.error(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    throw error;
  }
}

// Form schemas
const roleFormSchema = z.object({
  name: z.string().min(2, {
    message: "Role name must be at least 2 characters.",
  }),
  description: z.string().optional(),
  tenantId: z.string(), // We'll set this in the component
});

// Types for data
interface Role {
  id: string;
  name: string;
  description: string | null;
  _count: {
    users: number;
    permissions: number;
  };
}

interface Permission {
  id: string;
  action: string;
  subject: string;
  description: string | null;
}

export default function RolesPermissionsPage() {
  const [activeTab, setActiveTab] = useState("roles");
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [showAddRoleDialog, setShowAddRoleDialog] = useState(false);
  const [showPermissionsDialog, setShowPermissionsDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [rolePermissions, setRolePermissions] = useState<Permission[]>([]);
  
  const form = useForm<z.infer<typeof roleFormSchema>>({
    resolver: zodResolver(roleFormSchema),
    defaultValues: {
      name: "",
      description: "",
      tenantId: "system", // Default value for system-wide roles
    },
  });

  // Load roles and permissions data
  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        // Load roles
        const rolesData = await fetchGraphQL(ROLES_QUERY, { tenantId: "system" });
        if (rolesData.roles) {
          setRoles(rolesData.roles);
        }
        
        // Load permissions
        const permissionsData = await fetchGraphQL(PERMISSIONS_QUERY);
        if (permissionsData.permissions) {
          setPermissions(permissionsData.permissions);
        }
      } catch (error) {
        console.error('Failed to load roles and permissions:', error);
        toast.error('Failed to load data. Please try again.');
      } finally {
        setIsLoading(false);
      }
    }
    
    loadData();
  }, []);

  // Function to handle form submission
  async function onSubmit(values: z.infer<typeof roleFormSchema>) {
    try {
      const result = await fetchGraphQL(CREATE_ROLE_MUTATION, {
        input: values,
      });
      
      if (result.createRole) {
        toast.success("Role created successfully");
        setShowAddRoleDialog(false);
        form.reset();
        
        // Add new role to the list
        setRoles(prev => [...prev, {
          ...result.createRole,
          _count: {
            users: 0,
            permissions: 0
          }
        }]);
      }
    } catch {
      toast.error("Failed to create role");
    }
  }

  // Function to handle viewing role permissions
  const handleViewPermissions = async (roleId: string) => {
    setSelectedRole(roleId);
    setShowPermissionsDialog(true);
    
    try {
      const result = await fetchGraphQL(ROLE_PERMISSIONS_QUERY, { roleId });
      if (result.rolePermissions) {
        setRolePermissions(result.rolePermissions);
      }
    } catch {
      toast.error("Failed to load role permissions");
    }
  };

  // Check if a permission is assigned to the selected role
  const isPermissionAssigned = (permissionId: string) => {
    return rolePermissions.some(p => p.id === permissionId);
  };

  // Function to handle assigning permission to a role
  const handleAssignPermission = async (permissionId: string) => {
    if (!selectedRole) return;
    
    try {
      await fetchGraphQL(ASSIGN_PERMISSION_MUTATION, {
        roleId: selectedRole,
        permissionId
      });
      
      // Refresh the role permissions
      const result = await fetchGraphQL(ROLE_PERMISSIONS_QUERY, { roleId: selectedRole });
      if (result.rolePermissions) {
        setRolePermissions(result.rolePermissions);
        toast.success("Permission assigned successfully");
      }
    } catch (error) {
      toast.error("Failed to assign permission");
      console.error(error);
    }
  };
  
  // Function to handle removing permission from a role
  const handleRemovePermission = async (permissionId: string) => {
    if (!selectedRole) return;
    
    try {
      await fetchGraphQL(REMOVE_PERMISSION_MUTATION, {
        roleId: selectedRole,
        permissionId
      });
      
      // Refresh the role permissions
      const result = await fetchGraphQL(ROLE_PERMISSIONS_QUERY, { roleId: selectedRole });
      if (result.rolePermissions) {
        setRolePermissions(result.rolePermissions);
        toast.success("Permission removed successfully");
      }
    } catch (error) {
      toast.error("Failed to remove permission");
      console.error(error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Roles and Permissions</h1>
          <p className="text-muted-foreground">
            Manage roles and permissions for your system.
          </p>
        </div>
        <div className="flex justify-between mb-6">          
          {activeTab === "roles" ? (  
            <Dialog open={showAddRoleDialog} onOpenChange={setShowAddRoleDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Role
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Add Role</DialogTitle>
                  <DialogDescription>
                    Create a new role with custom permissions. After creating the role, you can assign specific permissions to control what users with this role can do in the system.
                  </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Name</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g. Content Manager" {...field} />
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
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Describe the purpose of this role"
                              {...field}
                              value={field.value || ""}
                            />
                          </FormControl>
                          <FormDescription>
                            A clear description helps users understand the role&apos;s purpose.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <DialogFooter>
                      <Button type="submit">Create</Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          ) : (
            <Button asChild>
              <Link href="/admin/roles/create-permission">
                <Plus className="mr-2 h-4 w-4" />
                Create Permission
              </Link>
            </Button>
          )}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full md:w-[400px] grid-cols-2">
          <TabsTrigger value="roles">Roles</TabsTrigger>
          <TabsTrigger value="permissions">Permissions</TabsTrigger>
        </TabsList>
        
        {isLoading ? (
          <div className="py-6 text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
            <p className="mt-2 text-sm text-muted-foreground">Loading data...</p>
          </div>
        ) : (
          <>
            <TabsContent value="roles" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>All Roles</CardTitle>
                  <CardDescription>
                    List of all roles in the system.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {roles.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-8 text-center">
                      <p className="mt-2 text-sm text-muted-foreground">
                        No roles found.
                      </p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Description</TableHead>
                          <TableHead>User Count</TableHead>
                          <TableHead>Permissions</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {roles.map((role) => (
                          <TableRow key={role.id}>
                            <TableCell className="font-medium">{role.name}</TableCell>
                            <TableCell>
                              {role.description || (
                                <span className="text-muted-foreground italic">
                                  No description
                                </span>
                              )}
                            </TableCell>
                            <TableCell>{role._count.users}</TableCell>
                            <TableCell>
                              <Badge variant="secondary">
                                {role._count.permissions} permissions
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                    <span className="sr-only">Open menu</span>
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                  <DropdownMenuItem onClick={() => handleViewPermissions(role.id)}>
                                    <Eye className="mr-2 h-4 w-4" />
                                    View Permissions
                                  </DropdownMenuItem>
                                  <DropdownMenuItem>
                                    <Edit className="mr-2 h-4 w-4" />
                                    Edit Role
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem className="text-red-600">
                                    <Trash className="mr-2 h-4 w-4" />
                                    Delete Role
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="permissions" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>System Permissions</CardTitle>
                  <CardDescription>
                    All available permissions in the system that can be assigned to roles.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {permissions.map((permission) => (
                      <div key={permission.id} className="p-4 border rounded-md">
                        <div className="font-medium mb-1">{`${permission.action}:${permission.subject}`}</div>
                        <div className="text-sm text-muted-foreground">
                          {permission.description}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </>
        )}
      </Tabs>
      
      {/* Role Permissions Dialog */}
      <Dialog open={showPermissionsDialog} onOpenChange={setShowPermissionsDialog}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedRole && roles.find(r => r.id === selectedRole)?.name} Permissions
            </DialogTitle>
            <DialogDescription>
              Permissions assigned to this role determine what actions users with this role can perform.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 my-4">
            {permissions.map((permission) => {
              const isAssigned = isPermissionAssigned(permission.id);
                
              return (
                <div key={permission.id} className="flex items-center justify-between p-2 border rounded-md">
                  <div>
                    <div className="font-medium">{`${permission.action}:${permission.subject}`}</div>
                    <div className="text-sm text-muted-foreground">{permission.description}</div>
                  </div>
                  <div>
                    {isAssigned ? (
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex gap-1 items-center text-red-500 border-red-200"
                        onClick={() => handleRemovePermission(permission.id)}
                      >
                        <X className="h-3 w-3" />
                        Remove
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex gap-1 items-center text-green-500 border-green-200"
                        onClick={() => handleAssignPermission(permission.id)}
                      >
                        <Check className="h-3 w-3" />
                        Assign
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPermissionsDialog(false)}>
            Close
            </Button>
            <Button>Edit Permissions</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 