'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle,
  Button,
  Input,
  Label,
  Textarea,
  Checkbox,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/super-admin';
import { 
  ArrowLeftIcon,
  SaveIcon,
  HomeIcon,
  UserIcon,
  PackageIcon,
  SearchIcon,
  UserPlusIcon,
  UserCheckIcon
} from 'lucide-react';
import { toast } from 'sonner';
import { SuperAdminClient } from '@/lib/graphql/superAdmin';
import graphqlClient from '@/lib/graphql-client';
import { ALL_FEATURES_CONFIG, getRequiredFeatures, addFeatureWithDependencies, removeFeatureWithDependents, getEngineById } from '@/config/engines';

interface TenantFormData {
  name: string;
  slug: string;
  domain: string;
  description: string;
  status: string;
  features: string[];
  adminMode: 'create' | 'select';
  selectedUserId?: string;
  adminEmail: string;
  adminFirstName: string;
  adminLastName: string;
  adminPassword: string;
}

interface ExistingUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  role: {
    id: string;
    name: string;
  };
  isActive?: boolean;
  createdAt: string;
}

// Features are now loaded from centralized configuration
const AVAILABLE_FEATURES = ALL_FEATURES_CONFIG.map(feature => ({
  id: feature.id,
  name: feature.name,
  description: feature.description,
  category: feature.category,
  pricing: feature.pricing,
  dependencies: feature.dependencies,
  required: feature.id === 'CMS_ENGINE' // CMS_ENGINE is always required
}));

const TENANT_STATUSES = [
  { value: 'ACTIVE', label: 'Active' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'SUSPENDED', label: 'Suspended' },
  { value: 'ARCHIVED', label: 'Archived' }
];

