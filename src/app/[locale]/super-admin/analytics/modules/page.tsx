'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { Button } from '@/app/components/ui/button';
import { 
  PackageIcon,
  RefreshCwIcon,
  BarChartIcon,
  TrendingUpIcon,
  UsersIcon,
  CheckCircleIcon,
  XCircleIcon
} from 'lucide-react';
import { SuperAdminClient, type GlobalModules } from '@/lib/graphql/superAdmin';
import { toast } from 'sonner';

export default function SuperAdminAnalyticsModulesPage() {
  const [data, setData] = useState<GlobalModules | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadModulesAnalytics = async () => {
    try {
      setLoading(true);
      
      // Use GraphQL client
      const modulesData = await SuperAdminClient.getGlobalModules();
      setData(modulesData);
    } catch (error) {
      console.error('Error loading modules analytics:', error);
      toast.error('Failed to load modules analytics');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadModulesAnalytics();
    setRefreshing(false);
    toast.success('Modules analytics refreshed');
  };

  const getUsageColor = (percentage: number) => {
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 60) return 'text-yellow-600';
    if (percentage >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  const getUsageBadge = (percentage: number) => {
    if (percentage >= 80) return <Badge className="bg-green-100 text-green-800">High Usage</Badge>;
    if (percentage >= 60) return <Badge className="bg-yellow-100 text-yellow-800">Medium Usage</Badge>;
    if (percentage >= 40) return <Badge className="bg-orange-100 text-orange-800">Low Usage</Badge>;
    return <Badge className="bg-red-100 text-red-800">Very Low Usage</Badge>;
  };

  useEffect(() => {
    loadModulesAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading modules analytics...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <PackageIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No data available</h3>
          <p className="text-gray-600 mb-4">Unable to load modules analytics data.</p>
          <Button onClick={loadModulesAnalytics}>
            <RefreshCwIcon className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            📊 Module Usage Analytics
          </h1>
          <p className="text-gray-600 mt-1">
            Analyze module adoption and usage across all tenants • {data.totalModules} modules tracked
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
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6 text-center">
            <PackageIcon className="h-8 w-8 text-indigo-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-900">{data.totalModules}</div>
            <div className="text-sm text-gray-600">Total Modules</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6 text-center">
            <UsersIcon className="h-8 w-8 text-blue-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-900">{data.totalTenants}</div>
            <div className="text-sm text-gray-600">Total Tenants</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6 text-center">
            <CheckCircleIcon className="h-8 w-8 text-green-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-900">
              {data.modules.filter(m => m.isActive).length}
            </div>
            <div className="text-sm text-gray-600">Active Modules</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6 text-center">
            <TrendingUpIcon className="h-8 w-8 text-purple-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-900">
              {Math.round(data.modules.reduce((sum, m) => sum + m.usagePercentage, 0) / data.modules.length)}%
            </div>
            <div className="text-sm text-gray-600">Avg. Usage</div>
          </CardContent>
        </Card>
      </div>

      {/* Module Usage Details */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl flex items-center">
            <BarChartIcon className="h-6 w-6 mr-2" />
            Module Usage Breakdown
          </CardTitle>
          <CardDescription>
            Detailed usage statistics for each module across all tenants
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.modules
              .sort((a, b) => b.usagePercentage - a.usagePercentage)
              .map((module, index) => (
                <div key={module.name} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center justify-center w-8 h-8 bg-indigo-100 text-indigo-600 rounded-full text-sm font-medium">
                      {index + 1}
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">{module.name}</h3>
                      <p className="text-sm text-gray-600">
                        Used by {module.usageCount} of {data.totalTenants} tenants
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <div className={`text-2xl font-bold ${getUsageColor(module.usagePercentage)}`}>
                        {module.usagePercentage.toFixed(1)}%
                      </div>
                      <div className="text-sm text-gray-600">Usage Rate</div>
                    </div>
                    
                    <div className="flex flex-col items-end space-y-2">
                      {getUsageBadge(module.usagePercentage)}
                      {module.isActive ? (
                        <Badge variant="outline" className="text-green-600 border-green-200">
                          <CheckCircleIcon className="h-3 w-3 mr-1" />
                          Active
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-red-600 border-red-200">
                          <XCircleIcon className="h-3 w-3 mr-1" />
                          Inactive
                        </Badge>
                      )}
                    </div>
                    
                    <div className="w-32">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${module.usagePercentage}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>

      {/* Usage Distribution */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Usage Distribution</CardTitle>
            <CardDescription>Modules categorized by usage levels</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { label: 'High Usage (80%+)', count: data.modules.filter(m => m.usagePercentage >= 80).length, color: 'bg-green-500' },
                { label: 'Medium Usage (60-79%)', count: data.modules.filter(m => m.usagePercentage >= 60 && m.usagePercentage < 80).length, color: 'bg-yellow-500' },
                { label: 'Low Usage (40-59%)', count: data.modules.filter(m => m.usagePercentage >= 40 && m.usagePercentage < 60).length, color: 'bg-orange-500' },
                { label: 'Very Low Usage (<40%)', count: data.modules.filter(m => m.usagePercentage < 40).length, color: 'bg-red-500' }
              ].map((category) => (
                <div key={category.label} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-4 h-4 rounded ${category.color}`}></div>
                    <span className="text-sm text-gray-700">{category.label}</span>
                  </div>
                  <span className="font-medium">{category.count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Performing Modules</CardTitle>
            <CardDescription>Modules with highest adoption rates</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.modules
                .sort((a, b) => b.usagePercentage - a.usagePercentage)
                .slice(0, 5)
                .map((module, index) => (
                  <div key={module.name} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center justify-center w-6 h-6 bg-indigo-100 text-indigo-600 rounded-full text-xs font-medium">
                        {index + 1}
                      </div>
                      <span className="text-sm font-medium text-gray-900">{module.name}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-gray-900">{module.usagePercentage.toFixed(1)}%</div>
                      <div className="text-xs text-gray-500">{module.usageCount} tenants</div>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 