'use client';

import React, { useState } from 'react';
import { useI18n } from '@/hooks/useI18n';
import { 
  Globe, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Save, 
  X,
  Check,
  DollarSign,
  Clock,
} from 'lucide-react';

// TypeScript interfaces
interface Jurisdiction {
  id: string;
  name: string;
  code: string;
  country: string;
  countryCode: string;
  processingTimeDays: number;
  baseFee: number;
  currency: string;
  isActive: boolean;
  description?: string;
  requirements: string[];
  supportedCompanyTypes: string[];
  createdAt: string;
  updatedAt: string;
}

interface JurisdictionFormData {
  name: string;
  code: string;
  country: string;
  countryCode: string;
  processingTimeDays: number;
  baseFee: number;
  currency: string;
  isActive: boolean;
  description: string;
  requirements: string[];
  supportedCompanyTypes: string[];
}

// Mock data
const mockJurisdictions: Jurisdiction[] = [
  {
    id: 'JUR-001',
    name: 'Delaware',
    code: 'US-DE',
    country: 'United States',
    countryCode: 'US',
    processingTimeDays: 7,
    baseFee: 2500,
    currency: 'USD',
    isActive: true,
    description: 'Business-friendly state with well-established corporate law',
    requirements: ['Articles of Incorporation', 'Registered Agent', 'Initial Report'],
    supportedCompanyTypes: ['LLC', 'Corporation', 'Partnership'],
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  },
  {
    id: 'JUR-002',
    name: 'England & Wales',
    code: 'UK-EW',
    country: 'United Kingdom',
    countryCode: 'GB',
    processingTimeDays: 14,
    baseFee: 3200,
    currency: 'GBP',
    isActive: true,
    description: 'Established jurisdiction with strong legal framework',
    requirements: ['Memorandum of Association', 'Articles of Association', 'Form IN01'],
    supportedCompanyTypes: ['Limited Company', 'LLP', 'PLC'],
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  },
  {
    id: 'JUR-003',
    name: 'Singapore',
    code: 'SG',
    country: 'Singapore',
    countryCode: 'SG',
    processingTimeDays: 10,
    baseFee: 2800,
    currency: 'SGD',
    isActive: true,
    description: 'Strategic location for Asian business operations',
    requirements: ['Constitution', 'Form 45', 'Registered Office'],
    supportedCompanyTypes: ['Private Limited', 'Public Limited', 'Branch Office'],
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  }
];

const initialFormData: JurisdictionFormData = {
  name: '',
  code: '',
  country: '',
  countryCode: '',
  processingTimeDays: 7,
  baseFee: 0,
  currency: 'USD',
  isActive: true,
  description: '',
  requirements: [],
  supportedCompanyTypes: []
};

