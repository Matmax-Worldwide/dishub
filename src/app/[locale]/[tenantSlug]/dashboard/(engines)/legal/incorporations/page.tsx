'use client';

import React, { useState } from 'react';
import { useI18n } from '@/hooks/useI18n';
import { 
  Scale, 
  Search, 
  Plus,
  Eye,
  Edit,
  MoreHorizontal,
  Clock,
  MapPin
} from 'lucide-react';
import Link from 'next/link';
import BookIncorporationAppointment from '@/app/components/engines/legal/BookIncorporationAppointment';

// Mock data - En producción esto vendría de la API
const mockIncorporations = [
  {
    id: '1',
    incorporationNumber: 'INC-2024-001',
    companyName: 'TechStart LLC',
    client: 'María García',
    jurisdiction: 'usa_delaware',
    companyType: 'llc',
    status: 'government_filing',
    priority: 'high',
    dateInitiated: '2024-01-01T10:00:00Z',
    expectedCompletion: '2024-01-15T10:00:00Z',
    assignedLawyer: 'Dr. Carlos Rodríguez',
    estimatedCost: 2500,
    progress: 75
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
    dateInitiated: '2024-01-05T10:00:00Z',
    expectedCompletion: '2024-01-25T10:00:00Z',
    assignedLawyer: 'Dra. Ana López',
    estimatedCost: 3200,
    progress: 45
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
    dateInitiated: '2024-01-10T10:00:00Z',
    expectedCompletion: '2024-01-20T14:30:00Z',
    assignedLawyer: 'Dr. Carlos Rodríguez',
    estimatedCost: 4100,
    progress: 85
  },
  {
    id: '4',
    incorporationNumber: 'INC-2024-004',
    companyName: 'Digital Ventures Corp',
    client: 'Ana Rodríguez',
    jurisdiction: 'usa_delaware',
    companyType: 'corporation',
    status: 'completed',
    priority: 'high',
    dateInitiated: '2023-12-15T10:00:00Z',
    expectedCompletion: '2024-01-02T10:00:00Z',
    assignedLawyer: 'Dr. Carlos Rodríguez',
    estimatedCost: 2800,
    progress: 100
  },
  {
    id: '5',
    incorporationNumber: 'INC-2024-005',
    companyName: 'Green Energy Solutions LLC',
    client: 'Carlos Méndez',
    jurisdiction: 'usa_nevada',
    companyType: 'llc',
    status: 'name_reservation',
    priority: 'medium',
    dateInitiated: '2024-01-12T10:00:00Z',
    expectedCompletion: '2024-01-30T10:00:00Z',
    assignedLawyer: 'Dra. Ana López',
    estimatedCost: 2200,
    progress: 25
  }
];

const jurisdictionNames: Record<string, string> = {
  'usa_delaware': 'Delaware, USA',
  'usa_nevada': 'Nevada, USA',
  'usa_wyoming': 'Wyoming, USA',
  'uk_england': 'England, UK',
  'singapore': 'Singapore',
  'hong_kong': 'Hong Kong',
  'bvi': 'British Virgin Islands',
  'cayman_islands': 'Cayman Islands'
};

const companyTypeNames: Record<string, string> = {
  'llc': 'LLC',
  'corporation': 'Corporation',
  'limited_company': 'Limited Company',
  'private_limited': 'Private Limited',
  'partnership': 'Partnership'
};

