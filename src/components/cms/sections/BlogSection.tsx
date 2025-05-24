'use client';

import React, { useState, useCallback } from 'react';
import StableInput from './StableInput';
import { Search, User, ChevronLeft, ChevronRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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

interface BlogSectionProps {
  title?: string;
  subtitle?: string;
  posts?: BlogPost[];
  layout?: 'grid' | 'list' | 'carousel';
  filtersEnabled?: boolean;
  searchEnabled?: boolean;
  postsPerPage?: number;
  showFeaturedImage?: boolean;
  showAuthor?: boolean;
  showDate?: boolean;
  showTags?: boolean;
  showExcerpt?: boolean;
  isEditing?: boolean;
  onUpdate?: (data: Partial<BlogSectionProps>) => void;
}

export default function BlogSection({
  title = 'Blog',
  subtitle = 'Latest articles and insights',
  posts = [],
  layout = 'grid',
  filtersEnabled = true,
  searchEnabled = true,
  postsPerPage = 9,
  showFeaturedImage = true,
  showAuthor = true,
  showDate = true,
  showTags = true,
  showExcerpt = true,
  isEditing = false,
  onUpdate
}: BlogSectionProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest'>('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const [currentCarouselIndex, setCurrentCarouselIndex] = useState(0);

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
    const dateA = new Date(a.publishedAt || '').getTime();
    const dateB = new Date(b.publishedAt || '').getTime();
    return sortBy === 'newest' ? dateB - dateA : dateA - dateB;
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

  // Post Card Component
  const PostCard = ({ post }: { post: BlogPost }) => (
    <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
      {showFeaturedImage && post.featuredImage && (
        <div className="w-full h-48 overflow-hidden rounded-t-lg">
          <img
            src={post.featuredImage}
            alt={post.title}
            className="w-full h-full object-cover"
          />
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
          <CardDescription className="line-clamp-3">
            {post.excerpt}
          </CardDescription>
        )}
      </CardContent>
      <CardFooter className="flex flex-col gap-2">
        {showAuthor && post.author && (
          <div className="flex items-center gap-2 w-full">
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
          <div className="flex flex-wrap gap-1 w-full">
            {post.tags.slice(0, 3).map(tag => (
              <Badge key={tag} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </CardFooter>
    </Card>
  );

  // List Item Component
  const PostListItem = ({ post }: { post: BlogPost }) => (
    <div className="flex gap-4 p-4 border rounded-lg hover:shadow-md transition-shadow cursor-pointer">
      {showFeaturedImage && post.featuredImage && (
        <div className="w-32 h-32 flex-shrink-0 overflow-hidden rounded-lg">
          <img
            src={post.featuredImage}
            alt={post.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-2">
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
        <h3 className="text-lg font-semibold mb-2">{post.title}</h3>
        {showExcerpt && post.excerpt && (
          <p className="text-muted-foreground line-clamp-2 mb-2">
            {post.excerpt}
          </p>
        )}
        <div className="flex items-center gap-4 text-sm">
          {showAuthor && post.author && (
            <div className="flex items-center gap-1">
              <User className="h-3 w-3" />
              <span className="text-muted-foreground">{post.author.name}</span>
            </div>
          )}
          {post.readTime && (
            <span className="text-muted-foreground">{post.readTime}</span>
          )}
          {showTags && post.tags && post.tags.length > 0 && (
            <div className="flex gap-1">
              {post.tags.slice(0, 2).map(tag => (
                <Badge key={tag} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  if (isEditing) {
    return (
      <div className="space-y-6 p-6 border rounded-lg">
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
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium">Layout</label>
            <Select value={layout} onValueChange={(value) => handleUpdateField('layout', value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="grid">Grid</SelectItem>
                <SelectItem value="list">List</SelectItem>
                <SelectItem value="carousel">Carousel</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <label className="text-sm font-medium">Posts Per Page</label>
            <Input
              type="number"
              value={postsPerPage}
              onChange={(e) => handleUpdateField('postsPerPage', parseInt(e.target.value))}
              min={1}
              max={50}
            />
          </div>
        </div>
        
        <div className="space-y-2">
          <label className="text-sm font-medium">Display Options</label>
          <div className="grid grid-cols-2 gap-2">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={searchEnabled}
                onChange={(e) => handleUpdateField('searchEnabled', e.target.checked)}
              />
              <span className="text-sm">Enable Search</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={filtersEnabled}
                onChange={(e) => handleUpdateField('filtersEnabled', e.target.checked)}
              />
              <span className="text-sm">Enable Filters</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={showFeaturedImage}
                onChange={(e) => handleUpdateField('showFeaturedImage', e.target.checked)}
              />
              <span className="text-sm">Show Featured Images</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={showAuthor}
                onChange={(e) => handleUpdateField('showAuthor', e.target.checked)}
              />
              <span className="text-sm">Show Author</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={showDate}
                onChange={(e) => handleUpdateField('showDate', e.target.checked)}
              />
              <span className="text-sm">Show Date</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={showTags}
                onChange={(e) => handleUpdateField('showTags', e.target.checked)}
              />
              <span className="text-sm">Show Tags</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={showExcerpt}
                onChange={(e) => handleUpdateField('showExcerpt', e.target.checked)}
              />
              <span className="text-sm">Show Excerpt</span>
            </label>
          </div>
        </div>
        
        <div className="p-4 bg-muted rounded-lg">
          <p className="text-sm text-muted-foreground">
            Note: Posts will be automatically fetched from the database when the page loads.
            Configure which posts to display using the CMS settings.
          </p>
        </div>
      </div>
    );
  }

  return (
    <section className="w-full py-16">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          {title && <h2 className="text-4xl font-bold mb-4">{title}</h2>}
          {subtitle && <p className="text-xl text-muted-foreground">{subtitle}</p>}
        </div>

        {/* Search and Filters */}
        {(searchEnabled || filtersEnabled) && (
          <div className="mb-8 space-y-4">
            {searchEnabled && (
              <div className="relative max-w-md mx-auto">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search posts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            )}
            
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

        {/* Posts Display */}
        {sortedPosts.length === 0 ? (
          <div className="text-center py-12">
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
            
            {layout === 'list' && (
              <div className="space-y-4 max-w-4xl mx-auto">
                {paginatedPosts.map(post => (
                  <PostListItem key={post.id} post={post} />
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
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <Button
                      key={page}
                      variant={page === currentPage ? 'default' : 'outline'}
                      size="icon"
                      onClick={() => setCurrentPage(page)}
                    >
                      {page}
                    </Button>
                  ))}
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
      </div>
    </section>
  );
} 