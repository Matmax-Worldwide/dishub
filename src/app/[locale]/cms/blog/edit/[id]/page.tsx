'use client';

import { BlogEditPageContent } from '@/components/cms/blog/BlogEditPageContent';

// For client components, params is a regular object, not a Promise
export default function EditBlogPage({ 
  params 
}: { 
  params: { 
    id: string;
    locale: string;
  }
}) {
  const blogId = params.id;
  const locale = params.locale;
  
  return <BlogEditPageContent blogId={blogId} locale={locale} />;
} 