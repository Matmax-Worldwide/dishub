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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

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
  // Configurable text content with defaults
  title?: string;
  subtitle?: string;
  description?: string;
  stepTitles?: {
    locationSelection?: string;
    serviceSelection?: string;
    staffSelection?: string;
    dateTimeSelection?: string;
    detailsForm?: string;
    confirmation?: string;
  };
  buttonTexts?: {
    next?: string;
    back?: string;
    submit?: string;
    bookNow?: string;
    selectLocation?: string;
    selectService?: string;
    selectStaff?: string;
    selectDateTime?: string;
  };
  placeholderTexts?: {
    searchServices?: string;
    customerName?: string;
    customerEmail?: string;
    customerPhone?: string;
    notes?: string;
  };
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
    title?: string;
    subtitle?: string;
    description?: string;
    stepTitles?: {
      locationSelection?: string;
      serviceSelection?: string;
      staffSelection?: string;
      dateTimeSelection?: string;
      detailsForm?: string;
      confirmation?: string;
    };
    buttonTexts?: {
      next?: string;
      back?: string;
      submit?: string;
      bookNow?: string;
      selectLocation?: string;
      selectService?: string;
      selectStaff?: string;
      selectDateTime?: string;
    };
    placeholderTexts?: {
      searchServices?: string;
      customerName?: string;
      customerEmail?: string;
      customerPhone?: string;
      notes?: string;
    };
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
  // Configurable text content with defaults
  title = 'Book Your Appointment',
  subtitle = 'Choose your preferred service and time',
  description = 'Select from our available services and book your appointment in just a few simple steps.',
  stepTitles = {
    locationSelection: 'Choose Location',
    serviceSelection: 'Select Service',
    staffSelection: 'Choose Staff',
    dateTimeSelection: 'Pick Date & Time',
    detailsForm: 'Your Details',
    confirmation: 'Confirm Booking'
  },
  buttonTexts = {
    next: 'Next',
    back: 'Back',
    submit: 'Submit',
    bookNow: 'Book Now',
    selectLocation: 'Select Location',
    selectService: 'Select Service',
    selectStaff: 'Select Staff',
    selectDateTime: 'Select Date & Time'
  },
  placeholderTexts = {
    searchServices: 'Search services...',
    customerName: 'Your full name',
    customerEmail: 'your.email@example.com',
    customerPhone: 'Your phone number',
    notes: 'Any special requests or notes...'
  },
  isEditing = false,
  onUpdate
}: CalendarSectionProps) {
  
  // Define all possible steps
  const stepDefinitions: {id: BookingStep, label: string, condition?: boolean}[] = [
    { id: 'locationSelection', label: stepTitles.locationSelection || 'Choose Location', condition: showLocationSelector },
    { id: 'serviceSelection', label: stepTitles.serviceSelection || 'Select Service', condition: true },
    { id: 'staffSelection', label: stepTitles.staffSelection || 'Choose Staff', condition: showStaffSelector }, 
    { id: 'dateTimeSelection', label: stepTitles.dateTimeSelection || 'Pick Date & Time', condition: true },
    { id: 'detailsForm', label: stepTitles.detailsForm || 'Your Details', condition: true },
    { id: 'confirmation', label: stepTitles.confirmation || 'Confirm Booking', condition: true }
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
  const [isDesignChanging, setIsDesignChanging] = useState(false);

  // Handle design template change
  const handleDesignTemplateChange = useCallback((template: string) => {
    try {
      setIsDesignChanging(true);
      setLocalDesignTemplate(template as DesignTemplate);
      
      if (onUpdate) {
        onUpdate({ designTemplate: template as DesignTemplate });
      }
      
      // Reset the changing state after a brief delay
      setTimeout(() => {
        setIsDesignChanging(false);
      }, 500);
    } catch (error) {
      console.error('Error changing design template:', error);
      toast.error('Failed to change design template');
      setIsDesignChanging(false);
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
    const { colors } = designTemplates['beauty-salon'];
    
    return (
      <div className="w-full max-w-3xl mx-auto bg-gradient-to-br from-purple-50 via-white to-pink-50 rounded-3xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className={`bg-gradient-to-r ${colors.primary} text-white p-6`}>
          <div className="flex items-center gap-3 mb-2">
            <Sparkles className="w-8 h-8" />
            <h2 className="text-2xl font-bold">{title}</h2>
          </div>
          <p className="text-purple-100">{subtitle}</p>
          {description && (
            <p className="text-sm text-purple-200 mt-2">{description}</p>
          )}
        </div>
        
        {/* Progress Indicator */}
        <div className="px-6 py-4 bg-white/80 backdrop-blur-sm">
          <ProgressIndicator currentStep={currentStep} steps={allSteps} />
        </div>
        
        {/* Content */}
        <div className="p-6">
          {renderStepContent()}
        </div>
      </div>
    );
  };

  // Medical Design Template
  const renderMedicalDesign = () => {
    const { colors, icons } = designTemplates['medical'];
    
    return (
      <div className="w-full max-w-3xl mx-auto bg-white rounded-2xl shadow-xl border border-blue-100 overflow-hidden">
        {/* Header */}
        <div className={`bg-gradient-to-r ${colors.primary} text-white p-6`}>
          <div className="flex items-center gap-3 mb-2">
            <icons.calendar className="w-8 h-8" />
            <h2 className="text-2xl font-semibold">{title}</h2>
          </div>
          <p className="text-blue-100">{subtitle}</p>
          {description && (
            <p className="text-sm text-blue-200 mt-2">{description}</p>
          )}
        </div>
        
        {/* Progress Indicator */}
        <div className="px-6 py-4 bg-blue-50">
          <ProgressIndicator currentStep={currentStep} steps={allSteps} />
        </div>
        
        {/* Content */}
        <div className="p-6">
          {renderStepContent()}
        </div>
      </div>
    );
  };

  // Fitness Design Template
  const renderFitnessDesign = () => {
    const { colors } = designTemplates['fitness'];
    
    return (
      <div className="w-full max-w-3xl mx-auto bg-gradient-to-br from-orange-50 to-red-50 rounded-3xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className={`bg-gradient-to-r ${colors.primary} text-white p-6`}>
          <div className="flex items-center gap-3 mb-2">
            <Heart className="w-8 h-8" />
            <h2 className="text-2xl font-bold">{title}</h2>
          </div>
          <p className="text-orange-100">{subtitle}</p>
          {description && (
            <p className="text-sm text-orange-200 mt-2">{description}</p>
          )}
        </div>
        
        {/* Progress Indicator */}
        <div className="px-6 py-4 bg-white/90 backdrop-blur-sm">
          <ProgressIndicator currentStep={currentStep} steps={allSteps} />
        </div>
        
        {/* Content */}
        <div className="p-6">
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
        <div className="text-center">
          <h3 className="text-xl font-semibold mb-2">{stepTitles.detailsForm}</h3>
          <p className="text-gray-600">Please provide your contact information</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Full Name *
            </label>
            <input
              type="text"
              value={customerInfo.fullName}
              onChange={handleCustomerInfoChange}
              name="fullName"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder={placeholderTexts.customerName}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Address *
            </label>
            <input
              type="email"
              value={customerInfo.email}
              onChange={handleCustomerInfoChange}
              name="email"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder={placeholderTexts.customerEmail}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Phone Number
            </label>
            <input
              type="tel"
              value={customerInfo.phone}
              onChange={handleCustomerInfoChange}
              name="phone"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder={placeholderTexts.customerPhone}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Special Requests
            </label>
            <textarea
              value={customerInfo.notes}
              onChange={handleCustomerInfoChange}
              name="notes"
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder={placeholderTexts.notes}
            />
          </div>
        </div>
        
        <div className="flex justify-between pt-4">
          <button
            onClick={() => setCurrentStep('dateTimeSelection')}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
          >
            {buttonTexts.back}
          </button>
          <button
            onClick={handleBookingSubmit}
            disabled={isBooking || !customerInfo.fullName || !customerInfo.email}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isBooking ? 'Processing...' : buttonTexts.submit}
          </button>
        </div>
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

  // Details Tab Component
  const DetailsTab = () => {
    return (
      <div className="space-y-6">
        {/* Text Configuration Section */}
        <div className="space-y-4">
          <h4 className="font-medium text-gray-900">Text Content</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Main Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => onUpdate?.({ title: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                placeholder="Book Your Appointment"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Subtitle</label>
              <input
                type="text"
                value={subtitle}
                onChange={(e) => onUpdate?.({ subtitle: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                placeholder="Choose your preferred service and time"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-2">Description</label>
              <textarea
                value={description}
                onChange={(e) => onUpdate?.({ description: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                rows={2}
                placeholder="Select from our available services and book your appointment in just a few simple steps."
              />
            </div>
          </div>
          
          {/* Step Titles Configuration */}
          <div>
            <h5 className="font-medium text-gray-900 mb-3">Step Titles</h5>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-sm text-gray-700 mb-1">Location Step</label>
                <input
                  type="text"
                  value={stepTitles.locationSelection}
                  onChange={(e) => onUpdate?.({ 
                    stepTitles: { ...stepTitles, locationSelection: e.target.value }
                  })}
                  className="w-full p-2 text-sm border border-gray-300 rounded-md"
                  placeholder="Choose Location"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">Service Step</label>
                <input
                  type="text"
                  value={stepTitles.serviceSelection}
                  onChange={(e) => onUpdate?.({ 
                    stepTitles: { ...stepTitles, serviceSelection: e.target.value }
                  })}
                  className="w-full p-2 text-sm border border-gray-300 rounded-md"
                  placeholder="Select Service"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">Staff Step</label>
                <input
                  type="text"
                  value={stepTitles.staffSelection}
                  onChange={(e) => onUpdate?.({ 
                    stepTitles: { ...stepTitles, staffSelection: e.target.value }
                  })}
                  className="w-full p-2 text-sm border border-gray-300 rounded-md"
                  placeholder="Choose Staff"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">Date & Time Step</label>
                <input
                  type="text"
                  value={stepTitles.dateTimeSelection}
                  onChange={(e) => onUpdate?.({ 
                    stepTitles: { ...stepTitles, dateTimeSelection: e.target.value }
                  })}
                  className="w-full p-2 text-sm border border-gray-300 rounded-md"
                  placeholder="Pick Date & Time"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">Details Step</label>
                <input
                  type="text"
                  value={stepTitles.detailsForm}
                  onChange={(e) => onUpdate?.({ 
                    stepTitles: { ...stepTitles, detailsForm: e.target.value }
                  })}
                  className="w-full p-2 text-sm border border-gray-300 rounded-md"
                  placeholder="Your Details"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">Confirmation Step</label>
                <input
                  type="text"
                  value={stepTitles.confirmation}
                  onChange={(e) => onUpdate?.({ 
                    stepTitles: { ...stepTitles, confirmation: e.target.value }
                  })}
                  className="w-full p-2 text-sm border border-gray-300 rounded-md"
                  placeholder="Confirm Booking"
                />
              </div>
            </div>
          </div>
          
          {/* Button Texts Configuration */}
          <div>
            <h5 className="font-medium text-gray-900 mb-3">Button Texts</h5>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div>
                <label className="block text-sm text-gray-700 mb-1">Next Button</label>
                <input
                  type="text"
                  value={buttonTexts.next}
                  onChange={(e) => onUpdate?.({ 
                    buttonTexts: { ...buttonTexts, next: e.target.value }
                  })}
                  className="w-full p-2 text-sm border border-gray-300 rounded-md"
                  placeholder="Next"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">Back Button</label>
                <input
                  type="text"
                  value={buttonTexts.back}
                  onChange={(e) => onUpdate?.({ 
                    buttonTexts: { ...buttonTexts, back: e.target.value }
                  })}
                  className="w-full p-2 text-sm border border-gray-300 rounded-md"
                  placeholder="Back"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">Submit Button</label>
                <input
                  type="text"
                  value={buttonTexts.submit}
                  onChange={(e) => onUpdate?.({ 
                    buttonTexts: { ...buttonTexts, submit: e.target.value }
                  })}
                  className="w-full p-2 text-sm border border-gray-300 rounded-md"
                  placeholder="Submit"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">Book Now Button</label>
                <input
                  type="text"
                  value={buttonTexts.bookNow}
                  onChange={(e) => onUpdate?.({ 
                    buttonTexts: { ...buttonTexts, bookNow: e.target.value }
                  })}
                  className="w-full p-2 text-sm border border-gray-300 rounded-md"
                  placeholder="Book Now"
                />
              </div>
            </div>
          </div>
        </div>
        
        {/* Configuration Options */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-200">
          <div className="space-y-3">
            <h5 className="font-medium text-gray-900">Booking Flow Options</h5>
            
            <div className="flex items-center justify-between">
              <label className="text-sm text-gray-700">Show Location Selector</label>
              <input
                type="checkbox"
                checked={showLocationSelector}
                onChange={(e) => onUpdate?.({ showLocationSelector: e.target.checked })}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
            </div>
            
            <div className="flex items-center justify-between">
              <label className="text-sm text-gray-700">Show Service Categories</label>
              <input
                type="checkbox"
                checked={showServiceCategories}
                onChange={(e) => onUpdate?.({ showServiceCategories: e.target.checked })}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
            </div>
            
            <div className="flex items-center justify-between">
              <label className="text-sm text-gray-700">Show Staff Selector</label>
              <input
                type="checkbox"
                checked={showStaffSelector}
                onChange={(e) => onUpdate?.({ showStaffSelector: e.target.checked })}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Styles Tab Component
  const StylesTab = () => {
    const { colors, name } = currentTemplate;
    
    return (
      <div className="space-y-6">
        {/* Visual Design Template Selector */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-gray-900">Choose Design Template</h4>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Current:</span>
              <span className={`px-3 py-1 rounded-full text-sm font-medium bg-gradient-to-r ${colors.primary} text-white`}>
                {name}
              </span>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(designTemplates).map(([key, template]) => (
              <div
                key={key}
                onClick={() => handleDesignTemplateChange(key)}
                className={`relative cursor-pointer rounded-lg border-2 transition-all duration-200 hover:shadow-md ${
                  localDesignTemplate === key 
                    ? 'border-blue-500 ring-2 ring-blue-200' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                {/* Template Preview */}
                <div className="p-4">
                  {/* Header Preview */}
                  <div className={`h-16 rounded-lg bg-gradient-to-r ${template.colors.primary} mb-3 flex items-center px-4`}>
                    <div className="flex items-center gap-2 text-white">
                      <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
                        <template.icons.calendar className="w-3 h-3" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold">{template.name}</div>
                        <div className="text-xs opacity-80">Book Appointment</div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Content Preview */}
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                      <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                    </div>
                    <div className="space-y-1">
                      <div className="h-2 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-2 bg-gray-200 rounded w-1/2"></div>
                    </div>
                    <div className="grid grid-cols-2 gap-1">
                      <div className="h-6 bg-gray-100 rounded"></div>
                      <div className="h-6 bg-gray-100 rounded"></div>
                    </div>
                  </div>
                </div>
                
                {/* Template Info */}
                <div className="px-4 pb-4">
                  <div className="text-sm font-medium text-gray-900">{template.name}</div>
                  <div className="text-xs text-gray-500 capitalize">{template.style} style</div>
                </div>
                
                {/* Selected Indicator */}
                {localDesignTemplate === key && (
                  <div className="absolute top-2 right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
        
        {/* Template Preview */}
        <div className="space-y-3">
          <h5 className="font-medium text-gray-900">Template Preview</h5>
          <div className={`p-4 rounded-lg bg-gradient-to-r ${colors.secondary} border`}>
            <div className="flex items-center gap-3 mb-3">
              <div className={`p-2 bg-gradient-to-r ${colors.primary} rounded-lg`}>
                <currentTemplate.icons.calendar className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="font-medium text-gray-900">{name}</div>
                <div className="text-sm text-gray-600 capitalize">{currentTemplate.style} design</div>
              </div>
            </div>
            <div className="text-xs text-gray-500">
              This template features {currentTemplate.style} styling with {name.toLowerCase()} branding and color scheme.
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Preview Tab Component
  const PreviewTab = () => {
    const { name } = currentTemplate;
    
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h4 className="font-medium text-gray-900">Calendar Preview</h4>
          <div className="text-sm text-gray-500">
            Template: <span className="font-medium">{name}</span>
          </div>
        </div>
        
        {/* Live Preview */}
        <div className="border rounded-lg overflow-hidden bg-gray-50">
          <div className="p-4 bg-white border-b">
            <h4 className="font-medium text-gray-900 mb-1">Live Preview</h4>
            <p className="text-sm text-gray-600">This is how your calendar will appear to visitors</p>
          </div>
          
          <div className="p-6 bg-gray-50">
            <div className="max-w-3xl mx-auto">
              {isDesignChanging ? (
                <div className="bg-white rounded-lg shadow-sm border p-6 flex items-center justify-center min-h-[300px]">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                    <p className="text-sm text-gray-600">Updating design preview...</p>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
                  {/* Render the actual calendar component in preview mode */}
                  {renderCalendarContent()}
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Template Information */}
        <div className="p-4 border rounded-md bg-blue-50">
          <h5 className="text-sm font-medium text-blue-900 mb-2">Current Template: {name}</h5>
          <div className="text-xs text-blue-700">
            {localDesignTemplate === 'beauty-salon' && 'Pink/purple gradient with sparkles icon and beauty salon branding'}
            {localDesignTemplate === 'medical' && 'Blue professional theme with calendar icon and medical styling'}
            {localDesignTemplate === 'fitness' && 'Orange/red gradient with heart icon and fitness branding'}
            {localDesignTemplate === 'restaurant' && 'Amber/orange theme with star icon and restaurant styling'}
            {localDesignTemplate === 'corporate' && 'Gray professional theme with building icon and corporate branding'}
            {localDesignTemplate === 'spa' && 'Green/teal wellness theme with spa styling'}
            {localDesignTemplate === 'automotive' && 'Slate/gray theme with settings icon and automotive branding'}
            {localDesignTemplate === 'education' && 'Indigo/purple theme with user icon and education styling'}
            {localDesignTemplate === 'modern' && 'Black/gray minimalist theme with modern styling'}
          </div>
        </div>
        
        {/* Live Preview Button */}
        <div className="pt-4 border-t border-gray-200">
          <button
            onClick={() => {
              // Toggle to preview mode temporarily
              const previewElement = document.createElement('div');
              previewElement.innerHTML = `
                <div class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                  <div class="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-auto">
                    <div class="p-4 border-b flex justify-between items-center">
                      <h3 class="font-semibold">Template Preview: ${name}</h3>
                      <button onclick="this.closest('.fixed').remove()" class="text-gray-500 hover:text-gray-700">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                      </button>
                    </div>
                    <div class="p-6">
                      <div class="text-center text-gray-500">
                        <p>Live preview would show the ${name} template in action</p>
                        <p class="text-sm mt-2">This would render the actual booking flow with the selected template</p>
                      </div>
                    </div>
                  </div>
                </div>
              `;
              document.body.appendChild(previewElement);
            }}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center justify-center gap-2"
          >
            <Calendar className="w-4 h-4" />
            Preview Template
          </button>
        </div>
      </div>
    );
  };

  const renderEditingInterface = () => {
    return (
      <div className="w-full p-6">
        <Tabs defaultValue="details" className="space-y-4 w-full max-w-full overflow-x-hidden">
          <TabsList className="flex flex-wrap space-x-2 w-full">
            <TabsTrigger value="details" className="flex-1 min-w-[100px]">Details</TabsTrigger>
            <TabsTrigger value="styles" className="flex-1 min-w-[100px]">Styles</TabsTrigger>
            <TabsTrigger value="preview" className="flex-1 min-w-[100px]">Preview</TabsTrigger>
          </TabsList>

          {/* DETAILS TAB */}
          <TabsContent value="details" className="space-y-4">
            <DetailsTab />
          </TabsContent>

          {/* STYLES TAB */}
          <TabsContent value="styles" className="space-y-4">
            <StylesTab />
          </TabsContent>

          {/* PREVIEW TAB */}
          <TabsContent value="preview" className="space-y-4">
            <PreviewTab />
          </TabsContent>
        </Tabs>
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
