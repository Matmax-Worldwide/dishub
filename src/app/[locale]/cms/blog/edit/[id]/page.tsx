'use client';

import { BlogEditPageContent } from '@/components/cms/blog/BlogEditPageContent';

export default function EditBlogPage({ 
  params 
}: { 
  params: { 
    id: string;
    locale: string;
  }
}) {
  // This page uses a hardcoded blog ID as requested in the prompt
  const blogId = params.id;
  const locale = params.locale;
  
  return <BlogEditPageContent blogId={blogId} locale={locale} />;
} 