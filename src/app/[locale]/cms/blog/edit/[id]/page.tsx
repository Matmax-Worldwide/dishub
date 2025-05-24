import { BlogEditPageContent } from '@/components/cms/blog/BlogEditPageContent';

interface ServerPageProps {
  params: Promise<{ 
    id: string;
    locale: string;
  }>;
}

export default async function EditBlogPage(props: ServerPageProps) {
  // Await the params object to get locale and id safely
  const { id, locale } = await props.params;
  
  return <BlogEditPageContent blogId={id} locale={locale} />;
} 