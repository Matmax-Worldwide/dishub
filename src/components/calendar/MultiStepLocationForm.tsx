'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeft, ArrowRight, MapPin, Phone, Clock, Check, X } from 'lucide-react';
import MultiStepProgress from './MultiStepProgress';

export interface LocationFormData {
  name: string;
  address: string;
  phone: string;
  operatingHours: {
    [key: string]: {
      isOpen: boolean;
      openTime: string;
      closeTime: string;
    };
  };
}

export interface MultiStepLocationFormProps {
  formData: LocationFormData;
  currentStep: number;
  totalSteps: number;
  createLoading: boolean;
  onNameChange: (value: string) => void;
  onAddressChange: (value: string) => void;
  onPhoneChange: (value: string) => void;
  onOperatingHoursChange: (hours: LocationFormData['operatingHours']) => void;
  onNextStep: () => void;
  onPrevStep: () => void;
  onCancel: () => void;
  onSubmit: (e: React.FormEvent) => void;
  validateStep: (step: number, formData: LocationFormData) => boolean;
  title?: string;
  description?: string;
  submitButtonText?: string;
}

const STEPS = [
  {
    id: 'basic',
    title: 'Basic Information',
    description: 'Location name and address',
    icon: MapPin
  },
  {
    id: 'contact',
    title: 'Contact Details',
    description: 'Phone and additional info',
    icon: Phone
  },
  {
    id: 'hours',
    title: 'Operating Hours',
    description: 'Set business hours',
    icon: Clock
  },
  {
    id: 'review',
    title: 'Review',
    description: 'Confirm location details',
    icon: Check
  }
];

const DAYS_OF_WEEK = [
  { key: 'MONDAY', label: 'Monday' },
  { key: 'TUESDAY', label: 'Tuesday' },
  { key: 'WEDNESDAY', label: 'Wednesday' },
  { key: 'THURSDAY', label: 'Thursday' },
  { key: 'FRIDAY', label: 'Friday' },
  { key: 'SATURDAY', label: 'Saturday' },
  { key: 'SUNDAY', label: 'Sunday' }
];

