'use client';

import React, { useEffect, useState } from 'react';
import BlogSection from './BlogSection';
import { gqlRequest } from '@/lib/graphql-client';
import { Skeleton } from '@/components/ui/skeleton';

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
  content?: string;
  featuredImage?: string;
  author?: {
    name: string;
    image?: string;
  };
  publishedAt?: string;
  readTime?: string;
  tags?: string[];
  category?: string;
}

interface BlogSectionWrapperProps {
  // Section configuration
  title?: string;
  subtitle?: string;
  layout?: 'grid' | 'list' | 'carousel';
  filtersEnabled?: boolean;
  searchEnabled?: boolean;
  postsPerPage?: number;
  showFeaturedImage?: boolean;
  showAuthor?: boolean;
  showDate?: boolean;
  showTags?: boolean;
  showExcerpt?: boolean;
  // Filter configuration
  blogId?: string;
  status?: 'PUBLISHED' | 'DRAFT';
  authorId?: string;
  tags?: string[];
  categories?: string[];
  limit?: number;
  // CMS editing
  isEditing?: boolean;
  onUpdate?: (data: Partial<BlogSectionWrapperProps>) => void;
}

interface PostFilter {
  blogId?: string;
  status?: string;
  authorId?: string;
  tags?: string[];
  categories?: string[];
  limit?: number;
}

interface Author {
  id: string;
  firstName: string;
  lastName: string;
  profileImageUrl?: string;
}

interface PostResponse {
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
  content: string;
  featuredImage?: string;
  status: string;
  publishedAt?: string;
  readTime?: string;
  tags?: string[];
  categories?: string[];
  author?: Author;
}

export default function BlogSectionWrapper({
  // Default values
  title = 'Blog',
  subtitle = 'Latest articles and insights',
  layout = 'grid',
  filtersEnabled = true,
  searchEnabled = true,
  postsPerPage = 9,
  showFeaturedImage = true,
  showAuthor = true,
  showDate = true,
  showTags = true,
  showExcerpt = true,
  blogId,
  status = 'PUBLISHED',
  authorId,
  tags,
  categories,
  limit,
  isEditing = false,
  onUpdate
}: BlogSectionWrapperProps) {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch posts when component mounts or filter props change
  useEffect(() => {
    fetchPosts();
  }, [blogId, status, authorId, tags, categories, limit]);

  async function fetchPosts() {
    try {
      setLoading(true);
      
      // Build filter object
      const filter: PostFilter = {};
      
      if (blogId) filter.blogId = blogId;
      if (status) filter.status = status;
      if (authorId) filter.authorId = authorId;
      if (tags?.length) filter.tags = tags;
      if (categories?.length) filter.categories = categories;
      if (limit) filter.limit = limit;
      
      // Create GraphQL query
      const query = `
        query GetFilteredPosts($filter: PostFilterInput) {
          posts(filter: $filter) {
            id
            title
            slug
            excerpt
            content
            featuredImage
            status
            publishedAt
            readTime
            tags
            categories
            author {
              id
              firstName
              lastName
              profileImageUrl
            }
          }
        }
      `;
      
      const response = await gqlRequest<{ posts: PostResponse[] }>(query, { filter });
      
      // Transform posts to match BlogSection interface
      const transformedPosts: BlogPost[] = response.posts.map(post => ({
        id: post.id,
        title: post.title,
        slug: post.slug,
        excerpt: post.excerpt || undefined,
        content: post.content,
        featuredImage: post.featuredImage || undefined,
        author: post.author ? {
          name: `${post.author.firstName} ${post.author.lastName}`,
          image: post.author.profileImageUrl || undefined
        } : undefined,
        publishedAt: post.publishedAt || undefined,
        readTime: post.readTime ? `${post.readTime} min read` : undefined,
        tags: post.tags || [],
        category: post.categories?.[0]
      }));

      setPosts(transformedPosts);
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-4 w-1/2" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-64" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <BlogSection
      title={title}
      subtitle={subtitle}
      posts={posts}
      layout={layout}
      filtersEnabled={filtersEnabled}
      searchEnabled={searchEnabled}
      postsPerPage={postsPerPage}
      showFeaturedImage={showFeaturedImage}
      showAuthor={showAuthor}
      showDate={showDate}
      showTags={showTags}
      showExcerpt={showExcerpt}
      isEditing={isEditing}
      onUpdate={onUpdate}
    />
  );
} 