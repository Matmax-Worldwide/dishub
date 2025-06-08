'use client';

import React, { useState, useCallback, useEffect } from 'react';
import StableInput from './StableInput';
import { 
  Search, 
  ChevronLeft, 
  ChevronRight, 
  Eye,
  TrendingUp,
  BarChart3,
  RefreshCw,
  BookOpen
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { gqlRequest } from '@/lib/graphql-client';
import { toast } from 'sonner';

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
  views?: number;
  engagement?: number;
}

interface Blog {
  id: string;
  title: string;
  description?: string;
  slug: string;
  isActive: boolean;
  stats?: {
    totalPosts: number;
    publishedPosts: number;
    totalViews: number;
    avgEngagement: number;
  };
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
  readTime?: number;
  tags?: string[];
  categories?: string[];
  author?: {
    id: string;
    firstName: string;
    lastName: string;
    profileImageUrl?: string;
  };
}

interface BlogWithPosts {
  id: string;
  title: string;
  description?: string;
  slug: string;
  isActive: boolean;
  posts?: Array<{
    id: string;
    status: string;
  }>;
}

interface BlogSectionEnhancedProps {
  title?: string;
  subtitle?: string;
  blogId?: string;
  layout?: 'grid' | 'list' | 'carousel' | 'masonry';
  filtersEnabled?: boolean;
  searchEnabled?: boolean;
  postsPerPage?: number;
  showFeaturedImage?: boolean;
  showAuthor?: boolean;
  showDate?: boolean;
  showTags?: boolean;
  showExcerpt?: boolean;
  showStats?: boolean;
  showAnalytics?: boolean;
  autoRefresh?: boolean;
  refreshInterval?: number;
  isEditing?: boolean;
  onUpdate?: (data: Partial<BlogSectionEnhancedProps>) => void;
}

