'use client';

import React, { useState } from 'react';
import { SaveIcon } from 'lucide-react';
import {
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PageFormContent } from './PageFormContent';
import { useI18n } from '@/hooks/useI18n';

interface PageCreationCardProps {
  pageData: {
    title: string;
    slug: string;
    description: string;
    template: string;
    isPublished: boolean;
    pageType: string;
    locale: string;
    metaTitle: string;
    metaDescription: string;
  };
  onChange: (name: string, value: string | boolean) => void;
  onSave: () => void;
  isSaving: boolean;
}

export function PageCreationCard({ pageData, onChange, onSave, isSaving }: PageCreationCardProps) {
  const { t } = useI18n();
  const [showSaveButton, setShowSaveButton] = useState(false);

  const handleFormComplete = (completed: boolean) => {
    setShowSaveButton(completed);
  };

  return (
    <div className="w-full space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold tracking-tight">{t('cms.pageInfo')}</h2>
        <CardDescription className="text-base">
          {t('cms.pageInfoDescription')}
        </CardDescription>
      </div>
      
      <PageFormContent 
        pageData={pageData} 
        onChange={onChange}
        onComplete={handleFormComplete}
      />
      
      {showSaveButton && (
        <div className="flex justify-end pt-4 border-t">
          <Button 
            variant="default" 
            onClick={onSave}
            disabled={isSaving || !pageData.title || !pageData.slug}
            className="flex items-center gap-2 px-8 py-6 rounded-md shadow-md bg-primary hover:bg-primary/90 text-white transition-all"
            size="lg"
          >
            {isSaving ? (
              <>
                <span className="animate-spin h-5 w-5 border-2 border-white border-opacity-20 border-t-white rounded-full"></span>
                <span>{t('cms.saving')}</span>
              </>
            ) : (
              <>
                <SaveIcon className="h-5 w-5" />
                <span>{t('cms.createAndContinue')}</span>
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
} 