'use client';

import React, { useState, useMemo } from 'react';
import { useI18n } from '@/hooks/useI18n';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { 
  Users, 
  Search,
  Filter,
  Plus,
  Eye,
  Edit,
  ArrowUpDown,
  Mail,
  Phone,
  Building,
  MapPin
} from 'lucide-react';

// Types for GraphQL readiness
interface Client {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  company?: string;
  position?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  incorporationsCount: number;
  totalRevenue: number;
  status: 'active' | 'inactive';
}

// Mock data - Replace with GraphQL query
const mockClients: Client[] = [
  {
    id: 'c1',
    firstName: 'María',
    lastName: 'García',
    email: 'maria@techstart.com',
    phone: '+1-555-0123',
    company: 'TechStart LLC',
    position: 'CEO',
    address: '123 Tech Street',
    city: 'San Francisco',
    state: 'CA',
    country: 'United States',
    postalCode: '94105',
    notes: 'Startup founder, tech industry',
    createdAt: '2024-01-01T10:00:00Z',
    updatedAt: '2024-01-10T15:30:00Z',
    incorporationsCount: 2,
    totalRevenue: 15000,
    status: 'active'
  },
  {
    id: 'c2',
    firstName: 'Pedro',
    lastName: 'Martínez',
    email: 'pedro@globaltrading.com',
    phone: '+44-20-7946-0958',
    company: 'Global Trading Ltd',
    position: 'Managing Director',
    address: '456 Business Ave',
    city: 'London',
    state: 'England',
    country: 'United Kingdom',
    postalCode: 'SW1A 1AA',
    notes: 'International trading business',
    createdAt: '2024-01-02T10:00:00Z',
    updatedAt: '2024-01-11T14:20:00Z',
    incorporationsCount: 1,
    totalRevenue: 8500,
    status: 'active'
  },
  {
    id: 'c3',
    firstName: 'Tech',
    lastName: 'Solutions Inc.',
    email: 'info@techsolutions.com',
    phone: '+65-6123-4567',
    company: 'Tech Solutions Inc.',
    position: 'Corporate Entity',
    address: '789 Innovation Drive',
    city: 'Singapore',
    state: 'Singapore',
    country: 'Singapore',
    postalCode: '018956',
    notes: 'Technology consulting firm',
    createdAt: '2024-01-03T10:00:00Z',
    updatedAt: '2024-01-12T16:45:00Z',
    incorporationsCount: 3,
    totalRevenue: 25000,
    status: 'active'
  },
  {
    id: 'c4',
    firstName: 'Ana',
    lastName: 'Rodriguez',
    email: 'ana@startup.com',
    phone: '+1-555-0456',
    company: 'Startup Ventures',
    position: 'Founder',
    address: '321 Venture Blvd',
    city: 'Austin',
    state: 'TX',
    country: 'United States',
    postalCode: '73301',
    notes: 'Serial entrepreneur',
    createdAt: '2024-01-04T10:00:00Z',
    updatedAt: '2024-01-13T12:15:00Z',
    incorporationsCount: 0,
    totalRevenue: 0,
    status: 'inactive'
  }
];

