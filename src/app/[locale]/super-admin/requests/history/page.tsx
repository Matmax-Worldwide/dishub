'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { 
  ClipboardListIcon,
  SearchIcon,
  FilterIcon,
  RefreshCwIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  CalendarIcon,
  UserIcon,
  FileTextIcon,
  EyeIcon,
  DownloadIcon
} from 'lucide-react';
import { toast } from 'sonner';
import { SuperAdminClient, RequestHistoryList } from '@/lib/graphql/superAdmin';

interface RequestHistory {
  id: string;
  type: 'MODULE' | 'CUSTOMIZATION' | 'FEATURE' | 'ACTIVATION' | 'SUPPORT';
  title: string;
  description: string;
  tenantId: string; // Keep this for compatibility with existing data structures
  tenantName: string;
  requestedBy: string;
  requestedByEmail: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'COMPLETED' | 'CANCELLED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  estimatedHours?: number;
  actualHours?: number;
  assignedTo?: string;
  notes?: string;
  attachments?: string[];
}

interface RequestHistoryData {
  requests: RequestHistory[];
  totalCount: number;
  stats: {
    totalRequests: number;
    pending?: number;
    approved: number;
    rejected: number;
    completed: number;
    cancelled: number;
    avgCompletionTime: number;
  };
}

