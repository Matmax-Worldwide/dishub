'use client';

import React, { useState } from 'react';
import { useI18n } from '@/hooks/useI18n';
import { 
  Settings, 
  Building, 
  DollarSign, 
  Globe,
  Save,
  Check,
  Bell,
  Shield
} from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

// TypeScript interfaces
interface LegalSettings {
  general: {
    firmName: string;
    firmAddress: string;
    defaultCurrency: string;
    defaultTimezone: string;
    defaultLanguage: string;
    businessHours: {
      start: string;
      end: string;
      days: string[];
    };
  };
  billing: {
    defaultHourlyRate: number;
    taxRate: number;
    invoicePrefix: string;
    paymentTerms: number;
    lateFeePercentage: number;
    acceptedPaymentMethods: string[];
  };
  notifications: {
    emailNotifications: boolean;
    smsNotifications: boolean;
    caseUpdateAlerts: boolean;
    paymentReminders: boolean;
    overdueNotifications: boolean;
    appointmentReminders: boolean;
  };
  compliance: {
    dataRetentionPeriod: number;
    requireClientConsent: boolean;
    enableAuditLog: boolean;
    twoFactorAuth: boolean;
    passwordPolicy: {
      minLength: number;
      requireSpecialChars: boolean;
      requireNumbers: boolean;
      requireUppercase: boolean;
    };
  };
}

const mockSettings: LegalSettings = {
  general: {
    firmName: 'Rodriguez & Associates Law Firm',
    firmAddress: '123 Legal Street, City, State 12345',
    defaultCurrency: 'USD',
    defaultTimezone: 'America/New_York',
    defaultLanguage: 'en',
    businessHours: {
      start: '09:00',
      end: '18:00',
      days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
    }
  },
  billing: {
    defaultHourlyRate: 250,
    taxRate: 10,
    invoicePrefix: 'INV',
    paymentTerms: 15,
    lateFeePercentage: 5,
    acceptedPaymentMethods: ['bank_transfer', 'credit_card', 'check']
  },
  notifications: {
    emailNotifications: true,
    smsNotifications: false,
    caseUpdateAlerts: true,
    paymentReminders: true,
    overdueNotifications: true,
    appointmentReminders: true
  },
  compliance: {
    dataRetentionPeriod: 7,
    requireClientConsent: true,
    enableAuditLog: true,
    twoFactorAuth: false,
    passwordPolicy: {
      minLength: 8,
      requireSpecialChars: true,
      requireNumbers: true,
      requireUppercase: true
    }
  }
};

