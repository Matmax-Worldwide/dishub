'use client';

import React, { useState, useMemo } from 'react';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Textarea } from '@/app/components/ui/textarea';
import { Checkbox } from '@/app/components/ui/checkbox';
import { Badge } from '@/app/components/ui/badge';
import { ArrowLeft, ArrowRight, Briefcase, Clock, Settings, Check, X, Search } from 'lucide-react';
import MultiStepProgress from './MultiStepProgress';

export interface ServiceCategory {
  id: string;
  name: string;
  description?: string;
  displayOrder: number;
}

export interface Location {
  id: string;
  name: string;
  address?: string;
}

export interface ServiceFormData {
  name: string;
  description: string;
  durationMinutes: number;
  serviceCategoryId: string;
  bufferTimeBeforeMinutes: number;
  bufferTimeAfterMinutes: number;
  preparationTimeMinutes: number;
  cleanupTimeMinutes: number;
  maxDailyBookingsPerService: number;
  isActive: boolean;
  locationIds: string[];
}

export interface MultiStepServiceFormProps {
  formData: ServiceFormData;
  currentStep: number;
  totalSteps: number;
  createLoading: boolean;
  categories: ServiceCategory[];
  locations: Location[];
  onNameChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onDurationChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
  onBufferBeforeChange: (value: string) => void;
  onBufferAfterChange: (value: string) => void;
  onPreparationTimeChange: (value: string) => void;
  onCleanupTimeChange: (value: string) => void;
  onMaxBookingsChange: (value: string) => void;
  onActiveChange: (checked: boolean) => void;
  onLocationIdsChange: (locationIds: string[]) => void;
  onNextStep: () => void;
  onPrevStep: () => void;
  onCancel: () => void;
  onSubmit: (e: React.FormEvent) => void;
  validateStep: (step: number, formData: ServiceFormData) => boolean;
  title?: string;
  description?: string;
  submitButtonText?: string;
}

const STEPS = [
  {
    id: 'basic',
    title: 'Basic Information',
    description: 'Service name and description',
    icon: Briefcase
  },
  {
    id: 'timing',
    title: 'Timing & Settings',
    description: 'Duration and buffer times',
    icon: Clock
  },
  {
    id: 'assignments',
    title: 'Category & Locations',
    description: 'Category and location assignments',
    icon: Settings
  },
  {
    id: 'review',
    title: 'Review',
    description: 'Confirm service details',
    icon: Check
  }
];

