'use client';

import React, { useEffect } from 'react';
import { useQuery, gql } from '@apollo/client';
import { client } from '@/app/lib/apollo-client';
import { useRouter, useParams } from 'next/navigation';
import { 
  Calendar, 
  Users, 
  Clock, 
  TrendingUp, 
  Plus,
  CalendarDays,
  Briefcase,
  UserCheck
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

// GraphQL Queries
const GET_BOOKING_STATS = gql`
  query GetBookingStats {
    bookingStats {
      totalBookings
      todayBookings
      upcomingBookings
      completedBookings
      revenue
    }
  }
`;

const GET_RECENT_BOOKINGS = gql`
  query GetRecentBookings($limit: Int) {
    recentBookings(limit: $limit) {
      id
      title
      startTime
      endTime
      status
      clientName
      serviceName
      staffName
    }
  }
`;

interface BookingStats {
  totalBookings: number;
  todayBookings: number;
  upcomingBookings: number;
  completedBookings: number;
  revenue: number;
}

interface RecentBooking {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  status: string;
  clientName: string;
  serviceName: string;
  staffName: string;
}

export default function BookingsDashboard() {
  const router = useRouter();
  const { locale } = useParams();

  // Check for authentication token
  useEffect(() => {
    const cookies = document.cookie;
    const hasToken = cookies.includes('session-token=');
    
    if (!hasToken) {
      console.log('No session token detected, redirecting to login');
      router.push(`/${locale}/login`);
    }
  }, [locale, router]);

  // Load booking statistics
  const { loading: statsLoading, error: statsError, data: statsData } = useQuery(GET_BOOKING_STATS, {
    client,
    errorPolicy: 'all',
    fetchPolicy: 'network-only',
    context: {
      headers: {
        credentials: 'include',
      }
    },
    onError: (error) => {
      console.error('Booking stats query error:', error);
      if (error.message.includes('Not authenticated')) {
        router.push(`/${locale}/login`);
      }
    }
  });

  // Load recent bookings
  const { loading: bookingsLoading, error: bookingsError, data: bookingsData } = useQuery(GET_RECENT_BOOKINGS, {
    variables: { limit: 5 },
    client,
    errorPolicy: 'all',
    fetchPolicy: 'network-only',
    context: {
      headers: {
        credentials: 'include',
      }
    }
  });

  const stats: BookingStats = statsData?.bookingStats || {
    totalBookings: 0,
    todayBookings: 0,
    upcomingBookings: 0,
    completedBookings: 0,
    revenue: 0
  };

  const recentBookings: RecentBooking[] = bookingsData?.recentBookings || [];

  const quickActions = [
    {
      title: 'New Booking',
      description: 'Create a new booking',
      icon: Plus,
      href: `/${locale}/bookings/new`,
      color: 'bg-blue-500 hover:bg-blue-600'
    },
    {
      title: 'Calendar View',
      description: 'View booking calendar',
      icon: CalendarDays,
      href: `/${locale}/bookings/calendar`,
      color: 'bg-green-500 hover:bg-green-600'
    },
    {
      title: 'Manage Services',
      description: 'Configure services',
      icon: Briefcase,
      href: `/${locale}/bookings/services`,
      color: 'bg-purple-500 hover:bg-purple-600'
    },
    {
      title: 'Staff Management',
      description: 'Manage staff members',
      icon: UserCheck,
      href: `/${locale}/bookings/staff`,
      color: 'bg-orange-500 hover:bg-orange-600'
    }
  ];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (statsLoading || bookingsLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="h-64 bg-gray-200 rounded-lg"></div>
            <div className="h-64 bg-gray-200 rounded-lg"></div>
          </div>
        </div>
      </div>
    );
  }

  if (statsError || bookingsError) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="text-red-800 font-medium">Error loading dashboard</h3>
          <p className="text-red-600 text-sm mt-1">
            {statsError?.message || bookingsError?.message || 'An error occurred while loading the dashboard.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Bookings Dashboard</h1>
          <p className="text-gray-600 mt-1">Manage your appointments and bookings</p>
        </div>
        <Button 
          onClick={() => router.push(`/${locale}/bookings/new`)}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Booking
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalBookings}</div>
            <p className="text-xs text-muted-foreground">All time bookings</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today&apos;s Bookings</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.todayBookings}</div>
            <p className="text-xs text-muted-foreground">Scheduled for today</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.upcomingBookings}</div>
            <p className="text-xs text-muted-foreground">Future appointments</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.revenue)}</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common booking management tasks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              {quickActions.map((action, index) => (
                <Button
                  key={index}
                  variant="outline"
                  className={`h-20 flex flex-col items-center justify-center space-y-2 ${action.color} text-white border-none`}
                  onClick={() => router.push(action.href)}
                >
                  <action.icon className="h-6 w-6" />
                  <span className="text-sm font-medium">{action.title}</span>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Bookings */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Bookings</CardTitle>
            <CardDescription>Latest booking activity</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentBookings.length > 0 ? (
                recentBookings.map((booking) => (
                  <div key={booking.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-medium text-sm">{booking.title}</h4>
                      <p className="text-xs text-gray-600">
                        {booking.clientName} • {booking.serviceName}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatDateTime(booking.startTime)}
                      </p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                      {booking.status}
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No recent bookings</p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-2"
                    onClick={() => router.push(`/${locale}/bookings/new`)}
                  >
                    Create your first booking
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}