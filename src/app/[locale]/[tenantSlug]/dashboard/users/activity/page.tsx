'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  ActivityIcon,
  SearchIcon,
  FilterIcon,
  DownloadIcon,
  ClockIcon,
  UserIcon,
  SettingsIcon,
  LogInIcon
} from 'lucide-react';

export default function UserActivityPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');

  const activityLogs = [
    {
      id: 1,
      user: 'John Smith',
      action: 'User Login',
      description: 'Logged into the system',
      timestamp: '2024-01-15 10:30:45',
      type: 'auth',
      ip: '192.168.1.100',
      userAgent: 'Chrome 120.0.0.0'
    },
    {
      id: 2,
      user: 'Sarah Johnson',
      action: 'Module Configuration',
      description: 'Updated CMS Engine settings',
      timestamp: '2024-01-15 09:15:22',
      type: 'config',
      ip: '192.168.1.101',
      userAgent: 'Firefox 121.0.0.0'
    },
    {
      id: 3,
      user: 'Mike Wilson',
      action: 'User Profile Update',
      description: 'Updated personal information',
      timestamp: '2024-01-14 16:45:10',
      type: 'profile',
      ip: '192.168.1.102',
      userAgent: 'Safari 17.2.1'
    },
    {
      id: 4,
      user: 'Emily Davis',
      action: 'Report Generation',
      description: 'Generated monthly sales report',
      timestamp: '2024-01-14 14:20:33',
      type: 'report',
      ip: '192.168.1.103',
      userAgent: 'Chrome 120.0.0.0'
    },
    {
      id: 5,
      user: 'John Smith',
      action: 'User Logout',
      description: 'Logged out of the system',
      timestamp: '2024-01-14 18:00:15',
      type: 'auth',
      ip: '192.168.1.100',
      userAgent: 'Chrome 120.0.0.0'
    }
  ];

  const getActionIcon = (type: string) => {
    switch (type) {
      case 'auth': return <LogInIcon className="h-4 w-4" />;
      case 'config': return <SettingsIcon className="h-4 w-4" />;
      case 'profile': return <UserIcon className="h-4 w-4" />;
      case 'report': return <ActivityIcon className="h-4 w-4" />;
      default: return <ActivityIcon className="h-4 w-4" />;
    }
  };

  const getTypeBadge = (type: string) => {
    const variants = {
      auth: 'bg-blue-100 text-blue-800',
      config: 'bg-purple-100 text-purple-800',
      profile: 'bg-green-100 text-green-800',
      report: 'bg-orange-100 text-orange-800'
    };
    return variants[type as keyof typeof variants] || 'bg-gray-100 text-gray-800';
  };

  const filteredLogs = activityLogs.filter(log => {
    const matchesSearch = log.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || log.type === filterType;
    return matchesSearch && matchesType;
  });

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">User Activity</h1>
          <p className="text-gray-600 mt-1">Monitor user actions and system events</p>
        </div>
        <Button>
          <DownloadIcon className="h-4 w-4 mr-2" />
          Export Logs
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Activities</CardTitle>
            <ActivityIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,234</div>
            <p className="text-xs text-muted-foreground">Last 30 days</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Login Events</CardTitle>
            <LogInIcon className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">456</div>
            <p className="text-xs text-muted-foreground">Authentication events</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Config Changes</CardTitle>
            <SettingsIcon className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">89</div>
            <p className="text-xs text-muted-foreground">Configuration updates</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today&apos;s Events</CardTitle>
            <ClockIcon className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">23</div>
            <p className="text-xs text-muted-foreground">Activities today</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <SearchIcon className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search activities by user, action, or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
            <div className="flex items-center gap-2">
              <FilterIcon className="h-4 w-4 text-gray-500" />
              <select 
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Types</option>
                <option value="auth">Authentication</option>
                <option value="config">Configuration</option>
                <option value="profile">Profile</option>
                <option value="report">Reports</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Activity Logs */}
      <Card>
        <CardHeader>
          <CardTitle>Activity Logs ({filteredLogs.length})</CardTitle>
          <CardDescription>Detailed audit trail of user activities</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredLogs.map((log) => (
              <div key={log.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center justify-center w-10 h-10 bg-gray-100 rounded-full">
                    {getActionIcon(log.type)}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="font-medium text-gray-900">{log.action}</h3>
                      <Badge className={getTypeBadge(log.type)}>
                        {log.type}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{log.description}</p>
                    <div className="flex items-center space-x-4 text-xs text-gray-500 mt-2">
                      <span>User: {log.user}</span>
                      <span>•</span>
                      <span>IP: {log.ip}</span>
                      <span>•</span>
                      <span>{log.userAgent}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right text-sm text-gray-500">
                  <div className="flex items-center">
                    <ClockIcon className="h-3 w-3 mr-1" />
                    {log.timestamp}
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {filteredLogs.length === 0 && (
            <div className="text-center py-8">
              <ActivityIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Activities Found</h3>
              <p className="text-gray-600">No activities match your current filters.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 