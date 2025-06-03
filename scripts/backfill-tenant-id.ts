// scripts/backfill-tenant-id.ts
import { PrismaClient, Prisma } from '@prisma/client';

// Initialize Prisma Client using the default connection URL (not tenant-scoped for this script)
const prisma = new PrismaClient();

// !!! IMPORTANT !!!
// 1. CREATE A DEFAULT TENANT IN YOUR 'Tenant' TABLE FIRST.
// 2. REPLACE 'YOUR_DEFAULT_TENANT_ID_HERE' WITH THE ACTUAL ID OF THAT DEFAULT TENANT.
const DEFAULT_TENANT_ID = 'YOUR_DEFAULT_TENANT_ID_HERE';

// List of models that now have a tenantId field and need backfilling.
// Ensure this list is accurate and matches your schema.
const TENANT_SCOPED_MODELS: Prisma.ModelName[] = [
  'Page', 'Post', 'User', 'Booking', 'Media', 'CMSSection', 'Menu', 'Form',
  'Shop', 'Product', 'ProductCategory', 'Order', 'Client', 'Project',
  'Appointment', 'Task', 'TimeEntry', 'Notification', 'Performance',
  'UserSettings', 'Employee', 'Department', 'Position', 'Leave', 'Benefit',
  'PerformanceReview', 'EmployeeDocument', 'Training', 'HolidayCalendar',
  'Payroll', 'Collection', 'CMSDocument', 'CMSTemplate', 'CMSComponent',
  'NavigationMenu', 'HeaderStyle', 'FooterStyle', 'Blog', 'Location',
  'ServiceCategory', 'Service', 'StaffProfile', 'StaffSchedule',
  'BookingRule', 'Review', 'Discount', 'CustomerAddress', 'Documentation',
  'Document' // Added Document as it has tenantId
  // Add any other models that you've made tenant-specific.
];

async function main() {
  if (DEFAULT_TENANT_ID === 'YOUR_DEFAULT_TENANT_ID_HERE') {
    console.error('ERROR: Please replace "YOUR_DEFAULT_TENANT_ID_HERE" with an actual tenant ID in the script.');
    process.exit(1);
  }

  console.log(`Starting backfill process for default tenant ID: ${DEFAULT_TENANT_ID}`);

  for (const modelName of TENANT_SCOPED_MODELS) {
    try {
      // Dynamically access the model via prisma[modelName]
      // The type assertion `any` is used here because TypeScript cannot statically
      // verify that `modelName` will always be a valid key of `prisma` that corresponds
      // to a model with an `updateMany` method and `tenantId` field.
      // This is generally safe if TENANT_SCOPED_MODELS is accurate.
      const modelDelegate = prisma[modelName as keyof PrismaClient] as any;

      if (!modelDelegate || typeof modelDelegate.updateMany !== 'function') {
        console.warn(`Model ${modelName} does not support updateMany or is not a valid Prisma model. Skipping.`);
        continue;
      }

      // For the 'User' model, tenantId is optional. We might only want to backfill
      // for users who are not platform admins or based on specific criteria.
      // For this generic script, we'll update users where tenantId is null.
      // Adjust this logic if User model's tenantId handling is more nuanced.

      console.log(`Processing model: ${modelName}...`);
      const result = await modelDelegate.updateMany({
        where: {
          tenantId: null, // Only update records where tenantId is not already set
        },
        data: {
          tenantId: DEFAULT_TENANT_ID,
        },
      });
      console.log(`  Updated ${result.count} records in ${modelName}.`);

    } catch (error) {
      console.error(`Error updating model ${modelName}:`, error);
    }
  }

  console.log('Backfill process completed.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
