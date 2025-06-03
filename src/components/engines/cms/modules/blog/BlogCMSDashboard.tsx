'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { gqlRequest } from '@/lib/graphql-client';
import { 
  Plus, 
  Search, 
  Grid3X3, 
  List, 
  BarChart3, 
  BookOpen, 
  TrendingUp,
  Eye,
  Edit,
  Trash2,
  MoreHorizontal,
  Clock,
  User,
  CheckCircle,
  XCircle,
  FileText
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';

interface Blog {
  id: string;
  title: string;
  description?: string;
  slug: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  posts?: Post[];
}

interface Post {
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
  featuredImageId?: string;
  featuredImageMedia?: {
    id: string;
    fileUrl: string;
    altText?: string;
    title?: string;
  };
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  publishedAt?: string;
  createdAt?: string;
  readTime?: number;
  tags?: string[];
  categories?: string[];
  author?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  blog?: {
    id: string;
    title: string;
    slug: string;
  };
}

interface BlogCMSDashboardProps {
  locale?: string;
}

export function BlogCMSDashboard({ locale = 'en' }: BlogCMSDashboardProps) {
  const router = useRouter();
  
  // State management
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBlog, setSelectedBlog] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; type: 'blog' | 'post'; id: string; title: string }>({
    open: false,
    type: 'blog',
    id: '',
    title: ''
  });

  // Load data on mount
  useEffect(() => {
    loadDashboardData();
  }, []);

  async function loadDashboardData() {
    try {
      setLoading(true);
      
      const [blogsResponse, postsResponse] = await Promise.all([
        gqlRequest<{ blogs: Blog[] }>(`
          query GetBlogs {
            blogs {
              id
              title
              description
              slug
              isActive
              createdAt
              updatedAt
            }
          }
        `),
        gqlRequest<{ posts: Post[] }>(`
          query GetPosts {
            posts(filter: { limit: 50 }) {
              id
              title
              slug
              excerpt
              featuredImageId
              featuredImageMedia {
                id
                fileUrl
                altText
                title
              }
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
              blog {
                id
                title
                slug
              }
            }
          }
        `)
      ]);

      setBlogs(blogsResponse.blogs || []);
      setPosts(postsResponse.posts || []);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }

  // Calculate dashboard statistics
  const stats = {
    totalBlogs: blogs.length,
    activeBlogs: blogs.filter(b => b.isActive).length,
    totalPosts: posts.length,
    publishedPosts: posts.filter(p => p.status === 'PUBLISHED').length,
    draftPosts: posts.filter(p => p.status === 'DRAFT').length,
    recentPosts: posts.filter(p => {
      const publishedDate = new Date(p.publishedAt || p.createdAt || '');
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return publishedDate > weekAgo;
    }).length
  };

  // Filter posts based on search and filters
  const filteredPosts = posts.filter(post => {
    const matchesSearch = !searchQuery || 
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.excerpt?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesBlog = selectedBlog === 'all' || post.blog?.id === selectedBlog;
    const matchesStatus = selectedStatus === 'all' || post.status === selectedStatus;

    return matchesSearch && matchesBlog && matchesStatus;
  });

  // Handle delete operations
  const handleDelete = async () => {
    try {
      if (deleteDialog.type === 'blog') {
        await gqlRequest(`
          mutation DeleteBlog($id: ID!) {
            deleteBlog(id: $id) {
              success
              message
            }
          }
        `, { id: deleteDialog.id });
        
        setBlogs(blogs.filter(b => b.id !== deleteDialog.id));
        toast.success('Blog deleted successfully');
      } else {
        await gqlRequest(`
          mutation DeletePost($id: ID!) {
            deletePost(id: $id) {
              success
              message
            }
          }
        `, { id: deleteDialog.id });
        
        setPosts(posts.filter(p => p.id !== deleteDialog.id));
        toast.success('Post deleted successfully');
      }
    } catch (error) {
      console.error('Error deleting:', error);
      toast.error('Failed to delete item');
    } finally {
      setDeleteDialog({ open: false, type: 'blog', id: '', title: '' });
    }
  };

  // Format date helper
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(locale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Get author name helper
  const getAuthorName = (author?: Post['author']) => {
    if (!author) return 'Unknown';
    return `${author.firstName} ${author.lastName}`.trim() || author.email;
  };

  // Status badge component
  const StatusBadge = ({ status }: { status: string }) => {
    const variants = {
      PUBLISHED: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      DRAFT: { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      ARCHIVED: { color: 'bg-gray-100 text-gray-800', icon: XCircle }
    };
    
    const variant = variants[status as keyof typeof variants] || variants.DRAFT;
    const Icon = variant.icon;
    
    return (
      <Badge className={`${variant.color} flex items-center gap-1`}>
        <Icon className="h-3 w-3" />
        {status}
      </Badge>
    );
  };

  // Post card component
  const PostCard = ({ post }: { post: Post }) => (
    <Card className="group hover:shadow-lg transition-all duration-200 cursor-pointer">
      {post.featuredImageMedia && (
        <div className="aspect-video overflow-hidden rounded-t-lg">
          <img
            src={post.featuredImageMedia.fileUrl}
            alt={post.featuredImageMedia.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
          />
        </div>
      )}
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between mb-2">
          <StatusBadge status={post.status} />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => router.push(`/${locale}/cms/blog/posts/edit/${post.id}`)}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push(`/${locale}/blog/post/${post.slug}`)}>
                <Eye className="h-4 w-4 mr-2" />
                View
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => setDeleteDialog({ open: true, type: 'post', id: post.id, title: post.title })}
                className="text-red-600"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <CardTitle className="line-clamp-2 text-lg">{post.title}</CardTitle>
      </CardHeader>
      <CardContent>
        {post.excerpt && (
          <CardDescription className="line-clamp-3 mb-4">
            {post.excerpt}
          </CardDescription>
        )}
        
        <div className="flex items-center justify-between text-sm text-muted-foreground mb-3">
          <div className="flex items-center gap-1">
            <User className="h-3 w-3" />
            <span>{getAuthorName(post.author)}</span>
          </div>
          {post.readTime && (
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>{post.readTime} min</span>
            </div>
          )}
        </div>

        {post.publishedAt && (
          <div className="text-xs text-muted-foreground mb-3">
            Published {formatDate(post.publishedAt)}
          </div>
        )}

        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {post.tags.slice(0, 3).map(tag => (
              <Badge key={tag} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
            {post.tags.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{post.tags.length - 3}
              </Badge>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );

  // Blog card component
  const BlogCard = ({ blog }: { blog: Blog }) => {
    const postCount = blog.posts?.length || 0;
    const publishedCount = blog.posts?.filter(p => p.status === 'PUBLISHED').length || 0;
    
    return (
      <Card className="group hover:shadow-lg transition-all duration-200">
        <CardHeader>
          <div className="flex items-center justify-between mb-2">
            <Badge className={blog.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
              {blog.isActive ? 'Active' : 'Inactive'}
            </Badge>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => router.push(`/${locale}/cms/blog/edit/${blog.id}`)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push(`/${locale}/cms/blog/posts?blog=${blog.id}`)}>
                  <BookOpen className="h-4 w-4 mr-2" />
                  View Posts
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => setDeleteDialog({ open: true, type: 'blog', id: blog.id, title: blog.title })}
                  className="text-red-600"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <CardTitle className="text-xl">{blog.title}</CardTitle>
          {blog.description && (
            <CardDescription className="line-clamp-2">
              {blog.description}
            </CardDescription>
          )}
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between text-sm text-muted-foreground mb-3">
            <div className="flex items-center gap-1">
              <BookOpen className="h-4 w-4" />
              <span>{postCount} posts</span>
            </div>
            <div className="flex items-center gap-1">
              <CheckCircle className="h-4 w-4" />
              <span>{publishedCount} published</span>
            </div>
          </div>
          
          <div className="text-xs text-muted-foreground">
            Updated {formatDate(blog.updatedAt)}
          </div>
          
          <div className="mt-4 pt-4 border-t">
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full"
              onClick={() => router.push(`/${locale}/cms/blog/posts/new?blog=${blog.id}`)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Post
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Blog CMS</h1>
          <p className="text-muted-foreground text-lg">Manage your blogs and content</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => router.push(`/${locale}/cms/blog/analytics`)}>
            <BarChart3 className="h-4 w-4 mr-2" />
            Analytics
          </Button>
          <Button onClick={() => router.push(`/${locale}/cms/blog/new`)}>
            <Plus className="h-4 w-4 mr-2" />
            New Blog
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Blogs</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalBlogs}</div>
            <p className="text-xs text-muted-foreground">
              {stats.activeBlogs} active
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Posts</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalPosts}</div>
            <p className="text-xs text-muted-foreground">
              {stats.publishedPosts} published
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Draft Posts</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.draftPosts}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting publication
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recent Posts</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.recentPosts}</div>
            <p className="text-xs text-muted-foreground">
              Published this week
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="blogs">Blogs</TabsTrigger>
          <TabsTrigger value="posts">Posts</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest posts and blog updates</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {posts.slice(0, 5).map(post => (
                  <div key={post.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center">
                        <FileText className="h-6 w-6" />
                      </div>
                      <div>
                        <h4 className="font-medium">{post.title}</h4>
                        <p className="text-sm text-muted-foreground">
                          {post.blog?.title} • {getAuthorName(post.author)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={post.status} />
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="blogs" className="space-y-6">
          {/* Blogs Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {blogs.map(blog => (
              <BlogCard key={blog.id} blog={blog} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="posts" className="space-y-6">
          {/* Posts Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search posts..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                
                <Select value={selectedBlog} onValueChange={setSelectedBlog}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Filter by blog" />
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
                
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="PUBLISHED">Published</SelectItem>
                    <SelectItem value="DRAFT">Draft</SelectItem>
                    <SelectItem value="ARCHIVED">Archived</SelectItem>
                  </SelectContent>
                </Select>
                
                <div className="flex items-center gap-2">
                  <Button
                    variant={viewMode === 'grid' ? 'default' : 'outline'}
                    size="icon"
                    onClick={() => setViewMode('grid')}
                  >
                    <Grid3X3 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'outline'}
                    size="icon"
                    onClick={() => setViewMode('list')}
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </div>
                
                <Button onClick={() => router.push(`/${locale}/cms/blog/posts/new`)}>
                  <Plus className="h-4 w-4 mr-2" />
                  New Post
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Posts Display */}
          {filteredPosts.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No posts found</h3>
                <p className="text-muted-foreground mb-4">
                  {searchQuery || selectedBlog !== 'all' || selectedStatus !== 'all'
                    ? 'Try adjusting your filters to see more posts.'
                    : 'Get started by creating your first blog post.'}
                </p>
                <Button onClick={() => router.push(`/${locale}/cms/blog/posts/new`)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Post
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className={viewMode === 'grid' 
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' 
              : 'space-y-4'
            }>
              {filteredPosts.map(post => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog(prev => ({ ...prev, open }))}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{deleteDialog.title}&quot;? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialog(prev => ({ ...prev, open: false }))}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 