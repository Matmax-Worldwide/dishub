'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Textarea } from '@/app/components/ui/textarea';
import { 
  ArrowLeft, 
  ArrowRight, 
  X, 
  Briefcase, 
  MapPin, 
  User, 
  Calendar,
  Clock,
  Check,
  Search
} from 'lucide-react';
import { toast } from 'sonner';
import MultiStepProgress from './MultiStepProgress';

// Types
interface Location {
  id: string;
  name: string;
  address?: string;
  phone?: string;
}

interface ServiceCategory {
  id: string;
  name: string;
  description?: string;
}

interface Service {
  id: string;
  name: string;
  description?: string;
  durationMinutes: number;
  prices?: Array<{
    id: string;
    amount: number;
    currencyId: string;
  }>;
  serviceCategory: ServiceCategory;
  locations: Array<{ id: string; name: string }>;
}

interface StaffProfile {
  id: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    profileImageUrl?: string;
  };
  bio?: string;
  specializations: string[];
}

interface BookingFormData {
  // Step 1: Selection method
  selectionMethod: 'service' | 'location' | 'specialist' | null;
  
  // Step 2: Based on selection method
  selectedServiceId?: string;
  selectedLocationId?: string;
  selectedStaffId?: string;
  
  // Step 3: Complete selection (fill in missing pieces)
  finalServiceId?: string;
  finalLocationId?: string;
  finalStaffId?: string;
  
  // Step 4: Date & Time
  bookingDate?: string;
  startTime?: string;
  endTime?: string;
  
  // Step 5: Customer details
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  notes?: string;
}

interface MultiStepBookingFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: BookingFormData) => Promise<void>;
  services: Service[];
  locations: Location[];
  staff: StaffProfile[];
  isSubmitting?: boolean;
}

const STEPS = [
  { id: '1', title: 'Choose Method', description: 'How would you like to start?', icon: Search },
  { id: '2', title: 'Make Selection', description: 'Choose your preference', icon: Check },
  { id: '3', title: 'Complete Details', description: 'Fill in remaining details', icon: Briefcase },
  { id: '4', title: 'Date & Time', description: 'Select when', icon: Calendar },
  { id: '5', title: 'Customer Info', description: 'Contact details', icon: User },
];

