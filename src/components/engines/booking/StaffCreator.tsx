'use client';

/**
 * StaffCreator Component
 * 
 * A multi-step modal interface for creating new staff members.
 * 
 * Features:
 * - Step 1: Select a user from available users (excludes existing staff)
 * - Step 2: Add profile information (bio, specializations)
 * - Step 3: Assign services and locations (UI ready, backend integration pending)
 * - Step 4: Set weekly schedule
 * - Step 5: Review and confirm all details
 * 
 * Usage:
 * ```tsx
 * const [isCreatorOpen, setIsCreatorOpen] = useState(false);
 * 
 * <StaffCreator
 *   isOpen={isCreatorOpen}
 *   onClose={() => setIsCreatorOpen(false)}
 *   onSuccess={(staffProfile) => {
 *     console.log('Staff created:', staffProfile);
 *     // Refresh staff list or navigate
 *   }}
 * />
 * ```
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Textarea } from '@/app/components/ui/textarea';
import { Badge } from '@/app/components/ui/badge';
import { Separator } from '@/app/components/ui/separator';
import { User, UserPlus, Calendar, MapPin, Briefcase, Check, ArrowLeft, ArrowRight, X, PlusCircle, Users, Filter, Search } from 'lucide-react';
import { toast } from 'sonner';
import graphqlClient from '@/lib/graphql-client';
import { StaffProfile, User as UserType, Service, Location, StaffScheduleInput, PrismaDayOfWeek, PrismaScheduleType } from '@/types/calendar';
import UserSearchSelect from './UserSearchSelect';
import MultiSelectGrid from './MultiSelectGrid';
import MultiStepProgress from './MultiStepProgress';
import WeeklyScheduleEditor from './WeeklyScheduleEditor';
import MultiStepServiceForm, { ServiceFormData, ServiceCategory } from './MultiStepServiceForm';
import MultiStepLocationForm, { LocationFormData } from './MultiStepLocationForm';
import MultiStepUserForm, { UserFormData, Role } from './MultiStepUserForm';
import { useI18n } from '@/hooks/useI18n';

interface UserWithRole extends Partial<UserType> {
  role?: {
    id: string;
    name: string;
    description?: string;
  } | null;
}

interface StaffCreatorProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (staffProfile: StaffProfile) => void;
}

interface StaffCreationData {
  selectedUser: UserWithRole | null;
  bio: string;
  specializations: string[];
  selectedServiceIds: string[];
  selectedLocationIds: string[];
  schedule: Partial<StaffScheduleInput>[];
}

const STEPS = [
  {
    id: 'user',
    title: 'Select User',
    description: 'Choose user to make staff'
  },
  {
    id: 'profile',
    title: 'Profile Info',
    description: 'Bio and specializations'
  },
  {
    id: 'assignments',
    title: 'Assignments',
    description: 'Services and locations'
  },
  {
    id: 'schedule',
    title: 'Schedule',
    description: 'Working hours'
  },
  {
    id: 'review',
    title: 'Review',
    description: 'Confirm details'
  }
];

export default function StaffCreator({
  isOpen,
  onClose,
  onSuccess
}: StaffCreatorProps) {
  const { t } = useI18n();
  const [currentStep, setCurrentStep] = useState('user');
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Data states
  const [availableUsers, setAvailableUsers] = useState<UserWithRole[]>([]);
  const [allUsers, setAllUsers] = useState<UserWithRole[]>([]);
  const [allServices, setAllServices] = useState<Service[]>([]);
  const [allLocations, setAllLocations] = useState<Location[]>([]);
  const [allCategories, setAllCategories] = useState<ServiceCategory[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  
  // User view and search states
  const [showAllUsers, setShowAllUsers] = useState(false);
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [filteredUsers, setFilteredUsers] = useState<UserWithRole[]>([]);
  
  // User creation form state
  const [showUserCreationForm, setShowUserCreationForm] = useState(false);
  const [userFormData, setUserFormData] = useState<UserFormData>({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    password: '',
    role: 'USER'
  });
  const [userFormStep, setUserFormStep] = useState(1);
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const totalUserFormSteps = 4;

  // Service creation form state
  const [showServiceCreationForm, setShowServiceCreationForm] = useState(false);
  const [serviceFormData, setServiceFormData] = useState<ServiceFormData>({
    name: '',
    description: '',
    durationMinutes: 60,
    serviceCategoryId: '',
    bufferTimeBeforeMinutes: 0,
    bufferTimeAfterMinutes: 0,
    preparationTimeMinutes: 0,
    cleanupTimeMinutes: 0,
    maxDailyBookingsPerService: 10,
    isActive: true,
    locationIds: []
  });
  const [serviceFormStep, setServiceFormStep] = useState(1);
  const [isCreatingService, setIsCreatingService] = useState(false);
  const totalServiceFormSteps = 4;

  // Location creation form state
  const [showLocationCreationForm, setShowLocationCreationForm] = useState(false);
  const [locationFormData, setLocationFormData] = useState<LocationFormData>({
    name: '',
    address: '',
    phone: '',
    operatingHours: {}
  });
  const [locationFormStep, setLocationFormStep] = useState(1);
  const [isCreatingLocation, setIsCreatingLocation] = useState(false);
  const totalLocationFormSteps = 4;
  
  // Form data
  const [staffData, setStaffData] = useState<StaffCreationData>({
    selectedUser: null,
    bio: '',
    specializations: [],
    selectedServiceIds: [],
    selectedLocationIds: [],
    schedule: []
  });

  // Specializations input state
  const [specializationsInput, setSpecializationsInput] = useState('');

  // Load initial data
  const loadData = useCallback(async () => {
    if (!isOpen) return;
    
    setIsLoading(true);
    try {
      const [usersData, servicesData, locationsData, staffData, rolesData, categoriesData] = await Promise.all([
        graphqlClient.users(),
        graphqlClient.services(),
        graphqlClient.locations(),
        graphqlClient.staffProfiles(),
        graphqlClient.getRoles(),
        graphqlClient.serviceCategories()
      ]);

      // Store all users
      const allUsersData = (usersData || []) as UserWithRole[];
      setAllUsers(allUsersData);

      // Filter out users who are already staff
      const existingStaffUserIds = staffData.map((staff: { userId: string }) => staff.userId);
      const availableUsersFiltered = allUsersData.filter(
        user => user.id && !existingStaffUserIds.includes(user.id)
      );

      setAvailableUsers(availableUsersFiltered);
      setAllServices(servicesData || []);
      setAllLocations(locationsData || []);
      setAllCategories(categoriesData || []);
      setRoles(rolesData || []);
      
      // Debug: Log categories to see if they're being loaded
      console.log('Loaded categories:', categoriesData);
      console.log('Categories count:', (categoriesData || []).length);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load data');
    } finally {
      setIsLoading(false);
    }
  }, [isOpen]);

  // Filter users based on search term and view mode
  const filterUsers = useCallback(() => {
    const usersToFilter = showAllUsers ? allUsers : availableUsers;
    
    if (!userSearchTerm.trim()) {
      setFilteredUsers(usersToFilter);
      return;
    }

    const searchLower = userSearchTerm.toLowerCase();
    const filtered = usersToFilter.filter(user => 
      user.firstName?.toLowerCase().includes(searchLower) ||
      user.lastName?.toLowerCase().includes(searchLower) ||
      user.email?.toLowerCase().includes(searchLower)
    );
    
    setFilteredUsers(filtered);
  }, [showAllUsers, allUsers, availableUsers, userSearchTerm]);

  // Update filtered users when dependencies change
  useEffect(() => {
    filterUsers();
  }, [filterUsers]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Initialize default schedule
  useEffect(() => {
    if (isOpen && staffData.schedule.length === 0) {
      const defaultSchedule = [
        PrismaDayOfWeek.MONDAY,
        PrismaDayOfWeek.TUESDAY,
        PrismaDayOfWeek.WEDNESDAY,
        PrismaDayOfWeek.THURSDAY,
        PrismaDayOfWeek.FRIDAY,
        PrismaDayOfWeek.SATURDAY,
        PrismaDayOfWeek.SUNDAY
      ].map(day => {
        const isWeekend = day === PrismaDayOfWeek.SATURDAY || day === PrismaDayOfWeek.SUNDAY;
        return {
          dayOfWeek: day,
          startTime: isWeekend ? '' : '09:00',
          endTime: isWeekend ? '' : '17:00',
          isAvailable: !isWeekend,
          scheduleType: PrismaScheduleType.REGULAR_HOURS,
        };
      });

      setStaffData(prev => ({ ...prev, schedule: defaultSchedule }));
    }
  }, [isOpen, staffData.schedule.length]);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setCurrentStep('user');
      setCompletedSteps([]);
      setStaffData({
        selectedUser: null,
        bio: '',
        specializations: [],
        selectedServiceIds: [],
        selectedLocationIds: [],
        schedule: []
      });
      setSpecializationsInput('');
    }
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isSaving) {
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
  }, [isOpen, isSaving, onClose]);

  const getCurrentStepIndex = () => STEPS.findIndex(step => step.id === currentStep);

  const canProceedFromStep = (stepId: string): boolean => {
    switch (stepId) {
      case 'user':
        return !!staffData.selectedUser?.id;
      case 'profile':
        return true; // Bio and specializations are optional
      case 'assignments':
        return true; // Service and location assignments are optional
      case 'schedule':
        return staffData.schedule.some(s => s.isAvailable);
      case 'review':
        return true;
      default:
        return false;
    }
  };

  const handleNext = () => {
    const currentIndex = getCurrentStepIndex();
    const currentStepId = STEPS[currentIndex].id;
    
    if (!canProceedFromStep(currentStepId)) {
      toast.error('Please complete the required fields before proceeding');
      return;
    }

    // Mark current step as completed
    if (!completedSteps.includes(currentStepId)) {
      setCompletedSteps(prev => [...prev, currentStepId]);
    }

    // Move to next step
    if (currentIndex < STEPS.length - 1) {
      setCurrentStep(STEPS[currentIndex + 1].id);
    }
  };

  const handlePrevious = () => {
    const currentIndex = getCurrentStepIndex();
    if (currentIndex > 0) {
      setCurrentStep(STEPS[currentIndex - 1].id);
    }
  };

  const handleUserSelect = (user: UserWithRole) => {
    setStaffData(prev => ({ ...prev, selectedUser: user }));
  };

  const handleBioChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setStaffData(prev => ({ ...prev, bio: e.target.value }));
  };

  const handleSpecializationsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSpecializationsInput(value);
    const specializations = value.split(',').map(s => s.trim()).filter(s => s);
    setStaffData(prev => ({ ...prev, specializations }));
  };

  const handleServiceSelection = (selectedIds: string[]) => {
    setStaffData(prev => ({ ...prev, selectedServiceIds: selectedIds }));
  };

  const handleLocationSelection = (selectedIds: string[]) => {
    setStaffData(prev => ({ ...prev, selectedLocationIds: selectedIds }));
  };

  const handleScheduleUpdate = (schedule: Partial<StaffScheduleInput>[]) => {
    setStaffData(prev => ({ ...prev, schedule }));
  };

  // User creation handlers
  const handleCreateUserClick = () => {
    setShowUserCreationForm(true);
  };

  const handleCancelUserCreation = () => {
    setShowUserCreationForm(false);
    setUserFormData({
      firstName: '',
      lastName: '',
      email: '',
      phoneNumber: '',
      password: '',
      role: 'USER'
    });
    setUserFormStep(1);
  };

  const handleUserFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!userFormData.email || !userFormData.password || !userFormData.firstName || !userFormData.lastName) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setIsCreatingUser(true);
      const newUser = await graphqlClient.createUser({
        email: userFormData.email,
        password: userFormData.password,
        firstName: userFormData.firstName,
        lastName: userFormData.lastName,
        phoneNumber: userFormData.phoneNumber || undefined,
        role: userFormData.role
      });

      toast.success(`User "${newUser.firstName} ${newUser.lastName}" created successfully!`);
      
      // Add the new user to available users and select them
      const newUserWithRole: UserWithRole = {
        id: newUser.id,
        email: newUser.email,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        phoneNumber: newUser.phoneNumber,
        role: newUser.role
      };
      
      setAvailableUsers(prev => [...prev, newUserWithRole]);
      setStaffData(prev => ({ ...prev, selectedUser: newUserWithRole }));
      
      // Close the user creation form
      handleCancelUserCreation();
    } catch (error) {
      console.error('Error creating user:', error);
      toast.error(`Failed to create user: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsCreatingUser(false);
    }
  };

  // User form validation
  const validateUserFormStep = (step: number, currentFormData: UserFormData): boolean => {
    switch (step) {
      case 1:
        return !!(currentFormData.firstName.trim() && currentFormData.lastName.trim());
      case 2:
        return !!(currentFormData.email.trim() && currentFormData.email.includes('@') && currentFormData.email.includes('.'));
      case 3:
        return !!(currentFormData.password.trim() && currentFormData.password.length >= 6);
      case 4:
        return !!(currentFormData.role.trim());
      default:
        return false;
    }
  };

  // User form handlers
  const handleUserFirstNameChange = (value: string) => {
    setUserFormData(prev => ({ ...prev, firstName: value }));
  };

  const handleUserLastNameChange = (value: string) => {
    setUserFormData(prev => ({ ...prev, lastName: value }));
  };

  const handleUserEmailChange = (value: string) => {
    setUserFormData(prev => ({ ...prev, email: value }));
  };

  const handleUserPhoneChange = (value: string) => {
    setUserFormData(prev => ({ ...prev, phoneNumber: value }));
  };

  const handleUserPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUserFormData(prev => ({ ...prev, password: e.target.value }));
  };

  const handleUserRoleChange = (value: string) => {
    setUserFormData(prev => ({ ...prev, role: value }));
  };

  const handleUserFormNextStep = () => {
    setUserFormStep(prev => prev < totalUserFormSteps ? prev + 1 : prev);
  };

  const handleUserFormPrevStep = () => {
    setUserFormStep(prev => prev > 1 ? prev - 1 : prev);
  };

  // Service creation handlers
  const handleCreateServiceClick = () => {
    setShowServiceCreationForm(true);
  };

  const handleCancelServiceCreation = () => {
    setShowServiceCreationForm(false);
    setServiceFormData({
      name: '',
      description: '',
      durationMinutes: 60,
      serviceCategoryId: '',
      bufferTimeBeforeMinutes: 0,
      bufferTimeAfterMinutes: 0,
      preparationTimeMinutes: 0,
      cleanupTimeMinutes: 0,
      maxDailyBookingsPerService: 10,
      isActive: true,
      locationIds: []
    });
    setServiceFormStep(1);
  };

  const handleServiceFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!serviceFormData.name || !serviceFormData.serviceCategoryId || !serviceFormData.durationMinutes) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setIsCreatingService(true);
      const newService = await graphqlClient.createService({
        input: {
          name: serviceFormData.name,
          description: serviceFormData.description || undefined,
          durationMinutes: serviceFormData.durationMinutes,
          serviceCategoryId: serviceFormData.serviceCategoryId,
          bufferTimeBeforeMinutes: serviceFormData.bufferTimeBeforeMinutes || undefined,
          bufferTimeAfterMinutes: serviceFormData.bufferTimeAfterMinutes || undefined,
          preparationTimeMinutes: serviceFormData.preparationTimeMinutes || undefined,
          cleanupTimeMinutes: serviceFormData.cleanupTimeMinutes || undefined,
          maxDailyBookingsPerService: serviceFormData.maxDailyBookingsPerService || undefined,
          isActive: serviceFormData.isActive,
          locationIds: serviceFormData.locationIds.length > 0 ? serviceFormData.locationIds : undefined
        }
      });

      toast.success(`Service "${newService.name}" created successfully!`);
      
      // Add the new service to available services and select it
      const newServiceForList: Service = {
        id: newService.id,
        name: newService.name,
        description: newService.description,
        durationMinutes: newService.durationMinutes,
        isActive: newService.isActive,
        serviceCategoryId: serviceFormData.serviceCategoryId,
        bufferTimeBeforeMinutes: serviceFormData.bufferTimeBeforeMinutes,
        bufferTimeAfterMinutes: serviceFormData.bufferTimeAfterMinutes,
        preparationTimeMinutes: serviceFormData.preparationTimeMinutes,
        cleanupTimeMinutes: serviceFormData.cleanupTimeMinutes,
        maxDailyBookingsPerService: serviceFormData.maxDailyBookingsPerService
      };
      
      setAllServices(prev => [...prev, newServiceForList]);
      setStaffData(prev => ({ 
        ...prev, 
        selectedServiceIds: [...prev.selectedServiceIds, newService.id] 
      }));
      
      // Close the service creation form
      handleCancelServiceCreation();
    } catch (error) {
      console.error('Error creating service:', error);
      toast.error(`Failed to create service: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsCreatingService(false);
    }
  };

  // Service form validation
  const validateServiceFormStep = (step: number, currentFormData: ServiceFormData): boolean => {
    switch (step) {
      case 1:
        return !!(currentFormData.name.trim() && currentFormData.durationMinutes > 0);
      case 2:
        return true; // All timing fields are optional
      case 3:
        return !!(currentFormData.serviceCategoryId.trim());
      case 4:
        return true; // Review step
      default:
        return false;
    }
  };

  // Service form handlers
  const handleServiceNameChange = (value: string) => {
    setServiceFormData(prev => ({ ...prev, name: value }));
  };

  const handleServiceDescriptionChange = (value: string) => {
    setServiceFormData(prev => ({ ...prev, description: value }));
  };

  const handleServiceDurationChange = (value: string) => {
    setServiceFormData(prev => ({ ...prev, durationMinutes: parseInt(value) || 0 }));
  };

  const handleServiceCategoryChange = (value: string) => {
    setServiceFormData(prev => ({ ...prev, serviceCategoryId: value }));
  };

  const handleServiceBufferBeforeChange = (value: string) => {
    setServiceFormData(prev => ({ ...prev, bufferTimeBeforeMinutes: parseInt(value) || 0 }));
  };

  const handleServiceBufferAfterChange = (value: string) => {
    setServiceFormData(prev => ({ ...prev, bufferTimeAfterMinutes: parseInt(value) || 0 }));
  };

  const handleServicePreparationTimeChange = (value: string) => {
    setServiceFormData(prev => ({ ...prev, preparationTimeMinutes: parseInt(value) || 0 }));
  };

  const handleServiceCleanupTimeChange = (value: string) => {
    setServiceFormData(prev => ({ ...prev, cleanupTimeMinutes: parseInt(value) || 0 }));
  };

  const handleServiceMaxBookingsChange = (value: string) => {
    setServiceFormData(prev => ({ ...prev, maxDailyBookingsPerService: parseInt(value) || 0 }));
  };

  const handleServiceActiveChange = (checked: boolean) => {
    setServiceFormData(prev => ({ ...prev, isActive: checked }));
  };

  const handleServiceLocationIdsChange = (locationIds: string[]) => {
    setServiceFormData(prev => ({ ...prev, locationIds }));
  };

  const handleServiceFormNextStep = () => {
    setServiceFormStep(prev => prev < totalServiceFormSteps ? prev + 1 : prev);
  };

  const handleServiceFormPrevStep = () => {
    setServiceFormStep(prev => prev > 1 ? prev - 1 : prev);
  };

  // Location creation handlers
  const handleCreateLocationClick = () => {
    setShowLocationCreationForm(true);
  };

  const handleCancelLocationCreation = () => {
    setShowLocationCreationForm(false);
    setLocationFormData({
      name: '',
      address: '',
      phone: '',
      operatingHours: {}
    });
    setLocationFormStep(1);
  };

  const handleLocationFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!locationFormData.name) {
      toast.error('Please fill in the location name');
      return;
    }

    try {
      setIsCreatingLocation(true);
      const newLocation = await graphqlClient.createLocation({
        input: {
          name: locationFormData.name,
          address: locationFormData.address || undefined,
          phone: locationFormData.phone || undefined,
          operatingHours: Object.keys(locationFormData.operatingHours).length > 0 
            ? locationFormData.operatingHours 
            : undefined
        }
      });

      toast.success(`Location "${newLocation.name}" created successfully!`);
      
      // Add the new location to available locations and select it
      const newLocationForList: Location = {
        id: newLocation.id,
        name: newLocation.name,
        address: newLocation.address,
        phone: newLocation.phone
      };
      
      setAllLocations(prev => [...prev, newLocationForList]);
      setStaffData(prev => ({ 
        ...prev, 
        selectedLocationIds: [...prev.selectedLocationIds, newLocation.id] 
      }));
      
      // Close the location creation form
      handleCancelLocationCreation();
    } catch (error) {
      console.error('Error creating location:', error);
      toast.error(`Failed to create location: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsCreatingLocation(false);
    }
  };

  // Location form validation
  const validateLocationFormStep = (step: number, currentFormData: LocationFormData): boolean => {
    switch (step) {
      case 1:
        return !!(currentFormData.name.trim());
      case 2:
        return true; // Contact details are optional
      case 3:
        return true; // Operating hours are optional
      case 4:
        return true; // Review step
      default:
        return false;
    }
  };

  // Location form handlers
  const handleLocationNameChange = (value: string) => {
    setLocationFormData(prev => ({ ...prev, name: value }));
  };

  const handleLocationAddressChange = (value: string) => {
    setLocationFormData(prev => ({ ...prev, address: value }));
  };

  const handleLocationPhoneChange = (value: string) => {
    setLocationFormData(prev => ({ ...prev, phone: value }));
  };

  const handleLocationOperatingHoursChange = (hours: LocationFormData['operatingHours']) => {
    setLocationFormData(prev => ({ ...prev, operatingHours: hours }));
  };

  const handleLocationFormNextStep = () => {
    setLocationFormStep(prev => prev < totalLocationFormSteps ? prev + 1 : prev);
  };

  const handleLocationFormPrevStep = () => {
    setLocationFormStep(prev => prev > 1 ? prev - 1 : prev);
  };

  const handleSubmit = async () => {
    if (!staffData.selectedUser?.id) {
      toast.error('Please select a user');
      return;
    }

    setIsSaving(true);
    try {
      // Create staff profile
      const profileInput = {
        userId: staffData.selectedUser.id,
        bio: staffData.bio || undefined,
        specializations: staffData.specializations,
      };

      const createdProfile = await graphqlClient.createStaffProfile({ 
        input: profileInput 
      }) as unknown as StaffProfile;

      if (!createdProfile?.id) {
        throw new Error('Failed to create staff profile');
      }

      // Update schedule if profile was created successfully
      if (staffData.schedule.length > 0) {
        const scheduleInput = staffData.schedule.map(s => ({
          staffProfileId: createdProfile.id,
          dayOfWeek: s.dayOfWeek,
          startTime: s.startTime || '',
          endTime: s.endTime || '',
          scheduleType: PrismaScheduleType.REGULAR_HOURS,
          isAvailable: s.isAvailable ?? true
        }));

        await graphqlClient.updateStaffSchedule({ 
          staffProfileId: createdProfile.id, 
          schedule: scheduleInput 
        });
      }

      // Assign services
      if (staffData.selectedServiceIds.length > 0) {
        const serviceAssignments = staffData.selectedServiceIds.map(serviceId =>
          graphqlClient.assignStaffToService({
            staffProfileId: createdProfile.id,
            serviceId
          })
        );
        
        const serviceResults = await Promise.allSettled(serviceAssignments);
        const failedServices = serviceResults.filter(result => result.status === 'rejected');
        
        if (failedServices.length > 0) {
          console.warn('Some service assignments failed:', failedServices);
          toast.error(`${failedServices.length} service assignment(s) failed`);
        }
      }

      // Assign locations
      if (staffData.selectedLocationIds.length > 0) {
        const locationAssignments = staffData.selectedLocationIds.map(locationId =>
          graphqlClient.assignStaffToLocation({
            staffProfileId: createdProfile.id,
            locationId
          })
        );
        
        const locationResults = await Promise.allSettled(locationAssignments);
        const failedLocations = locationResults.filter(result => result.status === 'rejected');
        
        if (failedLocations.length > 0) {
          console.warn('Some location assignments failed:', failedLocations);
          toast.error(`${failedLocations.length} location assignment(s) failed`);
        }
      }

      toast.success(`Staff member "${staffData.selectedUser.firstName} ${staffData.selectedUser.lastName}" created successfully!`);
      onSuccess?.(createdProfile);
      onClose();
    } catch (error) {
      console.error('Error creating staff:', error);
      toast.error(`Failed to create staff member: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && !isSaving) {
      onClose();
    }
  };

  if (!isOpen) return null;

  const renderStepContent = () => {
    switch (currentStep) {
      case 'user':
        return (
          <div className="space-y-4">
            {!showUserCreationForm ? (
              <>
                <div className="text-center mb-6">
                  <UserPlus className="h-12 w-12 text-primary mx-auto mb-2" />
                  <h3 className="text-lg font-medium">{t('staffCreator.selectUser')}</h3>
                  <p className="text-sm text-muted-foreground">
                    {t('staffCreator.selectUserDescription')}
                  </p>
                </div>

                {/* User Filter and Search Controls */}
                <Card className="mb-4">
                  <CardContent className="pt-4">
                    <div className="space-y-4">
                      {/* View Toggle */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Filter className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-medium">{t('staffCreator.filterUsers')}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            variant={!showAllUsers ? "default" : "outline"}
                            size="sm"
                            onClick={() => setShowAllUsers(false)}
                            className="text-xs"
                          >
                            {t('staffCreator.showAvailableOnly')}
                          </Button>
                          <Button
                            type="button"
                            variant={showAllUsers ? "default" : "outline"}
                            size="sm"
                            onClick={() => setShowAllUsers(true)}
                            className="text-xs"
                          >
                            {t('staffCreator.showAllUsers')}
                          </Button>
                        </div>
                      </div>

                      {/* Search Input */}
                      <div className="relative">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder={t('staffCreator.searchUsers')}
                          value={userSearchTerm}
                          onChange={(e) => setUserSearchTerm(e.target.value)}
                          className="pl-8"
                        />
                      </div>

                      {/* User Statistics */}
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <div className="flex items-center gap-4">
                          <span>
                            {t('staffCreator.totalUsers')}: {allUsers.length}
                          </span>
                          <span>
                            {t('staffCreator.availableUsers')}: {availableUsers.length}
                          </span>
                          <span>
                            {t('staffCreator.staffMembers')}: {allUsers.length - availableUsers.length}
                          </span>
                        </div>
                        <div>
                          {showAllUsers ? t('staffCreator.allUsersInSystem') : t('staffCreator.availableUsersOnly')}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                {/* User Selection */}
                <UserSearchSelect
                  users={filteredUsers}
                  selectedUserId={staffData.selectedUser?.id}
                  onUserSelect={handleUserSelect}
                  disabled={isLoading}
                  placeholder={t('staffCreator.searchUsers')}
                />

                {filteredUsers.length === 0 && !isLoading && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="h-8 w-8 mx-auto mb-2" />
                    {userSearchTerm ? (
                      <div>
                        <p>No users found matching &quot;{userSearchTerm}&quot;</p>
                        <p className="text-xs">Try adjusting your search or view settings</p>
                      </div>
                    ) : showAllUsers ? (
                      <div>
                        <p>No users in the system</p>
                        <p className="text-xs">Create a new user to get started</p>
                      </div>
                    ) : (
                      <div>
                        <p>{t('staffCreator.noUsersAvailable')}</p>
                        <p className="text-xs">{t('staffCreator.allUsersAreStaff')}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Create User Button */}
                <div className="text-center pt-4 border-t">
                  <p className="text-sm text-muted-foreground mb-3">
                    {t('staffCreator.dontSeeUser')}
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCreateUserClick}
                    disabled={isLoading}
                    className="flex items-center gap-2"
                  >
                    <UserPlus className="h-4 w-4" />
                    {t('staffCreator.createNewUser')}
                  </Button>
                </div>
              </>
            ) : (
              <MultiStepUserForm
                formData={userFormData}
                currentStep={userFormStep}
                totalSteps={totalUserFormSteps}
                createLoading={isCreatingUser}
                roles={roles}
                onFirstNameChange={handleUserFirstNameChange}
                onLastNameChange={handleUserLastNameChange}
                onEmailChange={handleUserEmailChange}
                onPhoneChange={handleUserPhoneChange}
                onPasswordChange={handleUserPasswordChange}
                onRoleChange={handleUserRoleChange}
                onNextStep={handleUserFormNextStep}
                onPrevStep={handleUserFormPrevStep}
                onCancel={handleCancelUserCreation}
                onSubmit={handleUserFormSubmit}
                validateStep={validateUserFormStep}
                title={t('staffCreator.createNewUser')}
                description={t('staffCreator.createUserDescription')}
                submitButtonText={t('staffCreator.createUserAndContinue')}
              />
            )}
          </div>
        );

      case 'profile':
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <User className="h-12 w-12 text-primary mx-auto mb-2" />
              <h3 className="text-lg font-medium">Profile Information</h3>
              <p className="text-sm text-muted-foreground">
                Add bio and specializations for {staffData.selectedUser?.firstName} {staffData.selectedUser?.lastName}
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="bio">Bio (Optional)</Label>
                <Textarea
                  id="bio"
                  value={staffData.bio}
                  onChange={handleBioChange}
                  placeholder="Brief description about the staff member..."
                  rows={4}
                  disabled={isSaving}
                />
              </div>

              <div>
                <Label htmlFor="specializations">Specializations (Optional)</Label>
                <Input
                  id="specializations"
                  value={specializationsInput}
                  onChange={handleSpecializationsChange}
                  placeholder="e.g., Massage Therapy, Physical Therapy, Wellness Coaching"
                  disabled={isSaving}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Separate multiple specializations with commas
                </p>
                {staffData.specializations.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {staffData.specializations.map((spec, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {spec}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      case 'assignments':
        return (
          <div className="space-y-6">
            {!showServiceCreationForm && !showLocationCreationForm ? (
              <>
                <div className="text-center mb-6">
                  <div className="flex justify-center space-x-2 mb-2">
                    <Briefcase className="h-6 w-6 text-primary" />
                    <MapPin className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-medium">Service & Location Assignments</h3>
                  <p className="text-sm text-muted-foreground">
                    Assign services and locations for {staffData.selectedUser?.firstName}
                  </p>
                </div>

                <div className="space-y-8">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-base font-medium flex items-center gap-2">
                        <Briefcase className="h-4 w-4" />
                        Services
                      </h4>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleCreateServiceClick}
                        className="text-xs"
                      >
                        <PlusCircle className="h-3 w-3 mr-1" />
                        Create Service
                      </Button>
                    </div>
                    <MultiSelectGrid
                      items={allServices.map(service => ({
                        id: service.id,
                        name: service.name,
                        description: service.description || undefined,
                        isActive: service.isActive ?? true
                      }))}
                      selectedIds={staffData.selectedServiceIds}
                      onSelectionChange={handleServiceSelection}
                      title=""
                      type="services"
                      disabled={isSaving}
                    />
                  </div>

                  <Separator />

                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-base font-medium flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        Locations
                      </h4>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleCreateLocationClick}
                        className="text-xs"
                      >
                        <PlusCircle className="h-3 w-3 mr-1" />
                        Create Location
                      </Button>
                    </div>
                    <MultiSelectGrid
                      items={allLocations.map(location => ({
                        id: location.id,
                        name: location.name,
                        description: location.address || undefined,
                        isActive: true // Location type doesn't have isActive property
                      }))}
                      selectedIds={staffData.selectedLocationIds}
                      onSelectionChange={handleLocationSelection}
                      title=""
                      type="locations"
                      disabled={isSaving}
                    />
                  </div>
                </div>

                {staffData.selectedServiceIds.length === 0 && staffData.selectedLocationIds.length === 0 && (
                  <div className="text-center py-4 text-blue-600 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-sm">
                      <strong>Optional:</strong> You can assign services and locations now or later. Staff members without assignments can still be created and managed.
                    </p>
                  </div>
                )}
              </>
            ) : showServiceCreationForm ? (
              <>
                {allCategories.length === 0 && (
                  <div className="mb-4 p-4 text-amber-600 bg-amber-50 rounded-lg border border-amber-200">
                    <p className="text-sm mb-3">
                      <strong>No service categories available.</strong> You need to create service categories first before creating services.
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={async () => {
                        try {
                          const defaultCategory = await graphqlClient.createServiceCategory({
                            input: {
                              name: 'General Services',
                              description: 'Default category for general services',
                              displayOrder: 1
                            }
                          });
                          setAllCategories([defaultCategory]);
                          toast.success('Default service category created!');
                        } catch (error) {
                          console.error('Error creating default category:', error);
                          toast.error('Failed to create default category');
                        }
                      }}
                      className="text-xs"
                    >
                      Create Default Category
                    </Button>
                  </div>
                )}
                <MultiStepServiceForm
                  formData={serviceFormData}
                  currentStep={serviceFormStep}
                  totalSteps={totalServiceFormSteps}
                  createLoading={isCreatingService}
                  categories={allCategories}
                  locations={allLocations.map(location => ({
                    id: location.id,
                    name: location.name,
                    address: location.address || undefined
                  }))}
                  onNameChange={handleServiceNameChange}
                  onDescriptionChange={handleServiceDescriptionChange}
                  onDurationChange={handleServiceDurationChange}
                  onCategoryChange={handleServiceCategoryChange}
                  onBufferBeforeChange={handleServiceBufferBeforeChange}
                  onBufferAfterChange={handleServiceBufferAfterChange}
                  onPreparationTimeChange={handleServicePreparationTimeChange}
                  onCleanupTimeChange={handleServiceCleanupTimeChange}
                  onMaxBookingsChange={handleServiceMaxBookingsChange}
                  onActiveChange={handleServiceActiveChange}
                  onLocationIdsChange={handleServiceLocationIdsChange}
                  onNextStep={handleServiceFormNextStep}
                  onPrevStep={handleServiceFormPrevStep}
                  onCancel={handleCancelServiceCreation}
                  onSubmit={handleServiceFormSubmit}
                  validateStep={validateServiceFormStep}
                  title="Create New Service"
                  description="Create a service that can be assigned to staff"
                  submitButtonText="Create Service & Continue"
                />
              </>
            ) : showLocationCreationForm ? (
              <MultiStepLocationForm
                formData={locationFormData}
                currentStep={locationFormStep}
                totalSteps={totalLocationFormSteps}
                createLoading={isCreatingLocation}
                onNameChange={handleLocationNameChange}
                onAddressChange={handleLocationAddressChange}
                onPhoneChange={handleLocationPhoneChange}
                onOperatingHoursChange={handleLocationOperatingHoursChange}
                onNextStep={handleLocationFormNextStep}
                onPrevStep={handleLocationFormPrevStep}
                onCancel={handleCancelLocationCreation}
                onSubmit={handleLocationFormSubmit}
                validateStep={validateLocationFormStep}
                title="Create New Location"
                description="Create a location that can be assigned to staff"
                submitButtonText="Create Location & Continue"
              />
            ) : null}
          </div>
        );

      case 'schedule':
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <Calendar className="h-12 w-12 text-primary mx-auto mb-2" />
              <h3 className="text-lg font-medium">Weekly Schedule</h3>
              <p className="text-sm text-muted-foreground">
                Set working hours for {staffData.selectedUser?.firstName}
              </p>
            </div>

            <WeeklyScheduleEditor
              initialSchedule={staffData.schedule}
              onChange={handleScheduleUpdate}
              disabled={isSaving}
            />

            {!staffData.schedule.some(s => s.isAvailable) && (
              <div className="text-center py-4 text-amber-600 bg-amber-50 rounded-lg border border-amber-200">
                <p className="text-sm">
                  Please set at least one day as available for this staff member.
                </p>
              </div>
            )}
          </div>
        );

      case 'review':
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <Check className="h-12 w-12 text-primary mx-auto mb-2" />
              <h3 className="text-lg font-medium">Review & Confirm</h3>
              <p className="text-sm text-muted-foreground">
                Please review the staff member details before creating
              </p>
            </div>

            <div className="space-y-4">
              {/* User Info */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center">
                    <User className="h-4 w-4 mr-2" />
                    User Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Name:</span>
                    <span className="text-sm font-medium">
                      {staffData.selectedUser?.firstName} {staffData.selectedUser?.lastName}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Email:</span>
                    <span className="text-sm">{staffData.selectedUser?.email}</span>
                  </div>
                  {staffData.selectedUser?.role?.name && (
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Role:</span>
                      <Badge variant="outline" className="text-xs">
                        {staffData.selectedUser.role.name}
                      </Badge>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Profile Info */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Profile Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {staffData.bio ? (
                    <div>
                      <span className="text-sm text-muted-foreground">Bio:</span>
                      <p className="text-sm mt-1">{staffData.bio}</p>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No bio provided</p>
                  )}
                  
                  {staffData.specializations.length > 0 ? (
                    <div>
                      <span className="text-sm text-muted-foreground">Specializations:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {staffData.specializations.map((spec, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {spec}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No specializations specified</p>
                  )}
                </CardContent>
              </Card>

              {/* Assignments */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Assignments</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <span className="text-sm text-muted-foreground">Services ({staffData.selectedServiceIds.length}):</span>
                    {staffData.selectedServiceIds.length > 0 ? (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {staffData.selectedServiceIds.map(serviceId => {
                          const service = allServices.find(s => s.id === serviceId);
                          return service ? (
                            <Badge key={serviceId} variant="outline" className="text-xs">
                              {service.name}
                            </Badge>
                          ) : null;
                        })}
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground mt-1">No services assigned</p>
                    )}
                  </div>

                  <div>
                    <span className="text-sm text-muted-foreground">Locations ({staffData.selectedLocationIds.length}):</span>
                    {staffData.selectedLocationIds.length > 0 ? (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {staffData.selectedLocationIds.map(locationId => {
                          const location = allLocations.find(l => l.id === locationId);
                          return location ? (
                            <Badge key={locationId} variant="outline" className="text-xs">
                              {location.name}
                            </Badge>
                          ) : null;
                        })}
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground mt-1">No locations assigned</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Schedule Summary */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center">
                    <Calendar className="h-4 w-4 mr-2" />
                    Schedule Summary
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-xs">
                    {['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'].map(day => {
                      const daySchedules = staffData.schedule.filter(s => s.dayOfWeek === day && s.isAvailable);
                      const hasSchedule = daySchedules.length > 0;
                      
                      return (
                        <div key={day} className="flex justify-between items-start">
                          <span className="capitalize font-medium min-w-[80px]">{day.toLowerCase()}:</span>
                          <div className="flex-1 text-right">
                            {hasSchedule ? (
                              <div className="space-y-1">
                                {daySchedules.map((schedule, index) => (
                                  <div key={index} className="text-green-600">
                                    {schedule.startTime} - {schedule.endTime}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <span className="text-muted-foreground">Unavailable</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      <div className="relative w-full max-w-4xl h-full bg-white rounded-lg shadow-xl border border-gray-200 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Create New Staff Member</h2>
            <p className="text-sm text-gray-500">
              Follow the steps to create a new staff profile
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-md transition-colors"
            disabled={isSaving}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Progress */}
        <div className="px-6 py-4 border-b border-gray-100 flex-shrink-0">
          <MultiStepProgress
            steps={STEPS}
            currentStep={currentStep}
            completedSteps={completedSteps}
          />
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                <p className="text-sm text-muted-foreground">Loading data...</p>
              </div>
            </div>
          ) : (
            renderStepContent()
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center p-6 border-t border-gray-200 bg-gray-50 flex-shrink-0">
          <Button
            type="button"
            variant="outline"
            onClick={handlePrevious}
            disabled={getCurrentStepIndex() === 0 || isSaving}
            className="flex items-center"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Previous
          </Button>

          <div className="flex space-x-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSaving}
            >
              Cancel
            </Button>

            {currentStep === 'review' ? (
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={isSaving || !staffData.selectedUser?.id}
                className="flex items-center"
              >
                {isSaving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Creating...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Create Staff Member
                  </>
                )}
              </Button>
            ) : (
              <Button
                type="button"
                onClick={handleNext}
                disabled={!canProceedFromStep(currentStep) || isSaving}
                className="flex items-center"
              >
                Next
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 