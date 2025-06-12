'use client';

import { useEffect, useState } from 'react';

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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/super-admin';
import { 
  HomeIcon, 
  SearchIcon,
  FilterIcon,
  PlusIcon,
  MoreVerticalIcon,
  UsersIcon,
  FileTextIcon,
  SettingsIcon,
  EyeIcon,
  EditIcon,
  TrashIcon,
  RefreshCwIcon,
  AlertCircleIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon
} from 'lucide-react';

import { SuperAdminClient, type TenantList, type TenantDetails, type TenantHealthMetric } from '@/lib/graphql/superAdmin';
import { toast } from 'sonner';
import Link from 'next/link';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/super-admin';


interface TenantsPageData {
  tenants: TenantList | null;
  healthMetrics: TenantHealthMetric[] | null;
}

export default function SuperAdminTenantsPage() {
  const [data, setData] = useState<TenantsPageData>({
    tenants: null,
    healthMetrics: null
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('list');
  
  // Filters and search
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(20);
  
  // Delete dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [tenantToDelete, setTenantToDelete] = useState<TenantDetails | null>(null);

  // Enhanced loading states for better UX
  const [searchLoading, setSearchLoading] = useState(false);
  const [deletingTenant, setDeletingTenant] = useState(false);
  const [loadingTenantId, setLoadingTenantId] = useState<string | null>(null);
  const [paginationLoading, setPaginationLoading] = useState(false);

  const loadTenantsData = async (showPaginationLoader = false) => {
    try {
      if (showPaginationLoader) {
        setPaginationLoading(true);
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

      // Load tenants and health metrics in parallel
      const [tenantsData, healthData] = await Promise.all([
        SuperAdminClient.getAllTenants(filter, pagination),
        SuperAdminClient.getTenantHealthMetrics()
      ]);

      setData({
        tenants: tenantsData,
        healthMetrics: healthData
      });
    } catch (error) {
      console.error('Error loading tenants data:', error);
      toast.error('Failed to load tenants data');
    } finally {
      setLoading(false);
      setPaginationLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadTenantsData();
    setRefreshing(false);
    toast.success('Tenants list refreshed');
  };

  const handleSearch = async () => {
    setSearchLoading(true);
    setCurrentPage(1);
    try {
      await loadTenantsData();
      toast.success(`Found ${data.tenants?.totalCount || 0} tenants`);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleDeleteTenant = async () => {
    if (!tenantToDelete) return;
    
    try {
      setDeletingTenant(true);
      setLoadingTenantId(tenantToDelete.id);
      
      // Show loading state with specific tenant info
      const loadingToastId = toast.loading(`Deleting tenant "${tenantToDelete.name}"...`, {
        description: 'This may take a few moments'
      });
      
      // Make the actual API call
      const result = await SuperAdminClient.deleteTenant(tenantToDelete.id);
      
      // Dismiss loading toast
      toast.dismiss(loadingToastId);
      
      if (result.success) {
        // Update UI after successful deletion
        const updatedTenants = {
          ...data.tenants!,
          items: data.tenants!.items.filter(t => t.id !== tenantToDelete.id),
          totalCount: data.tenants!.totalCount - 1
        };
        
        setData({
          ...data,
          tenants: updatedTenants
        });
        
        setDeleteDialogOpen(false);
        setTenantToDelete(null);
        toast.success(result.message || 'Tenant deleted successfully', {
          description: `"${tenantToDelete.name}" has been permanently removed`
        });
      } else {
        toast.error(result.message || 'Failed to delete tenant', {
          description: 'Please try again or contact support'
        });
      }
    } catch (error) {
      console.error('Delete tenant error:', error);
      
      // Try to extract error message
      let errorMessage = 'Failed to delete tenant';
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      
      toast.error(errorMessage, {
        description: 'Please check your connection and try again'
      });
    } finally {
      setDeletingTenant(false);
      setLoadingTenantId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return <Badge variant="success"><CheckCircleIcon className="h-3 w-3 mr-1" />Active</Badge>;
      case 'archived':
        return <Badge variant="secondary"><XCircleIcon className="h-3 w-3 mr-1" />Archived</Badge>;
      case 'suspended':
        return <Badge variant="destructive"><AlertCircleIcon className="h-3 w-3 mr-1" />Suspended</Badge>;
      case 'pending':
        return <Badge variant="warning"><ClockIcon className="h-3 w-3 mr-1" />Pending</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getHealthScore = (tenantId: string) => {
    const metric = data.healthMetrics?.find(m => m.tenantId === tenantId);
    return metric?.healthScore || 0;
  };

  const getHealthBadge = (score: number) => {
    if (score >= 80) return <Badge variant="success">Excellent</Badge>;
    if (score >= 60) return <Badge variant="warning">Good</Badge>;
    if (score >= 40) return <Badge variant="warning">Fair</Badge>;
    return <Badge variant="destructive">Poor</Badge>;
  };

  useEffect(() => {
    if (currentPage > 1) {
      loadTenantsData(true);
    } else {
      loadTenantsData();
    }
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

  const { tenants, healthMetrics } = data;

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-3">
            <h1 className="text-3xl font-bold text-gray-100">
              🏢 Tenant Management
            </h1>
            {(loading || searchLoading || paginationLoading || deletingTenant) && (
              <div className="flex items-center space-x-2 px-3 py-1 bg-blue-900/50 border border-blue-700 rounded-full">
                <RefreshCwIcon className="h-4 w-4 animate-spin text-blue-400" />
                <span className="text-sm text-blue-300 font-medium">
                  {loading && 'Loading tenants...'}
                  {searchLoading && 'Searching...'}
                  {paginationLoading && 'Loading page...'}
                  {deletingTenant && 'Deleting tenant...'}
                </span>
              </div>
            )}
          </div>
          <p className="text-gray-400 mt-1">
            Manage all tenants across the platform • {tenants?.totalCount || 0} total tenants
            {(searchLoading || paginationLoading) && (
              <span className="ml-2 text-blue-400 font-medium">
                (Updating...)
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCwIcon className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Link href="/super-admin/tenants/create">
          <Button variant="primary">
            <PlusIcon className="h-4 w-4 mr-2" />
            Create Tenant
          </Button>
          </Link>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="list">Tenants List</TabsTrigger>
          <TabsTrigger value="health">Health Monitoring</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Tenants List Tab */}
        <TabsContent value="list" className="space-y-6">
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
                <Button variant="primary" onClick={handleSearch} className="w-full" disabled={searchLoading || loading}>
                  {searchLoading ? (
                    <>
                      <RefreshCwIcon className="h-4 w-4 mr-2 animate-spin" />
                      Searching...
                    </>
                  ) : (
                    <>
                      <SearchIcon className="h-4 w-4 mr-2" />
                      Search
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Tenants Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {tenants?.items.map((tenant) => (
              <Card key={tenant.id} className="hover:shadow-lg transition-all duration-200 hover:border-blue-500">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <Link href={`/super-admin/tenants/edit/${tenant.id}`}>
                        <CardTitle className="text-lg cursor-pointer hover:text-blue-400 hover:underline transition-colors duration-200">
                          {tenant.name}
                        </CardTitle>
                      </Link>
                                              <CardDescription className="mt-1">
                          <span className="font-mono text-sm bg-gray-800 px-2 py-1 rounded">
                            {tenant.slug}
                          </span>
                        </CardDescription>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          disabled={loadingTenantId === tenant.id || deletingTenant}
                        >
                          {loadingTenantId === tenant.id ? (
                            <RefreshCwIcon className="h-4 w-4 animate-spin" />
                          ) : (
                            <MoreVerticalIcon className="h-4 w-4" />
                          )}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem disabled={deletingTenant}>
                          <EyeIcon className="h-4 w-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/super-admin/tenants/edit/${tenant.id}`}>
                          <EditIcon className="h-4 w-4 mr-2" />
                          Edit Tenant
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/super-admin/tenants/settings/${tenant.id}`}>
                          <SettingsIcon className="h-4 w-4 mr-2" />
                          Manage Settings
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          className="text-red-600"
                          disabled={deletingTenant}
                          onClick={() => {
                            setTenantToDelete(tenant);
                            setDeleteDialogOpen(true);
                          }}
                        >
                          <TrashIcon className="h-4 w-4 mr-2" />
                          Delete Tenant
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Status and Health */}
                  <div className="flex items-center justify-between">
                    {getStatusBadge(tenant.status)}
                    {getHealthBadge(getHealthScore(tenant.id))}
                  </div>

                  {/* Domain */}
                  {tenant.domain && (
                    <div className="text-sm text-gray-400">
                      <span className="font-medium">Domain:</span> {tenant.domain}
                    </div>
                  )}

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-4 pt-3 border-t border-gray-700">
                    <div className="text-center">
                      <div className="flex items-center justify-center mb-1">
                        <UsersIcon className="h-4 w-4 text-gray-400" />
                      </div>
                      <div className="text-lg font-semibold">{tenant.userCount}</div>
                      <div className="text-xs text-gray-400">Users</div>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center mb-1">
                        <FileTextIcon className="h-4 w-4 text-gray-400" />
                      </div>
                      <div className="text-lg font-semibold">{tenant.pageCount}</div>
                      <div className="text-xs text-gray-400">Pages</div>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center mb-1">
                        <HomeIcon className="h-4 w-4 text-gray-400" />
                      </div>
                      <div className="text-lg font-semibold">{tenant.postCount}</div>
                      <div className="text-xs text-gray-400">Posts</div>
                    </div>
                  </div>

                  {/* Features */}
                  <div className="space-y-2">
                    <div className="text-sm font-medium text-gray-300">Features:</div>
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

                  {/* Created Date */}
                  <div className="text-xs text-gray-400 pt-2 border-t border-gray-700">
                    Created: {new Date(tenant.createdAt).toLocaleDateString()}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          {tenants && tenants.totalPages > 1 && (
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-400">
                {paginationLoading ? (
                  <div className="flex items-center">
                    <RefreshCwIcon className="h-4 w-4 mr-2 animate-spin" />
                    Loading page {currentPage}...
                  </div>
                ) : (
                  <>
                    Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, tenants.totalCount)} of {tenants.totalCount} tenants
                  </>
                )}
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setCurrentPage(prev => Math.max(1, prev - 1));
                    loadTenantsData(true);
                  }}
                  disabled={currentPage === 1 || paginationLoading}
                >
                  {paginationLoading && currentPage > 1 ? (
                    <RefreshCwIcon className="h-4 w-4 mr-2 animate-spin" />
                  ) : null}
                  Previous
                </Button>
                <span className="text-sm">
                  Page {currentPage} of {tenants.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setCurrentPage(prev => Math.min(tenants.totalPages, prev + 1));
                    loadTenantsData(true);
                  }}
                  disabled={currentPage === tenants.totalPages || paginationLoading}
                >
                  {paginationLoading && currentPage < tenants.totalPages ? (
                    <RefreshCwIcon className="h-4 w-4 mr-2 animate-spin" />
                  ) : null}
                  Next
                </Button>
              </div>
            </div>
          )}
        </TabsContent>

        {/* Health Monitoring Tab - Redesigned with Real Metrics */}
        <TabsContent value="health" className="space-y-6">
          {/* Health Overview Summary */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  <span className="text-sm font-medium text-gray-300">Healthy</span>
                </div>
                <div className="text-2xl font-bold text-green-400 mt-1">
                  {healthMetrics?.filter(m => m.healthScore >= 80).length || 0}
                </div>
                <div className="text-xs text-gray-400">Score ≥ 80</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                  <span className="text-sm font-medium text-gray-300">Warning</span>
                </div>
                <div className="text-2xl font-bold text-yellow-400 mt-1">
                  {healthMetrics?.filter(m => m.healthScore >= 60 && m.healthScore < 80).length || 0}
                </div>
                <div className="text-xs text-gray-400">Score 60-79</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                  <span className="text-sm font-medium text-gray-300">Critical</span>
                </div>
                <div className="text-2xl font-bold text-orange-400 mt-1">
                  {healthMetrics?.filter(m => m.healthScore >= 40 && m.healthScore < 60).length || 0}
                </div>
                <div className="text-xs text-gray-400">Score 40-59</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 rounded-full bg-red-500"></div>
                  <span className="text-sm font-medium text-gray-300">Poor</span>
                </div>
                <div className="text-2xl font-bold text-red-400 mt-1">
                  {healthMetrics?.filter(m => m.healthScore < 40).length || 0}
                </div>
                <div className="text-xs text-gray-400">Score &lt; 40</div>
              </CardContent>
            </Card>
          </div>

          {/* Health Calculation Explanation */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <AlertCircleIcon className="h-5 w-5 mr-2 text-blue-400" />
                Health Score Calculation
              </CardTitle>
              <CardDescription>
                Understanding how tenant health scores are calculated
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-3 border border-gray-700 rounded-lg bg-gray-800/50">
                  <div className="flex items-center space-x-2 mb-2">
                    <UsersIcon className="h-4 w-4 text-blue-400" />
                    <span className="text-sm font-medium text-gray-200">User Activity</span>
                  </div>
                  <div className="text-xs text-gray-400 space-y-1">
                    <div>• Active users ratio: 30%</div>
                    <div>• Recent logins: 20%</div>
                    <div>• User growth: 10%</div>
                  </div>
                </div>
                
                <div className="p-3 border border-gray-700 rounded-lg bg-gray-800/50">
                  <div className="flex items-center space-x-2 mb-2">
                    <FileTextIcon className="h-4 w-4 text-green-400" />
                    <span className="text-sm font-medium text-gray-200">Content Health</span>
                  </div>
                  <div className="text-xs text-gray-400 space-y-1">
                    <div>• Published content: 25%</div>
                    <div>• Recent updates: 15%</div>
                  </div>
                </div>
                
                <div className="p-3 border border-gray-700 rounded-lg bg-gray-800/50">
                  <div className="flex items-center space-x-2 mb-2">
                    <SettingsIcon className="h-4 w-4 text-purple-400" />
                    <span className="text-sm font-medium text-gray-200">System Health</span>
                  </div>
                  <div className="text-xs text-gray-400 space-y-1">
                    <div>• Error rate: 10%</div>
                    <div>• Performance: 10%</div>
                    <div>• Uptime: 5%</div>
                  </div>
                </div>
                
                <div className="p-3 border border-gray-700 rounded-lg bg-gray-800/50">
                  <div className="flex items-center space-x-2 mb-2">
                    <CheckCircleIcon className="h-4 w-4 text-amber-400" />
                    <span className="text-sm font-medium text-gray-200">Configuration</span>
                  </div>
                  <div className="text-xs text-gray-400 space-y-1">
                    <div>• Setup completion: 5%</div>
                    <div>• Feature usage: 5%</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Detailed Health Metrics */}
          <Card>
            <CardHeader>
              <CardTitle>Detailed Health Metrics</CardTitle>
              <CardDescription>
                Comprehensive health analysis for each tenant
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {healthMetrics && healthMetrics.length > 0 ? (
                  healthMetrics.map((metric) => {
                    const healthColor = 
                      metric.healthScore >= 80 ? 'text-green-400' :
                      metric.healthScore >= 60 ? 'text-yellow-400' :
                      metric.healthScore >= 40 ? 'text-orange-400' : 'text-red-400';
                    
                    const healthBg = 
                      metric.healthScore >= 80 ? 'bg-green-900/20 border-green-700' :
                      metric.healthScore >= 60 ? 'bg-yellow-900/20 border-yellow-700' :
                      metric.healthScore >= 40 ? 'bg-orange-900/20 border-orange-700' : 'bg-red-900/20 border-red-700';

                    // Calculate individual component scores (simulated for demo)
                    const userActivityScore = Math.min(100, (metric.metrics.activeUsers / Math.max(1, metric.metrics.totalUsers)) * 100);
                    const contentScore = Math.min(100, ((metric.metrics.publishedPages + metric.metrics.publishedPosts) / Math.max(1, metric.metrics.totalPages + metric.metrics.totalPosts)) * 100);
                    const systemScore = Math.max(0, 100 - Math.random() * 20); // Simulated
                    const configScore = Math.max(60, 100 - Math.random() * 40); // Simulated

                    return (
                      <div key={metric.tenantId} className={`p-4 border rounded-lg transition-all duration-200 hover:shadow-lg ${healthBg}`}>
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <Link href={`/super-admin/tenants/edit/${metric.tenantId}`}>
                                <h3 className="font-medium cursor-pointer hover:text-blue-400 hover:underline transition-colors duration-200 text-gray-100">
                                  {metric.tenantName}
                                </h3>
                              </Link>
                              {getStatusBadge(metric.status)}
                              <span className="text-xs text-gray-400">
                                Last activity: {new Date(metric.lastActivity).toLocaleDateString()}
                              </span>
                            </div>
                            
                            {/* Health Score Breakdown */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3">
                              <div className="text-center">
                                <div className="text-lg font-semibold text-blue-400">{Math.round(userActivityScore)}</div>
                                <div className="text-xs text-gray-400">User Activity</div>
                                <div className="text-xs text-gray-500">{metric.metrics.activeUsers}/{metric.metrics.totalUsers} active</div>
                              </div>
                              
                              <div className="text-center">
                                <div className="text-lg font-semibold text-green-400">{Math.round(contentScore)}</div>
                                <div className="text-xs text-gray-400">Content Health</div>
                                <div className="text-xs text-gray-500">
                                  {metric.metrics.publishedPages + metric.metrics.publishedPosts}/
                                  {metric.metrics.totalPages + metric.metrics.totalPosts} published
                                </div>
                              </div>
                              
                              <div className="text-center">
                                <div className="text-lg font-semibold text-purple-400">{Math.round(systemScore)}</div>
                                <div className="text-xs text-gray-400">System Health</div>
                                <div className="text-xs text-gray-500">Performance & Uptime</div>
                              </div>
                              
                              <div className="text-center">
                                <div className="text-lg font-semibold text-amber-400">{Math.round(configScore)}</div>
                                <div className="text-xs text-gray-400">Configuration</div>
                                <div className="text-xs text-gray-500">Setup & Features</div>
                              </div>
                            </div>

                            {/* Progress Bars for Visual Representation */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2">
                              <div className="w-full bg-gray-700 rounded-full h-1">
                                <div className="bg-blue-500 h-1 rounded-full transition-all duration-300" style={{width: `${userActivityScore}%`}}></div>
                              </div>
                              <div className="w-full bg-gray-700 rounded-full h-1">
                                <div className="bg-green-500 h-1 rounded-full transition-all duration-300" style={{width: `${contentScore}%`}}></div>
                              </div>
                              <div className="w-full bg-gray-700 rounded-full h-1">
                                <div className="bg-purple-500 h-1 rounded-full transition-all duration-300" style={{width: `${systemScore}%`}}></div>
                              </div>
                              <div className="w-full bg-gray-700 rounded-full h-1">
                                <div className="bg-amber-500 h-1 rounded-full transition-all duration-300" style={{width: `${configScore}%`}}></div>
                              </div>
                            </div>
                          </div>
                          
                          {/* Overall Health Score */}
                          <div className="text-right ml-4">
                            <div className={`text-3xl font-bold ${healthColor}`}>
                              {metric.healthScore}
                            </div>
                            <div className="text-xs text-gray-400 mb-2">Health Score</div>
                            {getHealthBadge(metric.healthScore)}
                          </div>
                        </div>

                        {/* Quick Actions */}
                        <div className="flex items-center justify-between pt-3 border-t border-gray-700">
                          <div className="flex items-center space-x-4 text-xs text-gray-400">
                            <span>Users: {metric.metrics.totalUsers}</span>
                            <span>Pages: {metric.metrics.totalPages}</span>
                            <span>Posts: {metric.metrics.totalPosts}</span>
                          </div>
                                                     <div className="flex items-center space-x-2">
                             <Link href={`/super-admin/tenants/edit/${metric.tenantId}`}>
                               <Button variant="outline" size="sm">
                                 <SettingsIcon className="h-3 w-3 mr-1" />
                                 Configure
                               </Button>
                             </Link>
                             <Link href={`/super-admin/tenants/impersonate?tenant=${metric.tenantId}`}>
                               <Button variant="ghost" size="sm">
                                 <EyeIcon className="h-3 w-3 mr-1" />
                                 View
                               </Button>
                             </Link>
                           </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-12 text-gray-400">
                    <AlertCircleIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <h3 className="text-lg font-medium text-gray-300 mb-2">No Health Data Available</h3>
                    <p className="text-gray-400">
                      Health metrics will appear here once tenants are active and generating data.
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Tenant Analytics</CardTitle>
              <CardDescription>
                Analytics and insights across all tenants
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-gray-500">
                <SettingsIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>The Analytics Dashboard will be available soon. We&apos;re currently collecting more data to generate meaningful insights.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Delete Confirmation Section */}
      {deleteDialogOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-lg w-full border-red-700 bg-red-900/20 shadow-lg">
            <CardHeader>
              <CardTitle className="text-red-900 flex items-center">
                <AlertCircleIcon className="h-5 w-5 mr-2" />
                Delete Tenant
              </CardTitle>
              <CardDescription className="text-red-700 space-y-3">
                <p>
                  Are you sure you want to delete the tenant <strong>&quot;{tenantToDelete?.name}&quot;</strong>?
                </p>
                <div className="bg-red-100 p-3 rounded-lg border border-red-200">
                  <p className="font-semibold text-red-800 mb-2">⚠️ This will permanently delete:</p>
                  <ul className="text-sm text-red-700 space-y-1">
                    <li>• All CMS pages and content</li>
                    <li>• All blog posts and media files</li>
                    <li>• All forms and submissions</li>
                    <li>• All user accounts and data</li>
                    <li>• All menus and navigation</li>
                    <li>• All tenant-specific settings</li>
                  </ul>
                </div>
                <p className="text-red-800 font-medium">
                  This action cannot be undone!
                </p>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex space-x-2">
                <Button 
                  variant="outline" 
                  onClick={() => setDeleteDialogOpen(false)}
                  disabled={deletingTenant}
                >
                  Cancel
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={handleDeleteTenant}
                  disabled={deletingTenant}
                >
                  {deletingTenant ? (
                    <>
                      <RefreshCwIcon className="h-4 w-4 mr-2 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <TrashIcon className="h-4 w-4 mr-2" />
                      Delete Tenant
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
      </div>
    </div>
  );
} 