'use client';

import { useState, useEffect, useCallback, memo } from 'react';
import graphqlClient from '@/lib/graphql-client';
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
  ShieldIcon,
  XIcon,
  SaveIcon,
  Loader2Icon,
  ArrowLeft,
  ArrowRight,
  CheckIcon,
  UserIcon,
  LockIcon,
  PhoneIcon
} from 'lucide-react';
import { toast } from 'sonner';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';

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

// Role interface
interface Role {
  id: string;
  name: string;
  description?: string;
}

// Extended CalendarUser with role for GraphQL response
interface CalendarUserWithRole {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  role?: {
    id: string;
    name: string;
    description?: string;
  };
  createdAt: Date | string;
  updatedAt: Date | string;
}

// Form data interface
interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  password: string;
  role: string;
}

// MultiStepUserForm props interface
interface MultiStepUserFormProps {
  formData: FormData;
  currentStep: number;
  totalSteps: number;
  createLoading: boolean;
  roles: Role[];
  onFirstNameChange: (value: string) => void;
  onLastNameChange: (value: string) => void;
  onEmailChange: (value: string) => void;
  onPhoneChange: (value: string) => void;
  onPasswordChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRoleChange: (value: string) => void;
  onNextStep: () => void;
  onPrevStep: () => void;
  onCancel: () => void;
  onSubmit: (e: React.FormEvent) => void;
  validateStep: (step: number, currentFormData: FormData) => boolean;
}

