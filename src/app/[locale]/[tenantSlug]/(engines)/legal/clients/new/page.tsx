'use client';

import React, { useState } from 'react';
import { useI18n } from '@/hooks/useI18n';
import { 
  User, 
  Building, 
  Save, 
  X,
  AlertCircle,
  Check
} from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';

// TypeScript interfaces
interface ClientFormData {
  type: 'individual' | 'company';
  // Individual fields
  firstName: string;
  lastName: string;
  title?: string;
  // Company fields
  companyName: string;
  companyType: string;
  registrationNumber?: string;
  // Contact information
  email: string;
  phone: string;
  alternativePhone?: string;
  website?: string;
  // Address
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  // Additional information
  industry?: string;
  preferredLanguage: string;
  communicationPreferences: string[];
  notes?: string;
  // Legal information
  taxId?: string;
  jurisdiction?: string;
  incorporationDate?: string;
  // Contact persons (for companies)
  contactPersons: ContactPerson[];
}

interface ContactPerson {
  id: string;
  name: string;
  title: string;
  email: string;
  phone: string;
  isPrimary: boolean;
}

interface FormErrors {
  [key: string]: string;
}

const initialFormData: ClientFormData = {
  type: 'individual',
  firstName: '',
  lastName: '',
  title: '',
  companyName: '',
  companyType: '',
  registrationNumber: '',
  email: '',
  phone: '',
  alternativePhone: '',
  website: '',
  address: {
    street: '',
    city: '',
    state: '',
    zipCode: '',
    country: ''
  },
  industry: '',
  preferredLanguage: 'en',
  communicationPreferences: [],
  notes: '',
  taxId: '',
  jurisdiction: '',
  incorporationDate: '',
  contactPersons: []
};

