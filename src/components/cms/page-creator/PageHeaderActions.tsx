'use client';

import React from 'react';
import { UnsavedChangesBadge } from './UnsavedChangesBadge';
import { PageCancelButton } from './PageCancelButton';
import { PageSaveButton } from './PageSaveButton';

interface PageHeaderActionsProps {
  hasUnsavedChanges: boolean;
  isSaving: boolean;
  onSave: () => void;
  onCancel: () => void;
  saveDisabled?: boolean;
  saveTextKey?: string;
  cancelTextKey?: string;
}

export function PageHeaderActions({
  hasUnsavedChanges,
  isSaving,
  onSave,
  onCancel,
  saveDisabled = false,
  saveTextKey = "cms.createPage",
  cancelTextKey = "common.cancel"
}: PageHeaderActionsProps) {
  return (
    <div className="flex items-center gap-2">
      {hasUnsavedChanges && <UnsavedChangesBadge />}
      
      <PageCancelButton onClick={onCancel} textKey={cancelTextKey} />
      
      <PageSaveButton
        isSaving={isSaving}
        onClick={onSave}
        disabled={saveDisabled}
        textKey={saveTextKey}
      />
    </div>
  );
} 