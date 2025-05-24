'use client';

import { PostList } from '@/components/cms/blog/post/PostList';

export default function BlogPostsPage({ 
  params 
}: { 
  params: { 
    locale: string;
  }
}) {
  // Using the specific blog ID from the URL structure
  const blogId = 'cmb1w7js90000brnfk5akhlp8';
  
  return <PostList blogId={blogId} locale={params.locale} />;
} 