export default function BlogSectionEnhanced({
  title = 'Blog',
  subtitle = 'Latest articles and insights',
  blogId,
  layout = 'grid',
  filtersEnabled = true,
  searchEnabled = true,
  postsPerPage = 9,
  showFeaturedImage = true,
  showAuthor = true,
  showDate = true,
  showTags = true,
  showExcerpt = true,
  showStats = false,
  showAnalytics = false,
  autoRefresh = false,
  refreshInterval = 30000,
  isEditing = false,
  onUpdate
}: BlogSectionEnhancedProps) {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'popular' | 'trending'>('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const [currentCarouselIndex, setCurrentCarouselIndex] = useState(0);
  const [viewMode, setViewMode] = useState<'preview' | 'analytics'>('preview');

  // Auto-refresh functionality
  useEffect(() => {
    if (autoRefresh && !isEditing) {
      const interval = setInterval(() => {
        fetchPosts(true);
      }, refreshInterval);
      
      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshInterval, isEditing, blogId]);

  // Fetch available blogs for selection (only in editing mode)
  useEffect(() => {
    if (isEditing) {
      fetchBlogs();
    }
  }, [isEditing]);

  // Fetch posts when blogId changes
  useEffect(() => {
    if (blogId) {
      fetchPosts();
    } else {
      setPosts([]);
      setLoading(false);
    }
  }, [blogId]);

  async function fetchBlogs() {
    try {
      const query = `
        query GetBlogsWithStats {
          blogs {
            id
            title
            description
            slug
            isActive
            posts {
              id
              status
            }
          }
        }
      `;
      
      const response = await gqlRequest<{ blogs: BlogWithPosts[] }>(query);
      const blogsWithStats = response.blogs.map(blog => ({
        ...blog,
        stats: {
          totalPosts: blog.posts?.length || 0,
          publishedPosts: blog.posts?.filter((p) => p.status === 'PUBLISHED').length || 0,
          totalViews: Math.floor(Math.random() * 10000), // Mock data
          avgEngagement: Math.floor(Math.random() * 100) // Mock data
        }
      }));
      
      setBlogs(blogsWithStats);
    } catch (error) {
      console.error('Error fetching blogs:', error);
    }
  }

  async function fetchPosts(silent = false) {
    if (!silent) setLoading(true);
    if (silent) setRefreshing(true);
    
    try {
      const query = `
        query GetBlogPosts($filter: PostFilter) {
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
      
      const filter = {
        blogId: blogId,
        status: 'PUBLISHED'
      };
      
      const response = await gqlRequest<{ posts: PostResponse[] }>(query, { filter });
      
      // Transform posts to match BlogSectionEnhanced interface
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
        category: post.categories?.[0],
        views: Math.floor(Math.random() * 1000), // Mock data
        engagement: Math.floor(Math.random() * 100) // Mock data
      }));

      setPosts(transformedPosts);
      
      if (silent) {
        toast.success('Posts refreshed');
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
      setPosts([]);
      if (!silent) {
        toast.error('Failed to load posts');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  // Extract unique categories and tags
  const categories = Array.from(new Set(posts.map(p => p.category).filter(Boolean))) as string[];
  const tags = Array.from(new Set(posts.flatMap(p => p.tags || []).filter(Boolean)));

  // Filter posts
  const filteredPosts = posts.filter(post => {
    const matchesSearch = !searchQuery || 
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.excerpt?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesCategory = selectedCategory === 'all' || post.category === selectedCategory;
    const matchesTag = selectedTag === 'all' || post.tags?.includes(selectedTag);

    return matchesSearch && matchesCategory && matchesTag;
  });

  // Sort posts
  const sortedPosts = [...filteredPosts].sort((a, b) => {
    switch (sortBy) {
      case 'newest':
        return new Date(b.publishedAt || '').getTime() - new Date(a.publishedAt || '').getTime();
      case 'oldest':
        return new Date(a.publishedAt || '').getTime() - new Date(b.publishedAt || '').getTime();
      case 'popular':
        return (b.views || 0) - (a.views || 0);
      case 'trending':
        return (b.engagement || 0) - (a.engagement || 0);
      default:
        return 0;
    }
  });

  // Paginate posts
  const totalPages = Math.ceil(sortedPosts.length / postsPerPage);
  const paginatedPosts = sortedPosts.slice(
    (currentPage - 1) * postsPerPage,
    currentPage * postsPerPage
  );

  // Format date
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Handle updates
  const handleUpdateField = useCallback((field: string, value: unknown) => {
    if (onUpdate) {
      onUpdate({ [field]: value });
    }
  }, [onUpdate]);

  // Carousel navigation
  const handleCarouselNext = () => {
    setCurrentCarouselIndex((prev) => 
      prev + 3 >= sortedPosts.length ? 0 : prev + 3
    );
  };

  const handleCarouselPrev = () => {
    setCurrentCarouselIndex((prev) => 
      prev - 3 < 0 ? Math.max(0, sortedPosts.length - 3) : prev - 3
    );
  };

  // Enhanced Post Card Component
  const PostCard = ({ post }: { post: BlogPost }) => (
    <Card className="h-full hover:shadow-lg transition-all duration-200 cursor-pointer group">
      {showFeaturedImage && post.featuredImage && (
        <div className="w-full h-48 overflow-hidden rounded-t-lg relative">
          <img
            src={post.featuredImage}
            alt={post.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
          />
          {showStats && (
            <div className="absolute top-2 right-2 bg-black/70 text-white px-2 py-1 rounded text-xs">
              {post.views} views
            </div>
          )}
        </div>
      )}
      <CardHeader>
        <div className="flex items-center justify-between mb-2">
          {post.category && (
            <Badge variant="secondary" className="text-xs">
              {post.category}
            </Badge>
          )}
          {showDate && post.publishedAt && (
            <span className="text-xs text-muted-foreground">
              {formatDate(post.publishedAt)}
            </span>
          )}
        </div>
        <CardTitle className="line-clamp-2">{post.title}</CardTitle>
      </CardHeader>
      <CardContent>
        {showExcerpt && post.excerpt && (
          <CardDescription className="line-clamp-3 mb-4">
            {post.excerpt}
          </CardDescription>
        )}
        
        {showStats && (
          <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
            <div className="flex items-center gap-1">
              <Eye className="h-3 w-3" />
              <span>{post.views}</span>
            </div>
            <div className="flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              <span>{post.engagement}%</span>
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter className="pt-0">
        <div className="w-full space-y-3">
          {showAuthor && post.author && (
            <div className="flex items-center gap-2">
              {post.author.image && (
                <img
                  src={post.author.image}
                  alt={post.author.name}
                  className="w-6 h-6 rounded-full"
                />
              )}
              <span className="text-sm text-muted-foreground">{post.author.name}</span>
              {post.readTime && (
                <>
                  <span className="text-muted-foreground">•</span>
                  <span className="text-sm text-muted-foreground">{post.readTime}</span>
                </>
              )}
            </div>
          )}
          {showTags && post.tags && post.tags.length > 0 && (
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
        </div>
      </CardFooter>
    </Card>
  );

  // Analytics View Component
  const AnalyticsView = () => {
    const selectedBlog = blogs.find(b => b.id === blogId);
    
    return (
      <div className="space-y-6">
        {selectedBlog && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Blog Performance
              </CardTitle>
              <CardDescription>{selectedBlog.title}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold">{selectedBlog.stats?.totalPosts || 0}</div>
                  <div className="text-sm text-muted-foreground">Total Posts</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold">{selectedBlog.stats?.publishedPosts || 0}</div>
                  <div className="text-sm text-muted-foreground">Published</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold">{selectedBlog.stats?.totalViews || 0}</div>
                  <div className="text-sm text-muted-foreground">Total Views</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold">{selectedBlog.stats?.avgEngagement || 0}%</div>
                  <div className="text-sm text-muted-foreground">Engagement</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
        
        <Card>
          <CardHeader>
            <CardTitle>Top Performing Posts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {sortedPosts.slice(0, 5).map((post, index) => (
                <div key={post.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded bg-primary/10 flex items-center justify-center text-xs font-medium">
                      {index + 1}
                    </div>
                    <div>
                      <h4 className="font-medium text-sm line-clamp-1">{post.title}</h4>
                      <p className="text-xs text-muted-foreground">
                        {post.publishedAt && formatDate(post.publishedAt)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium">{post.views} views</div>
                    <div className="text-xs text-muted-foreground">{post.engagement}% engagement</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  if (isEditing) {
    return (
      <div className="w-full bg-white/95 backdrop-blur-sm border border-gray-200/60 rounded-xl shadow-lg shadow-gray-900/5 ring-1 ring-gray-900/5">
        <Tabs defaultValue="content" className="w-full">
          <TabsList className="grid w-full grid-cols-3  to-gray-100/80 p-2 rounded-xl border border-gray-200/50 shadow-inner">
            <TabsTrigger 
              value="content"
              className="data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:shadow-gray-900/10 data-[state=active]:ring-1 data-[state=active]:ring-gray-900/5 rounded-lg py-3 px-6 text-sm font-semibold transition-all duration-200 hover:bg-white/60 active:scale-[0.98]"
            >
              Details
            </TabsTrigger>
            <TabsTrigger 
              value="display"
              className="data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:shadow-gray-900/10 data-[state=active]:ring-1 data-[state=active]:ring-gray-900/5 rounded-lg py-3 px-6 text-sm font-semibold transition-all duration-200 hover:bg-white/60 active:scale-[0.98]"
            >
              Display
            </TabsTrigger>
            <TabsTrigger 
              value="advanced"
              className="data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:shadow-gray-900/10 data-[state=active]:ring-1 data-[state=active]:ring-gray-900/5 rounded-lg py-3 px-6 text-sm font-semibold transition-all duration-200 hover:bg-white/60 active:scale-[0.98]"
            >
              Advanced
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="content" className="p-8 space-y-8 max-h-[650px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-1 h-6 bg-gradient-to-b from-blue-500 to-blue-600 rounded-full"></div>
                <h3 className="text-lg font-semibold text-gray-900">Content Configuration</h3>
              </div>
              <div className="pl-6 space-y-4">
                <StableInput
                  value={title}
                  onChange={(value) => handleUpdateField('title', value)}
                  placeholder="Blog section title..."
                  label="Section Title"
                  className="text-2xl font-bold"
                />
                
                <StableInput
                  value={subtitle}
                  onChange={(value) => handleUpdateField('subtitle', value)}
                  placeholder="Section subtitle..."
                  label="Subtitle"
                />
                
                {/* Blog Selection */}
                <div>
                  <Label className="text-sm font-medium mb-2 block">Select Blog</Label>
                  <Select value={blogId || 'none'} onValueChange={(value) => handleUpdateField('blogId', value === 'none' ? '' : value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a blog to display posts from..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No blog selected</SelectItem>
                      {blogs.map(blog => (
                        <SelectItem key={blog.id} value={blog.id}>
                          <div className="flex items-center justify-between w-full">
                            <span>{blog.title}</span>
                            {!blog.isActive && <Badge variant="outline" className="ml-2">Inactive</Badge>}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {blogId && (
                    <div className="mt-2 p-3 bg-muted rounded-lg">
                      <p className="text-xs text-muted-foreground mb-2">Blog Statistics:</p>
                      {blogs.find(b => b.id === blogId)?.stats && (
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>Posts: {blogs.find(b => b.id === blogId)?.stats?.totalPosts}</div>
                          <div>Published: {blogs.find(b => b.id === blogId)?.stats?.publishedPosts}</div>
                          <div>Views: {blogs.find(b => b.id === blogId)?.stats?.totalViews}</div>
                          <div>Engagement: {blogs.find(b => b.id === blogId)?.stats?.avgEngagement}%</div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="display" className="p-8 space-y-8 max-h-[650px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-1 h-6 bg-gradient-to-b from-green-500 to-green-600 rounded-full"></div>
                <h3 className="text-lg font-semibold text-gray-900">Display Settings</h3>
              </div>
              <div className="pl-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Layout</Label>
                    <Select value={layout} onValueChange={(value) => handleUpdateField('layout', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="grid">Grid</SelectItem>
                        <SelectItem value="list">List</SelectItem>
                        <SelectItem value="carousel">Carousel</SelectItem>
                        <SelectItem value="masonry">Masonry</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium">Posts Per Page</Label>
                    <Input
                      type="number"
                      value={postsPerPage}
                      onChange={(e) => handleUpdateField('postsPerPage', parseInt(e.target.value))}
                      min={1}
                      max={50}
                    />
                  </div>
                </div>
                
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Display Options</Label>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={searchEnabled}
                        onCheckedChange={(checked) => handleUpdateField('searchEnabled', checked)}
                      />
                      <Label className="text-sm">Enable Search</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={filtersEnabled}
                        onCheckedChange={(checked) => handleUpdateField('filtersEnabled', checked)}
                      />
                      <Label className="text-sm">Enable Filters</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={showFeaturedImage}
                        onCheckedChange={(checked) => handleUpdateField('showFeaturedImage', checked)}
                      />
                      <Label className="text-sm">Show Featured Images</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={showAuthor}
                        onCheckedChange={(checked) => handleUpdateField('showAuthor', checked)}
                      />
                      <Label className="text-sm">Show Author</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={showDate}
                        onCheckedChange={(checked) => handleUpdateField('showDate', checked)}
                      />
                      <Label className="text-sm">Show Date</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={showTags}
                        onCheckedChange={(checked) => handleUpdateField('showTags', checked)}
                      />
                      <Label className="text-sm">Show Tags</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={showExcerpt}
                        onCheckedChange={(checked) => handleUpdateField('showExcerpt', checked)}
                      />
                      <Label className="text-sm">Show Excerpt</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={showStats}
                        onCheckedChange={(checked) => handleUpdateField('showStats', checked)}
                      />
                      <Label className="text-sm">Show Statistics</Label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="advanced" className="p-8 space-y-8 max-h-[650px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-1 h-6 bg-gradient-to-b from-purple-500 to-purple-600 rounded-full"></div>
                <h3 className="text-lg font-semibold text-gray-900">Advanced Features</h3>
              </div>
              <div className="pl-6 space-y-3">
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={showAnalytics}
                      onCheckedChange={(checked) => handleUpdateField('showAnalytics', checked)}
                    />
                    <Label className="text-sm">Show Analytics View</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={autoRefresh}
                      onCheckedChange={(checked) => handleUpdateField('autoRefresh', checked)}
                    />
                    <Label className="text-sm">Auto Refresh Content</Label>
                  </div>
                  
                  {autoRefresh && (
                    <div>
                      <Label className="text-sm font-medium">Refresh Interval (seconds)</Label>
                      <Input
                        type="number"
                        value={refreshInterval / 1000}
                        onChange={(e) => handleUpdateField('refreshInterval', parseInt(e.target.value) * 1000)}
                        min={10}
                        max={300}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
        
        {/* Preview */}
        <div className="p-4 bg-muted rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium">Preview:</p>
            {blogId && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchPosts()}
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            )}
          </div>
          {!blogId ? (
            <p className="text-sm text-muted-foreground">
              Select a blog to see a preview of the posts that will be displayed.
            </p>
          ) : loading ? (
            <p className="text-sm text-muted-foreground">Loading posts...</p>
          ) : posts.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No published posts found in the selected blog.
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">
              {posts.length} published post{posts.length !== 1 ? 's' : ''} will be displayed from the selected blog.
            </p>
          )}
        </div>
      </div>
    );
  }

  // Show loading state
  if (loading) {
    return (
      <div className="w-full py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            {title && <h2 className="text-4xl font-bold mb-4">{title}</h2>}
            {subtitle && <p className="text-xl text-muted-foreground">{subtitle}</p>}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-64 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Show message if no blog is selected
  if (!blogId) {
    return (
      <div className="w-full py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            {title && <h2 className="text-4xl font-bold mb-4">{title}</h2>}
            {subtitle && <p className="text-xl text-muted-foreground">{subtitle}</p>}
          </div>
          <div className="text-center py-12">
            <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No blog selected. Please configure this section to select a blog.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full py-16">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          {title && <h2 className="text-4xl font-bold mb-4">{title}</h2>}
          {subtitle && <p className="text-xl text-muted-foreground">{subtitle}</p>}
        </div>

        {/* Analytics/Preview Toggle */}
        {showAnalytics && (
          <div className="flex justify-center mb-8">
            <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as 'preview' | 'analytics')}>
              <TabsList>
                <TabsTrigger value="preview">Preview</TabsTrigger>
                <TabsTrigger value="analytics">Analytics</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        )}

        {viewMode === 'analytics' ? (
          <AnalyticsView />
        ) : (
          <>
            {/* Search and Filters */}
            {(searchEnabled || filtersEnabled) && (
              <div className="mb-8 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {searchEnabled && (
                      <div className="relative max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Search posts..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                    )}
                    
                    {autoRefresh && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => fetchPosts(true)}
                        disabled={refreshing}
                      >
                        <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                        Refresh
                      </Button>
                    )}
                  </div>
                  
                  {layout === 'grid' && (
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setViewMode(viewMode === 'preview' ? 'analytics' : 'preview')}
                      >
                        <BarChart3 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
                
                {filtersEnabled && (
                  <div className="flex flex-wrap justify-center gap-4">
                    {categories.length > 0 && (
                      <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                        <SelectTrigger className="w-[180px]">
                          <SelectValue placeholder="Category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Categories</SelectItem>
                          {categories.map(cat => (
                            <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                    
                    {tags.length > 0 && (
                      <Select value={selectedTag} onValueChange={setSelectedTag}>
                        <SelectTrigger className="w-[180px]">
                          <SelectValue placeholder="Tag" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Tags</SelectItem>
                          {tags.map(tag => (
                            <SelectItem key={tag} value={tag}>{tag}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                    
                    <Select value={sortBy} onValueChange={(value) => setSortBy(value as 'newest' | 'oldest' | 'popular' | 'trending')}>
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Sort by" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="newest">Newest First</SelectItem>
                        <SelectItem value="oldest">Oldest First</SelectItem>
                        <SelectItem value="popular">Most Popular</SelectItem>
                        <SelectItem value="trending">Trending</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            )}

            {/* Posts Display */}
            {sortedPosts.length === 0 ? (
              <div className="text-center py-12">
                <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No posts found matching your criteria.</p>
              </div>
            ) : (
              <>
                {layout === 'grid' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {paginatedPosts.map(post => (
                      <PostCard key={post.id} post={post} />
                    ))}
                  </div>
                )}
                
                {layout === 'masonry' && (
                  <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6">
                    {paginatedPosts.map(post => (
                      <div key={post.id} className="break-inside-avoid">
                        <PostCard post={post} />
                      </div>
                    ))}
                  </div>
                )}
                
                {layout === 'carousel' && (
                  <div className="relative">
                    <div className="flex gap-6 overflow-hidden">
                      {sortedPosts.slice(currentCarouselIndex, currentCarouselIndex + 3).map(post => (
                        <div key={post.id} className="flex-1 min-w-0">
                          <PostCard post={post} />
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-center gap-2 mt-6">
                      <Button
                        size="icon"
                        variant="outline"
                        onClick={handleCarouselPrev}
                        disabled={currentCarouselIndex === 0}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="outline"
                        onClick={handleCarouselNext}
                        disabled={currentCarouselIndex + 3 >= sortedPosts.length}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
                
                {/* Pagination */}
                {layout !== 'carousel' && totalPages > 1 && (
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
                            size="icon"
                            onClick={() => setCurrentPage(page)}
                          >
                            {page}
                          </Button>
                        );
                      })}
                      {totalPages > 5 && (
                        <>
                          <span className="text-muted-foreground">...</span>
                          <Button
                            variant={totalPages === currentPage ? 'default' : 'outline'}
                            size="icon"
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
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
} 