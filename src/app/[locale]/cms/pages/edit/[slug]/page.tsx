'use client';

import React, { useEffect } from 'react';
import { useParams } from 'next/navigation';
import { PageEditor } from '@/components/cms/page-editor';
import { useTabContext } from '@/contexts/TabContext';

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
    // Al cargar la página de edición, siempre ir a la pestaña de secciones
    // porque ahora todas las páginas se crean con una sección automática
    console.log('EditPageWithSections: Setting initial tab to sections (auto-section created)');
    setActiveTab('sections');
  }, [setActiveTab]);
  
  // Log para mostrar cambios en activeTab
  useEffect(() => {
    console.log('EditPageWithSections: activeTab changed to', activeTab);
  }, [activeTab]);
  
  return <PageEditor slug={slug} locale={locale} />;
}
