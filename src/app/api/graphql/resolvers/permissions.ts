
import { Context } from '@/app/api/graphql/types';
import { verifySession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

type Parent = object;

export const permissionResolvers = {
  Query: {
    // Obtener todos los permisos
    permissions: async (_parent: Parent, _args: Record<string, never>, context: Context) => {
      // Verificar si el usuario está autenticado
      if (!context.req) {
        throw new Error('Request context is required');
      }
      const session = await verifySession(context.req);
      const user = session?.user;
      
      if (!user) {
        throw new Error('Unauthorized: You must be logged in to access this information');
      }
      
      // Solo los administradores o usuarios con permisos pueden ver los permisos
      if (user.role.name !== 'ADMIN' && user.role.name !== 'SuperAdmin' && !user.permissions?.includes('permissions:read')) {
        throw new Error('Forbidden: You do not have permission to view permissions');
      }
      
      try {
        const permissions = await prisma.permission.findMany({
          orderBy: {
            name: 'asc',
          },
        });
        
        return permissions.map(permission => ({
          id: permission.id,
          name: permission.name,
          description: permission.description,
          createdAt: permission.createdAt.toISOString(),
          updatedAt: permission.updatedAt.toISOString(),
        }));
      } catch (error) {
        console.error('Error fetching permissions:', error);
        throw new Error('Failed to fetch permissions');
      }
    },
    
    // Obtener permisos de un rol específico
    rolePermissions: async (_parent: Parent, { roleId }: { roleId: string }, context: Context) => {
      // Verificar si el usuario está autenticado
      if (!context.req) {
        throw new Error('Request context is required');
      }
      const session = await verifySession(context.req);
      const user = session?.user;
      
      if (!user) {
        throw new Error('Unauthorized: You must be logged in to access this information');
      }
      
      // Solo los administradores o usuarios con permisos pueden ver los permisos
      if (user.role.name !== 'ADMIN' && user.role.name !== 'SuperAdmin' && !user.permissions?.includes('permissions:read')) {
        throw new Error('Forbidden: You do not have permission to view role permissions');
      }
      
      try {
        // Verificar si el rol existe
        const role = await prisma.roleModel.findUnique({
          where: { id: roleId },
        });
        
        if (!role) {
          throw new Error(`Role with ID ${roleId} not found`);
        }
        
        // Obtener los permisos asociados al rol
        const permissions = await prisma.permission.findMany({
          where: {
            roles: {
              some: {
                id: roleId,
              },
            },
          },
          orderBy: {
            name: 'asc',
          },
        });
        
        return permissions.map(permission => ({
          id: permission.id,
          name: permission.name,
          description: permission.description,
          createdAt: permission.createdAt.toISOString(),
          updatedAt: permission.updatedAt.toISOString(),
        }));
      } catch (error) {
        console.error('Error fetching role permissions:', error);
        throw new Error(`Failed to fetch permissions for role with ID ${roleId}`);
      }
    },
  },
  
  Mutation: {
    // Crear un nuevo permiso
    createPermission: async (_parent: Parent, { input }: { input: { name: string; description?: string; roleId?: string } }, context: Context) => {
      // Verificar si el usuario está autenticado
      if (!context.req) {
        throw new Error('Request context is required');
      }
      const session = await verifySession(context.req);
      const user = session?.user;
      
      if (!user) {
        throw new Error('Unauthorized: You must be logged in to create a permission');
      }
      
      // Solo los administradores o usuarios con permisos pueden crear permisos
      if (user.role.name !== 'ADMIN' && user.role.name !== 'SuperAdmin' && !user.permissions?.includes('permissions:create')) {
        throw new Error('Forbidden: You do not have permission to create permissions');
      }
      
      try {
        // Verificar si ya existe un permiso con el mismo nombre
        const existingPermission = await prisma.permission.findFirst({
          where: {
            name: input.name,
          },
        });
        
        if (existingPermission) {
          throw new Error(`A permission with the name "${input.name}" already exists`);
        }
        
        // Crear el permiso
        const data: {
          name: string;
          description?: string;
          roles?: {
            connect: {
              id: string;
            };
          };
        } = {
          name: input.name,
          description: input.description,
        };
        
        // Si se proporciona un roleId, conectar el permiso con ese rol
        if (input.roleId) {
          // Verificar si el rol existe
          const role = await prisma.roleModel.findUnique({
            where: { id: input.roleId },
          });
          
          if (!role) {
            throw new Error(`Role with ID ${input.roleId} not found`);
          }
          
          data.roles = {
            connect: {
              id: input.roleId,
            },
          };
        }
        
        const newPermission = await prisma.permission.create({
          data,
        });
        
        return {
          id: newPermission.id,
          name: newPermission.name,
          description: newPermission.description,
          createdAt: newPermission.createdAt.toISOString(),
          updatedAt: newPermission.updatedAt.toISOString(),
        };
      } catch (error) {
        console.error('Error creating permission:', error);
        throw new Error(`Failed to create permission: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    },
    
    // Asignar un permiso a un rol
    assignPermissionToRole: async (_parent: Parent, { roleId, permissionId }: { roleId: string; permissionId: string }, context: Context) => {
      // Verificar si el usuario está autenticado
      if (!context.req) {
        throw new Error('Request context is required');
      }
      const session = await verifySession(context.req);
      const user = session?.user;
      
      if (!user) {
        throw new Error('Unauthorized: You must be logged in to assign permissions');
      }
      
      // Solo los administradores o usuarios con permisos pueden asignar permisos
      if (user.role.name !== 'ADMIN' && user.role.name !== 'SuperAdmin' && !user.permissions?.includes('permissions:update')) {
        throw new Error('Forbidden: You do not have permission to assign permissions to roles');
      }
      
      try {
        // Verificar si el rol existe
        const role = await prisma.roleModel.findUnique({
          where: { id: roleId },
        });
        
        if (!role) {
          throw new Error(`Role with ID ${roleId} not found`);
        }
        
        // Verificar si el permiso existe
        const permission = await prisma.permission.findUnique({
          where: { id: permissionId },
        });
        
        if (!permission) {
          throw new Error(`Permission with ID ${permissionId} not found`);
        }
        
        // Verificar si el permiso ya está asignado al rol
        const permissionAlreadyAssigned = await prisma.permission.findFirst({
          where: {
            id: permissionId,
            roles: {
              some: {
                id: roleId,
              },
            },
          },
        });
        
        if (permissionAlreadyAssigned) {
          throw new Error(`Permission "${permission.name}" is already assigned to role "${role.name}"`);
        }
        
        // Asignar el permiso al rol
        await prisma.permission.update({
          where: { id: permissionId },
          data: {
            roles: {
              connect: {
                id: roleId,
              },
            },
          },
        });
        
        return permission;
      } catch (error) {
        console.error('Error assigning permission to role:', error);
        throw new Error(`Failed to assign permission to role: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    },
    
    // Remover un permiso de un rol
    removePermissionFromRole: async (_parent: Parent, { roleId, permissionId }: { roleId: string; permissionId: string }, context: Context) => {
      // Verificar si el usuario está autenticado
      if (!context.req) {
        throw new Error('Request context is required');
      }
      const session = await verifySession(context.req);
      const user = session?.user;
      
      if (!user) {
        throw new Error('Unauthorized: You must be logged in to remove permissions');
      }
      
      // Solo los administradores o usuarios con permisos pueden remover permisos
      if (user.role.name !== 'ADMIN' && user.role.name !== 'SuperAdmin' && !user.permissions?.includes('permissions:update')) {
        throw new Error('Forbidden: You do not have permission to remove permissions from roles');
      }
      
      try {
        // Verificar si el rol existe
        const role = await prisma.roleModel.findUnique({
          where: { id: roleId },
        });
        
        if (!role) {
          throw new Error(`Role with ID ${roleId} not found`);
        }
        
        // Verificar si el permiso existe
        const permission = await prisma.permission.findUnique({
          where: { id: permissionId },
        });
        
        if (!permission) {
          throw new Error(`Permission with ID ${permissionId} not found`);
        }
        
        // Verificar si el permiso está asignado al rol
        const permissionAssignedToRole = await prisma.permission.findFirst({
          where: {
            id: permissionId,
            roles: {
              some: {
                id: roleId,
              },
            },
          },
        });
        
        if (!permissionAssignedToRole) {
          throw new Error(`Permission "${permission.name}" is not assigned to role "${role.name}"`);
        }
        
        // Remover el permiso del rol
        await prisma.permission.update({
          where: { id: permissionId },
          data: {
            roles: {
              disconnect: {
                id: roleId,
              },
            },
          },
        });
        
        return true;
      } catch (error) {
        console.error('Error removing permission from role:', error);
        throw new Error(`Failed to remove permission from role: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    },
  },
}; 