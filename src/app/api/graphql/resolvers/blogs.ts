import { PrismaClient } from '@prisma/client';
import { GraphQLError } from 'graphql';

const prisma = new PrismaClient();

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

    // Get all posts with optional filtering
    posts: async (_: unknown, { filter }: { filter?: any }) => {
      try {
        const where: any = {};
        
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
            }
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
            }
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
    createBlog: async (_: unknown, { input }: { input: any }) => {
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
      } catch (error: any) {
        console.error('Error creating blog:', error);
        
        if (error.code === 'P2002' && error.meta?.target?.includes('slug')) {
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
    updateBlog: async (_: unknown, { id, input }: { id: string; input: any }) => {
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
      } catch (error: any) {
        console.error('Error updating blog:', error);
        
        if (error.code === 'P2002' && error.meta?.target?.includes('slug')) {
          return {
            success: false,
            message: 'A blog with this slug already exists',
            blog: null
          };
        }
        
        if (error.code === 'P2025') {
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
    deleteBlog: async (_: unknown, { id }: { id: string }) => {
      try {
        // Check if blog has posts
        const postsCount = await prisma.post.count({
          where: { blogId: id }
        });

        if (postsCount > 0) {
          return {
            success: false,
            message: `Cannot delete blog. It has ${postsCount} post(s). Please delete all posts first.`
          };
        }

        await prisma.blog.delete({
          where: { id }
        });

        return {
          success: true,
          message: 'Blog deleted successfully'
        };
      } catch (error: any) {
        console.error('Error deleting blog:', error);
        
        if (error.code === 'P2025') {
          return {
            success: false,
            message: 'Blog not found'
          };
        }
        
        return {
          success: false,
          message: 'Failed to delete blog'
        };
      }
    },

    // Create a new post
    createPost: async (_: unknown, { input }: { input: any }) => {
      try {
        const post = await prisma.post.create({
          data: {
            title: input.title,
            slug: input.slug,
            content: input.content,
            excerpt: input.excerpt,
            featuredImage: input.featuredImage,
            status: input.status || 'DRAFT',
            publishedAt: input.publishedAt ? new Date(input.publishedAt) : null,
            blogId: input.blogId,
            authorId: input.authorId,
            metaTitle: input.metaTitle,
            metaDescription: input.metaDescription,
            tags: input.tags || [],
            categories: input.categories || [],
            readTime: input.readTime
          }
        });

        return {
          success: true,
          message: 'Post created successfully',
          post
        };
      } catch (error: any) {
        console.error('Error creating post:', error);
        
        if (error.code === 'P2002' && error.meta?.target?.includes('slug')) {
          return {
            success: false,
            message: 'A post with this slug already exists',
            post: null
          };
        }
        
        return {
          success: false,
          message: 'Failed to create post',
          post: null
        };
      }
    },

    // Update a post
    updatePost: async (_: unknown, { id, input }: { id: string; input: any }) => {
      try {
        const updateData: any = {};
        
        if (input.title) updateData.title = input.title;
        if (input.slug) updateData.slug = input.slug;
        if (input.content) updateData.content = input.content;
        if (input.excerpt !== undefined) updateData.excerpt = input.excerpt;
        if (input.featuredImage !== undefined) updateData.featuredImage = input.featuredImage;
        if (input.status) updateData.status = input.status;
        if (input.publishedAt !== undefined) {
          updateData.publishedAt = input.publishedAt ? new Date(input.publishedAt) : null;
        }
        if (input.metaTitle !== undefined) updateData.metaTitle = input.metaTitle;
        if (input.metaDescription !== undefined) updateData.metaDescription = input.metaDescription;
        if (input.tags) updateData.tags = input.tags;
        if (input.categories) updateData.categories = input.categories;

        const post = await prisma.post.update({
          where: { id },
          data: updateData
        });

        return {
          success: true,
          message: 'Post updated successfully',
          post
        };
      } catch (error: any) {
        console.error('Error updating post:', error);
        
        if (error.code === 'P2002' && error.meta?.target?.includes('slug')) {
          return {
            success: false,
            message: 'A post with this slug already exists',
            post: null
          };
        }
        
        if (error.code === 'P2025') {
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
    deletePost: async (_: unknown, { id }: { id: string }) => {
      try {
        await prisma.post.delete({
          where: { id }
        });

        return {
          success: true,
          message: 'Post deleted successfully'
        };
      } catch (error: any) {
        console.error('Error deleting post:', error);
        
        if (error.code === 'P2025') {
          return {
            success: false,
            message: 'Post not found'
          };
        }
        
        return {
          success: false,
          message: 'Failed to delete post'
        };
      }
    }
  }
}; 