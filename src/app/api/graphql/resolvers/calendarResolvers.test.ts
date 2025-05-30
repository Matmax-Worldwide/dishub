import { calendarResolvers } from './calendarResolvers';
import { prisma } from '@/lib/prisma'; // Path to Prisma client
import { ForbiddenError, AuthenticationError } from 'apollo-server-errors'; // Or your specific error types
import { Prisma } from '@prisma/client';

// Mock Prisma client
jest.mock('@/lib/prisma', () => ({
  prisma: {
    location: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    serviceCategory: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    service: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    staffProfile: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    staffSchedule: {
      createMany: jest.fn(),
      deleteMany: jest.fn(),
      findMany: jest.fn(),
    },
    booking: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    bookingRule: {
      findFirst: jest.fn(),
      upsert: jest.fn(),
    },
    // Mock other models as needed for relations or other resolvers
    locationService: {
        deleteMany: jest.fn(),
        create: jest.fn(),
    },
    staffService: {
        deleteMany: jest.fn(),
        create: jest.fn(),
    },
    staffLocationAssignment: {
        deleteMany: jest.fn(),
        create: jest.fn(),
    },
    user: { // For staffProfile.user relation
        findUnique: jest.fn(),
    },
    $transaction: jest.fn().mockImplementation(async (callback) => {
      // If callback is an array of promises
      if (Array.isArray(callback)) {
        return Promise.all(callback);
      }
      // If callback is a function
      return callback(prisma);
    }),
  },
}));


// --- Mock Contexts ---
const adminContext = { user: { id: 'adminUserId', role: { name: 'ADMIN' } } };
const superAdminContext = { user: { id: 'superAdminUserId', role: { name: 'SUPER_ADMIN' } } };
const userContext = { user: { id: 'regularUserId', role: { name: 'USER' } } };
const noAuthContext = {};

