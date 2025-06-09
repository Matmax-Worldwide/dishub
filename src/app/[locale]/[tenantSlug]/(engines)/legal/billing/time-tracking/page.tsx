'use client';

import React, { useState } from 'react';
import { useI18n } from '@/hooks/useI18n';
import { 
  Clock, 
  Play, 
  Pause, 
  Plus, 
  Calendar, 
  Users, 
  Building, 
  Search,
  Edit,
  Trash2,
  DollarSign,
  FileText,
  StopCircle
} from 'lucide-react';

// TypeScript interfaces
interface TimeEntry {
  id: string;
  description: string;
  hours: number;
  hourlyRate: number;
  total: number;
  date: string;
  lawyerId: string;
  lawyer: { id: string; name: string; };
  clientId: string;
  client: { id: string; name: string; company?: string; };
  incorporationId?: string;
  incorporation?: { id: string; companyName: string; };
  billable: boolean;
  invoiced: boolean;
  invoiceId?: string;
  taskType: 'consultation' | 'document_preparation' | 'research' | 'filing' | 'meeting' | 'other';
}

// Mock data
const mockTimeEntries: TimeEntry[] = [
  {
    id: 'TE-001',
    description: 'Initial consultation with client regarding Delaware LLC formation',
    hours: 2.5,
    hourlyRate: 250,
    total: 625,
    date: '2024-01-10T14:00:00Z',
    lawyerId: 'LAW-001',
    lawyer: { id: 'LAW-001', name: 'Dr. Carlos Rodríguez' },
    clientId: 'CLI-001',
    client: { id: 'CLI-001', name: 'María García', company: 'TechStart LLC' },
    incorporationId: 'INC-2024-001',
    incorporation: { id: 'INC-2024-001', companyName: 'TechStart LLC' },
    billable: true,
    invoiced: false,
    taskType: 'consultation'
  },
  {
    id: 'TE-002',
    description: 'Document preparation for Articles of Incorporation',
    hours: 3.0,
    hourlyRate: 250,
    total: 750,
    date: '2024-01-11T09:00:00Z',
    lawyerId: 'LAW-001',
    lawyer: { id: 'LAW-001', name: 'Dr. Carlos Rodríguez' },
    clientId: 'CLI-001',
    client: { id: 'CLI-001', name: 'María García', company: 'TechStart LLC' },
    incorporationId: 'INC-2024-001',
    incorporation: { id: 'INC-2024-001', companyName: 'TechStart LLC' },
    billable: true,
    invoiced: false,
    taskType: 'document_preparation'
  }
];

const mockStats = {
  totalHours: 156.5,
  billableHours: 142.0,
  nonBillableHours: 14.5,
  totalValue: 35500,
  thisWeekHours: 28.5,
  averageHourlyRate: 247
};

