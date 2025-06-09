'use client';

import React, { useState } from 'react';
import { useI18n } from '@/hooks/useI18n';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Scale, 
  Users, 
  Building,
  Briefcase,
  AlertTriangle,
  ArrowLeft,
  Save,
  X
} from 'lucide-react';

// Types for GraphQL readiness
interface Client {
  id: string;
  name: string;
  email: string;
  company?: string;
}

interface Jurisdiction {
  id: string;
  name: string;
  code: string;
  country: string;
  processingTime: number;
  baseFee: number;
}

interface CompanyType {
  id: string;
  name: string;
  description: string;
  jurisdictionId: string;
  minShareCapital?: number;
  maxShareholders?: number;
}

interface Lawyer {
  id: string;
  name: string;
  email: string;
  specializations: string[];
}

interface IncorporationFormData {
  companyName: string;
  clientId: string;
  jurisdictionId: string;
  companyTypeId: string;
  assignedLawyerId: string;
  priority: 'high' | 'medium' | 'low';
  description: string;
  expectedCompletion: string;
}

// Mock data - Replace with GraphQL queries
const mockClients: Client[] = [
  { id: 'c1', name: 'María García', email: 'maria@techstart.com', company: 'TechStart' },
  { id: 'c2', name: 'Pedro Martínez', email: 'pedro@globaltrading.com', company: 'Global Trading' },
  { id: 'c3', name: 'Tech Solutions Inc.', email: 'info@techsolutions.com' },
];

const mockJurisdictions: Jurisdiction[] = [
  { id: 'j1', name: 'Delaware, USA', code: 'USA_DE', country: 'United States', processingTime: 7, baseFee: 2500 },
  { id: 'j2', name: 'England, UK', code: 'UK_EN', country: 'United Kingdom', processingTime: 14, baseFee: 3000 },
  { id: 'j3', name: 'Singapore', code: 'SG', country: 'Singapore', processingTime: 10, baseFee: 2800 },
];

const mockCompanyTypes: CompanyType[] = [
  { id: 't1', name: 'Limited Liability Company (LLC)', description: 'Flexible business structure', jurisdictionId: 'j1', minShareCapital: 0 },
  { id: 't2', name: 'Private Limited Company', description: 'Standard corporate structure', jurisdictionId: 'j2', minShareCapital: 100 },
  { id: 't3', name: 'Private Limited Company', description: 'Singapore corporate structure', jurisdictionId: 'j3', minShareCapital: 1 },
];

const mockLawyers: Lawyer[] = [
  { id: 'l1', name: 'Dr. Carlos Rodríguez', email: 'carlos@firm.com', specializations: ['Corporate Law', 'International Business'] },
  { id: 'l2', name: 'Dra. Ana López', email: 'ana@firm.com', specializations: ['Corporate Law', 'Tax Law'] },
];

