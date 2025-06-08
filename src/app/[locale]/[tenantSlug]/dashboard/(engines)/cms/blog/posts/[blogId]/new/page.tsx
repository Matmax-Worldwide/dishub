import PostCreateForm from '@/components/engines/cms/modules/blog/post/PostCreateForm';
import { ClientProviders } from '@/components/ClientProviders';

// This is a server component
interface PageProps {
  params: Promise<{
    blogId: string;
    locale: string;
  }>;
}

export default async function CreatePostPage({ params }: PageProps) {
  const { blogId } = await params;
  
  return (
    <ClientProviders>
      <PostCreateForm blogId={blogId} />
    </ClientProviders>
  );
} 