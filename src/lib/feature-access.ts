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
export function getAllowedRoutes(tenantFeatures: string[], locale: string, tenantSlug: string): string[] {
  const routes: string[] = [
    `/${locale}/${tenantSlug}/dashboard`, // Dashboard siempre disponible
  ];
  
  // CMS Engine routes
  if (hasFeatureAccess(tenantFeatures, 'CMS_ENGINE')) {
    routes.push(
      `/${locale}/${tenantSlug}/cms`,
      `/${locale}/${tenantSlug}/cms/pages`,
      `/${locale}/${tenantSlug}/cms/pages/create`,
      `/${locale}/${tenantSlug}/cms/pages/edit`,
      `/${locale}/${tenantSlug}/cms/sections`,
      `/${locale}/${tenantSlug}/cms/media`,
      `/${locale}/${tenantSlug}/cms/settings`
    );
  }
  
  // Blog Module routes
  if (hasFeatureAccess(tenantFeatures, 'BLOG_MODULE')) {
    routes.push(
      `/${locale}/${tenantSlug}/cms/blog`,
      `/${locale}/${tenantSlug}/cms/blog/new`,
      `/${locale}/${tenantSlug}/cms/blog/edit`,
      `/${locale}/${tenantSlug}/cms/blog/posts`
    );
  }
  
  // Forms Module routes
  if (hasFeatureAccess(tenantFeatures, 'FORMS_MODULE')) {
    routes.push(
      `/${locale}/${tenantSlug}/cms/forms`,
      `/${locale}/${tenantSlug}/cms/forms/create`,
      `/${locale}/${tenantSlug}/cms/forms/edit`,
      `/${locale}/${tenantSlug}/cms/forms/submissions`
    );
  }
  
  // Booking Engine routes
  if (hasFeatureAccess(tenantFeatures, 'BOOKING_ENGINE')) {
    routes.push(
      `/${locale}/${tenantSlug}/bookings`,
      `/${locale}/${tenantSlug}/bookings/calendar`,
      `/${locale}/${tenantSlug}/bookings/services`,
      `/${locale}/${tenantSlug}/bookings/staff`,
      `/${locale}/${tenantSlug}/bookings/locations`,
      `/${locale}/${tenantSlug}/bookings/rules`
    );
  }
  
  // E-commerce Engine routes
  if (hasFeatureAccess(tenantFeatures, 'ECOMMERCE_ENGINE')) {
    routes.push(
        `/${locale}/${tenantSlug}/commerce`,
      `/${locale}/${tenantSlug}/commerce/products`,
      `/${locale}/${tenantSlug}/commerce/orders`,
      `/${locale}/${tenantSlug}/commerce/customers`,
      `/${locale}/${tenantSlug}/commerce/analytics`,
      `/${locale}/${tenantSlug}/commerce/settings`
    );
  }
  
  return routes;
}

/**
 * Verifica si una ruta está permitida para un tenant
 */
export function isRouteAllowed(tenantFeatures: string[], route: string, locale: string, tenantSlug: string): boolean {
  const allowedRoutes = getAllowedRoutes(tenantFeatures, locale, tenantSlug);
  
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