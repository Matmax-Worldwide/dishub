'use client';

import { useState } from 'react';
import { gql, useQuery, useMutation } from '@apollo/client';
import { client } from '@/app/lib/apollo-client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { 
  SearchIcon, 
  UserPlusIcon, 
  FilterIcon, 
  Edit2Icon, 
  Trash2Icon,
  ShieldIcon
} from 'lucide-react';
import { toast } from 'sonner';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useRouter, useParams } from 'next/navigation';

// User interface
interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  role: {
    id: string;
    name: string;
    description?: string;
  };
  createdAt: string;
}

// GraphQL queries
const GET_USERS = gql`
  query GetUsers {
    users {
      id
      email
      firstName
      lastName
      phoneNumber
      role {
        id
        name
        description
      }
      createdAt
    }
  }
`;

// GraphQL mutations
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
      phoneNumber
      role {
        id
        name
        description
      }
      createdAt
    }
  }
`;

const UPDATE_USER = gql`
  mutation UpdateUser($id: ID!, $firstName: String, $lastName: String, $email: String, $phoneNumber: String, $role: String) {
    updateUser(id: $id, input: {
      firstName: $firstName,
      lastName: $lastName,
      email: $email,
      phoneNumber: $phoneNumber,
      role: $role
    }) {
      id
      email
      firstName
      lastName
      phoneNumber
      role {
        id
        name
        description
      }
      createdAt
    }
  }
`;

const DELETE_USER = gql`
  mutation DeleteUser($id: ID!) {
    deleteUser(id: $id)
  }
