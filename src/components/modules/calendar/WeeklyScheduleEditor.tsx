'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { StaffScheduleInput, PrismaDayOfWeek as DayOfWeek, PrismaScheduleType as ScheduleType } from '@/types/calendar';
import { Plus, Trash2, Clock } from 'lucide-react';

// Local DayOfWeek enum for UI iteration
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

interface TimeBlock {
  id: string;
  startTime: string;
  endTime: string;
}

interface DaySchedule {
  dayOfWeek: DayOfWeek;
  isAvailable: boolean;
  timeBlocks: TimeBlock[];
}

interface WeeklyScheduleEditorProps {
  initialSchedule?: Partial<StaffScheduleInput>[];
  onChange: (schedule: Partial<StaffScheduleInput>[]) => void;
  disabled?: boolean;
}

const defaultTimeBlock = { startTime: "09:00", endTime: "17:00" };

export default function WeeklyScheduleEditor({ initialSchedule, onChange, disabled = false }: WeeklyScheduleEditorProps) {
  const [weeklySchedule, setWeeklySchedule] = useState<DaySchedule[]>([]);

  const generateId = () => Math.random().toString(36).substr(2, 9);

  const initializeSchedule = useCallback(() => {
    const newWeeklySchedule: DaySchedule[] = OrderedDays.map(day => {
      // Find all schedule entries for this day
      const dayEntries = initialSchedule?.filter(s => 
        s.dayOfWeek === day && s.scheduleType === ScheduleType.REGULAR_HOURS
      ) || [];

      if (dayEntries.length > 0) {
        // Convert existing entries to time blocks
        const timeBlocks: TimeBlock[] = dayEntries
          .filter(entry => entry.startTime && entry.endTime)
          .map(entry => ({
            id: generateId(),
            startTime: entry.startTime!,
            endTime: entry.endTime!,
          }));

        return {
          dayOfWeek: day,
          isAvailable: dayEntries.some(entry => entry.isAvailable),
          timeBlocks: timeBlocks.length > 0 ? timeBlocks : [{
            id: generateId(),
            ...defaultTimeBlock
          }],
        };
      }

      // Default for days not in initialSchedule
      const isWeekend = day === DayOfWeek.SATURDAY || day === DayOfWeek.SUNDAY;
      return {
        dayOfWeek: day,
        isAvailable: !isWeekend,
        timeBlocks: !isWeekend ? [{
          id: generateId(),
          ...defaultTimeBlock
        }] : [],
      };
    });
    setWeeklySchedule(newWeeklySchedule);
  }, [initialSchedule]);

  useEffect(() => {
    initializeSchedule();
  }, [initializeSchedule]);

  // Convert internal format to StaffScheduleInput format
  const convertToScheduleInput = (schedule: DaySchedule[]): Partial<StaffScheduleInput>[] => {
    const result: Partial<StaffScheduleInput>[] = [];
    
    schedule.forEach(daySchedule => {
      if (daySchedule.isAvailable && daySchedule.timeBlocks.length > 0) {
        // Create one schedule entry for each time block
        daySchedule.timeBlocks.forEach(timeBlock => {
          result.push({
            dayOfWeek: daySchedule.dayOfWeek,
            startTime: timeBlock.startTime,
            endTime: timeBlock.endTime,
            isAvailable: true,
            scheduleType: ScheduleType.REGULAR_HOURS,
          });
        });
      } else {
        // Add unavailable entry for the day
        result.push({
          dayOfWeek: daySchedule.dayOfWeek,
          startTime: "",
          endTime: "",
          isAvailable: false,
          scheduleType: ScheduleType.REGULAR_HOURS,
        });
      }
    });
    
    return result;
  };

  const handleAvailabilityChange = (day: DayOfWeek, isAvailable: boolean) => {
    const newSchedule = weeklySchedule.map(daySchedule =>
      daySchedule.dayOfWeek === day
        ? {
            ...daySchedule,
            isAvailable,
            timeBlocks: isAvailable && daySchedule.timeBlocks.length === 0 
              ? [{ id: generateId(), ...defaultTimeBlock }] 
              : daySchedule.timeBlocks,
          }
        : daySchedule
    );
    setWeeklySchedule(newSchedule);
    onChange(convertToScheduleInput(newSchedule));
  };

  const handleTimeBlockChange = (day: DayOfWeek, blockId: string, field: 'startTime' | 'endTime', value: string) => {
    const newSchedule = weeklySchedule.map(daySchedule =>
      daySchedule.dayOfWeek === day
        ? {
            ...daySchedule,
            timeBlocks: daySchedule.timeBlocks.map(block =>
              block.id === blockId ? { ...block, [field]: value } : block
            ),
          }
        : daySchedule
    );
    setWeeklySchedule(newSchedule);
    onChange(convertToScheduleInput(newSchedule));
  };

  const addTimeBlock = (day: DayOfWeek) => {
    const newSchedule = weeklySchedule.map(daySchedule =>
      daySchedule.dayOfWeek === day
        ? {
            ...daySchedule,
            timeBlocks: [
              ...daySchedule.timeBlocks,
              { id: generateId(), ...defaultTimeBlock }
            ],
          }
        : daySchedule
    );
    setWeeklySchedule(newSchedule);
    onChange(convertToScheduleInput(newSchedule));
  };

  const removeTimeBlock = (day: DayOfWeek, blockId: string) => {
    const newSchedule = weeklySchedule.map(daySchedule =>
      daySchedule.dayOfWeek === day
        ? {
            ...daySchedule,
            timeBlocks: daySchedule.timeBlocks.filter(block => block.id !== blockId),
          }
        : daySchedule
    );
    setWeeklySchedule(newSchedule);
    onChange(convertToScheduleInput(newSchedule));
  };

  const validateTimeBlock = (block: TimeBlock): boolean => {
    if (!block.startTime || !block.endTime) return false;
    return block.startTime < block.endTime;
  };

  const hasTimeConflicts = (daySchedule: DaySchedule): boolean => {
    const sortedBlocks = [...daySchedule.timeBlocks].sort((a, b) => a.startTime.localeCompare(b.startTime));
    
    for (let i = 0; i < sortedBlocks.length - 1; i++) {
      const current = sortedBlocks[i];
      const next = sortedBlocks[i + 1];
      
      if (current.endTime > next.startTime) {
        return true;
      }
    }
    return false;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <Clock className="h-4 w-4" />
        <Label className="text-base font-medium">Weekly Schedule</Label>
      </div>
      
      <div className="space-y-3">
        {OrderedDays.map(day => {
          const daySchedule = weeklySchedule.find(s => s.dayOfWeek === day) || {
            dayOfWeek: day,
            isAvailable: false,
            timeBlocks: [],
          };

          const hasConflicts = hasTimeConflicts(daySchedule);

          return (
            <Card key={day} className={`${hasConflicts ? 'border-red-200 bg-red-50' : ''}`}>
              <CardContent className="p-4">
                <div className="space-y-3">
                  {/* Day header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Label className="font-medium text-sm min-w-[80px]">
                        {formatDayName(day)}
                      </Label>
                      <div className="flex items-center space-x-2">
                        <Switch
                          id={`${day}-available`}
                          checked={daySchedule.isAvailable}
                          onCheckedChange={(checked) => handleAvailabilityChange(day, checked)}
                          disabled={disabled}
                        />
                        <Label htmlFor={`${day}-available`} className="text-sm">
                          Available
                        </Label>
                      </div>
                    </div>
                    
                    {daySchedule.isAvailable && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => addTimeBlock(day)}
                        disabled={disabled}
                        className="flex items-center space-x-1"
                      >
                        <Plus className="h-3 w-3" />
                        <span className="text-xs">Add Time Block</span>
                      </Button>
                    )}
                  </div>

                  {/* Time blocks */}
                  {daySchedule.isAvailable && (
                    <div className="space-y-2 ml-4">
                      {daySchedule.timeBlocks.map((block, index) => {
                        const isValid = validateTimeBlock(block);
                        
                        return (
                          <div key={block.id} className="flex items-center space-x-2">
                            <span className="text-xs text-muted-foreground min-w-[20px]">
                              {index + 1}.
                            </span>
                            
                            <div className="flex items-center space-x-2">
                              <Label className="text-xs min-w-[30px]">From</Label>
                              <Input
                                type="time"
                                value={block.startTime}
                                onChange={(e) => handleTimeBlockChange(day, block.id, 'startTime', e.target.value)}
                                disabled={disabled}
                                className={`py-1 px-2 h-8 text-sm w-24 ${!isValid ? 'border-red-300' : ''}`}
                              />
                            </div>
                            
                            <div className="flex items-center space-x-2">
                              <Label className="text-xs min-w-[20px]">To</Label>
                              <Input
                                type="time"
                                value={block.endTime}
                                onChange={(e) => handleTimeBlockChange(day, block.id, 'endTime', e.target.value)}
                                disabled={disabled}
                                className={`py-1 px-2 h-8 text-sm w-24 ${!isValid ? 'border-red-300' : ''}`}
                              />
                            </div>
                            
                            {daySchedule.timeBlocks.length > 1 && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeTimeBlock(day, block.id)}
                                disabled={disabled}
                                className="p-1 h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            )}
                            
                            {!isValid && (
                              <span className="text-xs text-red-500">Invalid time range</span>
                            )}
                          </div>
                        );
                      })}
                      
                      {hasConflicts && (
                        <div className="text-xs text-red-600 bg-red-100 p-2 rounded">
                          ⚠️ Time blocks overlap. Please adjust the times to avoid conflicts.
                        </div>
                      )}
                      
                      {daySchedule.timeBlocks.length === 0 && (
                        <div className="text-xs text-muted-foreground italic">
                          No time blocks defined. Click &quot;Add Time Block&quot; to set working hours.
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
      
      <div className="text-xs text-muted-foreground space-y-1">
        <p>• You can add multiple time blocks per day for split shifts (e.g., 9:00-12:00 and 16:00-19:00)</p>
        <p>• Time blocks cannot overlap within the same day</p>
        <p>• Each time block represents a continuous working period</p>
      </div>
    </div>
  );
}
