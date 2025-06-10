'use client';

import { useState } from 'react';
import { User, Bell, Shield, Globe } from 'lucide-react';

export default function SettingsPage() {
  const [formData, setFormData] = useState({
    name: 'Antonella Puntriano',
    email: 'antonella@legaldashboard.com',
    role: 'Founder & CEO'
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Settings</h1>
        <p className="text-sm text-gray-500">Manage application settings and preferences</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center space-x-3 mb-4">
              <User className="h-6 w-6 text-gray-600" />
              <h2 className="text-lg font-semibold text-gray-800">Profile Settings</h2>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input 
                  type="text" 
                  value={formData.name} 
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input 
                  type="email" 
                  value={formData.email} 
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <input 
                  type="text" 
                  value={formData.role} 
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50" 
                  readOnly 
                />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center space-x-3 mb-4">
              <Bell className="h-6 w-6 text-gray-600" />
              <h2 className="text-lg font-semibold text-gray-800">Notifications</h2>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">Email Notifications</p>
                  <p className="text-sm text-gray-500">Receive notifications via email</p>
                </div>
                <input type="checkbox" defaultChecked className="rounded" />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">Deadline Alerts</p>
                  <p className="text-sm text-gray-500">Get alerted about approaching deadlines</p>
                </div>
                <input type="checkbox" defaultChecked className="rounded" />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">Task Updates</p>
                  <p className="text-sm text-gray-500">Notifications for task assignments and updates</p>
                </div>
                <input type="checkbox" defaultChecked className="rounded" />
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center space-x-3 mb-4">
              <Shield className="h-6 w-6 text-gray-600" />
              <h2 className="text-lg font-semibold text-gray-800">Security</h2>
            </div>
            
            <div className="space-y-3">
              <button className="w-full text-left p-3 rounded-lg border hover:bg-gray-50">
                <p className="font-medium text-gray-900">Change Password</p>
                <p className="text-sm text-gray-500">Update your password</p>
              </button>
              <button className="w-full text-left p-3 rounded-lg border hover:bg-gray-50">
                <p className="font-medium text-gray-900">Two-Factor Auth</p>
                <p className="text-sm text-gray-500">Enable 2FA for extra security</p>
              </button>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center space-x-3 mb-4">
              <Globe className="h-6 w-6 text-gray-600" />
              <h2 className="text-lg font-semibold text-gray-800">Preferences</h2>
            </div>
            
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Language</label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                  <option>English</option>
                  <option>Spanish</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Timezone</label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                  <option>Lima (UTC-5)</option>
                  <option>Mexico City (UTC-6)</option>
                  <option>Bogotá (UTC-5)</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end space-x-3">
        <button className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
          Cancel
        </button>
        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          Save Changes
        </button>
      </div>
    </div>
  );
} 