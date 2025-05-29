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

// Define calendar-specific types to avoid conflicts with Prisma
export type CalendarDayOfWeekEnum = 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY' | 'SUNDAY';

export type CalendarScheduleType = 'REGULAR_HOURS' | 'OVERRIDE_HOURS' | 'BREAK' | 'TIME_OFF' | 'SPECIAL_EVENT' | 'BLACKOUT_DATE';

export interface CalendarUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  bio?: string;
  department?: string;
  isActive: boolean;
  position?: string;
  profileImageUrl?: string;
  roleId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CalendarLocation {
  id: string;
  name: string;
  address?: string;
  phone?: string;
  operatingHours?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface CalendarServiceCategory {
  id: string;
  name: string;
  description?: string;
  displayOrder: number;
  createdAt: Date;
  updatedAt: Date;
  parentId?: string;
}

export interface CalendarService {
  id: string;
  name: string;
  description?: string;
  durationMinutes: number;
  price: number;
  bufferTimeBeforeMinutes: number;
  bufferTimeAfterMinutes: number;
  preparationTimeMinutes: number;
  cleanupTimeMinutes: number;
  maxDailyBookingsPerService?: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  serviceCategoryId: string;
  serviceCategory?: CalendarServiceCategory;
}

export interface CalendarStaffProfile {
  id: string;
  userId: string;
  user?: CalendarUser;
  bio?: string;
  specializations: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CalendarStaffSchedule {
  id: string;
  staffProfileId: string;
  staffProfile?: CalendarStaffProfile;
  locationId?: string;
  location?: CalendarLocation;
  date?: Date;
  dayOfWeek?: CalendarDayOfWeekEnum;
  startTime: string;
  endTime: string;
  scheduleType: CalendarScheduleType;
  isAvailable: boolean;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CalendarBooking {
  id: string;
  customerId: string;
  customer?: CalendarUser;
  serviceId: string;
  service?: CalendarService;
  staffProfileId?: string;
  staffProfile?: CalendarStaffProfile;
  locationId: string;
  location?: CalendarLocation;
  bookingDate: Date;
  startTime: Date;
  endTime: Date;
  durationMinutes: number;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED' | 'NO_SHOW' | 'RESCHEDULED';
  notes?: string;
  communicationPreferences: ('EMAIL' | 'SMS' | 'PHONE' | 'WHATSAPP')[];
  reminderSentAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CalendarBookingRule {
  id: string;
  locationId?: string;
  location?: CalendarLocation;
  advanceBookingHoursMin: number;
  advanceBookingDaysMax: number;
  sameDayCutoffTime?: string;
  bufferBetweenAppointmentsMinutes: number;
  maxAppointmentsPerDayPerStaff?: number;
  bookingSlotIntervalMinutes: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CalendarLocationService {
  locationId: string;
  serviceId: string;
  isActive: boolean;
  location?: CalendarLocation;
  service?: CalendarService;
  createdAt: Date;
  updatedAt: Date;
}

export interface CalendarStaffService {
  staffProfileId: string;
  serviceId: string;
  staffProfile?: CalendarStaffProfile;
  service?: CalendarService;
  createdAt: Date;
}

export interface CalendarStaffLocationAssignment {
  staffProfileId: string;
  locationId: string;
  staffProfile?: CalendarStaffProfile;
  location?: CalendarLocation;
  assignedAt: Date;
}

// Input types for forms and mutations
export interface CalendarStaffScheduleInput {
  staffProfileId: string;
  locationId?: string;
  date?: Date;
  dayOfWeek?: CalendarDayOfWeekEnum;
  startTime: string;
  endTime: string;
  scheduleType: CalendarScheduleType;
  isAvailable?: boolean;
  notes?: string;
}

export interface ServiceInput {
  name: string;
  description?: string;
  durationMinutes: number;
  price: number;
  bufferTimeBeforeMinutes?: number;
  bufferTimeAfterMinutes?: number;
  preparationTimeMinutes?: number;
  cleanupTimeMinutes?: number;
  maxDailyBookingsPerService?: number;
  isActive?: boolean;
  serviceCategoryId: string;
  locationIds?: string[];
}

export interface LocationInput {
  name: string;
  address?: string;
  phone?: string;
  operatingHours?: Record<string, unknown>;
}

export interface ServiceCategoryInput {
  name: string;
  description?: string;
  displayOrder?: number;
  parentId?: string;
}

export interface StaffProfileInput {
  userId: string;
  bio?: string;
  specializations?: string[];
}

export interface BookingRuleInput {
  locationId?: string;
  advanceBookingHoursMin: number;
  advanceBookingDaysMax: number;
  sameDayCutoffTime?: string;
  bufferBetweenAppointmentsMinutes?: number;
  maxAppointmentsPerDayPerStaff?: number;
  bookingSlotIntervalMinutes?: number;
} 