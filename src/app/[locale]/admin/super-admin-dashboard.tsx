'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Building2, 
  Users, 
  Activity, 
  DollarSign, 
  TrendingUp, 
  Server,
  CheckCircle
} from 'lucide-react';
import { useQuery } from '@apollo/client';
import { gql } from '@apollo/client';
import { Skeleton } from '@/components/ui/skeleton';

// GraphQL queries for platform-wide data
const GET_PLATFORM_STATS = gql`
  query GetPlatformStats {
    tenants {
      id
      name
      isActive
      createdAt
      features
    }
    users {
      id
      
      email
      role {
        name
      }
      tenantId
      createdAt
    }
  }
`;

export default function SuperAdminDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  
  // Fetch platform-wide stats
  const { data, loading } = useQuery(GET_PLATFORM_STATS);
  
  // Calculate platform metrics
  const platformStats = {
    totalTenants: data?.tenants?.length || 0,
    activeTenants: data?.tenants?.filter((t: { isActive: boolean }) => t.isActive)?.length || 0,
    totalUsers: data?.users?.length || 0,
    superAdmins: data?.users?.filter((u: { role: { name: string } }) => u.role?.name === 'SUPER_ADMIN')?.length || 0,
    admins: data?.users?.filter((u: { role: { name: string } }) => u.role?.name === 'ADMIN')?.length || 0,
    regularUsers: data?.users?.filter((u: { role: { name: string } }) => 
      !['SUPER_ADMIN', 'ADMIN'].includes(u.role?.name))?.length || 0
  };

  const recentTenants = data?.tenants
    ?.slice()
    ?.sort((a: { createdAt: string }, b: { createdAt: string }) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    ?.slice(0, 5) || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col">
        <h1 className="text-3xl font-bold tracking-tight">Super Admin Dashboard</h1>
        <p className="text-muted-foreground">
          Platform-wide management and analytics for all tenants and users.
        </p>
      </div>
      
      <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5 mb-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="tenants">Tenants</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="system">System</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-6">
          {/* Platform Metrics */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Tenants</CardTitle>
                <Building2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {loading ? (
                  <Skeleton className="h-8 w-20" />
                ) : (
                  <>
                    <div className="text-2xl font-bold">{platformStats.totalTenants}</div>
                    <p className="text-xs text-muted-foreground">
                      {platformStats.activeTenants} active
                    </p>
                  </>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {loading ? (
                  <Skeleton className="h-8 w-20" />
                ) : (
                  <>
                    <div className="text-2xl font-bold">{platformStats.totalUsers}</div>
                    <p className="text-xs text-muted-foreground">
                      Across all tenants
                    </p>
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Platform Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">$12,450</div>
                <p className="text-xs text-muted-foreground">
                  +20.1% from last month
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">System Health</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span className="text-sm font-medium">Healthy</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  All systems operational
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity & Quick Actions */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Recent Tenants</CardTitle>
                <CardDescription>
                  Latest tenant registrations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {loading ? (
                    Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="flex items-center space-x-4">
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-32" />
                          <Skeleton className="h-3 w-24" />
                        </div>
                      </div>
                    ))
                  ) : (
                    recentTenants.map((tenant: { id: string; name: string; createdAt: string; isActive: boolean }) => (
                      <div key={tenant.id} className="flex items-center space-x-4">
                        <div className="bg-blue-100 p-2 rounded-full">
                          <Building2 className="h-4 w-4 text-blue-500" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">{tenant.name}</p>
                          <p className="text-xs text-gray-500">
                            {new Date(tenant.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="ml-auto">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            tenant.isActive 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {tenant.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Platform Actions</CardTitle>
                <CardDescription>
                  Quick access to common tasks
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => window.location.href = '/admin/tenants/create'}
                    className="p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors flex flex-col items-center justify-center"
                  >
                    <Building2 className="h-6 w-6 text-blue-500 mb-2" />
                    <span className="text-sm font-medium">Create Tenant</span>
                  </button>
                  
                  <button
                    onClick={() => window.location.href = '/admin/users'}
                    className="p-4 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors flex flex-col items-center justify-center"
                  >
                    <Users className="h-6 w-6 text-purple-500 mb-2" />
                    <span className="text-sm font-medium">Manage Users</span>
                  </button>
                  
                  <button
                    onClick={() => window.location.href = '/admin/analytics'}
                    className="p-4 bg-green-50 hover:bg-green-100 rounded-lg transition-colors flex flex-col items-center justify-center"
                  >
                    <TrendingUp className="h-6 w-6 text-green-500 mb-2" />
                    <span className="text-sm font-medium">View Analytics</span>
                  </button>
                  
                  <button
                    onClick={() => window.location.href = '/admin/system/health'}
                    className="p-4 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors flex flex-col items-center justify-center"
                  >
                    <Server className="h-6 w-6 text-orange-500 mb-2" />
                    <span className="text-sm font-medium">System Status</span>
                  </button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="tenants" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Tenant Management</CardTitle>
              <CardDescription>
                Manage all tenants in the platform
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Tenant management features coming soon</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="users" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
              <CardDescription>
                Manage all users across all tenants
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">User management features coming soon</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="analytics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Platform Analytics</CardTitle>
              <CardDescription>
                Comprehensive analytics across all tenants
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Analytics dashboard coming soon</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="system" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>System Status</CardTitle>
              <CardDescription>
                Monitor platform health and performance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Server className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">System monitoring dashboard coming soon</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 