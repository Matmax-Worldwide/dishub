'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  ClockIcon,
  CheckIcon,
  XIcon,
  AlertTriangleIcon,
  UserIcon,
  PackageIcon,
  CalendarIcon,
  RefreshCwIcon,
  EyeIcon
} from 'lucide-react';
import { toast } from 'sonner';

interface PendingRequest {
  id: string;
  type: 'ACTIVATION' | 'CUSTOMIZATION' | 'MODULE_REQUEST' | 'FEATURE_REQUEST';
  title: string;
  description: string;
  tenantName: string;
  tenantId: string;
  requestedBy: string;
  requestedAt: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  status: 'PENDING' | 'IN_REVIEW' | 'APPROVED' | 'REJECTED';
  estimatedHours?: number;
  modules?: string[];
}

export default function PendingRequestsPage() {
  const [requests, setRequests] = useState<PendingRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadRequests = async () => {
    try {
      setLoading(true);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock data
      const mockRequests: PendingRequest[] = [
        {
          id: '1',
          type: 'MODULE_REQUEST',
          title: 'E-commerce Module Activation',
          description: 'Request to activate e-commerce functionality for online store setup',
          tenantName: 'Acme Corporation',
          tenantId: '1',
          requestedBy: 'john.doe@acme.com',
          requestedAt: new Date().toISOString(),
          priority: 'HIGH',
          status: 'PENDING',
          estimatedHours: 8,
          modules: ['ECOMMERCE_ENGINE', 'PAYMENT_GATEWAY']
        },
        {
          id: '2',
          type: 'CUSTOMIZATION',
          title: 'Custom Theme Development',
          description: 'Request for custom theme matching company branding guidelines',
          tenantName: 'Tech Startup',
          tenantId: '2',
          requestedBy: 'admin@techstartup.com',
          requestedAt: new Date(Date.now() - 86400000).toISOString(),
          priority: 'MEDIUM',
          status: 'IN_REVIEW',
          estimatedHours: 24
        },
        {
          id: '3',
          type: 'FEATURE_REQUEST',
          title: 'Advanced Analytics Dashboard',
          description: 'Request for custom analytics dashboard with specific KPIs',
          tenantName: 'Marketing Agency',
          tenantId: '3',
          requestedBy: 'manager@agency.com',
          requestedAt: new Date(Date.now() - 172800000).toISOString(),
          priority: 'LOW',
          status: 'PENDING',
          estimatedHours: 16
        }
      ];
      
      setRequests(mockRequests);
    } catch (error) {
      console.error('Error loading requests:', error);
      toast.error('Failed to load requests');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadRequests();
    setRefreshing(false);
    toast.success('Requests refreshed');
  };

  const handleApprove = async (requestId: string) => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setRequests(prev => prev.map(req => 
        req.id === requestId ? { ...req, status: 'APPROVED' as const } : req
      ));
      
      toast.success('Request approved successfully');
    } catch (error) {
      console.error('Error approving request:', error);
      toast.error('Failed to approve request');
    }
  };

  const handleReject = async (requestId: string) => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setRequests(prev => prev.map(req => 
        req.id === requestId ? { ...req, status: 'REJECTED' as const } : req
      ));
      
      toast.success('Request rejected');
    } catch (error) {
      console.error('Error rejecting request:', error);
      toast.error('Failed to reject request');
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'MODULE_REQUEST':
        return <PackageIcon className="h-4 w-4" />;
      case 'CUSTOMIZATION':
        return <UserIcon className="h-4 w-4" />;
      case 'FEATURE_REQUEST':
        return <AlertTriangleIcon className="h-4 w-4" />;
      default:
        return <ClockIcon className="h-4 w-4" />;
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'MODULE_REQUEST':
        return <Badge className="bg-blue-100 text-blue-800">Module Request</Badge>;
      case 'CUSTOMIZATION':
        return <Badge className="bg-purple-100 text-purple-800">Customization</Badge>;
      case 'FEATURE_REQUEST':
        return <Badge className="bg-green-100 text-green-800">Feature Request</Badge>;
      case 'ACTIVATION':
        return <Badge className="bg-orange-100 text-orange-800">Activation</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'URGENT':
        return <Badge className="bg-red-100 text-red-800">Urgent</Badge>;
      case 'HIGH':
        return <Badge className="bg-orange-100 text-orange-800">High</Badge>;
      case 'MEDIUM':
        return <Badge className="bg-yellow-100 text-yellow-800">Medium</Badge>;
      case 'LOW':
        return <Badge className="bg-gray-100 text-gray-800">Low</Badge>;
      default:
        return <Badge variant="outline">{priority}</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Badge className="bg-yellow-100 text-yellow-800"><ClockIcon className="h-3 w-3 mr-1" />Pending</Badge>;
      case 'IN_REVIEW':
        return <Badge className="bg-blue-100 text-blue-800"><EyeIcon className="h-3 w-3 mr-1" />In Review</Badge>;
      case 'APPROVED':
        return <Badge className="bg-green-100 text-green-800"><CheckIcon className="h-3 w-3 mr-1" />Approved</Badge>;
      case 'REJECTED':
        return <Badge className="bg-red-100 text-red-800"><XIcon className="h-3 w-3 mr-1" />Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading pending requests...</p>
        </div>
      </div>
    );
  }

  const pendingRequests = requests.filter(req => req.status === 'PENDING' || req.status === 'IN_REVIEW');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            📋 Pending Requests
          </h1>
          <p className="text-gray-600 mt-1">
            Review and manage tenant activation and customization requests • {pendingRequests.length} pending
          </p>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleRefresh}
          disabled={refreshing}
        >
          <RefreshCwIcon className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {pendingRequests.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <ClockIcon className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No pending requests</h3>
            <p className="text-gray-500">
              All requests have been processed. Check back later for new submissions.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {pendingRequests.map((request) => (
            <Card key={request.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg flex items-center">
                      {getTypeIcon(request.type)}
                      <span className="ml-2">{request.title}</span>
                    </CardTitle>
                    <CardDescription className="mt-1">
                      {request.tenantName} • Requested by {request.requestedBy}
                    </CardDescription>
                  </div>
                  <div className="flex flex-col items-end space-y-2">
                    {getStatusBadge(request.status)}
                    {getTypeBadge(request.type)}
                    {getPriorityBadge(request.priority)}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-gray-600">{request.description}</p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-3 border-t">
                  <div className="flex items-center space-x-2">
                    <CalendarIcon className="h-4 w-4 text-gray-500" />
                    <div>
                      <div className="text-sm font-medium">Requested</div>
                      <div className="text-xs text-gray-500">
                        {new Date(request.requestedAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  
                  {request.estimatedHours && (
                    <div className="flex items-center space-x-2">
                      <ClockIcon className="h-4 w-4 text-gray-500" />
                      <div>
                        <div className="text-sm font-medium">Estimated</div>
                        <div className="text-xs text-gray-500">
                          {request.estimatedHours} hours
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center space-x-2">
                    <UserIcon className="h-4 w-4 text-gray-500" />
                    <div>
                      <div className="text-sm font-medium">Tenant</div>
                      <div className="text-xs text-gray-500">
                        {request.tenantName}
                      </div>
                    </div>
                  </div>
                </div>

                {request.modules && request.modules.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-sm font-medium text-gray-700">Requested Modules:</div>
                    <div className="flex flex-wrap gap-1">
                      {request.modules.map((module) => (
                        <Badge key={module} variant="outline" className="text-xs">
                          {module.replace('_', ' ')}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {request.status === 'PENDING' && (
                  <div className="flex items-center justify-end space-x-2 pt-4 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleReject(request.id)}
                    >
                      <XIcon className="h-4 w-4 mr-1" />
                      Reject
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleApprove(request.id)}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <CheckIcon className="h-4 w-4 mr-1" />
                      Approve
                    </Button>
                  </div>
                )}

                {request.status === 'IN_REVIEW' && (
                  <div className="flex items-center justify-end pt-4 border-t">
                    <Badge className="bg-blue-100 text-blue-800">
                      <EyeIcon className="h-3 w-3 mr-1" />
                      Currently under review
                    </Badge>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
} 