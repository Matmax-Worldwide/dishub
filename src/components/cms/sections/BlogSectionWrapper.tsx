'use client';

import React from 'react';
import BlogSection from './BlogSection';

interface BlogSectionWrapperProps {
  // Section configuration
  title?: string;
  subtitle?: string;
  layout?: 'grid' | 'list' | 'carousel';
  filtersEnabled?: boolean;
  searchEnabled?: boolean;
  postsPerPage?: number;
  showFeaturedImage?: boolean;
  showAuthor?: boolean;
  showDate?: boolean;
  showTags?: boolean;
  showExcerpt?: boolean;
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