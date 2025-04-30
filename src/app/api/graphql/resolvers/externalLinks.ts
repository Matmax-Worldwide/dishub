import { PrismaClient } from '@prisma/client';
import { GraphQLError } from 'graphql';

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

const prisma = new PrismaClient();

export const resolvers = {
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
        return links || []; // Return empty array if links is null
      } catch (error) {
        console.error('Error fetching active external links:', error);
        return []; // Return empty array on error
      }
    },
  },
  
  Mutation: {
    createExternalLink: async (_: unknown, { input }: { input: ExternalLinkInput }, context: Context) => {
      if (!context.user || context.user.role !== 'ADMIN') {
        throw new GraphQLError('You must be an admin to create external links', {
          extensions: { code: 'FORBIDDEN' }
        });
      }
      
      return await prisma.externalLink.create({
        data: {
          ...input,
          createdBy: context.user.id,
        },
      });
    },
    
    updateExternalLink: async (_: unknown, { id, input }: { id: string, input: ExternalLinkInput }, context: Context) => {
      if (!context.user || context.user.role !== 'ADMIN') {
        throw new GraphQLError('You must be an admin to update external links', {
          extensions: { code: 'FORBIDDEN' }
        });
      }
      
      return await prisma.externalLink.update({
        where: {
          id,
        },
        data: input,
      });
    },
    
    deleteExternalLink: async (_: unknown, { id }: { id: string }, context: Context) => {
      if (!context.user || context.user.role !== 'ADMIN') {
        throw new GraphQLError('You must be an admin to delete external links', {
          extensions: { code: 'FORBIDDEN' }
        });
      }
      
      await prisma.externalLink.delete({
        where: {
          id,
        },
      });
      
      return true;
    },
  },
}; 