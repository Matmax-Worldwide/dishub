// src/types/calendar.ts

// Import Prisma types
import type { DayOfWeek, ScheduleType, BookingStatus } from '@prisma/client';

// Export Prisma enums with aliases
export { DayOfWeek as PrismaDayOfWeek, ScheduleType as PrismaScheduleType, BookingStatus } from '@prisma/client';

// Re-export types for convenience
export type { DayOfWeek, ScheduleType } from '@prisma/client';

// --------------------
// CORE MODEL INTERFACES
// --------------------

export interface User {
  id: string;
  firstName?: string | null;
  lastName?: string | null;
  email: string;
  phoneNumber?: string | null;
  profileImageUrl?: string | null;
  isActive?: boolean | null;
}

export interface Location {
  id: string;
  name: string;
  address?: string | null;
  phone?: string | null;
  operatingHours?: Record<string, unknown> | null;
}

export interface ServiceCategory {
  id: string;
  name: string;
  description?: string | null;
  displayOrder?: number;
  parentId?: string | null;
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
  preparationTimeMinutes?: number | null;
  cleanupTimeMinutes?: number | null;
  maxDailyBookingsPerService?: number | null;
  isActive?: boolean | null;
  locationIds?: string[];
  locations?: Location[];
}

export interface StaffSchedule {
  id: string;
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
  scheduleType: ScheduleType;
  date?: string | null;
  locationId?: string | null;
  location?: Partial<Location> | null;
  notes?: string | null;
}

export interface StaffProfile {
  id: string;
  userId: string;
  user?: User | null;
  bio?: string | null;
  specializations?: string[] | null;
  assignedServices?: Partial<Service>[] | null;
  locationAssignments?: Partial<Location>[] | null;
  schedules?: StaffSchedule[] | null;
  createdAt?: string;
  updatedAt?: string;
  // Form-specific properties
  assignedServiceIds?: string[];
  assignedLocationIds?: string[];
}

// --------------------
// INPUT INTERFACES (for mutations, forms)
// --------------------

export interface StaffScheduleInput {
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
  scheduleType: ScheduleType;
  locationId?: string | null;
  date?: string | null;
  notes?: string | null;
  staffProfileId?: string;
}

export interface StaffProfileInput {
  userId: string;
  bio?: string;
  specializations?: string[];
}

// --------------------
// CALENDAR-PREFIXED INTERFACES (for compatibility)
// --------------------

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
  locations?: CalendarLocation[];
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
  assignedServiceIds?: string[];
  assignedLocationIds?: string[];
  assignedServices?: CalendarService[];
  locationAssignments?: CalendarLocation[];
  schedules?: CalendarStaffSchedule[];
}

export interface CalendarStaffSchedule {
  id: string;
  staffProfileId: string;
  staffProfile?: CalendarStaffProfile;
  locationId?: string;
  location?: CalendarLocation;
  date?: Date;
  dayOfWeek?: DayOfWeek;
  startTime: string;
  endTime: string;
  scheduleType: ScheduleType;
  isAvailable: boolean;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CalendarStaffScheduleInput {
  staffProfileId: string;
  locationId?: string;
  date?: Date;
  dayOfWeek?: DayOfWeek;
  startTime: string;
  endTime: string;
  scheduleType: ScheduleType;
  isAvailable?: boolean;
  notes?: string;
}

// --------------------
// OTHER INTERFACES
// --------------------

export interface AvailableTimeSlot {
  startTime: string; // ISO string
  endTime: string;   // ISO string
  isAvailable: boolean;
  staffProfileId?: string | null;
}

export interface Booking {
  id: string;
  userId?: string | null;
  user?: Partial<User> | null;
  customerName?: string | null;
  customerEmail?: string | null;
  customerPhone?: string | null;
  serviceId: string;
  service?: Partial<Service>;
  locationId: string;
  location?: Partial<Location>;
  staffProfileId?: string | null;
  staffProfile?: Partial<StaffProfile> | null;
  bookingDate: string;
  startTime: string;
  endTime: string;
  status?: BookingStatus;
  notes?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

// Input types for forms and mutations
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
