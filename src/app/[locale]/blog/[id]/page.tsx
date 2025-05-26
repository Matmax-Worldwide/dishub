import { notFound } from 'next/navigation';
import { gqlRequest } from '@/lib/graphql-client';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Calendar, Clock, User, Search } from 'lucide-react';
import Link from 'next/link';

interface Blog {
  id: string;
  title: string;
  description: string;
  slug: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Post {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  featuredImage: string;
  status: string;
  publishedAt: string;
  readTime: number;
  tags: string[];
  categories: string[];
  author: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

interface PageProps {
  params: Promise<{
    id: string;
    locale: string;
  }>;
  searchParams: Promise<{
    search?: string;
    category?: string;
    tag?: string;
    sort?: string;
    page?: string;
  }>;
}

async function getBlogWithPosts(
  blogId: string, 
  filters: {
    search?: string;
    category?: string;
    tag?: string;
    sort?: string;
    page?: string;
  }
): Promise<{ blog: Blog | null; posts: Post[] }> {
  try {
    // Get blog details
    const blogQuery = `
      query GetBlog($id: ID!) {
        blog(id: $id) {
          id
          title
          description
          slug
          isActive
          createdAt
          updatedAt
        }
      }
    `;
    
    const blogResponse = await gqlRequest<{ blog: Blog | null }>(blogQuery, { id: blogId });
    
    if (!blogResponse.blog) {
      return { blog: null, posts: [] };
    }

    // Build post filter
    const postFilter: Record<string, unknown> = {
      blogId: blogId,
      status: 'PUBLISHED'
    };

    if (filters.search) {
      postFilter.search = filters.search;
    }

    if (filters.category) {
      postFilter.categories = [filters.category];
    }

    if (filters.tag) {
      postFilter.tags = [filters.tag];
    }

    // Pagination
    const page = parseInt(filters.page || '1');
    const limit = 12;
    const offset = (page - 1) * limit;
    
    postFilter.limit = limit;
    postFilter.offset = offset;

    // Get posts
    const postsQuery = `
      query GetPosts($filter: PostFilter) {
        posts(filter: $filter) {
          id
          title
          slug
          excerpt
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
            email
          }
        }
      }
    `;

    const postsResponse = await gqlRequest<{ posts: Post[] }>(postsQuery, { filter: postFilter });

    return {
      blog: blogResponse.blog,
      posts: postsResponse.posts || []
    };
  } catch (error) {
    console.error('Error fetching blog and posts:', error);
    return { blog: null, posts: [] };
  }
}

export default async function BlogDetailPage({ params, searchParams }: PageProps) {
  const { id, locale } = await params;
  const filters = await searchParams;
  
  const { blog, posts } = await getBlogWithPosts(id, filters);

  if (!blog) {
    notFound();
  }

  // Extract unique categories and tags from posts
  const allCategories = Array.from(new Set(posts.flatMap(post => post.categories)));
  const allTags = Array.from(new Set(posts.flatMap(post => post.tags)));

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'MMM dd, yyyy');
  };

  const getAuthorName = (author: Post['author']) => {
    return `${author.firstName} ${author.lastName}`.trim() || author.email;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center gap-4 mb-6">
            <Link href={`/${locale}/blog`}>
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Blogs
              </Button>
            </Link>
          </div>
          
          <div className="max-w-4xl">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">{blog.title}</h1>
            {blog.description && (
              <p className="text-xl text-gray-600 mb-6">{blog.description}</p>
            )}
            
            <div className="flex items-center gap-6 text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>Created {formatDate(blog.createdAt)}</span>
              </div>
              <div className="flex items-center gap-2">
                <span>{posts.length} post{posts.length !== 1 ? 's' : ''}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-wrap items-center gap-4">
            {/* Search */}
            <div className="flex-1 min-w-[300px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search posts..."
                  defaultValue={filters.search}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Category Filter */}
            {allCategories.length > 0 && (
              <Select defaultValue={filters.category || 'all'}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {allCategories.map(category => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {/* Tag Filter */}
            {allTags.length > 0 && (
              <Select defaultValue={filters.tag || 'all'}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Tag" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Tags</SelectItem>
                  {allTags.map(tag => (
                    <SelectItem key={tag} value={tag}>
                      {tag}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {/* Sort */}
            <Select defaultValue={filters.sort || 'newest'}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="oldest">Oldest First</SelectItem>
                <SelectItem value="title">Title A-Z</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Posts Grid */}
      <div className="container mx-auto px-4 py-8">
        {posts.length === 0 ? (
          <div className="text-center py-12">
            <div className="max-w-md mx-auto">
              <h3 className="text-lg font-medium text-gray-900 mb-2">No posts found</h3>
              <p className="text-gray-600">
                {filters.search || filters.category || filters.tag
                  ? 'Try adjusting your filters to see more posts.'
                  : 'This blog doesn\'t have any published posts yet.'}
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((post) => (
              <Card key={post.id} className="h-full hover:shadow-lg transition-shadow">
                {post.featuredImage && (
                  <div className="aspect-video overflow-hidden rounded-t-lg">
                    <img
                      src={post.featuredImage}
                      alt={post.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                
                <CardHeader>
                  <div className="flex items-center justify-between mb-2">
                    {post.categories.length > 0 && (
                      <Badge variant="secondary" className="text-xs">
                        {post.categories[0]}
                      </Badge>
                    )}
                    <span className="text-xs text-gray-500">
                      {formatDate(post.publishedAt)}
                    </span>
                  </div>
                  
                  <CardTitle className="line-clamp-2">
                    <Link 
                      href={`/${locale}/blog/post/${post.slug}`}
                      className="hover:text-blue-600 transition-colors"
                    >
                      {post.title}
                    </Link>
                  </CardTitle>
                </CardHeader>
                
                <CardContent>
                  {post.excerpt && (
                    <CardDescription className="line-clamp-3 mb-4">
                      {post.excerpt}
                    </CardDescription>
                  )}
                  
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      <span>{getAuthorName(post.author)}</span>
                    </div>
                    
                    {post.readTime > 0 && (
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>{post.readTime} min read</span>
                      </div>
                    )}
                  </div>
                  
                  {post.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-3">
                      {post.tags.slice(0, 3).map(tag => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                      {post.tags.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{post.tags.length - 3} more
                        </Badge>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Pagination */}
        {posts.length > 0 && (
          <div className="flex justify-center mt-12">
            <div className="flex items-center gap-2">
              <Button variant="outline" disabled={!filters.page || filters.page === '1'}>
                Previous
              </Button>
              <span className="px-4 py-2 text-sm text-gray-600">
                Page {filters.page || '1'}
              </span>
              <Button variant="outline" disabled={posts.length < 12}>
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 