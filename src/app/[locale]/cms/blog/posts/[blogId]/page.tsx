'use client';

import { PostList } from '@/components/cms/blog/post/PostList';

export default function BlogPostsPage({ 
  params 
}: { 
  params: { 
    blogId: string;
    locale: string;
  }
}) {
  return <PostList blogId={params.blogId} locale={params.locale} />;
} 