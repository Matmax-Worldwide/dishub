'use client';

import React, { useState } from 'react';
import { useI18n } from '@/hooks/useI18n';
import { 
  BarChart3, 
  Calendar, 
  Download, 
  FileText, 
  DollarSign, 
  Users, 
  Clock, 
  TrendingUp,
  Scale,
  Eye,
  Share
} from 'lucide-react';

// TypeScript interfaces
interface ReportConfig {
  id: string;
  name: string;
  description: string;
  type: 'financial' | 'operational' | 'client' | 'performance';
  lastGenerated?: string;
  parameters: ReportParameter[];
}

interface ReportParameter {
  name: string;
  type: 'date_range' | 'client_select' | 'lawyer_select' | 'jurisdiction_select';
  required: boolean;
  defaultValue?: string | number | boolean;
}

// Mock data
const mockReports: ReportConfig[] = [
  {
    id: 'revenue-analysis',
    name: 'Revenue Analysis Report',
    description: 'Comprehensive analysis of revenue trends, billing efficiency, and client profitability',
    type: 'financial',
    lastGenerated: '2024-01-10T15:30:00Z',
    parameters: [
      { name: 'date_range', type: 'date_range', required: true },
      { name: 'client_filter', type: 'client_select', required: false }
    ]
  },
  {
    id: 'incorporation-performance',
    name: 'Incorporation Performance Report',
    description: 'Analysis of incorporation case timelines, completion rates, and jurisdictional statistics',
    type: 'operational',
    lastGenerated: '2024-01-09T10:15:00Z',
    parameters: [
      { name: 'date_range', type: 'date_range', required: true },
      { name: 'jurisdiction_filter', type: 'jurisdiction_select', required: false }
    ]
  },
  {
    id: 'client-activity',
    name: 'Client Activity Report',
    description: 'Client engagement metrics, case volumes, and satisfaction analysis',
    type: 'client',
    lastGenerated: '2024-01-08T14:20:00Z',
    parameters: [
      { name: 'date_range', type: 'date_range', required: true },
      { name: 'client_filter', type: 'client_select', required: false }
    ]
  },
  {
    id: 'lawyer-productivity',
    name: 'Lawyer Productivity Report',
    description: 'Analysis of lawyer performance, billable hours, and case management efficiency',
    type: 'performance',
    lastGenerated: '2024-01-07T09:45:00Z',
    parameters: [
      { name: 'date_range', type: 'date_range', required: true },
      { name: 'lawyer_filter', type: 'lawyer_select', required: false }
    ]
  }
];

const mockStats = {
  totalReports: 24,
  reportsThisMonth: 8,
  scheduledReports: 6,
  autoReports: 4
};

const mockKPIs = {
  avgCaseCompletion: 14.2, // days
  clientSatisfaction: 4.7, // out of 5
  billableHoursUtilization: 78.5, // percentage
  revenueGrowth: 12.3, // percentage
  caseSuccessRate: 96.8, // percentage
  avgResponseTime: 2.4 // hours
};

