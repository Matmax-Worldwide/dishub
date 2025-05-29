'use client';

import { useEffect, useState, useCallback } from 'react';
import graphqlClient from '@/lib/graphql-client'; 
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

// Define a type for the settings state, matching SiteSettings GraphQL type
interface SiteSettingsData {
  id?: string; // ID might not be present for initial empty state
  siteName: string;
  siteDescription: string;
  logoUrl: string;
  faviconUrl: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string; // Added from task description
  googleAnalyticsId: string;
  facebookPixelId: string;
  customCss: string;
  customJs: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
  defaultLocale: string;
  supportedLocales: string[]; // Stored as array, converted for input
  footerText: string;
  maintenanceMode: boolean;
  metaTitle: string;
  metaDescription: string;
  ogImage: string;
  socialLinks: string; // Stored as JSON string
  twitterCardType: string;
  twitterHandle: string;
}

const initialSiteSettings: SiteSettingsData = {
  siteName: '',
  siteDescription: '',
  logoUrl: '',
  faviconUrl: '',
  primaryColor: '#000000',
  secondaryColor: '#FFFFFF',
  accentColor: '#1E88E5',
  googleAnalyticsId: '',
  facebookPixelId: '',
  customCss: '',
  customJs: '',
  contactEmail: '',
  contactPhone: '',
  address: '',
  defaultLocale: 'en',
  supportedLocales: ['en'],
  footerText: '',
  maintenanceMode: false,
  metaTitle: '',
  metaDescription: '',
  ogImage: '',
  socialLinks: '{}',
  twitterCardType: 'summary_large_image',
  twitterHandle: '',
};

