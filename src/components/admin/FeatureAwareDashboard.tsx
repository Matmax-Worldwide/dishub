"use client";

import { useFeatureAccess, FeatureType } from '@/hooks/useFeatureAccess';
import { FeatureGuard, ShowIfFeature } from '@/components/FeatureGuard';
import Link from 'next/link';
import { 
  FileText, 
  MessageSquare, 
  Calendar, 
  Users,
  BarChart3,
  TrendingUp,
  Eye,
  Clock,
  Package,
  CreditCard,
  Star,
  Mail,
  Zap,
  ArrowUpRight,
  Plus,
  Activity
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface DashboardWidget {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  feature?: string;
  href?: string;
  action?: string;
  value?: string | number;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  size?: 'small' | 'medium' | 'large';
}

interface DashboardSection {
  id: string;
  title: string;
  feature?: string;
  widgets: DashboardWidget[];
}

const DASHBOARD_SECTIONS: DashboardSection[] = [
  {
    id: 'overview',
    title: 'Resumen General',
    widgets: [
      {
        id: 'total-views',
        title: 'Vistas Totales',
        description: 'Visitas del sitio web',
        icon: Eye,
        value: '12,543',
        change: '+12%',
        changeType: 'positive',
        size: 'medium'
      },
      {
        id: 'active-users',
        title: 'Usuarios Activos',
        description: 'Usuarios registrados',
        icon: Users,
        value: '1,234',
        change: '+5%',
        changeType: 'positive',
        size: 'medium'
      }
    ]
  },
  {
    id: 'cms',
    title: 'Gestión de Contenido',
    feature: 'CMS_ENGINE',
    widgets: [
      {
        id: 'total-pages',
        title: 'Páginas Publicadas',
        description: 'Contenido disponible',
        icon: FileText,
        value: '24',
        href: '/admin/cms/pages',
        action: 'Ver páginas',
        size: 'small'
      },
      {
        id: 'media-files',
        title: 'Archivos de Media',
        description: 'Imágenes y documentos',
        icon: Package,
        value: '156',
        href: '/admin/cms/media',
        action: 'Gestionar media',
        size: 'small'
      },
      {
        id: 'create-page',
        title: 'Crear Nueva Página',
        description: 'Añadir contenido al sitio',
        icon: Plus,
        href: '/admin/cms/pages/create',
        action: 'Crear página',
        size: 'medium'
      }
    ]
  },
  {
    id: 'blog',
    title: 'Blog',
    feature: 'BLOG_MODULE',
    widgets: [
      {
        id: 'blog-posts',
        title: 'Artículos Publicados',
        description: 'Contenido del blog',
        icon: MessageSquare,
        value: '45',
        change: '+8',
        changeType: 'positive',
        href: '/admin/cms/blog/posts',
        action: 'Ver artículos',
        size: 'small'
      },
      {
        id: 'blog-views',
        title: 'Vistas del Blog',
        description: 'Lecturas este mes',
        icon: Eye,
        value: '8,432',
        change: '+23%',
        changeType: 'positive',
        size: 'small'
      },
      {
        id: 'create-post',
        title: 'Escribir Artículo',
        description: 'Crear nuevo contenido',
        icon: Plus,
        href: '/admin/cms/blog/posts/create',
        action: 'Nuevo artículo',
        size: 'medium'
      }
    ]
  },
  {
    id: 'forms',
    title: 'Formularios',
    feature: 'FORMS_MODULE',
    widgets: [
      {
        id: 'form-submissions',
        title: 'Respuestas Recibidas',
        description: 'Envíos este mes',
        icon: Mail,
        value: '234',
        change: '+15%',
        changeType: 'positive',
        href: '/admin/cms/forms/submissions',
        action: 'Ver respuestas',
        size: 'small'
      },
      {
        id: 'active-forms',
        title: 'Formularios Activos',
        description: 'Formularios publicados',
        icon: FileText,
        value: '8',
        href: '/admin/cms/forms',
        action: 'Gestionar formularios',
        size: 'small'
      },
      {
        id: 'create-form',
        title: 'Crear Formulario',
        description: 'Nuevo formulario de contacto',
        icon: Plus,
        href: '/admin/cms/forms/create',
        action: 'Crear formulario',
        size: 'medium'
      }
    ]
  },
  {
    id: 'bookings',
    title: 'Reservas',
    feature: 'BOOKING_ENGINE',
    widgets: [
      {
        id: 'todays-bookings',
        title: 'Reservas de Hoy',
        description: 'Citas programadas',
        icon: Calendar,
        value: '12',
        href: '/admin/bookings/calendar',
        action: 'Ver calendario',
        size: 'small'
      },
      {
        id: 'monthly-revenue',
        title: 'Ingresos del Mes',
        description: 'Facturación por reservas',
        icon: CreditCard,
        value: '$4,567',
        change: '+18%',
        changeType: 'positive',
        size: 'small'
      },
      {
        id: 'booking-rate',
        title: 'Tasa de Ocupación',
        description: 'Porcentaje de reservas',
        icon: BarChart3,
        value: '78%',
        change: '+5%',
        changeType: 'positive',
        size: 'small'
      },
      {
        id: 'manage-services',
        title: 'Gestionar Servicios',
        description: 'Configurar disponibilidad',
        icon: Clock,
        href: '/admin/bookings/services',
        action: 'Ver servicios',
        size: 'medium'
      }
    ]
  },
  {
    id: 'ecommerce',
    title: 'E-commerce',
    feature: 'ECOMMERCE_ENGINE',
    widgets: [
      {
        id: 'monthly-sales',
        title: 'Ventas del Mes',
        description: 'Ingresos por productos',
        icon: TrendingUp,
        value: '$12,345',
        change: '+25%',
        changeType: 'positive',
        size: 'medium'
      },
      {
        id: 'total-orders',
        title: 'Pedidos Totales',
        description: 'Órdenes procesadas',
        icon: Package,
        value: '89',
        change: '+12',
        changeType: 'positive',
        href: '/admin/commerce/orders',
        action: 'Ver pedidos',
        size: 'small'
      },
      {
        id: 'products',
        title: 'Productos Activos',
        description: 'Catálogo disponible',
        icon: Package,
        value: '156',
        href: '/admin/commerce/products',
        action: 'Gestionar productos',
        size: 'small'
      },
      {
        id: 'customer-reviews',
        title: 'Reseñas Promedio',
        description: 'Calificación de clientes',
        icon: Star,
        value: '4.8',
        change: '+0.2',
        changeType: 'positive',
        size: 'small'
      }
    ]
  }
];

export function FeatureAwareDashboard() {
  let getAvailableFeatures: () => FeatureType[] = () => ['CMS_ENGINE'];
  let calculateCost: () => number = () => 0;
  
  try {
    const featureAccess = useFeatureAccess();
    getAvailableFeatures = featureAccess.getAvailableFeatures;
    calculateCost = featureAccess.calculateCost;
  } catch {
    console.warn('FeatureAwareDashboard used outside FeatureProvider, using defaults');
  }
  
  const availableFeatures = getAvailableFeatures();
  const monthlyCost = calculateCost();

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Resumen de tu plataforma • Plan actual: ${monthlyCost}/mes
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Badge variant="secondary" className="bg-blue-100 text-blue-800">
            {availableFeatures.length} features activas
          </Badge>
          <Link href="/admin/billing/upgrade">
            <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
              <Zap className="w-4 h-4 mr-2" />
              Actualizar Plan
            </Button>
          </Link>
        </div>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Activity className="w-5 h-5 mr-2" />
            Acciones Rápidas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <ShowIfFeature feature="CMS_ENGINE">
              <Link href="/admin/cms/pages/create">
                <Button variant="outline" className="w-full h-20 flex flex-col">
                  <FileText className="w-6 h-6 mb-2" />
                  <span className="text-sm">Nueva Página</span>
                </Button>
              </Link>
            </ShowIfFeature>
            
            <ShowIfFeature feature="BLOG_MODULE">
              <Link href="/admin/cms/blog/posts/create">
                <Button variant="outline" className="w-full h-20 flex flex-col">
                  <MessageSquare className="w-6 h-6 mb-2" />
                  <span className="text-sm">Nuevo Artículo</span>
                </Button>
              </Link>
            </ShowIfFeature>
            
            <ShowIfFeature feature="FORMS_MODULE">
              <Link href="/admin/cms/forms/create">
                <Button variant="outline" className="w-full h-20 flex flex-col">
                  <Mail className="w-6 h-6 mb-2" />
                  <span className="text-sm">Nuevo Formulario</span>
                </Button>
              </Link>
            </ShowIfFeature>
            
            <ShowIfFeature feature="ECOMMERCE_ENGINE">
              <Link href="/admin/commerce/products/create">
                <Button variant="outline" className="w-full h-20 flex flex-col">
                  <Package className="w-6 h-6 mb-2" />
                  <span className="text-sm">Nuevo Producto</span>
                </Button>
              </Link>
            </ShowIfFeature>
          </div>
        </CardContent>
      </Card>

      {/* Dashboard Sections */}
      {DASHBOARD_SECTIONS.map((section) => (
        <DashboardSection key={section.id} section={section} />
      ))}

      {/* Feature Upgrade Suggestions */}
      <Card className="bg-gradient-to-r from-orange-50 to-yellow-50 border-orange-200">
        <CardHeader>
          <CardTitle className="flex items-center text-orange-800">
            <Zap className="w-5 h-5 mr-2" />
            Potencia tu Plataforma
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            <FeatureGuard feature="BLOG_MODULE" showUpgrade={false} fallback={
              <div className="p-4 bg-white rounded-lg border border-orange-200">
                <h3 className="font-semibold text-gray-900 mb-2">Módulo de Blog</h3>
                <p className="text-sm text-gray-600 mb-3">
                  Crea y gestiona contenido de blog para atraer más visitantes.
                </p>
                <Link href="/admin/billing/upgrade?feature=BLOG_MODULE">
                  <Button size="sm" variant="outline" className="border-orange-300 text-orange-700 hover:bg-orange-50">
                    Activar por $10/mes
                    <ArrowUpRight className="w-3 h-3 ml-1" />
                  </Button>
                </Link>
              </div>
            }>
              <div />
            </FeatureGuard>

            <FeatureGuard feature="BOOKING_ENGINE" showUpgrade={false} fallback={
              <div className="p-4 bg-white rounded-lg border border-orange-200">
                <h3 className="font-semibold text-gray-900 mb-2">Motor de Reservas</h3>
                <p className="text-sm text-gray-600 mb-3">
                  Sistema completo de citas y reservas para tu negocio.
                </p>
                <Link href="/admin/billing/upgrade?feature=BOOKING_ENGINE">
                  <Button size="sm" variant="outline" className="border-orange-300 text-orange-700 hover:bg-orange-50">
                    Activar por $25/mes
                    <ArrowUpRight className="w-3 h-3 ml-1" />
                  </Button>
                </Link>
              </div>
            }>
              <div />
            </FeatureGuard>

            <FeatureGuard feature="ECOMMERCE_ENGINE" showUpgrade={false} fallback={
              <div className="p-4 bg-white rounded-lg border border-orange-200">
                <h3 className="font-semibold text-gray-900 mb-2">E-commerce</h3>
                <p className="text-sm text-gray-600 mb-3">
                  Tienda online completa con pagos y gestión de inventario.
                </p>
                <Link href="/admin/billing/upgrade?feature=ECOMMERCE_ENGINE">
                  <Button size="sm" variant="outline" className="border-orange-300 text-orange-700 hover:bg-orange-50">
                    Activar por $35/mes
                    <ArrowUpRight className="w-3 h-3 ml-1" />
                  </Button>
                </Link>
              </div>
            }>
              <div />
            </FeatureGuard>

            <FeatureGuard feature="FORMS_MODULE" showUpgrade={false} fallback={
              <div className="p-4 bg-white rounded-lg border border-orange-200">
                <h3 className="font-semibold text-gray-900 mb-2">Formularios Avanzados</h3>
                <p className="text-sm text-gray-600 mb-3">
                  Constructor de formularios con analíticas y automatización.
                </p>
                <Link href="/admin/billing/upgrade?feature=FORMS_MODULE">
                  <Button size="sm" variant="outline" className="border-orange-300 text-orange-700 hover:bg-orange-50">
                    Activar por $15/mes
                    <ArrowUpRight className="w-3 h-3 ml-1" />
                  </Button>
                </Link>
              </div>
            }>
              <div />
            </FeatureGuard>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

interface DashboardSectionProps {
  section: DashboardSection;
}

function DashboardSection({ section }: DashboardSectionProps) {
  return (
    <FeatureGuard feature={section.feature as FeatureType} showUpgrade={false}>
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-900">{section.title}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {section.widgets.map((widget) => (
            <DashboardWidget key={widget.id} widget={widget} />
          ))}
        </div>
      </div>
    </FeatureGuard>
  );
}

