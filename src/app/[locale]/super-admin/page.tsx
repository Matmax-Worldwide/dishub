'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  HomeIcon, 
  PackageIcon, 
  MessageSquareIcon, 
  BarChartIcon,
  ShieldIcon,
  AlertTriangleIcon,
  CheckCircleIcon,
  ServerIcon,
  DatabaseIcon,
  ActivityIcon,
  UsersIcon,
  RefreshCwIcon,
  SettingsIcon,
  EyeIcon,
  AlertCircleIcon
} from 'lucide-react';
import Link from 'next/link';
import { SuperAdminClient, type SuperAdminDashboard, type SystemStatus, type GlobalAnalytics } from '@/lib/graphql/superAdmin';
import { toast } from 'sonner';

interface DashboardData {
  dashboard: SuperAdminDashboard | null;
  systemStatus: SystemStatus | null;
  analytics: GlobalAnalytics | null;
}

export default function SuperAdminDashboardPage() {
  const { locale } = useParams();
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData>({
    dashboard: null,
    systemStatus: null,
    analytics: null
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Load all dashboard data in parallel
      const [dashboardData, systemStatusData, analyticsData] = await Promise.all([
        SuperAdminClient.getDashboard(),
        SuperAdminClient.getSystemStatus(),
        SuperAdminClient.getGlobalAnalytics('month')
      ]);

      setData({
        dashboard: dashboardData,
        systemStatus: systemStatusData,
        analytics: analyticsData
      });
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
    toast.success('Dashboard refreshed');
  };

  const handleSystemMaintenance = async (action: string) => {
    try {
      // Optimistic UI: Show immediate feedback
      toast.success(`Performing ${action}...`);
      
      const result = await SuperAdminClient.performSystemMaintenance(action);
      
      toast.dismiss();
      if (result.success) {
        toast.success(result.message);
        // Optimistically refresh only if needed
        if (action === 'clear-cache' || action === 'restart-services') {
          await handleRefresh();
        }
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error('Maintenance error:', error);
      toast.dismiss();
      toast.error('Failed to perform maintenance action');
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);



  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading SuperAdmin Dashboard...</p>
        </div>
      </div>
    );
  }

  const { dashboard, systemStatus, analytics } = data;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            🌐 Master Control Panel (MCP)
          </h1>
          <p className="text-gray-600 mt-1">
            Welcome back, {user?.firstName} {user?.lastName} • System Overview & Management
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Badge 
            variant="outline" 
            className={`${systemStatus?.database.status === 'healthy' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}
          >
            <DatabaseIcon className="h-3 w-3 mr-1" />
            DB: {systemStatus?.database.status || 'Unknown'}
          </Badge>
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
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="system">System Health</TabsTrigger>
          <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Tenants</CardTitle>
                <HomeIcon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dashboard?.stats.totalTenants || 0}</div>
                <p className="text-xs text-muted-foreground">
                  <span className="text-green-600">{dashboard?.stats.activeTenants || 0} active</span> • 
                  <span className="text-gray-600 ml-1">{(dashboard?.stats.totalTenants || 0) - (dashboard?.stats.activeTenants || 0)} inactive</span>
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                <UsersIcon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dashboard?.stats.totalUsers || 0}</div>
                <p className="text-xs text-muted-foreground">
                  <span className="text-green-600">{dashboard?.stats.activeUsers || 0} active</span> • 
                  <span className="text-gray-600 ml-1">{(dashboard?.stats.totalUsers || 0) - (dashboard?.stats.activeUsers || 0)} inactive</span>
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Modules</CardTitle>
                <PackageIcon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dashboard?.stats.totalModules || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Across all tenants
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">System Status</CardTitle>
                <ServerIcon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">Healthy</div>
                <p className="text-xs text-muted-foreground">
                  {dashboard?.stats.systemErrors || 0} errors • {dashboard?.stats.pendingRequests || 0} pending
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity & Quick Actions */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <ActivityIcon className="h-5 w-5 mr-2" />
                  Recent Activity
                </CardTitle>
                <CardDescription>Latest system events and tenant activities</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {dashboard?.recentActivity.tenants.slice(0, 3).map((tenant) => (
                  <div key={tenant.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    <div className="flex-shrink-0">
                      <HomeIcon className="h-4 w-4 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">
                        New tenant: {tenant.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(tenant.createdAt).toLocaleDateString()} • Status: {tenant.status}
                      </p>
                    </div>
                  </div>
                ))}
                
                {dashboard?.recentActivity.users.slice(0, 2).map((user) => (
                  <div key={user.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    <div className="flex-shrink-0">
                      <UsersIcon className="h-4 w-4 text-green-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">
                        New user: {user.firstName} {user.lastName}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(user.createdAt).toLocaleDateString()} • Role: {user.role?.name || 'No Role'}
                      </p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <SettingsIcon className="h-5 w-5 mr-2" />
                  Quick Actions
                </CardTitle>
                <CardDescription>Common administrative tasks</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Link href={`/${locale}/super-admin/tenants`}>
                  <Button variant="outline" className="w-full justify-start">
                    <HomeIcon className="h-4 w-4 mr-2" />
                    Manage Tenants
                  </Button>
                </Link>
                
                <Link href={`/${locale}/super-admin/modules`}>
                  <Button variant="outline" className="w-full justify-start">
                    <PackageIcon className="h-4 w-4 mr-2" />
                    Module Registry
                  </Button>
                </Link>
                
                <Link href={`/${locale}/super-admin/requests`}>
                  <Button variant="outline" className="w-full justify-start">
                    <MessageSquareIcon className="h-4 w-4 mr-2" />
                    Activation Requests
                    {dashboard?.stats.pendingRequests ? (
                      <Badge variant="destructive" className="ml-auto">
                        {dashboard.stats.pendingRequests}
                      </Badge>
                    ) : null}
                  </Button>
                </Link>
                
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => handleSystemMaintenance('CLEAR_CACHE')}
                >
                  <RefreshCwIcon className="h-4 w-4 mr-2" />
                  Clear System Cache
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Feature Usage */}
            <Card>
              <CardHeader>
                <CardTitle>Feature Usage</CardTitle>
                <CardDescription>Most popular modules across all tenants</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {analytics?.featureUsage.slice(0, 5).map((feature) => (
                  <div key={feature.feature} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">{feature.feature.replace('_', ' ')}</span>
                      <span className="text-gray-500">{feature.count} tenants</span>
                    </div>
                    <Progress 
                      value={(feature.count / (dashboard?.stats.totalTenants || 1)) * 100} 
                      className="h-2"
                    />
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Top Tenants */}
            <Card>
              <CardHeader>
                <CardTitle>Most Active Tenants</CardTitle>
                <CardDescription>Tenants with highest activity</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {analytics?.topTenants.slice(0, 5).map((tenant) => (
                  <div key={tenant.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium">{tenant.name}</p>
                      <p className="text-xs text-gray-500">
                        {tenant.userCount} users • {tenant.pageCount} pages
                      </p>
                    </div>
                    <Button variant="ghost" size="sm">
                      <EyeIcon className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* System Health Tab */}
        <TabsContent value="system" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Database Health */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <DatabaseIcon className="h-5 w-5 mr-2" />
                  Database Health
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>Status</span>
                    <Badge variant={systemStatus?.database.status === 'healthy' ? 'default' : 'destructive'}>
                      {systemStatus?.database.status || 'Unknown'}
                    </Badge>
                  </div>
                  {systemStatus?.database.responseTime && (
                    <div className="flex items-center justify-between">
                      <span>Response Time</span>
                      <span className="text-sm text-gray-600">{systemStatus.database.responseTime}ms</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* System Metrics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChartIcon className="h-5 w-5 mr-2" />
                  System Metrics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>Total Roles</span>
                    <span className="font-medium">{systemStatus?.metrics.system.roles || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Total Permissions</span>
                    <span className="font-medium">{systemStatus?.metrics.system.permissions || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Last Updated</span>
                    <span className="text-sm text-gray-600">
                      {systemStatus?.timestamp ? new Date(systemStatus.timestamp).toLocaleString() : 'Unknown'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Maintenance Tab */}
        <TabsContent value="maintenance" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* System Maintenance */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <SettingsIcon className="h-5 w-5 mr-2" />
                  System Maintenance
                </CardTitle>
                <CardDescription>Perform system maintenance tasks</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => handleSystemMaintenance('CLEAR_CACHE')}
                >
                  <RefreshCwIcon className="h-4 w-4 mr-2" />
                  Clear System Cache
                </Button>
                
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => handleSystemMaintenance('OPTIMIZE_DATABASE')}
                >
                  <DatabaseIcon className="h-4 w-4 mr-2" />
                  Optimize Database
                </Button>
                
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => handleSystemMaintenance('CLEANUP_LOGS')}
                >
                  <ActivityIcon className="h-4 w-4 mr-2" />
                  Cleanup System Logs
                </Button>
                
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => handleSystemMaintenance('BACKUP_SYSTEM')}
                >
                  <ShieldIcon className="h-4 w-4 mr-2" />
                  Initiate System Backup
                </Button>
              </CardContent>
            </Card>

            {/* System Alerts */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <AlertCircleIcon className="h-5 w-5 mr-2" />
                  System Alerts
                </CardTitle>
                <CardDescription>Current system warnings and notifications</CardDescription>
              </CardHeader>
              <CardContent>
                {dashboard?.stats.systemErrors === 0 ? (
                  <div className="text-center py-6">
                    <CheckCircleIcon className="h-12 w-12 text-green-500 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">No active alerts</p>
                    <p className="text-xs text-gray-500">System is running smoothly</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3 p-3 bg-red-50 rounded-lg">
                      <AlertTriangleIcon className="h-4 w-4 text-red-600" />
                      <div>
                        <p className="text-sm font-medium text-red-900">
                          {dashboard?.stats.systemErrors} system errors detected
                        </p>
                        <p className="text-xs text-red-700">
                          Requires immediate attention
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
} 