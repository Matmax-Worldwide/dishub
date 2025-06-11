'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { SuperAdminClient } from '@/lib/graphql/superAdmin';

import { 
  ArrowLeftIcon, 
  SaveIcon, 
  LoaderIcon,
  BuildingIcon,
  UsersIcon,
  SettingsIcon,
  AlertCircleIcon,
  UserPlusIcon,
  SearchIcon,
  XIcon,
  CheckIcon,
  BarChart3Icon,
  EyeIcon,
} from 'lucide-react';
import Link from 'next/link';
import graphqlClient, { type User, type UserTenant } from '@/lib/graphql-client';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';

const AVAILABLE_FEATURES = [
  { id: 'CMS_ENGINE', name: 'CMS Engine', description: 'Core content management system', required: true },
  { id: 'BLOG_MODULE', name: 'Blog Module', description: 'Blog and article management', required: false },
  { id: 'FORMS_MODULE', name: 'Forms Module', description: 'Form builder and submissions', required: false },
  { id: 'BOOKING_ENGINE', name: 'Booking Engine', description: 'Appointment and booking system', required: false },
  { id: 'ECOMMERCE_ENGINE', name: 'E-commerce Engine', description: 'Online store and payments', required: false },
  { id: 'LEGAL_ENGINE', name: 'Legal Engine', description: 'Company incorporation and legal services', required: false },
  { id: 'INTERPRETATION_ENGINE', name: 'Interpretation Engine', description: 'AI-powered translation and interpretation services', required: false },
];

const STATUS_OPTIONS = [
  { value: 'ACTIVE', label: 'Active', color: 'green' },
  { value: 'PENDING', label: 'Pending', color: 'yellow' },
  { value: 'SUSPENDED', label: 'Suspended', color: 'red' },
  { value: 'ARCHIVED', label: 'Archived', color: 'gray' }
];

// Custom Switch Component
const Switch = ({ 
  checked, 
  onCheckedChange, 
  disabled = false,
  id 
}: { 
  checked: boolean; 
  onCheckedChange: (checked: boolean) => void; 
  disabled?: boolean;
  id?: string;
}) => {
  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onCheckedChange(!checked)}
      className={`
        relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transform hover:scale-105
        ${checked 
          ? 'bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700 shadow-lg shadow-blue-500/25' 
          : 'bg-gradient-to-r from-gray-200 to-gray-300 hover:from-gray-300 hover:to-gray-400'
        }
        ${disabled ? 'opacity-50 cursor-not-allowed transform-none' : 'cursor-pointer'}
      `}
    >
      <span
        className={`
          inline-block h-4 w-4 transform rounded-full bg-white shadow-lg transition-all duration-300 ease-in-out
          ${checked ? 'translate-x-6 shadow-blue-500/20' : 'translate-x-1'}
          ${!disabled && 'hover:shadow-xl'}
        `}
      >
        {/* Inner dot for visual enhancement */}
        <span 
          className={`
            absolute inset-0.5 rounded-full transition-all duration-300
            ${checked 
              ? 'bg-gradient-to-br from-blue-100 to-blue-200' 
              : 'bg-gradient-to-br from-gray-50 to-gray-100'
            }
          `}
        />
      </span>
      
      {/* Glow effect when active */}
      {checked && !disabled && (
        <span className="absolute inset-0 rounded-full bg-blue-400 opacity-20 blur-sm animate-pulse" />
      )}
    </button>
  );
};

