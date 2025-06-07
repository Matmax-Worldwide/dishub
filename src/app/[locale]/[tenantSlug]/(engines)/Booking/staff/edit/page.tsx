'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/app/components/ui/breadcrumb";
import { Button } from '@/app/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Textarea } from '@/app/components/ui/textarea';
import { Checkbox } from '@/app/components/ui/checkbox';
import { Badge } from '@/app/components/ui/badge';
import { ScrollArea } from '@/app/components/ui/scroll-area';
import { toast } from 'sonner';
import { ArrowLeft, Save, Loader2, User, Briefcase, MapPin, Clock } from 'lucide-react';
import graphqlClient from '@/lib/graphql-client';
import { Service, Location, CalendarStaffProfile } from '@/types/calendar';

interface StaffEditData {
  id: string;
  userId: string;
  bio: string;
  specializations: string[];
  assignedServiceIds: string[];
  assignedLocationIds: string[];
}

export default function StaffEditPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const staffId = searchParams.get('id');

  // State
  const [staffData, setStaffData] = useState<StaffEditData | null>(null);
  const [originalStaff, setOriginalStaff] = useState<CalendarStaffProfile | null>(null);
  const [allServices, setAllServices] = useState<Service[]>([]);
  const [allLocations, setAllLocations] = useState<Location[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load staff data and available services/locations
  const loadData = useCallback(async () => {
    if (!staffId) {
      setError('No staff ID provided');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Load staff profile and all available services/locations
      const [staffProfiles, services, locations] = await Promise.all([
        graphqlClient.staffProfiles(),
        graphqlClient.services(),
        graphqlClient.locations()
      ]);

      // Find the specific staff member
      const staff = staffProfiles.find(s => s.id === staffId);
      if (!staff) {
        setError('Staff member not found');
        return;
      }

      setOriginalStaff(staff);
      setAllServices(services || []);
      setAllLocations(locations || []);

      // Set form data
      setStaffData({
        id: staff.id,
        userId: staff.userId,
        bio: staff.bio || '',
        specializations: staff.specializations || [],
        assignedServiceIds: staff.assignedServices?.map(s => s.id) || [],
        assignedLocationIds: staff.locationAssignments?.map(l => l.id) || []
      });

    } catch (error) {
      console.error('Error loading staff data:', error);
      setError('Failed to load staff data');
      toast.error('Failed to load staff data');
    } finally {
      setIsLoading(false);
    }
  }, [staffId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle form field changes
  const handleFieldChange = (field: keyof StaffEditData, value: string | string[]) => {
    setStaffData(prev => prev ? { ...prev, [field]: value } : null);
  };

  // Handle specializations change (comma-separated string)
  const handleSpecializationsChange = (value: string) => {
    const specializations = value.split(',').map(s => s.trim()).filter(s => s);
    handleFieldChange('specializations', specializations);
  };

  // Handle service assignment toggle
  const handleServiceToggle = (serviceId: string, checked: boolean) => {
    setStaffData(prev => {
      if (!prev) return null;
      const currentServices = prev.assignedServiceIds;
      if (checked) {
        return { ...prev, assignedServiceIds: [...currentServices, serviceId] };
      } else {
        return { ...prev, assignedServiceIds: currentServices.filter(id => id !== serviceId) };
      }
    });
  };

  // Handle location assignment toggle
  const handleLocationToggle = (locationId: string, checked: boolean) => {
    setStaffData(prev => {
      if (!prev) return null;
      const currentLocations = prev.assignedLocationIds;
      if (checked) {
        return { ...prev, assignedLocationIds: [...currentLocations, locationId] };
      } else {
        return { ...prev, assignedLocationIds: currentLocations.filter(id => id !== locationId) };
      }
    });
  };

  // Save changes
  const handleSave = async () => {
    if (!staffData || !originalStaff) return;

    try {
      setIsSaving(true);

      // Update basic profile info
      await graphqlClient.updateStaffProfile({
        id: staffData.id,
        input: {
          bio: staffData.bio,
          specializations: staffData.specializations
        }
      });

      // Handle service assignments
      const originalServiceIds = originalStaff.assignedServices?.map(s => s.id) || [];
      const newServiceIds = staffData.assignedServiceIds;

      // Services to add
      const servicesToAdd = newServiceIds.filter(id => !originalServiceIds.includes(id));
      // Services to remove
      const servicesToRemove = originalServiceIds.filter(id => !newServiceIds.includes(id));

      // Execute service assignments
      for (const serviceId of servicesToAdd) {
        await graphqlClient.assignStaffToService({
          staffProfileId: staffData.id,
          serviceId
        });
      }

      for (const serviceId of servicesToRemove) {
        await graphqlClient.removeStaffFromService({
          staffProfileId: staffData.id,
          serviceId
        });
      }

      // Handle location assignments
      const originalLocationIds = originalStaff.locationAssignments?.map(l => l.id) || [];
      const newLocationIds = staffData.assignedLocationIds;

      // Locations to add
      const locationsToAdd = newLocationIds.filter(id => !originalLocationIds.includes(id));
      // Locations to remove
      const locationsToRemove = originalLocationIds.filter(id => !newLocationIds.includes(id));

      // Execute location assignments
      for (const locationId of locationsToAdd) {
        await graphqlClient.assignStaffToLocation({
          staffProfileId: staffData.id,
          locationId
        });
      }

      for (const locationId of locationsToRemove) {
        await graphqlClient.removeStaffFromLocation({
          staffProfileId: staffData.id,
          locationId
        });
      }

      toast.success('Staff member updated successfully');
      router.push('/bookings/staff');

    } catch (error) {
      console.error('Error saving staff data:', error);
      toast.error('Failed to save changes');
    } finally {
      setIsSaving(false);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6 p-4 md:p-6">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading staff data...</span>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !staffData || !originalStaff) {
    return (
      <div className="space-y-6 p-4 md:p-6">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/bookings">Bookings</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="/bookings/staff">Staff</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Edit</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <p className="text-red-600">{error || 'Staff member not found'}</p>
              <Button 
                variant="outline" 
                onClick={() => router.push('/bookings/staff')}
                className="mt-4"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Staff List
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Breadcrumb */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/bookings">Bookings</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="/bookings/staff">Staff</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Edit {originalStaff.user?.firstName} {originalStaff.user?.lastName}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Edit Staff Member</h1>
          <p className="text-muted-foreground">
            Update profile information and assign services & locations
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => router.push('/bookings/staff')}
            disabled={isSaving}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Staff Profile Info */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Profile Information
              </CardTitle>
              <CardDescription>
                Basic information about the staff member
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* User Info (Read-only) */}
              <div>
                <Label className="text-sm font-medium">Staff Member</Label>
                <div className="mt-1 p-3 bg-gray-50 rounded-md">
                  <p className="font-medium">{originalStaff.user?.firstName} {originalStaff.user?.lastName}</p>
                  <p className="text-sm text-muted-foreground">{originalStaff.user?.email}</p>
                </div>
              </div>

              {/* Bio */}
              <div>
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  value={staffData.bio}
                  onChange={(e) => handleFieldChange('bio', e.target.value)}
                  placeholder="Brief description about the staff member..."
                  rows={4}
                  disabled={isSaving}
                />
              </div>

              {/* Specializations */}
              <div>
                <Label htmlFor="specializations">Specializations</Label>
                <Input
                  id="specializations"
                  value={staffData.specializations.join(', ')}
                  onChange={(e) => handleSpecializationsChange(e.target.value)}
                  placeholder="e.g., Hair cutting, Coloring, Styling"
                  disabled={isSaving}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Separate multiple specializations with commas
                </p>
              </div>

              {/* Current Specializations */}
              {staffData.specializations.length > 0 && (
                <div>
                  <Label className="text-sm font-medium">Current Specializations</Label>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {staffData.specializations.map((spec, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {spec}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Services & Locations */}
        <div className="lg:col-span-2">
          <div className="space-y-6">
            {/* Services Assignment */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Briefcase className="h-5 w-5" />
                  Service Assignments
                </CardTitle>
                <CardDescription>
                  Select which services this staff member can provide
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-64">
                  <div className="space-y-3">
                    {allServices.map((service) => (
                      <div key={service.id} className="flex items-start space-x-3 p-3 border rounded-lg">
                        <Checkbox
                          id={`service-${service.id}`}
                          checked={staffData.assignedServiceIds.includes(service.id)}
                          onCheckedChange={(checked) => handleServiceToggle(service.id, checked as boolean)}
                          disabled={isSaving}
                        />
                        <div className="flex-1 min-w-0">
                          <Label 
                            htmlFor={`service-${service.id}`} 
                            className="font-medium cursor-pointer"
                          >
                            {service.name}
                          </Label>
                          {service.description && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {service.description}
                            </p>
                          )}
                          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {service.durationMinutes} min
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                    {allServices.length === 0 && (
                      <p className="text-center text-muted-foreground py-4">
                        No services available
                      </p>
                    )}
                  </div>
                </ScrollArea>
                <div className="mt-4 pt-4 border-t">
                  <p className="text-sm text-muted-foreground">
                    Selected: {staffData.assignedServiceIds.length} of {allServices.length} services
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Locations Assignment */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Location Assignments
                </CardTitle>
                <CardDescription>
                  Select which locations this staff member works at
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {allLocations.map((location) => (
                    <div key={location.id} className="flex items-start space-x-3 p-3 border rounded-lg">
                      <Checkbox
                        id={`location-${location.id}`}
                        checked={staffData.assignedLocationIds.includes(location.id)}
                        onCheckedChange={(checked) => handleLocationToggle(location.id, checked as boolean)}
                        disabled={isSaving}
                      />
                      <div className="flex-1 min-w-0">
                        <Label 
                          htmlFor={`location-${location.id}`} 
                          className="font-medium cursor-pointer"
                        >
                          {location.name}
                        </Label>
                        {location.address && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {location.address}
                          </p>
                        )}
                        {location.phone && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {location.phone}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                  {allLocations.length === 0 && (
                    <p className="text-center text-muted-foreground py-4">
                      No locations available
                    </p>
                  )}
                </div>
                <div className="mt-4 pt-4 border-t">
                  <p className="text-sm text-muted-foreground">
                    Selected: {staffData.assignedLocationIds.length} of {allLocations.length} locations
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
} 