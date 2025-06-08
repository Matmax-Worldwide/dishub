'use client';

import { useParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { usePermission } from '@/hooks/usePermission';
import { useFeatureAccess } from '@/hooks/useFeatureAccess';
import { useEffect, useMemo } from 'react';
import { client } from '@/lib/apollo-client';
import Link from 'next/link';
import { 
  CalendarIcon, 
  ShoppingCartIcon, 
  FileTextIcon, 
  UsersIcon,
  BarChartIcon,
  DollarSignIcon,
  ClockIcon,
  StarIcon,
  BellIcon,
  SettingsIcon,
  PlusIcon,
  ArrowRightIcon,
  ScaleIcon,
  TrendingUpIcon,
  ActivityIcon
} from 'lucide-react';

export default function TenantDashboard() {
  const params = useParams();
  const { user, isLoading } = useAuth();
  const { hasRole } = usePermission();
  const { features: tenantFeatures } = useFeatureAccess();

  // Check if user has access to this tenant dashboard - simplified to avoid loops
  useEffect(() => {
    if (!isLoading && !user) {
      console.log('No user detected, redirecting to login');
      // Clear cache and redirect unauthorized users to login
      client.clearStore().then(() => {
        window.location.href = `/${params.locale}/login`;
      });
    }
  }, [isLoading, user?.id, params.locale]); // Only depend on user ID, not entire user object

  // Get enabled engines based on tenant features
  const enabledEngines = useMemo(() => {
    const engines = [];
    
    // CMS Engine - Always available
    engines.push({
      name: 'Gestión de Contenido',
      description: 'Administra tu sitio web, páginas y contenido',
      icon: FileTextIcon,
      href: `/${params.locale}/${params.tenantSlug}/cms`,
      color: 'bg-blue-500',
      stats: { pages: 12, media: 45 },
      enabled: true
    });

    // Booking Engine
    if (tenantFeatures.includes('BOOKING_ENGINE')) {
      engines.push({
        name: 'Sistema de Reservas',
        description: 'Gestiona citas y reservas de tus clientes',
        icon: CalendarIcon,
        href: `/${params.locale}/${params.tenantSlug}/bookings`,
        color: 'bg-green-500',
        stats: { today: 8, week: 32 },
        enabled: true
      });
    }

    // E-commerce Engine
    if (tenantFeatures.includes('ECOMMERCE_ENGINE')) {
      engines.push({
        name: 'Tienda Online',
        description: 'Vende productos y gestiona tu inventario',
        icon: ShoppingCartIcon,
        href: `/${params.locale}/${params.tenantSlug}/commerce`,
        color: 'bg-purple-500',
        stats: { products: 156, orders: 23 },
        enabled: true
      });
    }

    // Legal Engine
    if (tenantFeatures.includes('LEGAL_ENGINE')) {
      engines.push({
        name: 'Gestión Legal',
        description: 'Administra casos legales y documentos',
        icon: ScaleIcon,
        href: `/${params.locale}/${params.tenantSlug}/dashboard/legal`,
        color: 'bg-amber-500',
        stats: { cases: 15, documents: 89 },
        enabled: true
      });
    }

    return engines;
  }, [tenantFeatures, params.locale, params.tenantSlug]);

  // Quick stats for business overview
  const businessStats = [
    {
      name: 'Ventas del Mes',
      value: '$12,450',
      change: '+12%',
      changeType: 'positive',
      icon: DollarSignIcon
    },
    {
      name: 'Clientes Activos',
      value: '1,234',
      change: '+5%',
      changeType: 'positive',
      icon: UsersIcon
    },
    {
      name: 'Reservas Hoy',
      value: '8',
      change: '+2',
      changeType: 'positive',
      icon: CalendarIcon
    },
    {
      name: 'Satisfacción',
      value: '4.8/5',
      change: '+0.2',
      changeType: 'positive',
      icon: StarIcon
    }
  ];

  // Recent activities
  const recentActivities = [
    {
      id: 1,
      type: 'booking',
      message: 'Nueva reserva de María González para mañana a las 10:00',
      time: 'Hace 5 minutos',
      icon: CalendarIcon,
      color: 'text-green-600'
    },
    {
      id: 2,
      type: 'order',
      message: 'Pedido #1234 completado - $89.99',
      time: 'Hace 15 minutos',
      icon: ShoppingCartIcon,
      color: 'text-purple-600'
    },
    {
      id: 3,
      type: 'user',
      message: 'Nuevo cliente registrado: Juan Pérez',
      time: 'Hace 1 hora',
      icon: UsersIcon,
      color: 'text-blue-600'
    },
    {
      id: 4,
      type: 'review',
      message: 'Nueva reseña 5 estrellas recibida',
      time: 'Hace 2 horas',
      icon: StarIcon,
      color: 'text-yellow-600'
    }
  ];

  // Quick actions for business management
  const quickActions = [
    {
      name: 'Gestionar Usuarios',
      description: 'Administra empleados y permisos',
      icon: UsersIcon,
      href: `/${params.locale}/${params.tenantSlug}/dashboard/users`,
      color: 'bg-blue-500'
    },
    {
      name: 'Configuración',
      description: 'Ajusta la configuración de tu negocio',
      icon: SettingsIcon,
      href: `/${params.locale}/${params.tenantSlug}/dashboard/company`,
      color: 'bg-gray-500'
    },
    {
      name: 'Reportes',
      description: 'Ve estadísticas y análisis detallados',
      icon: BarChartIcon,
      href: `/${params.locale}/${params.tenantSlug}/dashboard/reports`,
      color: 'bg-indigo-500'
    },
    {
      name: 'Notificaciones',
      description: 'Gestiona comunicaciones con clientes',
      icon: BellIcon,
      href: `/${params.locale}/${params.tenantSlug}/dashboard/notifications`,
      color: 'bg-orange-500'
    }
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  // Determine user role for display
  const getUserRoleDisplay = () => {
    if (hasRole('SuperAdmin')) return 'Super Administrador';
    if (hasRole('TenantAdmin')) return 'Administrador';
    if (hasRole('TenantManager')) return 'Gerente';
    if (hasRole('Employee')) return 'Empleado';
    return 'Usuario';
  };

  const getUserRoleColor = () => {
    if (hasRole('SuperAdmin')) return 'bg-red-100 text-red-800';
    if (hasRole('TenantAdmin')) return 'bg-purple-100 text-purple-800';
    if (hasRole('TenantManager')) return 'bg-blue-100 text-blue-800';
    if (hasRole('Employee')) return 'bg-green-100 text-green-800';
    return 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Bienvenido de vuelta
              </h1>
              <p className="mt-1 text-lg text-gray-600">
                Resumen de tu negocio <span className="font-semibold text-indigo-600">{params.tenantSlug}</span>
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <span className={`px-4 py-2 text-sm rounded-full font-medium ${getUserRoleColor()}`}>
                {getUserRoleDisplay()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        {/* Business Stats */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Resumen del Negocio</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {businessStats.map((stat) => (
              <div key={stat.name} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                      <stat.icon className="h-6 w-6 text-gray-600" />
                    </div>
                  </div>
                  <div className="ml-4 flex-1">
                    <h3 className="text-sm font-medium text-gray-500">{stat.name}</h3>
                    <div className="flex items-center">
                      <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                      <span className={`ml-2 text-sm font-medium flex items-center ${
                        stat.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        <TrendingUpIcon className="h-4 w-4 mr-1" />
                        {stat.change}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Enabled Engines */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Herramientas de Negocio</h2>
            <Link 
              href={`/${params.locale}/${params.tenantSlug}/dashboard/modules`}
              className="text-indigo-600 hover:text-indigo-800 text-sm font-medium flex items-center group"
            >
              Ver todas 
              <ArrowRightIcon className="ml-1 h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {enabledEngines.map((engine) => (
              <Link key={engine.name} href={engine.href}>
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-lg transition-all duration-200 cursor-pointer group">
                  <div className="flex items-center mb-4">
                    <div className={`w-12 h-12 ${engine.color} rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform`}>
                      <engine.icon className="h-6 w-6 text-white" />
                    </div>
                    <div className="ml-4">
                      <h3 className="text-lg font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">
                        {engine.name}
                      </h3>
                      <p className="text-sm text-gray-600">{engine.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex space-x-4 text-sm text-gray-500">
                      {Object.entries(engine.stats).map(([key, value]) => (
                        <span key={key}>
                          <span className="font-medium">{value}</span> {key}
                        </span>
                      ))}
                    </div>
                    <ArrowRightIcon className="h-4 w-4 text-gray-400 group-hover:text-indigo-600 transition-colors" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Activities */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <ActivityIcon className="h-5 w-5 text-gray-600 mr-2" />
                <h2 className="text-lg font-semibold text-gray-900">Actividad Reciente</h2>
              </div>
              <Link 
                href={`/${params.locale}/${params.tenantSlug}/dashboard/reports/activity`}
                className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
              >
                Ver todo
              </Link>
            </div>
            <div className="space-y-4">
              {recentActivities.map((activity) => (
                <div key={activity.id} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className={`flex-shrink-0 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center`}>
                    <activity.icon className={`h-4 w-4 ${activity.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900">{activity.message}</p>
                    <p className="text-xs text-gray-500 flex items-center mt-1">
                      <ClockIcon className="h-3 w-3 mr-1" />
                      {activity.time}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Acciones Rápidas</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {quickActions.map((action) => (
                <Link key={action.name} href={action.href}>
                  <div className="p-4 rounded-lg border border-gray-200 hover:border-indigo-300 hover:shadow-md transition-all duration-200 cursor-pointer group">
                    <div className="flex items-center mb-2">
                      <div className={`w-8 h-8 ${action.color} rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform`}>
                        <action.icon className="h-4 w-4 text-white" />
                      </div>
                      <h3 className="ml-3 text-sm font-medium text-gray-900 group-hover:text-indigo-600 transition-colors">
                        {action.name}
                      </h3>
                    </div>
                    <p className="text-xs text-gray-600">{action.description}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Additional Modules Available */}
        <div className="mt-8 bg-gradient-to-r from-indigo-50 to-blue-50 rounded-xl p-6 border border-indigo-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-indigo-900">¿Necesitas más funcionalidades?</h3>
              <p className="text-indigo-700 mt-1">
                Explora módulos adicionales para hacer crecer tu negocio
              </p>
            </div>
            <Link 
              href={`/${params.locale}/${params.tenantSlug}/dashboard/modules/request`}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors flex items-center group"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Explorar Módulos
            </Link>
          </div>
        </div>

        {/* System Information */}
        <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Información del Sistema</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-700">Negocio</h4>
              <p className="text-lg font-semibold text-gray-900">{params.tenantSlug}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-700">Tu Rol</h4>
              <p className="text-lg font-semibold text-gray-900">{getUserRoleDisplay()}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-700">Usuario</h4>
              <p className="text-sm text-gray-600 truncate">{user?.email}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 