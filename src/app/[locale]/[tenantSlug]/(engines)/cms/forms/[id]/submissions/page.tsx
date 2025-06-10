'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Download, 
  Eye, 
  Filter, 
  Search, 
  Calendar,
  User,
  Clock,
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  FileText,
  Mail, 
  Phone,
  MapPin,
  Globe,
  Hash,
  Type,
  ToggleLeft,
  Star,
  Paperclip,
  MessageSquare,
  RefreshCw
} from 'lucide-react';
import { motion } from 'framer-motion';
import graphqlClient from '@/lib/graphql-client';
import { FormBase, FormSubmissionBase, SubmissionStatus } from '@/types/forms';

interface RouteParams {
  id: string;
  [key: string]: string | string[] | undefined;
}

export default function FormSubmissionsPage() {
  const params = useParams<RouteParams>();
  const formId = params.id;
  const { locale, tenantSlug } = useParams();
  const [form, setForm] = useState<FormBase | null>(null);
  const [submissions, setSubmissions] = useState<FormSubmissionBase[]>([]);
  const [filteredSubmissions, setFilteredSubmissions] = useState<FormSubmissionBase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<SubmissionStatus | 'ALL'>('ALL');
  const [selectedSubmission, setSelectedSubmission] = useState<FormSubmissionBase | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [loadingStates, setLoadingStates] = useState<{
    updatingStatus: string | null;
  }>({
    updatingStatus: null,
  });
  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'error' | 'info';
    show: boolean;
  }>({
    message: '',
    type: 'info',
    show: false,
  });

  useEffect(() => {
    if (formId) {
      fetchFormAndSubmissions();
    }
  }, [formId]);

  useEffect(() => {
    filterSubmissions();
  }, [submissions, searchQuery, statusFilter]);
  
  const fetchFormAndSubmissions = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Fetch form details
      const formData = await graphqlClient.getFormById(formId);
      if (!formData) {
        setError('Form not found');
        return;
      }
      setForm(formData);
      
      // Fetch submissions
      const submissionsData = await graphqlClient.getFormSubmissions(formId, 100, 0);
      setSubmissions(submissionsData);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load form submissions');
    } finally {
      setLoading(false);
    }
  };
  
  const filterSubmissions = () => {
    let filtered = [...submissions];
    
    // Apply status filter
    if (statusFilter !== 'ALL') {
      filtered = filtered.filter(sub => sub.status === statusFilter);
    }
    
    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(sub => {
        const data = sub.data as Record<string, unknown>;
        return Object.values(data).some(value => 
          String(value).toLowerCase().includes(query)
        );
      });
    }
    
    setFilteredSubmissions(filtered);
  };
  
  const handleStatusChange = async (submissionId: string, newStatus: SubmissionStatus) => {
    // Store original submission for potential rollback
    const originalSubmission = submissions.find(sub => sub.id === submissionId);
    if (!originalSubmission) return;
    
    setLoadingStates(prev => ({ ...prev, updatingStatus: submissionId }));
    
    try {
      // Optimistically update the submission status
      setSubmissions(prev => 
        prev.map(sub => 
          sub.id === submissionId ? { ...sub, status: newStatus } : sub
        )
      );
    
      // Also update the selected submission if it's the one being changed
      if (selectedSubmission?.id === submissionId) {
        setSelectedSubmission(prev => prev ? { ...prev, status: newStatus } : null);
      }
      
      await graphqlClient.updateFormSubmissionStatus(submissionId, newStatus);
      showToast('Submission status updated successfully!', 'success');
    } catch (err) {
      console.error('Error updating status:', err);
      showToast('Failed to update submission status', 'error');
    
      // Rollback: restore original submission
      setSubmissions(prev => 
        prev.map(sub => 
          sub.id === submissionId ? originalSubmission : sub
        )
      );
      
      // Rollback selected submission if needed
      if (selectedSubmission?.id === submissionId) {
        setSelectedSubmission(originalSubmission);
      }
    } finally {
      setLoadingStates(prev => ({ ...prev, updatingStatus: null }));
    }
  };
  
  const getStatusColor = (status: SubmissionStatus) => {
    switch (status) {
      case 'RECEIVED': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'PROCESSING': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'COMPLETED': return 'bg-green-100 text-green-800 border-green-200';
      case 'REJECTED': return 'bg-red-100 text-red-800 border-red-200';
      case 'SPAM': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };
  
  const getStatusIcon = (status: SubmissionStatus) => {
    switch (status) {
      case 'RECEIVED': return <FileText className="h-4 w-4" />;
      case 'PROCESSING': return <Clock className="h-4 w-4" />;
      case 'COMPLETED': return <CheckCircle className="h-4 w-4" />;
      case 'REJECTED': return <XCircle className="h-4 w-4" />;
      case 'SPAM': return <AlertTriangle className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const getFieldIcon = (fieldName: string, value: unknown) => {
    const name = fieldName.toLowerCase();
    if (name.includes('email')) return <Mail className="h-4 w-4 text-blue-500" />;
    if (name.includes('phone')) return <Phone className="h-4 w-4 text-green-500" />;
    if (name.includes('address') || name.includes('location')) return <MapPin className="h-4 w-4 text-red-500" />;
    if (name.includes('website') || name.includes('url')) return <Globe className="h-4 w-4 text-purple-500" />;
    if (name.includes('number') || name.includes('age') || name.includes('quantity')) return <Hash className="h-4 w-4 text-orange-500" />;
    if (name.includes('message') || name.includes('comment') || name.includes('description')) return <MessageSquare className="h-4 w-4 text-indigo-500" />;
    if (name.includes('rating') || name.includes('score')) return <Star className="h-4 w-4 text-yellow-500" />;
    if (name.includes('file') || name.includes('attachment')) return <Paperclip className="h-4 w-4 text-gray-500" />;
    if (typeof value === 'boolean') return <ToggleLeft className="h-4 w-4 text-teal-500" />;
    return <Type className="h-4 w-4 text-gray-400" />;
  };

  const formatValue = (value: unknown): string => {
    if (value === null || value === undefined) return 'No data';
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    if (typeof value === 'object') return JSON.stringify(value, null, 2);
    return String(value);
  };
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const exportSubmissions = () => {
    const csvData = filteredSubmissions.map(sub => {
      const data = sub.data as Record<string, unknown>;
      return {
        'Submission ID': sub.id,
        'Status': sub.status,
        'Submitted At': formatDate(sub.createdAt || ''),
        ...data
      };
    });

    const headers = Object.keys(csvData[0] || {});
    const csvContent = [
      headers.join(','),
      ...csvData.map(row => 
        headers.map(header => `"${String(row[header as keyof typeof row]).replace(/"/g, '""')}"`).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${form?.title || 'form'}-submissions.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Toast helper function
  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ message, type, show: true });
    setTimeout(() => {
      setToast(prev => ({ ...prev, show: false }));
    }, 4000);
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
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-xl shadow-md p-8 text-center">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Error</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <Link 
              href={`/${locale}/${tenantSlug}/cms/forms`} 
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
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
      className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-4 sm:p-6 lg:p-8"
    >
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
          <div>
            <div className="flex items-center mb-2">
            <Link 
                href={`/${locale}/${tenantSlug}/cms/forms`} 
                className="mr-3 p-2 text-gray-500 hover:text-gray-700 hover:bg-white rounded-lg transition-colors"
            >
                <ArrowLeft className="h-5 w-5" />
            </Link>
              <h1 className="text-3xl font-bold text-gray-900">Form Submissions</h1>
            </div>
            <p className="text-gray-600">
              {form?.title} • {filteredSubmissions.length} submission{filteredSubmissions.length !== 1 ? 's' : ''}
            </p>
          </div>
          <button
            onClick={exportSubmissions}
            disabled={!filteredSubmissions.length}
            className={`mt-4 sm:mt-0 px-4 py-2 rounded-lg inline-flex items-center transition-colors ${
              filteredSubmissions.length 
                ? 'bg-green-600 text-white hover:bg-green-700' 
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </button>
        </div>
        
        {/* Filters */}
        <div className="bg-white rounded-xl shadow-md border border-gray-200 p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search submissions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
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
          </div>
        </div>
        
        {/* Submissions Grid */}
          {filteredSubmissions.length > 0 ? (
          <div className="grid gap-6">
                  {filteredSubmissions.map((submission) => (
              <motion.div
                      key={submission.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow"
                    >
                <div className="p-6">
                  {/* Submission Header */}
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <User className="h-5 w-5 text-blue-600" />
                          </div>
                          </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          Submission #{submission.id.slice(-8)}
                        </h3>
                        <div className="flex items-center text-sm text-gray-500">
                          <Calendar className="h-4 w-4 mr-1" />
                          {formatDate(submission.createdAt || '')}
            </div>
        </div>
      </div>
                    <div className="flex items-center space-x-3 mt-3 sm:mt-0">
                      <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(submission.status)}`}>
                        {getStatusIcon(submission.status)}
                        <span className="ml-1 capitalize">{submission.status.toLowerCase()}</span>
                      </div>
                      <select
                        value={submission.status}
                        onChange={(e) => handleStatusChange(submission.id, e.target.value as SubmissionStatus)}
                        disabled={loadingStates.updatingStatus === submission.id}
                        className={`text-sm border border-gray-300 rounded-md px-2 py-1 focus:ring-blue-500 focus:border-blue-500 ${
                          loadingStates.updatingStatus === submission.id ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                      >
                        <option value="RECEIVED">Received</option>
                        <option value="PROCESSING">Processing</option>
                        <option value="COMPLETED">Completed</option>
                        <option value="REJECTED">Rejected</option>
                        <option value="SPAM">Spam</option>
                      </select>
                      {loadingStates.updatingStatus === submission.id && (
                        <RefreshCw className="h-4 w-4 animate-spin text-blue-500" />
                      )}
              <button 
                        onClick={() => {
                          setSelectedSubmission(submission);
                          setShowDetails(true);
                        }}
                        className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              >
                        <Eye className="h-4 w-4" />
              </button>
                    </div>
                  </div>

                  {/* Submission Data Preview */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Object.entries(submission.data as Record<string, unknown>).slice(0, 6).map(([key, value]) => (
                      <div key={key} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                        <div className="flex-shrink-0 mt-0.5">
                          {getFieldIcon(key, value)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 capitalize">
                            {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                          </p>
                          <p className="text-sm text-gray-600 truncate">
                            {formatValue(value)}
                          </p>
                </div>
                      </div>
                    ))}
                  </div>

                  {Object.keys(submission.data as Record<string, unknown>).length > 6 && (
                    <div className="mt-4 text-center">
                      <button
                        onClick={() => {
                          setSelectedSubmission(submission);
                          setShowDetails(true);
                        }}
                        className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                      >
                        View {Object.keys(submission.data as Record<string, unknown>).length - 6} more fields
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-md border border-gray-200 p-12 text-center">
            <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No submissions found</h3>
            <p className="text-gray-600">
              {searchQuery || statusFilter !== 'ALL' 
                ? 'No submissions match your current filters.' 
                : 'This form hasn\'t received any submissions yet.'}
            </p>
                  </div>
                )}

        {/* Submission Details Modal */}
        {showDetails && selectedSubmission && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
            >
              <div className="p-6 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold text-gray-900">
                    Submission Details
                  </h2>
                  <button 
                    onClick={() => setShowDetails(false)}
                    className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
                  >
                    ×
                  </button>
                </div>
              </div>
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
                <div className="grid gap-6">
                  {Object.entries(selectedSubmission.data as Record<string, unknown>).map(([key, value]) => (
                    <div key={key} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center space-x-2 mb-2">
                        {getFieldIcon(key, value)}
                        <h3 className="font-semibold text-gray-900 capitalize">
                          {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                        </h3>
                      </div>
                      <div className="bg-gray-50 rounded-md p-3">
                        <pre className="text-sm text-gray-700 whitespace-pre-wrap font-mono">
                          {formatValue(value)}
                        </pre>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        )}
            </div>
            
      {/* Toast Notification */}
      {toast.show && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          className={`fixed bottom-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg ${
            toast.type === 'success' ? 'bg-green-500 text-white' :
            toast.type === 'error' ? 'bg-red-500 text-white' :
            'bg-blue-500 text-white'
          }`}
        >
          <div className="flex items-center">
            {toast.type === 'success' && <CheckCircle className="h-5 w-5 mr-2" />}
            {toast.type === 'error' && <XCircle className="h-5 w-5 mr-2" />}
            {toast.type === 'info' && <AlertTriangle className="h-5 w-5 mr-2" />}
            <span>{toast.message}</span>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
} 