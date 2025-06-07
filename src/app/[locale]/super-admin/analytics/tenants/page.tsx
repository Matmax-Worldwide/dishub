'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { 
  TrendingUpIcon,
  UsersIcon,
  HomeIcon,
  BarChartIcon,
  RefreshCwIcon,
  CalendarIcon,
  ActivityIcon
} from 'lucide-react';
import { toast } from 'sonner';

interface TenantMetrics {
  totalTenants: number;
  activeTenants: number;
  newTenantsThisMonth: number;
  tenantGrowthRate: number;
  averageUsersPerTenant: number;
  averagePagesPerTenant: number;
  topTenants: Array<{
    id: string;
    name: string;
    userCount: number;
    pageCount: number;
    lastActivity: string;
  }>;
  growthData: Array<{
    month: string;
    tenants: number;
    users: number;
  }>;
}

export default function TenantAnalyticsPage() {
  const [metrics, setMetrics] = useState<TenantMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [timeRange, setTimeRange] = useState('6months');

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock data
      const mockMetrics: TenantMetrics = {
        totalTenants: 45,
        activeTenants: 38,
        newTenantsThisMonth: 7,
        tenantGrowthRate: 18.5,
        averageUsersPerTenant: 12.3,
        averagePagesPerTenant: 28.7,
        topTenants: [
          {
            id: '1',
            name: 'Acme Corporation',
            userCount: 45,
            pageCount: 120,
            lastActivity: new Date().toISOString()
          },
          {
            id: '2',
            name: 'Tech Startup',
            userCount: 32,
            pageCount: 85,
            lastActivity: new Date(Date.now() - 86400000).toISOString()
          },
          {
            id: '3',
            name: 'Marketing Agency',
            userCount: 28,
            pageCount: 67,
            lastActivity: new Date(Date.now() - 172800000).toISOString()
          }
        ],
        growthData: [
          { month: 'Jan', tenants: 25, users: 280 },
          { month: 'Feb', tenants: 28, users: 320 },
          { month: 'Mar', tenants: 32, users: 385 },
          { month: 'Apr', tenants: 35, users: 420 },
          { month: 'May', tenants: 40, users: 485 },
          { month: 'Jun', tenants: 45, users: 550 }
        ]
      };
      
      setMetrics(mockMetrics);
    } catch (error) {
      console.error('Error loading analytics:', error);
      toast.error('Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadAnalytics();
    setRefreshing(false);
    toast.success('Analytics refreshed');
  };

  useEffect(() => {
    loadAnalytics();
  }, [timeRange]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading tenant analytics...</p>
        </div>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Failed to load analytics data</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            📊 Tenant Analytics
          </h1>
          <p className="text-gray-600 mt-1">
            Comprehensive analytics and insights for all tenants
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1month">Last Month</SelectItem>
              <SelectItem value="3months">Last 3 Months</SelectItem>
              <SelectItem value="6months">Last 6 Months</SelectItem>
              <SelectItem value="1year">Last Year</SelectItem>
            </SelectContent>
          </Select>
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

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
              <HomeIcon className="h-4 w-4 mr-2" />
              Total Tenants
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-3xl font-bold">{metrics.totalTenants}</div>
              <div className="flex items-center text-green-600">
                <TrendingUpIcon className="h-5 w-5 mr-1" />
                <span className="text-sm">+{metrics.tenantGrowthRate}%</span>
              </div>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              {metrics.activeTenants} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
              <CalendarIcon className="h-4 w-4 mr-2" />
              New This Month
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{metrics.newTenantsThisMonth}</div>
            <p className="text-sm text-gray-500 mt-1">
              New tenant registrations
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
              <UsersIcon className="h-4 w-4 mr-2" />
              Avg Users/Tenant
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{metrics.averageUsersPerTenant}</div>
            <p className="text-sm text-gray-500 mt-1">
              Average user count
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
              <BarChartIcon className="h-4 w-4 mr-2" />
              Avg Pages/Tenant
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{metrics.averagePagesPerTenant}</div>
            <p className="text-sm text-gray-500 mt-1">
              Average page count
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Growth Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Growth Trends</CardTitle>
          <CardDescription>
            Tenant and user growth over time
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
            <div className="text-center">
              <BarChartIcon className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500">Growth chart visualization would go here</p>
              <p className="text-sm text-gray-400 mt-2">
                Integration with charting library (Chart.js, Recharts, etc.)
              </p>
            </div>
          </div>
          
          {/* Simple data display */}
          <div className="mt-6 grid grid-cols-2 md:grid-cols-6 gap-4">
            {metrics.growthData.map((data, index) => (
              <div key={index} className="text-center p-3 bg-gray-50 rounded">
                <div className="text-sm font-medium text-gray-600">{data.month}</div>
                <div className="text-lg font-bold text-blue-600">{data.tenants}</div>
                <div className="text-xs text-gray-500">tenants</div>
                <div className="text-sm font-semibold text-green-600 mt-1">{data.users}</div>
                <div className="text-xs text-gray-500">users</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Top Tenants */}
      <Card>
        <CardHeader>
          <CardTitle>Top Performing Tenants</CardTitle>
          <CardDescription>
            Tenants with highest activity and engagement
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {metrics.topTenants.map((tenant, index) => (
              <div key={tenant.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center justify-center w-8 h-8 bg-indigo-100 text-indigo-600 rounded-full font-semibold">
                    {index + 1}
                  </div>
                  <div>
                    <h3 className="font-medium">{tenant.name}</h3>
                    <p className="text-sm text-gray-500">
                      Last active: {new Date(tenant.lastActivity).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-6">
                  <div className="text-center">
                    <div className="flex items-center text-gray-500 mb-1">
                      <UsersIcon className="h-4 w-4 mr-1" />
                    </div>
                    <div className="text-lg font-semibold">{tenant.userCount}</div>
                    <div className="text-xs text-gray-500">Users</div>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center text-gray-500 mb-1">
                      <BarChartIcon className="h-4 w-4 mr-1" />
                    </div>
                    <div className="text-lg font-semibold">{tenant.pageCount}</div>
                    <div className="text-xs text-gray-500">Pages</div>
                  </div>
                  <div className="flex items-center">
                    <ActivityIcon className="h-4 w-4 text-green-500" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 