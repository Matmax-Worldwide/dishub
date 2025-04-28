'use client';

import { useState } from 'react';
import { useQuery, useMutation, gql } from '@apollo/client';
import { client } from '@/app/lib/apollo-client';

// GraphQL Queries and Mutations
const GET_USER_SETTINGS = gql`
  query GetUserSettings {
    me {
      id
      email
      name
      role
      settings {
        id
        theme
        language
        notifications {
          email
          push
          taskReminders
          appointmentReminders
          systemUpdates
        }
        timezone
        dateFormat
        timeFormat
      }
    }
  }
`;

const UPDATE_USER_SETTINGS = gql`
  mutation UpdateUserSettings($input: UpdateSettingsInput!) {
    updateSettings(input: $input) {
      id
      theme
      language
      notifications {
        email
        push
        taskReminders
        appointmentReminders
        systemUpdates
      }
      timezone
      dateFormat
      timeFormat
    }
  }
`;

const UPDATE_USER = gql`
  mutation UpdateUser($input: UpdateUserInput!) {
    updateUser(input: $input) {
      id
      name
      email
    }
  }
`;

interface Notifications {
  email: boolean;
  push: boolean;
  taskReminders: boolean;
  appointmentReminders: boolean;
  systemUpdates: boolean;
}

interface UserSettings {
  id: string;
  theme: string;
  language: string;
  notifications: Notifications;
  timezone: string;
  dateFormat: string;
  timeFormat: string;
}

