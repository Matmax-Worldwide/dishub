'use client';

import { Suspense } from 'react';
import { PostCreateForm } from '@/components/cms/blog/post/PostCreateForm';
import { SessionProvider } from 'next-auth/react';
import { Skeleton } from '@/components/ui/skeleton';

interface PageProps {
  params: { 
    blogId: string;
    locale: string;
  };
}

export default function CreatePostPage({ params }: PageProps) {
  const { blogId, locale } = params;
  
  return (
    <SessionProvider>
      <Suspense fallback={
        <div className="container mx-auto py-8 px-4 max-w-4xl">
          <div className="space-y-4">
            <Skeleton className="h-12 w-1/3" />
            <Skeleton className="h-96 w-full" />
          </div>
        </div>
      }>
        <PostCreateForm blogId={blogId} locale={locale} />
      </Suspense>
    </SessionProvider>
  );
} 