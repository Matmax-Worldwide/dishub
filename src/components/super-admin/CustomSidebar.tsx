"use client";

import { useState } from 'react';
import { FeatureType, useFeatureAccess } from '@/hooks/useFeatureAccess';
import { FeatureGuard } from '@/components/FeatureGuard';
import Link from 'next/link';
import { useParams, usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  FileText, 
  MessageSquare, 
  Calendar, 
  ShoppingCart,
  Settings,
  Zap,
  Users,
  BarChart3,
  Mail,
  Image,
  CreditCard,
  ChevronDown,
  ChevronRight,
  Building,
  Package,
  ShoppingBag,
  MapPin,
  Clock,
  FormInput,
  Megaphone,
  Star,
  Palette,
  Globe,
  Shield,
  HelpCircle,
  Menu,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface SidebarSection {
  id: string;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  feature?: string;
  items: SidebarItem[];
  badge?: string;
  isCollapsible?: boolean;
}

interface SidebarItem {
  id: string;
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  feature?: string;
  badge?: string;
  description?: string;
}

  const SIDEBAR_SECTIONS = (locale: string, tenantSlug: string): SidebarSection[] => [
  {
    id: 'dashboard',
    title: 'Dashboard',
    icon: LayoutDashboard,
    items: [
      {
        id: 'overview',
        title: 'Resumen',
        href: `/${locale}/${tenantSlug}/dashboard`,
        icon: BarChart3,
        description: 'Vista general del sistema'
      },
      {
        id: 'analytics',
        title: 'Analíticas',
        href: `/${locale}/${tenantSlug}/dashboard/analytics`,
        icon: BarChart3,
        description: 'Métricas y estadísticas'
      }
    ]
  },
  {
    id: 'cms',
    title: 'Gestión de Contenido',
    icon: FileText,
    feature: 'CMS_ENGINE',
    isCollapsible: true,
    items: [
      {
        id: 'pages',
        title: 'Páginas',
        href: `/${locale}/${tenantSlug}/cms/pages`,
        icon: FileText,
        feature: 'CMS_ENGINE',
        description: 'Crear y editar páginas'
      },
      {
        id: 'sections',
        title: 'Secciones',
        href: `/${locale}/${tenantSlug}/cms/sections`,
        icon: Palette,
        feature: 'CMS_ENGINE',
        description: 'Componentes reutilizables'
      },
      {
        id: 'media',
        title: 'Medios',
        href: `/${locale}/${tenantSlug}/cms/media`,
        icon: Image,
        feature: 'CMS_ENGINE',
        description: 'Imágenes y archivos'
      },
      {
        id: 'menus',
        title: 'Menús',
        href: `/${locale}/${tenantSlug}/cms/menus`,
        icon: Menu,
        feature: 'CMS_ENGINE',
        description: 'Navegación del sitio'
      }
    ]
  },
  {
    id: 'blog',
    title: 'Blog',
    icon: MessageSquare,
    feature: 'BLOG_MODULE',
    badge: 'Premium',
    isCollapsible: true,
    items: [
      {
        id: 'posts',
        title: 'Artículos',
        href: `/${locale}/${tenantSlug}/cms/blog/posts`,
        icon: MessageSquare,
        feature: 'BLOG_MODULE',
        description: 'Crear y gestionar artículos'
      },
      {
        id: 'categories',
        title: 'Categorías',
        href: `/${locale}/${tenantSlug}/cms/blog/categories`,
        icon: Package,
        feature: 'BLOG_MODULE',
        description: 'Organizar contenido'
      },
      {
        id: 'comments',
        title: 'Comentarios',
        href: `/${locale}/${tenantSlug}/cms/blog/comments`,
        icon: MessageSquare,
        feature: 'BLOG_MODULE',
        description: 'Moderar comentarios'
      }
    ]
  },
  {
    id: 'forms',
    title: 'Formularios',
    icon: FormInput,
    feature: 'FORMS_MODULE',
    badge: 'Premium',
    isCollapsible: true,
    items: [
      {
        id: 'form-builder',
        title: 'Constructor',
        href: `/${locale}/${tenantSlug}/cms/forms`,
        icon: FormInput,
        feature: 'FORMS_MODULE',
        description: 'Crear formularios'
      },
      {
        id: 'submissions',
        title: 'Respuestas',
        href: `/${locale}/${tenantSlug}/cms/forms/submissions`,
        icon: Mail,
        feature: 'FORMS_MODULE',
        description: 'Ver envíos'
      },
      {
        id: 'form-analytics',
        title: 'Analíticas',
        href: `/${locale}/${tenantSlug}/cms/forms/analytics`,
        icon: BarChart3,
        feature: 'FORMS_MODULE',
        description: 'Estadísticas de formularios'
      }
    ]
  },
  {
    id: 'bookings',
    title: 'Reservas',
    icon: Calendar,
    feature: 'BOOKING_ENGINE',
    badge: 'Premium',
    isCollapsible: true,
    items: [
      {
        id: 'calendar',
        title: 'Calendario',
          href: `/${locale}/${tenantSlug}/bookings/calendar`,
        icon: Calendar,
        feature: 'BOOKING_ENGINE',
        description: 'Vista de calendario'
      },
      {
        id: 'services',
        title: 'Servicios',
        href: `/${locale}/${tenantSlug}/bookings/services`,
        icon: Megaphone,
        feature: 'BOOKING_ENGINE',
        description: 'Gestionar servicios'
      },
      {
        id: 'staff',
        title: 'Personal',
        href: `/${locale}/${tenantSlug}/bookings/staff`,
        icon: Users,
        feature: 'BOOKING_ENGINE',
        description: 'Equipo de trabajo'
      },
      {
        id: 'locations',
        title: 'Ubicaciones',
        href: `/${locale}/${tenantSlug}/bookings/locations`,
        icon: MapPin,
        feature: 'BOOKING_ENGINE',
        description: 'Lugares de servicio'
      },
      {
        id: 'booking-rules',
        title: 'Reglas',
        href: `/${locale}/${tenantSlug}/bookings/rules`,
        icon: Clock,
        feature: 'BOOKING_ENGINE',
        description: 'Configurar disponibilidad'
      }
    ]
  },
  {
    id: 'ecommerce',
    title: 'E-commerce',
    icon: ShoppingCart,
    feature: 'ECOMMERCE_ENGINE',
    badge: 'Premium',
    isCollapsible: true,
    items: [
      {
        id: 'products',
        title: 'Productos',
        href: `/${locale}/${tenantSlug}/commerce/products`,
        icon: Package,
        feature: 'ECOMMERCE_ENGINE',
        description: 'Catálogo de productos'
      },
      {
        id: 'orders',
        title: 'Pedidos',
        href: `/${locale}/${tenantSlug}/commerce/orders`,
        icon: ShoppingBag,
        feature: 'ECOMMERCE_ENGINE',
        description: 'Gestionar pedidos'
      },
      {
        id: 'customers',
        title: 'Clientes',
        href: `/${locale}/${tenantSlug}/commerce/customers`,
        icon: Users,
        feature: 'ECOMMERCE_ENGINE',
        description: 'Base de clientes'
      },
      {
        id: 'reviews',
        title: 'Reseñas',
        href: `/${locale}/${tenantSlug}/commerce/reviews`,
        icon: Star,
        feature: 'ECOMMERCE_ENGINE',
        description: 'Opiniones de clientes'
      },
      {
        id: 'payments',
        title: 'Pagos',
        href: `/${locale}/${tenantSlug}/commerce/payments`,
        icon: CreditCard,
        feature: 'ECOMMERCE_ENGINE',
        description: 'Transacciones'
      }
    ]
  },
  {
    id: 'settings',
    title: 'Configuración',
    icon: Settings,
    isCollapsible: true,
    items: [
      {
        id: 'general',
        title: 'General',
        href: `/${locale}/${tenantSlug}/settings`,
        icon: Settings,
        description: 'Configuración básica'
      },
      {
        id: 'users',
        title: 'Usuarios',
        href: `/${locale}/${tenantSlug}/settings/users`,
        icon: Users,
        description: 'Gestionar usuarios'
      },
      {
        id: 'roles',
        title: 'Roles',
        href: `/${locale}/${tenantSlug}/settings/roles`,
        icon: Shield,
        description: 'Permisos y roles'
      },
      {
        id: 'domain',
        title: 'Dominio',
          href: `/${locale}/${tenantSlug}/settings/domain`,
        icon: Globe,
        description: 'Configurar dominio'
      }
    ]
  }
];

interface CustomSidebarProps {
  className?: string;
}

export function CustomSidebar({ className }: CustomSidebarProps) {
  const { locale, tenantSlug } = useParams();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [expandedSections, setExpandedSections] = useState<string[]>(['dashboard', 'cms']);
  const { calculateCost, getAvailableFeatures } = useFeatureAccess();
  const pathname = usePathname();
  const monthlyCost = calculateCost();
  const availableFeatures = getAvailableFeatures();

  const localeStr = locale as string || 'en';
  const tenantSlugStr = tenantSlug as string || '';

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => 
      prev.includes(sectionId) 
        ? prev.filter(id => id !== sectionId)
        : [...prev, sectionId]
    );
  };

  const isItemActive = (href: string) => {
    return pathname === href || pathname.startsWith(href + '/');
  };

  return (
    <div className={`bg-white border-r border-gray-200 flex flex-col h-full ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
              <Building className="w-5 h-5 text-white" />
            </div>
            {!isCollapsed && (
              <div>
                <h2 className="font-semibold text-gray-900">Admin Panel</h2>
                <p className="text-xs text-gray-500">${monthlyCost}/mes</p>
              </div>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1"
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <X className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      {/* Plan Status */}
      {!isCollapsed && (
        <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-blue-900">Features Activas</span>
            <Badge variant="secondary" className="bg-blue-100 text-blue-800">
              {availableFeatures.length}
            </Badge>
          </div>
          <div className="text-xs text-blue-600 mb-3">
            {availableFeatures.map(f => f).join(', ')}
          </div>
          <Link href="/admin/billing/upgrade">
            <Button size="sm" className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
              <Zap className="w-3 h-3 mr-1" />
              Actualizar Plan
            </Button>
          </Link>
        </div>
      )}

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto p-2">
        <nav className="space-y-1">
          {SIDEBAR_SECTIONS(localeStr, tenantSlugStr).map((section) => (
            <SidebarSection
              key={section.id}
              section={section}
              isCollapsed={isCollapsed}
              isExpanded={expandedSections.includes(section.id)}
              onToggle={() => toggleSection(section.id)}
              isItemActive={isItemActive}
            />
          ))}
        </nav>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200">
        {!isCollapsed && (
          <div className="space-y-2">
            <Link href="/admin/help">
              <Button variant="ghost" size="sm" className="w-full justify-start">
                <HelpCircle className="w-4 h-4 mr-2" />
                Ayuda
              </Button>
            </Link>
            <Link href="/admin/billing">
              <Button variant="ghost" size="sm" className="w-full justify-start">
                <CreditCard className="w-4 h-4 mr-2" />
                Facturación
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

interface SidebarSectionProps {
  section: SidebarSection;
  isCollapsed: boolean;
  isExpanded: boolean;
  onToggle: () => void;
  isItemActive: (href: string) => boolean;
}

function SidebarSection({ 
  section, 
  isCollapsed, 
  isExpanded, 
  onToggle, 
  isItemActive 
}: SidebarSectionProps) {
  const { hasFeature } = useFeatureAccess();
  const feature = section.feature as FeatureType;
  // Si la sección requiere una feature específica, verificar acceso
  if (section.feature && !hasFeature(feature)) {
    if (isCollapsed) return null;
    
    return (
      <div className="px-2 py-1">
        <Link href="/admin/billing/upgrade">
          <div className="flex items-center px-3 py-2 text-sm font-medium text-gray-400 hover:text-gray-500 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer">
            <section.icon className="w-4 h-4 mr-3 text-gray-300" />
            <span className="flex-1">{section.title}</span>
            {section.badge && (
              <Badge variant="outline" className="ml-2 text-xs border-orange-200 text-orange-600">
                {section.badge}
              </Badge>
            )}
            <div className="ml-2 text-gray-300">🔒</div>
          </div>
        </Link>
      </div>
    );
  }

  const hasActiveItem = section.items.some(item => isItemActive(item.href));

  return (
    <div className="space-y-1">
      {/* Section Header */}
      {section.isCollapsible ? (
        <button
          onClick={onToggle}
          className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
            hasActiveItem 
              ? 'bg-blue-50 text-blue-700' 
              : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
          }`}
        >
          <section.icon className={`w-4 h-4 mr-3 ${hasActiveItem ? 'text-blue-600' : 'text-gray-500'}`} />
          {!isCollapsed && (
            <>
              <span className="flex-1 text-left">{section.title}</span>
              {section.badge && (
                <Badge variant="outline" className="ml-2 text-xs">
                  {section.badge}
                </Badge>
              )}
              {isExpanded ? (
                <ChevronDown className="w-4 h-4 ml-2" />
              ) : (
                <ChevronRight className="w-4 h-4 ml-2" />
              )}
            </>
          )}
        </button>
      ) : (
        <div className={`flex items-center px-3 py-2 text-sm font-medium ${
          hasActiveItem ? 'text-blue-700' : 'text-gray-700'
        }`}>
          <section.icon className={`w-4 h-4 mr-3 ${hasActiveItem ? 'text-blue-600' : 'text-gray-500'}`} />
          {!isCollapsed && <span>{section.title}</span>}
        </div>
      )}

      {/* Section Items */}
      {(!section.isCollapsible || isExpanded) && !isCollapsed && (
        <div className="ml-4 space-y-1">
          {section.items.map((item) => (
            <SidebarItem
              key={item.id}
              item={item}
              isActive={isItemActive(item.href)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface SidebarItemProps {
  item: SidebarItem;
  isActive: boolean;
}

function SidebarItem({ item, isActive }: SidebarItemProps) {
  return (
    <FeatureGuard 
      feature={item.feature as FeatureType} 
      showUpgrade={false}
      fallback={
        <Link href="/admin/billing/upgrade">
          <div className="flex items-center px-3 py-2 text-sm text-gray-400 hover:text-gray-500 hover:bg-gray-50 rounded-lg transition-colors">
            <item.icon className="w-4 h-4 mr-3 text-gray-300" />
            <span className="flex-1">{item.title}</span>
            {item.badge && (
              <Badge variant="outline" className="ml-2 text-xs border-orange-200 text-orange-600">
                {item.badge}
              </Badge>
            )}
            <div className="ml-2 text-gray-300">🔒</div>
          </div>
        </Link>
      }
    >
      <Link href={item.href}>
        <div className={`flex items-center px-3 py-2 text-sm rounded-lg transition-colors ${
          isActive
            ? 'bg-blue-100 text-blue-700 font-medium'
            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
        }`}>
          <item.icon className={`w-4 h-4 mr-3 ${isActive ? 'text-blue-600' : 'text-gray-400'}`} />
          <span className="flex-1">{item.title}</span>
          {item.badge && (
            <Badge variant="outline" className="ml-2 text-xs">
              {item.badge}
            </Badge>
          )}
        </div>
      </Link>
    </FeatureGuard>
  );
} 