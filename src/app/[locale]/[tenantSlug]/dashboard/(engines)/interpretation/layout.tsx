'use client';

import React from 'react';
import { useFeatureAccess } from '@/hooks/useFeatureAccess';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

interface InterpretationLayoutProps {
  children: React.ReactNode;
}

export default function InterpretationLayout({ children }: InterpretationLayoutProps) {
  const { features } = useFeatureAccess();
  const router = useRouter();

  useEffect(() => {
    if (!features.includes('INTERPRETATION_ENGINE')) {
      router.push('/404');
    }
  }, [features, router]);

  if (!features.includes('INTERPRETATION_ENGINE')) {
    return null;
  }

  return <>{children}</>;
} 