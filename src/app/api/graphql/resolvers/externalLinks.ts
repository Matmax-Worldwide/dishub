import { GraphQLError } from 'graphql';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { ExternalLink } from '@prisma/client';

// Define types
interface Context {
  user?: {
    id: string;
    role: string | {
      id: string;
      name: string;
      description?: string;
    };
  };
  req?: {
    headers: {
      get(name: string): string | null;
    };
  };
}

interface ExternalLinkInput {
  name: string;
  url: string;
  icon: string;
  description?: string;
  isActive?: boolean;
  order?: number;
  accessControl?: AccessControlInput;
}

interface AccessControlInput {
  type: 'PUBLIC' | 'ROLES' | 'USERS' | 'MIXED';
  allowedRoles?: string[];
  allowedUsers?: string[];
  deniedUsers?: string[];
}

// Comprobar si un usuario tiene acceso a un enlace
async function userHasAccessToLink(userId: string, userRole: string, link: ExternalLink): Promise<boolean> {
  // Verificaciones de seguridad para valores null o undefined
  if (!link) return false;
  if (!userId) return link.accessType === 'PUBLIC';
  
  // Si el usuario es ADMIN, tiene acceso a todos los enlaces
  if (userRole === 'ADMIN') {
    return true;
  }
  
  // Si el enlace es público, todos tienen acceso
  if (link.accessType === 'PUBLIC') {
    return true;
  }

  // Verificar denegación explícita primero (mayor prioridad)
  // Si el usuario está en la lista de usuarios denegados, no tiene acceso independientemente de otras reglas
  if (link.deniedUsers && Array.isArray(link.deniedUsers) && link.deniedUsers.includes(userId)) {
    return false;
  }

  // Control basado en roles
  if (link.accessType === 'ROLES' || link.accessType === 'MIXED') {
    try {
      // Obtener el ID del rol del usuario si se proporcionó el nombre del rol
      let userRoleId = userRole;
      
      // Si userRole no parece ser un ID (no tiene formato CUID), buscar el rol por nombre
      if (!userRole.startsWith('cm')) {
        const role = await prisma.roleModel.findFirst({
          where: { name: userRole }
        });
        if (role) {
          userRoleId = role.id;
        }
      }
      
      if (link.allowedRoles && Array.isArray(link.allowedRoles) && link.allowedRoles.includes(userRoleId)) {
        return true;
      }
    } catch (error) {
      console.error("Error al verificar rol:", error);
    }
    
    // Si es solo basado en roles y el rol no está permitido, no hay acceso
    if (link.accessType === 'ROLES') {
      return false;
    }
  }

  // Control basado en usuarios específicos
  if (link.accessType === 'USERS' || link.accessType === 'MIXED') {
    if (link.allowedUsers && Array.isArray(link.allowedUsers) && link.allowedUsers.includes(userId)) {
      return true;
    }
    
    // Si es solo basado en usuarios y el usuario no está permitido, no hay acceso
    if (link.accessType === 'USERS') {
      return false;
    }
  }

  // Para tipo MIXED, si no está en ninguna de las listas de permitidos, no tiene acceso
  return false;
}

// Use the shared Prisma instance rather than creating a new one
// const prisma = new PrismaClient();

