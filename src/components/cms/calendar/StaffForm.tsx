'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch'; // For multi-select items if needed
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription, DialogClose } from '@/components/ui/dialog';
import { CalendarStaffProfile as StaffProfile, CalendarUser as User, CalendarService as Service, CalendarLocation as Location, CalendarStaffScheduleInput as StaffScheduleInput, PrismaDayOfWeek, PrismaScheduleType } from '@/types/calendar'; // Assuming types
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
    const regularHours = initialData?.schedules?.filter(s => s.scheduleType === PrismaScheduleType.REGULAR_HOURS) || [];
    // Ensure all days are present, using defaults for missing ones
    return OrderedDays.map(day => {
        const existing = regularHours.find(s => s.dayOfWeek === day);
        if (existing) return existing;
        const isWeekend = day === PrismaDayOfWeek.SATURDAY || day === PrismaDayOfWeek.SUNDAY;
        return {
            dayOfWeek: day,
            startTime: "09:00",
            endTime: "17:00",
            isAvailable: !isWeekend,
            scheduleType: PrismaScheduleType.REGULAR_HOURS,
        };
    });
  }, [initialData?.schedules]);

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setFormData({
          ...defaultStaffValues,
          ...initialData,
          assignedServiceIds: initialData.assignedServices?.map(s => s.id) || [],
          assignedLocationIds: initialData.locationAssignments?.map(l => l.id) || [],
        });
        setSpecializationsStr((initialData.specializations || []).join(', '));
        setScheduleData(getInitialSchedule());
      } else {
        setFormData(defaultStaffValues);
        setSpecializationsStr('');
        setScheduleData(getInitialSchedule()); // For default schedule on new staff
      }
      setFormError(null);
    }
  }, [initialData, isOpen, getInitialSchedule]);

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: keyof StaffProfile, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleMultiSelectToggle = (type: 'assignedServiceIds' | 'assignedLocationIds', itemId: string) => {
    setFormData(prev => {
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
    setFormData(prev => ({ ...prev, specializations: e.target.value.split(',').map(s => s.trim()).filter(s => s) }));
  };

  const handleScheduleUpdate = (newSchedule: Partial<StaffScheduleInput>[]) => {
    setScheduleData(newSchedule);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formData.userId && !initialData?.userId) { // userId is crucial
      setFormError('User selection is required to create a staff profile.');
      toast.error('User selection is required.');
      return;
    }

    const staffProfileData: Partial<StaffProfile> = {
      ...formData,
      specializations: specializationsStr.split(',').map(s => s.trim()).filter(s => s),
    };
     if (initialData?.id) { // For updates
        staffProfileData.id = initialData.id;
    }


    await onSave({ staffProfileData, scheduleData });
  };
  
  const OrderedDays: PrismaDayOfWeek[] = [
    PrismaDayOfWeek.MONDAY, PrismaDayOfWeek.TUESDAY, PrismaDayOfWeek.WEDNESDAY, 
    PrismaDayOfWeek.THURSDAY, PrismaDayOfWeek.FRIDAY, PrismaDayOfWeek.SATURDAY, PrismaDayOfWeek.SUNDAY
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-3xl"> {/* Wider modal */}
        <DialogHeader>
          <DialogTitle>{initialData?.id ? 'Edit Staff Member' : 'Create New Staff Member'}</DialogTitle>
          <DialogDescription>
            {initialData?.id ? 'Update details for this staff member.' : 'Fill in details for the new staff member.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6 py-4 max-h-[80vh] overflow-y-auto pr-2">
          {/* User Selection (only for create) */}
          {!initialData?.id && (
            <div>
              <Label htmlFor="userId">Select User <span className="text-red-500">*</span></Label>
              <Select value={formData.userId} onValueChange={(val) => handleSelectChange('userId', val)} disabled={isSaving || !!initialData?.id}>
                <SelectTrigger><SelectValue placeholder="Select a user to make staff" /></SelectTrigger>
                <SelectContent>
                  {allUsersForSelect?.map(user => <SelectItem key={user.id!} value={user.id!}>{user.firstName} {user.lastName} ({user.email})</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}
          {initialData?.user && ( // Display selected user when editing
            <div>
                <Label>Staff User</Label>
                <Input value={`${initialData.user.firstName} ${initialData.user.lastName} (${initialData.user.email})`} disabled />
            </div>
          )}


          <div>
            <Label htmlFor="bio">Bio / Profile Overview</Label>
            <Textarea id="bio" name="bio" value={formData.bio || ''} onChange={handleChange} rows={3} disabled={isSaving} />
          </div>

          <div>
            <Label htmlFor="specializationsStr">Specializations (comma-separated)</Label>
            <Input id="specializationsStr" name="specializationsStr" value={specializationsStr} onChange={handleSpecializationsChange} disabled={isSaving} placeholder="e.g., Cutting, Coloring, Deep Tissue" />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Assigned Services */}
            <div>
              <Label className="block text-base font-medium mb-2">Assign Services</Label>
              <ScrollArea className="h-48 border rounded-md p-3">
                <div className="space-y-2">
                  {allServices?.map(service => (
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
                  {allServices?.length === 0 && <p className="text-sm text-muted-foreground">No services available.</p>}
                </div>
              </ScrollArea>
            </div>

            {/* Assigned Locations */}
            <div>
              <Label className="block text-base font-medium mb-2">Assign Locations</Label>
              <ScrollArea className="h-48 border rounded-md p-3">
                <div className="space-y-2">
                  {allLocations?.map(loc => (
                    <div key={loc.id} className="flex items-center space-x-2">
                      <Switch
                        id={`loc-${loc.id}`}
                        checked={(formData.assignedLocationIds || []).includes(loc.id)}
                        onCheckedChange={() => handleMultiSelectToggle('assignedLocationIds', loc.id)}
                        disabled={isSaving}
                      />
                      <Label htmlFor={`loc-${loc.id}`} className="font-normal">{loc.name}</Label>
                    </div>
                  ))}
                  {allLocations?.length === 0 && <p className="text-sm text-muted-foreground">No locations available.</p>}
                </div>
              </ScrollArea>
            </div>
          </div>

          {/* Weekly Schedule Editor */}
          <WeeklyScheduleEditor 
            initialSchedule={scheduleData} 
            onChange={handleScheduleUpdate}
            disabled={isSaving}
          />

          {formError && <p className="text-sm text-red-600">{formError}</p>}
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" onClick={onClose} disabled={isSaving}>Cancel</Button>
            </DialogClose>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? (initialData?.id ? 'Saving Staff...' : 'Creating Staff...') : (initialData?.id ? 'Save Changes' : 'Create Staff Member')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Extend types for props if not fully defined globally
declare module '@/types/calendar' {
    export interface User { // Basic User structure for selection
        id: string;
        firstName?: string | null;
        lastName?: string | null;
        email: string;
    }
    export interface StaffProfile {
        id: string;
        userId: string;
        user?: Partial<User>; // For displaying name/email when editing
        bio?: string | null;
        specializations?: string[];
        assignedServiceIds?: string[]; // Used in form state
        assignedLocationIds?: string[]; // Used in form state
        assignedServices?: Partial<Service>[]; // For initialData mapping
        locationAssignments?: Partial<Location>[]; // For initialData mapping
        schedules?: Partial<StaffScheduleInput>[];
    }
}
