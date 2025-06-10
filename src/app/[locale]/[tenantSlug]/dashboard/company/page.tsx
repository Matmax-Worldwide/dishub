'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  PenToolIcon, 
  CreditCardIcon,
  SaveIcon,
  EditIcon,
  BuildingIcon,
  MailIcon,
  PhoneIcon,
  GlobeIcon
} from 'lucide-react';

export default function CompanyPage() {
  const [activeTab, setActiveTab] = useState('profile');
  const [isEditing, setIsEditing] = useState(false);

  const companyData = {
    name: 'Acme Corporation',
    description: 'Leading provider of innovative business solutions',
    industry: 'Technology',
    size: '50-100 employees',
    founded: '2020',
    website: 'https://acme.com',
    email: 'contact@acme.com',
    phone: '+1 (555) 123-4567',
    address: '123 Business St, Suite 100, City, State 12345',
    logo: '',
    primaryColor: '#3B82F6',
    secondaryColor: '#10B981'
  };

  const billingInfo = {
    plan: 'Professional',
    status: 'Active',
    nextBilling: '2024-02-15',
    amount: '$299/month',
    paymentMethod: '**** **** **** 1234'
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Company Management</h1>
          <p className="text-gray-600 mt-1">Manage your company profile, branding, and billing</p>
        </div>
        <Button onClick={() => setIsEditing(!isEditing)}>
          <EditIcon className="h-4 w-4 mr-2" />
          {isEditing ? 'Cancel' : 'Edit Profile'}
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="profile">Company Profile</TabsTrigger>
          <TabsTrigger value="branding">Branding & Design</TabsTrigger>
          <TabsTrigger value="billing">Billing & Subscription</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BuildingIcon className="h-5 w-5" />
                Company Information
              </CardTitle>
              <CardDescription>Basic information about your company</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="company-name">Company Name</Label>
                  <Input
                    id="company-name"
                    value={companyData.name}
                    disabled={!isEditing}
                    className={!isEditing ? 'bg-gray-50' : ''}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="industry">Industry</Label>
                  <Input
                    id="industry"
                    value={companyData.industry}
                    disabled={!isEditing}
                    className={!isEditing ? 'bg-gray-50' : ''}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company-size">Company Size</Label>
                  <Input
                    id="company-size"
                    value={companyData.size}
                    disabled={!isEditing}
                    className={!isEditing ? 'bg-gray-50' : ''}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="founded">Founded</Label>
                  <Input
                    id="founded"
                    value={companyData.founded}
                    disabled={!isEditing}
                    className={!isEditing ? 'bg-gray-50' : ''}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={companyData.description}
                  disabled={!isEditing}
                  className={!isEditing ? 'bg-gray-50' : ''}
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="website">Website</Label>
                  <div className="flex">
                    <GlobeIcon className="h-4 w-4 mt-3 mr-2 text-gray-400" />
                    <Input
                      id="website"
                      value={companyData.website}
                      disabled={!isEditing}
                      className={!isEditing ? 'bg-gray-50' : ''}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Contact Email</Label>
                  <div className="flex">
                    <MailIcon className="h-4 w-4 mt-3 mr-2 text-gray-400" />
                    <Input
                      id="email"
                      value={companyData.email}
                      disabled={!isEditing}
                      className={!isEditing ? 'bg-gray-50' : ''}
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <div className="flex">
                    <PhoneIcon className="h-4 w-4 mt-3 mr-2 text-gray-400" />
                    <Input
                      id="phone"
                      value={companyData.phone}
                      disabled={!isEditing}
                      className={!isEditing ? 'bg-gray-50' : ''}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    value={companyData.address}
                    disabled={!isEditing}
                    className={!isEditing ? 'bg-gray-50' : ''}
                  />
                </div>
              </div>

              {isEditing && (
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setIsEditing(false)}>
                    Cancel
                  </Button>
                  <Button onClick={() => setIsEditing(false)}>
                    <SaveIcon className="h-4 w-4 mr-2" />
                    Save Changes
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="branding">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PenToolIcon className="h-5 w-5" />
                Branding & Design
              </CardTitle>
              <CardDescription>Customize your company&apos;s visual identity</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <PenToolIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Brand Customization</h3>
                <p className="text-gray-600">Upload logo, set colors, and customize your brand appearance</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="billing">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCardIcon className="h-5 w-5" />
                Billing & Subscription
              </CardTitle>
              <CardDescription>Manage your subscription and billing information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Current Plan</Label>
                    <div className="flex items-center space-x-2 mt-1">
                      <Badge className="bg-blue-100 text-blue-800">{billingInfo.plan}</Badge>
                      <Badge className="bg-green-100 text-green-800">{billingInfo.status}</Badge>
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Next Billing Date</Label>
                    <p className="text-sm text-gray-600 mt-1">{billingInfo.nextBilling}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Amount</Label>
                    <p className="text-sm text-gray-600 mt-1">{billingInfo.amount}</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Payment Method</Label>
                    <p className="text-sm text-gray-600 mt-1">{billingInfo.paymentMethod}</p>
                  </div>
                  <div className="space-y-2">
                    <Button variant="outline" className="w-full">
                      Update Payment Method
                    </Button>
                    <Button variant="outline" className="w-full">
                      Download Invoice
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 