export default function SiteSettingsSection() {
  const [settings, setSettings] = useState<SiteSettingsData>(initialSiteSettings);
  // Store initial fetched settings to compare for changes
  const [initialFetchedSettings, setInitialFetchedSettings] = useState<Partial<SiteSettingsData>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // State for array/JSON fields that need special input handling
  const [supportedLocalesStr, setSupportedLocalesStr] = useState('');
  const [socialLinksJson, setSocialLinksJson] = useState('{}');

  const fetchSettings = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const responseData = await graphqlClient.getSiteSettings();
      if (responseData) {
        setSettings(responseData);
        setInitialFetchedSettings(responseData);
        setSupportedLocalesStr(responseData.supportedLocales?.join(', ') || '');
        setSocialLinksJson(typeof responseData.socialLinks === 'string' ? responseData.socialLinks : JSON.stringify(responseData.socialLinks || {}, null, 2));
      } else {
        setSettings(initialSiteSettings); // Use defaults if no settings in DB
        setInitialFetchedSettings(initialSiteSettings);
        setSupportedLocalesStr(initialSiteSettings.supportedLocales.join(', '));
        setSocialLinksJson(initialSiteSettings.socialLinks);
        toast.info('No site settings found. Displaying default values.');
      }
    } catch (err: any) {
      setError(`Failed to load site settings: ${err.message || 'Unknown error'}`);
      console.error(err);
      toast.error(`Failed to load site settings: ${err.message || 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setSettings(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: keyof SiteSettingsData, value: string) => {
    setSettings(prev => ({ ...prev, [name]: value }));
  };

  const handleSwitchChange = (name: keyof SiteSettingsData, checked: boolean) => {
     setSettings(prev => ({ ...prev, [name]: checked as never }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);

    let parsedSocialLinks = settings.socialLinks;
    try {
      if (socialLinksJson.trim() !== '') {
        JSON.parse(socialLinksJson); // Validate JSON
        parsedSocialLinks = socialLinksJson;
      } else {
        parsedSocialLinks = '{}'; // Default to empty JSON object if textarea is empty
      }
    } catch (e) {
      setError('Social Links JSON is invalid. Please correct it.');
      toast.error('Social Links JSON is invalid.');
      setIsSaving(false);
      return;
    }

    const localesArray = supportedLocalesStr.split(',').map(s => s.trim()).filter(s => s);
    if (localesArray.length === 0) {
        // It's better to ensure defaultLocale is part of supportedLocales
        localesArray.push(settings.defaultLocale || 'en');
    }


    const inputToSave: Partial<SiteSettingsData> = {
      ...settings,
      supportedLocales: localesArray,
      socialLinks: parsedSocialLinks,
    };
    
    // Remove id field if it's part of the state but not needed for input (depends on GQL schema for UpdateSiteSettingsInput)
    // Typically, ID is not part of the input for update, it's used in 'where' clause by resolver
    const { id, ...inputData } = inputToSave; 


    // Only send changed data
    const changes: Partial<SiteSettingsData> = {};
    let hasChanges = false;
    for (const key in inputData) {
        const K = key as keyof SiteSettingsData;
        if (inputData[K] !== initialFetchedSettings[K]) {
            // Special handling for arrays like supportedLocales for proper comparison
            if (K === 'supportedLocales' && initialFetchedSettings.supportedLocales) {
                 if (JSON.stringify(inputData.supportedLocales?.sort()) !== JSON.stringify(initialFetchedSettings.supportedLocales?.sort())) {
                    (changes as any)[K] = inputData[K];
                    hasChanges = true;
                 }
            } else if (K === 'socialLinks') {
                // Compare JSON strings after normalizing (parsing and re-stringifying could work too)
                try {
                    const currentSocial = JSON.stringify(JSON.parse(inputData.socialLinks || '{}'));
                    const initialSocial = JSON.stringify(JSON.parse(initialFetchedSettings.socialLinks || '{}'));
                    if (currentSocial !== initialSocial) {
                        (changes as any)[K] = inputData[K];
                        hasChanges = true;
                    }
                } catch { // if parsing fails, assume it's different or handle error
                    (changes as any)[K] = inputData[K];
                    hasChanges = true;
                }
            }
            else if (inputData[K] !== initialFetchedSettings[K]) {
                (changes as any)[K] = inputData[K];
                hasChanges = true;
            }
        }
    }

    if (!hasChanges && settings.id) { // if settings.id exists, it means we are not creating for the first time
      toast.info('No changes to save.');
      setIsSaving(false);
      return;
    }


    try {
      const responseData = await graphqlClient.updateSiteSettings({ input: hasChanges || !settings.id ? changes : inputData }); // Send only changes if not first save
      if (responseData) {
        setSettings(responseData);
        setInitialFetchedSettings(responseData); // Update initial settings
        setSupportedLocalesStr(responseData.supportedLocales?.join(', ') || '');
        setSocialLinksJson(typeof responseData.socialLinks === 'string' ? responseData.socialLinks : JSON.stringify(responseData.socialLinks || {}, null, 2));
        toast.success('Site settings updated successfully!');
      } else {
         throw new Error('No data returned from update operation');
      }
    } catch (err: any) {
      setError(`Failed to save site settings: ${err.message || 'Unknown error'}`);
      console.error(err);
      toast.error(`Failed to save site settings: ${err.message || 'Unknown error'}`);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return <div className="p-6"><p>Loading site settings...</p></div>;

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-semibold">Site Configuration</h2>
      {error && <p className="my-4 text-sm text-destructive bg-destructive/10 border border-destructive p-3 rounded-md">{error}</p>}

      <Card>
        <CardHeader>
          <CardTitle>General Information</CardTitle>
          <CardDescription>Basic information about your site.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="siteName">Site Name</Label>
            <Input id="siteName" name="siteName" value={settings.siteName} onChange={handleInputChange} disabled={isSaving} />
          </div>
          <div>
            <Label htmlFor="siteDescription">Site Description</Label>
            <Textarea id="siteDescription" name="siteDescription" value={settings.siteDescription} onChange={handleInputChange} disabled={isSaving} />
          </div>
           <div>
            <Label htmlFor="footerText">Footer Text</Label>
            <Input id="footerText" name="footerText" value={settings.footerText} onChange={handleInputChange} disabled={isSaving} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Branding & Appearance</CardTitle>
          <CardDescription>Customize the look and feel of your site.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="logoUrl">Logo URL</Label>
            <Input id="logoUrl" name="logoUrl" value={settings.logoUrl} onChange={handleInputChange} disabled={isSaving} />
            {settings.logoUrl && <img src={settings.logoUrl} alt="Logo Preview" className="mt-2 h-16 object-contain border p-1" />}
          </div>
          <div>
            <Label htmlFor="faviconUrl">Favicon URL</Label>
            <Input id="faviconUrl" name="faviconUrl" value={settings.faviconUrl} onChange={handleInputChange} disabled={isSaving} />
             {settings.faviconUrl && <img src={settings.faviconUrl} alt="Favicon Preview" className="mt-2 h-8 w-8 object-contain border p-1" />}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="primaryColor">Primary Color</Label>
              <Input id="primaryColor" name="primaryColor" type="color" value={settings.primaryColor} onChange={handleInputChange} disabled={isSaving} className="h-10" />
            </div>
            <div>
              <Label htmlFor="secondaryColor">Secondary Color</Label>
              <Input id="secondaryColor" name="secondaryColor" type="color" value={settings.secondaryColor} onChange={handleInputChange} disabled={isSaving} className="h-10" />
            </div>
            <div>
              <Label htmlFor="accentColor">Accent Color</Label>
              <Input id="accentColor" name="accentColor" type="color" value={settings.accentColor} onChange={handleInputChange} disabled={isSaving} className="h-10" />
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Localization</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
           <div>
            <Label htmlFor="defaultLocale">Default Locale</Label>
            <Select value={settings.defaultLocale} onValueChange={(value) => handleSelectChange('defaultLocale' as keyof SiteSettingsData, value)} disabled={isSaving}>
              <SelectTrigger id="defaultLocale"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English (en)</SelectItem>
                <SelectItem value="es">Español (es)</SelectItem>
                <SelectItem value="fr">Français (fr)</SelectItem>
                {/* Add more common locales */}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="supportedLocalesStr">Supported Locales (comma-separated)</Label>
            <Input id="supportedLocalesStr" name="supportedLocalesStr" value={supportedLocalesStr} onChange={(e) => setSupportedLocalesStr(e.target.value)} placeholder="e.g., en, es, fr" disabled={isSaving} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>SEO & Meta</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="metaTitle">Default Meta Title</Label>
            <Input id="metaTitle" name="metaTitle" value={settings.metaTitle} onChange={handleInputChange} disabled={isSaving} />
          </div>
          <div>
            <Label htmlFor="metaDescription">Default Meta Description</Label>
            <Textarea id="metaDescription" name="metaDescription" value={settings.metaDescription} onChange={handleInputChange} disabled={isSaving} />
          </div>
          <div>
            <Label htmlFor="ogImage">Default OpenGraph Image URL</Label>
            <Input id="ogImage" name="ogImage" value={settings.ogImage} onChange={handleInputChange} disabled={isSaving} />
             {settings.ogImage && <img src={settings.ogImage} alt="OG Image Preview" className="mt-2 h-24 object-contain border p-1" />}
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Contact & Social</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
            <div>
              <Label htmlFor="contactEmail">Contact Email</Label>
              <Input id="contactEmail" name="contactEmail" type="email" value={settings.contactEmail} onChange={handleInputChange} disabled={isSaving} />
            </div>
            <div>
              <Label htmlFor="contactPhone">Contact Phone</Label>
              <Input id="contactPhone" name="contactPhone" value={settings.contactPhone} onChange={handleInputChange} disabled={isSaving} />
            </div>
             <div>
              <Label htmlFor="address">Address</Label>
              <Textarea id="address" name="address" value={settings.address} onChange={handleInputChange} disabled={isSaving} />
            </div>
            <div>
              <Label htmlFor="socialLinksJson">Social Links (JSON format)</Label>
              <Textarea id="socialLinksJson" name="socialLinksJson" value={socialLinksJson} onChange={(e) => setSocialLinksJson(e.target.value)} disabled={isSaving} rows={5} placeholder='{&#10;  "twitter": "https://twitter.com/example",&#10;  "facebook": "https://facebook.com/example"&#10;}' />
            </div>
            <div>
              <Label htmlFor="twitterHandle">Twitter Handle</Label>
              <Input id="twitterHandle" name="twitterHandle" value={settings.twitterHandle} onChange={handleInputChange} disabled={isSaving} placeholder="@yourhandle" />
            </div>
            <div>
              <Label htmlFor="twitterCardType">Twitter Card Type</Label>
               <Select value={settings.twitterCardType || 'summary_large_image'} onValueChange={(value) => handleSelectChange('twitterCardType' as keyof SiteSettingsData, value)} disabled={isSaving}>
                <SelectTrigger id="twitterCardType"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="summary">Summary</SelectItem>
                  <SelectItem value="summary_large_image">Summary with Large Image</SelectItem>
                  <SelectItem value="app">App Card</SelectItem>
                  <SelectItem value="player">Player Card</SelectItem>
                </SelectContent>
              </Select>
            </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Advanced</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="googleAnalyticsId">Google Analytics ID</Label>
            <Input id="googleAnalyticsId" name="googleAnalyticsId" value={settings.googleAnalyticsId} onChange={handleInputChange} disabled={isSaving} />
          </div>
          <div>
            <Label htmlFor="facebookPixelId">Facebook Pixel ID</Label>
            <Input id="facebookPixelId" name="facebookPixelId" value={settings.facebookPixelId} onChange={handleInputChange} disabled={isSaving} />
          </div>
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <Label htmlFor="maintenanceMode" className="text-base">Maintenance Mode</Label>
              <p className="text-sm text-muted-foreground">Temporarily make your site unavailable to visitors.</p>
            </div>
            <Switch
              id="maintenanceMode"
              checked={settings.maintenanceMode}
              onCheckedChange={(checked) => handleSwitchChange('maintenanceMode' as keyof SiteSettingsData, checked)}
              disabled={isSaving}
            />
          </div>
          <div>
            <Label htmlFor="customCss">Custom CSS</Label>
            <Textarea id="customCss" name="customCss" value={settings.customCss} onChange={handleInputChange} disabled={isSaving} rows={6} />
          </div>
          <div>
            <Label htmlFor="customJs">Custom JS (use with caution)</Label>
            <Textarea id="customJs" name="customJs" value={settings.customJs} onChange={handleInputChange} disabled={isSaving} rows={6} />
          </div>
        </CardContent>
      </Card>

      <div className="mt-8 flex justify-end">
        <Button onClick={handleSave} disabled={isSaving || isLoading} size="lg">
          {isSaving ? 'Saving Site Settings...' : 'Save Site Settings'}
        </Button>
      </div>
    </div>
  );
}
