'use client';

import { PostEditForm } from '@/components/cms/blog/post/PostEditForm';

export default function EditPostPage({ 
  params 
}: { 
  params: { 
    id: string;
    locale: string;
  }
}) {
  // Using the specific blog ID from the URL structure
  const blogId = 'cmb1w7js90000brnfk5akhlp8';
  
  return <PostEditForm blogId={blogId} postId={params.id} locale={params.locale} />;
} 