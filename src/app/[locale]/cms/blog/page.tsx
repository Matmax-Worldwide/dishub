'use client';

import { BlogPageContent } from '@/components/cms/blog/BlogPageContent';

export default function BlogsPage({
  params
}: {
  params: { locale: string }
}) {
  return <BlogPageContent locale={params.locale} />;
} 