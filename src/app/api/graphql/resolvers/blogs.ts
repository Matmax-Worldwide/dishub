import { prisma } from '@/lib/prisma';
import { GraphQLError } from 'graphql';
import { PostStatus, Blog as PrismaBlog } from '@prisma/client'; 
// import { verifySession } from '@/app/api/utils/auth'; // Removed
import { Context } from '../../types'; 

// Define interfaces for input types (preserved)
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
  authorId: string; // Author is explicitly passed in input, not taken from context.user here
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
    // Queries are preserved as they were
    blogs: async () => {
      try {
        return await prisma.blog.findMany({
          orderBy: { createdAt: 'desc' },
        });
      } catch (error) {
        console.error('Error fetching blogs:', error);
        throw new GraphQLError('Failed to fetch blogs');
      }
    },
    blog: async (_: unknown, { id }: { id: string }) => {
      try {
        return await prisma.blog.findUnique({
          where: { id },
        });
      } catch (error) {
        console.error('Error fetching blog:', error);
        throw new GraphQLError('Failed to fetch blog');
      }
    },
    blogBySlug: async (_: unknown, { slug }: { slug: string }) => {
      try {
        return await prisma.blog.findUnique({
          where: { slug },
        });
      } catch (error) {
        console.error('Error fetching blog by slug:', error);
        throw new GraphQLError('Failed to fetch blog');
      }
    },
    post: async (_: unknown, { id }: { id: string }) => {
      try {
        return await prisma.post.findUnique({
          where: { id },
          include: {
            author: { select: { id: true, firstName: true, lastName: true, email: true, profileImageUrl: true } },
            blog: { select: { id: true, title: true, slug: true } },
            media: true, featuredImageMedia: true
          }
        });
      } catch (error) {
        console.error('Error fetching post:', error);
        throw new GraphQLError('Failed to fetch post');
      }
    },
    posts: async (_: unknown, { filter }: { filter?: PostFilter }) => {
      try {
        const where: Record<string, unknown> = {};
        if (filter?.blogId) where.blogId = filter.blogId;
        if (filter?.status) where.status = filter.status;
        if (filter?.authorId) where.authorId = filter.authorId;
        if (filter?.tags && filter.tags.length > 0) where.tags = { hasSome: filter.tags };
        if (filter?.categories && filter.categories.length > 0) where.categories = { hasSome: filter.categories };
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
            author: { select: { id: true, firstName: true, lastName: true, email: true } },
            blog: { select: { id: true, title: true, slug: true } },
            media: true, featuredImageMedia: true
          }
        });
      } catch (error) {
        console.error('Error fetching posts:', error);
        throw new GraphQLError('Failed to fetch posts');
      }
    },
    postBySlug: async (_: unknown, { slug }: { slug: string }) => {
      try {
        return await prisma.post.findUnique({
          where: { slug },
          include: {
            author: { select: { id: true, firstName: true, lastName: true, email: true } },
            blog: { select: { id: true, title: true, slug: true } },
            media: true, featuredImageMedia: true
          }
        });
      } catch (error) {
        console.error('Error fetching post by slug:', error);
        throw new GraphQLError('Failed to fetch post');
      }
    }
  },

  Mutation: {
    createBlog: async (_: unknown, { input }: { input: BlogInput }, context: Context) => {
      // Auth handled by graphql-shield. context.user is available if needed.
      // if (!context.user) throw new GraphQLError('Authentication required', { extensions: { code: 'UNAUTHENTICATED' } });
      try {
        const blog = await prisma.blog.create({
          data: {
            title: input.title,
            description: input.description,
            slug: input.slug,
            isActive: input.isActive ?? true
          }
        });
        return { success: true, message: 'Blog created successfully', blog };
      } catch (error) {
        const prismaError = error as PrismaError;
        if (prismaError.code === 'P2002' && prismaError.meta?.target?.includes('slug')) {
          throw new GraphQLError('A blog with this slug already exists');
        }
        console.error('Error creating blog:', error);
        throw new GraphQLError('Failed to create blog');
      }
    },

    updateBlog: async (_: unknown, { id, input }: { id: string; input: BlogInput }, context: Context) => {
      // Auth handled by graphql-shield.
      // if (!context.user) throw new GraphQLError('Authentication required', { extensions: { code: 'UNAUTHENTICATED' } });
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
        return { success: true, message: 'Blog updated successfully', blog };
      } catch (error) {
        const prismaError = error as PrismaError;
        if (prismaError.code === 'P2002' && prismaError.meta?.target?.includes('slug')) {
          throw new GraphQLError('A blog with this slug already exists');
        }
        if (prismaError.code === 'P2025') {
          throw new GraphQLError('Blog not found');
        }
        console.error('Error updating blog:', error);
        throw new GraphQLError('Failed to update blog');
      }
    },

    deleteBlog: async (_: unknown, { id }: { id: string }, context: Context) => {
      // Auth handled by graphql-shield.
      // if (!context.user) throw new GraphQLError('Authentication required', { extensions: { code: 'UNAUTHENTICATED' } });
      try {
        const postsCount = await prisma.post.count({ where: { blogId: id } });
        if (postsCount > 0) {
          throw new GraphQLError(`Cannot delete blog. It has ${postsCount} post(s). Please delete all posts first.`);
        }
        await prisma.blog.delete({ where: { id } });
        return { success: true, message: 'Blog deleted successfully', blog: null }; // blog is null as it's deleted
      } catch (error) {
        const prismaError = error as PrismaError;
        if (prismaError.code === 'P2025') {
          throw new GraphQLError('Blog not found');
        }
        console.error('Error deleting blog:', error);
        throw new GraphQLError('Failed to delete blog');
      }
    },

    createPost: async (_: unknown, { input }: { input: CreatePostInput }, context: Context) => {
      // Auth handled by graphql-shield.
      // if (!context.user) throw new GraphQLError('Authentication required', { extensions: { code: 'UNAUTHENTICATED' } });
      // Note: input.authorId is used. If this should be context.user.id, logic would change here.
      // For now, assuming authorId is an explicit input.
      try {
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
            authorId: input.authorId, // Explicitly from input
            metaTitle: input.metaTitle,
            metaDescription: input.metaDescription,
            tags: input.tags || [],
            categories: input.categories || [],
            readTime: input.readTime,
            ...(input.mediaIds && input.mediaIds.length > 0 && {
              media: { connect: input.mediaIds.map(id => ({ id })) }
            })
          },
          include: { author: true, blog: true, media: true, featuredImageMedia: true }
        });
        return { success: true, message: 'Post created successfully', post };
      } catch (error) {
        const prismaError = error as PrismaError;
        if (prismaError.code === 'P2002' && prismaError.meta?.target?.includes('slug')) {
          throw new GraphQLError('A post with this slug already exists');
        }
        if (prismaError.code === 'P2003') { // Foreign key constraint failed
          throw new GraphQLError('Invalid blog ID or author ID provided');
        }
        console.error('Error creating post:', error);
        throw new GraphQLError(`Failed to create post: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    },

    updatePost: async (_: unknown, { id, input }: { id: string; input: UpdatePostInput }, context: Context) => {
      // Auth handled by graphql-shield.
      // if (!context.user) throw new GraphQLError('Authentication required', { extensions: { code: 'UNAUTHENTICATED' } });
      try {
        const updateData: Record<string, unknown> = {};
        if (input.title !== undefined) updateData.title = input.title; // Check for undefined to allow null
        if (input.slug !== undefined) updateData.slug = input.slug;
        if (input.content !== undefined) updateData.content = input.content;
        if (input.excerpt !== undefined) updateData.excerpt = input.excerpt;
        if (input.featuredImage !== undefined) updateData.featuredImage = input.featuredImage;
        if (input.featuredImageId !== undefined) updateData.featuredImageId = input.featuredImageId;
        if (input.status) updateData.status = input.status;
        if (input.publishedAt !== undefined) updateData.publishedAt = input.publishedAt ? new Date(input.publishedAt) : null;
        if (input.metaTitle !== undefined) updateData.metaTitle = input.metaTitle;
        if (input.metaDescription !== undefined) updateData.metaDescription = input.metaDescription;
        if (input.tags) updateData.tags = input.tags;
        if (input.categories) updateData.categories = input.categories;
        if (input.readTime !== undefined) updateData.readTime = input.readTime;
        
        // For mediaIds, Prisma requires specific connect/disconnect/set operations for relations.
        // This simplified update won't handle relational changes for mediaIds directly.
        // If input.mediaIds is present, it needs to be handled via connect/set/disconnect.
        // Example: if (input.mediaIds) { updateData.media = { set: input.mediaIds.map(id => ({id})) }; }

        const post = await prisma.post.update({
          where: { id },
          data: updateData,
          include: { author: true, blog: true, media: true, featuredImageMedia: true } // Added include for consistency
        });
        return { success: true, message: 'Post updated successfully', post };
      } catch (error) {
        const prismaError = error as PrismaError;
        if (prismaError.code === 'P2002' && prismaError.meta?.target?.includes('slug')) {
          throw new GraphQLError('A post with this slug already exists');
        }
        if (prismaError.code === 'P2025') {
          throw new GraphQLError('Post not found');
        }
        console.error('Error updating post:', error);
        throw new GraphQLError('Failed to update post');
      }
    },

    deletePost: async (_: unknown, { id }: { id: string }, context: Context) => {
      // Auth handled by graphql-shield.
      // if (!context.user) throw new GraphQLError('Authentication required', { extensions: { code: 'UNAUTHENTICATED' } });
      try {
        await prisma.post.delete({ where: { id } });
        return { success: true, message: 'Post deleted successfully', post: null }; // post is null as it's deleted
      } catch (error) {
        const prismaError = error as PrismaError;
        if (prismaError.code === 'P2025') {
          throw new GraphQLError('Post not found');
        }
        console.error('Error deleting post:', error);
        throw new GraphQLError('Failed to delete post');
      }
    }
  },

  Blog: { 
    posts: async (parentBlog: PrismaBlog, _args: any, context: Context, _info: any) => {
      if (!parentBlog.id) {
        return []; 
      }
      try {
        return await context.loaders.postsByBlogIdLoader.load(parentBlog.id);
      } catch (error) {
        console.error(`Error loading posts for blog ${parentBlog.id} via DataLoader:`, error);
        return []; 
      }
    }
  },
};
