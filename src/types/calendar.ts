export interface StaffMember {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Schedule {
  id: string;
  staffId: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  staffId?: string;
  description?: string;
  type: 'appointment' | 'break' | 'unavailable';
}

export interface TimeSlot {
  start: string;
  end: string;
  available: boolean;
  staffId?: string;
}

export interface WeeklySchedule {
  [key: string]: TimeSlot[];
}

export type CalendarDayOfWeek = 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY' | 'SUNDAY'; 