export default function JurisdictionsPage() {
  const { t, locale } = useI18n();
  
  const [jurisdictions, setJurisdictions] = useState<Jurisdiction[]>(mockJurisdictions);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingJurisdiction, setEditingJurisdiction] = useState<Jurisdiction | null>(null);
  const [formData, setFormData] = useState<JurisdictionFormData>(initialFormData);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filteredJurisdictions = jurisdictions.filter(jurisdiction =>
    jurisdiction.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    jurisdiction.country.toLowerCase().includes(searchTerm.toLowerCase()) ||
    jurisdiction.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  const handleEdit = (jurisdiction: Jurisdiction) => {
    setEditingJurisdiction(jurisdiction);
    setFormData({
      name: jurisdiction.name,
      code: jurisdiction.code,
      country: jurisdiction.country,
      countryCode: jurisdiction.countryCode,
      processingTimeDays: jurisdiction.processingTimeDays,
      baseFee: jurisdiction.baseFee,
      currency: jurisdiction.currency,
      isActive: jurisdiction.isActive,
      description: jurisdiction.description || '',
      requirements: jurisdiction.requirements,
      supportedCompanyTypes: jurisdiction.supportedCompanyTypes
    });
    setIsModalOpen(true);
  };

  const handleAdd = () => {
    setEditingJurisdiction(null);
    setFormData(initialFormData);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      if (editingJurisdiction) {
        // Update existing jurisdiction
        setJurisdictions(prev => prev.map(j => 
          j.id === editingJurisdiction.id 
            ? { ...j, ...formData, updatedAt: new Date().toISOString() }
            : j
        ));
      } else {
        // Add new jurisdiction
        const newJurisdiction: Jurisdiction = {
          id: `JUR-${Date.now()}`,
          ...formData,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        setJurisdictions(prev => [...prev, newJurisdiction]);
      }

      setIsModalOpen(false);
      setFormData(initialFormData);
      setEditingJurisdiction(null);
    } catch (error) {
      console.error('Error saving jurisdiction:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm(t('legal.confirmDelete') || 'Are you sure you want to delete this jurisdiction?')) {
      setJurisdictions(prev => prev.filter(j => j.id !== id));
    }
  };

  const toggleStatus = async (id: string) => {
    setJurisdictions(prev => prev.map(j => 
      j.id === id 
        ? { ...j, isActive: !j.isActive, updatedAt: new Date().toISOString() }
        : j
    ));
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {t('legal.jurisdictions') || 'Jurisdictions'}
          </h1>
          <p className="text-gray-600 mt-1">
            {t('legal.jurisdictionsSubtitle') || 'Manage available jurisdictions for company incorporations'}
          </p>
        </div>
        <button
          onClick={handleAdd}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
        >
          <Plus className="h-4 w-4 mr-2" />
          {t('legal.addJurisdiction') || 'Add Jurisdiction'}
        </button>
      </div>

      {/* Search */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder={t('legal.searchJurisdictions') || 'Search jurisdictions...'}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Jurisdictions Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            {t('legal.jurisdictionsList') || 'Jurisdictions List'}
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('legal.jurisdiction') || 'Jurisdiction'}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('legal.country') || 'Country'}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('legal.processingTime') || 'Processing Time'}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('legal.baseFee') || 'Base Fee'}
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
              {filteredJurisdictions.map((jurisdiction) => (
                <tr key={jurisdiction.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="p-2 bg-blue-100 rounded-lg mr-3">
                        <Globe className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {jurisdiction.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {jurisdiction.code}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{jurisdiction.country}</div>
                    <div className="text-sm text-gray-500">{jurisdiction.countryCode}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center text-sm text-gray-900">
                      <Clock className="h-4 w-4 mr-1 text-gray-400" />
                      {jurisdiction.processingTimeDays} {t('legal.days') || 'days'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center text-sm text-gray-900">
                      <DollarSign className="h-4 w-4 mr-1 text-gray-400" />
                      {formatCurrency(jurisdiction.baseFee, jurisdiction.currency)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => toggleStatus(jurisdiction.id)}
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        jurisdiction.isActive
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {jurisdiction.isActive ? (
                        <>
                          <Check className="h-3 w-3 mr-1" />
                          {t('legal.active') || 'Active'}
                        </>
                      ) : (
                        <>
                          <X className="h-3 w-3 mr-1" />
                          {t('legal.inactive') || 'Inactive'}
                        </>
                      )}
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleEdit(jurisdiction)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(jurisdiction.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingJurisdiction 
                  ? (t('legal.editJurisdiction') || 'Edit Jurisdiction')
                  : (t('legal.addJurisdiction') || 'Add Jurisdiction')
                }
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('legal.jurisdictionName') || 'Jurisdiction Name'} *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder={t('legal.jurisdictionNamePlaceholder') || 'e.g., Delaware'}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('legal.jurisdictionCode') || 'Code'} *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.code}
                    onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder={t('legal.jurisdictionCodePlaceholder') || 'e.g., US-DE'}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('legal.country') || 'Country'} *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.country}
                    onChange={(e) => setFormData(prev => ({ ...prev, country: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder={t('legal.countryPlaceholder') || 'e.g., United States'}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('legal.processingTimeDays') || 'Processing Time (days)'} *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={formData.processingTimeDays}
                    onChange={(e) => setFormData(prev => ({ ...prev, processingTimeDays: Number(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('legal.baseFee') || 'Base Fee'} *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    value={formData.baseFee}
                    onChange={(e) => setFormData(prev => ({ ...prev, baseFee: Number(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('legal.currency') || 'Currency'} *
                  </label>
                  <select
                    required
                    value={formData.currency}
                    onChange={(e) => setFormData(prev => ({ ...prev, currency: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                    <option value="GBP">GBP</option>
                    <option value="SGD">SGD</option>
                    <option value="CAD">CAD</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('legal.description') || 'Description'}
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder={t('legal.descriptionPlaceholder') || 'Brief description of the jurisdiction'}
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="isActive" className="ml-2 text-sm text-gray-700">
                  {t('legal.activeJurisdiction') || 'Active jurisdiction'}
                </label>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  {t('legal.cancel') || 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      {t('legal.saving') || 'Saving...'}
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      {t('legal.save') || 'Save'}
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