'use client';

import React, { useState, useEffect } from 'react';
import { gqlRequest } from '@/lib/graphql-client';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown,
  Eye,
  MessageCircle,
  ThumbsUp,
  Users,
  Calendar,
  Filter,
  Download,
  RefreshCw,
  Globe,
  Clock,
  Target
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';

interface AnalyticsData {
  overview: {
    totalViews: number;
    totalPosts: number;
    totalComments: number;
    totalLikes: number;
    avgReadTime: number;
    bounceRate: number;
    viewsChange: number;
    postsChange: number;
    commentsChange: number;
    likesChange: number;
  };
  topPosts: Array<{
    id: string;
    title: string;
    slug: string;
    views: number;
    comments: number;
    likes: number;
    publishedAt: string;
    readTime: number;
  }>;
  viewsOverTime: Array<{
    date: string;
    views: number;
    uniqueViews: number;
  }>;
  demographics: {
    countries: Array<{
      country: string;
      views: number;
      percentage: number;
    }>;
    devices: Array<{
      device: string;
      views: number;
      percentage: number;
    }>;
    sources: Array<{
      source: string;
      views: number;
      percentage: number;
    }>;
  };
  engagement: {
    avgTimeOnPage: number;
    avgCommentsPerPost: number;
    avgLikesPerPost: number;
    shareRate: number;
    returnVisitorRate: number;
  };
}

interface BlogAnalyticsProps {
  blogId?: string;
  locale?: string;
}

