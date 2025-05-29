'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import graphqlClient from '@/lib/graphql-client';
import { Post } from '@/types/blog';
import { Plus, Search, Grid3X3, List, Edit2, Trash2, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

// Simple date formatter
const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

export default function PostsPage() {
  const router = useRouter();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [statusFilter, setStatusFilter] = useState<'all' | 'DRAFT' | 'PUBLISHED'>('all');
  const [blogs, setBlogs] = useState<Array<{ id: string; title: string }>>([]);
  const [selectedBlogId, setSelectedBlogId] = useState<string>('all');

  useEffect(() => {
    loadData();
  }, [statusFilter, selectedBlogId]);

  async function loadData() {
    setLoading(true);
    try {
      // Load blogs for filter
      const [blogsList, postsList] = await Promise.all([
        graphqlClient.getBlogs(),
        graphqlClient.getPosts({
          ...(selectedBlogId !== 'all' && { blogId: selectedBlogId }),
          ...(statusFilter !== 'all' && { status: statusFilter }),
        })
      ]);
      
      setBlogs(blogsList);
      setPosts(postsList);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load posts');
    } finally {
      setLoading(false);
    }
  }

  const handleDelete = async (postId: string) => {
    const post = posts.find(p => p.id === postId);
    if (!post) return;

    if (!window.confirm(`Are you sure you want to delete "${post.title}"?`)) {
      return;
    }

    try {
      const result = await graphqlClient.deletePost(postId);
      if (result.success) {
        toast.success('Post deleted successfully');
        setPosts(posts.filter(p => p.id !== postId));
      } else {
        toast.error(result.message || 'Failed to delete post');
      }
    } catch (error) {
      console.error('Error deleting post:', error);
      toast.error('An error occurred while deleting the post');
    }
  };

  const filteredPosts = posts.filter(post => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        post.title.toLowerCase().includes(query) ||
        post.excerpt?.toLowerCase().includes(query) ||
        post.tags?.some(tag => tag.toLowerCase().includes(query)) ||
        post.categories?.some(cat => cat.toLowerCase().includes(query))
      );
    }
    return true;
  });

  const PostCard = ({ post }: { post: Post }) => (
    <Card className="hover:shadow-lg transition-shadow">
      {post.featuredImage && (
        <div className="w-full h-48 overflow-hidden rounded-t-lg">
          <img
            src={post.featuredImage}
            alt={post.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="line-clamp-2">{post.title}</CardTitle>
            <CardDescription className="mt-1">
              {post.author && `By ${post.author.firstName} ${post.author.lastName}`}
              {post.publishedAt && ` • ${formatDate(post.publishedAt)}`}
            </CardDescription>
          </div>
          <Badge variant={post.status === 'PUBLISHED' ? 'default' : 'secondary'}>
            {post.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {post.excerpt && (
          <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
            {post.excerpt}
          </p>
        )}
        
        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-4">
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
        
        <div className="flex justify-end gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => window.open(`/blog/post/${post.slug}`, '_blank')}
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => router.push(`/cms/blog/posts/edit/${post.id}`)}
          >
            <Edit2 className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => handleDelete(post.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const PostListItem = ({ post }: { post: Post }) => (
    <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors">
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <h3 className="font-medium">{post.title}</h3>
          <Badge variant={post.status === 'PUBLISHED' ? 'default' : 'secondary'}>
            {post.status}
          </Badge>
        </div>
        <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
          {post.author && <span>By {post.author.firstName} {post.author.lastName}</span>}
          {post.publishedAt && <span>{formatDate(post.publishedAt)}</span>}
          {post.blog && <span>in {post.blog.title}</span>}
          {post.readTime && <span>{post.readTime} min read</span>}
        </div>
        {post.tags && post.tags.length > 0 && (
          <div className="flex gap-1 mt-2">
            {post.tags.map(tag => (
              <Badge key={tag} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </div>
      
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant="ghost"
          onClick={() => window.open(`/blog/post/${post.slug}`, '_blank')}
        >
          <Eye className="h-4 w-4" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => router.push(`/cms/blog/posts/edit/${post.id}`)}
        >
          <Edit2 className="h-4 w-4" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => handleDelete(post.id)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );

  return (
    <div className="container mx-auto py-8 px-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Blog Posts</h1>
          <p className="text-muted-foreground">Manage your blog articles</p>
        </div>
        <Button onClick={() => router.push('/cms/blog/posts/new')}>
          <Plus className="h-4 w-4 mr-2" />
          Create Post
        </Button>
      </div>

      {/* Filters and Search */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search posts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={selectedBlogId} onValueChange={setSelectedBlogId}>
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
            
            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as 'all' | 'DRAFT' | 'PUBLISHED')}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="DRAFT">Draft</SelectItem>
                <SelectItem value="PUBLISHED">Published</SelectItem>
              </SelectContent>
            </Select>
            
            <div className="flex gap-2">
              <Button
                size="icon"
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                onClick={() => setViewMode('grid')}
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
              <Button
                size="icon"
                variant={viewMode === 'list' ? 'default' : 'outline'}
                onClick={() => setViewMode('list')}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Posts */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredPosts.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground mb-4">
              {searchQuery ? 'No posts found matching your search.' : 'No posts yet.'}
            </p>
            <Button onClick={() => router.push('/cms/blog/posts/new')}>
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Post
            </Button>
          </CardContent>
        </Card>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPosts.map(post => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {filteredPosts.map(post => (
            <PostListItem key={post.id} post={post} />
          ))}
        </div>
      )}
    </div>
  );
} 