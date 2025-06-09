'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
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
  BarChart3Icon,
  Loader2
} from 'lucide-react';

// Import calendar management components
import ServiceManager from '@/components/engines/booking/ServiceManager';
import StaffManager from '@/components/engines/booking/StaffManager';
import LocationManager from '@/components/engines/booking/LocationManager';
import CategoryManager from '@/components/engines/booking/CategoryManager';
import BookingsList from '@/components/engines/booking/BookingsList';
import CalendarSection from '@/components/engines/cms/modules/sections/CalendarSection';
import graphqlClient from '@/lib/graphql-client';
import { toast } from 'sonner';

// Types for dashboard stats
interface DashboardStats {
  totalBookings: number;
  activeServices: number;
  staffMembers: number;
  locations: number;
  bookingsChange?: string;
  servicesChange?: string;
  staffChange?: string;
  locationsChange?: string;
}

interface RecentBooking {
  id: string;
  customerName?: string | null;
  service: { name: string };
  startTime: string;
  status: string;
}

interface ServiceData {
  id: string;
  name: string;
  isActive: boolean;
}

export default function CalendarManagementPage() {
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;
  
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentBookings, setRecentBookings] = useState<RecentBooking[]>([]);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoadingStats(true);
      setError(null);
      
      try {
        // Fetch all data in parallel
        const [
          bookingsData,
          servicesData, 
          staffData,
          locationsData
        ] = await Promise.allSettled([
          graphqlClient.bookings({ 
            filter: {}, 
            pagination: { page: 1, pageSize: 5 } 
          }),
          graphqlClient.services(),
          graphqlClient.staffProfiles(),
          graphqlClient.locations()
        ]);

        // Extract successful results, use empty arrays for failed requests
        const bookingsResult = bookingsData.status === 'fulfilled' ? bookingsData.value : null;
        const servicesResult = servicesData.status === 'fulfilled' ? servicesData.value : [];
        const staffResult = staffData.status === 'fulfilled' ? staffData.value : [];
        const locationsResult = locationsData.status === 'fulfilled' ? locationsData.value : [];

        // Log any failures
        if (bookingsData.status === 'rejected') {
          console.error('Failed to fetch bookings:', bookingsData.reason);
        }
        if (servicesData.status === 'rejected') {
          console.error('Failed to fetch services:', servicesData.reason);
        }
        if (staffData.status === 'rejected') {
          console.error('Failed to fetch staff:', staffData.reason);
        }
        if (locationsData.status === 'rejected') {
          console.error('Failed to fetch locations:', locationsData.reason);
        }

        // Calculate stats
        const dashboardStats: DashboardStats = {
          totalBookings: bookingsResult?.totalCount || 0,
          activeServices: servicesResult?.filter((s: ServiceData) => s.isActive).length || 0,
          staffMembers: staffResult?.length || 0,
          locations: locationsResult?.length || 0,
          // TODO: Calculate changes from previous period
          bookingsChange: '+12%', // Placeholder until we implement period comparison
          servicesChange: '+3',
          staffChange: '+1', 
          locationsChange: '0'
        };

        setStats(dashboardStats);
        
        // Set recent bookings
        if (bookingsResult?.items) {
          setRecentBookings(bookingsResult.items.slice(0, 3));
        }

      } catch (err: unknown) {
        console.error('Failed to fetch dashboard data:', err);
        const errorMsg = `Failed to load dashboard: ${err instanceof Error ? err.message : 'Unknown error'}`;
        setError(errorMsg);
        toast.error(errorMsg);
      } finally {
        setIsLoadingStats(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Generate stats cards with real data
  const statsCards = stats ? [
    {
      title: 'Total Bookings',
      value: stats.totalBookings.toString(),
      change: stats.bookingsChange || '+0%',
      icon: CalendarIcon,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      title: 'Active Services',
      value: stats.activeServices.toString(),
      change: stats.servicesChange || '+0',
      icon: ClockIcon,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      title: 'Staff Members',
      value: stats.staffMembers.toString(),
      change: stats.staffChange || '+0',
      icon: UsersIcon,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      title: 'Locations',
      value: stats.locations.toString(),
      change: stats.locationsChange || '0',
      icon: MapPinIcon,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50'
    }
  ] : [];

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

  // Loading state
  if (isLoadingStats && !stats) {
    return (
      <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <p className="ml-2">Loading calendar dashboard...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !stats) {
    return (
      <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={() => window.location.reload()}>
              Retry
            </Button>
          </div>
        </div>
      </div>
    );
  }

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
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => router.push(`/${locale}/bookings/rules`)}
          >
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
          <TabsTrigger value="categories" className="flex items-center gap-2">
            <BookOpenIcon className="w-4 h-4" />
            Categories
          </TabsTrigger>
          <TabsTrigger value="locations" className="flex items-center gap-2">
            <MapPinIcon className="w-4 h-4" />
            Locations
          </TabsTrigger>
          <TabsTrigger value="staff" className="flex items-center gap-2">
            <UsersIcon className="w-4 h-4" />
            Staff
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
            {statsCards.map((stat, index) => (
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
                  {recentBookings.length > 0 ? (
                    recentBookings.map((booking, index) => (
                      <div key={booking.id || index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">
                            {booking.service.name} - {booking.customerName || 'Guest'}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(booking.startTime).toLocaleDateString()} at {new Date(booking.startTime).toLocaleTimeString()}
                          </p>
                        </div>
                        <Badge variant="outline" className="text-xs capitalize">
                          {booking.status.toLowerCase()}
                        </Badge>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 text-sm">No recent bookings</p>
                  )}
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
