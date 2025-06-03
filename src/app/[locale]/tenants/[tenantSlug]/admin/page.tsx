'use client';

import { useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  UsersIcon, 
  BellIcon, 
  Settings, 
  BarChart3,
  Shield,
  Activity,
  TrendingUp,
  Clock,
  Plus
} from 'lucide-react';
import { useQuery } from '@apollo/client';
import { gql } from '@apollo/client';
import { Skeleton } from '@/components/ui/skeleton';

// GraphQL queries for tenant-specific data
const GET_TENANT_STATS = gql`
  query GetTenantStats {
    users {
      id
      email
      firstName
      lastName
      phoneNumber
      tenantId
      role {
        id
        name
        description
      }
      createdAt
      isActive
    }
    notifications {
      id
      title
      message
      type
      isRead
      createdAt
      updatedAt
    }
    unreadNotificationsCount
  }
`;

export default function TenantAdminDashboardPage() {
  const { locale, tenantSlug } = useParams();
  
  // Fetch tenant-specific stats
  const { data: statsData, loading } = useQuery(GET_TENANT_STATS);
  
  // Extract stats from query result or provide fallbacks
  const tenantStats = {
    totalUsers: statsData?.users?.length || 0,
    totalNotifications: statsData?.unreadNotificationsCount || 0,
    activeUsers: statsData?.users?.filter((u: { isActive?: boolean }) => u.isActive !== false)?.length || 0,
    adminUsers: statsData?.users?.filter((u: { role: { name: string } }) => u.role?.name === 'ADMIN')?.length || 0,
    regularUsers: statsData?.users?.filter((u: { role: { name: string } }) => 
      !['ADMIN', 'SUPER_ADMIN'].includes(u.role?.name))?.length || 0,
    recentUsers: statsData?.users
      ?.slice()
      ?.sort((a: { createdAt: string }, b: { createdAt: string }) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      ?.slice(0, 5) || []
  };

  const recentNotifications = statsData?.notifications
    ?.slice()
    ?.sort((a: { createdAt: string }, b: { createdAt: string }) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    ?.slice(0, 5) || [];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tenant Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Welcome to the admin dashboard for <span className="font-medium">{tenantSlug}</span>
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Quick Action
          </Button>
        </div>
      </div>
      
      {/* Metrics Grid */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                <UsersIcon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {loading ? (
                  <Skeleton className="h-8 w-20" />
                ) : (
                  <>
                    <div className="text-2xl font-bold">{tenantStats.totalUsers}</div>
                    <p className="text-xs text-muted-foreground">
                  {tenantStats.activeUsers} active users
                    </p>
                  </>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Admin Users</CardTitle>
                <Shield className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {loading ? (
                  <Skeleton className="h-8 w-20" />
                ) : (
                  <>
                    <div className="text-2xl font-bold">{tenantStats.adminUsers}</div>
                    <p className="text-xs text-muted-foreground">
                  {tenantStats.regularUsers} regular users
                    </p>
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Notifications</CardTitle>
                <BellIcon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {loading ? (
                  <Skeleton className="h-8 w-20" />
                ) : (
                  <>
                    <div className="text-2xl font-bold">{tenantStats.totalNotifications}</div>
                    <p className="text-xs text-muted-foreground">
                      Unread notifications
                    </p>
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Health</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
            <div className="text-2xl font-bold text-green-600">98%</div>
                <p className="text-xs text-muted-foreground">
                  All systems operational
                </p>
              </CardContent>
            </Card>
          </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Recent Users */}
        <Card className="md:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
                <CardTitle>Recent Users</CardTitle>
              <CardDescription>Latest user registrations</CardDescription>
            </div>
            <Button variant="ghost" size="sm">
              View All
            </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex items-center space-x-3">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <div className="space-y-1 flex-1">
                          <Skeleton className="h-3 w-24" />
                      <Skeleton className="h-2 w-16" />
                        </div>
                      </div>
                    ))
                  ) : (
                tenantStats.recentUsers.map((user: { 
                      id: string; 
                      firstName?: string; 
                      lastName?: string; 
                      email: string; 
                      role: { name: string }; 
                      createdAt: string 
                    }) => (
                  <div key={user.id} className="flex items-center space-x-3">
                    <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-medium">
                      {user.firstName?.[0] || user.email[0].toUpperCase()}
                        </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                            {user.firstName && user.lastName 
                              ? `${user.firstName} ${user.lastName}` 
                              : user.email}
                          </p>
                      <p className="text-xs text-muted-foreground">
                            {user.role.name} • {new Date(user.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
            
        {/* Recent Activity */}
        <Card className="md:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest system activity</CardDescription>
            </div>
            <Button variant="ghost" size="sm">
              View All
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex items-start space-x-3">
                    <Skeleton className="h-6 w-6 rounded-full mt-1" />
                    <div className="space-y-1 flex-1">
                      <Skeleton className="h-3 w-32" />
                      <Skeleton className="h-2 w-20" />
                    </div>
                  </div>
                ))
              ) : (
                recentNotifications.slice(0, 4).map((notification: { 
                  id: string; 
                  title: string; 
                  type: string; 
                  createdAt: string 
                }) => (
                  <div key={notification.id} className="flex items-start space-x-3">
                    <div className="h-6 w-6 rounded-full bg-orange-100 flex items-center justify-center mt-1">
                      <BellIcon className="h-3 w-3 text-orange-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {notification.title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {notification.type} • {new Date(notification.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="md:col-span-2 lg:col-span-1">
              <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common administrative tasks</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
              <Button 
                variant="outline" 
                className="h-20 flex flex-col items-center justify-center"
                onClick={() => window.location.href = `/${locale}/tenants/${tenantSlug}/admin/users`}
                  >
                <UsersIcon className="h-5 w-5 mb-2" />
                <span className="text-sm">Manage Users</span>
              </Button>
                  
              <Button 
                variant="outline" 
                className="h-20 flex flex-col items-center justify-center"
                onClick={() => window.location.href = `/${locale}/tenants/${tenantSlug}/admin/notifications`}
                  >
                <BellIcon className="h-5 w-5 mb-2" />
                <span className="text-sm">Notifications</span>
              </Button>
                  
              <Button 
                variant="outline" 
                className="h-20 flex flex-col items-center justify-center"
                  >
                <BarChart3 className="h-5 w-5 mb-2" />
                <span className="text-sm">Analytics</span>
              </Button>
                  
              <Button 
                variant="outline" 
                className="h-20 flex flex-col items-center justify-center"
                onClick={() => window.location.href = `/${locale}/tenants/${tenantSlug}/admin/settings`}
              >
                <Settings className="h-5 w-5 mb-2" />
                <span className="text-sm">Settings</span>
              </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        
      {/* Performance Overview */}
      <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Growth Metrics
            </CardTitle>
            <CardDescription>User growth and engagement trends</CardDescription>
            </CardHeader>
            <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">User Growth</span>
                <span className="text-sm text-green-600 font-medium">+12%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-green-600 h-2 rounded-full" style={{ width: '75%' }}></div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Activity Rate</span>
                <span className="text-sm text-blue-600 font-medium">+8%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-blue-600 h-2 rounded-full" style={{ width: '60%' }}></div>
              </div>
              </div>
            </CardContent>
          </Card>
        
          <Card>
            <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              System Status
            </CardTitle>
            <CardDescription>Current system performance</CardDescription>
            </CardHeader>
            <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Server Response</span>
                <span className="text-sm text-green-600 font-medium">Fast</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Database</span>
                <span className="text-sm text-green-600 font-medium">Healthy</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">API Status</span>
                <span className="text-sm text-green-600 font-medium">Operational</span>
              </div>
              </div>
            </CardContent>
          </Card>
      </div>
    </div>
  );
}