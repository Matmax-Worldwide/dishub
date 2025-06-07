'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { Checkbox } from '@/app/components/ui/checkbox';
import { Badge } from '@/app/components/ui/badge';

import { 
  ArrowLeftIcon, 
  SaveIcon, 
  LoaderIcon,
  BuildingIcon,
  UsersIcon,
  SettingsIcon,
  AlertCircleIcon,
  PlusIcon,
  UserPlusIcon,

} from 'lucide-react';
import Link from 'next/link';
import { SuperAdminClient, type TenantDetails } from '@/lib/graphql/superAdmin';
import  graphqlClient, { gqlRequest }  from '@/lib/graphql-client';
import { toast } from 'sonner';

const AVAILABLE_FEATURES = [
  { id: 'CMS_ENGINE', name: 'CMS Engine', description: 'Core content management system' },
  { id: 'BLOG_MODULE', name: 'Blog Module', description: 'Blog and article management' },
  { id: 'FORMS_MODULE', name: 'Forms Module', description: 'Form builder and submissions' },
  { id: 'BOOKING_ENGINE', name: 'Booking Engine', description: 'Appointment and booking system' },
  { id: 'ECOMMERCE_ENGINE', name: 'E-commerce Engine', description: 'Online store and payments' },
];

const STATUS_OPTIONS = [
  { value: 'ACTIVE', label: 'Active', color: 'green' },
  { value: 'PENDING', label: 'Pending', color: 'yellow' },
  { value: 'SUSPENDED', label: 'Suspended', color: 'red' },
  { value: 'ARCHIVED', label: 'Archived', color: 'gray' }
];

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  userTenants?: {
    tenantId: string;
    role: string;
    tenant: {
      id: string;
      name: string;
      slug: string;
    };
  }[];
  role: {
    id: string;
    name: string;
    description?: string;
  };
  createdAt: string;
}

