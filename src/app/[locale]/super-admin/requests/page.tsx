'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import { 
  MessageSquareIcon, 
  ClockIcon, 
  BarChartIcon, 
  PenToolIcon,
  SearchIcon,
  CheckCircleIcon,
  XCircleIcon,
  AlertCircleIcon,
  EyeIcon,
  CalendarIcon,
  UserIcon,
  PackageIcon,
  RefreshCwIcon
} from 'lucide-react';

interface ActivationRequest {
  id: string;
  tenantName: string;
  tenantSlug: string;
  requestType: 'module_activation' | 'feature_request' | 'customization';
  moduleName: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in_review' | 'approved' | 'rejected' | 'completed';
  requestedBy: string;
  requestedAt: string;
  reviewedBy?: string;
  reviewedAt?: string;
  estimatedCost?: number;
  estimatedTime?: string;
}

export default function ActivationRequestsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'in_review' | 'approved' | 'rejected'>('all');
  const [priorityFilter, setPriorityFilter] = useState<'all' | 'low' | 'medium' | 'high' | 'urgent'>('all');

  // Mock data - in real implementation, this would come from GraphQL
  const mockRequests: ActivationRequest[] = [
    {
      id: '1',
      tenantName: 'Wellness Center Pro',
      tenantSlug: 'wellness-center-pro',
      requestType: 'module_activation',
      moduleName: 'E-commerce Engine',
      description: 'Request to activate e-commerce functionality for selling wellness products and supplements online.',
      priority: 'high',
      status: 'pending',
      requestedBy: 'Sarah Johnson',
      requestedAt: '2024-01-15T10:30:00Z',
      estimatedCost: 299,
      estimatedTime: '2-3 business days'
    },
    {
      id: '2',
      tenantName: 'Beauty Salon',
      tenantSlug: 'beauty-salon',
      requestType: 'customization',
      moduleName: 'Booking Engine',
      description: 'Custom booking rules for different service types with variable duration and pricing.',
      priority: 'medium',
      status: 'in_review',
      requestedBy: 'Maria Garcia',
      requestedAt: '2024-01-15T08:15:00Z',
      reviewedBy: 'Admin Team',
      reviewedAt: '2024-01-15T09:00:00Z',
      estimatedCost: 150,
      estimatedTime: '1-2 business days'
    },
    {
      id: '3',
      tenantName: 'Tech Company',
      tenantSlug: 'tech-company',
      requestType: 'module_activation',
      moduleName: 'HRMS Module',
      description: 'Human Resource Management System for employee management, payroll, and performance tracking.',
      priority: 'medium',
      status: 'approved',
      requestedBy: 'John Smith',
      requestedAt: '2024-01-15T06:45:00Z',
      reviewedBy: 'SuperAdmin',
      reviewedAt: '2024-01-15T07:30:00Z',
      estimatedCost: 199,
      estimatedTime: '1 business day'
    },
    {
      id: '4',
      tenantName: 'Restaurant Chain',
      tenantSlug: 'restaurant-chain',
      requestType: 'feature_request',
      moduleName: 'CMS',
      description: 'Multi-location menu management with location-specific pricing and availability.',
      priority: 'low',
      status: 'pending',
      requestedBy: 'David Wilson',
      requestedAt: '2024-01-14T16:20:00Z',
      estimatedCost: 350,
      estimatedTime: '3-5 business days'
    },
    {
      id: '5',
      tenantName: 'Fitness Studio',
      tenantSlug: 'fitness-studio',
      requestType: 'module_activation',
      moduleName: 'Booking Engine',
      description: 'Class scheduling and membership management system.',
      priority: 'urgent',
      status: 'completed',
      requestedBy: 'Lisa Brown',
      requestedAt: '2024-01-14T14:10:00Z',
      reviewedBy: 'SuperAdmin',
      reviewedAt: '2024-01-14T15:00:00Z',
      estimatedCost: 99,
      estimatedTime: 'Same day'
    }
  ];

  const filteredRequests = mockRequests.filter(request => {
    const matchesSearch = request.tenantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         request.moduleName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         request.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || request.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || request.priority === priorityFilter;
    
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-orange-100 text-orange-800">Pending</Badge>;
      case 'in_review':
        return <Badge className="bg-blue-100 text-blue-800">In Review</Badge>;
      case 'approved':
        return <Badge className="bg-green-100 text-green-800">Approved</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800">Rejected</Badge>;
      case 'completed':
        return <Badge className="bg-purple-100 text-purple-800">Completed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return <Badge variant="destructive">Urgent</Badge>;
      case 'high':
        return <Badge className="bg-red-100 text-red-800">High</Badge>;
      case 'medium':
        return <Badge className="bg-yellow-100 text-yellow-800">Medium</Badge>;
      case 'low':
        return <Badge className="bg-gray-100 text-gray-800">Low</Badge>;
      default:
        return <Badge variant="outline">{priority}</Badge>;
    }
  };

  const getRequestTypeIcon = (type: string) => {
    switch (type) {
      case 'module_activation':
        return <PackageIcon className="h-4 w-4" />;
      case 'customization':
        return <PenToolIcon className="h-4 w-4" />;
      case 'feature_request':
        return <MessageSquareIcon className="h-4 w-4" />;
      default:
        return <MessageSquareIcon className="h-4 w-4" />;
    }
  };

  const handleApprove = (requestId: string) => {
    console.log('Approving request:', requestId);
    // In real implementation, this would call the GraphQL mutation
  };

  const handleReject = (requestId: string) => {
    console.log('Rejecting request:', requestId);
    // In real implementation, this would call the GraphQL mutation
  };

  const pendingCount = mockRequests.filter(r => r.status === 'pending').length;
  const inReviewCount = mockRequests.filter(r => r.status === 'in_review').length;
  const totalProcessed = mockRequests.filter(r => ['approved', 'rejected', 'completed'].includes(r.status)).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            🧑‍💻 Activation Requests
          </h1>
          <p className="text-gray-600 mt-1">
            Review and manage tenant module activation requests
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
            {pendingCount} Pending
          </Badge>
          <Button variant="outline">
            <RefreshCwIcon className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
            <ClockIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{pendingCount}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting review
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Review</CardTitle>
            <AlertCircleIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{inReviewCount}</div>
            <p className="text-xs text-muted-foreground">
              Being processed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Processed</CardTitle>
            <BarChartIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalProcessed}</div>
            <p className="text-xs text-muted-foreground">
              Completed requests
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Response Time</CardTitle>
            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2.4h</div>
            <p className="text-xs text-muted-foreground">
              Average processing time
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="all" className="space-y-6">
        <TabsList>
          <TabsTrigger value="all">All Requests</TabsTrigger>
          <TabsTrigger value="pending">Pending ({pendingCount})</TabsTrigger>
          <TabsTrigger value="review">In Review ({inReviewCount})</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
        </TabsList>

        {/* Search and Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <SearchIcon className="h-5 w-5 mr-2" />
              Search & Filter
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Search by tenant, module, or description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex items-center space-x-2">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as 'all' | 'pending' | 'in_review' | 'approved' | 'rejected')}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="in_review">In Review</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
                <select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value as 'all' | 'urgent' | 'high' | 'medium' | 'low')}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Priority</option>
                  <option value="urgent">Urgent</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* All Requests Tab */}
        <TabsContent value="all" className="space-y-6">
          <div className="space-y-4">
            {filteredRequests.map((request) => (
              <Card key={request.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4">
                      <div className="p-2 bg-blue-50 rounded-lg">
                        {getRequestTypeIcon(request.requestType)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h3 className="text-lg font-semibold">{request.moduleName}</h3>
                          {getStatusBadge(request.status)}
                          {getPriorityBadge(request.priority)}
                        </div>
                        <p className="text-gray-600 mb-2">{request.description}</p>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-500">
                          <div className="flex items-center">
                            <UserIcon className="h-4 w-4 mr-1" />
                            {request.tenantName}
                          </div>
                          <div className="flex items-center">
                            <CalendarIcon className="h-4 w-4 mr-1" />
                            {new Date(request.requestedAt).toLocaleDateString()}
                          </div>
                          <div className="flex items-center">
                            <span className="font-medium">Cost: ${request.estimatedCost}</span>
                          </div>
                          <div className="flex items-center">
                            <span className="font-medium">ETA: {request.estimatedTime}</span>
                          </div>
                        </div>
                        {request.reviewedBy && (
                          <div className="mt-2 text-sm text-gray-500">
                            Reviewed by {request.reviewedBy} on {new Date(request.reviewedAt!).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button variant="ghost" size="sm">
                        <EyeIcon className="h-4 w-4" />
                      </Button>
                      {request.status === 'pending' && (
                        <>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleApprove(request.id)}
                            className="text-green-600 border-green-600 hover:bg-green-50"
                          >
                            <CheckCircleIcon className="h-4 w-4 mr-1" />
                            Approve
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleReject(request.id)}
                            className="text-red-600 border-red-600 hover:bg-red-50"
                          >
                            <XCircleIcon className="h-4 w-4 mr-1" />
                            Reject
                          </Button>
                        </>
                      )}
                      {request.status === 'in_review' && (
                        <Button variant="outline" size="sm">
                          Continue Review
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredRequests.length === 0 && (
            <Card>
              <CardContent className="text-center py-12">
                <MessageSquareIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No requests found</h3>
                <p className="text-gray-500">
                  {searchTerm || statusFilter !== 'all' || priorityFilter !== 'all'
                    ? 'Try adjusting your search criteria or filters.'
                    : 'No activation requests at the moment.'
                  }
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Pending Requests Tab */}
        <TabsContent value="pending" className="space-y-6">
          <div className="space-y-4">
            {filteredRequests.filter(r => r.status === 'pending').map((request) => (
              <Card key={request.id} className="hover:shadow-lg transition-shadow border-orange-200">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4">
                      <div className="p-2 bg-orange-50 rounded-lg">
                        {getRequestTypeIcon(request.requestType)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h3 className="text-lg font-semibold">{request.moduleName}</h3>
                          {getPriorityBadge(request.priority)}
                        </div>
                        <p className="text-gray-600 mb-2">{request.description}</p>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-500">
                          <div className="flex items-center">
                            <UserIcon className="h-4 w-4 mr-1" />
                            {request.tenantName}
                          </div>
                          <div className="flex items-center">
                            <CalendarIcon className="h-4 w-4 mr-1" />
                            {new Date(request.requestedAt).toLocaleDateString()}
                          </div>
                          <div className="flex items-center">
                            <span className="font-medium">Cost: ${request.estimatedCost}</span>
                          </div>
                          <div className="flex items-center">
                            <span className="font-medium">ETA: {request.estimatedTime}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleApprove(request.id)}
                        className="text-green-600 border-green-600 hover:bg-green-50"
                      >
                        <CheckCircleIcon className="h-4 w-4 mr-1" />
                        Approve
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleReject(request.id)}
                        className="text-red-600 border-red-600 hover:bg-red-50"
                      >
                        <XCircleIcon className="h-4 w-4 mr-1" />
                        Reject
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* In Review Tab */}
        <TabsContent value="review" className="space-y-6">
          <div className="space-y-4">
            {filteredRequests.filter(r => r.status === 'in_review').map((request) => (
              <Card key={request.id} className="hover:shadow-lg transition-shadow border-blue-200">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4">
                      <div className="p-2 bg-blue-50 rounded-lg">
                        {getRequestTypeIcon(request.requestType)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h3 className="text-lg font-semibold">{request.moduleName}</h3>
                          {getPriorityBadge(request.priority)}
                        </div>
                        <p className="text-gray-600 mb-2">{request.description}</p>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-500">
                          <div className="flex items-center">
                            <UserIcon className="h-4 w-4 mr-1" />
                            {request.tenantName}
                          </div>
                          <div className="flex items-center">
                            <CalendarIcon className="h-4 w-4 mr-1" />
                            {new Date(request.requestedAt).toLocaleDateString()}
                          </div>
                          <div className="flex items-center">
                            <span className="font-medium">Cost: ${request.estimatedCost}</span>
                          </div>
                          <div className="flex items-center">
                            <span className="font-medium">ETA: {request.estimatedTime}</span>
                          </div>
                        </div>
                        {request.reviewedBy && (
                          <div className="mt-2 text-sm text-blue-600">
                            Being reviewed by {request.reviewedBy} since {new Date(request.reviewedAt!).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button variant="outline" size="sm">
                        Continue Review
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Completed Tab */}
        <TabsContent value="completed" className="space-y-6">
          <div className="space-y-4">
            {filteredRequests.filter(r => ['approved', 'rejected', 'completed'].includes(r.status)).map((request) => (
              <Card key={request.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4">
                      <div className="p-2 bg-gray-50 rounded-lg">
                        {getRequestTypeIcon(request.requestType)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h3 className="text-lg font-semibold">{request.moduleName}</h3>
                          {getStatusBadge(request.status)}
                        </div>
                        <p className="text-gray-600 mb-2">{request.description}</p>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-500">
                          <div className="flex items-center">
                            <UserIcon className="h-4 w-4 mr-1" />
                            {request.tenantName}
                          </div>
                          <div className="flex items-center">
                            <CalendarIcon className="h-4 w-4 mr-1" />
                            {new Date(request.requestedAt).toLocaleDateString()}
                          </div>
                          <div className="flex items-center">
                            <span className="font-medium">Cost: ${request.estimatedCost}</span>
                          </div>
                          <div className="flex items-center">
                            <span className="font-medium">ETA: {request.estimatedTime}</span>
                          </div>
                        </div>
                        {request.reviewedBy && (
                          <div className="mt-2 text-sm text-gray-500">
                            Processed by {request.reviewedBy} on {new Date(request.reviewedAt!).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button variant="ghost" size="sm">
                        <EyeIcon className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
} 