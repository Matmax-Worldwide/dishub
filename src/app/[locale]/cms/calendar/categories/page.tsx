'use client';

import React from 'react';
import CategoryManager from '@/components/cms/calendar/CategoryManager'; // Adjust path if necessary
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";

export default function ServiceCategoriesPage() {
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
            <BreadcrumbPage>Service Categories</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold tracking-tight">Manage Service Categories</h1>
      </div>
      <p className="text-muted-foreground text-sm">
        Organize your services by creating and managing categories.
      </p>
      
      <CategoryManager />
    </div>
  );
}
