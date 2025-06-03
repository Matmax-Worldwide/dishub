// src/lib/prisma-extensions/tenant-scope.ts
import { Prisma } from '@prisma/client';

// Define which models are tenant-scoped
// This list should be kept in sync with the models that have `tenantId` in schema.prisma
const TENANT_MODELS: Prisma.ModelName[] = [
  'Page', 'Post', 'User', 'Booking', 'Media', 'CMSSection', 'Menu', 'Form',
  'Shop', 'Product', 'ProductCategory', 'Order', 'Client', 'Project',
  'Appointment', 'Task', 'TimeEntry', 'Notification', 'Performance',
  'UserSettings', 'Employee', 'Department', 'Position', 'Leave', 'Benefit',
  'PerformanceReview', 'EmployeeDocument', 'Training', 'HolidayCalendar',
  'Payroll', 'Collection', 'CMSDocument', 'CMSTemplate', 'CMSComponent',
  'NavigationMenu', 'HeaderStyle', 'FooterStyle', 'Blog', 'Location',
  'ServiceCategory', 'Service', 'StaffProfile', 'StaffSchedule',
  'BookingRule', 'Review', 'Discount', 'CustomerAddress', 'Documentation',
  'Document' // Added Document as it was identified as tenant-specific in previous step
  // Add all your tenant-specific models here.
  // Models like RoleModel, Permission, Currency, SiteSettings, etc., are typically global.
];

function isTenantScopedModel(modelName?: Prisma.ModelName): modelName is typeof TENANT_MODELS[number] {
  return !!modelName && TENANT_MODELS.includes(modelName);
}

export function tenantScopeExtension(tenantId: string | undefined | null) {
  if (!tenantId) {
    // If no tenantId is provided, return a no-op extension.
    // This is important for platform-level operations or when tenant context is not applicable.
    // Queries will not be scoped.
    return Prisma.defineExtension({
      name: 'tenant-scope-noop',
    });
  }

  return Prisma.defineExtension({
    name: 'tenant-scope',
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }) {
          if (isTenantScopedModel(model)) {
            const newArgs = { ...args }; // Clone args to avoid modifying the original

            // Operations that use 'where'
            const opsWithWhere = [
              'findUnique', 'findFirst', 'findMany', 'update', 'updateMany',
              'delete', 'deleteMany', 'count', 'aggregate', 'groupBy',
              'findUniqueOrThrow', 'findFirstOrThrow',
            ];

            // Operations that use 'create' or 'data' for creation
            const opsWithCreateData = ['create', 'createMany', 'upsert'];

            if (opsWithWhere.includes(operation)) {
              newArgs.where = { ...(newArgs.where || {}), tenantId };
            }

            if (operation === 'create') {
              newArgs.data = { ...(newArgs.data || {}), tenantId };
            } else if (operation === 'createMany') {
              if (Array.isArray(newArgs.data)) {
                newArgs.data = newArgs.data.map((item: any) => ({ ...item, tenantId }));
              } else if (newArgs.data) { // Handle single object createMany if Prisma version supports it
                newArgs.data = { ...newArgs.data, tenantId };
              } else {
                // If newArgs.data is undefined or not an array, Prisma itself would likely throw an error.
                // However, if Prisma allows createMany with skipDuplicates and no data for some reason,
                // this log might be relevant.
                console.warn('createMany with undefined or non-array data and tenantScopeExtension might need specific handling.');
              }
            } else if (operation === 'upsert') {
              // Scope the 'where' for the find part of upsert
              newArgs.where = { ...(newArgs.where || {}), tenantId };
              // Inject tenantId into the 'create' part
              newArgs.create = { ...(newArgs.create || {}), tenantId };
              // Ensure tenantId is also part of the 'update' data,
              // Prisma's $ μόλιςupsert operation implicitly uses the 'where' condition for the update.
              // So explicitly adding tenantId to 'update.where' is redundant and could be problematic.
              // We only need to ensure tenantId is part of the update payload.
              newArgs.update = { ...(newArgs.update || {}), tenantId: tenantId };
            }
            return query(newArgs);
          }
          return query(args);
        },
      },
    },
  });
}
