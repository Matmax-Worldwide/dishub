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
import UserSettingsSection from './user-settings-section'; 
import SiteSettingsSection from './site-settings-section'; // Import the new SiteSettingsSection component

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
              <SiteSettingsSection />
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
              // The UserSettingsSection already has its own H2 title and structure
              <UserSettingsSection />
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