export default function IncorporationsPage() {
  const { t, locale } = useI18n();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterJurisdiction, setFilterJurisdiction] = useState('all');
  const [sortBy, setSortBy] = useState('dateInitiated');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat(locale, {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
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

  const getProgressColor = (progress: number) => {
    if (progress >= 90) return 'bg-green-500';
    if (progress >= 70) return 'bg-blue-500';
    if (progress >= 50) return 'bg-yellow-500';
    return 'bg-gray-500';
  };

  const filteredIncorporations = mockIncorporations.filter(incorporation => {
    const matchesSearch = incorporation.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         incorporation.client.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         incorporation.incorporationNumber.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || incorporation.status === filterStatus;
    const matchesJurisdiction = filterJurisdiction === 'all' || incorporation.jurisdiction === filterJurisdiction;
    
    return matchesSearch && matchesStatus && matchesJurisdiction;
  }).sort((a, b) => {
    const aValue = a[sortBy as keyof typeof a];
    const bValue = b[sortBy as keyof typeof b];
    
    if (sortOrder === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {t('legal.incorporations') || 'Company Incorporations'}
          </h1>
          <p className="text-gray-600 mt-1">
            {t('legal.incorporationsSubtitle') || 'Gestiona todas las incorporaciones de empresas'}
          </p>
        </div>
        <Link
          href={`/${locale}/legal/incorporations/new`}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
        >
          <Plus className="h-4 w-4 mr-2" />
          {t('legal.newIncorporation') || 'Nueva Incorporación'}
        </Link>
      </div>

      {/* Filters and Search */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder={t('legal.searchIncorporations') || 'Buscar incorporaciones...'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-full focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">{t('legal.allStatuses') || 'Todos los estados'}</option>
            <option value="initiated">{t('legal.status.initiated') || 'Iniciado'}</option>
            <option value="documentation_gathering">{t('legal.status.documentation_gathering') || 'Recopilando documentos'}</option>
            <option value="name_reservation">{t('legal.status.name_reservation') || 'Reserva de nombre'}</option>
            <option value="government_filing">{t('legal.status.government_filing') || 'Presentación gubernamental'}</option>
            <option value="pending_approval">{t('legal.status.pending_approval') || 'Pendiente de aprobación'}</option>
            <option value="completed">{t('legal.status.completed') || 'Completado'}</option>
          </select>

          {/* Jurisdiction Filter */}
          <select
            value={filterJurisdiction}
            onChange={(e) => setFilterJurisdiction(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">{t('legal.allJurisdictions') || 'Todas las jurisdicciones'}</option>
            <option value="usa_delaware">Delaware, USA</option>
            <option value="usa_nevada">Nevada, USA</option>
            <option value="uk_england">England, UK</option>
            <option value="singapore">Singapore</option>
          </select>

          {/* Sort */}
          <select
            value={`${sortBy}-${sortOrder}`}
            onChange={(e) => {
              const [field, order] = e.target.value.split('-');
              setSortBy(field);
              setSortOrder(order as 'asc' | 'desc');
            }}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="dateInitiated-desc">{t('legal.sortByDateDesc') || 'Fecha (más reciente)'}</option>
            <option value="dateInitiated-asc">{t('legal.sortByDateAsc') || 'Fecha (más antigua)'}</option>
            <option value="companyName-asc">{t('legal.sortByNameAsc') || 'Nombre (A-Z)'}</option>
            <option value="companyName-desc">{t('legal.sortByNameDesc') || 'Nombre (Z-A)'}</option>
            <option value="progress-desc">{t('legal.sortByProgressDesc') || 'Progreso (mayor)'}</option>
          </select>
        </div>
      </div>

      {/* Incorporations List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('legal.incorporation') || 'Incorporación'}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('legal.client') || 'Cliente'}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('legal.jurisdiction') || 'Jurisdicción'}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('legal.status') || 'Estado'}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('legal.progress') || 'Progreso'}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('legal.estimatedCost') || 'Costo Estimado'}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('legal.expectedCompletion') || 'Fecha Esperada'}
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('legal.actions') || 'Acciones'}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredIncorporations.map((incorporation) => (
                <tr key={incorporation.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <Link
                        href={`/${locale}/legal/incorporations/${incorporation.id}`}
                        className="text-sm font-medium text-blue-600 hover:text-blue-700"
                      >
                        {incorporation.incorporationNumber}
                      </Link>
                      <div className="text-sm text-gray-900 mt-1">{incorporation.companyName}</div>
                      <div className="text-xs text-gray-500">
                        {companyTypeNames[incorporation.companyType]}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{incorporation.client}</div>
                    <div className="text-xs text-gray-500">{incorporation.assignedLawyer}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <MapPin className="h-4 w-4 text-gray-400 mr-1" />
                      <span className="text-sm text-gray-900">
                        {jurisdictionNames[incorporation.jurisdiction]}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(incorporation.status)}`}>
                        {t(`legal.status.${incorporation.status}`) || incorporation.status}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(incorporation.priority)}`}>
                        {t(`legal.priority.${incorporation.priority}`) || incorporation.priority}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-full bg-gray-200 rounded-full h-2 mr-2">
                        <div 
                          className={`h-2 rounded-full ${getProgressColor(incorporation.progress)}`}
                          style={{ width: `${incorporation.progress}%` }}
                        ></div>
                      </div>
                      <span className="text-sm text-gray-900 w-10">{incorporation.progress}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatCurrency(incorporation.estimatedCost)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center text-sm text-gray-900">
                      <Clock className="h-4 w-4 text-gray-400 mr-1" />
                      {formatDate(incorporation.expectedCompletion)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      <BookIncorporationAppointment
                        incorporationId={incorporation.id}
                        incorporationNumber={incorporation.incorporationNumber}
                        companyName={incorporation.companyName}
                        clientName={incorporation.client}
                        jurisdiction={incorporation.jurisdiction}
                        className="p-1 text-green-600 hover:text-green-700"
                      />
                      <Link
                        href={`/${locale}/legal/incorporations/${incorporation.id}`}
                        className="text-blue-600 hover:text-blue-700 p-1"
                        title={t('legal.view') || 'Ver'}
                      >
                        <Eye className="h-4 w-4" />
                      </Link>
                      <Link
                        href={`/${locale}/legal/incorporations/${incorporation.id}/edit`}
                        className="text-gray-600 hover:text-gray-700 p-1"
                        title={t('legal.edit') || 'Editar'}
                      >
                        <Edit className="h-4 w-4" />
                      </Link>
                      <button
                        className="text-gray-600 hover:text-gray-700 p-1"
                        title={t('legal.more') || 'Más opciones'}
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Empty State */}
        {filteredIncorporations.length === 0 && (
          <div className="text-center py-12">
            <Scale className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              {t('legal.noIncorporations') || 'No se encontraron incorporaciones'}
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {t('legal.noIncorporationsDescription') || 'Comienza creando una nueva incorporación.'}
            </p>
            <div className="mt-6">
              <Link
                href={`/${locale}/legal/incorporations/new`}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <Plus className="h-4 w-4 mr-2" />
                {t('legal.newIncorporation') || 'Nueva Incorporación'}
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Summary */}
      {filteredIncorporations.length > 0 && (
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex justify-between items-center text-sm text-gray-600">
            <span>
              {t('legal.showing') || 'Mostrando'} {filteredIncorporations.length} {t('legal.of') || 'de'} {mockIncorporations.length} {t('legal.incorporations') || 'incorporaciones'}
            </span>
            <span>
              {t('legal.totalEstimatedValue') || 'Valor total estimado'}: {formatCurrency(filteredIncorporations.reduce((sum, inc) => sum + inc.estimatedCost, 0))}
            </span>
          </div>
        </div>
      )}
    </div>
  );
} 