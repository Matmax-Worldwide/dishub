import { PostEditForm } from '@/components/engines/cms/modules/blog/post/PostEditForm';

interface ServerPageProps {
  params: Promise<{ 
    blogId: string;
    id: string;
    locale: string;
  }>;
}

export default async function EditPostPage(props: ServerPageProps) {
  // Await the params object to get locale, blogId and id safely
  const { blogId, id, locale } = await props.params;
  
  return <PostEditForm blogId={blogId} postId={id} locale={locale} />;
} 