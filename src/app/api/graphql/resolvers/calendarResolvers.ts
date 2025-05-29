import { prisma } from '@/lib/prisma';
import { ForbiddenError } from 'apollo-server-errors'; 
import { Prisma, ScheduleType, DayOfWeek } from '@prisma/client';

// Define proper context type
interface GraphQLContext {
  user?: {
    role?: {
      name: string;
    } | string;
  };
}

// Define input types
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
      return prisma.location.findMany({ 
        orderBy: { name: 'asc' },
        include: { 
            services: { take: 5, include: { service: {select : {name: true, id: true}} } },
            bookingRules: { take: 1} // Assuming one global or first rule for summary
        } 
      });
    },
    serviceCategory: async (_parent: unknown, { id }: { id: string }) => {
      return prisma.serviceCategory.findUnique({ 
        where: { id },
        include: { parentCategory: true, childCategories: true, services: {take: 5, select: {name: true, id: true}} }
      });
    },
    serviceCategories: async () => {
      return prisma.serviceCategory.findMany({ 
        orderBy: { displayOrder: 'asc' },
        include: { services: { take: 3, select: {name: true, id: true} } } 
      });
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
      return prisma.service.findMany({
        orderBy: { name: 'asc' },
        include: { 
          serviceCategory: true, 
          locations: { take: 3, include: { location: {select: {name: true, id: true}} } }, // Summary of locations
          staff: { take: 3, include: { staffProfile: { include: { user: {select: {id: true, firstName:true, lastName:true}}}}}} // Summary of staff
        },
      });
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
      return prisma.staffProfile.findMany({
        orderBy: { user: { firstName: 'asc' } },
        include: { 
          user: true, 
          schedules: { where: { scheduleType: ScheduleType.REGULAR_HOURS }, orderBy: { dayOfWeek: 'asc'} },
          assignedServices: { take: 5, include: { service: {select: {name: true, id: true}} } }, 
          locationAssignments: { take: 3, include: { location: {select: {name: true, id: true}} } }, 
        },
      });
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
  },
  Location: {
    services: async (parent: { id: string }) => {
      const locationServices = await prisma.locationService.findMany({
        where: { locationId: parent.id, isActive: true }, 
        include: { service: { include: { serviceCategory: true } } },
      });
      return locationServices.map(ls => ls.service);
    },
     schedules: async (parent: { id: string }) => {
      return prisma.staffSchedule.findMany({ where: { locationId: parent.id } });
    },
    bookingRules: async (parent: { id: string }) => {
      return prisma.bookingRule.findMany({ where: { locationId: parent.id } });
    }
  },
  ServiceCategory: {
    parentCategory: async (parent: { parentId?: string | null }) => {
      if (!parent.parentId) return null;
      return prisma.serviceCategory.findUnique({ where: { id: parent.parentId } });
    },
    childCategories: async (parent: { id: string }) => {
      return prisma.serviceCategory.findMany({ where: { parentId: parent.id }, orderBy: { displayOrder: 'asc' } });
    },
    services: async (parent: { id: string }) => {
      return prisma.service.findMany({ where: { serviceCategoryId: parent.id, isActive: true }, orderBy: { name: 'asc' } });
    }
  },
  Service: {
    serviceCategory: async (parent: { serviceCategoryId: string }) => {
        if (!parent.serviceCategoryId) return null; // Should always exist based on schema
        return prisma.serviceCategory.findUnique({ where: { id: parent.serviceCategoryId } });
    },
    locations: async (parent: { id: string }) => {
      const locationServices = await prisma.locationService.findMany({
        where: { serviceId: parent.id, isActive: true }, 
        include: { location: true },
      });
      return locationServices.map(ls => ls.location);
    },
    assignedStaff: async (parent: { id: string }) => { // Changed from 'staff' to 'assignedStaff' to match GQL type
        const staffServices = await prisma.staffService.findMany({
            where: { serviceId: parent.id },
            include: { staffProfile: { include: { user: true }}}
        });
        return staffServices.map(ss => ss.staffProfile);
    }
  },
  StaffProfile: {
    user: async (parent: { userId: string }) => {
      return prisma.user.findUnique({ where: { id: parent.userId } });
    },
    schedules: async (parent: { id: string }, args?: { scheduleType?: ScheduleType }) => {
      const whereCondition: Prisma.StaffScheduleWhereInput = { staffProfileId: parent.id };
      if (args?.scheduleType) {
        whereCondition.scheduleType = args.scheduleType;
      }
      // If no specific type requested, might fetch all or default to REGULAR_HOURS
      // For StaffProfile.schedules in GQL, it's [StaffSchedule!], implying all types by default.
      return prisma.staffSchedule.findMany({ 
        where: whereCondition,
        orderBy: [{ dayOfWeek: 'asc' }, { date: 'asc' }, { startTime: 'asc' }] 
      });
    },
    assignedServices: async (parent: { id: string }) => {
      const staffServices = await prisma.staffService.findMany({
        where: { staffProfileId: parent.id },
        include: { service: true }, 
      });
      return staffServices.map(ss => ss.service);
    },
    locationAssignments: async (parent: { id: string }) => {
      const staffLocations = await prisma.staffLocationAssignment.findMany({
        where: { staffProfileId: parent.id },
        include: { location: true },
      });
      return staffLocations.map(sl => sl.location);
    },
  },
  StaffSchedule: {
    location: async (parent: { locationId?: string | null }) => {
      if (!parent.locationId) return null;
      return prisma.location.findUnique({ where: { id: parent.locationId } });
    }
  }
};
