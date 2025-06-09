'use client';

import React from 'react';
import { useI18n } from '@/hooks/useI18n';
import { 
  Scale, 
  Users, 
  FileText, 
  DollarSign, 
  TrendingUp, 
  Clock,
  AlertTriangle,
  Calendar,
  Plus,
  ArrowUpRight,
  Video,
  Phone,
  MapPin
} from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

// Mock data - En producción esto vendría de la API
const mockData = {
  overview: {
    totalIncorporations: 45,
    activeIncorporations: 23,
    totalClients: 78,
    pendingInvoices: 12,
    totalRevenue: 245000,
    monthlyRevenue: 28500,
    completedThisMonth: 8,
    averageCompletionDays: 14
  },
  recentIncorporations: [
    {
      id: '1',
      incorporationNumber: 'INC-2024-001',
      companyName: 'TechStart LLC',
      client: 'María García',
      jurisdiction: 'usa_delaware',
      companyType: 'llc',
      status: 'government_filing',
      priority: 'high',
      expectedCompletion: '2024-01-15T10:00:00Z',
      assignedLawyer: 'Dr. Carlos Rodríguez'
    },
    {
      id: '2',
      incorporationNumber: 'INC-2024-002',
      companyName: 'Global Trading Ltd',
      client: 'Pedro Martínez',
      jurisdiction: 'uk_england',
      companyType: 'limited_company',
      status: 'documentation_gathering',
      priority: 'medium',
      expectedCompletion: '2024-01-25T10:00:00Z',
      assignedLawyer: 'Dra. Ana López'
    },
    {
      id: '3',
      incorporationNumber: 'INC-2024-003',
      companyName: 'Innovation Holdings Pte Ltd',
      client: 'Tech Solutions Inc.',
      jurisdiction: 'singapore',
      companyType: 'private_limited',
      status: 'pending_approval',
      priority: 'low',
      expectedCompletion: '2024-01-20T14:30:00Z',
      assignedLawyer: 'Dr. Carlos Rodríguez'
    }
  ],
  upcomingAppointments: [
    {
      id: '1',
      title: 'Consulta inicial - TechStart LLC',
      client: 'María García',
      date: '2024-01-15T09:00:00Z',
      type: 'initial_consultation',
      lawyer: 'Dr. Carlos Rodríguez',
      incorporationId: 'INC-2024-001',
      jurisdiction: 'usa_delaware',
      duration: 60,
      meetingType: 'in_person'
    },
    {
      id: '2',
      title: 'Revisión de documentos - Global Trading Ltd',
      client: 'Pedro Martínez',
      date: '2024-01-15T14:00:00Z',
      type: 'document_review',
      lawyer: 'Dra. Ana López',
      incorporationId: 'INC-2024-002',
      jurisdiction: 'uk_england',
      duration: 90,
      meetingType: 'video_call'
    },
    {
      id: '3',
      title: 'Firma de documentos - Innovation Holdings',
      client: 'Tech Solutions Inc.',
      date: '2024-01-16T11:00:00Z',
      type: 'document_signing',
      lawyer: 'Dr. Carlos Rodríguez',
      incorporationId: 'INC-2024-003',
      jurisdiction: 'singapore',
      duration: 45,
      meetingType: 'in_person'
    }
  ],
  recentActivity: [
    {
      id: '1',
      type: 'case_created',
      message: 'Nuevo caso creado: CASE-2024-004',
      timestamp: '2024-01-10T15:30:00Z'
    },
    {
      id: '2',
      type: 'document_uploaded',
      message: 'Documento subido al caso CASE-2024-001',
      timestamp: '2024-01-10T14:15:00Z'
    },
    {
      id: '3',
      type: 'appointment_scheduled',
      message: 'Cita programada con Pedro Martínez',
      timestamp: '2024-01-10T11:20:00Z'
    }
  ]
};

