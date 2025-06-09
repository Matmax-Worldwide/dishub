'use client';

import React, { useState } from 'react';
import { useI18n } from '@/hooks/useI18n';
import { 
  Settings,
  Plus,
  Edit,
  Trash2,
  Clock,
  Users,
  DollarSign,
  Calendar,
  FileText,
  Video,
  Phone,
  MapPin,
  AlertCircle,
  ArrowLeft,
  X,
  Save
} from 'lucide-react';
import Link from 'next/link';

// Mock data para servicios legales configurados
const mockLegalServices = [
  {
    id: '1',
    name: 'Consulta Inicial de Incorporación',
    description: 'Primera reunión para discutir los requisitos de incorporación',
    duration: 60,
    price: 150,
    currency: 'USD',
    category: 'consultation',
    bookingTypes: ['in_person', 'video_call'],
    jurisdictions: ['usa_delaware', 'usa_nevada', 'uk_england'],
    requiresDocuments: ['passport_copy', 'proof_of_address'],
    active: true,
    color: '#3B82F6'
  },
  {
    id: '2',
    name: 'Revisión de Documentos',
    description: 'Revisión detallada de documentos de incorporación',
    duration: 90,
    price: 200,
    currency: 'USD',
    category: 'document_review',
    bookingTypes: ['in_person', 'video_call'],
    jurisdictions: ['usa_delaware', 'usa_nevada', 'uk_england', 'singapore', 'hong_kong'],
    requiresDocuments: ['articles_of_incorporation', 'memorandum_of_association'],
    active: true,
    color: '#10B981'
  },
  {
    id: '3',
    name: 'Firma de Documentos',
    description: 'Reunión para la firma final de documentos de incorporación',
    duration: 45,
    price: 100,
    currency: 'USD',
    category: 'document_signing',
    bookingTypes: ['in_person'],
    jurisdictions: ['all'],
    requiresDocuments: ['certificate_of_incorporation', 'bylaws'],
    active: true,
    color: '#8B5CF6'
  },
  {
    id: '4',
    name: 'Seguimiento Post-Incorporación',
    description: 'Reunión de seguimiento después de completar la incorporación',
    duration: 30,
    price: 75,
    currency: 'USD',
    category: 'follow_up',
    bookingTypes: ['phone_call', 'video_call'],
    jurisdictions: ['all'],
    requiresDocuments: [],
    active: true,
    color: '#F59E0B'
  },
  {
    id: '5',
    name: 'Reunión de Cumplimiento',
    description: 'Reunión para revisar requisitos de cumplimiento continuo',
    duration: 75,
    price: 175,
    currency: 'USD',
    category: 'compliance',
    bookingTypes: ['in_person', 'video_call'],
    jurisdictions: ['all'],
    requiresDocuments: ['compliance_checklist'],
    active: true,
    color: '#EF4444'
  }
];

const serviceCategories = {
  'consultation': {
    name: 'Consulta',
    icon: <Users className="h-4 w-4" />,
    color: 'bg-blue-100 text-blue-800'
  },
  'document_review': {
    name: 'Revisión de Documentos',
    icon: <FileText className="h-4 w-4" />,
    color: 'bg-green-100 text-green-800'
  },
  'document_signing': {
    name: 'Firma de Documentos',
    icon: <FileText className="h-4 w-4" />,
    color: 'bg-purple-100 text-purple-800'
  },
  'follow_up': {
    name: 'Seguimiento',
    icon: <Clock className="h-4 w-4" />,
    color: 'bg-yellow-100 text-yellow-800'
  },
  'compliance': {
    name: 'Cumplimiento',
    icon: <AlertCircle className="h-4 w-4" />,
    color: 'bg-red-100 text-red-800'
  }
};

const bookingTypeIcons = {
  'in_person': <MapPin className="h-4 w-4" />,
  'video_call': <Video className="h-4 w-4" />,
  'phone_call': <Phone className="h-4 w-4" />
};

