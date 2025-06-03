'use client';

// src/hooks/useFeatureAccess.tsx
import React, { createContext, useContext, ReactNode } from 'react';
import { 
  hasFeatureAccess, 
  hasAllFeatures, 
  hasAnyFeature, 
  getAvailableFeatures,
  isRouteAllowed,
  getMissingFeatures,
  calculateMonthlyCost
} from '@/lib/feature-access';

interface FeatureContextType {
  tenantFeatures: string[];
  tenantId: string | null;
  hasFeature: (featureId: string) => boolean;
  hasAllFeatures: (features: string[]) => boolean;
  hasAnyFeature: (features: string[]) => boolean;
  isRouteAllowed: (route: string) => boolean;
  getAvailableFeatures: () => import('@/config/features').FeatureDefinition[];
  getMissingFeatures: (required: string[]) => string[];
  calculateCost: (features?: string[]) => number;
}

const FeatureContext = createContext<FeatureContextType | null>(null);

interface FeatureProviderProps {
  children: ReactNode;
  tenantFeatures: string[];
  tenantId: string | null;
}

export function FeatureProvider({ children, tenantFeatures, tenantId }: FeatureProviderProps) {
  const contextValue: FeatureContextType = {
    tenantFeatures,
    tenantId,
    hasFeature: (featureId: string) => hasFeatureAccess(tenantFeatures, featureId),
    hasAllFeatures: (features: string[]) => hasAllFeatures(tenantFeatures, features),
    hasAnyFeature: (features: string[]) => hasAnyFeature(tenantFeatures, features),
    isRouteAllowed: (route: string) => isRouteAllowed(tenantFeatures, route),
    getAvailableFeatures: () => getAvailableFeatures(tenantFeatures),
    getMissingFeatures: (required: string[]) => getMissingFeatures(tenantFeatures, required),
    calculateCost: (features?: string[]) => calculateMonthlyCost(features || tenantFeatures),
  };

  return (
    <FeatureContext.Provider value={contextValue}>
      {children}
    </FeatureContext.Provider>
  );
}

export function useFeatureAccess() {
  const context = useContext(FeatureContext);
  if (!context) {
    throw new Error('useFeatureAccess must be used within a FeatureProvider');
  }
  return context;
}

// Hook específico para verificar una feature
export function useHasFeature(featureId: string): boolean {
  const { hasFeature } = useFeatureAccess();
  return hasFeature(featureId);
}

// Hook para verificar múltiples features
export function useHasAllFeatures(features: string[]): boolean {
  const { hasAllFeatures } = useFeatureAccess();
  return hasAllFeatures(features);
}

// Hook para verificar si al menos una feature está disponible
export function useHasAnyFeature(features: string[]): boolean {
  const { hasAnyFeature } = useFeatureAccess();
  return hasAnyFeature(features);
} 