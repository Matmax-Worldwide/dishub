'use client';

import { PostEditForm } from '@/components/cms/blog/post/PostEditForm';

interface PageProps {
  params: {
    blogId: string;
    id: string;
    locale: string;
  }
}

export default function EditPostPage({ params }: PageProps) {
  return <PostEditForm blogId={params.blogId} postId={params.id} locale={params.locale} />;
} 