export default function MultiStepServiceForm({
  formData,
  currentStep,
  totalSteps,
  createLoading,
  categories,
  locations,
  onNameChange,
  onDescriptionChange,
  onDurationChange,
  onCategoryChange,
  onBufferBeforeChange,
  onBufferAfterChange,
  onPreparationTimeChange,
  onCleanupTimeChange,
  onMaxBookingsChange,
  onActiveChange,
  onLocationIdsChange,
  onNextStep,
  onPrevStep,
  onCancel,
  onSubmit,
  validateStep,
  title = "Create New Service",
  description = "Follow the steps to create a new service",
  submitButtonText = "Create Service"
}: MultiStepServiceFormProps) {
  const currentStepData = STEPS[currentStep - 1];
  const Icon = currentStepData?.icon || Briefcase;

  // Category search state
  const [categorySearchTerm, setCategorySearchTerm] = useState('');

  // Filter categories based on search term
  const filteredCategories = useMemo(() => {
    if (!categorySearchTerm.trim()) {
      return categories;
    }
    return categories.filter(category =>
      category.name.toLowerCase().includes(categorySearchTerm.toLowerCase()) ||
      (category.description && category.description.toLowerCase().includes(categorySearchTerm.toLowerCase()))
    );
  }, [categories, categorySearchTerm]);

  const handleLocationToggle = (locationId: string, checked: boolean) => {
    if (checked) {
      onLocationIdsChange([...formData.locationIds, locationId]);
    } else {
      onLocationIdsChange(formData.locationIds.filter(id => id !== locationId));
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1: // Basic Information
        return (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <Briefcase className="h-12 w-12 text-primary mx-auto mb-2" />
              <h3 className="text-lg font-medium">Basic Information</h3>
              <p className="text-sm text-muted-foreground">
                Enter the basic details for your service
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="service-name">Service Name *</Label>
                <Input
                  id="service-name"
                  value={formData.name}
                  onChange={(e) => onNameChange(e.target.value)}
                  placeholder="e.g., Deep Tissue Massage"
                  disabled={createLoading}
                />
              </div>

              <div>
                <Label htmlFor="service-description">Description</Label>
                <Textarea
                  id="service-description"
                  value={formData.description}
                  onChange={(e) => onDescriptionChange(e.target.value)}
                  placeholder="Describe what this service includes..."
                  rows={3}
                  disabled={createLoading}
                />
              </div>

              <div>
                <Label htmlFor="service-duration">Duration (minutes) *</Label>
                <Input
                  id="service-duration"
                  type="number"
                  min="1"
                  max="480"
                  value={formData.durationMinutes || ''}
                  onChange={(e) => onDurationChange(e.target.value)}
                  placeholder="60"
                  disabled={createLoading}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  How long does this service typically take?
                </p>
              </div>
            </div>
          </div>
        );

      case 2: // Timing & Settings
        return (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <Clock className="h-12 w-12 text-primary mx-auto mb-2" />
              <h3 className="text-lg font-medium">Timing & Settings</h3>
              <p className="text-sm text-muted-foreground">
                Configure buffer times and booking limits
              </p>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="buffer-before">Buffer Before (minutes)</Label>
                  <Input
                    id="buffer-before"
                    type="number"
                    min="0"
                    max="120"
                    value={formData.bufferTimeBeforeMinutes || ''}
                    onChange={(e) => onBufferBeforeChange(e.target.value)}
                    placeholder="0"
                    disabled={createLoading}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Time before service starts
                  </p>
                </div>

                <div>
                  <Label htmlFor="buffer-after">Buffer After (minutes)</Label>
                  <Input
                    id="buffer-after"
                    type="number"
                    min="0"
                    max="120"
                    value={formData.bufferTimeAfterMinutes || ''}
                    onChange={(e) => onBufferAfterChange(e.target.value)}
                    placeholder="0"
                    disabled={createLoading}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Time after service ends
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="preparation-time">Preparation Time (minutes)</Label>
                  <Input
                    id="preparation-time"
                    type="number"
                    min="0"
                    max="60"
                    value={formData.preparationTimeMinutes || ''}
                    onChange={(e) => onPreparationTimeChange(e.target.value)}
                    placeholder="0"
                    disabled={createLoading}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Setup time needed
                  </p>
                </div>

                <div>
                  <Label htmlFor="cleanup-time">Cleanup Time (minutes)</Label>
                  <Input
                    id="cleanup-time"
                    type="number"
                    min="0"
                    max="60"
                    value={formData.cleanupTimeMinutes || ''}
                    onChange={(e) => onCleanupTimeChange(e.target.value)}
                    placeholder="0"
                    disabled={createLoading}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Cleanup time needed
                  </p>
                </div>
              </div>

              <div>
                <Label htmlFor="max-bookings">Max Daily Bookings</Label>
                <Input
                  id="max-bookings"
                  type="number"
                  min="1"
                  max="50"
                  value={formData.maxDailyBookingsPerService || ''}
                  onChange={(e) => onMaxBookingsChange(e.target.value)}
                  placeholder="10"
                  disabled={createLoading}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Maximum bookings per day for this service
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="is-active"
                  checked={formData.isActive}
                  onCheckedChange={onActiveChange}
                  disabled={createLoading}
                />
                <Label htmlFor="is-active">Service is active and bookable</Label>
              </div>
            </div>
          </div>
        );

      case 3: // Category & Locations
        return (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <Settings className="h-12 w-12 text-primary mx-auto mb-2" />
              <h3 className="text-lg font-medium">Category & Locations</h3>
              <p className="text-sm text-muted-foreground">
                Assign category and select available locations
              </p>
            </div>

            <div className="space-y-6">
              <div>
                <Label htmlFor="service-category">Service Category *</Label>
                
                {/* Category Search Bar */}
                <div className="relative mt-2">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search categories..."
                    value={categorySearchTerm}
                    onChange={(e) => setCategorySearchTerm(e.target.value)}
                    className="pl-10"
                    disabled={createLoading}
                  />
                </div>

                {/* Category Selection with Checkboxes */}
                <div className="mt-3 space-y-2 max-h-48 overflow-y-auto border rounded-md p-3">
                  {filteredCategories.length > 0 ? (
                    filteredCategories.map((category) => (
                      <div key={category.id} className="flex items-start space-x-2">
                        <Checkbox
                          id={`category-${category.id}`}
                          checked={formData.serviceCategoryId === category.id}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              onCategoryChange(category.id);
                            } else {
                              onCategoryChange('');
                            }
                          }}
                          disabled={createLoading}
                        />
                        <Label 
                          htmlFor={`category-${category.id}`}
                          className="flex-1 cursor-pointer"
                        >
                          <div>
                            <div className="font-medium">{category.name}</div>
                            {category.description && (
                              <div className="text-xs text-muted-foreground">
                                {category.description}
                              </div>
                            )}
                          </div>
                        </Label>
                      </div>
                    ))
                  ) : categorySearchTerm.trim() ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No categories found matching &ldquo;{categorySearchTerm}&rdquo;
                    </p>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No categories available. Create a category first.
                    </p>
                  )}
                </div>

                {/* Selected Category Display */}
                {formData.serviceCategoryId && (
                  <div className="mt-2">
                    <p className="text-xs text-muted-foreground mb-1">
                      Selected category:
                    </p>
                    {(() => {
                      const selectedCategory = categories.find(c => c.id === formData.serviceCategoryId);
                      return selectedCategory ? (
                        <Badge variant="default" className="text-xs">
                          {selectedCategory.name}
                        </Badge>
                      ) : null;
                    })()}
                  </div>
                )}
              </div>

              <div>
                <Label>Available Locations</Label>
                <div className="mt-2 space-y-2 max-h-48 overflow-y-auto">
                  {locations.length > 0 ? (
                    locations.map((location) => (
                      <div key={location.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`location-${location.id}`}
                          checked={formData.locationIds.includes(location.id)}
                          onCheckedChange={(checked) => 
                            handleLocationToggle(location.id, checked as boolean)
                          }
                          disabled={createLoading}
                        />
                        <Label 
                          htmlFor={`location-${location.id}`}
                          className="flex-1 cursor-pointer"
                        >
                          <div>
                            <div className="font-medium">{location.name}</div>
                            {location.address && (
                              <div className="text-xs text-muted-foreground">
                                {location.address}
                              </div>
                            )}
                          </div>
                        </Label>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No locations available. The service can be created without location assignments.
                    </p>
                  )}
                </div>
                {formData.locationIds.length > 0 && (
                  <div className="mt-2">
                    <p className="text-xs text-muted-foreground mb-1">
                      Selected locations:
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {formData.locationIds.map((locationId) => {
                        const location = locations.find(l => l.id === locationId);
                        return location ? (
                          <Badge key={locationId} variant="secondary" className="text-xs">
                            {location.name}
                          </Badge>
                        ) : null;
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      case 4: // Review
        return (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <Check className="h-12 w-12 text-primary mx-auto mb-2" />
              <h3 className="text-lg font-medium">Review Service Details</h3>
              <p className="text-sm text-muted-foreground">
                Please review the service information before creating
              </p>
            </div>

            <div className="space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Basic Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Name:</span>
                    <span className="text-sm font-medium">{formData.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Duration:</span>
                    <span className="text-sm">{formData.durationMinutes} minutes</span>
                  </div>
                  {formData.description && (
                    <div>
                      <span className="text-sm text-muted-foreground">Description:</span>
                      <p className="text-sm mt-1">{formData.description}</p>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Status:</span>
                    <Badge variant={formData.isActive ? "default" : "secondary"}>
                      {formData.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Timing Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Buffer Before:</span>
                      <span>{formData.bufferTimeBeforeMinutes || 0} min</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Buffer After:</span>
                      <span>{formData.bufferTimeAfterMinutes || 0} min</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Preparation:</span>
                      <span>{formData.preparationTimeMinutes || 0} min</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Cleanup:</span>
                      <span>{formData.cleanupTimeMinutes || 0} min</span>
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Max Daily Bookings:</span>
                    <span className="text-sm">{formData.maxDailyBookingsPerService || 'Unlimited'}</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Assignments</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Category:</span>
                    <span className="text-sm">
                      {categories.find(c => c.id === formData.serviceCategoryId)?.name || 'Not selected'}
                    </span>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">
                      Locations ({formData.locationIds.length}):
                    </span>
                    {formData.locationIds.length > 0 ? (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {formData.locationIds.map((locationId) => {
                          const location = locations.find(l => l.id === locationId);
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