export default function MultiStepLocationForm({
  formData,
  currentStep,
  totalSteps,
  createLoading,
  onNameChange,
  onAddressChange,
  onPhoneChange,
  onOperatingHoursChange,
  onNextStep,
  onPrevStep,
  onCancel,
  onSubmit,
  validateStep,
  title = "Create New Location",
  description = "Follow the steps to create a new location",
  submitButtonText = "Create Location"
}: MultiStepLocationFormProps) {
  const currentStepData = STEPS[currentStep - 1];
  const Icon = currentStepData?.icon || MapPin;

  const handleDayToggle = (dayKey: string, isOpen: boolean) => {
    const newHours = {
      ...formData.operatingHours,
      [dayKey]: {
        ...formData.operatingHours[dayKey],
        isOpen,
        openTime: isOpen ? (formData.operatingHours[dayKey]?.openTime || '09:00') : '',
        closeTime: isOpen ? (formData.operatingHours[dayKey]?.closeTime || '17:00') : ''
      }
    };
    onOperatingHoursChange(newHours);
  };

  const handleTimeChange = (dayKey: string, timeType: 'openTime' | 'closeTime', value: string) => {
    const newHours = {
      ...formData.operatingHours,
      [dayKey]: {
        ...formData.operatingHours[dayKey],
        [timeType]: value
      }
    };
    onOperatingHoursChange(newHours);
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1: // Basic Information
        return (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <MapPin className="h-12 w-12 text-primary mx-auto mb-2" />
              <h3 className="text-lg font-medium">Basic Information</h3>
              <p className="text-sm text-muted-foreground">
                Enter the basic details for your location
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="location-name">Location Name *</Label>
                <Input
                  id="location-name"
                  value={formData.name}
                  onChange={(e) => onNameChange(e.target.value)}
                  placeholder="e.g., Downtown Wellness Center"
                  disabled={createLoading}
                />
              </div>

              <div>
                <Label htmlFor="location-address">Address</Label>
                <Textarea
                  id="location-address"
                  value={formData.address}
                  onChange={(e) => onAddressChange(e.target.value)}
                  placeholder="123 Main Street, City, State, ZIP"
                  rows={3}
                  disabled={createLoading}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Full address including street, city, state, and postal code
                </p>
              </div>
            </div>
          </div>
        );

      case 2: // Contact Details
        return (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <Phone className="h-12 w-12 text-primary mx-auto mb-2" />
              <h3 className="text-lg font-medium">Contact Details</h3>
              <p className="text-sm text-muted-foreground">
                Add contact information for this location
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="location-phone">Phone Number</Label>
                <Input
                  id="location-phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => onPhoneChange(e.target.value)}
                  placeholder="(555) 123-4567"
                  disabled={createLoading}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Main contact number for this location
                </p>
              </div>
            </div>
          </div>
        );

      case 3: // Operating Hours
        return (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <Clock className="h-12 w-12 text-primary mx-auto mb-2" />
              <h3 className="text-lg font-medium">Operating Hours</h3>
              <p className="text-sm text-muted-foreground">
                Set the business hours for this location
              </p>
            </div>

            <div className="space-y-4">
              {DAYS_OF_WEEK.map((day) => {
                const dayData = formData.operatingHours[day.key] || {
                  isOpen: false,
                  openTime: '09:00',
                  closeTime: '17:00'
                };

                return (
                  <div key={day.key} className="flex items-center space-x-4 p-3 border rounded-lg">
                    <div className="flex items-center space-x-2 min-w-[120px]">
                      <Checkbox
                        id={`day-${day.key}`}
                        checked={dayData.isOpen}
                        onCheckedChange={(checked) => 
                          handleDayToggle(day.key, checked as boolean)
                        }
                        disabled={createLoading}
                      />
                      <Label 
                        htmlFor={`day-${day.key}`}
                        className="font-medium cursor-pointer"
                      >
                        {day.label}
                      </Label>
                    </div>

                    {dayData.isOpen ? (
                      <div className="flex items-center space-x-2 flex-1">
                        <Input
                          type="time"
                          value={dayData.openTime}
                          onChange={(e) => handleTimeChange(day.key, 'openTime', e.target.value)}
                          disabled={createLoading}
                          className="w-32"
                        />
                        <span className="text-muted-foreground">to</span>
                        <Input
                          type="time"
                          value={dayData.closeTime}
                          onChange={(e) => handleTimeChange(day.key, 'closeTime', e.target.value)}
                          disabled={createLoading}
                          className="w-32"
                        />
                      </div>
                    ) : (
                      <div className="flex-1 text-muted-foreground">
                        Closed
                      </div>
                    )}
                  </div>
                );
              })}

              <div className="text-center py-4 text-blue-600 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm">
                  <strong>Note:</strong> Operating hours are optional and can be updated later. 
                  These hours help customers know when your location is available.
                </p>
              </div>
            </div>
          </div>
        );

      case 4: // Review
        return (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <Check className="h-12 w-12 text-primary mx-auto mb-2" />
              <h3 className="text-lg font-medium">Review Location Details</h3>
              <p className="text-sm text-muted-foreground">
                Please review the location information before creating
              </p>
            </div>

            <div className="space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center">
                    <MapPin className="h-4 w-4 mr-2" />
                    Basic Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Name:</span>
                    <span className="text-sm font-medium">{formData.name}</span>
                  </div>
                  {formData.address && (
                    <div>
                      <span className="text-sm text-muted-foreground">Address:</span>
                      <p className="text-sm mt-1">{formData.address}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center">
                    <Phone className="h-4 w-4 mr-2" />
                    Contact Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Phone:</span>
                    <span className="text-sm">{formData.phone || 'Not provided'}</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center">
                    <Clock className="h-4 w-4 mr-2" />
                    Operating Hours
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-xs">
                    {DAYS_OF_WEEK.map((day) => {
                      const dayData = formData.operatingHours[day.key];
                      const isOpen = dayData?.isOpen;
                      
                      return (
                        <div key={day.key} className="flex justify-between items-center">
                          <span className="font-medium min-w-[80px]">{day.label}:</span>
                          <div className="text-right">
                            {isOpen && dayData ? (
                              <span className="text-green-600">
                                {dayData.openTime} - {dayData.closeTime}
                              </span>
                            ) : (
                              <span className="text-muted-foreground">Closed</span>
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
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader className="text-center">
        <div className="flex items-center justify-center space-x-2 mb-2">
          <Icon className="h-6 w-6 text-primary" />
          <CardTitle>{title}</CardTitle>
        </div>
        <p className="text-sm text-muted-foreground">{description}</p>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Progress */}
        <MultiStepProgress
          steps={STEPS}
          currentStep={STEPS[currentStep - 1]?.id || 'basic'}
          completedSteps={STEPS.slice(0, currentStep - 1).map(s => s.id)}
        />

        {/* Step Content */}
        <form onSubmit={onSubmit}>
          {renderStepContent()}

          {/* Navigation */}
          <div className="flex justify-between items-center pt-6 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onPrevStep}
              disabled={currentStep === 1 || createLoading}
              className="flex items-center"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Previous
            </Button>

            <div className="flex space-x-3">
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={createLoading}
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>

              {currentStep === totalSteps ? (
                <Button
                  type="submit"
                  disabled={createLoading || !validateStep(currentStep, formData)}
                  className="flex items-center"
                >
                  {createLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Creating...
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      {submitButtonText}
                    </>
                  )}
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={onNextStep}
                  disabled={!validateStep(currentStep, formData) || createLoading}
                  className="flex items-center"
                >
                  Next
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              )}
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
} 