// EMERGENCY MODE: Simple resolver that works no matter what
export const externalLinksResolvers = {
  Query: {
    externalLinks: async (_: unknown, __: unknown, context: Context) => {
      if (!context.user) {
        throw new GraphQLError('You must be logged in to view external links', {
          extensions: { code: 'UNAUTHENTICATED' }
        });
      }
      
      return await prisma.externalLink.findMany({
        orderBy: {
          order: 'asc',
        },
      });
    },
    
    externalLink: async (_: unknown, { id }: { id: string }, context: Context) => {
      if (!context.user) {
        throw new GraphQLError('You must be logged in to view this external link', {
          extensions: { code: 'UNAUTHENTICATED' }
        });
      }
      
      return await prisma.externalLink.findUnique({
        where: {
          id,
        },
      });
    },
    
    activeExternalLinks: async (_: unknown, __: unknown, context: Context) => {
      console.log('RESOLVER: activeExternalLinks called');
      try {
        // Obtener token del contexto
        let userId = '';
        let userRole = '';
        
        if (context.req) {
          console.log('RESOLVER: Processing request with headers', context.req.headers);
          const token = context.req.headers.get('authorization')?.split(' ')[1];
          if (token) {
            console.log('RESOLVER: Found token in headers');
            try {
              const decoded = await verifyToken(token) as { userId: string, role: string | { name: string } };
              userId = decoded.userId;
              console.log('RESOLVER: Decoded userId:', userId);
              
              // Obtener el rol del usuario
              if (typeof decoded.role === 'string') {
                userRole = decoded.role;
                console.log('RESOLVER: Role from token (string):', userRole);
              } else if (decoded.role && typeof decoded.role === 'object' && 'name' in decoded.role) {
                userRole = decoded.role.name;
                console.log('RESOLVER: Role from token (object):', userRole);
              }
              
              // Si no se pudo determinar el rol, consultar a la base de datos
              if (!userRole) {
                console.log('RESOLVER: No role in token, fetching from database');
                const userWithRole = await prisma.user.findUnique({
                  where: { id: userId },
                  select: { role: { select: { name: true } } }
                });
                
                if (userWithRole?.role?.name) {
                  userRole = userWithRole.role.name;
                  console.log('RESOLVER: Role from database:', userRole);
                } else {
                  console.warn('RESOLVER: Could not determine user role');
                }
              }
            } catch (error) {
              console.error('RESOLVER: Error verifying token:', error);
            }
          } else {
            console.warn('RESOLVER: No token found in headers');
          }
        } else {
          console.warn('RESOLVER: No request object in context');
        }
        
        // Obtener todos los enlaces activos
        console.log('RESOLVER: Fetching active links');
        const allActiveLinks = await prisma.externalLink.findMany({
          where: {
            isActive: true,
          },
          orderBy: {
            order: 'asc',
          },
        });
        
        console.log('RESOLVER: Found', allActiveLinks.length, 'active links');
        
        // Si no se pudo autenticar al usuario, mostrar solo enlaces públicos
        if (!userId) {
          console.log('RESOLVER: No authenticated user, returning only public links');
          const publicLinks = allActiveLinks.filter(link => link.accessType === 'PUBLIC');
          console.log('RESOLVER: Returning', publicLinks.length, 'public links');
          return publicLinks;
        }
        
        // Filtrar enlaces según el acceso del usuario
        console.log(`RESOLVER: Filtering links for user ${userId} with role ${userRole}`);
        const accessibleLinks = await Promise.all(
          allActiveLinks.map(async (link) => {
            const hasAccess = await userHasAccessToLink(userId, userRole, link);
            console.log(`RESOLVER: Link ${link.name}, accessType ${link.accessType}, hasAccess: ${hasAccess}`);
            return hasAccess ? link : null;
          })
        );
        
        // Filtrar los nulos y devolver los enlaces accesibles
        const filteredLinks = accessibleLinks.filter(link => link !== null);
        console.log('RESOLVER: Returning', filteredLinks.length, 'accessible links');
        return filteredLinks;
      } catch (error) {
        console.error('RESOLVER: Error fetching active external links:', error);
        return [];
      }
    },

    // Nueva consulta para obtener el estado de acceso de un usuario a todos los enlaces
    userLinkAccessStatus: async (_: unknown, __: unknown, context: Context) => {
      if (!context.user) {
        throw new GraphQLError('You must be logged in to view this information', {
          extensions: { code: 'UNAUTHENTICATED' }
        });
      }
      
      try {
        const { id: userId } = context.user;
        
        // Obtener el nombre del rol como string
        let userRole = '';
        if (typeof context.user.role === 'string') {
          userRole = context.user.role;
        } else if (context.user.role && typeof context.user.role === 'object' && 'name' in context.user.role) {
          userRole = context.user.role.name;
        }
        
        // Obtener el ID del rol si es un nombre
        let userRoleId = userRole;
        if (!userRole.startsWith('cm')) {
          const role = await prisma.roleModel.findFirst({
            where: { name: userRole }
          });
          if (role) {
            userRoleId = role.id;
          }
        }
        
        const allLinks = await prisma.externalLink.findMany();
        
        const accessStatusPromises = allLinks.map(async (link) => {
          const hasAccess = await userHasAccessToLink(userId, userRole, link);
          return {
            linkId: link.id,
            linkName: link.name,
            hasAccess,
            accessType: link.accessType,
            isInAllowedRoles: link.allowedRoles?.includes(userRoleId) || false,
            isInAllowedUsers: link.allowedUsers?.includes(userId) || false,
            isInDeniedUsers: link.deniedUsers?.includes(userId) || false
          };
        });
        
        return await Promise.all(accessStatusPromises);
      } catch (error) {
        console.error('Error getting user link access status:', error);
        throw new GraphQLError('Failed to determine link access status', {
          extensions: { code: 'INTERNAL_SERVER_ERROR', error }
        });
      }
    },

    // Nueva consulta para obtener enlaces activos simulando un rol específico
    activeExternalLinksAs: async (_: unknown, { roleId }: { roleId: string }, context: Context) => {
      console.log('RESOLVER: activeExternalLinksAs called with roleId:', roleId);
      try {
        // Verificar que el usuario sea administrador
        if (!context.user) {
          throw new GraphQLError('You must be logged in to use this feature', {
            extensions: { code: 'UNAUTHENTICATED' }
          });
        }
        
        // Verificar que el usuario sea ADMIN
        const userRole = typeof context.user.role === 'string' 
          ? context.user.role 
          : context.user.role?.name || '';
          
        if (userRole !== 'ADMIN') {
          throw new GraphQLError('You must be an admin to use this feature', {
            extensions: { code: 'FORBIDDEN' }
          });
        }
        
        // Obtener información del rol a simular
        let roleToSimulate = roleId;
        let roleName = '';
        
        // Si es un ID de rol, obtener su nombre
        if (roleId.startsWith('cm')) {
          const role = await prisma.roleModel.findUnique({
            where: { id: roleId }
          });
          
          if (!role) {
            throw new GraphQLError('Role not found', {
              extensions: { code: 'NOT_FOUND' }
            });
          }
          
          roleName = role.name;
        } else {
          // Si es un nombre de rol, buscar su ID
          const role = await prisma.roleModel.findFirst({
            where: { name: roleId }
          });
          
          if (!role) {
            throw new GraphQLError('Role not found', {
              extensions: { code: 'NOT_FOUND' }
            });
          }
          
          roleToSimulate = role.id;
          roleName = role.name;
        }
        
        console.log(`RESOLVER: Simulating view as role ${roleName} (${roleToSimulate})`);
        
        // Obtener todos los enlaces activos
        const allActiveLinks = await prisma.externalLink.findMany({
          where: {
            isActive: true,
          },
          orderBy: {
            order: 'asc',
          },
        });
        
        console.log('RESOLVER: Found', allActiveLinks.length, 'active links');
        
        // Filtrar enlaces según el acceso del rol simulado
        const userId = context.user.id; // Mantener el mismo usuario pero cambiar el rol
        
        const accessibleLinks = await Promise.all(
          allActiveLinks.map(async (link) => {
            // Para el propósito de simulación, no damos acceso automático al admin
            // sino que evaluamos como si fuera el rol especificado
            let hasAccess = false;
            
            // Verificar acceso basado en el tipo
            if (link.accessType === 'PUBLIC') {
              hasAccess = true;
            } else if (link.accessType === 'ROLES' || link.accessType === 'MIXED') {
              if (link.allowedRoles && Array.isArray(link.allowedRoles) && link.allowedRoles.includes(roleToSimulate)) {
                hasAccess = true;
              } else if (link.accessType === 'MIXED' && link.allowedUsers && Array.isArray(link.allowedUsers) && link.allowedUsers.includes(userId)) {
                hasAccess = true;
              }
            } else if (link.accessType === 'USERS') {
              if (link.allowedUsers && Array.isArray(link.allowedUsers) && link.allowedUsers.includes(userId)) {
                hasAccess = true;
              }
            }
            
            // Verificar denegación explícita
            if (link.deniedUsers && Array.isArray(link.deniedUsers) && link.deniedUsers.includes(userId)) {
              hasAccess = false;
            }
            
            console.log(`RESOLVER: Link ${link.name}, accessType ${link.accessType}, hasAccess: ${hasAccess}`);
            return hasAccess ? link : null;
          })
        );
        
        // Filtrar los nulos y devolver los enlaces accesibles
        const filteredLinks = accessibleLinks.filter(link => link !== null);
        console.log('RESOLVER: Returning', filteredLinks.length, 'accessible links for simulated role');
        return filteredLinks;
      } catch (error) {
        console.error('RESOLVER: Error simulating external links access:', error);
        throw new GraphQLError('Failed to simulate links access', {
          extensions: { code: 'INTERNAL_SERVER_ERROR', error }
        });
      }
    },
  },
  
  Mutation: {
    createExternalLink: async (_: unknown, { input }: { input: ExternalLinkInput }, context: Context) => {
      console.log('Creating external link with input:', JSON.stringify(input));
      console.log('Context user:', context.user);
      
      // Authentication check
      if (!context.user) {
        console.error('Authentication error: No user in context');
        throw new GraphQLError('You must be logged in to create external links', {
          extensions: { code: 'UNAUTHENTICATED' }
        });
      }
      
      // Authorization check
      if (context.user.role !== 'ADMIN' && context.user.role !== 'SuperAdmin' && 
          (typeof context.user.role === 'object' && context.user.role.name !== 'ADMIN' && context.user.role.name !== 'SuperAdmin')) {
        console.error(`Authorization error: User role is not ADMIN or SuperAdmin`);
        throw new GraphQLError('You must be an admin to create external links', {
          extensions: { code: 'FORBIDDEN' }
        });
      }
      
      try {
        // Procesar la configuración de control de acceso
        const accessControl = input.accessControl || { type: 'PUBLIC' };
        
        // Crear el link con la configuración de acceso
        const linkData = {
          name: input.name,
          url: input.url,
          icon: input.icon || 'UserIcon',
          description: input.description || '',
          isActive: input.isActive !== undefined ? input.isActive : true,
          order: input.order !== undefined ? input.order : 0,
          createdBy: context.user.id,
          accessType: accessControl.type,
          allowedRoles: accessControl.allowedRoles || [],
          allowedUsers: accessControl.allowedUsers || [],
          deniedUsers: accessControl.deniedUsers || [],
        };
        
        console.log('Creating external link with data:', JSON.stringify(linkData));
        
        const newLink = await prisma.externalLink.create({
          data: linkData
        });
        
        console.log('External link created successfully:', JSON.stringify(newLink));
        return newLink;
      } catch (error) {
        console.error('Error creating external link:', error);
        throw new GraphQLError('Failed to create external link', {
          extensions: { code: 'INTERNAL_SERVER_ERROR', error }
        });
      }
    },
    
    updateExternalLink: async (_: unknown, { id, input }: { id: string, input: ExternalLinkInput }, context: Context) => {
      try {
        // Authentication check
        if (!context.user) {
          throw new GraphQLError('You must be logged in to update external links', {
            extensions: { code: 'UNAUTHENTICATED' }
          });
        }
        
        // Authorization check
        if (context.user.role !== 'ADMIN' && context.user.role !== 'SuperAdmin' && 
            (typeof context.user.role === 'object' && context.user.role.name !== 'ADMIN' && context.user.role.name !== 'SuperAdmin')) {
          throw new GraphQLError('You must be an admin to update external links', {
            extensions: { code: 'FORBIDDEN' }
          });
        }

        // Procesar la configuración de control de acceso si existe
        const updateData: Record<string, unknown> = { ...input };
        
        if (input.accessControl) {
          updateData.accessType = input.accessControl.type;
          
          // Procesar allowedRoles para asegurar que son IDs válidos
          if (input.accessControl.allowedRoles && Array.isArray(input.accessControl.allowedRoles)) {
            const processedRoles = [];
            
            for (const roleIdentifier of input.accessControl.allowedRoles) {
              // Si el identificador ya parece un ID (empieza con 'cm'), usarlo directamente
              if (roleIdentifier.startsWith('cm')) {
                processedRoles.push(roleIdentifier);
              } else {
                // Si es un nombre de rol, buscar su ID
                try {
                  const role = await prisma.roleModel.findFirst({
                    where: { name: roleIdentifier }
                  });
                  if (role) {
                    processedRoles.push(role.id);
                  } else {
                    console.warn(`Rol no encontrado: ${roleIdentifier}`);
                  }
                } catch (error) {
                  console.error(`Error al buscar rol ${roleIdentifier}:`, error);
                }
              }
            }
            
            updateData.allowedRoles = processedRoles;
          } else {
            updateData.allowedRoles = [];
          }
          
          updateData.allowedUsers = input.accessControl.allowedUsers || [];
          updateData.deniedUsers = input.accessControl.deniedUsers || [];
          
          // Eliminar el campo accessControl para no confundir a Prisma
          delete updateData.accessControl;
        }
        
        console.log('Actualizando enlace con datos:', JSON.stringify(updateData));
        
        const result = await prisma.externalLink.update({
          where: {
            id,
          },
          data: updateData,
        });
        
        console.log('Updated external link:', result);
        return result;
      } catch (error) {
        console.error('Error updating external link:', error);
        throw new GraphQLError('Failed to update external link', {
          extensions: { code: 'INTERNAL_SERVER_ERROR', error }
        });
      }
    },
    
    // Mutation específica para actualizar solo el control de acceso
    updateLinkAccess: async (_: unknown, 
                              { id, accessControl }: 
                              { id: string, accessControl: AccessControlInput }, 
                              context: Context) => {
      try {
        // Authentication check
        if (!context.user) {
          throw new GraphQLError('You must be logged in to update link access', {
            extensions: { code: 'UNAUTHENTICATED' }
          });
        }
        
        // Authorization check
        if (context.user.role !== 'ADMIN' && context.user.role !== 'SuperAdmin' && 
            (typeof context.user.role === 'object' && context.user.role.name !== 'ADMIN' && context.user.role.name !== 'SuperAdmin')) {
          throw new GraphQLError('You must be an admin to update link access', {
            extensions: { code: 'FORBIDDEN' }
          });
        }
        
        // Procesar allowedRoles para asegurar que son IDs válidos
        const processedAllowedRoles = [];
        
        if (accessControl.allowedRoles && Array.isArray(accessControl.allowedRoles)) {
          for (const roleIdentifier of accessControl.allowedRoles) {
            // Si el identificador ya parece un ID (empieza con 'cm'), usarlo directamente
            if (roleIdentifier.startsWith('cm')) {
              processedAllowedRoles.push(roleIdentifier);
            } else {
              // Si es un nombre de rol, buscar su ID
              try {
                const role = await prisma.roleModel.findFirst({
                  where: { name: roleIdentifier }
                });
                if (role) {
                  processedAllowedRoles.push(role.id);
                } else {
                  console.warn(`Rol no encontrado: ${roleIdentifier}`);
                }
              } catch (error) {
                console.error(`Error al buscar rol ${roleIdentifier}:`, error);
              }
            }
          }
        }
        
        console.log('Actualizando acceso de enlace con roles procesados:', processedAllowedRoles);
        
        // Actualizar solo los campos de control de acceso
        const result = await prisma.externalLink.update({
          where: { id },
          data: {
            accessType: accessControl.type,
            allowedRoles: processedAllowedRoles,
            allowedUsers: accessControl.allowedUsers || [],
            deniedUsers: accessControl.deniedUsers || [],
          }
        });
        
        return result;
      } catch (error) {
        console.error('Error updating link access:', error);
        throw new GraphQLError('Failed to update link access', {
          extensions: { code: 'INTERNAL_SERVER_ERROR', error }
        });
      }
    },
    
    deleteExternalLink: async (_: unknown, { id }: { id: string }, context: Context) => {
      // Authentication and authorization check
      if (!context.user) {
        throw new GraphQLError('You must be logged in to delete external links', {
          extensions: { code: 'UNAUTHENTICATED' }
        });
      }
      
      if (context.user.role !== 'ADMIN' && context.user.role !== 'SuperAdmin' && 
          (typeof context.user.role === 'object' && context.user.role.name !== 'ADMIN' && context.user.role.name !== 'SuperAdmin')) {
        throw new GraphQLError('You must be an admin to delete external links', {
          extensions: { code: 'FORBIDDEN' }
        });
      }
      
      try {
        await prisma.externalLink.delete({
          where: {
            id,
          },
        });
        
        return true;
      } catch (error) {
        console.error('Error deleting external link:', error);
        throw new GraphQLError('Failed to delete external link', {
          extensions: { code: 'INTERNAL_SERVER_ERROR', error }
        });
      }
    },
  },
};

// Direct export for the resolver
export default externalLinksResolvers;
export const resolvers = externalLinksResolvers; 