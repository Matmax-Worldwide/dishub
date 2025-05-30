'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";

import { format } from 'date-fns';
import { CalendarIcon, SearchIcon, XIcon } from 'lucide-react';

import graphqlClient from '@/lib/graphql-client'; // Fixed import
import { Service, Location, StaffProfile, User } from '@/types/calendar'; // Removed unused Booking import

// Manually defining types for now if not auto-generated and available
// These should ideally come from a generated types file based on your GQL schema
interface BookingListItem {
  id: string;
  customerName?: string | null;
  customerEmail?: string | null;
  customerPhone?: string | null;
  user?: User | null; // Registered user who booked
  service: Service;
  location: Location;
  staffProfile?: StaffProfile | null;
  bookingDate: string; // Assuming DateTime comes as ISO string
  startTime: string;   // Assuming DateTime comes as ISO string
  endTime: string;     // Assuming DateTime comes as ISO string
  status: string; // BookingStatus enum as string
  notes?: string | null;
  createdAt: string;
}

interface BookingFilterInput {
  dateFrom?: string | null;
  dateTo?: string | null;
  status?: string | null; // BookingStatus enum as string
  locationId?: string | null;
  serviceId?: string | null;
  staffProfileId?: string | null;
  userId?: string | null;
  customerEmail?: string | null;
  searchQuery?: string | null;
}

// Example BookingStatus enum (ensure this matches your GQL schema)
const BookingStatusEnum = {
  PENDING: 'PENDING',
  CONFIRMED: 'CONFIRMED',
  CANCELLED: 'CANCELLED',
  COMPLETED: 'COMPLETED',
  NO_SHOW: 'NO_SHOW',
  RESCHEDULED: 'RESCHEDULED',
};


