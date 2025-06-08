'use client';

import { useParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { usePermission } from '@/hooks/usePermission';
import { useFeatureAccess } from '@/hooks/useFeatureAccess';
import { useEffect, useMemo } from 'react';
import { client } from '@/lib/apollo-client';
import { gql, useQuery } from '@apollo/client';
import Link from 'next/link';
import { 
  CalendarIcon, 
  ShoppingCartIcon, 
  FileTextIcon, 
  UsersIcon,
  BarChartIcon,
  DollarSignIcon,
  ClockIcon,
  BellIcon,
  SettingsIcon,
  PlusIcon,
  ArrowRightIcon,
  ScaleIcon,
  TrendingUpIcon,
  ActivityIcon
} from 'lucide-react';

// Import UserTenant type for extended user data
import { UserTenant } from '@/lib/graphql-client';

// Define types for GraphQL responses
interface BookingNode {
  id: string;
  status: string;
  customerName?: string | null;
  customerEmail?: string | null;
  service: { name: string };
  bookingDate: string;
  startTime: string;
  createdAt: string;
}

interface Page {
  id: string;
  title: string;
  isPublished: boolean;
  createdAt: string;
}

interface Order {
  id: string;
  totalAmount: number;
  status: string;
  customerName?: string | null;
  customerEmail?: string | null;
  currency: { symbol: string };
  createdAt: string;
}

interface Activity {
  id: string | number;
  type: string;
  message: string;
  time: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

interface BusinessStat {
  name: string;
  value: string;
  change: string;
  changeType: 'positive' | 'negative' | 'neutral';
  icon: React.ComponentType<{ className?: string }>;
}

// Extended user interface that includes userTenants
interface ExtendedUser {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: {
    id: string;
    name: string;
  };
  userTenants?: UserTenant[];
}

// GraphQL Queries for real data
const GET_DASHBOARD_STATS = gql`
  query GetDashboardStats($startDate: DateTime!, $endDate: DateTime!) {
    # Get booking stats if booking engine is enabled
    bookings(filter: { 
      startDate: $startDate
      endDate: $endDate
    }) {
      edges {
        node {
          id
          status
          customerName
          service { name }
          bookingDate
          startTime
          createdAt
        }
      }
      totalCount
    }
    
    # Get recent bookings for activity feed
    recentBookings: bookings(pagination: { pageSize: 5 }) {
      edges {
        node {
          id
          customerName
          customerEmail
          service { name }
          bookingDate
          startTime
          status
          createdAt
        }
      }
    }
    
    # Get CMS pages count
    getAllCMSPages {
      id
      title
      isPublished
      createdAt
    }
    
    # Get forms count if forms module is enabled
    forms {
      id
      title
      isActive
      createdAt
    }
    
    # Get blog posts if blog module is enabled
    posts {
      id
      title
      status
      createdAt
    }
  }
`;

const GET_ECOMMERCE_STATS = gql`
  query GetEcommerceStats($dateFrom: DateTime!, $dateTo: DateTime!) {
    orders(filter: {
      dateFrom: $dateFrom
      dateTo: $dateTo
    }) {
      id
      totalAmount
      status
      customerName
      customerEmail
      currency { symbol }
      createdAt
    }
    
    products {
      id
      name
      stockQuantity
    }
    
    recentOrders: orders(pagination: { pageSize: 5 }) {
      id
      customerName
      totalAmount
      status
      currency { symbol }
      createdAt
    }
  }
`;

const GET_TENANT_INFO = gql`
  query GetTenantInfo($tenantId: ID!) {
    tenant(id: $tenantId) {
      id
      name
      slug
      features
      userCount
      pageCount
      postCount
    }
  }
`;

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

  // Get current user tenant to get tenant ID
  const currentUserTenant = useMemo(() => {
    return (user as ExtendedUser)?.userTenants?.find(
      (ut: UserTenant) => ut.tenant.slug === params.tenantSlug
    );
  }, [(user as ExtendedUser)?.userTenants, params.tenantSlug]);

  // Prepare date variables for queries (as DateTime objects)
  const today = new Date();
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const endOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  // Load dashboard statistics
  const { data: dashboardData, loading: dashboardLoading } = useQuery(GET_DASHBOARD_STATS, {
    variables: {
      startDate: startOfToday.toISOString(),
      endDate: endOfToday.toISOString()
    },
    skip: !tenantFeatures.includes('BOOKING_ENGINE') && !tenantFeatures.includes('CMS_ENGINE'),
    errorPolicy: 'all'
  });

  // Load ecommerce statistics if ecommerce engine is enabled
  const { data: ecommerceData, error: ecommerceError } = useQuery(GET_ECOMMERCE_STATS, {
    variables: {
      dateFrom: firstDayOfMonth.toISOString(),
      dateTo: endOfToday.toISOString()
    },
    skip: !tenantFeatures.includes('ECOMMERCE_ENGINE'),
    errorPolicy: 'all',
    notifyOnNetworkStatusChange: true
  });

  // Log ecommerce errors for debugging
  if (ecommerceError) {
    console.error('Ecommerce query error:', ecommerceError);
  }

  // Load tenant information
  const { data: tenantData } = useQuery(GET_TENANT_INFO, {
    variables: { tenantId: currentUserTenant?.tenantId || '' },
    skip: !currentUserTenant?.tenantId,
    errorPolicy: 'all'
  });

  // Get enabled engines based on tenant features
  const enabledEngines = useMemo(() => {
    const engines = [];
    
    // CMS Engine - Always available
    const pagesCount = dashboardData?.getAllCMSPages?.length || 0;
    const publishedPages = dashboardData?.getAllCMSPages?.filter((p: Page) => p.isPublished)?.length || 0;
    
    engines.push({
      name: 'CMS Engine',
      description: 'Administra tu sitio web, páginas y contenido',
      icon: FileTextIcon,
      href: `/${params.locale}/${params.tenantSlug}/cms`,
      color: 'bg-blue-500',
      stats: { páginas: publishedPages, total: pagesCount },
      enabled: true
    });

    // Booking Engine
    if (tenantFeatures.includes('BOOKING_ENGINE')) {
      const todayBookings = dashboardData?.bookings?.totalCount || 0;
      const recentBookings = dashboardData?.recentBookings?.edges?.length || 0;
      
      engines.push({
        name: 'Bukmi',
        description: 'Gestiona citas y reservas de tus clientes',
        icon: CalendarIcon,
        href: `/${params.locale}/${params.tenantSlug}/bookings`,
        color: 'bg-green-500',
        stats: { hoy: todayBookings, total: recentBookings },
        enabled: true
      });
    }

    // E-commerce Engine
    if (tenantFeatures.includes('ECOMMERCE_ENGINE')) {
      const productsCount = ecommerceData?.products?.length || 0;
      const ordersCount = ecommerceData?.orders?.length || 0;
      
      engines.push({
        name: 'Comercio Online',
        description: 'Vende productos y gestiona tu inventario',
        icon: ShoppingCartIcon,
        href: `/${params.locale}/${params.tenantSlug}/commerce`,
        color: 'bg-purple-500',
        stats: { productos: productsCount, pedidos: ordersCount },
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
        stats: { casos: 0, documentos: 0 }, // TODO: Add legal engine queries
        enabled: true
      });
    }

    return engines;
  }, [tenantFeatures, params.locale, params.tenantSlug, dashboardData, ecommerceData]);

  // Calculate real business stats
  const businessStats = useMemo((): BusinessStat[] => {
    const stats: BusinessStat[] = [];

    // Revenue stats from ecommerce
    if (tenantFeatures.includes('ECOMMERCE_ENGINE') && ecommerceData?.orders && Array.isArray(ecommerceData.orders)) {
      const monthlyRevenue = ecommerceData.orders.reduce((total: number, order: Order) => {
        return total + (order.totalAmount || 0);
      }, 0);
      
      const currency = ecommerceData.orders[0]?.currency?.symbol || '$';
      
      stats.push({
        name: 'Ventas del Mes',
        value: `${currency}${monthlyRevenue.toLocaleString()}`,
        change: '+12%', // TODO: Calculate real change
        changeType: 'positive',
        icon: DollarSignIcon
      });
    }

    // Customer stats from bookings and orders
    const uniqueCustomers = new Set();
    
    if (dashboardData?.recentBookings?.edges) {
      dashboardData.recentBookings.edges.forEach((edge: { node: BookingNode }) => {
        if (edge.node.customerEmail) uniqueCustomers.add(edge.node.customerEmail);
      });
    }
    
    if (ecommerceData?.recentOrders && Array.isArray(ecommerceData.recentOrders)) {
      ecommerceData.recentOrders.forEach((order: Order) => {
        if (order.customerEmail) uniqueCustomers.add(order.customerEmail);
      });
    }

    if (uniqueCustomers.size > 0) {
      stats.push({
        name: 'Clientes Únicos',
        value: uniqueCustomers.size.toString(),
        change: '+5%', // TODO: Calculate real change
        changeType: 'positive',
        icon: UsersIcon
      });
    }

    // Booking stats
    if (tenantFeatures.includes('BOOKING_ENGINE') && dashboardData?.bookings) {
      stats.push({
        name: 'Reservas Hoy',
        value: dashboardData.bookings.totalCount.toString(),
        change: '+2',
        changeType: 'positive',
        icon: CalendarIcon
      });
    }

    // Content stats
    const totalContent = (dashboardData?.getAllCMSPages?.length || 0) + 
                        (dashboardData?.posts?.length || 0) + 
                        (dashboardData?.forms?.length || 0);
    
    if (totalContent > 0) {
      stats.push({
        name: 'Contenido Total',
        value: totalContent.toString(),
        change: '+3',
        changeType: 'positive',
        icon: FileTextIcon
      });
    }

    // Default stats if no data available
    if (stats.length === 0) {
      stats.push(
        {
          name: 'Páginas Publicadas',
          value: (dashboardData?.getAllCMSPages?.filter((p: Page) => p.isPublished)?.length || 0).toString(),
          change: '+1',
          changeType: 'positive',
          icon: FileTextIcon
        },
        {
          name: 'Usuarios del Sistema',
          value: (tenantData?.tenant?.userCount || 0).toString(),
          change: '0',
          changeType: 'neutral',
          icon: UsersIcon
        }
      );
    }

    return stats;
  }, [tenantFeatures, dashboardData, ecommerceData, tenantData]);

  // Recent activities from real data
  const recentActivities = useMemo((): Activity[] => {
    const activities: Activity[] = [];

    // Add booking activities
    if (dashboardData?.recentBookings?.edges) {
      dashboardData.recentBookings.edges.slice(0, 3).forEach((edge: { node: BookingNode }) => {
        const booking = edge.node;
        activities.push({
          id: `booking-${booking.id}`,
          type: 'booking',
          message: `Nueva reserva de ${booking.customerName || 'Cliente'} para ${booking.service?.name}`,
          time: new Date(booking.createdAt).toLocaleString('es-ES', { 
            hour: '2-digit', 
            minute: '2-digit',
            day: '2-digit',
            month: '2-digit'
          }),
          icon: CalendarIcon,
          color: 'text-green-600'
        });
      });
    }

    // Add order activities
    if (ecommerceData?.recentOrders && Array.isArray(ecommerceData.recentOrders)) {
      ecommerceData.recentOrders.slice(0, 2).forEach((order: Order) => {
        activities.push({
          id: `order-${order.id}`,
          type: 'order',
          message: `Pedido completado - ${order.currency?.symbol}${order.totalAmount}`,
          time: new Date(order.createdAt).toLocaleString('es-ES', { 
            hour: '2-digit', 
            minute: '2-digit',
            day: '2-digit',
            month: '2-digit'
          }),
          icon: ShoppingCartIcon,
          color: 'text-purple-600'
        });
      });
    }

    // Sort by creation date
    activities.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

    // Default activities if no real data
    if (activities.length === 0) {
      activities.push({
        id: 1,
        type: 'system',
        message: 'Sistema iniciado correctamente',
        time: 'Hace 1 hora',
        icon: ActivityIcon,
        color: 'text-blue-600'
      });
    }

    return activities.slice(0, 4);
  }, [dashboardData, ecommerceData]);

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

  if (isLoading || dashboardLoading) {
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
                Dashboard de {user?.firstName} {user?.lastName} | {tenantData?.tenant?.name || params.tenantSlug}
              </h1>
              <p className="mt-1 text-lg text-gray-600">
                Resumen de tu negocio <span className="font-semibold text-indigo-600">{tenantData?.tenant?.name || params.tenantSlug}</span>
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
                        stat.changeType === 'positive' ? 'text-green-600' : 
                        stat.changeType === 'negative' ? 'text-red-600' : 'text-gray-600'
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
              <p className="text-lg font-semibold text-gray-900">{tenantData?.tenant?.name || params.tenantSlug}</p>
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