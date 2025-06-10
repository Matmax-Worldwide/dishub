'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  SendIcon, 
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  PackageIcon
} from 'lucide-react';

export default function RequestModulesPage() {
  const [selectedModule, setSelectedModule] = useState('');
  const [justification, setJustification] = useState('');

  const availableModules = [
    { id: 'booking', name: 'Booking Engine', description: 'Appointment and reservation management', price: '$49/month' },
    { id: 'hrms', name: 'HRMS Module', description: 'Human Resource Management System', price: '$79/month' },
    { id: 'interpretation', name: 'Interpretation Engine', description: 'Real-time interpretation services', price: '$99/month' },
    { id: 'analytics', name: 'Advanced Analytics', description: 'Enhanced reporting and analytics', price: '$39/month' },
  ];

  const pendingRequests = [
    { id: 1, module: 'HRMS Module', status: 'pending', requestDate: '2024-01-10', reviewer: 'Admin Team' },
    { id: 2, module: 'Analytics Pro', status: 'approved', requestDate: '2024-01-05', reviewer: 'John Smith' },
    { id: 3, module: 'Booking Engine', status: 'rejected', requestDate: '2024-01-01', reviewer: 'Jane Doe' },
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircleIcon className="h-4 w-4 text-green-500" />;
      case 'rejected': return <XCircleIcon className="h-4 w-4 text-red-500" />;
      case 'pending': return <ClockIcon className="h-4 w-4 text-yellow-500" />;
      default: return <ClockIcon className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      pending: 'bg-yellow-100 text-yellow-800'
    };
    return variants[status as keyof typeof variants] || 'bg-gray-100 text-gray-800';
  };

  const handleSubmitRequest = () => {
    if (selectedModule && justification) {
      alert('Request submitted successfully!');
      setSelectedModule('');
      setJustification('');
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Request Modules</h1>
          <p className="text-gray-600 mt-1">Request access to additional modules for your tenant</p>
        </div>
      </div>

      {/* Request Form */}
      <Card>
        <CardHeader>
          <CardTitle>Submit New Request</CardTitle>
          <CardDescription>Request access to additional modules and features</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="module-select">Select Module</Label>
              <select 
                id="module-select"
                value={selectedModule}
                onChange={(e) => setSelectedModule(e.target.value)}
                className="w-full mt-1 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Choose a module...</option>
                {availableModules.map((module) => (
                  <option key={module.id} value={module.id}>
                    {module.name} - {module.price}
                  </option>
                ))}
              </select>
            </div>

            {selectedModule && (
              <div className="p-4 bg-blue-50 rounded-lg">
                {availableModules.find(m => m.id === selectedModule) && (
                  <div>
                    <h3 className="font-medium text-blue-900">
                      {availableModules.find(m => m.id === selectedModule)?.name}
                    </h3>
                    <p className="text-sm text-blue-700 mt-1">
                      {availableModules.find(m => m.id === selectedModule)?.description}
                    </p>
                    <p className="text-sm font-medium text-blue-900 mt-2">
                      Price: {availableModules.find(m => m.id === selectedModule)?.price}
                    </p>
                  </div>
                )}
              </div>
            )}

            <div>
              <Label htmlFor="justification">Business Justification</Label>
              <Textarea
                id="justification"
                placeholder="Please explain why you need this module and how it will benefit your business..."
                value={justification}
                onChange={(e) => setJustification(e.target.value)}
                rows={4}
                className="mt-1"
              />
            </div>

            <Button 
              onClick={handleSubmitRequest}
              disabled={!selectedModule || !justification}
              className="w-full"
            >
              <SendIcon className="h-4 w-4 mr-2" />
              Submit Request
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Available Modules */}
      <Card>
        <CardHeader>
          <CardTitle>Available Modules</CardTitle>
          <CardDescription>Modules you can request access to</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {availableModules.map((module) => (
              <div key={module.id} className="p-4 border rounded-lg hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <PackageIcon className="h-8 w-8 text-blue-500" />
                    <div>
                      <h3 className="font-medium">{module.name}</h3>
                      <p className="text-sm text-gray-600">{module.description}</p>
                      <p className="text-sm font-medium text-green-600 mt-1">{module.price}</p>
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setSelectedModule(module.id)}
                  >
                    Select
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Request History */}
      <Card>
        <CardHeader>
          <CardTitle>Request History</CardTitle>
          <CardDescription>Your previous module requests and their status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {pendingRequests.map((request) => (
              <div key={request.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  {getStatusIcon(request.status)}
                  <div>
                    <h3 className="font-medium">{request.module}</h3>
                    <p className="text-sm text-gray-600">
                      Requested on {request.requestDate} • Reviewer: {request.reviewer}
                    </p>
                  </div>
                </div>
                <Badge className={getStatusBadge(request.status)}>
                  {request.status}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 