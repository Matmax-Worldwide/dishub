'use client';

import { useEffect, useState } from 'react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
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
} from '@/app/components/ui/dropdown-menu';


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

  const loadTenantsData = async () => {
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
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadTenantsData();
    setRefreshing(false);
    toast.success('Tenants list refreshed');
  };

  const handleSearch = () => {
    setCurrentPage(1);
    loadTenantsData();
  };

  const handleDeleteTenant = async () => {
    if (!tenantToDelete) return;
    
    try {
      // Optimistic UI: Remove tenant from list immediately
      const previousData = data;
      const optimisticTenants = {
        ...data.tenants!,
        items: data.tenants!.items.filter(t => t.id !== tenantToDelete.id),
        totalCount: data.tenants!.totalCount - 1
      };
      
      setData({
        ...data,
        tenants: optimisticTenants
      });
      
      setDeleteDialogOpen(false);
      setTenantToDelete(null);
      toast.success('Tenant deleted successfully');

      // Make the actual API call in the background
      const result = await SuperAdminClient.deleteTenant(tenantToDelete.id);
      
      if (!result.success) {
        // Revert optimistic update on failure
        setData(previousData);
        toast.dismiss();
        toast.error(result.message || 'Failed to delete tenant');
      }
    } catch (error) {
      console.error('Delete tenant error:', error);
      // Revert optimistic update on error
      await loadTenantsData();
      toast.dismiss();
      toast.error('Failed to delete tenant');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800 border-green-200"><CheckCircleIcon className="h-3 w-3 mr-1" />Active</Badge>;
      case 'archived':
        return <Badge className="bg-gray-100 text-gray-800 border-gray-200"><XCircleIcon className="h-3 w-3 mr-1" />Archived</Badge>;
      case 'suspended':
        return <Badge className="bg-red-100 text-red-800 border-red-200"><AlertCircleIcon className="h-3 w-3 mr-1" />Suspended</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200"><ClockIcon className="h-3 w-3 mr-1" />Pending</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getHealthScore = (tenantId: string) => {
    const metric = data.healthMetrics?.find(m => m.tenantId === tenantId);
    return metric?.healthScore || 0;
  };

  const getHealthBadge = (score: number) => {
    if (score >= 80) return <Badge className="bg-green-100 text-green-800">Excellent</Badge>;
    if (score >= 60) return <Badge className="bg-yellow-100 text-yellow-800">Good</Badge>;
    if (score >= 40) return <Badge className="bg-orange-100 text-orange-800">Fair</Badge>;
    return <Badge className="bg-red-100 text-red-800">Poor</Badge>;
  };

  useEffect(() => {
    loadTenantsData();
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            🏢 Tenant Management
          </h1>
          <p className="text-gray-600 mt-1">
            Manage all tenants across the platform • {tenants?.totalCount || 0} total tenants
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
          <Button>
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
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVerticalIcon className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem>
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
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">Domain:</span> {tenant.domain}
                    </div>
                  )}

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-4 pt-3 border-t">
                    <div className="text-center">
                      <div className="flex items-center justify-center mb-1">
                        <UsersIcon className="h-4 w-4 text-gray-500" />
                      </div>
                      <div className="text-lg font-semibold">{tenant.userCount}</div>
                      <div className="text-xs text-gray-500">Users</div>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center mb-1">
                        <FileTextIcon className="h-4 w-4 text-gray-500" />
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

                  {/* Features */}
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

                  {/* Created Date */}
                  <div className="text-xs text-gray-500 pt-2 border-t">
                    Created: {new Date(tenant.createdAt).toLocaleDateString()}
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
        </TabsContent>

        {/* Health Monitoring Tab */}
        <TabsContent value="health" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Tenant Health Overview</CardTitle>
              <CardDescription>
                Monitor the health and activity of all tenants
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {healthMetrics?.map((metric) => (
                  <div key={metric.tenantId} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <h3 className="font-medium">{metric.tenantName}</h3>
                        {getStatusBadge(metric.status)}
                        {getHealthBadge(metric.healthScore)}
                      </div>
                      <div className="mt-2 grid grid-cols-4 gap-4 text-sm text-gray-600">
                        <div>Users: {metric.metrics.totalUsers} ({metric.metrics.activeUsers} active)</div>
                        <div>Pages: {metric.metrics.totalPages} ({metric.metrics.publishedPages} published)</div>
                        <div>Posts: {metric.metrics.totalPosts} ({metric.metrics.publishedPosts} published)</div>
                        <div>Last Activity: {new Date(metric.lastActivity).toLocaleDateString()}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold">{metric.healthScore}</div>
                      <div className="text-xs text-gray-500">Health Score</div>
                    </div>
                  </div>
                ))}
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
                <p>The Analytics Dashboard will be available soon. We’re currently collecting more data to generate meaningful insights.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Delete Confirmation Section */}
      {deleteDialogOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-md w-full border-red-200 bg-red-50 shadow-lg">
            <CardHeader>
              <CardTitle className="text-red-900 flex items-center">
                <AlertCircleIcon className="h-5 w-5 mr-2" />
                Delete Tenant
              </CardTitle>
              <CardDescription className="text-red-700">
                Are you sure you want to delete the tenant &quot;{tenantToDelete?.name}&quot;? 
                This action cannot be undone and will permanently remove all associated data.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex space-x-2">
                <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                  Cancel
                </Button>
                <Button variant="destructive" onClick={handleDeleteTenant}>
                  <TrashIcon className="h-4 w-4 mr-2" />
                  Delete Tenant
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
} 