// MultiStepUserForm component moved outside to prevent recreation
const MultiStepUserForm = memo(({
  formData,
  currentStep,
  totalSteps,
  createLoading,
  roles,
  onFirstNameChange,
  onLastNameChange,
  onEmailChange,
  onPhoneChange,
  onPasswordChange,
  onRoleChange,
  onNextStep,
  onPrevStep,
  onCancel,
  onSubmit,
  validateStep
}: MultiStepUserFormProps) => {
  const progress = (currentStep / totalSteps) * 100;

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <UserIcon className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold">Personal Information</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="step1-firstName">First Name *</Label>
                <Input
                  id="step1-firstName"
                  value={formData.firstName}
                  onChange={(e) => onFirstNameChange(e.target.value)}
                  disabled={createLoading}
                  placeholder="Enter first name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="step1-lastName">Last Name *</Label>
                <Input
                  id="step1-lastName"
                  value={formData.lastName}
                  onChange={(e) => onLastNameChange(e.target.value)}
                  disabled={createLoading}
                  placeholder="Enter last name"
                />
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <PhoneIcon className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold">Contact Information</h3>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="step2-email">Email Address *</Label>
                <Input
                  id="step2-email"
                  value={formData.email}
                  onChange={(e) => onEmailChange(e.target.value)}
                  disabled={createLoading}
                  placeholder="Enter email address"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="step2-phoneNumber">Phone Number</Label>
                <Input
                  id="step2-phoneNumber"
                  value={formData.phoneNumber}
                  onChange={(e) => onPhoneChange(e.target.value)}
                  disabled={createLoading}
                  placeholder="Enter phone number (optional)"
                />
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <LockIcon className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold">Security</h3>
            </div>
            <div className="space-y-2">
              <Label htmlFor="step3-password">Password *</Label>
              <Input
                id="step3-password"
                name="password"
                type="password"
                value={formData.password}
                onChange={onPasswordChange}
                required
                disabled={createLoading}
                minLength={6}
                placeholder="Enter password (min 6 characters)"
              />
              <p className="text-xs text-muted-foreground">
                Password must be at least 6 characters long
              </p>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <ShieldIcon className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold">Role & Permissions</h3>
            </div>
            <div className="space-y-2">
              <Label htmlFor="step4-role">User Role *</Label>
              <Select value={formData.role} onValueChange={onRoleChange} disabled={createLoading}>
                <SelectTrigger id="step4-role">
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((role) => (
                    <SelectItem key={role.id} value={role.name}>
                      <div className="flex items-center gap-2">
                        <ShieldIcon className="h-4 w-4" />
                        <span>{role.name}</span>
                        {role.description && (
                          <span className="text-xs text-muted-foreground">
                            - {role.description}
                          </span>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* Summary */}
            <div className="mt-6 p-4 bg-muted/50 rounded-lg">
              <h4 className="font-medium mb-2">Review User Details</h4>
              <div className="space-y-1 text-sm">
                <p><strong>Name:</strong> {formData.firstName} {formData.lastName}</p>
                <p><strong>Email:</strong> {formData.email}</p>
                {formData.phoneNumber && <p><strong>Phone:</strong> {formData.phoneNumber}</p>}
                <p><strong>Role:</strong> {formData.role}</p>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <UserPlusIcon className="h-5 w-5" />
              Create New User
            </CardTitle>
            <CardDescription>
              Step {currentStep} of {totalSteps}: Complete the form to create a new user account
            </CardDescription>
          </div>
          <Button variant="ghost" size="sm" onClick={onCancel}>
            <XIcon className="h-4 w-4" />
          </Button>
        </div>
        
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Progress</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={currentStep === totalSteps ? onSubmit : (e) => e.preventDefault()} key={`step-${currentStep}`}>
          {renderStepContent()}
          
          {/* Navigation Buttons */}
          <div className="flex justify-between pt-6 mt-6 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onPrevStep}
              disabled={currentStep === 1 || createLoading}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Previous
            </Button>
            
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={createLoading}
              >
                Cancel
              </Button>
              
              {currentStep === totalSteps ? (
                <Button
                  type="submit"
                  disabled={!validateStep(currentStep, formData) || createLoading}
                >
                  {createLoading ? (
                    <>
                      <Loader2Icon className="h-4 w-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <CheckIcon className="h-4 w-4 mr-2" />
                      Create User
                    </>
                  )}
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={onNextStep}
                  disabled={!validateStep(currentStep, formData) || createLoading}
                >
                  Next
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              )}
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
});

MultiStepUserForm.displayName = 'MultiStepUserForm';

export default function UserManagementPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [createLoading, setCreateLoading] = useState(false);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  
  // Multi-step form state
  const [currentStep, setCurrentStep] = useState(1);
  const [showMultiStepForm, setShowMultiStepForm] = useState(false);
  const totalSteps = 4;
  
  // Form state
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    password: '',
    role: 'USER'
  });
  
  // Load users and roles
  const fetchData = async () => {
    try {
      setLoading(true);
      console.log('Fetching users and roles...');
      
      const [usersData, rolesData] = await Promise.all([
        graphqlClient.users().catch(err => {
          console.error('Error fetching users:', err);
          throw new Error(`Failed to fetch users: ${err.message}`);
        }) as Promise<CalendarUserWithRole[]>,
        graphqlClient.getRoles().catch(err => {
          console.error('Error fetching roles:', err);
          console.error('Full error object:', err);
          throw new Error(`Failed to fetch roles: ${err.message}`);
        })
      ]);
      
      console.log('Users data:', usersData);
      console.log('Roles data:', rolesData);
      
      // Transform users data to match interface
      const transformedUsers: User[] = usersData.map(user => ({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phoneNumber: user.phoneNumber || undefined,
        role: user.role || {
          id: 'default',
          name: 'USER',
          description: undefined
        },
        createdAt: typeof user.createdAt === 'string' ? user.createdAt : user.createdAt.toISOString()
      }));
      
      setUsers(transformedUsers);
      setRoles(rolesData);
      applyFiltersAndUpdateState(transformedUsers);
    } catch (err) {
      console.error('Error fetching data:', err);
      toast.error(`Failed to load data: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);
  
  // Apply filters to users data and update state
  const applyFiltersAndUpdateState = useCallback((users: User[]) => {
    let filtered = users;
    
    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter((user: User) => 
        user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Apply role filter
    if (selectedRole) {
      filtered = filtered.filter((user: User) => 
        user.role.name === selectedRole
      );
    }
    
    setFilteredUsers(filtered);
  }, [searchTerm, selectedRole]);

  // Apply filters when search term or role filter changes - ONLY when these specific values change
  useEffect(() => {
    if (users.length > 0) {
      applyFiltersAndUpdateState(users);
    }
  }, [searchTerm, selectedRole, users.length]); // Changed dependency to users.length instead of users array
  
  const handleRoleFilter = (role: string | null) => {
    setSelectedRole(role);
  };
  
  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Invalid Date';
    }
  };
  
  const getRoleBadgeColor = (role: string) => {
    switch (role.toUpperCase()) {
      case 'ADMIN':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'MANAGER':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'EMPLOYEE':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const resetForm = useCallback(() => {
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      phoneNumber: '',
      password: '',
      role: 'USER'
    });
    setCurrentStep(1);
  }, []);

  // StableInput handlers that accept string values
  const handleFirstNameChange = useCallback((value: string) => {
    setFormData(prev => ({ ...prev, firstName: value }));
  }, []);

  const handleLastNameChange = useCallback((value: string) => {
    setFormData(prev => ({ ...prev, lastName: value }));
  }, []);

  const handleEmailChange = useCallback((value: string) => {
    setFormData(prev => ({ ...prev, email: value }));
  }, []);

  const handlePhoneChange = useCallback((value: string) => {
    setFormData(prev => ({ ...prev, phoneNumber: value }));
  }, []);

  const handleSearchChange = useCallback((value: string) => {
    setSearchTerm(value);
  }, []);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  }, []);

  const handleRoleChange = useCallback((value: string) => {
    setFormData(prev => ({ ...prev, role: value }));
  }, []);

  const nextStep = useCallback(() => {
    setCurrentStep(prev => prev < totalSteps ? prev + 1 : prev);
  }, [totalSteps]); // Removed currentStep dependency

  const prevStep = useCallback(() => {
    setCurrentStep(prev => prev > 1 ? prev - 1 : prev);
  }, []); // Removed currentStep dependency

  const validateStep = useCallback((step: number, currentFormData: FormData): boolean => {
    switch (step) {
      case 1:
        // Paso 1: Información Personal - Ambos campos son obligatorios
        return !!(currentFormData.firstName.trim() && currentFormData.lastName.trim());
      case 2:
        // Paso 2: Información de Contacto - Solo email es obligatorio
        return !!(currentFormData.email.trim() && currentFormData.email.includes('@') && currentFormData.email.includes('.'));
      case 3:
        // Paso 3: Seguridad - Password es obligatorio (mínimo 6 caracteres)
        return !!(currentFormData.password.trim() && currentFormData.password.length >= 6);
      case 4:
        // Paso 4: Rol - Role es obligatorio
        return !!(currentFormData.role.trim());
      default:
        return false;
    }
  }, []); // Sin dependencias para evitar re-renders

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email || !formData.password || !formData.firstName || !formData.lastName) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setCreateLoading(true);
      const newUser = await graphqlClient.createUser({
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName,
        phoneNumber: formData.phoneNumber || undefined,
        role: formData.role
      });

      toast.success(`User "${newUser.firstName} ${newUser.lastName}" created successfully!`);
      setShowMultiStepForm(false);
      setShowAddForm(false);
      resetForm();
      fetchData(); // Refresh the users list
    } catch (error) {
      console.error('Error creating user:', error);
      toast.error(`Failed to create user: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setCreateLoading(false);
    }
  };

  const handleEditUser = (user: User) => {
    setEditingUserId(user.id);
    setFormData({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phoneNumber: user.phoneNumber || '',
      password: '',
      role: user.role.name
    });
  };

  const handleCancelEdit = useCallback(() => {
    setEditingUserId(null);
    resetForm();
  }, [resetForm]);

  const handleCancelAdd = useCallback(() => {
    setShowAddForm(false);
    setShowMultiStepForm(false);
    resetForm();
  }, [resetForm]);

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUserId) return;
    
    try {
      setUpdateLoading(true);
      const updatedUser = await graphqlClient.updateUser(editingUserId, {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phoneNumber: formData.phoneNumber || undefined,
        role: formData.role
      });

      toast.success(`User "${updatedUser.firstName} ${updatedUser.lastName}" updated successfully!`);
      setEditingUserId(null);
      resetForm();
      fetchData(); // Refresh the users list
    } catch (error) {
      console.error('Error updating user:', error);
      toast.error(`Failed to update user: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setUpdateLoading(false);
    }
  };

  const handleDeleteClick = (user: User) => {
    setUserToDelete(user);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!userToDelete) return;
    
    try {
      setDeleteLoading(true);
      await graphqlClient.deleteUser(userToDelete.id);
      toast.success(`User "${userToDelete.firstName} ${userToDelete.lastName}" deleted successfully!`);
      setIsDeleteDialogOpen(false);
      setUserToDelete(null);
      fetchData(); // Refresh the users list
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error(`Failed to delete user: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col">
        <h1 className="text-2xl font-bold tracking-tight">User Management</h1>
        <p className="text-muted-foreground">
          Create, view, and manage all users in the system.
        </p>
      </div>

      {/* Add User Form */}
      {(showAddForm && showMultiStepForm) && (
        <MultiStepUserForm
          formData={formData}
          currentStep={currentStep}
          totalSteps={totalSteps}
          createLoading={createLoading}
          roles={roles}
          onFirstNameChange={handleFirstNameChange}
          onLastNameChange={handleLastNameChange}
          onEmailChange={handleEmailChange}
          onPhoneChange={handlePhoneChange}
          onPasswordChange={handleInputChange}
          onRoleChange={handleRoleChange}
          onNextStep={nextStep}
          onPrevStep={prevStep}
          onCancel={handleCancelAdd}
          onSubmit={handleAddUser}
          validateStep={validateStep}
        />
      )}

      {/* Edit User Form */}
      {editingUserId && (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
              Edit User
              <Button variant="ghost" size="sm" onClick={handleCancelEdit}>
            <XIcon className="h-4 w-4" />
          </Button>
        </CardTitle>
        <CardDescription>
              Update user information
        </CardDescription>
      </CardHeader>
      <CardContent>
            <form onSubmit={handleUpdateUser} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
                  <Label htmlFor="edit-firstName">First Name *</Label>
              <Input
                    id="edit-firstName"
                value={formData.firstName}
                    onChange={(e) => handleFirstNameChange(e.target.value)}
                    disabled={updateLoading}
              />
            </div>
            <div className="space-y-2">
                  <Label htmlFor="edit-lastName">Last Name *</Label>
              <Input
                    id="edit-lastName"
                value={formData.lastName}
                    onChange={(e) => handleLastNameChange(e.target.value)}
                    disabled={updateLoading}
              />
            </div>
          </div>
          
          <div className="space-y-2">
                <Label htmlFor="edit-email">Email *</Label>
            <Input
                  id="edit-email"
              value={formData.email}
                  onChange={(e) => handleEmailChange(e.target.value)}
                  disabled={updateLoading}
            />
          </div>
          
            <div className="space-y-2">
                <Label htmlFor="edit-phoneNumber">Phone Number</Label>
              <Input
                  id="edit-phoneNumber"
              value={formData.phoneNumber}
                  onChange={(e) => handlePhoneChange(e.target.value)}
                  disabled={updateLoading}
            />
          </div>
          
          <div className="space-y-2">
                <Label htmlFor="edit-role">Role *</Label>
                <Select value={formData.role} onValueChange={handleRoleChange} disabled={updateLoading}>
                  <SelectTrigger id="edit-role">
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                    {roles.map((role) => (
                      <SelectItem key={role.id} value={role.name}>
                        <div className="flex items-center gap-2">
                          <ShieldIcon className="h-4 w-4" />
                          <span>{role.name}</span>
                          {role.description && (
                            <span className="text-xs text-muted-foreground">
                              - {role.description}
                            </span>
                          )}
                        </div>
                      </SelectItem>
                    ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex gap-2 pt-4">
                <Button type="submit" disabled={updateLoading}>
                  {updateLoading ? (
                    <>
                      <Loader2Icon className="h-4 w-4 mr-2 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    <>
              <SaveIcon className="h-4 w-4 mr-2" />
                      Update User
                    </>
                  )}
            </Button>
                <Button type="button" variant="outline" onClick={handleCancelEdit} disabled={updateLoading}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
      )}

      {/* Main Content */}
      <Tabs defaultValue="users" className="space-y-4">
        <TabsList>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="roles">Roles</TabsTrigger>
        </TabsList>
        
        <TabsContent value="users" className="space-y-4">
          {/* Controls */}
          <div className="flex flex-col sm:flex-row gap-4 justify-between">
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative">
                <SearchIcon className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                  id="search-users"
                      placeholder="Search users..."
                      value={searchTerm}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="pl-8 w-full sm:w-[300px]"
                    />
                  </div>
              <Select value={selectedRole || 'all'} onValueChange={(value) => handleRoleFilter(value === 'all' ? null : value)}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <FilterIcon className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filter by role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  {roles.map((role) => (
                    <SelectItem key={role.id} value={role.name}>
                      {role.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
                    </div>
            <Button onClick={() => {
              setShowAddForm(true);
              setShowMultiStepForm(true);
            }} disabled={Boolean(showAddForm || editingUserId)}>
              <UserPlusIcon className="h-4 w-4 mr-2" />
              Add New User
            </Button>
                </div>
                
                {/* Users Table */}
          <Card>
            <CardContent className="p-0">
                {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2Icon className="h-8 w-8 animate-spin" />
                  <span className="ml-2">Loading users...</span>
                </div>
              ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Email</TableHead>
                      <TableHead>Phone</TableHead>
                          <TableHead>Role</TableHead>
                          <TableHead>Created</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredUsers.length === 0 ? (
                          <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          {searchTerm || selectedRole ? 'No users found matching your filters.' : 'No users found.'}
                            </TableCell>
                          </TableRow>
                        ) : (
                      filteredUsers.map((user) => (
                        <TableRow key={user.id}>
                              <TableCell className="font-medium">
                                {user.firstName} {user.lastName}
                              </TableCell>
                              <TableCell>{user.email}</TableCell>
                          <TableCell>{user.phoneNumber || '-'}</TableCell>
                              <TableCell>
                                <Badge className={getRoleBadgeColor(user.role.name)}>
                                  {user.role.name}
                                </Badge>
                              </TableCell>
                              <TableCell>{formatDate(user.createdAt)}</TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-2">
                                  <Button 
                                variant="ghost"
                                    size="sm" 
                                    onClick={() => handleEditUser(user)}
                                disabled={editingUserId === user.id || showAddForm}
                                  >
                                <Edit2Icon className="h-4 w-4" />
                                  </Button>
                                  <Button 
                                variant="ghost"
                                    size="sm" 
                                    onClick={() => handleDeleteClick(user)}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2Icon className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                )}
            </CardContent>
          </Card>
                
          {/* Summary */}
          <div className="text-sm text-muted-foreground">
                    Showing {filteredUsers.length} of {users.length} users
            {(searchTerm || selectedRole) && (
                    <Button 
                variant="link"
                      size="sm" 
                onClick={() => {
                  setSearchTerm('');
                  setSelectedRole(null);
                }}
                className="ml-2 h-auto p-0"
              >
                Clear filters
                      </Button>
                    )}
                  </div>
        </TabsContent>
        
        <TabsContent value="roles" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>System Roles</CardTitle>
              <CardDescription>
                Available roles in the system and their descriptions.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {roles.map((role) => (
                  <div key={role.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <div className="flex items-center gap-2">
                        <ShieldIcon className="h-5 w-5" />
                        <h3 className="font-medium">{role.name}</h3>
                        <Badge className={getRoleBadgeColor(role.name)}>
                          {role.name}
                            </Badge>
                            </div>
                      {role.description && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {role.description}
                        </p>
                      )}
              </div>
                            </div>
                      ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the user account for{' '}
              <strong>{userToDelete?.firstName} {userToDelete?.lastName}</strong> and remove all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setUserToDelete(null)} disabled={deleteLoading}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              disabled={deleteLoading}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteLoading ? (
                <>
                  <Loader2Icon className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete User'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
} 