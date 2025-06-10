'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  SendIcon,
  SaveIcon,
  EyeIcon,
  UsersIcon,
  BellIcon,
  AlertCircleIcon,
  InfoIcon,
  CheckCircleIcon,
  XCircleIcon
} from 'lucide-react';

export default function CreateNotificationPage() {
  const [activeTab, setActiveTab] = useState('compose');
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    type: 'info',
    priority: 'medium',
    recipients: 'all',
    scheduledDate: '',
    scheduledTime: ''
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircleIcon className="h-4 w-4" />;
      case 'warning': return <AlertCircleIcon className="h-4 w-4" />;
      case 'error': return <XCircleIcon className="h-4 w-4" />;
      case 'info': return <InfoIcon className="h-4 w-4" />;
      default: return <BellIcon className="h-4 w-4" />;
    }
  };

  const getTypeBadge = (type: string) => {
    const variants = {
      success: 'bg-green-100 text-green-800',
      warning: 'bg-yellow-100 text-yellow-800',
      error: 'bg-red-100 text-red-800',
      info: 'bg-blue-100 text-blue-800'
    };
    return variants[type as keyof typeof variants] || 'bg-gray-100 text-gray-800';
  };

  const getPriorityBadge = (priority: string) => {
    const variants = {
      high: 'bg-red-100 text-red-800',
      medium: 'bg-yellow-100 text-yellow-800',
      low: 'bg-green-100 text-green-800'
    };
    return variants[priority as keyof typeof variants] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Create Notification</h1>
          <p className="text-gray-600 mt-1">Send notifications to your users</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline">
            <SaveIcon className="h-4 w-4 mr-2" />
            Save Draft
          </Button>
          <Button>
            <SendIcon className="h-4 w-4 mr-2" />
            Send Now
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form */}
        <div className="lg:col-span-2">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="compose">Compose</TabsTrigger>
              <TabsTrigger value="recipients">Recipients</TabsTrigger>
              <TabsTrigger value="schedule">Schedule</TabsTrigger>
            </TabsList>

            <TabsContent value="compose" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Notification Content</CardTitle>
                  <CardDescription>Create your notification message</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="title">Title</Label>
                    <Input
                      id="title"
                      placeholder="Enter notification title..."
                      value={formData.title}
                      onChange={(e) => handleInputChange('title', e.target.value)}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="message">Message</Label>
                    <Textarea
                      id="message"
                      placeholder="Enter your notification message..."
                      value={formData.message}
                      onChange={(e) => handleInputChange('message', e.target.value)}
                      rows={4}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="type">Type</Label>
                      <select 
                        id="type"
                        value={formData.type}
                        onChange={(e) => handleInputChange('type', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="info">Information</option>
                        <option value="success">Success</option>
                        <option value="warning">Warning</option>
                        <option value="error">Error</option>
                      </select>
                    </div>
                    
                    <div>
                      <Label htmlFor="priority">Priority</Label>
                      <select 
                        id="priority"
                        value={formData.priority}
                        onChange={(e) => handleInputChange('priority', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                      </select>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="recipients">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <UsersIcon className="h-5 w-5" />
                    Select Recipients
                  </CardTitle>
                  <CardDescription>Choose who will receive this notification</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Recipient Groups</Label>
                    <div className="space-y-2 mt-2">
                      <label className="flex items-center space-x-2">
                        <input 
                          type="radio" 
                          name="recipients" 
                          value="all"
                          checked={formData.recipients === 'all'}
                          onChange={(e) => handleInputChange('recipients', e.target.value)}
                        />
                        <span>All Users</span>
                        <Badge variant="secondary">25 users</Badge>
                      </label>
                      <label className="flex items-center space-x-2">
                        <input 
                          type="radio" 
                          name="recipients" 
                          value="admins"
                          checked={formData.recipients === 'admins'}
                          onChange={(e) => handleInputChange('recipients', e.target.value)}
                        />
                        <span>Administrators Only</span>
                        <Badge variant="secondary">3 users</Badge>
                      </label>
                      <label className="flex items-center space-x-2">
                        <input 
                          type="radio" 
                          name="recipients" 
                          value="managers"
                          checked={formData.recipients === 'managers'}
                          onChange={(e) => handleInputChange('recipients', e.target.value)}
                        />
                        <span>Managers</span>
                        <Badge variant="secondary">8 users</Badge>
                      </label>
                      <label className="flex items-center space-x-2">
                        <input 
                          type="radio" 
                          name="recipients" 
                          value="employees"
                          checked={formData.recipients === 'employees'}
                          onChange={(e) => handleInputChange('recipients', e.target.value)}
                        />
                        <span>Employees</span>
                        <Badge variant="secondary">14 users</Badge>
                      </label>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="schedule">
              <Card>
                <CardHeader>
                  <CardTitle>Schedule Notification</CardTitle>
                  <CardDescription>Send immediately or schedule for later</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <label className="flex items-center space-x-2">
                      <input type="radio" name="schedule" value="now" defaultChecked />
                      <span>Send immediately</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input type="radio" name="schedule" value="later" />
                      <span>Schedule for later</span>
                    </label>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="scheduledDate">Date</Label>
                      <Input
                        id="scheduledDate"
                        type="date"
                        value={formData.scheduledDate}
                        onChange={(e) => handleInputChange('scheduledDate', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="scheduledTime">Time</Label>
                      <Input
                        id="scheduledTime"
                        type="time"
                        value={formData.scheduledTime}
                        onChange={(e) => handleInputChange('scheduledTime', e.target.value)}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Preview */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <EyeIcon className="h-5 w-5" />
                Preview
              </CardTitle>
              <CardDescription>How your notification will appear</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="p-4 border rounded-lg bg-blue-50/50 border-blue-200">
                <div className="flex items-start space-x-3">
                  <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full">
                    {getTypeIcon(formData.type)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <h3 className="font-semibold text-gray-900">
                        {formData.title || 'Notification Title'}
                      </h3>
                      <Badge className={getPriorityBadge(formData.priority)}>
                        {formData.priority}
                      </Badge>
                      <Badge className={getTypeBadge(formData.type)}>
                        {formData.type}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">
                      {formData.message || 'Your notification message will appear here...'}
                    </p>
                    <div className="flex items-center text-xs text-gray-500">
                      <span>From: System Administrator</span>
                      <span className="mx-2">•</span>
                      <span>Just now</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Delivery Summary</CardTitle>
              <CardDescription>Notification details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Recipients</span>
                <span className="font-medium">
                  {formData.recipients === 'all' ? 'All Users (25)' :
                   formData.recipients === 'admins' ? 'Administrators (3)' :
                   formData.recipients === 'managers' ? 'Managers (8)' :
                   formData.recipients === 'employees' ? 'Employees (14)' : 'Not selected'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Type</span>
                <span className="font-medium capitalize">{formData.type}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Priority</span>
                <span className="font-medium capitalize">{formData.priority}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Delivery</span>
                <span className="font-medium">Immediate</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 