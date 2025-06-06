'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  SearchIcon,
  FilterIcon,
  EyeIcon,
  UserIcon,
  HomeIcon,
  AlertTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  LogInIcon
} from 'lucide-react';
import { toast } from 'sonner';

interface TenantDetails {
  id: string;
  name: string;
  slug: string;
  domain?: string;
  status: string;
  userCount: number;
  pageCount: number;
  postCount: number;
  features: string[];
  createdAt: string;
}

interface TenantList {
  items: TenantDetails[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export default function TenantImpersonationPage() {
  const router = useRouter();
  const [tenants, setTenants] = useState<TenantList | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(12);

  const loadTenants = async () => {
    try {
      setLoading(true);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock data
      const mockTenants: TenantDetails[] = [
        {
          id: '1',
          name: 'Acme Corporation',
          slug: 'acme-corp',
          domain: 'acme.com',
          status: 'ACTIVE',
          userCount: 25,
          pageCount: 45,
          postCount: 120,
          features: ['CMS_ENGINE', 'BLOG_MODULE', 'FORMS_MODULE'],
          createdAt: new Date().toISOString()
        },
        {
          id: '2',
          name: 'Tech Startup',
          slug: 'tech-startup',
          status: 'ACTIVE',
          userCount: 12,
          pageCount: 20,
          postCount: 45,
          features: ['CMS_ENGINE', 'BOOKING_ENGINE'],
          createdAt: new Date(Date.now() - 86400000).toISOString()
        }
      ];

      const filteredTenants = mockTenants.filter(tenant => {
        const matchesSearch = !searchTerm || 
          tenant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          tenant.slug.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'ALL' || tenant.status === statusFilter;
        return matchesSearch && matchesStatus;
      });

      setTenants({
        items: filteredTenants,
        totalCount: filteredTenants.length,
        page: currentPage,
        pageSize,
        totalPages: Math.ceil(filteredTenants.length / pageSize)
      });
    } catch (error) {
      console.error('Error loading tenants:', error);
      toast.error('Failed to load tenants');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setCurrentPage(1);
    loadTenants();
  };

  const handleImpersonate = (tenant: TenantDetails) => {
    sessionStorage.setItem('superadmin_impersonation', JSON.stringify({
      originalRole: 'SuperAdmin',
      impersonatedTenant: tenant.id,
      impersonatedTenantName: tenant.name,
      impersonatedTenantSlug: tenant.slug,
      timestamp: new Date().toISOString()
    }));

    const tenantDashboardUrl = `/tenants/${tenant.slug}/dashboard`;
    toast.success(`Impersonating tenant: ${tenant.name}`);
    
    window.location.href = tenantDashboardUrl;
  };

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800 border-green-200"><CheckCircleIcon className="h-3 w-3 mr-1" />Active</Badge>;
      case 'inactive':
        return <Badge className="bg-gray-100 text-gray-800 border-gray-200"><XCircleIcon className="h-3 w-3 mr-1" />Inactive</Badge>;
      case 'suspended':
        return <Badge className="bg-red-100 text-red-800 border-red-200"><AlertTriangleIcon className="h-3 w-3 mr-1" />Suspended</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200"><ClockIcon className="h-3 w-3 mr-1" />Pending</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  useEffect(() => {
    loadTenants();
  }, [currentPage]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading tenants...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            👤 Tenant Impersonation
          </h1>
          <p className="text-gray-600 mt-1">
            Switch to tenant admin view to manage tenants directly • {tenants?.totalCount || 0} total tenants
          </p>
        </div>
      </div>

      <Card className="border-yellow-200 bg-yellow-50">
        <CardHeader>
          <CardTitle className="flex items-center text-yellow-800">
            <AlertTriangleIcon className="h-5 w-5 mr-2" />
            Impersonation Notice
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-yellow-700 space-y-2">
            <p>
              <strong>Important:</strong> When you impersonate a tenant, you will be redirected to their dashboard 
              with tenant admin privileges.
            </p>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>You will have full access to the tenant&apos;s data and settings</li>
              <li>All actions will be logged under your SuperAdmin account</li>
              <li>Use this feature responsibly and only when necessary</li>
              <li>To return to SuperAdmin view, log out and log back in</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <FilterIcon className="h-5 w-5 mr-2" />
            Search & Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <Input
                placeholder="Search tenants by name, slug, or domain..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Statuses</SelectItem>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="INACTIVE">Inactive</SelectItem>
                <SelectItem value="SUSPENDED">Suspended</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleSearch} className="w-full">
              <SearchIcon className="h-4 w-4 mr-2" />
              Search
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {tenants?.items.map((tenant) => (
          <Card key={tenant.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg">{tenant.name}</CardTitle>
                  <CardDescription className="mt-1">
                    <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                      {tenant.slug}
                    </span>
                  </CardDescription>
                </div>
                {getStatusBadge(tenant.status)}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {tenant.domain && (
                <div className="text-sm text-gray-600">
                  <span className="font-medium">Domain:</span> {tenant.domain}
                </div>
              )}

              <div className="grid grid-cols-3 gap-4 pt-3 border-t">
                <div className="text-center">
                  <div className="flex items-center justify-center mb-1">
                    <UserIcon className="h-4 w-4 text-gray-500" />
                  </div>
                  <div className="text-lg font-semibold">{tenant.userCount}</div>
                  <div className="text-xs text-gray-500">Users</div>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center mb-1">
                    <HomeIcon className="h-4 w-4 text-gray-500" />
                  </div>
                  <div className="text-lg font-semibold">{tenant.pageCount}</div>
                  <div className="text-xs text-gray-500">Pages</div>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center mb-1">
                    <HomeIcon className="h-4 w-4 text-gray-500" />
                  </div>
                  <div className="text-lg font-semibold">{tenant.postCount}</div>
                  <div className="text-xs text-gray-500">Posts</div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-sm font-medium text-gray-700">Features:</div>
                <div className="flex flex-wrap gap-1">
                  {tenant.features.slice(0, 3).map((feature) => (
                    <Badge key={feature} variant="outline" className="text-xs">
                      {feature.replace('_', ' ')}
                    </Badge>
                  ))}
                  {tenant.features.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{tenant.features.length - 3} more
                    </Badge>
                  )}
                </div>
              </div>

              <div className="pt-4 border-t">
                <div className="flex items-center justify-between">
                  <div className="text-xs text-gray-500">
                    Created: {new Date(tenant.createdAt).toLocaleDateString()}
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/super-admin/tenants/list`)}
                    >
                      <EyeIcon className="h-4 w-4 mr-1" />
                      View
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleImpersonate(tenant)}
                      disabled={tenant.status !== 'ACTIVE'}
                      className="bg-indigo-600 hover:bg-indigo-700"
                    >
                      <LogInIcon className="h-4 w-4 mr-1" />
                      Impersonate
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {tenants && tenants.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, tenants.totalCount)} of {tenants.totalCount} tenants
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <span className="text-sm">
              Page {currentPage} of {tenants.totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.min(tenants.totalPages, prev + 1))}
              disabled={currentPage === tenants.totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
} 