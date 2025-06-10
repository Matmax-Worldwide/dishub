'use client';

import React, { useState } from 'react';
import PageHeader from '@/components/PageHeader';
import { 
  AlertTriangle,
  AlertCircle,
  Clock,
  CheckCircle2,
  X,
  Bell,
  Download,
  Eye,
  User,
  Calendar,
  Building2
} from 'lucide-react';

// Mock alerts data
const mockAlerts = [
  {
    id: 1,
    type: 'critical',
    title: 'Document Deadline Approaching',
    description: 'TechVentures Peru S.A.C. - SUNARP documentation deadline is in 2 days',
    company: 'TechVentures Peru S.A.C.',
    assignedTo: 'María González',
    timestamp: '2025-01-15T10:30:00Z',
    status: 'active',
    priority: 'high',
    category: 'deadline'
  },
  {
    id: 2,
    type: 'blocker',
    title: 'Missing Client Signature',
    description: 'Global Commerce E.I.R.L. - Power of attorney document requires client signature',
    company: 'Global Commerce E.I.R.L.',
    assignedTo: 'Carlos Mendez',
    timestamp: '2025-01-15T09:15:00Z',
    status: 'active',
    priority: 'medium',
    category: 'documentation'
  },
  {
    id: 3,
    type: 'warning',
    title: 'Notary Availability Issue',
    description: 'Innovation Labs S.A. - Preferred notary unavailable, alternative needed',
    company: 'Innovation Labs S.A.',
    assignedTo: 'Ana Vargas',
    timestamp: '2025-01-15T08:45:00Z',
    status: 'active',
    priority: 'high',
    category: 'scheduling'
  },
  {
    id: 4,
    type: 'info',
    title: 'New Compliance Requirement',
    description: 'Updated SUNARP requirements for S.A.C. incorporations effective immediately',
    company: 'System Alert',
    assignedTo: 'All Team',
    timestamp: '2025-01-14T16:00:00Z',
    status: 'active',
    priority: 'medium',
    category: 'compliance'
  },
  {
    id: 5,
    type: 'resolved',
    title: 'Document Processing Complete',
    description: 'Digital Solutions S.R.L. - All required documents processed successfully',
    company: 'Digital Solutions S.R.L.',
    assignedTo: 'José Rodriguez',
    timestamp: '2025-01-14T14:20:00Z',
    status: 'resolved',
    priority: 'low',
    category: 'completion'
  }
];

