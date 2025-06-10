'use client';

// src/hooks/useFeatureAccess.tsx
import React, { createContext, useContext, ReactNode } from 'react';

// Feature types
export type FeatureType = 
  | 'CMS_ENGINE'
  | 'BLOG_MODULE' 
  | 'FORMS_MODULE'
  | 'BOOKING_ENGINE'
  | 'ECOMMERCE_ENGINE'
  | 'LEGAL_ENGINE'
  | 'HRMS_ENGINE'
  | 'INTERPRETATION_ENGINE';

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
      'ECOMMERCE_ENGINE': 35,
      'LEGAL_ENGINE': 75,
      'HRMS_ENGINE': 50,
      'INTERPRETATION_ENGINE': 40
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
    // Instead of throwing error immediately, provide fallback values
    console.warn('useFeatureAccess used outside FeatureProvider, providing fallback values');
    return {
      features: ['CMS_ENGINE'], // Default fallback features
      hasFeature: (feature: FeatureType) => feature === 'CMS_ENGINE',
      hasAllFeatures: (features: FeatureType[]) => features.every(f => f === 'CMS_ENGINE'),
      hasAnyFeature: (features: FeatureType[]) => features.includes('CMS_ENGINE'),
      getAvailableFeatures: () => ['CMS_ENGINE'],
      calculateCost: () => 0,
      isLoading: false
    };
  }
  return context;
};

// Convenience hooks with fallback handling
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