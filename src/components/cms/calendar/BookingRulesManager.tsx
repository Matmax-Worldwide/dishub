'use client';

import React, { useState, useEffect, useCallback } from 'react';
import graphqlClient from '@/lib/graphql-client';
import { BookingRule } from '@/types/calendar'; // Assuming this type is defined
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Save } from 'lucide-react';
import { toast } from 'sonner';

// Define a type for the form data, matching BookingRuleInput approximately
interface BookingRuleFormData {
  advanceBookingHoursMin: number;
  advanceBookingDaysMax: number;
  sameDayCutoffTime: string | null; // Nullable for optional input
  bufferBetweenAppointmentsMinutes: number;
  maxAppointmentsPerDayPerStaff: number | null; // Nullable
  bookingSlotIntervalMinutes: number;
}

const defaultBookingRuleValues: BookingRuleFormData = {
  advanceBookingHoursMin: 2,
  advanceBookingDaysMax: 30,
  sameDayCutoffTime: "14:00",
  bufferBetweenAppointmentsMinutes: 15,
  maxAppointmentsPerDayPerStaff: null,
  bookingSlotIntervalMinutes: 30,
};

export default function BookingRulesManager() {
  const [rules, setRules] = useState<Partial<BookingRuleFormData>>(defaultBookingRuleValues);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ruleId, setRuleId] = useState<string | null>(null); // To store ID of existing rule for update

  const fetchBookingRules = useCallback(async (showToast = false) => {
    setIsLoading(true);
    setError(null);
    try {
      const responseData = await graphqlClient.globalBookingRule(); // This should always return a rule
      if (responseData) {
        setRules({
          advanceBookingHoursMin: responseData.advanceBookingHoursMin,
          advanceBookingDaysMax: responseData.advanceBookingDaysMax,
          sameDayCutoffTime: responseData.sameDayCutoffTime || null,
          bufferBetweenAppointmentsMinutes: responseData.bufferBetweenAppointmentsMinutes,
          maxAppointmentsPerDayPerStaff: responseData.maxAppointmentsPerDayPerStaff || null,
          bookingSlotIntervalMinutes: responseData.bookingSlotIntervalMinutes,
        });
        setRuleId(responseData.id || null); // Store the ID
        if(showToast) toast.success("Booking rules loaded.");
      } else {
        // Should not happen if resolver creates default, but handle defensively
        setRules(defaultBookingRuleValues);
         if(showToast) toast.info("No existing booking rules found. Displaying defaults.");
      }
    } catch (err: any) {
      console.error('Failed to fetch booking rules:', err);
      const errorMsg = `Failed to load booking rules: ${err.message || 'Unknown error'}`;
      setError(errorMsg);
      if(showToast) toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBookingRules();
  }, [fetchBookingRules]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    let processedValue: string | number | null = value;
    if (type === 'number') {
      processedValue = value === '' ? null : parseInt(value, 10);
      if (name === 'maxAppointmentsPerDayPerStaff' && value === '') {
        processedValue = null; // Allow clearing optional number field
      } else if (isNaN(processedValue as number)) {
        processedValue = null; // or some other default or error state
      }
    } else if (name === 'sameDayCutoffTime' && value === '') {
        processedValue = null; // Allow clearing optional time field
    }
    setRules(prev => ({ ...prev, [name]: processedValue }));
  };

  const handleSelectChange = (name: keyof BookingRuleFormData, value: string) => {
    setRules(prev => ({ ...prev, [name]: parseInt(value, 10) }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);

    const inputForMutation = {
        ...rules,
        // Ensure numbers are numbers, and optional fields are null if empty
        advanceBookingHoursMin: Number(rules.advanceBookingHoursMin),
        advanceBookingDaysMax: Number(rules.advanceBookingDaysMax),
        bufferBetweenAppointmentsMinutes: Number(rules.bufferBetweenAppointmentsMinutes),
        bookingSlotIntervalMinutes: Number(rules.bookingSlotIntervalMinutes),
        maxAppointmentsPerDayPerStaff: rules.maxAppointmentsPerDayPerStaff ? Number(rules.maxAppointmentsPerDayPerStaff) : null,
        sameDayCutoffTime: rules.sameDayCutoffTime || null,
    };

    try {
      const updatedRules = await graphqlClient.upsertGlobalBookingRules({ input: inputForMutation });
      if (updatedRules) {
        setRules({ // Update state from response
            advanceBookingHoursMin: updatedRules.advanceBookingHoursMin,
            advanceBookingDaysMax: updatedRules.advanceBookingDaysMax,
            sameDayCutoffTime: updatedRules.sameDayCutoffTime || null,
            bufferBetweenAppointmentsMinutes: updatedRules.bufferBetweenAppointmentsMinutes,
            maxAppointmentsPerDayPerStaff: updatedRules.maxAppointmentsPerDayPerStaff || null,
            bookingSlotIntervalMinutes: updatedRules.bookingSlotIntervalMinutes,
        });
        setRuleId(updatedRules.id || null);
        toast.success('Global booking rules updated successfully!');
      }
    } catch (err: any) {
      console.error('Failed to save booking rules:', err);
      setError(`Failed to save rules: ${err.message || 'Unknown error'}`);
      toast.error(`Failed to save rules: ${err.message || 'Unknown error'}`);
    } finally {
      setIsSaving(false);
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <p className="ml-2">Loading booking rules...</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {error && (
         <div className="p-4 mb-4 text-sm text-red-700 bg-red-100 rounded-lg" role="alert">
           <span className="font-medium">Error:</span> {error}
         </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Booking Window</CardTitle>
          <CardDescription>Define how far in advance or how close to the time users can book.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="advanceBookingHoursMin">Minimum Advance Booking (Hours)</Label>
              <Input type="number" id="advanceBookingHoursMin" name="advanceBookingHoursMin" value={rules.advanceBookingHoursMin || ''} onChange={handleChange} disabled={isSaving} min="0" />
              <p className="text-xs text-muted-foreground mt-1">e.g., 2 hours. How close to an appointment can someone book?</p>
            </div>
            <div>
              <Label htmlFor="advanceBookingDaysMax">Maximum Advance Booking (Days)</Label>
              <Input type="number" id="advanceBookingDaysMax" name="advanceBookingDaysMax" value={rules.advanceBookingDaysMax || ''} onChange={handleChange} disabled={isSaving} min="1" />
              <p className="text-xs text-muted-foreground mt-1">e.g., 30 days. How far out can someone book?</p>
            </div>
          </div>
          <div>
            <Label htmlFor="sameDayCutoffTime">Same-Day Booking Cutoff Time (optional)</Label>
            <Input type="time" id="sameDayCutoffTime" name="sameDayCutoffTime" value={rules.sameDayCutoffTime || ''} onChange={handleChange} disabled={isSaving} />
            <p className="text-xs text-muted-foreground mt-1">e.g., 14:00. No same-day bookings after this time.</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Buffers & Intervals</CardTitle>
          <CardDescription>Manage time between appointments and how slots are displayed.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="bufferBetweenAppointmentsMinutes">Buffer Between Appointments (Minutes)</Label>
              <Input type="number" id="bufferBetweenAppointmentsMinutes" name="bufferBetweenAppointmentsMinutes" value={rules.bufferBetweenAppointmentsMinutes || ''} onChange={handleChange} disabled={isSaving} min="0" />
              <p className="text-xs text-muted-foreground mt-1">Time automatically added after each appointment.</p>
            </div>
            <div>
              <Label htmlFor="bookingSlotIntervalMinutes">Booking Slot Interval (Minutes)</Label>
              <Select value={String(rules.bookingSlotIntervalMinutes || 30)} onValueChange={(val) => handleSelectChange('bookingSlotIntervalMinutes', val)} disabled={isSaving}>
                <SelectTrigger id="bookingSlotIntervalMinutes"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="15">15 minutes</SelectItem>
                  <SelectItem value="30">30 minutes</SelectItem>
                  <SelectItem value="45">45 minutes</SelectItem>
                  <SelectItem value="60">60 minutes</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">Determines the start times of available slots (e.g., 9:00, 9:30, 10:00 for 30 min interval).</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Capacity (Optional)</CardTitle>
          <CardDescription>Set limits on booking capacity.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            <div>
              <Label htmlFor="maxAppointmentsPerDayPerStaff">Max Bookings Per Staff Per Day (optional)</Label>
              <Input type="number" id="maxAppointmentsPerDayPerStaff" name="maxAppointmentsPerDayPerStaff" value={rules.maxAppointmentsPerDayPerStaff || ''} onChange={handleChange} disabled={isSaving} min="0" placeholder="Leave blank for no limit" />
              <p className="text-xs text-muted-foreground mt-1">Maximum number of bookings a single staff member can handle in a day.</p>
            </div>
        </CardContent>
      </Card>

      <div className="flex justify-end pt-4">
        <Button type="submit" disabled={isSaving || isLoading}>
          {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Save Global Rules
        </Button>
      </div>
    </form>
  );
}

// Extend BookingRule type if not fully defined globally for form state
declare module '@/types/calendar' {
    export interface BookingRule {
        id: string;
        locationId?: string | null;
        advanceBookingHoursMin: number;
        advanceBookingDaysMax: number;
        sameDayCutoffTime?: string | null;
        bufferBetweenAppointmentsMinutes: number;
        maxAppointmentsPerDayPerStaff?: number | null;
        bookingSlotIntervalMinutes: number;
        createdAt?: string | Date;
        updatedAt?: string | Date;
        location?: Location | null;
    }
}
