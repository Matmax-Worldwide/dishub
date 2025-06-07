import { PrismaClient } from '@prisma/client';
import { GraphQLContext } from '../route';
import { prisma } from '@/lib/prisma';

// Tipos para los parámetros de los resolvers
interface MenuArgs {
  id: string;
}

interface MenuLocationArgs {
  location: string;
}

interface MenuInput {
  name: string;
  location: string | null;
  headerStyle?: HeaderStyleInput;
}

interface MenuItemInput {
  menuId: string;
  parentId: string | null;
  title: string;
  url: string | null;
  pageId: string | null;
  target: string | null;
  icon: string | null;
}

interface MenuItemOrderInput {
  newOrder: number;
}

interface MenuItem {
  id: string;
  menuId: string;
  parentId: string | null;
  title: string;
  url: string | null;
  pageId: string | null;
  target: string | null;
  icon: string | null;
  order: number;
}

interface HeaderStyleInput {
  transparency?: number;
  headerSize?: 'sm' | 'md' | 'lg';
  menuAlignment?: 'left' | 'center' | 'right';
  menuButtonStyle?: 'default' | 'filled' | 'outline';
  mobileMenuStyle?: 'fullscreen' | 'dropdown' | 'sidebar';
  mobileMenuPosition?: 'left' | 'right';
  transparentHeader?: boolean;
  borderBottom?: boolean;
  fixedHeader?: boolean;
  advancedOptions?: Record<string, unknown>;
  // Button configuration fields
  showButton?: boolean;
  buttonText?: string;
  buttonAction?: string;
  buttonColor?: string;
  buttonTextColor?: string;
  buttonSize?: string;
  buttonBorderRadius?: number;
  buttonShadow?: string;
  buttonBorderColor?: string;
  buttonBorderWidth?: number;
  buttonWidth?: string;
  buttonHeight?: string;
  buttonPosition?: string;
  buttonDropdown?: boolean;
  buttonDropdownItems?: Array<{id: string; label: string; url: string}>;
  buttonUrlType?: string;
  selectedPageId?: string;
}

interface FooterStyleInput {
  transparency?: number;
  columnLayout?: 'stacked' | 'grid' | 'flex';
  socialAlignment?: 'left' | 'center' | 'right';
  borderTop?: boolean;
  alignment?: 'left' | 'center' | 'right';
  padding?: 'small' | 'medium' | 'large';
  width?: 'full' | 'container' | 'narrow';
  advancedOptions?: Record<string, unknown>;
}

// Update the interface for menu item order updates
interface MenuItemOrderUpdate {
  id: string;
  order: number;
  parentId?: string | null;
}

// Define a type for Prisma transaction client
type TransactionClient = Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>;

