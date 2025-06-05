'use client';

import { useQuery, gql } from '@apollo/client';
import { client } from '@/lib/apollo-client';
import { XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, AreaChart, Area } from 'recharts';
import { usePermission } from '@/hooks/usePermission';
import { useAuth } from '@/hooks/useAuth';
import { useState, useEffect } from 'react';
import { complianceDashboard } from '@/lib/gdpr/complianceDashboard';

// GraphQL Queries for Tenant Admin Dashboard
const GET_TENANT_STATS = gql`
  query GetTenantStats {
    tenantStats {
      totalUsers
      activeUsers
      newUsersThisMonth
      totalDataRequests
      pendingDataRequests
      totalConsentRecords
      activeConsents
      expiredConsents
      totalAuditLogs
      criticalAlerts
      complianceScore
    }
  }
`;

const GET_USER_ACTIVITY = gql`
  query GetUserActivity {
    userActivity {
      date
      activeUsers
      newRegistrations
      dataRequests
    }
  }
`;

const GET_GDPR_METRICS = gql`
  query GetGDPRMetrics {
    gdprMetrics {
      consentsByPurpose {
        purpose
        granted
        revoked
      }
      dataRequestsByType {
        type
        count
        avgResponseTime
      }
      retentionMetrics {
        dataType
        recordsManaged
        recordsDue
      }
    }
  }
`;

// Types
interface TenantStats {
  totalUsers: number;
  activeUsers: number;
  newUsersThisMonth: number;
  totalDataRequests: number;
  pendingDataRequests: number;
  totalConsentRecords: number;
  activeConsents: number;
  expiredConsents: number;
  totalAuditLogs: number;
  criticalAlerts: number;
  complianceScore: number;
}

interface ComplianceDashboardData {
  score: {
    overall: number;
    breakdown: {
      dataProtection: number;
      consentManagement: number;
      retentionPolicies: number;
      subjectRights: number;
      riskAssessment: number;
      auditTrail: number;
    };
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    recommendations: string[];
    criticalIssues: string[];
  };
  alerts: Array<{
    level: 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';
    message: string;
    timestamp: Date;
    action?: string;
  }>;
  upcomingTasks: Array<{
    task: string;
    dueDate: Date;
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    category: string;
  }>;
}

