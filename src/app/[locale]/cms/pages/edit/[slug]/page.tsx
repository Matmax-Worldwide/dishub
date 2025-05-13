'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import PageEditor from '@/components/cms/page-editor/PageEditor';

interface PageParams {
  locale: string;
  slug: string;
  [key: string]: string;
}

export default function EditPageWithSections() {
  const params = useParams<PageParams>();
  const { locale, slug } = params;
  
  return <PageEditor slug={slug} locale={locale} />;
}
