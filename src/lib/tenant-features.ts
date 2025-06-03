import { prisma } from '@/lib/prisma';
import { AVAILABLE_FEATURES } from '@/config/features';

export interface TenantFeatureData {
  tenantId: string;
  features: string[];
  plan?: string;
  expiresAt?: Date;
  isActive: boolean;
}

// Mapeo de precios para las features (en producción esto podría venir de la base de datos)
const FEATURE_PRICES: Record<string, number> = {
  'CMS_ENGINE': 0, // Gratis/incluido
  'BLOG_MODULE': 10,
  'FORMS_MODULE': 15,
  'BOOKING_ENGINE': 25,
  'ECOMMERCE_ENGINE': 35,
};

/**
 * Obtiene las features activas de un tenant desde la base de datos
 */
export async function getTenantFeatures(tenantId: string): Promise<TenantFeatureData | null> {
  try {
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: {
        id: true,
        features: true,
        planId: true,
        status: true,
        // Agregar campos relacionados con la expiración si existen
      }
    });

    if (!tenant) {
      return null;
    }

    // Asegurar que CMS_ENGINE siempre esté incluido
    const tenantFeatures = Array.isArray(tenant.features) ? tenant.features as string[] : [];
    const featuresWithCMS = tenantFeatures.includes('CMS_ENGINE') 
      ? tenantFeatures 
      : ['CMS_ENGINE', ...tenantFeatures];

    return {
      tenantId: tenant.id,
      features: featuresWithCMS,
      plan: tenant.planId || undefined,
      isActive: tenant.status === 'ACTIVE'
    };
  } catch (error) {
    console.error('Error fetching tenant features:', error);
    return null;
  }
}

/**
 * Actualiza las features de un tenant
 */
export async function updateTenantFeatures(
  tenantId: string, 
  features: string[]
): Promise<boolean> {
  try {
    // Validar que todas las features existen
    const validFeatures = features.filter(feature => 
      AVAILABLE_FEATURES.some(f => f.id === feature)
    );

    // Asegurar que CMS_ENGINE siempre esté incluido
    const featuresWithCMS = validFeatures.includes('CMS_ENGINE') 
      ? validFeatures 
      : ['CMS_ENGINE', ...validFeatures];

    await prisma.tenant.update({
      where: { id: tenantId },
      data: {
        features: featuresWithCMS
      }
    });

    return true;
  } catch (error) {
    console.error('Error updating tenant features:', error);
    return false;
  }
}

/**
 * Verifica si un tenant tiene acceso a una feature específica
 */
export async function checkTenantFeatureAccess(
  tenantId: string, 
  featureId: string
): Promise<boolean> {
  try {
    const tenantData = await getTenantFeatures(tenantId);
    
    if (!tenantData || !tenantData.isActive) {
      return false;
    }

    // CMS_ENGINE siempre está disponible
    if (featureId === 'CMS_ENGINE') {
      return true;
    }

    return tenantData.features.includes(featureId);
  } catch (error) {
    console.error('Error checking tenant feature access:', error);
    return false;
  }
}

/**
 * Obtiene las features disponibles para upgrade de un tenant
 */
export async function getAvailableUpgrades(tenantId: string) {
  try {
    const tenantData = await getTenantFeatures(tenantId);
    
    if (!tenantData) {
      return [];
    }

    // Filtrar features que el tenant no tiene
    const availableUpgrades = AVAILABLE_FEATURES.filter(feature => 
      !tenantData.features.includes(feature.id) && feature.id !== 'CMS_ENGINE'
    );

    return availableUpgrades.map(feature => ({
      ...feature,
      price: FEATURE_PRICES[feature.id] || 0,
      isUpgrade: true,
      currentlyActive: false
    }));
  } catch (error) {
    console.error('Error getting available upgrades:', error);
    return [];
  }
}

/**
 * Calcula el costo mensual basado en las features del tenant
 */
export async function calculateTenantMonthlyCost(tenantId: string): Promise<number> {
  try {
    const tenantData = await getTenantFeatures(tenantId);
    
    if (!tenantData) {
      return 0;
    }

    return tenantData.features.reduce((total, featureId) => {
      const price = FEATURE_PRICES[featureId] || 0;
      return total + price;
    }, 0);
  } catch (error) {
    console.error('Error calculating tenant monthly cost:', error);
    return 0;
  }
}

/**
 * Middleware helper para verificar features en rutas de API
 */
export function createFeatureMiddleware(requiredFeatures: string[]) {
  return async (tenantId: string): Promise<{ hasAccess: boolean; missingFeatures: string[] }> => {
    try {
      const tenantData = await getTenantFeatures(tenantId);
      
      if (!tenantData || !tenantData.isActive) {
        return {
          hasAccess: false,
          missingFeatures: requiredFeatures
        };
      }

      const missingFeatures = requiredFeatures.filter(feature => 
        !tenantData.features.includes(feature)
      );

      return {
        hasAccess: missingFeatures.length === 0,
        missingFeatures
      };
    } catch (error) {
      console.error('Error in feature middleware:', error);
      return {
        hasAccess: false,
        missingFeatures: requiredFeatures
      };
    }
  };
}

/**
 * Hook para usar en componentes del servidor
 */
export async function getServerSideFeatures(tenantId: string) {
  const tenantData = await getTenantFeatures(tenantId);
  
  return {
    features: tenantData?.features || ['CMS_ENGINE'],
    isActive: tenantData?.isActive || false,
    monthlyCost: await calculateTenantMonthlyCost(tenantId),
    availableUpgrades: await getAvailableUpgrades(tenantId)
  };
}

/**
 * Función para sincronizar features después del registro
 */
export async function syncTenantFeaturesAfterRegistration(
  tenantId: string, 
  selectedFeatures: string[]
): Promise<boolean> {
  try {
    // Validar y limpiar features
    const validFeatures = selectedFeatures.filter(feature => 
      AVAILABLE_FEATURES.some(f => f.id === feature)
    );

    // Asegurar que CMS_ENGINE esté incluido
    const featuresWithCMS = validFeatures.includes('CMS_ENGINE') 
      ? validFeatures 
      : ['CMS_ENGINE', ...validFeatures];

    // Actualizar en la base de datos
    await prisma.tenant.update({
      where: { id: tenantId },
      data: {
        features: featuresWithCMS,
        status: 'ACTIVE' // Activar el tenant
      }
    });

    console.log(`Tenant ${tenantId} features synchronized:`, featuresWithCMS);
    return true;
  } catch (error) {
    console.error('Error syncing tenant features after registration:', error);
    return false;
  }
} 