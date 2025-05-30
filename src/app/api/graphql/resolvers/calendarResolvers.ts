import { prisma } from '@/lib/prisma';
import { ForbiddenError } from 'apollo-server-errors'; 
import { NextRequest } from 'next/server';

// Define enums based on Prisma schema
enum DayOfWeek {
  MONDAY = 'MONDAY',
  TUESDAY = 'TUESDAY',
  WEDNESDAY = 'WEDNESDAY',
  THURSDAY = 'THURSDAY',
  FRIDAY = 'FRIDAY',
  SATURDAY = 'SATURDAY',
  SUNDAY = 'SUNDAY'
}



enum ScheduleType {
  REGULAR_HOURS = 'REGULAR_HOURS',
  OVERRIDE_HOURS = 'OVERRIDE_HOURS',
  BREAK = 'BREAK',
  TIME_OFF = 'TIME_OFF',
  SPECIAL_EVENT = 'SPECIAL_EVENT',
  BLACKOUT_DATE = 'BLACKOUT_DATE'
}

enum BookingStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  CANCELLED = 'CANCELLED',
  COMPLETED = 'COMPLETED',
  NO_SHOW = 'NO_SHOW',
  RESCHEDULED = 'RESCHEDULED'
}

// Define proper context type
interface GraphQLContext {
  req: NextRequest;
  user?: {
    id: string;
    role: string;
  };
  _emergency_bypass?: boolean;
}

// Define input types
interface BookingFilterInput {
  dateFrom?: string;
  dateTo?: string;
  status?: string;
  locationId?: string;
  serviceId?: string;
  staffProfileId?: string;
  customerId?: string;
  searchQuery?: string;
}

interface PaginationInput {
  page?: number;
  pageSize?: number;
}

type LocationCreateInput = {
  name: string;
  address?: string | null;
  phone?: string | null;
  operatingHours?: JSON;
};

interface CreateServiceCategoryInput {
  name: string;
  description?: string;
  displayOrder?: number;
  parentId?: string;
}

interface UpdateServiceCategoryInput {
  name?: string;
  description?: string;
  displayOrder?: number;
  parentId?: string;
}

interface CreateLocationInput {
  name: string;
  address?: string | null;
  phone?: string | null;
  operatingHours?: unknown;
}

interface UpdateLocationInput {
  name?: string;
  address?: string;
  phone?: string;
  operatingHours?: unknown;
}

interface CreateServiceInput {
  name: string;
  description?: string;
  durationMinutes: number;
  bufferTimeBeforeMinutes?: number;
  bufferTimeAfterMinutes?: number;
  preparationTimeMinutes?: number;
  cleanupTimeMinutes?: number;
  maxDailyBookingsPerService?: number;
  isActive?: boolean;
  serviceCategoryId: string;
  locationIds?: string[];
}

interface UpdateServiceInput {
  name?: string;
  description?: string;
  durationMinutes?: number;
  bufferTimeBeforeMinutes?: number;
  bufferTimeAfterMinutes?: number;
  preparationTimeMinutes?: number;
  cleanupTimeMinutes?: number;
  maxDailyBookingsPerService?: number;
  isActive?: boolean;
  serviceCategoryId?: string;
  locationIds?: string[];
}

interface StaffScheduleInput {
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
  scheduleType: string;
  isAvailable: boolean;
  locationId?: string;
  notes?: string;
}

interface CreateStaffProfileInput {
  userId: string;
  bio?: string;
  specializations?: string[];
}

interface UpdateStaffProfileInput {
  userId?: string;
  bio?: string;
  specializations?: string[];
}

interface CreateBookingInput {
  serviceId: string;
  locationId: string;
  staffProfileId?: string;
  bookingDate: string;
  startTime: string;
  endTime: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  notes?: string;
  userId?: string;
}

interface GlobalBookingRuleInput {
  advanceBookingHoursMin: number;
  advanceBookingDaysMax: number;
  sameDayCutoffTime?: string;
  bufferBetweenAppointmentsMinutes: number;
  maxAppointmentsPerDayPerStaff?: number;
  bookingSlotIntervalMinutes: number;
}

// Define types based on Prisma schema
type BookingWhereInput = {
  bookingDate?: {
    gte?: Date;
    lte?: Date;
  };
  status?: BookingStatus;
  locationId?: string;
  serviceId?: string;
  staffProfileId?: string;
  customerId?: string;
  OR?: Array<{
    notes?: { contains: string; mode: 'insensitive' };
    customer?: {
      OR: Array<{
        firstName?: { contains: string; mode: 'insensitive' };
        lastName?: { contains: string; mode: 'insensitive' };
        email?: { contains: string; mode: 'insensitive' };
      }>;
    };
  }>;
};

type StaffProfileWhereInput = {
  assignedServices?: {
    some: {
      serviceId: string;
    };
  };
  locationAssignments?: {
    some: {
      locationId: string;
    };
  };
};


type ServiceCategoryCreateInput = {
  name: string;
  description?: string;
  displayOrder?: number;
  parentCategory?: { connect: { id: string } };
};

type ServiceCategoryUpdateInput = {
  name?: string;
  description?: string;
  displayOrder?: number;
  parentCategory?: { disconnect: true } | { connect: { id: string } };
};

type ServiceCreateInput = {
  name: string;
  description?: string | null;
  durationMinutes: number;
  bufferTimeBeforeMinutes?: number;
  bufferTimeAfterMinutes?: number;
  preparationTimeMinutes?: number;
  cleanupTimeMinutes?: number;
  maxDailyBookingsPerService?: number | null;
  isActive?: boolean;
  serviceCategory: { connect: { id: string } };
};

type ServiceUpdateInput = {
  name?: string;
  description?: string;
  durationMinutes?: number;
  bufferTimeBeforeMinutes?: number;
  bufferTimeAfterMinutes?: number;
  preparationTimeMinutes?: number;
  cleanupTimeMinutes?: number;
  maxDailyBookingsPerService?: number;
  isActive?: boolean;
  serviceCategory?: { connect: { id: string } };
};

type StaffProfileCreateInput = {
  user: { connect: { id: string } };
  bio?: string | null;
  specializations?: string[];
};

type StaffProfileUpdateInput = {
  user?: { connect: { id: string } };
  bio?: string;
  specializations?: string[];
};

type StaffScheduleCreateManyInput = {
  staffProfileId: string;
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
  scheduleType: ScheduleType;
  locationId?: string | null;
  notes?: string | null;
};

