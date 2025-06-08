'use client';

import React from 'react';
import { AlertCircleIcon } from 'lucide-react';
import { useI18n } from '@/hooks/useI18n';

export function UnsavedChangesBadge() {
  const { t } = useI18n();
  
  return (
    <div className="text-amber-600 bg-amber-50 text-sm px-3 py-1 rounded-full flex items-center">
      <AlertCircleIcon className="h-4 w-4 mr-1" />
      <span>{t('cms.unsavedChanges')}</span>
    </div>
  );
} 