export default function LegalDashboard() {
  const { t, locale } = useI18n();
  const params = useParams();
  const tenantSlug = params.tenantSlug as string;
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat(locale, {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(dateString));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'initiated': return 'bg-blue-100 text-blue-800';
      case 'documentation_gathering': return 'bg-yellow-100 text-yellow-800';
      case 'name_reservation': return 'bg-purple-100 text-purple-800';
      case 'filing_preparation': return 'bg-orange-100 text-orange-800';
      case 'government_filing': return 'bg-indigo-100 text-indigo-800';
      case 'pending_approval': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'certificate_issued': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'on_hold': return 'bg-orange-100 text-orange-800';
      case 'cancelled': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getAppointmentTypeColor = (type: string) => {
    switch (type) {
      case 'initial_consultation': return 'bg-blue-100 text-blue-800';
      case 'document_review': return 'bg-green-100 text-green-800';
      case 'document_signing': return 'bg-purple-100 text-purple-800';
      case 'follow_up': return 'bg-yellow-100 text-yellow-800';
      case 'compliance': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getAppointmentTypeIcon = (type: string) => {
    switch (type) {
      case 'initial_consultation': return <Users className="h-3 w-3" />;
      case 'document_review': return <FileText className="h-3 w-3" />;
      case 'document_signing': return <FileText className="h-3 w-3" />;
      case 'follow_up': return <Clock className="h-3 w-3" />;
      case 'compliance': return <AlertTriangle className="h-3 w-3" />;
      default: return <Calendar className="h-3 w-3" />;
    }
  };

  const getAppointmentTypeName = (type: string) => {
    const types: { [key: string]: string } = {
      'initial_consultation': 'Consulta Inicial',
      'document_review': 'Revisión de Documentos',
      'document_signing': 'Firma de Documentos',
      'follow_up': 'Seguimiento',
      'compliance': 'Cumplimiento'
    };
    return types[type] || type;
  };

  const getMeetingTypeIcon = (type: string) => {
    switch (type) {
      case 'video_call': return <Video className="h-4 w-4 text-blue-600" />;
      case 'phone_call': return <Phone className="h-4 w-4 text-green-600" />;
      case 'in_person': return <MapPin className="h-4 w-4 text-purple-600" />;
      default: return <Calendar className="h-4 w-4 text-gray-600" />;
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {t('legal.dashboard') || 'Company Incorporation Dashboard'}
          </h1>
          <p className="text-gray-600 mt-1">
            {t('legal.dashboardSubtitle') || 'Gestiona incorporaciones de empresas en jurisdicciones internacionales'}
          </p>
        </div>
        <div className="flex space-x-3">
          <Link
            href={`/${locale}/${tenantSlug}/legal/incorporations/new`}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
          >
            <Plus className="h-4 w-4 mr-2" />
            {t('legal.newIncorporation') || 'Nueva Incorporación'}
          </Link>
          <Link
            href={`/${locale}/${tenantSlug}/legal/clients/new`}
            className="bg-white text-gray-700 border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors flex items-center"
          >
            <Plus className="h-4 w-4 mr-2" />
            {t('legal.newClient') || 'Nuevo Cliente'}
          </Link>
        </div>
      </div>

      {/* Ejemplo de Auto-Login - Solo para desarrollo */}
      {process.env.NODE_ENV === 'development' && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">
            🔧 Herramientas de Desarrollo - Auto-Login
          </h3>
          <p className="text-blue-700 text-sm mb-3">
            Puedes probar la funcionalidad de auto-login accediendo a URLs con parámetros como:
          </p>
          <code className="block bg-white p-2 rounded text-xs text-gray-800 mb-3">
            {`${window.location.origin}?user=tu-email@ejemplo.com&hash=tu-hash-seguro`}
          </code>
          <p className="text-blue-700 text-sm">
            El sistema detectará automáticamente estos parámetros e iniciará sesión si son válidos.
          </p>
        </div>
      )}

      {/* Métricas de Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Scale className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">
                {t('legal.totalIncorporations') || 'Total de Incorporaciones'}
              </p>
              <p className="text-2xl font-bold text-gray-900">{mockData.overview.totalIncorporations}</p>
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span className="text-green-600 font-medium">{mockData.overview.activeIncorporations}</span>
            <span className="text-gray-600 ml-1">{t('legal.activeIncorporations') || 'activas'}</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <Users className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">
                {t('legal.totalClients') || 'Total de Clientes'}
              </p>
              <p className="text-2xl font-bold text-gray-900">{mockData.overview.totalClients}</p>
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
            <span className="text-green-600 font-medium">+5</span>
            <span className="text-gray-600 ml-1">{t('legal.thisMonth') || 'este mes'}</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <FileText className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">
                {t('legal.pendingInvoices') || 'Facturas Pendientes'}
              </p>
              <p className="text-2xl font-bold text-gray-900">{mockData.overview.pendingInvoices}</p>
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <AlertTriangle className="h-4 w-4 text-yellow-600 mr-1" />
            <span className="text-yellow-600 font-medium">
              {t('legal.requiresAttention') || 'Requiere atención'}
            </span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <DollarSign className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">
                {t('legal.monthlyRevenue') || 'Ingresos del Mes'}
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(mockData.overview.monthlyRevenue)}
              </p>
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <TrendingUp className="h-4 w-4 text-purple-600 mr-1" />
            <span className="text-purple-600 font-medium">12%</span>
            <span className="text-gray-600 ml-1">{t('legal.vs') || 'vs mes anterior'}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Incorporaciones Recientes */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-900">
                {t('legal.recentIncorporations') || 'Incorporaciones Recientes'}
              </h2>
              <Link
                href={`/${locale}/${tenantSlug}/legal/incorporations`}
                className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center"
              >
                {t('legal.viewAll') || 'Ver todas'}
                <ArrowUpRight className="h-4 w-4 ml-1" />
              </Link>
            </div>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {mockData.recentIncorporations.map((incorporation) => (
                <div key={incorporation.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <Link
                        href={`/${locale}/${tenantSlug}/legal/incorporations/${incorporation.id}`}
                        className="text-sm font-medium text-blue-600 hover:text-blue-700"
                      >
                        {incorporation.incorporationNumber}
                      </Link>
                      <h3 className="text-sm font-medium text-gray-900 mt-1">
                        {incorporation.companyName}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        {t('legal.client') || 'Cliente'}: {incorporation.client}
                      </p>
                      <p className="text-sm text-gray-600">
                        {t('legal.jurisdiction') || 'Jurisdicción'}: {incorporation.jurisdiction}
                      </p>
                      <p className="text-sm text-gray-600">
                        {t('legal.lawyer') || 'Abogado'}: {incorporation.assignedLawyer}
                      </p>
                    </div>
                    <div className="text-right space-y-2">
                      <div className="flex space-x-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(incorporation.status)}`}>
                          {t(`legal.status.${incorporation.status}`) || incorporation.status}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(incorporation.priority)}`}>
                          {t(`legal.priority.${incorporation.priority}`) || incorporation.priority}
                        </span>
                      </div>
                      {incorporation.expectedCompletion && (
                        <div className="flex items-center text-xs text-gray-600">
                          <Clock className="h-3 w-3 mr-1" />
                          {formatDate(incorporation.expectedCompletion)}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Próximas Citas */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-900">
                {t('legal.upcomingAppointments') || 'Próximas Citas'}
              </h2>
              <Link
                href={`/${locale}/${tenantSlug}/legal/calendar`}
                className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center"
              >
                {t('legal.viewCalendar') || 'Ver calendario'}
                <ArrowUpRight className="h-4 w-4 ml-1" />
              </Link>
            </div>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {mockData.upcomingAppointments.map((appointment) => (
                <div key={appointment.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getAppointmentTypeColor(appointment.type)}`}>
                          {getAppointmentTypeIcon(appointment.type)}
                          <span className="ml-1">{getAppointmentTypeName(appointment.type)}</span>
                        </span>
                        <span className="text-xs text-gray-500 flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          {appointment.duration} min
                        </span>
                      </div>
                      <h3 className="text-sm font-medium text-gray-900 mb-1">
                        {appointment.title}
                      </h3>
                      <div className="space-y-1 text-sm text-gray-600">
                        <p className="flex items-center">
                          <Users className="h-3 w-3 mr-1" />
                          {appointment.client}
                        </p>
                        {appointment.incorporationId && (
                          <p className="flex items-center">
                            <Scale className="h-3 w-3 mr-1" />
                            <Link
                              href={`/${locale}/${tenantSlug}/legal/incorporations/${appointment.incorporationId}`}
                              className="text-blue-600 hover:text-blue-700"
                            >
                              {appointment.incorporationId}
                            </Link>
                          </p>
                        )}
                        <p className="flex items-center">
                          <FileText className="h-3 w-3 mr-1" />
                          {appointment.lawyer}
                        </p>
                      </div>
                    </div>
                    <div className="text-right space-y-2">
                      <div className="flex items-center justify-end space-x-2">
                        <div className="text-sm text-gray-900 font-medium">
                          {formatDate(appointment.date)}
                        </div>
                        <div className="flex items-center">
                          {getMeetingTypeIcon(appointment.meetingType)}
                        </div>
                      </div>
                      <div className="text-xs text-gray-500 capitalize">
                        {appointment.jurisdiction?.replace('_', ' ')}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Actividad Reciente */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            {t('legal.recentActivity') || 'Actividad Reciente'}
          </h2>
        </div>
        <div className="p-6">
          <div className="space-y-3">
            {mockData.recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm text-gray-900">{activity.message}</p>
                  <p className="text-xs text-gray-500">
                    {formatDate(activity.timestamp)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
} 