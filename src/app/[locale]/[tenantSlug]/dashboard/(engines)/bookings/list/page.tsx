'use client';

import React from 'react';
import BookingsList from '@/app/components/engines/booking/BookingsList'; 
import PageHeader from '@/app/components/engines/booking/page-header';

const ManageBookingsPage = () => {
  return (
    <div className="container mx-auto p-4">
      <PageHeader 
        title="Manage Bookings"
        description="View and manage all calendar bookings"
        className="mb-6"
      />
      <BookingsList />
    </div>
  );
};

export default ManageBookingsPage;
