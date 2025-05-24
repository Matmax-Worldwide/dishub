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
  return <BlogEditPageContent blogId={params.id} locale={params.locale} />;
} 