export default function EditTenantPage() {
  const params = useParams();
  const router = useRouter();
  const tenantId = params.id as string;

  const [tenant, setTenant] = useState<TenantDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    domain: '',
    status: 'ACTIVE',
    features: ['CMS_ENGINE'] as string[]
  });

  // Admin user management state
  const [currentAdminUser, setCurrentAdminUser] = useState<User | null>(null);
  const [selectedAdminUser, setSelectedAdminUser] = useState<User | null>(null);
  const [creatingUser, setCreatingUser] = useState(false);
  const [loadingAdmin, setLoadingAdmin] = useState(false);

  // New user form state
  const [newUserForm, setNewUserForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    password: '',
    confirmPassword: ''
  });

  const loadTenant = async () => {
    try {
      setLoading(true);
      const tenantData = await SuperAdminClient.getTenantById(tenantId);
      
      if (tenantData) {
        setTenant(tenantData);
        // Ensure CMS_ENGINE is always included
        const features = tenantData.features.includes('CMS_ENGINE') 
          ? tenantData.features 
          : ['CMS_ENGINE', ...tenantData.features];

        // Handle legacy status values
        let normalizedStatus = tenantData.status;
        if (normalizedStatus === 'INACTIVE') {
          normalizedStatus = 'ARCHIVED';
        }

        setFormData({
          name: tenantData.name,
          slug: tenantData.slug,
          domain: tenantData.domain || '',
          status: normalizedStatus,
          features: features
        });
      }
    } catch (error) {
      console.error('Error loading tenant:', error);
      toast.error('Failed to load tenant details');
    } finally {
      setLoading(false);
    }
    };

  const loadCurrentAdmin = async () => {
    if (!tenantId) return;
    
    try {
      setLoadingAdmin(true);
      // Query to get tenant members (users with tenant relationships)
      const query = `
        query GetTenantMembers($tenantId: ID!) {
          tenantMembers(tenantId: $tenantId) {
            user {
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
            role
            tenantId
          }
        }
      `;
      
      const response = await gqlRequest<{ tenantMembers: { user: User; role: string; tenantId: string }[] }>(query, { tenantId });
      
      if (response && response.tenantMembers) {
        // Find admin user from tenant members
        const adminMember = response.tenantMembers.find(member => 
          member.role === 'OWNER' || member.role === 'ADMIN'
        );
        setCurrentAdminUser(adminMember?.user || null);
      }
    } catch (error) {
      console.error('Error loading current admin:', error);
      setCurrentAdminUser(null);
    } finally {
      setLoadingAdmin(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleFeatureToggle = (featureId: string) => {
    // Prevent disabling CMS_ENGINE
    if (featureId === 'CMS_ENGINE' && formData.features.includes(featureId)) {
      toast.error('CMS Engine is required and cannot be disabled');
      return;
    }

    setFormData(prev => ({
      ...prev,
      features: prev.features.includes(featureId)
        ? prev.features.filter(f => f !== featureId)
        : [...prev.features, featureId]
    }));
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  const handleNameChange = (name: string) => {
    handleInputChange('name', name);
    if (!formData.slug || formData.slug === generateSlug(tenant?.name || '')) {
      handleInputChange('slug', generateSlug(name));
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
      
      // Set as the selected admin user
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

    } catch (error) {
      console.error('Error creating user:', error);
      toast.error(`Failed to create user: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setCreatingUser(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      // Validation
      if (!formData.name.trim()) {
        toast.error('Tenant name is required');
        return;
      }
      if (!formData.slug.trim()) {
        toast.error('Tenant slug is required');
        return;
      }
      
      // Ensure CMS_ENGINE is included
      if (!formData.features.includes('CMS_ENGINE')) {
        toast.error('CMS Engine is required and must be selected');
        return;
      }

      if (formData.features.length === 0) {
        toast.error('At least one feature must be selected');
        return;
      }

      // Normalize status value (handle legacy values)
      let normalizedStatus = formData.status;
      if (normalizedStatus === 'INACTIVE') {
        normalizedStatus = 'ARCHIVED';
      }

      // Optimistic UI: Update tenant state immediately
      const previousTenant = tenant;
      const optimisticTenant: TenantDetails = {
        ...tenant!,
        name: formData.name.trim(),
        slug: formData.slug.trim(),
        domain: formData.domain.trim() || undefined,
        status: normalizedStatus,
        features: formData.features,
        updatedAt: new Date().toISOString()
      };
      
      setTenant(optimisticTenant);
      toast.success('Tenant updated successfully');

      console.log('Updating tenant with data:', {
        id: tenantId,
        input: {
          name: formData.name.trim(),
          slug: formData.slug.trim(),
          domain: formData.domain.trim() || undefined,
          status: normalizedStatus,
          features: formData.features
        }
      });

      // Make the actual API call in the background
      const result = await SuperAdminClient.updateTenant(tenantId, {
        name: formData.name.trim(),
        slug: formData.slug.trim(),
        domain: formData.domain.trim() || undefined,
        status: normalizedStatus,
        features: formData.features
      });

      console.log('Update result:', result);

      if (!result.success) {
        // Revert optimistic update on failure
        setTenant(previousTenant);
        toast.dismiss();
        toast.error(result.message || 'Failed to update tenant');
      } else {
        // Update with actual server response if available
        if (result.tenant) {
          setTenant(result.tenant);
        }

        // Assign admin user if selected
        if (selectedAdminUser) {
          try {
            const assignResult = await SuperAdminClient.assignTenantAdmin(tenantId, selectedAdminUser.id);
            if (assignResult.success) {
              toast.success(`Admin user assigned successfully: ${selectedAdminUser.firstName} ${selectedAdminUser.lastName}`);
            } else {
              toast.error(`Failed to assign admin user: ${assignResult.message}`);
            }
          } catch (error) {
            console.error('Error assigning admin user:', error);
            toast.error('Failed to assign admin user');
          }
        }
      }
    } catch (error) {
      console.error('Error updating tenant:', error);
      // Revert optimistic update on error
      if (tenant) {
        await loadTenant();
      }
      toast.dismiss();
      toast.error('Failed to update tenant');
    } finally {
      setSaving(false);
    }
  };

 

  useEffect(() => {
    if (tenantId) {
      loadTenant();
      loadCurrentAdmin();
    }
  }, [tenantId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading tenant details...</p>
        </div>
      </div>
    );
  }

  if (!tenant) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertCircleIcon className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Tenant Not Found</h2>
          <p className="text-gray-600 mb-4">The requested tenant could not be found.</p>
          <Link href="/super-admin/tenants/list">
            <Button>
              <ArrowLeftIcon className="h-4 w-4 mr-2" />
              Back to Tenants
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/super-admin/tenants/list">
            <Button variant="ghost" size="sm">
              <ArrowLeftIcon className="h-4 w-4 mr-2" />
              Back to Tenants
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Edit Tenant</h1>
            <p className="text-gray-600">Modify tenant settings and configuration</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline" onClick={() => router.push('/super-admin/tenants/list')}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <LoaderIcon className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <SaveIcon className="h-4 w-4 mr-2" />
            )}
            Save Changes
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BuildingIcon className="h-5 w-5 mr-2" />
                Basic Information
              </CardTitle>
              <CardDescription>
                Update the basic details of the tenant
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Tenant Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="Enter tenant name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="slug">Slug *</Label>
                  <Input
                    id="slug"
                    value={formData.slug}
                    onChange={(e) => handleInputChange('slug', e.target.value)}
                    placeholder="tenant-slug"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="domain">Custom Domain</Label>
                  <Input
                    id="domain"
                    value={formData.domain}
                    onChange={(e) => handleInputChange('domain', e.target.value)}
                    placeholder="example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select value={formData.status} onValueChange={(value) => handleInputChange('status', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUS_OPTIONS.map((status) => (
                        <SelectItem key={status.value} value={status.value}>
                          {status.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Current Admin User */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <UsersIcon className="h-5 w-5 mr-2" />
                Current Admin User
              </CardTitle>
              <CardDescription>
                The user currently assigned as administrator for this tenant
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {loadingAdmin ? (
                <div className="flex items-center justify-center py-8">
                  <LoaderIcon className="h-6 w-6 animate-spin text-gray-400" />
                  <span className="ml-2 text-gray-600">Loading admin user...</span>
                </div>
              ) : currentAdminUser ? (
                <div className="p-4 border rounded-lg bg-green-50 border-green-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-green-900">
                        {currentAdminUser.firstName} {currentAdminUser.lastName}
                      </h4>
                      <p className="text-sm text-green-700">{currentAdminUser.email}</p>
                      {currentAdminUser.phoneNumber && (
                        <p className="text-sm text-green-600">{currentAdminUser.phoneNumber}</p>
                      )}
                      <Badge className="mt-1 bg-green-100 text-green-800">
                        {currentAdminUser.role.name}
                      </Badge>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          toast.info('Admin user management coming soon');
                        }}
                      >
                        Manage
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-4 border rounded-lg bg-blue-50 border-blue-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-blue-900">No admin user assigned</h4>
                      <p className="text-sm text-blue-700">This tenant does not have an admin user assigned yet</p>
                      <Badge variant="outline" className="mt-1 border-blue-300 text-blue-800">
                        No Admin
                      </Badge>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled
                      >
                        Not Available
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Create New Admin User */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <UserPlusIcon className="h-5 w-5 mr-2" />
                Create New Admin User
              </CardTitle>
              <CardDescription>
                Create a new user who will be the administrator for this tenant
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {selectedAdminUser ? (
                <div className="p-4 border rounded-lg bg-green-50 border-green-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-green-900">
                        {selectedAdminUser.firstName} {selectedAdminUser.lastName}
                      </h4>
                      <p className="text-sm text-green-700">{selectedAdminUser.email}</p>
                      <Badge className="mt-1 bg-green-100 text-green-800">
                        {selectedAdminUser.role.name}
                      </Badge>
                      <p className="text-xs text-green-600 mt-1">✅ User created successfully</p>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedAdminUser(null)}
                      >
                        Create Another
                      </Button>
                      <Button
                        size="sm"
                        onClick={async () => {
                          try {
                            const assignResult = await SuperAdminClient.assignTenantAdmin(tenantId, selectedAdminUser.id);
                            if (assignResult.success) {
                              toast.success(`Admin user assigned successfully!`);
                            } else {
                              toast.error(`Failed to assign admin user: ${assignResult.message}`);
                            }
                          } catch (error) {
                            console.error('Error assigning admin user:', error);
                            toast.error('Failed to assign admin user');
                          }
                        }}
                      >
                        Assign Now
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="adminFirstName">First Name *</Label>
                      <Input
                        id="adminFirstName"
                        value={newUserForm.firstName}
                        onChange={(e) => setNewUserForm(prev => ({ ...prev, firstName: e.target.value }))}
                        placeholder="John"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="adminLastName">Last Name *</Label>
                      <Input
                        id="adminLastName"
                        value={newUserForm.lastName}
                        onChange={(e) => setNewUserForm(prev => ({ ...prev, lastName: e.target.value }))}
                        placeholder="Doe"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="adminEmail">Email *</Label>
                      <Input
                        id="adminEmail"
                        type="email"
                        value={newUserForm.email}
                        onChange={(e) => setNewUserForm(prev => ({ ...prev, email: e.target.value }))}
                        placeholder="admin@example.com"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="adminPassword">Password *</Label>
                      <Input
                        id="adminPassword"
                        type="password"
                        value={newUserForm.password}
                        onChange={(e) => setNewUserForm(prev => ({ ...prev, password: e.target.value }))}
                        placeholder="Secure password"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="adminPhone">Phone Number</Label>
                    <Input
                      id="adminPhone"
                      value={newUserForm.phoneNumber}
                      onChange={(e) => setNewUserForm(prev => ({ ...prev, phoneNumber: e.target.value }))}
                      placeholder="+1 (555) 123-4567"
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
                    <Button onClick={handleCreateUser} disabled={creatingUser}>
                      {creatingUser ? (
                        <LoaderIcon className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <PlusIcon className="h-4 w-4 mr-2" />
                      )}
                      Create Admin User
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Features */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <SettingsIcon className="h-5 w-5 mr-2" />
                Features & Modules
              </CardTitle>
              <CardDescription>
                Select the features and modules available to this tenant
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {AVAILABLE_FEATURES.map(feature => (
                  <div key={feature.id} className="flex items-start space-x-3 p-3 border rounded-lg">
                    <Checkbox
                      id={feature.id}
                      checked={formData.features.includes(feature.id)}
                      onCheckedChange={() => handleFeatureToggle(feature.id)}
                      disabled={feature.id === 'CMS_ENGINE'}
                    />
                    <div className="flex-1">
                      <Label htmlFor={feature.id} className="font-medium">
                        {feature.name}
                      </Label>
                      <p className="text-sm text-gray-500 mt-1">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-4">
                * CMS Engine is required and cannot be disabled
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Current Status */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Current Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Status:</span>
                <Badge className={
                  formData.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                  formData.status === 'INACTIVE' ? 'bg-gray-100 text-gray-800' :
                  formData.status === 'SUSPENDED' ? 'bg-red-100 text-red-800' :
                  'bg-yellow-100 text-yellow-800'
                }>
                  {formData.status}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Features:</span>
                <span className="text-sm text-gray-600">{formData.features.length} selected</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Admin User:</span>
                <span className="text-sm text-gray-600">
                  {selectedAdminUser ? 'Selected' : 'Not set'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Created:</span>
                <span className="text-sm text-gray-600">
                  {new Date(tenant.createdAt).toLocaleDateString()}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Last Updated:</span>
                <span className="text-sm text-gray-600">
                  {new Date(tenant.updatedAt).toLocaleDateString()}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Statistics */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <UsersIcon className="h-4 w-4 mr-2" />
                Statistics
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Total Users:</span>
                <span className="text-sm font-semibold">{tenant.userCount}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Total Pages:</span>
                <span className="text-sm font-semibold">{tenant.pageCount}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Total Posts:</span>
                <span className="text-sm font-semibold">{tenant.postCount}</span>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link href={`/super-admin/tenants/settings/${tenantId}`}>
                <Button variant="outline" className="w-full justify-start">
                  <SettingsIcon className="h-4 w-4 mr-2" />
                  Advanced Settings
                </Button>
              </Link>
              <Link href={`/super-admin/tenants/impersonate?tenant=${tenant.slug}`}>
                <Button variant="outline" className="w-full justify-start">
                  <UsersIcon className="h-4 w-4 mr-2" />
                  Impersonate Tenant
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}