'use client';

import React from 'react';
import LocationManager from '@/components/cms/calendar/LocationManager'; // Adjust path if necessary
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";


export default function LocationsPage() {
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
            <BreadcrumbPage>Locations</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold tracking-tight">Manage Locations</h1>
      </div>
      <p className="text-muted-foreground text-sm">
        Configure physical or virtual locations where services are offered.
      </p>
      
      <LocationManager />
    </div>
  );
}
