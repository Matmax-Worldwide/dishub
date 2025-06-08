'use client';

import React from 'react';
import { AlertCircleIcon } from 'lucide-react';
import { useI18n } from '@/hooks/useI18n';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface PageExitConfirmationDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  onCancel: () => void;
}

export function PageExitConfirmationDialog({
  isOpen,
  onOpenChange,
  onConfirm,
  onCancel
}: PageExitConfirmationDialogProps) {
  const { t } = useI18n();
  
  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center text-amber-600">
            <AlertCircleIcon className="h-5 w-5 mr-2" />
            <span>{t('cms.unsavedChanges')}</span>
          </AlertDialogTitle>
          <AlertDialogDescription>
            {t('cms.unsavedChangesDescription')}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col sm:flex-row gap-2">
          <AlertDialogCancel onClick={onCancel}>
            {t('common.cancel')}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-red-600 hover:bg-red-700"
          >
            {t('cms.exitWithoutSaving')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
} 