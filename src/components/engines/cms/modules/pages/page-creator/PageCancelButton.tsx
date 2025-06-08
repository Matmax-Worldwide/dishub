'use client';

import React from 'react';
import { Button } from '@/app/components/ui/button';
import { useI18n } from '@/hooks/useI18n';

interface PageCancelButtonProps {
  onClick: () => void;
  textKey?: string;
}

export function PageCancelButton({ onClick, textKey = "common.cancel" }: PageCancelButtonProps) {
  const { t } = useI18n();
  
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={onClick}
    >
      {t(textKey)}
    </Button>
  );
} 