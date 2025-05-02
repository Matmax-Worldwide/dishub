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
  // Si el enlace es público, todos tienen acceso
  if (link.accessType === 'PUBLIC') {
    return true;
  }

  // Si el usuario está en la lista de usuarios denegados, no tiene acceso
  if (link.deniedUsers && link.deniedUsers.includes(userId)) {
    return false;
  }

  // Control basado en roles
  if (link.accessType === 'ROLES' || link.accessType === 'MIXED') {
    if (link.allowedRoles && link.allowedRoles.includes(userRole)) {
      return true;
    }
  }

  // Control basado en usuarios específicos
  if (link.accessType === 'USERS' || link.accessType === 'MIXED') {
    if (link.allowedUsers && link.allowedUsers.includes(userId)) {
      return true;
    }
  }

  // Si no cumple con ninguna condición de acceso
  return link.accessType === 'MIXED' ? false : link.accessType === 'ROLES' || link.accessType === 'USERS';
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
      try {
        // Obtener token del contexto
        let userId = '';
        let userRole = '';
        
        if (context.req) {
          const token = context.req.headers.get('authorization')?.split(' ')[1];
          if (token) {
            try {
              const decoded = await verifyToken(token) as { userId: string, role: string | { name: string } };
              userId = decoded.userId;
              
              // Obtener el rol del usuario
              if (typeof decoded.role === 'string') {
                userRole = decoded.role;
              } else if (decoded.role && typeof decoded.role === 'object' && 'name' in decoded.role) {
                userRole = decoded.role.name;
              }
              
              // Si no se pudo determinar el rol, consultar a la base de datos
              if (!userRole) {
                const userWithRole = await prisma.user.findUnique({
                  where: { id: userId },
                  select: { role: { select: { name: true } } }
                });
                
                if (userWithRole?.role?.name) {
                  userRole = userWithRole.role.name;
                }
              }
            } catch (error) {
              console.error('Error verifying token:', error);
            }
          }
        }
        
        // Obtener todos los enlaces activos
        const allActiveLinks = await prisma.externalLink.findMany({
          where: {
            isActive: true,
          },
          orderBy: {
            order: 'asc',
          },
        });
        
        // Si no se pudo autenticar al usuario, mostrar solo enlaces públicos
        if (!userId) {
          return allActiveLinks.filter(link => link.accessType === 'PUBLIC');
        }
        
        // Filtrar enlaces según el acceso del usuario
        const accessibleLinks = await Promise.all(
          allActiveLinks.map(async (link) => {
            const hasAccess = await userHasAccessToLink(userId, userRole, link);
            return hasAccess ? link : null;
          })
        );
        
        // Filtrar los nulos y devolver los enlaces accesibles
        return accessibleLinks.filter(link => link !== null);
      } catch (error) {
        console.error('Error fetching active external links:', error);
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
        const { id: userId, role } = context.user;
        
        // Obtener el nombre del rol como string
        let userRole = '';
        if (typeof role === 'string') {
          userRole = role;
        } else if (role && typeof role === 'object' && 'name' in role) {
          userRole = role.name;
        }
        
        const allLinks = await prisma.externalLink.findMany();
        
        const accessStatusPromises = allLinks.map(async (link) => {
          const hasAccess = await userHasAccessToLink(userId, userRole, link);
          return {
            linkId: link.id,
            linkName: link.name,
            hasAccess,
            accessType: link.accessType,
            isInAllowedRoles: link.allowedRoles?.includes(userRole) || false,
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
    }
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
      if (context.user.role !== 'ADMIN' && 
          (typeof context.user.role === 'object' && context.user.role.name !== 'ADMIN')) {
        console.error(`Authorization error: User role is not ADMIN`);
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
        if (context.user.role !== 'ADMIN' && 
            (typeof context.user.role === 'object' && context.user.role.name !== 'ADMIN')) {
          throw new GraphQLError('You must be an admin to update external links', {
            extensions: { code: 'FORBIDDEN' }
          });
        }

        // Procesar la configuración de control de acceso si existe
        const updateData: Record<string, unknown> = { ...input };
        
        if (input.accessControl) {
          updateData.accessType = input.accessControl.type;
          updateData.allowedRoles = input.accessControl.allowedRoles || [];
          updateData.allowedUsers = input.accessControl.allowedUsers || [];
          updateData.deniedUsers = input.accessControl.deniedUsers || [];
          
          // Eliminar el campo accessControl para no confundir a Prisma
          delete updateData.accessControl;
        }
        
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
        if (context.user.role !== 'ADMIN' && 
            (typeof context.user.role === 'object' && context.user.role.name !== 'ADMIN')) {
          throw new GraphQLError('You must be an admin to update link access', {
            extensions: { code: 'FORBIDDEN' }
          });
        }
        
        // Actualizar solo los campos de control de acceso
        const result = await prisma.externalLink.update({
          where: { id },
          data: {
            accessType: accessControl.type,
            allowedRoles: accessControl.allowedRoles || [],
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
      
      if (context.user.role !== 'ADMIN' && 
          (typeof context.user.role === 'object' && context.user.role.name !== 'ADMIN')) {
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