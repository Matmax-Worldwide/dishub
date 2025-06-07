'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { NotificationAlert } from '@/app/components/engines/cms/modules/pages/page-creator/NotificationAlert';
import { PageCreationCard } from '@/app/components/engines/cms/modules/pages/page-creator/PageCreationCard';
import { PageExitConfirmationDialog } from '@/app/components/engines/cms/modules/pages/page-creator/PageExitConfirmationDialog';
import { PageHeader } from '@/app/components/engines/cms/modules/pages/page-creator/PageHeader';
import { cmsOperations } from '@/lib/graphql-client';
import { useI18n } from '@/hooks/useI18n';

interface PageInfo {
  id: string;
  title: string;
  slug: string;
  description: string;
  template: string;
  isPublished: boolean;
  pageType: string;
  locale: string;
  sections: string[]; // Array of section IDs
  metaTitle: string;
  metaDescription: string;
  featuredImage: string;
  isDefault: boolean;
}

// Main Component
export default function CreatePageWithSections() {
  const params = useParams();
  const router = useRouter();
  const { t } = useI18n();
  
  // Page data state
  const [pageData, setPageData] = useState<PageInfo>({
    id: '',
    title: '',
    slug: '',
    description: '',
    template: 'default',
    isPublished: false,
    pageType: 'LANDING',
    locale: params.locale as string,
    sections: [],
    metaTitle: '',
    metaDescription: '',
    featuredImage: '',
    isDefault: false
  });
  
  // UI states
  const [isSaving, setIsSaving] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isExitConfirmationOpen, setIsExitConfirmationOpen] = useState(false);
  const [redirectTarget, setRedirectTarget] = useState('');
  
  // Exit confirmation
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = ''; // Required for Chrome
        return '';
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [hasUnsavedChanges]);
  
  // Generate slug from title
  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };
  
  // Handle title change and auto-generate slug if not manually edited
  const handleTitleChange = (name: string, value: string) => {
    if (name !== 'title') return;
    
    const newTitle = value;
    const currentSlug = pageData.slug;
    
    // If the current slug is empty or was auto-generated from the previous title,
    // then update it with the new title
    const shouldUpdateSlug = 
      !currentSlug || 
      currentSlug === generateSlug(pageData.title || '');
    
    setPageData(prev => ({
      ...prev,
      title: newTitle,
      ...(shouldUpdateSlug ? { slug: generateSlug(newTitle) } : {})
    }));
    
    setHasUnsavedChanges(true);
  };
  
  // Handle general input changes
  const handleInputChange = (name: string, value: string | boolean) => {
    if (name === 'title') {
      handleTitleChange(name, value as string);
      return;
    }
    
    setPageData(prev => ({ ...prev, [name]: value }));
    setHasUnsavedChanges(true);
  };
  
  // Save the page and redirect to edit
  const handleSavePage = async () => {
    if (!pageData.title || !pageData.slug) {
      setNotification({
        type: 'error',
        message: t('cms.titleAndSlugRequired')
      });
      return;
    }
    
    setIsSaving(true);
    
    try {
      // Step 1: Create the page
      const result = await cmsOperations.createPage({
        title: pageData.title,
        slug: pageData.slug,
        description: pageData.description,
        template: pageData.template,
        isPublished: pageData.isPublished,
        metaTitle: pageData.metaTitle,
        metaDescription: pageData.metaDescription,
        pageType: pageData.pageType,
        locale: pageData.locale,
        isDefault: pageData.isDefault
      });
      
      if (result && result.success && result.page && result.page.id) {
        console.log('Página creada exitosamente:', result);
        
        setNotification({
          type: 'success',
          message: 'Página creada exitosamente'
        });
        
        setHasUnsavedChanges(false);
        
        // Navigate to the edit page for the newly created page
        setTimeout(() => {
          router.push(`/${params.locale}/cms/pages/edit/${pageData.slug}`);
        }, 1000);
      } else {
        throw new Error(result?.message || 'Error al crear la página');
      }
    } catch (error) {
      console.error('Error al crear la página:', error);
      
      setNotification({
        type: 'error',
        message: error instanceof Error ? error.message : 'Error al crear la página'
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  // Handle cancel/back button
  const handleCancel = () => {
    if (hasUnsavedChanges) {
      setRedirectTarget(`/${params.locale}/cms/pages`);
      setIsExitConfirmationOpen(true);
    } else {
      router.push(`/${params.locale}/cms/pages`);
    }
  };
  
  // Confirm exit without saving
  const handleConfirmExit = () => {
    setIsExitConfirmationOpen(false);
    
    if (redirectTarget) {
      router.push(redirectTarget);
    }
  };
  
  // Cancel exit
  const handleCancelExit = () => {
    setIsExitConfirmationOpen(false);
    setRedirectTarget('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        hasUnsavedChanges={hasUnsavedChanges}
        isSaving={isSaving}
        onSave={handleSavePage}
        onBack={handleCancel}
      />
      
      {/* Notification */}
      {notification && (
        <NotificationAlert
          type={notification.type}
          message={notification.message}
        />
      )}
      
      {/* Main Form */}
      <PageCreationCard
        pageData={pageData}
        onChange={handleInputChange}
        onSave={handleSavePage}
        isSaving={isSaving}
      />
      
      {/* Exit Confirmation */}
      <PageExitConfirmationDialog 
        isOpen={isExitConfirmationOpen}
        onOpenChange={setIsExitConfirmationOpen}
        onConfirm={handleConfirmExit}
        onCancel={handleCancelExit}
      />
    </div>
  );
} 