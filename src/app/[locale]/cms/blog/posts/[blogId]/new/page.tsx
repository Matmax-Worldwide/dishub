
import { PostCreateForm } from '@/components/cms/blog/post/PostCreateForm';

interface ServerPageProps {
  params: Promise<{ 
    blogId: string;
    locale: string;
  }>;
}

export default async function CreatePostPage(props: ServerPageProps) {
  const { blogId, locale } = await props.params;
  return <PostCreateForm blogId={blogId} locale={locale} />;
} 