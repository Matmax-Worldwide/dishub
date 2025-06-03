import { NextRequest, NextResponse } from 'next/server';
import { isRouteAllowed } from '@/lib/feature-access';

// Rutas que requieren features específicas
const FEATURE_ROUTES: Record<string, string[]> = {
  '/admin/cms/blog': ['BLOG_MODULE'],
  '/admin/cms/forms': ['FORMS_MODULE'],
  '/admin/bookings': ['BOOKING_ENGINE'],
  '/admin/commerce': ['ECOMMERCE_ENGINE'],
};

// Rutas que siempre están disponibles (no requieren features específicas)
const ALWAYS_ALLOWED_ROUTES = [
  '/admin',
  '/admin/dashboard',
  '/admin/cms',
  '/admin/cms/pages',
  '/admin/cms/sections',
  '/admin/cms/media',
  '/admin/settings',
  '/admin/profile',
  '/admin/billing',
  '/login',
  '/register',
  '/api',
];

export function createFeatureMiddleware() {
  return async function featureMiddleware(
    request: NextRequest,
    tenantFeatures: string[]
  ): Promise<NextResponse | null> {
    const pathname = request.nextUrl.pathname;

    // Permitir rutas que siempre están disponibles
    if (ALWAYS_ALLOWED_ROUTES.some(route => 
      pathname === route || pathname.startsWith(route + '/')
    )) {
      return null; // Continuar con la siguiente middleware
    }

    // Verificar si la ruta requiere features específicas
    const requiredFeatures = getRequiredFeaturesForRoute(pathname);
    
    if (requiredFeatures.length > 0) {
      const hasAccess = requiredFeatures.every(feature => 
        tenantFeatures.includes(feature) || feature === 'CMS_ENGINE'
      );

      if (!hasAccess) {
        // Redirigir a página de upgrade o acceso denegado
        const upgradeUrl = new URL('/admin/billing/upgrade', request.url);
        upgradeUrl.searchParams.set('required', requiredFeatures.join(','));
        upgradeUrl.searchParams.set('redirect', pathname);
        
        return NextResponse.redirect(upgradeUrl);
      }
    }

    // Verificar usando la función general de rutas permitidas
    if (!isRouteAllowed(tenantFeatures, pathname)) {
      const upgradeUrl = new URL('/admin/billing/upgrade', request.url);
      upgradeUrl.searchParams.set('redirect', pathname);
      
      return NextResponse.redirect(upgradeUrl);
    }

    return null; // Permitir acceso
  };
}

function getRequiredFeaturesForRoute(pathname: string): string[] {
  // Buscar coincidencias exactas primero
  if (FEATURE_ROUTES[pathname]) {
    return FEATURE_ROUTES[pathname];
  }

  // Buscar coincidencias por prefijo
  for (const [route, features] of Object.entries(FEATURE_ROUTES)) {
    if (pathname.startsWith(route + '/')) {
      return features;
    }
  }

  // Rutas específicas basadas en patrones
  if (pathname.includes('/blog')) {
    return ['BLOG_MODULE'];
  }
  
  if (pathname.includes('/forms')) {
    return ['FORMS_MODULE'];
  }
  
  if (pathname.includes('/booking')) {
    return ['BOOKING_ENGINE'];
  }
  
  if (pathname.includes('/commerce') || pathname.includes('/ecommerce')) {
    return ['ECOMMERCE_ENGINE'];
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