'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  ArrowLeftIcon,
  SaveIcon,
  HomeIcon,
  UserIcon,
  PackageIcon
} from 'lucide-react';
import { toast } from 'sonner';
import { SuperAdminClient } from '@/lib/graphql/superAdmin';

interface TenantFormData {
  name: string;
  slug: string;
  domain: string;
  description: string;
  status: string;
  features: string[];
  adminEmail: string;
  adminFirstName: string;
  adminLastName: string;
  adminPassword: string;
}

const AVAILABLE_FEATURES = [
  { id: 'CMS_ENGINE', name: 'CMS Engine', description: 'Core content management system' },
  { id: 'BLOG_MODULE', name: 'Blog Module', description: 'Blog and article management' },
  { id: 'FORMS_MODULE', name: 'Forms Module', description: 'Form builder and submissions' },
  { id: 'BOOKING_ENGINE', name: 'Booking Engine', description: 'Appointment and booking system' },
  { id: 'ECOMMERCE_ENGINE', name: 'E-commerce Engine', description: 'Online store and payments' },
  { id: 'HRMS_MODULE', name: 'HRMS Module', description: 'Human resources management' },
];

const TENANT_STATUSES = [
  { value: 'ACTIVE', label: 'Active' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'SUSPENDED', label: 'Suspended' },
  { value: 'ARCHIVED', label: 'Archived' }
];

export default function CreateTenantPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<TenantFormData>({
    name: '',
    slug: '',
    domain: '',
    description: '',
    status: 'ACTIVE',
    features: ['CMS_ENGINE'],
    adminEmail: '',
    adminFirstName: '',
    adminLastName: '',
    adminPassword: ''
  });

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

  const handleFeatureToggle = (featureId: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      features: checked 
        ? [...prev.features, featureId]
        : prev.features.filter(f => f !== featureId)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!formData.name || !formData.slug || !formData.adminEmail || !formData.adminFirstName || !formData.adminLastName || !formData.adminPassword) {
        toast.error('Please fill in all required fields');
        return;
      }

      if (!formData.features.includes('CMS_ENGINE')) {
        toast.error('CMS Engine is required and must be selected');
        return;
      }

      if (formData.adminPassword.length < 6) {
        toast.error('Admin password must be at least 6 characters long');
        return;
      }

      console.log('Creating tenant with data:', {
        name: formData.name.trim(),
        slug: formData.slug.trim(),
        domain: formData.domain.trim() || undefined,
        features: formData.features,
        settings: {
          adminEmail: formData.adminEmail,
          adminFirstName: formData.adminFirstName,
          adminLastName: formData.adminLastName,
          adminPassword: formData.adminPassword
        }
      });

      // Show immediate feedback
      toast.success('Creating tenant...');
      
      const result = await SuperAdminClient.createTenant({
        name: formData.name.trim(),
        slug: formData.slug.trim(),
        domain: formData.domain.trim() || undefined,
        features: formData.features,
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
      });

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
    <div className="space-y-6">
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
            <h1 className="text-3xl font-bold text-gray-900">
              🏢 Create New Tenant
            </h1>
            <p className="text-gray-600 mt-1">
              Set up a new tenant with admin user and features
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <HomeIcon className="h-5 w-5 mr-2" />
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
                <p className="text-xs text-gray-500">
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
              <UserIcon className="h-5 w-5 mr-2" />
              Admin User
            </CardTitle>
            <CardDescription>
              Create the initial admin user for this tenant
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
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
                  placeholder="Secure password"
                  required
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <PackageIcon className="h-5 w-5 mr-2" />
              Features & Modules
            </CardTitle>
            <CardDescription>
              Select the features and modules to enable for this tenant
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {AVAILABLE_FEATURES.map(feature => (
                <div key={feature.id} className="flex items-start space-x-3 p-3 border rounded-lg">
                  <Checkbox
                    id={feature.id}
                    checked={formData.features.includes(feature.id)}
                    onCheckedChange={(checked) => handleFeatureToggle(feature.id, checked as boolean)}
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

        <div className="flex items-center justify-end space-x-4">
          <Button 
            type="button" 
            variant="outline"
            onClick={() => router.back()}
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            disabled={loading}
            className="min-w-[120px]"
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
      </form>
    </div>
  );
} 