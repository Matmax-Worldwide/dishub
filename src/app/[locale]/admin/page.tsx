'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UsersIcon, BellIcon, Clock9Icon, FileTextIcon } from 'lucide-react';

export default function AdminDashboardPage() {
  const [activeTab, setActiveTab] = useState('overview');
  
  // These would ideally come from GraphQL queries
  const statsData = {
    totalUsers: 142,
    totalNotifications: 568,
    activeUsers: 87,
    pendingTasks: 24
  };
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col">
        <h1 className="text-2xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="text-muted-foreground">
          Manage your system, users, and notifications from this central dashboard.
        </p>
      </div>
      
      <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4 mb-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="system">System</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Users
                </CardTitle>
                <UsersIcon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{statsData.totalUsers}</div>
                <p className="text-xs text-muted-foreground">
                  Active accounts in system
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Notifications Sent
                </CardTitle>
                <BellIcon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{statsData.totalNotifications}</div>
                <p className="text-xs text-muted-foreground">
                  Total notifications created
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Active Users
                </CardTitle>
                <Clock9Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{statsData.activeUsers}</div>
                <p className="text-xs text-muted-foreground">
                  Users active in last 30 days
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Pending Tasks
                </CardTitle>
                <FileTextIcon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{statsData.pendingTasks}</div>
                <p className="text-xs text-muted-foreground">
                  Tasks awaiting completion
                </p>
              </CardContent>
            </Card>
          </div>
          
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
            <Card className="col-span-1">
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>
                  Latest actions across the platform
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center">
                    <div className="mr-4 bg-blue-100 p-2 rounded-full">
                      <UsersIcon className="h-4 w-4 text-blue-500" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">New user registered</p>
                      <p className="text-xs text-gray-500">2 hours ago</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    <div className="mr-4 bg-orange-100 p-2 rounded-full">
                      <BellIcon className="h-4 w-4 text-orange-500" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">System notification sent</p>
                      <p className="text-xs text-gray-500">Yesterday</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    <div className="mr-4 bg-green-100 p-2 rounded-full">
                      <FileTextIcon className="h-4 w-4 text-green-500" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Document approved</p>
                      <p className="text-xs text-gray-500">3 days ago</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="col-span-1">
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>
                  Common admin tasks
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => window.location.href = `/${window.location.pathname.split('/')[1]}/admin/notifications`}
                    className="p-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors flex flex-col items-center justify-center"
                  >
                    <BellIcon className="h-5 w-5 text-blue-500 mb-1" />
                    <span className="text-sm font-medium">Create Notification</span>
                  </button>
                  
                  <button
                    onClick={() => window.location.href = `/${window.location.pathname.split('/')[1]}/admin/users`}
                    className="p-3 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors flex flex-col items-center justify-center"
                  >
                    <UsersIcon className="h-5 w-5 text-purple-500 mb-1" />
                    <span className="text-sm font-medium">Manage Users</span>
                  </button>
                  
                  <button
                    className="p-3 bg-green-50 hover:bg-green-100 rounded-lg transition-colors flex flex-col items-center justify-center"
                  >
                    <Clock9Icon className="h-5 w-5 text-green-500 mb-1" />
                    <span className="text-sm font-medium">Activity Logs</span>
                  </button>
                  
                  <button
                    className="p-3 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors flex flex-col items-center justify-center"
                  >
                    <FileTextIcon className="h-5 w-5 text-orange-500 mb-1" />
                    <span className="text-sm font-medium">System Status</span>
                  </button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
              <CardDescription>
                Visit the complete user management page to perform user operations.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-6">
                <button
                  onClick={() => window.location.href = `/${window.location.pathname.split('/')[1]}/admin/users`}
                  className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
                >
                  Go to User Management
                </button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Notification Center</CardTitle>
              <CardDescription>
                Create and manage notifications for users in the system.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-6">
                <button
                  onClick={() => window.location.href = `/${window.location.pathname.split('/')[1]}/admin/notifications`}
                  className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
                >
                  Go to Notification Management
                </button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="system">
          <Card>
            <CardHeader>
              <CardTitle>System Configuration</CardTitle>
              <CardDescription>
                Manage system settings and view logs.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-6">
                <p className="mb-4 text-gray-500">System settings and logs available soon.</p>
                <button
                  onClick={() => window.location.href = `/${window.location.pathname.split('/')[1]}/admin/logs`}
                  className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
                >
                  View Activity Logs
                </button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 