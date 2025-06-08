// src/config/features.ts

export interface FeatureDefinition {
  id: string; // Unique key, e.g., 'CMS_ENGINE'
  label: string; // User-friendly label, e.g., 'CMS Engine'
  description?: string; // Optional description
  category?: 'Engine' | 'Module' | 'Integration'; // Optional for grouping in UI
  dependencies?: string[]; // Optional: List of feature IDs this feature depends on
}

export const AVAILABLE_FEATURES: FeatureDefinition[] = [
  {
    id: 'CMS_ENGINE',
    label: 'CMS Engine',
    description: 'Core Content Management System capabilities.',
    category: 'Engine',
  },
  {
    id: 'BOOKING_ENGINE',
    label: 'Booking Engine',
    description: 'Enables booking and scheduling functionalities.',
    category: 'Engine',
  },
  {
    id: 'ECOMMERCE_ENGINE',
    label: 'E-commerce Engine',
    description: 'Provides tools for online sales and product management.',
    category: 'Engine',
  },
  {
    id: 'BLOG_MODULE',
    label: 'Blog Module',
    description: 'Allows creation and management of blog posts.',
    category: 'Module',
    dependencies: ['CMS_ENGINE'], // Example dependency
  },
  {
    id: 'FORMS_MODULE',
    label: 'Forms Module',
    description: 'Enables building and managing custom forms.',
    category: 'Module',
  },
  {
    id: 'LEGAL_ENGINE',
    label: 'Legal Engine',
    description: 'Company incorporation and legal services management.',
    category: 'Engine',
  },
  // Examples of other potential features (commented out as per prompt)
  // {
  //   id: 'LOYALTY_ENGINE',
  //   label: 'Loyalty Engine',
  //   description: 'Manages customer loyalty programs.',
  //   category: 'Engine',
  // },
  // {
  //   id: 'MARKETPLACE_ENGINE',
  //   label: 'Marketplace Engine',
  //   description: 'Supports multi-vendor marketplace functionalities.',
  //   category: 'Engine',
  // },
];

// Helper function to get a feature by ID (optional)
export const getFeatureById = (id: string): FeatureDefinition | undefined => {
  return AVAILABLE_FEATURES.find(feature => feature.id === id);
};

// Helper function to get features by category (optional)
export const getFeaturesByCategory = (category: FeatureDefinition['category']): FeatureDefinition[] => {
  return AVAILABLE_FEATURES.filter(feature => feature.category === category);
};
