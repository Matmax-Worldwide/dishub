'use client';

import { PostEditForm } from '@/components/cms/blog/post/PostEditForm';

interface PostEditPageProps {
  params: {
    blogId: string;
    id: string;
    locale: string;
  }
}

export default function EditPostPage({ params }: PostEditPageProps) {
  return <PostEditForm blogId={params.blogId} postId={params.id} locale={params.locale} />;
} 