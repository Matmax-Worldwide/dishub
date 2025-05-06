'use client';

import { useState } from 'react';
import { 
  SaveIcon, 
  GlobeIcon, 
  PaletteIcon, 
  ShieldIcon, 
  MailIcon,
  Search,
  UsersIcon
} from 'lucide-react';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('general');
  const [saveStatus, setSaveStatus] = useState<null | 'saving' | 'saved'>(null);
  
  const saveSettings = () => {
    setSaveStatus('saving');
    // Simulate API call
    setTimeout(() => {
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus(null), 2000);
    }, 1000);
  };
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight">Site Settings</h1>
        <button 
          onClick={saveSettings}
          className="px-4 py-2 bg-[#01319c] text-white rounded-md flex items-center"
        >
          <SaveIcon className="h-5 w-5 mr-2" />
          {saveStatus === 'saving' ? 'Saving...' : saveStatus === 'saved' ? 'Saved!' : 'Save Changes'}
        </button>
      </div>
      
      <p className="text-gray-500">
        Configure global settings for your website.
      </p>
      
      <div className="flex flex-col md:flex-row gap-6">
        {/* Sidebar navigation */}
        <div className="w-full md:w-64 flex-shrink-0">
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <nav className="flex flex-col">
              <button 
                onClick={() => setActiveTab('general')} 
                className={`flex items-center space-x-3 px-4 py-3 text-left text-sm font-medium border-l-4 ${
                  activeTab === 'general' 
                    ? 'border-[#01319c] bg-blue-50 text-[#01319c]' 
                    : 'border-transparent hover:bg-gray-50'
                }`}
              >
                <GlobeIcon className="h-5 w-5" />
                <span>General</span>
              </button>
              
              <button 
                onClick={() => setActiveTab('appearance')} 
                className={`flex items-center space-x-3 px-4 py-3 text-left text-sm font-medium border-l-4 ${
                  activeTab === 'appearance' 
                    ? 'border-[#01319c] bg-blue-50 text-[#01319c]' 
                    : 'border-transparent hover:bg-gray-50'
                }`}
              >
                <PaletteIcon className="h-5 w-5" />
                <span>Appearance</span>
              </button>
              
              <button 
                onClick={() => setActiveTab('seo')} 
                className={`flex items-center space-x-3 px-4 py-3 text-left text-sm font-medium border-l-4 ${
                  activeTab === 'seo' 
                    ? 'border-[#01319c] bg-blue-50 text-[#01319c]' 
                    : 'border-transparent hover:bg-gray-50'
                }`}
              >
                <Search className="h-5 w-5" />
                <span>SEO</span>
              </button>
              
              <button 
                onClick={() => setActiveTab('email')} 
                className={`flex items-center space-x-3 px-4 py-3 text-left text-sm font-medium border-l-4 ${
                  activeTab === 'email' 
                    ? 'border-[#01319c] bg-blue-50 text-[#01319c]' 
                    : 'border-transparent hover:bg-gray-50'
                }`}
              >
                <MailIcon className="h-5 w-5" />
                <span>Email</span>
              </button>
              
              <button 
                onClick={() => setActiveTab('users')} 
                className={`flex items-center space-x-3 px-4 py-3 text-left text-sm font-medium border-l-4 ${
                  activeTab === 'users' 
                    ? 'border-[#01319c] bg-blue-50 text-[#01319c]' 
                    : 'border-transparent hover:bg-gray-50'
                }`}
              >
                <UsersIcon className="h-5 w-5" />
                <span>Users</span>
              </button>
              
              <button 
                onClick={() => setActiveTab('security')} 
                className={`flex items-center space-x-3 px-4 py-3 text-left text-sm font-medium border-l-4 ${
                  activeTab === 'security' 
                    ? 'border-[#01319c] bg-blue-50 text-[#01319c]' 
                    : 'border-transparent hover:bg-gray-50'
                }`}
              >
                <ShieldIcon className="h-5 w-5" />
                <span>Security</span>
              </button>
            </nav>
          </div>
        </div>
        
        {/* Content area */}
        <div className="flex-1">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            {activeTab === 'general' && (
              <div className="space-y-6">
                <h2 className="text-lg font-medium border-b pb-2">General Settings</h2>
                
                <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                  <div className="sm:col-span-4">
                    <label htmlFor="site-title" className="block text-sm font-medium text-gray-700">
                      Site Title
                    </label>
                    <div className="mt-1">
                      <input
                        type="text"
                        name="site-title"
                        id="site-title"
                        defaultValue="E-Voque"
                        className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      />
                    </div>
                  </div>

                  <div className="sm:col-span-4">
                    <label htmlFor="site-tagline" className="block text-sm font-medium text-gray-700">
                      Tagline
                    </label>
                    <div className="mt-1">
                      <input
                        type="text"
                        name="site-tagline"
                        id="site-tagline"
                        defaultValue="Your journey to wellness"
                        className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      />
                    </div>
                  </div>
                  
                  <div className="sm:col-span-6">
                    <label htmlFor="site-description" className="block text-sm font-medium text-gray-700">
                      Site Description
                    </label>
                    <div className="mt-1">
                      <textarea
                        id="site-description"
                        name="site-description"
                        rows={3}
                        defaultValue="E-Voque is a platform dedicated to holistic wellness and therapeutic solutions."
                        className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border border-gray-300 rounded-md"
                      />
                    </div>
                    <p className="mt-2 text-sm text-gray-500">
                      Brief description for your site. This will be used in search results.
                    </p>
                  </div>
                  
                  <div className="sm:col-span-4">
                    <label htmlFor="site-url" className="block text-sm font-medium text-gray-700">
                      Site URL
                    </label>
                    <div className="mt-1">
                      <input
                        type="url"
                        name="site-url"
                        id="site-url"
                        defaultValue="https://evoque.com"
                        className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      />
                    </div>
                  </div>
                  
                  <div className="sm:col-span-3">
                    <label htmlFor="timezone" className="block text-sm font-medium text-gray-700">
                      Timezone
                    </label>
                    <div className="mt-1">
                      <select
                        id="timezone"
                        name="timezone"
                        defaultValue="America/New_York"
                        className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      >
                        <option value="America/New_York">Eastern Time (US & Canada)</option>
                        <option value="America/Chicago">Central Time (US & Canada)</option>
                        <option value="America/Denver">Mountain Time (US & Canada)</option>
                        <option value="America/Los_Angeles">Pacific Time (US & Canada)</option>
                        <option value="Europe/London">London</option>
                        <option value="Europe/Paris">Paris</option>
                        <option value="Asia/Tokyo">Tokyo</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="sm:col-span-3">
                    <label htmlFor="date-format" className="block text-sm font-medium text-gray-700">
                      Date Format
                    </label>
                    <div className="mt-1">
                      <select
                        id="date-format"
                        name="date-format"
                        defaultValue="F j, Y"
                        className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      >
                        <option value="F j, Y">May 15, 2023</option>
                        <option value="Y-m-d">2023-05-15</option>
                        <option value="m/d/Y">05/15/2023</option>
                        <option value="d/m/Y">15/05/2023</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {activeTab === 'appearance' && (
              <div className="space-y-6">
                <h2 className="text-lg font-medium border-b pb-2">Appearance Settings</h2>
                <p className="text-gray-500">Configure the look and feel of your website.</p>
                {/* Appearance settings would go here */}
              </div>
            )}
            
            {activeTab === 'seo' && (
              <div className="space-y-6">
                <h2 className="text-lg font-medium border-b pb-2">SEO Settings</h2>
                <p className="text-gray-500">Optimize your site for search engines.</p>
                {/* SEO settings would go here */}
              </div>
            )}
            
            {activeTab === 'email' && (
              <div className="space-y-6">
                <h2 className="text-lg font-medium border-b pb-2">Email Settings</h2>
                <p className="text-gray-500">Configure email notifications and templates.</p>
                {/* Email settings would go here */}
              </div>
            )}
            
            {activeTab === 'users' && (
              <div className="space-y-6">
                <h2 className="text-lg font-medium border-b pb-2">User Settings</h2>
                <p className="text-gray-500">Configure user roles and permissions.</p>
                {/* User settings would go here */}
              </div>
            )}
            
            {activeTab === 'security' && (
              <div className="space-y-6">
                <h2 className="text-lg font-medium border-b pb-2">Security Settings</h2>
                <p className="text-gray-500">Configure security options for your website.</p>
                {/* Security settings would go here */}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 