'use client';

import { PostEditForm } from '@/components/cms/blog/post/PostEditForm';
import { useParams } from 'next/navigation';

// For client components, params is a regular object, not a Promise
export default function EditPostPage() {
  const params = useParams();
  const blogId = params.blogId as string;
  const id = params.id as string;
  const locale = params.locale as string;

  return <PostEditForm blogId={blogId} postId={id} locale={locale} />;
} 