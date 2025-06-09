import { NextRequest, NextResponse } from 'next/server';
import { isRouteAllowed } from '@/lib/feature-access';

// Rutas que requieren features específicas (con locale)
const FEATURE_ROUTES: Record<string, string[]> = {
  // Blog Module routes
  '/admin/cms/blog': ['BLOG_MODULE'],
  '/admin/business/blog': ['BLOG_MODULE'],
  '/[tenantSlug]/cms/blog': ['BLOG_MODULE'],
  
  // Forms Module routes
  '/admin/cms/forms': ['FORMS_MODULE'],
  '/admin/business/forms': ['FORMS_MODULE'],
  '/[tenantSlug]/cms/forms': ['FORMS_MODULE'],
  
  // E-commerce Engine routes
  '/admin/business/ecommerce': ['ECOMMERCE_ENGINE'],
  '/admin/commerce': ['ECOMMERCE_ENGINE'],
  '/[tenantSlug]/commerce': ['ECOMMERCE_ENGINE'],
  
  // Booking Engine routes
  '/admin/business/booking': ['BOOKING_ENGINE'],
  '/admin/bookings': ['BOOKING_ENGINE'],
  '/[tenantSlug]/bookings': ['BOOKING_ENGINE'],
  
  // HRMS Module routes
  '/admin/business/hrms': ['HRMS_MODULE'],
  '/admin/hrms': ['HRMS_MODULE'],
  '/[tenantSlug]/hrms': ['HRMS_MODULE'],
  
  // Interpretation Engine routes
  '/admin/interpretation': ['INTERPRETATION_ENGINE'],
  '/admin/business/interpretation': ['INTERPRETATION_ENGINE'],
  '/[tenantSlug]/dashboard/interpretation': ['INTERPRETATION_ENGINE'],
  
  // Performance and analytics
  '/admin/reports/advanced': ['PERFORMANCE_MODULE'],
  '/admin/analytics': ['PERFORMANCE_MODULE'],
  
  // Help and support
  '/admin/help/advanced': ['HELP_MODULE'],
  '/admin/support': ['HELP_MODULE'],
  
  // Time tracking
  '/admin/timeentries': ['TIME_MODULE'],
  '/admin/time-tracking': ['TIME_MODULE'],
};

// Rutas que siempre están disponibles (no requieren features específicas)
const ALWAYS_ALLOWED_ROUTES = [
  // Authentication routes
  '/login',
  '/get-started',
  '/logout',
  '/forgot-password',
  '/reset-password',
  
  // API routes
  '/api',
  
  // Public routes
  '/',
  '/about',
  '/contact',
  '/privacy',
  '/terms',
  
  // Admin dashboard and core features (with locale support)
  '/admin',
  '/admin/dashboard',
  '/admin/dashboard/notifications',
  '/admin/dashboard/benefits',
  '/admin/dashboard/help',
  '/admin/dashboard/settings',
  
  // User management (always available)
  '/admin/users',
  '/admin/users/list',
  '/admin/users/roles',
  '/admin/users/activity',
  '/admin/notifications',
  '/admin/external-links',
  
  // Company management
  '/admin/company',
  '/admin/company/profile',
  '/admin/company/branding',
  '/admin/company/billing',
  
  // Core CMS (always available with CMS_ENGINE)
  '/admin/cms',
  '/admin/cms/pages',
  '/admin/cms/sections',
  '/admin/cms/media',
  '/admin/cms/templates',
  '/admin/cms/languages',
  '/admin/cms/menus',
  '/admin/cms/settings',
  
  // Tenant management routes
  '/[tenantSlug]',
  '/[tenantSlug]/dashboard',
  '/[tenantSlug]/cms',
  '/[tenantSlug]/cms/pages',
  '/[tenantSlug]/cms/media',
  '/[tenantSlug]/cms/menus',
  '/[tenantSlug]/cms/settings',

  
  // SuperAdmin routes (no feature restrictions)
  '/super-admin',
  '/super-admin',
  '/super-admin/tenants',
  '/super-admin/tenants/list',
  '/super-admin/tenants/create',
  '/super-admin/tenants/health',
  '/super-admin/tenants/impersonate',
  '/super-admin/modules',
  '/super-admin/requests',
  '/super-admin/analytics',
  '/super-admin/system',
  
  // Basic reports (advanced features require PERFORMANCE_MODULE)
  '/admin/reports',
  '/admin/reports/kpis',
  '/admin/reports/export',
  '/admin/reports/activity',
  
  // Profile and settings
  '/admin/profile',
  '/admin/settings',
  '/admin/billing',
  '/admin/help',
];

export function createFeatureMiddleware() {
  return async function featureMiddleware(
    request: NextRequest,
    tenantFeatures: string[],
    tenantSlug: string
  ): Promise<NextResponse | null> {
    const pathname = request.nextUrl.pathname;
    
    // Extract locale from pathname (assuming structure /{locale}/...)
    const pathSegments = pathname.split('/').filter(Boolean);
    const locale = pathSegments[0] || 'en';
    
    // Remove locale from pathname for route checking
    const routeWithoutLocale = '/' + pathSegments.slice(1).join('/');

    // Permitir rutas que siempre están disponibles
    if (isAlwaysAllowedRoute(routeWithoutLocale, pathname)) {
      return null; // Continuar con la siguiente middleware
    }

    // Verificar si la ruta requiere features específicas
    const requiredFeatures = getRequiredFeaturesForRoute(routeWithoutLocale);
    
    if (requiredFeatures.length > 0) {
      const hasAccess = requiredFeatures.every(feature => 
        tenantFeatures.includes(feature) || feature === 'CMS_ENGINE'
      );

      if (!hasAccess) {
        // Redirigir a página de upgrade o acceso denegado
        const upgradeUrl = new URL(`/${locale}/admin/billing/upgrade`, request.url);
        upgradeUrl.searchParams.set('required', requiredFeatures.join(','));
        upgradeUrl.searchParams.set('redirect', pathname);
        
        return NextResponse.redirect(upgradeUrl);
      }
    }

    // Verificar usando la función general de rutas permitidas
    if (!isRouteAllowed(tenantFeatures, routeWithoutLocale, locale, tenantSlug)) {
      const upgradeUrl = new URL(`/${locale}/${tenantSlug}/billing/upgrade`, request.url);
      upgradeUrl.searchParams.set('redirect', pathname);
      
      return NextResponse.redirect(upgradeUrl);
    }

    return null; // Permitir acceso
  };
}

