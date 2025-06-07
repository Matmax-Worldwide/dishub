
import { BlogNewPageContent } from '@/app/components/engines/cms/modules/blog/BlogNewPageContent';

interface ServerPageProps {
    params: Promise<{ 
      locale: string;
    }>;
  }

export default async function NewBlogPage(props: ServerPageProps) {
    const { locale } = await props.params;

  return <BlogNewPageContent locale={locale} />;
} 