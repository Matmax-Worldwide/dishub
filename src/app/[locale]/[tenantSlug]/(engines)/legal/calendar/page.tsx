 'use client';

import React, { useState } from 'react';
import { useI18n } from '@/hooks/useI18n';
import { 
  Calendar,
  Clock, 
  Plus,
  Users,
  Scale,
  MapPin,
  Phone,
  Video,
  FileText,
  AlertCircle
} from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

// Mock data - En producción esto vendría del Booking Engine
const mockAppointments = [
  {
    id: '1',
    title: 'Consulta inicial - TechStart LLC',
    client: 'María García',
    lawyer: 'Dr. Carlos Rodríguez',
    incorporationId: 'INC-2024-001',
    incorporationNumber: 'INC-2024-001',
    companyName: 'TechStart LLC',
    type: 'initial_consultation',
    date: '2024-01-15',
    startTime: '09:00',
    endTime: '10:00',
    location: 'Oficina Principal',
    meetingType: 'in_person',
    status: 'confirmed',
    notes: 'Primera reunión para discutir la incorporación en Delaware',
    documents: ['passport_copy', 'proof_of_address'],
    jurisdiction: 'usa_delaware'
  },
  {
    id: '2',
    title: 'Revisión de documentos - Global Trading Ltd',
    client: 'Pedro Martínez',
    lawyer: 'Dra. Ana López',
    incorporationId: 'INC-2024-002',
    incorporationNumber: 'INC-2024-002',
    companyName: 'Global Trading Ltd',
    type: 'document_review',
    date: '2024-01-15',
    startTime: '14:00',
    endTime: '15:30',
    location: 'Virtual',
    meetingType: 'video_call',
    status: 'confirmed',
    notes: 'Revisar documentos para incorporación en UK',
    documents: ['articles_of_incorporation', 'shareholder_agreement'],
    jurisdiction: 'uk_england'
  },
  {
    id: '3',
    title: 'Firma de documentos - Innovation Holdings',
    client: 'Tech Solutions Inc.',
    lawyer: 'Dr. Carlos Rodríguez',
    incorporationId: 'INC-2024-003',
    incorporationNumber: 'INC-2024-003',
    companyName: 'Innovation Holdings Pte Ltd',
    type: 'document_signing',
    date: '2024-01-16',
    startTime: '11:00',
    endTime: '12:00',
    location: 'Oficina Principal',
    meetingType: 'in_person',
    status: 'confirmed',
    notes: 'Firma final de documentos de incorporación en Singapore',
    documents: ['certificate_of_incorporation', 'bylaws'],
    jurisdiction: 'singapore'
  },
  {
    id: '4',
    title: 'Seguimiento - Digital Ventures Corp',
    client: 'Ana Rodríguez',
    lawyer: 'Dr. Carlos Rodríguez',
    incorporationId: 'INC-2024-004',
    incorporationNumber: 'INC-2024-004',
    companyName: 'Digital Ventures Corp',
    type: 'follow_up',
    date: '2024-01-17',
    startTime: '15:00',
    endTime: '15:30',
    location: 'Virtual',
    meetingType: 'phone_call',
    status: 'pending',
    notes: 'Actualización sobre el estado post-incorporación',
    documents: [],
    jurisdiction: 'usa_delaware'
  }
];

const appointmentTypes = {
  'initial_consultation': {
    name: 'Consulta Inicial',
    color: 'bg-blue-100 text-blue-800',
    icon: <Users className="h-4 w-4" />
  },
  'document_review': {
    name: 'Revisión de Documentos',
    color: 'bg-yellow-100 text-yellow-800',
    icon: <FileText className="h-4 w-4" />
  },
  'document_signing': {
    name: 'Firma de Documentos',
    color: 'bg-green-100 text-green-800',
    icon: <FileText className="h-4 w-4" />
  },
  'follow_up': {
    name: 'Seguimiento',
    color: 'bg-purple-100 text-purple-800',
    icon: <Clock className="h-4 w-4" />
  },
  'compliance_meeting': {
    name: 'Reunión de Cumplimiento',
    color: 'bg-orange-100 text-orange-800',
    icon: <AlertCircle className="h-4 w-4" />
  }
};

