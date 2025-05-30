
// src/types/calendar.ts

// --------------------
// ENUMS
// --------------------

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

export enum BookingStatus {
  PENDING = "PENDING",
  CONFIRMED = "CONFIRMED",
  CANCELLED = "CANCELLED",
  COMPLETED = "COMPLETED",
  NO_SHOW = "NO_SHOW",
  RESCHEDULED = "RESCHEDULED",
}

// --------------------
// CORE MODEL INTERFACES
// --------------------

export interface User {
  id: string;
  firstName?: string | null;
  lastName?: string | null;
  email: string; // Assuming email is non-nullable for a user
  phoneNumber?: string | null;
  profileImageUrl?: string | null;
  isActive?: boolean | null;
  // other fields as needed by components consuming this type
}

export interface Location {
  id: string;
  name: string;
  address?: string | null;
  phone?: string | null;
  operatingHours?: any | null; // JSON in Prisma, could be more specific e.g., Record<DayOfWeek, {open: string, close: string}>
  // other fields as needed
}

export interface ServiceCategory {
    id: string;
    name: string;
    description?: string | null;
    // other fields
}

export interface Service {
  id: string;
  name: string;
  description?: string | null;
  durationMinutes: number;
  price: number;
  serviceCategoryId?: string | null;
  serviceCategory?: ServiceCategory | null;
  bufferTimeBeforeMinutes?: number | null;
  bufferTimeAfterMinutes?: number | null;
  // other fields as needed
}

export interface StaffSchedule {
  id: string;
  dayOfWeek: DayOfWeek;
  startTime: string; // e.g., "09:00"
  endTime: string;   // e.g., "17:00"
  isAvailable: boolean;
  scheduleType: ScheduleType;
  date?: string | null; // For specific date overrides (YYYY-MM-DD)
  locationId?: string | null;
  location?: Partial<Location> | null; // Optional: if location data is included in schedule fetches
  notes?: string | null;
}

export interface StaffProfile {
  id: string;
  userId: string;
  user?: User | null;
  bio?: string | null;
  specializations?: string[] | null;
  assignedServices?: Partial<Service>[] | null; // Using Partial as StaffManager might only need id/name
  locationAssignments?: Partial<Location>[] | null; // Using Partial for locations
  schedules?: StaffSchedule[] | null;
  createdAt?: string; // ISO DateTime string
  updatedAt?: string; // ISO DateTime string
}

// --------------------
// INPUT INTERFACES (for mutations, forms)
// --------------------

export interface StaffScheduleInput {
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
  scheduleType: ScheduleType; // Should default to REGULAR_HOURS for weekly editor
  locationId?: string | null;
  date?: string | null; // YYYY-MM-DD, for specific date overrides/one-offs
  notes?: string | null;
}

// --------------------
// OTHER / UTILITY TYPES for Calendar module if needed later
// --------------------

export interface AvailableTimeSlot {
  startTime: Date; // Or string, depending on how it's processed
  endTime: Date;   // Or string
  staffProfileId?: string; // If relevant for specific staff
}

export interface Booking {
  id: string;
  userId?: string | null; 
  user?: Partial<User> | null; 
  customerName?: string | null; 
  customerEmail?: string | null; 
  customerPhone?: string | null;
  serviceId: string;
  service: Partial<Service>; 
  locationId: string;
  location: Partial<Location>;
  staffProfileId?: string | null;
  staffProfile?: Partial<StaffProfile> | null;
  bookingDate: string; // ISO Date string "YYYY-MM-DD"
  startTime: string;   // ISO DateTime string
  endTime: string;     // ISO DateTime string
  status: BookingStatus;
  notes?: string | null;
  createdAt?: string;   // ISO DateTime string
  updatedAt?: string;   // ISO DateTime string
}
=======
// Export Prisma-generated enums with different names to avoid conflicts
export { DayOfWeek as PrismaDayOfWeek, ScheduleType as PrismaScheduleType } from '@prisma/client';

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
  // Additional properties for form handling
  assignedServiceIds?: string[]; // Used in form state
  assignedLocationIds?: string[]; // Used in form state
  assignedServices?: CalendarService[]; // For initialData mapping
  locationAssignments?: CalendarLocation[]; // For initialData mapping
  schedules?: CalendarStaffSchedule[]; // For schedule data
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