const jurisdictionNames = {
  'usa_delaware': 'Delaware, USA',
  'usa_nevada': 'Nevada, USA',
  'uk_england': 'England, UK',
  'singapore': 'Singapore',
  'hong_kong': 'Hong Kong',
  'bvi': 'British Virgin Islands',
  'cayman_islands': 'Cayman Islands',
  'all': 'Todas las jurisdicciones'
};

const availableCategories = [
  { id: 'consultation', name: 'Consulta', icon: Users, color: '#3B82F6' },
  { id: 'document_review', name: 'Revisión de Documentos', icon: FileText, color: '#10B981' },
  { id: 'document_signing', name: 'Firma de Documentos', icon: FileText, color: '#8B5CF6' },
  { id: 'follow_up', name: 'Seguimiento', icon: Clock, color: '#F59E0B' },
  { id: 'compliance', name: 'Cumplimiento', icon: AlertCircle, color: '#EF4444' }
];

const availableBookingTypes = [
  { id: 'in_person', name: 'Presencial', icon: MapPin },
  { id: 'video_call', name: 'Videollamada', icon: Video },
  { id: 'phone_call', name: 'Llamada', icon: Phone }
];

const availableJurisdictions = [
  { id: 'usa_delaware', name: 'Delaware, USA' },
  { id: 'usa_nevada', name: 'Nevada, USA' },
  { id: 'uk_england', name: 'England, UK' },
  { id: 'singapore', name: 'Singapore' },
  { id: 'hong_kong', name: 'Hong Kong' },
  { id: 'bvi', name: 'British Virgin Islands' },
  { id: 'cayman_islands', name: 'Cayman Islands' },
  { id: 'all', name: 'Todas las jurisdicciones' }
];

const availableDocuments = [
  { id: 'passport_copy', name: 'Copia de pasaporte' },
  { id: 'proof_of_address', name: 'Comprobante de domicilio' },
  { id: 'articles_of_incorporation', name: 'Artículos de incorporación' },
  { id: 'memorandum_of_association', name: 'Memorando de asociación' },
  { id: 'certificate_of_incorporation', name: 'Certificado de incorporación' },
  { id: 'bylaws', name: 'Estatutos' },
  { id: 'shareholder_agreement', name: 'Acuerdo de accionistas' },
  { id: 'compliance_checklist', name: 'Lista de cumplimiento' }
];

interface LegalService {
  id: string;
  name: string;
  description: string;
  duration: number;
  price: number;
  currency: string;
  category: string;
  bookingTypes: string[];
  jurisdictions: string[];
  requiresDocuments: string[];
  active: boolean;
  color: string;
}

const emptyService: Omit<LegalService, 'id'> = {
  name: '',
  description: '',
  duration: 60,
  price: 0,
  currency: 'USD',
  category: '',
  bookingTypes: [],
  jurisdictions: [],
  requiresDocuments: [],
  active: true,
  color: '#3B82F6'
};

