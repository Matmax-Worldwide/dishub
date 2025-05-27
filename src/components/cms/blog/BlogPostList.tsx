'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { gqlRequest } from '@/lib/graphql-client';
import { 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Eye, 
  Calendar,
  User,
  Clock,
  Tag,
  MoreHorizontal,
  FileText,
  Archive,
  Globe
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import Image from 'next/image';

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
  featuredImage?: string;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
  readTime?: number;
  tags: string[];
  categories: string[];
  author: {
    id: string;
    firstName: string;
    lastName: string;
    profileImageUrl?: string;
  };
  blog: {
    id: string;
    title: string;
  };
  views?: number;
}

interface Blog {
  id: string;
  title: string;
  slug: string;
}

interface BlogPostListProps {
  blogId?: string;
  locale?: string;
}

export function BlogPostList({ blogId, locale = 'en' }: BlogPostListProps) {
  const router = useRouter();
  
  // State management
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBlog, setSelectedBlog] = useState(blogId || 'all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedAuthor, setSelectedAuthor] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'title' | 'views'>('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const [postsPerPage] = useState(10);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [postToDelete, setPostToDelete] = useState<BlogPost | null>(null);

  // Load data
  useEffect(() => {
    loadPosts();
    loadBlogs();
  }, [selectedBlog, selectedStatus, selectedAuthor, sortBy]);

  async function loadPosts() {
    setLoading(true);
    try {
      const filter: any = {};
      
      if (selectedBlog !== 'all') {
        filter.blogId = selectedBlog;
      }
      
      if (selectedStatus !== 'all') {
        filter.status = selectedStatus;
      }
      
      if (selectedAuthor !== 'all') {
        filter.authorId = selectedAuthor;
      }

      const query = `
        query GetPosts($filter: PostFilter, $sort: PostSort) {
          posts(filter: $filter, sort: $sort) {
            id
            title
            slug
            excerpt
            featuredImage
            status
            publishedAt
            createdAt
            updatedAt
            readTime
            tags
            categories
            views
            author {
              id
              firstName
              lastName
              profileImageUrl
            }
            blog {
              id
              title
            }
          }
        }
      `;

      const variables = {
        filter,
        sort: {
          field: sortBy === 'newest' ? 'createdAt' : 
                 sortBy === 'oldest' ? 'createdAt' :
                 sortBy === 'title' ? 'title' : 'views',
          direction: sortBy === 'oldest' ? 'ASC' : 'DESC'
        }
      };

      const response = await gqlRequest<{ posts: BlogPost[] }>(query, variables);
      setPosts(response.posts || []);
    } catch (error) {
      console.error('Error loading posts:', error);
      toast.error('Failed to load posts');
    } finally {
      setLoading(false);
    }
  }

  async function loadBlogs() {
    try {
      const query = `
        query GetBlogs {
          blogs {
            id
            title
            slug
          }
        }
      `;

      const response = await gqlRequest<{ blogs: Blog[] }>(query);
      setBlogs(response.blogs || []);
    } catch (error) {
      console.error('Error loading blogs:', error);
    }
  }

  async function handleDeletePost(post: BlogPost) {
    try {
      const mutation = `
        mutation DeletePost($id: ID!) {
          deletePost(id: $id) {
            success
            message
          }
        }
      `;

      const response = await gqlRequest<{ deletePost: { success: boolean; message: string } }>(
        mutation, 
        { id: post.id }
      );

      if (response.deletePost.success) {
        toast.success('Post deleted successfully');
        loadPosts(); // Reload posts
      } else {
        throw new Error(response.deletePost.message);
      }
    } catch (error) {
      console.error('Error deleting post:', error);
      toast.error('Failed to delete post');
    } finally {
      setDeleteDialogOpen(false);
      setPostToDelete(null);
    }
  }

  async function handleStatusChange(post: BlogPost, newStatus: BlogPost['status']) {
    try {
      const mutation = `
        mutation UpdatePostStatus($id: ID!, $status: PostStatus!) {
          updatePost(id: $id, input: { status: $status }) {
            success
            message
          }
        }
      `;

      const response = await gqlRequest<{ updatePost: { success: boolean; message: string } }>(
        mutation, 
        { id: post.id, status: newStatus }
      );

      if (response.updatePost.success) {
        toast.success(`Post ${newStatus.toLowerCase()} successfully`);
        loadPosts(); // Reload posts
      } else {
        throw new Error(response.updatePost.message);
      }
    } catch (error) {
      console.error('Error updating post status:', error);
      toast.error('Failed to update post status');
    }
  }

  // Filter posts based on search query
  const filteredPosts = posts.filter(post =>
    post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    post.excerpt?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    post.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())) ||
    post.categories.some(cat => cat.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Paginate posts
  const totalPages = Math.ceil(filteredPosts.length / postsPerPage);
  const paginatedPosts = filteredPosts.slice(
    (currentPage - 1) * postsPerPage,
    currentPage * postsPerPage
  );

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusColor = (status: BlogPost['status']) => {
    switch (status) {
      case 'PUBLISHED':
        return 'bg-green-100 text-green-800';
      case 'DRAFT':
        return 'bg-yellow-100 text-yellow-800';
      case 'ARCHIVED':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid gap-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Blog Posts</h1>
          <p className="text-muted-foreground mt-2">
            Manage your blog posts and content
          </p>
        </div>
        <Button onClick={() => router.push(`/${locale}/cms/blog/posts/new`)}>
          <Plus className="h-4 w-4 mr-2" />
          New Post
        </Button>
      </div>

      {/* Filters and Search */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters & Search
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search posts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Blog Filter */}
            <Select value={selectedBlog} onValueChange={setSelectedBlog}>
              <SelectTrigger>
                <SelectValue placeholder="All Blogs" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Blogs</SelectItem>
                {blogs.map(blog => (
                  <SelectItem key={blog.id} value={blog.id}>
                    {blog.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Status Filter */}
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger>
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="PUBLISHED">Published</SelectItem>
                <SelectItem value="DRAFT">Draft</SelectItem>
                <SelectItem value="ARCHIVED">Archived</SelectItem>
              </SelectContent>
            </Select>

            {/* Author Filter */}
            <Select value={selectedAuthor} onValueChange={setSelectedAuthor}>
              <SelectTrigger>
                <SelectValue placeholder="All Authors" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Authors</SelectItem>
                {/* This would be populated with actual authors */}
              </SelectContent>
            </Select>

            {/* Sort */}
            <Select value={sortBy} onValueChange={(value) => setSortBy(value as any)}>
              <SelectTrigger>
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="oldest">Oldest First</SelectItem>
                <SelectItem value="title">Title A-Z</SelectItem>
                <SelectItem value="views">Most Views</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Posts List */}
      <div className="space-y-4">
        {paginatedPosts.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No posts found</h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery ? 'Try adjusting your search criteria' : 'Get started by creating your first post'}
              </p>
              <Button onClick={() => router.push(`/${locale}/cms/blog/posts/new`)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Post
              </Button>
            </CardContent>
          </Card>
        ) : (
          paginatedPosts.map(post => (
            <Card key={post.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  {/* Featured Image */}
                  {post.featuredImage && (
                    <div className="w-24 h-24 flex-shrink-0 overflow-hidden rounded-lg">
                      <Image
                        src={post.featuredImage}
                        alt={post.title}
                        width={96}
                        height={96}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold line-clamp-1 mb-1">
                          {post.title}
                        </h3>
                        {post.excerpt && (
                          <p className="text-muted-foreground text-sm line-clamp-2 mb-3">
                            {post.excerpt}
                          </p>
                        )}
                      </div>
                      
                      {/* Actions */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => router.push(`/${locale}/cms/blog/posts/edit/${post.id}`)}
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => window.open(`/${locale}/blog/post/${post.slug}`, '_blank')}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {post.status === 'DRAFT' && (
                            <DropdownMenuItem
                              onClick={() => handleStatusChange(post, 'PUBLISHED')}
                            >
                              <Globe className="h-4 w-4 mr-2" />
                              Publish
                            </DropdownMenuItem>
                          )}
                          {post.status === 'PUBLISHED' && (
                            <DropdownMenuItem
                              onClick={() => handleStatusChange(post, 'ARCHIVED')}
                            >
                              <Archive className="h-4 w-4 mr-2" />
                              Archive
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => {
                              setPostToDelete(post);
                              setDeleteDialogOpen(true);
                            }}
                            className="text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    {/* Meta Information */}
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                      <div className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        <span>{post.author.firstName} {post.author.lastName}</span>
                      </div>
                      
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>
                          {post.status === 'PUBLISHED' && post.publishedAt 
                            ? formatDate(post.publishedAt)
                            : formatDate(post.createdAt)
                          }
                        </span>
                      </div>
                      
                      {post.readTime && (
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>{post.readTime} min read</span>
                        </div>
                      )}
                      
                      {post.views !== undefined && (
                        <div className="flex items-center gap-1">
                          <Eye className="h-3 w-3" />
                          <span>{post.views} views</span>
                        </div>
                      )}
                    </div>

                    {/* Tags and Status */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge className={getStatusColor(post.status)}>
                          {post.status}
                        </Badge>
                        <Badge variant="outline">
                          {post.blog.title}
                        </Badge>
                      </div>
                      
                      {post.tags.length > 0 && (
                        <div className="flex items-center gap-1">
                          <Tag className="h-3 w-3 text-muted-foreground" />
                          <div className="flex gap-1">
                            {post.tags.slice(0, 3).map(tag => (
                              <Badge key={tag} variant="secondary" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                            {post.tags.length > 3 && (
                              <Badge variant="secondary" className="text-xs">
                                +{post.tags.length - 3}
                              </Badge>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-8">
          <Button
            variant="outline"
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
          >
            Previous
          </Button>
          <div className="flex items-center gap-2">
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              const page = i + 1;
              return (
                <Button
                  key={page}
                  variant={page === currentPage ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setCurrentPage(page)}
                >
                  {page}
                </Button>
              );
            })}
            {totalPages > 5 && (
              <>
                <span className="text-muted-foreground px-2">...</span>
                <Button
                  variant={totalPages === currentPage ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setCurrentPage(totalPages)}
                >
                  {totalPages}
                </Button>
              </>
            )}
          </div>
          <Button
            variant="outline"
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
          >
            Next
          </Button>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Post</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{postToDelete?.title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => postToDelete && handleDeletePost(postToDelete)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
} 