'use client';

import { Metadata } from 'next';
import { BlogNewPageContent } from '@/components/cms/blog/BlogNewPageContent';

export const metadata: Metadata = {
  title: 'Blog Management | CMS',
  description: 'Manage blogs and posts',
};

export default function NewBlogPage({
  params
}: {
  params: { locale: string }
}) {
  // If you're seeing errors about "Property 'blog' does not exist on type 'PrismaClient'",
  // you need to regenerate the Prisma client with:
  // npx prisma generate
  return <BlogNewPageContent locale={params.locale} />;
} 