`;

export default function UserManagementPage() {
  const router = useRouter();
  const params = useParams();
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [isEditUserOpen, setIsEditUserOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [roles, setRoles] = useState<string[]>([]);
  
  // Form state
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    password: '',
    role: 'USER'
  });
  
  // Get users
  const { error, refetch } = useQuery(GET_USERS, {
    client,
    fetchPolicy: 'network-only',
    onCompleted: (data: { users: User[] }) => {
      if (data?.users) {
        applyFiltersAndUpdateState(data.users);
      }
      setLoading(false);
    },
    onError: (error) => {
      console.error('Error fetching users:', error);
      setLoading(false);
      toast.error('Error loading users');
    }
  });
  
  // Apply filters to users data and update state
  const applyFiltersAndUpdateState = (users: User[]) => {
    // Update main users array
    setUsers(users);
    
    // Apply any active filters
    if (selectedRole) {
      const filtered = users.filter((user: User) => 
        user.role.name === selectedRole
      );
      setFilteredUsers(filtered);
    } else if (searchTerm) {
      const filtered = users.filter((user: User) => 
        user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredUsers(filtered);
    } else {
      setFilteredUsers(users);
    }
    
    // Extract and update role options
    const roleNames: string[] = [];
    users.forEach((user: User) => {
      if (user?.role?.name) {
        roleNames.push(user.role.name);
      }
    });
    setRoles([...new Set(roleNames)]);
    
    // If the selected role no longer exists, reset the filter
    if (selectedRole && !roleNames.includes(selectedRole)) {
      setSelectedRole(null);
    }
  };

  // Mutations
  const [createUser, { loading: createLoading }] = useMutation(CREATE_USER, {
    client,
    onCompleted: () => {
      setIsAddUserOpen(false);
      resetForm();
      
      // Fetch the latest data
      refetch().then((response) => {
        if (response.data?.users) {
          applyFiltersAndUpdateState(response.data.users);
        }
      });
      
      toast.success("User created successfully");
    },
    onError: (error) => {
      toast.error(`Error creating user: ${error.message}`);
    }
  });

  const [updateUser, { loading: updateLoading }] = useMutation(UPDATE_USER, {
    client,
    onCompleted: () => {
      setIsEditUserOpen(false);
      setCurrentUser(null);
      resetForm();
      
      // Fetch the latest data
      refetch().then((response) => {
        if (response.data?.users) {
          applyFiltersAndUpdateState(response.data.users);
        }
      });
      
      toast.success("User updated successfully");
    },
    onError: (error) => {
      toast.error(`Error updating user: ${error.message}`);
    }
  });

  const [deleteUser, { loading: deleteLoading }] = useMutation(DELETE_USER, {
    client,
    onCompleted: () => {
      setIsDeleteDialogOpen(false);
      setUserToDelete(null);
      
      // Fetch the latest data
      refetch().then((response) => {
        if (response.data?.users) {
          applyFiltersAndUpdateState(response.data.users);
        }
      });
      
      toast.success("User deleted successfully");
    },
    onError: (error) => {
      toast.error(`Error deleting user: ${error.message}`);
    }
  });
  
  const handleRoleFilter = (role: string | null) => {
    setSelectedRole(role === selectedRole ? null : role);
  };
  
  const formatDate = (dateString: string) => {
    if (!dateString) return 'Fecha no disponible';
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        console.log('Invalid date:', dateString);
        return 'Fecha no disponible';
      }
      
      // Nombres de los meses en español
      const meses = [
        'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
        'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
      ];
      
      const dia = date.getDate();
      const mes = meses[date.getMonth()];
      const anio = date.getFullYear();
      const hora = date.getHours().toString().padStart(2, '0');
      const minutos = date.getMinutes().toString().padStart(2, '0');
      
      return `${dia} de ${mes} de ${anio}, ${hora}:${minutos}`;
    } catch (error) {
      console.error('Error formatting date:', error, dateString);
      return 'Fecha no disponible';
    }
  };
  
  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'bg-red-100 text-red-800';
      case 'MANAGER':
        return 'bg-blue-100 text-blue-800';
      case 'EMPLOYEE':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const resetForm = () => {
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      phoneNumber: '',
      password: '',
      role: 'USER'
    });
    
    // Asegurarse de que los input forms queden limpios
    if (document.getElementById('firstName')) {
      (document.getElementById('firstName') as HTMLInputElement).value = '';
    }
    if (document.getElementById('lastName')) {
      (document.getElementById('lastName') as HTMLInputElement).value = '';
    }
    if (document.getElementById('email')) {
      (document.getElementById('email') as HTMLInputElement).value = '';
    }
    if (document.getElementById('password')) {
      (document.getElementById('password') as HTMLInputElement).value = '';
    }
    if (document.getElementById('phoneNumber')) {
      (document.getElementById('phoneNumber') as HTMLInputElement).value = '';
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleRoleChange = (value: string) => {
    setFormData(prev => ({ ...prev, role: value }));
  };

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    createUser({ 
      variables: { 
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName,
        phoneNumber: formData.phoneNumber || null,
        role: formData.role  // Using role name as roleId - server will handle lookup if needed
      } 
    });
  };

  const handleEditUser = (user: User) => {
    setCurrentUser(user);
    setFormData({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phoneNumber: user.phoneNumber || '',
      password: '',
      role: user.role.name
    });
    setIsEditUserOpen(true);
  };

  const handleCancelEdit = () => {
    setIsEditUserOpen(false);
    setCurrentUser(null);
    resetForm();
  };

  const handleCancelAdd = () => {
    setIsAddUserOpen(false);
    resetForm();
  };

  const handleUpdateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    
    updateUser({ 
      variables: { 
        id: currentUser.id,
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phoneNumber: formData.phoneNumber || null,
        role: formData.role
      } 
    });
  };

  const handleDeleteClick = (user: User) => {
    setUserToDelete(user);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (!userToDelete) return;
    deleteUser({ variables: { id: userToDelete.id } });
  };
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col">
        <h1 className="text-2xl font-bold tracking-tight">User Management</h1>
        <p className="text-muted-foreground">
          View and manage all users in the system.
        </p>
      </div>
      
      <Tabs defaultValue="all-users">
        <TabsList>
          <TabsTrigger value="all-users">All Users</TabsTrigger>
          <TabsTrigger value="admins">Admins</TabsTrigger>
          <TabsTrigger value="recent">Recently Added</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all-users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>User Directory</CardTitle>
              <CardDescription>
                Manage the users of the application. Filter, search, or select to perform actions.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col space-y-4">
                {/* Search and Filters */}
                <div className="flex flex-col md:flex-row gap-4 mb-4">
                  <div className="relative flex-1">
                    <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                    <Input
                      placeholder="Search users..."
                      className="pl-8"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className="text-sm whitespace-nowrap flex items-center">
                      <FilterIcon className="h-4 w-4 mr-1" /> Filter by role:
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {roles.map(role => (
                        <Badge 
                          key={role}
                          variant={selectedRole === role ? "default" : "outline"}
                          className="cursor-pointer"
                          onClick={() => handleRoleFilter(role)}
                        >
                          {role}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
                
                {/* Users Table */}
                {loading ? (
                  <div className="text-center py-8">Loading users...</div>
                ) : error ? (
                  <div className="text-center py-8 text-red-500">Error loading users</div>
                ) : (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Role</TableHead>
                          <TableHead>Created</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredUsers.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center">
                              No users found matching the criteria
                            </TableCell>
                          </TableRow>
                        ) : (
                          filteredUsers.map(user => (
                            <TableRow key={user.id}>
                              <TableCell className="font-medium">
                                {user.firstName} {user.lastName}
                              </TableCell>
                              <TableCell>{user.email}</TableCell>
                              <TableCell>
                                <Badge className={getRoleBadgeColor(user.role.name)}>
                                  {user.role.name}
                                </Badge>
                              </TableCell>
                              <TableCell>{formatDate(user.createdAt)}</TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-2">
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    onClick={() => handleEditUser(user)}
                                  >
                                    <Edit2Icon className="h-4 w-4 mr-1" />
                                    Edit
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    className="text-red-500"
                                    onClick={() => handleDeleteClick(user)}
                                  >
                                    <Trash2Icon className="h-4 w-4 mr-1" />
                                    Delete
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    className="text-blue-600"
                                    onClick={() => router.push(`/${params.locale}/admin/users/${user.id}/permissions`)}
                                  >
                                    <ShieldIcon className="h-4 w-4 mr-1" />
                                    Permisos
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                )}
                
                <div className="flex justify-between mt-4">
                  <span className="text-sm text-gray-500">
                    Showing {filteredUsers.length} of {users.length} users
                  </span>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex items-center gap-1"
                      onClick={() => router.push(`/${params.locale}/admin/roles`)}
                    >
                      <ShieldIcon className="h-4 w-4" />
                      Manage Roles
                    </Button>
                    <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" className="flex items-center gap-1">
                          <UserPlusIcon className="h-4 w-4" />
                          Add User
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Add New User</DialogTitle>
                          <DialogDescription>
                            Create a new user account in the system.
                          </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleAddUser}>
                          <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label htmlFor="firstName">First Name</Label>
                                <Input
                                  id="firstName"
                                  name="firstName"
                                  value={formData.firstName}
                                  onChange={handleInputChange}
                                  required
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="lastName">Last Name</Label>
                                <Input
                                  id="lastName"
                                  name="lastName"
                                  value={formData.lastName}
                                  onChange={handleInputChange}
                                  required
                                />
                              </div>
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="email">Email</Label>
                              <Input
                                id="email"
                                name="email"
                                type="email"
                                value={formData.email}
                                onChange={handleInputChange}
                                required
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="password">Password</Label>
                              <Input
                                id="password"
                                name="password"
                                type="password"
                                value={formData.password}
                                onChange={handleInputChange}
                                required
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="phoneNumber">Phone Number</Label>
                              <Input
                                id="phoneNumber"
                                name="phoneNumber"
                                value={formData.phoneNumber}
                                onChange={handleInputChange}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="role">Role</Label>
                              <Select 
                                value={formData.role} 
                                onValueChange={handleRoleChange}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select a role" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="USER">User</SelectItem>
                                  <SelectItem value="EMPLOYEE">Employee</SelectItem>
                                  <SelectItem value="MANAGER">Manager</SelectItem>
                                  <SelectItem value="ADMIN">Admin</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          <DialogFooter>
                            <Button 
                              variant="outline" 
                              type="button" 
                              onClick={handleCancelAdd}
                            >
                              Cancel
                            </Button>
                            <Button type="submit" disabled={createLoading}>
                              {createLoading ? "Creating..." : "Create User"}
                            </Button>
                          </DialogFooter>
                        </form>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="admins">
          <Card>
            <CardHeader>
              <CardTitle>Admins Only</CardTitle>
              <CardDescription>
                View and manage admin users.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users
                      .filter(user => user.role.name === 'ADMIN')
                      .map(user => (
                        <TableRow key={user.id}>
                          <TableCell className="font-medium">
                            {user.firstName} {user.lastName}
                          </TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>
                            <Badge className="bg-red-100 text-red-800">
                              {user.role.name}
                            </Badge>
                          </TableCell>
                          <TableCell>{formatDate(user.createdAt)}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => handleEditUser(user)}
                              >
                                <Edit2Icon className="h-4 w-4 mr-1" />
                                Edit
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline"
                                className="text-red-500"
                                onClick={() => handleDeleteClick(user)}
                              >
                                <Trash2Icon className="h-4 w-4 mr-1" />
                                Delete
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline"
                                className="text-blue-600"
                                onClick={() => router.push(`/${params.locale}/admin/users/${user.id}/permissions`)}
                              >
                                <ShieldIcon className="h-4 w-4 mr-1" />
                                Permisos
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="recent">
          <Card>
            <CardHeader>
              <CardTitle>Recently Added Users</CardTitle>
              <CardDescription>
                Users added in the last 30 days.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users
                      .filter(user => {
                        const thirtyDaysAgo = new Date();
                        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                        
                        try {
                          const userDate = new Date(user.createdAt);
                          return !isNaN(userDate.getTime()) && userDate >= thirtyDaysAgo;
                        } catch (error) {
                          console.error('Error comparing dates:', error);
                          return false;
                        }
                      })
                      .map(user => (
                        <TableRow key={user.id}>
                          <TableCell className="font-medium">
                            {user.firstName} {user.lastName}
                          </TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>
                            <Badge className={getRoleBadgeColor(user.role.name)}>
                              {user.role.name}
                            </Badge>
                          </TableCell>
                          <TableCell>{formatDate(user.createdAt)}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => handleEditUser(user)}
                              >
                                <Edit2Icon className="h-4 w-4 mr-1" />
                                Edit
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline"
                                className="text-red-500"
                                onClick={() => handleDeleteClick(user)}
                              >
                                <Trash2Icon className="h-4 w-4 mr-1" />
                                Delete
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline"
                                className="text-blue-600"
                                onClick={() => router.push(`/${params.locale}/admin/users/${user.id}/permissions`)}
                              >
                                <ShieldIcon className="h-4 w-4 mr-1" />
                                Permisos
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit User Dialog */}
      <Dialog open={isEditUserOpen} onOpenChange={setIsEditUserOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update user information.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateUser}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-firstName">First Name</Label>
                  <Input
                    id="edit-firstName"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-lastName">Last Name</Label>
                  <Input
                    id="edit-lastName"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-email">Email</Label>
                <Input
                  id="edit-email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-phoneNumber">Phone Number</Label>
                <Input
                  id="edit-phoneNumber"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleInputChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-role">Role</Label>
                <Select 
                  value={formData.role} 
                  onValueChange={handleRoleChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USER">User</SelectItem>
                    <SelectItem value="EMPLOYEE">Employee</SelectItem>
                    <SelectItem value="MANAGER">Manager</SelectItem>
                    <SelectItem value="ADMIN">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button 
                variant="outline" 
                type="button" 
                onClick={handleCancelEdit}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={updateLoading}>
                {updateLoading ? "Updating..." : "Update User"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete User Confirmation */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action will permanently delete the user &quot;{userToDelete?.firstName} {userToDelete?.lastName}&quot;. 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setUserToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              className="bg-red-500 hover:bg-red-600"
              disabled={deleteLoading}
            >
              {deleteLoading ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
} 