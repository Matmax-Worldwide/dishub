'use client';

import { PostCreateForm } from '@/components/cms/blog/post/PostCreateForm';

export default function CreatePostPage({ 
  params 
}: { 
  params: { 
    blogId: string;
    locale: string;
  }
}) {
  return <PostCreateForm blogId={params.blogId} locale={params.locale} />;
} 