import { prisma } from '@/lib/prisma';
import { GraphQLError } from 'graphql';
import { PostStatus } from '@prisma/client';
import { verifySession } from '@/app/api/utils/auth';
import { Context } from '@/app/api/graphql/types';

// Define interfaces for input types
interface BlogInput {
  title: string;
  description?: string;
  slug: string;
  isActive?: boolean;
}

interface PostFilter {
  blogId?: string;
  status?: PostStatus;
  authorId?: string;
  tags?: string[];
  categories?: string[];
  search?: string;
  limit?: number;
  offset?: number;
}

interface CreatePostInput {
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  featuredImage?: string;
  featuredImageId?: string;
  status?: PostStatus;
  publishedAt?: string;
  blogId: string;
  authorId: string;
  metaTitle?: string;
  metaDescription?: string;
  tags?: string[];
  categories?: string[];
  readTime?: number;
  mediaIds?: string[];
}

interface UpdatePostInput {
  title?: string;
  slug?: string;
  content?: string;
  excerpt?: string;
  featuredImage?: string;
  featuredImageId?: string;
  status?: PostStatus;
  publishedAt?: string;
  metaTitle?: string;
  metaDescription?: string;
  tags?: string[];
  categories?: string[];
  readTime?: number;
  mediaIds?: string[];
}

interface PrismaError extends Error {
  code?: string;
  meta?: {
    target?: string[];
  };
}

