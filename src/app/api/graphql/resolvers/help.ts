
import { verifyToken } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { GraphQLContext } from '../route';

// Define input types to avoid 'any'
interface CreateHelpArticleInput {
  title: string;
  content: string;
  category: string;
  tags?: string[];
}

interface UpdateHelpArticleInput {
  title?: string;
  content?: string;
  category?: string;
  tags?: string[];
}

export const helpResolvers = {
  Query: {
    helpArticles: async () => {
      try {
        const articles = await prisma.helpArticle.findMany({
          orderBy: { category: 'asc' }
        });
        
        return articles;
      } catch (error) {
        console.error('Get help articles error:', error);
        throw error;
      }
    },
    
    helpArticle: async (_parent: unknown, { id }: { id: string }) => {
      try {
        const article = await prisma.helpArticle.findUnique({
          where: { id }
        });
        
        if (!article) {
          throw new Error('Help article not found');
        }
        
        return article;
      } catch (error) {
        console.error('Get help article error:', error);
        throw error;
      }
    },
    
    helpArticlesByCategory: async (_parent: unknown, { category }: { category: string }) => {
      try {
        const articles = await prisma.helpArticle.findMany({
          where: { category },
          orderBy: { title: 'asc' }
        });
        
        return articles;
      } catch (error) {
        console.error('Get help articles by category error:', error);
        throw error;
      }
    },
    
    searchHelpArticles: async (_parent: unknown, { query }: { query: string }) => {
      try {
        // Simple search implementation that looks for matches in title, content, or tags
        const articles = await prisma.helpArticle.findMany({
          where: {
            OR: [
              { title: { contains: query, mode: 'insensitive' } },
              { content: { contains: query, mode: 'insensitive' } },
              { category: { contains: query, mode: 'insensitive' } }
              // Note: Searching in tags array would require more complex query or post-processing
            ]
          },
          orderBy: { title: 'asc' }
        });
        
        // Additional search in tags (post-processing)
        const lowerCaseQuery = query.toLowerCase();
        const articlesWithMatchingTags = await prisma.helpArticle.findMany({
          where: {
            tags: {
              has: lowerCaseQuery
            }
          }
        });
        
        // Combine results, removing duplicates
        const combinedArticles = [...articles];
        for (const article of articlesWithMatchingTags) {
          if (!combinedArticles.some(a => a.id === article.id)) {
            combinedArticles.push(article);
          }
        }
        
        return combinedArticles;
      } catch (error) {
        console.error('Search help articles error:', error);
        throw error;
      }
    }
  },
  
  Mutation: {
    createHelpArticle: async (
      _parent: unknown, 
      { input }: { input: CreateHelpArticleInput }, 
      context: GraphQLContext
    ) => {
      try {
        const token = context.req.headers.get('authorization')?.split(' ')[1];
        
        if (!token) {
          throw new Error('Not authenticated');
        }

        const decoded = await verifyToken(token) as { userId: string };
        
        // Check if the user has admin rights
        const user = await prisma.user.findUnique({
          where: { id: decoded.userId },
          select: { role: true }
        });
        
        if (user?.role?.name !== 'ADMIN') {
          throw new Error('Only administrators can create help articles');
        }
        
        const article = await prisma.helpArticle.create({
          data: {
            title: input.title,
            content: input.content,
            category: input.category,
            tags: input.tags || []
          }
        });
        
        return article;
      } catch (error) {
        console.error('Create help article error:', error);
        throw error;
      }
    },
    
    updateHelpArticle: async (
      _parent: unknown, 
      { id, input }: { id: string, input: UpdateHelpArticleInput }, 
      context: GraphQLContext
    ) => {
      try {
        const token = context.req.headers.get('authorization')?.split(' ')[1];
        
        if (!token) {
          throw new Error('Not authenticated');
        }

        const decoded = await verifyToken(token) as { userId: string };
        
        // Check if the user has admin rights
        const user = await prisma.user.findUnique({
          where: { id: decoded.userId },
          select: { role: true }
        });
        
        if (user?.role?.name !== 'ADMIN') {
          throw new Error('Only administrators can update help articles');
        }
        
        // Make sure the article exists
        const existingArticle = await prisma.helpArticle.findUnique({
          where: { id }
        });
        
        if (!existingArticle) {
          throw new Error('Help article not found');
        }
        
        const updateData: {
          title?: string;
          content?: string;
          category?: string;
          tags?: string[];
        } = {};
        
        // Only update fields that are provided
        if (input.title !== undefined) updateData.title = input.title;
        if (input.content !== undefined) updateData.content = input.content;
        if (input.category !== undefined) updateData.category = input.category;
        if (input.tags !== undefined) updateData.tags = input.tags;
        
        const updatedArticle = await prisma.helpArticle.update({
          where: { id },
          data: updateData
        });
        
        return updatedArticle;
      } catch (error) {
        console.error('Update help article error:', error);
        throw error;
      }
    },
    
    deleteHelpArticle: async (_parent: unknown, { id }: { id: string }, context: GraphQLContext) => {
      try {
        const token = context.req.headers.get('authorization')?.split(' ')[1];
        
        if (!token) {
          throw new Error('Not authenticated');
        }

        const decoded = await verifyToken(token) as { userId: string };
        
        // Check if the user has admin rights
        const user = await prisma.user.findUnique({
          where: { id: decoded.userId },
          select: { role: true }
        });
        
        if (user?.role?.name !== 'ADMIN') {
          throw new Error('Only administrators can delete help articles');
        }
        
        // Make sure the article exists
        const existingArticle = await prisma.helpArticle.findUnique({
          where: { id }
        });
        
        if (!existingArticle) {
          throw new Error('Help article not found');
        }
        
        await prisma.helpArticle.delete({
          where: { id }
        });
        
        return true;
      } catch (error) {
        console.error('Delete help article error:', error);
        return false;
      }
    }
  }
}; 