export default function LegalBookingConfigPage() {
  const { t, locale } = useI18n();
  const [services, setServices] = useState(mockLegalServices);
  const [editingService, setEditingService] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState<Omit<LegalService, 'id'>>(emptyService);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleToggleService = (serviceId: string) => {
    setServices(services.map(service => 
      service.id === serviceId 
        ? { ...service, active: !service.active }
        : service
    ));
  };

  const handleDeleteService = (serviceId: string) => {
    if (confirm('¿Estás seguro de que quieres eliminar este servicio?')) {
      setServices(services.filter(service => service.id !== serviceId));
    }
  };

  const handleAddService = () => {
    setFormData(emptyService);
    setEditingService(null);
    setShowAddForm(true);
  };

  const handleEditService = (serviceId: string) => {
    const service = services.find(s => s.id === serviceId);
    if (service) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { id, ...serviceData } = service;
      setFormData(serviceData);
      setEditingService(serviceId);
      setShowAddForm(true);
    }
  };

  const handleCloseForm = () => {
    setShowAddForm(false);
    setEditingService(null);
    setFormData(emptyService);
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (editingService) {
        // Editar servicio existente
        setServices(services.map(service => 
          service.id === editingService 
            ? { ...formData, id: editingService }
            : service
        ));
      } else {
        // Agregar nuevo servicio
        const newService = {
          ...formData,
          id: `service_${Date.now()}`
        };
        setServices([...services, newService]);
      }
      
      handleCloseForm();
    } catch (error) {
      console.error('Error saving service:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFormChange = (field: keyof Omit<LegalService, 'id'>, value: string | number | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleArrayFieldToggle = (field: 'bookingTypes' | 'jurisdictions' | 'requiresDocuments', value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field].filter(item => item !== value)
        : [...prev[field], value]
    }));
  };

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency
    }).format(price);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <Link
            href={`/${locale}/legal/settings`}
            className="text-gray-600 hover:text-gray-800"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {t('legal.bookingConfiguration') || 'Configuración de Citas'}
            </h1>
            <p className="text-gray-600 mt-1">
              {t('legal.bookingConfigurationDescription') || 'Configura los servicios disponibles para reservas de incorporación'}
            </p>
          </div>
        </div>
        <div className="flex space-x-3">
          <Link
            href={`/${locale}/bookings/services`}
            className="bg-white text-gray-700 border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors flex items-center"
          >
            <Settings className="h-4 w-4 mr-2" />
            {t('legal.fullBookingSettings') || 'Configuración Completa'}
          </Link>
          <button
            onClick={handleAddService}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
          >
            <Plus className="h-4 w-4 mr-2" />
            {t('legal.addService') || 'Agregar Servicio'}
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Calendar className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">{t('legal.totalServices') || 'Total de Servicios'}</p>
              <p className="text-2xl font-bold text-gray-900">{services.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <Users className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">{t('legal.activeServices') || 'Servicios Activos'}</p>
              <p className="text-2xl font-bold text-gray-900">{services.filter(s => s.active).length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Clock className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">{t('legal.avgDuration') || 'Duración Promedio'}</p>
              <p className="text-2xl font-bold text-gray-900">
                {Math.round(services.reduce((acc, s) => acc + s.duration, 0) / services.length)} min
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <DollarSign className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">{t('legal.avgPrice') || 'Precio Promedio'}</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatPrice(services.reduce((acc, s) => acc + s.price, 0) / services.length, 'USD')}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Services List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {t('legal.legalServices') || 'Servicios Legales'}
          </h2>
          <p className="text-gray-600 mt-1">
            {t('legal.legalServicesDescription') || 'Gestiona los servicios disponibles para reservas relacionadas con incorporaciones'}
          </p>
        </div>

        <div className="divide-y divide-gray-200">
          {services.map((service) => (
            <div key={service.id} className="p-6">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-lg font-medium text-gray-900">{service.name}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${serviceCategories[service.category as keyof typeof serviceCategories]?.color}`}>
                      {serviceCategories[service.category as keyof typeof serviceCategories]?.icon}
                      <span className="ml-1">
                        {serviceCategories[service.category as keyof typeof serviceCategories]?.name}
                      </span>
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      service.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {service.active ? (t('legal.active') || 'Activo') : (t('legal.inactive') || 'Inactivo')}
                    </span>
                  </div>

                  <p className="text-gray-600 mb-4">{service.description}</p>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <div className="flex items-center mb-2">
                        <Clock className="h-4 w-4 text-gray-400 mr-2" />
                        <span className="font-medium">{service.duration} {t('legal.minutes') || 'minutos'}</span>
                      </div>
                      <div className="flex items-center mb-2">
                        <DollarSign className="h-4 w-4 text-gray-400 mr-2" />
                        <span className="font-medium">{formatPrice(service.price, service.currency)}</span>
                      </div>
                    </div>

                    <div>
                      <p className="font-medium text-gray-700 mb-1">
                        {t('legal.bookingTypes') || 'Tipos de Reserva'}:
                      </p>
                      <div className="flex space-x-2">
                        {service.bookingTypes.map((type) => (
                          <div key={type} className="flex items-center text-gray-600">
                            {bookingTypeIcons[type as keyof typeof bookingTypeIcons]}
                            <span className="ml-1 text-xs">
                              {t(`legal.bookingType.${type}`) || type.replace('_', ' ')}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <p className="font-medium text-gray-700 mb-1">
                        {t('legal.jurisdictions') || 'Jurisdicciones'}:
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {service.jurisdictions.slice(0, 3).map((jurisdiction) => (
                          <span
                            key={jurisdiction}
                            className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full"
                          >
                            {jurisdictionNames[jurisdiction as keyof typeof jurisdictionNames] || jurisdiction}
                          </span>
                        ))}
                        {service.jurisdictions.length > 3 && (
                          <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full">
                            +{service.jurisdictions.length - 3} más
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {service.requiresDocuments.length > 0 && (
                    <div className="mt-4">
                      <p className="font-medium text-gray-700 mb-2">
                        {t('legal.requiredDocuments') || 'Documentos Requeridos'}:
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {service.requiresDocuments.map((doc) => (
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

                <div className="ml-6 flex flex-col space-y-2">
                  <button
                    onClick={() => handleToggleService(service.id)}
                    className={`px-3 py-1 rounded-md text-sm font-medium ${
                      service.active
                        ? 'bg-red-100 text-red-700 hover:bg-red-200'
                        : 'bg-green-100 text-green-700 hover:bg-green-200'
                    }`}
                  >
                    {service.active ? (t('legal.deactivate') || 'Desactivar') : (t('legal.activate') || 'Activar')}
                  </button>
                  
                  <button
                    onClick={() => handleEditService(service.id)}
                    className="px-3 py-1 bg-blue-100 text-blue-700 rounded-md text-sm font-medium hover:bg-blue-200 flex items-center"
                  >
                    <Edit className="h-3 w-3 mr-1" />
                    {t('legal.edit') || 'Editar'}
                  </button>
                  
                  <button
                    onClick={() => handleDeleteService(service.id)}
                    className="px-3 py-1 bg-red-100 text-red-700 rounded-md text-sm font-medium hover:bg-red-200 flex items-center"
                  >
                    <Trash2 className="h-3 w-3 mr-1" />
                    {t('legal.delete') || 'Eliminar'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Integration Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <Calendar className="h-6 w-6 text-blue-600" />
          </div>
          <div className="ml-3">
            <h3 className="text-lg font-medium text-blue-900">
              {t('legal.bookingEngineIntegration') || 'Integración con Booking Engine'}
            </h3>
            <div className="mt-2 text-sm text-blue-700">
              <p className="mb-2">
                {t('legal.integrationDescription') || 'Estos servicios están integrados automáticamente con el Booking Engine y aparecerán como opciones disponibles para los clientes.'}
              </p>
              <ul className="list-disc list-inside space-y-1">
                <li>{t('legal.integrationFeature1') || 'Reservas automáticas sincronizadas con incorporaciones'}</li>
                <li>{t('legal.integrationFeature2') || 'Documentos requeridos solicitados durante la reserva'}</li>
                <li>{t('legal.integrationFeature3') || 'Notificaciones automáticas a abogados y clientes'}</li>
                <li>{t('legal.integrationFeature4') || 'Facturación integrada con el sistema legal'}</li>
              </ul>
            </div>
            <div className="mt-4">
              <Link
                href={`/${locale}/bookings/services`}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <Settings className="h-4 w-4 mr-2" />
                {t('legal.manageInBookingEngine') || 'Gestionar en Booking Engine'}
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Add/Edit Service Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-900">
                  {editingService 
                    ? (t('legal.editService') || 'Editar Servicio')
                    : (t('legal.addNewService') || 'Agregar Nuevo Servicio')
                  }
                </h2>
                <button
                  onClick={handleCloseForm}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <form onSubmit={handleSubmitForm} className="p-6 space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('legal.serviceName') || 'Nombre del Servicio'} *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleFormChange('name', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder={t('legal.serviceNamePlaceholder') || 'Ej: Consulta inicial de incorporación'}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('legal.category') || 'Categoría'} *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => handleFormChange('category', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="">{t('legal.selectCategory') || 'Seleccionar categoría'}</option>
                    {availableCategories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('legal.description') || 'Descripción'}
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleFormChange('description', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder={t('legal.descriptionPlaceholder') || 'Describe brevemente este servicio...'}
                />
              </div>

              {/* Duration and Price */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('legal.duration') || 'Duración'} ({t('legal.minutes') || 'minutos'}) *
                  </label>
                  <input
                    type="number"
                    value={formData.duration}
                    onChange={(e) => handleFormChange('duration', parseInt(e.target.value) || 0)}
                    min="15"
                    step="15"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('legal.price') || 'Precio'} *
                  </label>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) => handleFormChange('price', parseFloat(e.target.value) || 0)}
                    min="0"
                    step="0.01"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('legal.currency') || 'Moneda'}
                  </label>
                  <select
                    value={formData.currency}
                    onChange={(e) => handleFormChange('currency', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                    <option value="GBP">GBP</option>
                    <option value="COP">COP</option>
                  </select>
                </div>
              </div>

              {/* Booking Types */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  {t('legal.availableBookingTypes') || 'Tipos de Reserva Disponibles'} *
                </label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {availableBookingTypes.map((bookingType) => {
                    const IconComponent = bookingType.icon;
                    return (
                      <label
                        key={bookingType.id}
                        className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                          formData.bookingTypes.includes(bookingType.id)
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={formData.bookingTypes.includes(bookingType.id)}
                          onChange={() => handleArrayFieldToggle('bookingTypes', bookingType.id)}
                          className="sr-only"
                        />
                        <IconComponent className="h-5 w-5 text-gray-600 mr-3" />
                        <span className="text-sm font-medium text-gray-900">
                          {bookingType.name}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Jurisdictions */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  {t('legal.applicableJurisdictions') || 'Jurisdicciones Aplicables'}
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-4">
                  {availableJurisdictions.map((jurisdiction) => (
                    <label
                      key={jurisdiction.id}
                      className="flex items-center space-x-2 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={formData.jurisdictions.includes(jurisdiction.id)}
                        onChange={() => handleArrayFieldToggle('jurisdictions', jurisdiction.id)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">
                        {jurisdiction.name}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Required Documents */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  {t('legal.requiredDocuments') || 'Documentos Requeridos'}
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-4">
                  {availableDocuments.map((document) => (
                    <label
                      key={document.id}
                      className="flex items-center space-x-2 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={formData.requiresDocuments.includes(document.id)}
                        onChange={() => handleArrayFieldToggle('requiresDocuments', document.id)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">
                        {document.name}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Color and Status */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('legal.serviceColor') || 'Color del Servicio'}
                  </label>
                  <div className="flex items-center space-x-3">
                    <input
                      type="color"
                      value={formData.color}
                      onChange={(e) => handleFormChange('color', e.target.value)}
                      className="w-12 h-10 border border-gray-300 rounded-lg cursor-pointer"
                    />
                    <input
                      type="text"
                      value={formData.color}
                      onChange={(e) => handleFormChange('color', e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="#3B82F6"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('legal.status') || 'Estado'}
                  </label>
                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={formData.active}
                      onChange={(e) => handleFormChange('active', e.target.checked)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">
                      {t('legal.serviceActive') || 'Servicio activo'}
                    </span>
                  </label>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={handleCloseForm}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  {t('legal.cancel') || 'Cancelar'}
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !formData.name || !formData.category || formData.bookingTypes.length === 0}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      {t('legal.saving') || 'Guardando...'}
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      {editingService 
                        ? (t('legal.updateService') || 'Actualizar Servicio')
                        : (t('legal.createService') || 'Crear Servicio')
                      }
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
} 