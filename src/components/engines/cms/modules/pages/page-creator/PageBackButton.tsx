'use client';

import React from 'react';
import { ArrowLeftIcon } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { useI18n } from '@/hooks/useI18n';

interface PageBackButtonProps {
  onClick: () => void;
  textKey?: string;
}

export function PageBackButton({ onClick, textKey = "common.back" }: PageBackButtonProps) {
  const { t } = useI18n();
  
  return (
    <Button 
      variant="ghost" 
      size="sm" 
      className="flex items-center gap-1"
      onClick={onClick}
    >
      <ArrowLeftIcon className="h-4 w-4" />
      <span>{t(textKey)}</span>
    </Button>
  );
} 