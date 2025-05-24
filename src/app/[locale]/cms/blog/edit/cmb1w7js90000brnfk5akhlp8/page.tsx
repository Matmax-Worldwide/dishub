'use client';

import { BlogEditPageContent } from '@/components/cms/blog/BlogEditPageContent';

export default function EditSpecificBlogPage({ 
  params 
}: { 
  params: { 
    locale: string;
  }
}) {
  // This page uses a hardcoded blog ID as requested in the prompt
  const blogId = 'cmb1w7js90000brnfk5akhlp8';
  
  return <BlogEditPageContent blogId={blogId} locale={params.locale} />;
} 