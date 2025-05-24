import { CreatePostForm } from '@/components/cms/blog/post/CreatePostForm';
import ClientProviders from '@/components/ClientProviders';

export default function CreatePostPage() {
  return (
    <ClientProviders>
      <CreatePostForm />
    </ClientProviders>
  );
} 