function isAlwaysAllowedRoute(routeWithoutLocale: string, fullPathname: string): boolean {
  // Check exact matches first
  if (ALWAYS_ALLOWED_ROUTES.includes(routeWithoutLocale)) {
    return true;
  }

  // Check prefix matches
  for (const allowedRoute of ALWAYS_ALLOWED_ROUTES) {
    if (routeWithoutLocale.startsWith(allowedRoute + '/') || fullPathname.startsWith(allowedRoute + '/')) {
      return true;
    }
  }

  // Special handling for dynamic routes
  if (routeWithoutLocale.includes('/[tenantSlug]/') && routeWithoutLocale.split('/').length >= 3) {
    const routeParts = routeWithoutLocale.split('/');
    const baseRoute = '/' + routeParts.slice(0, 3).join('/').replace(/^\//, '');
    const dynamicRoute = baseRoute.replace(routeParts[2], '[tenantSlug]');
    
    if (ALWAYS_ALLOWED_ROUTES.includes(dynamicRoute)) {
      return true;
    }
  }

  return false;
}

function getRequiredFeaturesForRoute(routeWithoutLocale: string): string[] {
  // Buscar coincidencias exactas primero
  if (FEATURE_ROUTES[routeWithoutLocale]) {
    return FEATURE_ROUTES[routeWithoutLocale];
  }

  // Buscar coincidencias por prefijo
  for (const [route, features] of Object.entries(FEATURE_ROUTES)) {
    if (routeWithoutLocale.startsWith(route + '/')) {
      return features;
    }
  }

  // Handle dynamic routes (like /[tenantSlug]/...)
  if (routeWithoutLocale.includes('/[tenantSlug]/')) {
    const routeParts = routeWithoutLocale.split('/');
    if (routeParts.length >= 4) {
      const dynamicRoute = routeParts.slice(0, 2).join('/') + '/[tenantSlug]' + '/' + routeParts.slice(3).join('/');
      if (FEATURE_ROUTES[dynamicRoute]) {
        return FEATURE_ROUTES[dynamicRoute];
      }
    }
  }

  // Rutas específicas basadas en patrones
  if (routeWithoutLocale.includes('/blog') && !routeWithoutLocale.includes('/cms/blog')) {
    return ['BLOG_MODULE'];
  }
  
  if (routeWithoutLocale.includes('/forms') && !routeWithoutLocale.includes('/cms/forms')) {
    return ['FORMS_MODULE'];
  }
  
  if (routeWithoutLocale.includes('/booking') || routeWithoutLocale.includes('/bookings')) {
    return ['BOOKING_ENGINE'];
  }
  
  if (routeWithoutLocale.includes('/commerce') || routeWithoutLocale.includes('/ecommerce')) {
    return ['ECOMMERCE_ENGINE'];
  }

  if (routeWithoutLocale.includes('/hrms') || routeWithoutLocale.includes('/hr/')) {
    return ['HRMS_MODULE'];
  }

  if (routeWithoutLocale.includes('/analytics') || routeWithoutLocale.includes('/reports/advanced')) {
    return ['PERFORMANCE_MODULE'];
  }

  if (routeWithoutLocale.includes('/time') || routeWithoutLocale.includes('/timeentries')) {
    return ['TIME_MODULE'];
  }

  if (routeWithoutLocale.includes('/interpretation') || routeWithoutLocale.includes('/interpreters')) {
    return ['INTERPRETATION_ENGINE'];
  }

  return [];
}

// Función helper para verificar acceso desde componentes del servidor
export function checkFeatureAccess(
  tenantFeatures: string[], 
  requiredFeatures: string[]
): { hasAccess: boolean; missingFeatures: string[] } {
  const missingFeatures = requiredFeatures.filter(feature => 
    !tenantFeatures.includes(feature) && feature !== 'CMS_ENGINE'
  );
  
  return {
    hasAccess: missingFeatures.length === 0,
    missingFeatures
  };
}

// Función helper para verificar acceso a rutas específicas
export function checkRouteAccess(
  tenantFeatures: string[],
  pathname: string
): { hasAccess: boolean; requiredFeatures: string[]; missingFeatures: string[] } {
  // Extract route without locale
  const pathSegments = pathname.split('/').filter(Boolean);
  const routeWithoutLocale = '/' + pathSegments.slice(1).join('/');
  
  if (isAlwaysAllowedRoute(routeWithoutLocale, pathname)) {
    return { hasAccess: true, requiredFeatures: [], missingFeatures: [] };
  }

  const requiredFeatures = getRequiredFeaturesForRoute(routeWithoutLocale);
  const { hasAccess, missingFeatures } = checkFeatureAccess(tenantFeatures, requiredFeatures);
  
  return { hasAccess, requiredFeatures, missingFeatures };
} 