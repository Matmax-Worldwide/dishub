'use client';

import { PostEditForm } from '@/components/cms/blog/post/PostEditForm';

// For client components, params is a regular object, not a Promise
export default function EditPostPage({ 
  params 
}: { 
  params: { 
    blogId: string;
    id: string;
    locale: string;
  }
}) {
  return <PostEditForm blogId={params.blogId} postId={params.id} locale={params.locale} />;
} 