export interface OnboardingFeature {
  id: string;
  label: string;
  description: string;
  category: 'Engine' | 'Module' | 'Integration';
  dependencies?: string[];
  required?: boolean;
  icon?: string;
}

export const ONBOARDING_FEATURES: OnboardingFeature[] = [
  // Engines - Only the ones that exist in the (engines) folder
  {
    id: 'CMS_ENGINE',
    label: 'CMS Engine',
    description: 'Complete content management system with pages, media, and templates',
    category: 'Engine',
    required: true,
    icon: '📝'
  },
  {
    id: 'BOOKING_ENGINE',
    label: 'Booking Engine',
    description: 'Advanced booking system with calendar, services, and staff management',
    category: 'Engine',
    dependencies: ['CMS_ENGINE'],
    icon: '📅'
  },
  {
    id: 'ECOMMERCE_ENGINE',
    label: 'E-commerce Engine',
    description: 'Full e-commerce platform with products, orders, and payment processing',
    category: 'Engine',
    dependencies: ['CMS_ENGINE'],
    icon: '🛒'
  },
  {
    id: 'HRMS_ENGINE',
    label: 'HRMS Engine',
    description: 'Human resources management with employees, departments, and payroll',
    category: 'Engine',
    dependencies: ['CMS_ENGINE'],
    icon: '👥'
  },
  {
    id: 'LEGAL_ENGINE',
    label: 'Legal Engine',
    description: 'Legal management system with incorporations, appointments, and services',
    category: 'Engine',
    dependencies: ['CMS_ENGINE'],
    icon: '💼'
  },

  // Modules (automatically included - not shown in selection)
  {
    id: 'BLOG_MODULE',
    label: 'Blog Module',
    description: 'Blog functionality with posts, categories, and comments',
    category: 'Module',
    dependencies: ['CMS_ENGINE'],
    required: true,
    icon: '📰'
  },
  {
    id: 'FORMS_MODULE',
    label: 'Forms Module',
    description: 'Form builder with submissions, validation, and analytics',
    category: 'Module',
    dependencies: ['CMS_ENGINE'],
    required: true,
    icon: '📋'
  }
];

export const getFeaturesByCategory = (category: OnboardingFeature['category']) => {
  return ONBOARDING_FEATURES.filter(feature => feature.category === category);
};

export const getRequiredFeatures = () => {
  return ONBOARDING_FEATURES.filter(feature => feature.required);
};

export const getSelectableFeatures = () => {
  return ONBOARDING_FEATURES.filter(feature => feature.category === 'Engine');
};

export const getFeatureById = (id: string) => {
  return ONBOARDING_FEATURES.find(feature => feature.id === id);
};

export const validateFeatureDependencies = (selectedFeatures: string[]) => {
  const errors: string[] = [];
  
  selectedFeatures.forEach(featureId => {
    const feature = getFeatureById(featureId);
    if (feature?.dependencies) {
      feature.dependencies.forEach(depId => {
        if (!selectedFeatures.includes(depId)) {
          const depFeature = getFeatureById(depId);
          errors.push(`${feature.label} requires ${depFeature?.label || depId}`);
        }
      });
    }
  });
  
  return errors;
};

export const addFeatureWithDependencies = (
  currentFeatures: string[], 
  featureId: string
): string[] => {
  const feature = getFeatureById(featureId);
  const newFeatures = [...currentFeatures];
  
  // Add dependencies first
  if (feature?.dependencies) {
    feature.dependencies.forEach(depId => {
      if (!newFeatures.includes(depId)) {
        newFeatures.push(depId);
      }
    });
  }
  
  // Add the feature itself
  if (!newFeatures.includes(featureId)) {
    newFeatures.push(featureId);
  }
  
  return newFeatures;
};

export const removeFeatureWithDependents = (
  currentFeatures: string[], 
  featureId: string
): { newFeatures: string[]; removedDependents: string[] } => {
  const dependentFeatures = ONBOARDING_FEATURES.filter(f => 
    f.dependencies?.includes(featureId) && currentFeatures.includes(f.id)
  );
  
  if (dependentFeatures.length > 0) {
    // Cannot remove if other features depend on it
    return { 
      newFeatures: currentFeatures, 
      removedDependents: dependentFeatures.map(f => f.label) 
    };
  }
  
  // Safe to remove
  return { 
    newFeatures: currentFeatures.filter(id => id !== featureId), 
    removedDependents: [] 
  };
}; 