import { GraphQLError } from 'graphql';
import { prisma } from '@/lib/prisma';

// Define types
interface Context {
  user?: {
    id: string;
    role: string;
  };
}

interface ExternalLinkInput {
  name: string;
  url: string;
  icon: string;
  description?: string;
  isActive?: boolean;
  order?: number;
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
    
    activeExternalLinks: async () => {
      try {
        const links = await prisma.externalLink.findMany({
          where: {
            isActive: true,
          },
          orderBy: {
            order: 'asc',
          },
        });
        
        return links || [];
      } catch (error) {
        console.error('Error fetching active external links:', error);
        return [];
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
      if (context.user.role !== 'ADMIN') {
        console.error(`Authorization error: User role is ${context.user.role}, not ADMIN`);
        throw new GraphQLError('You must be an admin to create external links', {
          extensions: { code: 'FORBIDDEN' }
        });
      }
      
      try {
        // Create the link with the authenticated user's ID
        const linkData = {
          name: input.name,
          url: input.url,
          icon: input.icon || 'UserIcon',
          description: input.description || '',
          isActive: input.isActive !== undefined ? input.isActive : true,
          order: input.order !== undefined ? input.order : 0,
          createdBy: context.user.id
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
        if (context.user.role !== 'ADMIN') {
          throw new GraphQLError('You must be an admin to update external links', {
            extensions: { code: 'FORBIDDEN' }
          });
        }
        
        const result = await prisma.externalLink.update({
          where: {
            id,
          },
          data: input,
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
    
    deleteExternalLink: async (_: unknown, { id }: { id: string }, context: Context) => {
      // Authentication and authorization check
      if (!context.user) {
        throw new GraphQLError('You must be logged in to delete external links', {
          extensions: { code: 'UNAUTHENTICATED' }
        });
      }
      
      if (context.user.role !== 'ADMIN') {
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