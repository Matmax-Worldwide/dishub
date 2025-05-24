
import { BlogPageContent } from '@/components/cms/blog/BlogPageContent';

interface ServerPageProps {
  params: Promise<{ 
    locale: string;
  }>;
}

export default async function BlogsPage(props: ServerPageProps) {
  const { locale } = await props.params;
  return <BlogPageContent locale={locale} />;
} 