'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import StableInput from './StableInput';
import { Calendar, User, Tag, Clock } from 'lucide-react';

interface ArticleSectionProps {
  title?: string;
  subtitle?: string;
  author?: string;
  authorImage?: string;
  publishDate?: string;
  readTime?: string;
  content: string;
  featuredImage?: string;
  featuredImageAlt?: string;
  tags?: string[];
  isEditing?: boolean;
  onUpdate?: (data: Partial<ArticleSectionProps>) => void;
}

export default function ArticleSection({
  title,
  subtitle,
  author,
  authorImage,
  publishDate,
  readTime,
  content,
  featuredImage,
  featuredImageAlt,
  tags = [],
  isEditing = false,
  onUpdate
}: ArticleSectionProps) {
  // Local state to maintain during typing
  const [localData, setLocalData] = useState({
    title: title || '',
    subtitle: subtitle || '',
    author: author || '',
    authorImage: authorImage || '',
    publishDate: publishDate || new Date().toISOString().split('T')[0],
    readTime: readTime || '5 min read',
    content: content || '',
    featuredImage: featuredImage || '',
    featuredImageAlt: featuredImageAlt || '',
    tags: tags || []
  });
  
  // Track if we're actively editing to prevent props from overriding local state
  const isEditingRef = useRef(false);
  
  // Optimize debounce updates
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  
  // Update local state when props change but only if not currently editing
  useEffect(() => {
    if (!isEditingRef.current) {
      setLocalData({
        title: title || '',
        subtitle: subtitle || '',
        author: author || '',
        authorImage: authorImage || '',
        publishDate: publishDate || new Date().toISOString().split('T')[0],
        readTime: readTime || '5 min read',
        content: content || '',
        featuredImage: featuredImage || '',
        featuredImageAlt: featuredImageAlt || '',
        tags: tags || []
      });
    }
  }, [title, subtitle, author, authorImage, publishDate, readTime, content, featuredImage, featuredImageAlt, tags]);
  
  // Optimize update handler with debouncing
  const handleUpdateField = useCallback((field: string, value: string) => {
    if (onUpdate) {
      // Mark that we're in editing mode
      isEditingRef.current = true;
      
      // Clear any pending debounce
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      
      // Update local state immediately
      setLocalData(prev => ({
        ...prev,
        [field]: value
      }));
      
      // Set timeout to update parent
      debounceRef.current = setTimeout(() => {
        const updatedData = {
          ...localData,
          [field]: value
        };
        onUpdate(updatedData);
        
        // Reset editing flag after a short delay
        setTimeout(() => {
          isEditingRef.current = false;
        }, 500);
      }, 200);
    }
  }, [onUpdate, localData]);
  
  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);
  
  // Handle tags update
  const handleTagsChange = useCallback((tagString: string) => {
    const newTags = tagString.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
    handleUpdateField('tags', newTags.join(','));
  }, [handleUpdateField]);

  return (
    <article className={cn(
      "w-full",
      isEditing ? "rounded-lg" : "bg-card text-card-foreground rounded-lg shadow-sm"
    )}>
      <div className="max-w-4xl mx-auto">
        {isEditing ? (
          <div className="w-full bg-white/95 backdrop-blur-sm border border-gray-200/60 rounded-xl shadow-lg shadow-gray-900/5 ring-1 ring-gray-900/5">
            <div className="flex space-x-1  to-gray-100/80 p-2 rounded-t-xl border-b border-gray-200/50">
              <button className="flex items-center gap-2 px-6 py-3 text-sm font-semibold rounded-lg transition-all duration-200 hover:bg-white/60 active:scale-[0.98] bg-white shadow-md shadow-gray-900/10 ring-1 ring-gray-900/5 text-gray-900">
                <Calendar className="w-4 h-4" />
                Article Content
              </button>
            </div>
            
            <div className="p-8 space-y-8 max-h-[650px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
              {/* Featured Image Section */}
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className="w-1 h-6 bg-gradient-to-b from-blue-500 to-blue-600 rounded-full"></div>
                  <h3 className="text-lg font-semibold text-gray-900">Featured Image</h3>
                </div>
                <div className="pl-6 space-y-4">
                  <StableInput
                    value={localData.featuredImage}
                    onChange={(value) => handleUpdateField('featuredImage', value)}
                    placeholder="Enter featured image URL..."
                    label="Featured Image URL"
                    debounceTime={300}
                    data-field-id="featuredImage"
                    data-component-type="Article"
                  />
                  <StableInput
                    value={localData.featuredImageAlt}
                    onChange={(value) => handleUpdateField('featuredImageAlt', value)}
                    placeholder="Featured image alt text..."
                    label="Featured Image Alt Text"
                    debounceTime={300}
                    data-field-id="featuredImageAlt"
                    data-component-type="Article"
                  />
                </div>
              </div>
              
              {/* Article Content Section */}
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className="w-1 h-6 bg-gradient-to-b from-green-500 to-green-600 rounded-full"></div>
                  <h3 className="text-lg font-semibold text-gray-900">Article Content</h3>
                </div>
                <div className="pl-6 space-y-4">
                  <StableInput
                    value={localData.title}
                    onChange={(value) => handleUpdateField('title', value)}
                    placeholder="Enter article title..."
                    className="font-bold text-2xl"
                    label="Article Title"
                    debounceTime={300}
                    data-field-id="title"
                    data-component-type="Article"
                  />
                  
                  <StableInput
                    value={localData.subtitle}
                    onChange={(value) => handleUpdateField('subtitle', value)}
                    placeholder="Enter article subtitle or summary..."
                    className="text-lg"
                    label="Subtitle/Summary"
                    debounceTime={300}
                    data-field-id="subtitle"
                    data-component-type="Article"
                  />
                  
                  <StableInput
                    value={localData.content}
                    onChange={(value) => handleUpdateField('content', value)}
                    placeholder="Enter article content..."
                    isTextArea={true}
                    rows={15}
                    className="text-base"
                    label="Article Content"
                    debounceTime={300}
                    data-field-id="content"
                    data-component-type="Article"
                  />
                </div>
              </div>

              {/* Author and Meta Information Section */}
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className="w-1 h-6 bg-gradient-to-b from-purple-500 to-purple-600 rounded-full"></div>
                  <h3 className="text-lg font-semibold text-gray-900">Author & Meta Information</h3>
                </div>
                <div className="pl-6 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <StableInput
                      value={localData.author}
                      onChange={(value) => handleUpdateField('author', value)}
                      placeholder="Author name..."
                      label="Author"
                      debounceTime={300}
                      data-field-id="author"
                      data-component-type="Article"
                    />
                    
                    <StableInput
                      value={localData.authorImage}
                      onChange={(value) => handleUpdateField('authorImage', value)}
                      placeholder="Author image URL..."
                      label="Author Image URL"
                      debounceTime={300}
                      data-field-id="authorImage"
                      data-component-type="Article"
                    />
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Publish Date</label>
                      <input
                        type="date"
                        value={localData.publishDate}
                        onChange={(e) => handleUpdateField('publishDate', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        data-field-id="publishDate"
                        data-component-type="Article"
                      />
                    </div>
                    
                    <StableInput
                      value={localData.readTime}
                      onChange={(value) => handleUpdateField('readTime', value)}
                      placeholder="e.g., 5 min read"
                      label="Read Time"
                      debounceTime={300}
                      data-field-id="readTime"
                      data-component-type="Article"
                    />
                  </div>
                </div>
              </div>

              {/* Tags Section */}
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className="w-1 h-6 bg-gradient-to-b from-orange-500 to-orange-600 rounded-full"></div>
                  <h3 className="text-lg font-semibold text-gray-900">Tags</h3>
                </div>
                <div className="pl-6 space-y-4">
                  <StableInput
                    value={localData.tags.join(', ')}
                    onChange={handleTagsChange}
                    placeholder="Enter tags separated by commas..."
                    label="Tags"
                    debounceTime={300}
                    data-field-id="tags"
                    data-component-type="Article"
                  />
                  <p className="text-xs text-gray-500">Separate multiple tags with commas</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Featured Image */}
            {localData.featuredImage && (
              <div className="w-full h-96 relative mb-8 overflow-hidden rounded-t-lg">
                <img
                  src={localData.featuredImage}
                  alt={localData.featuredImageAlt || localData.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            
            <div className="p-8">
              {/* Title and Subtitle */}
              {localData.title && (
                <h1 className="text-4xl font-bold mb-4" data-field-type="title" data-component-type="Article">
                  {localData.title}
                </h1>
              )}
              
              {localData.subtitle && (
                <p className="text-xl text-muted-foreground mb-8" data-field-type="subtitle" data-component-type="Article">
                  {localData.subtitle}
                </p>
              )}
              
              {/* Author and Meta Info */}
              <div className="flex flex-wrap items-center gap-6 mb-8 text-sm text-muted-foreground">
                {localData.author && (
                  <div className="flex items-center gap-2">
                    {localData.authorImage && (
                      <img
                        src={localData.authorImage}
                        alt={localData.author}
                        className="w-8 h-8 rounded-full"
                      />
                    )}
                    <User className="h-4 w-4" />
                    <span>{localData.author}</span>
                  </div>
                )}
                
                {localData.publishDate && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>{new Date(localData.publishDate).toLocaleDateString()}</span>
                  </div>
                )}
                
                {localData.readTime && (
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span>{localData.readTime}</span>
                  </div>
                )}
              </div>
              
              {/* Tags */}
              {localData.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-8">
                  {localData.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                    >
                      <Tag className="h-3 w-3" />
                      {tag}
                    </span>
                  ))}
                </div>
              )}
              
              {/* Content */}
              <div className="prose prose-lg max-w-none" data-field-type="content" data-component-type="Article">
                {localData.content.split('\n').map((paragraph, index) => (
                  <p key={index} className="mb-4">
                    {paragraph}
                  </p>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </article>
  );
} 