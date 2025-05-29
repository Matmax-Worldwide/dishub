'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { StaffScheduleInput, DayOfWeek, ScheduleType } from '@/types/calendar'; // Assuming these types/enums are defined

// Local DayOfWeek enum for UI iteration if not easily importable for client-side
const OrderedDays: DayOfWeek[] = [
  DayOfWeek.MONDAY,
  DayOfWeek.TUESDAY,
  DayOfWeek.WEDNESDAY,
  DayOfWeek.THURSDAY,
  DayOfWeek.FRIDAY,
  DayOfWeek.SATURDAY,
  DayOfWeek.SUNDAY,
];

// Helper to format day display
const formatDayName = (day: DayOfWeek): string => {
  return day.charAt(0) + day.slice(1).toLowerCase();
};

interface WeeklyScheduleEditorProps {
  initialSchedule?: Partial<StaffScheduleInput>[]; // Allows partial data initially
  onChange: (schedule: StaffScheduleInput[]) => void;
  disabled?: boolean;
}

const defaultTime = { startTime: "09:00", endTime: "17:00" };

export default function WeeklyScheduleEditor({ initialSchedule, onChange, disabled = false }: WeeklyScheduleEditorProps) {
  const [schedule, setSchedule] = useState<StaffScheduleInput[]>([]);

  const initializeSchedule = useCallback(() => {
    const newSchedule: StaffScheduleInput[] = OrderedDays.map(day => {
      const existingDaySchedule = initialSchedule?.find(s => s.dayOfWeek === day && s.scheduleType === ScheduleType.REGULAR_HOURS);
      if (existingDaySchedule) {
        return {
          dayOfWeek: day,
          startTime: existingDaySchedule.startTime || defaultTime.startTime,
          endTime: existingDaySchedule.endTime || defaultTime.endTime,
          isAvailable: existingDaySchedule.isAvailable !== undefined ? existingDaySchedule.isAvailable : true,
          scheduleType: ScheduleType.REGULAR_HOURS,
        };
      }
      // Default for days not in initialSchedule (e.g. Mon-Fri available, Sat/Sun off)
      const isWeekend = day === DayOfWeek.SATURDAY || day === DayOfWeek.SUNDAY;
      return {
        dayOfWeek: day,
        startTime: defaultTime.startTime,
        endTime: defaultTime.endTime,
        isAvailable: !isWeekend,
        scheduleType: ScheduleType.REGULAR_HOURS,
      };
    });
    setSchedule(newSchedule);
  }, [initialSchedule]);

  useEffect(() => {
    initializeSchedule();
  }, [initializeSchedule]);

  const handleAvailabilityChange = (day: DayOfWeek, isAvailable: boolean) => {
    const newSchedule = schedule.map(s =>
      s.dayOfWeek === day
        ? {
            ...s,
            isAvailable,
            // Reset times if becoming unavailable, or set defaults if becoming available and times are empty
            startTime: isAvailable && !s.startTime ? defaultTime.startTime : (isAvailable ? s.startTime : ""),
            endTime: isAvailable && !s.endTime ? defaultTime.endTime : (isAvailable ? s.endTime : ""),
          }
        : s
    );
    setSchedule(newSchedule);
    onChange(newSchedule);
  };

  const handleTimeChange = (day: DayOfWeek, timeType: 'startTime' | 'endTime', value: string) => {
    const newSchedule = schedule.map(s =>
      s.dayOfWeek === day ? { ...s, [timeType]: value } : s
    );
    setSchedule(newSchedule);
    onChange(newSchedule);
  };

  return (
    <div className="space-y-4">
      <Label className="text-base font-medium">Weekly Regular Hours</Label>
      <div className="p-4 border rounded-md space-y-3 bg-slate-50">
        {OrderedDays.map(day => {
          const daySchedule = schedule.find(s => s.dayOfWeek === day) || {
            dayOfWeek: day,
            startTime: defaultTime.startTime,
            endTime: defaultTime.endTime,
            isAvailable: !(day === DayOfWeek.SATURDAY || day === DayOfWeek.SUNDAY), // Default for new days
            scheduleType: ScheduleType.REGULAR_HOURS,
          };

          return (
            <div key={day} className="grid grid-cols-1 md:grid-cols-[100px_auto_1fr_1fr] items-center gap-3 p-2 border-b last:border-b-0">
              <Label className="font-medium capitalize md:text-right text-sm">{formatDayName(day)}</Label>
              <div className="flex items-center space-x-2">
                <Switch
                  id={`${day}-available`}
                  checked={daySchedule.isAvailable}
                  onCheckedChange={(checked) => handleAvailabilityChange(day, checked)}
                  disabled={disabled}
                />
                <Label htmlFor={`${day}-available`} className="text-sm">Available</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Label htmlFor={`${day}-start`} className="text-xs min-w-[30px]">Start</Label>
                <Input
                  type="time"
                  id={`${day}-start`}
                  value={daySchedule.isAvailable ? daySchedule.startTime : ''}
                  onChange={(e) => handleTimeChange(day, 'startTime', e.target.value)}
                  disabled={!daySchedule.isAvailable || disabled}
                  className="py-1 px-2 h-8 text-sm"
                />
              </div>
              <div className="flex items-center space-x-2">
                <Label htmlFor={`${day}-end`} className="text-xs min-w-[30px]">End</Label>
                <Input
                  type="time"
                  id={`${day}-end`}
                  value={daySchedule.isAvailable ? daySchedule.endTime : ''}
                  onChange={(e) => handleTimeChange(day, 'endTime', e.target.value)}
                  disabled={!daySchedule.isAvailable || disabled}
                  className="py-1 px-2 h-8 text-sm"
                />
              </div>
            </div>
          );
        })}
      </div>
       <p className="text-xs text-muted-foreground mt-1">
        Define the standard weekly availability. Specific date overrides or time off can be managed separately.
      </p>
    </div>
  );
}

// Ensure types/enums are declared if not imported (for standalone dev/testing)
// These should match what's in your actual @/types/calendar or Prisma-generated types
declare module '@/types/calendar' {
  export enum DayOfWeek {
    MONDAY = "MONDAY",
    TUESDAY = "TUESDAY",
    WEDNESDAY = "WEDNESDAY",
    THURSDAY = "THURSDAY",
    FRIDAY = "FRIDAY",
    SATURDAY = "SATURDAY",
    SUNDAY = "SUNDAY",
  }

  export enum ScheduleType {
    REGULAR_HOURS = "REGULAR_HOURS",
    OVERRIDE_HOURS = "OVERRIDE_HOURS",
    BREAK = "BREAK",
    TIME_OFF = "TIME_OFF",
    SPECIAL_EVENT = "SPECIAL_EVENT",
    BLACKOUT_DATE = "BLACKOUT_DATE",
  }

  export interface StaffScheduleInput {
    dayOfWeek: DayOfWeek;
    startTime: string;
    endTime: string;
    isAvailable: boolean;
    scheduleType: ScheduleType; // Should default to REGULAR_HOURS here
    date?: string | null; // For overrides, not used by this editor
    locationId?: string | null; // Not directly managed here
    notes?: string | null;
  }
}
