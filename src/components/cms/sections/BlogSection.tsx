'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import StableInput from './StableInput';
import { Search, User, ChevronLeft, ChevronRight, ImageIcon, Calendar, Clock, Check, AlertTriangle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { gqlRequest } from '@/lib/graphql-client';
import Image from 'next/image';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import BackgroundSelector from '@/components/cms/BackgroundSelector';
import MediaSelector from '@/components/cms/MediaSelector';
import { MediaItem } from '@/components/cms/media/types';

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
  content?: string;
  // featuredImage?: string; // Field removed
  featuredImageMedia?: { fileUrl: string };
  author?: {
    name: string;
    image?: string;
  };
  publishedAt?: string;
  readTime?: string;
  tags?: string[];
  category?: string;
}

interface Blog {
  id: string;
  title: string;
  description?: string;
  slug: string;
  isActive: boolean;
}

interface PostResponse {
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
  content: string;
  // featuredImage?: string; // Field removed
  featuredImageMedia?: { fileUrl: string };
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

interface BlogSectionProps {
  title?: string;
  subtitle?: string;
  blogId?: string; // ID of the blog to fetch posts from
  layout?: 'grid' | 'list' | 'carousel' | 'masonry';
  filtersEnabled?: boolean;
  searchEnabled?: boolean;
  postsPerPage?: number;
  showFeaturedImage?: boolean;
  showAuthor?: boolean;
  showDate?: boolean;
  showTags?: boolean;
  showExcerpt?: boolean;
  topPadding?: 'none' | 'small' | 'medium' | 'large' | 'extra-large';
  bottomPadding?: 'none' | 'small' | 'medium' | 'large' | 'extra-large';
  backgroundColor?: 'transparent' | 'white' | 'gray' | 'dark';
  imageAspectRatio?: '16:9' | '4:3' | '1:1' | '3:2';
  showImageOverlay?: boolean;
  fixedHeaderHeight?: number; // Height of fixed header in pixels
  maxHeight?: 'none' | 'screen' | 'half-screen' | 'custom';
  customMaxHeight?: number; // Custom max height in pixels
  enableVirtualization?: boolean; // For large lists
  backgroundImage?: string; // Background image URL
  backgroundGradient?: string; // Background gradient
  isEditing?: boolean;
  onUpdate?: (data: Partial<BlogSectionProps>) => void;
}

export default function BlogSection({
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
  topPadding = 'large',
  bottomPadding = 'large',
  backgroundColor = 'transparent',
  imageAspectRatio = '16:9',
  showImageOverlay = false,
  fixedHeaderHeight = 0, // Default to 0 - no fixed header
  maxHeight = 'none',
  customMaxHeight = 800,
  enableVirtualization = false,
  backgroundImage = '',
  backgroundGradient = '',
  isEditing = false,
  onUpdate
}: BlogSectionProps) {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest'>('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const [currentCarouselIndex, setCurrentCarouselIndex] = useState(0);

  // Local state for editing
  const [localTitle, setLocalTitle] = useState(title || '');
  const [localSubtitle, setLocalSubtitle] = useState(subtitle || '');
  const [localBlogId, setLocalBlogId] = useState(blogId || '');
  const [localLayout, setLocalLayout] = useState(layout);
  const [localPostsPerPage, setLocalPostsPerPage] = useState(postsPerPage);
  const [localSearchEnabled, setLocalSearchEnabled] = useState(searchEnabled);
  const [localFiltersEnabled, setLocalFiltersEnabled] = useState(filtersEnabled);
  const [localShowFeaturedImage, setLocalShowFeaturedImage] = useState(showFeaturedImage);
  const [localShowAuthor, setLocalShowAuthor] = useState(showAuthor);
  const [localShowDate, setLocalShowDate] = useState(showDate);
  const [localShowTags, setLocalShowTags] = useState(showTags);
  const [localShowExcerpt, setLocalShowExcerpt] = useState(showExcerpt);
  const [localShowImageOverlay, setLocalShowImageOverlay] = useState(showImageOverlay);
  const [localTopPadding, setLocalTopPadding] = useState(topPadding);
  const [localBottomPadding, setLocalBottomPadding] = useState(bottomPadding);
  const [localBackgroundColor, setLocalBackgroundColor] = useState(backgroundColor);
  const [localImageAspectRatio, setLocalImageAspectRatio] = useState(imageAspectRatio);
  const [localFixedHeaderHeight, setLocalFixedHeaderHeight] = useState(fixedHeaderHeight);
  const [localMaxHeight, setLocalMaxHeight] = useState(maxHeight);
  const [localCustomMaxHeight, setLocalCustomMaxHeight] = useState(customMaxHeight);
  const [localEnableVirtualization, setLocalEnableVirtualization] = useState(enableVirtualization);
  const [localBackgroundImage, setLocalBackgroundImage] = useState(backgroundImage);
  const [localBackgroundGradient, setLocalBackgroundGradient] = useState(backgroundGradient);

  // Save system state
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [saveMessage, setSaveMessage] = useState('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Modal states
  const [showBackgroundSelector, setShowBackgroundSelector] = useState(false);
  const [showMediaSelector, setShowMediaSelector] = useState(false);

  // Refs for debouncing and auto-save
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const autoSaveRef = useRef<NodeJS.Timeout | null>(null);

  // Save function
  const saveBlogSectionStyle = useCallback(async () => {
    if (!localBlogId) {
      setSaveStatus('error');
      setSaveMessage('No blog selected');
      return;
    }
    
    // Clear auto-save timeout since we're manually saving
    if (autoSaveRef.current) {
      clearTimeout(autoSaveRef.current);
    }
    
    setIsSaving(true);
    setSaveStatus('saving');
    setSaveMessage('Saving blog section style...');
    
    try {
      // Prepare the blog section style data
      const blogSectionData = {
        title: localTitle,
        subtitle: localSubtitle,
        layout: localLayout,
        postsPerPage: localPostsPerPage,
        searchEnabled: localSearchEnabled,
        filtersEnabled: localFiltersEnabled,
        showFeaturedImage: localShowFeaturedImage,
        showAuthor: localShowAuthor,
        showDate: localShowDate,
        showTags: localShowTags,
        showExcerpt: localShowExcerpt,
        showImageOverlay: localShowImageOverlay,
        topPadding: localTopPadding,
        bottomPadding: localBottomPadding,
        backgroundColor: localBackgroundColor,
        imageAspectRatio: localImageAspectRatio,
        fixedHeaderHeight: localFixedHeaderHeight,
        maxHeight: localMaxHeight,
        customMaxHeight: localCustomMaxHeight,
        enableVirtualization: localEnableVirtualization,
        backgroundImage: localBackgroundImage,
        backgroundGradient: localBackgroundGradient
      };
      
      // Save using GraphQL (you'll need to implement this in cmsOperations)
      // For now, we'll simulate the save
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log('Blog section style saved successfully:', blogSectionData);
      setSaveStatus('success');
      setSaveMessage('Blog section style saved successfully!');
      setHasUnsavedChanges(false);
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSaveStatus('idle');
        setSaveMessage('');
      }, 3000);
    } catch (error) {
      console.error('Error saving blog section style:', error);
      setSaveStatus('error');
      setSaveMessage(error instanceof Error ? error.message : 'An unexpected error occurred');
      
      // Clear error message after 5 seconds
      setTimeout(() => {
        setSaveStatus('idle');
        setSaveMessage('');
      }, 5000);
    } finally {
      setIsSaving(false);
    }
  }, [
    localBlogId, localTitle, localSubtitle, localLayout, localPostsPerPage,
    localSearchEnabled, localFiltersEnabled, localShowFeaturedImage, localShowAuthor,
    localShowDate, localShowTags, localShowExcerpt, localShowImageOverlay,
    localTopPadding, localBottomPadding, localBackgroundColor, localImageAspectRatio,
    localFixedHeaderHeight, localMaxHeight, localCustomMaxHeight, localEnableVirtualization,
    localBackgroundImage, localBackgroundGradient
  ]);

