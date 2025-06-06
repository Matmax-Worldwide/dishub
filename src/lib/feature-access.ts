import { AVAILABLE_FEATURES, FeatureDefinition } from '@/config/features';

export interface TenantFeatureAccess {
  tenantId: string;
  features: string[];
  plan?: string;
  expiresAt?: Date;
}

/**
 * Verifica si un tenant tiene acceso a una feature específica
 */
export function hasFeatureAccess(
  tenantFeatures: string[], 
  featureId: string
): boolean {
  // CMS_ENGINE siempre está disponible
  if (featureId === 'CMS_ENGINE') {
    return true;
  }
  
  return tenantFeatures.includes(featureId);
}

/**
 * Verifica si un tenant tiene acceso a múltiples features (requiere todas)
 */
export function hasAllFeatures(
  tenantFeatures: string[], 
  requiredFeatures: string[]
): boolean {
  return requiredFeatures.every(feature => hasFeatureAccess(tenantFeatures, feature));
}

/**
 * Verifica si un tenant tiene acceso a al menos una de las features
 */
export function hasAnyFeature(
  tenantFeatures: string[], 
  features: string[]
): boolean {
  return features.some(feature => hasFeatureAccess(tenantFeatures, feature));
}

/**
 * Obtiene las features disponibles para un tenant con sus dependencias resueltas
 */
export function getAvailableFeatures(tenantFeatures: string[]): FeatureDefinition[] {
  const availableFeatures: FeatureDefinition[] = [];
  
  for (const feature of AVAILABLE_FEATURES) {
    if (hasFeatureAccess(tenantFeatures, feature.id)) {
      // Verificar que todas las dependencias estén disponibles
      if (feature.dependencies) {
        const hasDependencies = hasAllFeatures(tenantFeatures, feature.dependencies);
        if (hasDependencies) {
          availableFeatures.push(feature);
        }
      } else {
        availableFeatures.push(feature);
      }
    }
  }
  
  return availableFeatures;
}

/**
 * Obtiene las rutas permitidas para un tenant basado en sus features
 */
export function getAllowedRoutes(tenantFeatures: string[]): string[] {
  const routes: string[] = [
    '/admin', // Dashboard siempre disponible
  ];
  
  // CMS Engine routes
  if (hasFeatureAccess(tenantFeatures, 'CMS_ENGINE')) {
    routes.push(
      '/admin/cms',
      '/admin/cms/pages',
      '/admin/cms/pages/create',
      '/admin/cms/pages/edit',
      '/admin/cms/sections',
      '/admin/cms/media',
      '/admin/cms/settings'
    );
  }
  
  // Blog Module routes
  if (hasFeatureAccess(tenantFeatures, 'BLOG_MODULE')) {
    routes.push(
      '/admin/cms/blog',
      '/admin/cms/blog/new',
      '/admin/cms/blog/edit',
      '/admin/cms/blog/posts'
    );
  }
  
  // Forms Module routes
  if (hasFeatureAccess(tenantFeatures, 'FORMS_MODULE')) {
    routes.push(
      '/admin/cms/forms',
      '/admin/cms/forms/create',
      '/admin/cms/forms/edit',
      '/admin/cms/forms/submissions'
    );
  }
  
  // Booking Engine routes
  if (hasFeatureAccess(tenantFeatures, 'BOOKING_ENGINE')) {
    routes.push(
      '/admin/bookings',
      '/admin/bookings/calendar',
      '/admin/bookings/services',
      '/admin/bookings/staff',
      '/admin/bookings/locations',
      '/admin/bookings/rules'
    );
  }
  
  // E-commerce Engine routes
  if (hasFeatureAccess(tenantFeatures, 'ECOMMERCE_ENGINE')) {
    routes.push(
      '/admin/commerce',
      '/admin/commerce/products',
      '/admin/commerce/orders',
      '/admin/commerce/customers',
      '/admin/commerce/analytics',
      '/admin/commerce/settings'
    );
  }
  
  return routes;
}

/**
 * Verifica si una ruta está permitida para un tenant
 */
export function isRouteAllowed(tenantFeatures: string[], route: string): boolean {
  const allowedRoutes = getAllowedRoutes(tenantFeatures);
  
  // Verificar coincidencia exacta o si la ruta es un subrutas de una permitida
  return allowedRoutes.some(allowedRoute => 
    route === allowedRoute || route.startsWith(allowedRoute + '/')
  );
}

/**
 * Obtiene las features faltantes para acceder a una funcionalidad
 */
export function getMissingFeatures(
  tenantFeatures: string[], 
  requiredFeatures: string[]
): string[] {
  return requiredFeatures.filter(feature => !hasFeatureAccess(tenantFeatures, feature));
}

/**
 * Calcula el costo mensual basado en las features seleccionadas
 */
export function calculateMonthlyCost(features: string[]): number {
  const pricing: Record<string, number> = {
    'CMS_ENGINE': 0, // Incluido gratis
    'BLOG_MODULE': 10,
    'FORMS_MODULE': 15,
    'BOOKING_ENGINE': 25,
    'ECOMMERCE_ENGINE': 35,
  };
  
  return features.reduce((total, feature) => {
    return total + (pricing[feature] || 0);
  }, 0);
} 