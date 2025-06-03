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

  // At this point, tenantId is guaranteed to be a non-empty string
  const validTenantId: string = tenantId;

  return Prisma.defineExtension({
    name: 'tenant-scope',
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }) {
          if (isTenantScopedModel(model)) {
            // Use unknown type and cast as needed to work with Prisma's complex types
            const newArgs = { ...args } as unknown as Record<string, unknown>;

            // Operations that use 'where'
            const opsWithWhere = [
              'findUnique', 'findFirst', 'findMany', 'update', 'updateMany',
              'delete', 'deleteMany', 'count', 'aggregate', 'groupBy',
              'findUniqueOrThrow', 'findFirstOrThrow',
            ];

            if (opsWithWhere.includes(operation)) {
              // Type guard to ensure args has a where property
              if ('where' in newArgs && typeof newArgs.where === 'object') {
                newArgs.where = { ...(newArgs.where as Record<string, unknown> || {}), tenantId: validTenantId };
              }
            }

            if (operation === 'create') {
              // Type guard to ensure args has a data property
              if ('data' in newArgs && typeof newArgs.data === 'object') {
                newArgs.data = { ...(newArgs.data as Record<string, unknown> || {}), tenantId: validTenantId };
              }
            } else if (operation === 'createMany') {
              if ('data' in newArgs) {
                if (Array.isArray(newArgs.data)) {
                  newArgs.data = newArgs.data.map((item: Record<string, unknown>) => ({ ...item, tenantId: validTenantId }));
                } else if (newArgs.data && typeof newArgs.data === 'object') { // Handle single object createMany if Prisma version supports it
                  newArgs.data = { ...(newArgs.data as Record<string, unknown>), tenantId: validTenantId };
                } else {
                  // If newArgs.data is undefined or not an array, Prisma itself would likely throw an error.
                  // However, if Prisma allows createMany with skipDuplicates and no data for some reason,
                  // this log might be relevant.
                  console.warn('createMany with undefined or non-array data and tenantScopeExtension might need specific handling.');
                }
              }
            } else if (operation === 'upsert') {
              // Scope the 'where' for the find part of upsert
              if ('where' in newArgs && typeof newArgs.where === 'object') {
                newArgs.where = { ...(newArgs.where as Record<string, unknown> || {}), tenantId: validTenantId };
              }
              // Inject tenantId into the 'create' part
              if ('create' in newArgs && typeof newArgs.create === 'object') {
                newArgs.create = { ...(newArgs.create as Record<string, unknown> || {}), tenantId: validTenantId };
              }
              // Ensure tenantId is also part of the 'update' data,
              // Prisma's upsert operation implicitly uses the 'where' condition for the update.
              // So explicitly adding tenantId to 'update.where' is redundant and could be problematic.
              // We only need to ensure tenantId is part of the update payload.
              if ('update' in newArgs && typeof newArgs.update === 'object') {
                newArgs.update = { ...(newArgs.update as Record<string, unknown> || {}), tenantId: validTenantId };
              }
            }
            return query(newArgs as typeof args);
          }
          return query(args);
        },
      },
    },
  });
}