export function BlogAnalytics({ blogId, locale = 'en' }: BlogAnalyticsProps) {
  // State management
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  const [refreshing, setRefreshing] = useState(false);

  // Load data
  useEffect(() => {
    loadAnalytics();
  }, [blogId, dateRange]);

  async function loadAnalytics() {
    setLoading(true);
    try {
      const query = `
        query GetBlogAnalytics($blogId: ID, $dateRange: String!) {
          blogAnalytics(blogId: $blogId, dateRange: $dateRange) {
            overview {
              totalViews
              totalPosts
              totalComments
              totalLikes
              avgReadTime
              bounceRate
              viewsChange
              postsChange
              commentsChange
              likesChange
            }
            topPosts {
              id
              title
              slug
              views
              comments
              likes
              publishedAt
              readTime
            }
            viewsOverTime {
              date
              views
              uniqueViews
            }
            demographics {
              countries {
                country
                views
                percentage
              }
              devices {
                device
                views
                percentage
              }
              sources {
                source
                views
                percentage
              }
            }
            engagement {
              avgTimeOnPage
              avgCommentsPerPost
              avgLikesPerPost
              shareRate
              returnVisitorRate
            }
          }
        }
      `;

      const response = await gqlRequest<{ blogAnalytics: AnalyticsData }>(query, { 
        blogId, 
        dateRange 
      });
      
      setAnalyticsData(response.blogAnalytics);
    } catch (error) {
      console.error('Error loading analytics:', error);
      // Set mock data for demonstration
      setAnalyticsData({
        overview: {
          totalViews: 12543,
          totalPosts: 45,
          totalComments: 234,
          totalLikes: 567,
          avgReadTime: 3.2,
          bounceRate: 42.5,
          viewsChange: 12.5,
          postsChange: 8.3,
          commentsChange: -2.1,
          likesChange: 15.7
        },
        topPosts: [
          {
            id: '1',
            title: 'Getting Started with React Hooks',
            slug: 'getting-started-react-hooks',
            views: 2543,
            comments: 45,
            likes: 123,
            publishedAt: '2024-01-15',
            readTime: 5
          },
          {
            id: '2',
            title: 'Advanced TypeScript Patterns',
            slug: 'advanced-typescript-patterns',
            views: 1876,
            comments: 32,
            likes: 89,
            publishedAt: '2024-01-10',
            readTime: 8
          },
          {
            id: '3',
            title: 'Building Modern Web Apps',
            slug: 'building-modern-web-apps',
            views: 1654,
            comments: 28,
            likes: 76,
            publishedAt: '2024-01-08',
            readTime: 6
          }
        ],
        viewsOverTime: [
          { date: '2024-01-01', views: 450, uniqueViews: 320 },
          { date: '2024-01-02', views: 523, uniqueViews: 387 },
          { date: '2024-01-03', views: 612, uniqueViews: 445 },
          { date: '2024-01-04', views: 578, uniqueViews: 421 },
          { date: '2024-01-05', views: 689, uniqueViews: 498 }
        ],
        demographics: {
          countries: [
            { country: 'United States', views: 4521, percentage: 36.1 },
            { country: 'United Kingdom', views: 2134, percentage: 17.0 },
            { country: 'Germany', views: 1876, percentage: 15.0 },
            { country: 'Canada', views: 1234, percentage: 9.8 },
            { country: 'Australia', views: 987, percentage: 7.9 }
          ],
          devices: [
            { device: 'Desktop', views: 7526, percentage: 60.0 },
            { device: 'Mobile', views: 3761, percentage: 30.0 },
            { device: 'Tablet', views: 1256, percentage: 10.0 }
          ],
          sources: [
            { source: 'Direct', views: 5017, percentage: 40.0 },
            { source: 'Google', views: 3761, percentage: 30.0 },
            { source: 'Social Media', views: 2508, percentage: 20.0 },
            { source: 'Referral', views: 1257, percentage: 10.0 }
          ]
        },
        engagement: {
          avgTimeOnPage: 4.2,
          avgCommentsPerPost: 5.2,
          avgLikesPerPost: 12.6,
          shareRate: 8.5,
          returnVisitorRate: 34.7
        }
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleRefresh() {
    setRefreshing(true);
    await loadAnalytics();
    setRefreshing(false);
  }

  function formatNumber(num: number): string {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  }

  function formatPercentage(num: number): string {
    return `${num > 0 ? '+' : ''}${num.toFixed(1)}%`;
  }

  function getChangeColor(change: number): string {
    return change > 0 ? 'text-green-600' : change < 0 ? 'text-red-600' : 'text-gray-600';
  }

  function getChangeIcon(change: number) {
    return change > 0 ? <TrendingUp className="h-4 w-4" /> : 
           change < 0 ? <TrendingDown className="h-4 w-4" /> : null;
  }

  function formatDate(date: string): string {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
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
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-64 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Card>
          <CardContent className="py-12 text-center">
            <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No analytics data available</h3>
            <p className="text-muted-foreground">
              Analytics data will appear here once your blog starts receiving traffic.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <BarChart3 className="h-8 w-8" />
            Blog Analytics
          </h1>
          <p className="text-muted-foreground mt-2">
            Track your blog performance and audience insights
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          {/* Date Range Filter */}
          <Select value={dateRange} onValueChange={(value) => setDateRange(value as any)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
            </SelectContent>
          </Select>
          
          {/* Refresh Button */}
          <Button 
            variant="outline" 
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          
          {/* Export Button */}
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Views</p>
                <p className="text-2xl font-bold">{formatNumber(analyticsData.overview.totalViews)}</p>
                <div className={`flex items-center gap-1 text-sm ${getChangeColor(analyticsData.overview.viewsChange)}`}>
                  {getChangeIcon(analyticsData.overview.viewsChange)}
                  <span>{formatPercentage(analyticsData.overview.viewsChange)}</span>
                </div>
              </div>
              <Eye className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Posts</p>
                <p className="text-2xl font-bold">{analyticsData.overview.totalPosts}</p>
                <div className={`flex items-center gap-1 text-sm ${getChangeColor(analyticsData.overview.postsChange)}`}>
                  {getChangeIcon(analyticsData.overview.postsChange)}
                  <span>{formatPercentage(analyticsData.overview.postsChange)}</span>
                </div>
              </div>
              <Globe className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Comments</p>
                <p className="text-2xl font-bold">{formatNumber(analyticsData.overview.totalComments)}</p>
                <div className={`flex items-center gap-1 text-sm ${getChangeColor(analyticsData.overview.commentsChange)}`}>
                  {getChangeIcon(analyticsData.overview.commentsChange)}
                  <span>{formatPercentage(analyticsData.overview.commentsChange)}</span>
                </div>
              </div>
              <MessageCircle className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Likes</p>
                <p className="text-2xl font-bold">{formatNumber(analyticsData.overview.totalLikes)}</p>
                <div className={`flex items-center gap-1 text-sm ${getChangeColor(analyticsData.overview.likesChange)}`}>
                  {getChangeIcon(analyticsData.overview.likesChange)}
                  <span>{formatPercentage(analyticsData.overview.likesChange)}</span>
                </div>
              </div>
              <ThumbsUp className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Detailed Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Top Posts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Top Performing Posts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analyticsData.topPosts.map((post, index) => (
                <div key={post.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="secondary" className="text-xs">
                        #{index + 1}
                      </Badge>
                      <span className="font-medium text-sm line-clamp-1">{post.title}</span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Eye className="h-3 w-3" />
                        {formatNumber(post.views)}
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageCircle className="h-3 w-3" />
                        {post.comments}
                      </span>
                      <span className="flex items-center gap-1">
                        <ThumbsUp className="h-3 w-3" />
                        {post.likes}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {post.readTime}m
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Engagement Metrics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Engagement Metrics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Avg. Time on Page</span>
                  <span className="font-medium">{analyticsData.engagement.avgTimeOnPage}m</span>
                </div>
                <Progress value={analyticsData.engagement.avgTimeOnPage * 10} className="h-2" />
              </div>
              
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Avg. Comments per Post</span>
                  <span className="font-medium">{analyticsData.engagement.avgCommentsPerPost}</span>
                </div>
                <Progress value={analyticsData.engagement.avgCommentsPerPost * 5} className="h-2" />
              </div>
              
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Avg. Likes per Post</span>
                  <span className="font-medium">{analyticsData.engagement.avgLikesPerPost}</span>
                </div>
                <Progress value={analyticsData.engagement.avgLikesPerPost * 2} className="h-2" />
              </div>
              
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Share Rate</span>
                  <span className="font-medium">{analyticsData.engagement.shareRate}%</span>
                </div>
                <Progress value={analyticsData.engagement.shareRate} className="h-2" />
              </div>
              
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Return Visitor Rate</span>
                  <span className="font-medium">{analyticsData.engagement.returnVisitorRate}%</span>
                </div>
                <Progress value={analyticsData.engagement.returnVisitorRate} className="h-2" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Demographics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Countries */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Top Countries</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analyticsData.demographics.countries.map((country, index) => (
                <div key={country.country} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{index + 1}.</span>
                    <span className="text-sm">{country.country}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      {formatNumber(country.views)}
                    </span>
                    <Badge variant="secondary" className="text-xs">
                      {country.percentage}%
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Devices */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Device Types</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analyticsData.demographics.devices.map((device) => (
                <div key={device.device}>
                  <div className="flex justify-between text-sm mb-2">
                    <span>{device.device}</span>
                    <span className="font-medium">{device.percentage}%</span>
                  </div>
                  <Progress value={device.percentage} className="h-2" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Traffic Sources */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Traffic Sources</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analyticsData.demographics.sources.map((source) => (
                <div key={source.source}>
                  <div className="flex justify-between text-sm mb-2">
                    <span>{source.source}</span>
                    <span className="font-medium">{source.percentage}%</span>
                  </div>
                  <Progress value={source.percentage} className="h-2" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Additional Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Performance Metrics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 border rounded-lg">
                <p className="text-2xl font-bold text-blue-600">
                  {analyticsData.overview.avgReadTime}m
                </p>
                <p className="text-sm text-muted-foreground">Avg. Read Time</p>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <p className="text-2xl font-bold text-red-600">
                  {analyticsData.overview.bounceRate}%
                </p>
                <p className="text-sm text-muted-foreground">Bounce Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Views Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {analyticsData.viewsOverTime.slice(-5).map((data) => (
                <div key={data.date} className="flex items-center justify-between text-sm">
                  <span>{formatDate(data.date)}</span>
                  <div className="flex items-center gap-4">
                    <span className="text-muted-foreground">
                      {formatNumber(data.views)} views
                    </span>
                    <span className="text-blue-600">
                      {formatNumber(data.uniqueViews)} unique
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 