export default function ClientsPage() {
  const { t, locale } = useI18n();
  const params = useParams();
  const tenantSlug = params.tenantSlug as string;

  // State for filtering and search
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortField, setSortField] = useState<keyof Client>('createdAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Filtered and sorted data
  const filteredClients = useMemo(() => {
    const filtered = mockClients.filter(client => {
      const fullName = `${client.firstName} ${client.lastName}`.toLowerCase();
      const matchesSearch = fullName.includes(searchTerm.toLowerCase()) ||
                           client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (client.company && client.company.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesStatus = statusFilter === 'all' || client.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });

    // Sort
    return filtered.sort((a, b) => {
      let aValue: string | number = a[sortField] as string | number;
      let bValue: string | number = b[sortField] as string | number;
      
      if (sortField === 'firstName' || sortField === 'lastName') {
        aValue = `${a.firstName} ${a.lastName}`;
        bValue = `${b.firstName} ${b.lastName}`;
      }
      
      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [searchTerm, statusFilter, sortField, sortDirection]);

  const handleSort = (field: keyof Client) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {t('legal.clients') || 'Clients'}
          </h1>
          <p className="text-gray-600 mt-1">
            {t('legal.clients.subtitle') || 'Manage your legal clients and their information'}
          </p>
        </div>
        <Link
          href={`/${locale}/${tenantSlug}/legal/clients/new`}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
        >
          <Plus className="h-4 w-4 mr-2" />
          {t('legal.newClient') || 'New Client'}
        </Link>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder={t('legal.clients.searchPlaceholder') || 'Search by name, email, or company...'}
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
            <option value="all">{t('legal.clients.allStatuses') || 'All Statuses'}</option>
            <option value="active">{t('legal.clients.active') || 'Active'}</option>
            <option value="inactive">{t('legal.clients.inactive') || 'Inactive'}</option>
          </select>

          <div className="flex items-center text-sm text-gray-600">
            <Filter className="h-4 w-4 mr-2" />
            {filteredClients.length} {t('legal.results') || 'results'}
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
                  onClick={() => handleSort('firstName')}
                >
                  <div className="flex items-center">
                    {t('legal.clients.name') || 'Name'}
                    <ArrowUpDown className="ml-1 h-3 w-3" />
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('legal.clients.contact') || 'Contact'}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('legal.clients.company') || 'Company'}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('legal.clients.location') || 'Location'}
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('incorporationsCount')}
                >
                  <div className="flex items-center">
                    {t('legal.clients.incorporations') || 'Incorporations'}
                    <ArrowUpDown className="ml-1 h-3 w-3" />
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('totalRevenue')}
                >
                  <div className="flex items-center">
                    {t('legal.clients.revenue') || 'Revenue'}
                    <ArrowUpDown className="ml-1 h-3 w-3" />
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('legal.status') || 'Status'}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('legal.actions') || 'Actions'}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredClients.map((client) => (
                <tr key={client.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <Users className="h-5 w-5 text-blue-600" />
                      </div>
                      <div className="ml-4">
                        <Link
                          href={`/${locale}/${tenantSlug}/legal/clients/${client.id}`}
                          className="text-sm font-medium text-blue-600 hover:text-blue-700"
                        >
                          {client.firstName} {client.lastName}
                        </Link>
                        {client.position && (
                          <div className="text-sm text-gray-500">
                            {client.position}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="space-y-1">
                      <div className="flex items-center text-sm text-gray-900">
                        <Mail className="h-4 w-4 text-gray-400 mr-2" />
                        <a href={`mailto:${client.email}`} className="hover:text-blue-600">
                          {client.email}
                        </a>
                      </div>
                      {client.phone && (
                        <div className="flex items-center text-sm text-gray-500">
                          <Phone className="h-4 w-4 text-gray-400 mr-2" />
                          <a href={`tel:${client.phone}`} className="hover:text-blue-600">
                            {client.phone}
                          </a>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {client.company && (
                      <div className="flex items-center">
                        <Building className="h-4 w-4 text-gray-400 mr-2" />
                        <div className="text-sm text-gray-900">
                          {client.company}
                        </div>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {client.city && client.country && (
                      <div className="flex items-center">
                        <MapPin className="h-4 w-4 text-gray-400 mr-2" />
                        <div className="text-sm text-gray-900">
                          {client.city}, {client.country}
                        </div>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="text-center">
                      <div className="text-lg font-semibold">
                        {client.incorporationsCount}
                      </div>
                      <div className="text-xs text-gray-500">
                        {t('legal.clients.cases') || 'cases'}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="text-center">
                      <div className="text-lg font-semibold">
                        {formatCurrency(client.totalRevenue)}
                      </div>
                      <div className="text-xs text-gray-500">
                        {t('legal.clients.total') || 'total'}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(client.status)}`}>
                      {t(`legal.clients.${client.status}`) || client.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <Link
                        href={`/${locale}/${tenantSlug}/legal/clients/${client.id}`}
                        className="text-blue-600 hover:text-blue-700"
                        title={t('legal.view') || 'View'}
                      >
                        <Eye className="h-4 w-4" />
                      </Link>
                      <Link
                        href={`/${locale}/${tenantSlug}/legal/clients/${client.id}/edit`}
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
        
        {filteredClients.length === 0 && (
          <div className="text-center py-12">
            <Users className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              {t('legal.clients.noClients') || 'No clients found'}
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {t('legal.clients.noClientsDescription') || 'Get started by adding a new client.'}
            </p>
            <div className="mt-6">
              <Link
                href={`/${locale}/${tenantSlug}/legal/clients/new`}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="mr-2 h-4 w-4" />
                {t('legal.newClient') || 'New Client'}
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
              {mockClients.length}
            </div>
            <div className="text-sm text-gray-500">
              {t('legal.clients.totalClients') || 'Total Clients'}
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {mockClients.filter(c => c.status === 'active').length}
            </div>
            <div className="text-sm text-gray-500">
              {t('legal.clients.active') || 'Active'}
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {mockClients.reduce((sum, c) => sum + c.incorporationsCount, 0)}
            </div>
            <div className="text-sm text-gray-500">
              {t('legal.clients.totalCases') || 'Total Cases'}
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {formatCurrency(mockClients.reduce((sum, c) => sum + c.totalRevenue, 0))}
            </div>
            <div className="text-sm text-gray-500">
              {t('legal.clients.totalRevenue') || 'Total Revenue'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 