export default function CreateTenantPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [users, setUsers] = useState<ExistingUser[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<ExistingUser[]>([]);
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [formData, setFormData] = useState<TenantFormData>({
    name: '',
    slug: '',
    domain: '',
    description: '',
    status: 'ACTIVE',
    features: getRequiredFeatures(),
    adminMode: 'create',
    adminEmail: '',
    adminFirstName: '',
    adminLastName: '',
    adminPassword: ''
  });

  // Load users when component mounts or when switching to select mode
  useEffect(() => {
    if (formData.adminMode === 'select' && users.length === 0) {
      loadUsers();
    }
  }, [formData.adminMode, users.length]);

  // Filter users based on search term
  useEffect(() => {
    if (!userSearchTerm) {
      setFilteredUsers(users);
    } else {
      const filtered = users.filter(user => 
        user.firstName.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
        user.lastName.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(userSearchTerm.toLowerCase())
      );
      setFilteredUsers(filtered);
    }
  }, [users, userSearchTerm]);

  const loadUsers = async () => {
    try {
      setLoadingUsers(true);
      const usersData = await graphqlClient.users();
      // Map CalendarUser to ExistingUser format
      const mappedUsers: ExistingUser[] = usersData.map(user => ({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phoneNumber: user.phoneNumber,
        role: { id: user.roleId || 'default', name: 'USER' }, // CalendarUser doesn't have role object
        isActive: user.isActive,
        createdAt: user.createdAt instanceof Date ? user.createdAt.toISOString() : String(user.createdAt) // Handle both Date and string
      }));
      setUsers(mappedUsers);
    } catch (error) {
      console.error('Error loading users:', error);
      toast.error('Failed to load users');
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleInputChange = (field: keyof TenantFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    if (field === 'name') {
      const slug = value
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();
      setFormData(prev => ({
        ...prev,
        slug
      }));
    }
  };

  const handleAdminModeChange = (mode: 'create' | 'select') => {
    setFormData(prev => ({
      ...prev,
      adminMode: mode,
      selectedUserId: mode === 'create' ? undefined : prev.selectedUserId,
      adminEmail: mode === 'create' ? '' : prev.adminEmail,
      adminFirstName: mode === 'create' ? '' : prev.adminFirstName,
      adminLastName: mode === 'create' ? '' : prev.adminLastName,
      adminPassword: mode === 'create' ? '' : prev.adminPassword
    }));
  };

  const handleUserSelect = (user: ExistingUser) => {
    setFormData(prev => ({
      ...prev,
      selectedUserId: user.id,
      adminEmail: user.email,
      adminFirstName: user.firstName,
      adminLastName: user.lastName,
      adminPassword: '' // Clear password when selecting existing user
    }));
  };

  const handleFeatureToggle = (featureId: string, checked: boolean) => {
    // Prevent disabling CMS_ENGINE
    if (featureId === 'CMS_ENGINE' && !checked) {
      toast.error('CMS Engine is required and cannot be disabled');
      return;
    }

    const currentFeatures = formData.features;
    
    if (checked) {
      // Adding feature - automatically add dependencies
      const newFeatures = addFeatureWithDependencies(currentFeatures, featureId);
      
      // Show toast for added dependencies
      const feature = getEngineById(featureId);
      if (feature?.dependencies) {
        feature.dependencies.forEach(depId => {
          if (!currentFeatures.includes(depId)) {
            const depFeature = getEngineById(depId);
            if (depFeature) {
              toast.info(`Added dependency: ${depFeature.name}`);
            }
          }
        });
      }
      
      setFormData(prev => ({ ...prev, features: newFeatures }));
    } else {
      // Removing feature - check if other features depend on it
      const { newFeatures, removedDependents } = removeFeatureWithDependents(currentFeatures, featureId);
      
      if (removedDependents.length > 0) {
        const feature = getEngineById(featureId);
        toast.warning(`Cannot remove ${feature?.name || featureId}. Required by: ${removedDependents.join(', ')}`);
        return;
      }
      
      setFormData(prev => ({ ...prev, features: newFeatures }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Basic validation
      if (!formData.name || !formData.slug) {
        toast.error('Please fill in tenant name and slug');
        return;
      }

      if (!formData.features.includes('CMS_ENGINE')) {
        toast.error('CMS Engine is required and must be selected');
        return;
      }

      // Admin user validation based on mode
      if (formData.adminMode === 'create') {
        if (!formData.adminEmail || !formData.adminFirstName || !formData.adminLastName || !formData.adminPassword) {
          toast.error('Please fill in all admin user fields');
          return;
        }
      if (formData.adminPassword.length < 6) {
        toast.error('Admin password must be at least 6 characters long');
        return;
      }
      } else if (formData.adminMode === 'select') {
        if (!formData.selectedUserId) {
          toast.error('Please select an existing user');
          return;
        }
      }

      // Prepare tenant data
      const tenantData = {
        name: formData.name.trim(),
        slug: formData.slug.trim(),
        domain: formData.domain.trim() || undefined,
        features: formData.features,
      };

      // Add admin user data based on mode
      const createData = formData.adminMode === 'create' 
        ? {
            ...tenantData,
            adminEmail: formData.adminEmail,
            adminFirstName: formData.adminFirstName,
            adminLastName: formData.adminLastName,
            adminPassword: formData.adminPassword,
            settings: {
              adminEmail: formData.adminEmail,
              adminFirstName: formData.adminFirstName,
              adminLastName: formData.adminLastName,
              adminPassword: formData.adminPassword
            }
          }
        : {
            ...tenantData,
            settings: {
              existingUser: true,
              selectedUserId: formData.selectedUserId
            }
          };

      console.log('Creating tenant with data:', createData);
      console.log('Admin mode:', formData.adminMode);
      console.log('Selected user ID:', formData.selectedUserId);
      console.log('Settings object:', createData.settings);

      // Show immediate feedback
      toast.success('Creating tenant...');
      
      const result = await SuperAdminClient.createTenant(createData);

      console.log('Create result:', result);

      if (result.success) {
        toast.dismiss();
        const message = result.adminUser 
          ? `Tenant created successfully with admin user: ${result.adminUser.email}!`
          : 'Tenant created successfully!';
        toast.success(message);
        router.push('/super-admin/tenants/list');
      } else {
        toast.dismiss();
        toast.error(result.message || 'Failed to create tenant');
      }
    } catch (error) {
      console.error('Create tenant error:', error);
      toast.error('Failed to create tenant');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => router.back()}
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-100">
              🏢 Create New Tenant
            </h1>
            <p className="text-gray-400 mt-1">
              Set up a new tenant with admin user and features
            </p>
            <div className="flex items-center mt-2 space-x-2">
              <div className="w-2 h-2 rounded-full bg-blue-500"></div>
              <span className="text-xs font-medium text-blue-400">
                Step 1 of 1: Configuration
              </span>
            </div>
          </div>
        </div>
        {loading && (
          <div className="flex items-center space-x-2 px-3 py-1 bg-blue-900/50 border border-blue-700 rounded-full">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-400"></div>
            <span className="text-sm text-blue-300 font-medium">
              Creating tenant...
            </span>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <HomeIcon className="h-5 w-5 mr-2 text-blue-400" />
              Basic Information
            </CardTitle>
            <CardDescription>
              Configure the basic tenant settings and identification
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Tenant Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="e.g., Acme Corporation"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="slug">Slug *</Label>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) => handleInputChange('slug', e.target.value)}
                  placeholder="e.g., acme-corp"
                  required
                />
                <p className="text-xs text-gray-400">
                  Used in URLs and must be unique
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="domain">Custom Domain</Label>
                <Input
                  id="domain"
                  value={formData.domain}
                  onChange={(e) => handleInputChange('domain', e.target.value)}
                  placeholder="e.g., acme.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={formData.status} onValueChange={(value) => handleInputChange('status', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TENANT_STATUSES.map(status => (
                      <SelectItem key={status.value} value={status.value}>
                        {status.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Brief description of the tenant organization..."
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <UserIcon className="h-5 w-5 mr-2 text-green-400" />
              Admin User
            </CardTitle>
            <CardDescription>
              Choose how to set up the admin user for this tenant
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-4 p-4 border border-gray-700 rounded-lg bg-gray-800/50">
              <div className="flex items-center space-x-2">
                <Button
                  type="button"
                  variant={formData.adminMode === 'create' ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => handleAdminModeChange('create')}
                  className="flex items-center space-x-2"
                >
                  <UserPlusIcon className="h-4 w-4" />
                  <span>Create New User</span>
                </Button>
                <Button
                  type="button"
                  variant={formData.adminMode === 'select' ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => handleAdminModeChange('select')}
                  className="flex items-center space-x-2"
                >
                  <UserCheckIcon className="h-4 w-4" />
                  <span>Select Existing User</span>
                </Button>
              </div>
            </div>

            {formData.adminMode === 'create' && (
              <div className="space-y-4 p-4 border border-green-700/50 rounded-lg bg-green-900/10">
                <div className="flex items-center space-x-2 mb-3">
                  <UserPlusIcon className="h-4 w-4 text-green-400" />
                  <span className="text-sm font-medium text-green-400">Creating New Admin User</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="adminFirstName">First Name *</Label>
                    <Input
                      id="adminFirstName"
                      value={formData.adminFirstName}
                      onChange={(e) => handleInputChange('adminFirstName', e.target.value)}
                      placeholder="John"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="adminLastName">Last Name *</Label>
                    <Input
                      id="adminLastName"
                      value={formData.adminLastName}
                      onChange={(e) => handleInputChange('adminLastName', e.target.value)}
                      placeholder="Doe"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="adminEmail">Email *</Label>
                    <Input
                      id="adminEmail"
                      type="email"
                      value={formData.adminEmail}
                      onChange={(e) => handleInputChange('adminEmail', e.target.value)}
                      placeholder="admin@acme.com"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="adminPassword">Password *</Label>
                    <Input
                      id="adminPassword"
                      type="password"
                      value={formData.adminPassword}
                      onChange={(e) => handleInputChange('adminPassword', e.target.value)}
                      placeholder="Secure password (min 6 chars)"
                      required
                    />
                    <p className="text-xs text-gray-400">
                      Password must be at least 6 characters long
                    </p>
                  </div>
                </div>
              </div>
            )}

            {formData.adminMode === 'select' && (
              <div className="space-y-4 p-4 border border-blue-700/50 rounded-lg bg-blue-900/10">
                <div className="flex items-center space-x-2 mb-3">
                  <UserCheckIcon className="h-4 w-4 text-blue-400" />
                  <span className="text-sm font-medium text-blue-400">Selecting Existing User</span>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="userSearch">Search Users</Label>
                  <div className="relative">
                    <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="userSearch"
                      value={userSearchTerm}
                      onChange={(e) => setUserSearchTerm(e.target.value)}
                      placeholder="Search by name or email..."
                      className="pl-10"
                    />
                  </div>
                </div>

                {loadingUsers ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin h-6 w-6 border-2 border-blue-500 rounded-full border-t-transparent"></div>
                    <span className="ml-2 text-gray-400">Loading users...</span>
                  </div>
                ) : (
                  <div className="max-h-64 overflow-y-auto border border-gray-700 rounded-lg">
                    {filteredUsers.length === 0 ? (
                      <div className="p-4 text-center text-gray-400">
                        {userSearchTerm ? 'No users found matching your search' : 'No users available'}
                      </div>
                    ) : (
                      <div className="space-y-1 p-2">
                        {filteredUsers.map((user) => (
                          <div
                            key={user.id}
                            className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                              formData.selectedUserId === user.id
                                ? 'border-blue-500 bg-blue-900/30'
                                : 'border-gray-700 hover:border-gray-600 hover:bg-gray-800/50'
                            }`}
                            onClick={() => handleUserSelect(user)}
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium text-gray-100">
                                  {user.firstName} {user.lastName}
                                </p>
                                <p className="text-sm text-gray-400">{user.email}</p>
                                {user.phoneNumber && (
                                  <p className="text-xs text-gray-500">{user.phoneNumber}</p>
                                )}
                              </div>
                              <div className="text-right">
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-700 text-gray-300">
                                  {user.role.name}
                                </span>
                                {formData.selectedUserId === user.id && (
                                  <div className="mt-1">
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-600 text-blue-100">
                                      ✓ Selected
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {formData.selectedUserId && (
                  <div className="p-3 bg-blue-900/30 border border-blue-700 rounded-lg">
                    <p className="text-sm text-blue-300">
                      <strong>Selected user:</strong> {formData.adminFirstName} {formData.adminLastName} ({formData.adminEmail})
                    </p>
                    <p className="text-xs text-blue-400 mt-1">
                      This user will be assigned as the admin for the new tenant.
                    </p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <PackageIcon className="h-5 w-5 mr-2 text-purple-400" />
              Features & Modules
            </CardTitle>
            <CardDescription>
              Select the features and modules to enable for this tenant
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {AVAILABLE_FEATURES.map(feature => {
                const isSelected = formData.features.includes(feature.id);
                const isRequired = feature.required;
                const hasSelectedDependents = AVAILABLE_FEATURES.some(f => 
                  f.dependencies?.includes(feature.id) && formData.features.includes(f.id)
                );
                const isDisabled = isRequired || hasSelectedDependents;
                
                return (
                  <div key={feature.id} className={`flex items-start space-x-3 p-3 border rounded-lg transition-all duration-200 ${
                    isDisabled ? 'bg-gray-800/50 border-gray-600' : 'border-gray-700 hover:border-blue-500 hover:bg-gray-800/30'
                  }`}>
                    <Checkbox
                      id={feature.id}
                      checked={isSelected}
                      onCheckedChange={(checked) => handleFeatureToggle(feature.id, checked as boolean)}
                      disabled={isDisabled}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Label htmlFor={feature.id} className="font-medium text-gray-200">
                          {feature.name}
                        </Label>
                        <span className={`px-2 py-0.5 rounded-full text-xs ${
                          feature.category === 'Engine' 
                            ? 'bg-blue-600 text-blue-100' 
                            : 'bg-green-600 text-green-100'
                        }`}>
                          {feature.category}
                        </span>
                      </div>
                      <p className="text-sm text-gray-400 mt-1">
                        {feature.description}
                      </p>
                      {feature.dependencies && feature.dependencies.length > 0 && (
                        <p className="text-xs text-gray-500 mt-1">
                          Requires: {feature.dependencies.map(dep => 
                            getEngineById(dep)?.name || dep
                          ).join(', ')}
                        </p>
                      )}
                      {isRequired && (
                        <p className="text-xs text-blue-400 mt-1 font-medium">
                          ✓ Required
                        </p>
                      )}
                      {hasSelectedDependents && !isRequired && (
                        <p className="text-xs text-amber-400 mt-1 font-medium">
                          ⚠ Required by selected features
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            
            <div className="mt-4 p-3 bg-blue-900/20 border border-blue-700 rounded-lg">
              <p className="text-xs text-blue-300 font-medium mb-1">
                💡 Feature Selection Tips:
              </p>
              <ul className="text-xs text-blue-200 space-y-1">
                <li>• CMS Engine is required for all tenants</li>
                <li>• Dependencies are automatically added when selecting features</li>
                <li>• Features with dependents cannot be removed</li>
                <li>• You can modify features later in tenant settings</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center justify-between pt-4 border-t border-gray-700">
          <div className="text-sm text-gray-400">
            {formData.features.length} feature{formData.features.length !== 1 ? 's' : ''} selected
          </div>
          <div className="flex items-center space-x-4">
            <Button 
              type="button" 
              variant="outline"
              onClick={() => router.back()}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              variant="success"
              disabled={loading}
              className="min-w-[140px]"
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="animate-spin h-4 w-4 border-2 border-white rounded-full border-t-transparent mr-2"></div>
                  Creating...
                </div>
              ) : (
                <>
                  <SaveIcon className="h-4 w-4 mr-2" />
                  Create Tenant
                </>
              )}
            </Button>
          </div>
        </div>
      </form>
      </div>
    </div>
  );
} 