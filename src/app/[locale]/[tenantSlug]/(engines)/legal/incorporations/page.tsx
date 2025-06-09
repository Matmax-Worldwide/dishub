'use client';

import React, { useState, useMemo } from 'react';
import { useI18n } from '@/hooks/useI18n';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { 
  Scale, 
  Users, 
  Search,
  Filter,
  Plus,
  Eye,
  Edit,
  ArrowUpDown,
  Clock,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';

// Types for GraphQL readiness
interface Incorporation {
  id: string;
  incorporationNumber: string;
  companyName: string;
  client: {
    id: string;
    name: string;
    email: string;
  };
  jurisdiction: {
    id: string;
    name: string;
    code: string;
  };
  companyType: {
    id: string;
    name: string;
  };
  status: string;
  priority: string;
  expectedCompletion: string;
  assignedLawyer: {
    id: string;
    name: string;
  };
  createdAt: string;
  updatedAt: string;
}

// Mock data - Replace with GraphQL query
const mockIncorporations: Incorporation[] = [
  {
    id: '1',
    incorporationNumber: 'INC-2024-001',
    companyName: 'TechStart LLC',
    client: {
      id: 'c1',
      name: 'María García',
      email: 'maria@techstart.com'
    },
    jurisdiction: {
      id: 'j1',
      name: 'Delaware, USA',
      code: 'USA_DE'
    },
    companyType: {
      id: 't1',
      name: 'Limited Liability Company (LLC)'
    },
    status: 'government_filing',
    priority: 'high',
    expectedCompletion: '2024-01-15T10:00:00Z',
    assignedLawyer: {
      id: 'l1',
      name: 'Dr. Carlos Rodríguez'
    },
    createdAt: '2024-01-01T10:00:00Z',
    updatedAt: '2024-01-10T15:30:00Z'
  },
  {
    id: '2',
    incorporationNumber: 'INC-2024-002',
    companyName: 'Global Trading Ltd',
    client: {
      id: 'c2',
      name: 'Pedro Martínez',
      email: 'pedro@globaltrading.com'
    },
    jurisdiction: {
      id: 'j2',
      name: 'England, UK',
      code: 'UK_EN'
    },
    companyType: {
      id: 't2',
      name: 'Private Limited Company'
    },
    status: 'documentation_gathering',
    priority: 'medium',
    expectedCompletion: '2024-01-25T10:00:00Z',
    assignedLawyer: {
      id: 'l2',
      name: 'Dra. Ana López'
    },
    createdAt: '2024-01-02T10:00:00Z',
    updatedAt: '2024-01-11T14:20:00Z'
  },
  {
    id: '3',
    incorporationNumber: 'INC-2024-003',
    companyName: 'Innovation Holdings Pte Ltd',
    client: {
      id: 'c3',
      name: 'Tech Solutions Inc.',
      email: 'info@techsolutions.com'
    },
    jurisdiction: {
      id: 'j3',
      name: 'Singapore',
      code: 'SG'
    },
    companyType: {
      id: 't3',
      name: 'Private Limited Company'
    },
    status: 'completed',
    priority: 'low',
    expectedCompletion: '2024-01-20T14:30:00Z',
    assignedLawyer: {
      id: 'l1',
      name: 'Dr. Carlos Rodríguez'
    },
    createdAt: '2024-01-03T10:00:00Z',
    updatedAt: '2024-01-12T16:45:00Z'
  }
];

export default function IncorporationsPage() {
  const { t, locale } = useI18n();
  const params = useParams();
  const tenantSlug = params.tenantSlug as string;

  // State for filtering and search
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [sortField, setSortField] = useState<keyof Incorporation>('createdAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Filtered and sorted data
  const filteredIncorporations = useMemo(() => {
    const filtered = mockIncorporations.filter(incorporation => {
      const matchesSearch = incorporation.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           incorporation.incorporationNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           incorporation.client.name.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || incorporation.status === statusFilter;
      const matchesPriority = priorityFilter === 'all' || incorporation.priority === priorityFilter;
      
      return matchesSearch && matchesStatus && matchesPriority;
    });

    // Sort
    return filtered.sort((a, b) => {
      let aValue: string | number = a[sortField] as string | number;
      let bValue: string | number = b[sortField] as string | number;
      
      if (sortField === 'client') {
        aValue = a.client.name;
        bValue = b.client.name;
      } else if (sortField === 'assignedLawyer') {
        aValue = a.assignedLawyer.name;
        bValue = b.assignedLawyer.name;
      }
      
      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [searchTerm, statusFilter, priorityFilter, sortField, sortDirection]);

  const handleSort = (field: keyof Incorporation) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      case 'government_filing': case 'pending_approval': return <Clock className="h-4 w-4" />;
      case 'rejected': case 'on_hold': return <AlertTriangle className="h-4 w-4" />;
      default: return <Scale className="h-4 w-4" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat(locale, {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }).format(new Date(dateString));
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {t('legal.incorporations') || 'Incorporations'}
          </h1>
          <p className="text-gray-600 mt-1">
            {t('legal.incorporations.subtitle') || 'Manage company incorporation cases and track their progress'}
          </p>
        </div>
        <Link
          href={`/${locale}/${tenantSlug}/legal/incorporations/new`}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
        >
          <Plus className="h-4 w-4 mr-2" />
          {t('legal.newIncorporation') || 'New Incorporation'}
        </Link>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder={t('legal.searchPlaceholder') || 'Search by company name, ID, or client...'}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <select
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">{t('legal.allStatuses') || 'All Statuses'}</option>
            <option value="initiated">{t('legal.status.initiated') || 'Initiated'}</option>
            <option value="documentation_gathering">{t('legal.status.documentation_gathering') || 'Documentation Gathering'}</option>
            <option value="government_filing">{t('legal.status.government_filing') || 'Government Filing'}</option>
            <option value="pending_approval">{t('legal.status.pending_approval') || 'Pending Approval'}</option>
            <option value="completed">{t('legal.status.completed') || 'Completed'}</option>
          </select>

          <select
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
          >
            <option value="all">{t('legal.allPriorities') || 'All Priorities'}</option>
            <option value="high">{t('legal.priority.high') || 'High'}</option>
            <option value="medium">{t('legal.priority.medium') || 'Medium'}</option>
            <option value="low">{t('legal.priority.low') || 'Low'}</option>
          </select>

          <div className="flex items-center text-sm text-gray-600">
            <Filter className="h-4 w-4 mr-2" />
            {filteredIncorporations.length} {t('legal.results') || 'results'}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('incorporationNumber')}
                >
                  <div className="flex items-center">
                    {t('legal.incorporationNumber') || 'ID'}
                    <ArrowUpDown className="ml-1 h-3 w-3" />
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('companyName')}
                >
                  <div className="flex items-center">
                    {t('legal.companyName') || 'Company Name'}
                    <ArrowUpDown className="ml-1 h-3 w-3" />
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('client')}
                >
                  <div className="flex items-center">
                    {t('legal.client') || 'Client'}
                    <ArrowUpDown className="ml-1 h-3 w-3" />
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('legal.jurisdiction') || 'Jurisdiction'}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('legal.status') || 'Status'}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('legal.priority') || 'Priority'}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('legal.expectedCompletion') || 'Expected Completion'}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('legal.actions') || 'Actions'}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredIncorporations.map((incorporation) => (
                <tr key={incorporation.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Scale className="h-4 w-4 text-blue-500 mr-2" />
                      <Link
                        href={`/${locale}/${tenantSlug}/legal/incorporations/${incorporation.id}`}
                        className="text-sm font-medium text-blue-600 hover:text-blue-700"
                      >
                        {incorporation.incorporationNumber}
                      </Link>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {incorporation.companyName}
                    </div>
                    <div className="text-sm text-gray-500">
                      {incorporation.companyType.name}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Users className="h-4 w-4 text-gray-400 mr-2" />
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {incorporation.client.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {incorporation.client.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {incorporation.jurisdiction.name}
                    </div>
                    <div className="text-sm text-gray-500">
                      {incorporation.jurisdiction.code}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(incorporation.status)}`}>
                      {getStatusIcon(incorporation.status)}
                      <span className="ml-1">
                        {t(`legal.status.${incorporation.status}`) || incorporation.status}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(incorporation.priority)}`}>
                      {t(`legal.priority.${incorporation.priority}`) || incorporation.priority}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 text-gray-400 mr-1" />
                      {formatDate(incorporation.expectedCompletion)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <Link
                        href={`/${locale}/${tenantSlug}/legal/incorporations/${incorporation.id}`}
                        className="text-blue-600 hover:text-blue-700"
                        title={t('legal.view') || 'View'}
                      >
                        <Eye className="h-4 w-4" />
                      </Link>
                      <Link
                        href={`/${locale}/${tenantSlug}/legal/incorporations/${incorporation.id}/edit`}
                        className="text-gray-600 hover:text-gray-700"
                        title={t('legal.edit') || 'Edit'}
                      >
                        <Edit className="h-4 w-4" />
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredIncorporations.length === 0 && (
          <div className="text-center py-12">
            <Scale className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              {t('legal.noIncorporations') || 'No incorporations found'}
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {t('legal.noIncorporationsDescription') || 'Get started by creating a new incorporation.'}
            </p>
            <div className="mt-6">
              <Link
                href={`/${locale}/${tenantSlug}/legal/incorporations/new`}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="mr-2 h-4 w-4" />
                {t('legal.newIncorporation') || 'New Incorporation'}
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Statistics Footer */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">
              {mockIncorporations.length}
            </div>
            <div className="text-sm text-gray-500">
              {t('legal.totalIncorporations') || 'Total Incorporations'}
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {mockIncorporations.filter(i => i.status === 'completed').length}
            </div>
            <div className="text-sm text-gray-500">
              {t('legal.completed') || 'Completed'}
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">
              {mockIncorporations.filter(i => ['government_filing', 'pending_approval'].includes(i.status)).length}
            </div>
            <div className="text-sm text-gray-500">
              {t('legal.inProgress') || 'In Progress'}
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">
              {mockIncorporations.filter(i => i.priority === 'high').length}
            </div>
            <div className="text-sm text-gray-500">
              {t('legal.highPriority') || 'High Priority'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 