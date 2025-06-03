'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Service, ServiceCategory, Location } from '@/types/calendar'; // Assuming type definitions
import { toast } from 'sonner';
import { ScrollArea } from '@/components/ui/scroll-area'; // For location list
import { X } from 'lucide-react';

interface ServiceFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Partial<Service>) => Promise<void>;
  initialData?: Partial<Service> | null;
  allCategories?: ServiceCategory[];
  allLocations?: Location[];
  isSaving?: boolean;
}

const defaultServiceValues: Partial<Service> = {
  name: '',
  description: '',
  durationMinutes: 30,
  bufferTimeBeforeMinutes: 0,
  bufferTimeAfterMinutes: 0,
  preparationTimeMinutes: 0,
  cleanupTimeMinutes: 0,
  maxDailyBookingsPerService: null,
  isActive: true,
  serviceCategoryId: undefined,
  locationIds: [],
};

export default function ServiceForm({
  isOpen,
  onClose,
  onSave,
  initialData,
  allCategories = [],
  allLocations = [],
  isSaving
}: ServiceFormProps) {
  const [formData, setFormData] = useState<Partial<Service>>(defaultServiceValues);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [formError, setFormError] = useState<string | null>(null);

  // Debug logging for categories
  useEffect(() => {
    console.log('ServiceForm: allCategories prop changed:', allCategories);
    console.log('ServiceForm: allCategories length:', allCategories?.length || 0);
    console.log('ServiceForm: allCategories content:', JSON.stringify(allCategories, null, 2));
  }, [allCategories]);

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setFormData({
          ...defaultServiceValues, // Start with defaults
          ...initialData, // Override with initialData
          // Ensure locationIds is an array of strings, even if initialData.locations provides full objects
          locationIds: initialData.locations?.map(loc => loc.id) || [], 
        });
        // Initialize selected categories - for now, use single category if exists
        setSelectedCategoryIds(initialData.serviceCategoryId ? [initialData.serviceCategoryId] : []);
      } else {
        setFormData(defaultServiceValues);
        setSelectedCategoryIds([]);
      }
      setFormError(null);
    }
  }, [initialData, isOpen]);

  // Handle escape key to close
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    let processedValue: string | number | boolean = value;
    if (type === 'number') {
      processedValue = value === '' ? '' : parseFloat(value);
    }
    
    setFormData(prev => ({ ...prev, [name]: processedValue }));
  };

  
  const handleSwitchChange = (name: keyof Service, checked: boolean) => {
    setFormData(prev => ({ ...prev, [name]: checked }));
  };

  const handleCategoryToggle = (categoryId: string) => {
    setSelectedCategoryIds(prev => {
      if (prev.includes(categoryId)) {
        return prev.filter(id => id !== categoryId);
      } else {
        return [...prev, categoryId];
      }
    });
  };

  const handleLocationToggle = (locationId: string) => {
    setFormData(prev => {
      const currentLocations = prev.locationIds || [];
      if (currentLocations.includes(locationId)) {
        return { ...prev, locationIds: currentLocations.filter(id => id !== locationId) };
      } else {
        return { ...prev, locationIds: [...currentLocations, locationId] };
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formData.name?.trim()) {
      setFormError('Service name is required.');
      toast.error('Service name is required.');
      return;
    }
    if (selectedCategoryIds.length === 0) {
      setFormError('At least one service category is required.');
      toast.error('At least one service category is required.');
      return;
    }
    if (formData.durationMinutes == null || formData.durationMinutes <= 0) {
        setFormError('Duration must be a positive number.');
        toast.error('Duration must be a positive number.');
        return;
    }

    const dataToSave: Partial<Service> = { 
      ...formData,
      // For now, use the first selected category as the primary category
      serviceCategoryId: selectedCategoryIds[0]
    };
    if (initialData?.id) {
        dataToSave.id = initialData.id;
    }
    // Ensure numeric fields are numbers or null
    dataToSave.durationMinutes = Number(dataToSave.durationMinutes) || 0;
    
    dataToSave.bufferTimeBeforeMinutes = Number(dataToSave.bufferTimeBeforeMinutes) || 0;
    dataToSave.bufferTimeAfterMinutes = Number(dataToSave.bufferTimeAfterMinutes) || 0;
    dataToSave.preparationTimeMinutes = Number(dataToSave.preparationTimeMinutes) || 0;
    dataToSave.cleanupTimeMinutes = Number(dataToSave.cleanupTimeMinutes) || 0;
    dataToSave.maxDailyBookingsPerService = dataToSave.maxDailyBookingsPerService ? Number(dataToSave.maxDailyBookingsPerService) : null;

    await onSave(dataToSave);
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-white rounded-lg shadow-xl border border-gray-200 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              {initialData?.id ? 'Edit Service' : 'Add New Service'}
            </h2>
            <p className="text-sm text-gray-500">
              {initialData?.id ? 'Update service information' : 'Create a new service for your business'}
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

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto">
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Error Display */}
            {formError && (
              <div className="p-4 text-sm text-red-700 bg-red-100 rounded-lg border border-red-200">
                {formError}
              </div>
            )}

            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Service Name <span className="text-red-500">*</span></Label>
                <Input id="name" name="name" value={formData.name} onChange={handleChange} disabled={isSaving} />
              </div>
              <div>
                <Label className="text-base font-medium">Categories <span className="text-red-500">*</span></Label>
                <p className="text-sm text-gray-500 mb-3">Select which categories this service belongs to</p>
                <ScrollArea className="h-32 w-full border rounded-md p-3">
                  <div className="space-y-2">
                    {allCategories?.map(category => (
                      <div key={category.id} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={`category-${category.id}`}
                          checked={selectedCategoryIds.includes(category.id)}
                          onChange={() => handleCategoryToggle(category.id)}
                          disabled={isSaving}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <Label htmlFor={`category-${category.id}`} className="text-sm font-normal cursor-pointer">
                          {category.name}
                        </Label>
                      </div>
                    ))}
                    {(!allCategories || allCategories.length === 0) && (
                      <p className="text-sm text-gray-500">No categories available</p>
                    )}
                  </div>
                </ScrollArea>
                {(!allCategories || allCategories.length === 0) && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Please create a service category first before adding services.
                  </p>
                )}
              </div>
            </div>
            
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" name="description" value={formData.description || ''} onChange={handleChange} rows={3} disabled={isSaving} />
            </div>

            {/* Timing */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="durationMinutes">Duration (minutes) <span className="text-red-500">*</span></Label>
                <Input id="durationMinutes" name="durationMinutes" type="number" value={formData.durationMinutes || ''} onChange={handleChange} disabled={isSaving} />
              </div>
            </div>
            
            {/* Buffer & Prep Times */}
            <details className="group">
              <summary className="text-sm font-medium text-gray-700 cursor-pointer group-open:mb-2">Advanced Timing (Buffers, Prep)</summary>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2 border-t mt-2">
                <div>
                  <Label htmlFor="bufferTimeBeforeMinutes">Buffer Before (min)</Label>
                  <Input id="bufferTimeBeforeMinutes" name="bufferTimeBeforeMinutes" type="number" value={formData.bufferTimeBeforeMinutes || ''} onChange={handleChange} disabled={isSaving} />
                </div>
                <div>
                  <Label htmlFor="bufferTimeAfterMinutes">Buffer After (min)</Label>
                  <Input id="bufferTimeAfterMinutes" name="bufferTimeAfterMinutes" type="number" value={formData.bufferTimeAfterMinutes || ''} onChange={handleChange} disabled={isSaving} />
                </div>
                <div>
                  <Label htmlFor="preparationTimeMinutes">Prep Time (min)</Label>
                  <Input id="preparationTimeMinutes" name="preparationTimeMinutes" type="number" value={formData.preparationTimeMinutes || ''} onChange={handleChange} disabled={isSaving} />
                </div>
                <div>
                  <Label htmlFor="cleanupTimeMinutes">Cleanup Time (min)</Label>
                  <Input id="cleanupTimeMinutes" name="cleanupTimeMinutes" type="number" value={formData.cleanupTimeMinutes || ''} onChange={handleChange} disabled={isSaving} />
                </div>
              </div>
            </details>

            {/* Other Settings */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t pt-4">
              <div>
                <Label htmlFor="maxDailyBookingsPerService">Max Daily Bookings</Label>
                <Input id="maxDailyBookingsPerService" name="maxDailyBookingsPerService" type="number" value={formData.maxDailyBookingsPerService || ''} onChange={handleChange} disabled={isSaving} />
              </div>
              <div className="flex items-center space-x-2">
                <Switch 
                  id="isActive" 
                  checked={formData.isActive ?? true} 
                  onCheckedChange={(checked) => handleSwitchChange('isActive', checked)}
                  disabled={isSaving}
                />
                <Label htmlFor="isActive">Service is active</Label>
              </div>
            </div>

            {/* Location Assignment */}
            <div className="border-t pt-4">
              <Label className="text-base font-medium">Available Locations</Label>
              <p className="text-sm text-gray-500 mb-3">Select which locations offer this service</p>
              <ScrollArea className="h-32 w-full border rounded-md p-3">
                <div className="space-y-2">
                  {allLocations?.map(location => (
                    <div key={location.id} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={`location-${location.id}`}
                        checked={(formData.locationIds || []).includes(location.id)}
                        onChange={() => handleLocationToggle(location.id)}
                        disabled={isSaving}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <Label htmlFor={`location-${location.id}`} className="text-sm font-normal cursor-pointer">
                        {location.name}
                      </Label>
                    </div>
                  ))}
                  {(!allLocations || allLocations.length === 0) && (
                    <p className="text-sm text-gray-500">No locations available</p>
                  )}
                </div>
              </ScrollArea>
            </div>
          </form>
        </div>

        {/* Footer - Fixed */}
        <div className="flex justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50 flex-shrink-0">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button 
            type="submit" 
            disabled={isSaving || !formData.name?.trim() || selectedCategoryIds.length === 0}
            onClick={handleSubmit}
          >
            {isSaving ? 'Saving...' : (initialData?.id ? 'Update Service' : 'Create Service')}
          </Button>
        </div>
      </div>
    </div>
  );
}