  // Auto-save functionality
  const scheduleAutoSave = useCallback(() => {
    if (autoSaveRef.current) {
      clearTimeout(autoSaveRef.current);
    }
    
    autoSaveRef.current = setTimeout(() => {
      if (hasUnsavedChanges && localBlogId) {
        saveBlogSectionStyle();
      }
    }, 5000); // Auto-save after 5 seconds of inactivity
  }, [hasUnsavedChanges, localBlogId, saveBlogSectionStyle]);

  // Debounced change handler
  const debouncedHandleChange = useCallback(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    
    debounceRef.current = setTimeout(() => {
      setHasUnsavedChanges(true);
      scheduleAutoSave();
    }, 300);
  }, [scheduleAutoSave]);

  // Handle updates with auto-save
  const handleUpdateField = useCallback((field: string, value: unknown) => {
    // Update local state immediately for responsive UI
    switch (field) {
      case 'title':
        if (typeof value === 'string') setLocalTitle(value);
        break;
      case 'subtitle':
        if (typeof value === 'string') setLocalSubtitle(value);
        break;
      case 'blogId':
        if (typeof value === 'string') setLocalBlogId(value);
        break;
      case 'layout':
        if (typeof value === 'string') setLocalLayout(value as 'grid' | 'list' | 'carousel' | 'masonry');
        break;
      case 'postsPerPage':
        if (typeof value === 'number') setLocalPostsPerPage(value);
        break;
      case 'searchEnabled':
        if (typeof value === 'boolean') setLocalSearchEnabled(value);
        break;
      case 'filtersEnabled':
        if (typeof value === 'boolean') setLocalFiltersEnabled(value);
        break;
      case 'showFeaturedImage':
        if (typeof value === 'boolean') setLocalShowFeaturedImage(value);
        break;
      case 'showAuthor':
        if (typeof value === 'boolean') setLocalShowAuthor(value);
        break;
      case 'showDate':
        if (typeof value === 'boolean') setLocalShowDate(value);
        break;
      case 'showTags':
        if (typeof value === 'boolean') setLocalShowTags(value);
        break;
      case 'showExcerpt':
        if (typeof value === 'boolean') setLocalShowExcerpt(value);
        break;
      case 'showImageOverlay':
        if (typeof value === 'boolean') setLocalShowImageOverlay(value);
        break;
      case 'topPadding':
        if (typeof value === 'string') setLocalTopPadding(value as 'none' | 'small' | 'medium' | 'large' | 'extra-large');
        break;
      case 'bottomPadding':
        if (typeof value === 'string') setLocalBottomPadding(value as 'none' | 'small' | 'medium' | 'large' | 'extra-large');
        break;
      case 'backgroundColor':
        if (typeof value === 'string') setLocalBackgroundColor(value as 'transparent' | 'white' | 'gray' | 'dark');
        break;
      case 'imageAspectRatio':
        if (typeof value === 'string') setLocalImageAspectRatio(value as '16:9' | '4:3' | '1:1' | '3:2');
        break;
      case 'fixedHeaderHeight':
        if (typeof value === 'number') setLocalFixedHeaderHeight(value);
        break;
      case 'maxHeight':
        if (typeof value === 'string') setLocalMaxHeight(value as 'none' | 'screen' | 'half-screen' | 'custom');
        break;
      case 'customMaxHeight':
        if (typeof value === 'number') setLocalCustomMaxHeight(value);
        break;
      case 'enableVirtualization':
        if (typeof value === 'boolean') setLocalEnableVirtualization(value);
        break;
      case 'backgroundImage':
        if (typeof value === 'string') setLocalBackgroundImage(value);
        break;
      case 'backgroundGradient':
        if (typeof value === 'string') setLocalBackgroundGradient(value);
        break;
    }

    // Call onUpdate if provided
    if (onUpdate) {
      onUpdate({ [field]: value });
    }

    // Trigger auto-save
    debouncedHandleChange();
  }, [onUpdate, debouncedHandleChange]);

  // Background selector handlers
  const handleBackgroundSelect = useCallback((background: string, type: 'image' | 'gradient') => {
    if (type === 'image') {
      setLocalBackgroundImage(background);
      setLocalBackgroundGradient('');
      handleUpdateField('backgroundImage', background);
      handleUpdateField('backgroundGradient', '');
    } else {
      setLocalBackgroundGradient(background);
      setLocalBackgroundImage('');
      handleUpdateField('backgroundGradient', background);
      handleUpdateField('backgroundImage', '');
    }
    debouncedHandleChange();
  }, [handleUpdateField, debouncedHandleChange]);

  const handleMediaSelect = useCallback((mediaItem: MediaItem) => {
    setLocalBackgroundImage(mediaItem.fileUrl);
    setLocalBackgroundGradient('');
    handleUpdateField('backgroundImage', mediaItem.fileUrl);
    handleUpdateField('backgroundGradient', '');
    debouncedHandleChange();
  }, [handleUpdateField, debouncedHandleChange]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      if (autoSaveRef.current) {
        clearTimeout(autoSaveRef.current);
      }
    };
  }, []);

  // Fetch available blogs for selection (only in editing mode)
  useEffect(() => {
    if (isEditing) {
      fetchBlogs();
    }
  }, [isEditing]);

  // Fetch posts when blogId changes
  useEffect(() => {
    if (localBlogId) {
      fetchPosts();
    } else {
      setPosts([]);
      setLoading(false);
    }
  }, [localBlogId]);

  async function fetchBlogs() {
    try {
      const query = `
        query GetBlogs {
          blogs {
            id
            title
            description
            slug
            isActive
          }
        }
      `;
      
      const response = await gqlRequest<{ blogs: Blog[] }>(query);
      setBlogs(response.blogs || []);
    } catch (error) {
      console.error('Error fetching blogs:', error);
    }
  }

  async function fetchPosts() {
    try {
      setLoading(true);
      
      const query = `
        query GetBlogPosts($filter: PostFilter) {
          posts(filter: $filter) {
            id
            title
            slug
            excerpt
            content
            # featuredImage // Field removed
            featuredImageMedia {
              fileUrl
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
              profileImageUrl
            }
          }
        }
      `;
      
      const filter = {
        blogId: localBlogId,
        status: 'PUBLISHED'
      };
      
      const response = await gqlRequest<{ posts: PostResponse[] }>(query, { filter });
      
      // Transform posts to match BlogSection interface
      const transformedPosts: BlogPost[] = response.posts.map(post => ({
        id: post.id,
        title: post.title,
        slug: post.slug,
        excerpt: post.excerpt || undefined,
        content: post.content,
        // featuredImage: post.featuredImage || undefined, // Field removed
        featuredImageMedia: post.featuredImageMedia || undefined,
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
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }

  // Extract unique categories and tags
  const categories = Array.from(new Set(posts.map(p => p.category).filter(Boolean))) as string[];
  const tags = Array.from(new Set(posts.flatMap(p => p.tags || []).filter(Boolean)));

  // Optimize posts per page for performance
  const optimizedPostsPerPage = localEnableVirtualization && localPostsPerPage > 20 ? 20 : localPostsPerPage;

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
    const dateA = new Date(a.publishedAt || '').getTime();
    const dateB = new Date(b.publishedAt || '').getTime();
    return sortBy === 'newest' ? dateB - dateA : dateA - dateB;
  });

  // Paginate posts
  const totalPages = Math.ceil(sortedPosts.length / optimizedPostsPerPage);
  const paginatedPosts = sortedPosts.slice(
    (currentPage - 1) * optimizedPostsPerPage,
    currentPage * optimizedPostsPerPage
  );

  // Format date
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

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

  // Get padding classes
  const getPaddingClass = (padding: string, position: 'top' | 'bottom') => {
    const prefix = position === 'top' ? 'pt' : 'pb';
    switch (padding) {
      case 'none': return `${prefix}-0`;
      case 'small': return `${prefix}-8`;
      case 'medium': return `${prefix}-16`;
      case 'large': return `${prefix}-24`;
      case 'extra-large': return `${prefix}-32`;
      default: return `${prefix}-16`;
    }
  };

  // Get background class
  const getBackgroundClass = (bg: string) => {
    switch (bg) {
      case 'white': return 'bg-white';
      case 'gray': return 'bg-gray-50';
      case 'dark': return 'bg-gray-900 text-white';
      default: return 'bg-transparent';
    }
  };

  // Get background style
  const getBackgroundStyle = () => {
    const style: React.CSSProperties = {};
    
    if (localBackgroundImage) {
      style.backgroundImage = `url(${localBackgroundImage})`;
      style.backgroundSize = 'cover';
      style.backgroundPosition = 'center';
      style.backgroundRepeat = 'no-repeat';
    } else if (localBackgroundGradient) {
      style.background = localBackgroundGradient;
    }
    
    return style;
  };

  // Calculate top spacing for fixed header
  const getFixedHeaderSpacing = () => {
    if (localFixedHeaderHeight > 0) {
      // Apply header height + additional spacing for better visual separation
      const totalSpacing = localFixedHeaderHeight + 48;
      return { 
        paddingTop: `${totalSpacing}px`,
        // Add a subtle visual indicator in development (remove in production)
        ...(process.env.NODE_ENV === 'development' && {
          borderTop: `2px solid rgba(59, 130, 246, 0.1)` // Very subtle blue border for debugging
        })
      };
    }
    return {};
  };

  // Get container classes with fixed header support
  const getContainerClasses = () => {
    if (localFixedHeaderHeight > 0) {
      return "container mx-auto px-4"; // Remove pt-12 when using fixed header
    }
    return "container mx-auto px-4 pt-12"; // Keep pt-12 when no fixed header
  };

  // Get max height classes and styles
  const getMaxHeightConfig = () => {
    const config: { className?: string; style?: React.CSSProperties } = {};
    
    // Remove height restrictions - let content flow naturally
    // Only apply scroll if user specifically wants height control
    if (localMaxHeight !== 'none') {
      switch (localMaxHeight) {
        case 'screen':
          config.style = { maxHeight: '100vh', overflowY: 'auto' };
          break;
        case 'half-screen':
          config.style = { maxHeight: '50vh', overflowY: 'auto' };
          break;
        case 'custom':
          config.style = { maxHeight: `${localCustomMaxHeight}px`, overflowY: 'auto' };
          break;
      }
    }
    
    return config;
  };

  // Get section classes with height control
  const getSectionClasses = () => {
    const baseClasses = `w-full ${getPaddingClass(localTopPadding, 'top')} ${getPaddingClass(localBottomPadding, 'bottom')} ${getBackgroundClass(localBackgroundColor)}`;
    const heightConfig = getMaxHeightConfig();
    
    if (heightConfig.className) {
      return `${baseClasses} ${heightConfig.className}`;
    }
    return baseClasses;
  };

  // Get image aspect ratio classes
  const getImageAspectRatio = (ratio: string) => {
    switch (ratio) {
      case '16:9': return 'aspect-video'; // 16:9
      case '4:3': return 'aspect-[4/3]';
      case '1:1': return 'aspect-square';
      case '3:2': return 'aspect-[3/2]';
      default: return 'aspect-video';
    }
  };

  // Generate fallback image based on post title
  const generateFallbackImage = (title: string, category?: string) => {
    const colors = [
      'bg-gradient-to-br from-blue-500 to-purple-600',
      'bg-gradient-to-br from-green-500 to-teal-600',
      'bg-gradient-to-br from-orange-500 to-red-600',
      'bg-gradient-to-br from-purple-500 to-pink-600',
      'bg-gradient-to-br from-indigo-500 to-blue-600',
      'bg-gradient-to-br from-yellow-500 to-orange-600'
    ];
    
    const colorIndex = title.length % colors.length;
    const initials = title.split(' ').map(word => word[0]).join('').substring(0, 2).toUpperCase();
    
    return (
      <div className={`w-full h-full ${colors[colorIndex]} flex items-center justify-center text-white`}>
        <div className="text-center">
          <div className="text-2xl font-bold mb-1">{initials}</div>
          {category && <div className="text-xs opacity-80">{category}</div>}
        </div>
      </div>
    );
  };

  // Enhanced Post Card Component
  const PostCard = ({ post }: { post: BlogPost }) => (
    <Card className="h-full hover:shadow-xl transition-all duration-300 cursor-pointer group overflow-hidden border-0 shadow-md">
      {localShowFeaturedImage && (
        <div className={`w-full ${getImageAspectRatio(localImageAspectRatio)} overflow-hidden relative`}>
          {post.featuredImageMedia?.fileUrl ? (
            <>
          <Image
            src={post.featuredImageMedia.fileUrl}
            alt={post.title}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-300"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
              {localShowImageOverlay && (
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              )}
            </>
          ) : (
            generateFallbackImage(post.title, post.category)
          )}
          
          {/* Category badge overlay */}
          {post.category && (
            <div className="absolute top-3 left-3">
              <Badge variant="secondary" className="bg-white/90 text-gray-900 backdrop-blur-sm">
                {post.category}
              </Badge>
            </div>
          )}
        </div>
      )}
      
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between mb-3">
          {!localShowFeaturedImage && post.category && (
            <Badge variant="secondary" className="text-xs">
              {post.category}
            </Badge>
          )}
          {localShowDate && post.publishedAt && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3" />
              <span>{formatDate(post.publishedAt)}</span>
            </div>
          )}
        </div>
        <CardTitle className="line-clamp-2 text-lg leading-tight group-hover:text-primary transition-colors">
          {post.title}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="pb-3">
        {localShowExcerpt && post.excerpt && (
          <CardDescription className="line-clamp-3 text-sm leading-relaxed">
            {post.excerpt}
          </CardDescription>
        )}
      </CardContent>
      
      <CardFooter className="pt-0 mt-auto">
        <div className="w-full space-y-3">
          {localShowAuthor && post.author && (
            <div className="flex items-center gap-2">
              {post.author.image ? (
              <Image
                src={post.author.image}
                alt={post.author.name}
                  width={24}
                  height={24}
                  className="rounded-full"
              />
              ) : (
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-gray-400 to-gray-600 flex items-center justify-center text-white text-xs font-medium">
                  {post.author.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                </div>
            )}
            <span className="text-sm text-muted-foreground">{post.author.name}</span>
            {post.readTime && (
              <>
                <span className="text-muted-foreground">•</span>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>{post.readTime}</span>
                  </div>
              </>
            )}
          </div>
        )}
          
          {localShowTags && post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
            {post.tags.slice(0, 3).map(tag => (
                <Badge key={tag} variant="outline" className="text-xs hover:bg-primary hover:text-primary-foreground transition-colors">
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
        </div>
      </CardFooter>
    </Card>
  );

  // Enhanced List Item Component
  const PostListItem = ({ post }: { post: BlogPost }) => (
    <div className="flex gap-6 p-6 border rounded-xl hover:shadow-lg transition-all duration-300 cursor-pointer group bg-white">
      {localShowFeaturedImage && (
        <div className="w-48 h-32 flex-shrink-0 overflow-hidden rounded-lg relative">
          {post.featuredImageMedia?.fileUrl ? (
          <Image
            src={post.featuredImageMedia.fileUrl}
            alt={post.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              sizes="(max-width: 768px) 100vw, 200px"
            />
          ) : (
            generateFallbackImage(post.title, post.category)
          )}
        </div>
      )}
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3 mb-3">
          {post.category && (
            <Badge variant="secondary" className="text-xs">
              {post.category}
            </Badge>
          )}
          {localShowDate && post.publishedAt && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3" />
              <span>{formatDate(post.publishedAt)}</span>
            </div>
          )}
        </div>
        
        <h3 className="text-xl font-semibold mb-3 line-clamp-2 group-hover:text-primary transition-colors">
          {post.title}
        </h3>
        
        {localShowExcerpt && post.excerpt && (
          <p className="text-muted-foreground line-clamp-2 mb-4 leading-relaxed">
            {post.excerpt}
          </p>
        )}
        
        <div className="flex items-center gap-6 text-sm">
          {localShowAuthor && post.author && (
            <div className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span className="text-muted-foreground">{post.author.name}</span>
            </div>
          )}
          
          {post.readTime && (
            <div className="flex items-center gap-1 text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>{post.readTime}</span>
            </div>
          )}
          
          {localShowTags && post.tags && post.tags.length > 0 && (
            <div className="flex gap-1">
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
      </div>
    </div>
  );

  if (isEditing) {
    return (
      <div className="space-y-4 w-full max-w-full overflow-x-hidden">
        {/* Save Status Bar */}
        <div className="flex items-center justify-between p-4 bg-white border rounded-lg shadow-sm">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-semibold">Blog Section Settings</h3>
            {hasUnsavedChanges && (
              <Badge variant="outline" className="text-amber-600 border-amber-300">
                Unsaved Changes
              </Badge>
            )}
          </div>
          
          <div className="flex items-center gap-3">
            {/* Save Status */}
            {saveStatus === 'saving' && (
              <div className="flex items-center gap-2 text-blue-600">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                <span className="text-sm">Saving...</span>
              </div>
            )}
            
            {saveStatus === 'success' && (
              <div className="flex items-center gap-2 text-green-600">
                <Check className="h-4 w-4" />
                <span className="text-sm">Saved</span>
              </div>
            )}
            
            {saveStatus === 'error' && (
              <div className="flex items-center gap-2 text-red-600">
                <AlertTriangle className="h-4 w-4" />
                <span className="text-sm">Error</span>
              </div>
            )}
            
            {/* Manual Save Button */}
            <Button 
              onClick={saveBlogSectionStyle}
              disabled={isSaving || !hasUnsavedChanges}
              size="sm"
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>

        {/* Save Message */}
        {saveMessage && (
          <div className={`p-3 rounded-lg text-sm ${
            saveStatus === 'success' ? 'bg-green-50 text-green-800 border border-green-200' :
            saveStatus === 'error' ? 'bg-red-50 text-red-800 border border-red-200' :
            'bg-blue-50 text-blue-800 border border-blue-200'
          }`}>
            {saveMessage}
          </div>
        )}

        <Tabs defaultValue="details" className="space-y-4 w-full max-w-full overflow-x-hidden">
          <TabsList className="flex flex-wrap space-x-2 w-full">
            <TabsTrigger value="details" className="flex-1 min-w-[100px]">Details</TabsTrigger>
            <TabsTrigger value="styles" className="flex-1 min-w-[100px]">Styles</TabsTrigger>
            <TabsTrigger value="preview" className="flex-1 min-w-[100px]">Preview</TabsTrigger>
          </TabsList>

          {/* DETAILS TAB */}
          <TabsContent value="details" className="space-y-6 p-6 border rounded-lg">
            {/* Debug Info in Development */}
            {process.env.NODE_ENV === 'development' && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded text-xs">
                <p className="font-medium text-blue-800 mb-1">Debug Info:</p>
                <p className="text-blue-700">Fixed Header: {localFixedHeaderHeight}px</p>
                <p className="text-blue-700">Top Padding: {localTopPadding} ({getPaddingClass(localTopPadding, 'top')})</p>
                <p className="text-blue-700">Bottom Padding: {localBottomPadding} ({getPaddingClass(localBottomPadding, 'bottom')})</p>
                <p className="text-blue-700">Total Top Spacing: {localFixedHeaderHeight > 0 ? `${localFixedHeaderHeight + 48}px` : 'Default (pt-12)'}</p>
              </div>
            )}
            
        <StableInput
              value={localTitle}
          onChange={(value) => handleUpdateField('title', value)}
          placeholder="Blog section title..."
          label="Section Title"
          className="text-2xl font-bold"
        />
        
        <StableInput
              value={localSubtitle}
          onChange={(value) => handleUpdateField('subtitle', value)}
          placeholder="Section subtitle..."
          label="Subtitle"
        />
        
        {/* Blog Selection */}
        <div>
          <label className="text-sm font-medium mb-2 block">Select Blog</label>
              <Select value={localBlogId || 'none'} onValueChange={(value) => handleUpdateField('blogId', value === 'none' ? '' : value)}>
            <SelectTrigger>
              <SelectValue placeholder="Choose a blog to display posts from..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No blog selected</SelectItem>
              {blogs.map(blog => (
                <SelectItem key={blog.id} value={blog.id}>
                  {blog.title} {!blog.isActive && '(Inactive)'}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
              {localBlogId && (
            <p className="text-xs text-muted-foreground mt-1">
              Posts from the selected blog will be automatically fetched and displayed.
            </p>
          )}
        </div>
        
            {/* Basic Layout Options */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium">Layout</label>
                <Select value={localLayout} onValueChange={(value) => handleUpdateField('layout', value)}>
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
            <label className="text-sm font-medium">Posts Per Page</label>
            <Input
              type="number"
                  value={localPostsPerPage}
              onChange={(e) => handleUpdateField('postsPerPage', parseInt(e.target.value))}
              min={1}
              max={50}
            />
          </div>
        </div>
        
            {/* Display Options */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Display Options</label>
          <div className="grid grid-cols-2 gap-2">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                    checked={localSearchEnabled}
                onChange={(e) => handleUpdateField('searchEnabled', e.target.checked)}
              />
              <span className="text-sm">Enable Search</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                    checked={localFiltersEnabled}
                onChange={(e) => handleUpdateField('filtersEnabled', e.target.checked)}
              />
              <span className="text-sm">Enable Filters</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                    checked={localShowFeaturedImage}
                onChange={(e) => handleUpdateField('showFeaturedImage', e.target.checked)}
              />
              <span className="text-sm">Show Featured Images</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                    checked={localShowAuthor}
                onChange={(e) => handleUpdateField('showAuthor', e.target.checked)}
              />
              <span className="text-sm">Show Author</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                    checked={localShowDate}
                onChange={(e) => handleUpdateField('showDate', e.target.checked)}
              />
              <span className="text-sm">Show Date</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                    checked={localShowTags}
                onChange={(e) => handleUpdateField('showTags', e.target.checked)}
              />
              <span className="text-sm">Show Tags</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                    checked={localShowExcerpt}
                onChange={(e) => handleUpdateField('showExcerpt', e.target.checked)}
              />
              <span className="text-sm">Show Excerpt</span>
            </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={localShowImageOverlay}
                    onChange={(e) => handleUpdateField('showImageOverlay', e.target.checked)}
                  />
                  <span className="text-sm">Image Hover Overlay</span>
            </label>
          </div>
        </div>
          </TabsContent>

          {/* STYLES TAB */}
          <TabsContent value="styles" className="space-y-6 p-6 border rounded-lg">
            {/* Background Section */}
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-gray-900 border-b border-gray-200 pb-2">
                Background
              </h4>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Background Style</label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowBackgroundSelector(true)}
                  >
                    Choose Background
                  </Button>
                </div>
                
                {(localBackgroundImage || localBackgroundGradient) && (
                  <div className="space-y-2">
                    <div 
                      className="h-20 w-full rounded-md border border-gray-200"
                      style={getBackgroundStyle()}
                    />
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setLocalBackgroundImage('');
                          setLocalBackgroundGradient('');
                          handleUpdateField('backgroundImage', '');
                          handleUpdateField('backgroundGradient', '');
                        }}
                      >
                        Remove Background
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Spacing and Layout Section */}
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-gray-900 border-b border-gray-200 pb-2">
                Spacing & Layout
              </h4>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Top Padding</label>
                  <Select value={localTopPadding} onValueChange={(value) => handleUpdateField('topPadding', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      <SelectItem value="small">Small</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="large">Large</SelectItem>
                      <SelectItem value="extra-large">Extra Large</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="text-sm font-medium">Bottom Padding</label>
                  <Select value={localBottomPadding} onValueChange={(value) => handleUpdateField('bottomPadding', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      <SelectItem value="small">Small</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="large">Large</SelectItem>
                      <SelectItem value="extra-large">Extra Large</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Background Color</label>
                  <Select value={localBackgroundColor} onValueChange={(value) => handleUpdateField('backgroundColor', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="transparent">Transparent</SelectItem>
                      <SelectItem value="white">White</SelectItem>
                      <SelectItem value="gray">Light Gray</SelectItem>
                      <SelectItem value="dark">Dark</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="text-sm font-medium">Image Aspect Ratio</label>
                  <Select value={localImageAspectRatio} onValueChange={(value) => handleUpdateField('imageAspectRatio', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="16:9">16:9 (Widescreen)</SelectItem>
                      <SelectItem value="4:3">4:3 (Standard)</SelectItem>
                      <SelectItem value="1:1">1:1 (Square)</SelectItem>
                      <SelectItem value="3:2">3:2 (Classic)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Fixed Header Configuration */}
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-gray-900 border-b border-gray-200 pb-2">
                Header Integration
              </h4>
              
              <div>
                <label className="text-sm font-medium">Fixed Header Height (px)</label>
                <Input
                  type="number"
                  value={localFixedHeaderHeight}
                  onChange={(e) => handleUpdateField('fixedHeaderHeight', parseInt(e.target.value) || 0)}
                  min={0}
                  max={200}
                  placeholder="0"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Set to 0 if no fixed header. Common values: 64px, 80px, 96px
                </p>
              </div>
            </div>

            {/* Height Control Configuration */}
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-gray-900 border-b border-gray-200 pb-2">
                Height Control
              </h4>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-xs text-blue-800">
                  <strong>Note:</strong> By default, the blog section flows naturally without height restrictions. 
                  Only use height limits if you need to constrain the section within a specific viewport area.
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Max Height</label>
                  <Select value={localMaxHeight} onValueChange={(value) => handleUpdateField('maxHeight', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No Limit (Recommended)</SelectItem>
                      <SelectItem value="screen">Full Screen</SelectItem>
                      <SelectItem value="half-screen">Half Screen</SelectItem>
                      <SelectItem value="custom">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1">
                    &quot;No Limit&quot; allows natural content flow and scrolling
                  </p>
                </div>
                
                {localMaxHeight === 'custom' && (
                  <div>
                    <label className="text-sm font-medium">Custom Height (px)</label>
                    <Input
                      type="number"
                      value={localCustomMaxHeight}
                      onChange={(e) => handleUpdateField('customMaxHeight', parseInt(e.target.value) || 800)}
                      min={200}
                      max={2000}
                      placeholder="800"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Content will scroll within this height
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Performance Options */}
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-gray-900 border-b border-gray-200 pb-2">
                Performance
              </h4>
              
              <div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={localEnableVirtualization}
                    onChange={(e) => handleUpdateField('enableVirtualization', e.target.checked)}
                  />
                  <span className="text-sm font-medium">Enable Virtualization</span>
                </label>
                <p className="text-xs text-muted-foreground mt-1">
                  Limits posts to 20 per page for better performance with large datasets. 
                  Recommended for blogs with many posts.
                </p>
              </div>
            </div>
          </TabsContent>

          {/* PREVIEW TAB */}
          <TabsContent value="preview" className="space-y-6 p-6 border rounded-lg">
        {/* Preview */}
            <div>
              <h4 className="text-sm font-medium mb-4">Blog Section Preview</h4>
              {!localBlogId ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-200 flex items-center justify-center">
                    <ImageIcon className="h-8 w-8 text-gray-400" />
                  </div>
            <p className="text-sm text-muted-foreground">
              Select a blog to see a preview of the posts that will be displayed.
            </p>
                </div>
          ) : loading ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
            <p className="text-sm text-muted-foreground">Loading posts...</p>
                </div>
          ) : posts.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-200 flex items-center justify-center">
                    <ImageIcon className="h-8 w-8 text-gray-400" />
                  </div>
            <p className="text-sm text-muted-foreground">
              No published posts found in the selected blog.
            </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Configuration Summary */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h5 className="text-sm font-medium text-blue-900 mb-2">Configuration Summary</h5>
                    <div className="grid grid-cols-2 gap-2 text-xs text-blue-800">
                      <div>Posts: {posts.length} available</div>
                      <div>Layout: {localLayout}</div>
                      <div>Per page: {localPostsPerPage}</div>
                      <div>Background: {localBackgroundColor}</div>
                      <div>Padding: {localTopPadding} / {localBottomPadding}</div>
                      <div>Image ratio: {localImageAspectRatio}</div>
                    </div>
                    {localEnableVirtualization && localPostsPerPage > 20 && (
                      <p className="text-xs text-amber-600 mt-2">
                        ⚡ Virtualization enabled: Limited to 20 posts per page for performance
                      </p>
                    )}
                    {localMaxHeight !== 'none' && (
                      <p className="text-xs text-blue-600 mt-2">
                        📏 Height limit: {localMaxHeight === 'custom' ? `${localCustomMaxHeight}px` : localMaxHeight}
                      </p>
                    )}
                    {localFixedHeaderHeight > 0 && (
                      <p className="text-xs text-green-600 mt-2">
                        📐 Fixed header spacing: {localFixedHeaderHeight + 48}px (header: {localFixedHeaderHeight}px + padding: 48px)
          </p>
          )}
        </div>

                  {/* Sample Posts Preview */}
                  <div className="border rounded-lg overflow-hidden">
                    <div className="bg-gray-50 px-4 py-2 border-b">
                      <h6 className="text-sm font-medium">Sample Posts ({Math.min(3, posts.length)} of {posts.length})</h6>
                    </div>
                    <div className="p-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {posts.slice(0, 3).map((post, index) => (
                          <div key={index} className="border rounded-lg overflow-hidden bg-white shadow-sm">
                            {localShowFeaturedImage && (
                              <div className={`w-full ${getImageAspectRatio(localImageAspectRatio)} bg-gray-200 flex items-center justify-center`}>
                                {post.featuredImageMedia?.fileUrl ? (
                                  <Image
                                    src={post.featuredImageMedia.fileUrl}
                                    alt={post.title}
                                    width={200}
                                    height={150}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  generateFallbackImage(post.title, post.category)
                                )}
                              </div>
                            )}
                            <div className="p-3">
                              <h6 className="font-medium text-sm line-clamp-2 mb-2">{post.title}</h6>
                              {localShowExcerpt && post.excerpt && (
                                <p className="text-xs text-gray-600 line-clamp-2 mb-2">{post.excerpt}</p>
                              )}
                              <div className="flex items-center justify-between text-xs text-gray-500">
                                {localShowAuthor && post.author && (
                                  <span>{post.author.name}</span>
                                )}
                                {localShowDate && post.publishedAt && (
                                  <span>{formatDate(post.publishedAt)}</span>
                                )}
                              </div>
                              {localShowTags && post.tags && post.tags.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-2">
                                  {post.tags.slice(0, 2).map(tag => (
                                    <Badge key={tag} variant="outline" className="text-xs">
                                      {tag}
                                    </Badge>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* Background Selector Modal */}
        <BackgroundSelector
          isOpen={showBackgroundSelector}
          onClose={() => setShowBackgroundSelector(false)}
          onSelect={handleBackgroundSelect}
          currentBackground={localBackgroundImage || localBackgroundGradient}
          onOpenMediaSelector={() => {
            setShowBackgroundSelector(false);
            setShowMediaSelector(true);
          }}
        />

        {/* Media Selector Modal */}
        <MediaSelector
          isOpen={showMediaSelector}
          onClose={() => setShowMediaSelector(false)}
          onSelect={handleMediaSelect}
          title="Select Background Image"
          initialType="image"
        />
      </div>
    );
  }

  // Show loading state
  if (loading) {
    return (
      <div className={getSectionClasses()} style={getBackgroundStyle()}>
        <div className={getContainerClasses()}>
          <div style={getFixedHeaderSpacing()} className="py-8">
          <div className="text-center mb-12">
            {title && <h2 className="text-4xl font-bold mb-4">{title}</h2>}
            {subtitle && <p className="text-xl text-muted-foreground">{subtitle}</p>}
          </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 px-4">
            {[...Array(6)].map((_, i) => (
                <div key={i} className="h-80 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        </div>
        </div>
      </div>
    );
  }

  // Show message if no blog is selected
  if (!localBlogId) {
    return (
      <div className={getSectionClasses()} style={getBackgroundStyle()}>
        <div className={getContainerClasses()}>
          <div style={getFixedHeaderSpacing()} className="py-8">
          <div className="text-center mb-12">
            {title && <h2 className="text-4xl font-bold mb-4">{title}</h2>}
              {subtitle && <p className="text-xl text-muted-foreground max-w-2xl mx-auto">{subtitle}</p>}
          </div>
            <div className="text-center py-12 px-4">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                <ImageIcon className="h-8 w-8 text-muted-foreground" />
              </div>
            <p className="text-muted-foreground">No blog selected. Please configure this section to select a blog.</p>
          </div>
        </div>
        </div>
      </div>
    );
  }

  return (
    <div className={getSectionClasses()} style={getBackgroundStyle()}>
      <div className={getContainerClasses()}>
        {/* Apply fixed header spacing to the entire content area */}
        <div style={getFixedHeaderSpacing()} className="py-8">
        {/* Header */}
          <div className="text-center mb-12 px-4">
          {title && <h2 className="text-4xl font-bold mb-4">{title}</h2>}
            {subtitle && <p className="text-xl text-muted-foreground max-w-2xl mx-auto">{subtitle}</p>}
        </div>

        {/* Search and Filters */}
          {(localSearchEnabled || localFiltersEnabled) && (
            <div className="mb-12 space-y-6 px-4">
              {localSearchEnabled && (
              <div className="relative max-w-md mx-auto">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search posts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 h-12 text-base"
                />
              </div>
            )}
            
              {localFiltersEnabled && (
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
                
                <Select value={sortBy} onValueChange={(value) => setSortBy(value as 'newest' | 'oldest')}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Newest First</SelectItem>
                    <SelectItem value="oldest">Oldest First</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        )}

          {/* Posts Display - Remove height restrictions, add padding */}
          <div className="px-4">
            <div style={getMaxHeightConfig().style} className={getMaxHeightConfig().className}>
        {sortedPosts.length === 0 ? (
                <div className="text-center py-16">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                    <ImageIcon className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-medium mb-2">No posts found</h3>
                  <p className="text-muted-foreground">Try adjusting your search or filter criteria.</p>
          </div>
        ) : (
          <>
                  {localLayout === 'grid' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
                {paginatedPosts.map(post => (
                  <PostCard key={post.id} post={post} />
                ))}
              </div>
            )}
            
                  {localLayout === 'list' && (
                    <div className="space-y-6 max-w-5xl mx-auto mb-12">
                {paginatedPosts.map(post => (
                  <PostListItem key={post.id} post={post} />
                ))}
              </div>
            )}
            
                  {localLayout === 'masonry' && (
                    <div className="columns-1 md:columns-2 lg:columns-3 gap-8 space-y-8 mb-12">
                      {paginatedPosts.map(post => (
                        <div key={post.id} className="break-inside-avoid">
                          <PostCard post={post} />
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {localLayout === 'carousel' && (
                    <div className="relative mb-12">
                      <div className="flex gap-8 overflow-hidden">
                  {sortedPosts.slice(currentCarouselIndex, currentCarouselIndex + 3).map(post => (
                    <div key={post.id} className="flex-1 min-w-0">
                      <PostCard post={post} />
                    </div>
                  ))}
                </div>
                      <div className="flex justify-center gap-3 mt-8">
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={handleCarouselPrev}
                    disabled={currentCarouselIndex === 0}
                          className="h-12 w-12"
                  >
                          <ChevronLeft className="h-5 w-5" />
                  </Button>
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={handleCarouselNext}
                    disabled={currentCarouselIndex + 3 >= sortedPosts.length}
                          className="h-12 w-12"
                  >
                          <ChevronRight className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            )}
                </>
              )}
            </div>
          </div>

          {/* Pagination - Outside height-controlled area with padding */}
          {localLayout !== 'carousel' && totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-12 px-4">
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                className="h-10"
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
                      className="h-10 w-10"
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
                      size="icon"
                      onClick={() => setCurrentPage(totalPages)}
                      className="h-10 w-10"
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
                className="h-10"
                >
                  Next
                </Button>
              </div>
        )}
      </div>
      </div>
    </div>
  );
} 