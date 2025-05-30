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
