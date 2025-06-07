'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Textarea } from '@/app/components/ui/textarea';
import { Location } from '@/types/calendar'; // Assuming a Location type definition
import { toast } from 'sonner';
import { X } from 'lucide-react';

interface LocationFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Partial<Location>) => Promise<void>; // Make onSave async to handle saving state
  initialData?: Partial<Location> | null;
  isSaving?: boolean;
}

const operatingHoursExample = `{
  "MONDAY": {"openTime": "09:00", "closeTime": "17:00", "isClosed": false},
  "TUESDAY": {"openTime": "09:00", "closeTime": "17:00", "isClosed": false},
  "WEDNESDAY": {"openTime": "09:00", "closeTime": "17:00", "isClosed": false},
  "THURSDAY": {"openTime": "09:00", "closeTime": "17:00", "isClosed": false},
  "FRIDAY": {"openTime": "09:00", "closeTime": "17:00", "isClosed": false},
  "SATURDAY": {"openTime": "10:00", "closeTime": "14:00", "isClosed": true},
  "SUNDAY": {"isClosed": true}
}`;

export default function LocationForm({ isOpen, onClose, onSave, initialData, isSaving }: LocationFormProps) {
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [operatingHoursStr, setOperatingHoursStr] = useState(operatingHoursExample);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) {
      setName(initialData.name || '');
      setAddress(initialData.address || '');
      setPhone(initialData.phone || '');
      if (initialData.operatingHours) {
        try {
          setOperatingHoursStr(JSON.stringify(initialData.operatingHours, null, 2));
        } catch (error) {
          console.error("Error stringifying operating hours:", error);
          setOperatingHoursStr(operatingHoursExample); // Fallback to example
          toast.error("Error loading operating hours format.");
        }
      } else {
        setOperatingHoursStr(operatingHoursExample);
      }
    } else {
      // Defaults for new location
      setName('');
      setAddress('');
      setPhone('');
      setOperatingHoursStr(operatingHoursExample);
    }
    setFormError(null); // Clear error when initialData changes or form opens
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!name.trim()) {
      setFormError('Location name is required.');
      toast.error('Location name is required.');
      return;
    }

    let parsedOperatingHours = null;
    try {
      if (operatingHoursStr.trim() !== '') {
        parsedOperatingHours = JSON.parse(operatingHoursStr);
      }
    } catch {
      setFormError('Operating hours JSON is invalid. Please check the format.');
      toast.error('Operating hours JSON is invalid.');
      return;
    }

    const saveData: Partial<Location> = {
      name,
      address: address.trim() || null,
      phone: phone.trim() || null,
      operatingHours: parsedOperatingHours,
    };
    
    if (initialData?.id) {
        saveData.id = initialData.id;
    }

    await onSave(saveData);
    // onClose will be called by parent if save is successful
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
      <div className="relative w-full max-w-2xl max-h-[90vh] bg-white rounded-lg shadow-xl border border-gray-200 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              {initialData?.id ? 'Edit Location' : 'Add New Location'}
            </h2>
            <p className="text-sm text-gray-500">
              {initialData?.id ? 'Update location information' : 'Create a new business location'}
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
            <div>
              <Label htmlFor="name">Location Name <span className="text-red-500">*</span></Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Downtown Clinic"
                disabled={isSaving}
              />
            </div>
            <div>
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="e.g., 123 Main St, Anytown"
                disabled={isSaving}
              />
            </div>
            <div>
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g., (555) 123-4567"
                disabled={isSaving}
              />
            </div>
            <div>
              <Label htmlFor="operatingHours">Operating Hours (JSON format)</Label>
              <Textarea
                id="operatingHours"
                value={operatingHoursStr}
                onChange={(e) => setOperatingHoursStr(e.target.value)}
                rows={10}
                placeholder={operatingHoursExample}
                className="font-mono text-sm"
                disabled={isSaving}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Use format like: {"{\"DAY_OF_WEEK\": {\"openTime\": \"HH:MM\", \"closeTime\": \"HH:MM\", \"isClosed\": boolean}}"}
              </p>
            </div>
            {formError && (
              <div className="p-4 text-sm text-red-700 bg-red-100 rounded-lg border border-red-200">
                {formError}
              </div>
            )}
          </form>
        </div>

        {/* Footer - Fixed */}
        <div className="flex justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50 flex-shrink-0">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button 
            type="submit" 
            onClick={handleSubmit} 
            disabled={isSaving || !name.trim()}
          >
            {isSaving ? 'Saving...' : (initialData?.id ? 'Update Location' : 'Create Location')}
          </Button>
        </div>
      </div>
    </div>
  );
}