const meetingTypes = {
  'in_person': {
    name: 'Presencial',
    icon: <MapPin className="h-4 w-4" />
  },
  'video_call': {
    name: 'Videollamada',
    icon: <Video className="h-4 w-4" />
  },
  'phone_call': {
    name: 'Llamada',
    icon: <Phone className="h-4 w-4" />
  }
};

export default function LegalCalendarPage() {
  const { t, locale } = useI18n();
  const params = useParams();
  const tenantSlug = params.tenantSlug as string;
  const [selectedDate, setSelectedDate] = useState('2024-01-15');
  const [filterType, setFilterType] = useState('all');
  const [filterLawyer, setFilterLawyer] = useState('all');
  const [view, setView] = useState<'day' | 'week' | 'month'>('day');

  const formatTime = (time: string) => {
    return new Intl.DateTimeFormat(locale, {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).format(new Date(`2024-01-01T${time}:00`));
  };

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat(locale, {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    }).format(new Date(dateString));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredAppointments = mockAppointments.filter(appointment => {
    const matchesDate = appointment.date === selectedDate;
    const matchesType = filterType === 'all' || appointment.type === filterType;
    const matchesLawyer = filterLawyer === 'all' || appointment.lawyer === filterLawyer;
    
    return matchesDate && matchesType && matchesLawyer;
  }).sort((a, b) => a.startTime.localeCompare(b.startTime));

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {t('legal.calendar') || 'Legal Calendar'}
          </h1>
          <p className="text-gray-600 mt-1">
            {t('legal.calendarSubtitle') || 'Gestiona citas y reuniones relacionadas con incorporaciones'}
          </p>
        </div>
        <div className="flex space-x-3">
          <Link
            href={`/${locale}/${tenantSlug}/bookings/calendar`}
            className="bg-white text-gray-700 border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors flex items-center"
          >
            <Calendar className="h-4 w-4 mr-2" />
            {t('legal.fullBookingCalendar') || 'Calendario Completo'}
          </Link>
          <button
            onClick={() => {/* TODO: Integrar con booking engine */}}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
          >
            <Plus className="h-4 w-4 mr-2" />
            {t('legal.newAppointment') || 'Nueva Cita'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Calendar Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            {/* Mini Calendar */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {t('legal.selectDate') || 'Seleccionar Fecha'}
              </h3>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Filters */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('legal.appointmentType') || 'Tipo de Cita'}
                </label>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">{t('legal.allTypes') || 'Todos los tipos'}</option>
                  <option value="initial_consultation">{t('legal.initialConsultation') || 'Consulta Inicial'}</option>
                  <option value="document_review">{t('legal.documentReview') || 'Revisión de Documentos'}</option>
                  <option value="document_signing">{t('legal.documentSigning') || 'Firma de Documentos'}</option>
                  <option value="follow_up">{t('legal.followUp') || 'Seguimiento'}</option>
                  <option value="compliance_meeting">{t('legal.complianceMeeting') || 'Reunión de Cumplimiento'}</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('legal.lawyer') || 'Abogado'}
                </label>
                <select
                  value={filterLawyer}
                  onChange={(e) => setFilterLawyer(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">{t('legal.allLawyers') || 'Todos los abogados'}</option>
                  <option value="Dr. Carlos Rodríguez">Dr. Carlos Rodríguez</option>
                  <option value="Dra. Ana López">Dra. Ana López</option>
                </select>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h4 className="text-sm font-medium text-gray-700 mb-3">
                {t('legal.todayStats') || 'Estadísticas de Hoy'}
              </h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">{t('legal.totalAppointments') || 'Total de citas'}:</span>
                  <span className="font-medium">{filteredAppointments.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">{t('legal.confirmed') || 'Confirmadas'}:</span>
                  <span className="font-medium text-green-600">
                    {filteredAppointments.filter(apt => apt.status === 'confirmed').length}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">{t('legal.pending') || 'Pendientes'}:</span>
                  <span className="font-medium text-yellow-600">
                    {filteredAppointments.filter(apt => apt.status === 'pending').length}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Calendar View */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            {/* Calendar Header */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-900">
                  {formatDate(selectedDate)}
                </h2>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setView('day')}
                    className={`px-3 py-1 rounded-md text-sm font-medium ${
                      view === 'day' 
                        ? 'bg-blue-100 text-blue-700' 
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {t('legal.day') || 'Día'}
                  </button>
                  <button
                    onClick={() => setView('week')}
                    className={`px-3 py-1 rounded-md text-sm font-medium ${
                      view === 'week' 
                        ? 'bg-blue-100 text-blue-700' 
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {t('legal.week') || 'Semana'}
                  </button>
                  <button
                    onClick={() => setView('month')}
                    className={`px-3 py-1 rounded-md text-sm font-medium ${
                      view === 'month' 
                        ? 'bg-blue-100 text-blue-700' 
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {t('legal.month') || 'Mes'}
                  </button>
                </div>
              </div>
            </div>

            {/* Appointments List */}
            <div className="p-6">
              {filteredAppointments.length === 0 ? (
                <div className="text-center py-12">
                  <Calendar className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">
                    {t('legal.noAppointments') || 'No hay citas programadas'}
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {t('legal.noAppointmentsDescription') || 'No hay citas programadas para esta fecha.'}
                  </p>
                  <div className="mt-6">
                    <button
                      onClick={() => {/* TODO: Integrar con booking engine */}}
                      className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      {t('legal.scheduleAppointment') || 'Programar Cita'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredAppointments.map((appointment) => (
                    <div key={appointment.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${appointmentTypes[appointment.type as keyof typeof appointmentTypes]?.color}`}>
                              {appointmentTypes[appointment.type as keyof typeof appointmentTypes]?.icon}
                              <span className="ml-1">
                                {appointmentTypes[appointment.type as keyof typeof appointmentTypes]?.name}
                              </span>
                            </span>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(appointment.status)}`}>
                              {t(`legal.status.${appointment.status}`) || appointment.status}
                            </span>
                          </div>

                          <h3 className="text-lg font-medium text-gray-900 mb-1">
                            {appointment.title}
                          </h3>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                            <div>
                              <p><strong>{t('legal.client') || 'Cliente'}:</strong> {appointment.client}</p>
                              <p><strong>{t('legal.lawyer') || 'Abogado'}:</strong> {appointment.lawyer}</p>
                              <p>
                                <strong>{t('legal.incorporation') || 'Incorporación'}:</strong>{' '}
                                <Link
                                  href={`/${locale}/${tenantSlug}/legal/incorporations/${appointment.incorporationId}`}
                                  className="text-blue-600 hover:text-blue-700"
                                >
                                  {appointment.incorporationNumber}
                                </Link>
                              </p>
                            </div>
                            <div>
                              <div className="flex items-center mb-1">
                                <Clock className="h-4 w-4 mr-1" />
                                <span>{formatTime(appointment.startTime)} - {formatTime(appointment.endTime)}</span>
                              </div>
                              <div className="flex items-center mb-1">
                                {meetingTypes[appointment.meetingType as keyof typeof meetingTypes]?.icon}
                                <span className="ml-1">{appointment.location}</span>
                              </div>
                              <div className="flex items-center">
                                <Scale className="h-4 w-4 mr-1" />
                                <span className="capitalize">{appointment.jurisdiction.replace('_', ' ')}</span>
                              </div>
                            </div>
                          </div>

                          {appointment.notes && (
                            <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                              <p className="text-sm text-gray-700">
                                <strong>{t('legal.notes') || 'Notas'}:</strong> {appointment.notes}
                              </p>
                            </div>
                          )}

                          {appointment.documents.length > 0 && (
                            <div className="mt-3">
                              <p className="text-sm font-medium text-gray-700 mb-2">
                                {t('legal.documentsNeeded') || 'Documentos necesarios'}:
                              </p>
                              <div className="flex flex-wrap gap-2">
                                {appointment.documents.map((doc) => (
                                  <span
                                    key={doc}
                                    className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                                  >
                                    {t(`legal.document.${doc}`) || doc.replace('_', ' ')}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="ml-4 flex flex-col space-y-2">
                          <Link
                            href={`/${locale}/${tenantSlug}/bookings/list?appointment=${appointment.id}`}
                            className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                          >
                            {t('legal.viewDetails') || 'Ver Detalles'}
                          </Link>
                          <button
                            onClick={() => {/* TODO: Edit appointment */}}
                            className="text-gray-600 hover:text-gray-700 text-sm font-medium"
                          >
                            {t('legal.edit') || 'Editar'}
                          </button>
                          <button
                            onClick={() => {/* TODO: Cancel appointment */}}
                            className="text-red-600 hover:text-red-700 text-sm font-medium"
                          >
                            {t('legal.cancel') || 'Cancelar'}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}