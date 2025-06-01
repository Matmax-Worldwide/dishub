'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Service, Location, AvailableTimeSlot, Booking } from '@/types/calendar'; 
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
  Clock,
  FileText,
  LayoutPanelTop,
  FormInput,
  Palette,
  Briefcase,
  Search
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
import graphqlClient from '@/lib/graphql-client';

// Add design template type
type DesignTemplate = 'beauty-salon' | 'medical' | 'fitness' | 'restaurant' | 'corporate' | 'spa' | 'automotive' | 'education' | 'modern';

// Add selection method type
type SelectionMethod = 'service' | 'location' | 'specialist';

// Enhanced step configuration
interface StepConfig {
  id: BookingStep;
  label: string;
  required: boolean;
  condition: () => boolean;
  skipCondition?: () => boolean;
}

interface CalendarSectionProps {
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
  // Enhanced multi-step booking configuration
  enableMultiStepBooking?: boolean;
  enabledSelectionMethods?: SelectionMethod[];
  // Enhanced step configuration
  stepOrder?: BookingStep[];
  requiredSteps?: BookingStep[]; // Steps that cannot be skipped
  optionalSteps?: BookingStep[]; // Steps that can be skipped
  skipLocationSelection?: boolean; // Skip location selection entirely
  skipStaffSelection?: boolean; // Skip staff selection entirely
  skipServiceSelection?: boolean; // Skip service selection entirely
  autoSelectSingleOption?: boolean; // Auto-select if only one option available
  // Step flow customization
  allowStepSkipping?: boolean; // Allow users to skip optional steps
  showProgressIndicator?: boolean; // Show/hide progress indicator
  // Configurable text content with defaults
  title?: string;
  subtitle?: string;
  description?: string;
  stepTitles?: {
    selectionMethod?: string;
    dynamicSelection?: string;
    completeSelection?: string;
    dateTimeSelection?: string;
    detailsForm?: string;
    confirmation?: string;
  };
  buttonTexts?: {
    next?: string;
    back?: string;
    submit?: string;
    bookNow?: string;
    skip?: string;
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
  selectionMethodTexts?: {
    title: string;
    subtitle: string;
    serviceOption: {
      title: string;
      description: string;
    };
    locationOption: {
      title: string;
      description: string;
    };
    specialistOption: {
      title: string;
      description: string;
    };
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
    enableMultiStepBooking?: boolean;
    enabledSelectionMethods?: SelectionMethod[];
    stepOrder?: BookingStep[];
    requiredSteps?: BookingStep[];
    optionalSteps?: BookingStep[];
    skipLocationSelection?: boolean;
    skipStaffSelection?: boolean;
    skipServiceSelection?: boolean;
    autoSelectSingleOption?: boolean;
    allowStepSkipping?: boolean;
    showProgressIndicator?: boolean;
    title?: string;
    subtitle?: string;
    description?: string;
    stepTitles?: {
      selectionMethod?: string;
      dynamicSelection?: string;
      completeSelection?: string;
      dateTimeSelection?: string;
      detailsForm?: string;
      confirmation?: string;
    };
    buttonTexts?: {
      next?: string;
      back?: string;
      submit?: string;
      bookNow?: string;
      skip?: string;
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
    selectionMethodTexts?: {
      title: string;
      subtitle: string;
      serviceOption: {
        title: string;
        description: string;
      };
      locationOption: {
        title: string;
        description: string;
      };
      specialistOption: {
        title: string;
        description: string;
      };
    };
  }) => void;
  className?: string;
}

type BookingStep = 'selectionMethod' | 'dynamicSelection' | 'completeSelection' | 'dateTimeSelection' | 'detailsForm' | 'confirmation';

const ProgressIndicator = ({ currentStep, steps, onStepClick }: { 
  currentStep: BookingStep, 
  steps: {id: BookingStep, label: string}[], 
  onStepClick?: (stepId: BookingStep) => void 
}) => {
  const currentIndex = steps.findIndex(s => s.id === currentStep);
  return (
    <div className="flex justify-center space-x-2 sm:space-x-4 mb-8 overflow-x-auto pb-2">
      {steps.map((step, index) => (
        <div 
          key={step.id} 
          className="flex flex-col items-center min-w-[60px] sm:min-w-[80px]"
          onClick={() => onStepClick?.(step.id)}
        >
          <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center border-2 transition-all duration-200
            ${index < currentIndex ? 'bg-green-500 border-green-500 text-white hover:bg-green-600' : ''}
            ${index === currentIndex ? 'bg-blue-500 border-blue-500 text-white animate-pulse' : ''}
            ${index > currentIndex ? 'bg-gray-200 border-gray-300 text-gray-500 hover:bg-gray-300' : ''}
            ${onStepClick ? 'cursor-pointer hover:scale-110' : ''}
          `}>
            {index < currentIndex ? <CheckCircle size={16} /> : index + 1}
          </div>
          <p className={`mt-1 text-xs sm:text-sm text-center transition-colors duration-200 ${
            index === currentIndex ? 'text-blue-600 font-semibold' : 'text-gray-500'
          } ${onStepClick ? 'hover:text-blue-500' : ''}`}>
            {step.label}
          </p>
        </div>
      ))}
    </div>
  );
};

// Add type guard functions after the imports
type StaffForService = {
  id: string;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    profileImageUrl?: string;
  };
  bio?: string;
  specializations: string[];
};

const isService = (item: Service | Location | StaffForService): item is Service => {
  return 'durationMinutes' in item && 'prices' in item;
};

const isLocation = (item: Service | Location | StaffForService): item is Location => {
  return 'address' in item || ('name' in item && !('durationMinutes' in item) && !('user' in item));
};

const isStaffForService = (item: Service | Location | StaffForService): item is StaffForService => {
  return 'user' in item && 'specializations' in item;
};

export default function CalendarSection({
  locationId: initialLocationIdProp,
  showLocationSelector: initialShowLocationSelector = true,
  showServiceCategories: initialShowServiceCategories = true,
  defaultLocation: initialDefaultLocation,
  showStaffSelector: initialShowStaffSelector = true,
  designTemplate: initialDesignTemplate = 'beauty-salon',
  // Enhanced multi-step booking configuration
  enableMultiStepBooking: initialEnableMultiStepBooking = true,
  enabledSelectionMethods: initialEnabledSelectionMethods = ['service', 'location', 'specialist'],
  // Enhanced step configuration
  stepOrder: initialStepOrder = ['selectionMethod', 'dynamicSelection', 'completeSelection', 'dateTimeSelection', 'detailsForm', 'confirmation'],
  requiredSteps: initialRequiredSteps = ['dateTimeSelection', 'detailsForm', 'confirmation'],
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  optionalSteps: initialOptionalSteps = ['selectionMethod', 'completeSelection'],
  skipLocationSelection: initialSkipLocationSelection = false,
  skipStaffSelection: initialSkipStaffSelection = false,
  skipServiceSelection: initialSkipServiceSelection = false,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  autoSelectSingleOption: initialAutoSelectSingleOption = true,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  allowStepSkipping: initialAllowStepSkipping = true,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  showProgressIndicator: initialShowProgressIndicator = true,
  // Configurable text content with defaults
  title: initialTitle = 'Book Your Appointment',
  subtitle: initialSubtitle = 'Choose your preferred service and time',
  description: initialDescription = 'Select from our available services and book your appointment in just a few simple steps.',
  stepTitles: initialStepTitles = {
    selectionMethod: 'Choose Method',
    dynamicSelection: 'Make Selection',
    completeSelection: 'Complete Selection',
    dateTimeSelection: 'Pick Date & Time',
    detailsForm: 'Your Details',
    confirmation: 'Confirm Booking'
  },
  buttonTexts: initialButtonTexts = {
    next: 'Next',
    back: 'Back',
    submit: 'Submit',
    bookNow: 'Book Now',
    skip: 'Skip',
    selectLocation: 'Select Location',
    selectService: 'Select Service',
    selectStaff: 'Select Staff',
    selectDateTime: 'Select Date & Time'
  },
  placeholderTexts: initialPlaceholderTexts = {
    searchServices: 'Search services...',
    customerName: 'Your full name',
    customerEmail: 'your.email@example.com',
    customerPhone: 'Your phone number',
    notes: 'Any special requests or notes...'
  },
  selectionMethodTexts: initialSelectionMethodTexts = {
    title: 'Choose Method',
    subtitle: 'Select the preferred method for booking',
    serviceOption: {
      title: 'Service',
      description: 'Select a service you want to book'
    },
    locationOption: {
      title: 'Location',
      description: 'Choose a location where you want to book'
    },
    specialistOption: {
      title: 'Specialist',
      description: 'Choose a specialist for your service'
    }
  },
  isEditing = false,
  onUpdate,
  className = ''
}: CalendarSectionProps) {
  
  // Local state management
  const [title, setTitle] = useState(initialTitle);
  const [subtitle, setSubtitle] = useState(initialSubtitle);
  const [description, setDescription] = useState(initialDescription);
  const [showLocationSelector, setShowLocationSelector] = useState(initialShowLocationSelector);
  const [showServiceCategories, setShowServiceCategories] = useState(initialShowServiceCategories);
  const [defaultLocation, setDefaultLocation] = useState(initialDefaultLocation);
  const [showStaffSelector, setShowStaffSelector] = useState(initialShowStaffSelector);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [enableMultiStepBooking, setEnableMultiStepBooking] = useState(initialEnableMultiStepBooking);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [enabledSelectionMethods, setEnabledSelectionMethods] = useState(initialEnabledSelectionMethods);
  const [stepTitles, setStepTitles] = useState(initialStepTitles);
  const [buttonTexts, setButtonTexts] = useState(initialButtonTexts);
  const [placeholderTexts, setPlaceholderTexts] = useState(initialPlaceholderTexts);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [selectionMethodTexts, setSelectionMethodTexts] = useState(initialSelectionMethodTexts);
  const [stepOrder, setStepOrder] = useState(initialStepOrder);
  
  // Enhanced step configuration state
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [requiredSteps, setRequiredSteps] = useState(initialRequiredSteps);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [skipLocationSelection, setSkipLocationSelection] = useState(initialSkipLocationSelection);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [skipStaffSelection, setSkipStaffSelection] = useState(initialSkipStaffSelection);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [skipServiceSelection, setSkipServiceSelection] = useState(initialSkipServiceSelection);
  
  
  // Multi-step booking state
  const [selectedBookingMethod, setSelectedBookingMethod] = useState<SelectionMethod | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [step2Selections, setStep2Selections] = useState<{
    serviceId?: string;
    locationId?: string;
    staffId?: string | null;
  }>({});
  const [step3Selections, setStep3Selections] = useState<{
    finalServiceId?: string;
    finalLocationId?: string;
    finalStaffId?: string | null;
  }>({});

  // Track if we're actively editing to prevent props from overriding local state
  const isEditingRef = useRef(false);
  
  // Debounce updates
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  
  // Update local state when props change, but only if not currently editing
  useEffect(() => {
    if (!isEditingRef.current) {
      if (initialTitle !== title) setTitle(initialTitle);
      if (initialSubtitle !== subtitle) setSubtitle(initialSubtitle);
      if (initialDescription !== description) setDescription(initialDescription);
      if (initialShowLocationSelector !== showLocationSelector) setShowLocationSelector(initialShowLocationSelector);
      if (initialShowServiceCategories !== showServiceCategories) setShowServiceCategories(initialShowServiceCategories);
      if (initialDefaultLocation !== defaultLocation) setDefaultLocation(initialDefaultLocation);
      if (initialShowStaffSelector !== showStaffSelector) setShowStaffSelector(initialShowStaffSelector);
      if (JSON.stringify(initialStepTitles) !== JSON.stringify(stepTitles)) setStepTitles(initialStepTitles);
      if (JSON.stringify(initialButtonTexts) !== JSON.stringify(buttonTexts)) setButtonTexts(initialButtonTexts);
      if (JSON.stringify(initialPlaceholderTexts) !== JSON.stringify(placeholderTexts)) setPlaceholderTexts(initialPlaceholderTexts);
      if (JSON.stringify(initialStepOrder) !== JSON.stringify(stepOrder)) setStepOrder(initialStepOrder);
    }
  }, [initialTitle, initialSubtitle, initialDescription, initialShowLocationSelector, initialShowServiceCategories, initialDefaultLocation, initialShowStaffSelector, initialStepTitles, initialButtonTexts, initialPlaceholderTexts, initialStepOrder]);
  
  // Design template state
  const [localDesignTemplate, setLocalDesignTemplate] = useState<DesignTemplate>(initialDesignTemplate);
  const [isDesignChanging, setIsDesignChanging] = useState(false);

  // Update parent with changes
  const handleUpdateField = useCallback((field: string, value: string | boolean | DesignTemplate | typeof stepTitles | typeof buttonTexts | typeof placeholderTexts | BookingStep[], event?: React.SyntheticEvent) => {
    // Solo para los campos que no son title y description, hacemos stopPropagation
    if (event && field !== 'title' && field !== 'description') {
      event.stopPropagation();
    }
    
    if (onUpdate) {
      // Mark that we're in editing mode
      isEditingRef.current = true;
      
      // Clear any pending debounce
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      
      // Prepare data to update
      const updateData = {
        title,
        subtitle,
        description,
        showLocationSelector,
        showServiceCategories,
        defaultLocation,
        showStaffSelector,
        designTemplate: localDesignTemplate,
        stepOrder,
        stepTitles,
        buttonTexts,
        placeholderTexts
      };
      
      // Update the specific field
      switch (field) {
        case 'title':
          updateData.title = value as string;
          break;
        case 'subtitle':
          updateData.subtitle = value as string;
          break;
        case 'description':
          updateData.description = value as string;
          break;
        case 'showLocationSelector':
          updateData.showLocationSelector = value as boolean;
          break;
        case 'showServiceCategories':
          updateData.showServiceCategories = value as boolean;
          break;
        case 'defaultLocation':
          updateData.defaultLocation = value as string;
          break;
        case 'showStaffSelector':
          updateData.showStaffSelector = value as boolean;
          break;
        case 'designTemplate':
          updateData.designTemplate = value as DesignTemplate;
          break;
        case 'stepOrder':
          updateData.stepOrder = value as BookingStep[];
          break;
        case 'stepTitles':
          updateData.stepTitles = value as typeof stepTitles;
          break;
        case 'buttonTexts':
          updateData.buttonTexts = value as typeof buttonTexts;
          break;
        case 'placeholderTexts':
          updateData.placeholderTexts = value as typeof placeholderTexts;
          break;
      }
      
      try {
        // Set up a debounced update
        debounceRef.current = setTimeout(() => {
          onUpdate(updateData);
          // Don't reset the editing ref right away to prevent props from overriding local state
          // Allow changes to persist during the editing session
        }, 500);
      } catch (error) {
        console.error("Error updating field:", error);
      }
    }
  }, [title, subtitle, description, showLocationSelector, showServiceCategories, defaultLocation, showStaffSelector, localDesignTemplate, stepOrder, stepTitles, buttonTexts, placeholderTexts, onUpdate]);
  
  // Enhanced step configuration using StepConfig interface
  const stepConfigurations: StepConfig[] = [
    {
      id: 'selectionMethod',
      label: stepTitles.selectionMethod || 'Choose Method',
      required: requiredSteps.includes('selectionMethod'),
      condition: () => enableMultiStepBooking && !skipServiceSelection && !skipLocationSelection && !skipStaffSelection,
      skipCondition: () => {
        // Skip if only one selection method is enabled or if all selections are skipped
        const enabledCount = [
          !skipServiceSelection,
          !skipLocationSelection && showLocationSelector,
          !skipStaffSelection && showStaffSelector
        ].filter(Boolean).length;
        return enabledCount <= 1;
      }
    },
    {
      id: 'dynamicSelection',
      label: stepTitles.dynamicSelection || 'Make Selection',
      required: requiredSteps.includes('dynamicSelection'),
      condition: () => true, // Always available
      skipCondition: () => {
        // Skip if all selections are disabled
        return skipServiceSelection && skipLocationSelection && skipStaffSelection;
      }
    },
    {
      id: 'completeSelection',
      label: stepTitles.completeSelection || 'Complete Selection',
      required: requiredSteps.includes('completeSelection'),
      condition: () => enableMultiStepBooking,
      skipCondition: () => {
        // Skip if only one type of selection is needed
        const needsCompletion = [
          !skipServiceSelection,
          !skipLocationSelection && showLocationSelector,
          !skipStaffSelection && showStaffSelector
        ].filter(Boolean).length > 1;
        return !needsCompletion;
      }
    },
    {
      id: 'dateTimeSelection',
      label: stepTitles.dateTimeSelection || 'Pick Date & Time',
      required: requiredSteps.includes('dateTimeSelection'),
      condition: () => true, // Always required
    },
    {
      id: 'detailsForm',
      label: stepTitles.detailsForm || 'Your Details',
      required: requiredSteps.includes('detailsForm'),
      condition: () => true, // Always required
    },
    {
      id: 'confirmation',
      label: stepTitles.confirmation || 'Confirm Booking',
      required: requiredSteps.includes('confirmation'),
      condition: () => true, // Always required
    }
  ];

  // Filter and order steps based on configuration
  const allSteps = stepOrder
    .map(stepId => stepConfigurations.find(config => config.id === stepId))
    .filter((config): config is StepConfig => {
      if (!config) return false;
      
      // Check if step meets its condition
      if (!config.condition()) return false;
      
      // Check if step should be skipped
      if (config.skipCondition && config.skipCondition()) {
        // Only skip if it's not required
        return config.required;
      }
      
      return true;
    });

  // Steps to show in progress indicator (exclude confirmation)
  const visibleSteps = allSteps.filter(step => step.id !== 'confirmation');

  const getInitialStep = (): BookingStep => {
    // Return the first step in the custom order that meets its conditions
    const firstAvailableStep = allSteps[0];
    return firstAvailableStep ? firstAvailableStep.id : 'dynamicSelection';
  };
  
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(defaultLocation || initialLocationIdProp || null);
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null); // Initialize defaultService later
  const [selectedStaffId, setSelectedStaffId] = useState<string | null>("ANY_AVAILABLE"); 
  
  const [currentStep, setCurrentStep] = useState<BookingStep>(getInitialStep());

  // Only keep state variables that are actually used
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<AvailableTimeSlot | null>(null);
  const [isBooking, setIsBooking] = useState(false); 
  const [error, setError] = useState<string | null>(null);

  // Data state
  const [locations, setLocations] = useState<Location[]>([]);
  const [displayServices, setDisplayServices] = useState<Service[]>([]);
  const [availableStaffForService, setAvailableStaffForService] = useState<Array<{
    id: string;
    user?: {
      id: string;
      firstName: string;
      lastName: string;
      profileImageUrl?: string;
    };
    bio?: string;
    specializations: string[];
  }>>([]);
  const [timeSlots, setTimeSlots] = useState<AvailableTimeSlot[]>([]);
  
  // Loading states
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);

  const [customerInfo, setCustomerInfo] = useState({
    fullName: '',
    email: '',
    phone: '',
    notes: '',
  });
  
  const [confirmedBookingDetails, setConfirmedBookingDetails] = useState<Booking | null>(null);

  // Helper function to get the current effective selections
  const getCurrentSelections = useCallback(() => {
    return {
      serviceId: step3Selections.finalServiceId || step2Selections.serviceId || selectedServiceId,
      locationId: step3Selections.finalLocationId || step2Selections.locationId || selectedLocationId,
      staffId: step3Selections.finalStaffId || step2Selections.staffId || selectedStaffId
    };
  }, [step3Selections, step2Selections, selectedServiceId, selectedLocationId, selectedStaffId]);

  // Load locations when component mounts or when showLocationSelector changes
  useEffect(() => {
    async function loadLocations() {
      if (showLocationSelector) {
        try {
          console.log('Loading locations...');
          const locationsData = await graphqlClient.locations();
          console.log('Locations loaded:', locationsData);
          setLocations(locationsData);
          setError(null);
          
          // Show success message only if locations were actually loaded
          if (locationsData && locationsData.length > 0) {
            toast.success(`${locationsData.length} location${locationsData.length !== 1 ? 's' : ''} loaded successfully`);
          } else {
            console.warn('No locations found in the database');
          }
        } catch (error) {
          console.error('Error loading locations:', error);
          const errorMessage = error instanceof Error ? error.message : 'Failed to load locations. Please try again.';
          setError(errorMessage);
          setLocations([]);
          toast.error('Failed to load locations');
        }
      } else {
        setLocations([]);
      }
    }

    loadLocations();
  }, [showLocationSelector]);

  // Load service categories when component mounts or when showServiceCategories changes
  useEffect(() => {
    async function loadServiceCategories() {
      if (showServiceCategories) {
        try {
          console.log('Loading service categories...');
          // TODO: Implement graphqlClient.serviceCategories() method
          // For now, using empty array
          setError(null);
        } catch (error) {
          console.error('Error loading service categories:', error);
          setError('Failed to load service categories. Please try again.');
        }
      } else {
      }
    }

    loadServiceCategories();
  }, [showServiceCategories]);

  // Load services when component mounts or when location changes
  useEffect(() => {
    async function loadServices() {
      try {
        console.log('Loading services...');
        const servicesData = await graphqlClient.services();
        console.log('Services loaded:', servicesData);
        
        // Filter only active services and transform to match our Service type
        const activeServices = servicesData
          .filter(service => service.isActive)
          .map(service => ({
            id: service.id,
            name: service.name,
            description: service.description || null,
            durationMinutes: service.durationMinutes,
            prices: service.prices || [],
            serviceCategoryId: service.serviceCategoryId,
            serviceCategory: service.serviceCategory || null,
            bufferTimeBeforeMinutes: service.bufferTimeBeforeMinutes || null,
            bufferTimeAfterMinutes: service.bufferTimeAfterMinutes || null,
            preparationTimeMinutes: service.preparationTimeMinutes || null,
            cleanupTimeMinutes: service.cleanupTimeMinutes || null,
            maxDailyBookingsPerService: service.maxDailyBookingsPerService || null,
            isActive: service.isActive,
            locationIds: service.locations?.map(loc => loc.id) || [],
            locations: service.locations || []
          }));
        
        setDisplayServices(activeServices);
        setError(null);
        
        if (activeServices.length > 0) {
          toast.success(`${activeServices.length} service${activeServices.length !== 1 ? 's' : ''} loaded successfully`);
        } else {
          console.warn('No active services found');
        }
      } catch (error) {
        console.error('Error loading services:', error);
        const errorMessage = error instanceof Error ? error.message : 'Failed to load services. Please try again.';
        setError(errorMessage);
        setDisplayServices([]);
        toast.error('Failed to load services');
      } finally {
      }
    }

    loadServices();
  }, []);


  // Filtering functions to show only available combinations
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const getAvailableServices = (locationId?: string, _staffId?: string) => {
    return displayServices.filter(service => {
      // If location is selected, service must be available at that location
      if (locationId && !service.locations?.some(loc => loc.id === locationId)) {
        return false;
      }
      return true;
    });
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const getAvailableLocations = (serviceId?: string, _staffId?: string) => {
    return locations.filter(location => {
      // If service is selected, location must offer that service
      if (serviceId) {
        const service = displayServices.find(s => s.id === serviceId);
        if (service && !service.locations?.some(loc => loc.id === location.id)) {
          return false;
        }
      }
      return true;
    });
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const getAvailableStaff = (serviceId?: string, locationId?: string) => {
    // Use the availableStaffForService which is already filtered by the GraphQL query
    // The GraphQL staffForService query already filters staff based on service and location
    return availableStaffForService.filter(staffMember => {
      // Additional filtering can be added here if needed
      // For now, the GraphQL query handles the main filtering
      
      // Suppress unused variable warning - staffMember is used in potential filtering logic
      void staffMember;
      void serviceId;
      void locationId;
      
      return true;
    });
  };

  // Load staff when service is selected
  useEffect(() => {
    async function loadStaffForService() {
      const currentSelections = getCurrentSelections();
      
      if (currentSelections.serviceId && showStaffSelector && currentSelections.locationId) {
        try {
          console.log('Loading staff for service:', currentSelections.serviceId, 'at location:', currentSelections.locationId);
          const staffData = await graphqlClient.staffForService({
            serviceId: currentSelections.serviceId,
            locationId: currentSelections.locationId
          });
          console.log('Staff loaded:', staffData);
          
          // Transform the data to match our expected format
          const transformedStaff = staffData.map(staff => ({
            id: staff.id,
            user: staff.user,
            bio: staff.bio,
            specializations: staff.specializations || []
          }));
          
          setAvailableStaffForService(transformedStaff);
          setError(null);
          
          if (transformedStaff.length > 0) {
            toast.success(`${transformedStaff.length} staff member${transformedStaff.length !== 1 ? 's' : ''} available`);
          } else {
            console.warn('No staff found for this service and location');
            // Don't show error toast for empty results, just log it
            console.log('This might be normal if no staff has been assigned to this service at this location yet.');
          }
        } catch (error) {
          console.error('Error loading staff:', error);
          const errorMessage = error instanceof Error ? error.message : 'Failed to load staff. Please try again.';
          setError(errorMessage);
          setAvailableStaffForService([]);
          toast.error('Failed to load staff');
        } finally {
        }
      } else {
        setAvailableStaffForService([]);
      }
    }

    loadStaffForService();
  }, [selectedServiceId, showStaffSelector, selectedLocationId, step2Selections, step3Selections, getCurrentSelections]);

  // Load time slots when date, service, and staff are selected
  useEffect(() => {
    async function loadTimeSlots() {
      const currentSelections = getCurrentSelections();
      
      if (selectedDate && currentSelections.serviceId && currentSelections.locationId && currentSelections.staffId) {
        setIsLoadingSlots(true);
        try {
          const dateString = format(selectedDate, 'yyyy-MM-dd');
          console.log('Loading time slots for:', { 
            serviceId: currentSelections.serviceId, 
            locationId: currentSelections.locationId, 
            staffProfileId: currentSelections.staffId === "ANY_AVAILABLE" ? undefined : currentSelections.staffId,
            date: dateString 
          });
          
          const slotsData = await graphqlClient.availableSlots({
            serviceId: currentSelections.serviceId,
            locationId: currentSelections.locationId,
            staffProfileId: currentSelections.staffId === "ANY_AVAILABLE" ? undefined : currentSelections.staffId,
            date: dateString
          });
          console.log('Time slots loaded:', slotsData);
          
          setTimeSlots(slotsData);
          setError(null);
          
          if (slotsData.length > 0) {
            toast.success(`${slotsData.length} time slot${slotsData.length !== 1 ? 's' : ''} available`);
          } else {
            console.warn('No available time slots found for the selected date');
          }
        } catch (error) {
          console.error('Error loading time slots:', error);
          const errorMessage = error instanceof Error ? error.message : 'Failed to load available time slots. Please try again.';
          setError(errorMessage);
          setTimeSlots([]);
          toast.error('Failed to load time slots');
        } finally {
          setIsLoadingSlots(false);
        }
      } else {
        setTimeSlots([]);
        setIsLoadingSlots(false);
      }
    }

    loadTimeSlots();
  }, [selectedDate, getCurrentSelections]);

  // Handle design template change
  const handleDesignTemplateChange = useCallback((template: string) => {
    try {
      setIsDesignChanging(true);
      setLocalDesignTemplate(template as DesignTemplate);
      
      handleUpdateField('designTemplate', template as DesignTemplate);
      
      // Reset the changing state after a brief delay
      setTimeout(() => {
        setIsDesignChanging(false);
      }, 500);
    } catch (error) {
      console.error('Error changing design template:', error);
      toast.error('Failed to change design template');
      setIsDesignChanging(false);
    }
  }, [handleUpdateField]);

  // Reset booking flow function
  const resetBookingFlow = () => {
    setSelectedLocationId(defaultLocation || initialLocationIdProp || null);
    setSelectedServiceId(null);
    setSelectedStaffId("ANY_AVAILABLE");
    setSelectedDate(new Date());
    setSelectedTimeSlot(null);
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

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      // Reset any pending state changes
      setIsDesignChanging(false);
      isEditingRef.current = false;
    };
  }, []);

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

  // Show error message if there's an error and we're not in a step that handles its own error display
  if (error && currentStep !== 'dynamicSelection' && currentStep !== 'completeSelection') {
    return (
      <div className="text-center py-8">
        <div className="text-red-600 mb-4">{error}</div>
        <Button onClick={() => setError(null)}>Try Again</Button>
      </div>
    );
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
          <ProgressIndicator currentStep={currentStep} steps={visibleSteps} onStepClick={handleStepClick} />
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
          <ProgressIndicator currentStep={currentStep} steps={visibleSteps} onStepClick={handleStepClick} />
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
          <ProgressIndicator currentStep={currentStep} steps={visibleSteps} onStepClick={handleStepClick} />
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
          
          <ProgressIndicator currentStep={currentStep} steps={visibleSteps} onStepClick={handleStepClick} />
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
          
          <ProgressIndicator currentStep={currentStep} steps={visibleSteps} onStepClick={handleStepClick} />
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
          
          <ProgressIndicator currentStep={currentStep} steps={visibleSteps} onStepClick={handleStepClick} />
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
          
          <ProgressIndicator currentStep={currentStep} steps={visibleSteps} onStepClick={handleStepClick} />
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
          
          <ProgressIndicator currentStep={currentStep} steps={visibleSteps} onStepClick={handleStepClick} />
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
          
          <ProgressIndicator currentStep={currentStep} steps={visibleSteps} onStepClick={handleStepClick} />
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

    // Create step renderer map dynamically
    const stepRendererMap = new Map<BookingStep, () => React.ReactNode>([
      ['selectionMethod', renderSelectionMethod],
      ['dynamicSelection', renderDynamicSelection],
      ['completeSelection', renderCompleteSelection],
      ['dateTimeSelection', renderDateTimeSelection],
      ['detailsForm', renderDetailsForm],
      ['confirmation', renderConfirmation]
    ]);

    // Use dynamic step rendering instead of hardcoded switch
    const renderFunction = stepRendererMap.get(currentStep);
    if (renderFunction) {
      return renderFunction();
    }

    // Fallback for unknown steps
    console.warn(`Unknown step: ${currentStep}`);
    return enableMultiStepBooking ? renderSelectionMethod() : renderDynamicSelection();
  };

  // Selection Method Step
  const renderSelectionMethod = () => {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h3 className="text-2xl font-semibold mb-2">{selectionMethodTexts.title}</h3>
          <p className="text-gray-600">{selectionMethodTexts.subtitle}</p>
        </div>

        <div className="grid gap-4 max-w-2xl mx-auto">
          {enabledSelectionMethods.includes('service') && (
            <div
              onClick={() => setSelectedBookingMethod('service')}
              className={`p-6 border-2 rounded-xl cursor-pointer transition-all hover:shadow-md ${
                selectedBookingMethod === 'service'
                  ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-lg ${
                  selectedBookingMethod === 'service' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600'
                }`}>
                  <Briefcase className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <h4 className="text-lg font-semibold">{selectionMethodTexts.serviceOption.title}</h4>
                  <p className="text-gray-600">{selectionMethodTexts.serviceOption.description}</p>
                </div>
                {selectedBookingMethod === 'service' && (
                  <Check className="w-6 h-6 text-primary" />
                )}
              </div>
            </div>
          )}

          {enabledSelectionMethods.includes('location') && (
            <div
              onClick={() => setSelectedBookingMethod('location')}
              className={`p-6 border-2 rounded-xl cursor-pointer transition-all hover:shadow-md ${
                selectedBookingMethod === 'location'
                  ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-lg ${
                  selectedBookingMethod === 'location' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600'
                }`}>
                  <MapPin className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <h4 className="text-lg font-semibold">{selectionMethodTexts.locationOption.title}</h4>
                  <p className="text-gray-600">{selectionMethodTexts.locationOption.description}</p>
                </div>
                {selectedBookingMethod === 'location' && (
                  <Check className="w-6 h-6 text-primary" />
                )}
              </div>
            </div>
          )}

          {enabledSelectionMethods.includes('specialist') && (
            <div
              onClick={() => setSelectedBookingMethod('specialist')}
              className={`p-6 border-2 rounded-xl cursor-pointer transition-all hover:shadow-md ${
                selectedBookingMethod === 'specialist'
                  ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-lg ${
                  selectedBookingMethod === 'specialist' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600'
                }`}>
                  <User className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <h4 className="text-lg font-semibold">{selectionMethodTexts.specialistOption.title}</h4>
                  <p className="text-gray-600">{selectionMethodTexts.specialistOption.description}</p>
                </div>
                {selectedBookingMethod === 'specialist' && (
                  <Check className="w-6 h-6 text-primary" />
                )}
              </div>
            </div>
          )}
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between pt-4">
          <button
            onClick={goToPreviousStep}
            disabled={!getPreviousStep(currentStep)}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {buttonTexts.back}
          </button>
          <button
            onClick={goToNextStep}
            disabled={!selectedBookingMethod || !getNextStep(currentStep)}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {buttonTexts.next}
          </button>
        </div>
      </div>
    );
  };

  // Dynamic Selection Step (Step 2) - Shows content based on selected method
  const renderDynamicSelection = () => {
    const filteredItems = (): (Service | Location | StaffForService)[] => {
      const term = searchTerm.toLowerCase();
      
      switch (selectedBookingMethod) {
        case 'service':
          return displayServices.filter(service => 
            service.name.toLowerCase().includes(term) ||
            service.description?.toLowerCase().includes(term) ||
            service.serviceCategory?.name.toLowerCase().includes(term)
          );
        case 'location':
          return locations.filter(location =>
            location.name.toLowerCase().includes(term) ||
            location.address?.toLowerCase().includes(term)
          );
        case 'specialist':
          return availableStaffForService.filter(staffMember =>
            `${staffMember.user?.firstName} ${staffMember.user?.lastName}`.toLowerCase().includes(term) ||
            staffMember.bio?.toLowerCase().includes(term) ||
            staffMember.specializations?.some(spec => spec.toLowerCase().includes(term))
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
            {selectedBookingMethod === 'service' && 'Choose a Service'}
            {selectedBookingMethod === 'location' && 'Choose a Location'}
            {selectedBookingMethod === 'specialist' && 'Choose a Specialist'}
          </h3>
          <p className="text-gray-600">
            {selectedBookingMethod === 'service' && 'Select the service you need'}
            {selectedBookingMethod === 'location' && 'Pick your preferred location'}
            {selectedBookingMethod === 'specialist' && 'Choose your preferred specialist'}
          </p>
        </div>

        {/* Search bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder={`Search ${selectedBookingMethod === 'service' ? 'services' : selectedBookingMethod === 'location' ? 'locations' : 'specialists'}...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Items grid */}
        <div className="grid gap-4 max-h-96 overflow-y-auto">
          {items.map((item) => {
            const isSelected = 
              (selectedBookingMethod === 'service' && step2Selections.serviceId === item.id) ||
              (selectedBookingMethod === 'location' && step2Selections.locationId === item.id) ||
              (selectedBookingMethod === 'specialist' && step2Selections.staffId === item.id);

            return (
              <div
                key={item.id}
                className={`cursor-pointer transition-all hover:shadow-md p-4 border rounded-lg ${
                  isSelected ? 'ring-2 ring-blue-500 bg-blue-50 border-blue-500' : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => {
                  if (selectedBookingMethod === 'service') {
                    setStep2Selections(prev => ({ ...prev, serviceId: item.id }));
                    handleServiceSelect(item.id);
                  } else if (selectedBookingMethod === 'location') {
                    setStep2Selections(prev => ({ ...prev, locationId: item.id }));
                    handleLocationSelect(item.id);
                  } else if (selectedBookingMethod === 'specialist') {
                    setStep2Selections(prev => ({ ...prev, staffId: item.id }));
                    handleStaffSelect(item.id);
                  }
                }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {selectedBookingMethod === 'service' && isService(item) && (
                      <>
                        <h4 className="font-semibold text-lg">{item.name}</h4>
                        <p className="text-sm text-gray-600 mb-2">{item.description}</p>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {item.durationMinutes} min
                          </span>
                          {item.prices?.length > 0 && (
                            <span className="font-medium text-blue-600">
                              ${item.prices[0].amount}
                            </span>
                          )}
                        </div>
                        {item.serviceCategory && (
                          <span className="inline-block mt-2 px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded">
                            {item.serviceCategory.name}
                          </span>
                        )}
                      </>
                    )}
                    
                    {selectedBookingMethod === 'location' && isLocation(item) && (
                      <>
                        <h4 className="font-semibold text-lg">{item.name}</h4>
                        {item.address && (
                          <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                            <MapPin className="w-4 h-4" />
                            {item.address}
                          </p>
                        )}
                        {item.phone && (
                          <p className="text-sm text-gray-500 mt-1">{item.phone}</p>
                        )}
                      </>
                    )}
                    
                    {selectedBookingMethod === 'specialist' && isStaffForService(item) && (
                      <>
                        <h4 className="font-semibold text-lg">
                          {item.user?.firstName} {item.user?.lastName}
                        </h4>
                        {item.bio && (
                          <p className="text-sm text-gray-600 mt-1">{item.bio}</p>
                        )}
                        {item.specializations && item.specializations.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {item.specializations.map((spec: string, index: number) => (
                              <span key={index} className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded border">
                                {spec}
                              </span>
                            ))}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                  
                  {isSelected && (
                    <Check className="w-5 h-5 text-blue-500 flex-shrink-0 ml-2" />
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {items.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <p>No {selectedBookingMethod === 'service' ? 'services' : selectedBookingMethod === 'location' ? 'locations' : 'specialists'} found</p>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between pt-4">
          <button
            onClick={goToPreviousStep}
            disabled={!getPreviousStep(currentStep)}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {buttonTexts.back}
          </button>
          <button
            onClick={goToNextStep}
            disabled={!step2Selections.serviceId && !step2Selections.locationId && !step2Selections.staffId}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {buttonTexts.next}
          </button>
        </div>
      </div>
    );
  };

  // Complete Selection Step (Step 3) - Fill in missing pieces
  const renderCompleteSelection = () => {
    // Get what was selected in step 2
    const selectedService = step2Selections.serviceId ? 
      displayServices.find(s => s.id === step2Selections.serviceId) : null;
    const selectedLocation = step2Selections.locationId ? 
      locations.find(l => l.id === step2Selections.locationId) : null;
    const selectedStaff = step2Selections.staffId ? 
      availableStaffForService.find(s => s.id === step2Selections.staffId) : null;

    // Get filtered options based on what was already selected
    const availableServices = getAvailableServices(step2Selections.locationId, step2Selections.staffId || undefined);
    const availableLocations = getAvailableLocations(step2Selections.serviceId, step2Selections.staffId || undefined);
    const availableStaff = getAvailableStaff(step2Selections.serviceId, step2Selections.locationId);

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
              <span>{selectedStaff.user?.firstName} {selectedStaff.user?.lastName}</span>
            </div>
          )}
        </div>

        {/* Complete missing selections */}
        <div className="space-y-6">
          {/* Service selection if not selected */}
          {!selectedService && (
            <div>
              <h4 className="font-medium mb-3">Choose a Service</h4>
              <div className="grid gap-3">
                {availableServices.map((service) => (
                  <div
                    key={service.id}
                    onClick={() => {
                      setStep3Selections(prev => ({ ...prev, finalServiceId: service.id }));
                      handleServiceSelect(service.id);
                    }}
                    className={`p-4 border rounded-lg cursor-pointer transition-all ${
                      step3Selections.finalServiceId === service.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h5 className="font-medium">{service.name}</h5>
                        <p className="text-sm text-gray-600">{service.description}</p>
                        <span className="text-sm text-gray-500">{service.durationMinutes} min</span>
                      </div>
                      {step3Selections.finalServiceId === service.id && (
                        <Check className="w-5 h-5 text-blue-500" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Location selection if not selected */}
          {!selectedLocation && (
            <div>
              <h4 className="font-medium mb-3">Choose a Location</h4>
              <div className="grid gap-3">
                {availableLocations.map((location) => (
                  <div
                    key={location.id}
                    onClick={() => {
                      setStep3Selections(prev => ({ ...prev, finalLocationId: location.id }));
                      handleLocationSelect(location.id);
                    }}
                    className={`p-4 border rounded-lg cursor-pointer transition-all ${
                      step3Selections.finalLocationId === location.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h5 className="font-medium">{location.name}</h5>
                        {location.address && (
                          <p className="text-sm text-gray-600">{location.address}</p>
                        )}
                      </div>
                      {step3Selections.finalLocationId === location.id && (
                        <Check className="w-5 h-5 text-blue-500" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Staff selection if not selected and showStaffSelector is true */}
          {!selectedStaff && showStaffSelector && (
            <div>
              <h4 className="font-medium mb-3">Choose Staff (Optional)</h4>
              <div className="grid gap-3">
                <div
                  onClick={() => {
                    setStep3Selections(prev => ({ ...prev, finalStaffId: "ANY_AVAILABLE" }));
                    handleStaffSelect("ANY_AVAILABLE");
                  }}
                  className={`p-4 border rounded-lg cursor-pointer transition-all ${
                    step3Selections.finalStaffId === "ANY_AVAILABLE"
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h5 className="font-medium">Any Available Staff</h5>
                      <p className="text-sm text-gray-600">We&apos;ll assign the best available staff member</p>
                    </div>
                    {step3Selections.finalStaffId === "ANY_AVAILABLE" && (
                      <Check className="w-5 h-5 text-blue-500" />
                    )}
                  </div>
                </div>
                {availableStaff.map((staff) => (
                  <div
                    key={staff.id}
                    onClick={() => {
                      setStep3Selections(prev => ({ ...prev, finalStaffId: staff.id }));
                      handleStaffSelect(staff.id);
                    }}
                    className={`p-4 border rounded-lg cursor-pointer transition-all ${
                      step3Selections.finalStaffId === staff.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h5 className="font-medium">
                          {staff.user?.firstName} {staff.user?.lastName}
                        </h5>
                        {staff.bio && (
                          <p className="text-sm text-gray-600">{staff.bio}</p>
                        )}
                      </div>
                      {step3Selections.finalStaffId === staff.id && (
                        <Check className="w-5 h-5 text-blue-500" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between pt-4">
          <button
            onClick={goToPreviousStep}
            disabled={!getPreviousStep(currentStep)}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {buttonTexts.back}
          </button>
          <button
            onClick={goToNextStep}
            disabled={!getCurrentSelections().serviceId || !getCurrentSelections().locationId}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {buttonTexts.next}
          </button>
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
        
        {/* Navigation Buttons */}
        <div className="flex justify-between pt-4">
          <button
            onClick={goToPreviousStep}
            disabled={!getPreviousStep(currentStep)}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {buttonTexts.back}
          </button>
          <button
            onClick={goToNextStep}
            disabled={!selectedTimeSlot || !getNextStep(currentStep)}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {buttonTexts.next}
          </button>
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
            onClick={goToPreviousStep}
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
    // Estado local para los inputs
    const [localTitle, setLocalTitle] = useState(title);
    const [localSubtitle, setLocalSubtitle] = useState(subtitle);
    const [localDescription, setLocalDescription] = useState(description);
    
    // Manejador de submit para los inputs
    const handleInputSubmit = useCallback(() => {
      // Solo actualizar si los valores han cambiado
      if (localTitle !== title) {
        setTitle(localTitle);
        handleUpdateField('title', localTitle);
      }
      
      if (localSubtitle !== subtitle) {
        setSubtitle(localSubtitle);
        handleUpdateField('subtitle', localSubtitle);
      }
      
      if (localDescription !== description) {
        setDescription(localDescription);
        handleUpdateField('description', localDescription);
      }
    }, [localTitle, localSubtitle, localDescription, title, subtitle, description]);

    // Actualizar estado local cuando cambian las props
    useEffect(() => {
      setLocalTitle(title);
      setLocalSubtitle(subtitle);
      setLocalDescription(description);
    }, [title, subtitle, description]);
    
    return (
      <div className="space-y-6">
        {/* Text Configuration Section */}
        <div className="space-y-4">
          <div className="flex items-start space-x-2">
            <FormInput className="h-5 w-5 mt-1 text-muted-foreground" />
            <div className="flex-1">
              <div className="isolate" onClick={(e) => e.stopPropagation()}>
                <label className="block text-sm font-medium mb-2 text-foreground">
                  Section Title
                </label>
                <input
                  type="text"
                  value={localTitle}
                  onChange={(e) => setLocalTitle(e.target.value)}
                  onBlur={handleInputSubmit}
                  placeholder="Book Your Appointment"
                  className="w-full px-3 py-2 bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-input placeholder:text-muted-foreground text-foreground font-medium text-xl"
                />
              </div>
            </div>
          </div>
          
          <div className="flex items-start space-x-2">
            <FormInput className="h-5 w-5 mt-1 text-muted-foreground" />
            <div className="flex-1">
              <div className="isolate" onClick={(e) => e.stopPropagation()}>
                <label className="block text-sm font-medium mb-2 text-foreground">
                  Section Subtitle
                </label>
                <input
                  type="text"
                  value={localSubtitle}
                  onChange={(e) => setLocalSubtitle(e.target.value)}
                  onBlur={handleInputSubmit}
                  placeholder="Choose your preferred service and time"
                  className="w-full px-3 py-2 bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-input placeholder:text-muted-foreground text-foreground"
                />
              </div>
            </div>
          </div>
          
          <div className="flex items-start space-x-2">
            <FormInput className="h-5 w-5 mt-1 text-muted-foreground" />
            <div className="flex-1">
              <div className="isolate" onClick={(e) => e.stopPropagation()}>
                <label className="block text-sm font-medium mb-2 text-foreground">
                  Section Description
                </label>
                <textarea
                  value={localDescription}
                  onChange={(e) => setLocalDescription(e.target.value)}
                  onBlur={handleInputSubmit}
                  placeholder="Select from our available services and book your appointment in just a few simple steps."
                  className="w-full px-3 py-2 bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-input placeholder:text-muted-foreground text-foreground text-muted-foreground"
                  rows={3}
                />
              </div>
            </div>
          </div>
          
          {/* Step Titles Configuration */}
          <div className="border-t pt-4">
            <h3 className="text-sm font-medium mb-3 flex items-center">
              <LayoutPanelTop className="h-4 w-4 mr-2 text-muted-foreground" />
              Step Titles
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-sm text-gray-700 mb-1">Selection Method Step</label>
                <input
                  type="text"
                  value={stepTitles.selectionMethod}
                  onChange={(e) => handleUpdateField('stepTitles', { ...stepTitles, selectionMethod: e.target.value })}
                  className="w-full p-2 text-sm border border-gray-300 rounded-md"
                  placeholder="Choose Method"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">Dynamic Selection Step</label>
                <input
                  type="text"
                  value={stepTitles.dynamicSelection}
                  onChange={(e) => handleUpdateField('stepTitles', { ...stepTitles, dynamicSelection: e.target.value })}
                  className="w-full p-2 text-sm border border-gray-300 rounded-md"
                  placeholder="Make Selection"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">Complete Selection Step</label>
                <input
                  type="text"
                  value={stepTitles.completeSelection}
                  onChange={(e) => handleUpdateField('stepTitles', { ...stepTitles, completeSelection: e.target.value })}
                  className="w-full p-2 text-sm border border-gray-300 rounded-md"
                  placeholder="Complete Selection"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">Date & Time Step</label>
                <input
                  type="text"
                  value={stepTitles.dateTimeSelection}
                  onChange={(e) => handleUpdateField('stepTitles', { ...stepTitles, dateTimeSelection: e.target.value })}
                  className="w-full p-2 text-sm border border-gray-300 rounded-md"
                  placeholder="Pick Date & Time"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">Details Step</label>
                <input
                  type="text"
                  value={stepTitles.detailsForm}
                  onChange={(e) => handleUpdateField('stepTitles', { ...stepTitles, detailsForm: e.target.value })}
                  className="w-full p-2 text-sm border border-gray-300 rounded-md"
                  placeholder="Your Details"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">Confirmation Step</label>
                <input
                  type="text"
                  value={stepTitles.confirmation}
                  onChange={(e) => handleUpdateField('stepTitles', { ...stepTitles, confirmation: e.target.value })}
                  className="w-full p-2 text-sm border border-gray-300 rounded-md"
                  placeholder="Confirm Booking"
                />
              </div>
            </div>
          </div>
          
          {/* Step Order Configuration */}
          <div className="border-t pt-4">
            <h3 className="text-sm font-medium mb-3 flex items-center">
              <LayoutPanelTop className="h-4 w-4 mr-2 text-muted-foreground" />
              Step Order Configuration
            </h3>
            <div className="space-y-2">
              {stepOrder.map((stepId, index) => {
                const stepDef = stepConfigurations.find(def => def.id === stepId);
                const isEnabled = stepDef?.condition() !== false;
                return (
                  <div key={stepId} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                        isEnabled ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'
                      }`}>
                        {index + 1}
                      </div>
                      <span className={`font-medium ${isEnabled ? 'text-gray-900' : 'text-gray-400'}`}>
                        {stepDef?.label || stepId}
                      </span>
                      {stepDef?.required && (
                        <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded">Required</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          const newOrder = [...stepOrder];
                          if (index > 0) {
                            [newOrder[index], newOrder[index - 1]] = [newOrder[index - 1], newOrder[index]];
                            setStepOrder(newOrder);
                            handleUpdateField('stepOrder', newOrder);
                          }
                        }}
                        disabled={index === 0}
                        className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                      >
                        ↑
                      </button>
                      <button
                        onClick={() => {
                          const newOrder = [...stepOrder];
                          if (index < stepOrder.length - 1) {
                            [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
                            setStepOrder(newOrder);
                            handleUpdateField('stepOrder', newOrder);
                          }
                        }}
                        disabled={index === stepOrder.length - 1}
                        className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                      >
                        ↓
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          
          {/* Button Texts Configuration */}
          <div className="border-t pt-4">
            <h3 className="text-sm font-medium mb-3 flex items-center">
              <FileText className="h-4 w-4 mr-2 text-muted-foreground" />
              Button Texts
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div>
                <label className="block text-sm text-gray-700 mb-1">Next Button</label>
                <input
                  type="text"
                  value={buttonTexts.next}
                  onChange={(e) => handleUpdateField('buttonTexts', { ...buttonTexts, next: e.target.value })}
                  className="w-full p-2 text-sm border border-gray-300 rounded-md"
                  placeholder="Next"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">Back Button</label>
                <input
                  type="text"
                  value={buttonTexts.back}
                  onChange={(e) => handleUpdateField('buttonTexts', { ...buttonTexts, back: e.target.value })}
                  className="w-full p-2 text-sm border border-gray-300 rounded-md"
                  placeholder="Back"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">Submit Button</label>
                <input
                  type="text"
                  value={buttonTexts.submit}
                  onChange={(e) => handleUpdateField('buttonTexts', { ...buttonTexts, submit: e.target.value })}
                  className="w-full p-2 text-sm border border-gray-300 rounded-md"
                  placeholder="Submit"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">Book Now Button</label>
                <input
                  type="text"
                  value={buttonTexts.bookNow}
                  onChange={(e) => handleUpdateField('buttonTexts', { ...buttonTexts, bookNow: e.target.value })}
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
                onChange={(e) => handleUpdateField('showLocationSelector', e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
            </div>
            
            <div className="flex items-center justify-between">
              <label className="text-sm text-gray-700">Show Service Categories</label>
              <input
                type="checkbox"
                checked={showServiceCategories}
                onChange={(e) => handleUpdateField('showServiceCategories', e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
            </div>
            
            <div className="flex items-center justify-between">
              <label className="text-sm text-gray-700">Show Staff Selector</label>
              <input
                type="checkbox"
                checked={showStaffSelector}
                onChange={(e) => handleUpdateField('showStaffSelector', e.target.checked)}
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
        <h3 className="text-sm font-medium mb-2 flex items-center">
          <Palette className="h-4 w-4 mr-2 text-muted-foreground" />
          Calendar Design Style
        </h3>
        
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
    
    // Update multi-step booking state based on current step
    if (currentStep === 'dynamicSelection') {
      // Step 2: Initial selection
      setStep2Selections(prev => ({ ...prev, locationId }));
    } else {
      // Step 3: Final selection
      setStep3Selections(prev => ({ ...prev, finalLocationId: locationId }));
    }
  };

  const handleServiceSelect = (serviceId: string) => {
    setSelectedServiceId(serviceId);
    
    // Update multi-step booking state based on current step
    if (currentStep === 'dynamicSelection') {
      // Step 2: Initial selection
      setStep2Selections(prev => ({ ...prev, serviceId }));
    } else {
      // Step 3: Final selection
      setStep3Selections(prev => ({ ...prev, finalServiceId: serviceId }));
    }
  };

  const handleStaffSelect = (staffId: string | null) => {
    setSelectedStaffId(staffId);
    
    // Update multi-step booking state based on current step
    if (currentStep === 'dynamicSelection') {
      // Step 2: Initial selection
      setStep2Selections(prev => ({ ...prev, staffId }));
    } else {
      // Step 3: Final selection
      setStep3Selections(prev => ({ ...prev, finalStaffId: staffId }));
    }
  };

  // Handler for selection method (step 1)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleSelectionMethodSelect = (method: SelectionMethod) => {
    setSelectedBookingMethod(method);
  };

  const handleDateSelect = (date?: Date) => {
    setSelectedDate(date);
    // Load available time slots for the selected date
  };

  const handleTimeSlotSelect = (slot: AvailableTimeSlot) => {
    setSelectedTimeSlot(slot);
    // Remove automatic step progression - user will click Next button
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

  // Step navigation functions
  const getNextStep = (currentStep: BookingStep): BookingStep | null => {
    const currentIndex = allSteps.findIndex(step => step.id === currentStep);
    if (currentIndex === -1 || currentIndex === allSteps.length - 1) return null;
    return allSteps[currentIndex + 1].id;
  };

  const getPreviousStep = (currentStep: BookingStep): BookingStep | null => {
    const currentIndex = allSteps.findIndex(step => step.id === currentStep);
    if (currentIndex <= 0) return null;
    return allSteps[currentIndex - 1].id;
  };

  const goToNextStep = () => {
    const nextStep = getNextStep(currentStep);
    if (nextStep) {
      setCurrentStep(nextStep);
    }
  };

  const goToPreviousStep = () => {
    const previousStep = getPreviousStep(currentStep);
    if (previousStep) {
      setCurrentStep(previousStep);
    }
  };

  // Step click navigation function
  const handleStepClick = (stepId: BookingStep) => {
    // Allow navigation to any step
    setCurrentStep(stepId);
  };

  return (
    <div className={`calendar-section ${className}`}>
      {isEditing ? renderEditingInterface() : renderCalendarContent()}
    </div>
  );
}
