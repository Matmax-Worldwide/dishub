'use client';

import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  CalendarIcon, 
  MapPinIcon, 
  UsersIcon, 
  ClockIcon, 
  SettingsIcon,
  PlusIcon,
  BookOpenIcon,
  BarChart3Icon
} from 'lucide-react';

// Import calendar management components
import ServiceManager from '@/components/cms/calendar/ServiceManager';
import StaffManager from '@/components/cms/calendar/StaffManager';
import LocationManager from '@/components/cms/calendar/LocationManager';
import CategoryManager from '@/components/cms/calendar/CategoryManager';
import BookingsList from '@/components/cms/calendar/BookingsList';
import CalendarSection from '@/components/cms/sections/CalendarSection';

export default function CalendarManagementPage() {
  const [activeTab, setActiveTab] = useState('overview');

  const stats = [
    {
      title: 'Total Bookings',
      value: '156',
      change: '+12%',
      icon: CalendarIcon,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      title: 'Active Services',
      value: '24',
      change: '+3',
      icon: ClockIcon,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      title: 'Staff Members',
      value: '8',
      change: '+1',
      icon: UsersIcon,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      title: 'Locations',
      value: '3',
      change: '0',
      icon: MapPinIcon,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50'
    }
  ];

  const quickActions = [
    {
      title: 'Add New Service',
      description: 'Create a new bookable service',
      icon: PlusIcon,
      action: () => setActiveTab('services'),
      color: 'bg-blue-500 hover:bg-blue-600'
    },
    {
      title: 'Manage Staff',
      description: 'Add or edit staff schedules',
      icon: UsersIcon,
      action: () => setActiveTab('staff'),
      color: 'bg-green-500 hover:bg-green-600'
    },
    {
      title: 'View Bookings',
      description: 'See all upcoming appointments',
      icon: BookOpenIcon,
      action: () => setActiveTab('bookings'),
      color: 'bg-purple-500 hover:bg-purple-600'
    },
    {
      title: 'Analytics',
      description: 'View booking statistics',
      icon: BarChart3Icon,
      action: () => setActiveTab('analytics'),
      color: 'bg-orange-500 hover:bg-orange-600'
    }
  ];

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Calendar Management</h1>
          <p className="text-gray-600 mt-1">Manage your booking system, services, and appointments</p>
        </div>
        <div className="flex items-center space-x-3">
          <Badge variant="outline" className="text-green-600 border-green-200">
            System Active
          </Badge>
          <Button variant="outline" size="sm">
            <SettingsIcon className="w-4 h-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-7 lg:w-auto lg:grid-cols-7">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3Icon className="w-4 h-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="bookings" className="flex items-center gap-2">
            <CalendarIcon className="w-4 h-4" />
            Bookings
          </TabsTrigger>
          <TabsTrigger value="services" className="flex items-center gap-2">
            <ClockIcon className="w-4 h-4" />
            Services
          </TabsTrigger>
          <TabsTrigger value="staff" className="flex items-center gap-2">
            <UsersIcon className="w-4 h-4" />
            Staff
          </TabsTrigger>
          <TabsTrigger value="locations" className="flex items-center gap-2">
            <MapPinIcon className="w-4 h-4" />
            Locations
          </TabsTrigger>
          <TabsTrigger value="categories" className="flex items-center gap-2">
            <BookOpenIcon className="w-4 h-4" />
            Categories
          </TabsTrigger>
          <TabsTrigger value="booking-widget" className="flex items-center gap-2">
            <CalendarIcon className="w-4 h-4" />
            Widget
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, index) => (
              <Card key={index} className="relative overflow-hidden">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                      <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        <span className={stat.change.startsWith('+') ? 'text-green-600' : 'text-gray-500'}>
                          {stat.change}
                        </span> from last month
                      </p>
                    </div>
                    <div className={`p-3 rounded-full ${stat.bgColor}`}>
                      <stat.icon className={`w-6 h-6 ${stat.color}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common tasks to manage your calendar system</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {quickActions.map((action, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    className="h-auto p-4 flex flex-col items-center space-y-2 hover:shadow-md transition-shadow"
                    onClick={action.action}
                  >
                    <div className={`p-2 rounded-full text-white ${action.color}`}>
                      <action.icon className="w-5 h-5" />
                    </div>
                    <div className="text-center">
                      <p className="font-medium text-sm">{action.title}</p>
                      <p className="text-xs text-gray-500">{action.description}</p>
                    </div>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Recent Bookings</CardTitle>
                <CardDescription>Latest appointments scheduled</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[1, 2, 3].map((_, index) => (
                    <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">Hair Cut - John Doe</p>
                        <p className="text-xs text-gray-500">Today at 2:00 PM</p>
                      </div>
                      <Badge variant="outline" className="text-xs">Confirmed</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>System Status</CardTitle>
                <CardDescription>Current system health and performance</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Booking System</span>
                    <Badge className="bg-green-100 text-green-800">Online</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Email Notifications</span>
                    <Badge className="bg-green-100 text-green-800">Active</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">SMS Reminders</span>
                    <Badge className="bg-yellow-100 text-yellow-800">Pending Setup</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Calendar Sync</span>
                    <Badge className="bg-green-100 text-green-800">Synced</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Bookings Tab */}
        <TabsContent value="bookings">
          <Card>
            <CardHeader>
              <CardTitle>All Bookings</CardTitle>
              <CardDescription>View and manage all appointments and reservations</CardDescription>
            </CardHeader>
            <CardContent>
              <BookingsList />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Services Tab */}
        <TabsContent value="services">
          <Card>
            <CardHeader>
              <CardTitle>Service Management</CardTitle>
              <CardDescription>Create and manage your bookable services</CardDescription>
            </CardHeader>
            <CardContent>
              <ServiceManager />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Staff Tab */}
        <TabsContent value="staff">
          <Card>
            <CardHeader>
              <CardTitle>Staff Management</CardTitle>
              <CardDescription>Manage staff members and their schedules</CardDescription>
            </CardHeader>
            <CardContent>
              <StaffManager />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Locations Tab */}
        <TabsContent value="locations">
          <Card>
            <CardHeader>
              <CardTitle>Location Management</CardTitle>
              <CardDescription>Manage your business locations and their settings</CardDescription>
            </CardHeader>
            <CardContent>
              <LocationManager />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Categories Tab */}
        <TabsContent value="categories">
          <Card>
            <CardHeader>
              <CardTitle>Service Categories</CardTitle>
              <CardDescription>Organize your services into categories</CardDescription>
            </CardHeader>
            <CardContent>
              <CategoryManager />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Booking Widget Tab */}
        <TabsContent value="booking-widget">
          <Card>
            <CardHeader>
              <CardTitle>Booking Widget Preview</CardTitle>
              <CardDescription>Preview how your booking widget looks to customers</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-50 p-6 rounded-lg">
                <CalendarSection 
                  showLocationSelector={true}
                  showServiceCategories={true}
                  showStaffSelector={true}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
