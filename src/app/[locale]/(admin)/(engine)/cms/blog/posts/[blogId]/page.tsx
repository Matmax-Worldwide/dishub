
import { PostList } from '@/components/engines/cms/blog/post/PostList';

interface ServerPageProps {
  params: Promise<{ 
    blogId: string;
    locale: string;
  }>;
}

export default async function BlogPostsPage(props: ServerPageProps) {
  const { blogId, locale } = await props.params;
  return <PostList blogId={blogId} locale={locale} />;
} 