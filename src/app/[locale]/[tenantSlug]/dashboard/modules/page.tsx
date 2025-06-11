'use client';

import { useMemo, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useFeatureAccess } from '@/hooks/useFeatureAccess';
import { gql, useQuery, useMutation } from '@apollo/client';
import { client } from '@/lib/apollo-client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  CheckCircleIcon,
  CalendarIcon,
  ShoppingCartIcon,
  FileTextIcon,
  ScaleIcon,
  MessageSquareIcon,
  UsersIcon,
  SendIcon,
  ClockIcon,
  AlertCircleIcon,
  ExternalLinkIcon,
  SettingsIcon,
  ActivityIcon,
  TrendingUpIcon,
  ZapIcon,
  StarIcon,
  ChevronRightIcon
} from 'lucide-react';
import Link from 'next/link';

// Import UserTenant type
import { UserTenant } from '@/lib/graphql-client';

// Extended user interface
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

// GraphQL queries
const GET_TENANT_INFO = gql`
  query GetTenantInfo($tenantId: ID!) {
    tenant(id: $tenantId) {
      id
      name
      slug
      features
      userCount
    }
  }
`;

const GET_MODULE_STATS = gql`
  query GetModuleStats($startDate: DateTime!, $endDate: DateTime!) {
    getAllCMSPages {
      id
      title
      isPublished
    }
    
    bookings(filter: { 
      startDate: $startDate
      endDate: $endDate
    }) {
      totalCount
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
    }
    
    products {
      id
    }
  }
`;

const REQUEST_MODULE = gql`
  mutation RequestModule($input: ModuleRequestInput!) {
    requestModule(input: $input) {
      id
      moduleType
      status
      requestedAt
    }
  }
`;

interface ModuleInfo {
  id: string;
  name: string;
  shortName: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgGradient: string;
  href?: string;
  stats?: { label: string; value: number; trend?: string }[];
  feature: string;
  priority: 'high' | 'medium' | 'low';
  category: 'core' | 'business' | 'specialized';
}

interface AvailableModule {
  id: string;
  name: string;
  shortName: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgGradient: string;
  benefits: string[];
  estimatedSetupTime: string;
  feature: string;
  priority: 'high' | 'medium' | 'low';
  category: 'core' | 'business' | 'specialized';
  popularity: number;
}

