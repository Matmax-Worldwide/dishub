'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  FileTextIcon,
  PlusIcon,
  SearchIcon,
  EditIcon,
  CopyIcon,
  TrashIcon,
  EyeIcon,
  MailIcon,
  MessageSquareIcon,
  BellIcon
} from 'lucide-react';

export default function CommunicationTemplatesPage() {
  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const templates = [
    {
      id: 1,
      name: 'Welcome Email',
      description: 'Welcome message for new users',
      type: 'email',
      category: 'onboarding',
      lastModified: '2024-01-15',
      status: 'active',
      usage: 45
    },
    {
      id: 2,
      name: 'Password Reset',
      description: 'Password reset notification',
      type: 'email',
      category: 'security',
      lastModified: '2024-01-14',
      status: 'active',
      usage: 23
    },
    {
      id: 3,
      name: 'System Maintenance',
      description: 'Maintenance notification template',
      type: 'notification',
      category: 'system',
      lastModified: '2024-01-13',
      status: 'active',
      usage: 12
    },
    {
      id: 4,
      name: 'Monthly Report',
      description: 'Monthly report email template',
      type: 'email',
      category: 'reports',
      lastModified: '2024-01-12',
      status: 'draft',
      usage: 0
    },
    {
      id: 5,
      name: 'User Invitation',
      description: 'Invitation to join the platform',
      type: 'email',
      category: 'onboarding',
      lastModified: '2024-01-11',
      status: 'active',
      usage: 67
    }
  ];

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'email': return <MailIcon className="h-4 w-4" />;
      case 'notification': return <BellIcon className="h-4 w-4" />;
      case 'sms': return <MessageSquareIcon className="h-4 w-4" />;
      default: return <FileTextIcon className="h-4 w-4" />;
    }
  };

  const getTypeBadge = (type: string) => {
    const variants = {
      email: 'bg-blue-100 text-blue-800',
      notification: 'bg-purple-100 text-purple-800',
      sms: 'bg-green-100 text-green-800'
    };
    return variants[type as keyof typeof variants] || 'bg-gray-100 text-gray-800';
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      active: 'bg-green-100 text-green-800',
      draft: 'bg-yellow-100 text-yellow-800',
      archived: 'bg-gray-100 text-gray-800'
    };
    return variants[status as keyof typeof variants] || 'bg-gray-100 text-gray-800';
  };

  const getCategoryBadge = (category: string) => {
    const variants = {
      onboarding: 'bg-indigo-100 text-indigo-800',
      security: 'bg-red-100 text-red-800',
      system: 'bg-orange-100 text-orange-800',
      reports: 'bg-teal-100 text-teal-800'
    };
    return variants[category as keyof typeof variants] || 'bg-gray-100 text-gray-800';
  };

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTab = activeTab === 'all' || template.type === activeTab || template.status === activeTab;
    return matchesSearch && matchesTab;
  });

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Message Templates</h1>
          <p className="text-gray-600 mt-1">Create and manage reusable communication templates</p>
        </div>
        <Button>
          <PlusIcon className="h-4 w-4 mr-2" />
          Create Template
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Templates</CardTitle>
            <FileTextIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{templates.length}</div>
            <p className="text-xs text-muted-foreground">All templates</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <FileTextIcon className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {templates.filter(t => t.status === 'active').length}
            </div>
            <p className="text-xs text-muted-foreground">Ready to use</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Email Templates</CardTitle>
            <MailIcon className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {templates.filter(t => t.type === 'email').length}
            </div>
            <p className="text-xs text-muted-foreground">Email templates</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Usage</CardTitle>
            <MessageSquareIcon className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {templates.reduce((sum, t) => sum + t.usage, 0)}
            </div>
            <p className="text-xs text-muted-foreground">Times used</p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <SearchIcon className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search templates by name, description, or category..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">All Templates</TabsTrigger>
          <TabsTrigger value="email">Email</TabsTrigger>
          <TabsTrigger value="notification">Notifications</TabsTrigger>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="draft">Drafts</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Templates ({filteredTemplates.length})</CardTitle>
              <CardDescription>Manage your communication templates</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredTemplates.map((template) => (
                  <div key={template.id} className="p-6 border rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center justify-center w-10 h-10 bg-gray-100 rounded-full">
                          {getTypeIcon(template.type)}
                        </div>
                        <div>
                          <div className="flex items-center space-x-2 mb-1">
                            <h3 className="text-lg font-semibold text-gray-900">{template.name}</h3>
                            <Badge className={getTypeBadge(template.type)}>
                              {template.type}
                            </Badge>
                            <Badge className={getStatusBadge(template.status)}>
                              {template.status}
                            </Badge>
                            <Badge className={getCategoryBadge(template.category)}>
                              {template.category}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{template.description}</p>
                          <div className="flex items-center space-x-4 text-xs text-gray-500">
                            <span>Last modified: {template.lastModified}</span>
                            <span>•</span>
                            <span>Used {template.usage} times</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button variant="ghost" size="sm" title="Preview">
                          <EyeIcon className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" title="Edit">
                          <EditIcon className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" title="Duplicate">
                          <CopyIcon className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" title="Delete">
                          <TrashIcon className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {filteredTemplates.length === 0 && (
                <div className="text-center py-8">
                  <FileTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Templates Found</h3>
                  <p className="text-gray-600 mb-4">No templates match your current filters.</p>
                  <Button>
                    <PlusIcon className="h-4 w-4 mr-2" />
                    Create Your First Template
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 