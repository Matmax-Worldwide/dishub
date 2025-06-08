"use client";

import { useFeatureAccess, FeatureType } from '@/hooks/useFeatureAccess';
import Link from 'next/link';
import { 
  LayoutDashboard, 
  FileText, 
  MessageSquare, 
  Calendar, 
  ShoppingCart,
  Settings,
  Zap
} from 'lucide-react';

interface NavigationItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  feature?: FeatureType;
  badge?: string;
}

const NAVIGATION_ITEMS: NavigationItem[] = [
  {
    label: 'Dashboard',
    href: '/admin',
    icon: LayoutDashboard,
  },
  {
    label: 'CMS',
    href: '/admin/cms',
    icon: FileText,
    feature: 'CMS_ENGINE',
  },
  {
    label: 'Blog',
    href: '/admin/cms/blog',
    icon: MessageSquare,
    feature: 'BLOG_MODULE',
    badge: 'Premium',
  },
  {
    label: 'Formularios',
    href: '/admin/cms/forms',
    icon: FileText,
    feature: 'FORMS_MODULE',
    badge: 'Premium',
  },
  {
    label: 'Reservas',
    href: '/admin/bookings',
    icon: Calendar,
    feature: 'BOOKING_ENGINE',
    badge: 'Premium',
  },
  {
    label: 'E-commerce',
    href: '/admin/commerce',
    icon: ShoppingCart,
    feature: 'ECOMMERCE_ENGINE',
    badge: 'Premium',
  },
  {
    label: 'Configuración',
    href: '/admin/settings',
    icon: Settings,
  },
];

export function FeatureAwareNavigation() {
  const { features, calculateCost } = useFeatureAccess();
  const monthlyCost = calculateCost();

  return (
    <nav className="space-y-2">
      {/* Información del plan actual */}
      <div className="px-3 py-2 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg mb-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-blue-900">Plan Actual</p>
            <p className="text-xs text-blue-600">
              ${monthlyCost}/mes • {features.length} features
            </p>
          </div>
          <Zap className="w-5 h-5 text-blue-600" />
        </div>
      </div>

      {/* Items de navegación */}
      {NAVIGATION_ITEMS.map((item) => (
        <NavigationItem key={item.href} item={item} />
      ))}

      {/* Enlace para actualizar plan */}
      <div className="pt-4 border-t">
        <Link
          href="/admin/billing/upgrade"
          className="flex items-center px-3 py-2 text-sm font-medium text-orange-600 hover:text-orange-700 hover:bg-orange-50 rounded-lg transition-colors"
        >
          <Zap className="w-4 h-4 mr-3" />
          Actualizar Plan
        </Link>
      </div>
    </nav>
  );
}

function NavigationItem({ item }: { item: NavigationItem }) {
  const { hasFeature } = useFeatureAccess();
  
  // Si requiere una feature específica, verificar acceso
  if (item.feature) {
    const hasAccess = hasFeature(item.feature);
    
    return (
      <div className="relative">
        <Link
          href={hasAccess ? item.href : '/admin/billing/upgrade'}
          className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
            hasAccess
              ? 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
              : 'text-gray-400 hover:text-gray-500 hover:bg-gray-50'
          }`}
        >
          <item.icon className={`w-4 h-4 mr-3 ${hasAccess ? 'text-gray-500' : 'text-gray-300'}`} />
          {item.label}
          
          {/* Badge para features premium */}
          {!hasAccess && item.badge && (
            <span className="ml-auto px-2 py-1 text-xs font-medium text-orange-600 bg-orange-100 rounded-full">
              {item.badge}
            </span>
          )}
          
          {/* Icono de lock para features no disponibles */}
          {!hasAccess && (
            <div className="ml-auto w-4 h-4 text-gray-300">
              🔒
            </div>
          )}
        </Link>
      </div>
    );
  }

  // Item normal sin restricciones de feature
  return (
    <Link
      href={item.href}
      className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
    >
      <item.icon className="w-4 h-4 mr-3 text-gray-500" />
      {item.label}
    </Link>
  );
}

// Componente para mostrar el estado de las features en el dashboard
export function FeatureStatusCard() {
  const { getAvailableFeatures, calculateCost } = useFeatureAccess();
  const availableFeatures = getAvailableFeatures();
  const monthlyCost = calculateCost();

  // Map feature types to display info
  const featureDisplayInfo = {
    'CMS_ENGINE': { label: 'CMS Engine', description: 'Content management system', category: 'Engine' },
    'BLOG_MODULE': { label: 'Blog Module', description: 'Blog functionality', category: 'Module' },
    'FORMS_MODULE': { label: 'Forms Module', description: 'Form builder', category: 'Module' },
    'BOOKING_ENGINE': { label: 'Booking Engine', description: 'Reservation system', category: 'Engine' },
    'ECOMMERCE_ENGINE': { label: 'E-commerce Engine', description: 'Online store', category: 'Engine' },
    'LEGAL_ENGINE': { label: 'Legal Engine', description: 'Legal case management', category: 'Engine' }
  } as const;

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Features Activas</h3>
        <span className="text-2xl font-bold text-blue-600">${monthlyCost}/mes</span>
      </div>
      
      <div className="space-y-3">
        {availableFeatures.map((feature) => {
          const info = featureDisplayInfo[feature];
          return (
            <div key={feature} className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">{info.label}</p>
                <p className="text-sm text-gray-500">{info.description}</p>
              </div>
              <div className="flex items-center space-x-2">
                {info.category === 'Engine' && (
                  <span className="px-2 py-1 text-xs font-medium text-blue-600 bg-blue-100 rounded-full">
                    Motor
                  </span>
                )}
                {info.category === 'Module' && (
                  <span className="px-2 py-1 text-xs font-medium text-green-600 bg-green-100 rounded-full">
                    Módulo
                  </span>
                )}
                <span className="text-green-600">✓</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 pt-4 border-t">
        <Link
          href="/admin/billing/features"
          className="text-sm text-blue-600 hover:text-blue-700 font-medium"
        >
          Ver todas las features disponibles →
        </Link>
      </div>
    </div>
  );
} 