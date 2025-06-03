// src/app/api/graphql/dataloaders/sectionLoader.ts
import DataLoader from 'dataloader'; // Retained for potential type references if needed, though batch function signature is key
import { prisma } from '@/lib/prisma';
import { CMSSection, Page, SectionComponent, CMSComponent } from '@prisma/client';

// Define a type for what the Page query with sections will return for clarity
type PageWithPopulatedSections = Page & {
  sections: (CMSSection & {
    components: (SectionComponent & {
      component: CMSComponent | null;
    })[];
  })[];
};

// Exported batch loading function
export const batchSectionsByPageIds = async (pageIds: readonly string[]): Promise<(CMSSection[])[]> => {
  console.log(`sectionLoader batch fn: Loading sections for page IDs: [${pageIds.join(', ')}]`);

  const pagesWithSections: PageWithPopulatedSections[] = await prisma.page.findMany({
    where: {
      id: { in: pageIds as string[] },
    },
    include: {
      sections: {
        include: {
          components: {
            include: {
              component: true
            },
            orderBy: {
              order: 'asc' // Order for components within a section
            }
          }
        }
        // Note: Ordering of sections themselves on the Page object
        // would typically be handled by an explicit join table with an order field
        // or by the order in which they are related if not specified.
      },
    },
  });

  // Map the results to the order of pageIds
  const sectionsByPageId: Record<string, CMSSection[]> = {};
  pagesWithSections.forEach(page => {
    // Ensure the sections are correctly typed
    sectionsByPageId[page.id] = page.sections as (CMSSection & { components: (SectionComponent & { component: CMSComponent | null })[] })[];
  });

  return pageIds.map(id => sectionsByPageId[id] || []);
};

// Removed: export const sectionLoader = new DataLoader<...>(...)

// Conceptual usage comment update:
// In GraphQL Context function (e.g., src/app/api/graphql/route.ts):
// import { batchSectionsByPageIds } from './dataloaders/sectionLoader'; // Adjust path as necessary
// import DataLoader from 'dataloader';
// // ...
// export interface MyContext { // Example context structure
//   // ... other properties like prisma, user
//   loaders: {
//     sectionLoader: DataLoader<string, CMSSection[], string>;
//     // other loaders
//   };
// }
// // ...
// context: async (req: NextRequest) => {
//   // ... other context setup ...
//   return {
//     // ... prisma, user ...
//     loaders: {
//       sectionLoader: new DataLoader<string, CMSSection[], string>(
//         (keys) => batchSectionsByPageIds(keys), // Pass the exported batch function
//         { cacheKeyFn: (key: string) => key }
//       ),
//       // Initialize other loaders here
//     },
//   };
// },
//
// In GraphQL Resolvers (e.g., for the Page type):
// Page: {
//   sections: async (parentPage: Page, _args: any, context: MyContext, _info: any) => {
//     if (!parentPage.id) return [];
//     return context.loaders.sectionLoader.load(parentPage.id);
//   }
// }
