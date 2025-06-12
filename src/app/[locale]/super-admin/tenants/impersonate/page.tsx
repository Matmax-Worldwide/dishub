'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle,
  Badge,
  Button,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/super-admin';
import { 
  SearchIcon,
  FilterIcon,
  UserIcon,
  HomeIcon,
  AlertTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  LogInIcon,
  ArrowLeftIcon,
  LoaderIcon,
  ShieldIcon,
  ActivityIcon,
  CalendarIcon,
  GlobeIcon,
  SettingsIcon,
  RefreshCwIcon,
  InfoIcon
} from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import { SuperAdminClient, type TenantList, type TenantDetails } from '@/lib/graphql/superAdmin';

export default function TenantImpersonationPage() {
  const searchParams = useSearchParams();
  const tenantSlugParam = searchParams.get('tenant');
  
  const [tenants, setTenants] = useState<TenantList | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [impersonating, setImpersonating] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(12);
  const [searchLoading, setSearchLoading] = useState(false);

  const loadTenants = async (showRefreshLoader = false) => {
    try {
      if (showRefreshLoader) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      
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
              element.classList.add('ring-2', 'ring-blue-500', 'ring-opacity-50');
            }
          }, 100);
        }
      }
    } catch (error) {
      console.error('Error loading tenants:', error);
      toast.error('Failed to load tenants', {
        description: 'Please check your connection and try again'
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleSearch = async () => {
    setSearchLoading(true);
    setCurrentPage(1);
    try {
      await loadTenants();
      toast.success(`Found ${tenants?.totalCount || 0} tenants`, {
        description: searchTerm ? `Matching "${searchTerm}"` : 'All tenants loaded'
      });
    } finally {
      setSearchLoading(false);
    }
  };

  const handleRefresh = async () => {
    await loadTenants(true);
    toast.success('Tenants list refreshed');
  };

  const handleImpersonate = async (tenant: TenantDetails) => {
    try {
      setImpersonating(tenant.id);
      
      // Show detailed loading feedback
      const loadingToast = toast.loading(`Starting impersonation session...`, {
        description: `Connecting to ${tenant.name} (${tenant.slug})`
      });
      
      console.log('Starting impersonation for tenant:', tenant.slug);
      
      // Call the real GraphQL impersonation mutation
      const result = await SuperAdminClient.impersonateTenant(tenant.id);
      
      toast.dismiss(loadingToast);
      
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

        toast.success(`Successfully impersonating ${tenant.name}`, {
          description: 'Redirecting to tenant dashboard...'
        });
        
        // Redirect to tenant dashboard
        const tenantDashboardUrl = `/${tenant.slug}/dashboard`;
        console.log('Redirecting to:', tenantDashboardUrl);
        
        // Use window.location for full page redirect to ensure session is properly established
        window.location.href = tenantDashboardUrl;
      } else {
        toast.error('Failed to start impersonation session', {
          description: result.message || 'Please try again or contact support'
        });
      }
    } catch (error) {
      console.error('Error starting impersonation:', error);
      toast.error('Failed to start impersonation session', {
        description: 'Please check your connection and try again'
      });
    } finally {
      setImpersonating(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return <Badge variant="success"><CheckCircleIcon className="h-3 w-3 mr-1" />Active</Badge>;
      case 'archived':
        return <Badge variant="secondary"><XCircleIcon className="h-3 w-3 mr-1" />Archived</Badge>;
      case 'suspended':
        return <Badge variant="destructive"><AlertTriangleIcon className="h-3 w-3 mr-1" />Suspended</Badge>;
      case 'pending':
        return <Badge variant="warning"><ClockIcon className="h-3 w-3 mr-1" />Pending</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const canImpersonate = (tenant: TenantDetails) => {
    return tenant.status === 'ACTIVE';
  };

  const getImpersonateButtonText = (tenant: TenantDetails) => {
    if (impersonating === tenant.id) return 'Starting...';
    if (!canImpersonate(tenant)) return 'Unavailable';
    return 'Impersonate';
  };

  useEffect(() => {
    loadTenants();
  }, [currentPage]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 text-gray-100">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-400">Loading tenants for impersonation...</p>
            <p className="text-sm text-gray-500 mt-2">Preparing secure access</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <div className="space-y-6 p-6">
        {/* Header with Status Visibility */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/super-admin/tenants/list">
              <Button variant="ghost" size="sm">
                <ArrowLeftIcon className="h-4 w-4 mr-2" />
                Back to Tenants
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-100 flex items-center">
                <ShieldIcon className="h-8 w-8 mr-3 text-blue-400" />
                Tenant Impersonation
              </h1>
              <div className="flex items-center space-x-4 mt-2">
                <p className="text-gray-400">
                  Secure tenant access for administrative purposes
                </p>
                {refreshing && (
                  <div className="flex items-center text-blue-400 text-sm">
                    <RefreshCwIcon className="h-4 w-4 mr-1 animate-spin" />
                    Refreshing...
                  </div>
                )}
                {searchLoading && (
                  <div className="flex items-center text-amber-400 text-sm">
                    <SearchIcon className="h-4 w-4 mr-1 animate-pulse" />
                    Searching...
                  </div>
                )}
              </div>
              <div className="flex items-center space-x-6 mt-2 text-sm text-gray-400">
                <span className="flex items-center">
                  <ActivityIcon className="h-4 w-4 mr-1" />
                  {tenants?.totalCount || 0} total tenants
                </span>
                {tenantSlugParam && (
                  <span className="flex items-center text-blue-400 font-medium">
                    <GlobeIcon className="h-4 w-4 mr-1" />
                    Targeting: {tenantSlugParam}
                  </span>
                )}
                <span className="flex items-center">
                  <CheckCircleIcon className="h-4 w-4 mr-1 text-green-400" />
                  {tenants?.items.filter(t => t.status === 'ACTIVE').length || 0} available
                </span>
              </div>
            </div>
          </div>
          <Button variant="outline" onClick={handleRefresh} disabled={refreshing}>
            {refreshing ? (
              <RefreshCwIcon className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RefreshCwIcon className="h-4 w-4 mr-2" />
            )}
            Refresh
          </Button>
        </div>

        {/* Enhanced Security Notice */}
        <Card className="border-amber-700 bg-amber-900/20">
          <CardHeader>
            <CardTitle className="flex items-center text-amber-300">
              <AlertTriangleIcon className="h-5 w-5 mr-2" />
              Security & Compliance Notice
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-amber-200 space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="font-medium mb-2">⚠️ Important Guidelines:</p>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>Full tenant admin privileges will be granted</li>
                    <li>All actions are logged and auditable</li>
                    <li>Use only for legitimate administrative purposes</li>
                    <li>Session expires automatically after inactivity</li>
                  </ul>
                </div>
                <div>
                  <p className="font-medium mb-2">🔄 How to Exit:</p>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>Log out from the tenant dashboard</li>
                    <li>Clear browser session and log back in</li>
                    <li>Return to SuperAdmin panel automatically</li>
                    <li>Contact support if session issues occur</li>
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Enhanced Search and Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FilterIcon className="h-5 w-5 mr-2 text-blue-400" />
              Search & Filter Tenants
            </CardTitle>
            <CardDescription>
              Find the tenant you need to access quickly and efficiently
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="md:col-span-3">
                <Input
                  placeholder="Search by tenant name, slug, or domain..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="h-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Statuses</SelectItem>
                  <SelectItem value="ACTIVE">Active Only</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="SUSPENDED">Suspended</SelectItem>
                  <SelectItem value="ARCHIVED">Archived</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={handleSearch} disabled={searchLoading} className="h-10">
                {searchLoading ? (
                  <LoaderIcon className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <SearchIcon className="h-4 w-4 mr-2" />
                )}
                Search
              </Button>
            </div>
            {(searchTerm || statusFilter !== 'ALL') && (
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-700">
                <div className="text-sm text-gray-400">
                  {tenants?.totalCount || 0} results found
                  {searchTerm && ` for "${searchTerm}"`}
                  {statusFilter !== 'ALL' && ` with status "${statusFilter}"`}
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => {
                    setSearchTerm('');
                    setStatusFilter('ALL');
                    setCurrentPage(1);
                    loadTenants();
                  }}
                >
                  Clear Filters
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Enhanced Tenants Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {tenants?.items.map((tenant) => {
            const isImpersonating = impersonating === tenant.id;
            const canAccess = canImpersonate(tenant);
            
            return (
              <Card 
                key={tenant.id} 
                id={`tenant-${tenant.id}`}
                className={`transition-all duration-200 hover:shadow-lg ${
                  isImpersonating ? 'ring-2 ring-blue-500 bg-blue-900/10' : 
                  canAccess ? 'hover:border-blue-500 hover:bg-gray-800/50' : 
                  'opacity-75 hover:opacity-90'
                }`}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg text-gray-100 truncate">
                        {tenant.name}
                      </CardTitle>
                      <CardDescription className="mt-1 flex items-center space-x-2">
                        <span className="font-mono text-sm bg-gray-800 px-2 py-1 rounded border border-gray-700">
                          {tenant.slug}
                        </span>
                        {tenant.domain && (
                          <span className="text-xs text-gray-400 flex items-center">
                            <GlobeIcon className="h-3 w-3 mr-1" />
                            {tenant.domain}
                          </span>
                        )}
                      </CardDescription>
                    </div>
                    <div className="flex flex-col items-end space-y-1">
                      {getStatusBadge(tenant.status)}
                      {!canAccess && (
                        <div className="flex items-center text-xs text-gray-500">
                          <InfoIcon className="h-3 w-3 mr-1" />
                          Unavailable
                        </div>
                      )}
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {/* Metrics Grid */}
                  <div className="grid grid-cols-3 gap-4 py-3 border-t border-b border-gray-700">
                    <div className="text-center">
                      <div className="flex items-center justify-center mb-1">
                        <UserIcon className="h-4 w-4 text-blue-400" />
                      </div>
                      <div className="text-lg font-semibold text-gray-100">{tenant.userCount}</div>
                      <div className="text-xs text-gray-400">Users</div>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center mb-1">
                        <HomeIcon className="h-4 w-4 text-green-400" />
                      </div>
                      <div className="text-lg font-semibold text-gray-100">{tenant.pageCount}</div>
                      <div className="text-xs text-gray-400">Pages</div>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center mb-1">
                        <ActivityIcon className="h-4 w-4 text-purple-400" />
                      </div>
                      <div className="text-lg font-semibold text-gray-100">{tenant.postCount}</div>
                      <div className="text-xs text-gray-400">Posts</div>
                    </div>
                  </div>

                  {/* Features */}
                  <div className="space-y-2">
                    <div className="text-sm font-medium text-gray-300">Active Features:</div>
                    <div className="flex flex-wrap gap-1">
                      {tenant.features.slice(0, 4).map((feature) => (
                        <Badge key={feature} variant="outline" className="text-xs">
                          {feature.replace('_ENGINE', '').replace('_MODULE', '').replace('_', ' ')}
                        </Badge>
                      ))}
                      {tenant.features.length > 4 && (
                        <Badge variant="outline" className="text-xs">
                          +{tenant.features.length - 4} more
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-3 border-t border-gray-700">
                    <div className="flex items-center text-xs text-gray-400">
                      <CalendarIcon className="h-3 w-3 mr-1" />
                      {new Date(tenant.createdAt).toLocaleDateString()}
                    </div>
                    <div className="flex space-x-2">
                      <Link href={`/super-admin/tenants/edit/${tenant.id}`}>
                        <Button variant="outline" size="sm">
                          <SettingsIcon className="h-3 w-3 mr-1" />
                          Edit
                        </Button>
                      </Link>
                      <Button
                        variant={canAccess ? "primary" : "secondary"}
                        size="sm"
                        onClick={() => canAccess && handleImpersonate(tenant)}
                        disabled={!canAccess || isImpersonating}
                        className={!canAccess ? 'opacity-50 cursor-not-allowed' : ''}
                      >
                        {isImpersonating ? (
                          <LoaderIcon className="h-3 w-3 mr-1 animate-spin" />
                        ) : (
                          <LogInIcon className="h-3 w-3 mr-1" />
                        )}
                        {getImpersonateButtonText(tenant)}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Enhanced Pagination */}
        {tenants && tenants.totalPages > 1 && (
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-400">
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
                  <span className="text-sm text-gray-300 px-3">
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
            </CardContent>
          </Card>
        )}

        {/* Enhanced Empty State */}
        {tenants && tenants.items.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <div className="flex flex-col items-center space-y-4">
                <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center">
                  <UserIcon className="h-8 w-8 text-gray-400" />
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-300 mb-2">
                    {searchTerm || statusFilter !== 'ALL' ? 'No matching tenants found' : 'No tenants available'}
                  </h3>
                  <p className="text-gray-400 max-w-md">
                    {searchTerm || statusFilter !== 'ALL' 
                      ? 'Try adjusting your search criteria or filters to find the tenant you\'re looking for.'
                      : 'No tenants are currently available for impersonation. Check back later or contact support.'}
                  </p>
                </div>
                {(searchTerm || statusFilter !== 'ALL') && (
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setSearchTerm('');
                      setStatusFilter('ALL');
                      setCurrentPage(1);
                      loadTenants();
                    }}
                  >
                    Clear All Filters
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
} 