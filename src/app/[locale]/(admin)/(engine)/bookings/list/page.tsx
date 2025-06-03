'use client';

import React from 'react';
import BookingsList from '@/components/modules/calendar/BookingsList'; 
import PageHeader from '@/components/pages/page-header';

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
