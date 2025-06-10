'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  SettingsIcon, 
  SaveIcon, 
  RefreshCwIcon,
  AlertTriangleIcon,
  CheckCircleIcon,
  InfoIcon
} from 'lucide-react';

type ModuleSettings = {
  [key: string]: boolean;
};

type AllSettings = {
  [moduleId: string]: ModuleSettings;
};

export default function ModuleConfigPage() {
  const [activeTab, setActiveTab] = useState('cms');
  const [settings, setSettings] = useState<AllSettings>({
    cms: {
      autoSave: true,
      versioning: true,
      mediaOptimization: false,
      seoTools: true
    },
    ecommerce: {
      inventoryTracking: true,
      autoTaxCalculation: true,
      abandonedCartEmails: false,
      reviewModeration: true
    },
    legal: {
      documentEncryption: true,
      auditLogging: true,
      clientPortal: false,
      billingIntegration: true
    }
  });

  const moduleConfigs = [
    {
      id: 'cms',
      name: 'CMS Engine',
      status: 'active',
      version: '2.1.0',
      description: 'Content Management System configuration',
      settings: [
        { key: 'autoSave', label: 'Auto-save content', description: 'Automatically save content changes' },
        { key: 'versioning', label: 'Content versioning', description: 'Keep track of content versions' },
        { key: 'mediaOptimization', label: 'Media optimization', description: 'Optimize images and videos automatically' },
        { key: 'seoTools', label: 'SEO tools', description: 'Enable built-in SEO optimization tools' }
      ]
    },
    {
      id: 'ecommerce',
      name: 'E-commerce Engine',
      status: 'active',
      version: '1.8.3',
      description: 'E-commerce functionality configuration',
      settings: [
        { key: 'inventoryTracking', label: 'Inventory tracking', description: 'Track product inventory levels' },
        { key: 'autoTaxCalculation', label: 'Auto tax calculation', description: 'Calculate taxes automatically' },
        { key: 'abandonedCartEmails', label: 'Abandoned cart emails', description: 'Send recovery emails for abandoned carts' },
        { key: 'reviewModeration', label: 'Review moderation', description: 'Moderate product reviews before publishing' }
      ]
    },
    {
      id: 'legal',
      name: 'Legal Engine',
      status: 'active',
      version: '1.0.5',
      description: 'Legal case management configuration',
      settings: [
        { key: 'documentEncryption', label: 'Document encryption', description: 'Encrypt sensitive legal documents' },
        { key: 'auditLogging', label: 'Audit logging', description: 'Log all system activities for compliance' },
        { key: 'clientPortal', label: 'Client portal', description: 'Enable client self-service portal' },
        { key: 'billingIntegration', label: 'Billing integration', description: 'Integrate with billing systems' }
      ]
    }
  ];

  const handleSettingChange = (moduleId: string, settingKey: string, value: boolean) => {
    setSettings(prev => ({
      ...prev,
      [moduleId]: {
        ...prev[moduleId as keyof typeof prev],
        [settingKey]: value
      }
    }));
  };

  const handleSaveConfig = (moduleId: string) => {
    alert(`Configuration saved for ${moduleId}!`);
  };

  const handleResetConfig = (moduleId: string) => {
    if (confirm('Are you sure you want to reset to default settings?')) {
      // Reset logic would go here
      alert(`Configuration reset for ${moduleId}!`);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Module Configuration</h1>
          <p className="text-gray-600 mt-1">Configure settings and preferences for your active modules</p>
        </div>
        <Button variant="outline">
          <RefreshCwIcon className="h-4 w-4 mr-2" />
          Refresh All
        </Button>
      </div>

      {/* Configuration Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          {moduleConfigs.map((module) => (
            <TabsTrigger key={module.id} value={module.id}>
              {module.name}
            </TabsTrigger>
          ))}
        </TabsList>

        {moduleConfigs.map((module) => (
          <TabsContent key={module.id} value={module.id} className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <SettingsIcon className="h-5 w-5" />
                      {module.name} Configuration
                    </CardTitle>
                    <CardDescription>{module.description}</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">v{module.version}</Badge>
                    <Badge className="bg-green-100 text-green-800">
                      <CheckCircleIcon className="h-3 w-3 mr-1" />
                      {module.status}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Settings */}
                <div className="space-y-4">
                  {module.settings.map((setting) => (
                    <div key={setting.key} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Label htmlFor={`${module.id}-${setting.key}`} className="font-medium">
                            {setting.label}
                          </Label>
                          <InfoIcon className="h-4 w-4 text-gray-400" />
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{setting.description}</p>
                      </div>
                                             <Switch
                         id={`${module.id}-${setting.key}`}
                         checked={settings[module.id]?.[setting.key] || false}
                         onCheckedChange={(checked) => handleSettingChange(module.id, setting.key, checked)}
                       />
                    </div>
                  ))}
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <AlertTriangleIcon className="h-4 w-4" />
                    Changes will take effect immediately
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      onClick={() => handleResetConfig(module.id)}
                    >
                      Reset to Default
                    </Button>
                    <Button onClick={() => handleSaveConfig(module.id)}>
                      <SaveIcon className="h-4 w-4 mr-2" />
                      Save Configuration
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Advanced Settings */}
            <Card>
              <CardHeader>
                <CardTitle>Advanced Settings</CardTitle>
                <CardDescription>Advanced configuration options for {module.name}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <SettingsIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Advanced Configuration</h3>
                  <p className="text-gray-600">Additional settings and customization options</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
} 