import { PostCreateForm } from '@/components/cms/blog/post/PostCreateForm';
import ClientProviders from '@/components/ClientProviders';

// This is a server component
interface PageProps {
  params: {
    blogId: string;
    locale: string;
  };
}

export default function CreatePostPage({ params }: PageProps) {
  const { blogId, locale } = params;
  
  return (
    <ClientProviders>
      <PostCreateForm blogId={blogId} locale={locale} />
    </ClientProviders>
  );
} 