export const blogResolvers = {
  Query: {
    // Get all blogs
    blogs: async () => {
      try {
        return await prisma.blog.findMany({
          orderBy: { createdAt: 'desc' },
          include: {
            posts: {
              select: { id: true }
            }
          }
        });
      } catch (error) {
        console.error('Error fetching blogs:', error);
        throw new GraphQLError('Failed to fetch blogs');
      }
    },

    // Get a single blog by ID
    blog: async (_: unknown, { id }: { id: string }) => {
      try {
        return await prisma.blog.findUnique({
          where: { id },
          include: {
            posts: {
              select: { id: true }
            }
          }
        });
      } catch (error) {
        console.error('Error fetching blog:', error);
        throw new GraphQLError('Failed to fetch blog');
      }
    },

    // Get a single blog by slug
    blogBySlug: async (_: unknown, { slug }: { slug: string }) => {
      try {
        return await prisma.blog.findUnique({
          where: { slug },
          include: {
            posts: {
              select: { id: true }
            }
          }
        });
      } catch (error) {
        console.error('Error fetching blog by slug:', error);
        throw new GraphQLError('Failed to fetch blog');
      }
    },

    // Get a single post by ID
    post: async (_: unknown, { id }: { id: string }) => {
      try {
        return await prisma.post.findUnique({
          where: { id },
          include: {
            author: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                profileImageUrl: true
              }
            },
            blog: {
              select: {
                id: true,
                title: true,
                slug: true
              }
            },
            media: true,
            featuredImageMedia: true
          }
        });
      } catch (error) {
        console.error('Error fetching post:', error);
        throw new GraphQLError('Failed to fetch post');
      }
    },

    // Get all posts with optional filtering
    posts: async (_: unknown, { filter }: { filter?: PostFilter }) => {
      try {
        const where: Record<string, unknown> = {};
        
        if (filter?.blogId) {
          where.blogId = filter.blogId;
        }
        
        if (filter?.status) {
          where.status = filter.status;
        }
        
        if (filter?.authorId) {
          where.authorId = filter.authorId;
        }
        
        if (filter?.tags && filter.tags.length > 0) {
          where.tags = {
            hasSome: filter.tags
          };
        }
        
        if (filter?.categories && filter.categories.length > 0) {
          where.categories = {
            hasSome: filter.categories
          };
        }
        
        if (filter?.search) {
          where.OR = [
            { title: { contains: filter.search, mode: 'insensitive' } },
            { content: { contains: filter.search, mode: 'insensitive' } },
            { excerpt: { contains: filter.search, mode: 'insensitive' } }
          ];
        }

        return await prisma.post.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          take: filter?.limit || undefined,
          skip: filter?.offset || undefined,
          include: {
            author: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true
              }
            },
            blog: {
              select: {
                id: true,
                title: true,
                slug: true
              }
            },
            media: true,
            featuredImageMedia: true
          }
        });
      } catch (error) {
        console.error('Error fetching posts:', error);
        throw new GraphQLError('Failed to fetch posts');
      }
    },

    // Get a single post by slug
    postBySlug: async (_: unknown, { slug }: { slug: string }) => {
      try {
        return await prisma.post.findUnique({
          where: { slug },
          include: {
            author: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true
              }
            },
            blog: {
              select: {
                id: true,
                title: true,
                slug: true
              }
            },
            media: true,
            featuredImageMedia: true
          }
        });
      } catch (error) {
        console.error('Error fetching post by slug:', error);
        throw new GraphQLError('Failed to fetch post');
      }
    }
  },

  Mutation: {
    // Create a new blog
    createBlog: async (_: unknown, { input }: { input: BlogInput }, context: Context) => {
      // Require authentication for creating blogs
      const session = await verifySession(context.req);
      if (!session?.user) {
        throw new GraphQLError('Authentication required to create blogs', {
          extensions: { code: 'UNAUTHENTICATED' }
        });
      }

      // Only admins and managers can create blogs
      if (!['ADMIN', 'MANAGER'].includes(session.user.role.name)) {
        throw new GraphQLError('Insufficient permissions to create blogs', {
          extensions: { code: 'FORBIDDEN' }
        });
      }

      try {
        const blog = await prisma.blog.create({
          data: {
            title: input.title,
            description: input.description,
            slug: input.slug,
            isActive: input.isActive ?? true
          }
        });

        return {
          success: true,
          message: 'Blog created successfully',
          blog
        };
      } catch (error) {
        console.error('Error creating blog:', error);
        const prismaError = error as PrismaError;
        
        if (prismaError.code === 'P2002' && prismaError.meta?.target?.includes('slug')) {
          return {
            success: false,
            message: 'A blog with this slug already exists',
            blog: null
          };
        }
        
        return {
          success: false,
          message: 'Failed to create blog',
          blog: null
        };
      }
    },

    // Update a blog
    updateBlog: async (_: unknown, { id, input }: { id: string; input: BlogInput }, context: Context) => {
      // Require authentication for updating blogs
      const session = await verifySession(context.req);
      if (!session?.user) {
        throw new GraphQLError('Authentication required to update blogs', {
          extensions: { code: 'UNAUTHENTICATED' }
        });
      }

      // Only admins and managers can update blogs
      if (!['ADMIN', 'MANAGER'].includes(session.user.role.name)) {
        throw new GraphQLError('Insufficient permissions to update blogs', {
          extensions: { code: 'FORBIDDEN' }
        });
      }

      try {
        const blog = await prisma.blog.update({
          where: { id },
          data: {
            ...(input.title && { title: input.title }),
            ...(input.description !== undefined && { description: input.description }),
            ...(input.slug && { slug: input.slug }),
            ...(input.isActive !== undefined && { isActive: input.isActive })
          }
        });

        return {
          success: true,
          message: 'Blog updated successfully',
          blog
        };
      } catch (error) {
        console.error('Error updating blog:', error);
        const prismaError = error as PrismaError;
        
        if (prismaError.code === 'P2002' && prismaError.meta?.target?.includes('slug')) {
          return {
            success: false,
            message: 'A blog with this slug already exists',
            blog: null
          };
        }
        
        if (prismaError.code === 'P2025') {
          return {
            success: false,
            message: 'Blog not found',
            blog: null
          };
        }
        
        return {
          success: false,
          message: 'Failed to update blog',
          blog: null
        };
      }
    },

    // Delete a blog
    deleteBlog: async (_: unknown, { id }: { id: string }, context: Context) => {
      // Require authentication for deleting blogs
      const session = await verifySession(context.req);
      if (!session?.user) {
        throw new GraphQLError('Authentication required to delete blogs', {
          extensions: { code: 'UNAUTHENTICATED' }
        });
      }

      // Only admins can delete blogs
      if (session.user.role.name !== 'ADMIN') {
        throw new GraphQLError('Insufficient permissions to delete blogs', {
          extensions: { code: 'FORBIDDEN' }
        });
      }

      try {
        // Check if blog has posts
        const postsCount = await prisma.post.count({
          where: { blogId: id }
        });

        if (postsCount > 0) {
          return {
            success: false,
            message: `Cannot delete blog. It has ${postsCount} post(s). Please delete all posts first.`,
            blog: null
          };
        }

        await prisma.blog.delete({
          where: { id }
        });

        return {
          success: true,
          message: 'Blog deleted successfully',
          blog: null
        };
      } catch (error) {
        console.error('Error deleting blog:', error);
        const prismaError = error as PrismaError;
        
        if (prismaError.code === 'P2025') {
          return {
            success: false,
            message: 'Blog not found',
            blog: null
          };
        }
        
        return {
          success: false,
          message: 'Failed to delete blog',
          blog: null
        };
      }
    },

    // Create a new post
    createPost: async (_: unknown, { input }: { input: CreatePostInput }, context: Context) => {
      // Require authentication for creating posts
      const session = await verifySession(context.req);
      if (!session?.user) {
        throw new GraphQLError('Authentication required to create posts', {
          extensions: { code: 'UNAUTHENTICATED' }
        });
      }

      // Only admins, managers, and employees can create posts
      if (!['ADMIN', 'MANAGER', 'EMPLOYEE'].includes(session.user.role.name)) {
        throw new GraphQLError('Insufficient permissions to create posts', {
          extensions: { code: 'FORBIDDEN' }
        });
      }

      try {
        console.log('Creating post with input:', JSON.stringify(input, null, 2));
        
        const post = await prisma.post.create({
          data: {
            title: input.title,
            slug: input.slug,
            content: input.content,
            excerpt: input.excerpt,
            featuredImage: input.featuredImage,
            featuredImageId: input.featuredImageId,
            status: input.status || 'DRAFT',
            publishedAt: input.publishedAt ? new Date(input.publishedAt) : null,
            blogId: input.blogId,
            authorId: input.authorId,
            metaTitle: input.metaTitle,
            metaDescription: input.metaDescription,
            tags: input.tags || [],
            categories: input.categories || [],
            readTime: input.readTime,
            ...(input.mediaIds && input.mediaIds.length > 0 && {
              media: {
                connect: input.mediaIds.map(id => ({ id }))
              }
            })
          },
          include: {
            author: true,
            blog: true,
            media: true,
            featuredImageMedia: true
          }
        });

        console.log('Post created successfully:', post);

        return {
          success: true,
          message: 'Post created successfully',
          post
        };
      } catch (error) {
        console.error('Error creating post - Full error:', error);
        console.error('Error creating post - Error message:', error instanceof Error ? error.message : 'Unknown error');
        console.error('Error creating post - Error stack:', error instanceof Error ? error.stack : 'No stack trace');
        
        const prismaError = error as PrismaError;
        console.error('Prisma error code:', prismaError.code);
        console.error('Prisma error meta:', prismaError.meta);
        
        if (prismaError.code === 'P2002' && prismaError.meta?.target?.includes('slug')) {
          return {
            success: false,
            message: 'A post with this slug already exists',
            post: null
          };
        }
        
        if (prismaError.code === 'P2003') {
          return {
            success: false,
            message: 'Invalid blog ID or author ID provided',
            post: null
          };
        }
        
        return {
          success: false,
          message: `Failed to create post: ${error instanceof Error ? error.message : 'Unknown error'}`,
          post: null
        };
      }
    },

    // Update a post
    updatePost: async (_: unknown, { id, input }: { id: string; input: UpdatePostInput }, context: Context) => {
      // Require authentication for updating posts
      const session = await verifySession(context.req);
      if (!session?.user) {
        throw new GraphQLError('Authentication required to update posts', {
          extensions: { code: 'UNAUTHENTICATED' }
        });
      }

      // Only admins, managers, and employees can update posts
      if (!['ADMIN', 'MANAGER', 'EMPLOYEE'].includes(session.user.role.name)) {
        throw new GraphQLError('Insufficient permissions to update posts', {
          extensions: { code: 'FORBIDDEN' }
        });
      }

      try {
        const updateData: Record<string, unknown> = {};
        
        if (input.title) updateData.title = input.title;
        if (input.slug) updateData.slug = input.slug;
        if (input.content) updateData.content = input.content;
        if (input.excerpt !== undefined) updateData.excerpt = input.excerpt;
        if (input.featuredImage !== undefined) updateData.featuredImage = input.featuredImage;
        if (input.featuredImageId !== undefined) updateData.featuredImageId = input.featuredImageId;
        if (input.status) updateData.status = input.status;
        if (input.publishedAt !== undefined) {
          updateData.publishedAt = input.publishedAt ? new Date(input.publishedAt) : null;
        }
        if (input.metaTitle !== undefined) updateData.metaTitle = input.metaTitle;
        if (input.metaDescription !== undefined) updateData.metaDescription = input.metaDescription;
        if (input.tags) updateData.tags = input.tags;
        if (input.categories) updateData.categories = input.categories;
        if (input.mediaIds) updateData.mediaIds = input.mediaIds;

        const post = await prisma.post.update({
          where: { id },
          data: updateData
        });

        return {
          success: true,
          message: 'Post updated successfully',
          post
        };
      } catch (error) {
        console.error('Error updating post:', error);
        const prismaError = error as PrismaError;
        
        if (prismaError.code === 'P2002' && prismaError.meta?.target?.includes('slug')) {
          return {
            success: false,
            message: 'A post with this slug already exists',
            post: null
          };
        }
        
        if (prismaError.code === 'P2025') {
          return {
            success: false,
            message: 'Post not found',
            post: null
          };
        }
        
        return {
          success: false,
          message: 'Failed to update post',
          post: null
        };
      }
    },

    // Delete a post
    deletePost: async (_: unknown, { id }: { id: string }, context: Context) => {
      // Require authentication for deleting posts
      const session = await verifySession(context.req);
      if (!session?.user) {
        throw new GraphQLError('Authentication required to delete posts', {
          extensions: { code: 'UNAUTHENTICATED' }
        });
      }

      // Only admins and managers can delete posts
      if (!['ADMIN', 'MANAGER'].includes(session.user.role.name)) {
        throw new GraphQLError('Insufficient permissions to delete posts', {
          extensions: { code: 'FORBIDDEN' }
        });
      }

      try {
        await prisma.post.delete({
          where: { id }
        });

        return {
          success: true,
          message: 'Post deleted successfully',
          post: null
        };
      } catch (error) {
        console.error('Error deleting post:', error);
        const prismaError = error as PrismaError;
        
        if (prismaError.code === 'P2025') {
          return {
            success: false,
            message: 'Post not found',
            post: null
          };
        }
        
        return {
          success: false,
          message: 'Failed to delete post',
          post: null
        };
      }
    }
  }
}; 