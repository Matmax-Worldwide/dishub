'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircleIcon, 
  SettingsIcon, 
  BarChartIcon,
  TrendingUpIcon,
  ActivityIcon
} from 'lucide-react';

export default function ActiveModulesPage() {
  const activeModules = [
    { 
      id: 1, 
      name: 'CMS Engine', 
      description: 'Content Management System', 
      version: '2.1.0',
      uptime: '99.9%',
      lastUpdate: '2024-01-15',
      usage: 'High',
      status: 'Healthy'
    },
    { 
      id: 2, 
      name: 'E-commerce Engine', 
      description: 'Online store functionality', 
      version: '1.8.3',
      uptime: '99.7%',
      lastUpdate: '2024-01-10',
      usage: 'Medium',
      status: 'Healthy'
    },
    { 
      id: 3, 
      name: 'Legal Engine', 
      description: 'Legal case management', 
      version: '1.0.5',
      uptime: '98.5%',
      lastUpdate: '2024-01-08',
      usage: 'Low',
      status: 'Warning'
    },
  ];

  const getUsageBadge = (usage: string) => {
    const variants = {
      High: 'bg-red-100 text-red-800',
      Medium: 'bg-yellow-100 text-yellow-800',
      Low: 'bg-green-100 text-green-800'
    };
    return variants[usage as keyof typeof variants] || 'bg-gray-100 text-gray-800';
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      Healthy: 'bg-green-100 text-green-800',
      Warning: 'bg-yellow-100 text-yellow-800',
      Error: 'bg-red-100 text-red-800'
    };
    return variants[status as keyof typeof variants] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Active Modules</h1>
          <p className="text-gray-600 mt-1">Monitor and manage your currently running modules</p>
        </div>
        <Button variant="outline">
          <BarChartIcon className="h-4 w-4 mr-2" />
          View Analytics
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Modules</CardTitle>
            <CheckCircleIcon className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">3</div>
            <p className="text-xs text-muted-foreground">Currently running</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Uptime</CardTitle>
            <TrendingUpIcon className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">99.4%</div>
            <p className="text-xs text-muted-foreground">Last 30 days</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Usage</CardTitle>
            <ActivityIcon className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">2.4K</div>
            <p className="text-xs text-muted-foreground">Requests today</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Health Status</CardTitle>
            <CheckCircleIcon className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">Good</div>
            <p className="text-xs text-muted-foreground">All systems operational</p>
          </CardContent>
        </Card>
      </div>

      {/* Active Modules List */}
      <Card>
        <CardHeader>
          <CardTitle>Active Modules</CardTitle>
          <CardDescription>Detailed view of your currently running modules</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {activeModules.map((module) => (
              <div key={module.id} className="p-6 border rounded-lg bg-green-50/50">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-4">
                    <CheckCircleIcon className="h-6 w-6 text-green-500" />
                    <div>
                      <h3 className="text-lg font-semibold">{module.name}</h3>
                      <p className="text-sm text-gray-600">{module.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge className={getStatusBadge(module.status)}>
                      {module.status}
                    </Badge>
                    <Button variant="outline" size="sm">
                      <SettingsIcon className="h-4 w-4 mr-2" />
                      Configure
                    </Button>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Version</p>
                    <p className="font-medium">{module.version}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Uptime</p>
                    <p className="font-medium text-green-600">{module.uptime}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Last Update</p>
                    <p className="font-medium">{module.lastUpdate}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Usage</p>
                    <Badge className={getUsageBadge(module.usage)} variant="secondary">
                      {module.usage}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-gray-500">Actions</p>
                    <div className="flex space-x-1">
                      <Button variant="ghost" size="sm">Restart</Button>
                      <Button variant="ghost" size="sm">Logs</Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Module Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Overview</CardTitle>
          <CardDescription>Real-time performance metrics for active modules</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <BarChartIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Performance Dashboard</h3>
            <p className="text-gray-600">Detailed performance metrics and monitoring charts</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 