import { prisma } from '@/lib/prisma';
import { Prisma, PageType, Page as PrismaPage, CMSSection as PrismaCMSSection } from '@prisma/client'; // Added PrismaPage for typing parentPage
import { Context } from '@/app/api/graphql/types'; // Using the main Context from types.ts
import { GraphQLError } from 'graphql';

// Local ResolverContext is removed, using Context from types.ts

// Tipo para los componentes de una sección (from original)
type SectionComponentWithRelation = {
  id: string;
  componentId: string;
  order: number;
  data: Record<string, unknown> | null;
  component: {
    id: string;
    slug: string;
    name: string;
  };
};

// Type for SEO input data (from original)
type PageSEOInput = {
  title?: string | null;
  description?: string | null;
  keywords?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  twitterTitle?: string;
  twitterDescription?: string;
  twitterImage?: string;
  canonicalUrl?: string;
  structuredData?: Record<string, unknown>;
};

export const cmsResolvers = {
  Query: {
    getAllCMSSections: async () => {
      // ... (original logic preserved)
      console.log('======== START getAllCMSSections resolver ========');
      try {
        const sections = await prisma.cMSSection.findMany({
          include: { components: { include: { component: true } } },
          orderBy: { updatedAt: 'desc' }
        });
        console.log(`Se encontraron ${sections.length} secciones`);
        return sections;
      } catch (error) {
        console.error('Error al obtener secciones CMS:', error);
        return [];
      }
    },
    
    getPageBySlug: async (_parent: unknown, args: { slug: string }, context: Context) => {
      console.log('======== START getPageBySlug resolver (Dataloader for sections) ========');
      try {
        const { slug } = args;
        const page = await prisma.page.findUnique({
          where: { slug },
          include: {
            seo: true
            // Removed: sections: true (will be handled by Page.sections field resolver)
          }
        });
        // The 'sections' field will be resolved by the Page.sections resolver using DataLoader
        return page;
      } catch (error) {
        console.error('Error in getPageBySlug:', error);
        return null;
      }
    },
    
    page: async (_parent: unknown, args: { id: string }, context: Context) => {
      console.log('======== START page resolver (Dataloader for sections) ========');
      try {
        const { id } = args;
        console.log(`Looking for page with ID: ${id}`);
        const page = await prisma.page.findUnique({
          where: { id },
          include: {
            seo: true
            // Removed: sections: true
          }
        });
        if (!page) {
          console.log(`No page found with ID: ${id}`);
          return null;
        }
        console.log(`Found page: ${page.title} (${page.slug})`);
        return page;
      } catch (error) {
        console.error('Error in page resolver:', error);
        return null;
      }
    },
    
    getSectionComponents: async (_parent: unknown, args: { sectionId: string }) => {
      // ... (original logic preserved, as it fetches components for a specific section, not sections for a page)
      console.log('======== START getSectionComponents resolver ========');
      try {
        console.log('========================================');
        let { sectionId } = args;
        if (!sectionId) {
          console.error('Error: sectionId is missing or undefined');
          return { components: [], lastUpdated: null };
        }
        if (sectionId.includes('?')) sectionId = sectionId.split('?')[0];
        if (sectionId.includes('#')) sectionId = sectionId.split('#')[0];
        console.log('CMS RESOLVER: Getting section components for section ID:', sectionId);
        
        const sectionFromDB = await prisma.cMSSection.findUnique({
          where: { sectionId },
          include: {
            components: {
              include: { component: true },
              orderBy: { order: 'asc' }
            }
          }
        });

        if (sectionFromDB) {
          const components = (sectionFromDB.components as SectionComponentWithRelation[]).map((sc) => ({
            id: sc.id,
            type: sc.component.slug,
            data: sc.data ? sc.data as Prisma.InputJsonValue : Prisma.JsonNull
          }));
          return {
            components,
            lastUpdated: sectionFromDB.lastUpdated.toISOString()
          };
        } else {
          console.log('Section not found or creating new for ID:', sectionId);
          const timestamp = new Date();
          const newSection = await prisma.cMSSection.upsert({
            where: { sectionId: sectionId },
            update: { lastUpdated: timestamp },
            create: {
              sectionId,
              name: `Sección ${sectionId}`,
              description: `Sección creada automáticamente`,
              lastUpdated: timestamp,
              createdAt: timestamp,
              updatedAt: timestamp
            }
          });
          return {
            components: [],
            lastUpdated: newSection.lastUpdated.toISOString()
          };
        }
      } catch (error) {
        console.error('========================================');
        console.error('ERROR: Error fetching section data:', error);
        console.error('========================================');
        return { components: [], lastUpdated: null };
      }
    },

    getAllCMSComponents: async () => {
      // ... (original logic preserved)
      console.log('======== START getAllCMSComponents resolver ========');
      try {
        const components = await prisma.cMSComponent.findMany({ orderBy: { updatedAt: 'desc' } });
        console.log(`Se encontraron ${components.length} componentes`);
        return components;
      } catch (error) {
        console.error('Error al obtener componentes CMS:', error);
        return [];
      }
    },

    getCMSComponent: async (_parent: unknown, args: { id: string }) => {
      // ... (original logic preserved)
      console.log('======== START getCMSComponent resolver ========');
      try {
        const { id } = args;
        const component = await prisma.cMSComponent.findUnique({ where: { id } });
        if (!component) return null;
        return component;
      } catch (error) {
        console.error('Error al obtener componente CMS:', error);
        return null;
      }
    },

    getCMSComponentsByType: async (_parent: unknown, args: { type: string }) => {
      // ... (original logic preserved)
      console.log('======== START getCMSComponentsByType resolver ========');
      try {
        const { type } = args;
        const components = await prisma.cMSComponent.findMany({
          where: { category: type },
          orderBy: { name: 'asc' }
        });
        return components;
      } catch (error) {
        console.error(`Error al obtener componentes de tipo ${args.type}:`, error);
        return [];
      }
    },

    getAllCMSPages: async (_parent: unknown, _args: any, context: Context) => {
      console.log('======== START getAllCMSPages resolver (Dataloader for sections) ========');
      try {
        const pages = await prisma.page.findMany({
          include: {
            seo: true
            // Removed: sections: true
          },
          orderBy: { createdAt: 'desc' }
        });
        // Sections for each page will be resolved by Page.sections field resolver
        return pages;
      } catch (error) {
        console.error('Error in getAllCMSPages:', error);
        return [];
      }
    },

    getPagesUsingSectionId: async (_parent: unknown, args: { sectionId: string }, context: Context) => {
      // ... (original logic preserved - this fetches pages, not sections for a page, so DataLoader isn't directly applied here for sections)
      // If sections of these pages are needed, the Page.sections resolver will handle it.
      console.log('======== START getPagesUsingSectionId resolver ========');
      try {
        const { sectionId } = args;
        console.log(`Buscando páginas que usan la sección con ID: ${sectionId}`);
        const section = await prisma.cMSSection.findFirst({ where: { sectionId } });
        if (!section) return [];
        console.log(`Sección encontrada: ${section.id} (${section.name})`);
        const pages = await prisma.$queryRaw<PrismaPage[]>`
          SELECT p.* FROM "Page" p
          JOIN "_PageToSection" pts ON p."id" = pts."B" 
          JOIN "CMSSection" s ON s."id" = pts."A"
          WHERE s."id" = ${section.id} OR s."sectionId" = ${sectionId}
          ORDER BY p."updatedAt" DESC
        `;
        if (!Array.isArray(pages) || pages.length === 0) return [];
        // The sections field of these page objects will be resolved by Page.sections resolver
        return pages;
      } catch (error) {
        console.error(`Error al obtener páginas usando sectionId ${args.sectionId}:`, error);
        return [];
      }
    },

    getDefaultPage: async (_parent: unknown, args: { locale: string }, context: Context) => {
      console.log('======== START getDefaultPage resolver (Dataloader for sections) ========');
      try {
        const { locale } = args;
        const page = await prisma.page.findFirst({
          where: { isDefault: true, locale, isPublished: true },
          include: {
            seo: true
            // Removed: sections: true
          }
        });
        // Sections will be resolved by Page.sections field resolver
        return page;
      } catch (error) {
        console.error('Error in getDefaultPage:', error);
        return null;
      }
    },
  },
  
  Mutation: {
    // saveSectionComponents (Already refactored to use Context)
    saveSectionComponents: async (_parent: unknown, args: { 
      input: { 
        sectionId: string; 
        components: Array<{ id: string; type: string; data: Record<string, unknown> }> 
      } 
    }, context: Context) => { // Changed ResolverContext to Context
      try {
        // ... (original refactored logic from Turn 79, ensuring context type is updated)
        console.log('========================================');
        const { input } = args;
        const { components } = input;
        let { sectionId } = input;
        if (sectionId && sectionId.includes('?')) sectionId = sectionId.split('?')[0];
        console.log(`CMS RESOLVER (refactored): Saving ${components?.length || 0} components for section ${sectionId}`);
        if (!components || !Array.isArray(components)) return { success: false, message: 'No valid components array provided', lastUpdated: null };
        const validComponents = components.filter(c => c.id && c.type);
        if (validComponents.length !== components.length) console.warn(`Found ${components.length - validComponents.length} invalid components.`);
        const timestamp = new Date();
        const result = await prisma.$transaction(async (tx) => {
          let section = await tx.cMSSection.findUnique({ where: { sectionId } });
          if (!section) {
            section = await tx.cMSSection.create({
              data: { sectionId, name: sectionId.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()), description: `Sección "${sectionId}"`, lastUpdated: timestamp, createdAt: timestamp, updatedAt: timestamp }
            });
          } else {
            section = await tx.cMSSection.update({ where: { id: section.id }, data: { lastUpdated: timestamp, updatedAt: timestamp } });
          }
          const uniqueTypes = [...new Set(validComponents.map(c => c.type))];
          const existingComponents = await tx.cMSComponent.findMany({ where: { slug: { in: uniqueTypes } } });
          const existingComponentMap = new Map(existingComponents.map(comp => [comp.slug, comp]));
          const missingTypes = uniqueTypes.filter(type => !existingComponentMap.has(type));
          if (missingTypes.length > 0) {
            await tx.cMSComponent.createMany({ data: missingTypes.map(type => ({ name: type, slug: type, description: `Componente tipo ${type}`, schema: {}, isActive: true, createdAt: timestamp, updatedAt: timestamp })) });
            const createdComponents = await tx.cMSComponent.findMany({ where: { slug: { in: missingTypes } } });
            createdComponents.forEach(comp => existingComponentMap.set(comp.slug, comp));
          }
          await tx.sectionComponent.deleteMany({ where: { sectionId: section.id } });
          if (validComponents.length > 0) {
            const sectionComponentsData = validComponents.map((component, index) => {
              const cmsComponent = existingComponentMap.get(component.type);
              if (!cmsComponent) throw new Error(`Component type ${component.type} not found.`);
              return { id: component.id, sectionId: section.id, componentId: cmsComponent.id, order: index, data: component.data as Prisma.InputJsonValue || {}, createdAt: timestamp, updatedAt: timestamp };
            });
            await tx.sectionComponent.createMany({ data: sectionComponentsData });
          }
          return { success: true, message: 'Components saved successfully', lastUpdated: timestamp.toISOString() };
        });
        console.log('Save result:', result);
        console.log('========================================');
        return result;
      } catch (error) {
        console.error('========================================');
        console.error('ERROR: Error saving section data (refactored):', error);
        console.error('========================================');
        return { success: false, message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`, lastUpdated: null, };
      }
    },

    // createCMSSection (Already refactored to use Context for createdBy)
    createCMSSection: async (_parent: unknown, args: {
      input: { sectionId: string; name: string; description?: string; backgroundImage?: string; backgroundType?: string; }
    }, context: Context) => { // Changed ResolverContext to Context
      console.log('📝 Starting createCMSSection resolver');
      try {
        const { input } = args;
        if (!input.sectionId || !input.name) return { success: false, message: 'Los campos sectionId y name son requeridos', section: null };
        const existingSection = await prisma.cMSSection.findFirst({ where: { sectionId: input.sectionId } });
        if (existingSection) return { success: false, message: `Ya existe una sección con el ID: ${input.sectionId}`, section: null };
        const timestamp = new Date();
        const newSection = await prisma.cMSSection.create({
          data: {
            sectionId: input.sectionId, name: input.name, description: input.description || '',
            backgroundImage: input.backgroundImage || null, backgroundType: input.backgroundType || 'gradient',
            lastUpdated: timestamp.toISOString(), createdAt: timestamp, updatedAt: timestamp,
            createdBy: context.user?.id || 'system', order: 0
          }
        });
        return { success: true, message: 'Sección CMS creada correctamente', section: { id: newSection.id, sectionId: newSection.sectionId, name: newSection.name, order: newSection.order || 0 } };
      } catch (error) {
        console.error('❌ Unexpected error in createCMSSection resolver:', error);
        return { success: false, message: error instanceof Error ? error.message : 'Error inesperado al crear la sección CMS', section: null };
      }
    },

    // createPage (Already refactored to use Context for createdById)
    createPage: async (_parent: unknown, args: {
      input: { title: string; slug: string; description?: string; template?: string; isPublished?: boolean; publishDate?: string | null; featuredImage?: string | null; metaTitle?: string | null; metaDescription?: string | null; parentId?: string | null; order?: number; pageType?: string; locale?: string; isDefault?: boolean; sections?: string[]; }
    }, context: Context) => { // Changed ResolverContext to Context
      console.log('======== START createPage resolver ========');
      try {
        const { input } = args;
        // ... (original logic from Turn 79, ensuring context.user.id is used for createdById)
        if (!input.title || !input.slug) throw new Error('El título y el slug son campos requeridos');
        const existingPage = await prisma.page.findFirst({ where: { slug: input.slug } });
        if (existingPage) return { success: false, message: `Ya existe una página con el slug: ${input.slug}`, page: null };
        const localeToUse = input.locale || "en";
        let shouldSetAsDefault = input.isDefault || false;
        if (!shouldSetAsDefault) {
          const existingPagesCount = await prisma.page.count({ where: { locale: localeToUse } });
          if (existingPagesCount === 0) shouldSetAsDefault = true;
        }
        if (shouldSetAsDefault) {
          const existingDefault = await prisma.page.findFirst({ where: { locale: localeToUse, isDefault: true } });
          if (existingDefault) await prisma.page.update({ where: { id: existingDefault.id }, data: { isDefault: false } });
        }
        const timestamp = new Date();
        const newPageData: Prisma.PageCreateInput = {
            title: input.title, slug: input.slug, description: input.description || null,
            template: input.template || "default", isPublished: input.isPublished || false,
            publishDate: input.publishDate ? new Date(input.publishDate) : null,
            featuredImage: input.featuredImage || null, metaTitle: input.metaTitle || null,
            metaDescription: input.metaDescription || null, parentId: input.parentId || null,
            order: input.order !== undefined ? input.order : 0,
            pageType: (input.pageType as PrismaPageType) || PrismaPageType.CONTENT,
            locale: localeToUse, isDefault: shouldSetAsDefault,
            createdById: context.user?.id || "system",
            createdAt: timestamp, updatedAt: timestamp
        };
        const newPage = await prisma.page.create({ data: newPageData });
        if (input.sections && input.sections.length > 0) {
          for (let i = 0; i < input.sections.length; i++) {
            const sectionIdInput = input.sections[i]; // Use a different variable name
            const section = await prisma.cMSSection.findFirst({ where: { sectionId: sectionIdInput } });
            if (section) {
              await prisma.page.update({ where: { id: newPage.id }, data: { sections: { connect: { id: section.id } } } });
              // The order of sections on a page is complex with implicit M2M.
              // This $executeRaw might not work as intended or be schema-dependent.
              // Consider an explicit join table for ordered sections if this is problematic.
              // await prisma.$executeRaw`UPDATE "CMSSection" SET "order" = ${i} WHERE "id" = ${section.id}`;
            }
          }
        }
        const pageWithSections = await prisma.page.findUnique({
          where: { id: newPage.id },
          include: { /* seo: true */ } // Sections removed, will be handled by Page.sections
        });
        return { success: true, message: `Página "${input.title}" creada correctamente${shouldSetAsDefault ? ' y marcada como predeterminada' : ''}`, page: pageWithSections };
      } catch (error) {
        console.error('Error al crear página CMS:', error);
        return { success: false, message: `Error al crear página: ${error instanceof Error ? error.message : 'Error desconocido'}`, page: null };
      }
    },
    // ... (Other mutations like deleteCMSSection, createCMSComponent etc. remain unchanged from previous state)
    // ... (Make sure to copy them over accurately)
    deleteCMSSection: async (_parent: unknown, args: { sectionId: string }) => {
      console.log('======== START deleteCMSSection resolver ========');
      try {
        const { sectionId } = args;
        const existingSection = await prisma.cMSSection.findFirst({ where: { sectionId } });
        if (!existingSection) return { success: false, message: `No se encontró ninguna sección con ID: ${sectionId}` };
        const countResult = await prisma.$queryRaw<[{count: number}]>(Prisma.sql`SELECT COUNT(*) as count FROM "SectionComponent" WHERE "sectionId" = ${existingSection.id}`);
        const componentCount = Number(countResult[0]?.count || 0);
        await prisma.$executeRaw(Prisma.sql`DELETE FROM "SectionComponent" WHERE "sectionId" = ${existingSection.id}`);
        await prisma.cMSSection.delete({ where: { id: existingSection.id } });
        return { success: true, message: `Sección eliminada correctamente. Se desvincularon ${componentCount} componentes.` };
      } catch (error) {
        console.error('Error al eliminar la sección CMS:', error);
        return { success: false, message: `Error al eliminar la sección: ${error instanceof Error ? error.message : 'Error desconocido'}` };
      }
    },

    createCMSComponent: async (_parent: unknown, args: { input: { name: string; slug: string; description?: string; category?: string; schema?: Record<string, unknown>; icon?: string; } }) => {
      console.log('======== START createCMSComponent resolver ========');
      try {
        const { input } = args;
        if (!input.name || !input.slug) throw new Error('Nombre y slug son campos requeridos');
        const existingComponent = await prisma.cMSComponent.findFirst({ where: { slug: input.slug } });
        if (existingComponent) return { success: false, message: `Ya existe un componente con el slug: ${input.slug}`, component: null };
        const timestamp = new Date();
        const newComponent = await prisma.cMSComponent.create({
          data: {
            name: input.name, slug: input.slug, description: input.description || `Componente ${input.name}`,
            category: input.category || null, schema: input.schema as Prisma.InputJsonValue || Prisma.JsonNull,
            icon: input.icon || null, isActive: true, createdAt: timestamp, updatedAt: timestamp
          }
        });
        return { success: true, message: `Componente ${input.name} creado correctamente`, component: newComponent };
      } catch (error) {
        console.error('Error al crear componente CMS:', error);
        return { success: false, message: `Error al crear componente: ${error instanceof Error ? error.message : 'Error desconocido'}`, component: null };
      }
    },

    updateCMSComponent: async (_parent: unknown, args: { id: string; input: { name?: string; description?: string; category?: string; schema?: Record<string, unknown>; icon?: string; isActive?: boolean; } }) => {
      console.log('======== START updateCMSComponent resolver ========');
      try {
        const { id, input } = args;
        const existingComponent = await prisma.cMSComponent.findUnique({ where: { id } });
        if (!existingComponent) return { success: false, message: `No se encontró ningún componente con ID: ${id}`, component: null };
        const updatedComponent = await prisma.cMSComponent.update({
          where: { id },
          data: {
            ...(input.name && { name: input.name }),
            ...(input.description && { description: input.description }),
            ...(input.category !== undefined && { category: input.category }),
            ...(input.schema !== undefined && { schema: input.schema as Prisma.InputJsonValue }),
            ...(input.icon !== undefined && { icon: input.icon }),
            ...(input.isActive !== undefined && { isActive: input.isActive }),
            updatedAt: new Date()
          }
        });
        return { success: true, message: `Componente actualizado correctamente`, component: updatedComponent };
      } catch (error) {
        console.error('Error al actualizar componente CMS:', error);
        return { success: false, message: `Error al actualizar componente: ${error instanceof Error ? error.message : 'Error desconocido'}`, component: null };
      }
    },

    deleteCMSComponent: async (_parent: unknown, args: { id: string }) => {
      console.log('======== START deleteCMSComponent resolver ========');
      try {
        const { id } = args;
        const existingComponent = await prisma.cMSComponent.findUnique({ where: { id } });
        if (!existingComponent) return { success: false, message: `No se encontró ningún componente con ID: ${id}` };
        const usageCount = await prisma.sectionComponent.count({ where: { componentId: id } });
        if (usageCount > 0) return { success: false, message: `No se puede eliminar el componente porque está siendo utilizado en ${usageCount} secciones` };
        await prisma.cMSComponent.delete({ where: { id } });
        return { success: true, message: `Componente eliminado correctamente` };
      } catch (error) {
        console.error('Error al eliminar componente CMS:', error);
        return { success: false, message: `Error al eliminar componente: ${error instanceof Error ? error.message : 'Error desconocido'}` };
      }
    },

    updateCMSSection: async (_parent: unknown, args: { sectionId: string; input: { name?: string; description?: string; backgroundImage?: string; backgroundType?: string; gridDesign?: string; } }) => {
      console.log('======== START updateCMSSection resolver ========');
      try {
        const { sectionId, input } = args;
        const existingSection = await prisma.cMSSection.findFirst({ where: { sectionId } });
        if (!existingSection) return { success: false, message: `No se encontró ninguna sección con ID: ${sectionId}` };
        const timestamp = new Date();
        const updatedSection = await prisma.cMSSection.update({
          where: { id: existingSection.id },
          data: {
            ...(input.name && { name: input.name }),
            ...(input.description && { description: input.description }),
            ...(input.backgroundImage !== undefined && { backgroundImage: input.backgroundImage }),
            ...(input.backgroundType !== undefined && { backgroundType: input.backgroundType }),
            ...(input.gridDesign !== undefined && { gridDesign: input.gridDesign }),
            lastUpdated: timestamp, updatedAt: timestamp
          }
        });
        return { success: true, message: `Sección actualizada correctamente`, lastUpdated: timestamp.toISOString() };
      } catch (error) {
        console.error('Error al actualizar sección CMS:', error);
        return { success: false, message: `Error al actualizar sección: ${error instanceof Error ? error.message : 'Error desconocido'}`, lastUpdated: null };
      }
    },
    updatePage: async (_parent: unknown, args: { id: string; input: { title?: string; slug?: string; description?: string | null; template?: string; isPublished?: boolean; publishDate?: string | null; featuredImage?: string | null; metaTitle?: string | null; metaDescription?: string | null; parentId?: string | null; order?: number; pageType?: string; locale?: string; isDefault?: boolean; seo?: PageSEOInput; sections?: string[]; } }) => {

    // Update page mutation
    updatePage: async (_parent: unknown, args: { 
      id: string;
      input: { 
        title?: string;
        slug?: string;
        description?: string | null;
        template?: string;
        isPublished?: boolean;
        publishDate?: string | null;
        featuredImage?: string | null;
        metaTitle?: string | null;
        metaDescription?: string | null;
        parentId?: string | null;
        order?: number;
        pageType?: string;
        locale?: string;
        isDefault?: boolean;
        seo?: PageSEOInput;
        sectionIds?: string[]; // Lista de IDs de secciones
      } 
    }) => {
      console.log('======== START updatePage resolver ========');
      try {
        const { id, input } = args;
        const existingPage = await prisma.page.findUnique({ where: { id }, include: { sections: true, seo: true } });
        if (!existingPage) return { success: false, message: `No se encontró ninguna página con ID: ${id}`, page: null };
        if (input.isDefault === true) {
          const localeToUse = input.locale || existingPage.locale;
          const existingDefault = await prisma.page.findFirst({ where: { locale: localeToUse, isDefault: true, id: { not: id } } });
          if (existingDefault) await prisma.page.update({ where: { id: existingDefault.id }, data: { isDefault: false } });
        }
        if (input.title && input.title !== existingPage.title) {
          const menuItems = await prisma.menuItem.findMany({ where: { pageId: id } });
          for (const menuItem of menuItems) await prisma.menuItem.update({ where: { id: menuItem.id }, data: { title: input.title } });
        }
        const seoData = input.seo || {};
        if (input.metaTitle !== undefined && seoData.title === undefined) seoData.title = input.metaTitle;
        else if (seoData.title !== undefined && input.metaTitle === undefined) input.metaTitle = seoData.title;
        if (input.metaDescription !== undefined && seoData.description === undefined) seoData.description = input.metaDescription;
        else if (seoData.description !== undefined && input.metaDescription === undefined) input.metaDescription = seoData.description;
        const updatedPage = await prisma.page.update({
          where: { id },
          data: {
            ...(input.title !== undefined && { title: input.title }),
            ...(input.slug !== undefined && { slug: input.slug }),
            ...(input.description !== undefined && { description: input.description }),
            ...(input.template !== undefined && { template: input.template }),
            ...(input.isPublished !== undefined && { isPublished: input.isPublished }),
            ...(input.publishDate !== undefined && { publishDate: input.publishDate && input.publishDate.trim && input.publishDate.trim() !== '' ? (new Date(input.publishDate)).toString() !== 'Invalid Date' ? new Date(input.publishDate) : null : null }),
            ...(input.featuredImage !== undefined && { featuredImage: input.featuredImage }),
            ...(input.metaTitle !== undefined && { metaTitle: input.metaTitle }),
            ...(input.metaDescription !== undefined && { metaDescription: input.metaDescription }),
            ...(input.parentId !== undefined && { parentId: input.parentId }),
            ...(input.order !== undefined && { order: input.order }),
            ...(input.pageType !== undefined && { pageType: input.pageType as PrismaPageType }),
            ...(input.locale !== undefined && { locale: input.locale }),
            updatedAt: new Date()
          },
          include: { seo: true } // sections removed
        });
        if (input.seo || input.metaTitle !== undefined || input.metaDescription !== undefined) {
          const seoUpdateData = {
            ...(seoData.keywords !== undefined && { keywords: seoData.keywords }),
            ...(seoData.title !== undefined && { title: seoData.title }),
            ...(seoData.description !== undefined && { description: seoData.description }),
            ...(seoData.ogTitle !== undefined && { ogTitle: seoData.ogTitle }),
            ...(seoData.ogDescription !== undefined && { ogDescription: seoData.ogDescription }),
            ...(seoData.ogImage !== undefined && { ogImage: seoData.ogImage }),
            ...(seoData.twitterTitle !== undefined && { twitterTitle: seoData.twitterTitle }),
            ...(seoData.twitterDescription !== undefined && { twitterDescription: seoData.twitterDescription }),
            ...(seoData.twitterImage !== undefined && { twitterImage: seoData.twitterImage }),
            ...(seoData.canonicalUrl !== undefined && { canonicalUrl: seoData.canonicalUrl }),
            ...(seoData.structuredData !== undefined && { structuredData: seoData.structuredData as Prisma.InputJsonValue }),
            updatedAt: new Date()
          };
          if (existingPage.seo) await prisma.pageSEO.update({ where: { pageId: id }, data: seoUpdateData });
          else await prisma.pageSEO.create({ data: { pageId: id, ...seoUpdateData } });
        }
        if (input.sections && Array.isArray(input.sections)) {
          await prisma.page.update({ where: { id }, data: { sections: { set: [] } } });
          if (input.sections.length > 0) await prisma.page.update({ where: { id }, data: { sections: { connect: input.sections.map(sectionId => ({ id: sectionId })) } } });

        // Si se proporcionan sectionIds, actualizar las secciones de la página
        if (input.sectionIds && Array.isArray(input.sectionIds)) {
          console.log(`Actualizando secciones para la página: ${input.sectionIds.join(', ')}`);
          
          try {
            // Primero desconectar todas las secciones actuales
            await prisma.page.update({
              where: { id },
              data: {
                sections: {
                  set: [] // Desconectar todas las secciones existentes
                }
              }
            });
            
            // Ahora conectar las nuevas secciones
            if (input.sectionIds.length > 0) {
              await prisma.page.update({
                where: { id },
                data: {
                  sections: {
                    connect: input.sectionIds.map(sectionId => ({ id: sectionId }))
                  }
                }
              });
            }
            
            console.log(`Secciones actualizadas correctamente para la página ${id}`);
          } catch (sectionError) {
            console.error('Error actualizando secciones:', sectionError);
          }
        }
        // const pageWithSections = await prisma.page.findUnique({ where: { id }, include: { sections: { orderBy: { order: 'asc' } }, seo: true } });
        return { success: true, message: `Página "${updatedPage.title}" actualizada correctamente`, page: updatedPage }; // Return updatedPage, sections will be resolved by Page.sections
      } catch (error) {
        console.error('Error al actualizar página CMS:', error);
        return { success: false, message: `Error al actualizar página: ${error instanceof Error ? error.message : 'Error desconocido'}`, page: null };
      }
    },

    deletePage: async (_parent: unknown, args: { id: string }) => {
      console.log('======== START deletePage resolver ========');
      try {
        const { id } = args;
        const existingPage = await prisma.page.findUnique({ where: { id }, include: { sections: true } });
        if (!existingPage) return { success: false, message: `No se encontró ninguna página con ID: ${id}` };
        if (existingPage.sections.length > 0) {
          const sectionIds = existingPage.sections.map(section => section.id);
          await prisma.page.update({ where: { id }, data: { sections: { disconnect: sectionIds.map(sectionId => ({ id: sectionId })) } } });
          for (const sectionId of sectionIds) {
            const pagesUsingSection = await prisma.page.count({ where: { sections: { some: { id: sectionId } } } });
            if (pagesUsingSection === 0) {
              await prisma.$executeRaw(Prisma.sql`DELETE FROM "SectionComponent" WHERE "sectionId" = ${sectionId}`);
              await prisma.cMSSection.delete({ where: { id: sectionId } });
            }
          }
        }
        await prisma.page.delete({ where: { id } });
        return { success: true, message: `Página "${existingPage.title}" eliminada correctamente` };
      } catch (error) {
        console.error('Error al eliminar página CMS:', error);
        return { success: false, message: `Error al eliminar página: ${error instanceof Error ? error.message : 'Error desconocido'}` };
        return {
          success: false,
          message: `Error al eliminar página: ${error instanceof Error ? error.message : 'Error desconocido'}`,
        };
      }
    },

    // Crear una sección CMS
    createCMSSection: async (_parent: unknown, args: { 
      input: { 
        sectionId: string;
        name: string;
        description?: string;
        backgroundImage?: string;
        backgroundType?: string;
        pageId?: string; // Agregar pageId opcional
      } 
    }, context: { user?: { id: string } }) => {
      // Registrar la operación
      console.log('📝 Starting createCMSSection resolver');
      console.log('Input data:', JSON.stringify(args.input, null, 2));
      
      try {
        const { input } = args;
        
        // Validar que los campos obligatorios estén presentes
        if (!input.sectionId || !input.name) {
          console.error('❌ Missing required fields in createCMSSection');
          return {
            success: false,
            message: 'Los campos sectionId y name son requeridos',
            section: null
          };
        }
        
        // Verificar si ya existe una sección con el mismo sectionId
        const existingSection = await prisma.cMSSection.findFirst({
          where: { sectionId: input.sectionId }
        });
        
        if (existingSection) {
          console.log(`⚠️ Section with sectionId ${input.sectionId} already exists`);
          return {
            success: false,
            message: `Ya existe una sección con el ID: ${input.sectionId}`,
            section: null
          };
        }
        
        console.log(`🔍 Creating new CMS section: ${input.name} (${input.sectionId})`);
        if (input.pageId) {
          console.log(`🔗 Assigning to page: ${input.pageId}`);
        }
        
        // Crear un nuevo timestamp para createdAt y updatedAt
        const timestamp = new Date();
        
        try {
          // Crear la sección CMS en la base de datos
          const newSection = await prisma.cMSSection.create({
            data: {
              sectionId: input.sectionId,
              name: input.name,
              description: input.description || '',
              backgroundImage: input.backgroundImage || null,
              backgroundType: input.backgroundType || 'gradient',
              lastUpdated: timestamp.toISOString(),
              createdAt: timestamp,
              updatedAt: timestamp,
              createdBy: context?.user?.id || 'system',
              order: 0, // Establecer orden predeterminado
              pageId: input.pageId || null // Asignar pageId si se proporciona
            }
          });
          
          console.log(`✅ CMS section created successfully:`, {
            id: newSection.id,
            sectionId: newSection.sectionId,
            name: newSection.name,
            order: newSection.order,
            pageId: newSection.pageId
          });
          
          // Devolver el resultado exitoso con todos los campos necesarios
          return {
            success: true,
            message: 'Sección CMS creada correctamente',
            section: {
              id: newSection.id,
              sectionId: newSection.sectionId,
              name: newSection.name,
              order: newSection.order || 0, // Asegurar que order esté definido
              pageId: newSection.pageId
            }
          };
        } catch (dbError) {
          console.error('❌ Database error in createCMSSection:', dbError);
          return {
            success: false,
            message: `Error al crear la sección en la base de datos: ${dbError instanceof Error ? dbError.message : 'Error desconocido'}`,
            section: null
          };
        }
      } catch (error) {
        console.error('❌ Unexpected error in createCMSSection resolver:', error);
        return {
          success: false,
          message: error instanceof Error ? error.message : 'Error inesperado al crear la sección CMS',
          section: null
        };
      }
    },
    associateSectionToPage: async (_parent: unknown, args: { pageId: string; sectionId: string; order: number; }) => {
      console.log('======== START associateSectionToPage resolver ========');
      try {
        const { pageId, sectionId, order } = args;
        const existingPage = await prisma.page.findUnique({ where: { id: pageId } });
        if (!existingPage) return { success: false, message: `No se encontró ninguna página con ID: ${pageId}`, page: null };
        const existingSection = await prisma.cMSSection.findUnique({ where: { id: sectionId } });
        if (!existingSection) return { success: false, message: `No se encontró ninguna sección con ID: ${sectionId}`, page: null };
        await prisma.$executeRaw`UPDATE "CMSSection" SET "order" = ${order} WHERE "id" = ${sectionId}`;
        await prisma.page.update({ where: { id: pageId }, data: { sections: { connect: { id: sectionId } } } });
        const updatedPage = await prisma.page.findUnique({ where: { id: pageId }, include: { sections: true } }); // sections needed for immediate return
        return { success: true, message: 'Sección asociada a la página correctamente', page: updatedPage };
        
        console.log('🔍 Buscando página con ID:', pageId);
        console.log('🔍 Tipo de pageId:', typeof pageId);
        console.log('🔍 Valor exacto de pageId:', JSON.stringify(pageId));
        console.log('🔍 Longitud del pageId:', pageId ? pageId.length : 'null/undefined');
        
        // Verificar si la página existe
        console.log('🔎 Ejecutando consulta a la base de datos...');
        const existingPage = await prisma.page.findUnique({
          where: { id: pageId }
        });
        
        console.log('🔎 Resultado de búsqueda de página:', existingPage ? 'ENCONTRADA' : 'NO ENCONTRADA');
        if (existingPage) {
          console.log('📄 Página encontrada:', { 
            id: existingPage.id, 
            title: existingPage.title, 
            slug: existingPage.slug 
          });
        }
        
        if (!existingPage) {
          console.log('❌ Error: Página no encontrada en la base de datos');
          
          // Debug: Mostrar todas las páginas disponibles para comparar IDs
          try {
            const allPages = await prisma.page.findMany({
              select: { id: true, title: true, slug: true },
              take: 10
            });
            console.log('📚 Páginas disponibles en la base de datos:');
            allPages.forEach(page => {
              console.log(`   - ID: "${page.id}" | Title: "${page.title}" | Slug: "${page.slug}"`);
              console.log(`   - ID length: ${page.id.length} | Matches searched: ${page.id === pageId}`);
            });
          } catch (debugError) {
            console.error('Error al obtener páginas para debug:', debugError);
          }
          
          return {
            success: false,
            message: `No se encontró ninguna página con ID: ${pageId}`,
            page: null
          };
        }
        
        // Verificar si la sección existe
        const existingSection = await prisma.cMSSection.findUnique({
          where: { id: sectionId }
        });
        
        if (!existingSection) {
          return {
            success: false,
            message: `No se encontró ninguna sección con ID: ${sectionId}`,
            page: null
          };
        }
        
        // Actualizar la sección con el orden proporcionado y el pageId
        await prisma.$executeRaw`
          UPDATE "CMSSection" 
          SET "order" = ${order}, "pageId" = ${pageId}
          WHERE "id" = ${sectionId}
        `;
        
        // Asociar la sección a la página usando la relación many-to-many
        await prisma.page.update({
          where: { id: pageId },
          data: {
            sections: {
              connect: { id: sectionId }
            }
          }
        });
        
        // Obtener la página actualizada con sus secciones
        const updatedPage = await prisma.page.findUnique({
          where: { id: pageId },
          include: {
            sections: true
          }
        });
        
        return {
          success: true,
          message: 'Sección asociada a la página correctamente',
          page: updatedPage
        };
      } catch (error) {
        console.error('Error al asociar sección a página:', error);
        return { success: false, message: error instanceof Error ? error.message : 'Error desconocido al asociar sección', page: null };
      }
    },

    dissociateSectionFromPage: async (_parent: unknown, args: { pageId: string; sectionId: string; }) => {
      console.log('======== START dissociateSectionFromPage resolver ========');
      try {
        const { pageId, sectionId } = args;
        const existingPage = await prisma.page.findUnique({ where: { id: pageId }, include: { sections: true } });
        if (!existingPage) return { success: false, message: `No se encontró ninguna página con ID: ${pageId}`, page: null };
        const hasSection = existingPage.sections.some(s => s.id === sectionId);
        if (!hasSection) return { success: false, message: `La página no tiene asociada la sección con ID: ${sectionId}`, page: null };
        await prisma.page.update({ where: { id: pageId }, data: { sections: { disconnect: { id: sectionId } } } });
        const pagesUsingSection = await prisma.page.count({ where: { sections: { some: { id: sectionId } } } });

        if (!hasSection) {
          return {
            success: false,
            message: `La página no tiene asociada la sección con ID: ${sectionId}`,
            page: null
          };
        }
        
        // Desasociar la sección de la página
        await prisma.page.update({
          where: { id: pageId },
          data: {
            sections: {
              disconnect: { id: sectionId }
            }
          }
        });
        
        // Limpiar el pageId de la sección cuando se desasocia
        await prisma.$executeRaw`
          UPDATE "CMSSection" 
          SET "pageId" = NULL 
          WHERE "id" = ${sectionId}
        `;
        
        // Verificar si la sección está conectada a otras páginas
        const pagesUsingSection = await prisma.page.count({
          where: {
            sections: {
              some: {
                id: sectionId
              }
            }
          }
        });
        
        // Si la sección no está conectada a ninguna otra página, eliminarla
        let sectionDeleted = false;
        if (pagesUsingSection === 0) {
          await prisma.$executeRaw(Prisma.sql`DELETE FROM "SectionComponent" WHERE "sectionId" = ${sectionId}`);
          await prisma.cMSSection.delete({ where: { id: sectionId } });
          sectionDeleted = true;
        }
        const updatedPage = await prisma.page.findUnique({ where: { id: pageId }, include: { sections: true } }); // sections needed for immediate return
        return { success: true, message: sectionDeleted ? 'Sección desasociada de la página y eliminada correctamente' : 'Sección desasociada de la página correctamente', page: updatedPage };
      } catch (error) {
        console.error('Error al desasociar sección de página:', error);
        return { success: false, message: error instanceof Error ? error.message : 'Error desconocido al desasociar sección', page: null };
      }
    }
  },
  
  Page: { // Added Page type resolver for sections
    sections: async (parentPage: PrismaPage, _args: any, context: Context, _info: any) => {
      if (!parentPage.id) {
        console.log(`Page.sections resolver: parentPage.id is missing for page titled "${parentPage.title}"`);
        return [];
      }
      try {
        console.log(`Page.sections resolver: Loading sections for page ID: ${parentPage.id}`);
        return await context.loaders.sectionLoader.load(parentPage.id);
      } catch (error) {
        console.error(`Error loading sections for page ${parentPage.id} via DataLoader:`, error);
        return [];
      }
    }
  },

  JSON: {
    __serialize(value: unknown) {
      return value;
    },
  },
};