interface DashboardWidgetProps {
  widget: DashboardWidget;
}

function DashboardWidget({ widget }: DashboardWidgetProps) {
  const getWidgetSize = () => {
    switch (widget.size) {
      case 'large':
        return 'md:col-span-2 lg:col-span-2';
      case 'medium':
        return 'md:col-span-1 lg:col-span-2';
      default:
        return 'md:col-span-1 lg:col-span-1';
    }
  };

  const getChangeColor = () => {
    switch (widget.changeType) {
      case 'positive':
        return 'text-green-600';
      case 'negative':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const content = (
    <Card className={`hover:shadow-md transition-shadow ${getWidgetSize()}`}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <widget.icon className="w-8 h-8 text-blue-600" />
          {widget.change && (
            <span className={`text-sm font-medium ${getChangeColor()}`}>
              {widget.change}
            </span>
          )}
        </div>
        
        <div className="space-y-2">
          <h3 className="font-semibold text-gray-900">{widget.title}</h3>
          <p className="text-sm text-gray-600">{widget.description}</p>
          
          {widget.value && (
            <p className="text-2xl font-bold text-gray-900">{widget.value}</p>
          )}
          
          {widget.action && (
            <div className="pt-2">
              <span className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                {widget.action} →
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  if (widget.href) {
    return <Link href={widget.href}>{content}</Link>;
  }

  return content;
} 