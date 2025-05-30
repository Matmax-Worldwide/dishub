'use client';

import React, { useState, useCallback } from 'react';
import { Service, ServiceCategory, StaffProfile, Location, AvailableTimeSlot, Booking } from '@/types/calendar'; 
import { Button } from '@/components/ui/button';
import { 
  CheckCircle, 
  User, 
  Calendar, 
  Check, 
  Sparkles, 
  MapPin, 
  Scissors, 
  Star, 
  Heart,
  Building,
  Settings,
  Clock
} from 'lucide-react';
import { toast } from 'sonner';
import 'react-day-picker/dist/style.css'; 
import { format } from 'date-fns';

// Add design template type
type DesignTemplate = 'beauty-salon' | 'medical' | 'fitness' | 'restaurant' | 'corporate' | 'spa' | 'automotive' | 'education' | 'modern';

interface CalendarSectionProps {
  calendarId?: string; 
  locationId?: string; 
  serviceIds?: string[]; 
  theme?: 'light' | 'dark'; // For now, not implemented
  showLocationSelector?: boolean;
  showServiceCategories?: boolean;
  defaultLocation?: string; 
  customStyles?: Record<string, string>; 
  showStaffSelector?: boolean; // New prop
  designTemplate?: DesignTemplate;
  isEditing?: boolean;
  onUpdate?: (data: {
    calendarId?: string;
    locationId?: string;
    serviceIds?: string[];
    theme?: 'light' | 'dark';
    showLocationSelector?: boolean;
    showServiceCategories?: boolean;
    defaultLocation?: string;
    customStyles?: Record<string, string>;
    showStaffSelector?: boolean;
    designTemplate?: DesignTemplate;
  }) => void;
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
  locationId: initialLocationIdProp,
  showLocationSelector = true,
  showServiceCategories = true,
  defaultLocation,
  showStaffSelector = true,
  designTemplate: initialDesignTemplate = 'beauty-salon',
  isEditing = false,
  onUpdate
}: CalendarSectionProps) {
  
  // Define all possible steps
  const stepDefinitions: {id: BookingStep, label: string, condition?: boolean}[] = [
    { id: 'locationSelection', label: 'Location', condition: showLocationSelector },
    { id: 'serviceSelection', label: 'Service', condition: true },
    { id: 'staffSelection', label: 'Staff', condition: showStaffSelector }, 
    { id: 'dateTimeSelection', label: 'Date & Time', condition: true },
    { id: 'detailsForm', label: 'Details', condition: true },
    { id: 'confirmation', label: 'Confirm', condition: true }
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

  // Only keep state variables that are actually used
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<AvailableTimeSlot | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [isBooking, setIsBooking] = useState(false); 
  const [error, setError] = useState<string | null>(null);

  // Mock data for display (these would be fetched from API in real implementation)
  const locations: Location[] = [];
  const serviceCategories: ServiceCategory[] = [];
  const displayServices: Service[] = []; 
  const availableStaffForService: Partial<StaffProfile>[] = [];
  const timeSlots: AvailableTimeSlot[] = [];
  
  // Loading states (would be used when implementing actual data fetching)
  const isLoadingLocations = showLocationSelector && !(defaultLocation || initialLocationIdProp);
  const isLoadingCategories = false;
  const isLoadingServices = false;
  const isLoadingStaff = false;
  const isLoadingSlots = false;

  const [customerInfo, setCustomerInfo] = useState({
    fullName: '',
    email: '',
    phone: '',
    notes: '',
  });
  
  const [confirmedBookingDetails, setConfirmedBookingDetails] = useState<Booking | null>(null);

  // Design template state
  const [localDesignTemplate, setLocalDesignTemplate] = useState<DesignTemplate>(initialDesignTemplate);

  // Handle design template change
  const handleDesignTemplateChange = useCallback((template: string) => {
    try {
      setLocalDesignTemplate(template as DesignTemplate);
      
      if (onUpdate) {
        onUpdate({ designTemplate: template as DesignTemplate });
      }
    } catch (error) {
      console.error('Error changing design template:', error);
      toast.error('Failed to change design template');
    }
  }, [onUpdate]);

  // Reset booking flow function
  const resetBookingFlow = () => {
    setSelectedLocationId(defaultLocation || initialLocationIdProp || null);
    setSelectedServiceId(null);
    setSelectedStaffId("ANY_AVAILABLE");
    setSelectedDate(new Date());
    setSelectedTimeSlot(null);
    setSelectedCategoryId(null);
    setCustomerInfo({
      fullName: '',
      email: '',
      phone: '',
      notes: '',
    });
    setConfirmedBookingDetails(null);
    setCurrentStep(getInitialStep());
    setError(null);
  };

  // Design templates configuration
  const designTemplates = {
    'beauty-salon': {
      name: 'Beauty Salon',
      colors: {
        primary: 'from-pink-500 to-purple-600',
        secondary: 'from-pink-50 to-purple-50',
        accent: 'pink',
        button: 'from-pink-500 to-purple-600',
        hover: 'pink-50'
      },
      icons: {
        location: MapPin,
        service: Scissors,
        staff: User,
        calendar: Calendar
      },
      style: 'elegant'
    },
    'medical': {
      name: 'Medical',
      colors: {
        primary: 'from-blue-600 to-cyan-600',
        secondary: 'from-blue-50 to-cyan-50',
        accent: 'blue',
        button: 'from-blue-600 to-cyan-600',
        hover: 'blue-50'
      },
      icons: {
        location: Building,
        service: Heart,
        staff: User,
        calendar: Calendar
      },
      style: 'professional'
    },
    'fitness': {
      name: 'Fitness',
      colors: {
        primary: 'from-green-500 to-emerald-600',
        secondary: 'from-green-50 to-emerald-50',
        accent: 'green',
        button: 'from-green-500 to-emerald-600',
        hover: 'green-50'
      },
      icons: {
        location: MapPin,
        service: Star,
        staff: User,
        calendar: Calendar
      },
      style: 'energetic'
    },
    'restaurant': {
      name: 'Restaurant',
      colors: {
        primary: 'from-orange-500 to-red-600',
        secondary: 'from-orange-50 to-red-50',
        accent: 'orange',
        button: 'from-orange-500 to-red-600',
        hover: 'orange-50'
      },
      icons: {
        location: MapPin,
        service: Star,
        staff: User,
        calendar: Calendar
      },
      style: 'warm'
    },
    'corporate': {
      name: 'Corporate',
      colors: {
        primary: 'from-gray-700 to-slate-800',
        secondary: 'from-gray-50 to-slate-50',
        accent: 'gray',
        button: 'from-gray-700 to-slate-800',
        hover: 'gray-50'
      },
      icons: {
        location: Building,
        service: Settings,
        staff: User,
        calendar: Calendar
      },
      style: 'professional'
    },
    'spa': {
      name: 'Spa & Wellness',
      colors: {
        primary: 'from-teal-500 to-cyan-600',
        secondary: 'from-teal-50 to-cyan-50',
        accent: 'teal',
        button: 'from-teal-500 to-cyan-600',
        hover: 'teal-50'
      },
      icons: {
        location: MapPin,
        service: Sparkles,
        staff: User,
        calendar: Calendar
      },
      style: 'serene'
    },
    'automotive': {
      name: 'Automotive',
      colors: {
        primary: 'from-slate-600 to-gray-700',
        secondary: 'from-slate-50 to-gray-50',
        accent: 'slate',
        button: 'from-slate-600 to-gray-700',
        hover: 'slate-50'
      },
      icons: {
        location: Building,
        service: Settings,
        staff: User,
        calendar: Calendar
      },
      style: 'industrial'
    },
    'education': {
      name: 'Education',
      colors: {
        primary: 'from-indigo-500 to-purple-600',
        secondary: 'from-indigo-50 to-purple-50',
        accent: 'indigo',
        button: 'from-indigo-500 to-purple-600',
        hover: 'indigo-50'
      },
      icons: {
        location: Building,
        service: Star,
        staff: User,
        calendar: Calendar
      },
      style: 'academic'
    },
    'modern': {
      name: 'Modern',
      colors: {
        primary: 'from-violet-500 to-purple-600',
        secondary: 'from-violet-50 to-purple-50',
        accent: 'violet',
        button: 'from-violet-500 to-purple-600',
        hover: 'violet-50'
      },
      icons: {
        location: MapPin,
        service: Sparkles,
        staff: User,
        calendar: Calendar
      },
      style: 'contemporary'
    }
  };

  // Get current template for styling
  const currentTemplate = designTemplates[localDesignTemplate] || designTemplates['beauty-salon'];

  if (error && currentStep !== 'locationSelection' && currentStep !== 'serviceSelection') { 
    return <div className="p-4 text-red-600 bg-red-50 rounded-md">{error}</div>;
  }

  // Render the calendar component based on design template
  const renderCalendarContent = () => {

    // Use the design template to render different calendar designs
    switch (localDesignTemplate) {
      case 'beauty-salon':
        return renderBeautySalonDesign();
      case 'medical':
        return renderMedicalDesign();
      case 'fitness':
        return renderFitnessDesign();
      case 'restaurant':
        return renderRestaurantDesign();
      case 'corporate':
        return renderCorporateDesign();
      case 'spa':
        return renderSpaDesign();
      case 'automotive':
        return renderAutomotiveDesign();
      case 'education':
        return renderEducationDesign();
      case 'modern':
        return renderModernDesign();
      default:
        return renderBeautySalonDesign();
    }
  };

  // Beauty Salon Design Template
  const renderBeautySalonDesign = () => {
    if (isEditing) {
      return renderEditingInterface();
    }

    return (
      <div className="w-full max-w-4xl mx-auto bg-gradient-to-br from-pink-50 via-white to-purple-50 rounded-3xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-pink-500 via-purple-400 to-pink-500 text-white p-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-white/20 rounded-full">
              <Sparkles className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-3xl font-bold">Book Your Beauty Experience</h2>
              <p className="text-pink-100 text-lg">Transform yourself with our premium services</p>
            </div>
          </div>
          
          {/* Progress Steps */}
          <ProgressIndicator currentStep={currentStep} steps={allSteps} />
        </div>

        {/* Content */}
        <div className="p-8">
          {renderStepContent()}
        </div>
      </div>
    );
  };

  // Medical Design Template
  const renderMedicalDesign = () => {
    if (isEditing) {
      return renderEditingInterface();
    }

    return (
      <div className="w-full max-w-4xl mx-auto bg-white rounded-2xl shadow-xl border border-blue-100 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-semibold">Schedule Your Appointment</h2>
              <p className="text-blue-100">Professional healthcare services</p>
            </div>
          </div>
          
          <ProgressIndicator currentStep={currentStep} steps={allSteps} />
        </div>

        <div className="p-6">
          {renderStepContent()}
        </div>
      </div>
    );
  };

  // Fitness Design Template
  const renderFitnessDesign = () => {
    if (isEditing) {
      return renderEditingInterface();
    }

    return (
      <div className="w-full max-w-4xl mx-auto bg-gradient-to-br from-orange-50 to-red-50 rounded-3xl shadow-2xl overflow-hidden">
        <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white p-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-white/20 rounded-full">
              <Heart className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-3xl font-bold">Book Your Workout</h2>
              <p className="text-orange-100 text-lg">Get fit with our expert trainers</p>
            </div>
          </div>
          
          <ProgressIndicator currentStep={currentStep} steps={allSteps} />
        </div>

        <div className="p-8">
          {renderStepContent()}
        </div>
      </div>
    );
  };

  // Restaurant Design Template
  const renderRestaurantDesign = () => {
    if (isEditing) {
      return renderEditingInterface();
    }

    return (
      <div className="w-full max-w-4xl mx-auto bg-gradient-to-br from-amber-50 to-orange-50 rounded-3xl shadow-2xl overflow-hidden">
        <div className="bg-gradient-to-r from-amber-600 to-orange-600 text-white p-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-white/20 rounded-full">
              <Star className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-3xl font-bold">Reserve Your Table</h2>
              <p className="text-amber-100 text-lg">Experience culinary excellence</p>
            </div>
          </div>
          
          <ProgressIndicator currentStep={currentStep} steps={allSteps} />
        </div>

        <div className="p-8">
          {renderStepContent()}
        </div>
      </div>
    );
  };

  // Corporate Design Template
  const renderCorporateDesign = () => {
    if (isEditing) {
      return renderEditingInterface();
    }

    return (
      <div className="w-full max-w-4xl mx-auto bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
        <div className="bg-gradient-to-r from-gray-800 to-gray-900 text-white p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-white/20 rounded">
              <Building className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-semibold">Schedule Meeting</h2>
              <p className="text-gray-300">Professional business services</p>
            </div>
          </div>
          
          <ProgressIndicator currentStep={currentStep} steps={allSteps} />
        </div>

        <div className="p-6">
          {renderStepContent()}
        </div>
      </div>
    );
  };

  // Spa Design Template
  const renderSpaDesign = () => {
    if (isEditing) {
      return renderEditingInterface();
    }

    return (
      <div className="w-full max-w-4xl mx-auto bg-gradient-to-br from-green-50 via-white to-blue-50 rounded-3xl shadow-2xl overflow-hidden">
        <div className="bg-gradient-to-r from-green-500 to-teal-500 text-white p-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-white/20 rounded-full">
              <Heart className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-3xl font-bold">Book Your Wellness Journey</h2>
              <p className="text-green-100 text-lg">Relax, rejuvenate, and restore</p>
            </div>
          </div>
          
          <ProgressIndicator currentStep={currentStep} steps={allSteps} />
        </div>

        <div className="p-8">
          {renderStepContent()}
        </div>
      </div>
    );
  };

  // Automotive Design Template
  const renderAutomotiveDesign = () => {
    if (isEditing) {
      return renderEditingInterface();
    }

    return (
      <div className="w-full max-w-4xl mx-auto bg-gradient-to-br from-slate-50 to-gray-50 rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
        <div className="bg-gradient-to-r from-slate-700 to-gray-800 text-white p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-white/20 rounded">
              <Settings className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-semibold">Schedule Service</h2>
              <p className="text-slate-300">Professional automotive care</p>
            </div>
          </div>
          
          <ProgressIndicator currentStep={currentStep} steps={allSteps} />
        </div>

        <div className="p-6">
          {renderStepContent()}
        </div>
      </div>
    );
  };

  // Education Design Template
  const renderEducationDesign = () => {
    if (isEditing) {
      return renderEditingInterface();
    }

    return (
      <div className="w-full max-w-4xl mx-auto bg-gradient-to-br from-indigo-50 to-purple-50 rounded-3xl shadow-2xl overflow-hidden">
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-white/20 rounded-full">
              <User className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-3xl font-bold">Book Your Session</h2>
              <p className="text-indigo-100 text-lg">Learn with expert instructors</p>
            </div>
          </div>
          
          <ProgressIndicator currentStep={currentStep} steps={allSteps} />
        </div>

        <div className="p-8">
          {renderStepContent()}
        </div>
      </div>
    );
  };

  // Modern Design Template
  const renderModernDesign = () => {
    if (isEditing) {
      return renderEditingInterface();
    }

    return (
      <div className="w-full max-w-4xl mx-auto bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
        <div className="bg-gradient-to-r from-black to-gray-800 text-white p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-white/20 rounded">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-semibold">Book Appointment</h2>
              <p className="text-gray-300">Modern booking experience</p>
            </div>
          </div>
          
          <ProgressIndicator currentStep={currentStep} steps={allSteps} />
        </div>

        <div className="p-6">
          {renderStepContent()}
        </div>
      </div>
    );
  };

  // Render step content based on current step
  const renderStepContent = () => {
    if (error) {
      return (
        <div className="text-center py-8">
          <div className="text-red-600 mb-4">{error}</div>
          <Button onClick={() => setError(null)}>Try Again</Button>
        </div>
      );
    }

    switch (currentStep) {
      case 'locationSelection':
        return renderLocationSelection();
      case 'serviceSelection':
        return renderServiceSelection();
      case 'staffSelection':
        return renderStaffSelection();
      case 'dateTimeSelection':
        return renderDateTimeSelection();
      case 'detailsForm':
        return renderDetailsForm();
      case 'confirmation':
        return renderConfirmation();
      default:
        return renderLocationSelection();
    }
  };

  // Location Selection Step
  const renderLocationSelection = () => {
    if (isLoadingLocations) {
      return (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading locations...</p>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <h3 className="text-xl font-semibold mb-4">Choose Location</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {locations.map((location) => (
            <div
              key={location.id}
              onClick={() => handleLocationSelect(location.id)}
              className={`p-4 border rounded-lg cursor-pointer transition-all ${
                selectedLocationId === location.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-3">
                <MapPin className="w-5 h-5 text-gray-500" />
                <div>
                  <h4 className="font-medium">{location.name}</h4>
                  {location.address && (
                    <p className="text-sm text-gray-600">{location.address}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Service Selection Step
  const renderServiceSelection = () => {
    if (isLoadingServices || isLoadingCategories) {
      return (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading services...</p>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <h3 className="text-xl font-semibold mb-4">Select Service</h3>
        
        {/* Service Categories */}
        {showServiceCategories && serviceCategories.length > 0 && (
          <div className="mb-6">
            <h4 className="font-medium mb-3">Categories</h4>
            <div className="flex flex-wrap gap-2">
              {serviceCategories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => handleCategorySelect(category.id)}
                  className={`px-4 py-2 rounded-full text-sm transition-all ${
                    selectedCategoryId === category.id
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {category.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Services */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {displayServices.map((service) => (
            <div
              key={service.id}
              onClick={() => handleServiceSelect(service.id)}
              className={`p-4 border rounded-lg cursor-pointer transition-all ${
                selectedServiceId === service.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-medium">{service.name}</h4>
                  {service.description && (
                    <p className="text-sm text-gray-600 mt-1">{service.description}</p>
                  )}
                  <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {service.durationMinutes} min
                    </span>
                    {service.price && (
                      <span className="font-medium text-green-600">${service.price}</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Staff Selection Step
  const renderStaffSelection = () => {
    if (isLoadingStaff) {
      return (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading staff...</p>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <h3 className="text-xl font-semibold mb-4">Choose Staff Member</h3>
        
        {/* Any Available Option */}
        <div
          onClick={() => handleStaffSelect("ANY_AVAILABLE")}
          className={`p-4 border rounded-lg cursor-pointer transition-all ${
            selectedStaffId === "ANY_AVAILABLE"
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <div className="flex items-center gap-3">
            <User className="w-5 h-5 text-gray-500" />
            <div>
              <h4 className="font-medium">Any Available Staff</h4>
              <p className="text-sm text-gray-600">We&apos;ll assign the best available staff member</p>
            </div>
          </div>
        </div>

        {/* Individual Staff Members */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {availableStaffForService.map((staff) => (
            <div
              key={staff.id}
              onClick={() => handleStaffSelect(staff.id!)}
              className={`p-4 border rounded-lg cursor-pointer transition-all ${
                selectedStaffId === staff.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-gray-500" />
                </div>
                <div>
                  <h4 className="font-medium">{staff.user?.firstName} {staff.user?.lastName || 'Staff Member'}</h4>
                  {staff.specializations && staff.specializations.length > 0 && (
                    <p className="text-sm text-gray-600">{staff.specializations.join(', ')}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Date & Time Selection Step
  const renderDateTimeSelection = () => {
    if (isLoadingSlots) {
      return (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading available times...</p>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <h3 className="text-xl font-semibold mb-4">Select Date & Time</h3>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Date Picker */}
          <div>
            <h4 className="font-medium mb-3">Choose Date</h4>
            <div className="border rounded-lg p-4">
              <input
                type="date"
                value={selectedDate ? format(selectedDate, 'yyyy-MM-dd') : ''}
                onChange={(e) => handleDateSelect(new Date(e.target.value))}
                min={format(new Date(), 'yyyy-MM-dd')}
                className="w-full p-2 border rounded"
              />
            </div>
          </div>

          {/* Time Slots */}
          <div>
            <h4 className="font-medium mb-3">Available Times</h4>
            <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto">
              {timeSlots.map((slot, index) => (
                <button
                  key={index}
                  onClick={() => handleTimeSlotSelect(slot)}
                  disabled={!slot.isAvailable}
                  className={`p-3 text-sm rounded-lg transition-all ${
                    selectedTimeSlot?.startTime === slot.startTime
                      ? 'bg-blue-500 text-white'
                      : slot.isAvailable
                        ? 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                        : 'bg-gray-50 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  {format(new Date(slot.startTime), 'h:mm a')}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Details Form Step
  const renderDetailsForm = () => {
    return (
      <div className="space-y-6">
        <h3 className="text-xl font-semibold mb-4">Your Details</h3>
        
        <form onSubmit={handleBookingSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Full Name *</label>
              <input
                type="text"
                name="fullName"
                value={customerInfo.fullName}
                onChange={handleCustomerInfoChange}
                required
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter your full name"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Email *</label>
              <input
                type="email"
                name="email"
                value={customerInfo.email}
                onChange={handleCustomerInfoChange}
                required
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter your email"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Phone Number</label>
            <input
              type="tel"
              name="phone"
              value={customerInfo.phone}
              onChange={handleCustomerInfoChange}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter your phone number"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Special Notes</label>
            <textarea
              name="notes"
              value={customerInfo.notes}
              onChange={handleCustomerInfoChange}
              rows={3}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Any special requests or notes..."
            />
          </div>
          
          <div className="flex gap-4 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setCurrentStep('dateTimeSelection')}
              className="flex-1"
            >
              Back
            </Button>
            <Button
              type="submit"
              disabled={isBooking}
              className="flex-1"
            >
              {isBooking ? 'Booking...' : 'Confirm Booking'}
            </Button>
          </div>
        </form>
      </div>
    );
  };

  // Confirmation Step
  const renderConfirmation = () => {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Check className="w-8 h-8 text-green-600" />
        </div>
        <h3 className="text-2xl font-bold text-gray-800 mb-2">Booking Confirmed!</h3>
        <p className="text-gray-600 mb-6">
          We&apos;ve sent a confirmation email to <span className="font-semibold">{customerInfo.email}</span>
        </p>
        
        {confirmedBookingDetails && (
          <div className="bg-gray-50 rounded-lg p-6 mb-6 text-left max-w-md mx-auto">
            <h4 className="font-semibold mb-3">Booking Details</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Service:</span>
                <span className="font-medium">{displayServices.find(s => s.id === selectedServiceId)?.name}</span>
              </div>
              <div className="flex justify-between">
                <span>Date:</span>
                <span className="font-medium">{selectedDate ? format(selectedDate, 'PPP') : ''}</span>
              </div>
              <div className="flex justify-between">
                <span>Time:</span>
                <span className="font-medium">
                  {selectedTimeSlot ? format(new Date(selectedTimeSlot.startTime), 'p') : ''}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Location:</span>
                <span className="font-medium">{locations.find(l => l.id === selectedLocationId)?.name}</span>
              </div>
            </div>
          </div>
        )}
        
        <Button onClick={resetBookingFlow} variant="outline">
          Book Another Appointment
        </Button>
      </div>
    );
  };

  // Render editing interface with template-aware styling
  const renderEditingInterface = () => {
    const { colors, name } = currentTemplate;
    
    return (
      <div className="space-y-6 p-6 bg-white rounded-lg border">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Calendar Booking Component</h3>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Template:</span>
            <span className={`px-2 py-1 rounded text-sm font-medium bg-gradient-to-r ${colors.primary} text-white`}>
              {name}
            </span>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Design Template</label>
            <select
              value={localDesignTemplate}
              onChange={(e) => handleDesignTemplateChange(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            >
              {Object.entries(designTemplates).map(([key, template]) => (
                <option key={key} value={key}>
                  {template.name}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Show Location Selector</label>
            <input
              type="checkbox"
              checked={showLocationSelector}
              onChange={(e) => onUpdate?.({ showLocationSelector: e.target.checked })}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Show Service Categories</label>
            <input
              type="checkbox"
              checked={showServiceCategories}
              onChange={(e) => onUpdate?.({ showServiceCategories: e.target.checked })}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Show Staff Selector</label>
            <input
              type="checkbox"
              checked={showStaffSelector}
              onChange={(e) => onUpdate?.({ showStaffSelector: e.target.checked })}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
          </div>
        </div>
        
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium mb-2">Preview</h4>
          <p className="text-sm text-gray-600">
            This calendar component will use the <strong>{name}</strong> design template with {currentTemplate.style} styling.
          </p>
        </div>
      </div>
    );
  };

  // Handler functions for booking flow
  const handleLocationSelect = (locationId: string) => {
    setSelectedLocationId(locationId);
    setCurrentStep('serviceSelection');
  };

  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategoryId(categoryId);
    // Filter services by category if needed
  };

  const handleServiceSelect = (serviceId: string) => {
    setSelectedServiceId(serviceId);
    if (showStaffSelector) {
      setCurrentStep('staffSelection');
    } else {
      setCurrentStep('dateTimeSelection');
    }
  };

  const handleStaffSelect = (staffId: string | null) => {
    setSelectedStaffId(staffId);
    setCurrentStep('dateTimeSelection');
  };

  const handleDateSelect = (date?: Date) => {
    setSelectedDate(date);
    // Load available time slots for the selected date
  };

  const handleTimeSlotSelect = (slot: AvailableTimeSlot) => {
    setSelectedTimeSlot(slot);
    setCurrentStep('detailsForm');
  };

  const handleCustomerInfoChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setCustomerInfo(prev => ({ ...prev, [name]: value }));
  };

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsBooking(true);
    
    try {
      // Simulate booking submission
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Create confirmed booking details
      const booking: Booking = {
        id: `booking-${Date.now()}`,
        locationId: selectedLocationId || '',
        serviceId: selectedServiceId || '',
        bookingDate: selectedDate?.toISOString().split('T')[0] || new Date().toISOString().split('T')[0],
        startTime: selectedTimeSlot?.startTime || '',
        endTime: selectedTimeSlot?.endTime || '',
        customerName: customerInfo.fullName,
        customerEmail: customerInfo.email,
        customerPhone: customerInfo.phone,
        notes: customerInfo.notes || null,
        status: 'CONFIRMED'
      };
      
      setConfirmedBookingDetails(booking);
      setCurrentStep('confirmation');
      toast.success('Booking confirmed successfully!');
    } catch (error) {
      console.error('Booking error:', error);
      toast.error('Failed to confirm booking. Please try again.');
    } finally {
      setIsBooking(false);
    }
  };

  return (
    <div className="calendar-section">
      {renderCalendarContent()}
    </div>
  );
}
