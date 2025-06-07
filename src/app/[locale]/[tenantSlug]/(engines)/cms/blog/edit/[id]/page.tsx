import { BlogEditPageContent } from '@/app/components/engines/cms/modules/blog/BlogEditPageContent';

interface ServerPageProps {
  params: Promise<{ 
    id: string;
    locale: string;
  }>;
}

export default async function EditBlogPage(props: ServerPageProps) {
  // Await the params object to get locale and id safely
  const { id } = await props.params;

  return <BlogEditPageContent blogId={id} />;
} 