'use client';

// src/hooks/useFeatureAccess.tsx
import React, { createContext, useContext, ReactNode } from 'react';

// Feature types
export type FeatureType = 
  | 'CMS_ENGINE'
  | 'BLOG_MODULE' 
  | 'FORMS_MODULE'
  | 'BOOKING_ENGINE'
  | 'ECOMMERCE_ENGINE';

// Feature context type
interface FeatureContextType {
  features: FeatureType[];
  hasFeature: (feature: FeatureType) => boolean;
  hasAllFeatures: (features: FeatureType[]) => boolean;
  hasAnyFeature: (features: FeatureType[]) => boolean;
  getAvailableFeatures: () => FeatureType[];
  calculateCost: () => number;
  isLoading: boolean;
}

// Create context
const FeatureContext = createContext<FeatureContextType | null>(null);

// Provider props
interface FeatureProviderProps {
  children: ReactNode;
  features: FeatureType[];
  isLoading?: boolean;
}

// Feature Provider component
export const FeatureProvider: React.FC<FeatureProviderProps> = ({ 
  children, 
  features = [], 
  isLoading = false 
}) => {
  const hasFeature = (feature: FeatureType): boolean => {
    return features.includes(feature);
  };

  const hasAllFeatures = (requiredFeatures: FeatureType[]): boolean => {
    return requiredFeatures.every(feature => features.includes(feature));
  };

  const hasAnyFeature = (requiredFeatures: FeatureType[]): boolean => {
    return requiredFeatures.some(feature => features.includes(feature));
  };

  const getAvailableFeatures = (): FeatureType[] => {
    return features;
  };

  const calculateCost = (): number => {
    const pricing: Record<FeatureType, number> = {
      'CMS_ENGINE': 0,
      'BLOG_MODULE': 10,
      'FORMS_MODULE': 15,
      'BOOKING_ENGINE': 25,
      'ECOMMERCE_ENGINE': 35
    };
    
    return features.reduce((total, feature) => total + (pricing[feature] || 0), 0);
  };

  const value: FeatureContextType = {
    features,
    hasFeature,
    hasAllFeatures,
    hasAnyFeature,
    getAvailableFeatures,
    calculateCost,
    isLoading
  };

  return (
    <FeatureContext.Provider value={value}>
      {children}
    </FeatureContext.Provider>
  );
};

// Main hook
export const useFeatureAccess = (): FeatureContextType => {
  const context = useContext(FeatureContext);
  if (!context) {
    throw new Error('useFeatureAccess must be used within a FeatureProvider');
  }
  return context;
};

// Convenience hooks
export const useHasFeature = (feature: FeatureType): boolean => {
  const { hasFeature } = useFeatureAccess();
  return hasFeature(feature);
};

export const useHasAllFeatures = (features: FeatureType[]): boolean => {
  const { hasAllFeatures } = useFeatureAccess();
  return hasAllFeatures(features);
};

export const useHasAnyFeature = (features: FeatureType[]): boolean => {
  const { hasAnyFeature } = useFeatureAccess();
  return hasAnyFeature(features);
}; 