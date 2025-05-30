'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription, DialogClose } from '@/components/ui/dialog';
import { Service, ServiceCategory, Location } from '@/types/calendar'; // Assuming type definitions
import { toast } from 'sonner';
import { ScrollArea } from '@/components/ui/scroll-area'; // For location list

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
  price: 0,
  bufferTimeBeforeMinutes: 0,
  bufferTimeAfterMinutes: 0,
  preparationTimeMinutes: 0,
  cleanupTimeMinutes: 0,
  maxDailyBookingsPerService: null,
  isActive: true,
  serviceCategoryId: '',
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
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setFormData({
          ...defaultServiceValues, // Start with defaults
          ...initialData, // Override with initialData
          // Ensure locationIds is an array of strings, even if initialData.locations provides full objects
          locationIds: initialData.locations?.map(loc => loc.id) || [], 
        });
      } else {
        setFormData(defaultServiceValues);
      }
      setFormError(null);
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    let processedValue: string | number | boolean = value;
    if (type === 'number') {
      processedValue = value === '' ? '' : parseFloat(value);
    }
    setFormData(prev => ({ ...prev, [name]: processedValue }));
  };

  const handleSelectChange = (name: keyof Service, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSwitchChange = (name: keyof Service, checked: boolean) => {
    setFormData(prev => ({ ...prev, [name]: checked }));
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
    if (!formData.serviceCategoryId) {
      setFormError('Service category is required.');
      toast.error('Service category is required.');
      return;
    }
    if (formData.durationMinutes == null || formData.durationMinutes <= 0) {
        setFormError('Duration must be a positive number.');
        toast.error('Duration must be a positive number.');
        return;
    }
     if (formData.price == null || formData.price < 0) {
        setFormError('Price must be a non-negative number.');
        toast.error('Price must be a non-negative number.');
        return;
    }

    const dataToSave: Partial<Service> = { ...formData };
    if (initialData?.id) {
        dataToSave.id = initialData.id;
    }
    // Ensure numeric fields are numbers or null
    dataToSave.durationMinutes = Number(dataToSave.durationMinutes) || 0;
    dataToSave.price = Number(dataToSave.price) || 0;
    dataToSave.bufferTimeBeforeMinutes = Number(dataToSave.bufferTimeBeforeMinutes) || 0;
    dataToSave.bufferTimeAfterMinutes = Number(dataToSave.bufferTimeAfterMinutes) || 0;
    dataToSave.preparationTimeMinutes = Number(dataToSave.preparationTimeMinutes) || 0;
    dataToSave.cleanupTimeMinutes = Number(dataToSave.cleanupTimeMinutes) || 0;
    dataToSave.maxDailyBookingsPerService = dataToSave.maxDailyBookingsPerService ? Number(dataToSave.maxDailyBookingsPerService) : null;


    await onSave(dataToSave);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl"> {/* Wider modal for more fields */}
        <DialogHeader>
          <DialogTitle>{initialData?.id ? 'Edit Service' : 'Create New Service'}</DialogTitle>
          <DialogDescription>
            {initialData?.id ? 'Update the details of this service.' : 'Fill in the details for the new service.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4 max-h-[70vh] overflow-y-auto pr-2">
          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Service Name <span className="text-red-500">*</span></Label>
              <Input id="name" name="name" value={formData.name} onChange={handleChange} disabled={isSaving} />
            </div>
            <div>
              <Label htmlFor="serviceCategoryId">Category <span className="text-red-500">*</span></Label>
              <Select value={formData.serviceCategoryId || ''} onValueChange={(val) => handleSelectChange('serviceCategoryId', val)} disabled={isSaving}>
                <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                <SelectContent>
                  {allCategories?.map(cat => <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" name="description" value={formData.description || ''} onChange={handleChange} rows={3} disabled={isSaving} />
          </div>

          {/* Timing & Price */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="durationMinutes">Duration (minutes) <span className="text-red-500">*</span></Label>
              <Input id="durationMinutes" name="durationMinutes" type="number" value={formData.durationMinutes || ''} onChange={handleChange} disabled={isSaving} />
            </div>
            <div>
              <Label htmlFor="price">Price <span className="text-red-500">*</span></Label>
              <Input id="price" name="price" type="number" step="0.01" value={formData.price || ''} onChange={handleChange} disabled={isSaving} />
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
              <Label htmlFor="maxDailyBookingsPerService">Max Daily Bookings (optional)</Label>
              <Input id="maxDailyBookingsPerService" name="maxDailyBookingsPerService" type="number" value={formData.maxDailyBookingsPerService || ''} onChange={handleChange} disabled={isSaving} />
            </div>
             <div className="flex items-center space-x-2 pt-6">
                <Switch id="isActive" checked={formData.isActive ?? true} onCheckedChange={(val) => handleSwitchChange('isActive', val)} disabled={isSaving} />
                <Label htmlFor="isActive">Service is Active</Label>
            </div>
          </div>

          {/* Location Assignment */}
          <div className="border-t pt-4">
            <Label className="block text-base font-medium mb-2">Assign to Locations</Label>
            <ScrollArea className="h-40 border rounded-md p-2">
              <div className="space-y-2">
                {allLocations?.map(loc => (
                  <div key={loc.id} className="flex items-center space-x-2">
                    <Switch
                      id={`loc-${loc.id}`}
                      checked={(formData.locationIds || []).includes(loc.id)}
                      onCheckedChange={() => handleLocationToggle(loc.id)}
                      disabled={isSaving}
                    />
                    <Label htmlFor={`loc-${loc.id}`} className="font-normal">{loc.name}</Label>
                  </div>
                ))}
                {allLocations?.length === 0 && <p className="text-sm text-muted-foreground">No locations available. Please create locations first.</p>}
              </div>
            </ScrollArea>
          </div>

          {formError && <p className="text-sm text-red-600">{formError}</p>}
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" onClick={onClose} disabled={isSaving}>Cancel</Button>
            </DialogClose>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? (initialData?.id ? 'Saving...' : 'Creating...') : (initialData?.id ? 'Save Changes' : 'Create Service')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
