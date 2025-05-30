'use client';

import React, { useState, useEffect } from 'react';
import { useQuery, gql } from '@apollo/client';
import { client } from '@/app/lib/apollo-client';
import { useRouter, useParams } from 'next/navigation';
import { format, addDays, startOfWeek, isSameDay, parseISO } from 'date-fns';
import {  
  ChevronLeft, 
  ChevronRight,
  Plus,
  Clock,
  User
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// GraphQL Queries
const GET_BOOKINGS = gql`
  query GetBookings($startDate: String!, $endDate: String!) {
    bookings(startDate: $startDate, endDate: $endDate) {
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

interface Booking {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  status: string;
  clientName: string;
  serviceName: string;
  staffName: string;
}

export default function BookingsCalendar() {
  const router = useRouter();
  const { locale } = useParams();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  // Check for authentication token
  useEffect(() => {
    const cookies = document.cookie;
    const hasToken = cookies.includes('session-token=');
    
    if (!hasToken) {
      console.log('No session token detected, redirecting to login');
      router.push(`/${locale}/login`);
    }
  }, [locale, router]);

  // Generate week dates
  const generateWeekDays = () => {
    const startDate = startOfWeek(currentDate, { weekStartsOn: 0 });
    return Array.from({ length: 7 }, (_, i) => addDays(startDate, i));
  };

  const weekDays = generateWeekDays();
  const startDate = format(weekDays[0], 'yyyy-MM-dd');
  const endDate = format(weekDays[6], 'yyyy-MM-dd');

  // Load bookings for the current week
  const { loading, error, data, refetch } = useQuery(GET_BOOKINGS, {
    variables: { startDate, endDate },
    client,
    errorPolicy: 'all',
    fetchPolicy: 'network-only',
    context: {
      headers: {
        credentials: 'include',
      }
    },
    onError: (error) => {
      console.error('Bookings query error:', error);
      if (error.message.includes('Not authenticated')) {
        router.push(`/${locale}/login`);
      }
    }
  });

  const bookings: Booking[] = data?.bookings || [];

  const getBookingsForDay = (date: Date) => {
    return bookings.filter((booking) => {
      const bookingDate = parseISO(booking.startTime);
      return isSameDay(bookingDate, date);
    });
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'confirmed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'completed':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newDate = addDays(currentDate, direction === 'next' ? 7 : -7);
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-7 gap-4 mb-4">
            {[...Array(7)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="text-red-800 font-medium">Error loading calendar</h3>
          <p className="text-red-600 text-sm mt-1">
            {error.message || 'An error occurred while loading the calendar.'}
          </p>
          <Button 
            onClick={() => refetch()}
            className="mt-3"
            variant="outline"
            size="sm"
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Bookings Calendar</h1>
          <p className="text-gray-600 mt-1">View and manage your appointments</p>
        </div>
        <Button 
          onClick={() => router.push(`/${locale}/bookings/new`)}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Booking
        </Button>
      </div>

      {/* Calendar Navigation */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigateWeek('prev')}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-xl font-semibold">
            {format(weekDays[0], 'MMM d')} - {format(weekDays[6], 'MMM d, yyyy')}
          </h2>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigateWeek('next')}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <Button
          variant="outline"
          onClick={goToToday}
        >
          Today
        </Button>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-4">
        {weekDays.map((day, index) => (
          <Card key={index} className="min-h-[300px]">
            <CardHeader className={`p-3 text-center ${
              isSameDay(day, new Date()) ? 'bg-blue-50 border-b border-blue-200' : 'bg-gray-50 border-b'
            }`}>
              <CardTitle className="text-sm font-medium">
                <div>{format(day, 'EEE')}</div>
                <div className={`text-lg ${
                  isSameDay(day, new Date()) ? 'text-blue-600 font-bold' : ''
                }`}>
                  {format(day, 'd')}
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-2 space-y-1">
              {getBookingsForDay(day).length > 0 ? (
                getBookingsForDay(day).map((booking) => (
                  <div
                    key={booking.id}
                    onClick={() => setSelectedBooking(booking)}
                    className={`p-2 rounded-md border cursor-pointer hover:shadow-sm transition-shadow ${getStatusColor(booking.status)}`}
                  >
                    <div className="text-xs font-medium truncate">{booking.title}</div>
                    <div className="text-xs flex items-center mt-1">
                      <Clock className="h-3 w-3 mr-1" />
                      {format(parseISO(booking.startTime), 'h:mm a')}
                    </div>
                    <div className="text-xs flex items-center">
                      <User className="h-3 w-3 mr-1" />
                      {booking.clientName}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-xs text-gray-500 text-center py-4">
                  No bookings
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Booking Details Modal */}
      {selectedBooking && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-4 border-b">
              <h2 className="text-lg font-medium">Booking Details</h2>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <h3 className="text-xl font-semibold">{selectedBooking.title}</h3>
                <p className="text-gray-500">
                  {format(parseISO(selectedBooking.startTime), 'MMMM d, yyyy')} •{' '}
                  {format(parseISO(selectedBooking.startTime), 'h:mm a')} -{' '}
                  {format(parseISO(selectedBooking.endTime), 'h:mm a')}
                </p>
              </div>
              
              <div className="space-y-2">
                <div>
                  <span className="text-sm font-medium text-gray-500">Client:</span>
                  <p className="text-gray-900">{selectedBooking.clientName}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">Service:</span>
                  <p className="text-gray-900">{selectedBooking.serviceName}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">Staff:</span>
                  <p className="text-gray-900">{selectedBooking.staffName}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">Status:</span>
                  <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedBooking.status)}`}>
                    {selectedBooking.status}
                  </span>
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setSelectedBooking(null)}
                >
                  Close
                </Button>
                <Button
                  onClick={() => {
                    router.push(`/${locale}/bookings/edit/${selectedBooking.id}`);
                  }}
                >
                  Edit Booking
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 