export default function AlertsPage() {
  const [selectedAlert, setSelectedAlert] = useState<typeof mockAlerts[0] | null>(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');

  const filteredAlerts = mockAlerts.filter(alert => {
    const matchesStatus = filterStatus === 'all' || alert.status === filterStatus;
    const matchesType = filterType === 'all' || alert.type === filterType;
    return matchesStatus && matchesType;
  });

  const alertTypeConfig = {
    critical: { color: 'bg-red-100 text-red-700 border-red-200', icon: AlertTriangle },
    blocker: { color: 'bg-orange-100 text-orange-700 border-orange-200', icon: AlertCircle },
    warning: { color: 'bg-yellow-100 text-yellow-700 border-yellow-200', icon: Clock },
    info: { color: 'bg-blue-100 text-blue-700 border-blue-200', icon: Bell },
    resolved: { color: 'bg-green-100 text-green-700 border-green-200', icon: CheckCircle2 }
  };

  const priorityConfig = {
    high: { color: 'bg-red-500', label: 'High' },
    medium: { color: 'bg-yellow-500', label: 'Medium' },
    low: { color: 'bg-green-500', label: 'Low' }
  };

  const getTimeAgo = (timestamp: string) => {
    const now = new Date();
    const alertTime = new Date(timestamp);
    const diffInHours = Math.floor((now.getTime() - alertTime.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    return `${Math.floor(diffInHours / 24)}d ago`;
  };

  return (
    <>
      <PageHeader
        title="Alerts & Blockers"
        description="Monitor system alerts, blockers, and critical notifications"
        onMenuClick={() => {}}
      />

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto p-6">
        {/* Alert Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center">
              <AlertTriangle className="h-8 w-8 text-red-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Critical Alerts</p>
                <p className="text-2xl font-bold text-gray-900">
                  {mockAlerts.filter(a => a.type === 'critical' && a.status === 'active').length}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center">
              <AlertCircle className="h-8 w-8 text-orange-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Blockers</p>
                <p className="text-2xl font-bold text-gray-900">
                  {mockAlerts.filter(a => a.type === 'blocker' && a.status === 'active').length}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-yellow-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Pending</p>
                <p className="text-2xl font-bold text-gray-900">
                  {mockAlerts.filter(a => a.status === 'active').length}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center">
              <CheckCircle2 className="h-8 w-8 text-green-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Resolved Today</p>
                <p className="text-2xl font-bold text-gray-900">
                  {mockAlerts.filter(a => a.status === 'resolved').length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800">Filters</h2>
            <div className="flex items-center space-x-4">
              <select 
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="resolved">Resolved</option>
              </select>
              <select 
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
              >
                <option value="all">All Types</option>
                <option value="critical">Critical</option>
                <option value="blocker">Blockers</option>
                <option value="warning">Warnings</option>
                <option value="info">Info</option>
              </select>
              <button className="flex items-center space-x-2 text-sm text-gray-600 hover:text-gray-800 px-3 py-2 border border-gray-300 rounded-lg">
                <Download className="h-4 w-4" />
                <span>Export</span>
              </button>
            </div>
          </div>
        </div>

        {/* Alerts List */}
        <div className="bg-white rounded-xl shadow-sm">
          <div className="px-6 py-4 border-b">
            <h2 className="text-lg font-semibold text-gray-800">Active Alerts & Blockers</h2>
          </div>
          
          <div className="divide-y divide-gray-200">
            {filteredAlerts.map(alert => {
              const typeConfig = alertTypeConfig[alert.type as keyof typeof alertTypeConfig];
              const priorityColor = priorityConfig[alert.priority as keyof typeof priorityConfig];
              const TypeIcon = typeConfig.icon;

              return (
                <div key={alert.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4">
                      <div className={`p-2 rounded-lg border ${typeConfig.color}`}>
                        <TypeIcon className="h-5 w-5" />
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="font-medium text-gray-900">{alert.title}</h3>
                          <div className="flex items-center space-x-1">
                            <div className={`w-2 h-2 rounded-full ${priorityColor.color}`} />
                            <span className="text-xs text-gray-500">{priorityColor.label}</span>
                          </div>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            alert.status === 'active' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                          }`}>
                            {alert.status}
                          </span>
                        </div>
                        
                        <p className="text-gray-600 mb-3">{alert.description}</p>
                        
                        <div className="flex items-center space-x-6 text-sm text-gray-500">
                          <div className="flex items-center space-x-1">
                            <Building2 className="h-4 w-4" />
                            <span>{alert.company}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <User className="h-4 w-4" />
                            <span>{alert.assignedTo}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Calendar className="h-4 w-4" />
                            <span>{getTimeAgo(alert.timestamp)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2 ml-4">
                      <button 
                        onClick={() => setSelectedAlert(alert)}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                        title="View Details"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      {alert.status === 'active' && (
                        <button 
                          className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg"
                          title="Mark as Resolved"
                        >
                          <CheckCircle2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredAlerts.length === 0 && (
            <div className="p-12 text-center">
              <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No alerts found</h3>
              <p className="text-gray-500">No alerts match your current filters.</p>
            </div>
          )}
        </div>
      </main>

      {/* Alert Detail Modal */}
      {selectedAlert && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold">Alert Details</h3>
                <button 
                  onClick={() => setSelectedAlert(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
            
            <div className="p-6">
              <div className="flex items-start space-x-4 mb-6">
                <div className={`p-3 rounded-lg border ${alertTypeConfig[selectedAlert.type as keyof typeof alertTypeConfig].color}`}>
                  {React.createElement(alertTypeConfig[selectedAlert.type as keyof typeof alertTypeConfig].icon, { className: "h-6 w-6" })}
                </div>
                <div className="flex-1">
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">{selectedAlert.title}</h4>
                  <p className="text-gray-600">{selectedAlert.description}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h5 className="font-medium text-gray-900 mb-2">Alert Information</h5>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Type:</span>
                      <span className="font-medium capitalize">{selectedAlert.type}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Priority:</span>
                      <span className="font-medium capitalize">{selectedAlert.priority}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Status:</span>
                      <span className="font-medium capitalize">{selectedAlert.status}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Category:</span>
                      <span className="font-medium capitalize">{selectedAlert.category}</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h5 className="font-medium text-gray-900 mb-2">Assignment</h5>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Company:</span>
                      <span className="font-medium">{selectedAlert.company}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Assigned To:</span>
                      <span className="font-medium">{selectedAlert.assignedTo}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Created:</span>
                      <span className="font-medium">{getTimeAgo(selectedAlert.timestamp)}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {selectedAlert.status === 'active' && (
                <div className="mt-6 pt-6 border-t flex justify-end space-x-3">
                  <button className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">
                    Reassign
                  </button>
                  <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                    Mark as Resolved
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
} 