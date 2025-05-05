import { PrismaClient } from '@prisma/client';

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

export const menuResolvers = {
  Query: {
    menus: async () => {
      return prisma.menu.findMany({
        include: {
          items: true,
        },
      });
    },
    
    menu: async (_: unknown, { id }: MenuArgs) => {
      return prisma.menu.findUnique({
        where: { id },
        include: {
          items: true,
        },
      });
    },
    
    menuByLocation: async (_: unknown, { location }: MenuLocationArgs) => {
      return prisma.menu.findFirst({
        where: { location },
        include: {
          items: true,
        },
      });
    },
  },
  
  Mutation: {
    createMenu: async (_: unknown, { input }: { input: MenuInput }) => {
      return prisma.menu.create({
        data: {
          name: input.name,
          location: input.location,
        },
      });
    },
    
    updateMenu: async (_: unknown, { id, input }: { id: string; input: MenuInput }) => {
      return prisma.menu.update({
        where: { id },
        data: {
          name: input.name,
          location: input.location,
        },
      });
    },
    
    deleteMenu: async (_: unknown, { id }: MenuArgs) => {
      await prisma.menuItem.deleteMany({
        where: { menuId: id },
      });
      
      await prisma.menu.delete({
        where: { id },
      });
      
      return true;
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
      
      return prisma.menuItem.create({
        data: {
          menuId: input.menuId,
          parentId: input.parentId,
          title: input.title,
          url: input.url,
          pageId: input.pageId,
          target: input.target,
          icon: input.icon,
          order: newOrder,
        },
      });
    },
    
    updateMenuItem: async (_: unknown, { id, input }: { id: string; input: MenuItemInput }) => {
      return prisma.menuItem.update({
        where: { id },
        data: {
          title: input.title,
          url: input.url,
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
  },
  
  MenuItem: {
    children: async (parent: MenuItem) => {
      return prisma.menuItem.findMany({
        where: { parentId: parent.id },
        orderBy: { order: 'asc' },
      });
    },
  },
}; 