export const menuResolvers = {
  Query: {
    menus: async () => {
      return prisma.menu.findMany({
        select: {
          id: true,
          name: true,
          location: true,
          createdAt: true,
          updatedAt: true,
          items: true,
          headerStyle: true
        },
      });
    },
    
    menu: async (_: unknown, { id }: MenuArgs) => {
      return prisma.menu.findUnique({
        where: { id },
        select: {
          id: true,
          name: true,
          location: true,
          createdAt: true,
          updatedAt: true,
          items: true,
          headerStyle: true
        },
      });
    },
    
    menuByLocation: async (_: unknown, { location }: MenuLocationArgs) => {
      return prisma.menu.findFirst({
        where: { location },
        select: {
          id: true,
          name: true,
          location: true,
          createdAt: true,
          updatedAt: true,
          items: true,
          headerStyle: true
        },
      });
    },
    
    menuByName: async (_: unknown, { name }: { name: string }) => {
      return prisma.menu.findFirst({
        where: { name },
        select: {
          id: true,
          name: true,
          location: true,
          createdAt: true,
          updatedAt: true,
          items: true,
          headerStyle: true
        },
      });
    },

    // Add a query to get all pages for the menu item selection
    pages: async () => {
      try {
        const pages = await prisma.page.findMany({
          where: { isPublished: true },
          select: {
            id: true,
            title: true,
            slug: true,
          },
          orderBy: {
            title: 'asc',
          },
        });
        
        return pages; // Return the pages array
      } catch (error) {
        console.error('Error fetching pages for menu:', error);
        return []; // Return empty array on error instead of null
      }
    },
  },
  
  Mutation: {
    createMenu: async (_parent: unknown, { input }: { input: MenuInput }, context: GraphQLContext) => {
      try {
        const { name, location, headerStyle } = input;
        
        if (!context.tenantId) {
          throw new Error('Tenant context is required');
        }
        
        const menu = await prisma.menu.create({
          data: {
            name,
            location,
            tenantId: context.tenantId,
          },
          include: {
            items: true
          }
        });
        
        // If headerStyle was provided, update or create it
        if (headerStyle) {
          const { advancedOptions, ...headerStyleData } = headerStyle;
          
          // Prepare the advancedOptions data
          const processedAdvancedOptions = advancedOptions 
            ? JSON.parse(JSON.stringify(advancedOptions)) 
            : undefined;
          
          await prisma.headerStyle.upsert({
            where: { menuId: menu.id },
            update: {
              ...headerStyleData,
              ...(processedAdvancedOptions ? { advancedOptions: processedAdvancedOptions } : {})
            },
            create: {
              menuId: menu.id,
              tenantId: context.tenantId,
              ...headerStyleData,
              ...(processedAdvancedOptions ? { advancedOptions: processedAdvancedOptions } : {})
            }
          });
        }
        
        // Return the updated menu with all relationships
        return await prisma.menu.findUnique({
          where: { id: menu.id },
          select: {
            id: true,
            name: true,
            location: true,
            createdAt: true,
            updatedAt: true,
            items: true,
            headerStyle: true
          }
        });
      } catch (error) {
        console.error('Error creating menu:', error);
        throw error;
      }
    },
    
    updateMenu: async (_parent: unknown, { id, input }: { id: string, input: MenuInput }, context: GraphQLContext) => {
      try {
        if (!context.tenantId) {
          throw new Error('Tenant context is required');
        }
        
        // Extract headerStyle from input if provided
        const { headerStyle, ...menuData } = input;
        
        // Update the menu
        const menu = await prisma.menu.update({
          where: { id },
          data: menuData,
          select: {
            id: true,
            name: true,
            location: true,
            createdAt: true,
            updatedAt: true,
            items: true
          }
        });
        
        // If headerStyle was provided, update or create it
        if (headerStyle) {
          const { advancedOptions, ...headerStyleData } = headerStyle;
          
          // Prepare the advancedOptions data
          const processedAdvancedOptions = advancedOptions 
            ? JSON.parse(JSON.stringify(advancedOptions)) 
            : undefined;
          
          await prisma.headerStyle.upsert({
            where: { menuId: menu.id },
            update: {
              ...headerStyleData,
              ...(processedAdvancedOptions ? { advancedOptions: processedAdvancedOptions } : {})
            },
            create: {
              menuId: menu.id,
              tenantId: context.tenantId,
              ...headerStyleData,
              ...(processedAdvancedOptions ? { advancedOptions: processedAdvancedOptions } : {})
            }
          });
        }
        
        // Return the updated menu with all relationships
        return await prisma.menu.findUnique({
          where: { id: menu.id },
          select: {
            id: true,
            name: true,
            location: true,
            createdAt: true,
            updatedAt: true,
            items: true,
            headerStyle: true
          }
        });
      } catch (error) {
        console.error('Error updating menu:', error);
        throw new Error(`Failed to update menu: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    },
    
    deleteMenu: async (_: unknown, { id }: MenuArgs) => {
      try {
        console.log(`Starting deletion of menu ID: ${id}`);
        
        // First, delete any header style associated with this menu
        try {
          await prisma.headerStyle.deleteMany({
            where: { menuId: id },
          });
          console.log(`Deleted associated HeaderStyle for menu ${id}`);
        } catch (headerStyleError) {
          console.error(`Error deleting HeaderStyle for menu ${id}:`, headerStyleError);
          // Continue with deletion even if this fails
        }
        
        // Next, delete all menu items
        try {
          const deletedItems = await prisma.menuItem.deleteMany({
            where: { menuId: id },
          });
          console.log(`Deleted ${deletedItems.count} MenuItems for menu ${id}`);
        } catch (menuItemError) {
          console.error(`Error deleting MenuItems for menu ${id}:`, menuItemError);
          throw new Error(`Failed to delete menu items: ${menuItemError instanceof Error ? menuItemError.message : 'Unknown error'}`);
        }
        
        // Finally, delete the menu itself
        await prisma.menu.delete({
          where: { id },
        });
        
        console.log(`Successfully deleted menu ${id}`);
        return true;
      } catch (error) {
        console.error(`Error deleting menu ${id}:`, error);
        throw new Error(`Failed to delete menu: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    },
    
    createMenuItem: async (_: unknown, { input }: { input: MenuItemInput }) => {
      // Get the maximum order of existing items in this menu at the same parent level
      const maxOrderItem = await prisma.menuItem.findFirst({
        where: {
          menuId: input.menuId,
          parentId: input.parentId,
        },
        orderBy: {
          order: 'desc',
        },
      });
      
      const newOrder = maxOrderItem ? maxOrderItem.order + 1 : 1;
      
      // Set URL based on page or custom URL
      let url = input.url;

      // If pageId is provided, try to get the page
      if (input.pageId) {
        const page = await prisma.page.findUnique({
          where: { id: input.pageId },
          select: { id: true, title: true, slug: true }
        });
        
        if (!page) {
          throw new Error('Selected page not found');
        }
        
        // Construct URL from page slug
        url = `/${page.slug}`;
      }
      
      // Ensure we have either a page-based URL or custom URL
      if (!url && !input.pageId) {
        throw new Error('Either a page or custom URL must be provided');
      }
      
      return prisma.menuItem.create({
        data: {
          menuId: input.menuId,
          parentId: input.parentId,
          title: input.title,
          url: url,
          pageId: input.pageId,
          target: input.target,
          icon: input.icon,
          order: newOrder,
        },
      });
    },
    
    updateMenuItem: async (_: unknown, { id, input }: { id: string; input: MenuItemInput }) => {
      // Set URL based on page or custom URL
      let url = input.url;

      // If pageId is provided, try to get the page
      if (input.pageId) {
        const page = await prisma.page.findUnique({
          where: { id: input.pageId },
          select: { id: true, title: true, slug: true }
        });
        
        if (!page) {
          throw new Error('Selected page not found');
        }
        
        // Construct URL from page slug
        url = `/${page.slug}`;
      }
      
      // Ensure we have either a page-based URL or custom URL
      if (!url && !input.pageId) {
        throw new Error('Either a page or custom URL must be provided');
      }
      
      return prisma.menuItem.update({
        where: { id },
        data: {
          title: input.title,
          url: url,
          pageId: input.pageId,
          target: input.target,
          icon: input.icon,
          parentId: input.parentId,
        },
      });
    },
    
    deleteMenuItem: async (_: unknown, { id }: MenuArgs) => {
      // First, get all children to delete them recursively
      const children = await prisma.menuItem.findMany({
        where: { parentId: id },
      });
      
      // Delete children recursively
      for (const child of children) {
        await prisma.menuItem.delete({
          where: { id: child.id },
        });
      }
      
      // Then delete the item itself
      await prisma.menuItem.delete({
        where: { id },
      });
      
      return true;
    },
    
    updateMenuItemOrder: async (_: unknown, { id, input }: { id: string; input: MenuItemOrderInput }) => {
      const menuItem = await prisma.menuItem.findUnique({
        where: { id },
      });
      
      if (!menuItem) {
        throw new Error('Menu item not found');
      }
      
      // Update the order of the current item
      return prisma.menuItem.update({
        where: { id },
        data: {
          order: input.newOrder,
        },
      });
    },

    // Update the resolver to handle parentId changes
    updateMenuItemsOrder: async (_: unknown, { items }: { items: MenuItemOrderUpdate[] }) => {
      try {
        // Use a transaction to ensure all updates succeed or fail together
        await prisma.$transaction(async (tx: TransactionClient) => {
          for (const item of items) {
            // Update both order and parentId if provided
            await tx.menuItem.update({
              where: { id: item.id },
              data: { 
                order: item.order,
                // Only update parentId if it's explicitly provided in the update
                ...(item.parentId !== undefined && { parentId: item.parentId })
              }
            });
          }
        });
        
        return true;
      } catch (error) {
        console.error('Error updating menu item orders:', error);
        throw new Error(`Failed to update menu item orders: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    },

    // Add new resolver for updating just the headerStyle
    updateHeaderStyle: async (_parent: unknown, { menuId, input }: { menuId: string; input: HeaderStyleInput }, context: GraphQLContext) => {
      try {
        if (!context.tenantId) {
          throw new Error('Tenant context is required');
        }

        const { advancedOptions, ...headerStyleData } = input;
        
        // Prepare the advancedOptions data
        const processedAdvancedOptions = advancedOptions 
          ? JSON.parse(JSON.stringify(advancedOptions)) 
          : undefined;
        
        const headerStyle = await prisma.headerStyle.upsert({
          where: { menuId },
          update: {
            ...headerStyleData,
            ...(processedAdvancedOptions ? { advancedOptions: processedAdvancedOptions } : {})
          },
          create: {
            menuId,
            tenantId: context.tenantId,
            ...headerStyleData,
            ...(processedAdvancedOptions ? { advancedOptions: processedAdvancedOptions } : {})
          }
        });
        
        return headerStyle;
      } catch (error) {
        console.error('Error updating header style:', error);
        throw error;
      }
    },

    updateFooterStyle: async (_parent: unknown, { menuId, input }: { menuId: string; input: FooterStyleInput }, context: GraphQLContext) => {
      try {
        if (!context.tenantId) {
          throw new Error('Tenant context is required');
        }

        const { advancedOptions, ...footerStyleData } = input;
        
        // Prepare the advancedOptions data
        const processedAdvancedOptions = advancedOptions 
          ? JSON.parse(JSON.stringify(advancedOptions)) 
          : undefined;
        
        let footerStyle;
        
        // Check if footer style already exists
        const existingFooterStyle = await prisma.footerStyle.findUnique({
          where: { menuId }
        });
        
        if (existingFooterStyle) {
          footerStyle = await prisma.footerStyle.update({
            where: { menuId },
            data: {
              ...footerStyleData,
              ...(processedAdvancedOptions ? { advancedOptions: processedAdvancedOptions } : {})
            }
          });
        } else {
          footerStyle = await prisma.footerStyle.create({
            data: {
              menuId,
              tenantId: context.tenantId,
              ...footerStyleData,
              ...(processedAdvancedOptions ? { advancedOptions: processedAdvancedOptions } : {})
            }
          });
        }
        
        return footerStyle;
      } catch (error) {
        console.error('Error updating footer style:', error);
        throw error;
      }
    },
  },
  
  MenuItem: {
    children: async (parent: MenuItem) => {
      return prisma.menuItem.findMany({
        where: { parentId: parent.id },
        orderBy: { order: 'asc' },
      });
    },
    
    // Add a resolver to get the related page if pageId is set
    page: async (parent: MenuItem) => {
      if (!parent.pageId) return null;
      
      return prisma.page.findUnique({
        where: { id: parent.pageId },
        select: {
          id: true,
          title: true,
          slug: true,
        },
      });
    },
  },
}; 