export default function SettingsPage() {
  const { t, locale } = useI18n();
  const params = useParams();
  const tenantSlug = params.tenantSlug as string;
  
  const [settings, setSettings] = useState<LegalSettings>(mockSettings);
  const [activeTab, setActiveTab] = useState('general');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const updateSettings = (section: keyof LegalSettings, field: string, value: string | number | boolean) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // TODO: Integrate with GraphQL mutation
      console.log('Saving settings:', settings);
      
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error('Error saving settings:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const tabs = [
    { id: 'general', name: t('legal.generalSettings') || 'General', icon: Settings },
    { id: 'billing', name: t('legal.billingSettings') || 'Billing', icon: DollarSign },
    { id: 'notifications', name: t('legal.notificationSettings') || 'Notifications', icon: Bell },
    { id: 'compliance', name: t('legal.complianceSettings') || 'Compliance', icon: Shield }
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {t('legal.settings') || 'Legal Settings'}
          </h1>
          <p className="text-gray-600 mt-1">
            {t('legal.settingsSubtitle') || 'Configure your legal practice settings and preferences'}
          </p>
        </div>
        <div className="flex space-x-3">
          <Link
            href={`/${locale}/${tenantSlug}/legal/settings/jurisdictions`}
            className="bg-white text-gray-700 border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors flex items-center"
          >
            <Globe className="h-4 w-4 mr-2" />
            {t('legal.jurisdictions') || 'Jurisdictions'}
          </Link>
          <Link
            href={`/${locale}/${tenantSlug}/legal/settings/company-types`}
            className="bg-white text-gray-700 border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors flex items-center"
          >
            <Building className="h-4 w-4 mr-2" />
            {t('legal.companyTypes') || 'Company Types'}
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-4 w-4 mr-2" />
                  {tab.name}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {/* General Settings */}
          {activeTab === 'general' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  {t('legal.firmInformation') || 'Firm Information'}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('legal.firmName') || 'Firm Name'}
                    </label>
                    <input
                      type="text"
                      value={settings.general.firmName}
                      onChange={(e) => updateSettings('general', 'firmName', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('legal.firmAddress') || 'Firm Address'}
                    </label>
                    <textarea
                      value={settings.general.firmAddress}
                      onChange={(e) => updateSettings('general', 'firmAddress', e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  {t('legal.defaultSettings') || 'Default Settings'}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('legal.defaultCurrency') || 'Default Currency'}
                    </label>
                    <select
                      value={settings.general.defaultCurrency}
                      onChange={(e) => updateSettings('general', 'defaultCurrency', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="USD">USD - US Dollar</option>
                      <option value="EUR">EUR - Euro</option>
                      <option value="GBP">GBP - British Pound</option>
                      <option value="CAD">CAD - Canadian Dollar</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('legal.defaultTimezone') || 'Default Timezone'}
                    </label>
                    <select
                      value={settings.general.defaultTimezone}
                      onChange={(e) => updateSettings('general', 'defaultTimezone', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="America/New_York">Eastern Time</option>
                      <option value="America/Chicago">Central Time</option>
                      <option value="America/Denver">Mountain Time</option>
                      <option value="America/Los_Angeles">Pacific Time</option>
                      <option value="Europe/London">London</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('legal.defaultLanguage') || 'Default Language'}
                    </label>
                    <select
                      value={settings.general.defaultLanguage}
                      onChange={(e) => updateSettings('general', 'defaultLanguage', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="en">English</option>
                      <option value="es">Español</option>
                      <option value="de">Deutsch</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Billing Settings */}
          {activeTab === 'billing' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  {t('legal.billingConfiguration') || 'Billing Configuration'}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('legal.defaultHourlyRate') || 'Default Hourly Rate'}
                    </label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        type="number"
                        value={settings.billing.defaultHourlyRate}
                        onChange={(e) => updateSettings('billing', 'defaultHourlyRate', Number(e.target.value))}
                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('legal.taxRate') || 'Tax Rate (%)'}
                    </label>
                    <input
                      type="number"
                      value={settings.billing.taxRate}
                      onChange={(e) => updateSettings('billing', 'taxRate', Number(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('legal.invoicePrefix') || 'Invoice Prefix'}
                    </label>
                    <input
                      type="text"
                      value={settings.billing.invoicePrefix}
                      onChange={(e) => updateSettings('billing', 'invoicePrefix', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('legal.paymentTerms') || 'Payment Terms (days)'}
                    </label>
                    <input
                      type="number"
                      value={settings.billing.paymentTerms}
                      onChange={(e) => updateSettings('billing', 'paymentTerms', Number(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Notifications Settings */}
          {activeTab === 'notifications' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  {t('legal.notificationPreferences') || 'Notification Preferences'}
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {t('legal.emailNotifications') || 'Email Notifications'}
                      </p>
                      <p className="text-sm text-gray-500">
                        {t('legal.emailNotificationsDesc') || 'Receive notifications via email'}
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.notifications.emailNotifications}
                      onChange={(e) => updateSettings('notifications', 'emailNotifications', e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {t('legal.caseUpdateAlerts') || 'Case Update Alerts'}
                      </p>
                      <p className="text-sm text-gray-500">
                        {t('legal.caseUpdateAlertsDesc') || 'Get notified when cases are updated'}
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.notifications.caseUpdateAlerts}
                      onChange={(e) => updateSettings('notifications', 'caseUpdateAlerts', e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {t('legal.paymentReminders') || 'Payment Reminders'}
                      </p>
                      <p className="text-sm text-gray-500">
                        {t('legal.paymentRemindersDesc') || 'Send reminders for upcoming payments'}
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.notifications.paymentReminders}
                      onChange={(e) => updateSettings('notifications', 'paymentReminders', e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Compliance Settings */}
          {activeTab === 'compliance' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  {t('legal.dataRetention') || 'Data Retention & Security'}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('legal.dataRetentionPeriod') || 'Data Retention Period (years)'}
                    </label>
                    <input
                      type="number"
                      value={settings.compliance.dataRetentionPeriod}
                      onChange={(e) => updateSettings('compliance', 'dataRetentionPeriod', Number(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <div className="mt-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {t('legal.requireClientConsent') || 'Require Client Consent'}
                      </p>
                      <p className="text-sm text-gray-500">
                        {t('legal.requireClientConsentDesc') || 'Require explicit consent for data processing'}
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.compliance.requireClientConsent}
                      onChange={(e) => updateSettings('compliance', 'requireClientConsent', e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {t('legal.enableAuditLog') || 'Enable Audit Log'}
                      </p>
                      <p className="text-sm text-gray-500">
                        {t('legal.enableAuditLogDesc') || 'Track all system activities and changes'}
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.compliance.enableAuditLog}
                      onChange={(e) => updateSettings('compliance', 'enableAuditLog', e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Save Button */}
        <div className="border-t border-gray-200 px-6 py-4">
          <div className="flex justify-between items-center">
            {saveSuccess && (
              <div className="flex items-center text-green-600">
                <Check className="h-4 w-4 mr-2" />
                <span className="text-sm">{t('legal.settingsSaved') || 'Settings saved successfully'}</span>
              </div>
            )}
            <div className="ml-auto">
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center"
              >
                {isSaving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    {t('legal.saving') || 'Saving...'}
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    {t('legal.saveSettings') || 'Save Settings'}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 