export default function TimeTrackingPage() {
  const { t, locale } = useI18n();
  
  const [timeEntries] = useState<TimeEntry[]>(mockTimeEntries);
  const [isTracking, setIsTracking] = useState(false);
  const [currentTime] = useState(0);
  const [filters, setFilters] = useState({
    search: '',
    billable: '',
    lawyer: '',
    dateRange: '',
    invoiced: ''
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: 'USD'
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

  const formatHours = (hours: number) => {
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return `${h}:${m.toString().padStart(2, '0')}`;
  };

  const getTaskTypeColor = (type: string) => {
    switch (type) {
      case 'consultation': return 'bg-blue-100 text-blue-800';
      case 'document_preparation': return 'bg-green-100 text-green-800';
      case 'research': return 'bg-purple-100 text-purple-800';
      case 'filing': return 'bg-orange-100 text-orange-800';
      case 'meeting': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {t('legal.timeTracking') || 'Time Tracking'}
          </h1>
          <p className="text-gray-600 mt-1">
            {t('legal.timeTrackingSubtitle') || 'Track billable hours and manage time entries for legal services'}
          </p>
        </div>
        <div className="flex space-x-3">
          <button 
            className={`px-4 py-2 rounded-lg transition-colors flex items-center ${
              isTracking 
                ? 'bg-red-600 text-white hover:bg-red-700' 
                : 'bg-green-600 text-white hover:bg-green-700'
            }`}
            onClick={() => setIsTracking(!isTracking)}
          >
            {isTracking ? <StopCircle className="h-4 w-4 mr-2" /> : <Play className="h-4 w-4 mr-2" />}
            {isTracking ? (t('legal.stopTimer') || 'Stop Timer') : (t('legal.startTimer') || 'Start Timer')}
          </button>
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center">
            <Plus className="h-4 w-4 mr-2" />
            {t('legal.addTimeEntry') || 'Add Entry'}
          </button>
        </div>
      </div>

      {/* Timer Widget */}
      {isTracking && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-green-800 font-medium">{t('legal.tracking') || 'Tracking Time'}</span>
              </div>
              <div className="text-2xl font-mono font-bold text-green-800">
                {formatHours(currentTime)}
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button className="p-2 text-green-600 hover:bg-green-100 rounded-lg">
                <Pause className="h-4 w-4" />
              </button>
              <button 
                className="p-2 text-red-600 hover:bg-red-100 rounded-lg"
                onClick={() => setIsTracking(false)}
              >
                <StopCircle className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Clock className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">
                {t('legal.totalHours') || 'Total Hours'}
              </p>
              <p className="text-2xl font-bold text-gray-900">{formatHours(mockStats.totalHours)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <DollarSign className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">
                {t('legal.billableHours') || 'Billable Hours'}
              </p>
              <p className="text-2xl font-bold text-gray-900">{formatHours(mockStats.billableHours)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <FileText className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">
                {t('legal.totalValue') || 'Total Value'}
              </p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(mockStats.totalValue)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Calendar className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">
                {t('legal.thisWeek') || 'This Week'}
              </p>
              <p className="text-2xl font-bold text-gray-900">{formatHours(mockStats.thisWeekHours)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <DollarSign className="h-6 w-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">
                {t('legal.avgRate') || 'Avg Rate'}
              </p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(mockStats.averageHourlyRate)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-gray-100 rounded-lg">
              <Clock className="h-6 w-6 text-gray-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">
                {t('legal.nonBillable') || 'Non-billable'}
              </p>
              <p className="text-2xl font-bold text-gray-900">{formatHours(mockStats.nonBillableHours)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder={t('legal.searchTimeEntries') || 'Search time entries...'}
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          
          <div className="flex gap-2">
            <select
              value={filters.billable}
              onChange={(e) => setFilters(prev => ({ ...prev, billable: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">{t('legal.allEntries') || 'All Entries'}</option>
              <option value="true">{t('legal.billableOnly') || 'Billable Only'}</option>
              <option value="false">{t('legal.nonBillableOnly') || 'Non-billable Only'}</option>
            </select>

            <select
              value={filters.invoiced}
              onChange={(e) => setFilters(prev => ({ ...prev, invoiced: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">{t('legal.allInvoiceStatuses') || 'All Invoice Statuses'}</option>
              <option value="true">{t('legal.invoiced') || 'Invoiced'}</option>
              <option value="false">{t('legal.notInvoiced') || 'Not Invoiced'}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Time Entries List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            {t('legal.timeEntriesList') || 'Time Entries'}
          </h2>
        </div>

        <div className="p-6">
          <div className="space-y-4">
            {timeEntries.map((entry) => (
              <div key={entry.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4 flex-1">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Clock className="h-6 w-6 text-blue-600" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTaskTypeColor(entry.taskType)}`}>
                          {t(`legal.taskTypes.${entry.taskType}`) || entry.taskType}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          entry.billable ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {entry.billable ? (t('legal.billable') || 'Billable') : (t('legal.nonBillable') || 'Non-billable')}
                        </span>
                        {entry.invoiced && (
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {t('legal.invoiced') || 'Invoiced'}
                          </span>
                        )}
                      </div>
                      
                      <h3 className="text-sm font-medium text-gray-900 mb-2">
                        {entry.description}
                      </h3>
                      
                      <div className="space-y-1 text-sm text-gray-600">
                        <p className="flex items-center">
                          <Users className="h-3 w-3 mr-1" />
                          {entry.client.name}
                          {entry.client.company && ` (${entry.client.company})`}
                        </p>
                        {entry.incorporation && (
                          <p className="flex items-center">
                            <Building className="h-3 w-3 mr-1" />
                            {entry.incorporation.companyName}
                          </p>
                        )}
                        <p className="flex items-center">
                          <Calendar className="h-3 w-3 mr-1" />
                          {formatDate(entry.date)} | {entry.lawyer.name}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right space-y-2 ml-4">
                    <div className="text-lg font-bold text-gray-900">
                      {formatHours(entry.hours)}
                    </div>
                    <div className="text-sm text-gray-500">
                      {formatCurrency(entry.hourlyRate)}/hr
                    </div>
                    <div className="text-sm font-medium text-gray-900">
                      {formatCurrency(entry.total)}
                    </div>
                    <div className="flex items-center space-x-2">
                      <button className="p-1 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors">
                        <Edit className="h-4 w-4" />
                      </button>
                      <button className="p-1 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
} 