export default function ModulesPage() {
  const [selectedModule, setSelectedModule] = useState('');
  const [justification, setJustification] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [showRequestForm, setShowRequestForm] = useState(false);

  const params = useParams();
  const { user, isLoading } = useAuth();
  const { features: tenantFeatures } = useFeatureAccess();

  // Check authentication
  useEffect(() => {
    if (!isLoading && !user) {
      client.clearStore().then(() => {
        window.location.href = `/${params.locale}/login`;
      });
    }
  }, [isLoading, user?.id, params.locale]);

  // Get current user tenant
  const currentUserTenant = useMemo(() => {
    return (user as ExtendedUser)?.userTenants?.find(
      (ut: UserTenant) => ut.tenant.slug === params.tenantSlug
    );
  }, [(user as ExtendedUser)?.userTenants, params.tenantSlug]);

  // Prepare date variables
  const today = new Date();
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const endOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  // Load tenant information
  const { data: tenantData } = useQuery(GET_TENANT_INFO, {
    variables: { tenantId: currentUserTenant?.tenantId || '' },
    skip: !currentUserTenant?.tenantId,
    errorPolicy: 'all'
  });

  // Load module statistics
  const { data: moduleStats } = useQuery(GET_MODULE_STATS, {
    variables: {
      startDate: startOfToday.toISOString(),
      endDate: endOfToday.toISOString()
    },
    errorPolicy: 'all'
  });

  // Load ecommerce statistics
  const { data: ecommerceStats } = useQuery(GET_ECOMMERCE_STATS, {
    variables: {
      dateFrom: firstDayOfMonth.toISOString(),
      dateTo: endOfToday.toISOString()
    },
    skip: !tenantFeatures.includes('ECOMMERCE_ENGINE'),
    errorPolicy: 'all'
  });

  // Request module mutation
  const [requestModule] = useMutation(REQUEST_MODULE);

  // Define active modules with enhanced design
  const activeModules = useMemo((): ModuleInfo[] => {
    const modules: ModuleInfo[] = [
      {
        id: 'cms-engine',
        name: 'Sistema de Contenido',
        shortName: 'CMS',
        description: 'Gestiona tu sitio web y contenido',
        icon: FileTextIcon,
        color: 'text-blue-600',
        bgGradient: 'from-blue-500 to-blue-600',
        href: `/${params.locale}/${params.tenantSlug}/cms`,
        stats: [
          { 
            label: 'Páginas', 
            value: moduleStats?.getAllCMSPages?.filter((p: { isPublished: boolean }) => p.isPublished)?.length || 0,
            trend: '+2'
          }
        ],
        feature: 'CMS_ENGINE',
        priority: 'high',
        category: 'core'
      },
      {
        id: 'booking-engine',
        name: 'Sistema de Reservas',
        shortName: 'Bukmi',
        description: 'Gestiona citas y reservas de clientes',
        icon: CalendarIcon,
        color: 'text-green-600',
        bgGradient: 'from-green-500 to-emerald-600',
        href: `/${params.locale}/${params.tenantSlug}/bookings`,
        stats: [
          { 
            label: 'Reservas hoy', 
            value: moduleStats?.bookings?.totalCount || 0,
            trend: '+5'
          }
        ],
        feature: 'BOOKING_ENGINE',
        priority: 'high',
        category: 'business'
      },
      {
        id: 'ecommerce-engine',
        name: 'Tienda Online',
        shortName: 'E-commerce',
        description: 'Vende productos y gestiona inventario',
        icon: ShoppingCartIcon,
        color: 'text-purple-600',
        bgGradient: 'from-purple-500 to-violet-600',
        href: `/${params.locale}/${params.tenantSlug}/commerce`,
        stats: [
          { 
            label: 'Productos', 
            value: ecommerceStats?.products?.length || 0,
            trend: '+12'
          }
        ],
        feature: 'ECOMMERCE_ENGINE',
        priority: 'high',
        category: 'business'
      },
      {
        id: 'legal-engine',
        name: 'Gestión Legal',
        shortName: 'Legal',
        description: 'Administra casos y documentos legales',
        icon: ScaleIcon,
        color: 'text-amber-600',
        bgGradient: 'from-amber-500 to-orange-600',
        href: `/${params.locale}/${params.tenantSlug}/legal`,
        stats: [{ label: 'Casos', value: 0, trend: '0' }],
        feature: 'LEGAL_ENGINE',
        priority: 'medium',
        category: 'specialized'
      },
      {
        id: 'interpretation-engine',
        name: 'Interpretación',
        shortName: 'Interpret',
        description: 'Servicios de interpretación profesional',
        icon: MessageSquareIcon,
        color: 'text-teal-600',
        bgGradient: 'from-teal-500 to-cyan-600',
        href: `/${params.locale}/${params.tenantSlug}/interpretation`,
        stats: [{ label: 'Sesiones', value: 0, trend: '0' }],
        feature: 'INTERPRETATION_ENGINE',
        priority: 'medium',
        category: 'specialized'
      },
      {
        id: 'hrms-engine',
        name: 'Recursos Humanos',
        shortName: 'RRHH',
        description: 'Gestiona empleados y nómina',
        icon: UsersIcon,
        color: 'text-indigo-600',
        bgGradient: 'from-indigo-500 to-blue-600',
        href: `/${params.locale}/${params.tenantSlug}/hr`,
        stats: [
          { 
            label: 'Empleados', 
            value: tenantData?.tenant?.userCount || 0,
            trend: '+1'
          }
        ],
        feature: 'HRMS_ENGINE',
        priority: 'medium',
        category: 'business'
      }
    ];

    return modules.filter(module => tenantFeatures.includes(module.feature as 'CMS_ENGINE' | 'BOOKING_ENGINE' | 'ECOMMERCE_ENGINE' | 'LEGAL_ENGINE' | 'INTERPRETATION_ENGINE' | 'HRMS_ENGINE'));
  }, [tenantFeatures, params.locale, params.tenantSlug, moduleStats, ecommerceStats, tenantData]);

  // Define available modules with enhanced design
  const availableModules = useMemo((): AvailableModule[] => {
    const modules: AvailableModule[] = [
      {
        id: 'booking-engine',
        name: 'Sistema de Reservas',
        shortName: 'Bukmi',
        description: 'Automatiza la gestión de citas y mejora la experiencia del cliente',
        icon: CalendarIcon,
        color: 'text-green-600',
        bgGradient: 'from-green-500 to-emerald-600',
        benefits: ['Reduce llamadas telefónicas', 'Aumenta satisfacción del cliente', 'Optimiza tu agenda'],
        estimatedSetupTime: '2-3 días',
        feature: 'BOOKING_ENGINE',
        priority: 'high',
        category: 'business',
        popularity: 95
      },
      {
        id: 'ecommerce-engine',
        name: 'Tienda Online',
        shortName: 'E-commerce',
        description: 'Expande tu negocio al mundo digital y aumenta tus ventas',
        icon: ShoppingCartIcon,
        color: 'text-purple-600',
        bgGradient: 'from-purple-500 to-violet-600',
        benefits: ['Ventas 24/7', 'Alcance global', 'Gestión automática de inventario'],
        estimatedSetupTime: '3-5 días',
        feature: 'ECOMMERCE_ENGINE',
        priority: 'high',
        category: 'business',
        popularity: 88
      },
      {
        id: 'legal-engine',
        name: 'Gestión Legal',
        shortName: 'Legal',
        description: 'Profesionaliza la gestión de casos y documentos legales',
        icon: ScaleIcon,
        color: 'text-amber-600',
        bgGradient: 'from-amber-500 to-orange-600',
        benefits: ['Organización de casos', 'Documentos seguros', 'Facturación legal'],
        estimatedSetupTime: '5-7 días',
        feature: 'LEGAL_ENGINE',
        priority: 'medium',
        category: 'specialized',
        popularity: 72
      },
      {
        id: 'interpretation-engine',
        name: 'Interpretación',
        shortName: 'Interpret',
        description: 'Ofrece servicios de interpretación profesional en tiempo real',
        icon: MessageSquareIcon,
        color: 'text-teal-600',
        bgGradient: 'from-teal-500 to-cyan-600',
        benefits: ['Interpretación en vivo', 'Múltiples idiomas', 'Grabación de sesiones'],
        estimatedSetupTime: '3-4 días',
        feature: 'INTERPRETATION_ENGINE',
        priority: 'medium',
        category: 'specialized',
        popularity: 65
      },
      {
        id: 'hrms-engine',
        name: 'Recursos Humanos',
        shortName: 'RRHH',
        description: 'Optimiza la gestión de tu equipo y procesos de RRHH',
        icon: UsersIcon,
        color: 'text-indigo-600',
        bgGradient: 'from-indigo-500 to-blue-600',
        benefits: ['Control de asistencia', 'Evaluaciones de desempeño', 'Gestión de nómina'],
        estimatedSetupTime: '4-6 días',
        feature: 'HRMS_ENGINE',
        priority: 'medium',
        category: 'business',
        popularity: 78
      }
    ];

    // Filter and sort by popularity
    return modules
      .filter(module => !tenantFeatures.includes(module.feature as 'BOOKING_ENGINE' | 'ECOMMERCE_ENGINE' | 'LEGAL_ENGINE' | 'INTERPRETATION_ENGINE' | 'HRMS_ENGINE'))
      .sort((a, b) => b.popularity - a.popularity);
  }, [tenantFeatures]);

  const selectedModuleData = availableModules.find(m => m.id === selectedModule);

  const handleSubmitRequest = async () => {
    if (!selectedModule || !currentUserTenant?.tenantId || justification.trim().length < 50) return;

    setIsSubmitting(true);
    setSubmitError('');

    try {
      await requestModule({
        variables: {
          input: {
            tenantId: currentUserTenant.tenantId,
            moduleType: selectedModuleData?.feature,
            justification: justification.trim()
          }
        }
      });

      setSubmitSuccess(true);
      setSelectedModule('');
      setJustification('');
      setShowRequestForm(false);

      // Auto-hide success message
      setTimeout(() => setSubmitSuccess(false), 5000);
    } catch (error) {
      console.error('Error submitting request:', error);
      setSubmitError('Error al enviar la solicitud. Por favor, inténtalo de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-700 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-700 border-green-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case 'high': return 'Alta demanda';
      case 'medium': return 'Popular';
      case 'low': return 'Especializado';
      default: return 'Normal';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-indigo-200 border-t-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando tus módulos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center px-4 py-2 bg-indigo-100 text-indigo-700 rounded-full text-sm font-medium mb-4">
            <ZapIcon className="h-4 w-4 mr-2" />
            Centro de Módulos
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Potencia tu negocio
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Gestiona tus herramientas activas y descubre nuevas funcionalidades para 
            <span className="font-semibold text-indigo-600"> {tenantData?.tenant?.name || params.tenantSlug}</span>
          </p>
        </div>

        {/* Success Alert */}
        {submitSuccess && (
          <Alert className="mb-8 border-green-200 bg-green-50">
            <CheckCircleIcon className="h-5 w-5 text-green-600" />
            <AlertDescription className="text-green-800 font-medium">
              ¡Excelente! Tu solicitud ha sido enviada. Te notificaremos cuando esté lista.
            </AlertDescription>
          </Alert>
        )}

        {/* Error Alert */}
        {submitError && (
          <Alert className="mb-8 border-red-200 bg-red-50">
            <AlertCircleIcon className="h-5 w-5 text-red-600" />
            <AlertDescription className="text-red-800 font-medium">
              {submitError}
            </AlertDescription>
          </Alert>
        )}

        {/* Active Modules Section */}
        {activeModules.length > 0 && (
          <div className="mb-16">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Tus Herramientas Activas</h2>
                <p className="text-gray-600 mt-1">{activeModules.length} módulos funcionando perfectamente</p>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <ActivityIcon className="h-4 w-4" />
                <span>Todo funcionando</span>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {activeModules.map((module) => (
                <Card key={module.id} className="group hover:shadow-xl transition-all duration-300 border-0 shadow-lg overflow-hidden">
                  <div className={`h-2 bg-gradient-to-r ${module.bgGradient}`}></div>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className={`w-12 h-12 bg-gradient-to-r ${module.bgGradient} rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                          <module.icon className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <h3 className="font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">
                            {module.shortName}
                          </h3>
                          <p className="text-sm text-gray-600">{module.description}</p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Stats */}
                    {module.stats && module.stats.length > 0 && (
                      <div className="mb-4">
                        {module.stats.map((stat, index) => (
                          <div key={index} className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">{stat.label}</span>
                            <div className="flex items-center space-x-2">
                              <span className="font-bold text-gray-900">{stat.value}</span>
                              {stat.trend && (
                                <span className="text-green-600 text-xs flex items-center">
                                  <TrendingUpIcon className="h-3 w-3 mr-1" />
                                  {stat.trend}
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {/* Actions */}
                    <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                      <Link href={`/${params.locale}/${params.tenantSlug}/dashboard/modules/config?engine=${module.id}`}>
                        <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900">
                          <SettingsIcon className="h-4 w-4 mr-2" />
                          Configurar
                        </Button>
                      </Link>
                      {module.href && (
                        <Link href={module.href}>
                          <Button size="sm" className={`bg-gradient-to-r ${module.bgGradient} hover:shadow-lg transition-all`}>
                            Abrir
                            <ExternalLinkIcon className="h-4 w-4 ml-2" />
                          </Button>
                        </Link>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Available Modules Section */}
        {availableModules.length > 0 && (
          <div className="mb-16">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Expande tus Capacidades</h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Descubre herramientas poderosas que pueden transformar tu negocio
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {availableModules.map((module) => (
                <Card 
                  key={module.id} 
                  className={`group cursor-pointer transition-all duration-300 border-2 hover:shadow-2xl ${
                    selectedModule === module.id 
                      ? 'border-indigo-300 shadow-xl ring-4 ring-indigo-100' 
                      : 'border-gray-200 hover:border-indigo-200'
                  }`}
                  onClick={() => {
                    setSelectedModule(module.id);
                    setShowRequestForm(true);
                  }}
                >
                  <CardContent className="p-8">
                    <div className="flex items-start space-x-6">
                      <div className={`w-16 h-16 bg-gradient-to-r ${module.bgGradient} rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform flex-shrink-0`}>
                        <module.icon className="h-8 w-8 text-white" />
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="text-xl font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">
                            {module.name}
                          </h3>
                          <div className="flex items-center space-x-2">
                            <div className={`px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(module.priority)}`}>
                              {getPriorityText(module.priority)}
                            </div>
                            <div className="flex items-center text-yellow-500">
                              <StarIcon className="h-4 w-4 fill-current" />
                              <span className="text-sm font-medium ml-1">{module.popularity}%</span>
                            </div>
                          </div>
                        </div>
                        
                        <p className="text-gray-600 mb-4 leading-relaxed">{module.description}</p>
                        
                        <div className="space-y-2 mb-4">
                          {module.benefits.map((benefit, index) => (
                            <div key={index} className="flex items-center text-sm text-gray-700">
                              <CheckCircleIcon className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                              {benefit}
                            </div>
                          ))}
                        </div>
                        
                        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                          <div className="flex items-center text-sm text-gray-500">
                            <ClockIcon className="h-4 w-4 mr-2" />
                            Configuración: {module.estimatedSetupTime}
                          </div>
                          <div className="flex items-center text-indigo-600 font-medium">
                            Solicitar
                            <ChevronRightIcon className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Request Form */}
            {showRequestForm && selectedModule && selectedModuleData && (
              <Card className="mt-8 border-2 border-indigo-200 shadow-xl">
                <CardHeader className="bg-gradient-to-r from-indigo-50 to-blue-50 border-b border-indigo-100">
                  <CardTitle className="flex items-center space-x-3 text-xl">
                    <div className={`w-10 h-10 bg-gradient-to-r ${selectedModuleData.bgGradient} rounded-xl flex items-center justify-center`}>
                      <selectedModuleData.icon className="h-5 w-5 text-white" />
                    </div>
                    <span>Solicitar {selectedModuleData.name}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-8">
                  <div className="space-y-6">
                    {/* Module Benefits Recap */}
                    <div className="bg-gray-50 rounded-xl p-6">
                      <h4 className="font-semibold text-gray-900 mb-3">¿Por qué elegir este módulo?</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {selectedModuleData.benefits.map((benefit, index) => (
                          <div key={index} className="flex items-center text-sm text-gray-700">
                            <CheckCircleIcon className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                            {benefit}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Justification */}
                    <div className="space-y-3">
                      <Label htmlFor="justification" className="text-base font-semibold text-gray-900">
                        Cuéntanos sobre tu caso de uso <span className="text-red-500">*</span>
                      </Label>
                      <Textarea
                        id="justification"
                        placeholder="Ejemplo: Necesitamos el sistema de reservas porque recibimos muchas llamadas diarias para agendar citas y queremos automatizar este proceso para mejorar la experiencia del cliente..."
                        value={justification}
                        onChange={(e) => setJustification(e.target.value)}
                        rows={4}
                        className="resize-none text-base"
                      />
                      <div className="flex items-center justify-between text-sm">
                        <p className="text-gray-500">
                          Una justificación detallada acelera el proceso de aprobación
                        </p>
                        <span className={`font-medium ${justification.length >= 50 ? 'text-green-600' : 'text-gray-400'}`}>
                          {justification.length}/50 mín.
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between pt-6 border-t border-gray-200">
                      <div className="flex items-center text-sm text-gray-600">
                        <ClockIcon className="h-4 w-4 mr-2" />
                        <span>Revisión en 1-2 días hábiles</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Button 
                          variant="outline" 
                          onClick={() => {
                            setShowRequestForm(false);
                            setSelectedModule('');
                            setJustification('');
                          }}
                        >
                          Cancelar
                        </Button>
                        <Button 
                          onClick={handleSubmitRequest}
                          disabled={!selectedModule || justification.trim().length < 50 || isSubmitting}
                          className="min-w-[140px] bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700"
                        >
                          {isSubmitting ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                          ) : (
                            <SendIcon className="h-4 w-4 mr-2" />
                          )}
                          {isSubmitting ? 'Enviando...' : 'Enviar Solicitud'}
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Empty State */}
        {availableModules.length === 0 && (
          <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
            <CardContent className="p-12 text-center">
              <div className="w-20 h-20 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircleIcon className="h-10 w-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                ¡Felicitaciones!
              </h3>
              <p className="text-lg text-gray-600 max-w-md mx-auto">
                Ya tienes acceso a todas las herramientas disponibles. Tu negocio está completamente equipado.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Quick Actions */}
        {activeModules.length > 0 && (
          <div className="mt-16 bg-gradient-to-r from-indigo-50 to-blue-50 rounded-2xl p-8 border border-indigo-200">
            <div className="text-center">
              <h3 className="text-xl font-bold text-gray-900 mb-2">¿Necesitas ayuda?</h3>
              <p className="text-gray-600 mb-6">Nuestro equipo está aquí para ayudarte a sacar el máximo provecho de tus módulos</p>
              <div className="flex items-center justify-center space-x-4">
                <Link href={`/${params.locale}/${params.tenantSlug}/dashboard/modules/config`}>
                  <Button variant="outline" className="border-indigo-300 text-indigo-700 hover:bg-indigo-100">
                    <SettingsIcon className="h-4 w-4 mr-2" />
                    Configurar Módulos
                  </Button>
                </Link>
                <Button className="bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700">
                  <MessageSquareIcon className="h-4 w-4 mr-2" />
                  Contactar Soporte
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 