export default function TenantAdminDashboard() {
  const { hasPermission, hasRole } = usePermission();
  const { user } = useAuth();
  const [complianceData, setComplianceData] = useState<ComplianceDashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  // GraphQL queries
  const { loading: statsLoading, data: statsData } = useQuery(GET_TENANT_STATS, {
    client,
    errorPolicy: 'all',
  });

  const { loading: activityLoading, data: activityData } = useQuery(GET_USER_ACTIVITY, {
    client,
    errorPolicy: 'all',
  });

  const { loading: gdprLoading } = useQuery(GET_GDPR_METRICS, {
    client,
    errorPolicy: 'all',
  });

  // Load GDPR compliance data
  useEffect(() => {
    async function loadComplianceData() {
      if (!user?.tenantId) return;
      
      try {
        setLoading(true);
        const dashboard = await complianceDashboard.generateDashboard(user.tenantId);
        setComplianceData(dashboard);
      } catch (error) {
        console.error('Error loading compliance data:', error);
      } finally {
        setLoading(false);
      }
    }

    loadComplianceData();
  }, [user?.tenantId]);

  // Check permissions
  if (!hasRole('TenantAdmin') && !hasPermission('access:adminDashboard')) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Acceso Denegado</h1>
          <p className="text-gray-600">No tienes permisos para acceder al dashboard de administrador.</p>
        </div>
      </div>
    );
  }

  const isLoading = statsLoading || activityLoading || gdprLoading || loading;

  // Mock data for development
  const mockStats: TenantStats = {
    totalUsers: 247,
    activeUsers: 189,
    newUsersThisMonth: 23,
    totalDataRequests: 15,
    pendingDataRequests: 3,
    totalConsentRecords: 1247,
    activeConsents: 1098,
    expiredConsents: 149,
    totalAuditLogs: 5847,
    criticalAlerts: 2,
    complianceScore: 87,
  };

  const mockActivityData = [
    { date: '2024-01-01', activeUsers: 145, newRegistrations: 5, dataRequests: 2 },
    { date: '2024-01-02', activeUsers: 158, newRegistrations: 8, dataRequests: 1 },
    { date: '2024-01-03', activeUsers: 167, newRegistrations: 12, dataRequests: 3 },
    { date: '2024-01-04', activeUsers: 172, newRegistrations: 6, dataRequests: 1 },
    { date: '2024-01-05', activeUsers: 189, newRegistrations: 15, dataRequests: 4 },
    { date: '2024-01-06', activeUsers: 195, newRegistrations: 9, dataRequests: 2 },
    { date: '2024-01-07', activeUsers: 201, newRegistrations: 11, dataRequests: 1 },
  ];

  const stats = statsData?.tenantStats || mockStats;
  const activityChartData = activityData?.userActivity || mockActivityData;

  // Compliance score color
  const getComplianceColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    if (score >= 50) return 'text-orange-600';
    return 'text-red-600';
  };

  // Risk level color
  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case 'LOW': return 'bg-green-100 text-green-800';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800';
      case 'HIGH': return 'bg-orange-100 text-orange-800';
      case 'CRITICAL': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) return <div className="flex justify-center p-6">Cargando dashboard...</div>;

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Panel de Administración GDPR</h1>
            <p className="text-gray-600 mt-2">Dashboard completo para gestión de tenant y cumplimiento GDPR</p>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-500">Tenant: {user?.tenantId}</div>
            <div className="text-sm text-gray-500">Última actualización: {new Date().toLocaleString()}</div>
          </div>
        </div>
      </div>

      {/* Critical Alerts */}
      {complianceData?.alerts && complianceData.alerts.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="text-lg font-medium text-red-800 mb-3">🚨 Alertas Críticas</h3>
          <div className="space-y-2">
            {complianceData.alerts.slice(0, 3).map((alert, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-white rounded border">
                <div>
                  <span className={`px-2 py-1 text-xs font-medium rounded ${
                    alert.level === 'CRITICAL' ? 'bg-red-100 text-red-800' :
                    alert.level === 'ERROR' ? 'bg-orange-100 text-orange-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {alert.level}
                  </span>
                  <span className="ml-2 text-sm text-gray-900">{alert.message}</span>
                </div>
                {alert.action && (
                  <button className="text-sm text-blue-600 hover:text-blue-800">
                    {alert.action}
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {/* Users Stats */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-indigo-500 rounded-md flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                  </svg>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Usuarios</dt>
                  <dd>
                    <div className="text-lg font-medium text-gray-900">{stats.totalUsers}</div>
                    <div className="text-sm text-green-600">+{stats.newUsersThisMonth} este mes</div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        {/* GDPR Compliance Score */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Compliance GDPR</dt>
                  <dd>
                    <div className={`text-lg font-medium ${getComplianceColor(complianceData?.score?.overall || stats.complianceScore)}`}>
                      {complianceData?.score?.overall || stats.complianceScore}%
                    </div>
                    <div className={`text-xs px-2 py-1 rounded ${getRiskLevelColor(complianceData?.score?.riskLevel || 'MEDIUM')}`}>
                      {complianceData?.score?.riskLevel || 'MEDIUM'} RISK
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        {/* Data Requests */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Solicitudes GDPR</dt>
                  <dd>
                    <div className="text-lg font-medium text-gray-900">{stats.totalDataRequests}</div>
                    <div className={`text-sm ${stats.pendingDataRequests > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                      {stats.pendingDataRequests} pendientes
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        {/* Consent Records */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-purple-500 rounded-md flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                  </svg>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Consentimientos</dt>
                  <dd>
                    <div className="text-lg font-medium text-gray-900">{stats.activeConsents}</div>
                    <div className={`text-sm ${stats.expiredConsents > 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {stats.expiredConsents} expirados
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* GDPR Compliance Breakdown */}
      {complianceData?.score && (
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Desglose de Compliance GDPR</h3>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{complianceData.score.breakdown.dataProtection}%</div>
              <div className="text-sm text-gray-500">Protección de Datos</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{complianceData.score.breakdown.consentManagement}%</div>
              <div className="text-sm text-gray-500">Gestión de Consentimiento</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{complianceData.score.breakdown.retentionPolicies}%</div>
              <div className="text-sm text-gray-500">Políticas de Retención</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{complianceData.score.breakdown.subjectRights}%</div>
              <div className="text-sm text-gray-500">Derechos del Usuario</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{complianceData.score.breakdown.riskAssessment}%</div>
              <div className="text-sm text-gray-500">Evaluación de Riesgo</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-600">{complianceData.score.breakdown.auditTrail}%</div>
              <div className="text-sm text-gray-500">Auditoría</div>
            </div>
          </div>
          
          {/* Recommendations */}
          {complianceData.score.recommendations.length > 0 && (
            <div className="mt-4">
              <h4 className="text-md font-medium text-gray-900 mb-2">Recomendaciones</h4>
              <ul className="space-y-1">
                {complianceData.score.recommendations.slice(0, 5).map((rec, index) => (
                  <li key={index} className="text-sm text-gray-600 flex items-start">
                    <span className="text-blue-500 mr-2">•</span>
                    {rec}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Charts Section */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* User Activity Chart */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Actividad de Usuarios (Últimos 7 días)</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={activityChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Area type="monotone" dataKey="activeUsers" stackId="1" stroke="#6366F1" fill="#6366F1" name="Usuarios Activos" />
                <Area type="monotone" dataKey="newRegistrations" stackId="1" stroke="#10B981" fill="#10B981" name="Nuevos Registros" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* GDPR Requests by Type */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Solicitudes GDPR por Tipo</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={[
                    { name: 'Acceso', value: 8, fill: '#6366F1' },
                    { name: 'Rectificación', value: 3, fill: '#10B981' },
                    { name: 'Eliminación', value: 2, fill: '#F59E0B' },
                    { name: 'Portabilidad', value: 2, fill: '#EF4444' },
                  ]}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                  label
                />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Upcoming Tasks and Recent Activity */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Upcoming GDPR Tasks */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Tareas Pendientes GDPR</h3>
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {complianceData?.upcomingTasks?.slice(0, 10).map((task, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded">
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900">{task.task}</div>
                  <div className="text-xs text-gray-500">{task.category}</div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 text-xs font-medium rounded ${
                    task.priority === 'CRITICAL' ? 'bg-red-100 text-red-800' :
                    task.priority === 'HIGH' ? 'bg-orange-100 text-orange-800' :
                    task.priority === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {task.priority}
                  </span>
                  <div className="text-xs text-gray-500">
                    {new Date(task.dueDate).toLocaleDateString()}
                  </div>
                </div>
              </div>
            )) || (
              <div className="text-center text-gray-500 py-8">
                No hay tareas pendientes
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Acciones Rápidas</h3>
          <div className="grid grid-cols-2 gap-3">
            <button className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 text-left">
              <div className="text-sm font-medium text-gray-900">Exportar Datos</div>
              <div className="text-xs text-gray-500">Art. 20 GDPR</div>
            </button>
            <button className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 text-left">
              <div className="text-sm font-medium text-gray-900">Revisar Consentimientos</div>
              <div className="text-xs text-gray-500">Art. 7 GDPR</div>
            </button>
            <button className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 text-left">
              <div className="text-sm font-medium text-gray-900">Ejecutar DPIA</div>
              <div className="text-xs text-gray-500">Art. 35 GDPR</div>
            </button>
            <button className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 text-left">
              <div className="text-sm font-medium text-gray-900">Gestionar Usuarios</div>
              <div className="text-xs text-gray-500">Admin Panel</div>
            </button>
            <button className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 text-left">
              <div className="text-sm font-medium text-gray-900">Políticas Retención</div>
              <div className="text-xs text-gray-500">Art. 5 GDPR</div>
            </button>
            <button className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 text-left">
              <div className="text-sm font-medium text-gray-900">Registro Auditoría</div>
              <div className="text-xs text-gray-500">Art. 30 GDPR</div>
            </button>
          </div>
        </div>
      </div>

      {/* System Status Footer */}
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <div>
            Sistema GDPR v2.0 - Última verificación: {new Date().toLocaleString()}
          </div>
          <div className="flex items-center space-x-4">
            <span className="flex items-center">
              <span className="w-2 h-2 bg-green-400 rounded-full mr-2"></span>
              Servicios Operativos
            </span>
            <span className="flex items-center">
              <span className="w-2 h-2 bg-blue-400 rounded-full mr-2"></span>
              Backup Activo
            </span>
            <span className="flex items-center">
              <span className="w-2 h-2 bg-purple-400 rounded-full mr-2"></span>
              Cifrado Habilitado
            </span>
          </div>
        </div>
      </div>
    </div>
  );
} 