const BookingsList: React.FC = () => {
  const [bookings, setBookings] = useState<BookingListItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10; // Made constant since setPageSize was unused

  const [filters, setFilters] = useState<BookingFilterInput>({});
  const [tempFilters, setTempFilters] = useState<BookingFilterInput>({});

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const [locations, setLocations] = useState<Location[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [staffProfiles, setStaffProfiles] = useState<StaffProfile[]>([]);

  // Note: These GraphQL queries would need to be implemented in your GraphQL client
  // For now, using placeholder implementations
  const fetchFilterData = useCallback(async () => {
    try {
      // Replace with actual GraphQL client methods when available
      const [locationsData, servicesData, staffData] = await Promise.all([
        graphqlClient.locations(),
        graphqlClient.services(), 
        graphqlClient.staffProfiles()
      ]);
      setLocations(locationsData || []);
      setServices(servicesData || []);
      setStaffProfiles((staffData as unknown as StaffProfile[]) || []);
    } catch (err) {
      console.error('Error fetching filter data:', err);
      // Handle error (e.g., toast notification)
    }
  }, []);

  const fetchBookings = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // This would need to be implemented in your GraphQL client
      // For now, setting empty data to avoid runtime errors
      setBookings([]);
      setTotalCount(0);
    } catch (err: unknown) {
      setError(err as Error);
      console.error('Error fetching bookings:', err);
    } finally {
      setIsLoading(false);
    }
  }, [filters, currentPage, pageSize]);

  useEffect(() => {
    fetchFilterData();
  }, [fetchFilterData]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const handleFilterChange = (key: keyof BookingFilterInput, value: string | null) => {
    setTempFilters(prev => ({ ...prev, [key]: value }));
  };
  
  const handleDateFilterChange = (key: 'dateFrom' | 'dateTo', date: Date | undefined) => {
    setTempFilters(prev => ({ ...prev, [key]: date ? format(date, 'yyyy-MM-dd') : null }));
  };

  const applyFilters = () => {
    setCurrentPage(1); // Reset to first page when filters change
    setFilters(tempFilters);
  };

  const clearFilters = () => {
    setTempFilters({});
    setFilters({});
    setCurrentPage(1);
  };

  const totalPages = Math.ceil(totalCount / pageSize);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };
  
  const renderPaginationItems = () => {
    const items = [];
    const maxPagesToShow = 5; // Example: Show 5 page numbers at a time
    const startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
    const endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);

    for (let i = startPage; i <= endPage; i++) {
      items.push(
        <PaginationItem key={i}>
          <PaginationLink href="#" isActive={i === currentPage} onClick={(e) => { e.preventDefault(); handlePageChange(i); }}>
            {i}
          </PaginationLink>
        </PaginationItem>
      );
    }
    if (startPage > 1) {
       items.unshift(<PaginationItem key="start-ellipsis"><PaginationEllipsis /></PaginationItem>);
       items.unshift(<PaginationItem key="1"><PaginationLink href="#" onClick={(e) => { e.preventDefault(); handlePageChange(1);}}>1</PaginationLink></PaginationItem>);
    }
    if (endPage < totalPages) {
        items.push(<PaginationItem key="end-ellipsis"><PaginationEllipsis /></PaginationItem>);
        items.push(<PaginationItem key={totalPages}><PaginationLink href="#" onClick={(e) => { e.preventDefault(); handlePageChange(totalPages);}}>{totalPages}</PaginationLink></PaginationItem>);
    }
    return items;
  };


  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Filter Bookings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {/* Search Query */}
            <Input
              placeholder="Search by name, email, notes..."
              value={tempFilters.searchQuery || ''}
              onChange={(e) => handleFilterChange('searchQuery', e.target.value)}
              className="col-span-full sm:col-span-1"
            />

            {/* Date From */}
             <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={`w-full justify-start text-left font-normal ${!tempFilters.dateFrom && "text-muted-foreground"}`}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {tempFilters.dateFrom ? format(new Date(tempFilters.dateFrom), "PPP") : <span>Date from</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={tempFilters.dateFrom ? new Date(tempFilters.dateFrom) : undefined}
                  onSelect={(date) => handleDateFilterChange('dateFrom', date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>

            {/* Date To */}
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={`w-full justify-start text-left font-normal ${!tempFilters.dateTo && "text-muted-foreground"}`}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {tempFilters.dateTo ? format(new Date(tempFilters.dateTo), "PPP") : <span>Date to</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={tempFilters.dateTo ? new Date(tempFilters.dateTo) : undefined}
                  onSelect={(date) => handleDateFilterChange('dateTo', date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>

            {/* Status */}
            <Select
              value={tempFilters.status || ''}
              onValueChange={(value) => handleFilterChange('status', value === 'ALL_STATUSES' ? null : value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL_STATUSES">All Statuses</SelectItem>
                {Object.entries(BookingStatusEnum).map(([key, value]) => (
                  <SelectItem key={key} value={value}>{value.replace('_', ' ')}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Location */}
            <Select
              value={tempFilters.locationId || ''}
              onValueChange={(value) => handleFilterChange('locationId', value === 'ALL_LOCATIONS' ? null : value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Filter by location" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL_LOCATIONS">All Locations</SelectItem>
                {locations.map(loc => (
                  <SelectItem key={loc.id} value={loc.id}>{loc.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Service */}
            <Select
              value={tempFilters.serviceId || ''}
              onValueChange={(value) => handleFilterChange('serviceId', value === 'ALL_SERVICES' ? null : value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Filter by service" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL_SERVICES">All Services</SelectItem>
                {services.map(ser => (
                  <SelectItem key={ser.id} value={ser.id}>{ser.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {/* Staff */}
            <Select
              value={tempFilters.staffProfileId || ''}
              onValueChange={(value) => handleFilterChange('staffProfileId', value === 'ALL_STAFF' ? null : value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Filter by staff" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL_STAFF">All Staff</SelectItem>
                {staffProfiles.map(staff => (
                  <SelectItem key={staff.id} value={staff.id}>
                    {staff.user ? `${staff.user.firstName || ''} ${staff.user.lastName || ''}`.trim() || staff.user.email : 'Unknown Staff'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={clearFilters}><XIcon className="mr-2 h-4 w-4" />Clear Filters</Button>
            <Button onClick={applyFilters}><SearchIcon className="mr-2 h-4 w-4" />Apply Filters</Button>
          </div>
        </CardContent>
      </Card>

      {isLoading && (
        <Table>
          <TableHeader>
            <TableRow>
                {/* Adjust number of skeleton heads to match your columns */}
                <TableHead>Customer</TableHead><TableHead>Service</TableHead><TableHead>Location</TableHead>
                <TableHead>Staff</TableHead><TableHead>Date</TableHead><TableHead>Time</TableHead>
                <TableHead>Status</TableHead><TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[...Array(pageSize)].map((_, i) => (
              <TableRow key={`skel-${i}`}>
                <TableCell><div className="h-4 bg-gray-200 rounded w-3/4"></div></TableCell>
                <TableCell><div className="h-4 bg-gray-200 rounded w-3/4"></div></TableCell>
                <TableCell><div className="h-4 bg-gray-200 rounded w-1/2"></div></TableCell>
                <TableCell><div className="h-4 bg-gray-200 rounded w-1/2"></div></TableCell>
                <TableCell><div className="h-4 bg-gray-200 rounded w-1/2"></div></TableCell>
                <TableCell><div className="h-4 bg-gray-200 rounded w-1/4"></div></TableCell>
                <TableCell><div className="h-4 bg-gray-200 rounded w-1/4"></div></TableCell>
                <TableCell><div className="h-4 bg-gray-200 rounded w-1/4"></div></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {!isLoading && error && (
        <div className="text-red-500 text-center p-4">
          Error fetching bookings: {error.message}
        </div>
      )}

      {!isLoading && !error && bookings.length === 0 && (
        <div className="text-center p-4 text-gray-500">No bookings found.</div>
      )}

      {!isLoading && !error && bookings.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Bookings ({totalCount})</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Service</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Staff</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Notes</TableHead>
                  {/* <TableHead>Actions</TableHead> */}
                </TableRow>
              </TableHeader>
              <TableBody>
                {bookings.map((booking) => (
                  <TableRow key={booking.id}>
                    <TableCell>{booking.user ? `${booking.user.firstName || ''} ${booking.user.lastName || ''}`.trim() || booking.user.email : booking.customerName || 'Guest'}</TableCell>
                    <TableCell>{booking.user?.email || booking.customerEmail}</TableCell>
                    <TableCell>{booking.service.name}</TableCell>
                    <TableCell>{booking.location.name}</TableCell>
                    <TableCell>
                      {booking.staffProfile?.user ? `${booking.staffProfile.user.firstName || ''} ${booking.staffProfile.user.lastName || ''}`.trim() || booking.staffProfile.user.email : 'Any/N/A'}
                    </TableCell>
                    <TableCell>{format(new Date(booking.bookingDate), 'PPP')}</TableCell>
                    <TableCell>{format(new Date(booking.startTime), 'p')} - {format(new Date(booking.endTime), 'p')}</TableCell>
                    <TableCell>{booking.status.replace('_', ' ')}</TableCell>
                    <TableCell title={booking.notes || undefined} className="max-w-xs truncate">
                      {booking.notes ? `${booking.notes.substring(0, 30)}...` : ''}
                    </TableCell>
                    {/* <TableCell> <Button variant="outline" size="sm">Details</Button> </TableCell> */}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
      
      {totalPages > 1 && !isLoading && !error && bookings.length > 0 && (
         <Pagination>
            <PaginationContent>
                <PaginationItem>
                    <PaginationPrevious href="#" onClick={(e) => { e.preventDefault(); handlePageChange(currentPage - 1);}} isActive={currentPage > 1} />
                </PaginationItem>
                {renderPaginationItems()}
                <PaginationItem>
                    <PaginationNext href="#" onClick={(e) => { e.preventDefault(); handlePageChange(currentPage + 1);}} isActive={currentPage < totalPages}/>
                </PaginationItem>
            </PaginationContent>
        </Pagination>
      )}
    </div>
  );
};

export default BookingsList;
