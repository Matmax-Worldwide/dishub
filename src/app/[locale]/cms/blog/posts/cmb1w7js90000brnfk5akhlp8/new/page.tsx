'use client';

import { PostCreateForm } from '@/components/cms/blog/post/PostCreateForm';

export default function CreatePostPage({ 
  params 
}: { 
  params: { 
    locale: string;
  }
}) {
  // Using the specific blog ID from the URL structure
  const blogId = 'cmb1w7js90000brnfk5akhlp8';
  
  return <PostCreateForm blogId={blogId} locale={params.locale} />;
} 