export default function NewIncorporationPage() {
  const { t, locale } = useI18n();
  const params = useParams();
  const router = useRouter();
  const tenantSlug = params.tenantSlug as string;

  const [formData, setFormData] = useState<IncorporationFormData>({
    companyName: '',
    clientId: '',
    jurisdictionId: '',
    companyTypeId: '',
    assignedLawyerId: '',
    priority: 'medium',
    description: '',
    expectedCompletion: ''
  });

  const [errors, setErrors] = useState<Partial<IncorporationFormData>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter company types based on selected jurisdiction
  const availableCompanyTypes = mockCompanyTypes.filter(
    type => !formData.jurisdictionId || type.jurisdictionId === formData.jurisdictionId
  );

  const handleInputChange = (field: keyof IncorporationFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined
      }));
    }

    // Reset company type if jurisdiction changes
    if (field === 'jurisdictionId' && formData.companyTypeId) {
      const isCompanyTypeValid = mockCompanyTypes.some(
        type => type.id === formData.companyTypeId && type.jurisdictionId === value
      );
      if (!isCompanyTypeValid) {
        setFormData(prev => ({
          ...prev,
          companyTypeId: ''
        }));
      }
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<IncorporationFormData> = {};

    if (!formData.companyName.trim()) {
      newErrors.companyName = t('legal.incorporationForm.companyNameRequired') || 'Company name is required';
    }

    if (!formData.clientId) {
      newErrors.clientId = t('legal.incorporationForm.clientRequired') || 'Client selection is required';
    }

    if (!formData.jurisdictionId) {
      newErrors.jurisdictionId = t('legal.incorporationForm.jurisdictionRequired') || 'Jurisdiction selection is required';
    }

    if (!formData.companyTypeId) {
      newErrors.companyTypeId = t('legal.incorporationForm.companyTypeRequired') || 'Company type selection is required';
    }

    if (!formData.assignedLawyerId) {
      newErrors.assignedLawyerId = t('legal.incorporationForm.lawyerRequired') || 'Lawyer assignment is required';
    }

    if (!formData.expectedCompletion) {
      newErrors.expectedCompletion = t('legal.incorporationForm.expectedCompletionRequired') || 'Expected completion date is required';
    } else {
      const selectedDate = new Date(formData.expectedCompletion);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (selectedDate < today) {
        newErrors.expectedCompletion = t('legal.incorporationForm.expectedCompletionFuture') || 'Expected completion date must be in the future';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // TODO: Replace with actual GraphQL mutation
      console.log('Creating incorporation:', formData);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Redirect to incorporations list or the new incorporation detail page
      router.push(`/${locale}/${tenantSlug}/legal/incorporations`);
    } catch (error) {
      console.error('Error creating incorporation:', error);
      // Handle error (show toast, etc.)
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedJurisdiction = mockJurisdictions.find(j => j.id === formData.jurisdictionId);
  const selectedClient = mockClients.find(c => c.id === formData.clientId);
  const selectedCompanyType = mockCompanyTypes.find(ct => ct.id === formData.companyTypeId);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center mb-4">
          <Link
            href={`/${locale}/${tenantSlug}/legal/incorporations`}
            className="flex items-center text-gray-600 hover:text-gray-800 mr-4"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            {t('common.back') || 'Back'}
          </Link>
          <div className="flex items-center">
            <Scale className="h-6 w-6 text-blue-600 mr-2" />
            <h1 className="text-2xl font-bold text-gray-900">
              {t('legal.incorporationForm.title') || 'New Incorporation'}
            </h1>
          </div>
        </div>
        <p className="text-gray-600">
          {t('legal.incorporationForm.subtitle') || 'Create new incorporation request'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Company Information */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Building className="h-5 w-5 mr-2" />
            {t('legal.incorporationForm.companyInformation') || 'Company Information'}
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('legal.incorporationForm.companyName') || 'Company Name'} *
              </label>
              <input
                type="text"
                value={formData.companyName}
                onChange={(e) => handleInputChange('companyName', e.target.value)}
                placeholder={t('legal.incorporationForm.companyNamePlaceholder') || 'Enter company name'}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.companyName ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.companyName && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <AlertTriangle className="h-4 w-4 mr-1" />
                  {errors.companyName}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('legal.incorporationForm.clientSelect') || 'Select Client'} *
              </label>
              <select
                value={formData.clientId}
                onChange={(e) => handleInputChange('clientId', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.clientId ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">
                  {t('legal.incorporationForm.clientSelectPlaceholder') || 'Select a client'}
                </option>
                {mockClients.map(client => (
                  <option key={client.id} value={client.id}>
                    {client.name} {client.company && `(${client.company})`}
                  </option>
                ))}
              </select>
              {errors.clientId && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <AlertTriangle className="h-4 w-4 mr-1" />
                  {errors.clientId}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Legal Structure */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Briefcase className="h-5 w-5 mr-2" />
            {t('legal.incorporationForm.legalStructure') || 'Legal Structure'}
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('legal.incorporationForm.jurisdiction') || 'Jurisdiction'} *
              </label>
              <select
                value={formData.jurisdictionId}
                onChange={(e) => handleInputChange('jurisdictionId', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.jurisdictionId ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">
                  {t('legal.incorporationForm.jurisdictionPlaceholder') || 'Select jurisdiction'}
                </option>
                {mockJurisdictions.map(jurisdiction => (
                  <option key={jurisdiction.id} value={jurisdiction.id}>
                    {jurisdiction.name} ({jurisdiction.code})
                  </option>
                ))}
              </select>
              {errors.jurisdictionId && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <AlertTriangle className="h-4 w-4 mr-1" />
                  {errors.jurisdictionId}
                </p>
              )}
              {selectedJurisdiction && (
                <div className="mt-2 text-sm text-gray-600">
                  <p>{t('legal.incorporationForm.processingTime') || 'Processing time'}: {selectedJurisdiction.processingTime} {t('legal.jurisdictions.days') || 'days'}</p>
                  <p>{t('legal.incorporationForm.baseFee') || 'Base fee'}: ${selectedJurisdiction.baseFee.toLocaleString()}</p>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('legal.incorporationForm.companyType') || 'Company Type'} *
              </label>
              <select
                value={formData.companyTypeId}
                onChange={(e) => handleInputChange('companyTypeId', e.target.value)}
                disabled={!formData.jurisdictionId}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed ${
                  errors.companyTypeId ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">
                  {t('legal.incorporationForm.companyTypePlaceholder') || 'Select company type'}
                </option>
                {availableCompanyTypes.map(type => (
                  <option key={type.id} value={type.id}>
                    {type.name}
                  </option>
                ))}
              </select>
              {errors.companyTypeId && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <AlertTriangle className="h-4 w-4 mr-1" />
                  {errors.companyTypeId}
                </p>
              )}
              {selectedCompanyType && (
                <div className="mt-2 text-sm text-gray-600">
                  <p>{selectedCompanyType.description}</p>
                  {selectedCompanyType.minShareCapital !== undefined && (
                    <p>{t('legal.incorporationForm.minShareCapital') || 'Min. share capital'}: ${selectedCompanyType.minShareCapital.toLocaleString()}</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Case Management */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Users className="h-5 w-5 mr-2" />
            {t('legal.incorporationForm.caseManagement') || 'Case Management'}
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('legal.incorporationForm.assignedLawyer') || 'Assigned Lawyer'} *
              </label>
              <select
                value={formData.assignedLawyerId}
                onChange={(e) => handleInputChange('assignedLawyerId', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.assignedLawyerId ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">
                  {t('legal.incorporationForm.assignedLawyerPlaceholder') || 'Select a lawyer'}
                </option>
                {mockLawyers.map(lawyer => (
                  <option key={lawyer.id} value={lawyer.id}>
                    {lawyer.name}
                  </option>
                ))}
              </select>
              {errors.assignedLawyerId && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <AlertTriangle className="h-4 w-4 mr-1" />
                  {errors.assignedLawyerId}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('legal.incorporationForm.priority') || 'Priority'} *
              </label>
              <select
                value={formData.priority}
                onChange={(e) => handleInputChange('priority', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="low">{t('legal.priority.low') || 'Low'}</option>
                <option value="medium">{t('legal.priority.medium') || 'Medium'}</option>
                <option value="high">{t('legal.priority.high') || 'High'}</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('legal.incorporationForm.expectedCompletion') || 'Expected Completion Date'} *
              </label>
              <input
                type="date"
                value={formData.expectedCompletion}
                onChange={(e) => handleInputChange('expectedCompletion', e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.expectedCompletion ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.expectedCompletion && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <AlertTriangle className="h-4 w-4 mr-1" />
                  {errors.expectedCompletion}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Additional Information */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            {t('legal.incorporationForm.additionalInformation') || 'Additional Information'}
          </h2>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('legal.incorporationForm.description') || 'Description'}
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder={t('legal.incorporationForm.descriptionPlaceholder') || 'Additional case description'}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Summary */}
        {selectedClient && selectedJurisdiction && selectedCompanyType && (
          <div className="bg-blue-50 rounded-lg border border-blue-200 p-6">
            <h2 className="text-lg font-semibold text-blue-900 mb-4">
              {t('legal.incorporationForm.summary') || 'Summary'}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p><strong>{t('legal.client') || 'Client'}:</strong> {selectedClient.name}</p>
                <p><strong>{t('legal.jurisdiction') || 'Jurisdiction'}:</strong> {selectedJurisdiction.name}</p>
              </div>
              <div>
                <p><strong>{t('legal.companyType') || 'Company Type'}:</strong> {selectedCompanyType.name}</p>
                <p><strong>{t('legal.incorporationForm.estimatedFee') || 'Estimated Fee'}:</strong> ${selectedJurisdiction.baseFee.toLocaleString()}</p>
              </div>
            </div>
          </div>
        )}

        {/* Form Actions */}
        <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
          <Link
            href={`/${locale}/${tenantSlug}/legal/incorporations`}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 flex items-center"
          >
            <X className="h-4 w-4 mr-2" />
            {t('legal.incorporationForm.cancel') || 'Cancel'}
          </Link>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            <Save className="h-4 w-4 mr-2" />
            {isSubmitting 
              ? (t('legal.incorporationForm.creating') || 'Creating...') 
              : (t('legal.incorporationForm.submit') || 'Create Incorporation')
            }
          </button>
        </div>
      </form>
    </div>
  );
} 