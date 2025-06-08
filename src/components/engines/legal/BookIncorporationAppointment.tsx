'use client';

import React, { useState } from 'react';
import { useI18n } from '@/hooks/useI18n';
import { 
  Calendar,
  Clock,
  Users,
  Scale,
  FileText,
  Video,
  Phone,
  MapPin,
  X,
  ArrowRight
} from 'lucide-react';

interface BookIncorporationAppointmentProps {
  incorporationId?: string;
  incorporationNumber?: string;
  companyName?: string;
  clientName?: string;
  jurisdiction?: string;
  className?: string;
}

const appointmentTypes = [
  {
    id: 'initial_consultation',
    name: 'Consulta Inicial',
    description: 'Primera reunión para discutir los requisitos de incorporación',
    duration: 60,
    price: 150,
    icon: <Users className="h-5 w-5" />,
    color: 'bg-blue-100 text-blue-800',
    availableMeetingTypes: ['in_person', 'video_call']
  },
  {
    id: 'document_review',
    name: 'Revisión de Documentos',
    description: 'Revisión detallada de documentos de incorporación',
    duration: 90,
    price: 200,
    icon: <FileText className="h-5 w-5" />,
    color: 'bg-green-100 text-green-800',
    availableMeetingTypes: ['in_person', 'video_call']
  },
  {
    id: 'document_signing',
    name: 'Firma de Documentos',
    description: 'Reunión para la firma final de documentos',
    duration: 45,
    price: 100,
    icon: <FileText className="h-5 w-5" />,
    color: 'bg-purple-100 text-purple-800',
    availableMeetingTypes: ['in_person']
  },
  {
    id: 'follow_up',
    name: 'Seguimiento',
    description: 'Reunión de seguimiento del proceso',
    duration: 30,
    price: 75,
    icon: <Clock className="h-5 w-5" />,
    color: 'bg-yellow-100 text-yellow-800',
    availableMeetingTypes: ['phone_call', 'video_call']
  }
];

const meetingTypes = {
  'in_person': {
    name: 'Presencial',
    icon: <MapPin className="h-4 w-4" />,
    description: 'Reunión en nuestra oficina'
  },
  'video_call': {
    name: 'Videollamada',
    icon: <Video className="h-4 w-4" />,
    description: 'Reunión virtual por Zoom/Teams'
  },
  'phone_call': {
    name: 'Llamada',
    icon: <Phone className="h-4 w-4" />,
    description: 'Llamada telefónica'
  }
};

