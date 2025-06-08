'use client';

import React, { useState, useEffect } from 'react';
import { gqlRequest } from '@/lib/graphql-client';
import { 
  TrendingUp, 
  TrendingDown,
  Eye, 
  Users, 
  Clock, 
  Heart,
  Share2,
  MessageCircle,
  Download,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
  Target,
  Zap
} from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import { Progress } from '@/app/components/ui/progress';
import { toast } from 'sonner';

interface AnalyticsData {
  overview: {
    totalViews: number;
    uniqueVisitors: number;
    avgReadTime: number;
    bounceRate: number;
    totalPosts: number;
    publishedPosts: number;
    draftPosts: number;
    totalComments: number;
  };
  trends: {
    viewsChange: number;
    visitorsChange: number;
    readTimeChange: number;
    bounceRateChange: number;
  };
  topPosts: Array<{
    id: string;
    title: string;
    slug: string;
    views: number;
    readTime: number;
    publishedAt: string;
    blog: {
      title: string;
    };
  }>;
  recentActivity: Array<{
    id: string;
    type: 'view' | 'comment' | 'share';
    postTitle: string;
    timestamp: string;
    metadata?: unknown;
  }>;
  contentPerformance: {
    avgWordsPerPost: number;
    avgReadTime: number;
    mostUsedTags: Array<{ tag: string; count: number }>;
    categoryDistribution: Array<{ category: string; count: number }>;
  };
}

interface BlogAnalyticsDashboardProps {
  locale?: string;
}

