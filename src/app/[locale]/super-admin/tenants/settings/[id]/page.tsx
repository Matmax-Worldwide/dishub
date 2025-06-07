'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Textarea } from '@/app/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { Checkbox } from '@/app/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import { 
  ArrowLeftIcon, 
  SaveIcon, 
  LoaderIcon,
  SettingsIcon,
  ShieldIcon,
  DatabaseIcon,
  BellIcon,
  KeyIcon,
  AlertTriangleIcon,
  RefreshCwIcon,
  DownloadIcon,
} from 'lucide-react';
import Link from 'next/link';
import graphqlClient from '@/lib/graphql-client';
import { toast } from 'sonner';

// Define TenantDetails interface locally since we're using the main GraphQL client
interface TenantDetails {
  id: string;
  name: string;
  slug: string;
  domain?: string;
  status: string;
  planId?: string;
  description?: string;
  features: string[];
  settings?: {
    maxUsers?: number;
    maxStorage?: number;
    customDomain?: boolean;
    sslEnabled?: boolean;
    backupEnabled?: boolean;
    maintenanceMode?: boolean;
    [key: string]: unknown;
  };
  userCount: number;
  pageCount: number;
  postCount: number;
  createdAt: string;
  updatedAt: string;
}

const BACKUP_FREQUENCIES = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'disabled', label: 'Disabled' }
];

const NOTIFICATION_TYPES = [
  { id: 'system_updates', name: 'System Updates', description: 'Notifications about system updates and maintenance' },
  { id: 'security_alerts', name: 'Security Alerts', description: 'Security-related notifications and warnings' },
  { id: 'usage_reports', name: 'Usage Reports', description: 'Monthly usage and analytics reports' },
  { id: 'billing_notifications', name: 'Billing Notifications', description: 'Payment and billing related notifications' },
  { id: 'feature_announcements', name: 'Feature Announcements', description: 'New feature releases and updates' }
];

const API_RATE_LIMITS = [
  { value: '100', label: '100 requests/minute' },
  { value: '500', label: '500 requests/minute' },
  { value: '1000', label: '1000 requests/minute' },
  { value: '5000', label: '5000 requests/minute' },
  { value: 'unlimited', label: 'Unlimited' }
];