export default function SuperAdminRequestHistoryPage() {
  const [data, setData] = useState<RequestHistoryData>({
    requests: [],
    totalCount: 0,
    stats: {
      totalRequests: 0,
      pending: 0,
      approved: 0,
      rejected: 0,
      completed: 0,
      cancelled: 0,
      avgCompletionTime: 0
    }
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Filters and search
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [dateRange, setDateRange] = useState('ALL');

  const loadRequestHistoryData = async () => {
    try {
      setLoading(true);
      
      // Build filter object
      const filter: {
        search?: string;
        type?: string;
        status?: string;
        priority?: string;
        dateRange?: string;
      } = {};
      
      if (searchTerm) filter.search = searchTerm;
      if (typeFilter && typeFilter !== 'ALL') filter.type = typeFilter;
      if (statusFilter && statusFilter !== 'ALL') filter.status = statusFilter;
      if (priorityFilter && priorityFilter !== 'ALL') filter.priority = priorityFilter;
      if (dateRange && dateRange !== 'ALL') filter.dateRange = dateRange;
      
      // Call the GraphQL API
      const response: RequestHistoryList = await SuperAdminClient.getRequestHistory(
        filter,
        { page: 1, pageSize: 50 } // You can add pagination controls later
      );
      
      // Transform the data to match the component's expected format
      const transformedData: RequestHistoryData = {
        requests: response.requests.map(request => ({
          id: request.id,
          type: request.type,
          title: request.title,
          description: request.description,
          tenantId: request.tenantId,
          tenantName: request.tenantName,
          requestedBy: request.requestedBy,
          requestedByEmail: request.requestedByEmail,
          status: request.status,
          priority: request.priority,
          createdAt: request.createdAt,
          updatedAt: request.updatedAt,
          completedAt: request.completedAt,
          estimatedHours: request.estimatedHours,
          actualHours: request.actualHours,
          assignedTo: request.assignedTo,
          notes: request.notes,
          attachments: request.attachments
        })),
        totalCount: response.totalCount,
                 stats: {
           totalRequests: response.stats.totalRequests,
           pending: 'pending' in response.stats ? (response.stats as { pending: number }).pending : 0,
           approved: response.stats.approved,
           rejected: response.stats.rejected,
           completed: response.stats.completed,
           cancelled: response.stats.cancelled,
           avgCompletionTime: response.stats.avgCompletionTime
         }
      };

      setData(transformedData);
    } catch (error) {
      console.error('Error loading request history:', error);
      toast.error('Failed to load request history');
      
             // Fallback to empty data on error
       setData({
         requests: [],
         totalCount: 0,
         stats: {
           totalRequests: 0,
           pending: 0,
           approved: 0,
           rejected: 0,
           completed: 0,
           cancelled: 0,
           avgCompletionTime: 0
         }
       });
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadRequestHistoryData();
    setRefreshing(false);
    toast.success('Request history refreshed');
  };

  const handleSearch = () => {
    // Data will reload automatically due to useEffect dependency on searchTerm
    // This function is kept for the search button click handler
  };

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200"><ClockIcon className="h-3 w-3 mr-1" />Pending</Badge>;
      case 'completed':
        return <Badge className="bg-green-100 text-green-800 border-green-200"><CheckCircleIcon className="h-3 w-3 mr-1" />Completed</Badge>;
      case 'approved':
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200"><CheckCircleIcon className="h-3 w-3 mr-1" />Approved</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800 border-red-200"><XCircleIcon className="h-3 w-3 mr-1" />Rejected</Badge>;
      case 'cancelled':
        return <Badge className="bg-gray-100 text-gray-800 border-gray-200"><XCircleIcon className="h-3 w-3 mr-1" />Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'urgent':
        return <Badge className="bg-red-100 text-red-800">Urgent</Badge>;
      case 'high':
        return <Badge className="bg-orange-100 text-orange-800">High</Badge>;
      case 'medium':
        return <Badge className="bg-yellow-100 text-yellow-800">Medium</Badge>;
      case 'low':
        return <Badge className="bg-green-100 text-green-800">Low</Badge>;
      default:
        return <Badge variant="outline">{priority}</Badge>;
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type.toLowerCase()) {
      case 'module':
        return <Badge className="bg-purple-100 text-purple-800">Module</Badge>;
      case 'customization':
        return <Badge className="bg-blue-100 text-blue-800">Customization</Badge>;
      case 'feature':
        return <Badge className="bg-indigo-100 text-indigo-800">Feature</Badge>;
      case 'activation':
        return <Badge className="bg-green-100 text-green-800">Activation</Badge>;
      case 'support':
        return <Badge className="bg-orange-100 text-orange-800">Support</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const calculateDuration = (startDate: string, endDate?: string) => {
    if (!endDate) return 'N/A';
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffInHours = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60));
    if (diffInHours < 24) return `${diffInHours}h`;
    const days = Math.floor(diffInHours / 24);
    const hours = diffInHours % 24;
    return `${days}d ${hours}h`;
  };

  useEffect(() => {
    loadRequestHistoryData();
  }, [searchTerm, typeFilter, statusFilter, priorityFilter, dateRange]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading request history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            📋 Request History
          </h1>
          <p className="text-gray-600 mt-1">
            View and analyze historical requests • {data.totalCount} requests found
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCwIcon className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button size="sm">
            <DownloadIcon className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-indigo-600">{data.stats.totalRequests}</div>
            <div className="text-sm text-gray-600">Total Requests</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-yellow-600">{data.stats.pending || 0}</div>
            <div className="text-sm text-gray-600">Pending</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{data.stats.completed}</div>
            <div className="text-sm text-gray-600">Completed</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{data.stats.approved}</div>
            <div className="text-sm text-gray-600">Approved</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-red-600">{data.stats.rejected}</div>
            <div className="text-sm text-gray-600">Rejected</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-gray-600">{data.stats.cancelled}</div>
            <div className="text-sm text-gray-600">Cancelled</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">{data.stats.avgCompletionTime}h</div>
            <div className="text-sm text-gray-600">Avg. Completion</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center">
            <FilterIcon className="h-5 w-5 mr-2" />
            Filters & Search
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Search</label>
              <div className="relative">
                <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search requests..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Type</label>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Types</SelectItem>
                  <SelectItem value="MODULE">Module</SelectItem>
                  <SelectItem value="CUSTOMIZATION">Customization</SelectItem>
                  <SelectItem value="FEATURE">Feature</SelectItem>
                  <SelectItem value="ACTIVATION">Activation</SelectItem>
                  <SelectItem value="SUPPORT">Support</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Statuses</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="APPROVED">Approved</SelectItem>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                  <SelectItem value="REJECTED">Rejected</SelectItem>
                  <SelectItem value="CANCELLED">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Priority</label>
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Priorities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Priorities</SelectItem>
                  <SelectItem value="URGENT">Urgent</SelectItem>
                  <SelectItem value="HIGH">High</SelectItem>
                  <SelectItem value="MEDIUM">Medium</SelectItem>
                  <SelectItem value="LOW">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Date Range</label>
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger>
                  <SelectValue placeholder="All Time" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Time</SelectItem>
                  <SelectItem value="TODAY">Today</SelectItem>
                  <SelectItem value="WEEK">This Week</SelectItem>
                  <SelectItem value="MONTH">This Month</SelectItem>
                  <SelectItem value="QUARTER">This Quarter</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-end">
              <Button onClick={handleSearch} className="w-full">
                <SearchIcon className="h-4 w-4 mr-2" />
                Search
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Request History List */}
      <div className="grid gap-4">
        {data.requests.map((request) => (
          <Card key={request.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <ClipboardListIcon className="h-6 w-6 text-indigo-600" />
                  <div>
                    <CardTitle className="text-lg">{request.title}</CardTitle>
                    <CardDescription className="flex items-center space-x-4 mt-1">
                      <span className="flex items-center">
                        <UserIcon className="h-4 w-4 mr-1" />
                        {request.tenantName}
                      </span>
                      <span className="flex items-center">
                        <CalendarIcon className="h-4 w-4 mr-1" />
                        {formatDate(request.createdAt)}
                      </span>
                      {request.completedAt && (
                        <span className="flex items-center">
                          <ClockIcon className="h-4 w-4 mr-1" />
                          Duration: {calculateDuration(request.createdAt, request.completedAt)}
                        </span>
                      )}
                    </CardDescription>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {getTypeBadge(request.type)}
                  {getPriorityBadge(request.priority)}
                  {getStatusBadge(request.status)}
                  <Button variant="outline" size="sm">
                    <EyeIcon className="h-4 w-4 mr-2" />
                    View Details
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-gray-700">{request.description}</p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <h4 className="font-medium text-sm text-gray-600 mb-1">Requested By</h4>
                    <p className="text-sm">{request.requestedBy}</p>
                    <p className="text-xs text-gray-500">{request.requestedByEmail}</p>
                  </div>
                  
                  {request.assignedTo && (
                    <div>
                      <h4 className="font-medium text-sm text-gray-600 mb-1">Assigned To</h4>
                      <p className="text-sm">{request.assignedTo}</p>
                    </div>
                  )}
                  
                  {(request.estimatedHours || request.actualHours) && (
                    <div>
                      <h4 className="font-medium text-sm text-gray-600 mb-1">Hours</h4>
                      <div className="text-sm">
                        {request.estimatedHours && <span>Est: {request.estimatedHours}h</span>}
                        {request.actualHours && <span className="ml-2">Actual: {request.actualHours}h</span>}
                      </div>
                    </div>
                  )}
                </div>
                
                {request.notes && (
                  <div>
                    <h4 className="font-medium text-sm text-gray-600 mb-1">Notes</h4>
                    <p className="text-sm text-gray-700 bg-gray-50 p-2 rounded">{request.notes}</p>
                  </div>
                )}
                
                {request.attachments && request.attachments.length > 0 && (
                  <div>
                    <h4 className="font-medium text-sm text-gray-600 mb-1">Attachments</h4>
                    <div className="flex flex-wrap gap-2">
                      {request.attachments.map((attachment, index) => (
                        <Badge key={index} variant="outline" className="cursor-pointer hover:bg-gray-100">
                          <FileTextIcon className="h-3 w-3 mr-1" />
                          {attachment}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {data.requests.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <ClipboardListIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No requests found</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || typeFilter !== 'ALL' || statusFilter !== 'ALL' || priorityFilter !== 'ALL'
                ? 'Try adjusting your filters to see more results.'
                : 'No request history is available at the moment.'}
            </p>
            {(searchTerm || typeFilter !== 'ALL' || statusFilter !== 'ALL' || priorityFilter !== 'ALL') && (
              <Button 
                variant="outline" 
                onClick={() => {
                  setSearchTerm('');
                  setTypeFilter('ALL');
                  setStatusFilter('ALL');
                  setPriorityFilter('ALL');
                  setDateRange('ALL');
                  loadRequestHistoryData();
                }}
              >
                Clear Filters
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
} 