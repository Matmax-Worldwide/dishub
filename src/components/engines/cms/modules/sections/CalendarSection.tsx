'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Service, Location, AvailableTimeSlot, Booking } from '@/types/calendar'; 
import { Button } from '@/components/ui/button';
import { 
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
  Briefcase,
  Search,
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

const ProgressIndicator = ({ currentStep, steps, onStepClick, template }: { 
  currentStep: BookingStep, 
  steps: {id: BookingStep, label: string}[], 
  onStepClick?: (stepId: BookingStep) => void,
  template?: DesignTemplate
}) => {
  const currentIndex = steps.findIndex(step => step.id === currentStep);
  
  // Get template-specific colors
  const getTemplateColors = (template: DesignTemplate = 'beauty-salon') => {
    switch (template) {
      case 'beauty-salon':
        return {
          completed: 'bg-pink-500 text-white border-pink-500',
          current: 'bg-white text-pink-600 border-pink-500 ring-2 ring-pink-200',
          upcoming: 'bg-pink-100 text-pink-600 border-pink-300',
          line: 'bg-pink-200',
          completedLine: 'bg-pink-500'
        };
      case 'medical':
        return {
          completed: 'bg-blue-600 text-white border-blue-600',
          current: 'bg-white text-blue-700 border-blue-600 ring-2 ring-blue-200',
          upcoming: 'bg-blue-100 text-blue-600 border-blue-300',
          line: 'bg-blue-200',
          completedLine: 'bg-blue-600'
        };
      case 'fitness':
        return {
          completed: 'bg-orange-500 text-white border-orange-500',
          current: 'bg-white text-orange-700 border-orange-500 ring-2 ring-orange-200',
          upcoming: 'bg-orange-100 text-orange-600 border-orange-300',
          line: 'bg-orange-200',
          completedLine: 'bg-orange-500'
        };
      case 'restaurant':
        return {
          completed: 'bg-amber-600 text-white border-amber-600',
          current: 'bg-white text-amber-700 border-amber-600 ring-2 ring-amber-200',
          upcoming: 'bg-amber-100 text-amber-600 border-amber-300',
          line: 'bg-amber-200',
          completedLine: 'bg-amber-600'
        };
      case 'corporate':
        return {
          completed: 'bg-gray-700 text-white border-gray-700',
          current: 'bg-white text-gray-800 border-gray-700 ring-2 ring-gray-300',
          upcoming: 'bg-gray-100 text-gray-700 border-gray-400',
          line: 'bg-gray-300',
          completedLine: 'bg-gray-700'
        };
      case 'spa':
        return {
          completed: 'bg-green-600 text-white border-green-600',
          current: 'bg-white text-green-700 border-green-600 ring-2 ring-green-200',
          upcoming: 'bg-green-100 text-green-600 border-green-300',
          line: 'bg-green-200',
          completedLine: 'bg-green-600'
        };
      case 'automotive':
        return {
          completed: 'bg-slate-700 text-white border-slate-700',
          current: 'bg-white text-slate-800 border-slate-700 ring-2 ring-slate-300',
          upcoming: 'bg-slate-100 text-slate-700 border-slate-400',
          line: 'bg-slate-300',
          completedLine: 'bg-slate-700'
        };
      case 'education':
        return {
          completed: 'bg-indigo-600 text-white border-indigo-600',
          current: 'bg-white text-indigo-700 border-indigo-600 ring-2 ring-indigo-200',
          upcoming: 'bg-indigo-100 text-indigo-600 border-indigo-300',
          line: 'bg-indigo-200',
          completedLine: 'bg-indigo-600'
        };
      case 'modern':
        return {
          completed: 'bg-black text-white border-black',
          current: 'bg-white text-gray-900 border-black ring-2 ring-gray-300',
          upcoming: 'bg-gray-100 text-gray-700 border-gray-400',
          line: 'bg-gray-300',
          completedLine: 'bg-black'
        };
      default:
        return {
          completed: 'bg-pink-500 text-white border-pink-500',
          current: 'bg-white text-pink-600 border-pink-500 ring-2 ring-pink-200',
          upcoming: 'bg-pink-100 text-pink-600 border-pink-300',
          line: 'bg-pink-200',
          completedLine: 'bg-pink-500'
        };
    }
  };

  const colors = getTemplateColors(template);

  return (
    <div className="flex items-center justify-between w-full max-w-2xl mx-auto">
      {steps.map((step, index) => {
        const isCompleted = index < currentIndex;
        const isCurrent = index === currentIndex;
        const isClickable = onStepClick && (isCompleted || isCurrent);
        
        let stepClasses = `
          w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm font-medium
          transition-all duration-200 relative z-10
        `;
        
        if (isCompleted) {
          stepClasses += ` ${colors.completed}`;
        } else if (isCurrent) {
          stepClasses += ` ${colors.current}`;
        } else {
          stepClasses += ` ${colors.upcoming}`;
        }
        
        if (isClickable) {
          stepClasses += ' cursor-pointer hover:scale-105';
        }

        return (
          <div key={step.id} className="flex items-center flex-1">
            <div className="flex flex-col items-center">
              <button
                onClick={() => isClickable && onStepClick?.(step.id)}
                disabled={!isClickable}
                className={stepClasses}
              >
                {isCompleted ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <span>{index + 1}</span>
                )}
              </button>
              <span className={`text-xs mt-1 text-center max-w-16 leading-tight ${
                isCurrent 
                  ? template === 'modern' || template === 'corporate' || template === 'automotive'
                    ? 'text-gray-800 font-medium'
                    : template === 'medical'
                    ? 'text-blue-700 font-medium'
                    : template === 'fitness'
                    ? 'text-orange-700 font-medium'
                    : template === 'restaurant'
                    ? 'text-amber-700 font-medium'
                    : template === 'spa'
                    ? 'text-green-700 font-medium'
                    : template === 'education'
                    ? 'text-indigo-700 font-medium'
                    : 'text-pink-700 font-medium'
                  : 'text-white/90'
              }`}>
                {step.label}
              </span>
            </div>
            
            {index < steps.length - 1 && (
              <div className="flex-1 h-0.5 mx-2 relative">
                <div className={`absolute inset-0 ${colors.line}`} />
                {isCompleted && (
                  <div className={`absolute inset-0 ${colors.completedLine}`} />
                )}
              </div>
            )}
          </div>
        );
      })}
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
  skipLocationSelection: initialSkipLocationSelection = false,
  skipStaffSelection: initialSkipStaffSelection = false,
  skipServiceSelection: initialSkipServiceSelection = false,
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
  
  // State variables for configuration
  const [showLocationSelector, setShowLocationSelector] = useState(initialShowLocationSelector);
  const [showServiceCategories, setShowServiceCategories] = useState(initialShowServiceCategories);
  const [defaultLocation, setDefaultLocation] = useState(initialDefaultLocation);
  const [showStaffSelector, setShowStaffSelector] = useState(initialShowStaffSelector);
  const [enableMultiStepBooking] = useState(initialEnableMultiStepBooking);
  const [stepOrder] = useState<BookingStep[]>(initialStepOrder);
  const [requiredSteps] = useState<BookingStep[]>(initialRequiredSteps);
  const [enabledSelectionMethods] = useState<SelectionMethod[]>(initialEnabledSelectionMethods);
  const [title, setTitle] = useState(initialTitle);
  const [subtitle, setSubtitle] = useState(initialSubtitle);
  const [description, setDescription] = useState(initialDescription);
  const [stepTitles, setStepTitles] = useState(initialStepTitles);
  const [buttonTexts, setButtonTexts] = useState(initialButtonTexts);
  const [placeholderTexts, setPlaceholderTexts] = useState(initialPlaceholderTexts);
  const [selectionMethodTexts] = useState(initialSelectionMethodTexts);
  const [skipLocationSelection] = useState(initialSkipLocationSelection);
  const [skipStaffSelection] = useState(initialSkipStaffSelection);
  const [skipServiceSelection] = useState(initialSkipServiceSelection);

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
    }
  }, [initialTitle, initialSubtitle, initialDescription, initialShowLocationSelector, initialShowServiceCategories, initialDefaultLocation, initialShowStaffSelector, initialStepTitles, initialButtonTexts, initialPlaceholderTexts]);
  
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

  // Load all staff profiles when "specialist" is selected as booking method
  useEffect(() => {
    async function loadAllStaffProfiles() {
      if (selectedBookingMethod === 'specialist') {
        try {
          console.log('Loading all staff profiles for specialist selection');
          const staffData = await graphqlClient.staffProfiles();
          console.log('All staff profiles loaded:', staffData);
          
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
            toast.success(`${transformedStaff.length} specialist${transformedStaff.length !== 1 ? 's' : ''} available`);
          } else {
            console.warn('No staff profiles found');
          }
        } catch (error) {
          console.error('Error loading staff profiles:', error);
          const errorMessage = error instanceof Error ? error.message : 'Failed to load specialists. Please try again.';
          setError(errorMessage);
          setAvailableStaffForService([]);
          toast.error('Failed to load specialists');
        }
      }
    }

    loadAllStaffProfiles();
  }, [selectedBookingMethod]);

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
      description: 'Elegant design for beauty and wellness services',
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
      description: 'Professional design for healthcare services',
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
      description: 'Energetic design for fitness and sports',
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
      description: 'Warm design for dining and hospitality',
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
      description: 'Professional design for business services',
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
      description: 'Calming design for wellness and relaxation',
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
      description: 'Industrial design for automotive services',
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
      description: 'Academic design for educational services',
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
      description: 'Minimalist design for contemporary services',
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
    if (isEditing) {
      return renderEditingInterface();
    }

    return (
      <div className="w-full max-w-4xl mx-auto bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
        <div className="bg-gradient-to-r from-pink-500 to-purple-600 text-white p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-white/20 rounded">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-semibold">{title}</h2>
              <p className="text-pink-100">{subtitle}</p>
            </div>
          </div>
          
          <ProgressIndicator currentStep={currentStep} steps={visibleSteps} onStepClick={handleStepClick} template={localDesignTemplate} />
        </div>

        <div className="p-6">
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
      <div className="w-full max-w-4xl mx-auto bg-white rounded-lg shadow-lg border border-blue-100 overflow-hidden">
        <div className="bg-blue-600 text-white p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-white/20 rounded">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-semibold">{title}</h2>
              <p className="text-blue-100">{subtitle}</p>
            </div>
          </div>
          
          <ProgressIndicator currentStep={currentStep} steps={visibleSteps} onStepClick={handleStepClick} template={localDesignTemplate} />
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
      <div className="w-full max-w-4xl mx-auto bg-white rounded-xl shadow-lg border border-orange-100 overflow-hidden">
        <div className="bg-gradient-to-r from-orange-500 to-red-600 text-white p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-white/20 rounded">
              <Heart className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-semibold">{title}</h2>
              <p className="text-orange-100">{subtitle}</p>
            </div>
          </div>
          
          <ProgressIndicator currentStep={currentStep} steps={visibleSteps} onStepClick={handleStepClick} template={localDesignTemplate} />
        </div>

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
      <div className="w-full max-w-4xl mx-auto bg-white rounded-lg shadow-lg border border-amber-100 overflow-hidden">
        <div className="bg-amber-600 text-white p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-white/20 rounded">
              <Star className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-semibold">{title}</h2>
              <p className="text-amber-100">{subtitle}</p>
            </div>
          </div>
          
          <ProgressIndicator currentStep={currentStep} steps={visibleSteps} onStepClick={handleStepClick} template={localDesignTemplate} />
        </div>

        <div className="p-6">
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
        <div className="bg-gray-700 text-white p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-white/20 rounded">
              <Building className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-semibold">{title}</h2>
              <p className="text-gray-300">{subtitle}</p>
            </div>
          </div>
          
          <ProgressIndicator currentStep={currentStep} steps={visibleSteps} onStepClick={handleStepClick} template={localDesignTemplate} />
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
      <div className="w-full max-w-4xl mx-auto bg-white rounded-xl shadow-lg border border-green-100 overflow-hidden">
        <div className="bg-green-600 text-white p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-white/20 rounded">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-semibold">{title}</h2>
              <p className="text-green-100">{subtitle}</p>
            </div>
          </div>
          
          <ProgressIndicator currentStep={currentStep} steps={visibleSteps} onStepClick={handleStepClick} template={localDesignTemplate} />
        </div>

        <div className="p-6">
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
      <div className="w-full max-w-4xl mx-auto bg-white rounded-lg shadow-lg border border-slate-200 overflow-hidden">
        <div className="bg-slate-700 text-white p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-white/20 rounded">
              <Settings className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-semibold">{title}</h2>
              <p className="text-slate-300">{subtitle}</p>
            </div>
          </div>
          
          <ProgressIndicator currentStep={currentStep} steps={visibleSteps} onStepClick={handleStepClick} template={localDesignTemplate} />
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
      <div className="w-full max-w-4xl mx-auto bg-white rounded-lg shadow-lg border border-indigo-100 overflow-hidden">
        <div className="bg-indigo-600 text-white p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-white/20 rounded">
              <User className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-semibold">{title}</h2>
              <p className="text-indigo-100">{subtitle}</p>
            </div>
          </div>
          
          <ProgressIndicator currentStep={currentStep} steps={visibleSteps} onStepClick={handleStepClick} template={localDesignTemplate} />
        </div>

        <div className="p-6">
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
              <h2 className="text-2xl font-semibold">{title}</h2>
              <p className="text-gray-300">{subtitle}</p>
            </div>
          </div>
          
          <ProgressIndicator currentStep={currentStep} steps={visibleSteps} onStepClick={handleStepClick} template={localDesignTemplate} />
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
            disabled={!selectedBookingMethod}
            className={`px-6 py-2 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
              localDesignTemplate === 'beauty-salon' ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white hover:from-pink-600 hover:to-purple-700' :
              localDesignTemplate === 'medical' ? 'bg-blue-600 text-white hover:bg-blue-700' :
              localDesignTemplate === 'fitness' ? 'bg-gradient-to-r from-orange-500 to-red-600 text-white hover:from-orange-600 hover:to-red-700' :
              localDesignTemplate === 'restaurant' ? 'bg-amber-600 text-white hover:bg-amber-700' :
              localDesignTemplate === 'corporate' ? 'bg-gray-700 text-white hover:bg-gray-800' :
              localDesignTemplate === 'spa' ? 'bg-green-600 text-white hover:bg-green-700' :
              localDesignTemplate === 'automotive' ? 'bg-slate-700 text-white hover:bg-slate-800' :
              localDesignTemplate === 'education' ? 'bg-indigo-600 text-white hover:bg-indigo-700' :
              'bg-black text-white hover:bg-gray-800'
            }`}
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
                          {(item as Service & { prices?: Array<{ id: string; amount: number; currencyId: string }> }).prices?.length && (item as Service & { prices?: Array<{ id: string; amount: number; currencyId: string }> }).prices!.length > 0 && (
                            <span className="font-medium text-blue-600">
                              ${(item as Service & { prices?: Array<{ id: string; amount: number; currencyId: string }> }).prices![0].amount}
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
            disabled={!selectedBookingMethod}
            className={`px-6 py-2 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
              localDesignTemplate === 'beauty-salon' ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white hover:from-pink-600 hover:to-purple-700' :
              localDesignTemplate === 'medical' ? 'bg-blue-600 text-white hover:bg-blue-700' :
              localDesignTemplate === 'fitness' ? 'bg-gradient-to-r from-orange-500 to-red-600 text-white hover:from-orange-600 hover:to-red-700' :
              localDesignTemplate === 'restaurant' ? 'bg-amber-600 text-white hover:bg-amber-700' :
              localDesignTemplate === 'corporate' ? 'bg-gray-700 text-white hover:bg-gray-800' :
              localDesignTemplate === 'spa' ? 'bg-green-600 text-white hover:bg-green-700' :
              localDesignTemplate === 'automotive' ? 'bg-slate-700 text-white hover:bg-slate-800' :
              localDesignTemplate === 'education' ? 'bg-indigo-600 text-white hover:bg-indigo-700' :
              'bg-black text-white hover:bg-gray-800'
            }`}
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
            disabled={!selectedBookingMethod}
            className={`px-6 py-2 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
              localDesignTemplate === 'beauty-salon' ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white hover:from-pink-600 hover:to-purple-700' :
              localDesignTemplate === 'medical' ? 'bg-blue-600 text-white hover:bg-blue-700' :
              localDesignTemplate === 'fitness' ? 'bg-gradient-to-r from-orange-500 to-red-600 text-white hover:from-orange-600 hover:to-red-700' :
              localDesignTemplate === 'restaurant' ? 'bg-amber-600 text-white hover:bg-amber-700' :
              localDesignTemplate === 'corporate' ? 'bg-gray-700 text-white hover:bg-gray-800' :
              localDesignTemplate === 'spa' ? 'bg-green-600 text-white hover:bg-green-700' :
              localDesignTemplate === 'automotive' ? 'bg-slate-700 text-white hover:bg-slate-800' :
              localDesignTemplate === 'education' ? 'bg-indigo-600 text-white hover:bg-indigo-700' :
              'bg-black text-white hover:bg-gray-800'
            }`}
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
            className={`px-6 py-2 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
              localDesignTemplate === 'beauty-salon' ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white hover:from-pink-600 hover:to-purple-700' :
              localDesignTemplate === 'medical' ? 'bg-blue-600 text-white hover:bg-blue-700' :
              localDesignTemplate === 'fitness' ? 'bg-gradient-to-r from-orange-500 to-red-600 text-white hover:from-orange-600 hover:to-red-700' :
              localDesignTemplate === 'restaurant' ? 'bg-amber-600 text-white hover:bg-amber-700' :
              localDesignTemplate === 'corporate' ? 'bg-gray-700 text-white hover:bg-gray-800' :
              localDesignTemplate === 'spa' ? 'bg-green-600 text-white hover:bg-green-700' :
              localDesignTemplate === 'automotive' ? 'bg-slate-700 text-white hover:bg-slate-800' :
              localDesignTemplate === 'education' ? 'bg-indigo-600 text-white hover:bg-indigo-700' :
              'bg-black text-white hover:bg-gray-800'
            }`}
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
            className={`px-6 py-2 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
              localDesignTemplate === 'beauty-salon' ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white hover:from-pink-600 hover:to-purple-700' :
              localDesignTemplate === 'medical' ? 'bg-blue-600 text-white hover:bg-blue-700' :
              localDesignTemplate === 'fitness' ? 'bg-gradient-to-r from-orange-500 to-red-600 text-white hover:from-orange-600 hover:to-red-700' :
              localDesignTemplate === 'restaurant' ? 'bg-amber-600 text-white hover:bg-amber-700' :
              localDesignTemplate === 'corporate' ? 'bg-gray-700 text-white hover:bg-gray-800' :
              localDesignTemplate === 'spa' ? 'bg-green-600 text-white hover:bg-green-700' :
              localDesignTemplate === 'automotive' ? 'bg-slate-700 text-white hover:bg-slate-800' :
              localDesignTemplate === 'education' ? 'bg-indigo-600 text-white hover:bg-indigo-700' :
              'bg-black text-white hover:bg-gray-800'
            }`}
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
      <div className="space-y-8">
        {/* Content Settings Section */}
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-1 h-6 bg-gradient-to-b from-blue-500 to-blue-600 rounded-full"></div>
            <h3 className="text-lg font-semibold text-gray-900">Content Settings</h3>
          </div>
          <div className="pl-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => {
                  const newTitle = e.target.value;
                  if (onUpdate) {
                    onUpdate({ title: newTitle });
                  }
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter title..."
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Subtitle
              </label>
              <input
                type="text"
                value={subtitle}
                onChange={(e) => {
                  const newSubtitle = e.target.value;
                  if (onUpdate) {
                    onUpdate({ subtitle: newSubtitle });
                  }
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter subtitle..."
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => {
                  const newDescription = e.target.value;
                  if (onUpdate) {
                    onUpdate({ description: newDescription });
                  }
                }}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter description..."
              />
            </div>
          </div>
        </div>

        {/* Design Template Section */}
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-1 h-6 bg-gradient-to-b from-purple-500 to-purple-600 rounded-full"></div>
            <h3 className="text-lg font-semibold text-gray-900">Design Template</h3>
          </div>
          <div className="pl-6 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(designTemplates).map(([key, template]) => (
                <button
                  key={key}
                  onClick={() => {
                    if (onUpdate) {
                      onUpdate({ designTemplate: key as DesignTemplate });
                    }
                  }}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    localDesignTemplate === key
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="text-sm font-medium">{template.name}</div>
                  <div className="text-xs text-gray-500 mt-1">{template.description}</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Booking Configuration Section */}
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-1 h-6 bg-gradient-to-b from-green-500 to-green-600 rounded-full"></div>
            <h3 className="text-lg font-semibold text-gray-900">Booking Configuration</h3>
          </div>
          <div className="pl-6 space-y-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={enableMultiStepBooking}
                onChange={(e) => {
                  if (onUpdate) {
                    onUpdate({ enableMultiStepBooking: e.target.checked });
                  }
                }}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">Enable Multi-Step Booking</span>
            </label>

            {enableMultiStepBooking && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Selection Methods
                  </label>
                  <div className="space-y-2">
                    {(['service', 'location', 'specialist'] as SelectionMethod[]).map((method) => (
                      <label key={method} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={enabledSelectionMethods.includes(method)}
                          onChange={(e) => {
                            const newMethods = e.target.checked
                              ? [...enabledSelectionMethods, method]
                              : enabledSelectionMethods.filter(m => m !== method);
                            if (onUpdate) {
                              onUpdate({ enabledSelectionMethods: newMethods });
                            }
                          }}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="ml-2 text-sm text-gray-700 capitalize">{method}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={skipLocationSelection}
                      onChange={(e) => {
                        if (onUpdate) {
                          onUpdate({ skipLocationSelection: e.target.checked });
                        }
                      }}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Skip Location Selection</span>
                  </label>

                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={skipStaffSelection}
                      onChange={(e) => {
                        if (onUpdate) {
                          onUpdate({ skipStaffSelection: e.target.checked });
                        }
                      }}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Skip Staff Selection</span>
                  </label>

                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={skipServiceSelection}
                      onChange={(e) => {
                        if (onUpdate) {
                          onUpdate({ skipServiceSelection: e.target.checked });
                        }
                      }}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Skip Service Selection</span>
                  </label>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Display Options Section */}
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-1 h-6 bg-gradient-to-b from-orange-500 to-orange-600 rounded-full"></div>
            <h3 className="text-lg font-semibold text-gray-900">Display Options</h3>
          </div>
          <div className="pl-6 space-y-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={showLocationSelector}
                onChange={(e) => {
                  if (onUpdate) {
                    onUpdate({ showLocationSelector: e.target.checked });
                  }
                }}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">Show Location Selector</span>
            </label>

            <label className="flex items-center">
              <input
                type="checkbox"
                checked={showServiceCategories}
                onChange={(e) => {
                  if (onUpdate) {
                    onUpdate({ showServiceCategories: e.target.checked });
                  }
                }}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">Show Service Categories</span>
            </label>

            <label className="flex items-center">
              <input
                type="checkbox"
                checked={showStaffSelector}
                onChange={(e) => {
                  if (onUpdate) {
                    onUpdate({ showStaffSelector: e.target.checked });
                  }
                }}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">Show Staff Selector</span>
            </label>
          </div>
        </div>
      </div>
    );
  };

  // Styles Tab Component
  const StylesTab = () => {
    const { colors, name } = currentTemplate;
    
    return (
      <div className="space-y-8">
        {/* Design Template Section */}
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-1 h-6 bg-gradient-to-b from-indigo-500 to-indigo-600 rounded-full"></div>
            <h3 className="text-lg font-semibold text-gray-900">Choose Design Template</h3>
          </div>
          <div className="pl-6 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-gray-700">Current Template</h4>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Active:</span>
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
        </div>
        
        {/* Template Preview Section */}
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-1 h-6 bg-gradient-to-b from-teal-500 to-teal-600 rounded-full"></div>
            <h3 className="text-lg font-semibold text-gray-900">Template Preview</h3>
          </div>
          <div className="pl-6 space-y-4">
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
      </div>
    );
  };

  // Preview Tab Component
  const PreviewTab = () => {
    const { name } = currentTemplate;
    
    return (
      <div className="space-y-8">
        {/* Live Preview Section */}
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-1 h-6 bg-gradient-to-b from-emerald-500 to-emerald-600 rounded-full"></div>
            <h3 className="text-lg font-semibold text-gray-900">Live Preview</h3>
          </div>
          <div className="pl-6 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-gray-700">Calendar Preview</h4>
              <div className="text-sm text-gray-500">
                Template: <span className="font-medium">{name}</span>
              </div>
            </div>
            
            {/* Live Preview Container */}
            <div className="border rounded-lg overflow-hidden bg-gray-50">
              <div className="p-4 bg-white border-b">
                <h4 className="font-medium text-gray-900 mb-1">Interactive Preview</h4>
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
                      {/* Render the actual calendar booking interface directly */}
                      {localDesignTemplate === 'beauty-salon' && (
                        <div className="w-full max-w-4xl mx-auto bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                          <div className="bg-gradient-to-r from-pink-500 to-purple-600 text-white p-6">
                            <div className="flex items-center gap-3 mb-3">
                              <div className="p-2 bg-white/20 rounded">
                                <Sparkles className="w-6 h-6" />
                              </div>
                              <div>
                                <h2 className="text-2xl font-semibold">{title}</h2>
                                <p className="text-pink-100">{subtitle}</p>
                              </div>
                            </div>
                            <ProgressIndicator currentStep="dynamicSelection" steps={visibleSteps} template={localDesignTemplate} />
                          </div>
                          <div className="p-6">
                            <div className="text-center">
                              <h3 className="text-xl font-semibold mb-2">Choose a Service</h3>
                              <p className="text-gray-600 mb-4">Select the service you need</p>
                              <div className="grid gap-4">
                                <div className="p-4 border rounded-lg border-gray-200 hover:border-gray-300 cursor-pointer">
                                  <h4 className="font-semibold">Hair Cut & Style</h4>
                                  <p className="text-sm text-gray-600">Professional haircut with styling</p>
                                  <span className="text-sm text-gray-500">60 min • $75</span>
                                </div>
                                <div className="p-4 border rounded-lg border-gray-200 hover:border-gray-300 cursor-pointer">
                                  <h4 className="font-semibold">Facial Treatment</h4>
                                  <p className="text-sm text-gray-600">Relaxing facial with skincare</p>
                                  <span className="text-sm text-gray-500">90 min • $120</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {localDesignTemplate === 'medical' && (
                        <div className="w-full max-w-4xl mx-auto bg-white rounded-lg shadow-lg border border-blue-100 overflow-hidden">
                          <div className="bg-blue-600 text-white p-6">
                            <div className="flex items-center gap-3 mb-3">
                              <div className="p-2 bg-white/20 rounded">
                                <Calendar className="w-6 h-6" />
                              </div>
                              <div>
                                <h2 className="text-2xl font-semibold">{title}</h2>
                                <p className="text-blue-100">{subtitle}</p>
                              </div>
                            </div>
                            <ProgressIndicator currentStep="dynamicSelection" steps={visibleSteps} template={localDesignTemplate} />
                          </div>
                          <div className="p-6">
                            <div className="text-center">
                              <h3 className="text-xl font-semibold mb-2">Choose a Service</h3>
                              <p className="text-gray-600 mb-4">Select your medical appointment</p>
                              <div className="grid gap-4">
                                <div className="p-4 border rounded-lg border-gray-200 hover:border-gray-300 cursor-pointer">
                                  <h4 className="font-semibold">General Consultation</h4>
                                  <p className="text-sm text-gray-600">Routine medical checkup</p>
                                  <span className="text-sm text-gray-500">30 min • $150</span>
                                </div>
                                <div className="p-4 border rounded-lg border-gray-200 hover:border-gray-300 cursor-pointer">
                                  <h4 className="font-semibold">Specialist Consultation</h4>
                                  <p className="text-sm text-gray-600">Specialized medical consultation</p>
                                  <span className="text-sm text-gray-500">45 min • $250</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {localDesignTemplate === 'fitness' && (
                        <div className="w-full max-w-4xl mx-auto bg-white rounded-xl shadow-lg border border-orange-100 overflow-hidden">
                          <div className="bg-gradient-to-r from-orange-500 to-red-600 text-white p-6">
                            <div className="flex items-center gap-3 mb-3">
                              <div className="p-2 bg-white/20 rounded">
                                <Heart className="w-6 h-6" />
                              </div>
                              <div>
                                <h2 className="text-2xl font-semibold">{title}</h2>
                                <p className="text-orange-100">{subtitle}</p>
                              </div>
                            </div>
                            <ProgressIndicator currentStep="dynamicSelection" steps={visibleSteps} template={localDesignTemplate} />
                          </div>
                          <div className="p-6">
                            <div className="text-center">
                              <h3 className="text-xl font-semibold mb-2">Choose a Service</h3>
                              <p className="text-gray-600 mb-4">Select your fitness session</p>
                              <div className="grid gap-4">
                                <div className="p-4 border rounded-lg border-gray-200 hover:border-gray-300 cursor-pointer">
                                  <h4 className="font-semibold">Personal Training</h4>
                                  <p className="text-sm text-gray-600">One-on-one fitness session</p>
                                  <span className="text-sm text-gray-500">60 min • $80</span>
                                </div>
                                <div className="p-4 border rounded-lg border-gray-200 hover:border-gray-300 cursor-pointer">
                                  <h4 className="font-semibold">Group Class</h4>
                                  <p className="text-sm text-gray-600">High-energy group workout</p>
                                  <span className="text-sm text-gray-500">45 min • $25</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {/* Default fallback for other templates */}
                      {!['beauty-salon', 'medical', 'fitness'].includes(localDesignTemplate) && (
                        <div className="w-full max-w-4xl mx-auto bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
                          <div className={`${
                            localDesignTemplate === 'restaurant' ? 'bg-amber-600' :
                            localDesignTemplate === 'corporate' ? 'bg-gray-700' :
                            localDesignTemplate === 'spa' ? 'bg-green-600' :
                            localDesignTemplate === 'automotive' ? 'bg-slate-700' :
                            localDesignTemplate === 'education' ? 'bg-indigo-600' :
                            'bg-black'
                          } text-white p-6`}>
                            <div className="flex items-center gap-3 mb-3">
                              <div className="p-2 bg-white/20 rounded">
                                <Calendar className="w-6 h-6" />
                              </div>
                              <div>
                                <h2 className="text-2xl font-semibold">{title}</h2>
                                <p className="text-gray-100">{subtitle}</p>
                              </div>
                            </div>
                            <ProgressIndicator currentStep="dynamicSelection" steps={visibleSteps} template={localDesignTemplate} />
                          </div>
                          <div className="p-6">
                            <div className="text-center">
                              <h3 className="text-xl font-semibold mb-2">Choose a Service</h3>
                              <p className="text-gray-600 mb-4">Select the service you need</p>
                              <div className="grid gap-4">
                                <div className="p-4 border rounded-lg border-gray-200 hover:border-gray-300 cursor-pointer">
                                  <h4 className="font-semibold">Service Option 1</h4>
                                  <p className="text-sm text-gray-600">Description of the service</p>
                                  <span className="text-sm text-gray-500">Duration • Price</span>
                                </div>
                                <div className="p-4 border rounded-lg border-gray-200 hover:border-gray-300 cursor-pointer">
                                  <h4 className="font-semibold">Service Option 2</h4>
                                  <p className="text-sm text-gray-600">Description of the service</p>
                                  <span className="text-sm text-gray-500">Duration • Price</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Template Information Section */}
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-1 h-6 bg-gradient-to-b from-amber-500 to-amber-600 rounded-full"></div>
            <h3 className="text-lg font-semibold text-gray-900">Template Information</h3>
          </div>
          <div className="pl-6 space-y-4">
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
            
            {/* Preview Actions */}
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
        </div>
      </div>
    );
  };

  const renderEditingInterface = () => {
    return (
      <div className="w-full bg-white/95 backdrop-blur-sm border border-gray-200/60 rounded-xl shadow-lg shadow-gray-900/5 ring-1 ring-gray-900/5">
        <Tabs defaultValue="details" className="w-full">
          <TabsList className="grid w-full grid-cols-3  to-gray-100/80 p-2 rounded-xl border border-gray-200/50 shadow-inner">
            <TabsTrigger 
              value="details" 
              className="data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:shadow-gray-900/10 data-[state=active]:ring-1 data-[state=active]:ring-gray-900/5 rounded-lg py-3 px-6 text-sm font-semibold transition-all duration-200 hover:bg-white/60 active:scale-[0.98]"
            >
              Details
            </TabsTrigger>
            <TabsTrigger 
              value="styles" 
              className="data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:shadow-gray-900/10 data-[state=active]:ring-1 data-[state=active]:ring-gray-900/5 rounded-lg py-3 px-6 text-sm font-semibold transition-all duration-200 hover:bg-white/60 active:scale-[0.98]"
            >
              Styles
            </TabsTrigger>
            <TabsTrigger 
              value="preview" 
              className="data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:shadow-gray-900/10 data-[state=active]:ring-1 data-[state=active]:ring-gray-900/5 rounded-lg py-3 px-6 text-sm font-semibold transition-all duration-200 hover:bg-white/60 active:scale-[0.98]"
            >
              Preview
            </TabsTrigger>
          </TabsList>

          {/* DETAILS TAB */}
          <TabsContent value="details" className="p-8 space-y-8 max-h-[650px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
            <DetailsTab />
          </TabsContent>

          {/* STYLES TAB */}
          <TabsContent value="styles" className="p-8 space-y-8 max-h-[650px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
            <StylesTab />
          </TabsContent>

          {/* PREVIEW TAB */}
          <TabsContent value="preview" className="p-8 space-y-8 max-h-[650px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
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