export default function NewClientPage() {
  const { t, locale } = useI18n();
  const params = useParams();
  const router = useRouter();
  const tenantSlug = params.tenantSlug as string;
  
  const [formData, setFormData] = useState<ClientFormData>(initialFormData);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

  const updateFormData = (field: string, value: string | number | boolean | ContactPerson[]) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    // Clear error when field is updated
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Basic validation
    if (formData.type === 'individual') {
      if (!formData.firstName.trim()) newErrors.firstName = t('legal.validation.firstNameRequired') || 'First name is required';
      if (!formData.lastName.trim()) newErrors.lastName = t('legal.validation.lastNameRequired') || 'Last name is required';
    } else {
      if (!formData.companyName.trim()) newErrors.companyName = t('legal.validation.companyNameRequired') || 'Company name is required';
      if (!formData.companyType.trim()) newErrors.companyType = t('legal.validation.companyTypeRequired') || 'Company type is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = t('legal.validation.emailRequired') || 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = t('legal.validation.emailInvalid') || 'Email is invalid';
    }

    if (!formData.phone.trim()) newErrors.phone = t('legal.validation.phoneRequired') || 'Phone is required';

    // Address validation
    if (!formData.address.street.trim()) newErrors['address.street'] = t('legal.validation.streetRequired') || 'Street address is required';
    if (!formData.address.city.trim()) newErrors['address.city'] = t('legal.validation.cityRequired') || 'City is required';
    if (!formData.address.country.trim()) newErrors['address.country'] = t('legal.validation.countryRequired') || 'Country is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // TODO: Integrate with GraphQL mutation
      console.log('Creating client:', formData);
      
      // Redirect to clients list or client detail
      router.push(`/${locale}/${tenantSlug}/legal/clients`);
    } catch (error) {
      console.error('Error creating client:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const steps = [
    { number: 1, title: t('legal.clientBasicInfo') || 'Basic Information' },
    { number: 2, title: t('legal.clientContactInfo') || 'Contact Information' },
    { number: 3, title: t('legal.clientAdditionalInfo') || 'Additional Information' }
  ];

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {t('legal.newClient') || 'New Client'}
            </h1>
            <p className="text-gray-600 mt-1">
              {t('legal.newClientSubtitle') || 'Create a new client profile for legal services'}
            </p>
          </div>
          <button
            onClick={() => router.back()}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Progress Steps */}
        <div className="mt-8">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.number} className="flex items-center">
                <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
                  currentStep >= step.number 
                    ? 'bg-blue-600 border-blue-600 text-white' 
                    : 'border-gray-300 text-gray-300'
                }`}>
                  {currentStep > step.number ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    step.number
                  )}
                </div>
                <span className={`ml-2 text-sm font-medium ${
                  currentStep >= step.number ? 'text-blue-600' : 'text-gray-500'
                }`}>
                  {step.title}
                </span>
                {index < steps.length - 1 && (
                  <div className={`w-full h-0.5 mx-4 ${
                    currentStep > step.number ? 'bg-blue-600' : 'bg-gray-300'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Step 1: Basic Information */}
        {currentStep === 1 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              {t('legal.clientBasicInfo') || 'Basic Information'}
            </h2>

            {/* Client Type */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                {t('legal.clientType') || 'Client Type'}
              </label>
              <div className="flex space-x-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="individual"
                    checked={formData.type === 'individual'}
                    onChange={(e) => updateFormData('type', e.target.value)}
                    className="mr-2"
                  />
                  <User className="h-4 w-4 mr-1" />
                  {t('legal.individual') || 'Individual'}
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="company"
                    checked={formData.type === 'company'}
                    onChange={(e) => updateFormData('type', e.target.value)}
                    className="mr-2"
                  />
                  <Building className="h-4 w-4 mr-1" />
                  {t('legal.company') || 'Company'}
                </label>
              </div>
            </div>

            {/* Individual Fields */}
            {formData.type === 'individual' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('legal.firstName') || 'First Name'} *
                  </label>
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => updateFormData('firstName', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.firstName ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder={t('legal.firstNamePlaceholder') || 'Enter first name'}
                  />
                  {errors.firstName && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <AlertCircle className="h-4 w-4 mr-1" />
                      {errors.firstName}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('legal.lastName') || 'Last Name'} *
                  </label>
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => updateFormData('lastName', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.lastName ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder={t('legal.lastNamePlaceholder') || 'Enter last name'}
                  />
                  {errors.lastName && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <AlertCircle className="h-4 w-4 mr-1" />
                      {errors.lastName}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('legal.title') || 'Title'}
                  </label>
                  <input
                    type="text"
                    value={formData.title || ''}
                    onChange={(e) => updateFormData('title', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder={t('legal.titlePlaceholder') || 'e.g., Mr., Ms., Dr.'}
                  />
                </div>
              </div>
            )}

            {/* Company Fields */}
            {formData.type === 'company' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('legal.companyName') || 'Company Name'} *
                  </label>
                  <input
                    type="text"
                    value={formData.companyName}
                    onChange={(e) => updateFormData('companyName', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.companyName ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder={t('legal.companyNamePlaceholder') || 'Enter company name'}
                  />
                  {errors.companyName && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <AlertCircle className="h-4 w-4 mr-1" />
                      {errors.companyName}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('legal.companyType') || 'Company Type'} *
                  </label>
                  <select
                    value={formData.companyType}
                    onChange={(e) => updateFormData('companyType', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.companyType ? 'border-red-500' : 'border-gray-300'
                    }`}
                  >
                    <option value="">{t('legal.selectCompanyType') || 'Select company type'}</option>
                    <option value="llc">{t('legal.companyTypes.llc') || 'LLC'}</option>
                    <option value="corporation">{t('legal.companyTypes.corporation') || 'Corporation'}</option>
                    <option value="partnership">{t('legal.companyTypes.partnership') || 'Partnership'}</option>
                    <option value="limited_company">{t('legal.companyTypes.limited_company') || 'Limited Company'}</option>
                  </select>
                  {errors.companyType && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <AlertCircle className="h-4 w-4 mr-1" />
                      {errors.companyType}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('legal.registrationNumber') || 'Registration Number'}
                  </label>
                  <input
                    type="text"
                    value={formData.registrationNumber || ''}
                    onChange={(e) => updateFormData('registrationNumber', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder={t('legal.registrationNumberPlaceholder') || 'Enter registration number'}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('legal.industry') || 'Industry'}
                  </label>
                  <input
                    type="text"
                    value={formData.industry || ''}
                    onChange={(e) => updateFormData('industry', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder={t('legal.industryPlaceholder') || 'e.g., Technology, Healthcare'}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between">
          <button
            type="button"
            onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
            disabled={currentStep === 1}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {t('legal.previous') || 'Previous'}
          </button>

          {currentStep < 3 ? (
            <button
              type="button"
              onClick={() => setCurrentStep(Math.min(3, currentStep + 1))}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              {t('legal.next') || 'Next'}
            </button>
          ) : (
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {t('legal.creating') || 'Creating...'}
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  {t('legal.createClient') || 'Create Client'}
                </>
              )}
            </button>
          )}
        </div>
      </form>
    </div>
  );
} 