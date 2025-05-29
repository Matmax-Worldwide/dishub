'use client';

import React, { useState, useEffect, useCallback } from 'react';
import graphqlClient from '@/lib/graphql-client'; 
import { Location, ServiceCategory, Service, StaffProfile, AvailableTimeSlot } from '@/types/calendar'; 
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, CheckCircle, User, Users, CalendarDays, Clock } from 'lucide-react'; // Added new icons
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { DayPicker } from 'react-day-picker'; 
import 'react-day-picker/dist/style.css'; 
import { format } from 'date-fns'; 

interface CalendarSectionProps {
  calendarId?: string; 
  locationId?: string; 
  serviceIds?: string[]; 
  theme?: 'light' | 'dark'; // For now, not implemented
  showLocationSelector?: boolean;
  showServiceCategories?: boolean;
  defaultLocation?: string; 
  defaultService?: string; 
  customStyles?: Record<string, string>; 
  showStaffSelector?: boolean; // New prop
}

type BookingStep = 'locationSelection' | 'serviceSelection' | 'staffSelection' | 'dateTimeSelection' | 'detailsForm' | 'confirmation';

const ProgressIndicator = ({ currentStep, steps }: { currentStep: BookingStep, steps: {id: BookingStep, label: string}[] }) => {
  const currentIndex = steps.findIndex(s => s.id === currentStep);
  return (
    <div className="flex justify-center space-x-2 sm:space-x-4 mb-8 overflow-x-auto pb-2">
      {steps.map((step, index) => (
        <div key={step.id} className="flex flex-col items-center min-w-[60px] sm:min-w-[80px]">
          <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center border-2
            ${index < currentIndex ? 'bg-green-500 border-green-500 text-white' : ''}
            ${index === currentIndex ? 'bg-blue-500 border-blue-500 text-white animate-pulse' : ''}
            ${index > currentIndex ? 'bg-gray-200 border-gray-300 text-gray-500' : ''}
          `}>
            {index < currentIndex ? <CheckCircle size={16} /> : index + 1}
          </div>
          <p className={`mt-1 text-xs sm:text-sm text-center ${index === currentIndex ? 'text-blue-600 font-semibold' : 'text-gray-500'}`}>
            {step.label}
          </p>
        </div>
      ))}
    </div>
  );
};


export default function CalendarSection({
  locationId: initialLocationIdProp, // Renamed to avoid conflict with state
  showLocationSelector = true,
  showServiceCategories = true,
  defaultLocation,
  defaultService, 
  showStaffSelector = true, // Default to true if service might have staff
}: CalendarSectionProps) {
  
  // Define all possible steps
  const stepDefinitions: {id: BookingStep, label: string, condition?: boolean}[] = [
    { id: 'locationSelection', label: 'Location', condition: showLocationSelector },
    { id: 'serviceSelection', label: 'Service', condition: true },
    { id: 'staffSelection', label: 'Staff', condition: showStaffSelector }, 
    { id: 'dateTimeSelection', label: 'Date & Time', condition: true },
    { id: 'detailsForm', label: 'Your Details', condition: true },
    { id: 'confirmation', label: 'Confirm', condition: true },
  ];

  const allSteps = stepDefinitions.filter(step => step.condition !== false);
  
  const getInitialStep = (): BookingStep => {
    if (showLocationSelector && !(defaultLocation || initialLocationIdProp)) return 'locationSelection';
    // If location is set (either by prop or default), move to service selection or further
    if (selectedLocationId) {
        if (!selectedServiceId) return 'serviceSelection';
        if (showStaffSelector && !selectedStaffId) return 'staffSelection'; // Assuming selectedStaffId needs to be set
        return 'dateTimeSelection';
    }
    return 'serviceSelection'; // Fallback if location selector is hidden but no location set
  };
  
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(defaultLocation || initialLocationIdProp || null);
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null); // Initialize defaultService later
  const [selectedStaffId, setSelectedStaffId] = useState<string | null>("ANY_AVAILABLE"); 
  
  const [currentStep, setCurrentStep] = useState<BookingStep>(getInitialStep());

  const [locations, setLocations] = useState<Location[]>([]);
  const [serviceCategories, setServiceCategories] = useState<ServiceCategory[]>([]);
  const [allServicesForLocation, setAllServicesForLocation] = useState<Service[]>([]); 
  const [displayServices, setDisplayServices] = useState<Service[]>([]); 

  const [availableStaffForService, setAvailableStaffForService] = useState<Partial<StaffProfile>[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [timeSlots, setTimeSlots] = useState<AvailableTimeSlot[]>([]);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<AvailableTimeSlot | null>(null);

  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);

  const [isLoadingLocations, setIsLoadingLocations] = useState(showLocationSelector && !(defaultLocation || initialLocationIdProp));
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);
  const [isLoadingServices, setIsLoadingServices] = useState(false);
  const [isLoadingStaff, setIsLoadingStaff] = useState(false);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [error, setError] = useState<string | null>(null);

   // Initialize current step based on props, and handle defaultService
   useEffect(() => {
    let initialStep: BookingStep = 'locationSelection';
    if (!showLocationSelector && selectedLocationId) {
      initialStep = 'serviceSelection';
    } else if (showLocationSelector && !(defaultLocation || initialLocationIdProp)) {
      initialStep = 'locationSelection';
    } else if (selectedLocationId) { // Location is known (default or prop)
        initialStep = 'serviceSelection';
    }
    
    if (selectedLocationId && defaultService && !selectedServiceId) {
        setSelectedServiceId(defaultService);
        initialStep = showStaffSelector ? 'staffSelection' : 'dateTimeSelection';
    }
    setCurrentStep(initialStep);
  }, [showLocationSelector, selectedLocationId, defaultLocation, initialLocationIdProp, defaultService, selectedServiceId, showStaffSelector]);


  // Fetch Locations
  useEffect(() => {
    if (showLocationSelector) {
      setIsLoadingLocations(true);
      graphqlClient.locations()
        .then(data => setLocations(data || []))
        .catch(err => {
          console.error("Error fetching locations:", err);
          setError("Could not load locations.");
          toast.error("Could not load locations.");
        })
        .finally(() => setIsLoadingLocations(false));
    } else if (selectedLocationId) { // If location is fixed via prop
        setIsLoadingLocations(false); // Not fetching all, but need to proceed to service/category loading
    }
  }, [showLocationSelector, selectedLocationId]);

  // Fetch Categories and Services when a location is selected or if location selection is skipped
  useEffect(() => {
    if (selectedLocationId) {
      setIsLoadingCategories(true);
      setIsLoadingServices(true);
      setError(null);

      const fetchCatAndServices = async () => {
        try {
          let categoriesData: ServiceCategory[] = [];
          if (showServiceCategories) {
            categoriesData = await graphqlClient.serviceCategories() || [];
            setServiceCategories(categoriesData);
          }
          
          // Fetch all services for the selected location
          // Assuming graphqlClient.services can take a filter, or Location.services relation is used
          // For now, using a conceptual filter, or fetching all and filtering client-side if needed.
          // The resolver for `services` should ideally support filtering by locationId.
          // Let's assume `graphqlClient.services()` can fetch all and we filter, or it accepts a filter.
          // Or, if we fetched a single location object, it might have `location.services`
          const allServices = await graphqlClient.services(); // This might need a filter like { locationId: selectedLocationId }
          
          // Filter services that are part of the selectedLocationId
          // This assumes the `services` query returns services with their `locations` array populated.
          const servicesForLocation = (allServices || []).filter(service => 
            service.locations?.some(loc => loc.id === selectedLocationId) && service.isActive
          );
          setAllServicesForLocation(servicesForLocation);
          
          // If not showing categories, all services for the location are display services.
          // Otherwise, display services will be updated when a category is selected.
          if (!showServiceCategories) {
            setDisplayServices(servicesForLocation);
          } else if (categoriesData.length === 0 && servicesForLocation.length > 0) {
            // If no categories but services exist for location, display all those services
             setDisplayServices(servicesForLocation);
          } else {
            setDisplayServices([]); // Clear services until category is picked
          }

        } catch (err) {
          console.error("Error fetching categories/services:", err);
          setError("Could not load services or categories.");
          toast.error("Could not load services or categories.");
        } finally {
          setIsLoadingCategories(false);
          setIsLoadingServices(false);
        }
      };
      fetchCatAndServices();
    }
  }, [selectedLocationId, showServiceCategories]);

  // Filter services when a category is selected
  useEffect(() => {
    if (selectedCategoryId && showServiceCategories) {
      setDisplayServices(allServicesForLocation.filter(service => service.serviceCategoryId === selectedCategoryId && service.isActive));
    } else if (!selectedCategoryId && !showServiceCategories && selectedLocationId) {
      // If categories are hidden, all services for the location are already set in allServicesForLocation
      setDisplayServices(allServicesForLocation.filter(service => service.isActive));
    }
    // If selectedCategoryId is nullified, and showServiceCategories is true, 
    // it means user de-selected a category, so clear displayServices to prompt category selection again.
    else if (!selectedCategoryId && showServiceCategories) {
        setDisplayServices([]);
    }
  }, [selectedCategoryId, allServicesForLocation, showServiceCategories, selectedLocationId]);


  const handleLocationSelect = (locationId: string) => {
    setSelectedLocationId(locationId);
    setSelectedCategoryId(null); // Reset category when location changes
    setSelectedServiceId(null); // Reset service
    setDisplayServices([]); // Clear services
    setCurrentStep('serviceSelection');
  };

  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategoryId(categoryId);
    setSelectedServiceId(null); // Reset service when category changes
  };

  const handleServiceSelect = (serviceId: string) => {
    setSelectedServiceId(serviceId);
    setSelectedStaffId("ANY_AVAILABLE"); // Reset staff preference
    setSelectedDate(new Date()); // Reset date
    setTimeSlots([]);
    setSelectedTimeSlot(null);
    if (showStaffSelector) {
      setCurrentStep('staffSelection');
    } else {
      setCurrentStep('dateTimeSelection');
    }
  };

  const handleStaffSelect = (staffId: string | null) => {
    setSelectedStaffId(staffId); 
    setSelectedDate(new Date()); 
    setTimeSlots([]);
    setSelectedTimeSlot(null);
    setCurrentStep('dateTimeSelection');
  };

  const handleDateSelect = (date?: Date) => {
    if (date) {
      setSelectedDate(date);
      setTimeSlots([]); 
      setSelectedTimeSlot(null);
      // Fetching slots will be triggered by useEffect for date changes
    }
  };

  const handleTimeSlotSelect = (slot: AvailableTimeSlot) => {
    setSelectedTimeSlot(slot);
    toast.success(`Time slot from ${format(new Date(slot.startTime), "p")} selected. Next: Your Details.`);
    setCurrentStep('detailsForm');
  };
  
  // Fetch Staff for Service
  useEffect(() => {
    if (currentStep === 'staffSelection' && selectedServiceId && selectedLocationId && showStaffSelector) {
      setIsLoadingStaff(true);
      // Assuming graphqlClient.staffForService is a new method to fetch staff for a specific service and location
      // This might require a new GraphQL query and resolver: staffForService(serviceId: ID!, locationId: ID!): [StaffProfile!]
      graphqlClient.staffForService({ serviceId: selectedServiceId, locationId: selectedLocationId })
        .then(data => setAvailableStaffForService(data || []))
        .catch(err => {
          console.error("Error fetching staff:", err);
          toast.error("Could not load available staff.");
          setAvailableStaffForService([]); // Clear on error
        })
        .finally(() => setIsLoadingStaff(false));
    }
  }, [currentStep, selectedServiceId, selectedLocationId, showStaffSelector]);

  // Fetch Available Time Slots
  useEffect(() => {
    if (currentStep === 'dateTimeSelection' && selectedDate && selectedServiceId && selectedLocationId && selectedStaffId !== undefined) {
      setIsLoadingSlots(true);
      const dateString = format(selectedDate, "yyyy-MM-dd");
      // Assuming graphqlClient.availableSlots is a new method
      // This requires a new GraphQL query and resolver: availableSlots(serviceId: ID!, locationId: ID!, date: String!, staffId: ID): [AvailableTimeSlot!]
      graphqlClient.availableSlots({ 
        serviceId: selectedServiceId, 
        locationId: selectedLocationId, 
        date: dateString, 
        staffId: selectedStaffId === "ANY_AVAILABLE" ? null : selectedStaffId 
      })
        .then(data => setTimeSlots(data || []))
        .catch(err => {
          console.error("Error fetching time slots:", err);
          toast.error("Could not load available time slots.");
          setTimeSlots([]); 
        })
        .finally(() => setIsLoadingSlots(false));
    }
  }, [currentStep, selectedDate, selectedServiceId, selectedLocationId, selectedStaffId]);


  const currentVisibleStep = allSteps.find(s => s.id === currentStep);

  if (error && currentStep !== 'locationSelection' && currentStep !== 'serviceSelection') { 
    return <div className="p-4 text-red-600 bg-red-50 rounded-md">{error}</div>;
  }

  return (
    <div className="p-4 md:p-6 space-y-6 bg-white rounded-lg shadow-lg">
      <ProgressIndicator currentStep={currentStep} steps={allSteps} />
      
      {/* Step 1: Location Selection */}
      {currentStep === 'locationSelection' && showLocationSelector && (
        <section>
          <h2 className="text-xl sm:text-2xl font-semibold mb-4 text-gray-800">Select a Location</h2>
          {isLoadingLocations ? (
            <div className="flex justify-center items-center py-10"><Loader2 className="h-8 w-8 animate-spin text-blue-500" /> <span className="ml-2">Loading locations...</span></div>
          ) : locations.length === 0 ? (
            <p className="text-gray-600">No locations available at the moment.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {locations.map(loc => (
                <Card key={loc.id} onClick={() => handleLocationSelect(loc.id)} className="cursor-pointer hover:shadow-xl transition-shadow">
                  <CardHeader>
                    <CardTitle>{loc.name}</CardTitle>
                    {loc.address && <CardDescription className="text-xs">{loc.address}</CardDescription>}
                  </CardHeader>
                  <CardContent className="text-sm">
                    {loc.phone && <p>Phone: {loc.phone}</p>}
                    {/* Future: Display operating hours summary or service count */}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Step 2: Service/Category Selection */}
      {currentStep === 'serviceSelection' && selectedLocationId && (
        <section>
          <h2 className="text-xl sm:text-2xl font-semibold mb-1 text-gray-800">Select a Service</h2>
          {selectedLocationId && !showLocationSelector && (
            <p className="text-sm text-muted-foreground mb-4">Location: {locations.find(l=>l.id === selectedLocationId)?.name || selectedLocationId}</p>
          )}

          {(isLoadingCategories || isLoadingServices) ? (
            <div className="flex justify-center items-center py-10"><Loader2 className="h-8 w-8 animate-spin text-blue-500" /> <span className="ml-2">Loading services...</span></div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              {/* Category List (if shown) */}
              {showServiceCategories && serviceCategories.length > 0 && (
                <div className="md:col-span-4 lg:col-span-3">
                  <h3 className="text-lg font-medium mb-3 text-gray-700">Categories</h3>
                  <div className="space-y-2">
                    {serviceCategories.map(cat => (
                      <Button 
                        key={cat.id} 
                        variant={selectedCategoryId === cat.id ? "default" : "outline"}
                        className="w-full justify-start"
                        onClick={() => handleCategorySelect(cat.id)}
                      >
                        {cat.name}
                      </Button>
                    ))}
                     <Button 
                        variant={!selectedCategoryId ? "secondary" : "ghost"}
                        className="w-full justify-start text-sm"
                        onClick={() => setSelectedCategoryId(null)} // Show all services for location
                      >
                        All Services
                      </Button>
                  </div>
                </div>
              )}

              {/* Service List */}
              <div className={`${showServiceCategories && serviceCategories.length > 0 ? "md:col-span-8 lg:col-span-9" : "md:col-span-12"}`}>
                {(!showServiceCategories || selectedCategoryId || (serviceCategories.length === 0 && allServicesForLocation.length > 0) ) && (
                    <h3 className="text-lg font-medium mb-3 text-gray-700">
                        {selectedCategoryId ? serviceCategories.find(c=>c.id === selectedCategoryId)?.name : 'Available Services'}
                    </h3>
                )}
                {displayServices.length === 0 && !isLoadingServices && (
                    <p className="text-gray-600 py-6 text-center">
                        {selectedCategoryId ? "No services available in this category for the selected location." : (showServiceCategories && serviceCategories.length > 0 ? "Please select a category to see services." : "No services found for this location.")}
                    </p>
                )}
                <div className="space-y-3">
                  {displayServices.map(service => (
                    <Card key={service.id} className="overflow-hidden">
                      <CardHeader className="p-4">
                        <div className="flex justify-between items-start">
                            <div>
                                <CardTitle className="text-md">{service.name}</CardTitle>
                                {service.description && <CardDescription className="text-xs mt-1">{service.description.substring(0,100)}{service.description.length > 100 ? '...' : ''}</CardDescription>}
                            </div>
                            <Button size="sm" onClick={() => handleServiceSelect(service.id)}>Select</Button>
                        </div>
                      </CardHeader>
                      <CardContent className="p-4 border-t text-xs text-muted-foreground">
                        <div className="flex justify-between items-center">
                            <span>Duration: {service.durationMinutes} min</span>
                            <span>Price: ${Number(service.price).toFixed(2)}</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          )}
        </section>
      )}
      
      {/* Step 3: Staff Selection */}
      {currentStep === 'staffSelection' && selectedServiceId && (
        <section>
          <h2 className="text-xl sm:text-2xl font-semibold mb-4 text-gray-800">Select Staff (Optional)</h2>
          {isLoadingStaff ? (
            <div className="flex justify-center items-center py-10"><Loader2 className="h-8 w-8 animate-spin text-blue-500" /> <span className="ml-2">Loading staff...</span></div>
          ) : (
            <div className="space-y-3">
              <Button 
                variant={selectedStaffId === "ANY_AVAILABLE" ? "default" : "outline"} 
                onClick={() => handleStaffSelect("ANY_AVAILABLE")}
                className="w-full justify-start py-3 text-left h-auto"
                size="lg"
              >
                <Users className="mr-3 h-5 w-5 flex-shrink-0" /> 
                <div>
                  Any Available Staff
                  <p className="text-xs font-normal text-muted-foreground">Let us pick the best available staff for you.</p>
                </div>
              </Button>
              {availableStaffForService.map(staff => (
                <Button 
                  key={staff.id} 
                  variant={selectedStaffId === staff.id ? "default" : "outline"} 
                  onClick={() => handleStaffSelect(staff.id!)}
                  className="w-full justify-start py-3 text-left h-auto"
                  size="lg"
                >
                  <User className="mr-3 h-5 w-5 flex-shrink-0" /> 
                   <div>
                    {staff.user?.firstName} {staff.user?.lastName}
                    {staff.specializations && staff.specializations.length > 0 && 
                      <Badge variant="secondary" className="ml-2 text-xs">{staff.specializations.join(', ')}</Badge>}
                  </div>
                </Button>
              ))}
              {availableStaffForService.length === 0 && !isLoadingStaff && (
                 <p className="text-sm text-muted-foreground p-3 bg-gray-50 rounded-md text-center">No specific staff available for this service. 'Any Available' will be used.</p>
              )}
            </div>
          )}
           <Button onClick={() => setCurrentStep('serviceSelection')} variant="link" className="mt-4 text-sm px-0">Back to Services</Button>
        </section>
      )}

      {/* Step 4: Date & Time Selection */}
      {currentStep === 'dateTimeSelection' && selectedServiceId && (
         <section>
          <h2 className="text-xl sm:text-2xl font-semibold mb-4 text-gray-800">Select Date & Time</h2>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-8 items-start">
            <div className="flex justify-center md:justify-start">
                <Card className="shadow-md">
                    <CardContent className="p-1 sm:p-2">
                         <DayPicker
                            mode="single"
                            selected={selectedDate}
                            onSelect={handleDateSelect}
                            fromDate={new Date()} 
                            className="flex justify-center"
                            disabled={isLoadingSlots || isLoadingStaff}
                            footer={selectedDate ? <p className="text-xs text-center p-2">You selected {format(selectedDate, 'PPP')}.</p> : <p className="text-xs text-center p-2">Please pick a day.</p>}
                        />
                    </CardContent>
                </Card>
            </div>
            <div className="mt-4 md:mt-0">
                <h3 className="text-lg font-medium mb-3 text-gray-700">
                    Available Slots for {selectedDate ? format(selectedDate, 'PPP') : '...'}
                </h3>
                {isLoadingSlots ? (
                    <div className="flex items-center justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-blue-500 mr-2" /> Loading slots...</div>
                ) : timeSlots.length === 0 ? (
                    <p className="text-gray-600 text-sm p-4 bg-gray-50 rounded-md text-center">
                        {selectedDate ? "No available slots for this date. Please try another date." : "Please select a date to see available slots."}
                    </p>
                ) : (
                    <ScrollArea className="h-[280px] pr-3 border rounded-md p-2">
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {timeSlots.map(slot => (
                            <Button 
                                key={slot.startTime.toString()} 
                                variant={selectedTimeSlot?.startTime === slot.startTime ? "default" : "outline"} 
                                onClick={() => handleTimeSlotSelect(slot)}
                                disabled={!slot.isAvailable || isSaving}
                                className={`py-2 px-3 h-auto text-xs sm:text-sm w-full ${!slot.isAvailable ? 'text-muted-foreground line-through' : ''}`}
                            >
                                {format(new Date(slot.startTime), "p")}
                            </Button>
                        ))}
                        </div>
                    </ScrollArea>
                )}
            </div>
           </div>
           <Button onClick={() => setCurrentStep(showStaffSelector ? 'staffSelection' : 'serviceSelection')} variant="link" className="mt-4 text-sm px-0">Back</Button>
        </section>
      )}
      
       {currentStep === 'detailsForm' && 
        <div className="p-6 bg-green-50 rounded-md text-green-700">
            Details form will appear here. Service: <Badge>{selectedServiceId}</Badge>, 
            Staff: <Badge>{selectedStaffId === "ANY_AVAILABLE" ? "Any Available" : availableStaffForService.find(s=>s.id === selectedStaffId)?.user?.firstName || selectedStaffId}</Badge>, 
            Slot: <Badge>{selectedTimeSlot ? format(new Date(selectedTimeSlot.startTime), "Pp") : 'N/A'}</Badge>.
            <Button onClick={() => setCurrentStep('dateTimeSelection')} variant="link" className="mt-2">Back to Date/Time</Button>
        </div>}
       {currentStep === 'confirmation' && <div className="p-6 bg-indigo-50 rounded-md text-indigo-700">Confirmation step...</div>}

    </div>
  );
}

// Extend types if they are not fully defined for props and state.
declare module '@/types/calendar' {
  export interface Location {
    id: string;
    name: string;
    address?: string | null;
    phone?: string | null;
  }
  export interface ServiceCategory {
    id: string;
    name: string;
    description?: string | null;
  }
  export interface Service {
    id: string;
    name: string;
    description?: string | null;
    durationMinutes: number;
    price: number;
    isActive: boolean;
    serviceCategoryId: string;
    serviceCategory?: { id: string; name: string }; 
    locations?: Array<{ id: string; name: string }>; 
  }
  export interface StaffProfile { 
    id: string;
    userId: string;
    bio?: string | null;
    specializations?: string[];
    user?: { firstName?: string | null; lastName?: string | null; email?: string; };
  }
  export interface AvailableTimeSlot {
    startTime: string; 
    endTime: string;   
    isAvailable: boolean;
    staffId?: string | null; 
  }
   export enum DayOfWeek { // Ensure this matches Prisma definition or is mapped
    MONDAY = "MONDAY", TUESDAY = "TUESDAY", WEDNESDAY = "WEDNESDAY",
    THURSDAY = "THURSDAY", FRIDAY = "FRIDAY", SATURDAY = "SATURDAY", SUNDAY = "SUNDAY",
  }
}
