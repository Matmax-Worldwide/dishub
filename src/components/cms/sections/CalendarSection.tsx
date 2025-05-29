'use client';

import React, { useState, useEffect, useCallback } from 'react';
import graphqlClient from '@/lib/graphql-client'; // Assuming this is set up
import { Location, ServiceCategory, Service } from '@/types/calendar'; // Assuming these types exist
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, CheckCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface CalendarSectionProps {
  calendarId?: string; 
  locationId?: string; 
  serviceIds?: string[]; 
  theme?: 'light' | 'dark'; // For now, not implemented
  showLocationSelector?: boolean;
  showServiceCategories?: boolean;
  defaultLocation?: string; // Pre-selected location ID
  defaultService?: string; // Pre-selected service ID
  customStyles?: Record<string, string>; // For theming
}

type BookingStep = 'locationSelection' | 'serviceSelection' | 'dateTimeSelection' | 'detailsForm' | 'confirmation';

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
  defaultService, // Not used in this part, but for future steps
}: CalendarSectionProps) {
  
  const allSteps: {id: BookingStep, label: string}[] = [
    ...(showLocationSelector ? [{ id: 'locationSelection' as BookingStep, label: 'Location' }] : []),
    { id: 'serviceSelection' as BookingStep, label: 'Service' },
    { id: 'dateTimeSelection' as BookingStep, label: 'Date & Time' },
    { id: 'detailsForm' as BookingStep, label: 'Your Details' },
    { id: 'confirmation' as BookingStep, label: 'Confirm' },
  ];
  
  const [currentStep, setCurrentStep] = useState<BookingStep>(showLocationSelector ? 'locationSelection' : 'serviceSelection');

  const [locations, setLocations] = useState<Location[]>([]);
  const [serviceCategories, setServiceCategories] = useState<ServiceCategory[]>([]);
  const [allServicesForLocation, setAllServicesForLocation] = useState<Service[]>([]); // Services for the selected location
  const [displayServices, setDisplayServices] = useState<Service[]>([]); // Services to display (filtered by category)

  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(defaultLocation || initialLocationIdProp || null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);

  const [isLoadingLocations, setIsLoadingLocations] = useState(showLocationSelector);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);
  const [isLoadingServices, setIsLoadingServices] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    // In a full flow, this would set the service and move to the next step (e.g., staff or date/time)
    toast.info(`Service ${serviceId} selected. Next step: Date/Time selection (Not Implemented).`);
    setCurrentStep('dateTimeSelection'); 
  };
  
  const currentVisibleStep = allSteps.find(s => s.id === currentStep);


  if (error) {
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
      
      {/* Placeholder for next steps */}
      {currentStep === 'dateTimeSelection' && (
        <div className="p-6 bg-yellow-50 rounded-md text-yellow-700">
            Date/Time, Staff Selection, and Form details will appear here. Service <Badge>{selectedServiceId}</Badge> selected.
            <Button onClick={() => setCurrentStep('serviceSelection')} variant="link" className="mt-2">Go Back to Services</Button>
        </div>
      )}
       {currentStep === 'detailsForm' && <div className="p-6 bg-green-50">Details Form step...</div>}
       {currentStep === 'confirmation' && <div className="p-6 bg-indigo-50">Confirmation step...</div>}


    </div>
  );
}

// Extend types if they are not fully defined for props and state.
// This ensures that the component can rely on these fields existing.
declare module '@/types/calendar' {
  export interface Location {
    id: string;
    name: string;
    address?: string | null;
    phone?: string | null;
    // operatingHours?: any; // Not directly used in this specific UI part yet
    // services?: Service[]; // If needed for "available services count"
  }
  export interface ServiceCategory {
    id: string;
    name: string;
    description?: string | null;
    // services?: Service[]; // Could be used for price/duration ranges
  }
  export interface Service {
    id: string;
    name: string;
    description?: string | null;
    durationMinutes: number;
    price: number;
    isActive: boolean;
    serviceCategoryId: string;
    serviceCategory?: { id: string; name: string }; // For display
    locations?: Array<{ id: string; name: string }>; // For filtering and display
  }
}
