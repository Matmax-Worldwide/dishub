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
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { User, UserPlus, Calendar, MapPin, Briefcase, Check, ArrowLeft, ArrowRight, X } from 'lucide-react';
import { toast } from 'sonner';
import graphqlClient from '@/lib/graphql-client';
import { StaffProfile, User as UserType, Service, Location, StaffScheduleInput, PrismaDayOfWeek, PrismaScheduleType } from '@/types/calendar';
import UserSearchSelect from './UserSearchSelect';
import MultiSelectGrid from './MultiSelectGrid';
import MultiStepProgress from './MultiStepProgress';
import WeeklyScheduleEditor from './WeeklyScheduleEditor';

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
  const [currentStep, setCurrentStep] = useState('user');
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Data states
  const [availableUsers, setAvailableUsers] = useState<UserWithRole[]>([]);
  const [allServices, setAllServices] = useState<Service[]>([]);
  const [allLocations, setAllLocations] = useState<Location[]>([]);
  
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
      const [usersData, servicesData, locationsData, staffData] = await Promise.all([
        graphqlClient.users(),
        graphqlClient.services(),
        graphqlClient.locations(),
        graphqlClient.staffProfiles()
      ]);

      // Filter out users who are already staff
      const existingStaffUserIds = staffData.map(staff => staff.userId);
      const availableUsersFiltered = (usersData || []).filter(
        user => user.id && !existingStaffUserIds.includes(user.id)
      );

      setAvailableUsers(availableUsersFiltered as UserWithRole[]);
      setAllServices(servicesData || []);
      setAllLocations(locationsData || []);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load data');
    } finally {
      setIsLoading(false);
    }
  }, [isOpen]);

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
            <div className="text-center mb-6">
              <UserPlus className="h-12 w-12 text-primary mx-auto mb-2" />
              <h3 className="text-lg font-medium">Select User to Make Staff</h3>
              <p className="text-sm text-muted-foreground">
                Choose a user from your organization to create a staff profile
              </p>
            </div>
            
            <UserSearchSelect
              users={availableUsers}
              selectedUserId={staffData.selectedUser?.id}
              onUserSelect={handleUserSelect}
              disabled={isLoading}
              placeholder="Search for a user to make staff..."
            />

            {availableUsers.length === 0 && !isLoading && (
              <div className="text-center py-8 text-muted-foreground">
                <User className="h-8 w-8 mx-auto mb-2" />
                <p>No users available to make staff</p>
                <p className="text-xs">All users may already be staff members</p>
              </div>
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
              <MultiSelectGrid
                items={allServices.map(service => ({
                  id: service.id,
                  name: service.name,
                  description: service.description || undefined,
                  isActive: service.isActive ?? true
                }))}
                selectedIds={staffData.selectedServiceIds}
                onSelectionChange={handleServiceSelection}
                title="Services"
                type="services"
                disabled={isSaving}
              />

              <Separator />

              <MultiSelectGrid
                items={allLocations.map(location => ({
                  id: location.id,
                  name: location.name,
                  description: location.address || undefined,
                  isActive: true // Location type doesn't have isActive property
                }))}
                selectedIds={staffData.selectedLocationIds}
                onSelectionChange={handleLocationSelection}
                title="Locations"
                type="locations"
                disabled={isSaving}
              />
            </div>

            {staffData.selectedServiceIds.length === 0 && staffData.selectedLocationIds.length === 0 && (
              <div className="text-center py-4 text-blue-600 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm">
                  <strong>Optional:</strong> You can assign services and locations now or later. Staff members without assignments can still be created and managed.
                </p>
              </div>
            )}
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