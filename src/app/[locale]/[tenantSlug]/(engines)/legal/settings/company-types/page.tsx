'use client';

import React, { useState } from 'react';
import { useI18n } from '@/hooks/useI18n';
import { 
  Building, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Save, 
  X,
  Check,
  DollarSign,
  Users,
  Globe
} from 'lucide-react';

// TypeScript interfaces
interface CompanyType {
  id: string;
  name: string;
  code: string;
  description: string;
  jurisdictionId: string;
  jurisdiction: {
    id: string;
    name: string;
    code: string;
  };
  minShareCapital: number;
  maxShareholders: number | null;
  currency: string;
  isActive: boolean;
  requirements: string[];
  features: string[];
  createdAt: string;
  updatedAt: string;
}

interface CompanyTypeFormData {
  name: string;
  code: string;
  description: string;
  jurisdictionId: string;
  minShareCapital: number;
  maxShareholders: number | null;
  currency: string;
  isActive: boolean;
  requirements: string[];
  features: string[];
}

// Mock data
const mockCompanyTypes: CompanyType[] = [
  {
    id: 'CT-001',
    name: 'Limited Liability Company',
    code: 'LLC',
    description: 'Flexible business structure with limited liability protection',
    jurisdictionId: 'JUR-001',
    jurisdiction: {
      id: 'JUR-001',
      name: 'Delaware',
      code: 'US-DE'
    },
    minShareCapital: 0,
    maxShareholders: null,
    currency: 'USD',
    isActive: true,
    requirements: ['Operating Agreement', 'Registered Agent', 'Annual Report'],
    features: ['Limited Liability', 'Tax Flexibility', 'Management Flexibility'],
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  },
  {
    id: 'CT-002',
    name: 'Private Limited Company',
    code: 'LTD',
    description: 'Private company limited by shares',
    jurisdictionId: 'JUR-002',
    jurisdiction: {
      id: 'JUR-002',
      name: 'England & Wales',
      code: 'UK-EW'
    },
    minShareCapital: 100,
    maxShareholders: 50,
    currency: 'GBP',
    isActive: true,
    requirements: ['Articles of Association', 'Memorandum of Association', 'Form IN01'],
    features: ['Limited Liability', 'Separate Legal Entity', 'Perpetual Succession'],
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  },
  {
    id: 'CT-003',
    name: 'Private Limited Company',
    code: 'PTE LTD',
    description: 'Singapore private limited company',
    jurisdictionId: 'JUR-003',
    jurisdiction: {
      id: 'JUR-003',
      name: 'Singapore',
      code: 'SG'
    },
    minShareCapital: 1,
    maxShareholders: 50,
    currency: 'SGD',
    isActive: true,
    requirements: ['Constitution', 'Form 45', 'Registered Office'],
    features: ['Limited Liability', 'Tax Benefits', 'International Recognition'],
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  }
];

const mockJurisdictions = [
  { id: 'JUR-001', name: 'Delaware', code: 'US-DE' },
  { id: 'JUR-002', name: 'England & Wales', code: 'UK-EW' },
  { id: 'JUR-003', name: 'Singapore', code: 'SG' }
];

const initialFormData: CompanyTypeFormData = {
  name: '',
  code: '',
  description: '',
  jurisdictionId: '',
  minShareCapital: 0,
  maxShareholders: null,
  currency: 'USD',
  isActive: true,
  requirements: [],
  features: []
};

