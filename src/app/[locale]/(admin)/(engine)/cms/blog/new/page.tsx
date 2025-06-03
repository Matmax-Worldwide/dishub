
import { BlogNewPageContent } from '@/components/engines/cms/blog/BlogNewPageContent';

interface ServerPageProps {
    params: Promise<{ 
      locale: string;
    }>;
  }

export default async function NewBlogPage(props: ServerPageProps) {
    const { locale } = await props.params;

  return <BlogNewPageContent locale={locale} />;
} 