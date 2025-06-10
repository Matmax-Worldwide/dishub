'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BellIcon,
  PlusIcon,
  SearchIcon,
  MailIcon,
  CheckIcon,
  XIcon,
  ClockIcon,
  AlertCircleIcon,
  InfoIcon
} from 'lucide-react';

export default function NotificationsPage() {
  const [activeTab, setActiveTab] = useState('inbox');
  const [searchTerm, setSearchTerm] = useState('');

  const notifications = [
    {
      id: 1,
      title: 'System Maintenance Scheduled',
      message: 'Scheduled maintenance will occur on January 20th from 2:00 AM to 4:00 AM EST.',
      type: 'system',
      priority: 'high',
      read: false,
      timestamp: '2024-01-15 10:30',
      sender: 'System Administrator'
    },
    {
      id: 2,
      title: 'New User Registration',
      message: 'A new user has registered and is pending approval.',
      type: 'user',
      priority: 'medium',
      read: true,
      timestamp: '2024-01-15 09:15',
      sender: 'User Management'
    },
    {
      id: 3,
      title: 'Monthly Report Available',
      message: 'Your monthly analytics report is ready for download.',
      type: 'report',
      priority: 'low',
      read: false,
      timestamp: '2024-01-14 16:45',
      sender: 'Reports System'
    },
    {
      id: 4,
      title: 'Security Alert',
      message: 'Multiple failed login attempts detected from IP 192.168.1.100.',
      type: 'security',
      priority: 'high',
      read: true,
      timestamp: '2024-01-14 14:20',
      sender: 'Security System'
    }
  ];

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'system': return <AlertCircleIcon className="h-4 w-4" />;
      case 'user': return <BellIcon className="h-4 w-4" />;
      case 'report': return <InfoIcon className="h-4 w-4" />;
      case 'security': return <AlertCircleIcon className="h-4 w-4" />;
      default: return <BellIcon className="h-4 w-4" />;
    }
  };

  const getPriorityBadge = (priority: string) => {
    const variants = {
      high: 'bg-red-100 text-red-800',
      medium: 'bg-yellow-100 text-yellow-800',
      low: 'bg-green-100 text-green-800'
    };
    return variants[priority as keyof typeof variants] || 'bg-gray-100 text-gray-800';
  };

  const getTypeBadge = (type: string) => {
    const variants = {
      system: 'bg-blue-100 text-blue-800',
      user: 'bg-purple-100 text-purple-800',
      report: 'bg-green-100 text-green-800',
      security: 'bg-red-100 text-red-800'
    };
    return variants[type as keyof typeof variants] || 'bg-gray-100 text-gray-800';
  };

  const filteredNotifications = notifications.filter(notification =>
    notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    notification.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
    notification.sender.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
          <p className="text-gray-600 mt-1">Manage your notifications and alerts</p>
        </div>
        <Button>
          <PlusIcon className="h-4 w-4 mr-2" />
          Create Notification
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Notifications</CardTitle>
            <BellIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{notifications.length}</div>
            <p className="text-xs text-muted-foreground">All notifications</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unread</CardTitle>
            <MailIcon className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{unreadCount}</div>
            <p className="text-xs text-muted-foreground">Require attention</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">High Priority</CardTitle>
            <AlertCircleIcon className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {notifications.filter(n => n.priority === 'high').length}
            </div>
            <p className="text-xs text-muted-foreground">Urgent notifications</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today</CardTitle>
            <ClockIcon className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">3</div>
            <p className="text-xs text-muted-foreground">Received today</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="inbox">
            Inbox ({unreadCount})
          </TabsTrigger>
          <TabsTrigger value="all">All Notifications</TabsTrigger>
          <TabsTrigger value="sent">Sent</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="inbox" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Inbox</CardTitle>
                  <CardDescription>Your unread notifications</CardDescription>
                </div>
                <div className="relative">
                  <SearchIcon className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search notifications..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8 w-64"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredNotifications.filter(n => !n.read).map((notification) => (
                  <div key={notification.id} className="p-4 border rounded-lg bg-blue-50/50 border-blue-200">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3">
                        <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full">
                          {getTypeIcon(notification.type)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <h3 className="font-semibold text-gray-900">{notification.title}</h3>
                            <Badge className={getPriorityBadge(notification.priority)}>
                              {notification.priority}
                            </Badge>
                            <Badge className={getTypeBadge(notification.type)}>
                              {notification.type}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{notification.message}</p>
                          <div className="flex items-center text-xs text-gray-500">
                            <span>From: {notification.sender}</span>
                            <span className="mx-2">•</span>
                            <span>{notification.timestamp}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex space-x-1">
                        <Button variant="ghost" size="sm">
                          <CheckIcon className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <XIcon className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="all">
          <Card>
            <CardHeader>
              <CardTitle>All Notifications</CardTitle>
              <CardDescription>Complete list of all notifications</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredNotifications.map((notification) => (
                  <div key={notification.id} className={`p-4 border rounded-lg ${notification.read ? 'bg-gray-50' : 'bg-blue-50/50 border-blue-200'}`}>
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3">
                        <div className="flex items-center justify-center w-8 h-8 bg-gray-100 rounded-full">
                          {getTypeIcon(notification.type)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <h3 className={`font-semibold ${notification.read ? 'text-gray-600' : 'text-gray-900'}`}>
                              {notification.title}
                            </h3>
                            <Badge className={getPriorityBadge(notification.priority)}>
                              {notification.priority}
                            </Badge>
                            <Badge className={getTypeBadge(notification.type)}>
                              {notification.type}
                            </Badge>
                            {!notification.read && (
                              <Badge className="bg-blue-100 text-blue-800">New</Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{notification.message}</p>
                          <div className="flex items-center text-xs text-gray-500">
                            <span>From: {notification.sender}</span>
                            <span className="mx-2">•</span>
                            <span>{notification.timestamp}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sent">
          <Card>
            <CardHeader>
              <CardTitle>Sent Notifications</CardTitle>
              <CardDescription>Notifications you have sent</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <MailIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Sent Notifications</h3>
                <p className="text-gray-600">You have not sent any notifications yet.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>Notification Settings</CardTitle>
              <CardDescription>Configure your notification preferences</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <BellIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Notification Preferences</h3>
                <p className="text-gray-600">Configure how and when you receive notifications</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 