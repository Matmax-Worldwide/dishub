'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
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
  LogInIcon,
  ArrowLeftIcon,
  LoaderIcon
} from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import { SuperAdminClient, type TenantList, type TenantDetails } from '@/lib/graphql/superAdmin';

export default function TenantImpersonationPage() {
  const searchParams = useSearchParams();
  const tenantSlugParam = searchParams.get('tenant');
  
  const [tenants, setTenants] = useState<TenantList | null>(null);
  const [loading, setLoading] = useState(true);
  const [impersonating, setImpersonating] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(12);

  const loadTenants = async () => {
    try {
      setLoading(true);
      
      const filter = {
        ...(searchTerm && { search: searchTerm }),
        ...(statusFilter && statusFilter !== 'ALL' && { status: statusFilter })
      };
      
      const pagination = {
        page: currentPage,
        pageSize
      };

      const tenantsData = await SuperAdminClient.getAllTenants(filter, pagination);
      setTenants(tenantsData);

      // If there's a tenant parameter, try to find and highlight it
      if (tenantSlugParam && tenantsData.items.length > 0) {
        const targetTenant = tenantsData.items.find(t => t.slug === tenantSlugParam);
        if (targetTenant) {
          // Scroll to tenant or highlight it
          setTimeout(() => {
            const element = document.getElementById(`tenant-${targetTenant.id}`);
            if (element) {
              element.scrollIntoView({ behavior: 'smooth', block: 'center' });
              element.classList.add('ring-2', 'ring-indigo-500', 'ring-opacity-50');
            }
          }, 100);
        }
      }
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

  const handleImpersonate = async (tenant: TenantDetails) => {
    try {
      setImpersonating(tenant.id);
      
      console.log('Starting impersonation for tenant:', tenant.slug);
      
      // Call the real GraphQL impersonation mutation
      const result = await SuperAdminClient.impersonateTenant(tenant.id);
      
      if (result.success && result.impersonationData) {
        // Store impersonation data in sessionStorage
        sessionStorage.setItem('superadmin_impersonation', JSON.stringify({
          originalRole: 'SuperAdmin',
          impersonatedTenant: result.impersonationData.tenantId,
          impersonatedTenantName: result.impersonationData.tenantName,
          impersonatedTenantSlug: result.impersonationData.tenantSlug,
          impersonatedUserId: result.impersonationData.userId,
          impersonatedUserEmail: result.impersonationData.userEmail,
          impersonatedUserRole: result.impersonationData.userRole,
          timestamp: new Date().toISOString()
        }));

        toast.success(`Successfully impersonating tenant: ${tenant.name}`);
        
        // Redirect to tenant dashboard
        const tenantDashboardUrl = `/${tenant.slug}/dashboard`;
        console.log('Redirecting to:', tenantDashboardUrl);
        
        // Use window.location for full page redirect to ensure session is properly established
        window.location.href = tenantDashboardUrl;
      } else {
        toast.error(result.message || 'Failed to start impersonation session');
      }
    } catch (error) {
      console.error('Error starting impersonation:', error);
      toast.error('Failed to start impersonation session');
    } finally {
      setImpersonating(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800 border-green-200"><CheckCircleIcon className="h-3 w-3 mr-1" />Active</Badge>;
      case 'archived':
        return <Badge className="bg-gray-100 text-gray-800 border-gray-200"><XCircleIcon className="h-3 w-3 mr-1" />Archived</Badge>;
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
            <h1 className="text-3xl font-bold text-gray-900">
              👤 Tenant Impersonation
            </h1>
            <p className="text-gray-600 mt-1">
              Switch to tenant admin view to manage tenants directly • {tenants?.totalCount || 0} total tenants
              {tenantSlugParam && (
                <span className="ml-2 text-indigo-600 font-medium">
                  • Targeting: {tenantSlugParam}
                </span>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Impersonation Notice */}
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

      {/* Search and Filters */}
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
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="SUSPENDED">Suspended</SelectItem>
                <SelectItem value="ARCHIVED">Archived</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleSearch} className="w-full">
              <SearchIcon className="h-4 w-4 mr-2" />
              Search
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tenants Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {tenants?.items.map((tenant) => (
          <Card 
            key={tenant.id} 
            id={`tenant-${tenant.id}`}
            className="hover:shadow-lg transition-all duration-200"
          >
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
                    <Link href={`/super-admin/tenants/edit/${tenant.id}`}>
                      <Button variant="outline" size="sm">
                        <EyeIcon className="h-4 w-4 mr-1" />
                        View
                      </Button>
                    </Link>
                    <Button
                      size="sm"
                      onClick={() => handleImpersonate(tenant)}
                      disabled={tenant.status !== 'ACTIVE' || impersonating === tenant.id}
                      className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
                    >
                      {impersonating === tenant.id ? (
                        <LoaderIcon className="h-4 w-4 mr-1 animate-spin" />
                      ) : (
                        <LogInIcon className="h-4 w-4 mr-1" />
                      )}
                      {impersonating === tenant.id ? 'Starting...' : 'Impersonate'}
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Pagination */}
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

      {/* No tenants found */}
      {tenants && tenants.items.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <UserIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No tenants found</h3>
            <p className="text-gray-500">
              {searchTerm || statusFilter !== 'ALL' 
                ? 'Try adjusting your search criteria or filters.'
                : 'No tenants are available for impersonation.'}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 