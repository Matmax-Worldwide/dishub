'use client';

import { BlogNewPageContent } from '@/components/cms/blog/BlogNewPageContent';

export default function NewBlogPage() {
  // If you're seeing errors about "Property 'blog' does not exist on type 'PrismaClient'",
  // you need to regenerate the Prisma client with:
  // npx prisma generate
  return <BlogNewPageContent />;
} 