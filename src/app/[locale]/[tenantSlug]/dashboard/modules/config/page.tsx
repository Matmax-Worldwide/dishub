'use client';

import { useState, useMemo, useEffect } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useFeatureAccess } from '@/hooks/useFeatureAccess';
import { gql, useQuery, useMutation } from '@apollo/client';
import { client } from '@/lib/apollo-client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  SettingsIcon, 
  SaveIcon, 
  RefreshCwIcon,
  AlertTriangleIcon,
  CheckCircleIcon,
  InfoIcon,
  ArrowLeftIcon,
  CalendarIcon,
  ShoppingCartIcon,
  FileTextIcon,
  ScaleIcon,
  MessageSquareIcon,
  UsersIcon
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
    }
  }
`;

const GET_MODULE_SETTINGS = gql`
  query GetModuleSettings($tenantId: ID!) {
    moduleSettings(tenantId: $tenantId) {
      moduleType
      settings
      lastUpdated
      version
    }
  }
`;

const UPDATE_MODULE_SETTINGS = gql`
  mutation UpdateModuleSettings($input: ModuleSettingsInput!) {
    updateModuleSettings(input: $input) {
      moduleType
      settings
      lastUpdated
    }
  }
`;

interface ModuleSettings {
  [key: string]: boolean | string | number;
}

interface ModuleConfig {
  moduleType: string;
  settings: ModuleSettings;
  lastUpdated: string;
  version: string;
}

interface ModuleDefinition {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  version: string;
  feature: string;
  settings: {
    key: string;
    label: string;
    description: string;
    type: 'boolean' | 'string' | 'number';
    defaultValue: boolean | string | number;
    category?: string;
  }[];
}

export default function ModuleConfigPage() {
  const [activeModule, setActiveModule] = useState('');
  const [localSettings, setLocalSettings] = useState<{ [moduleId: string]: ModuleSettings }>({});
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState('');
  const [saveError, setSaveError] = useState('');

  const params = useParams();
  const searchParams = useSearchParams();
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

  // Load tenant information
  const { data: tenantData } = useQuery(GET_TENANT_INFO, {
    variables: { tenantId: currentUserTenant?.tenantId || '' },
    skip: !currentUserTenant?.tenantId,
    errorPolicy: 'all'
  });

  // Load module settings
  const { data: settingsData, refetch: refetchSettings } = useQuery(GET_MODULE_SETTINGS, {
    variables: { tenantId: currentUserTenant?.tenantId || '' },
    skip: !currentUserTenant?.tenantId,
    errorPolicy: 'all'
  });

  // Update module settings mutation
  const [updateModuleSettings] = useMutation(UPDATE_MODULE_SETTINGS);

  // Define module configurations for active modules
  const moduleDefinitions = useMemo((): ModuleDefinition[] => {
    const modules: ModuleDefinition[] = [
      {
        id: 'cms-engine',
        name: 'CMS Engine',
        description: 'Sistema de gestión de contenido',
        icon: FileTextIcon,
        color: 'bg-blue-500',
        version: '2.1.0',
        feature: 'CMS_ENGINE',
        settings: [
          { key: 'autoSave', label: 'Guardado automático', description: 'Guardar cambios automáticamente cada 30 segundos', type: 'boolean', defaultValue: true },
          { key: 'versioning', label: 'Control de versiones', description: 'Mantener historial de cambios en el contenido', type: 'boolean', defaultValue: true },
          { key: 'mediaOptimization', label: 'Optimización de medios', description: 'Optimizar imágenes y videos automáticamente', type: 'boolean', defaultValue: false },
          { key: 'seoTools', label: 'Herramientas SEO', description: 'Habilitar herramientas de optimización SEO', type: 'boolean', defaultValue: true },
          { key: 'cacheEnabled', label: 'Caché de contenido', description: 'Activar caché para mejorar rendimiento', type: 'boolean', defaultValue: true }
        ]
      },
      {
        id: 'booking-engine',
        name: 'Motor de Reservas',
        description: 'Sistema de gestión de citas y reservas',
        icon: CalendarIcon,
        color: 'bg-green-500',
        version: '1.8.3',
        feature: 'BOOKING_ENGINE',
        settings: [
          { key: 'autoConfirmation', label: 'Confirmación automática', description: 'Confirmar reservas automáticamente', type: 'boolean', defaultValue: false },
          { key: 'reminderEmails', label: 'Recordatorios por email', description: 'Enviar recordatorios antes de las citas', type: 'boolean', defaultValue: true },
          { key: 'allowCancellation', label: 'Permitir cancelaciones', description: 'Clientes pueden cancelar sus reservas', type: 'boolean', defaultValue: true },
          { key: 'bufferTime', label: 'Tiempo de buffer (minutos)', description: 'Tiempo entre citas consecutivas', type: 'number', defaultValue: 15 },
          { key: 'maxAdvanceBooking', label: 'Reserva máxima anticipada (días)', description: 'Días máximos para reservar con anticipación', type: 'number', defaultValue: 30 }
        ]
      },
      {
        id: 'ecommerce-engine',
        name: 'Motor de Comercio',
        description: 'Sistema de tienda online',
        icon: ShoppingCartIcon,
        color: 'bg-purple-500',
        version: '1.5.2',
        feature: 'ECOMMERCE_ENGINE',
        settings: [
          { key: 'inventoryTracking', label: 'Control de inventario', description: 'Rastrear niveles de stock automáticamente', type: 'boolean', defaultValue: true },
          { key: 'autoTaxCalculation', label: 'Cálculo automático de impuestos', description: 'Calcular impuestos según ubicación', type: 'boolean', defaultValue: true },
          { key: 'abandonedCartEmails', label: 'Emails de carrito abandonado', description: 'Enviar recordatorios de carritos abandonados', type: 'boolean', defaultValue: false },
          { key: 'reviewModeration', label: 'Moderación de reseñas', description: 'Revisar reseñas antes de publicar', type: 'boolean', defaultValue: true },
          { key: 'lowStockThreshold', label: 'Umbral de stock bajo', description: 'Cantidad mínima antes de alerta', type: 'number', defaultValue: 5 }
        ]
      },
      {
        id: 'legal-engine',
        name: 'Motor Legal',
        description: 'Sistema de gestión legal',
        icon: ScaleIcon,
        color: 'bg-amber-500',
        version: '1.0.5',
        feature: 'LEGAL_ENGINE',
        settings: [
          { key: 'documentEncryption', label: 'Encriptación de documentos', description: 'Encriptar documentos sensibles', type: 'boolean', defaultValue: true },
          { key: 'auditLogging', label: 'Registro de auditoría', description: 'Registrar todas las actividades del sistema', type: 'boolean', defaultValue: true },
          { key: 'clientPortal', label: 'Portal del cliente', description: 'Habilitar portal de autoservicio', type: 'boolean', defaultValue: false },
          { key: 'billingIntegration', label: 'Integración de facturación', description: 'Conectar con sistemas de facturación', type: 'boolean', defaultValue: true },
          { key: 'documentRetention', label: 'Retención de documentos (años)', description: 'Años para mantener documentos archivados', type: 'number', defaultValue: 7 }
        ]
      },
      {
        id: 'interpretation-engine',
        name: 'Motor de Interpretación',
        description: 'Sistema de interpretación en tiempo real',
        icon: MessageSquareIcon,
        color: 'bg-teal-500',
        version: '1.0.5',
        feature: 'INTERPRETATION_ENGINE',
        settings: [
          { key: 'autoRecording', label: 'Grabación automática', description: 'Grabar sesiones automáticamente', type: 'boolean', defaultValue: false },
          { key: 'qualityMonitoring', label: 'Monitoreo de calidad', description: 'Monitorear calidad de interpretación', type: 'boolean', defaultValue: true },
          { key: 'multiLanguageSupport', label: 'Soporte multiidioma', description: 'Habilitar múltiples idiomas simultáneos', type: 'boolean', defaultValue: true },
          { key: 'sessionTimeout', label: 'Timeout de sesión (minutos)', description: 'Tiempo máximo de sesión inactiva', type: 'number', defaultValue: 60 }
        ]
      },
      {
        id: 'hrms-engine',
        name: 'Sistema de RRHH',
        description: 'Motor de recursos humanos',
        icon: UsersIcon,
        color: 'bg-indigo-500',
        version: '0.9.0',
        feature: 'HRMS_ENGINE',
        settings: [
          { key: 'attendanceTracking', label: 'Control de asistencia', description: 'Rastrear asistencia de empleados', type: 'boolean', defaultValue: true },
          { key: 'performanceReviews', label: 'Evaluaciones de desempeño', description: 'Habilitar sistema de evaluaciones', type: 'boolean', defaultValue: true },
          { key: 'payrollIntegration', label: 'Integración de nómina', description: 'Conectar con sistema de nómina', type: 'boolean', defaultValue: false },
          { key: 'leaveManagement', label: 'Gestión de permisos', description: 'Sistema de solicitud de permisos', type: 'boolean', defaultValue: true },
          { key: 'probationPeriod', label: 'Período de prueba (días)', description: 'Días de período de prueba para nuevos empleados', type: 'number', defaultValue: 90 }
        ]
      }
    ];

    // Filter only active modules
    return modules.filter(module => tenantFeatures.includes(module.feature as 'CMS_ENGINE' | 'BOOKING_ENGINE' | 'ECOMMERCE_ENGINE' | 'LEGAL_ENGINE' | 'INTERPRETATION_ENGINE' | 'HRMS_ENGINE'));
  }, [tenantFeatures]);

  // Auto-select module based on URL parameter or set default
  useEffect(() => {
    const engineParam = searchParams.get('engine');
    
    if (engineParam && moduleDefinitions.some(m => m.id === engineParam)) {
      setActiveModule(engineParam);
    } else if (moduleDefinitions.length > 0 && !activeModule && !engineParam) {
      setActiveModule(moduleDefinitions[0].id);
    }
  }, [moduleDefinitions, searchParams, activeModule]);

  // Initialize local settings from server data
  useEffect(() => {
    if (settingsData?.moduleSettings) {
      const settings: { [moduleId: string]: ModuleSettings } = {};
      settingsData.moduleSettings.forEach((config: ModuleConfig) => {
        const moduleId = config.moduleType.toLowerCase().replace('_', '-');
        settings[moduleId] = config.settings;
      });
      setLocalSettings(settings);
    }
  }, [settingsData]);

  const activeModuleData = moduleDefinitions.find(m => m.id === activeModule);

  const handleSettingChange = (moduleId: string, settingKey: string, value: boolean | string | number) => {
    setLocalSettings(prev => ({
      ...prev,
      [moduleId]: {
        ...prev[moduleId],
        [settingKey]: value
      }
    }));
  };

  const handleSaveConfig = async (moduleId: string) => {
    if (!currentUserTenant?.tenantId) return;

    setIsSaving(true);
    setSaveError('');

    try {
      await updateModuleSettings({
        variables: {
          input: {
            tenantId: currentUserTenant.tenantId,
            moduleType: moduleId.toUpperCase().replace('-', '_'),
            settings: localSettings[moduleId] || {}
          }
        }
      });

      setSaveSuccess(`Configuración de ${activeModuleData?.name} guardada exitosamente`);
      refetchSettings();

      // Auto-hide success message
      setTimeout(() => setSaveSuccess(''), 3000);
    } catch (error) {
      console.error('Error saving settings:', error);
      setSaveError('Error al guardar la configuración. Por favor, inténtalo de nuevo.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetConfig = (moduleId: string) => {
    const moduleData = moduleDefinitions.find(m => m.id === moduleId);
    if (!moduleData) return;

    const defaultSettings: ModuleSettings = {};
    moduleData.settings.forEach(setting => {
      defaultSettings[setting.key] = setting.defaultValue;
    });

    setLocalSettings(prev => ({
      ...prev,
      [moduleId]: defaultSettings
    }));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (moduleDefinitions.length === 0) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center space-x-2 text-sm text-gray-500 mb-2">
              <Link href={`/${params.locale}/${params.tenantSlug}/dashboard/modules`} className="hover:text-indigo-600">
                Módulos
              </Link>
              <span>/</span>
              <span>Configuración</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Configuración de Módulos</h1>
          </div>
          <Link href={`/${params.locale}/${params.tenantSlug}/dashboard/modules`}>
            <Button variant="outline">
              <ArrowLeftIcon className="h-4 w-4 mr-2" />
              Volver
            </Button>
          </Link>
        </div>

        <Card>
          <CardContent className="p-8 text-center">
            <SettingsIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No hay módulos para configurar
            </h3>
            <p className="text-gray-600 mb-4">
              Activa algunos módulos primero para poder configurarlos.
            </p>
            <Link href={`/${params.locale}/${params.tenantSlug}/dashboard/modules/request`}>
              <Button>Solicitar Módulos</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header with breadcrumb */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-2 text-sm text-gray-500 mb-2">
            <Link href={`/${params.locale}/${params.tenantSlug}/dashboard/modules`} className="hover:text-indigo-600">
              Módulos
            </Link>
            <span>/</span>
            <span>Configuración</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Configuración de Módulos</h1>
          <p className="text-gray-600 mt-1">
            Personaliza el comportamiento de tus módulos activos en <span className="font-semibold text-indigo-600">{tenantData?.tenant?.name || params.tenantSlug}</span>
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={() => refetchSettings()}>
            <RefreshCwIcon className="h-4 w-4 mr-2" />
            Actualizar
          </Button>
          <Link href={`/${params.locale}/${params.tenantSlug}/dashboard/modules`}>
            <Button variant="outline">
              <ArrowLeftIcon className="h-4 w-4 mr-2" />
              Volver
            </Button>
          </Link>
        </div>
      </div>

      {/* Success Alert */}
      {saveSuccess && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircleIcon className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            {saveSuccess}
          </AlertDescription>
        </Alert>
      )}

      {/* Error Alert */}
      {saveError && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangleIcon className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            {saveError}
          </AlertDescription>
        </Alert>
      )}

      {/* Module Selection */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Module List */}
        <div className="lg:col-span-1">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Módulos Activos</h2>
          <div className="space-y-2">
            {moduleDefinitions.map((module) => (
              <button
                key={module.id}
                onClick={() => setActiveModule(module.id)}
                className={`w-full text-left p-3 rounded-lg border transition-all duration-200 ${
                  activeModule === module.id
                    ? 'border-indigo-200 bg-indigo-50 text-indigo-900'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className={`w-8 h-8 ${module.color} rounded-lg flex items-center justify-center flex-shrink-0`}>
                    <module.icon className="h-4 w-4 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{module.name}</p>
                    <p className="text-xs text-gray-500">v{module.version}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Configuration Panel */}
        <div className="lg:col-span-3">
          {activeModuleData && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 ${activeModuleData.color} rounded-xl flex items-center justify-center`}>
                      <activeModuleData.icon className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <CardTitle>{activeModuleData.name}</CardTitle>
                      <p className="text-sm text-gray-600">{activeModuleData.description}</p>
                    </div>
                  </div>
                  <Badge variant="secondary">v{activeModuleData.version}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Settings */}
                <div className="space-y-4">
                  {activeModuleData.settings.map((setting) => (
                    <div key={setting.key} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <Label htmlFor={`${activeModuleData.id}-${setting.key}`} className="font-medium">
                            {setting.label}
                          </Label>
                          <InfoIcon className="h-4 w-4 text-gray-400" />
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{setting.description}</p>
                      </div>
                      <div className="ml-4">
                        {setting.type === 'boolean' ? (
                          <Switch
                            id={`${activeModuleData.id}-${setting.key}`}
                            checked={localSettings[activeModuleData.id]?.[setting.key] as boolean ?? setting.defaultValue as boolean}
                            onCheckedChange={(checked) => handleSettingChange(activeModuleData.id, setting.key, checked)}
                          />
                        ) : (
                                                     <input
                             type={setting.type === 'number' ? 'number' : 'text'}
                             value={String(localSettings[activeModuleData.id]?.[setting.key] ?? setting.defaultValue)}
                             onChange={(e) => handleSettingChange(
                               activeModuleData.id, 
                               setting.key, 
                               setting.type === 'number' ? parseInt(e.target.value) || 0 : e.target.value
                             )}
                             className="w-20 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                           />
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <AlertTriangleIcon className="h-4 w-4" />
                    <span>Los cambios se aplicarán inmediatamente</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button 
                      variant="outline" 
                      onClick={() => handleResetConfig(activeModuleData.id)}
                    >
                      Restaurar Predeterminados
                    </Button>
                    <Button 
                      onClick={() => handleSaveConfig(activeModuleData.id)}
                      disabled={isSaving}
                      className="min-w-[120px]"
                    >
                      {isSaving ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      ) : (
                        <SaveIcon className="h-4 w-4 mr-2" />
                      )}
                      {isSaving ? 'Guardando...' : 'Guardar Configuración'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
} 