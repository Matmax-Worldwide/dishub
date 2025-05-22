'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Download, 
  Search, 
  Filter, 
  RefreshCw, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Mail, 
  AlertCircle 
} from 'lucide-react';
import { motion } from 'framer-motion';
import graphqlClient from '@/lib/graphql-client';
import { FormSubmissionBase, FormBase, SubmissionStatus } from '@/types/forms';

export default function FormSubmissionsPage() {
  const params = useParams();
  const formId = params.id as string;
  
  const [form, setForm] = useState<FormBase | null>(null);
  const [submissions, setSubmissions] = useState<FormSubmissionBase[]>([]);
  const [filteredSubmissions, setFilteredSubmissions] = useState<FormSubmissionBase[]>([]);
  const [stats, setStats] = useState<{
    totalCount: number;
    statusCounts: Array<{status: SubmissionStatus; count: number}>;
    last30DaysCount: number;
  } | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<SubmissionStatus | 'ALL'>('ALL');
  const [selectedSubmission, setSelectedSubmission] = useState<FormSubmissionBase | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  
  // Fetch form and submissions
  useEffect(() => {
    if (formId) {
      fetchFormAndSubmissions();
    }
  }, [formId]);
  
  const fetchFormAndSubmissions = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Fetch form details
      const formData = await graphqlClient.getFormById(formId);
      if (!formData) {
        setError('Form not found');
        setLoading(false);
        return;
      }
      
      setForm(formData);
      
      // Fetch submissions for this form
      const submissionsData = await graphqlClient.getFormSubmissions(formId);
      setSubmissions(submissionsData);
      setFilteredSubmissions(submissionsData);
      
      // Fetch stats for this form
      const statsData = await graphqlClient.getFormSubmissionStats(formId);
      if (statsData) {
        setStats(statsData);
      }
      
    } catch (err) {
      console.error('Error fetching form submissions:', err);
      setError('Failed to load submissions. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Filter submissions based on search query and status filter
  useEffect(() => {
    if (!submissions.length) return;
    
    let filtered = [...submissions];
    
    // Apply status filter if it's not 'ALL'
    if (statusFilter !== 'ALL') {
      filtered = filtered.filter(submission => submission.status === statusFilter);
    }
    
    // Apply search filter if there's a search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(submission => {
        // Search through the data fields
        const dataValues = Object.values(submission.data || {});
        return dataValues.some(value => 
          String(value).toLowerCase().includes(query)
        );
      });
    }
    
    setFilteredSubmissions(filtered);
  }, [submissions, searchQuery, statusFilter]);
  
  const handleStatusChange = async (submissionId: string, newStatus: SubmissionStatus) => {
    // Implementation would require backend support for updating submission status
    // For now, just show how it would work in the UI
    alert(`Would change submission ${submissionId} status to ${newStatus}`);
    
    // In a real implementation, you would:
    // 1. Call an API to update the status
    // 2. Refresh the submissions data
    // 3. Show success/error notification
    
    // Example of refreshing data after update:
    // await fetchFormAndSubmissions();
  };
  
  const handleExportCSV = () => {
    if (!filteredSubmissions.length) return;
    
    // Get all unique field names from all submissions
    const allFields = new Set<string>();
    filteredSubmissions.forEach(submission => {
      Object.keys(submission.data || {}).forEach(key => allFields.add(key));
    });
    
    // Create CSV header row
    const headers = ['ID', 'Status', 'Created At', ...Array.from(allFields)];
    
    // Create CSV content
    let csv = headers.join(',') + '\n';
    
    filteredSubmissions.forEach(submission => {
      const row = [
        submission.id,
        submission.status,
        submission.createdAt,
      ];
      
      // Add data fields
      allFields.forEach(field => {
        const value = submission.data?.[field] || '';
        // Escape commas and quotes in CSV
        const escapedValue = typeof value === 'string' 
          ? `"${value.replace(/"/g, '""')}"` 
          : value;
        row.push(escapedValue.toString());
      });
      
      csv += row.join(',') + '\n';
    });
    
    // Create download link
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', `${form?.title || 'form'}-submissions.csv`);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };
  
  const viewSubmissionDetails = (submission: FormSubmissionBase) => {
    setSelectedSubmission(submission);
    setIsDetailModalOpen(true);
  };
  
  const getStatusBadgeColor = (status: SubmissionStatus) => {
    switch (status) {
      case 'RECEIVED':
        return 'bg-blue-100 text-blue-800';
      case 'PROCESSING':
        return 'bg-yellow-100 text-yellow-800';
      case 'COMPLETED':
        return 'bg-green-100 text-green-800';
      case 'REJECTED':
        return 'bg-red-100 text-red-800';
      case 'SPAM':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  const getStatusIcon = (status: SubmissionStatus) => {
    switch (status) {
      case 'RECEIVED':
        return <Mail className="h-4 w-4" />;
      case 'PROCESSING':
        return <Clock className="h-4 w-4" />;
      case 'COMPLETED':
        return <CheckCircle className="h-4 w-4" />;
      case 'REJECTED':
        return <XCircle className="h-4 w-4" />;
      case 'SPAM':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return null;
    }
  };
  
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="flex flex-col items-center">
          <RefreshCw className="h-8 w-8 text-blue-500 animate-spin mb-4" />
          <h2 className="text-xl font-medium text-gray-700">Loading submissions...</h2>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-8">
        <div className="max-w-5xl mx-auto bg-white rounded-xl shadow-md p-8">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Error</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <Link 
              href="/cms/forms" 
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 inline-flex items-center"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Forms
            </Link>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-4 sm:p-6 lg:p-8"
    >
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center mb-6">
            <Link 
              href="/cms/forms" 
              className="mr-4 p-3 rounded-xl bg-white shadow-md hover:shadow-lg border border-gray-200 hover:bg-gray-50 transition-all duration-200 group"
            >
              <ArrowLeft className="h-5 w-5 text-gray-600 group-hover:text-gray-800 transition-colors" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{form?.title || 'Form'} Submissions</h1>
              <p className="text-gray-600">View and manage submissions for this form</p>
            </div>
          </div>
        </motion.div>
        
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 flex items-center"
          >
            <div className="bg-blue-100 rounded-full p-3 mr-4">
              <Mail className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <div className="text-2xl font-bold">{stats?.totalCount || submissions.length}</div>
              <div className="text-sm text-gray-500">Total Submissions</div>
            </div>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 flex items-center"
          >
            <div className="bg-green-100 rounded-full p-3 mr-4">
              <Clock className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <div className="text-2xl font-bold">{stats?.last30DaysCount || 0}</div>
              <div className="text-sm text-gray-500">Last 30 Days</div>
            </div>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 }}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 flex items-center"
          >
            <div className="bg-yellow-100 rounded-full p-3 mr-4">
              <CheckCircle className="h-6 w-6 text-yellow-600" />
            </div>
            <div>
              <div className="text-2xl font-bold">
                {stats?.statusCounts.find(s => s.status === 'COMPLETED')?.count || 0}
              </div>
              <div className="text-sm text-gray-500">Completed</div>
            </div>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6 }}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 flex items-center"
          >
            <div className="bg-red-100 rounded-full p-3 mr-4">
              <XCircle className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <div className="text-2xl font-bold">
                {(stats?.statusCounts.find(s => s.status === 'REJECTED')?.count || 0) + 
                 (stats?.statusCounts.find(s => s.status === 'SPAM')?.count || 0)}
              </div>
              <div className="text-sm text-gray-500">Rejected/Spam</div>
            </div>
          </motion.div>
        </div>
        
        {/* Filters and Actions */}
        <div className="bg-white rounded-xl shadow-md border border-gray-200 p-4 mb-6">
          <div className="flex flex-col sm:flex-row justify-between gap-4">
            <div className="flex-1 flex items-center relative">
              <Search className="w-5 h-5 text-gray-400 absolute left-3" />
              <input
                type="text"
                placeholder="Search submissions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div className="flex space-x-3">
              <div className="relative">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as SubmissionStatus | 'ALL')}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 appearance-none"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="RECEIVED">Received</option>
                  <option value="PROCESSING">Processing</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="REJECTED">Rejected</option>
                  <option value="SPAM">Spam</option>
                </select>
                <Filter className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              </div>
              
              <button
                onClick={fetchFormAndSubmissions}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 inline-flex items-center"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </button>
              
              <button
                onClick={handleExportCSV}
                disabled={!filteredSubmissions.length}
                className={`px-4 py-2 border border-blue-500 text-blue-500 rounded-lg inline-flex items-center 
                  ${!filteredSubmissions.length ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-50'}`}
              >
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </button>
            </div>
          </div>
        </div>
        
        {/* Submissions Table */}
        <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
          {filteredSubmissions.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Data Preview
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date Submitted
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredSubmissions.map((submission) => (
                    <tr 
                      key={submission.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {submission.id.substring(0, 8)}...
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {Object.entries(submission.data || {}).slice(0, 2).map(([key, value]) => (
                          <div key={key} className="truncate max-w-xs">
                            <span className="font-medium">{key}:</span> {String(value).substring(0, 30)}
                            {String(value).length > 30 ? '...' : ''}
                          </div>
                        ))}
                        {Object.keys(submission.data || {}).length > 2 && (
                          <div className="text-blue-500 text-xs">
                            + {Object.keys(submission.data || {}).length - 2} more fields
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeColor(submission.status)}`}>
                          {getStatusIcon(submission.status)}
                          <span className="ml-1">{submission.status}</span>
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(submission.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button 
                          onClick={() => viewSubmissionDetails(submission)}
                          className="text-blue-600 hover:text-blue-900 mr-4"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8">
              <Mail className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <h3 className="text-lg font-medium text-gray-900 mb-1">No submissions found</h3>
              <p className="text-gray-500">
                {searchQuery || statusFilter !== 'ALL' 
                  ? 'Try adjusting your filters or search query'
                  : 'This form has not received any submissions yet'}
              </p>
            </div>
          )}
        </div>
      </div>
      
      {/* Submission Detail Modal */}
      {isDetailModalOpen && selectedSubmission && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-900">Submission Details</h3>
              <button 
                onClick={() => setIsDetailModalOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <XCircle className="h-6 w-6" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1">
              <div className="mb-6">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <span className="text-sm text-gray-500">Submission ID:</span>
                    <div className="font-medium">{selectedSubmission.id}</div>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">Date Submitted:</span>
                    <div className="font-medium">{formatDate(selectedSubmission.createdAt)}</div>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">Status:</span>
                    <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-1 ${getStatusBadgeColor(selectedSubmission.status)}`}>
                      {getStatusIcon(selectedSubmission.status)}
                      <span className="ml-1">{selectedSubmission.status}</span>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <h4 className="font-medium text-gray-900 mb-2">Form Data</h4>
                  <div className="space-y-2">
                    {Object.entries(selectedSubmission.data || {}).map(([key, value]) => (
                      <div key={key} className="flex flex-col sm:flex-row sm:items-center py-2 border-b border-gray-200 last:border-0">
                        <span className="font-medium text-gray-700 w-full sm:w-1/3">{key}:</span>
                        <span className="text-gray-900 w-full sm:w-2/3 break-words">
                          {typeof value === 'object' 
                            ? JSON.stringify(value, null, 2) 
                            : String(value)
                          }
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
                
                {selectedSubmission.metadata && Object.keys(selectedSubmission.metadata).length > 0 && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-2">Metadata</h4>
                    <pre className="text-xs overflow-x-auto p-2 bg-gray-100 rounded">
                      {JSON.stringify(selectedSubmission.metadata, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
              
              <div className="border-t pt-4">
                <h4 className="font-medium text-gray-900 mb-2">Change Status</h4>
                <div className="flex flex-wrap gap-2">
                  <button 
                    onClick={() => handleStatusChange(selectedSubmission.id, SubmissionStatus.RECEIVED)}
                    className={`px-3 py-1.5 rounded-md text-sm font-medium inline-flex items-center
                      ${selectedSubmission.status === 'RECEIVED' 
                        ? 'bg-blue-100 text-blue-800 ring-2 ring-blue-200' 
                        : 'bg-gray-100 text-gray-800 hover:bg-blue-50'}`}
                  >
                    <Mail className="h-3.5 w-3.5 mr-1" />
                    Received
                  </button>
                  
                  <button 
                    onClick={() => handleStatusChange(selectedSubmission.id, SubmissionStatus.PROCESSING)}
                    className={`px-3 py-1.5 rounded-md text-sm font-medium inline-flex items-center
                      ${selectedSubmission.status === 'PROCESSING' 
                        ? 'bg-yellow-100 text-yellow-800 ring-2 ring-yellow-200' 
                        : 'bg-gray-100 text-gray-800 hover:bg-yellow-50'}`}
                  >
                    <Clock className="h-3.5 w-3.5 mr-1" />
                    Processing
                  </button>
                  
                  <button 
                    onClick={() => handleStatusChange(selectedSubmission.id, SubmissionStatus.COMPLETED)}
                    className={`px-3 py-1.5 rounded-md text-sm font-medium inline-flex items-center
                      ${selectedSubmission.status === 'COMPLETED' 
                        ? 'bg-green-100 text-green-800 ring-2 ring-green-200' 
                        : 'bg-gray-100 text-gray-800 hover:bg-green-50'}`}
                  >
                    <CheckCircle className="h-3.5 w-3.5 mr-1" />
                    Completed
                  </button>
                  
                  <button 
                    onClick={() => handleStatusChange(selectedSubmission.id, SubmissionStatus.REJECTED)}
                    className={`px-3 py-1.5 rounded-md text-sm font-medium inline-flex items-center
                      ${selectedSubmission.status === 'REJECTED' 
                        ? 'bg-red-100 text-red-800 ring-2 ring-red-200' 
                        : 'bg-gray-100 text-gray-800 hover:bg-red-50'}`}
                  >
                    <XCircle className="h-3.5 w-3.5 mr-1" />
                    Rejected
                  </button>
                  
                  <button 
                    onClick={() => handleStatusChange(selectedSubmission.id, SubmissionStatus.SPAM)}
                    className={`px-3 py-1.5 rounded-md text-sm font-medium inline-flex items-center
                      ${selectedSubmission.status === 'SPAM' 
                        ? 'bg-gray-100 text-gray-800 ring-2 ring-gray-300' 
                        : 'bg-gray-100 text-gray-800 hover:bg-gray-200'}`}
                  >
                    <AlertCircle className="h-3.5 w-3.5 mr-1" />
                    Spam
                  </button>
                </div>
              </div>
            </div>
            
            <div className="p-4 border-t bg-gray-50 flex justify-end">
              <button
                onClick={() => setIsDetailModalOpen(false)}
                className="px-4 py-2 bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200 mr-2"
              >
                Close
              </button>
              <button
                onClick={() => {
                  // Implement export of individual submission
                  const blob = new Blob([JSON.stringify(selectedSubmission, null, 2)], { type: 'application/json' });
                  const url = window.URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.setAttribute('hidden', '');
                  a.setAttribute('href', url);
                  a.setAttribute('download', `submission-${selectedSubmission.id}.json`);
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 inline-flex items-center"
              >
                <Download className="h-4 w-4 mr-2" />
                Export JSON
              </button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
} 