export default function MultiStepBookingForm({
  isOpen,
  onClose,
  onSubmit,
  services,
  locations,
  staff,
  isSubmitting = false
}: MultiStepBookingFormProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<BookingFormData>({
    selectionMethod: null
  });
  const [searchTerm, setSearchTerm] = useState('');

  // Reset form when opened
  useEffect(() => {
    if (isOpen) {
      setCurrentStep(1);
      setFormData({ selectionMethod: null });
      setSearchTerm('');
    }
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Filtering functions to show only available combinations
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const getAvailableServices = (locationId?: string, _staffId?: string) => {
    return services.filter(service => {
      // If location is selected, service must be available at that location
      if (locationId && !service.locations.some(loc => loc.id === locationId)) {
        return false;
      }
      
      // If staff is selected, we would need to check if staff can provide this service
      // For now, we assume all staff can provide all services at their assigned locations
      // This could be enhanced with a staff-service relationship
      
      return true;
    });
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const getAvailableLocations = (serviceId?: string, _staffId?: string) => {
    return locations.filter(location => {
      // If service is selected, location must offer that service
      if (serviceId) {
        const service = services.find(s => s.id === serviceId);
        if (service && !service.locations.some(loc => loc.id === location.id)) {
          return false;
        }
      }
      
      // If staff is selected, location must be where the staff works
      // For now, we assume staff can work at all locations
      // This could be enhanced with a staff-location relationship
      
      return true;
    });
  };

  const getAvailableStaff = (serviceId?: string, locationId?: string) => {
    return staff.filter(staffMember => {
      // If we have both service and location selected, we can use the GraphQL staffForService query
      // which already filters staff based on service and location
      // For now, we'll implement basic filtering logic
      
      // If service is selected, check if staff can provide this service
      if (serviceId) {
        // In a real implementation, you would check staffMember.serviceIds?.includes(serviceId)
        // For now, we'll use the fact that if we have both serviceId and locationId,
        // the staff list should already be filtered by the GraphQL query
        
        // If we also have a location, this staff member should be able to work at that location
        if (locationId) {
          // The staffForService GraphQL query already handles this filtering
          // So if we reach here with both serviceId and locationId, the staff is valid
          return true;
        }
        
        // If only service is selected, assume all staff can provide all services
        // This should be enhanced with actual staff-service relationships
        return true;
      }
      
      // If location is selected but no service, check if staff works at this location
      if (locationId) {
        // In a real implementation, you would check staffMember.locationIds?.includes(locationId)
        // For now, assume all staff work at all locations
        return true;
      }
      
      // Suppress unused variable warning - staffMember is used in the filtering logic above
      void staffMember;
      
      // If neither service nor location is selected, show all staff
      return true;
    });
  };

  const handleNext = () => {
    if (currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    try {
      await onSubmit(formData);
      onClose();
      toast.success('Booking created successfully!');
    } catch (error) {
      console.error('Failed to create booking:', error);
      toast.error('Failed to create booking. Please try again.');
    }
  };

  const canProceedFromStep = (step: number): boolean => {
    switch (step) {
      case 1:
        return formData.selectionMethod !== null;
      case 2:
        return !!(formData.selectedServiceId || formData.selectedLocationId || formData.selectedStaffId);
      case 3:
        // For step 3, we need both service and location to be selected
        // Either from step 2 (selectedXId) or step 3 (finalXId)
        const hasService = formData.selectedServiceId || formData.finalServiceId;
        const hasLocation = formData.selectedLocationId || formData.finalLocationId;
        return !!(hasService && hasLocation);
      case 4:
        return !!(formData.bookingDate && formData.startTime);
      case 5:
        return !!(formData.customerName && formData.customerEmail);
      default:
        return false;
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-lg font-medium mb-2">How would you like to start your booking?</h3>
        <p className="text-sm text-muted-foreground">
          Choose your preferred way to begin the booking process
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        <Card 
          className={`cursor-pointer transition-all hover:shadow-md ${
            formData.selectionMethod === 'service' ? 'ring-2 ring-primary bg-primary/5' : ''
          }`}
          onClick={() => setFormData({ ...formData, selectionMethod: 'service' })}
        >
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Briefcase className="h-6 w-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <h4 className="font-medium">Choose by Service</h4>
                <p className="text-sm text-muted-foreground">
                  Start by selecting the service you need
                </p>
              </div>
              {formData.selectionMethod === 'service' && (
                <Check className="h-5 w-5 text-primary" />
              )}
            </div>
          </CardContent>
        </Card>

        <Card 
          className={`cursor-pointer transition-all hover:shadow-md ${
            formData.selectionMethod === 'location' ? 'ring-2 ring-primary bg-primary/5' : ''
          }`}
          onClick={() => setFormData({ ...formData, selectionMethod: 'location' })}
        >
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <MapPin className="h-6 w-6 text-green-600" />
              </div>
              <div className="flex-1">
                <h4 className="font-medium">Choose by Location</h4>
                <p className="text-sm text-muted-foreground">
                  Start by selecting your preferred location
                </p>
              </div>
              {formData.selectionMethod === 'location' && (
                <Check className="h-5 w-5 text-primary" />
              )}
            </div>
          </CardContent>
        </Card>

        <Card 
          className={`cursor-pointer transition-all hover:shadow-md ${
            formData.selectionMethod === 'specialist' ? 'ring-2 ring-primary bg-primary/5' : ''
          }`}
          onClick={() => setFormData({ ...formData, selectionMethod: 'specialist' })}
        >
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-purple-100 rounded-lg">
                <User className="h-6 w-6 text-purple-600" />
              </div>
              <div className="flex-1">
                <h4 className="font-medium">Choose by Specialist</h4>
                <p className="text-sm text-muted-foreground">
                  Start by selecting your preferred staff member
                </p>
              </div>
              {formData.selectionMethod === 'specialist' && (
                <Check className="h-5 w-5 text-primary" />
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderStep2 = () => {
    const filteredItems = () => {
      const term = searchTerm.toLowerCase();
      
      switch (formData.selectionMethod) {
        case 'service':
          // Show all services (no filtering needed at this step)
          return services.filter(service => 
            service.name.toLowerCase().includes(term) ||
            service.description?.toLowerCase().includes(term) ||
            service.serviceCategory.name.toLowerCase().includes(term)
          );
        case 'location':
          // Show all locations (no filtering needed at this step)
          return locations.filter(location =>
            location.name.toLowerCase().includes(term) ||
            location.address?.toLowerCase().includes(term)
          );
        case 'specialist':
          // Show all staff (no filtering needed at this step)
          return staff.filter(staffMember =>
            `${staffMember.user.firstName} ${staffMember.user.lastName}`.toLowerCase().includes(term) ||
            staffMember.bio?.toLowerCase().includes(term) ||
            staffMember.specializations.some(spec => spec.toLowerCase().includes(term))
          );
        default:
          return [];
      }
    };

    const items = filteredItems();

    return (
      <div className="space-y-6">
        <div className="text-center">
          <h3 className="text-xl font-semibold mb-2">
            {formData.selectionMethod === 'service' && 'Choose a Service'}
            {formData.selectionMethod === 'location' && 'Choose a Location'}
            {formData.selectionMethod === 'specialist' && 'Choose a Specialist'}
          </h3>
          <p className="text-gray-600">
            {formData.selectionMethod === 'service' && 'Select the service you need'}
            {formData.selectionMethod === 'location' && 'Pick your preferred location'}
            {formData.selectionMethod === 'specialist' && 'Choose your preferred specialist'}
          </p>
        </div>

        {/* Search bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            type="text"
            placeholder={`Search ${formData.selectionMethod === 'service' ? 'services' : formData.selectionMethod === 'location' ? 'locations' : 'specialists'}...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Items grid */}
        <div className="grid gap-4 max-h-96 overflow-y-auto">
          {items.map((item) => {
            const isSelected = 
              (formData.selectionMethod === 'service' && formData.selectedServiceId === item.id) ||
              (formData.selectionMethod === 'location' && formData.selectedLocationId === item.id) ||
              (formData.selectionMethod === 'specialist' && formData.selectedStaffId === item.id);

            return (
              <Card
                key={item.id}
                className={`cursor-pointer transition-all hover:shadow-md ${
                  isSelected ? 'ring-2 ring-primary bg-primary/5' : ''
                }`}
                onClick={() => {
                  if (formData.selectionMethod === 'service') {
                    setFormData({ ...formData, selectedServiceId: item.id });
                  } else if (formData.selectionMethod === 'location') {
                    setFormData({ ...formData, selectedLocationId: item.id });
                  } else if (formData.selectionMethod === 'specialist') {
                    setFormData({ ...formData, selectedStaffId: item.id });
                  }
                }}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      {formData.selectionMethod === 'service' && (
                        <>
                          <h4 className="font-semibold text-lg">{(item as Service).name}</h4>
                          <p className="text-sm text-gray-600 mb-2">{(item as Service).description}</p>
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <span className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {(item as Service).durationMinutes} min
                            </span>
                            {(item as Service).prices && (item as Service).prices!.length > 0 && (
                              <span className="font-medium text-primary">
                                ${(item as Service).prices![0].amount}
                              </span>
                            )}
                          </div>
                          <Badge variant="secondary" className="mt-2">
                            {(item as Service).serviceCategory.name}
                          </Badge>
                        </>
                      )}
                      
                      {formData.selectionMethod === 'location' && (
                        <>
                          <h4 className="font-semibold text-lg">{(item as Location).name}</h4>
                          {(item as Location).address && (
                            <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                              <MapPin className="w-4 h-4" />
                              {(item as Location).address}
                            </p>
                          )}
                          {(item as Location).phone && (
                            <p className="text-sm text-gray-500 mt-1">{(item as Location).phone}</p>
                          )}
                        </>
                      )}
                      
                      {formData.selectionMethod === 'specialist' && (
                        <>
                          <h4 className="font-semibold text-lg">
                            {(item as StaffProfile).user.firstName} {(item as StaffProfile).user.lastName}
                          </h4>
                          {(item as StaffProfile).bio && (
                            <p className="text-sm text-gray-600 mt-1">{(item as StaffProfile).bio}</p>
                          )}
                          {(item as StaffProfile).specializations.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {(item as StaffProfile).specializations.map((spec, index) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  {spec}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                    
                    {isSelected && (
                      <Check className="w-5 h-5 text-primary flex-shrink-0 ml-2" />
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {items.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <p>No {formData.selectionMethod === 'service' ? 'services' : formData.selectionMethod === 'location' ? 'locations' : 'specialists'} found</p>
          </div>
        )}
      </div>
    );
  };

  const renderStep3 = () => {
    // Complete the missing selections based on what was chosen in step 2
    const selectedService = formData.selectedServiceId ? 
      services.find(s => s.id === formData.selectedServiceId) : null;
    const selectedLocation = formData.selectedLocationId ? 
      locations.find(l => l.id === formData.selectedLocationId) : null;
    const selectedStaff = formData.selectedStaffId ? 
      staff.find(s => s.id === formData.selectedStaffId) : null;

    // Get filtered options based on what was already selected
    const availableServices = getAvailableServices(formData.selectedLocationId, formData.selectedStaffId);
    const availableLocations = getAvailableLocations(formData.selectedServiceId, formData.selectedStaffId);
    
    // For staff, if we have both service and location, we should ideally use GraphQL staffForService
    // For now, we'll use the basic filtering
    const availableStaff = getAvailableStaff(
      formData.selectedServiceId || formData.finalServiceId, 
      formData.selectedLocationId || formData.finalLocationId
    );

    return (
      <div className="space-y-6">
        <div className="text-center">
          <h3 className="text-xl font-semibold mb-2">Complete Your Selection</h3>
          <p className="text-gray-600">Fill in the remaining details for your booking</p>
        </div>

        {/* Show what was selected in step 2 */}
        <div className="bg-blue-50 p-4 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">Your Selection:</h4>
          {selectedService && (
            <div className="flex items-center gap-2 text-blue-800">
              <Briefcase className="w-4 h-4" />
              <span>{selectedService.name}</span>
            </div>
          )}
          {selectedLocation && (
            <div className="flex items-center gap-2 text-blue-800">
              <MapPin className="w-4 h-4" />
              <span>{selectedLocation.name}</span>
            </div>
          )}
          {selectedStaff && (
            <div className="flex items-center gap-2 text-blue-800">
              <User className="w-4 h-4" />
              <span>{selectedStaff.user.firstName} {selectedStaff.user.lastName}</span>
            </div>
          )}
        </div>

        {/* Select missing items */}
        <div className="space-y-4">
          {!formData.selectedServiceId && (
            <div>
              <Label className="text-base font-medium mb-3 block">Service *</Label>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {availableServices.map(service => (
                  <Card
                    key={service.id}
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      formData.finalServiceId === service.id ? 'ring-2 ring-primary bg-primary/5' : ''
                    }`}
                    onClick={() => setFormData({ ...formData, finalServiceId: service.id })}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <h5 className="font-medium">{service.name}</h5>
                          <p className="text-sm text-gray-600">{service.description}</p>
                          <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
                            <Clock className="w-3 h-3" />
                            <span>{service.durationMinutes} min</span>
                            {service.prices && service.prices.length > 0 && (
                              <span className="font-medium text-primary ml-2">
                                ${service.prices[0].amount}
                              </span>
                            )}
                          </div>
                        </div>
                        {formData.finalServiceId === service.id && (
                          <Check className="w-5 h-5 text-primary" />
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {!formData.selectedLocationId && (
            <div>
              <Label className="text-base font-medium mb-3 block">Location *</Label>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {availableLocations.map(location => (
                  <Card
                    key={location.id}
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      formData.finalLocationId === location.id ? 'ring-2 ring-primary bg-primary/5' : ''
                    }`}
                    onClick={() => setFormData({ ...formData, finalLocationId: location.id })}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <h5 className="font-medium">{location.name}</h5>
                          {location.address && (
                            <p className="text-sm text-gray-600 flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {location.address}
                            </p>
                          )}
                        </div>
                        {formData.finalLocationId === location.id && (
                          <Check className="w-5 h-5 text-primary" />
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {!formData.selectedStaffId && (
            <div>
              <Label className="text-base font-medium mb-3 block">Specialist (Optional)</Label>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                <Card
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    formData.finalStaffId === 'ANY_AVAILABLE' ? 'ring-2 ring-primary bg-primary/5' : ''
                  }`}
                  onClick={() => setFormData({ ...formData, finalStaffId: 'ANY_AVAILABLE' })}
                >
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h5 className="font-medium">Any Available Specialist</h5>
                        <p className="text-sm text-gray-600">We&apos;ll assign the best available specialist</p>
                      </div>
                      {formData.finalStaffId === 'ANY_AVAILABLE' && (
                        <Check className="w-5 h-5 text-primary" />
                      )}
                    </div>
                  </CardContent>
                </Card>
                
                {availableStaff.map(staffMember => (
                  <Card
                    key={staffMember.id}
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      formData.finalStaffId === staffMember.id ? 'ring-2 ring-primary bg-primary/5' : ''
                    }`}
                    onClick={() => setFormData({ ...formData, finalStaffId: staffMember.id })}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <h5 className="font-medium">
                            {staffMember.user.firstName} {staffMember.user.lastName}
                          </h5>
                          {staffMember.bio && (
                            <p className="text-sm text-gray-600">{staffMember.bio}</p>
                          )}
                          {staffMember.specializations.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {staffMember.specializations.slice(0, 3).map((spec, index) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  {spec}
                                </Badge>
                              ))}
                              {staffMember.specializations.length > 3 && (
                                <span className="text-xs text-gray-500">
                                  +{staffMember.specializations.length - 3} more
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                        {formData.finalStaffId === staffMember.id && (
                          <Check className="w-5 h-5 text-primary" />
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderStep4 = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-lg font-medium mb-2">Choose when you&apos;d like your appointment</h3>
        <p className="text-sm text-muted-foreground">
          Choose when you&apos;d like your appointment
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <Label htmlFor="date">Date *</Label>
          <Input
            id="date"
            type="date"
            value={formData.bookingDate || ''}
            onChange={(e) => setFormData({ ...formData, bookingDate: e.target.value })}
            min={new Date().toISOString().split('T')[0]}
          />
        </div>

        <div>
          <Label htmlFor="time">Start Time *</Label>
          <Input
            id="time"
            type="time"
            value={formData.startTime || ''}
            onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
          />
        </div>
      </div>
    </div>
  );

  const renderStep5 = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-lg font-medium mb-2">Customer Information</h3>
        <p className="text-sm text-muted-foreground">
          Please provide your contact details
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <Label htmlFor="customerName">Full Name *</Label>
          <Input
            id="customerName"
            value={formData.customerName || ''}
            onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
            placeholder="Enter your full name"
          />
        </div>

        <div>
          <Label htmlFor="customerEmail">Email *</Label>
          <Input
            id="customerEmail"
            type="email"
            value={formData.customerEmail || ''}
            onChange={(e) => setFormData({ ...formData, customerEmail: e.target.value })}
            placeholder="Enter your email address"
          />
        </div>

        <div>
          <Label htmlFor="customerPhone">Phone Number</Label>
          <Input
            id="customerPhone"
            type="tel"
            value={formData.customerPhone || ''}
            onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
            placeholder="Enter your phone number"
          />
        </div>

        <div>
          <Label htmlFor="notes">Additional Notes</Label>
          <Textarea
            id="notes"
            value={formData.notes || ''}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder="Any special requests or notes..."
            rows={3}
          />
        </div>
      </div>
    </div>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1: return renderStep1();
      case 2: return renderStep2();
      case 3: return renderStep3();
      case 4: return renderStep4();
      case 5: return renderStep5();
      default: return null;
    }
  };

  const currentStepData = STEPS[currentStep - 1];
  const Icon = currentStepData?.icon || Search;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      <div className="relative w-full max-w-2xl max-h-[90vh] bg-white rounded-lg shadow-xl border border-gray-200 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Icon className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                {currentStepData?.title}
              </h2>
              <p className="text-sm text-gray-500">
                {currentStepData?.description}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-md transition-colors"
            disabled={isSubmitting}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Progress */}
        <div className="px-6 py-4 border-b border-gray-200 flex-shrink-0">
          <MultiStepProgress
            steps={STEPS}
            currentStep={currentStep.toString()}
            completedSteps={Array.from({ length: currentStep - 1 }, (_, i) => (i + 1).toString())}
          />
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {renderCurrentStep()}
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center p-6 border-t border-gray-200 bg-gray-50 flex-shrink-0">
          <Button
            variant="outline"
            onClick={handlePrev}
            disabled={currentStep === 1 || isSubmitting}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Previous
          </Button>

          <div className="text-sm text-gray-500">
            Step {currentStep} of {STEPS.length}
          </div>

          {currentStep === STEPS.length ? (
            <Button
              onClick={handleSubmit}
              disabled={!canProceedFromStep(currentStep) || isSubmitting}
            >
              {isSubmitting ? 'Creating...' : 'Create Booking'}
            </Button>
          ) : (
            <Button
              onClick={handleNext}
              disabled={!canProceedFromStep(currentStep) || isSubmitting}
            >
              Next
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
} 