export default function EditTenantPage() {
  const params = useParams();
  const router = useRouter();
  const tenantId = params.id as string;
  const { user: currentUser } = useAuth();

  const [tenant, setTenant] = useState<{
    id: string;
    name: string;
    slug: string;
    domain?: string;
    status: string;
    planId?: string;
    features: string[];
    userCount: number;
    pageCount: number;
    postCount: number;
    createdAt: string;
    updatedAt: string;
  } | null>(null);
  const [detailedMetrics, setDetailedMetrics] = useState<{
    tenantId: string;
    tenantName: string;
    lastActivity: string;
    metrics: {
      totalUsers: number;
      activeUsers: number;
      totalPages: number;
      publishedPages: number;
      totalPosts: number;
      publishedPosts: number;
      features: string[];
      modules: Array<{
        moduleName: string;
        isActive: boolean;
        itemCount: number;
        last30DaysActivity: number;
      }>;
    };
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // User management states
  const [tenantUsers, setTenantUsers] = useState<User[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingTenantUsers, setLoadingTenantUsers] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const [userModalMode, setUserModalMode] = useState<'create' | 'select'>('create');
  const [searchQuery, setSearchQuery] = useState('');
  const [newUserForm, setNewUserForm] = useState({
    email: '',
    firstName: '',
    lastName: '',
    phoneNumber: '',
    password: '',
    role: 'TenantUser'
  });

  // Form validation states
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isFormValid, setIsFormValid] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    domain: '',
    status: 'ACTIVE',
    features: ['CMS_ENGINE']
  });

  // Change detection states
  const [originalFormData, setOriginalFormData] = useState({
    name: '',
    slug: '',
    domain: '',
    status: 'ACTIVE',
    features: ['CMS_ENGINE']
  });
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showExitConfirmation, setShowExitConfirmation] = useState(false);

  const loadTenant = async () => {
    try {
      setLoading(true);
      setLoadingTenantUsers(true);
      
      console.log('Loading tenant data for tenantId:', tenantId);
      console.log('Current user:', currentUser);
      
      // Load tenant data and tenant users in parallel
      const [tenantData, usersData] = await Promise.all([
        graphqlClient.getTenantById(tenantId),
        graphqlClient.getTenantUsers(tenantId).catch(error => {
          console.error('Error loading tenant users:', error);
          return [];
        })
      ]);
      
      if (tenantData) {
        setTenant(tenantData);
        
        // Create simple metrics from tenant data
        setDetailedMetrics({
          tenantId: tenantData.id,
          tenantName: tenantData.name,
          lastActivity: tenantData.updatedAt,
          metrics: {
            totalUsers: tenantData.userCount || 0,
            activeUsers: tenantData.userCount || 0,
            totalPages: tenantData.pageCount || 0,
            publishedPages: tenantData.pageCount || 0,
            totalPosts: tenantData.postCount || 0,
            publishedPosts: tenantData.postCount || 0,
            features: tenantData.features,
            modules: []
          }
        });
        
        // Set tenant users from the separate query
        setTenantUsers(usersData || []);
        
        // Ensure CMS_ENGINE is always included
        const features = tenantData.features.includes('CMS_ENGINE') 
          ? tenantData.features 
          : ['CMS_ENGINE', ...tenantData.features];

        // Handle legacy status values
        let normalizedStatus = tenantData.status;
        if (normalizedStatus === 'INACTIVE') {
          normalizedStatus = 'ARCHIVED';
        }

        const newFormData = {
          name: tenantData.name,
          slug: tenantData.slug,
          domain: tenantData.domain || '',
          status: normalizedStatus,
          features: features
        };
        
        setFormData(newFormData);
        setOriginalFormData(newFormData); // Store original data for comparison
        validateForm(newFormData);
      } else {
        toast.error('Tenant not found');
      }
    } catch (error) {
      console.error('Error loading tenant:', error);
      toast.error('Failed to load tenant details. Please try again.');
    } finally {
      setLoading(false);
      setLoadingTenantUsers(false);
    }
  };

  // Check if form has unsaved changes
  const checkForChanges = useCallback((currentData = formData) => {
    // Deep comparison for arrays (features)
    const featuresChanged = JSON.stringify([...currentData.features].sort()) !== JSON.stringify([...originalFormData.features].sort());
    
    // Simple comparison for other fields
    const basicFieldsChanged = 
      currentData.name.trim() !== originalFormData.name.trim() ||
      currentData.slug.trim() !== originalFormData.slug.trim() ||
      currentData.domain.trim() !== originalFormData.domain.trim() ||
      currentData.status !== originalFormData.status;
    
    const hasChanges = basicFieldsChanged || featuresChanged;
    setHasUnsavedChanges(hasChanges);
    return hasChanges;
  }, [formData, originalFormData]);

  const validateForm = (data = formData) => {
    const errors: Record<string, string> = {};
    
    if (!data.name.trim()) {
      errors.name = 'Tenant name is required';
    } else if (data.name.trim().length < 2) {
      errors.name = 'Tenant name must be at least 2 characters';
    }
    
    if (!data.slug.trim()) {
      errors.slug = 'Tenant slug is required';
    } else if (!/^[a-z0-9-]+$/.test(data.slug)) {
      errors.slug = 'Slug can only contain lowercase letters, numbers, and hyphens';
    }
    
    if (data.domain && !/^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(data.domain)) {
      errors.domain = 'Please enter a valid domain';
    }
    
    if (!data.features.includes('CMS_ENGINE')) {
      errors.features = 'CMS Engine is required and cannot be disabled';
    }
    
    if (data.features.length === 0) {
      errors.features = 'At least one feature must be selected';
    }
    
    setFormErrors(errors);
    setIsFormValid(Object.keys(errors).length === 0);
    
    // Check for changes whenever validation runs
    checkForChanges(data);
    
    return Object.keys(errors).length === 0;
  };

  const loadUsers = async () => {
    try {
      setLoadingUsers(true);
      const usersData = await graphqlClient.getAllUsers(searchQuery, undefined, true);
      // Filter out users that are already assigned to this tenant
      const availableUsers = usersData.filter((user: User) => 
        !user.userTenants?.some((ut: UserTenant) => ut.tenantId === tenantId && ut.isActive)
      );
      setUsers(availableUsers);
    } catch (error) {
      console.error('Error loading users:', error);
      toast.error('Failed to load users');
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleCreateUser = async () => {
    if (!validateUserForm()) return;
    
    try {
      setSaving(true);
      
      const result = await graphqlClient.createUserAndAssignTenant({
        ...newUserForm,
        tenantId,
        tenantRole: newUserForm.role as 'TenantAdmin' | 'TenantManager' | 'TenantUser' | 'Employee'
      });

      if (result.success && result.user) {
        // Optimistic update
        setTenantUsers(prev => [...prev, result.user!]);
        setShowUserModal(false);
        resetUserForm();
        toast.success(`User ${result.user.firstName} ${result.user.lastName} created successfully`);
      } else {
        toast.error(result.message || 'Failed to create user');
      }
    } catch (error) {
      console.error('Error creating user:', error);
      toast.error('Failed to create user. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleAssignUser = async (userId: string) => {
    try {
      setSaving(true);
      
      const result = await graphqlClient.assignUserToTenant(tenantId, userId, 'TenantUser');
      
      if (result.success && result.userTenant) {
        // Find the user and add to tenant users (optimistic update)
        const user = users.find(u => u.id === userId);
        if (user) {
          setTenantUsers(prev => [...prev, user]);
          setUsers(prev => prev.filter(u => u.id !== userId));
        }
        setShowUserModal(false);
        toast.success(`User ${user?.firstName} ${user?.lastName} assigned successfully`);
      } else {
        toast.error(result.message || 'Failed to assign user');
      }
    } catch (error) {
      console.error('Error assigning user:', error);
      toast.error('Failed to assign user. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const validateUserForm = () => {
    if (!newUserForm.email.trim()) {
      toast.error('Email is required');
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newUserForm.email)) {
      toast.error('Please enter a valid email address');
      return false;
    }
    if (!newUserForm.firstName.trim()) {
      toast.error('First name is required');
      return false;
    }
    if (!newUserForm.lastName.trim()) {
      toast.error('Last name is required');
      return false;
    }
    if (!newUserForm.password || newUserForm.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return false;
    }
    return true;
  };

  const resetUserForm = () => {
    setNewUserForm({
      email: '',
      firstName: '',
      lastName: '',
      phoneNumber: '',
      password: '',
      role: 'TenantUser'
    });
  };

  const openUserModal = (mode: 'create' | 'select') => {
    setUserModalMode(mode);
    setShowUserModal(true);
    if (mode === 'select') {
      loadUsers();
    } else {
      resetUserForm();
    }
  };

  const handleInputChange = (field: string, value: string) => {
    const newFormData = {
      ...formData,
      [field]: value
    };
    setFormData(newFormData);
    validateForm(newFormData);
  };

  const handleFeatureToggle = (featureId: string) => {
    // Prevent disabling CMS_ENGINE
    if (featureId === 'CMS_ENGINE' && formData.features.includes(featureId)) {
      toast.error('CMS Engine is required and cannot be disabled');
      return;
    }

    const newFeatures = formData.features.includes(featureId)
      ? formData.features.filter(f => f !== featureId)
      : [...formData.features, featureId];
      
    const newFormData = {
      ...formData,
      features: newFeatures
    };
    
    setFormData(newFormData);
    validateForm(newFormData);
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

  // Handle navigation with unsaved changes check
  const handleNavigation = useCallback((destination: string) => {
    // Only show confirmation if there are actual unsaved changes
    if (hasUnsavedChanges) {
      setShowExitConfirmation(true);
      return false;
    }
    router.push(destination);
    return true;
  }, [hasUnsavedChanges, router]);

  // Handle browser back/refresh
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      // Only prevent unload if there are actual unsaved changes
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '¿Estás seguro de que quieres salir? Los cambios no guardados se perderán.';
        return e.returnValue;
      }
    };

    const handlePopState = () => {
      // Handle browser back button
      if (hasUnsavedChanges) {
        const confirmLeave = window.confirm('¿Estás seguro de que quieres salir? Los cambios no guardados se perderán.');
        if (!confirmLeave) {
          // Push current state back to prevent navigation
          window.history.pushState(null, '', window.location.href);
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('popstate', handlePopState);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('popstate', handlePopState);
    };
  }, [hasUnsavedChanges]);

  const handleSave = async () => {
    if (!validateForm()) {
      toast.error('Please fix the errors before saving');
      return;
    }
    
    try {
      setSaving(true);
      
      // Normalize status value (handle legacy values)
      let normalizedStatus = formData.status;
      if (normalizedStatus === 'INACTIVE') {
        normalizedStatus = 'ARCHIVED';
      }

      // Optimistic UI: Update tenant state immediately
      const previousTenant = tenant;
      const optimisticTenant = {
        ...tenant!,
        name: formData.name.trim(),
        slug: formData.slug.trim(),
        domain: formData.domain.trim() || undefined,
        status: normalizedStatus,
        features: formData.features,
        updatedAt: new Date().toISOString()
      };
      
      setTenant(optimisticTenant);
      
      // Show immediate feedback
      const loadingToast = toast.loading('Saving changes...');

      // Make the actual API call
      const result = await SuperAdminClient.updateTenant(tenantId, {
        name: formData.name.trim(),
        slug: formData.slug.trim(),
        domain: formData.domain.trim() || undefined,
        status: normalizedStatus,
        features: formData.features
      });

      toast.dismiss(loadingToast);

      if (result.success) {
        // Update with actual server response if available
        if (result.tenant) {
          setTenant(result.tenant);
        }
        // Update original data to reflect saved state
        setOriginalFormData(formData);
        setHasUnsavedChanges(false);
        toast.success('Tenant updated successfully');
      } else {
        // Revert optimistic update on failure
        setTenant(previousTenant);
        toast.error(result.message || 'Failed to update tenant');
      }
    } catch (error) {
      console.error('Error updating tenant:', error);
      // Revert optimistic update on error
      if (tenant) {
        await loadTenant();
      }
      toast.error('Failed to save changes. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    if (tenantId) {
      loadTenant();
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
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => handleNavigation('/super-admin/tenants/list')}
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Back to Tenants
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Edit Tenant</h1>
            <p className="text-gray-600">Modify tenant settings and configuration</p>
            {/* Form validation status indicator */}
            <div className="flex items-center mt-2 space-x-2">
              <div className={`w-2 h-2 rounded-full ${isFormValid ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className={`text-xs font-medium ${isFormValid ? 'text-green-600' : 'text-red-600'}`}>
                {isFormValid ? 'Form is valid' : 'Please fix errors to save'}
              </span>
              {Object.keys(formErrors).length > 0 && (
                <span className="text-xs text-gray-500">
                  ({Object.keys(formErrors).length} error{Object.keys(formErrors).length > 1 ? 's' : ''})
                </span>
              )}
              {hasUnsavedChanges && (
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></div>
                  <span className="text-xs font-medium text-amber-600">
                    Cambios sin guardar
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <Button 
            variant="outline" 
            onClick={() => handleNavigation('/super-admin/tenants/list')}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={saving || !isFormValid}
            className={!isFormValid ? 'opacity-50 cursor-not-allowed' : ''}
          >
            {saving ? (
              <>
                <LoaderIcon className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <SaveIcon className="h-4 w-4 mr-2" />
                Save Changes
                {hasUnsavedChanges && <span className="ml-1 text-xs">*</span>}
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Form */}
        <div className="lg:col-span-3 space-y-6">
          {/* Basic Information - Compact */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-base flex items-center">
                <BuildingIcon className="h-4 w-4 mr-2" />
                Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="name" className="text-sm">Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="Tenant name"
                    className={`h-9 ${formErrors.name ? 'border-red-500 focus:border-red-500' : ''}`}
                  />
                  {formErrors.name && (
                    <p className="text-xs text-red-600 flex items-center">
                      <span className="mr-1">⚠</span>
                      {formErrors.name}
                    </p>
                  )}
                </div>
                <div className="space-y-1">
                  <Label htmlFor="slug" className="text-sm">Slug *</Label>
                  <Input
                    id="slug"
                    value={formData.slug}
                    onChange={(e) => handleInputChange('slug', e.target.value)}
                    placeholder="tenant-slug"
                    className={`h-9 ${formErrors.slug ? 'border-red-500 focus:border-red-500' : ''}`}
                  />
                  {formErrors.slug && (
                    <p className="text-xs text-red-600 flex items-center">
                      <span className="mr-1">⚠</span>
                      {formErrors.slug}
                    </p>
                  )}
                </div>
                <div className="space-y-1">
                  <Label htmlFor="status" className="text-sm">Status</Label>
                  <Select value={formData.status} onValueChange={(value) => handleInputChange('status', value)}>
                    <SelectTrigger className="h-9">
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

              <div className="space-y-1">
                <Label htmlFor="domain" className="text-sm">Custom Domain</Label>
                <Input
                  id="domain"
                  value={formData.domain}
                  onChange={(e) => handleInputChange('domain', e.target.value)}
                  placeholder="example.com"
                  className={`h-9 ${formErrors.domain ? 'border-red-500 focus:border-red-500' : ''}`}
                />
                {formErrors.domain && (
                  <p className="text-xs text-red-600 flex items-center">
                    <span className="mr-1">⚠</span>
                    {formErrors.domain}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Features - Compact */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-base flex items-center">
                <SettingsIcon className="h-4 w-4 mr-2" />
                Features & Modules
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {AVAILABLE_FEATURES.map(feature => (
                  <div key={feature.id} className="flex items-center justify-between p-3 border rounded-lg hover:border-blue-200 hover:bg-blue-50/30 transition-all duration-200">
                    <div className="flex-1 mr-3">
                      <Label htmlFor={feature.id} className="text-sm font-medium leading-tight cursor-pointer block">
                        {feature.name.replace(' Engine', '').replace(' Module', '')}
                        {feature.required && <span className="text-red-500 ml-1">*</span>}
                      </Label>
                      <p className="text-xs text-gray-500 mt-1 leading-tight">
                        {feature.description}
                      </p>
                    </div>
                    <Switch
                      checked={formData.features.includes(feature.id)}
                      onCheckedChange={() => handleFeatureToggle(feature.id)}
                      disabled={feature.id === 'CMS_ENGINE'}
                      id={feature.id}
                    />
                  </div>
                ))}
              </div>
              {formErrors.features && (
                <p className="text-xs text-red-600 flex items-center mt-3">
                  <span className="mr-1">⚠</span>
                  {formErrors.features}
                </p>
              )}
              <p className="text-xs text-gray-500 mt-3 flex items-center">
                <span className="text-red-500 mr-1">*</span>
                CMS is required and cannot be disabled
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Consolidated Overview - Minimalista */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center justify-between">
                <span className="flex items-center">
                  <BarChart3Icon className="h-4 w-4 mr-2" />
                  Overview
                </span>
                <Badge className={
                  formData.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                  formData.status === 'SUSPENDED' ? 'bg-red-100 text-red-800' :
                  formData.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-gray-100 text-gray-800'
                }>
                  {formData.status}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-2 gap-3 text-sm">
                {/* Core Metrics */}
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Users</span>
                    <span className="font-medium">{detailedMetrics?.metrics?.totalUsers || tenant?.userCount || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Pages</span>
                    <span className="font-medium">{detailedMetrics?.metrics?.totalPages || tenant?.pageCount || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Posts</span>
                    <span className="font-medium">{detailedMetrics?.metrics?.totalPosts || tenant?.postCount || 0}</span>
                  </div>
                </div>

                {/* Module-specific Metrics - Simplified */}
                <div className="space-y-2">
                  <div className="text-xs text-gray-500">
                    Active modules: {formData.features.filter(f => f !== 'CMS_ENGINE').length}
                  </div>
                </div>
              </div>



              {/* Metadata */}
              <div className="mt-4 pt-3 border-t text-xs text-gray-500">
                <div className="flex justify-between">
                  <span>Created</span>
                  <span>{new Date(tenant?.createdAt || '').toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between mt-1">
                  <span>Features</span>
                  <span>{formData.features.length} active</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* User Management - Compact */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center justify-between">
                <span className="flex items-center">
                  <UsersIcon className="h-4 w-4 mr-2" />
                  Users
                </span>
                <div className="flex items-center space-x-2">
                  {loadingTenantUsers && (
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
                  )}
                  <Badge variant="secondary" className="text-xs">
                    {tenant?.userCount || tenantUsers.length}
                  </Badge>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {/* Loading State */}
              {loadingTenantUsers ? (
                <div className="space-y-2">
                  {[1, 2].map((i) => (
                    <div key={i} className="flex items-center justify-between p-2 bg-gray-50 rounded animate-pulse">
                      <div className="flex-1">
                        <div className="h-3 bg-gray-300 rounded w-3/4 mb-1"></div>
                        <div className="h-2 bg-gray-300 rounded w-1/2"></div>
                      </div>
                      <div className="h-4 bg-gray-300 rounded w-12"></div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  {tenantUsers.length > 0 ? (
                    <>
                      {/* Show all users if current user is TenantAdmin, otherwise show only first 2 */}
                      {(currentUser?.role?.name === 'TenantAdmin' ? tenantUsers : tenantUsers.slice(0, 2)).map((user) => (
                        <div key={user.id} className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{user.firstName} {user.lastName}</p>
                            <p className="text-xs text-gray-500 truncate">{user.email}</p>
                          </div>
                          <Badge variant="outline" className="text-xs ml-2">
                            {user.userTenants?.find(ut => ut.tenantId === tenantId)?.role?.replace('Tenant', '') || 'User'}
                          </Badge>
                        </div>
                      ))}
                      
                      {/* Only show "more" indicator if not TenantAdmin and there are more than 2 users */}
                      {currentUser?.role?.name !== 'TenantAdmin' && tenantUsers.length > 2 && (
                        <div className="text-center py-1">
                          <span className="text-xs text-gray-500">
                            +{tenantUsers.length - 2} more
                          </span>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-center py-4 text-gray-500">
                      <UsersIcon className="h-6 w-6 mx-auto mb-1 opacity-50" />
                      <p className="text-xs">
                        {currentUser?.role?.name === 'TenantAdmin' ? 'No users assigned to this tenant' : 'No users assigned'}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Compact Action Buttons */}
              <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t">
                <Button 
                  variant="outline" 
                  size="sm"
                  className="text-xs h-8"
                  onClick={() => openUserModal('create')}
                  disabled={saving}
                >
                  <UserPlusIcon className="h-3 w-3 mr-1" />
                  Create
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="text-xs h-8"
                  onClick={() => openUserModal('select')}
                  disabled={saving}
                >
                  <SearchIcon className="h-3 w-3 mr-1" />
                  Assign
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions - Simplified */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-2">
              <Link href={`/super-admin/tenants/settings/${tenantId}`}>
                <Button variant="ghost" size="sm" className="w-full justify-start text-xs h-8">
                  <SettingsIcon className="h-3 w-3 mr-2" />
                  Advanced Settings
                </Button>
              </Link>
              <Link href={`/super-admin/tenants/impersonate?tenant=${tenant?.slug}`}>
                <Button variant="ghost" size="sm" className="w-full justify-start text-xs h-8">
                  <EyeIcon className="h-3 w-3 mr-2" />
                  Impersonate
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* User Management Modal */}
      {showUserModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">
                {userModalMode === 'create' ? 'Create New User' : 'Assign Existing User'}
              </h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowUserModal(false)}
              >
                <XIcon className="h-4 w-4" />
              </Button>
            </div>

            {userModalMode === 'create' ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name *</Label>
                    <Input
                      id="firstName"
                      value={newUserForm.firstName}
                      onChange={(e) => setNewUserForm(prev => ({ ...prev, firstName: e.target.value }))}
                      placeholder="Enter first name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name *</Label>
                    <Input
                      id="lastName"
                      value={newUserForm.lastName}
                      onChange={(e) => setNewUserForm(prev => ({ ...prev, lastName: e.target.value }))}
                      placeholder="Enter last name"
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
                    placeholder="Enter email address"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phoneNumber">Phone Number</Label>
                  <Input
                    id="phoneNumber"
                    value={newUserForm.phoneNumber}
                    onChange={(e) => setNewUserForm(prev => ({ ...prev, phoneNumber: e.target.value }))}
                    placeholder="Enter phone number"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password *</Label>
                  <Input
                    id="password"
                    type="password"
                    value={newUserForm.password}
                    onChange={(e) => setNewUserForm(prev => ({ ...prev, password: e.target.value }))}
                    placeholder="Enter password"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Select 
                    value={newUserForm.role} 
                    onValueChange={(value) => setNewUserForm(prev => ({ ...prev, role: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="TenantUser">Tenant User</SelectItem>
                      <SelectItem value="TenantManager">Tenant Manager</SelectItem>
                      <SelectItem value="TenantAdmin">Tenant Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <Button 
                    variant="outline" 
                    onClick={() => setShowUserModal(false)}
                    disabled={saving}
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleCreateUser}
                    disabled={saving || !newUserForm.email || !newUserForm.firstName || !newUserForm.lastName || !newUserForm.password}
                    className={(!newUserForm.email || !newUserForm.firstName || !newUserForm.lastName || !newUserForm.password) ? 'opacity-50 cursor-not-allowed' : ''}
                  >
                    {saving ? (
                      <>
                        <LoaderIcon className="h-4 w-4 mr-2 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <UserPlusIcon className="h-4 w-4 mr-2" />
                        Create User
                      </>
                    )}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="userSearch">Search Users</Label>
                  <Input
                    id="userSearch"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by name or email..."
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        loadUsers();
                      }
                    }}
                  />
                </div>

                {loadingUsers ? (
                  <div className="flex items-center justify-center py-8">
                    <LoaderIcon className="h-6 w-6 animate-spin" />
                    <span className="ml-2">Loading users...</span>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {users.length > 0 ? (
                      users.map((user) => (
                        <div key={user.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3">
                              <div>
                                <p className="font-medium">{user.firstName} {user.lastName}</p>
                                <p className="text-sm text-gray-500">{user.email}</p>
                                {user.phoneNumber && (
                                  <p className="text-xs text-gray-400">{user.phoneNumber}</p>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge variant="outline">
                              {user.role.name}
                            </Badge>
                            <Button
                              size="sm"
                              onClick={() => handleAssignUser(user.id)}
                              disabled={saving}
                              className="min-w-[80px]"
                            >
                              {saving ? (
                                <LoaderIcon className="h-3 w-3 animate-spin" />
                              ) : (
                                <>
                                  <CheckIcon className="h-4 w-4 mr-1" />
                                  Assign
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-center text-gray-500 py-8">
                        {searchQuery ? 'No users found matching your search.' : 'No available users to assign.'}
                      </p>
                    )}
                  </div>
                )}

                <div className="flex justify-end space-x-3 pt-4">
                  <Button variant="outline" onClick={() => setShowUserModal(false)}>
                    Cancel
                  </Button>
                  <Button variant="outline" onClick={loadUsers}>
                    <SearchIcon className="h-4 w-4 mr-2" />
                    Refresh
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Exit Confirmation Modal */}
      {showExitConfirmation && hasUnsavedChanges && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-2xl border">
            <div className="flex items-center mb-4">
              <div className="flex-shrink-0 w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center mr-3">
                <AlertCircleIcon className="h-6 w-6 text-amber-600" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900">
                ¿Salir sin guardar?
              </h2>
            </div>
            
            <div className="mb-6">
              <p className="text-gray-600 mb-3">
                Tienes cambios sin guardar que se perderán si sales ahora.
              </p>
              
              {/* Show what changes will be lost */}
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <p className="text-sm font-medium text-amber-800 mb-2">Cambios pendientes:</p>
                <ul className="text-sm text-amber-700 space-y-1">
                  {formData.name !== originalFormData.name && (
                    <li>• Nombre del tenant</li>
                  )}
                  {formData.slug !== originalFormData.slug && (
                    <li>• Slug del tenant</li>
                  )}
                  {formData.domain !== originalFormData.domain && (
                    <li>• Dominio personalizado</li>
                  )}
                  {formData.status !== originalFormData.status && (
                    <li>• Estado del tenant</li>
                  )}
                  {JSON.stringify([...formData.features].sort()) !== JSON.stringify([...originalFormData.features].sort()) && (
                    <li>• Configuración de módulos</li>
                  )}
                </ul>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3">
              <Button 
                variant="outline" 
                onClick={() => setShowExitConfirmation(false)}
              >
                Cancelar
              </Button>
              <Button 
                variant="outline"
                onClick={() => {
                  setShowExitConfirmation(false);
                  handleSave();
                }}
                disabled={!isFormValid}
                className="border-blue-500 text-blue-600 hover:bg-blue-50"
              >
                <SaveIcon className="h-4 w-4 mr-2" />
                Guardar y Salir
              </Button>
              <Button 
                variant="destructive"
                onClick={() => {
                  setShowExitConfirmation(false);
                  setHasUnsavedChanges(false);
                  router.push('/super-admin/tenants/list');
                }}
              >
                Salir sin Guardar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}