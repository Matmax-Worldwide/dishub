'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription, DialogClose } from '@/components/ui/dialog'; // Using Dialog for modal
import { Location } from '@/types/calendar'; // Assuming a Location type definition
import { toast } from 'sonner';

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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>{initialData?.id ? 'Edit Location' : 'Create New Location'}</DialogTitle>
          <DialogDescription>
            {initialData?.id ? 'Update the details of this location.' : 'Fill in the details for the new location.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
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
          {formError && <p className="text-sm text-red-600">{formError}</p>}
          <DialogFooter>
            <DialogClose asChild>
                <Button type="button" variant="outline" onClick={onClose} disabled={isSaving}>
                    Cancel
                </Button>
            </DialogClose>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? (initialData?.id ? 'Saving...' : 'Creating...') : (initialData?.id ? 'Save Changes' : 'Create Location')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Define Location type if not already globally available (e.g. in types/calendar.ts)
// For the purpose of this component, a partial definition is fine.
declare module '@/types/calendar' {
  export interface Location {
    id: string;
    name: string;
    address?: string | null;
    phone?: string | null;
    operatingHours?: Record<string, unknown> | null; // Prisma Json can be any
    createdAt?: string | Date;
    updatedAt?: string | Date;
  }
}
