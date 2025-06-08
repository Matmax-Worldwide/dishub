'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Badge } from '@/app/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/app/components/ui/dialog';
import { 
  LoaderIcon,
  PlusIcon,
  UserPlusIcon,
  SearchIcon,
  CheckIcon,
  UserIcon,
} from 'lucide-react';
import { SuperAdminClient } from '@/lib/graphql/superAdmin';
import graphqlClient from '@/lib/graphql-client';
import { toast } from 'sonner';

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

interface TenantAdminManagerProps {
  tenantId: string;
  tenantName: string;
  onAdminAssigned?: (user: User) => void;
}

export default function TenantAdminManager({ tenantId, tenantName, onAdminAssigned }: TenantAdminManagerProps) {
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [selectedAdminUser, setSelectedAdminUser] = useState<User | null>(null);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [showCreateUserModal, setShowCreateUserModal] = useState(false);
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [creatingUser, setCreatingUser] = useState(false);
  const [assigningUser, setAssigningUser] = useState(false);

  // New user form state
  const [newUserForm, setNewUserForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    password: '',
    confirmPassword: ''
  });

  const loadUsers = async () => {
    try {
      setLoadingUsers(true);
      const calendarUsers = await graphqlClient.users();
      // Convert CalendarUser to User format expected by the component
      const users: User[] = calendarUsers.map(user => ({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phoneNumber: user.phoneNumber,
        role: {
          id: user.roleId || 'default',
          name: 'USER', // Default since CalendarUser doesn't have role details
          description: undefined
        },
        createdAt: user.createdAt.toISOString()
      }));
      setAvailableUsers(users);
    } catch (error) {
      console.error('Error loading users:', error);
      toast.error('Failed to load users');
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleCreateUser = async () => {
    if (!newUserForm.firstName || !newUserForm.lastName || !newUserForm.email || !newUserForm.password) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (newUserForm.password !== newUserForm.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (newUserForm.password.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }

    try {
      setCreatingUser(true);
      const newUser = await graphqlClient.createUser({
        email: newUserForm.email,
        password: newUserForm.password,
        firstName: newUserForm.firstName,
        lastName: newUserForm.lastName,
        phoneNumber: newUserForm.phoneNumber || undefined,
        role: 'TenantAdmin'
      });

      toast.success(`User "${newUser.firstName} ${newUser.lastName}" created successfully!`);
      
      // Add to available users and select as admin
      setAvailableUsers(prev => [...prev, newUser]);
      setSelectedAdminUser(newUser);
      
      // Reset form and close modal
      setNewUserForm({
        firstName: '',
        lastName: '',
        email: '',
        phoneNumber: '',
        password: '',
        confirmPassword: ''
      });
      setShowCreateUserModal(false);
    } catch (error) {
      console.error('Error creating user:', error);
      toast.error(`Failed to create user: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setCreatingUser(false);
    }
  };

  const handleAssignAdmin = async (user: User) => {
    try {
      setAssigningUser(true);
      const assignResult = await SuperAdminClient.assignTenantAdmin(tenantId, user.id);
      
      if (assignResult.success) {
        toast.success(`${user.firstName} ${user.lastName} has been assigned as admin for ${tenantName}`);
        setSelectedAdminUser(user);
        onAdminAssigned?.(user);
      } else {
        toast.error(`Failed to assign admin user: ${assignResult.message}`);
      }
    } catch (error) {
      console.error('Error assigning admin user:', error);
      toast.error('Failed to assign admin user');
    } finally {
      setAssigningUser(false);
    }
  };

  const filteredUsers = availableUsers.filter(user => 
    user.firstName.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
    user.lastName.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(userSearchTerm.toLowerCase())
  );

  useEffect(() => {
    loadUsers();
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <UserPlusIcon className="h-5 w-5 mr-2" />
          Tenant Administrator
        </CardTitle>
        <CardDescription>
          Create or select the administrator for {tenantName}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {selectedAdminUser ? (
          <div className="p-4 border rounded-lg bg-green-50 border-green-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center">
                  <UserIcon className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <h4 className="font-medium text-green-900">
                    {selectedAdminUser.firstName} {selectedAdminUser.lastName}
                  </h4>
                  <p className="text-sm text-green-700">{selectedAdminUser.email}</p>
                  <Badge className="mt-1 bg-green-100 text-green-800">
                    {selectedAdminUser.role.name}
                  </Badge>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <CheckIcon className="h-5 w-5 text-green-600" />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedAdminUser(null)}
                >
                  Change
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Dialog open={showCreateUserModal} onOpenChange={setShowCreateUserModal}>
                <DialogTrigger asChild>
                  <Button>
                    <PlusIcon className="h-4 w-4 mr-2" />
                    Create New Admin
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Create New Admin User</DialogTitle>
                    <DialogDescription>
                      Create a new user who will be the administrator for {tenantName}.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="firstName">First Name *</Label>
                        <Input
                          id="firstName"
                          value={newUserForm.firstName}
                          onChange={(e) => setNewUserForm(prev => ({ ...prev, firstName: e.target.value }))}
                          placeholder="John"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lastName">Last Name *</Label>
                        <Input
                          id="lastName"
                          value={newUserForm.lastName}
                          onChange={(e) => setNewUserForm(prev => ({ ...prev, lastName: e.target.value }))}
                          placeholder="Doe"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={newUserForm.email}
                        onChange={(e) => setNewUserForm(prev => ({ ...prev, email: e.target.value }))}
                        placeholder="john@example.com"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phoneNumber">Phone Number</Label>
                      <Input
                        id="phoneNumber"
                        value={newUserForm.phoneNumber}
                        onChange={(e) => setNewUserForm(prev => ({ ...prev, phoneNumber: e.target.value }))}
                        placeholder="+1 (555) 123-4567"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password">Password *</Label>
                      <Input
                        id="password"
                        type="password"
                        value={newUserForm.password}
                        onChange={(e) => setNewUserForm(prev => ({ ...prev, password: e.target.value }))}
                        placeholder="Minimum 6 characters"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirm Password *</Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        value={newUserForm.confirmPassword}
                        onChange={(e) => setNewUserForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                        placeholder="Confirm password"
                      />
                    </div>
                    <div className="flex justify-end space-x-2">
                      <Button
                        variant="outline"
                        onClick={() => setShowCreateUserModal(false)}
                        disabled={creatingUser}
                      >
                        Cancel
                      </Button>
                      <Button onClick={handleCreateUser} disabled={creatingUser}>
                        {creatingUser ? (
                          <LoaderIcon className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <PlusIcon className="h-4 w-4 mr-2" />
                        )}
                        Create & Assign
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
              <span className="text-gray-500">or</span>
              <span className="text-sm text-gray-600">select an existing user below</span>
            </div>

            <div className="space-y-2">
              <div className="relative">
                <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search users..."
                  value={userSearchTerm}
                  onChange={(e) => setUserSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              {loadingUsers ? (
                <div className="flex items-center justify-center py-8">
                  <LoaderIcon className="h-6 w-6 animate-spin text-gray-400" />
                  <span className="ml-2 text-gray-600">Loading users...</span>
                </div>
              ) : (
                <div className="max-h-60 overflow-y-auto border rounded-lg">
                  {filteredUsers.length === 0 ? (
                    <div className="p-4 text-center text-gray-500">
                      {userSearchTerm ? 'No users found matching your search.' : 'No users available.'}
                    </div>
                  ) : (
                    filteredUsers.map((user) => (
                      <div
                        key={user.id}
                        className="p-3 border-b last:border-b-0 hover:bg-gray-50"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="h-8 w-8 bg-gray-100 rounded-full flex items-center justify-center">
                              <UserIcon className="h-4 w-4 text-gray-600" />
                            </div>
                            <div>
                              <h4 className="font-medium">
                                {user.firstName} {user.lastName}
                              </h4>
                              <p className="text-sm text-gray-600">{user.email}</p>
                              <Badge variant="outline" className="mt-1">
                                {user.role.name}
                              </Badge>
                            </div>
                          </div>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleAssignAdmin(user)}
                            disabled={assigningUser}
                          >
                            {assigningUser ? (
                              <LoaderIcon className="h-4 w-4 animate-spin" />
                            ) : (
                              'Assign as Admin'
                            )}
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 