export function BlogAnalyticsDashboard({ locale = 'en' }: BlogAnalyticsDashboardProps) {

  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dateRange, setDateRange] = useState('30d');
  const [selectedBlog, setSelectedBlog] = useState('all');
  const [blogs, setBlogs] = useState<Array<{ id: string; title: string }>>([]);

  useEffect(() => {
    loadAnalyticsData();
    loadBlogs();
  }, [dateRange, selectedBlog]);

  async function loadBlogs() {
    try {
      const response = await gqlRequest<{ blogs: Array<{ id: string; title: string }> }>(`
        query GetBlogs {
          blogs {
            id
            title
          }
        }
      `);
      setBlogs(response.blogs || []);
    } catch (error) {
      console.error('Error loading blogs:', error);
    }
  }

  async function loadAnalyticsData() {
    setLoading(true);
    try {
      // In a real implementation, this would call your analytics API
      // For now, we'll simulate the data structure
      const mockData: AnalyticsData = {
        overview: {
          totalViews: 12543,
          uniqueVisitors: 8921,
          avgReadTime: 4.2,
          bounceRate: 32.1,
          totalPosts: 45,
          publishedPosts: 38,
          draftPosts: 7,
          totalComments: 234
        },
        trends: {
          viewsChange: 12.5,
          visitorsChange: 8.3,
          readTimeChange: -2.1,
          bounceRateChange: -5.4
        },
        topPosts: [
          {
            id: '1',
            title: 'Getting Started with Modern Web Development',
            slug: 'getting-started-modern-web-dev',
            views: 1234,
            readTime: 8,
            publishedAt: '2024-01-15',
            blog: { title: 'Tech Blog' }
          },
          {
            id: '2',
            title: 'Advanced React Patterns and Best Practices',
            slug: 'advanced-react-patterns',
            views: 987,
            readTime: 12,
            publishedAt: '2024-01-10',
            blog: { title: 'Tech Blog' }
          },
          {
            id: '3',
            title: 'Building Scalable APIs with Node.js',
            slug: 'scalable-apis-nodejs',
            views: 756,
            readTime: 10,
            publishedAt: '2024-01-08',
            blog: { title: 'Tech Blog' }
          }
        ],
        recentActivity: [
          {
            id: '1',
            type: 'view',
            postTitle: 'Getting Started with Modern Web Development',
            timestamp: '2024-01-20T10:30:00Z'
          },
          {
            id: '2',
            type: 'comment',
            postTitle: 'Advanced React Patterns and Best Practices',
            timestamp: '2024-01-20T09:15:00Z'
          },
          {
            id: '3',
            type: 'share',
            postTitle: 'Building Scalable APIs with Node.js',
            timestamp: '2024-01-20T08:45:00Z'
          }
        ],
        contentPerformance: {
          avgWordsPerPost: 1250,
          avgReadTime: 6.8,
          mostUsedTags: [
            { tag: 'javascript', count: 15 },
            { tag: 'react', count: 12 },
            { tag: 'nodejs', count: 8 },
            { tag: 'typescript', count: 7 },
            { tag: 'css', count: 5 }
          ],
          categoryDistribution: [
            { category: 'Web Development', count: 18 },
            { category: 'JavaScript', count: 12 },
            { category: 'React', count: 8 },
            { category: 'Node.js', count: 5 }
          ]
        }
      };

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      setAnalyticsData(mockData);
    } catch (error) {
      console.error('Error loading analytics data:', error);
      toast.error('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  }

  async function handleRefresh() {
    setRefreshing(true);
    await loadAnalyticsData();
    setRefreshing(false);
    toast.success('Analytics data refreshed');
  }

  function formatNumber(num: number): string {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  }

  function formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString(locale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  function getTrendIcon(change: number) {
    if (change > 0) {
      return <ArrowUpRight className="h-4 w-4 text-green-600" />;
    } else if (change < 0) {
      return <ArrowDownRight className="h-4 w-4 text-red-600" />;
    }
    return null;
  }

  function getTrendColor(change: number): string {
    if (change > 0) return 'text-green-600';
    if (change < 0) return 'text-red-600';
    return 'text-gray-600';
  }

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

  if (!analyticsData) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">No Analytics Data Available</h2>
          <p className="text-muted-foreground mb-4">
            Unable to load analytics data. Please try again later.
          </p>
          <Button onClick={loadAnalyticsData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Blog Analytics</h1>
          <p className="text-muted-foreground text-lg">
            Insights and performance metrics for your blog content
          </p>
        </div>
        
        <div className="flex items-center gap-3">
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
          
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-[150px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Views</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatNumber(analyticsData.overview.totalViews)}
            </div>
            <div className={`flex items-center text-xs ${getTrendColor(analyticsData.trends.viewsChange)}`}>
              {getTrendIcon(analyticsData.trends.viewsChange)}
              <span className="ml-1">
                {Math.abs(analyticsData.trends.viewsChange)}% from last period
              </span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unique Visitors</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatNumber(analyticsData.overview.uniqueVisitors)}
            </div>
            <div className={`flex items-center text-xs ${getTrendColor(analyticsData.trends.visitorsChange)}`}>
              {getTrendIcon(analyticsData.trends.visitorsChange)}
              <span className="ml-1">
                {Math.abs(analyticsData.trends.visitorsChange)}% from last period
              </span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Read Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analyticsData.overview.avgReadTime}m
            </div>
            <div className={`flex items-center text-xs ${getTrendColor(analyticsData.trends.readTimeChange)}`}>
              {getTrendIcon(analyticsData.trends.readTimeChange)}
              <span className="ml-1">
                {Math.abs(analyticsData.trends.readTimeChange)}% from last period
              </span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bounce Rate</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analyticsData.overview.bounceRate}%
            </div>
            <div className={`flex items-center text-xs ${getTrendColor(-analyticsData.trends.bounceRateChange)}`}>
              {getTrendIcon(-analyticsData.trends.bounceRateChange)}
              <span className="ml-1">
                {Math.abs(analyticsData.trends.bounceRateChange)}% from last period
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="content">Content</TabsTrigger>
          <TabsTrigger value="engagement">Engagement</TabsTrigger>
          <TabsTrigger value="optimization">Optimization</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Performing Posts */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Top Performing Posts
                </CardTitle>
                <CardDescription>
                  Posts with the highest engagement in the selected period
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analyticsData.topPosts.map((post, index) => (
                    <div key={post.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium">
                          {index + 1}
                        </div>
                        <div>
                          <h4 className="font-medium line-clamp-1">{post.title}</h4>
                          <p className="text-sm text-muted-foreground">
                            {post.blog.title} • {formatDate(post.publishedAt)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">{formatNumber(post.views)} views</div>
                        <div className="text-sm text-muted-foreground">{post.readTime}m read</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Recent Activity
                </CardTitle>
                <CardDescription>
                  Latest interactions with your blog content
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analyticsData.recentActivity.map((activity) => (
                    <div key={activity.id} className="flex items-center gap-4 p-3 border rounded-lg">
                      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                        {activity.type === 'view' && <Eye className="h-4 w-4" />}
                        {activity.type === 'comment' && <MessageCircle className="h-4 w-4" />}
                        {activity.type === 'share' && <Share2 className="h-4 w-4" />}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">
                          {activity.type === 'view' && 'New view on'}
                          {activity.type === 'comment' && 'New comment on'}
                          {activity.type === 'share' && 'Post shared'}
                        </p>
                        <p className="text-sm text-muted-foreground line-clamp-1">
                          {activity.postTitle}
                        </p>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(activity.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="content" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Content Performance */}
            <Card>
              <CardHeader>
                <CardTitle>Content Performance</CardTitle>
                <CardDescription>
                  Key metrics about your content quality and engagement
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold">
                      {analyticsData.contentPerformance.avgWordsPerPost}
                    </div>
                    <div className="text-sm text-muted-foreground">Avg. Words/Post</div>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold">
                      {analyticsData.contentPerformance.avgReadTime}m
                    </div>
                    <div className="text-sm text-muted-foreground">Avg. Read Time</div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium mb-3">Content Distribution</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Published Posts</span>
                      <span>{analyticsData.overview.publishedPosts}</span>
                    </div>
                    <Progress 
                      value={(analyticsData.overview.publishedPosts / analyticsData.overview.totalPosts) * 100} 
                      className="h-2" 
                    />
                    
                    <div className="flex justify-between text-sm">
                      <span>Draft Posts</span>
                      <span>{analyticsData.overview.draftPosts}</span>
                    </div>
                    <Progress 
                      value={(analyticsData.overview.draftPosts / analyticsData.overview.totalPosts) * 100} 
                      className="h-2" 
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Popular Tags */}
            <Card>
              <CardHeader>
                <CardTitle>Popular Tags</CardTitle>
                <CardDescription>
                  Most frequently used tags in your content
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analyticsData.contentPerformance.mostUsedTags.map((tag, index) => (
                    <div key={tag.tag} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-6 h-6 rounded bg-primary/10 flex items-center justify-center text-xs font-medium">
                          {index + 1}
                        </div>
                        <Badge variant="secondary">{tag.tag}</Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {tag.count} posts
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="engagement" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="h-5 w-5" />
                  Comments
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold mb-2">
                  {analyticsData.overview.totalComments}
                </div>
                <p className="text-sm text-muted-foreground">
                  Total comments across all posts
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Share2 className="h-5 w-5" />
                  Shares
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold mb-2">1,234</div>
                <p className="text-sm text-muted-foreground">
                  Total social media shares
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="h-5 w-5" />
                  Engagement Rate
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold mb-2">8.7%</div>
                <p className="text-sm text-muted-foreground">
                  Average engagement rate
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="optimization" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Content Optimization Recommendations
              </CardTitle>
              <CardDescription>
                AI-powered suggestions to improve your content performance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 border rounded-lg bg-blue-50 border-blue-200">
                  <h4 className="font-medium text-blue-900 mb-2">SEO Optimization</h4>
                  <p className="text-sm text-blue-800 mb-3">
                    Consider adding more internal links to improve SEO performance. 
                    Posts with 3+ internal links get 40% more traffic.
                  </p>
                  <Button size="sm" variant="outline">
                    View SEO Guide
                  </Button>
                </div>
                
                <div className="p-4 border rounded-lg bg-green-50 border-green-200">
                  <h4 className="font-medium text-green-900 mb-2">Content Length</h4>
                  <p className="text-sm text-green-800 mb-3">
                    Your average post length is optimal. Posts between 1,000-2,000 words 
                    tend to perform best for engagement.
                  </p>
                  <Button size="sm" variant="outline">
                    Content Guidelines
                  </Button>
                </div>
                
                <div className="p-4 border rounded-lg bg-yellow-50 border-yellow-200">
                  <h4 className="font-medium text-yellow-900 mb-2">Publishing Schedule</h4>
                  <p className="text-sm text-yellow-800 mb-3">
                    Consider publishing more consistently. Your audience is most active 
                    on Tuesdays and Thursdays between 10-11 AM.
                  </p>
                  <Button size="sm" variant="outline">
                    Schedule Posts
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 