export default function SettingsPage() {
  // Form states
  const [accountSettings, setAccountSettings] = useState({
    name: '',
    email: '',
  });
  
  const [userSettings, setUserSettings] = useState<UserSettings>({
    id: '',
    theme: 'light',
    language: 'en',
    notifications: {
      email: true,
      push: true,
      taskReminders: true,
      appointmentReminders: true,
      systemUpdates: true,
    },
    timezone: 'UTC',
    dateFormat: 'MM/DD/YYYY',
    timeFormat: '12h',
  });
  
  const [activeTab, setActiveTab] = useState('account');
  const [isSaving, setIsSaving] = useState(false);
  const [notification, setNotification] = useState<{type: 'success' | 'error', message: string} | null>(null);
  
  // GraphQL hooks
  const { loading, error } = useQuery(GET_USER_SETTINGS, {
    client,
    onCompleted: (data) => {
      if (data?.me) {
        setAccountSettings({
          name: data.me.name || '',
          email: data.me.email || '',
        });
        
        if (data.me.settings) {
          setUserSettings(data.me.settings);
        }
      }
    },
  });
  
  const [updateSettings] = useMutation(UPDATE_USER_SETTINGS, {
    client,
    onCompleted: () => {
      setNotification({ type: 'success', message: 'Settings updated successfully!' });
      setTimeout(() => setNotification(null), 3000);
      setIsSaving(false);
    },
    onError: (error) => {
      setNotification({ type: 'error', message: `Error updating settings: ${error.message}` });
      setIsSaving(false);
    },
  });
  
  const [updateUser] = useMutation(UPDATE_USER, {
    client,
    onCompleted: () => {
      setNotification({ type: 'success', message: 'Account information updated successfully!' });
      setTimeout(() => setNotification(null), 3000);
      setIsSaving(false);
    },
    onError: (error) => {
      setNotification({ type: 'error', message: `Error updating account: ${error.message}` });
      setIsSaving(false);
    },
  });
  
  const handleAccountUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    await updateUser({
      variables: {
        input: {
          name: accountSettings.name,
          email: accountSettings.email,
        },
      },
    });
  };
  
  const handleSettingsUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    await updateSettings({
      variables: {
        input: {
          theme: userSettings.theme,
          language: userSettings.language,
          notifications: userSettings.notifications,
          timezone: userSettings.timezone,
          dateFormat: userSettings.dateFormat,
          timeFormat: userSettings.timeFormat,
        },
      },
    });
  };
  
  // Handle notification toggle
  const handleNotificationToggle = (key: keyof Notifications) => {
    setUserSettings({
      ...userSettings,
      notifications: {
        ...userSettings.notifications,
        [key]: !userSettings.notifications[key],
      },
    });
  };
  
  if (loading) return <div className="flex justify-center p-6">Loading settings...</div>;
  if (error) return <div className="text-red-500 p-6">Error loading settings: {error.message}</div>;
  
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-gray-900">Settings</h1>
      
      {notification && (
        <div className={`p-4 rounded-md ${notification.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
          {notification.message}
        </div>
      )}
      
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            <button
              onClick={() => setActiveTab('account')}
              className={`px-6 py-4 text-sm font-medium ${
                activeTab === 'account'
                  ? 'border-b-2 border-indigo-500 text-indigo-600'
                  : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Account
            </button>
            <button
              onClick={() => setActiveTab('notifications')}
              className={`px-6 py-4 text-sm font-medium ${
                activeTab === 'notifications'
                  ? 'border-b-2 border-indigo-500 text-indigo-600'
                  : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Notifications
            </button>
            <button
              onClick={() => setActiveTab('appearance')}
              className={`px-6 py-4 text-sm font-medium ${
                activeTab === 'appearance'
                  ? 'border-b-2 border-indigo-500 text-indigo-600'
                  : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Appearance
            </button>
            <button
              onClick={() => setActiveTab('security')}
              className={`px-6 py-4 text-sm font-medium ${
                activeTab === 'security'
                  ? 'border-b-2 border-indigo-500 text-indigo-600'
                  : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Security
            </button>
          </nav>
        </div>
        
        <div className="p-6">
          {activeTab === 'account' && (
            <form onSubmit={handleAccountUpdate} className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900">Account Information</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Update your account details and email preferences.
                </p>
              </div>
              
              <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                <div className="sm:col-span-3">
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                    Full Name
                  </label>
                  <div className="mt-1">
                    <input
                      type="text"
                      name="name"
                      id="name"
                      value={accountSettings.name}
                      onChange={(e) => setAccountSettings({...accountSettings, name: e.target.value})}
                      className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    />
                  </div>
                </div>
                
                <div className="sm:col-span-4">
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    Email Address
                  </label>
                  <div className="mt-1">
                    <input
                      id="email"
                      name="email"
                      type="email"
                      value={accountSettings.email}
                      onChange={(e) => setAccountSettings({...accountSettings, email: e.target.value})}
                      className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    />
                  </div>
                </div>
              </div>
              
              <div className="pt-5">
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    {isSaving ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </div>
            </form>
          )}
          
          {activeTab === 'notifications' && (
            <form onSubmit={handleSettingsUpdate} className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900">Notification Settings</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Decide which notifications you&apos;d like to receive.
                </p>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      id="email-notifications"
                      name="email-notifications"
                      type="checkbox"
                      checked={userSettings.notifications.email}
                      onChange={() => handleNotificationToggle('email')}
                      className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
                    />
                  </div>
                  <div className="ml-3 text-sm">
                    <label htmlFor="email-notifications" className="font-medium text-gray-700">
                      Email Notifications
                    </label>
                    <p className="text-gray-500">Receive notifications via email.</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      id="push-notifications"
                      name="push-notifications"
                      type="checkbox"
                      checked={userSettings.notifications.push}
                      onChange={() => handleNotificationToggle('push')}
                      className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
                    />
                  </div>
                  <div className="ml-3 text-sm">
                    <label htmlFor="push-notifications" className="font-medium text-gray-700">
                      Push Notifications
                    </label>
                    <p className="text-gray-500">Receive push notifications in your browser.</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      id="task-reminders"
                      name="task-reminders"
                      type="checkbox"
                      checked={userSettings.notifications.taskReminders}
                      onChange={() => handleNotificationToggle('taskReminders')}
                      className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
                    />
                  </div>
                  <div className="ml-3 text-sm">
                    <label htmlFor="task-reminders" className="font-medium text-gray-700">
                      Task Reminders
                    </label>
                    <p className="text-gray-500">Get notified about upcoming and due tasks.</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      id="appointment-reminders"
                      name="appointment-reminders"
                      type="checkbox"
                      checked={userSettings.notifications.appointmentReminders}
                      onChange={() => handleNotificationToggle('appointmentReminders')}
                      className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
                    />
                  </div>
                  <div className="ml-3 text-sm">
                    <label htmlFor="appointment-reminders" className="font-medium text-gray-700">
                      Appointment Reminders
                    </label>
                    <p className="text-gray-500">Get notified about upcoming appointments.</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      id="system-updates"
                      name="system-updates"
                      type="checkbox"
                      checked={userSettings.notifications.systemUpdates}
                      onChange={() => handleNotificationToggle('systemUpdates')}
                      className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
                    />
                  </div>
                  <div className="ml-3 text-sm">
                    <label htmlFor="system-updates" className="font-medium text-gray-700">
                      System Updates
                    </label>
                    <p className="text-gray-500">Receive notifications about system updates and new features.</p>
                  </div>
                </div>
              </div>
              
              <div className="pt-5">
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    {isSaving ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </div>
            </form>
          )}
          
          {activeTab === 'appearance' && (
            <form onSubmit={handleSettingsUpdate} className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900">Appearance Settings</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Customize the look and feel of your application.
                </p>
              </div>
              
              <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                <div className="sm:col-span-3">
                  <label htmlFor="theme" className="block text-sm font-medium text-gray-700">
                    Theme
                  </label>
                  <div className="mt-1">
                    <select
                      id="theme"
                      name="theme"
                      value={userSettings.theme}
                      onChange={(e) => setUserSettings({...userSettings, theme: e.target.value})}
                      className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    >
                      <option value="light">Light</option>
                      <option value="dark">Dark</option>
                      <option value="system">System Default</option>
                    </select>
                  </div>
                </div>
                
                <div className="sm:col-span-3">
                  <label htmlFor="language" className="block text-sm font-medium text-gray-700">
                    Language
                  </label>
                  <div className="mt-1">
                    <select
                      id="language"
                      name="language"
                      value={userSettings.language}
                      onChange={(e) => setUserSettings({...userSettings, language: e.target.value})}
                      className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    >
                      <option value="en">English</option>
                      <option value="es">Spanish</option>
                      <option value="fr">French</option>
                      <option value="de">German</option>
                      <option value="pt">Portuguese</option>
                    </select>
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
                      value={userSettings.timezone}
                      onChange={(e) => setUserSettings({...userSettings, timezone: e.target.value})}
                      className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    >
                      <option value="UTC">UTC</option>
                      <option value="America/New_York">Eastern Time (ET)</option>
                      <option value="America/Chicago">Central Time (CT)</option>
                      <option value="America/Denver">Mountain Time (MT)</option>
                      <option value="America/Los_Angeles">Pacific Time (PT)</option>
                      <option value="Europe/London">London (GMT)</option>
                      <option value="Europe/Paris">Paris (CET)</option>
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
                      value={userSettings.dateFormat}
                      onChange={(e) => setUserSettings({...userSettings, dateFormat: e.target.value})}
                      className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    >
                      <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                      <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                      <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                    </select>
                  </div>
                </div>
                
                <div className="sm:col-span-3">
                  <label htmlFor="time-format" className="block text-sm font-medium text-gray-700">
                    Time Format
                  </label>
                  <div className="mt-1">
                    <select
                      id="time-format"
                      name="time-format"
                      value={userSettings.timeFormat}
                      onChange={(e) => setUserSettings({...userSettings, timeFormat: e.target.value})}
                      className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    >
                      <option value="12h">12-hour (AM/PM)</option>
                      <option value="24h">24-hour</option>
                    </select>
                  </div>
                </div>
              </div>
              
              <div className="pt-5">
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    {isSaving ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </div>
            </form>
          )}
          
          {activeTab === 'security' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900">Security Settings</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Manage your password and security preferences.
                </p>
              </div>
              
              <div className="space-y-6 divide-y divide-gray-200">
                <div className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-base font-medium text-gray-900">Change Password</h4>
                      <p className="mt-1 text-sm text-gray-500">
                        Update your password to maintain account security.
                      </p>
                    </div>
                    <button
                      type="button"
                      className="bg-white rounded-md px-4 py-2 text-sm font-medium text-indigo-600 hover:text-indigo-500 border border-indigo-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      Change Password
                    </button>
                  </div>
                </div>
                
                <div className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-base font-medium text-gray-900">Two-Factor Authentication</h4>
                      <p className="mt-1 text-sm text-gray-500">
                        Add an extra layer of security to your account.
                      </p>
                    </div>
                    <button
                      type="button"
                      className="bg-white rounded-md px-4 py-2 text-sm font-medium text-indigo-600 hover:text-indigo-500 border border-indigo-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      Setup 2FA
                    </button>
                  </div>
                </div>
                
                <div className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-base font-medium text-gray-900">Sessions</h4>
                      <p className="mt-1 text-sm text-gray-500">
                        View and manage your active sessions across devices.
                      </p>
                    </div>
                    <button
                      type="button"
                      className="bg-white rounded-md px-4 py-2 text-sm font-medium text-indigo-600 hover:text-indigo-500 border border-indigo-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      Manage Sessions
                    </button>
                  </div>
                </div>
                
                <div className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-base font-medium text-gray-900">API Keys</h4>
                      <p className="mt-1 text-sm text-gray-500">
                        Create and manage API keys for third-party integrations.
                      </p>
                    </div>
                    <button
                      type="button"
                      className="bg-white rounded-md px-4 py-2 text-sm font-medium text-indigo-600 hover:text-indigo-500 border border-indigo-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      Manage API Keys
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 