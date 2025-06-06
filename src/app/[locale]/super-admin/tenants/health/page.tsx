'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
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
  BarChartIcon
} from 'lucide-react';
import { toast } from 'sonner';

interface TenantHealthMetric {
  tenantId: string;
  tenantName: string;
  status: string;
  healthScore: number;
  metrics: {
    totalUsers: number;
    activeUsers: number;
    totalPages: number;
    publishedPages: number;
    totalPosts: number;
    publishedPosts: number;
    features: string[];
  };
  lastActivity: string;
}

export default function TenantHealthPage() {
  const [healthMetrics, setHealthMetrics] = useState<TenantHealthMetric[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadHealthData = async () => {
    try {
      setLoading(true);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock data
      const mockData: TenantHealthMetric[] = [
        {
          tenantId: '1',
          tenantName: 'Acme Corporation',
          status: 'ACTIVE',
          healthScore: 85,
          metrics: {
            totalUsers: 25,
            activeUsers: 18,
            totalPages: 45,
            publishedPages: 32,
            totalPosts: 120,
            publishedPosts: 95,
            features: ['CMS_ENGINE', 'BLOG_MODULE', 'FORMS_MODULE']
          },
          lastActivity: new Date().toISOString()
        },
        {
          tenantId: '2',
          tenantName: 'Tech Startup',
          status: 'ACTIVE',
          healthScore: 65,
          metrics: {
            totalUsers: 12,
            activeUsers: 8,
            totalPages: 20,
            publishedPages: 15,
            totalPosts: 45,
            publishedPosts: 30,
            features: ['CMS_ENGINE', 'BOOKING_ENGINE']
          },
          lastActivity: new Date(Date.now() - 86400000).toISOString()
        }
      ];
      
      setHealthMetrics(mockData);
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

  useEffect(() => {
    loadHealthData();
  }, []);

  const getHealthBadge = (score: number) => {
    if (score >= 80) return <Badge className="bg-green-100 text-green-800">Excellent</Badge>;
    if (score >= 60) return <Badge className="bg-yellow-100 text-yellow-800">Good</Badge>;
    if (score >= 40) return <Badge className="bg-orange-100 text-orange-800">Fair</Badge>;
    return <Badge className="bg-red-100 text-red-800">Poor</Badge>;
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return <CheckCircleIcon className="h-4 w-4 text-green-600" />;
      case 'inactive':
        return <XCircleIcon className="h-4 w-4 text-gray-600" />;
      case 'suspended':
        return <AlertTriangleIcon className="h-4 w-4 text-red-600" />;
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

  const overallStats = {
    totalTenants: healthMetrics.length,
    excellentHealth: healthMetrics.filter(m => m.healthScore >= 80).length,
    goodHealth: healthMetrics.filter(m => m.healthScore >= 60 && m.healthScore < 80).length,
    fairHealth: healthMetrics.filter(m => m.healthScore >= 40 && m.healthScore < 60).length,
    poorHealth: healthMetrics.filter(m => m.healthScore < 40).length,
    averageScore: healthMetrics.length > 0 
      ? Math.round(healthMetrics.reduce((sum, m) => sum + m.healthScore, 0) / healthMetrics.length)
      : 0
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            📊 Tenant Health Monitoring
          </h1>
          <p className="text-gray-600 mt-1">
            Monitor the health and activity of all tenants • {overallStats.totalTenants} total tenants
          </p>
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Average Health Score</CardTitle>
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
            <CardTitle className="text-sm font-medium text-gray-600">Excellent Health</CardTitle>
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
            <CardTitle className="text-sm font-medium text-gray-600">Need Attention</CardTitle>
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
            <CardTitle className="text-sm font-medium text-gray-600">Critical Issues</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">{overallStats.poorHealth}</div>
            <p className="text-sm text-gray-500 mt-1">
              Require immediate attention
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Detailed Health Metrics</CardTitle>
          <CardDescription>
            Individual tenant health scores and activity metrics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {healthMetrics.map((metric) => (
              <div key={metric.tenantId} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(metric.status)}
                      <h3 className="font-semibold text-lg">{metric.tenantName}</h3>
                    </div>
                    {getHealthBadge(metric.healthScore)}
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
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 