'use client';

import { useState } from 'react';
import { 
  UserIcon, 
  BellIcon, 
  ShieldIcon, 
  GlobeIcon, 
  SaveIcon
} from 'lucide-react';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('account');
  const [formData, setFormData] = useState({
    // Account settings
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    phone: '+1 (555) 123-4567',
    
    // Preferences settings
    language: 'en',
    timezone: 'America/New_York',
    dateFormat: 'MM/DD/YYYY',
    timeFormat: '12h',
    
    // Notification settings
    emailNotifications: true,
    smsNotifications: false,
    assignmentNotifications: true,
    paymentNotifications: true,
    systemNotifications: true,
    
    // Security settings
    twoFactorEnabled: false,
    lastPasswordChange: '2023-05-15',
  });
  
  const [saveStatus, setSaveStatus] = useState<{
    message: string;
    type: 'success' | 'error' | null;
  }>({ message: '', type: null });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    const newValue = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
    
    setFormData({
      ...formData,
      [name]: newValue,
    });
  };

  const handleSave = () => {
    // Simulate API call
    setSaveStatus({ message: 'Saving...', type: null });
    
    setTimeout(() => {
      setSaveStatus({ message: 'Settings saved successfully!', type: 'success' });
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSaveStatus({ message: '', type: null });
      }, 3000);
    }, 1000);
  };

  const tabs = [
    { id: 'account', label: 'Account', icon: UserIcon },
    { id: 'preferences', label: 'Preferences', icon: GlobeIcon },
    { id: 'notifications', label: 'Notifications', icon: BellIcon },
    { id: 'security', label: 'Security', icon: ShieldIcon },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-gray-900">Settings</h1>
      
      {saveStatus.message && (
        <div 
          className={`p-4 rounded-md ${
            saveStatus.type === 'success' ? 'bg-green-50 text-green-800' : 
            saveStatus.type === 'error' ? 'bg-red-50 text-red-800' : 
            'bg-gray-50 text-gray-800'
          }`}
        >
          {saveStatus.message}
        </div>
      )}
      
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-6 py-4 text-sm font-medium flex items-center whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-b-2 border-indigo-500 text-indigo-600'
                    : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="h-4 w-4 mr-2" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
        
        <div className="p-6">
          {activeTab === 'account' && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900">Account Information</h3>
              <p className="mt-1 text-sm text-gray-500">
                Update your personal information and contact details.
              </p>
              
              <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">First Name</label>
                  <input
                    type="text"
                    name="firstName"
                    id="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>
                
                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">Last Name</label>
                  <input
                    type="text"
                    name="lastName"
                    id="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>
                
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email Address</label>
                  <input
                    type="email"
                    name="email"
                    id="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>
                
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700">Phone Number</label>
                  <input
                    type="tel"
                    name="phone"
                    id="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>
              </div>
            </div>
          )}
          
          {activeTab === 'preferences' && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900">Preferences</h3>
              <p className="mt-1 text-sm text-gray-500">
                Customize your experience with language, timezone, and formatting preferences.
              </p>
              
              <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="language" className="block text-sm font-medium text-gray-700">Language</label>
                  <select
                    id="language"
                    name="language"
                    value={formData.language}
                    onChange={handleInputChange}
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                  >
                    <option value="en">English</option>
                    <option value="es">Español</option>
                    <option value="fr">Français</option>
                    <option value="de">Deutsch</option>
                  </select>
                </div>
                
                <div>
                  <label htmlFor="timezone" className="block text-sm font-medium text-gray-700">Timezone</label>
                  <select
                    id="timezone"
                    name="timezone"
                    value={formData.timezone}
                    onChange={handleInputChange}
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                  >
                    <option value="America/New_York">Eastern Time (ET)</option>
                    <option value="America/Chicago">Central Time (CT)</option>
                    <option value="America/Denver">Mountain Time (MT)</option>
                    <option value="America/Los_Angeles">Pacific Time (PT)</option>
                    <option value="Europe/London">Greenwich Mean Time (GMT)</option>
                    <option value="Europe/Paris">Central European Time (CET)</option>
                  </select>
                </div>
                
                <div>
                  <label htmlFor="dateFormat" className="block text-sm font-medium text-gray-700">Date Format</label>
                  <select
                    id="dateFormat"
                    name="dateFormat"
                    value={formData.dateFormat}
                    onChange={handleInputChange}
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                  >
                    <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                    <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                    <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                  </select>
                </div>
                
                <div>
                  <label htmlFor="timeFormat" className="block text-sm font-medium text-gray-700">Time Format</label>
                  <select
                    id="timeFormat"
                    name="timeFormat"
                    value={formData.timeFormat}
                    onChange={handleInputChange}
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                  >
                    <option value="12h">12-hour (AM/PM)</option>
                    <option value="24h">24-hour</option>
                  </select>
                </div>
              </div>
            </div>
          )}
          
          {activeTab === 'notifications' && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900">Notification Settings</h3>
              <p className="mt-1 text-sm text-gray-500">
                Choose how and when you want to be notified.
              </p>
              
              <div className="space-y-4">
                <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Delivery Methods</h4>
                
                <div className="flex items-center justify-between py-3 border-b border-gray-200">
                  <div>
                    <p className="text-sm font-medium text-gray-900">Email Notifications</p>
                    <p className="text-sm text-gray-500">Receive notifications via email</p>
                  </div>
                  <div className="ml-4 flex-shrink-0">
                    <input
                      type="checkbox"
                      name="emailNotifications"
                      id="emailNotifications"
                      checked={formData.emailNotifications}
                      onChange={handleInputChange}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                  </div>
                </div>
                
                <div className="flex items-center justify-between py-3 border-b border-gray-200">
                  <div>
                    <p className="text-sm font-medium text-gray-900">SMS Notifications</p>
                    <p className="text-sm text-gray-500">Receive notifications via text message</p>
                  </div>
                  <div className="ml-4 flex-shrink-0">
                    <input
                      type="checkbox"
                      name="smsNotifications"
                      id="smsNotifications"
                      checked={formData.smsNotifications}
                      onChange={handleInputChange}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                  </div>
                </div>
                
                <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider mt-6">Notification Types</h4>
                
                <div className="flex items-center justify-between py-3 border-b border-gray-200">
                  <div>
                    <p className="text-sm font-medium text-gray-900">Assignment Updates</p>
                    <p className="text-sm text-gray-500">New assignments and changes to existing ones</p>
                  </div>
                  <div className="ml-4 flex-shrink-0">
                    <input
                      type="checkbox"
                      name="assignmentNotifications"
                      id="assignmentNotifications"
                      checked={formData.assignmentNotifications}
                      onChange={handleInputChange}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                  </div>
                </div>
                
                <div className="flex items-center justify-between py-3 border-b border-gray-200">
                  <div>
                    <p className="text-sm font-medium text-gray-900">Payment Information</p>
                    <p className="text-sm text-gray-500">Payment confirmations and reminders</p>
                  </div>
                  <div className="ml-4 flex-shrink-0">
                    <input
                      type="checkbox"
                      name="paymentNotifications"
                      id="paymentNotifications"
                      checked={formData.paymentNotifications}
                      onChange={handleInputChange}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                  </div>
                </div>
                
                <div className="flex items-center justify-between py-3 border-b border-gray-200">
                  <div>
                    <p className="text-sm font-medium text-gray-900">System Announcements</p>
                    <p className="text-sm text-gray-500">Maintenance, updates, and important announcements</p>
                  </div>
                  <div className="ml-4 flex-shrink-0">
                    <input
                      type="checkbox"
                      name="systemNotifications"
                      id="systemNotifications"
                      checked={formData.systemNotifications}
                      onChange={handleInputChange}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {activeTab === 'security' && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900">Security Settings</h3>
              <p className="mt-1 text-sm text-gray-500">
                Manage your password and security settings to protect your account.
              </p>
              
              <div className="space-y-6">
                <div className="bg-gray-50 p-4 rounded-md">
                  <h4 className="text-sm font-medium text-gray-900">Password</h4>
                  <p className="mt-1 text-sm text-gray-500">
                    Last changed: {formData.lastPasswordChange}
                  </p>
                  <div className="mt-3">
                    <button 
                      type="button"
                      className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      Change Password
                    </button>
                  </div>
                </div>
                
                <div className="flex items-center justify-between py-4 border-b border-gray-200">
                  <div>
                    <p className="text-sm font-medium text-gray-900">Two-Factor Authentication</p>
                    <p className="text-sm text-gray-500">
                      Add an extra layer of security to your account
                    </p>
                  </div>
                  <div className="ml-4 flex-shrink-0">
                    <input
                      type="checkbox"
                      name="twoFactorEnabled"
                      id="twoFactorEnabled"
                      checked={formData.twoFactorEnabled}
                      onChange={handleInputChange}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                  </div>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-md">
                  <h4 className="text-sm font-medium text-gray-900">Active Sessions</h4>
                  <p className="mt-1 text-sm text-gray-500">
                    View and manage devices that are currently logged into your account.
                  </p>
                  <div className="mt-3">
                    <button 
                      type="button"
                      className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      View Active Sessions
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
        
        <div className="px-6 py-3 bg-gray-50 flex justify-end">
          <button
            type="button"
            onClick={handleSave}
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <SaveIcon className="h-4 w-4 mr-2" />
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
} 