describe('Calendar Resolvers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // --- Location Resolvers ---
  describe('Location Queries', () => {
    describe('query: location', () => {
      it('should return a location if found', async () => {
        const mockLocation = { id: 'loc1', name: 'Main Clinic', address: '123 Health St' };
        (prisma.location.findUnique as jest.Mock).mockResolvedValue(mockLocation);
        const result = await calendarResolvers.Query.location(null, { id: 'loc1' }, adminContext);
        expect(prisma.location.findUnique).toHaveBeenCalledWith({ 
            where: { id: 'loc1' },
            include: { 
                services: { include: { service: true } }, 
                bookingRules: true, 
                schedules: { where: { scheduleType: Prisma.ScheduleType.REGULAR_HOURS }}
            }
        });
        expect(result).toEqual(mockLocation);
      });

      it('should return null if location not found', async () => {
        (prisma.location.findUnique as jest.Mock).mockResolvedValue(null);
        const result = await calendarResolvers.Query.location(null, { id: 'loc_non_existent' }, adminContext);
        expect(result).toBeNull();
      });
    });

    describe('query: locations', () => {
      it('should return a list of locations', async () => {
        const mockLocations = [
          { id: 'loc1', name: 'Main Clinic' },
          { id: 'loc2', name: 'Downtown Branch' },
        ];
        (prisma.location.findMany as jest.Mock).mockResolvedValue(mockLocations);
        const result = await calendarResolvers.Query.locations(null, {}, adminContext);
         expect(prisma.location.findMany).toHaveBeenCalledWith({
            orderBy: { name: 'asc' },
            include: { 
                services: { take: 5, include: { service: {select : {name: true, id: true}} } },
                bookingRules: { take: 1}
            } 
         });
        expect(result).toEqual(mockLocations);
      });
    });
  });

  describe('Location Mutations', () => {
    const locationInput = { name: 'New Location', address: '100 Test Ave', operatingHours: { MONDAY: "9-5" } };
    const createdLocation = { id: 'loc_new', ...locationInput, createdAt: new Date(), updatedAt: new Date() };

    describe('mutation: createLocation', () => {
      it('should create a location for an admin user', async () => {
        (prisma.location.create as jest.Mock).mockResolvedValue(createdLocation);
        const result = await calendarResolvers.Mutation.createLocation(null, { input: locationInput }, adminContext);
        expect(prisma.location.create).toHaveBeenCalledWith({ data: locationInput });
        expect(result).toEqual(createdLocation);
      });
      
      it('should create a location for a SUPER_ADMIN user', async () => {
        (prisma.location.create as jest.Mock).mockResolvedValue(createdLocation);
        const result = await calendarResolvers.Mutation.createLocation(null, { input: locationInput }, superAdminContext);
        expect(prisma.location.create).toHaveBeenCalledWith({ data: locationInput });
        expect(result).toEqual(createdLocation);
      });

      it('should throw ForbiddenError for a non-admin user', async () => {
        await expect(calendarResolvers.Mutation.createLocation(null, { input: locationInput }, userContext))
          .rejects.toThrow(ForbiddenError);
      });

      it('should throw ForbiddenError if no user in context (simulating auth error pathway)', async () => {
        // The isAdminUser check itself doesn't throw AuthenticationError, it returns false.
        // The resolver then throws ForbiddenError based on that.
        await expect(calendarResolvers.Mutation.createLocation(null, { input: locationInput }, noAuthContext))
          .rejects.toThrow(ForbiddenError);
      });
    });

    describe('mutation: updateLocation', () => {
        const updateInput = { name: 'Updated Location Name' };
        const updatedLocation = { ...createdLocation, ...updateInput };

        it('should update a location for an admin user', async () => {
            (prisma.location.update as jest.Mock).mockResolvedValue(updatedLocation);
            const result = await calendarResolvers.Mutation.updateLocation(null, { id: 'loc_new', input: updateInput }, adminContext);
            expect(prisma.location.update).toHaveBeenCalledWith({ where: { id: 'loc_new' }, data: updateInput });
            expect(result).toEqual(updatedLocation);
        });

        it('should throw ForbiddenError for a non-admin user', async () => {
            await expect(calendarResolvers.Mutation.updateLocation(null, { id: 'loc_new', input: updateInput }, userContext))
              .rejects.toThrow(ForbiddenError);
        });
    });

    describe('mutation: deleteLocation', () => {
        it('should delete a location for an admin user', async () => {
            (prisma.location.delete as jest.Mock).mockResolvedValue(createdLocation); // Mock the deleted record being returned
            const result = await calendarResolvers.Mutation.deleteLocation(null, { id: 'loc_new' }, adminContext);
            expect(prisma.location.delete).toHaveBeenCalledWith({ where: { id: 'loc_new' } });
            expect(result).toEqual(createdLocation);
        });

        it('should throw ForbiddenError for a non-admin user', async () => {
            await expect(calendarResolvers.Mutation.deleteLocation(null, { id: 'loc_new' }, userContext))
              .rejects.toThrow(ForbiddenError);
        });
    });
  });

  // --- ServiceCategory Resolvers ---
  describe('ServiceCategory Queries', () => {
    describe('query: serviceCategory', () => {
      it('should return a service category if found', async () => {
        const mockCategory = { id: 'cat1', name: 'Haircuts', displayOrder: 1 };
        (prisma.serviceCategory.findUnique as jest.Mock).mockResolvedValue(mockCategory);
        const result = await calendarResolvers.Query.serviceCategory(null, { id: 'cat1' }, adminContext);
        expect(prisma.serviceCategory.findUnique).toHaveBeenCalledWith({ 
            where: { id: 'cat1' },
            include: { parentCategory: true, childCategories: true, services: {take: 5, select: {name: true, id: true}} }
        });
        expect(result).toEqual(mockCategory);
      });
    });
    describe('query: serviceCategories', () => {
      it('should return a list of service categories', async () => {
        const mockCategories = [{ id: 'cat1', name: 'Haircuts' }, { id: 'cat2', name: 'Massages' }];
        (prisma.serviceCategory.findMany as jest.Mock).mockResolvedValue(mockCategories);
        const result = await calendarResolvers.Query.serviceCategories(null, {}, adminContext);
        expect(prisma.serviceCategory.findMany).toHaveBeenCalledWith({
            orderBy: { displayOrder: 'asc' },
            include: { services: { take: 3, select: {name: true, id: true} } } 
        });
        expect(result).toEqual(mockCategories);
      });
    });
  });

  describe('ServiceCategory Mutations', () => {
    const categoryInput = { name: 'New Category', description: 'Details', displayOrder: 1 };
    const createdCategory = { id: 'cat_new', ...categoryInput, parentId: null, createdAt: new Date(), updatedAt: new Date() };

    describe('mutation: createServiceCategory', () => {
      it('should create a category for an admin user', async () => {
        (prisma.serviceCategory.create as jest.Mock).mockResolvedValue(createdCategory);
        const result = await calendarResolvers.Mutation.createServiceCategory(null, { input: categoryInput }, adminContext);
        expect(prisma.serviceCategory.create).toHaveBeenCalledWith({ data: categoryInput });
        expect(result).toEqual(createdCategory);
      });
      it('should set parentId to undefined if passed as empty string', async () => {
        (prisma.serviceCategory.create as jest.Mock).mockResolvedValue(createdCategory);
        await calendarResolvers.Mutation.createServiceCategory(null, { input: {...categoryInput, parentId: ''} }, adminContext);
        expect(prisma.serviceCategory.create).toHaveBeenCalledWith({ data: {...categoryInput, parentId: undefined} });
      });
      it('should throw ForbiddenError for non-admin', async () => {
        await expect(calendarResolvers.Mutation.createServiceCategory(null, { input: categoryInput }, userContext))
          .rejects.toThrow(ForbiddenError);
      });

      it('should handle Prisma unique constraint error (e.g., duplicate name)', async () => {
        const prismaError = {
          code: 'P2002', // Prisma unique constraint violation code
          meta: { target: ['name'] }, // Example: unique constraint on 'name' field
        };
        (prisma.serviceCategory.create as jest.Mock).mockRejectedValue(prismaError);
        
        // How the resolver handles this depends on its implementation.
        // It might throw a generic error, a specific ApolloError (like UserInputError), or return null.
        // Assuming it re-throws or throws a generic error for this test.
        await expect(calendarResolvers.Mutation.createServiceCategory(null, { input: categoryInput }, adminContext))
          .rejects.toThrow(expect.objectContaining({ code: 'P2002' })); 
          // Or .rejects.toThrow(UserInputError) if it's caught and re-thrown as such.
      });
    });
    // Similar tests for updateServiceCategory and deleteServiceCategory
  });

  // --- Service Resolvers ---
  describe('Service Queries', () => {
    describe('query: service', () => {
      it('should return a service if found', async () => {
        const mockService = { id: 'svc1', name: 'Standard Consultation', durationMinutes: 30, price: 100, serviceCategoryId: 'cat1' };
        (prisma.service.findUnique as jest.Mock).mockResolvedValue(mockService);
        const result = await calendarResolvers.Query.service(null, { id: 'svc1' }, adminContext);
        expect(prisma.service.findUnique).toHaveBeenCalledWith({
          where: { id: 'svc1' },
          include: { 
            serviceCategory: true, 
            locations: { include: { location: true } },
            staff: { include: { staffProfile: { include: { user: {select: {id: true, firstName:true, lastName:true, email: true}}}}}}
          },
        });
        expect(result).toEqual(mockService);
      });
    });
    describe('query: services', () => {
      it('should return a list of services', async () => {
        const mockServices = [{ id: 'svc1', name: 'Consultation' }, { id: 'svc2', name: 'Follow-up' }];
        (prisma.service.findMany as jest.Mock).mockResolvedValue(mockServices);
        const result = await calendarResolvers.Query.services(null, {}, adminContext);
        expect(prisma.service.findMany).toHaveBeenCalledWith({
          orderBy: { name: 'asc' },
          include: { 
            serviceCategory: true, 
            locations: { take: 3, include: { location: {select: {name: true, id: true}} } },
            staff: { take: 3, include: { staffProfile: { include: { user: {select: {id: true, firstName:true, lastName:true}}}}}}
          },
        });
        expect(result).toEqual(mockServices);
      });
    });
  });

  describe('Service Mutations', () => {
    const serviceInput = { 
      name: 'New Service', 
      durationMinutes: 60, 
      price: 150, 
      serviceCategoryId: 'cat1',
      locationIds: ['loc1'] 
    };
    const createdService = { 
      id: 'svc_new', 
      name: 'New Service', 
      durationMinutes: 60, 
      price: 150, 
      serviceCategoryId: 'cat1',
      createdAt: new Date(), 
      updatedAt: new Date() 
    };

    describe('mutation: createService', () => {
      it('should create a service with locations for an admin user', async () => {
        (prisma.service.create as jest.Mock).mockResolvedValue(createdService);
        const result = await calendarResolvers.Mutation.createService(null, { input: serviceInput }, adminContext);
        
        const { locationIds, ...expectedServiceData } = serviceInput;
        expect(prisma.service.create).toHaveBeenCalledWith({
          data: {
            ...expectedServiceData,
            serviceCategory: { connect: { id: serviceInput.serviceCategoryId } },
            locations: {
              create: locationIds.map(locId => ({
                location: { connect: { id: locId } },
              })),
            }
          },
          include: { serviceCategory: true, locations: { include: { location: true } } }
        });
        expect(result).toEqual(createdService);
      });

      it('should create a service without locations if locationIds is empty or null', async () => {
        (prisma.service.create as jest.Mock).mockResolvedValue(createdService);
        const inputWithoutLocations = { ...serviceInput, locationIds: [] }; // Test with empty array
        await calendarResolvers.Mutation.createService(null, { input: inputWithoutLocations }, adminContext);
        const { locationIds, ...expectedServiceData } = inputWithoutLocations;
        const createCallData = (prisma.service.create as jest.Mock).mock.calls[0][0].data;
        expect(createCallData).toEqual(expect.objectContaining({ ...expectedServiceData }));
        // Check that locations is undefined or an empty create array if that's the behavior
        expect(createCallData.locations === undefined || (createCallData.locations.create && createCallData.locations.create.length === 0)).toBeTruthy();

        (prisma.service.create as jest.Mock).mockClear();
        const inputWithNullLocations = { ...serviceInput, locationIds: null }; // Test with null
        await calendarResolvers.Mutation.createService(null, { input: inputWithNullLocations as any }, adminContext);
        const { locationIds: _, ...expectedServiceDataNull } = inputWithNullLocations;
        const createCallDataNull = (prisma.service.create as jest.Mock).mock.calls[0][0].data;
        expect(createCallDataNull).toEqual(expect.objectContaining({ ...expectedServiceDataNull }));
        expect(createCallDataNull.locations).toBeUndefined();
      });


      it('should throw ForbiddenError for non-admin', async () => {
        await expect(calendarResolvers.Mutation.createService(null, { input: serviceInput }, userContext))
          .rejects.toThrow(ForbiddenError);
      });
    });

    describe('mutation: updateService', () => {
      const updatePayload = { name: 'Updated Service Name', locationIds: ['loc1', 'loc2'] };
      const updatedService = { ...createdService, name: 'Updated Service Name' };

      it('should update a service and its locations for an admin user', async () => {
        (prisma.service.update as jest.Mock).mockResolvedValue(updatedService);
        const result = await calendarResolvers.Mutation.updateService(null, { id: 'svc_new', input: updatePayload }, adminContext);
        
        const { locationIds, ...expectedServiceData } = updatePayload;
        expect(prisma.service.update).toHaveBeenCalledWith({
          where: { id: 'svc_new' },
          data: {
            ...expectedServiceData,
            locations: {
              deleteMany: {},
              create: locationIds.map(locId => ({
                location: { connect: { id: locId } },
              })),
            }
          },
          include: { serviceCategory: true, locations: { include: { location: true } } }
        });
        expect(result).toEqual(updatedService);
      });
      
      it('should update service category if serviceCategoryId is provided', async () => {
        (prisma.service.update as jest.Mock).mockResolvedValue(updatedService);
        const inputWithCategoryUpdate = { ...updatePayload, serviceCategoryId: 'cat2' };
        await calendarResolvers.Mutation.updateService(null, { id: 'svc_new', input: inputWithCategoryUpdate }, adminContext);
        
        const { locationIds, serviceCategoryId, ...expectedServiceData } = inputWithCategoryUpdate;
        expect(prisma.service.update).toHaveBeenCalledWith(expect.objectContaining({
            data: expect.objectContaining({
                ...expectedServiceData,
                serviceCategory: { connect: { id: serviceCategoryId } },
            })
        }));
      });

      it('should not modify locations if locationIds is undefined', async () => {
        (prisma.service.update as jest.Mock).mockResolvedValue(updatedService);
        const inputWithoutLocationIds = { name: 'Only Name Update' };
        await calendarResolvers.Mutation.updateService(null, { id: 'svc_new', input: inputWithoutLocationIds }, adminContext);
        
        const updateCallData = (prisma.service.update as jest.Mock).mock.calls[0][0].data;
        expect(updateCallData.name).toBe('Only Name Update');
        expect(updateCallData.locations).toBeUndefined();
      });

      it('should throw ForbiddenError for non-admin', async () => {
        await expect(calendarResolvers.Mutation.updateService(null, { id: 'svc_new', input: updatePayload }, userContext))
          .rejects.toThrow(ForbiddenError);
      });
    });
    // TODO: Add tests for deleteService
  });

  // --- StaffProfile & StaffSchedule Resolvers ---
  describe('StaffProfile Queries', () => {
    const mockStaffProfile = { 
      id: 'staff1', userId: 'user1', bio: 'Experienced stylist', 
      user: { id: 'user1', firstName: 'John', lastName: 'Doe', email: 'john@example.com'},
      schedules: [], assignedServices: [], locationAssignments: []
    };

    describe('query: staffProfile', () => {
      it('should return a staff profile if found', async () => {
        (prisma.staffProfile.findUnique as jest.Mock).mockResolvedValue(mockStaffProfile);
        const result = await calendarResolvers.Query.staffProfile(null, { id: 'staff1' }, adminContext);
        expect(prisma.staffProfile.findUnique).toHaveBeenCalledWith({
          where: { id: 'staff1' },
          include: { 
            user: true, 
            schedules: { orderBy: [{dayOfWeek: 'asc'}, {startTime: 'asc'}] },
            assignedServices: { include: { service: true } },
            locationAssignments: { include: { location: true } },
          },
        });
        expect(result).toEqual(mockStaffProfile);
      });
    });

    describe('query: staffProfiles', () => {
      it('should return a list of staff profiles', async () => {
        const mockProfiles = [mockStaffProfile];
        (prisma.staffProfile.findMany as jest.Mock).mockResolvedValue(mockProfiles);
        const result = await calendarResolvers.Query.staffProfiles(null, {}, adminContext);
        expect(prisma.staffProfile.findMany).toHaveBeenCalledWith({
          orderBy: { user: { firstName: 'asc' } },
          include: { 
            user: true, 
            schedules: { where: { scheduleType: Prisma.ScheduleType.REGULAR_HOURS }, orderBy: { dayOfWeek: 'asc'} },
            assignedServices: { take: 5, include: { service: {select: {name: true, id: true}} } }, 
            locationAssignments: { take: 3, include: { location: {select: {name: true, id: true}} } }, 
          },
        });
        expect(result).toEqual(mockProfiles);
      });
    });
  });

  describe('StaffProfile Mutations', () => {
    const staffProfileInput = {
      userId: 'user2',
      bio: 'New staff member',
      specializations: ['cutting'],
      assignedServiceIds: ['svc1'],
      assignedLocationIds: ['loc1'],
    };
    const createdStaffProfile = { 
      id: 'staff_new', 
      userId: 'user2',
      bio: 'New staff member',
      specializations: ['cutting'],
      // ... relations would be populated by prisma includes
    };
    const fullCreatedStaffProfileWithSchedule = {
        ...createdStaffProfile,
        user: {id: 'user2', firstName: 'Jane', lastName: 'Doe'},
        schedules: expect.any(Array), // Default schedule
        assignedServices: expect.any(Array),
        locationAssignments: expect.any(Array),
    };


    describe('mutation: createStaffProfile', () => {
      beforeEach(() => {
        (prisma.staffProfile.findUnique as jest.Mock).mockResolvedValue(null); // No existing profile for user
        (prisma.staffProfile.create as jest.Mock).mockResolvedValue(createdStaffProfile);
        (prisma.staffSchedule.createMany as jest.Mock).mockResolvedValue({ count: 7 }); // 7 days default schedule
         // Mock the final findUnique call after creation and schedule setup
        (prisma.staffProfile.findUnique as jest.Mock).mockImplementation(args => {
            if (args.where.id === 'staff_new') {
                return Promise.resolve(fullCreatedStaffProfileWithSchedule);
            }
            return Promise.resolve(null); // For the initial check
        });
      });

      it('should create a staff profile and default schedule for an admin user', async () => {
        const result = await calendarResolvers.Mutation.createStaffProfile(null, { input: staffProfileInput }, adminContext);
        
        expect(prisma.staffProfile.create).toHaveBeenCalledWith({
          data: {
            user: { connect: { id: staffProfileInput.userId } },
            bio: staffProfileInput.bio,
            specializations: staffProfileInput.specializations,
            assignedServices: { create: staffProfileInput.assignedServiceIds.map(id => ({ service: { connect: { id } } })) },
            locationAssignments: { create: staffProfileInput.assignedLocationIds.map(id => ({ location: { connect: { id } } })) },
          },
        });
        expect(prisma.staffSchedule.createMany).toHaveBeenCalledWith({
          data: expect.arrayContaining([
            expect.objectContaining({ staffProfileId: createdStaffProfile.id, dayOfWeek: Prisma.DayOfWeek.MONDAY })
          ])
        });
        expect(result).toEqual(fullCreatedStaffProfileWithSchedule);
      });

      it('should throw an error if user already has a staff profile', async () => {
        (prisma.staffProfile.findUnique as jest.Mock).mockReset(); // Clear previous mock setup for this specific scenario
        (prisma.staffProfile.findUnique as jest.Mock).mockResolvedValueOnce({ id: 'existing_staff', userId: 'user2' }); // User already has profile
        
        await expect(calendarResolvers.Mutation.createStaffProfile(null, { input: staffProfileInput }, adminContext))
          .rejects.toThrow('User already has a staff profile.');
         expect(prisma.staffProfile.create).not.toHaveBeenCalled();
      });

      it('should throw ForbiddenError for non-admin', async () => {
        await expect(calendarResolvers.Mutation.createStaffProfile(null, { input: staffProfileInput }, userContext))
          .rejects.toThrow(ForbiddenError);
      });
    });

    describe('mutation: updateStaffProfile', () => {
        const updateInput = { bio: 'Updated bio', assignedServiceIds: ['svc2'] };
        const updatedStaffProfile = { ...createdStaffProfile, bio: 'Updated bio' };

        it('should update a staff profile for an admin user', async () => {
            (prisma.staffProfile.update as jest.Mock).mockResolvedValue(updatedStaffProfile);
            const result = await calendarResolvers.Mutation.updateStaffProfile(null, { id: 'staff_new', input: updateInput }, adminContext);
            expect(prisma.staffProfile.update).toHaveBeenCalledWith({
                where: { id: 'staff_new' },
                data: {
                    bio: updateInput.bio,
                    assignedServices: {
                        deleteMany: {},
                        create: updateInput.assignedServiceIds.map(id => ({ service: { connect: { id } } }))
                    }
                },
                include: { user: true, schedules: true, assignedServices: {include: {service:true}}, locationAssignments: {include: {location:true}} }
            });
            expect(result).toEqual(updatedStaffProfile);
        });
        // Add more specific update scenarios (only specializations, only locations, etc.)
        it('should throw ForbiddenError for non-admin', async () => {
             await expect(calendarResolvers.Mutation.updateStaffProfile(null, { id: 'staff_new', input: updateInput }, userContext))
                .rejects.toThrow(ForbiddenError);
        });
    });

    describe('mutation: deleteStaffProfile', () => {
        const staffProfileId = 'staff_to_delete';
        const mockDeletedStaffProfile = { 
            id: staffProfileId, 
            userId: 'user_deleted', 
            user: { firstName: 'Old', lastName: 'Staff' } 
        };

        it('should delete a staff profile for an admin user', async () => {
            (prisma.staffProfile.delete as jest.Mock).mockResolvedValue(mockDeletedStaffProfile);
            const result = await calendarResolvers.Mutation.deleteStaffProfile(null, { id: staffProfileId }, adminContext);
            expect(prisma.staffProfile.delete).toHaveBeenCalledWith({ 
                where: { id: staffProfileId },
                include: { user: true } // As per resolver
            });
            expect(result).toEqual(mockDeletedStaffProfile);
        });

        it('should throw ForbiddenError for non-admin user', async () => {
            await expect(calendarResolvers.Mutation.deleteStaffProfile(null, { id: staffProfileId }, userContext))
                .rejects.toThrow(ForbiddenError);
        });

        it('should throw an error if staff profile to delete is not found (prisma error)', async () => {
            (prisma.staffProfile.delete as jest.Mock).mockRejectedValue(new Error('Record to delete does not exist.'));
            await expect(calendarResolvers.Mutation.deleteStaffProfile(null, { id: 'staff_non_existent' }, adminContext))
                .rejects.toThrow('Record to delete does not exist.');
        });
    });
  });
  
  describe('StaffSchedule Mutations', () => {
    const staffProfileId = 'staff1';
    const scheduleInput: Partial<Prisma.StaffScheduleCreateManyInput>[] = [ // Using partial for easier mock definition
      { dayOfWeek: Prisma.DayOfWeek.MONDAY, startTime: '09:00', endTime: '17:00', isAvailable: true, scheduleType: Prisma.ScheduleType.REGULAR_HOURS },
      { dayOfWeek: Prisma.DayOfWeek.TUESDAY, startTime: '10:00', endTime: '18:00', isAvailable: true, scheduleType: Prisma.ScheduleType.REGULAR_HOURS },
    ];
    const expectedScheduleData = scheduleInput.map(s => ({...s, staffProfileId, locationId: null, notes: null}));


    describe('mutation: updateStaffSchedule', () => {
        beforeEach(() => {
            (prisma.staffSchedule.deleteMany as jest.Mock).mockResolvedValue({ count: 7 });
            (prisma.staffSchedule.createMany as jest.Mock).mockResolvedValue({ count: scheduleInput.length });
            (prisma.staffSchedule.findMany as jest.Mock).mockResolvedValue(expectedScheduleData as any); // Cast as any if type mismatch with Prisma generated
        });

        it('should update staff regular hours schedule for an admin user', async () => {
            const result = await calendarResolvers.Mutation.updateStaffSchedule(null, { staffProfileId, schedule: scheduleInput as any }, adminContext);
            
            expect(prisma.$transaction).toHaveBeenCalled(); // Check if transaction was called
            // The actual calls to deleteMany and createMany are within the transaction mock
            // This requires a more sophisticated mock for $transaction if we want to assert calls within it.
            // For now, we check that the transaction was invoked, and the final findMany returns expected.

            // To test calls within transaction, mock for $transaction needs to execute the callback
            // and allow us to spy on prisma methods called by that callback.
            // The current $transaction mock does this.
            expect(prisma.staffSchedule.deleteMany).toHaveBeenCalledWith({
                where: { staffProfileId, scheduleType: Prisma.ScheduleType.REGULAR_HOURS }
            });
            expect(prisma.staffSchedule.createMany).toHaveBeenCalledWith({
                data: expectedScheduleData
            });
            expect(prisma.staffSchedule.findMany).toHaveBeenCalledWith({
                where: { staffProfileId, scheduleType: Prisma.ScheduleType.REGULAR_HOURS },
                orderBy: { dayOfWeek: 'asc' }, include: { location: true }
            });
            expect(result).toEqual(expectedScheduleData);
        });

        it('should only process REGULAR_HOURS from input', async () => {
            const mixedScheduleInput = [
                ...scheduleInput,
                { dayOfWeek: Prisma.DayOfWeek.WEDNESDAY, startTime: '10:00', endTime: '14:00', isAvailable: false, scheduleType: Prisma.ScheduleType.TIME_OFF }
            ];
            await calendarResolvers.Mutation.updateStaffSchedule(null, { staffProfileId, schedule: mixedScheduleInput as any }, adminContext);
            expect(prisma.staffSchedule.createMany).toHaveBeenCalledWith({
                data: expectedScheduleData // Should still be only the REGULAR_HOURS ones
            });
        });
        
        it('should throw ForbiddenError for non-admin', async () => {
            await expect(calendarResolvers.Mutation.updateStaffSchedule(null, { staffProfileId, schedule: scheduleInput as any }, userContext))
                .rejects.toThrow(ForbiddenError);
        });
    });
  });

  // --- BookingRule Resolvers ---
  describe('BookingRule Resolvers', () => {
    const defaultBookingRuleData = {
        locationId: null, // Global rule
        minBookingLeadTimeHours: 24, 
        maxBookingLeadTimeDays: 60,
        cancellationPolicyHours: 48,
        slotDurationMinutes: 60,
        simultaneousBookingsPerSlot: 1,
        requireApproval: false,
    };
    const mockGlobalBookingRule = { 
        id: 'globalRule1', 
        ...defaultBookingRuleData,
        createdAt: new Date(), 
        updatedAt: new Date() 
    };

    // Mock the specific create function for BookingRule if not already broadly mocked
    // Ensure prisma.bookingRule.create is a mock function for the create test case
    if (!jest.isMockFunction(prisma.bookingRule.create)) {
        prisma.bookingRule.create = jest.fn();
    }
    if (!jest.isMockFunction(prisma.bookingRule.update)) {
        prisma.bookingRule.update = jest.fn();
    }


    describe('Query: globalBookingRule', () => {
      it('should return existing global booking rule if found', async () => {
        (prisma.bookingRule.findFirst as jest.Mock).mockResolvedValue(mockGlobalBookingRule);
        const result = await calendarResolvers.Query.globalBookingRule(null, {}, adminContext); // Assuming admin can access
        expect(prisma.bookingRule.findFirst).toHaveBeenCalledWith({ where: { locationId: null } });
        expect(result).toEqual(mockGlobalBookingRule);
      });

      it('should create and return a default global booking rule if none exists', async () => {
        (prisma.bookingRule.findFirst as jest.Mock).mockResolvedValue(null); // No rule exists
        (prisma.bookingRule.create as jest.Mock).mockResolvedValue(mockGlobalBookingRule); // Mock creation
        
        const result = await calendarResolvers.Query.globalBookingRule(null, {}, adminContext);
        
        expect(prisma.bookingRule.findFirst).toHaveBeenCalledWith({ where: { locationId: null } });
        expect(prisma.bookingRule.create).toHaveBeenCalledWith({ data: defaultBookingRuleData });
        expect(result).toEqual(mockGlobalBookingRule);
      });
      
      it('should be accessible by non-admin users (public query)', async () => {
        (prisma.bookingRule.findFirst as jest.Mock).mockResolvedValue(mockGlobalBookingRule);
        const result = await calendarResolvers.Query.globalBookingRule(null, {}, userContext); // Test with non-admin
        expect(result).toEqual(mockGlobalBookingRule);
      });
    });

    describe('Mutation: upsertGlobalBookingRule', () => {
        const upsertInput = { 
            minBookingLeadTimeHours: 4, 
            slotDurationMinutes: 45,
        };
        // This is what the resolver's upsert-like logic (findFirst, then update/create) would effectively do.
        const finalUpsertedRule = { ...mockGlobalBookingRule, ...upsertInput }; 

        it('should update existing global rule if found for an admin user', async () => {
            (prisma.bookingRule.findFirst as jest.Mock).mockResolvedValue(mockGlobalBookingRule); // Rule exists
            (prisma.bookingRule.update as jest.Mock).mockResolvedValue(finalUpsertedRule);
            
            const result = await calendarResolvers.Mutation.upsertGlobalBookingRule(null, { input: upsertInput }, adminContext);
            
            expect(prisma.bookingRule.findFirst).toHaveBeenCalledWith({ where: { locationId: null } });
            expect(prisma.bookingRule.update).toHaveBeenCalledWith({
                where: { id: mockGlobalBookingRule.id }, // Assumes resolver finds by ID to update
                data: upsertInput,
            });
            expect(prisma.bookingRule.create).not.toHaveBeenCalled();
            expect(result).toEqual(finalUpsertedRule);
        });

        it('should create new global rule if not found for an admin user', async () => {
            (prisma.bookingRule.findFirst as jest.Mock).mockResolvedValue(null); // Rule does not exist
            // For the create path, the resolver applies defaults first from defaultBookingRuleData then input
            const expectedCreateData = { ...defaultBookingRuleData, ...upsertInput };
            const createdRuleResponse = { ...mockGlobalBookingRule, ...expectedCreateData }; // what create would return
            (prisma.bookingRule.create as jest.Mock).mockResolvedValue(createdRuleResponse);
            
            const result = await calendarResolvers.Mutation.upsertGlobalBookingRule(null, { input: upsertInput }, adminContext);

            expect(prisma.bookingRule.findFirst).toHaveBeenCalledWith({ where: { locationId: null } });
            expect(prisma.bookingRule.create).toHaveBeenCalledWith({
                data: expectedCreateData
            });
            expect(prisma.bookingRule.update).not.toHaveBeenCalled();
            expect(result).toEqual(createdRuleResponse);
        });
        
        it('should throw ForbiddenError for non-admin user', async () => {
            await expect(calendarResolvers.Mutation.upsertGlobalBookingRule(null, { input: upsertInput }, userContext))
                .rejects.toThrow(ForbiddenError);
        });
    });
  });

  // --- Booking Resolvers ---
  describe('Booking Resolvers', () => {
    const mockBooking = {
      id: 'booking1',
      userId: 'user1',
      customerName: 'John Doe',
      customerEmail: 'john@example.com',
      serviceId: 'svc1',
      locationId: 'loc1',
      staffProfileId: 'staff1',
      bookingDate: new Date(),
      startTime: new Date(new Date().setHours(10, 0, 0, 0)),
      endTime: new Date(new Date().setHours(11, 0, 0, 0)),
      status: Prisma.BookingStatus.CONFIRMED,
      notes: 'First time customer',
      createdAt: new Date(),
      updatedAt: new Date(),
      user: { id: 'user1', firstName: 'John', lastName: 'Doe' },
      service: { id: 'svc1', name: 'Consultation' },
      location: { id: 'loc1', name: 'Main Clinic' },
      staffProfile: { id: 'staff1', user: { firstName: 'Dr. Smith' } },
    };
    const mockBookingIncludeArgs = { // From the resolver
        user: true,
        service: true,
        location: true,
        staffProfile: { include: { user: true } },
    };


    describe('Query: bookings', () => {
      it('should return paginated bookings with basic filter for admin', async () => {
        (prisma.booking.count as jest.Mock).mockResolvedValue(1);
        (prisma.booking.findMany as jest.Mock).mockResolvedValue([mockBooking]);

        const filter = { status: Prisma.BookingStatus.CONFIRMED };
        const pagination = { page: 1, pageSize: 10 };
        const result = await calendarResolvers.Query.bookings(null, { filter, pagination }, adminContext);

        expect(prisma.booking.count).toHaveBeenCalledWith({ where: { status: 'CONFIRMED' } });
        expect(prisma.booking.findMany).toHaveBeenCalledWith({
          where: { status: 'CONFIRMED' },
          skip: 0,
          take: 10,
          include: mockBookingIncludeArgs,
          orderBy: { bookingDate: 'desc' },
        });
        expect(result.items).toEqual([mockBooking]);
        expect(result.totalCount).toBe(1);
        expect(result.page).toBe(1);
        expect(result.pageSize).toBe(10);
      });

      it('should apply date range filter correctly', async () => {
        (prisma.booking.count as jest.Mock).mockResolvedValue(0);
        (prisma.booking.findMany as jest.Mock).mockResolvedValue([]);
        const dateFrom = new Date('2024-01-01T00:00:00.000Z');
        const dateTo = new Date('2024-01-31T23:59:59.999Z');
        const filter = { dateFrom, dateTo };
        await calendarResolvers.Query.bookings(null, { filter, pagination: { page: 1, pageSize: 5 } }, adminContext);
        expect(prisma.booking.findMany).toHaveBeenCalledWith(expect.objectContaining({
            where: { bookingDate: { gte: dateFrom, lte: dateTo } }
        }));
      });
      
      it('should apply searchQuery filter correctly to customerName, customerEmail, notes', async () => {
        (prisma.booking.count as jest.Mock).mockResolvedValue(0);
        (prisma.booking.findMany as jest.Mock).mockResolvedValue([]);
        const filter = { searchQuery: "customer search" };
        await calendarResolvers.Query.bookings(null, { filter, pagination: { page: 1, pageSize: 5 } }, adminContext);
        expect(prisma.booking.findMany).toHaveBeenCalledWith(expect.objectContaining({
            where: {
                OR: [
                    { customerName: { contains: "customer search", mode: 'insensitive' } },
                    { customerEmail: { contains: "customer search", mode: 'insensitive' } },
                    { notes: { contains: "customer search", mode: 'insensitive' } },
                ]
            }
        }));
      });
       it('should handle multiple filters combined', async () => {
        (prisma.booking.count as jest.Mock).mockResolvedValue(0);
        (prisma.booking.findMany as jest.Mock).mockResolvedValue([]);
        const filter = { 
            status: Prisma.BookingStatus.PENDING, 
            locationId: 'loc1',
            searchQuery: 'test'
        };
        await calendarResolvers.Query.bookings(null, { filter, pagination: { page: 1, pageSize: 5 } }, adminContext);
        expect(prisma.booking.findMany).toHaveBeenCalledWith(expect.objectContaining({
            where: {
                status: Prisma.BookingStatus.PENDING,
                locationId: 'loc1',
                OR: [
                    { customerName: { contains: "test", mode: 'insensitive' } },
                    { customerEmail: { contains: "test", mode: 'insensitive' } },
                    { notes: { contains: "test", mode: 'insensitive' } },
                ]
            }
        }));
      });


      it('should throw ForbiddenError for non-admin user', async () => {
        await expect(calendarResolvers.Query.bookings(null, {}, userContext))
          .rejects.toThrow(ForbiddenError);
      });
    });

    describe('Mutation: createBooking', () => {
        const bookingDateRaw = new Date();
        const startTimeRaw = new Date(new Date(bookingDateRaw).setHours(14,0,0,0));
        const endTimeRaw = new Date(new Date(bookingDateRaw).setHours(15,0,0,0));

        const bookingInput = {
            serviceId: 'svc1',
            locationId: 'loc1',
            staffProfileId: 'staff1',
            bookingDate: bookingDateRaw.toISOString().split('T')[0], // "YYYY-MM-DD"
            startTime: startTimeRaw.toISOString(), 
            endTime: endTimeRaw.toISOString(), 
            customerName: 'Jane Doe',
            customerEmail: 'jane@example.com',
            customerPhone: '1234567890',
            notes: 'New patient referral.',
            userId: 'userRegistered1' // Optional: if a registered user is making the booking
        };
        const createdBookingResult = { ...mockBooking, ...bookingInput, id: 'bookingNew', status: Prisma.BookingStatus.PENDING };

        it('should create a booking with all details', async () => {
            (prisma.booking.create as jest.Mock).mockResolvedValue(createdBookingResult);
            const result = await calendarResolvers.Mutation.createBooking(null, { input: bookingInput }, adminContext); // Assuming admin can create
            
            expect(prisma.booking.create).toHaveBeenCalledWith({
                data: {
                    serviceId: bookingInput.serviceId,
                    locationId: bookingInput.locationId,
                    staffProfileId: bookingInput.staffProfileId,
                    bookingDate: new Date(bookingInput.bookingDate), // Ensure date objects are passed to Prisma
                    startTime: new Date(bookingInput.startTime),
                    endTime: new Date(bookingInput.endTime),
                    customerName: bookingInput.customerName,
                    customerEmail: bookingInput.customerEmail,
                    customerPhone: bookingInput.customerPhone,
                    notes: bookingInput.notes,
                    userId: bookingInput.userId, 
                    status: Prisma.BookingStatus.PENDING, 
                },
                include: mockBookingIncludeArgs
            });
            expect(result).toEqual(createdBookingResult);
        });
        
        it('should create a booking without optional userId if not provided', async () => {
            const { userId, ...inputWithoutUser } = bookingInput;
            (prisma.booking.create as jest.Mock).mockResolvedValue({ ...createdBookingResult, userId: null, user: null });
            await calendarResolvers.Mutation.createBooking(null, { input: inputWithoutUser }, adminContext);
            expect(prisma.booking.create).toHaveBeenCalledWith(expect.objectContaining({
                data: expect.objectContaining({ userId: undefined }) // Or null, depending on resolver logic
            }));
        });
        
        // The createBooking resolver in the provided code doesn't seem to have specific auth checks,
        // meaning it might be intended for public/semi-public use (e.g., by logged-in users for themselves).
        // If it were admin-only, more auth tests would be needed.
        // For now, assuming it's generally accessible after basic GQL auth.
    });
    
    describe('Mutation: updateBookingStatus', () => {
        const bookingId = 'booking1';
        const newStatus = Prisma.BookingStatus.CANCELLED;
        const updatedBookingResult = { ...mockBooking, status: newStatus };

        it('should update booking status for an admin user', async () => {
            (prisma.booking.update as jest.Mock).mockResolvedValue(updatedBookingResult);
            const result = await calendarResolvers.Mutation.updateBookingStatus(null, { id: bookingId, status: newStatus }, adminContext);
            expect(prisma.booking.update).toHaveBeenCalledWith({
                where: { id: bookingId },
                data: { status: newStatus },
                include: mockBookingIncludeArgs
            });
            expect(result).toEqual(updatedBookingResult);
        });
        
        it('should throw ForbiddenError for non-admin user', async () => {
            await expect(calendarResolvers.Mutation.updateBookingStatus(null, { id: bookingId, status: newStatus }, userContext))
                .rejects.toThrow(ForbiddenError);
        });
        
        it('should throw error if booking not found (if update throws or resolver checks)', async () => {
            (prisma.booking.update as jest.Mock).mockRejectedValue(new Error("Record to update not found."));
            await expect(calendarResolvers.Mutation.updateBookingStatus(null, { id: 'nonExistentBooking', status: newStatus }, adminContext))
                .rejects.toThrow("Record to update not found.");
        });
    });
  });

  // TODO_AVAILABILITY: Add tests for availableSlots query with various scenarios

});
