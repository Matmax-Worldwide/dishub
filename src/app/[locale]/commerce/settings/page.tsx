'use client';

import React, { useState } from 'react';
import { Save, Settings, Globe, DollarSign, Package, Bell, Shield } from 'lucide-react';

interface EcommerceSettings {
  general: {
    storeName: string;
    storeDescription: string;
    storeEmail: string;
    storePhone: string;
    storeAddress: string;
    timezone: string;
    dateFormat: string;
    timeFormat: string;
  };
  currency: {
    defaultCurrency: string;
    enableMultipleCurrencies: boolean;
    currencyPosition: 'before' | 'after';
    decimalPlaces: number;
    thousandSeparator: string;
    decimalSeparator: string;
  };
  inventory: {
    trackInventory: boolean;
    allowBackorders: boolean;
    lowStockThreshold: number;
    outOfStockVisibility: 'visible' | 'hidden';
    stockDisplayFormat: 'exact' | 'range' | 'none';
  };
  orders: {
    orderNumberPrefix: string;
    orderNumberSuffix: string;
    orderNumberLength: number;
    defaultOrderStatus: string;
    enableOrderNotes: boolean;
    requireCustomerAccount: boolean;
  };
  notifications: {
    emailNotifications: boolean;
    orderConfirmation: boolean;
    orderStatusUpdates: boolean;
    lowStockAlerts: boolean;
    newCustomerRegistration: boolean;
  };
  security: {
    enableTwoFactor: boolean;
    sessionTimeout: number;
    passwordMinLength: number;
    requireStrongPasswords: boolean;
    enableLoginAttemptLimiting: boolean;
  };
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<EcommerceSettings>({
    general: {
      storeName: 'My E-commerce Store',
      storeDescription: 'A modern e-commerce platform',
      storeEmail: 'store@example.com',
      storePhone: '+1 (555) 123-4567',
      storeAddress: '123 Commerce St, Business City, BC 12345',
      timezone: 'UTC',
      dateFormat: 'MM/DD/YYYY',
      timeFormat: '12h'
    },
    currency: {
      defaultCurrency: 'USD',
      enableMultipleCurrencies: true,
      currencyPosition: 'before',
      decimalPlaces: 2,
      thousandSeparator: ',',
      decimalSeparator: '.'
    },
    inventory: {
      trackInventory: true,
      allowBackorders: false,
      lowStockThreshold: 10,
      outOfStockVisibility: 'visible',
      stockDisplayFormat: 'exact'
    },
    orders: {
      orderNumberPrefix: 'ORD-',
      orderNumberSuffix: '',
      orderNumberLength: 6,
      defaultOrderStatus: 'PENDING',
      enableOrderNotes: true,
      requireCustomerAccount: false
    },
    notifications: {
      emailNotifications: true,
      orderConfirmation: true,
      orderStatusUpdates: true,
      lowStockAlerts: true,
      newCustomerRegistration: true
    },
    security: {
      enableTwoFactor: false,
      sessionTimeout: 30,
      passwordMinLength: 8,
      requireStrongPasswords: true,
      enableLoginAttemptLimiting: true
    }
  });