export default function ReportsPage() {
  const { t, locale } = useI18n();
    
  const [reports] = useState<ReportConfig[]>(mockReports);
  const [filters, setFilters] = useState({
    type: '',
    search: '',
    dateRange: ''
  });

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat(locale, {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(dateString));
  };

  const getReportTypeColor = (type: string) => {
    switch (type) {
      case 'financial': return 'bg-green-100 text-green-800';
      case 'operational': return 'bg-blue-100 text-blue-800';
      case 'client': return 'bg-purple-100 text-purple-800';
      case 'performance': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getReportTypeIcon = (type: string) => {
    switch (type) {
      case 'financial': return <DollarSign className="h-5 w-5" />;
      case 'operational': return <Scale className="h-5 w-5" />;
      case 'client': return <Users className="h-5 w-5" />;
      case 'performance': return <BarChart3 className="h-5 w-5" />;
      default: return <FileText className="h-5 w-5" />;
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {t('legal.reports') || 'Reports & Analytics'}
          </h1>
          <p className="text-gray-600 mt-1">
            {t('legal.reportsSubtitle') || 'Generate insights and analytics for legal operations'}
          </p>
        </div>
        <div className="flex space-x-3">
          <button className="bg-white text-gray-700 border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors flex items-center">
            <Calendar className="h-4 w-4 mr-2" />
            {t('legal.scheduleReport') || 'Schedule Report'}
          </button>
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center">
            <FileText className="h-4 w-4 mr-2" />
            {t('legal.customReport') || 'Custom Report'}
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FileText className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">
                {t('legal.totalReports') || 'Total Reports'}
              </p>
              <p className="text-2xl font-bold text-gray-900">{mockStats.totalReports}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <Calendar className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">
                {t('legal.reportsThisMonth') || 'This Month'}
              </p>
              <p className="text-2xl font-bold text-gray-900">{mockStats.reportsThisMonth}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Clock className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">
                {t('legal.scheduledReports') || 'Scheduled'}
              </p>
              <p className="text-2xl font-bold text-gray-900">{mockStats.scheduledReports}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <BarChart3 className="h-6 w-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">
                {t('legal.autoReports') || 'Automated'}
              </p>
              <p className="text-2xl font-bold text-gray-900">{mockStats.autoReports}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Key Performance Indicators */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            {t('legal.keyPerformanceIndicators') || 'Key Performance Indicators'}
          </h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="p-3 bg-blue-100 rounded-lg w-fit mx-auto mb-3">
                <Clock className="h-8 w-8 text-blue-600" />
              </div>
              <p className="text-sm font-medium text-gray-600 mb-1">
                {t('legal.avgCaseCompletion') || 'Avg Case Completion'}
              </p>
              <p className="text-3xl font-bold text-gray-900">{mockKPIs.avgCaseCompletion}</p>
              <p className="text-sm text-gray-500">{t('legal.days') || 'days'}</p>
            </div>

            <div className="text-center">
              <div className="p-3 bg-green-100 rounded-lg w-fit mx-auto mb-3">
                <Users className="h-8 w-8 text-green-600" />
              </div>
              <p className="text-sm font-medium text-gray-600 mb-1">
                {t('legal.clientSatisfaction') || 'Client Satisfaction'}
              </p>
              <p className="text-3xl font-bold text-gray-900">{mockKPIs.clientSatisfaction}</p>
              <p className="text-sm text-gray-500">{t('legal.outOfFive') || 'out of 5'}</p>
            </div>

            <div className="text-center">
              <div className="p-3 bg-purple-100 rounded-lg w-fit mx-auto mb-3">
                <BarChart3 className="h-8 w-8 text-purple-600" />
              </div>
              <p className="text-sm font-medium text-gray-600 mb-1">
                {t('legal.billableUtilization') || 'Billable Utilization'}
              </p>
              <p className="text-3xl font-bold text-gray-900">{mockKPIs.billableHoursUtilization}%</p>
              <p className="text-sm text-gray-500">{t('legal.ofTotalHours') || 'of total hours'}</p>
            </div>

            <div className="text-center">
              <div className="p-3 bg-orange-100 rounded-lg w-fit mx-auto mb-3">
                <TrendingUp className="h-8 w-8 text-orange-600" />
              </div>
              <p className="text-sm font-medium text-gray-600 mb-1">
                {t('legal.revenueGrowth') || 'Revenue Growth'}
              </p>
              <p className="text-3xl font-bold text-gray-900">+{mockKPIs.revenueGrowth}%</p>
              <p className="text-sm text-gray-500">{t('legal.monthOverMonth') || 'month over month'}</p>
            </div>

            <div className="text-center">
              <div className="p-3 bg-red-100 rounded-lg w-fit mx-auto mb-3">
                <Scale className="h-8 w-8 text-red-600" />
              </div>
              <p className="text-sm font-medium text-gray-600 mb-1">
                {t('legal.caseSuccessRate') || 'Case Success Rate'}
              </p>
              <p className="text-3xl font-bold text-gray-900">{mockKPIs.caseSuccessRate}%</p>
              <p className="text-sm text-gray-500">{t('legal.successful') || 'successful'}</p>
            </div>

            <div className="text-center">
              <div className="p-3 bg-yellow-100 rounded-lg w-fit mx-auto mb-3">
                <Clock className="h-8 w-8 text-yellow-600" />
              </div>
              <p className="text-sm font-medium text-gray-600 mb-1">
                {t('legal.avgResponseTime') || 'Avg Response Time'}
              </p>
              <p className="text-3xl font-bold text-gray-900">{mockKPIs.avgResponseTime}</p>
              <p className="text-sm text-gray-500">{t('legal.hours') || 'hours'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Reports List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-900">
              {t('legal.availableReports') || 'Available Reports'}
            </h2>
            <div className="flex items-center space-x-4">
              <select
                value={filters.type}
                onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
                className="px-3 py-1 text-sm border border-gray-300 rounded-lg"
              >
                <option value="">{t('legal.allTypes') || 'All Types'}</option>
                <option value="financial">{t('legal.financial') || 'Financial'}</option>
                <option value="operational">{t('legal.operational') || 'Operational'}</option>
                <option value="client">{t('legal.client') || 'Client'}</option>
                <option value="performance">{t('legal.performance') || 'Performance'}</option>
              </select>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {reports.map((report) => (
              <div key={report.id} className="border border-gray-200 rounded-lg p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-start space-x-4">
                  <div className={`p-3 rounded-lg ${getReportTypeColor(report.type)}`}>
                    {getReportTypeIcon(report.type)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-2">
                      <h3 className="text-lg font-medium text-gray-900">
                        {report.name}
                      </h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getReportTypeColor(report.type)}`}>
                        {t(`legal.reportTypes.${report.type}`) || report.type}
                      </span>
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-4">
                      {report.description}
                    </p>
                    
                    {report.lastGenerated && (
                      <p className="text-xs text-gray-500 mb-4">
                        {t('legal.lastGenerated') || 'Last generated'}: {formatDate(report.lastGenerated)}
                      </p>
                    )}
                    
                    <div className="flex items-center space-x-2">
                      <button className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition-colors flex items-center">
                        <Eye className="h-3 w-3 mr-1" />
                        {t('legal.generate') || 'Generate'}
                      </button>
                      <button className="bg-white text-gray-700 border border-gray-300 px-3 py-1 rounded text-sm hover:bg-gray-50 transition-colors flex items-center">
                        <Download className="h-3 w-3 mr-1" />
                        {t('legal.download') || 'Download'}
                      </button>
                      <button className="bg-white text-gray-700 border border-gray-300 px-3 py-1 rounded text-sm hover:bg-gray-50 transition-colors flex items-center">
                        <Share className="h-3 w-3 mr-1" />
                        {t('legal.share') || 'Share'}
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