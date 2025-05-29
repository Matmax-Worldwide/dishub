'use client';

import React from 'react';
import BookingsList from '@/components/cms/calendar/BookingsList'; 
import { PageHeader, PageHeaderHeading } from '@/components/page-header'; // Assuming this exists for consistent headings

const ManageBookingsPage = () => {
  return (
    <div className="container mx-auto p-4">
      <PageHeader className="mb-6">
        <PageHeaderHeading>Manage Bookings</PageHeaderHeading>
      </PageHeader>
      <BookingsList />
    </div>
  );
};

export default ManageBookingsPage;
