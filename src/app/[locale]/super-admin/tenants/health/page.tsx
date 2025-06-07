'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { Button } from '@/app/components/ui/button';
import { Progress } from '@/app/components/ui/progress';
import { Input } from '@/app/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import { 
  RefreshCwIcon,
  TrendingUpIcon,
  TrendingDownIcon,
  AlertTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  ActivityIcon,
  UsersIcon,
  FileTextIcon,
  HomeIcon,
  BarChartIcon,
  SearchIcon,
  FilterIcon,
  ArrowLeftIcon,
  ClockIcon,
  ShieldIcon,
  DatabaseIcon,
  WifiIcon,
  HardDriveIcon
} from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import { SuperAdminClient, type TenantHealthMetric } from '@/lib/graphql/superAdmin';

interface HealthFilters {
  search: string;
  healthRange: string;
  status: string;
  lastActivity: string;
}

export default function TenantHealthPage() {
  const [healthMetrics, setHealthMetrics] = useState<TenantHealthMetric[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filters, setFilters] = useState<HealthFilters>({
    search: '',
    healthRange: 'ALL',
    status: 'ALL',
    lastActivity: 'ALL'
  });
  const [activeTab, setActiveTab] = useState('overview');

  const loadHealthData = async () => {
    try {
      setLoading(true);
      
      // Load real health metrics from GraphQL
      const healthData = await SuperAdminClient.getTenantHealthMetrics();
      
      // Apply filters
      let filteredData = healthData;
      
      if (filters.search) {
        filteredData = filteredData.filter(metric => 
          metric.tenantName.toLowerCase().includes(filters.search.toLowerCase())
        );
      }
      
      if (filters.healthRange !== 'ALL') {
        switch (filters.healthRange) {
          case 'EXCELLENT':
            filteredData = filteredData.filter(m => m.healthScore >= 80);
            break;
          case 'GOOD':
            filteredData = filteredData.filter(m => m.healthScore >= 60 && m.healthScore < 80);
            break;
          case 'FAIR':
            filteredData = filteredData.filter(m => m.healthScore >= 40 && m.healthScore < 60);
            break;
          case 'POOR':
            filteredData = filteredData.filter(m => m.healthScore < 40);
            break;
        }
      }
      
      if (filters.status !== 'ALL') {
        filteredData = filteredData.filter(m => m.status === filters.status);
      }
      
      if (filters.lastActivity !== 'ALL') {
        const now = new Date();
        const cutoffDate = new Date();
        
        switch (filters.lastActivity) {
          case 'TODAY':
            cutoffDate.setHours(0, 0, 0, 0);
            break;
          case 'WEEK':
            cutoffDate.setDate(now.getDate() - 7);
            break;
          case 'MONTH':
            cutoffDate.setMonth(now.getMonth() - 1);
            break;
        }
        
        if (filters.lastActivity !== 'ALL') {
          filteredData = filteredData.filter(m => 
            new Date(m.lastActivity) >= cutoffDate
          );
        }
      }
      
      setHealthMetrics(filteredData);
    } catch (error) {
      console.error('Error loading health data:', error);
      toast.error('Failed to load health metrics');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadHealthData();
    setRefreshing(false);
    toast.success('Health metrics refreshed');
  };

  const handleFilterChange = (key: keyof HealthFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const applyFilters = () => {
    loadHealthData();
  };

  useEffect(() => {
    loadHealthData();
  }, []);

  const getHealthBadge = (score: number) => {
    if (score >= 80) return <Badge className="bg-green-100 text-green-800 border-green-200">Excellent</Badge>;
    if (score >= 60) return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Good</Badge>;
    if (score >= 40) return <Badge className="bg-orange-100 text-orange-800 border-orange-200">Fair</Badge>;
    return <Badge className="bg-red-100 text-red-800 border-red-200">Poor</Badge>;
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return <CheckCircleIcon className="h-4 w-4 text-green-600" />;
      case 'archived':
        return <XCircleIcon className="h-4 w-4 text-gray-600" />;
      case 'suspended':
        return <AlertTriangleIcon className="h-4 w-4 text-red-600" />;
      case 'pending':
        return <ClockIcon className="h-4 w-4 text-yellow-600" />;
      default:
        return <ActivityIcon className="h-4 w-4 text-blue-600" />;
    }
  };

  const getHealthColor = (score: number) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-yellow-500';
    if (score >= 40) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const getActivityStatus = (lastActivity: string) => {
    const now = new Date();
    const activityDate = new Date(lastActivity);
    const diffHours = (now.getTime() - activityDate.getTime()) / (1000 * 60 * 60);
    
    if (diffHours < 1) return { status: 'Online', color: 'text-green-600', icon: WifiIcon };
    if (diffHours < 24) return { status: 'Recent', color: 'text-yellow-600', icon: ClockIcon };
    if (diffHours < 168) return { status: 'This Week', color: 'text-orange-600', icon: ClockIcon };
    return { status: 'Inactive', color: 'text-red-600', icon: XCircleIcon };
  };

  const overallStats = {
    totalTenants: healthMetrics.length,
    excellentHealth: healthMetrics.filter(m => m.healthScore >= 80).length,
    goodHealth: healthMetrics.filter(m => m.healthScore >= 60 && m.healthScore < 80).length,
    fairHealth: healthMetrics.filter(m => m.healthScore >= 40 && m.healthScore < 60).length,
    poorHealth: healthMetrics.filter(m => m.healthScore < 40).length,
    averageScore: healthMetrics.length > 0 
      ? Math.round(healthMetrics.reduce((sum, m) => sum + m.healthScore, 0) / healthMetrics.length)
      : 0,
    activeToday: healthMetrics.filter(m => {
      const now = new Date();
      const activityDate = new Date(m.lastActivity);
      return (now.getTime() - activityDate.getTime()) < (24 * 60 * 60 * 1000);
    }).length,
    totalUsers: healthMetrics.reduce((sum, m) => sum + m.metrics.totalUsers, 0),
    totalPages: healthMetrics.reduce((sum, m) => sum + m.metrics.totalPages, 0),
    totalPosts: healthMetrics.reduce((sum, m) => sum + m.metrics.totalPosts, 0)
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading health metrics...</p>
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
              📊 Tenant Health Monitoring
            </h1>
            <p className="text-gray-600 mt-1">
              Monitor the health and activity of all tenants • {overallStats.totalTenants} total tenants
            </p>
          </div>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleRefresh}
          disabled={refreshing}
        >
          <RefreshCwIcon className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="detailed">Detailed Metrics</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
                  <ShieldIcon className="h-4 w-4 mr-2" />
                  Average Health Score
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-3xl font-bold">{overallStats.averageScore}</div>
                  <div className="flex items-center">
                    {overallStats.averageScore >= 70 ? (
                      <TrendingUpIcon className="h-5 w-5 text-green-600" />
                    ) : (
                      <TrendingDownIcon className="h-5 w-5 text-red-600" />
                    )}
                  </div>
                </div>
                <Progress 
                  value={overallStats.averageScore} 
                  className="mt-2"
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
                  <CheckCircleIcon className="h-4 w-4 mr-2" />
                  Excellent Health
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">{overallStats.excellentHealth}</div>
                <p className="text-sm text-gray-500 mt-1">
                  {overallStats.totalTenants > 0 
                    ? Math.round((overallStats.excellentHealth / overallStats.totalTenants) * 100)
                    : 0}% of tenants
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
                  <AlertTriangleIcon className="h-4 w-4 mr-2" />
                  Need Attention
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-orange-600">
                  {overallStats.fairHealth + overallStats.poorHealth}
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  Fair or poor health
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
                  <ActivityIcon className="h-4 w-4 mr-2" />
                  Active Today
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-600">{overallStats.activeToday}</div>
                <p className="text-sm text-gray-500 mt-1">
                  {overallStats.totalTenants > 0 
                    ? Math.round((overallStats.activeToday / overallStats.totalTenants) * 100)
                    : 0}% active today
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Health Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Health Score Distribution</CardTitle>
              <CardDescription>
                Distribution of tenant health scores across different categories
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                  <div className="text-2xl font-bold text-green-600">{overallStats.excellentHealth}</div>
                  <div className="text-sm text-green-700 font-medium">Excellent (80-100)</div>
                  <div className="text-xs text-green-600 mt-1">Optimal performance</div>
                </div>
                <div className="text-center p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                  <div className="text-2xl font-bold text-yellow-600">{overallStats.goodHealth}</div>
                  <div className="text-sm text-yellow-700 font-medium">Good (60-79)</div>
                  <div className="text-xs text-yellow-600 mt-1">Minor improvements needed</div>
                </div>
                <div className="text-center p-4 bg-orange-50 rounded-lg border border-orange-200">
                  <div className="text-2xl font-bold text-orange-600">{overallStats.fairHealth}</div>
                  <div className="text-sm text-orange-700 font-medium">Fair (40-59)</div>
                  <div className="text-xs text-orange-600 mt-1">Attention required</div>
                </div>
                <div className="text-center p-4 bg-red-50 rounded-lg border border-red-200">
                  <div className="text-2xl font-bold text-red-600">{overallStats.poorHealth}</div>
                  <div className="text-sm text-red-700 font-medium">Poor (0-39)</div>
                  <div className="text-xs text-red-600 mt-1">Immediate action needed</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Detailed Metrics Tab */}
        <TabsContent value="detailed" className="space-y-6">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FilterIcon className="h-5 w-5 mr-2" />
                Filters & Search
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div>
                  <Input
                    placeholder="Search tenants..."
                    value={filters.search}
                    onChange={(e) => handleFilterChange('search', e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && applyFilters()}
                  />
                </div>
                <Select value={filters.healthRange} onValueChange={(value) => handleFilterChange('healthRange', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Health Range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Health Scores</SelectItem>
                    <SelectItem value="EXCELLENT">Excellent (80-100)</SelectItem>
                    <SelectItem value="GOOD">Good (60-79)</SelectItem>
                    <SelectItem value="FAIR">Fair (40-59)</SelectItem>
                    <SelectItem value="POOR">Poor (0-39)</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filters.status} onValueChange={(value) => handleFilterChange('status', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Statuses</SelectItem>
                    <SelectItem value="ACTIVE">Active</SelectItem>
                    <SelectItem value="PENDING">Pending</SelectItem>
                    <SelectItem value="SUSPENDED">Suspended</SelectItem>
                    <SelectItem value="ARCHIVED">Archived</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filters.lastActivity} onValueChange={(value) => handleFilterChange('lastActivity', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Last Activity" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Time</SelectItem>
                    <SelectItem value="TODAY">Today</SelectItem>
                    <SelectItem value="WEEK">This Week</SelectItem>
                    <SelectItem value="MONTH">This Month</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={applyFilters} className="w-full">
                  <SearchIcon className="h-4 w-4 mr-2" />
                  Apply
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Detailed Health Metrics */}
          <Card>
            <CardHeader>
              <CardTitle>Individual Tenant Health</CardTitle>
              <CardDescription>
                Detailed health metrics for each tenant ({healthMetrics.length} tenants)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {healthMetrics.map((metric) => {
                  const activityStatus = getActivityStatus(metric.lastActivity);
                  const ActivityIcon = activityStatus.icon;
                  
                  return (
                    <div key={metric.tenantId} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <div className="flex items-center space-x-2">
                            {getStatusIcon(metric.status)}
                            <h3 className="font-semibold text-lg">{metric.tenantName}</h3>
                          </div>
                          {getHealthBadge(metric.healthScore)}
                          <div className={`flex items-center space-x-1 text-xs ${activityStatus.color}`}>
                            <ActivityIcon className="h-3 w-3" />
                            <span>{activityStatus.status}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold">{metric.healthScore}</div>
                          <div className="text-xs text-gray-500">Health Score</div>
                        </div>
                      </div>

                      <div className="mb-4">
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span>Health Score</span>
                          <span>{metric.healthScore}/100</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${getHealthColor(metric.healthScore)}`}
                            style={{ width: `${metric.healthScore}%` }}
                          ></div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center p-3 bg-gray-50 rounded">
                          <div className="flex items-center justify-center mb-1">
                            <UsersIcon className="h-4 w-4 text-gray-500" />
                          </div>
                          <div className="text-lg font-semibold">{metric.metrics.totalUsers}</div>
                          <div className="text-xs text-gray-500">
                            Users ({metric.metrics.activeUsers} active)
                          </div>
                        </div>
                        <div className="text-center p-3 bg-gray-50 rounded">
                          <div className="flex items-center justify-center mb-1">
                            <FileTextIcon className="h-4 w-4 text-gray-500" />
                          </div>
                          <div className="text-lg font-semibold">{metric.metrics.totalPages}</div>
                          <div className="text-xs text-gray-500">
                            Pages ({metric.metrics.publishedPages} published)
                          </div>
                        </div>
                        <div className="text-center p-3 bg-gray-50 rounded">
                          <div className="flex items-center justify-center mb-1">
                            <HomeIcon className="h-4 w-4 text-gray-500" />
                          </div>
                          <div className="text-lg font-semibold">{metric.metrics.totalPosts}</div>
                          <div className="text-xs text-gray-500">
                            Posts ({metric.metrics.publishedPosts} published)
                          </div>
                        </div>
                        <div className="text-center p-3 bg-gray-50 rounded">
                          <div className="flex items-center justify-center mb-1">
                            <BarChartIcon className="h-4 w-4 text-gray-500" />
                          </div>
                          <div className="text-lg font-semibold">{metric.metrics.features.length}</div>
                          <div className="text-xs text-gray-500">Features</div>
                        </div>
                      </div>

                      <div className="mt-4 pt-4 border-t">
                        <div className="flex items-center justify-between text-sm text-gray-600">
                          <span>Last Activity:</span>
                          <span>{new Date(metric.lastActivity).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <DatabaseIcon className="h-5 w-5 mr-2" />
                  Platform Totals
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Total Users:</span>
                  <span className="font-semibold">{overallStats.totalUsers.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Total Pages:</span>
                  <span className="font-semibold">{overallStats.totalPages.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Total Posts:</span>
                  <span className="font-semibold">{overallStats.totalPosts.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Active Tenants:</span>
                  <span className="font-semibold">{healthMetrics.filter(m => m.status === 'ACTIVE').length}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <HardDriveIcon className="h-5 w-5 mr-2" />
                  Resource Usage
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span>Avg Users per Tenant</span>
                    <span>{overallStats.totalTenants > 0 ? Math.round(overallStats.totalUsers / overallStats.totalTenants) : 0}</span>
                  </div>
                  <Progress value={overallStats.totalTenants > 0 ? (overallStats.totalUsers / overallStats.totalTenants) * 2 : 0} className="h-2" />
                </div>
                <div>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span>Avg Pages per Tenant</span>
                    <span>{overallStats.totalTenants > 0 ? Math.round(overallStats.totalPages / overallStats.totalTenants) : 0}</span>
                  </div>
                  <Progress value={overallStats.totalTenants > 0 ? (overallStats.totalPages / overallStats.totalTenants) : 0} className="h-2" />
                </div>
                <div>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span>Avg Posts per Tenant</span>
                    <span>{overallStats.totalTenants > 0 ? Math.round(overallStats.totalPosts / overallStats.totalTenants) : 0}</span>
                  </div>
                  <Progress value={overallStats.totalTenants > 0 ? (overallStats.totalPosts / overallStats.totalTenants) / 2 : 0} className="h-2" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <ActivityIcon className="h-5 w-5 mr-2" />
                  Activity Insights
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center p-3 bg-green-50 rounded">
                  <div className="text-lg font-bold text-green-600">
                    {healthMetrics.filter(m => getActivityStatus(m.lastActivity).status === 'Online').length}
                  </div>
                  <div className="text-xs text-green-700">Online Now</div>
                </div>
                <div className="text-center p-3 bg-yellow-50 rounded">
                  <div className="text-lg font-bold text-yellow-600">
                    {healthMetrics.filter(m => getActivityStatus(m.lastActivity).status === 'Recent').length}
                  </div>
                  <div className="text-xs text-yellow-700">Active Today</div>
                </div>
                <div className="text-center p-3 bg-orange-50 rounded">
                  <div className="text-lg font-bold text-orange-600">
                    {healthMetrics.filter(m => getActivityStatus(m.lastActivity).status === 'This Week').length}
                  </div>
                  <div className="text-xs text-orange-700">This Week</div>
                </div>
                <div className="text-center p-3 bg-red-50 rounded">
                  <div className="text-lg font-bold text-red-600">
                    {healthMetrics.filter(m => getActivityStatus(m.lastActivity).status === 'Inactive').length}
                  </div>
                  <div className="text-xs text-red-700">Inactive</div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* No data state */}
      {healthMetrics.length === 0 && !loading && (
        <Card>
          <CardContent className="text-center py-12">
            <ActivityIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No health data found</h3>
            <p className="text-gray-500">
              {Object.values(filters).some(f => f !== 'ALL' && f !== '') 
                ? 'Try adjusting your filters to see more results.'
                : 'No tenant health metrics are available at this time.'}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 