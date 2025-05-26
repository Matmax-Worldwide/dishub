'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { 
  Pencil, 
  Trash2, 
  Plus, 
  Eye, 
  Search, 
  Filter, 
  ChevronUp, 
  ChevronDown, 
  LayoutGrid, 
  List as ListIcon 
} from 'lucide-react';
import graphqlClient from '@/lib/graphql-client';
import { Post } from '@/types/blog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';

interface PostListProps {
  blogId: string;
  locale?: string;
}

export function PostList({ blogId, locale = 'en' }: PostListProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState<Post[]>([]);
  const [filteredPosts, setFilteredPosts] = useState<Post[]>([]);
  const [blog, setBlog] = useState<{ title: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortField, setSortField] = useState<'title' | 'publishedAt' | 'createdAt'>('createdAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PUBLISHED' | 'DRAFT'>('ALL');

  // Load blog posts on component mount
  useEffect(() => {
    loadBlogAndPosts();
  }, [blogId]);

  // Filter and sort posts when relevant states change
  useEffect(() => {
    filterAndSortPosts();
  }, [posts, searchQuery, sortField, sortDirection, statusFilter]);

  async function loadBlogAndPosts() {
    setLoading(true);
    try {
      // Fetch blog info using GraphQL
      const blogData = await graphqlClient.getBlogById(blogId);
      setBlog(blogData);

      // Fetch posts using GraphQL client
      const postsData = await graphqlClient.getPosts({
        blogId: blogId,
        limit: 100
      });
      
      setPosts(postsData);
    } catch (error) {
      console.error('Error loading blog posts:', error);
      toast.error('Failed to load blog posts');
    } finally {
      setLoading(false);
    }
  }

  function filterAndSortPosts() {
    // Apply search filter
    let result = posts.filter(post => {
      const titleMatch = post.title.toLowerCase().includes(searchQuery.toLowerCase());
      const contentMatch = post.content?.toLowerCase().includes(searchQuery.toLowerCase());
      const excerptMatch = post.excerpt?.toLowerCase().includes(searchQuery.toLowerCase());
      
      return titleMatch || contentMatch || excerptMatch;
    });
    
    // Apply status filter
    if (statusFilter !== 'ALL') {
      result = result.filter(post => post.status === statusFilter);
    }
    
    // Apply sorting
    result.sort((a, b) => {
      if (sortField === 'title') {
        return sortDirection === 'asc'
          ? a.title.localeCompare(b.title)
          : b.title.localeCompare(a.title);
      } else if (sortField === 'publishedAt') {
        const dateA = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
        const dateB = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
        return sortDirection === 'asc' ? dateA - dateB : dateB - dateA;
      } else {
        // Sort by createdAt
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return sortDirection === 'asc' ? dateA - dateB : dateB - dateA;
      }
    });
    
    setFilteredPosts(result);
  }

  const handleCreatePost = () => {
    router.push(`/${locale}/cms/blog/posts/${blogId}/new`);
  };

  const handleEditPost = (postId: string) => {
    router.push(`/${locale}/cms/blog/posts/${blogId}/edit/${postId}`);
  };

  const handleViewPost = (postId: string) => {
    // This would typically link to the public-facing post
    toast.info('View functionality not implemented yet');
    console.log('Viewing post:', postId);
    // In the future, we could implement: router.push(`/blog/post/${postId}`);
  };

  const handleDeletePost = async (postId: string) => {
    if (!window.confirm('Are you sure you want to delete this post? This action cannot be undone.')) {
      return;
    }
    
    try {
      const result = await graphqlClient.deletePost(postId);
      
      if (result.success) {
        toast.success('Post deleted successfully');
        // Remove the deleted post from state
        setPosts(posts.filter(post => post.id !== postId));
      } else {
        toast.error(result.message || 'Failed to delete post');
      }
    } catch (error) {
      console.error('Error deleting post:', error);
      toast.error('An error occurred while deleting the post');
    }
  };

  const handleSort = (field: 'title' | 'publishedAt' | 'createdAt') => {
    if (sortField === field) {
      // Toggle direction if clicking the same field
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new field and default to ascending
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Render loading state
  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="flex justify-between items-center mb-8">
          <div>
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-32" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array(6).fill(0).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-32 mb-2" />
                <Skeleton className="h-4 w-16" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-24 w-full" />
              </CardContent>
              <CardFooter>
                <Skeleton className="h-8 w-full" />
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Render blog not found state
  if (!blog) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Card className="text-center p-8">
          <CardHeader>
            <CardTitle>Blog Not Found</CardTitle>
            <CardDescription>
              The blog you are looking for does not exist or has been deleted.
            </CardDescription>
          </CardHeader>
          <CardFooter className="flex justify-center">
            <Button onClick={() => router.push(`/${locale}/cms/blog`)}>
              Return to Blogs
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // Render empty state
  if (posts.length === 0) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">{blog.title} - Posts</h1>
            <p className="text-muted-foreground">Manage blog posts</p>
          </div>
          <Button onClick={handleCreatePost}>
            <Plus className="mr-2 h-4 w-4" /> Create Post
          </Button>
        </div>
        
        <Card className="text-center p-8">
          <CardHeader>
            <CardTitle>No Posts Yet</CardTitle>
            <CardDescription>
              This blog doesn&apos;t have any posts yet. Get started by creating your first post.
            </CardDescription>
          </CardHeader>
          <CardFooter className="flex justify-center">
            <Button onClick={handleCreatePost}>
              <Plus className="mr-2 h-4 w-4" /> Create First Post
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // Render filtered empty state
  if (filteredPosts.length === 0 && posts.length > 0) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">{blog.title} - Posts</h1>
            <p className="text-muted-foreground">Manage blog posts</p>
          </div>
          <Button onClick={handleCreatePost}>
            <Plus className="mr-2 h-4 w-4" /> Create Post
          </Button>
        </div>
        
        {/* Toolbar */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search posts..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Filter className="mr-2 h-4 w-4" />
                  {statusFilter === 'ALL' ? 'All' : statusFilter}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setStatusFilter('ALL')}>
                  All
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter('PUBLISHED')}>
                  Published
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter('DRAFT')}>
                  Draft
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            <Button
              variant="outline"
              size="icon"
              onClick={() => setViewMode('grid')}
              className={viewMode === 'grid' ? 'bg-accent' : ''}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setViewMode('list')}
              className={viewMode === 'list' ? 'bg-accent' : ''}
            >
              <ListIcon className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        <Card className="text-center p-8">
          <CardHeader>
            <CardTitle>No Posts Found</CardTitle>
            <CardDescription>
              No posts match your current search criteria. Try changing your search or filters.
            </CardDescription>
          </CardHeader>
          <CardFooter className="flex justify-center">
            <Button variant="outline" onClick={() => {
              setSearchQuery('');
              setStatusFilter('ALL');
            }}>
              Clear Filters
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">{blog.title} - Posts</h1>
          <p className="text-muted-foreground">
            {posts.length} {posts.length === 1 ? 'post' : 'posts'} in this blog
          </p>
        </div>
        <Button onClick={handleCreatePost}>
          <Plus className="mr-2 h-4 w-4" /> Create Post
        </Button>
      </div>
      
      {/* Toolbar */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
        <div className="relative w-full md:w-64">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search posts..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Filter className="mr-2 h-4 w-4" />
                {statusFilter === 'ALL' ? 'All' : statusFilter}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setStatusFilter('ALL')}>
                All
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter('PUBLISHED')}>
                Published
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter('DRAFT')}>
                Draft
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <Button
            variant="outline"
            size="icon"
            onClick={() => setViewMode('grid')}
            className={viewMode === 'grid' ? 'bg-accent' : ''}
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setViewMode('list')}
            className={viewMode === 'list' ? 'bg-accent' : ''}
          >
            <ListIcon className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      {/* Grid View */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPosts.map((post) => (
            <Card key={post.id} className="flex flex-col h-full">
              <CardHeader className="pb-4">
                <CardTitle className="line-clamp-2">{post.title}</CardTitle>
                <div className="flex justify-between items-center">
                  <Badge variant={post.status === 'PUBLISHED' ? 'default' : 'secondary'}>
                    {post.status}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {post.publishedAt 
                      ? format(new Date(post.publishedAt), 'MMM d, yyyy')
                      : format(new Date(post.createdAt), 'MMM d, yyyy')}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="flex-grow pb-4">
                {post.excerpt ? (
                  <p className="text-sm text-muted-foreground line-clamp-3">{post.excerpt}</p>
                ) : (
                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {post.content?.substring(0, 150)}...
                  </p>
                )}
              </CardContent>
              <CardFooter className="pt-2 flex justify-end border-t">
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleViewPost(post.id)}
                    title="View Post"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleEditPost(post.id)}
                    title="Edit Post"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeletePost(post.id)}
                    title="Delete Post"
                    className="text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
      
      {/* List View */}
      {viewMode === 'list' && (
        <div className="bg-card rounded-md border shadow-sm overflow-hidden">
          <div className="grid grid-cols-12 gap-4 p-4 border-b font-medium text-sm">
            <div className="col-span-5 flex items-center cursor-pointer" onClick={() => handleSort('title')}>
              Title
              {sortField === 'title' && (
                sortDirection === 'asc' 
                  ? <ChevronUp className="ml-1 h-4 w-4" /> 
                  : <ChevronDown className="ml-1 h-4 w-4" />
              )}
            </div>
            <div className="col-span-2">Status</div>
            <div 
              className="col-span-3 cursor-pointer flex items-center" 
              onClick={() => handleSort('publishedAt')}
            >
              Published
              {sortField === 'publishedAt' && (
                sortDirection === 'asc' 
                  ? <ChevronUp className="ml-1 h-4 w-4" /> 
                  : <ChevronDown className="ml-1 h-4 w-4" />
              )}
            </div>
            <div className="col-span-2 text-right">Actions</div>
          </div>
          
          {filteredPosts.map((post) => (
            <div key={post.id} className="grid grid-cols-12 gap-4 p-4 border-b items-center hover:bg-accent/10">
              <div className="col-span-5 font-medium truncate">{post.title}</div>
              <div className="col-span-2">
                <Badge variant={post.status === 'PUBLISHED' ? 'default' : 'secondary'}>
                  {post.status}
                </Badge>
              </div>
              <div className="col-span-3 text-sm text-muted-foreground">
                {post.publishedAt 
                  ? format(new Date(post.publishedAt), 'MMM d, yyyy')
                  : '-'}
              </div>
              <div className="col-span-2 flex justify-end gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleViewPost(post.id)}
                  title="View Post"
                >
                  <Eye className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleEditPost(post.id)}
                  title="Edit Post"
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDeletePost(post.id)}
                  title="Delete Post"
                  className="text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 