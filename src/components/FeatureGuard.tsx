"use client";

import { ReactNode } from 'react';
import { useHasFeature, useHasAllFeatures, useHasAnyFeature, FeatureType } from '@/hooks/useFeatureAccess';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Lock, Zap, ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface FeatureGuardProps {
  children: ReactNode;
  feature?: FeatureType;
  features?: FeatureType[];
  requireAll?: boolean; // Si true, requiere todas las features. Si false, requiere al menos una
  fallback?: ReactNode;
  showUpgrade?: boolean;
}

export function FeatureGuard({ 
  children, 
  feature, 
  features, 
  requireAll = true,
  fallback,
  showUpgrade = true 
}: FeatureGuardProps) {
  // Llamar todos los hooks al inicio para evitar hooks condicionales
  const hasSingleFeature = useHasFeature(feature || 'CMS_ENGINE');
  const hasAllRequiredFeatures = useHasAllFeatures(features || []);
  const hasAnyRequiredFeature = useHasAnyFeature(features || []);

  let hasAccess = false;

  // Determinar acceso basado en los props
  if (feature) {
    hasAccess = hasSingleFeature;
  } else if (features && features.length > 0) {
    if (requireAll) {
      hasAccess = hasAllRequiredFeatures;
    } else {
      hasAccess = hasAnyRequiredFeature;
    }
  } else {
    // Si no se especifica feature, permitir acceso
    hasAccess = true;
  }

  if (hasAccess) {
    return <>{children}</>;
  }

  // Si hay un fallback personalizado, usarlo
  if (fallback) {
    return <>{fallback}</>;
  }

  // Mostrar mensaje de upgrade por defecto
  if (showUpgrade) {
    return <FeatureUpgradeCard feature={feature} features={features} />;
  }

  // No mostrar nada si no hay acceso y no se quiere mostrar upgrade
  return null;
}

interface FeatureUpgradeCardProps {
  feature?: string;
  features?: string[];
}

function FeatureUpgradeCard({ feature, features }: FeatureUpgradeCardProps) {
  const requiredFeatures = feature ? [feature] : (features || []);
  const featureNames = requiredFeatures.map(f => {
    switch (f) {
      case 'BLOG_MODULE': return 'Módulo de Blog';
      case 'FORMS_MODULE': return 'Módulo de Formularios';
      case 'BOOKING_ENGINE': return 'Motor de Reservas';
      case 'ECOMMERCE_ENGINE': return 'Motor de E-commerce';
      default: return f;
    }
  });

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="mx-auto w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mb-4">
          <Lock className="w-6 h-6 text-orange-600" />
        </div>
        <CardTitle className="text-xl">Funcionalidad Premium</CardTitle>
      </CardHeader>
      <CardContent className="text-center space-y-4">
        <p className="text-gray-600">
          Para acceder a {featureNames.join(' y ')}, necesitas actualizar tu plan.
        </p>
        
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg">
          <div className="flex items-center justify-center space-x-2 text-blue-700 mb-2">
            <Zap className="w-5 h-5" />
            <span className="font-semibold">Beneficios Premium</span>
          </div>
          <ul className="text-sm text-blue-600 space-y-1">
            {requiredFeatures.includes('BLOG_MODULE') && (
              <li>• Sistema completo de blog y contenido</li>
            )}
            {requiredFeatures.includes('FORMS_MODULE') && (
              <li>• Formularios avanzados y recolección de datos</li>
            )}
            {requiredFeatures.includes('BOOKING_ENGINE') && (
              <li>• Sistema de reservas y citas</li>
            )}
            {requiredFeatures.includes('ECOMMERCE_ENGINE') && (
              <li>• Tienda online completa</li>
            )}
          </ul>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <Button asChild className="flex-1">
            <Link href="/admin/billing/upgrade">
              <Zap className="w-4 h-4 mr-2" />
              Actualizar Plan
            </Link>
          </Button>
          <Button variant="outline" asChild className="flex-1">
            <Link href="/admin/billing/features">
              Ver Planes
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// Componente para mostrar solo si tiene la feature
export function ShowIfFeature({ 
  feature, 
  children 
}: { 
  feature: FeatureType; 
  children: ReactNode; 
}) {
  const hasAccess = useHasFeature(feature);
  return hasAccess ? <>{children}</> : null;
}

// Componente para ocultar si tiene la feature
export function HideIfFeature({ 
  feature, 
  children 
}: { 
  feature: FeatureType; 
  children: ReactNode; 
}) {
  const hasAccess = useHasFeature(feature);
  return !hasAccess ? <>{children}</> : null;
} 