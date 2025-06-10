'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  PaletteIcon,
  UploadIcon,
  SaveIcon,
  ImageIcon,
  EyeIcon
} from 'lucide-react';

export default function CompanyBrandingPage() {
  const [colors, setColors] = useState({
    primary: '#3B82F6',
    secondary: '#10B981',
    accent: '#F59E0B'
  });

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Branding & Design</h1>
          <p className="text-gray-600 mt-1">Customize your company branding and visual identity</p>
        </div>
        <Button>
          <SaveIcon className="h-4 w-4 mr-2" />
          Save Changes
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Logo Management */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5" />
              Logo Management
            </CardTitle>
            <CardDescription>Upload and manage your company logos</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <ImageIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Company Logo</h3>
              <p className="text-gray-600 mb-4">Upload your main company logo</p>
              <Button>
                <UploadIcon className="h-4 w-4 mr-2" />
                Upload Logo
              </Button>
            </div>
            
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <ImageIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Favicon</h3>
              <p className="text-gray-600 mb-4">Upload your website favicon</p>
              <Button variant="outline">
                <UploadIcon className="h-4 w-4 mr-2" />
                Upload Favicon
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Color Scheme */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PaletteIcon className="h-5 w-5" />
              Color Scheme
            </CardTitle>
            <CardDescription>Define your brand colors</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="primary">Primary Color</Label>
              <div className="flex items-center space-x-2">
                <Input
                  id="primary"
                  type="color"
                  value={colors.primary}
                  onChange={(e) => setColors(prev => ({ ...prev, primary: e.target.value }))}
                  className="w-16 h-10"
                />
                <Input
                  value={colors.primary}
                  onChange={(e) => setColors(prev => ({ ...prev, primary: e.target.value }))}
                  className="flex-1"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="secondary">Secondary Color</Label>
              <div className="flex items-center space-x-2">
                <Input
                  id="secondary"
                  type="color"
                  value={colors.secondary}
                  onChange={(e) => setColors(prev => ({ ...prev, secondary: e.target.value }))}
                  className="w-16 h-10"
                />
                <Input
                  value={colors.secondary}
                  onChange={(e) => setColors(prev => ({ ...prev, secondary: e.target.value }))}
                  className="flex-1"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="accent">Accent Color</Label>
              <div className="flex items-center space-x-2">
                <Input
                  id="accent"
                  type="color"
                  value={colors.accent}
                  onChange={(e) => setColors(prev => ({ ...prev, accent: e.target.value }))}
                  className="w-16 h-10"
                />
                <Input
                  value={colors.accent}
                  onChange={(e) => setColors(prev => ({ ...prev, accent: e.target.value }))}
                  className="flex-1"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Preview */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <EyeIcon className="h-5 w-5" />
              Brand Preview
            </CardTitle>
            <CardDescription>Preview how your branding will look</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <div className="w-24 h-24 bg-gray-200 rounded-lg mx-auto mb-4 flex items-center justify-center">
                <ImageIcon className="h-12 w-12 text-gray-400" />
              </div>
              <h3 className="text-xl font-bold mb-2">Your Company Name</h3>
              <div className="flex justify-center space-x-4 mb-4">
                <div 
                  className="w-8 h-8 rounded-full border-2 border-gray-300"
                  style={{ backgroundColor: colors.primary }}
                  title="Primary Color"
                />
                <div 
                  className="w-8 h-8 rounded-full border-2 border-gray-300"
                  style={{ backgroundColor: colors.secondary }}
                  title="Secondary Color"
                />
                <div 
                  className="w-8 h-8 rounded-full border-2 border-gray-300"
                  style={{ backgroundColor: colors.accent }}
                  title="Accent Color"
                />
              </div>
              <p className="text-gray-600">This is how your branding will appear across the platform</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 