'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  ChevronLeftIcon, 
  ChevronRightIcon,
  MapPinIcon,
  ClockIcon,
  UsersIcon,
  FilterIcon,
  PlusIcon,
  RefreshCwIcon
} from 'lucide-react';
import graphqlClient from '@/lib/graphql-client';
import { toast } from 'sonner';
import MultiStepBookingForm from '@/components/calendar/MultiStepBookingForm';

// Types
interface Location {
  id: string;
  name: string;
  address?: string;
  phone?: string;
  operatingHours?: Record<string, {
    open: string;
    close: string;
    isClosed: boolean;
  }>;
}

interface ServiceCategory {
  id: string;
  name: string;
  description?: string;
  displayOrder: number;
}

interface Service {
  id: string;
  name: string;
  description?: string;
  durationMinutes: number;
  prices: Array<{
    id: string;
    amount: number;
    currencyId: string;
  }>;
  isActive: boolean;
  serviceCategory: ServiceCategory;
  locations: Array<{ id: string; name: string }>;
}

interface StaffProfile {
  id: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    profileImageUrl?: string;
  };
  bio?: string;
  specializations: string[];
}

interface Booking {
  id: string;
  customerName?: string;
  customerEmail?: string;
  service: { id: string; name: string };
  location: { id: string; name: string };
  staffProfile?: { 
    id: string; 
    user: { firstName: string; lastName: string } 
  };
  bookingDate: string;
  startTime: string;
  endTime: string;
  status: string;
  notes?: string;
}

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  type: 'booking' | 'available' | 'break';
  booking?: Booking;
  service?: Service;
  staff?: StaffProfile;
  location?: Location;
  color: string;
}

type ViewMode = 'month' | 'week' | 'day';

const WEEKDAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export default function CalendarPage() {

  // State
  const [viewMode, setViewMode] = useState<ViewMode>('week');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedLocation, setSelectedLocation] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStaff, setSelectedStaff] = useState<string>('all');
  
  // Data state
  const [locations, setLocations] = useState<Location[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [staff, setStaff] = useState<StaffProfile[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  
  // Loading states
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Booking form state
  const [isBookingFormOpen, setIsBookingFormOpen] = useState(false);
  const [isCreatingBooking, setIsCreatingBooking] = useState(false);

  // Fetch data
  const fetchData = async () => {
    try {
      setIsLoading(true);
      
      const [
        locationsData,
        servicesData,
        categoriesData,
        staffData,
        bookingsData
      ] = await Promise.allSettled([
        graphqlClient.locations(),
        graphqlClient.services(),
        graphqlClient.serviceCategories(),
        graphqlClient.staffProfiles(),
        graphqlClient.bookings({
          filter: {
            startDate: getStartOfPeriod(currentDate, viewMode).toISOString().split('T')[0],
            endDate: getEndOfPeriod(currentDate, viewMode).toISOString().split('T')[0]
          }
        })
      ]);

      // Process results
      if (locationsData.status === 'fulfilled') {
        setLocations(locationsData.value as Location[]);
      }
      
      if (servicesData.status === 'fulfilled') {
        // Fix type conversion by handling the mismatch in serviceCategory structure
        const servicesWithFixedCategories = (servicesData.value as unknown[]).map((service: unknown) => {
          const s = service as Record<string, unknown>;
          const category = s.serviceCategory as Record<string, unknown> | undefined;
          return {
            ...s,
            serviceCategory: {
              id: category?.id as string || '',
              name: category?.name as string || '',
              description: category?.description as string,
              displayOrder: category?.displayOrder as number || 0
            }
          };
        });
        setServices(servicesWithFixedCategories as Service[]);
      }
      
      if (categoriesData.status === 'fulfilled') {
        setCategories(categoriesData.value);
      }
      
      if (staffData.status === 'fulfilled') {
        setStaff(staffData.value as StaffProfile[]);
      }
      
      if (bookingsData.status === 'fulfilled' && bookingsData.value) {
        setBookings(bookingsData.value.items as Booking[]);
      }

    } catch (error) {
      console.error('Error fetching calendar data:', error);
      toast.error('Failed to load calendar data');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  // Refresh data
  const refreshData = async () => {
    setIsRefreshing(true);
    await fetchData();
  };

  // Initial data fetch
  useEffect(() => {
    fetchData();
  }, [currentDate, viewMode]);

  // Generate calendar events
  useEffect(() => {
    const calendarEvents: CalendarEvent[] = [];

    // Add booking events
    bookings.forEach(booking => {
      const startDateTime = new Date(`${booking.bookingDate}T${booking.startTime}`);
      const endDateTime = new Date(`${booking.bookingDate}T${booking.endTime}`);
      
      calendarEvents.push({
        id: `booking-${booking.id}`,
        title: `${booking.service.name} - ${booking.customerName || 'Guest'}`,
        start: startDateTime,
        end: endDateTime,
        type: 'booking',
        booking,
        color: getStatusColor(booking.status)
      });
    });

    // Add available slots based on location operating hours and services
    generateAvailableSlots();

    setEvents(calendarEvents);
  }, [bookings, locations, services, selectedLocation, selectedCategory, selectedStaff]);

  // Helper functions
  const getStartOfPeriod = (date: Date, mode: ViewMode): Date => {
    const start = new Date(date);
    
    switch (mode) {
      case 'month':
        start.setDate(1);
        start.setHours(0, 0, 0, 0);
        // Go to start of week for the first day of month
        const firstDayOfWeek = start.getDay();
        start.setDate(start.getDate() - (firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1));
        return start;
      case 'week':
        const dayOfWeek = start.getDay();
        start.setDate(start.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
        start.setHours(0, 0, 0, 0);
        return start;
      case 'day':
        start.setHours(0, 0, 0, 0);
        return start;
      default:
        return start;
    }
  };

  const getEndOfPeriod = (date: Date, mode: ViewMode): Date => {
    const end = new Date(date);
    
    switch (mode) {
      case 'month':
        end.setMonth(end.getMonth() + 1);
        end.setDate(0);
        end.setHours(23, 59, 59, 999);
        // Go to end of week for the last day of month
        const lastDayOfWeek = end.getDay();
        end.setDate(end.getDate() + (lastDayOfWeek === 0 ? 0 : 7 - lastDayOfWeek));
        return end;
      case 'week':
        const dayOfWeek = end.getDay();
        end.setDate(end.getDate() + (dayOfWeek === 0 ? 0 : 7 - dayOfWeek));
        end.setHours(23, 59, 59, 999);
        return end;
      case 'day':
        end.setHours(23, 59, 59, 999);
        return end;
      default:
        return end;
    }
  };

  const getStatusColor = (status: string): string => {
    switch (status.toLowerCase()) {
      case 'confirmed': return '#10b981'; // green
      case 'pending': return '#f59e0b'; // yellow
      case 'cancelled': return '#ef4444'; // red
      case 'completed': return '#6366f1'; // indigo
      case 'no_show': return '#9ca3af'; // gray
      default: return '#3b82f6'; // blue
    }
  };

  const generateAvailableSlots = () => {
    // This would generate available time slots based on:
    // 1. Location operating hours
    // 2. Service duration and availability
    // 3. Staff schedules
    // 4. Existing bookings
    
    // For now, we'll add a simplified version
    // In a real implementation, this would be more complex
  };

  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    
    switch (viewMode) {
      case 'month':
        newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
        break;
      case 'week':
        newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
        break;
      case 'day':
        newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1));
        break;
    }
    
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const formatDateRange = (): string => {
    const start = getStartOfPeriod(currentDate, viewMode);
    const end = getEndOfPeriod(currentDate, viewMode);
    
    switch (viewMode) {
      case 'month':
        return `${MONTH_NAMES[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
      case 'week':
        if (start.getMonth() === end.getMonth()) {
          return `${MONTH_NAMES[start.getMonth()]} ${start.getDate()}-${end.getDate()}, ${start.getFullYear()}`;
        } else {
          return `${MONTH_NAMES[start.getMonth()]} ${start.getDate()} - ${MONTH_NAMES[end.getMonth()]} ${end.getDate()}, ${start.getFullYear()}`;
        }
      case 'day':
        return `${MONTH_NAMES[currentDate.getMonth()]} ${currentDate.getDate()}, ${currentDate.getFullYear()}`;
      default:
        return '';
    }
  };

  // Filter data based on selections
  const filteredServices = useMemo(() => {
    return services.filter(service => {
      if (selectedCategory !== 'all' && service.serviceCategory.id !== selectedCategory) return false;
      if (selectedLocation !== 'all' && !service.locations.some(loc => loc.id === selectedLocation)) return false;
      return service.isActive;
    });
  }, [services, selectedCategory, selectedLocation]);

  const filteredEvents = useMemo(() => {
    return events.filter(event => {
      if (selectedLocation !== 'all' && event.booking?.location.id !== selectedLocation) return false;
      if (selectedStaff !== 'all' && event.booking?.staffProfile?.id !== selectedStaff) return false;
      if (selectedCategory !== 'all') {
        const service = services.find(s => s.id === event.booking?.service.id);
        if (service && service.serviceCategory.id !== selectedCategory) return false;
      }
      return true;
    });
  }, [events, selectedLocation, selectedStaff, selectedCategory, services]);

  // Render calendar grid
  const renderCalendarGrid = () => {
    const start = getStartOfPeriod(currentDate, viewMode);
    const end = getEndOfPeriod(currentDate, viewMode);
    
    if (viewMode === 'month') {
      return renderMonthView(start, end);
    } else if (viewMode === 'week') {
      return renderWeekView(start);
    } else {
      return renderDayView(currentDate);
    }
  };

  const renderMonthView = (start: Date, end: Date) => {
    const weeks = [];
    const current = new Date(start);
    
    while (current <= end) {
      const week = [];
      for (let i = 0; i < 7; i++) {
        const dayEvents = filteredEvents.filter(event => 
          event.start.toDateString() === current.toDateString()
        );
        
        week.push(
          <div
            key={current.toISOString()}
            className={`min-h-[120px] border border-gray-200 p-2 ${
              current.getMonth() !== currentDate.getMonth() ? 'bg-gray-50 text-gray-400' : 'bg-white'
            } ${current.toDateString() === new Date().toDateString() ? 'bg-blue-50' : ''}`}
          >
            <div className="font-medium text-sm mb-1">{current.getDate()}</div>
            <div className="space-y-1">
              {dayEvents.slice(0, 3).map(event => (
                <div
                  key={event.id}
                  className="text-xs p-1 rounded truncate"
                  style={{ backgroundColor: event.color + '20', color: event.color }}
                >
                  {event.title}
                </div>
              ))}
              {dayEvents.length > 3 && (
                <div className="text-xs text-gray-500">+{dayEvents.length - 3} more</div>
              )}
            </div>
          </div>
        );
        current.setDate(current.getDate() + 1);
      }
      weeks.push(
        <div key={weeks.length} className="grid grid-cols-7">
          {week}
        </div>
      );
    }
    
    return (
      <div className="space-y-0">
        {/* Header */}
        <div className="grid grid-cols-7 bg-gray-100">
          {WEEKDAY_NAMES.map(day => (
            <div key={day} className="p-3 text-center font-medium text-gray-700 border border-gray-200">
              {day}
            </div>
          ))}
        </div>
        {/* Weeks */}
        {weeks}
      </div>
    );
  };

  const renderWeekView = (start: Date) => {
    const days = [];
    const current = new Date(start);
    
    for (let i = 0; i < 7; i++) {
      const dayEvents = filteredEvents.filter(event => 
        event.start.toDateString() === current.toDateString()
      );
      
      days.push(
        <div key={current.toISOString()} className="flex-1 border-r border-gray-200 last:border-r-0">
          <div className={`p-3 text-center border-b border-gray-200 ${
            current.toDateString() === new Date().toDateString() ? 'bg-blue-50' : 'bg-gray-50'
          }`}>
            <div className="font-medium">{WEEKDAY_NAMES[i]}</div>
            <div className="text-sm text-gray-600">{current.getDate()}</div>
          </div>
          <div className="p-2 space-y-1 min-h-[400px]">
            {dayEvents.map(event => (
              <div
                key={event.id}
                className="text-xs p-2 rounded border-l-4"
                style={{ 
                  borderLeftColor: event.color,
                  backgroundColor: event.color + '10'
                }}
              >
                <div className="font-medium">{event.title}</div>
                <div className="text-gray-600">
                  {event.start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - 
                  {event.end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
                {event.booking && (
                  <div className="text-gray-500">
                    {event.booking.location.name}
                    {event.booking.staffProfile && (
                      <span> • {event.booking.staffProfile.user.firstName} {event.booking.staffProfile.user.lastName}</span>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      );
      current.setDate(current.getDate() + 1);
    }
    
    return (
      <div className="flex border border-gray-200 rounded-lg overflow-hidden">
        {days}
      </div>
    );
  };

  const renderDayView = (date: Date) => {
    const dayEvents = filteredEvents.filter(event => 
      event.start.toDateString() === date.toDateString()
    ).sort((a, b) => a.start.getTime() - b.start.getTime());
    
    return (
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <div className="bg-gray-50 p-4 border-b border-gray-200">
          <h3 className="font-medium">{date.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })}</h3>
        </div>
        <div className="p-4 space-y-3">
          {dayEvents.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              No events scheduled for this day
            </div>
          ) : (
            dayEvents.map(event => (
              <div
                key={event.id}
                className="p-4 rounded-lg border-l-4"
                style={{ 
                  borderLeftColor: event.color,
                  backgroundColor: event.color + '10'
                }}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-medium">{event.title}</h4>
                    <div className="text-sm text-gray-600 mt-1">
                      {event.start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - 
                      {event.end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    {event.booking && (
                      <div className="text-sm text-gray-500 mt-2">
                        <div>📍 {event.booking.location.name}</div>
                        {event.booking.staffProfile && (
                          <div>👤 {event.booking.staffProfile.user.firstName} {event.booking.staffProfile.user.lastName}</div>
                        )}
                        {event.booking.customerEmail && (
                          <div>📧 {event.booking.customerEmail}</div>
                        )}
                      </div>
                    )}
                  </div>
                  <Badge variant="outline" style={{ color: event.color, borderColor: event.color }}>
                    {event.booking?.status || event.type}
                  </Badge>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  };

  // Handle booking creation
  const handleCreateBooking = async (formData: {
    selectionMethod: 'service' | 'location' | 'specialist' | null;
    selectedServiceId?: string;
    selectedLocationId?: string;
    selectedStaffId?: string;
    finalServiceId?: string;
    finalLocationId?: string;
    finalStaffId?: string;
    bookingDate?: string;
    startTime?: string;
    endTime?: string;
    customerName?: string;
    customerEmail?: string;
    customerPhone?: string;
    notes?: string;
  }) => {
    try {
      setIsCreatingBooking(true);

      // Determine final values based on selection method
      const serviceId = formData.finalServiceId || formData.selectedServiceId;
      const locationId = formData.finalLocationId || formData.selectedLocationId;
      const staffProfileId = formData.finalStaffId || formData.selectedStaffId;

      // Validate required fields
      if (!serviceId || !locationId || !formData.bookingDate || !formData.startTime || 
          !formData.customerName || !formData.customerEmail) {
        throw new Error('Missing required booking information');
      }

      const bookingInput = {
        serviceId: serviceId!,
        locationId: locationId!,
        staffProfileId: staffProfileId === 'ANY_AVAILABLE' ? undefined : staffProfileId,
        bookingDate: formData.bookingDate!,
        startTime: formData.startTime!,
        endTime: formData.endTime || formData.startTime!,
        customerName: formData.customerName!,
        customerEmail: formData.customerEmail!,
        customerPhone: formData.customerPhone,
        notes: formData.notes,
      };

      await graphqlClient.createBooking({ input: bookingInput });
      
      // Refresh the calendar data
      await fetchData();
      
      toast.success('Booking created successfully!');
    } catch (error) {
      console.error('Failed to create booking:', error);
      throw error; // Re-throw to let the form handle the error
    } finally {
      setIsCreatingBooking(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Calendar</h1>
          <p className="text-gray-600 mt-1">View and manage bookings across locations and services</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            size="sm"
            onClick={refreshData}
            disabled={isRefreshing}
          >
            <RefreshCwIcon className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button size="sm" onClick={() => setIsBookingFormOpen(true)}>
            <PlusIcon className="w-4 h-4 mr-2" />
            New Booking
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <FilterIcon className="w-5 h-5 mr-2" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Location</label>
              <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                <SelectTrigger>
                  <SelectValue placeholder="All Locations" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Locations</SelectItem>
                  {locations.map(location => (
                    <SelectItem key={location.id} value={location.id}>
                      {location.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">Category</label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map(category => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">Staff</label>
              <Select value={selectedStaff} onValueChange={setSelectedStaff}>
                <SelectTrigger>
                  <SelectValue placeholder="All Staff" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Staff</SelectItem>
                  {staff.map(staffMember => (
                    <SelectItem key={staffMember.id} value={staffMember.id}>
                      {staffMember.user.firstName} {staffMember.user.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">View</label>
              <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as ViewMode)}>
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="month">Month</TabsTrigger>
                  <TabsTrigger value="week">Week</TabsTrigger>
                  <TabsTrigger value="day">Day</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Calendar Navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={() => navigateDate('prev')}>
            <ChevronLeftIcon className="w-4 h-4" />
          </Button>
          <Button variant="outline" onClick={goToToday}>
          Today
        </Button>
          <Button variant="outline" onClick={() => navigateDate('next')}>
            <ChevronRightIcon className="w-4 h-4" />
          </Button>
        </div>
        <h2 className="text-xl font-semibold">{formatDateRange()}</h2>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="text-green-600 border-green-200">
            {filteredEvents.length} Events
          </Badge>
          <Badge variant="outline" className="text-blue-600 border-blue-200">
            {filteredServices.length} Services
          </Badge>
        </div>
      </div>

      {/* Calendar Grid */}
      <Card>
        <CardContent className="p-0">
          {renderCalendarGrid()}
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <MapPinIcon className="w-5 h-5 mr-2" />
              Locations
              </CardTitle>
            </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {locations.slice(0, 5).map(location => (
                <div key={location.id} className="flex justify-between items-center">
                  <span className="text-sm">{location.name}</span>
                  <Badge variant="outline">
                    {bookings.filter(b => b.location.id === location.id).length} bookings
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <ClockIcon className="w-5 h-5 mr-2" />
              Services
            </CardTitle>
          </CardHeader>
          <CardContent>
              <div className="space-y-2">
              {filteredServices.slice(0, 5).map(service => (
                <div key={service.id} className="flex justify-between items-center">
                  <span className="text-sm">{service.name}</span>
                  <Badge variant="outline">
                    {service.prices && service.prices.length > 0 
                      ? `$${service.prices[0].amount}` 
                      : 'No price'
                    }
                  </Badge>
                </div>
              ))}
                </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <UsersIcon className="w-5 h-5 mr-2" />
              Staff
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {staff.slice(0, 5).map(staffMember => (
                <div key={staffMember.id} className="flex justify-between items-center">
                  <span className="text-sm">
                    {staffMember.user.firstName} {staffMember.user.lastName}
                  </span>
                  <Badge variant="outline">
                    {bookings.filter(b => b.staffProfile?.id === staffMember.id).length} bookings
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        </div>

      {/* Multi-Step Booking Form */}
      <MultiStepBookingForm
        isOpen={isBookingFormOpen}
        onClose={() => setIsBookingFormOpen(false)}
        onSubmit={handleCreateBooking}
        services={services}
        locations={locations}
        staff={staff}
        isSubmitting={isCreatingBooking}
      />
    </div>
  );
} 