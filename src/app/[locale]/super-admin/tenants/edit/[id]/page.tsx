'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';

import { 
  ArrowLeftIcon, 
  SaveIcon, 
  LoaderIcon,
  BuildingIcon,
  UsersIcon,
  SettingsIcon,
  AlertCircleIcon,
} from 'lucide-react';
import Link from 'next/link';
import { SuperAdminClient, type TenantDetails } from '@/lib/graphql/superAdmin';
import { toast } from 'sonner';

const AVAILABLE_FEATURES = [
  { id: 'CMS_ENGINE', name: 'CMS Engine', description: 'Core content management system' },
  { id: 'BLOG_MODULE', name: 'Blog Module', description: 'Blog and article management' },
  { id: 'FORMS_MODULE', name: 'Forms Module', description: 'Form builder and submissions' },
  { id: 'BOOKING_ENGINE', name: 'Booking Engine', description: 'Appointment and booking system' },
  { id: 'ECOMMERCE_ENGINE', name: 'E-commerce Engine', description: 'Online store and payments' },
  { id: 'LEGAL_ENGINE', name: 'Legal Engine', description: 'Company incorporation and legal services' },
];

const STATUS_OPTIONS = [
  { value: 'ACTIVE', label: 'Active', color: 'green' },
  { value: 'PENDING', label: 'Pending', color: 'yellow' },
  { value: 'SUSPENDED', label: 'Suspended', color: 'red' },
  { value: 'ARCHIVED', label: 'Archived', color: 'gray' }
];

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