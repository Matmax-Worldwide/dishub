'use client';

import React from 'react';
import BlogSection from './BlogSection';

interface BlogSectionWrapperProps {
  // Section configuration
  title?: string;
  subtitle?: string;
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
  fixedHeaderHeight?: number;
  maxHeight?: 'none' | 'screen' | 'half-screen' | 'custom';
  customMaxHeight?: number;
  enableVirtualization?: boolean;
  backgroundImage?: string;
  backgroundGradient?: string;
  // Filter configuration
  blogId?: string;
  status?: 'PUBLISHED' | 'DRAFT';
  authorId?: string;
  tags?: string[];
  categories?: string[];
  limit?: number;
  // CMS editing
  isEditing?: boolean;
  onUpdate?: (data: Partial<BlogSectionWrapperProps>) => void;
}

export default function BlogSectionWrapper(props: BlogSectionWrapperProps) {
  // Simply pass through all props to BlogSection
  // BlogSection now handles all the data fetching and blog selection
  return <BlogSection {...props} />;
} 