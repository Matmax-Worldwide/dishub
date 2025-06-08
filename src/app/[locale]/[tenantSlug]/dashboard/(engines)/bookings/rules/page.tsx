'use client';

import React from 'react';
import BookingRulesManager from '@/components/engines/booking/BookingRulesManager'; // Adjust path as necessary
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";

export default function BookingRulesPage() {
  return (
    <div className="space-y-6 p-4 md:p-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/cms/dashboard">CMS</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="/cms/calendar">Calendar & Bookings</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Booking Rules</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold tracking-tight">Global Booking Rules Configuration</h1>
      </div>
      <p className="text-muted-foreground text-sm">
        Define the global rules that govern how bookings can be made. These rules apply site-wide unless overridden by location-specific rules (future feature).
      </p>
      
      <BookingRulesManager />
    </div>
  );
}
