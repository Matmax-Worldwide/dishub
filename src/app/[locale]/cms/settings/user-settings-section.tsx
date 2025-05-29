'use client';

import { useEffect, useState, useCallback } from 'react';
import graphqlClient from '@/lib/graphql-client'; 
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner'; // Assuming sonner is available for notifications

// Define a type for the settings state, matching UserSettings GraphQL type
// Based on schema: UserSettings { id, userId, user, emailNotifications, theme, language, timeFormat, dateFormat, createdAt, updatedAt }
interface UserSettingsData {
  emailNotifications: boolean;
  theme: string;
  language: string;
  timeFormat: string;
  dateFormat: string;
}

// For the response from graphqlClient.userSettings()
interface UserSettingsResponse extends UserSettingsData {
  id?: string; // and other fields from UserSettings if needed
}

// For the input to graphqlClient.updateUserSettings()
interface UpdateUserSettingsGraphQLInput {
  emailNotifications?: boolean;
  theme?: string;
  language?: string;
  timeFormat?: string;
  dateFormat?: string;
}


export default function UserSettingsSection() {
  const [settings, setSettings] = useState<Partial<UserSettingsData>>({});
  const [initialSettings, setInitialSettings] = useState<Partial<UserSettingsData>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSettings = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // The actual response from graphqlClient.userSettings() might be directly the settings object,
      // or it could be nested, e.g. { userSettings: { ... } }.
      // The provided graphql-client.ts usually returns the direct data object.
      const responseData = await graphqlClient.userSettings() as UserSettingsResponse; 
      
      if (responseData) {
        const relevantSettings: UserSettingsData = {
          emailNotifications: responseData.emailNotifications,
          theme: responseData.theme,
          language: responseData.language,
          timeFormat: responseData.timeFormat,
          dateFormat: responseData.dateFormat,
        };
        setSettings(relevantSettings);
        setInitialSettings(relevantSettings);
      } else {
        // Handle case where no settings are returned (e.g. new user, defaults applied on backend)
        // Or if the query structure is different, this part might need adjustment.
        // For now, setting to empty or some frontend defaults if needed.
        const defaultSettings: UserSettingsData = {
          emailNotifications: true,
          theme: 'light',
          language: 'en',
          timeFormat: '12h',
          dateFormat: 'MM/DD/YYYY',
        };
        setSettings(defaultSettings);
        setInitialSettings(defaultSettings);
        console.warn('No user settings returned, using frontend defaults.');
      }
    } catch (err: any) {
      setError(`Failed to load user settings: ${err.message || 'Unknown error'}`);
      console.error(err);
      toast.error(`Failed to load user settings: ${err.message || 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    
    const changes: UpdateUserSettingsGraphQLInput = {};
    // Only include changed fields in the input
    (Object.keys(settings) as Array<keyof UserSettingsData>).forEach(key => {
      if (settings[key] !== initialSettings[key]) {
        (changes as any)[key] = settings[key];
      }
    });

    if (Object.keys(changes).length === 0) {
      toast.info('No changes to save.');
      setIsSaving(false);
      return;
    }

    try {
      const responseData = await graphqlClient.updateUserSettings({ input: changes });
      if (responseData) {
        const updatedRelevantSettings: UserSettingsData = {
            emailNotifications: responseData.emailNotifications,
            theme: responseData.theme,
            language: responseData.language,
            timeFormat: responseData.timeFormat,
            dateFormat: responseData.dateFormat,
        };
        setSettings(updatedRelevantSettings);
        setInitialSettings(updatedRelevantSettings); // Update initial settings to reflect saved state
        toast.success('User settings updated successfully!');
      } else {
        throw new Error('No data returned from update operation');
      }
    } catch (err: any) {
      setError(`Failed to save settings: ${err.message || 'Unknown error'}`);
      console.error(err);
      toast.error(`Failed to save settings: ${err.message || 'Unknown error'}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSelectChange = (name: keyof UserSettingsData, value: string) => {
    setSettings(prev => ({ ...prev, [name]: value }));
  };

  const handleSwitchChange = (name: keyof UserSettingsData, checked: boolean) => {
     setSettings(prev => ({ ...prev, [name]: checked }));
  };

  if (isLoading) return <div className="p-4"><p>Loading user settings...</p></div>;

  return (
    <div className="space-y-8 max-w-2xl">
      <h2 className="text-2xl font-semibold mb-6">User Profile Settings</h2>
      {error && <p className="mb-4 text-sm text-destructive bg-destructive/10 border border-destructive p-3 rounded-md">{error}</p>}
      
      <div className="space-y-6">
        <div className="flex items-center justify-between p-4 border rounded-lg shadow-sm">
          <div>
            <Label htmlFor="emailNotifications" className="text-base">Email Notifications</Label>
            <p className="text-sm text-muted-foreground">Receive email notifications for important updates.</p>
          </div>
          <Switch
            id="emailNotifications"
            checked={settings.emailNotifications || false}
            onCheckedChange={(checked) => handleSwitchChange('emailNotifications', checked)}
            disabled={isSaving}
          />
        </div>

        <div className="p-4 border rounded-lg shadow-sm space-y-2">
          <Label htmlFor="theme" className="text-base">Theme</Label>
          <p className="text-sm text-muted-foreground mb-1">Choose your preferred application theme.</p>
          <Select value={settings.theme || 'light'} onValueChange={(value) => handleSelectChange('theme', value)} disabled={isSaving}>
            <SelectTrigger id="theme"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="light">Light</SelectItem>
              <SelectItem value="dark">Dark</SelectItem>
              <SelectItem value="system">System</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="p-4 border rounded-lg shadow-sm space-y-2">
          <Label htmlFor="language" className="text-base">Language</Label>
          <p className="text-sm text-muted-foreground mb-1">Select your preferred language.</p>
          <Select value={settings.language || 'en'} onValueChange={(value) => handleSelectChange('language', value)} disabled={isSaving}>
            <SelectTrigger id="language"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="en">English</SelectItem>
              <SelectItem value="es">Español</SelectItem>
              <SelectItem value="fr">Français</SelectItem>
              {/* Add other supported languages here */}
            </SelectContent>
          </Select>
        </div>

        <div className="p-4 border rounded-lg shadow-sm space-y-2">
          <Label htmlFor="timeFormat" className="text-base">Time Format</Label>
           <p className="text-sm text-muted-foreground mb-1">Set your preferred time display format.</p>
          <Select value={settings.timeFormat || '12h'} onValueChange={(value) => handleSelectChange('timeFormat', value)} disabled={isSaving}>
            <SelectTrigger id="timeFormat"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="12h">12-hour (e.g., 2:30 PM)</SelectItem>
              <SelectItem value="24h">24-hour (e.g., 14:30)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="p-4 border rounded-lg shadow-sm space-y-2">
          <Label htmlFor="dateFormat" className="text-base">Date Format</Label>
          <p className="text-sm text-muted-foreground mb-1">Choose how dates are displayed.</p>
          <Select value={settings.dateFormat || 'MM/DD/YYYY'} onValueChange={(value) => handleSelectChange('dateFormat', value)} disabled={isSaving}>
            <SelectTrigger id="dateFormat"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
              <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
              <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div className="mt-8 flex justify-end">
        <Button onClick={handleSave} disabled={isSaving || isLoading} size="lg">
          {isSaving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </div>
  );
}
