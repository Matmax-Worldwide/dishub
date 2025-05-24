'use client';

import { BlogEditPageContent } from '@/components/cms/blog/BlogEditPageContent';

interface PageProps {
  params: {
    id: string;
    locale: string;
  }
}

export default function EditBlogPage({ params }: PageProps) {
  // Use the params directly since they're not a Promise in this context
  const blogId = params.id;
  const locale = params.locale;
  
  return <BlogEditPageContent blogId={blogId} locale={locale} />;
} 