export default function TenantSettingsPage() {
  const params = useParams();
  const tenantId = params.id as string;

  const [tenant, setTenant] = useState<TenantDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('general');
  
  const [settings, setSettings] = useState({
    general: {
      timezone: 'UTC',
      language: 'en',
      dateFormat: 'MM/DD/YYYY',
      currency: 'USD'
    },
    security: {
      twoFactorRequired: false,
      passwordPolicy: 'medium',
      sessionTimeout: 30,
      ipWhitelist: '',
      sslForced: true
    },
    storage: {
      maxStorage: 1000,
      maxFileSize: 10,
      allowedFileTypes: 'jpg,jpeg,png,gif,pdf,doc,docx',
      compressionEnabled: true
    },
    api: {
      rateLimit: '1000',
      webhooksEnabled: true,
      apiKeysEnabled: true,
      corsOrigins: ''
    },
    backup: {
      frequency: 'daily',
      retentionDays: 30,
      includeMedia: true,
      includeDatabase: true,
      autoRestore: false
    },
    notifications: {
      emailNotifications: true,
      smsNotifications: false,
      enabledTypes: ['system_updates', 'security_alerts'] as string[]
    }
  });

  const loadTenant = async () => {
    try {
      setLoading(true);
      const tenantData = await graphqlClient.getTenantById(tenantId);
      
      if (tenantData) {
        setTenant(tenantData);
        // Load existing settings or use defaults
        
      }
    } catch (error) {
      console.error('Error loading tenant:', error);
      toast.error('Failed to load tenant details');
    } finally {
      setLoading(false);
    }
  };

  const handleSettingChange = (category: string, field: string, value: string | boolean | number) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category as keyof typeof prev],
        [field]: value
      }
    }));
  };

  const handleNotificationToggle = (typeId: string) => {
    setSettings(prev => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        enabledTypes: prev.notifications.enabledTypes.includes(typeId)
          ? prev.notifications.enabledTypes.filter(t => t !== typeId)
          : [...prev.notifications.enabledTypes, typeId]
      }
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      // Note: updateTenantSettings method needs to be implemented in the main GraphQL client
      // For now, we'll use a placeholder that simulates the API call
      const result = { success: true, message: 'Settings updated successfully' };

      if (result.success) {
        toast.success('Settings updated successfully');
      } else {
        toast.error(result.message || 'Failed to update settings');
      }
    } catch (error) {
      console.error('Error updating settings:', error);
      toast.error('Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  const handleBackup = async () => {
    try {
      toast.info('Creating backup...');
      // Note: createTenantBackup method needs to be implemented in the main GraphQL client
      // For now, we'll use a placeholder that simulates the API call
      const result = { success: true, message: 'Backup created successfully' };
      if (result.success) {
        toast.success('Backup created successfully');
      } else {
        toast.error('Failed to create backup');
      }
    } catch (error) {
      console.error('Error creating backup:', error);
      toast.error('Failed to create backup');
    }
  };

  const handleResetSettings = () => {
    if (confirm('Are you sure you want to reset all settings to defaults? This action cannot be undone.')) {
      setSettings({
        general: {
          timezone: 'UTC',
          language: 'en',
          dateFormat: 'MM/DD/YYYY',
          currency: 'USD'
        },
        security: {
          twoFactorRequired: false,
          passwordPolicy: 'medium',
          sessionTimeout: 30,
          ipWhitelist: '',
          sslForced: true
        },
        storage: {
          maxStorage: 1000,
          maxFileSize: 10,
          allowedFileTypes: 'jpg,jpeg,png,gif,pdf,doc,docx',
          compressionEnabled: true
        },
        api: {
          rateLimit: '1000',
          webhooksEnabled: true,
          apiKeysEnabled: true,
          corsOrigins: ''
        },
        backup: {
          frequency: 'daily',
          retentionDays: 30,
          includeMedia: true,
          includeDatabase: true,
          autoRestore: false
        },
        notifications: {
          emailNotifications: true,
          smsNotifications: false,
          enabledTypes: ['system_updates', 'security_alerts']
        }
      });
      toast.success('Settings reset to defaults');
    }
  };

  useEffect(() => {
    if (tenantId) {
      loadTenant();
    }
  }, [tenantId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading tenant settings...</p>
        </div>
      </div>
    );
  }

  if (!tenant) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertTriangleIcon className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Tenant Not Found</h2>
          <p className="text-gray-600 mb-4">The requested tenant could not be found.</p>
          <Link href="/super-admin/tenants/list">
            <Button>
              <ArrowLeftIcon className="h-4 w-4 mr-2" />
              Back to Tenants
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/super-admin/tenants/list">
            <Button variant="ghost" size="sm">
              <ArrowLeftIcon className="h-4 w-4 mr-2" />
              Back to Tenants
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Tenant Settings</h1>
            <p className="text-gray-600">Advanced configuration for {tenant.name}</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline" onClick={handleResetSettings}>
            <RefreshCwIcon className="h-4 w-4 mr-2" />
            Reset to Defaults
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <LoaderIcon className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <SaveIcon className="h-4 w-4 mr-2" />
            )}
            Save Settings
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="storage">Storage</TabsTrigger>
          <TabsTrigger value="api">API</TabsTrigger>
          <TabsTrigger value="backup">Backup</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <SettingsIcon className="h-5 w-5 mr-2" />
                General Settings
              </CardTitle>
              <CardDescription>
                Basic configuration options for the tenant
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="timezone">Timezone</Label>
                  <Select 
                    value={settings.general.timezone} 
                    onValueChange={(value) => handleSettingChange('general', 'timezone', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="UTC">UTC</SelectItem>
                      <SelectItem value="America/New_York">Eastern Time</SelectItem>
                      <SelectItem value="America/Chicago">Central Time</SelectItem>
                      <SelectItem value="America/Denver">Mountain Time</SelectItem>
                      <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                      <SelectItem value="Europe/London">London</SelectItem>
                      <SelectItem value="Europe/Paris">Paris</SelectItem>
                      <SelectItem value="Asia/Tokyo">Tokyo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="language">Default Language</Label>
                  <Select 
                    value={settings.general.language} 
                    onValueChange={(value) => handleSettingChange('general', 'language', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="es">Spanish</SelectItem>
                      <SelectItem value="fr">French</SelectItem>
                      <SelectItem value="de">German</SelectItem>
                      <SelectItem value="it">Italian</SelectItem>
                      <SelectItem value="pt">Portuguese</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dateFormat">Date Format</Label>
                  <Select 
                    value={settings.general.dateFormat} 
                    onValueChange={(value) => handleSettingChange('general', 'dateFormat', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                      <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                      <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                      <SelectItem value="DD-MM-YYYY">DD-MM-YYYY</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currency">Default Currency</Label>
                  <Select 
                    value={settings.general.currency} 
                    onValueChange={(value) => handleSettingChange('general', 'currency', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD - US Dollar</SelectItem>
                      <SelectItem value="EUR">EUR - Euro</SelectItem>
                      <SelectItem value="GBP">GBP - British Pound</SelectItem>
                      <SelectItem value="JPY">JPY - Japanese Yen</SelectItem>
                      <SelectItem value="CAD">CAD - Canadian Dollar</SelectItem>
                      <SelectItem value="AUD">AUD - Australian Dollar</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Settings */}
        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <ShieldIcon className="h-5 w-5 mr-2" />
                Security Settings
              </CardTitle>
              <CardDescription>
                Configure security policies and access controls
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="passwordPolicy">Password Policy</Label>
                  <Select 
                    value={settings.security.passwordPolicy} 
                    onValueChange={(value) => handleSettingChange('security', 'passwordPolicy', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="weak">Weak (6+ characters)</SelectItem>
                      <SelectItem value="medium">Medium (8+ chars, mixed case)</SelectItem>
                      <SelectItem value="strong">Strong (12+ chars, symbols)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sessionTimeout">Session Timeout (minutes)</Label>
                  <Input
                    id="sessionTimeout"
                    type="number"
                    value={settings.security.sessionTimeout}
                    onChange={(e) => handleSettingChange('security', 'sessionTimeout', parseInt(e.target.value) || 30)}
                    min="5"
                    max="480"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="twoFactorRequired"
                    checked={settings.security.twoFactorRequired}
                    onCheckedChange={(checked) => handleSettingChange('security', 'twoFactorRequired', checked)}
                  />
                  <Label htmlFor="twoFactorRequired">Require Two-Factor Authentication</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="sslForced"
                    checked={settings.security.sslForced}
                    onCheckedChange={(checked) => handleSettingChange('security', 'sslForced', checked)}
                  />
                  <Label htmlFor="sslForced">Force SSL/HTTPS</Label>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="ipWhitelist">IP Whitelist (one per line)</Label>
                <Textarea
                  id="ipWhitelist"
                  value={settings.security.ipWhitelist}
                  onChange={(e) => handleSettingChange('security', 'ipWhitelist', e.target.value)}
                  placeholder="192.168.1.1&#10;10.0.0.0/8"
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Storage Settings */}
        <TabsContent value="storage" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <DatabaseIcon className="h-5 w-5 mr-2" />
                Storage Settings
              </CardTitle>
              <CardDescription>
                Configure storage limits and file handling
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="maxStorage">Max Storage (MB)</Label>
                  <Input
                    id="maxStorage"
                    type="number"
                    value={settings.storage.maxStorage}
                    onChange={(e) => handleSettingChange('storage', 'maxStorage', parseInt(e.target.value) || 1000)}
                    min="100"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxFileSize">Max File Size (MB)</Label>
                  <Input
                    id="maxFileSize"
                    type="number"
                    value={settings.storage.maxFileSize}
                    onChange={(e) => handleSettingChange('storage', 'maxFileSize', parseInt(e.target.value) || 10)}
                    min="1"
                    max="100"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="allowedFileTypes">Allowed File Types (comma-separated)</Label>
                <Input
                  id="allowedFileTypes"
                  value={settings.storage.allowedFileTypes}
                  onChange={(e) => handleSettingChange('storage', 'allowedFileTypes', e.target.value)}
                  placeholder="jpg,jpeg,png,gif,pdf,doc,docx"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="compressionEnabled"
                  checked={settings.storage.compressionEnabled}
                  onCheckedChange={(checked) => handleSettingChange('storage', 'compressionEnabled', checked)}
                />
                <Label htmlFor="compressionEnabled">Enable Image Compression</Label>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* API Settings */}
        <TabsContent value="api" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <KeyIcon className="h-5 w-5 mr-2" />
                API Settings
              </CardTitle>
              <CardDescription>
                Configure API access and rate limiting
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="rateLimit">Rate Limit</Label>
                <Select 
                  value={settings.api.rateLimit} 
                  onValueChange={(value) => handleSettingChange('api', 'rateLimit', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {API_RATE_LIMITS.map((limit) => (
                      <SelectItem key={limit.value} value={limit.value}>
                        {limit.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="corsOrigins">CORS Origins (one per line)</Label>
                <Textarea
                  id="corsOrigins"
                  value={settings.api.corsOrigins}
                  onChange={(e) => handleSettingChange('api', 'corsOrigins', e.target.value)}
                  placeholder="https://example.com&#10;https://app.example.com"
                  rows={3}
                />
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="webhooksEnabled"
                    checked={settings.api.webhooksEnabled}
                    onCheckedChange={(checked) => handleSettingChange('api', 'webhooksEnabled', checked)}
                  />
                  <Label htmlFor="webhooksEnabled">Enable Webhooks</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="apiKeysEnabled"
                    checked={settings.api.apiKeysEnabled}
                    onCheckedChange={(checked) => handleSettingChange('api', 'apiKeysEnabled', checked)}
                  />
                  <Label htmlFor="apiKeysEnabled">Enable API Keys</Label>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Backup Settings */}
        <TabsContent value="backup" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <DownloadIcon className="h-5 w-5 mr-2" />
                Backup Settings
              </CardTitle>
              <CardDescription>
                Configure automatic backups and data retention
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="frequency">Backup Frequency</Label>
                  <Select 
                    value={settings.backup.frequency} 
                    onValueChange={(value) => handleSettingChange('backup', 'frequency', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {BACKUP_FREQUENCIES.map((freq) => (
                        <SelectItem key={freq.value} value={freq.value}>
                          {freq.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="retentionDays">Retention Period (days)</Label>
                  <Input
                    id="retentionDays"
                    type="number"
                    value={settings.backup.retentionDays}
                    onChange={(e) => handleSettingChange('backup', 'retentionDays', parseInt(e.target.value) || 30)}
                    min="1"
                    max="365"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="includeMedia"
                    checked={settings.backup.includeMedia}
                    onCheckedChange={(checked) => handleSettingChange('backup', 'includeMedia', checked)}
                  />
                  <Label htmlFor="includeMedia">Include Media Files</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="includeDatabase"
                    checked={settings.backup.includeDatabase}
                    onCheckedChange={(checked) => handleSettingChange('backup', 'includeDatabase', checked)}
                  />
                  <Label htmlFor="includeDatabase">Include Database</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="autoRestore"
                    checked={settings.backup.autoRestore}
                    onCheckedChange={(checked) => handleSettingChange('backup', 'autoRestore', checked)}
                  />
                  <Label htmlFor="autoRestore">Enable Auto-Restore on Failure</Label>
                </div>
              </div>

              <div className="pt-4 border-t">
                <Button onClick={handleBackup} variant="outline">
                  <DownloadIcon className="h-4 w-4 mr-2" />
                  Create Manual Backup
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Settings */}
        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BellIcon className="h-5 w-5 mr-2" />
                Notification Settings
              </CardTitle>
              <CardDescription>
                Configure notification preferences and channels
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="emailNotifications"
                    checked={settings.notifications.emailNotifications}
                    onCheckedChange={(checked) => handleSettingChange('notifications', 'emailNotifications', checked)}
                  />
                  <Label htmlFor="emailNotifications">Enable Email Notifications</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="smsNotifications"
                    checked={settings.notifications.smsNotifications}
                    onCheckedChange={(checked) => handleSettingChange('notifications', 'smsNotifications', checked)}
                  />
                  <Label htmlFor="smsNotifications">Enable SMS Notifications</Label>
                </div>
              </div>

              <div className="space-y-4">
                <Label>Notification Types</Label>
                {NOTIFICATION_TYPES.map((type) => (
                  <div key={type.id} className="flex items-start space-x-3 p-3 border rounded-lg">
                    <Checkbox
                      id={type.id}
                      checked={settings.notifications.enabledTypes.includes(type.id)}
                      onCheckedChange={() => handleNotificationToggle(type.id)}
                    />
                    <div className="flex-1">
                      <Label htmlFor={type.id} className="font-medium cursor-pointer">
                        {type.name}
                      </Label>
                      <p className="text-sm text-gray-600 mt-1">{type.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 