  const [activeTab, setActiveTab] = useState<'general' | 'currency' | 'inventory' | 'orders' | 'notifications' | 'security'>('general');
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    try {
      // TODO: Implement actual save functionality
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error('Error saving settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateSettings = (section: keyof EcommerceSettings, field: string, value: string | number | boolean) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  const tabs = [
    { id: 'general', label: 'General', icon: Settings },
    { id: 'currency', label: 'Currency', icon: DollarSign },
    { id: 'inventory', label: 'Inventory', icon: Package },
    { id: 'orders', label: 'Orders', icon: Globe },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Shield }
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">E-commerce Settings</h1>
          <p className="text-gray-600">Configure your e-commerce platform settings</p>
        </div>
        <button
          onClick={handleSave}
          disabled={loading}
          className={`flex items-center px-4 py-2 rounded-lg font-medium ${
            saved
              ? 'bg-green-600 text-white'
              : loading
              ? 'bg-gray-400 text-white cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          <Save className="h-4 w-4 mr-2" />
          {saved ? 'Saved!' : loading ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as 'general' | 'currency' | 'inventory' | 'orders' | 'notifications' | 'security')}
                  className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-4 w-4 mr-2" />
                  {tab.label}
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
              <h3 className="text-lg font-medium text-gray-900">General Settings</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Store Name
                  </label>
                  <input
                    type="text"
                    value={settings.general.storeName}
                    onChange={(e) => updateSettings('general', 'storeName', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Store Email
                  </label>
                  <input
                    type="email"
                    value={settings.general.storeEmail}
                    onChange={(e) => updateSettings('general', 'storeEmail', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Store Description
                  </label>
                  <textarea
                    value={settings.general.storeDescription}
                    onChange={(e) => updateSettings('general', 'storeDescription', e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Store Phone
                  </label>
                  <input
                    type="tel"
                    value={settings.general.storePhone}
                    onChange={(e) => updateSettings('general', 'storePhone', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Timezone
                  </label>
                  <select
                    value={settings.general.timezone}
                    onChange={(e) => updateSettings('general', 'timezone', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="UTC">UTC</option>
                    <option value="America/New_York">Eastern Time</option>
                    <option value="America/Chicago">Central Time</option>
                    <option value="America/Denver">Mountain Time</option>
                    <option value="America/Los_Angeles">Pacific Time</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Store Address
                  </label>
                  <textarea
                    value={settings.general.storeAddress}
                    onChange={(e) => updateSettings('general', 'storeAddress', e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Currency Settings */}
          {activeTab === 'currency' && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900">Currency Settings</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Default Currency
                  </label>
                  <select
                    value={settings.currency.defaultCurrency}
                    onChange={(e) => updateSettings('currency', 'defaultCurrency', e.target.value)}
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
                    Currency Position
                  </label>
                  <select
                    value={settings.currency.currencyPosition}
                    onChange={(e) => updateSettings('currency', 'currencyPosition', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="before">Before amount ($100)</option>
                    <option value="after">After amount (100$)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Decimal Places
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="4"
                    value={settings.currency.decimalPlaces}
                    onChange={(e) => updateSettings('currency', 'decimalPlaces', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={settings.currency.enableMultipleCurrencies}
                      onChange={(e) => updateSettings('currency', 'enableMultipleCurrencies', e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-gray-700">Enable Multiple Currencies</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Inventory Settings */}
          {activeTab === 'inventory' && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900">Inventory Settings</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={settings.inventory.trackInventory}
                      onChange={(e) => updateSettings('inventory', 'trackInventory', e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-gray-700">Track Inventory</span>
                  </label>
                </div>
                <div>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={settings.inventory.allowBackorders}
                      onChange={(e) => updateSettings('inventory', 'allowBackorders', e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-gray-700">Allow Backorders</span>
                  </label>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Low Stock Threshold
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={settings.inventory.lowStockThreshold}
                    onChange={(e) => updateSettings('inventory', 'lowStockThreshold', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Out of Stock Visibility
                  </label>
                  <select
                    value={settings.inventory.outOfStockVisibility}
                    onChange={(e) => updateSettings('inventory', 'outOfStockVisibility', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="visible">Visible</option>
                    <option value="hidden">Hidden</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Orders Settings */}
          {activeTab === 'orders' && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900">Order Settings</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Order Number Prefix
                  </label>
                  <input
                    type="text"
                    value={settings.orders.orderNumberPrefix}
                    onChange={(e) => updateSettings('orders', 'orderNumberPrefix', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Order Number Length
                  </label>
                  <input
                    type="number"
                    min="4"
                    max="12"
                    value={settings.orders.orderNumberLength}
                    onChange={(e) => updateSettings('orders', 'orderNumberLength', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Default Order Status
                  </label>
                  <select
                    value={settings.orders.defaultOrderStatus}
                    onChange={(e) => updateSettings('orders', 'defaultOrderStatus', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="PENDING">Pending</option>
                    <option value="PROCESSING">Processing</option>
                    <option value="SHIPPED">Shipped</option>
                  </select>
                </div>
                <div>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={settings.orders.enableOrderNotes}
                      onChange={(e) => updateSettings('orders', 'enableOrderNotes', e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-gray-700">Enable Order Notes</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Notifications Settings */}
          {activeTab === 'notifications' && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900">Notification Settings</h3>
              <div className="space-y-4">
                <div>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={settings.notifications.emailNotifications}
                      onChange={(e) => updateSettings('notifications', 'emailNotifications', e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-gray-700">Enable Email Notifications</span>
                  </label>
                </div>
                <div>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={settings.notifications.orderConfirmation}
                      onChange={(e) => updateSettings('notifications', 'orderConfirmation', e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-gray-700">Order Confirmation Emails</span>
                  </label>
                </div>
                <div>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={settings.notifications.orderStatusUpdates}
                      onChange={(e) => updateSettings('notifications', 'orderStatusUpdates', e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-gray-700">Order Status Update Emails</span>
                  </label>
                </div>
                <div>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={settings.notifications.lowStockAlerts}
                      onChange={(e) => updateSettings('notifications', 'lowStockAlerts', e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-gray-700">Low Stock Alerts</span>
                  </label>
                </div>
                <div>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={settings.notifications.newCustomerRegistration}
                      onChange={(e) => updateSettings('notifications', 'newCustomerRegistration', e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-gray-700">New Customer Registration Alerts</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Security Settings */}
          {activeTab === 'security' && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900">Security Settings</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={settings.security.enableTwoFactor}
                      onChange={(e) => updateSettings('security', 'enableTwoFactor', e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-gray-700">Enable Two-Factor Authentication</span>
                  </label>
                </div>
                <div>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={settings.security.requireStrongPasswords}
                      onChange={(e) => updateSettings('security', 'requireStrongPasswords', e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-gray-700">Require Strong Passwords</span>
                  </label>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Session Timeout (minutes)
                  </label>
                  <input
                    type="number"
                    min="5"
                    max="480"
                    value={settings.security.sessionTimeout}
                    onChange={(e) => updateSettings('security', 'sessionTimeout', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Minimum Password Length
                  </label>
                  <input
                    type="number"
                    min="6"
                    max="32"
                    value={settings.security.passwordMinLength}
                    onChange={(e) => updateSettings('security', 'passwordMinLength', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 