export default function BookIncorporationAppointment({
  incorporationId,
  incorporationNumber,
  companyName,
  clientName,
  jurisdiction,
  className = ''
}: BookIncorporationAppointmentProps) {
  const { t, locale } = useI18n();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAppointmentType, setSelectedAppointmentType] = useState<string>('');
  const [selectedMeetingType, setSelectedMeetingType] = useState<string>('');

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  };

  const handleBookAppointment = () => {
    if (!selectedAppointmentType) return;

    // Construir la URL del booking engine con parámetros pre-llenados
    const bookingParams = new URLSearchParams({
      service: selectedAppointmentType,
      ...(selectedMeetingType && { meetingType: selectedMeetingType }),
      ...(incorporationId && { incorporationId }),
      ...(incorporationNumber && { incorporationNumber }),
      ...(companyName && { companyName }),
      ...(clientName && { clientName }),
      ...(jurisdiction && { jurisdiction }),
      category: 'legal_incorporation',
      returnUrl: `/${locale}/legal/incorporations${incorporationId ? `/${incorporationId}` : ''}`
    });

    // Redirigir al booking engine con los parámetros
    window.location.href = `/${locale}/bookings/book?${bookingParams.toString()}`;
  };

  const selectedType = appointmentTypes.find(type => type.id === selectedAppointmentType);

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className={`inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors ${className}`}
      >
        <Calendar className="h-4 w-4 mr-2" />
        {t('legal.bookAppointment') || 'Programar Cita'}
      </button>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    {t('legal.bookIncorporationAppointment') || 'Programar Cita de Incorporación'}
                  </h2>
                  {incorporationNumber && (
                    <p className="text-sm text-gray-600 mt-1">
                      {incorporationNumber} - {companyName}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Incorporation Info */}
              {incorporationId && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start">
                    <Scale className="h-5 w-5 text-blue-600 mt-1" />
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-blue-900">
                        {t('legal.incorporationDetails') || 'Detalles de la Incorporación'}
                      </h3>
                      <div className="mt-2 text-sm text-blue-700 space-y-1">
                        <p><strong>{t('legal.incorporationNumber') || 'Número'}:</strong> {incorporationNumber}</p>
                        <p><strong>{t('legal.companyName') || 'Empresa'}:</strong> {companyName}</p>
                        <p><strong>{t('legal.client') || 'Cliente'}:</strong> {clientName}</p>
                        {jurisdiction && (
                          <p><strong>{t('legal.jurisdiction') || 'Jurisdicción'}:</strong> {jurisdiction.replace('_', ' ')}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Appointment Type Selection */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  {t('legal.selectAppointmentType') || 'Selecciona el tipo de cita'}
                </h3>
                <div className="grid grid-cols-1 gap-3">
                  {appointmentTypes.map((type) => (
                    <div
                      key={type.id}
                      onClick={() => setSelectedAppointmentType(type.id)}
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                        selectedAppointmentType === type.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-3">
                          <div className={`p-2 rounded-lg ${type.color}`}>
                            {type.icon}
                          </div>
                          <div className="flex-1">
                            <h4 className="text-sm font-medium text-gray-900">
                              {type.name}
                            </h4>
                            <p className="text-sm text-gray-600 mt-1">
                              {type.description}
                            </p>
                            <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                              <span className="flex items-center">
                                <Clock className="h-3 w-3 mr-1" />
                                {type.duration} {t('legal.minutes') || 'min'}
                              </span>
                              <span className="flex items-center">
                                {formatPrice(type.price)}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className={`w-4 h-4 rounded-full border-2 ${
                          selectedAppointmentType === type.id
                            ? 'border-blue-500 bg-blue-500'
                            : 'border-gray-300'
                        }`}>
                          {selectedAppointmentType === type.id && (
                            <div className="w-2 h-2 bg-white rounded-full mx-auto mt-1"></div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Meeting Type Selection */}
              {selectedType && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    {t('legal.selectMeetingType') || 'Selecciona el tipo de reunión'}
                  </h3>
                  <div className="grid grid-cols-1 gap-3">
                    {selectedType.availableMeetingTypes.map((meetingType) => {
                      const meeting = meetingTypes[meetingType as keyof typeof meetingTypes];
                      return (
                        <div
                          key={meetingType}
                          onClick={() => setSelectedMeetingType(meetingType)}
                          className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                            selectedMeetingType === meetingType
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className="text-gray-600">
                                {meeting.icon}
                              </div>
                              <div>
                                <h4 className="text-sm font-medium text-gray-900">
                                  {meeting.name}
                                </h4>
                                <p className="text-xs text-gray-600">
                                  {meeting.description}
                                </p>
                              </div>
                            </div>
                            <div className={`w-4 h-4 rounded-full border-2 ${
                              selectedMeetingType === meetingType
                                ? 'border-blue-500 bg-blue-500'
                                : 'border-gray-300'
                            }`}>
                              {selectedMeetingType === meetingType && (
                                <div className="w-2 h-2 bg-white rounded-full mx-auto mt-1"></div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-gray-200">
              <div className="flex justify-between items-center">
                <div className="text-sm text-gray-600">
                  {selectedType && (
                    <span>
                      {selectedType.name} - {formatPrice(selectedType.price)} ({selectedType.duration} min)
                    </span>
                  )}
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    {t('legal.cancel') || 'Cancelar'}
                  </button>
                  <button
                    onClick={handleBookAppointment}
                    disabled={!selectedAppointmentType || !selectedMeetingType}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
                  >
                    {t('legal.continueToBooking') || 'Continuar a Reserva'}
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </button>
                </div>
              </div>

              {/* Booking Engine Integration Info */}
              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-600">
                  {t('legal.bookingIntegrationInfo') || 'Serás redirigido al sistema de reservas para seleccionar fecha y hora disponible.'}
                  {!incorporationId && (
                    <span className="block mt-1">
                      {t('legal.incorporationWillBeLinked') || 'La cita se vinculará automáticamente con la incorporación si está disponible.'}
                    </span>
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
} 