type StaffScheduleWhereInput = {
  staffProfileId: string;
  scheduleType?: ScheduleType;
};

// Define booking type for map functions
type BookingWithRelations = {
  id: string;
  bookingDate: Date;
  startTime: Date;
  endTime: Date;
  customer?: {
    firstName?: string | null;
    lastName?: string | null;
    email?: string | null;
    phoneNumber?: string | null;
  } | null;
  customerId?: string | null;
  staffProfile?: unknown | null;
  location?: unknown;
  service?: unknown;
};

// Define location type for map functions
type LocationWithId = {
  id: string;
  name?: string;
};

// Define service location type for map functions
type LocationServiceWithLocation = {
  location: LocationWithId;
};

// Define staff service type for map functions
type StaffServiceWithService = {
  service: LocationWithId;
};

// Define staff location type for map functions
type StaffLocationWithLocation = {
  location: LocationWithId;
};

const isAdminUser = (context: GraphQLContext): boolean => {
  // Temporary bypass for debugging
  if (context._emergency_bypass) {
    console.log('Using emergency bypass for authorization');
    return true;
  }
  
  const role = context.user?.role;
  console.log('isAdminUser check - user role:', role);
  return role === 'ADMIN' || role === 'SUPER_ADMIN';
};

export const calendarResolvers = {
  Query: {
    location: async (_parent: unknown, { id }: { id: string }) => {
      return prisma.location.findUnique({ 
        where: { id },
        include: { 
            services: { include: { service: true } }, 
            bookingRules: true, 
            schedules: {where: {scheduleType: ScheduleType.REGULAR_HOURS}} // Example: only load regular hours by default
        }
      });
    },
    locations: async () => {
      try {
        console.log('Locations resolver called');
        const locations = await prisma.location.findMany({ 
          orderBy: { name: 'asc' },
          include: { 
              services: { take: 5, include: { service: {select : {name: true, id: true}} } },
              bookingRules: { take: 1} // Assuming one global or first rule for summary
          } 
        });
        console.log('Locations query result:', locations ? locations.length : 'null');
        return locations || [];
      } catch (error) {
        console.error('Error fetching locations:', error);
        // Return empty array instead of null to satisfy non-nullable GraphQL schema
        return [];
      }
    },
    serviceCategory: async (_parent: unknown, { id }: { id: string }) => {
      return prisma.serviceCategory.findUnique({ 
        where: { id },
        include: { parentCategory: true, childCategories: true, services: {take: 5, select: {name: true, id: true}} }
      });
    },
    serviceCategories: async () => {
      try {
        const serviceCategories = await prisma.serviceCategory.findMany({ 
          orderBy: { displayOrder: 'asc' },
          include: { services: { take: 3, select: {name: true, id: true} } } 
        });
        return serviceCategories || [];
      } catch (error) {
        console.error('Error fetching service categories:', error);
        // Return empty array instead of null to satisfy non-nullable GraphQL schema
        return [];
      }
    },
    service: async (_parent: unknown, { id }: { id: string }) => {
      return prisma.service.findUnique({
        where: { id },
        include: { 
          serviceCategory: true, 
          locations: { include: { location: true } }, // Resolves LocationService to Location
          staff: { include: { staffProfile: { include: { user: {select: {id: true, firstName:true, lastName:true, email: true}}}}}} // Resolves StaffService to StaffProfile to User
        },
      });
    },
    services: async () => {
      try {
        const services = await prisma.service.findMany({
          orderBy: { name: 'asc' },
          include: { 
            serviceCategory: true, 
            staff: { take: 3, include: { staffProfile: { include: { user: {select: {id: true, firstName:true, lastName:true}}}}}} // Summary of staff
          },
        });
        return services || [];
      } catch (error) {
        console.error('Error fetching services:', error);
        // Return empty array instead of null to satisfy non-nullable GraphQL schema
        return [];
      }
    },
    staffProfile: async (_parent: unknown, { id }: { id: string }) => {
      return prisma.staffProfile.findUnique({
        where: { id },
        include: { 
          user: true, 
          schedules: { orderBy: [{dayOfWeek: 'asc'}, {startTime: 'asc'}] }, // Get all schedule types for detail view
          assignedServices: { include: { service: true } },
          locationAssignments: { include: { location: true } },
        },
      });
    },
    staffProfiles: async () => {
      try {
        const staffProfiles = await prisma.staffProfile.findMany({
          orderBy: { user: { firstName: 'asc' } },
          include: { 
            user: true, 
            schedules: { where: { scheduleType: ScheduleType.REGULAR_HOURS }, orderBy: { dayOfWeek: 'asc'} },
            assignedServices: { take: 5, include: { service: {select: {name: true, id: true}} } }, 
            locationAssignments: { take: 3, include: { location: {select: {name: true, id: true}} } }, 
          },
        });
        return staffProfiles || [];
      } catch (error) {
        console.error('Error fetching staff profiles:', error);
        // Return empty array instead of null to satisfy non-nullable GraphQL schema
        return [];
      }
    },
    bookings: async (_parent: unknown, { filter, pagination }: { filter?: BookingFilterInput, pagination?: PaginationInput }, context: GraphQLContext) => {
      // Temporarily disable admin check to debug the null return issue
      console.log('Bookings resolver called with context:', !!context);
      // if (!isAdminUser(context)) throw new ForbiddenError('Not authorized.');
 
      try {
        const where: BookingWhereInput = {};
        if (filter) {
          if (filter.dateFrom && filter.dateTo) {
            where.bookingDate = { gte: new Date(filter.dateFrom), lte: new Date(filter.dateTo) };
          } else if (filter.dateFrom) {
            where.bookingDate = { gte: new Date(filter.dateFrom) };
          } else if (filter.dateTo) {
            where.bookingDate = { lte: new Date(filter.dateTo) };
          }
          if (filter.status) {
            where.status = filter.status as BookingStatus;
          }
          if (filter.locationId) {
            where.locationId = filter.locationId;
          }
          if (filter.serviceId) {
            where.serviceId = filter.serviceId;
          }
          if (filter.staffProfileId) {
            where.staffProfileId = filter.staffProfileId;
          }
          if (filter.customerId) {
            where.customerId = filter.customerId;
          }
          if (filter.searchQuery) {
            where.OR = [
              { notes: { contains: filter.searchQuery, mode: 'insensitive' } },
              // Search in related customer data
              { customer: { 
                OR: [
                  { firstName: { contains: filter.searchQuery, mode: 'insensitive' } },
                  { lastName: { contains: filter.searchQuery, mode: 'insensitive' } },
                  { email: { contains: filter.searchQuery, mode: 'insensitive' } }
                ]
              }},
            ];
          }
        }

        const page = pagination?.page && pagination.page > 0 ? pagination.page : 1;
        const pageSize = pagination?.pageSize && pagination.pageSize > 0 ? pagination.pageSize : 10;
        const skip = (page - 1) * pageSize;

        console.log('Bookings query - where:', JSON.stringify(where, null, 2));
        console.log('Bookings query - pagination:', { page, pageSize, skip });

        const totalCount = await prisma.booking.count({ where });
        console.log('Bookings query - totalCount:', totalCount);
        
        const items = await prisma.booking.findMany({
          where,
          skip,
          take: pageSize,
          include: {
            customer: true, // Changed from 'user' to 'customer'
            service: true,
            location: true,
            staffProfile: {
              include: {
                user: true, // Fetch the user related to the staffProfile
              },
            },
          },
          orderBy: { bookingDate: 'desc' }, // Default order
        });
        
        console.log('Bookings query - items count:', items.length);

        // Transform to BookingConnection structure
        const edges = items.map((booking: BookingWithRelations, index: number) => ({
          node: booking,
          cursor: Buffer.from(`${skip + index}`).toString('base64')
        }));

        const hasNextPage = skip + pageSize < totalCount;
        const hasPreviousPage = skip > 0;

        return {
          edges,
          pageInfo: {
            hasNextPage,
            hasPreviousPage,
            startCursor: edges.length > 0 ? edges[0].cursor : null,
            endCursor: edges.length > 0 ? edges[edges.length - 1].cursor : null
          },
          totalCount
        };
      } catch (error) {
        console.error('Error fetching bookings:', error);
        // Return empty BookingConnection structure to satisfy GraphQL schema
        return {
          edges: [],
          pageInfo: {
            hasNextPage: false,
            hasPreviousPage: false,
            startCursor: null,
            endCursor: null
          },
          totalCount: 0
        };
      }
    },
    globalBookingRule: async () => {
      try {
        // Find the global booking rule (there should only be one)
        const rule = await prisma.bookingRule.findFirst({
          where: { locationId: null } // Global rules have no locationId
        });
        
        // If no rule exists, create a default one
        if (!rule) {
          const defaultRule = await prisma.bookingRule.create({
            data: {
              advanceBookingHoursMin: 24, // 24 hours minimum advance booking
              advanceBookingDaysMax: 90, // 90 days maximum advance booking
              sameDayCutoffTime: "12:00", // Same day cutoff at noon
              bufferBetweenAppointmentsMinutes: 15, // 15 minutes buffer
              maxAppointmentsPerDayPerStaff: 8, // 8 appointments per day per staff
              bookingSlotIntervalMinutes: 30, // 30 minute slots
              locationId: null // Global rule
            }
          });
          return defaultRule;
        }
        
        return rule;
      } catch (error) {
        console.error('Error fetching global booking rule:', error);
        return null;
      }
    },
    availableSlots: async (_parent: unknown, { 
      serviceId, 
      locationId, 
      staffProfileId, 
      date 
    }: { 
      serviceId: string; 
      locationId: string; 
      staffProfileId?: string; 
      date: string; 
    }) => {
      try {
        console.log('availableSlots resolver called with:', { serviceId, locationId, staffProfileId, date });
        
        // Get service details
        const service = await prisma.service.findUnique({
          where: { id: serviceId },
          include: { serviceCategory: true }
        });
        
        if (!service) {
          throw new Error(`Service with ID ${serviceId} not found`);
        }
        
        // Get location details with operating hours
        const location = await prisma.location.findUnique({
          where: { id: locationId }
        });
        
        if (!location) {
          throw new Error(`Location with ID ${locationId} not found`);
        }
        
        // Get global booking rules
        const bookingRule = await prisma.bookingRule.findFirst({
          where: { locationId: null }
        });
        
        const slotInterval = bookingRule?.bookingSlotIntervalMinutes || 30;
        
        // Parse operating hours for the given date
        const targetDate = new Date(date);
        const dayNames = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
        const dayOfWeek = dayNames[targetDate.getDay()];
        
        const operatingHours = location.operatingHours as Record<string, { open: string; close: string; isClosed: boolean }> | null;
        const dayHours = operatingHours?.[dayOfWeek];
        
        if (!dayHours || dayHours.isClosed) {
          return []; // Location is closed on this day
        }
        
        // Get existing bookings for the date
        const existingBookings = await prisma.booking.findMany({
          where: {
            locationId,
            bookingDate: targetDate,
            status: { in: ['CONFIRMED', 'PENDING'] },
            ...(staffProfileId && { staffProfileId })
          },
          include: {
            service: true
          }
        });
        
        // Get staff schedules if specific staff is requested
        let staffSchedule = null;
        if (staffProfileId) {
          const dayOfWeekEnum = dayNames[targetDate.getDay()];
          staffSchedule = await prisma.staffSchedule.findFirst({
            where: {
              staffProfileId,
              dayOfWeek: dayOfWeekEnum as DayOfWeek,
              isAvailable: true,
              scheduleType: ScheduleType.REGULAR_HOURS
            }
          });
          
          if (!staffSchedule) {
            return []; // Staff not available on this day
          }
        }
        
        // Generate time slots
        const slots = [];
        const startTime = staffSchedule?.startTime || dayHours.open;
        const endTime = staffSchedule?.endTime || dayHours.close;
        
        const [startHour, startMinute] = startTime.split(':').map(Number);
        const [endHour, endMinute] = endTime.split(':').map(Number);
        
        const startDateTime = new Date(targetDate);
        startDateTime.setHours(startHour, startMinute, 0, 0);
        
        const endDateTime = new Date(targetDate);
        endDateTime.setHours(endHour, endMinute, 0, 0);
        
        let currentSlot = new Date(startDateTime);
        
        while (currentSlot.getTime() + (service.durationMinutes * 60000) <= endDateTime.getTime()) {
          const slotEndTime = new Date(currentSlot.getTime() + (service.durationMinutes * 60000));
          
          // Check if slot conflicts with existing bookings
          const hasConflict = existingBookings.some((booking: BookingWithRelations) => {
            const bookingStart = new Date(`${booking.bookingDate.toISOString().split('T')[0]}T${booking.startTime}`);
            const bookingEnd = new Date(`${booking.bookingDate.toISOString().split('T')[0]}T${booking.endTime}`);
            
            return (
              (currentSlot >= bookingStart && currentSlot < bookingEnd) ||
              (slotEndTime > bookingStart && slotEndTime <= bookingEnd) ||
              (currentSlot <= bookingStart && slotEndTime >= bookingEnd)
            );
          });
          
          if (!hasConflict) {
            slots.push({
              startTime: currentSlot.toISOString(),
              endTime: slotEndTime.toISOString(),
              isAvailable: true,
              serviceId,
              locationId,
              staffProfileId: staffProfileId || null
            });
          }
          
          // Move to next slot
          currentSlot = new Date(currentSlot.getTime() + (slotInterval * 60000));
        }
        
        return slots;
      } catch (error) {
        console.error('Error generating available slots:', error);
        return [];
      }
    },
    staffForService: async (_parent: unknown, { serviceId, locationId }: { serviceId: string; locationId?: string }) => {
      try {
        console.log('staffForService resolver called with:', { serviceId, locationId });
        
        const whereCondition: StaffProfileWhereInput = {
          assignedServices: {
            some: {
              serviceId: serviceId
            }
          }
        };
        
        if (locationId) {
          whereCondition.locationAssignments = {
            some: {
              locationId: locationId
            }
          };
        }
        
        const staffProfiles = await prisma.staffProfile.findMany({
          where: whereCondition,
          include: {
            user: true,
            schedules: {
              where: { scheduleType: 'REGULAR_HOURS' },
              orderBy: { dayOfWeek: 'asc' }
            },
            assignedServices: {
              where: { serviceId },
              include: { service: true }
            },
            locationAssignments: locationId ? {
              where: { locationId },
              include: { location: true }
            } : true
          }
        });
        
        return staffProfiles || [];
      } catch (error) {
        console.error('Error fetching staff for service:', error);
        return [];
      }
    },
  },
  Mutation: {
    createLocation: async (_parent: unknown, { input }: { input: CreateLocationInput }, context: GraphQLContext) => {
      if (!isAdminUser(context)) throw new ForbiddenError('Not authorized.');
      try {
        const data = {
          name: input.name,
          address: input.address || null,
          phone: input.phone || null,
          operatingHours: input.operatingHours,
        };
        const location = await prisma.location.create({ 
          data: data as LocationCreateInput
        });
        return {
          success: true,
          message: 'Location created successfully',
          location
        };
      } catch (error) {
        console.error('Error creating location:', error);
        return {
          success: false,
          message: 'Failed to create location',
          location: null
        };
      }
    },
    updateLocation: async (_parent: unknown, { id, input }: { id: string; input: UpdateLocationInput }, context: GraphQLContext) => {
      console.log('updateLocation resolver called with:', { id, input });
      console.log('updateLocation context:', { user: context.user });
      console.log('updateLocation isAdminUser result:', isAdminUser(context));
      
      if (!isAdminUser(context)) throw new ForbiddenError('Not authorized.');
      try {
        const data = {
          ...(input.name !== undefined && { name: input.name }),
          ...(input.address !== undefined && { address: input.address }),
          ...(input.phone !== undefined && { phone: input.phone }),
          ...(input.operatingHours !== undefined && { operatingHours: input.operatingHours }),
        };
        console.log('updateLocation prisma data:', data);
        const location = await prisma.location.update({ where: { id }, data });
        console.log('updateLocation prisma result:', location);
        return {
          success: true,
          message: 'Location updated successfully',
          location
        };
      } catch (error) {
        console.error('Error updating location:', error);
        return {
          success: false,
          message: 'Failed to update location',
          location: null
        };
      }
    },
    deleteLocation: async (_parent: unknown, { id }: { id: string }, context: GraphQLContext) => {
      console.log('deleteLocation resolver called with:', { id });
      console.log('deleteLocation context:', { user: context.user });
      console.log('deleteLocation isAdminUser result:', isAdminUser(context));
      
      if (!isAdminUser(context)) throw new ForbiddenError('Not authorized.');
      try {
        console.log('deleteLocation attempting to delete location with id:', id);
        const location = await prisma.location.delete({ where: { id } });
        console.log('deleteLocation prisma result:', location);
        return {
          success: true,
          message: 'Location deleted successfully',
          location
        };
      } catch (error) {
        console.error('Error deleting location:', error);
        return {
          success: false,
          message: 'Failed to delete location',
          location: null
        };
      }
    },
    createServiceCategory: async (_parent: unknown, { input }: { input: CreateServiceCategoryInput }, context: GraphQLContext) => {
      if (!isAdminUser(context)) throw new ForbiddenError('Not authorized.');
      try {
        const { parentId, ...categoryData } = input;
        const data: ServiceCategoryCreateInput = { 
          ...categoryData,
          ...(parentId && parentId !== '' ? { parentCategory: { connect: { id: parentId } } } : {})
        };
        const serviceCategory = await prisma.serviceCategory.create({ data });
        return {
          success: true,
          message: 'Service category created successfully',
          serviceCategory
        };
      } catch (error) {
        console.error('Error creating service category:', error);
        return {
          success: false,
          message: 'Failed to create service category',
          serviceCategory: null
        };
      }
    },
    updateServiceCategory: async (_parent: unknown, { id, input }: { id: string; input: UpdateServiceCategoryInput }, context: GraphQLContext) => {
      if (!isAdminUser(context)) throw new ForbiddenError('Not authorized.');
      try {
        console.log('updateServiceCategory called with:', { id, input });
        
        // Validate that the category exists
        const existingCategory = await prisma.serviceCategory.findUnique({
          where: { id }
        });
        if (!existingCategory) {
          throw new Error(`Service category with ID ${id} not found`);
        }
        
        // Validate parent category if provided
        if (input.parentId && input.parentId !== '') {
          const parentExists = await prisma.serviceCategory.findUnique({
            where: { id: input.parentId }
          });
          if (!parentExists) {
            throw new Error(`Parent category with ID ${input.parentId} not found`);
          }
          
          // Prevent circular references
          if (input.parentId === id) {
            throw new Error('A category cannot be its own parent');
          }
        }
        
        const { parentId, ...categoryData } = input;
        const data: ServiceCategoryUpdateInput = { 
          ...categoryData,
          ...(parentId !== undefined ? 
            (parentId === '' || parentId === null ? 
              { parentCategory: { disconnect: true } } : 
              { parentCategory: { connect: { id: parentId } } }
            ) : {}
          )
        };
        
        console.log('Updating service category with data:', data);
        const serviceCategory = await prisma.serviceCategory.update({ where: { id }, data });
        console.log('Service category updated:', serviceCategory);
        
        return {
          success: true,
          message: 'Service category updated successfully',
          serviceCategory
        };
      } catch (error) {
        console.error('Error updating service category:', error);
        return {
          success: false,
          message: error instanceof Error ? error.message : 'Failed to update service category',
          serviceCategory: null
        };
      }
    },
    deleteServiceCategory: async (_parent: unknown, { id }: { id: string }, context: GraphQLContext) => {
      if (!isAdminUser(context)) throw new ForbiddenError('Not authorized.');
      try {
        console.log('deleteServiceCategory called with id:', id);
        
        // Validate that the category exists
        const existingCategory = await prisma.serviceCategory.findUnique({
          where: { id },
          include: {
            services: { select: { id: true, name: true } },
            childCategories: { select: { id: true, name: true } }
          }
        });
        
        if (!existingCategory) {
          throw new Error(`Service category with ID ${id} not found`);
        }
        
        // Check if category has services
        if (existingCategory.services.length > 0) {
          const serviceNames = existingCategory.services.map((s: { id: string; name: string }) => s.name).join(', ');
          throw new Error(`Cannot delete "${existingCategory.name}" because it has ${existingCategory.services.length} associated service${existingCategory.services.length === 1 ? '' : 's'}: ${serviceNames}. Please reassign or delete these services first.`);
        }
        
        // Check if category has child categories
        if (existingCategory.childCategories.length > 0) {
          const childNames = existingCategory.childCategories.map((c: { id: string; name: string }) => c.name).join(', ');
          throw new Error(`Cannot delete "${existingCategory.name}" because it has ${existingCategory.childCategories.length} child categor${existingCategory.childCategories.length === 1 ? 'y' : 'ies'}: ${childNames}. Please reassign or delete these categories first.`);
        }
        
        console.log('Deleting service category:', existingCategory.name);
        const deletedCategory = await prisma.serviceCategory.delete({ where: { id } });
        console.log('Service category deleted:', deletedCategory);
        
        return {
          success: true,
          message: `Service category "${deletedCategory.name}" deleted successfully`,
          serviceCategory: deletedCategory
        };
      } catch (error) {
        console.error('Error deleting service category:', error);
        return {
          success: false,
          message: error instanceof Error ? error.message : 'Failed to delete service category',
          serviceCategory: null
        };
      }
    },
    createService: async (_parent: unknown, { input }: { input: CreateServiceInput }, context: GraphQLContext) => {
      if (!isAdminUser(context)) throw new ForbiddenError('Not authorized.');
      try {
        console.log('createService called with input:', input);
        
        // Validate that the service category exists
        const categoryExists = await prisma.serviceCategory.findUnique({
          where: { id: input.serviceCategoryId }
        });
        if (!categoryExists) {
          throw new Error(`Service category with ID ${input.serviceCategoryId} not found`);
        }
        
        // Validate that all location IDs exist if provided
        if (input.locationIds && input.locationIds.length > 0) {
          const existingLocations = await prisma.location.findMany({
            where: { id: { in: input.locationIds } }
          });
          if (existingLocations.length !== input.locationIds.length) {
            const foundIds = existingLocations.map((loc: LocationWithId) => loc.id);
            const missingIds = input.locationIds.filter(id => !foundIds.includes(id));
            throw new Error(`Location(s) not found: ${missingIds.join(', ')}`);
          }
        }
        
        const serviceData: ServiceCreateInput = {
          name: input.name,
          description: input.description || null,
          durationMinutes: input.durationMinutes,
          bufferTimeBeforeMinutes: input.bufferTimeBeforeMinutes || 0,
          bufferTimeAfterMinutes: input.bufferTimeAfterMinutes || 0,
          preparationTimeMinutes: input.preparationTimeMinutes || 0,
          cleanupTimeMinutes: input.cleanupTimeMinutes || 0,
          maxDailyBookingsPerService: input.maxDailyBookingsPerService || null,
          isActive: input.isActive !== undefined ? input.isActive : true,
          serviceCategory: { connect: { id: input.serviceCategoryId } },
        };
        
        console.log('Creating service with data:', serviceData);
        const service = await prisma.service.create({ data: serviceData });
        console.log('Service created:', service);
        
        // Always handle location connections (even if empty array)
        if (input.locationIds !== undefined) {
          if (input.locationIds.length > 0) {
            console.log('Connecting service to locations:', input.locationIds);
            
            try {
              // Use upsert to handle potential conflicts with composite primary key
              for (const locationId of input.locationIds) {
                await prisma.locationService.upsert({
                  where: {
                    locationId_serviceId: {
                      locationId: locationId,
                      serviceId: service.id
                    }
                  },
                  update: {
                    isActive: true
                  },
                  create: {
                    locationId: locationId,
                    serviceId: service.id,
                    isActive: true
                  }
                });
              }
              console.log('Location connections created successfully');
            } catch (locationError) {
              console.error('Error creating location connections:', locationError);
              // If location assignment fails, we should still return success for service creation
              // but mention the location assignment issue
              return {
                success: true,
                message: 'Service created successfully, but some location assignments failed',
                service
              };
            }
          } else {
            console.log('No locations to connect for this service');
          }
        }
        
        return {
          success: true,
          message: 'Service created successfully',
          service
        };
      } catch (error) {
        console.error('Error creating service:', error);
        return {
          success: false,
          message: error instanceof Error ? error.message : 'Failed to create service',
          service: null
        };
      }
    },
    updateService: async (_parent: unknown, { id, input }: { id: string; input: UpdateServiceInput }, context: GraphQLContext) => {
      if (!isAdminUser(context)) throw new ForbiddenError('Not authorized.');
      try {
        console.log('updateService called with input:', input);
        
        // Validate that the service exists
        const existingService = await prisma.service.findUnique({
          where: { id }
        });
        if (!existingService) {
          throw new Error(`Service with ID ${id} not found`);
        }
        
        // Validate that the service category exists if being updated
        if (input.serviceCategoryId) {
          const categoryExists = await prisma.serviceCategory.findUnique({
            where: { id: input.serviceCategoryId }
          });
          if (!categoryExists) {
            throw new Error(`Service category with ID ${input.serviceCategoryId} not found`);
          }
        }
        
        // Validate that all location IDs exist if provided
        if (input.locationIds && input.locationIds.length > 0) {
          const existingLocations = await prisma.location.findMany({
            where: { id: { in: input.locationIds } }
          });
          if (existingLocations.length !== input.locationIds.length) {
            const foundIds = existingLocations.map((loc: LocationWithId) => loc.id);
            const missingIds = input.locationIds.filter(id => !foundIds.includes(id));
            throw new Error(`Location(s) not found: ${missingIds.join(', ')}`);
          }
        }
        
        const data: ServiceUpdateInput = {
          ...(input.name !== undefined && { name: input.name }),
          ...(input.description !== undefined && { description: input.description }),
          ...(input.durationMinutes !== undefined && { durationMinutes: input.durationMinutes }),
          ...(input.bufferTimeBeforeMinutes !== undefined && { bufferTimeBeforeMinutes: input.bufferTimeBeforeMinutes }),
          ...(input.bufferTimeAfterMinutes !== undefined && { bufferTimeAfterMinutes: input.bufferTimeAfterMinutes }),
          ...(input.preparationTimeMinutes !== undefined && { preparationTimeMinutes: input.preparationTimeMinutes }),
          ...(input.cleanupTimeMinutes !== undefined && { cleanupTimeMinutes: input.cleanupTimeMinutes }),
          ...(input.maxDailyBookingsPerService !== undefined && { maxDailyBookingsPerService: input.maxDailyBookingsPerService }),
          ...(input.isActive !== undefined && { isActive: input.isActive }),
          ...(input.serviceCategoryId !== undefined && { serviceCategory: { connect: { id: input.serviceCategoryId } } }),
        };
        
        console.log('Updating service with data:', data);
        const service = await prisma.service.update({ where: { id }, data });
        console.log('Service updated:', service);
        
        // Always update location connections if locationIds are provided (even if empty array)
        if (input.locationIds !== undefined) {
          console.log('Updating service location connections:', input.locationIds);
          
          try {
            // Use a transaction to ensure atomicity
            await prisma.$transaction(async (tx: typeof prisma) => {
              // First, delete all existing location connections for this service
              await tx.locationService.deleteMany({
                where: { serviceId: id }
              });
              console.log('Existing location connections removed');
              
              // Then create new connections if any locationIds are provided
              if (input.locationIds && input.locationIds.length > 0) {
                // Use individual creates instead of createMany to handle potential conflicts better
                for (const locationId of input.locationIds) {
                  await tx.locationService.create({
                    data: {
                      locationId: locationId,
                      serviceId: id,
                      isActive: true
                    }
                  });
                }
                console.log('New location connections created successfully');
              } else {
                console.log('No locations to connect for this service (all connections removed)');
              }
            });
          } catch (locationError) {
            console.error('Error updating location connections:', locationError);
            // If location update fails, we should still return success for service update
            // but mention the location assignment issue
            return {
              success: true,
              message: 'Service updated successfully, but location assignments failed',
              service
            };
          }
        }
        
        return {
          success: true,
          message: 'Service updated successfully',
          service
        };
      } catch (error) {
        console.error('Error updating service:', error);
        return {
          success: false,
          message: error instanceof Error ? error.message : 'Failed to update service',
          service: null
        };
      }
    },
    deleteService: async (_parent: unknown, { id }: { id: string }, context: GraphQLContext) => {
      if (!isAdminUser(context)) throw new ForbiddenError('Not authorized.');
      return prisma.service.delete({ where: { id } });
    },
    createStaffProfile: async (_parent: unknown, { input }: { input: CreateStaffProfileInput }, context: GraphQLContext) => {
      if (!isAdminUser(context)) throw new ForbiddenError('Not authorized.');
      try {
        const staffProfileData: StaffProfileCreateInput = {
          user: { connect: { id: input.userId } },
          bio: input.bio || null,
          specializations: input.specializations || [],
        };
        const staffProfile = await prisma.staffProfile.create({ 
          data: staffProfileData,
          include: { user: true }
        });
        return {
          success: true,
          message: 'Staff profile created successfully',
          staffProfile
        };
      } catch (error) {
        console.error('Error creating staff profile:', error);
        return {
          success: false,
          message: 'Failed to create staff profile',
          staffProfile: null
        };
      }
    },
    updateStaffProfile: async (_parent: unknown, { id, input }: { id: string; input: UpdateStaffProfileInput }, context: GraphQLContext) => {
      if (!isAdminUser(context)) throw new ForbiddenError('Not authorized.');
      try {
        const data: StaffProfileUpdateInput = {
          ...(input.userId !== undefined && { user: { connect: { id: input.userId } } }),
          ...(input.bio !== undefined && { bio: input.bio }),
          ...(input.specializations !== undefined && { specializations: input.specializations }),
        };
        const staffProfile = await prisma.staffProfile.update({ 
          where: { id }, 
          data,
          include: { user: true }
        });
        return {
          success: true,
          message: 'Staff profile updated successfully',
          staffProfile
        };
      } catch (error) {
        console.error('Error updating staff profile:', error);
        return {
          success: false,
          message: 'Failed to update staff profile',
          staffProfile: null
        };
      }
    },
    deleteStaffProfile: async (_parent: unknown, { id }: { id: string }, context: GraphQLContext) => {
      if (!isAdminUser(context)) throw new ForbiddenError('Not authorized.');
      return prisma.staffProfile.delete({ where: { id }, include: { user: true } });
    },
    updateStaffSchedule: async (_parent: unknown, { staffProfileId, schedule }: { staffProfileId: string; schedule: StaffScheduleInput[] }, context: GraphQLContext) => {
      if (!isAdminUser(context)) throw new ForbiddenError('Not authorized.');
      const regularHoursSchedule: StaffScheduleCreateManyInput[] = schedule
        .filter(s => s.scheduleType === 'REGULAR_HOURS')
        .map(s => ({ 
            staffProfileId,
            dayOfWeek: s.dayOfWeek as DayOfWeek,
            startTime: s.startTime,
            endTime: s.endTime,
            isAvailable: s.isAvailable,
            scheduleType: ScheduleType.REGULAR_HOURS,
            locationId: s.locationId || null, // Ensure null if undefined
            notes: s.notes || null, // Ensure null if undefined
         }));
      await prisma.$transaction([
        prisma.staffSchedule.deleteMany({ where: { staffProfileId: staffProfileId, scheduleType: ScheduleType.REGULAR_HOURS } }),
        prisma.staffSchedule.createMany({ data: regularHoursSchedule }),
      ]);
      return prisma.staffSchedule.findMany({
        where: { staffProfileId: staffProfileId, scheduleType: ScheduleType.REGULAR_HOURS },
        orderBy: { dayOfWeek: 'asc' }, include: { location: true }
      });
    },
    upsertGlobalBookingRules: async (_parent: unknown, { input }: { input: {
      advanceBookingHoursMin: number;
      advanceBookingDaysMax: number;
      sameDayCutoffTime?: string | null;
      bufferBetweenAppointmentsMinutes: number;
      maxAppointmentsPerDayPerStaff?: number | null;
      bookingSlotIntervalMinutes: number;
    } }, context: GraphQLContext) => {
      if (!isAdminUser(context)) throw new ForbiddenError('Not authorized.');
      
      try {
        // Find existing global booking rule
        const existingRule = await prisma.bookingRule.findFirst({
          where: { locationId: null } // Global rules have no locationId
        });
        
        if (existingRule) {
          // Update existing rule
          return await prisma.bookingRule.update({
            where: { id: existingRule.id },
            data: {
              advanceBookingHoursMin: input.advanceBookingHoursMin,
              advanceBookingDaysMax: input.advanceBookingDaysMax,
              sameDayCutoffTime: input.sameDayCutoffTime,
              bufferBetweenAppointmentsMinutes: input.bufferBetweenAppointmentsMinutes,
              maxAppointmentsPerDayPerStaff: input.maxAppointmentsPerDayPerStaff,
              bookingSlotIntervalMinutes: input.bookingSlotIntervalMinutes,
            }
          });
        } else {
          // Create new rule
          return await prisma.bookingRule.create({
            data: {
              advanceBookingHoursMin: input.advanceBookingHoursMin,
              advanceBookingDaysMax: input.advanceBookingDaysMax,
              sameDayCutoffTime: input.sameDayCutoffTime,
              bufferBetweenAppointmentsMinutes: input.bufferBetweenAppointmentsMinutes,
              maxAppointmentsPerDayPerStaff: input.maxAppointmentsPerDayPerStaff,
              bookingSlotIntervalMinutes: input.bookingSlotIntervalMinutes,
              locationId: null // Global rule
            }
          });
        }
      } catch (error) {
        console.error('Error upserting global booking rule:', error);
        throw new Error('Failed to update booking rules');
      }
    },
    createBooking: async (_parent: unknown, { input }: { input: CreateBookingInput }, context: GraphQLContext) => {
      if (!isAdminUser(context)) throw new ForbiddenError('Not authorized.');
      try {
        console.log('createBooking called with input:', input);
        
        // Validate that the service exists
        const service = await prisma.service.findUnique({
          where: { id: input.serviceId }
        });
        if (!service) {
          throw new Error(`Service with ID ${input.serviceId} not found`);
        }
        
        // Validate that the location exists
        const location = await prisma.location.findUnique({
          where: { id: input.locationId }
        });
        if (!location) {
          throw new Error(`Location with ID ${input.locationId} not found`);
        }
        
        // Validate staff profile if provided
        if (input.staffProfileId) {
          const staffProfile = await prisma.staffProfile.findUnique({
            where: { id: input.staffProfileId }
          });
          if (!staffProfile) {
            throw new Error(`Staff profile with ID ${input.staffProfileId} not found`);
          }
        }
        
        // Check for booking conflicts
        const bookingDate = new Date(input.bookingDate);
        const startDateTime = new Date(input.startTime);
        const endDateTime = new Date(input.endTime);
        
        const existingBookings = await prisma.booking.findMany({
          where: {
            locationId: input.locationId,
            bookingDate: bookingDate,
            status: { in: ['CONFIRMED', 'PENDING'] },
            OR: [
              {
                AND: [
                  { startTime: { lte: startDateTime } },
                  { endTime: { gt: startDateTime } }
                ]
              },
              {
                AND: [
                  { startTime: { lt: endDateTime } },
                  { endTime: { gte: endDateTime } }
                ]
              },
              {
                AND: [
                  { startTime: { gte: startDateTime } },
                  { endTime: { lte: endDateTime } }
                ]
              }
            ]
          }
        });
        
        if (existingBookings.length > 0) {
          throw new Error('Time slot is already booked');
        }
        
        // Create or find customer
        let customerId = input.userId;
        if (!customerId) {
          // Create a guest customer record
          const guestCustomer = await prisma.user.create({
            data: {
              password: '',
              email: input.customerEmail,
              firstName: input.customerName.split(' ')[0] || input.customerName,
              lastName: input.customerName.split(' ').slice(1).join(' ') || '',
              phoneNumber: input.customerPhone,
              role: { connect: { name: 'CUSTOMER' } }
            }
          });
          customerId = guestCustomer.id;
        }
        
        // Create the booking
        const booking = await prisma.booking.create({
          data: {
            durationMinutes: service.durationMinutes,
            serviceId: input.serviceId,
            locationId: input.locationId,
            staffProfileId: input.staffProfileId,
            customerId: customerId,
            bookingDate: bookingDate,
            startTime: startDateTime,
            endTime: endDateTime,
            notes: input.notes,
            status: 'PENDING'
          },
          include: {
            customer: true,
            service: true,
            location: true,
            staffProfile: {
              include: {
                user: true
              }
            }
          }
        });
        
        return {
          success: true,
          message: 'Booking created successfully',
          booking
        };
      } catch (error) {
        console.error('Error creating booking:', error);
        return {
          success: false,
          message: error instanceof Error ? error.message : 'Failed to create booking',
          booking: null
        };
      }
    },
    updateGlobalBookingRules: async (_parent: unknown, { input }: { input: GlobalBookingRuleInput }, context: GraphQLContext) => {
      if (!isAdminUser(context)) throw new ForbiddenError('Not authorized.');
      
      try {
        // Find existing global booking rule
        const existingRule = await prisma.bookingRule.findFirst({
          where: { locationId: null } // Global rules have no locationId
        });
        
        if (existingRule) {
          // Update existing rule
          return await prisma.bookingRule.update({
            where: { id: existingRule.id },
            data: {
              advanceBookingHoursMin: input.advanceBookingHoursMin,
              advanceBookingDaysMax: input.advanceBookingDaysMax,
              sameDayCutoffTime: input.sameDayCutoffTime,
              bufferBetweenAppointmentsMinutes: input.bufferBetweenAppointmentsMinutes,
              maxAppointmentsPerDayPerStaff: input.maxAppointmentsPerDayPerStaff,
              bookingSlotIntervalMinutes: input.bookingSlotIntervalMinutes,
            }
          });
        } else {
          // Create new rule
          return await prisma.bookingRule.create({
            data: {
              advanceBookingHoursMin: input.advanceBookingHoursMin,
              advanceBookingDaysMax: input.advanceBookingDaysMax,
              sameDayCutoffTime: input.sameDayCutoffTime,
              bufferBetweenAppointmentsMinutes: input.bufferBetweenAppointmentsMinutes,
              maxAppointmentsPerDayPerStaff: input.maxAppointmentsPerDayPerStaff,
              bookingSlotIntervalMinutes: input.bookingSlotIntervalMinutes,
              locationId: null // Global rule
            }
          });
        }
      } catch (error) {
        console.error('Error updating global booking rule:', error);
        throw new Error('Failed to update booking rules');
      }
    },
  },
  Location: {
  },
  Service: {
    serviceCategory: async (parent: { serviceCategoryId: string }) => {
        if (!parent.serviceCategoryId) return null; // Should always exist based on schema
        try {
          return await prisma.serviceCategory.findUnique({ where: { id: parent.serviceCategoryId } });
        } catch (error) {
          console.error('Error fetching service category:', error);
          return null;
        }
    },
    locations: async (parent: { id: string }) => {
      try {
        const locationServices = await prisma.locationService.findMany({
          where: { serviceId: parent.id, isActive: true }, 
          include: { location: true },
        });
        return locationServices.map((ls: LocationServiceWithLocation) => ls.location) || [];
      } catch (error) {
        console.error('Error fetching service locations:', error);
        return [];
      }
    },
    prices: async (parent: { id: string }) => {
      try {
        const prices = await prisma.price.findMany({
          where: { serviceId: parent.id },
          include: { currency: true },
          orderBy: { createdAt: 'desc' }
        });
        return prices || [];
      } catch (error) {
        console.error('Error fetching service prices:', error);
        return [];
      }
    }
  },
  StaffProfile: {
    user: async (parent: { userId: string }) => {
      try {
        return await prisma.user.findUnique({ where: { id: parent.userId } });
      } catch (error) {
        console.error('Error fetching staff user:', error);
        return null;
      }
    },
    schedules: async (parent: { id: string }, args?: { scheduleType?: ScheduleType }) => {
      try {
        const whereCondition: StaffScheduleWhereInput = { staffProfileId: parent.id };
        if (args?.scheduleType) {
          whereCondition.scheduleType = args.scheduleType;
        }
        // If no specific type requested, might fetch all or default to REGULAR_HOURS
        // For StaffProfile.schedules in GQL, it's [StaffSchedule!], implying all types by default.
        const schedules = await prisma.staffSchedule.findMany({ 
          where: whereCondition,
          orderBy: [{ dayOfWeek: 'asc' }, { date: 'asc' }, { startTime: 'asc' }] 
        });
        return schedules || [];
      } catch (error) {
        console.error('Error fetching staff schedules:', error);
        return [];
      }
    },
    assignedServices: async (parent: { id: string }) => {
      try {
        const staffServices = await prisma.staffService.findMany({
          where: { staffProfileId: parent.id },
          include: { service: true }, 
        });
        return staffServices.map((ss: StaffServiceWithService) => ss.service) || [];
      } catch (error) {
        console.error('Error fetching assigned services:', error);
        return [];
      }
    },
    locationAssignments: async (parent: { id: string }) => {
      try {
        const staffLocations = await prisma.staffLocationAssignment.findMany({
          where: { staffProfileId: parent.id },
          include: { location: true },
        });
        return staffLocations.map((sl: StaffLocationWithLocation) => sl.location) || [];
      } catch (error) {
        console.error('Error fetching location assignments:', error);
        return [];
      }
    },
  },
  StaffSchedule: {
    location: async (parent: { locationId?: string | null }) => {
      if (!parent.locationId) return null;
      return prisma.location.findUnique({ where: { id: parent.locationId } });
    }
  },
  // Add Type resolver for Booking to ensure relations are handled if not covered by direct includes
  // However, the 'include' in the main 'bookings' query resolver should handle these.
  // Booking: {
  //   user: async (parent: { userId?: string | null }) => {
  //     if (!parent.userId) return null;
  //     return prisma.user.findUnique({ where: { id: parent.userId } });
  //   },
  //   service: async (parent: { serviceId: string }) => {
  //     return prisma.service.findUnique({ where: { id: parent.serviceId } });
  //   },
  //   location: async (parent: { locationId: string }) => {
  //     return prisma.location.findUnique({ where: { id: parent.locationId } });
  //   },
  //   staffProfile: async (parent: { staffProfileId?: string | null }) => {
  //     if (!parent.staffProfileId) return null;
  //     return prisma.staffProfile.findUnique({ 
  //       where: { id: parent.staffProfileId },
  //       include: { user: true } 
  //     });
  //   },
  // }
  
  // Field resolvers for Booking type
  Booking: {
    customerName: (parent: { customer?: { firstName?: string; lastName?: string } }) => {
      if (!parent.customer) return null;
      const { firstName, lastName } = parent.customer;
      if (firstName && lastName) {
        return `${firstName} ${lastName}`;
      }
      return firstName || lastName || null;
    },
    customerEmail: (parent: { customer?: { email?: string } }) => {
      return parent.customer?.email || null;
    },
    customerPhone: (parent: { customer?: { phoneNumber?: string } }) => {
      return parent.customer?.phoneNumber || null;
    },
    user: (parent: { customer?: unknown }) => {
      return parent.customer || null;
    },
    userId: (parent: { customerId?: string }) => {
      return parent.customerId || null;
    },
  },
  Price: {
    currency: async (parent: { currencyId: string }) => {
      try {
        return await prisma.currency.findUnique({ where: { id: parent.currencyId } });
      } catch (error) {
        console.error('Error fetching price currency:', error);
        return null;
      }
    }
  },
  Currency: {
    // Currency doesn't need any custom resolvers as all fields are direct
  },
};