export default function CompanyTypesPage() {
  const { t, locale } = useI18n();
  
  const [companyTypes, setCompanyTypes] = useState<CompanyType[]>(mockCompanyTypes);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCompanyType, setEditingCompanyType] = useState<CompanyType | null>(null);
  const [formData, setFormData] = useState<CompanyTypeFormData>(initialFormData);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filteredCompanyTypes = companyTypes.filter(companyType =>
    companyType.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    companyType.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    companyType.jurisdiction.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  const handleEdit = (companyType: CompanyType) => {
    setEditingCompanyType(companyType);
    setFormData({
      name: companyType.name,
      code: companyType.code,
      description: companyType.description,
      jurisdictionId: companyType.jurisdictionId,
      minShareCapital: companyType.minShareCapital,
      maxShareholders: companyType.maxShareholders,
      currency: companyType.currency,
      isActive: companyType.isActive,
      requirements: companyType.requirements,
      features: companyType.features
    });
    setIsModalOpen(true);
  };

  const handleAdd = () => {
    setEditingCompanyType(null);
    setFormData(initialFormData);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      const selectedJurisdiction = mockJurisdictions.find(j => j.id === formData.jurisdictionId);

      if (editingCompanyType) {
        // Update existing company type
        setCompanyTypes(prev => prev.map(ct => 
          ct.id === editingCompanyType.id 
            ? { 
                ...ct, 
                ...formData, 
                jurisdiction: selectedJurisdiction!,
                updatedAt: new Date().toISOString() 
              }
            : ct
        ));
      } else {
        // Add new company type
        const newCompanyType: CompanyType = {
          id: `CT-${Date.now()}`,
          ...formData,
          jurisdiction: selectedJurisdiction!,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        setCompanyTypes(prev => [...prev, newCompanyType]);
      }

      setIsModalOpen(false);
      setFormData(initialFormData);
      setEditingCompanyType(null);
    } catch (error) {
      console.error('Error saving company type:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm(t('legal.confirmDelete') || 'Are you sure you want to delete this company type?')) {
      setCompanyTypes(prev => prev.filter(ct => ct.id !== id));
    }
  };

  const toggleStatus = async (id: string) => {
    setCompanyTypes(prev => prev.map(ct => 
      ct.id === id 
        ? { ...ct, isActive: !ct.isActive, updatedAt: new Date().toISOString() }
        : ct
    ));
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {t('legal.companyTypes') || 'Company Types'}
          </h1>
          <p className="text-gray-600 mt-1">
            {t('legal.companyTypesSubtitle') || 'Manage available company types for incorporations'}
          </p>
        </div>
        <button
          onClick={handleAdd}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
        >
          <Plus className="h-4 w-4 mr-2" />
          {t('legal.addCompanyType') || 'Add Company Type'}
        </button>
      </div>

      {/* Search */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder={t('legal.searchCompanyTypes') || 'Search company types...'}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Company Types Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            {t('legal.companyTypesList') || 'Company Types List'}
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('legal.companyType') || 'Company Type'}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('legal.jurisdiction') || 'Jurisdiction'}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('legal.shareCapital') || 'Share Capital'}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('legal.shareholders') || 'Shareholders'}
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
              {filteredCompanyTypes.map((companyType) => (
                <tr key={companyType.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="p-2 bg-purple-100 rounded-lg mr-3">
                        <Building className="h-5 w-5 text-purple-600" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {companyType.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {companyType.code}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center text-sm text-gray-900">
                      <Globe className="h-4 w-4 mr-1 text-gray-400" />
                      {companyType.jurisdiction.name}
                    </div>
                    <div className="text-sm text-gray-500">{companyType.jurisdiction.code}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center text-sm text-gray-900">
                      <DollarSign className="h-4 w-4 mr-1 text-gray-400" />
                      {companyType.minShareCapital > 0 
                        ? formatCurrency(companyType.minShareCapital, companyType.currency)
                        : t('legal.noMinimum') || 'No minimum'
                      }
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center text-sm text-gray-900">
                      <Users className="h-4 w-4 mr-1 text-gray-400" />
                      {companyType.maxShareholders 
                        ? `${t('legal.max') || 'Max'} ${companyType.maxShareholders}`
                        : t('legal.unlimited') || 'Unlimited'
                      }
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => toggleStatus(companyType.id)}
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        companyType.isActive
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {companyType.isActive ? (
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
                        onClick={() => handleEdit(companyType)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(companyType.id)}
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
                {editingCompanyType 
                  ? (t('legal.editCompanyType') || 'Edit Company Type')
                  : (t('legal.addCompanyType') || 'Add Company Type')
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
                    {t('legal.companyTypeName') || 'Company Type Name'} *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder={t('legal.companyTypeNamePlaceholder') || 'e.g., Limited Liability Company'}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('legal.companyTypeCode') || 'Code'} *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.code}
                    onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder={t('legal.companyTypeCodePlaceholder') || 'e.g., LLC'}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('legal.jurisdiction') || 'Jurisdiction'} *
                  </label>
                  <select
                    required
                    value={formData.jurisdictionId}
                    onChange={(e) => setFormData(prev => ({ ...prev, jurisdictionId: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">{t('legal.selectJurisdiction') || 'Select jurisdiction'}</option>
                    {mockJurisdictions.map(jurisdiction => (
                      <option key={jurisdiction.id} value={jurisdiction.id}>
                        {jurisdiction.name} ({jurisdiction.code})
                      </option>
                    ))}
                  </select>
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

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('legal.minShareCapital') || 'Minimum Share Capital'}
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.minShareCapital}
                    onChange={(e) => setFormData(prev => ({ ...prev, minShareCapital: Number(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('legal.maxShareholders') || 'Maximum Shareholders'}
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.maxShareholders || ''}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      maxShareholders: e.target.value ? Number(e.target.value) : null 
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder={t('legal.unlimitedPlaceholder') || 'Leave empty for unlimited'}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('legal.description') || 'Description'} *
                </label>
                <textarea
                  required
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder={t('legal.descriptionPlaceholder') || 'Brief description of the company type'}
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
                  {t('legal.activeCompanyType') || 'Active company type'}
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