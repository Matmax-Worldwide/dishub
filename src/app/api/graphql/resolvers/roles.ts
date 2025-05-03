import { PrismaClient } from '@prisma/client';
import { Context } from '@/app/api/graphql/types';
import { verifySession } from '@/app/api/utils/auth';

const prisma = new PrismaClient();

type Parent = object;
type EmptyArgs = Record<string, never>;

export const roleResolvers = {
  Query: {
    // Obtener todos los roles
    roles: async (_parent: Parent, _args: EmptyArgs, context: Context) => {
      // Verificar si el usuario está autenticado
      const session = await verifySession(context.req);
      const user = session?.user;
      
      if (!user) {
        throw new Error('Unauthorized: You must be logged in to access this information');
      }
      
      // Solo los administradores o usuarios con permisos pueden ver los roles
      if (user.role.name !== 'ADMIN' && !user.permissions?.includes('roles:read')) {
        throw new Error('Forbidden: You do not have permission to view roles');
      }
      
      try {
        const roles = await prisma.roleModel.findMany({
          orderBy: {
            name: 'asc',
          },
        });
        
        return roles.map(role => ({
          id: role.id,
          name: role.name,
          description: role.description,
          createdAt: role.createdAt.toISOString(),
          updatedAt: role.updatedAt.toISOString(),
        }));
      } catch (error) {
        console.error('Error fetching roles:', error);
        throw new Error('Failed to fetch roles');
      }
    },
    
    // Obtener un rol específico por ID
    role: async (_parent: Parent, { id }: { id: string }, context: Context) => {
      // Verificar si el usuario está autenticado
      const session = await verifySession(context.req);
      const user = session?.user;
      
      if (!user) {
        throw new Error('Unauthorized: You must be logged in to access this information');
      }
      
      // Solo los administradores o usuarios con permisos pueden ver los roles
      if (user.role.name !== 'ADMIN' && !user.permissions?.includes('roles:read')) {
        throw new Error('Forbidden: You do not have permission to view roles');
      }
      
      try {
        const role = await prisma.roleModel.findUnique({
          where: { id },
          include: {
            permissions: true,
          },
        });
        
        if (!role) {
          throw new Error(`Role with ID ${id} not found`);
        }
        
        return {
          id: role.id,
          name: role.name,
          description: role.description,
          permissions: role.permissions,
          createdAt: role.createdAt.toISOString(),
          updatedAt: role.updatedAt.toISOString(),
        };
      } catch (error) {
        console.error(`Error fetching role with ID ${id}:`, error);
        throw new Error(`Failed to fetch role with ID ${id}`);
      }
    },
    
    // Obtener roles con conteo de usuarios y permisos
    rolesWithCounts: async (_parent: Parent, _args: EmptyArgs, context: Context) => {
      // Verificar si el usuario está autenticado
      const session = await verifySession(context.req);
      const user = session?.user;
      
      if (!user) {
        throw new Error('Unauthorized: You must be logged in to access this information');
      }
      
      // Solo los administradores o usuarios con permisos pueden ver los roles
      if (user.role.name !== 'ADMIN' && !user.permissions?.includes('roles:read')) {
        throw new Error('Forbidden: You do not have permission to view roles');
      }
      
      try {
        // Obtener todos los roles
        const roles = await prisma.roleModel.findMany({
          orderBy: {
            name: 'asc',
          },
        });
        
        // Para cada rol, obtener recuento de usuarios y permisos
        const rolesWithCounts = await Promise.all(
          roles.map(async (role) => {
            // Contar usuarios
            const userCount = await prisma.user.count({
              where: {
                roleId: role.id,
              },
            });
            
            // Contar permisos
            const permissionCount = await prisma.$queryRaw`
              SELECT COUNT(*) as count
              FROM "_PermissionToRoleModel"
              WHERE "B" = ${role.id}
            `;
            
            // Asegurar que permissionCount[0]?.count sea un número
            const permissionCountValue = Number(permissionCount && typeof permissionCount === 'object' && 
                                             Array.isArray(permissionCount) && permissionCount[0]?.count || 0);
            
            return {
              id: role.id,
              name: role.name,
              description: role.description,
              userCount,
              permissionCount: permissionCountValue,
              createdAt: role.createdAt.toISOString(),
              updatedAt: role.updatedAt.toISOString(),
            };
          })
        );
        
        return rolesWithCounts;
      } catch (error) {
        console.error('Error fetching roles with counts:', error);
        throw new Error('Failed to fetch roles with counts');
      }
    },
  },
  
  Mutation: {
    // Crear un nuevo rol
    createRole: async (_parent: Parent, { input }: { input: { name: string; description?: string } }, context: Context) => {
      // Verificar si el usuario está autenticado
      const session = await verifySession(context.req);
      const user = session?.user;
      
      if (!user) {
        throw new Error('Unauthorized: You must be logged in to create a role');
      }
      
      // Solo los administradores o usuarios con permisos pueden crear roles
      if (user.role.name !== 'ADMIN' && !user.permissions?.includes('roles:create')) {
        throw new Error('Forbidden: You do not have permission to create roles');
      }
      
      try {
        // Verificar si ya existe un rol con el mismo nombre
        const existingRole = await prisma.roleModel.findFirst({
          where: {
            name: input.name,
          },
        });
        
        if (existingRole) {
          throw new Error(`A role with the name "${input.name}" already exists`);
        }
        
        // Crear el rol
        const newRole = await prisma.roleModel.create({
          data: {
            name: input.name,
            description: input.description || null,
          },
        });
        
        return {
          id: newRole.id,
          name: newRole.name,
          description: newRole.description,
          createdAt: newRole.createdAt.toISOString(),
          updatedAt: newRole.updatedAt.toISOString(),
        };
      } catch (error) {
        console.error('Error creating role:', error);
        throw new Error(`Failed to create role: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    },
    
    // Actualizar un rol existente
    updateRole: async (_parent: Parent, { id, input }: { id: string; input: { name: string; description?: string } }, context: Context) => {
      // Verificar si el usuario está autenticado
      const session = await verifySession(context.req);
      const user = session?.user;
      
      if (!user) {
        throw new Error('Unauthorized: You must be logged in to update a role');
      }
      
      // Solo los administradores o usuarios con permisos pueden actualizar roles
      if (user.role.name !== 'ADMIN' && !user.permissions?.includes('roles:update')) {
        throw new Error('Forbidden: You do not have permission to update roles');
      }
      
      try {
        // Verificar si el rol existe
        const existingRole = await prisma.roleModel.findUnique({
          where: { id },
        });
        
        if (!existingRole) {
          throw new Error(`Role with ID ${id} not found`);
        }
        
        // Verificar si hay otro rol con el mismo nombre
        if (input.name !== existingRole.name) {
          const roleWithSameName = await prisma.roleModel.findFirst({
            where: {
              name: input.name,
              NOT: {
                id,
              },
            },
          });
          
          if (roleWithSameName) {
            throw new Error(`A role with the name "${input.name}" already exists`);
          }
        }
        
        // Actualizar el rol
        const updatedRole = await prisma.roleModel.update({
          where: { id },
          data: {
            name: input.name,
            description: input.description,
          },
        });
        
        return {
          id: updatedRole.id,
          name: updatedRole.name,
          description: updatedRole.description,
          createdAt: updatedRole.createdAt.toISOString(),
          updatedAt: updatedRole.updatedAt.toISOString(),
        };
      } catch (error) {
        console.error(`Error updating role with ID ${id}:`, error);
        throw new Error(`Failed to update role: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    },
    
    // Eliminar un rol
    deleteRole: async (_parent: Parent, { id }: { id: string }, context: Context) => {
      // Verificar si el usuario está autenticado
      const session = await verifySession(context.req);
      const user = session?.user;
      
      if (!user) {
        throw new Error('Unauthorized: You must be logged in to delete a role');
      }
      
      // Solo los administradores o usuarios con permisos pueden eliminar roles
      if (user.role.name !== 'ADMIN' && !user.permissions?.includes('roles:delete')) {
        throw new Error('Forbidden: You do not have permission to delete roles');
      }
      
      try {
        // Verificar si el rol existe
        const existingRole = await prisma.roleModel.findUnique({
          where: { id },
        });
        
        if (!existingRole) {
          throw new Error(`Role with ID ${id} not found`);
        }
        
        // Verificar si hay usuarios con este rol
        const usersWithRole = await prisma.user.count({
          where: {
            roleId: id,
          },
        });
        
        if (usersWithRole > 0) {
          throw new Error(`Cannot delete role: there are ${usersWithRole} users with this role`);
        }
        
        // Eliminar el rol
        await prisma.roleModel.delete({
          where: { id },
        });
        
        return true;
      } catch (error) {
        console.error(`Error deleting role with ID ${id}:`, error);
        throw new Error(`Failed to delete role: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    },
    
    // Asignar un permiso a un rol
    assignPermissionToRole: async (_parent: Parent, { roleId, permissionId }: { roleId: string; permissionId: string }, context: Context) => {
      // Verificar si el usuario está autenticado
      const session = await verifySession(context.req);
      const user = session?.user;
      
      if (!user) {
        throw new Error('Unauthorized: You must be logged in to assign permissions');
      }
      
      // Solo los administradores o usuarios con permisos pueden asignar permisos
      if (user.role.name !== 'ADMIN' && !user.permissions?.includes('roles:update')) {
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
        
        // Asignar el permiso al rol
        await prisma.roleModel.update({
          where: { id: roleId },
          data: {
            permissions: {
              connect: {
                id: permissionId,
              },
            },
          },
        });
        
        return permission;
      } catch (error) {
        console.error(`Error assigning permission ${permissionId} to role ${roleId}:`, error);
        throw new Error(`Failed to assign permission to role: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    },
    
    // Remover un permiso de un rol
    removePermissionFromRole: async (_parent: Parent, { roleId, permissionId }: { roleId: string; permissionId: string }, context: Context) => {
      // Verificar si el usuario está autenticado
      const session = await verifySession(context.req);
      const user = session?.user;
      
      if (!user) {
        throw new Error('Unauthorized: You must be logged in to remove permissions');
      }
      
      // Solo los administradores o usuarios con permisos pueden remover permisos
      if (user.role.name !== 'ADMIN' && !user.permissions?.includes('roles:update')) {
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
        
        // Remover el permiso del rol
        await prisma.roleModel.update({
          where: { id: roleId },
          data: {
            permissions: {
              disconnect: {
                id: permissionId,
              },
            },
          },
        });
        
        return true;
      } catch (error) {
        console.error(`Error removing permission ${permissionId} from role ${roleId}:`, error);
        throw new Error(`Failed to remove permission from role: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    },
  },
}; 