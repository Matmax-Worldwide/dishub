import { PrismaClient, Prisma } from '@prisma/client';
import { NextRequest } from 'next/server';
import { verifyToken } from '@/lib/auth';

const prisma = new PrismaClient();

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
  advancedOptions?: Record<string, unknown>;
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
    createMenu: async (_parent: unknown, { input }: { input: MenuInput }) => {
      try {
        // Extract headerStyle from input if provided
        const { headerStyle, ...menuData } = input;
        
        // Create the menu first
        const menu = await prisma.menu.create({
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
        
        // If headerStyle was provided, create it separately
        if (headerStyle) {
          const { advancedOptions, ...headerStyleData } = headerStyle;
          
          // Create the header style
          await prisma.headerStyle.create({
            data: {
              ...headerStyleData,
              menuId: menu.id,
              // Handle the advancedOptions safely
              ...(advancedOptions ? { 
                advancedOptions: JSON.parse(JSON.stringify(advancedOptions)) 
              } : {})
            }
          });
        }
        
        // Return the full menu with relationships
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
        throw new Error(`Failed to create menu: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    },
    
    updateMenu: async (_parent: unknown, { id, input }: { id: string, input: MenuInput }) => {
      try {
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
              ...headerStyleData,
              menuId: menu.id,
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
        await prisma.$transaction(async (tx: any) => {
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
    updateHeaderStyle: async (_parent: unknown, { menuId, input }: { menuId: string, input: HeaderStyleInput }, context: { req: NextRequest }) => {
      try {
        // Validate authentication
        const token = context.req.headers.get('authorization')?.split(' ')[1];
        if (!token) {
          throw new Error('Not authenticated');
        }
        
        // Verify token and get user info
        const decoded = await verifyToken(token) as { userId: string; role?: string };
        if (!decoded || !decoded.userId) {
          throw new Error('Invalid token');
        }
        
        // Check if the menu exists
        const menu = await prisma.menu.findUnique({
          where: { id: menuId }
        });
        
        if (!menu) {
          throw new Error(`Menu with ID ${menuId} not found`);
        }
        
        // Extract advancedOptions for proper JSON handling
        const { advancedOptions, ...headerStyleData } = input;
        
        // Process advancedOptions
        const processedAdvancedOptions = advancedOptions 
          ? JSON.parse(JSON.stringify(advancedOptions)) 
          : undefined;
        
        // Update or create the header style
        const headerStyle = await prisma.headerStyle.upsert({
          where: { menuId },
          update: {
            ...headerStyleData,
            ...(processedAdvancedOptions ? { advancedOptions: processedAdvancedOptions } : {})
          },
          create: {
            ...headerStyleData,
            menuId,
            ...(processedAdvancedOptions ? { advancedOptions: processedAdvancedOptions } : {})
          }
        });
        
        return headerStyle;
      } catch (error) {
        console.error('Error updating header style:', error);
        throw new Error(`Failed to update header style: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    },

    updateFooterStyle: async (_parent: unknown, { menuId, input }: { menuId: string; input: FooterStyleInput }) => {
      try {
        // Find the menu to make sure it exists
        const menu = await prisma.menu.findUnique({
          where: { id: menuId },
        });

        if (!menu) {
          return {
            success: false,
            message: `Menu with ID ${menuId} not found`,
            footerStyle: null
          };
        }

        // Extract advancedOptions for proper JSON handling
        const { advancedOptions, ...footerStyleData } = input;
        
        // Process advancedOptions
        const processedAdvancedOptions = advancedOptions 
          ? JSON.parse(JSON.stringify(advancedOptions)) 
          : undefined;

        // First check if a footer style already exists for this menu
        let footerStyle = await prisma.footerStyle.findUnique({
          where: { menuId }
        });

        // If it exists, update it, otherwise create a new one
        if (footerStyle) {
          footerStyle = await prisma.footerStyle.update({
            where: { id: footerStyle.id },
            data: {
              ...footerStyleData,
              ...(processedAdvancedOptions ? { advancedOptions: processedAdvancedOptions } : {})
            }
          });
        } else {
          footerStyle = await prisma.footerStyle.create({
            data: {
              menuId,
              ...footerStyleData,
              ...(processedAdvancedOptions ? { advancedOptions: processedAdvancedOptions } : {})
            }
          });
        }

        return {
          success: true,
          message: "Footer style updated successfully",
          footerStyle
        };
      } catch (error) {
        console.error("Error updating footer style:", error);
        return {
          success: false,
          message: `Error updating footer style: ${error instanceof Error ? error.message : 'Unknown error'}`,
          footerStyle: null
        };
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