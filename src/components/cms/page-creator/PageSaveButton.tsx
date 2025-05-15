'use client';

import React from 'react';
import { SaveIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/hooks/useI18n';

interface PageSaveButtonProps {
  isSaving: boolean;
  onClick: () => void;
  disabled?: boolean;
  textKey?: string;
  variant?: 'default' | 'footer';
}

export function PageSaveButton({ 
  isSaving, 
  onClick, 
  disabled = false, 
  textKey = "cms.createPage",
  variant = 'default'
}: PageSaveButtonProps) {
  const { t } = useI18n();
  const savingText = t('cms.saving');
  const buttonText = t(textKey);
  
  // For the header version
  if (variant === 'default') {
    return (
      <Button
        variant="default"
        size="sm"
        onClick={onClick}
        disabled={isSaving || disabled}
        className="flex items-center gap-1"
      >
        {isSaving ? (
          <>
            <span className="animate-spin h-4 w-4 border-2 border-white border-opacity-20 border-t-white rounded-full mr-1"></span>
            <span>{savingText}</span>
          </>
        ) : (
          <>
            <SaveIcon className="h-4 w-4" />
            <span>{buttonText}</span>
          </>
        )}
      </Button>
    );
  }
  
  // For the footer version
  return (
    <Button 
      variant="default" 
      onClick={onClick}
      disabled={isSaving || disabled}
      className="flex items-center gap-2"
    >
      {isSaving ? (
        <>
          <span className="animate-spin h-4 w-4 border-2 border-white border-opacity-20 border-t-white rounded-full"></span>
          <span>{savingText}</span>
        </>
      ) : (
        <>
          <SaveIcon className="h-4 w-4" />
          <span>{buttonText}</span>
        </>
      )}
    </Button>
  );
} 