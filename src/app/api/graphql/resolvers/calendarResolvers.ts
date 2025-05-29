import { prisma } from '@/lib/prisma';
import { AuthenticationError, ForbiddenError } from 'apollo-server-errors'; // Or your project's error types
import { Prisma } from '@prisma/client'; // For JsonNull and other Prisma specific types if needed

// Helper to check for admin role
// Adjust this based on how user/role is actually structured in your context
const isAdminUser = (context: any): boolean => {
  // console.log("Context user for auth check:", JSON.stringify(context.user, null, 2));
  // Example: context.user might be populated by your auth middleware (e.g., from verifyToken)
  // It might look like: context.user = { id: '...', email: '...', role: { name: 'ADMIN' } }
  // Or if role is directly on user: context.user.role === 'ADMIN'
  const roleName = context.user?.role?.name || context.user?.role; // Accommodate both role.name and role
  return roleName === 'ADMIN' || roleName === 'SUPER_ADMIN';
};

export const calendarResolvers = {
  Query: {
    location: async (_parent: unknown, { id }: { id: string }) => {
      return prisma.location.findUnique({ where: { id } });
    },
    locations: async () => {
      return prisma.location.findMany({ orderBy: { name: 'asc' } });
    },
    serviceCategory: async (_parent: unknown, { id }: { id: string }) => {
      return prisma.serviceCategory.findUnique({ where: { id } });
    },
    serviceCategories: async () => {
      return prisma.serviceCategory.findMany({ orderBy: { displayOrder: 'asc' } });
    },
    service: async (_parent: unknown, { id }: { id: string }) => {
      return prisma.service.findUnique({
        where: { id },
        include: { serviceCategory: true, locations: { include: { location: true } } },
      });
    },
    services: async () => {
      return prisma.service.findMany({
        orderBy: { name: 'asc' },
        include: { serviceCategory: true, locations: { include: { location: true } } },
      });
    },
  },
  Mutation: {
    createLocation: async (_parent: unknown, { input }: { input: Prisma.LocationCreateInput }, context: any) => {
      if (!isAdminUser(context)) {
        throw new ForbiddenError('Not authorized to create locations.');
      }
      return prisma.location.create({ data: input });
    },
    updateLocation: async (_parent: unknown, { id, input }: { id: string; input: any /* UpdateLocationInput */ }, context: any) => {
      if (!isAdminUser(context)) {
        throw new ForbiddenError('Not authorized to update locations.');
      }
      return prisma.location.update({
        where: { id },
        data: input,
      });
    },
    deleteLocation: async (_parent: unknown, { id }: { id: string }, context: any) => {
      if (!isAdminUser(context)) {
        throw new ForbiddenError('Not authorized to delete locations.');
      }
      // Consider implications: what happens to services, staff assignments, bookings at this location?
      // Prisma's default behavior on delete might be restricted by foreign keys if not handled (e.g. onDelete: Cascade)
      return prisma.location.delete({ where: { id } });
    },
    createServiceCategory: async (_parent: unknown, { input }: { input: any /* CreateServiceCategoryInput */ }, context: any) => {
      if (!isAdminUser(context)) {
        throw new ForbiddenError('Not authorized to create service categories.');
      }
      // Ensure parentId is null if not provided or empty string, to avoid Prisma errors
      if (input.parentId === '') {
        input.parentId = null;
      }
      return prisma.serviceCategory.create({ data: input });
    },
    updateServiceCategory: async (_parent: unknown, { id, input }: { id: string; input: any /* UpdateServiceCategoryInput */ }, context: any) => {
      if (!isAdminUser(context)) {
        throw new ForbiddenError('Not authorized to update service categories.');
      }
      if (input.parentId === '') {
        input.parentId = null;
      }
      return prisma.serviceCategory.update({
        where: { id },
        data: input,
      });
    },
    deleteServiceCategory: async (_parent: unknown, { id }: { id: string }, context: any) => {
      if (!isAdminUser(context)) {
        throw new ForbiddenError('Not authorized to delete service categories.');
      }
      // Consider implications: what happens to services or child categories?
      // Add checks or cascading logic in Prisma schema if needed.
      return prisma.serviceCategory.delete({ where: { id } });
    },

    createService: async (_parent: unknown, { input }: { input: any /* CreateServiceInput */ }, context: any) => {
      if (!isAdminUser(context)) {
        throw new ForbiddenError('Not authorized to create services.');
      }
      const { locationIds, ...serviceData } = input;
      const data: Prisma.ServiceCreateInput = { ...serviceData };
      if (locationIds && locationIds.length > 0) {
        data.locations = {
          create: locationIds.map((id: string) => ({
            location: { connect: { id } },
          })),
        };
      }
      return prisma.service.create({ data, include: { serviceCategory: true, locations: { include: { location: true } } } });
    },
    updateService: async (_parent: unknown, { id, input }: { id: string; input: any /* UpdateServiceInput */ }, context: any) => {
      if (!isAdminUser(context)) {
        throw new ForbiddenError('Not authorized to update services.');
      }
      const { locationIds, ...serviceData } = input;
      const data: Prisma.ServiceUpdateInput = { ...serviceData };
      if (locationIds !== undefined) { // Allow sending empty array to remove all locations
        data.locations = {
          set: locationIds.map((locId: string) => ({ locationId: locId, serviceId: id })), // Correct for explicit M2M with composite ID
          // For implicit M2M, it would be: set: locationIds.map((id: string) => ({ id }))
          // Since LocationService is explicit, we must provide both parts of the composite key for `set` on the relation.
          // More robustly, manage connect/disconnect:
          // disconnect: (await prisma.locationService.findMany({where: {serviceId: id, NOT: {locationId: { in: locationIds}}})).map(ls => ({locationId_serviceId: {locationId: ls.locationId, serviceId: ls.serviceId}})),
          // connectOrCreate: locationIds.map((locId: string) => ({ where: {locationId_serviceId: {locationId: locId, serviceId: id }}, create: {locationId: locId}}))
        };
         // Correct way for explicit M2M with Prisma:
        // We need to delete existing relations not in locationIds, and create new ones.
        // This is complex in a single update, often done with a transaction or separate calls.
        // For simplicity with `set` on an explicit M2M, Prisma expects the *join table records themselves*, not just IDs.
        // A common pattern is to delete all existing join records and then create new ones.
        // Or, more efficiently, calculate disconnects and connects.
        // For now, let's assume Prisma's `set` on the relation field for M2M handles this correctly if `locationIds` are just the IDs of the `Location` entities.
        // Prisma's `set` on relation for M2M expects a list of unique identifiers for the related model.
        data.locations = { set: locationIds.map((locId: string) => ({ id: locId })) };
        // The above `set` might be for implicit M2M. For explicit, it's more complex.
        // Let's use a transaction for explicit M2M update for clarity and correctness.
        // This part will be simplified for now and might need adjustment based on precise Prisma client capabilities for explicit M2M `set`.
        // The simplest for the client is to send locationIds, and resolver handles M2M.
        // For explicit M2M like LocationService, managing connect/disconnect or set requires careful handling.
        // `set` expects a list of unique identifiers for the *related* model if it's an implicit M2M.
        // For an explicit join table, you typically manage the join table records directly or use nested writes.
        // The `create` and `deleteMany` approach is robust for ensuring the state matches `locationIds`.
        if (locationIds !== undefined) { // locationIds can be an empty array to remove all associations
            data.locations = {
                deleteMany: {}, // Delete all existing LocationService entries for this service
                create: locationIds.map((locId: string) => ({
                    location: { connect: { id: locId } }, // This creates a LocationService record connecting to an existing Location
                })),
            };
        }
      }
      return prisma.service.update({ 
        where: { id }, 
        data, 
        include: { serviceCategory: true, locations: { include: { location: true } } } 
      });
    },
    deleteService: async (_parent: unknown, { id }: { id: string }, context: any) => {
      if (!isAdminUser(context)) {
        throw new ForbiddenError('Not authorized to delete services.');
      }
      // LocationService and StaffService join records should be deleted by Prisma's cascade if set up,
      // or manually cleaned up if not. Assuming cascade or that they are handled.
      return prisma.service.delete({ where: { id } });
    },
  },
  // Relational resolvers
  Location: {
    services: async (parent: { id: string }) => {
      const locationServices = await prisma.locationService.findMany({
        where: { locationId: parent.id, isActive: true }, // only active services for this location
        include: { service: { include: { serviceCategory: true } } },
      });
      return locationServices.map(ls => ls.service);
    },
    // staffAssignments, bookings, schedules, bookingRules will be resolved later
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
    // serviceCategory is included by default in service queries above
    locations: async (parent: { id: string }) => {
      const locationServices = await prisma.locationService.findMany({
        where: { serviceId: parent.id, isActive: true }, // only active locations for this service
        include: { location: true },
      });
      return locationServices.map(ls => ls.location);
    },
    // staff will be resolved later
  },
  StaffProfile: {
    user: async (parent: { userId: string }) => {
      return prisma.user.findUnique({ where: { id: parent.userId } });
    },
    schedules: async (parent: { id: string }, { scheduleType }: { scheduleType?: Prisma.ScheduleType }) => {
      // If scheduleType is provided, filter by it (e.g., REGULAR_HOURS for weekly editor)
      // Otherwise, fetch all schedules for this staff profile.
      const whereCondition: Prisma.StaffScheduleWhereInput = { staffProfileId: parent.id };
      if (scheduleType) {
        whereCondition.scheduleType = scheduleType;
      }
      return prisma.staffSchedule.findMany({ 
        where: whereCondition,
        orderBy: [{ dayOfWeek: 'asc' }, { date: 'asc' }, { startTime: 'asc' }] 
      });
    },
    assignedServices: async (parent: { id: string }) => {
      const staffServices = await prisma.staffService.findMany({
        where: { staffProfileId: parent.id },
        include: { service: { include: { serviceCategory: true } } },
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
    // bookings will be resolved later or via a separate query
  },
  StaffSchedule: {
    location: async (parent: { locationId?: string | null }) => {
      if (!parent.locationId) return null;
      return prisma.location.findUnique({ where: { id: parent.locationId } });
    }
  }
};

// Add new Query resolvers for Staff
calendarResolvers.Query.staffProfile = async (_parent: unknown, { id }: { id: string }) => {
  return prisma.staffProfile.findUnique({
    where: { id },
    include: { 
      user: true, 
      schedules: { where: { scheduleType: Prisma.ScheduleType.REGULAR_HOURS }, orderBy: { dayOfWeek: 'asc'} }, // Default to regular for general profile view
      assignedServices: { include: { service: true } },
      locationAssignments: { include: { location: true } },
    },
  });
};

calendarResolvers.Query.staffProfiles = async () => {
  return prisma.staffProfile.findMany({
    orderBy: { user: { firstName: 'asc' } }, // Order by user's first name
    include: { 
      user: true, // Include basic user details
      schedules: { where: { scheduleType: Prisma.ScheduleType.REGULAR_HOURS }, orderBy: { dayOfWeek: 'asc'} }, // Default to regular
      assignedServices: { take: 3, include: { service: {select: {name: true}} } }, // Summary
      locationAssignments: { take: 3, include: { location: {select: {name: true}} } }, // Summary
    },
  });
};


// Add new Mutation resolvers for Staff
calendarResolvers.Mutation.createStaffProfile = async (_parent: unknown, { input }: { input: any /* CreateStaffProfileInput */ }, context: any) => {
  if (!isAdminUser(context)) {
    throw new ForbiddenError('Not authorized to create staff profiles.');
  }
  const { userId, bio, specializations, assignedServiceIds, assignedLocationIds } = input;

  // Check if user already has a staff profile
  const existingProfile = await prisma.staffProfile.findUnique({ where: { userId } });
  if (existingProfile) {
    throw new Error('This user already has a staff profile.');
  }

  const profileData: Prisma.StaffProfileCreateInput = {
    user: { connect: { id: userId } },
    bio,
    specializations,
  };

  if (assignedServiceIds && assignedServiceIds.length > 0) {
    profileData.assignedServices = {
      create: assignedServiceIds.map((id: string) => ({ service: { connect: { id } } })),
    };
  }
  if (assignedLocationIds && assignedLocationIds.length > 0) {
    profileData.locationAssignments = {
      create: assignedLocationIds.map((id: string) => ({ location: { connect: { id } } })),
    };
  }
  
  const newStaffProfile = await prisma.staffProfile.create({ 
    data: profileData,
    include: { user: true } // Include user for the response
  });

  // Create default weekly schedule (Mon-Fri 9-5, Sat/Sun unavailable)
  const days = Object.values(Prisma.DayOfWeek);
  const defaultSchedule: Prisma.StaffScheduleCreateManyInput[] = days.map(day => {
    const isWeekend = day === Prisma.DayOfWeek.SATURDAY || day === Prisma.DayOfWeek.SUNDAY;
    return {
      staffProfileId: newStaffProfile.id,
      dayOfWeek: day,
      startTime: "09:00",
      endTime: "17:00",
      isAvailable: !isWeekend,
      scheduleType: Prisma.ScheduleType.REGULAR_HOURS,
    };
  });
  await prisma.staffSchedule.createMany({ data: defaultSchedule });

  return prisma.staffProfile.findUnique({ // Re-fetch to include all relations
      where: {id: newStaffProfile.id},
      include: { user: true, schedules: true, assignedServices: {include: {service:true}}, locationAssignments: {include: {location:true}} }
  });
};

calendarResolvers.Mutation.updateStaffProfile = async (_parent: unknown, { id, input }: { id: string; input: any /* UpdateStaffProfileInput */ }, context: any) => {
  if (!isAdminUser(context)) {
    throw new ForbiddenError('Not authorized to update staff profiles.');
  }
  const { bio, specializations, assignedServiceIds, assignedLocationIds } = input;
  
  const updateData: Prisma.StaffProfileUpdateInput = {};
  if (bio !== undefined) updateData.bio = bio;
  if (specializations !== undefined) updateData.specializations = { set: specializations }; // Use set for array

  if (assignedServiceIds !== undefined) {
    updateData.assignedServices = {
      set: [], // Clear existing
      create: assignedServiceIds.map((serviceId: string) => ({ service: { connect: { id: serviceId } } })),
    };
  }
  if (assignedLocationIds !== undefined) {
    updateData.locationAssignments = {
      set: [], // Clear existing
      create: assignedLocationIds.map((locationId: string) => ({ location: { connect: { id: locationId } } })),
    };
  }

  return prisma.staffProfile.update({
    where: { id },
    data: updateData,
    include: { user: true, schedules: true, assignedServices: {include: {service:true}}, locationAssignments: {include: {location:true}} }
  });
};

calendarResolvers.Mutation.deleteStaffProfile = async (_parent: unknown, { id }: { id: string }, context: any) => {
  if (!isAdminUser(context)) {
    throw new ForbiddenError('Not authorized to delete staff profiles.');
  }
  // Prisma's onDelete: Cascade on StaffProfile relations should handle related StaffSchedule, StaffService, StaffLocationAssignment.
  // Bookings related to this staffProfileId will be set to null due to onDelete: SetNull.
  return prisma.staffProfile.delete({ 
    where: { id },
    include: { user: true } // Return user details of deleted staff for confirmation
  });
};

calendarResolvers.Mutation.updateStaffSchedule = async (_parent: unknown, { staffProfileId, schedule }: { staffProfileId: string; schedule: Prisma.StaffScheduleCreateManyInput[] }, context: any) => {
  if (!isAdminUser(context)) {
    throw new ForbiddenError('Not authorized to update staff schedules.');
  }

  // Filter for REGULAR_HOURS only from input, and ensure staffProfileId is part of each item.
  const regularHoursSchedule = schedule
    .filter(s => s.scheduleType === Prisma.ScheduleType.REGULAR_HOURS)
    .map(s => ({ ...s, staffProfileId }));

  // Transaction: delete existing regular hours and create new ones.
  await prisma.$transaction([
    prisma.staffSchedule.deleteMany({
      where: {
        staffProfileId: staffProfileId,
        scheduleType: Prisma.ScheduleType.REGULAR_HOURS,
      },
    }),
    prisma.staffSchedule.createMany({
      data: regularHoursSchedule,
    }),
  ]);

  // Return the newly created schedule for this staff member
  return prisma.staffSchedule.findMany({
    where: {
      staffProfileId: staffProfileId,
      scheduleType: Prisma.ScheduleType.REGULAR_HOURS,
    },
    orderBy: { dayOfWeek: 'asc' },
  });
};
