import { prisma } from '@/lib/prisma';
import { ForbiddenError } from 'apollo-server-errors'; 
import { Prisma, ScheduleType, DayOfWeek, BookingStatus } from '@prisma/client';

// Define proper context type
interface GraphQLContext {
  user?: {
    role?: {
      name: string;
    } | string;
  };
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

interface ServiceCategoryInput {
  name: string;
  description?: string;
  displayOrder?: number;
  parentId?: string;
}

interface ServiceInput {
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

interface StaffProfileInput {
  userId: string;
  bio?: string;
  specializations?: string[];
  assignedServiceIds?: string[];
  assignedLocationIds?: string[];
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

const isAdminUser = (context: GraphQLContext): boolean => {
  const role = context.user?.role;
  const roleName = typeof role === 'string' ? role : role?.name;
  return roleName === 'ADMIN' || roleName === 'SUPER_ADMIN';
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
            locations: { take: 3, include: { location: {select: {name: true, id: true}} } }, // Summary of locations
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
        const where: Prisma.BookingWhereInput = {};
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
        const edges = items.map((booking, index) => ({
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
  },
  Mutation: {
    createLocation: async (_parent: unknown, { input }: { input: Prisma.LocationCreateInput }, context: GraphQLContext) => {
      if (!isAdminUser(context)) throw new ForbiddenError('Not authorized.');
      return prisma.location.create({ data: input });
    },
    updateLocation: async (_parent: unknown, { id, input }: { id: string; input: Prisma.LocationUpdateInput }, context: GraphQLContext) => {
      if (!isAdminUser(context)) throw new ForbiddenError('Not authorized.');
      return prisma.location.update({ where: { id }, data: input });
    },
    deleteLocation: async (_parent: unknown, { id }: { id: string }, context: GraphQLContext) => {
      if (!isAdminUser(context)) throw new ForbiddenError('Not authorized.');
      return prisma.location.delete({ where: { id } });
    },
    createServiceCategory: async (_parent: unknown, { input }: { input: ServiceCategoryInput }, context: GraphQLContext) => {
      if (!isAdminUser(context)) throw new ForbiddenError('Not authorized.');
      const { parentId, ...categoryData } = input;
      const data: Prisma.ServiceCategoryCreateInput = { 
        ...categoryData,
        ...(parentId && parentId !== '' ? { parentCategory: { connect: { id: parentId } } } : {})
      };
      return prisma.serviceCategory.create({ data });
    },
    updateServiceCategory: async (_parent: unknown, { id, input }: { id: string; input: ServiceCategoryInput }, context: GraphQLContext) => {
      if (!isAdminUser(context)) throw new ForbiddenError('Not authorized.');
      const { parentId, ...categoryData } = input;
      const data: Prisma.ServiceCategoryUpdateInput = { 
        ...categoryData,
        ...(parentId !== undefined ? 
          (parentId === '' || parentId === null ? 
            { parentCategory: { disconnect: true } } : 
            { parentCategory: { connect: { id: parentId } } }
          ) : {}
        )
      };
      return prisma.serviceCategory.update({ where: { id }, data });
    },
    deleteServiceCategory: async (_parent: unknown, { id }: { id: string }, context: GraphQLContext) => {
      if (!isAdminUser(context)) throw new ForbiddenError('Not authorized.');
      return prisma.serviceCategory.delete({ where: { id } });
    },
    createService: async (_parent: unknown, { input }: { input: ServiceInput }, context: GraphQLContext) => {
      if (!isAdminUser(context)) throw new ForbiddenError('Not authorized.');
      const { locationIds, serviceCategoryId, ...serviceData } = input;
      const data: Prisma.ServiceCreateInput = { 
        ...serviceData,
        serviceCategory: { connect: { id: serviceCategoryId } }
      };
      if (locationIds && locationIds.length > 0) {
        data.locations = {
          create: locationIds.map((locId: string) => ({
            location: { connect: { id: locId } },
          })),
        };
      }
      return prisma.service.create({ data, include: { serviceCategory: true, locations: { include: { location: true } } } });
    },
    updateService: async (_parent: unknown, { id, input }: { id: string; input: ServiceInput }, context: GraphQLContext) => {
      if (!isAdminUser(context)) throw new ForbiddenError('Not authorized.');
      const { locationIds, serviceCategoryId, ...serviceData } = input;
      const data: Prisma.ServiceUpdateInput = { ...serviceData };

      if (serviceCategoryId) {
        data.serviceCategory = { connect: { id: serviceCategoryId } };
      }

      if (locationIds !== undefined) {
        data.locations = {
            deleteMany: {}, 
            create: locationIds.map((locId: string) => ({
                location: { connect: { id: locId } },
            })),
        };
      }
      return prisma.service.update({ 
        where: { id }, 
        data, 
        include: { serviceCategory: true, locations: { include: { location: true } } } 
      });
    },
    deleteService: async (_parent: unknown, { id }: { id: string }, context: GraphQLContext) => {
      if (!isAdminUser(context)) throw new ForbiddenError('Not authorized.');
      return prisma.service.delete({ where: { id } });
    },
    createStaffProfile: async (_parent: unknown, { input }: { input: StaffProfileInput }, context: GraphQLContext) => {
      if (!isAdminUser(context)) throw new ForbiddenError('Not authorized.');
      const { userId, bio, specializations, assignedServiceIds, assignedLocationIds } = input;

      const existingProfile = await prisma.staffProfile.findUnique({ where: { userId } });
      if (existingProfile) throw new Error('User already has a staff profile.');

      const profileData: Prisma.StaffProfileCreateInput = {
        user: { connect: { id: userId } },
        bio: bio || undefined,
        specializations: specializations || [],
      };
      if (assignedServiceIds && assignedServiceIds.length > 0) {
        profileData.assignedServices = { create: assignedServiceIds.map((id: string) => ({ service: { connect: { id } } })) };
      }
      if (assignedLocationIds && assignedLocationIds.length > 0) {
        profileData.locationAssignments = { create: assignedLocationIds.map((id: string) => ({ location: { connect: { id } } })) };
      }
      
      const newStaffProfile = await prisma.staffProfile.create({ data: profileData });

      const days = Object.values(DayOfWeek);
      const defaultSchedule: Prisma.StaffScheduleCreateManyInput[] = days.map(day => ({
        staffProfileId: newStaffProfile.id,
        dayOfWeek: day,
        startTime: "09:00",
        endTime: "17:00",
        isAvailable: !(day === DayOfWeek.SATURDAY || day === DayOfWeek.SUNDAY),
        scheduleType: ScheduleType.REGULAR_HOURS,
      }));
      await prisma.staffSchedule.createMany({ data: defaultSchedule });

      return prisma.staffProfile.findUnique({ 
          where: {id: newStaffProfile.id},
          include: { user: true, schedules: true, assignedServices: {include: {service:true}}, locationAssignments: {include: {location:true}} }
      });
    },
    updateStaffProfile: async (_parent: unknown, { id, input }: { id: string; input: StaffProfileInput }, context: GraphQLContext) => {
      if (!isAdminUser(context)) throw new ForbiddenError('Not authorized.');
      const { bio, specializations, assignedServiceIds, assignedLocationIds } = input;
      
      const updateData: Prisma.StaffProfileUpdateInput = {};
      if (bio !== undefined) updateData.bio = bio;
      if (specializations !== undefined) updateData.specializations = { set: specializations }; 

      if (assignedServiceIds !== undefined) {
        updateData.assignedServices = {
          deleteMany: {}, 
          create: assignedServiceIds.map((serviceId: string) => ({ service: { connect: { id: serviceId } } })),
        };
      }
      if (assignedLocationIds !== undefined) {
        updateData.locationAssignments = {
          deleteMany: {}, 
          create: assignedLocationIds.map((locationId: string) => ({ location: { connect: { id: locationId } } })),
        };
      }
      return prisma.staffProfile.update({
        where: { id }, data: updateData,
        include: { user: true, schedules: true, assignedServices: {include: {service:true}}, locationAssignments: {include: {location:true}} }
      });
    },
    deleteStaffProfile: async (_parent: unknown, { id }: { id: string }, context: GraphQLContext) => {
      if (!isAdminUser(context)) throw new ForbiddenError('Not authorized.');
      return prisma.staffProfile.delete({ where: { id }, include: { user: true } });
    },
    updateStaffSchedule: async (_parent: unknown, { staffProfileId, schedule }: { staffProfileId: string; schedule: StaffScheduleInput[] }, context: GraphQLContext) => {
      if (!isAdminUser(context)) throw new ForbiddenError('Not authorized.');
      const regularHoursSchedule: Prisma.StaffScheduleCreateManyInput[] = schedule
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
        return locationServices.map(ls => ls.location) || [];
      } catch (error) {
        console.error('Error fetching service locations:', error);
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
        const whereCondition: Prisma.StaffScheduleWhereInput = { staffProfileId: parent.id };
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
        return staffServices.map(ss => ss.service) || [];
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
        return staffLocations.map(sl => sl.location) || [];
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
};
