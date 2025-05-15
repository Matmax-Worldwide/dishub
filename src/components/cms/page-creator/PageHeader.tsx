'use client';

import React from 'react';
import { PageBackButton } from './PageBackButton';
import { PageHeaderActions } from './PageHeaderActions';

interface PageHeaderProps {
  hasUnsavedChanges: boolean;
  isSaving: boolean;
  onSave: () => void;
  onBack: () => void;
  title?: string;
}

export function PageHeader({
  hasUnsavedChanges,
  isSaving,
  onSave,
  onBack,
}: PageHeaderProps) {

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-4">
        <PageBackButton onClick={onBack} />
      </div>
      
      <PageHeaderActions
        hasUnsavedChanges={hasUnsavedChanges}
        isSaving={isSaving}
        onSave={onSave}
        onCancel={onBack}
        saveDisabled={isSaving}
        saveTextKey="cms.createPage"
      />
    </div>
  );
} 