'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch'; // For multi-select items if needed
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription, DialogClose } from '@/components/ui/dialog';
import { StaffProfile, User, Service, Location, StaffScheduleInput, StaffSchedule, PrismaDayOfWeek, PrismaScheduleType } from '@/types/calendar';
import WeeklyScheduleEditor from './WeeklyScheduleEditor';
import { toast } from 'sonner';
import { ScrollArea } from '@/components/ui/scroll-area';

interface StaffFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: { staffProfileData: Partial<StaffProfile>; scheduleData: Partial<StaffScheduleInput>[] }) => Promise<void>;
  initialData?: Partial<StaffProfile> & { schedules?: Partial<StaffScheduleInput>[] }; // StaffProfile might include schedules
  allUsersForSelect?: Partial<User>[]; // Users not yet staff
  allServices?: Service[];
  allLocations?: Location[];
  isSaving?: boolean;
}

const defaultStaffValues: Partial<StaffProfile> = {
  userId: '',
  bio: '',
  specializations: [],
  assignedServiceIds: [],
  assignedLocationIds: [],
};

export default function StaffForm({
  isOpen,
  onClose,
  onSave,
  initialData,
  allUsersForSelect = [],
  allServices = [],
  allLocations = [],
  isSaving
}: StaffFormProps) {
  const [formData, setFormData] = useState<Partial<StaffProfile>>(defaultStaffValues);
  const [specializationsStr, setSpecializationsStr] = useState('');
  const [scheduleData, setScheduleData] = useState<Partial<StaffScheduleInput>[]>([]);
  const [formError, setFormError] = useState<string | null>(null);

  const getInitialSchedule = useCallback(() => {
    const regularHours = initialData?.schedules?.filter((s: StaffSchedule) => s.scheduleType === PrismaScheduleType.REGULAR_HOURS) || [];
    // Ensure all days are present, using defaults for missing ones
    return OrderedDays.map(day => {
        const existing = regularHours.find((s: StaffSchedule) => s.dayOfWeek === day);
        if (existing) return existing;
        const isWeekend = day === PrismaDayOfWeek.SATURDAY || day === PrismaDayOfWeek.SUNDAY;
        return {
            dayOfWeek: day,
            startTime: isWeekend ? '' : '09:00',
            endTime: isWeekend ? '' : '17:00',
            isAvailable: !isWeekend,
            scheduleType: PrismaScheduleType.REGULAR_HOURS,
        };
    });
  }, [initialData]);

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setFormData({
          ...defaultStaffValues,
          ...initialData,
          assignedServiceIds: initialData.assignedServices?.reduce((acc: string[], s) => {
            if (s.id) acc.push(s.id);
            return acc;
          }, []) || [],
          assignedLocationIds: initialData.locationAssignments?.reduce((acc: string[], l) => {
            if (l.id) acc.push(l.id);
            return acc;
          }, []) || [],
        });
        setSpecializationsStr((initialData.specializations || []).join(', '));
        setScheduleData(getInitialSchedule());
      } else {
        setFormData(defaultStaffValues);
        setSpecializationsStr('');
        setScheduleData(getInitialSchedule());
      }
      setFormError(null);
    }
  }, [initialData, isOpen, getInitialSchedule]);

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev: Partial<StaffProfile>) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: keyof StaffProfile, value: string) => {
    setFormData((prev: Partial<StaffProfile>) => ({ ...prev, [name]: value }));
  };

  const handleMultiSelectToggle = (type: 'assignedServiceIds' | 'assignedLocationIds', itemId: string) => {
    setFormData((prev: Partial<StaffProfile>) => {
      const currentItems = (prev[type] as string[] || []);
      if (currentItems.includes(itemId)) {
        return { ...prev, [type]: currentItems.filter(id => id !== itemId) };
      } else {
        return { ...prev, [type]: [...currentItems, itemId] };
      }
    });
  };

  const handleSpecializationsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSpecializationsStr(e.target.value);
    setFormData((prev: Partial<StaffProfile>) => ({ ...prev, specializations: e.target.value.split(',').map(s => s.trim()).filter(s => s) }));
  };

  const handleScheduleUpdate = (newSchedule: Partial<StaffScheduleInput>[]) => {
    setScheduleData(newSchedule);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formData.userId) {
      setFormError('Please select a user.');
      toast.error('Please select a user.');
      return;
    }

    const staffProfileData: Partial<StaffProfile> = {
      userId: formData.userId,
      bio: formData.bio,
      specializations: formData.specializations,
    };

    await onSave({ staffProfileData, scheduleData });
  };

  const OrderedDays: PrismaDayOfWeek[] = [
    PrismaDayOfWeek.MONDAY, PrismaDayOfWeek.TUESDAY, PrismaDayOfWeek.WEDNESDAY, 
    PrismaDayOfWeek.THURSDAY, PrismaDayOfWeek.FRIDAY, PrismaDayOfWeek.SATURDAY, PrismaDayOfWeek.SUNDAY
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initialData?.id ? 'Edit Staff Member' : 'Add New Staff Member'}</DialogTitle>
          <DialogDescription>
            {initialData?.id ? 'Update staff member details and schedule.' : 'Create a new staff member and set their schedule.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="userId">Select User <span className="text-red-500">*</span></Label>
              <Select value={formData.userId || ''} onValueChange={(val) => handleSelectChange('userId', val)} disabled={isSaving || !!initialData?.id}>
                <SelectTrigger><SelectValue placeholder="Choose a user" /></SelectTrigger>
                <SelectContent>
                  {allUsersForSelect.map(user => (
                    <SelectItem key={user.id} value={user.id!}>
                      {user.firstName} {user.lastName} ({user.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {initialData?.id && <p className="text-xs text-muted-foreground mt-1">User cannot be changed when editing.</p>}
            </div>
            <div>
              <Label htmlFor="specializations">Specializations (comma-separated)</Label>
              <Input
                id="specializations"
                value={specializationsStr}
                onChange={handleSpecializationsChange}
                placeholder="e.g., Massage Therapy, Physical Therapy"
                disabled={isSaving}
              />
            </div>
          </div>
          <div>
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              name="bio"
              value={formData.bio || ''}
              onChange={handleChange}
              rows={3}
              placeholder="Brief description about the staff member..."
              disabled={isSaving}
            />
          </div>

          {/* Service Assignment */}
          <div className="border-t pt-4">
            <Label className="block text-base font-medium mb-2">Assign Services</Label>
            <ScrollArea className="h-32 border rounded-md p-2">
              <div className="space-y-2">
                {allServices.map(service => (
                  <div key={service.id} className="flex items-center space-x-2">
                    <Switch
                      id={`service-${service.id}`}
                      checked={(formData.assignedServiceIds || []).includes(service.id)}
                      onCheckedChange={() => handleMultiSelectToggle('assignedServiceIds', service.id)}
                      disabled={isSaving}
                    />
                    <Label htmlFor={`service-${service.id}`} className="font-normal">{service.name}</Label>
                  </div>
                ))}
                {allServices.length === 0 && <p className="text-sm text-muted-foreground">No services available.</p>}
              </div>
            </ScrollArea>
          </div>

          {/* Location Assignment */}
          <div className="border-t pt-4">
            <Label className="block text-base font-medium mb-2">Assign Locations</Label>
            <ScrollArea className="h-32 border rounded-md p-2">
              <div className="space-y-2">
                {allLocations.map(location => (
                  <div key={location.id} className="flex items-center space-x-2">
                    <Switch
                      id={`location-${location.id}`}
                      checked={(formData.assignedLocationIds || []).includes(location.id)}
                      onCheckedChange={() => handleMultiSelectToggle('assignedLocationIds', location.id)}
                      disabled={isSaving}
                    />
                    <Label htmlFor={`location-${location.id}`} className="font-normal">{location.name}</Label>
                  </div>
                ))}
                {allLocations.length === 0 && <p className="text-sm text-muted-foreground">No locations available.</p>}
              </div>
            </ScrollArea>
          </div>

          {/* Weekly Schedule */}
          <div className="border-t pt-4">
            <Label className="block text-base font-medium mb-2">Weekly Schedule</Label>
            <WeeklyScheduleEditor
              initialSchedule={scheduleData}
              onChange={handleScheduleUpdate}
              disabled={isSaving}
            />
          </div>

          {formError && <p className="text-sm text-red-600">{formError}</p>}
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" onClick={onClose} disabled={isSaving}>Cancel</Button>
            </DialogClose>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? (initialData?.id ? 'Saving...' : 'Creating...') : (initialData?.id ? 'Save Changes' : 'Create Staff')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
