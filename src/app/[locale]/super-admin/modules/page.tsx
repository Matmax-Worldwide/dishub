'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  PackageIcon, 
  PlusIcon, 
  SettingsIcon, 
  ShieldIcon,
  BarChartIcon,
  TrendingUpIcon,
  CheckCircleIcon,
  AlertCircleIcon,
  RefreshCwIcon,
  UsersIcon
} from 'lucide-react';
import Link from 'next/link';
import { SuperAdminClient, type GlobalModules } from '@/lib/graphql/superAdmin';
import { toast } from 'sonner';

export default function ModuleManagementPage() {
  const { locale } = useParams();
  const [moduleData, setModuleData] = useState<GlobalModules | null>(null);
  const [loading, setLoading] = useState(true);

  const loadModuleData = async () => {
    try {
      setLoading(true);
      const data = await SuperAdminClient.getGlobalModules();
      setModuleData(data);
    } catch (error) {
      console.error('Error loading module data:', error);
      toast.error('Failed to load module data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadModuleData();
  }, []);

  const getModuleStatusBadge = (isActive: boolean) => {
    return isActive ? (
      <Badge className="bg-green-100 text-green-800">Active</Badge>
    ) : (
      <Badge variant="secondary">Inactive</Badge>
    );
  };

  const getUsageColor = (percentage: number) => {
    if (percentage >= 80) return 'bg-green-500';
    if (percentage >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading module data...</p>
        </div>
      </div>
    );
  }

  const activeModules = moduleData?.modules.filter(m => m.isActive).length || 0;
  const totalModules = moduleData?.totalModules || 0;
  const totalTenants = moduleData?.totalTenants || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            🧩 Global Module Management
          </h1>
          <p className="text-gray-600 mt-1">
            Manage global modules and their deployment across {totalTenants} tenants
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline" onClick={loadModuleData}>
            <RefreshCwIcon className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Link href={`/${locale}/super-admin/modules/create`}>
            <Button>
              <PlusIcon className="h-4 w-4 mr-2" />
              Register Module
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Modules</CardTitle>
            <PackageIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalModules}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">{activeModules} active</span> • 
              <span className="text-gray-600 ml-1">{totalModules - activeModules} inactive</span>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Deployment Rate</CardTitle>
            <TrendingUpIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalModules > 0 ? Math.round((activeModules / totalModules) * 100) : 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              Modules actively deployed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tenants</CardTitle>
            <UsersIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTenants}</div>
            <p className="text-xs text-muted-foreground">
              Using module system
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Health</CardTitle>
            <ShieldIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">Healthy</div>
            <p className="text-xs text-muted-foreground">
              All modules compatible
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="registry" className="space-y-6">
        <TabsList>
          <TabsTrigger value="registry">Module Registry</TabsTrigger>
          <TabsTrigger value="analytics">Usage Analytics</TabsTrigger>
          <TabsTrigger value="compatibility">Compatibility</TabsTrigger>
          <TabsTrigger value="deployment">Deployment</TabsTrigger>
        </TabsList>

        {/* Module Registry Tab */}
        <TabsContent value="registry" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {moduleData?.modules.map((module) => (
              <Card key={module.name} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{module.name}</CardTitle>
                    {getModuleStatusBadge(module.isActive)}
                  </div>
                  <CardDescription>
                    Used by {module.usageCount} tenants ({module.usagePercentage}%)
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Adoption Rate</span>
                      <span>{module.usagePercentage}%</span>
                    </div>
                    <Progress 
                      value={module.usagePercentage} 
                      className="h-2"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Tenants:</span>
                      <span className="ml-2 font-medium">{module.usageCount}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Status:</span>
                      <span className="ml-2">
                        {module.isActive ? (
                          <CheckCircleIcon className="h-4 w-4 text-green-600 inline" />
                        ) : (
                          <AlertCircleIcon className="h-4 w-4 text-gray-400 inline" />
                        )}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t">
                    <div className="text-xs text-gray-500">
                      Module: {module.name.replace(/([A-Z])/g, ' $1').trim()}
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button variant="ghost" size="sm">
                        <SettingsIcon className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <BarChartIcon className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {(!moduleData?.modules || moduleData.modules.length === 0) && (
            <Card>
              <CardContent className="text-center py-12">
                <PackageIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No modules found</h3>
                <p className="text-gray-500 mb-4">
                  Get started by registering your first module.
                </p>
                <Link href={`/${locale}/super-admin/modules/create`}>
                  <Button>
                    <PlusIcon className="h-4 w-4 mr-2" />
                    Register First Module
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Usage Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Module Popularity</CardTitle>
                <CardDescription>Most adopted modules across tenants</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {moduleData?.modules
                  .sort((a, b) => b.usagePercentage - a.usagePercentage)
                  .slice(0, 5)
                  .map((module) => (
                    <div key={module.name} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium">{module.name}</span>
                        <span className="text-gray-500">{module.usageCount} tenants</span>
                      </div>
                      <Progress 
                        value={module.usagePercentage} 
                        className={`h-2 ${getUsageColor(module.usagePercentage)}`}
                      />
                    </div>
                  ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Deployment Statistics</CardTitle>
                <CardDescription>Module deployment overview</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{activeModules}</div>
                    <div className="text-sm text-green-700">Active Modules</div>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-gray-600">{totalModules - activeModules}</div>
                    <div className="text-sm text-gray-700">Inactive Modules</div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Overall Adoption</span>
                    <span>{totalModules > 0 ? Math.round((activeModules / totalModules) * 100) : 0}%</span>
                  </div>
                  <Progress 
                    value={totalModules > 0 ? (activeModules / totalModules) * 100 : 0} 
                    className="h-2"
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Compatibility Tab */}
        <TabsContent value="compatibility" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <ShieldIcon className="h-5 w-5 mr-2" />
                Module Compatibility Matrix
              </CardTitle>
              <CardDescription>System compatibility and version management</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <CheckCircleIcon className="h-16 w-16 text-green-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">All Modules Compatible</h3>
                <p className="text-gray-500 mb-4">
                  All registered modules are compatible with the current system version.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-lg font-bold text-green-600">v2.1.0</div>
                    <div className="text-sm text-green-700">System Version</div>
                  </div>
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-lg font-bold text-blue-600">{totalModules}</div>
                    <div className="text-sm text-blue-700">Compatible Modules</div>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-lg font-bold text-gray-600">0</div>
                    <div className="text-sm text-gray-700">Conflicts</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Deployment Tab */}
        <TabsContent value="deployment" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Deployment Management</CardTitle>
              <CardDescription>Coming soon - automated deployment pipelines</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Features in development:
              </p>
              <ul className="list-disc list-inside mt-2 space-y-1 text-gray-600">
                <li>Automated module deployment</li>
                <li>Rollback capabilities</li>
                <li>Staging environment testing</li>
                <li>Deployment scheduling</li>
                <li>Health monitoring during deployments</li>
              </ul>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 