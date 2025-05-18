'use client';

import React, { useEffect } from 'react';
import { useParams } from 'next/navigation';
import { PageEditor } from '@/components/cms/page-editor';
import { useTabContext } from '@/app/[locale]/cms/pages/layout';

interface PageParams {
  locale: string;
  slug: string;
  [key: string]: string;
}

export default function EditPageWithSections() {
  const params = useParams<PageParams>();
  const { locale, slug } = params;
  const { activeTab, setActiveTab } = useTabContext();
  
  useEffect(() => {
    // Al cargar la página, establecemos la tab activa a 'sections'
    console.log('EditPageWithSections: Setting initial tab to sections');
    setActiveTab('sections');
  }, [setActiveTab]);
  
  // Log para mostrar cambios en activeTab
  useEffect(() => {
    console.log('EditPageWithSections: activeTab changed to', activeTab);
  }, [activeTab]);
  
  return <PageEditor slug={slug} locale={locale} />;
}
