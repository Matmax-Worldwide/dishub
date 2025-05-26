'use client';

import React, { useState, useEffect } from 'react';
import { FormBase, FormSubmissionBase, FormSubmissionStats } from '@/types/forms';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart3, 
  Download, 
  Eye, 
  Calendar,
  Users,
  TrendingUp,
  Search,
  MoreVertical,
  Trash2,
  ExternalLink
} from 'lucide-react';
import { toast } from 'sonner';
import graphqlClient from '@/lib/graphql-client';

interface FormResultsProps {
  form: FormBase;
}

export default function FormResults({ form }: FormResultsProps) {
  const [submissions, setSubmissions] = useState<FormSubmissionBase[]>([]);
  const [stats, setStats] = useState<FormSubmissionStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSubmissions, setSelectedSubmissions] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    loadSubmissions();
    loadStats();
  }, [form.id]);

  const loadSubmissions = async () => {
    try {
      setLoading(true);
      const data = await graphqlClient.getFormSubmissions(form.id, 50, 0);
      setSubmissions(data || []);
    } catch (error) {
      console.error('Error loading submissions:', error);
      toast.error('Failed to load form submissions');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const statsData = await graphqlClient.getFormSubmissionStats(form.id);
      setStats(statsData);
    } catch (error) {
      console.error('Error loading stats:', error);
      toast.error('Failed to load form statistics');
    }
  };

  const handleExportSubmissions = async () => {
    try {
      // Create CSV content
      const headers = ['Submission ID', 'Date', 'Status', ...getFieldNames()];
      const csvContent = [
        headers.join(','),
        ...filteredSubmissions.map(submission => [
          submission.id,
          new Date(submission.createdAt || Date.now()).toLocaleDateString(),
          submission.status,
          ...getFieldNames().map(fieldName => {
            const value = submission.data[fieldName];
            return typeof value === 'string' ? `"${value.replace(/"/g, '""')}"` : value || '';
          })
        ].join(','))
      ].join('\n');

      // Download CSV
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `${form.slug}-submissions.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success('Submissions exported successfully');
    } catch (error) {
      console.error('Error exporting submissions:', error);
      toast.error('Failed to export submissions');
    }
  };

  const handleDeleteSubmissions = async () => {
    if (selectedSubmissions.size === 0) return;
    
    if (!confirm(`Are you sure you want to delete ${selectedSubmissions.size} submission(s)?`)) {
      return;
    }

    try {
      await Promise.all(
        Array.from(selectedSubmissions).map(id => 
          graphqlClient.deleteFormSubmission(id)
        )
      );
      
      setSelectedSubmissions(new Set());
      await loadSubmissions();
      await loadStats();
      
      toast.success(`${selectedSubmissions.size} submission(s) deleted successfully`);
    } catch (error) {
      console.error('Error deleting submissions:', error);
      toast.error('Failed to delete submissions');
    }
  };

  const getFieldNames = (): string[] => {
    if (!form.fields) return [];
    return form.fields.map(field => field.name);
  };

  const filteredSubmissions = submissions.filter(submission => {
    const matchesSearch = searchTerm === '' || 
      Object.values(submission.data).some(value => 
        String(value).toLowerCase().includes(searchTerm.toLowerCase())
      );
    
    const matchesStatus = statusFilter === 'all' || submission.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'RECEIVED': return 'bg-blue-100 text-blue-800';
      case 'PROCESSING': return 'bg-yellow-100 text-yellow-800';
      case 'COMPLETED': return 'bg-green-100 text-green-800';
      case 'REJECTED': return 'bg-red-100 text-red-800';
      case 'SPAM': return 'bg-red-100 text-red-800';
      case 'DRAFT': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatFieldValue = (value: unknown): string => {
    if (value === null || value === undefined) return '-';
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    if (Array.isArray(value)) return value.join(', ');
    return String(value);
  };

  return (
    <div className="space-y-6">
      {/* Results Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center">
                <BarChart3 className="w-5 h-5 mr-2" />
                Form Results
              </CardTitle>
              <CardDescription>
                View and analyze responses to your form. Export data or manage individual submissions.
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportSubmissions}
                disabled={filteredSubmissions.length === 0}
              >
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
              {selectedSubmissions.size > 0 && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleDeleteSubmissions}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete ({selectedSubmissions.size})
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Responses</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Last 30 Days</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.last30DaysCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Calendar className="w-6 h-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Avg. per Day</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.totalCount > 0 ? Math.round(stats.last30DaysCount / 30 * 10) / 10 : 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Eye className="w-6 h-6 text-orange-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Completion Rate</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.totalCount > 0 ? '100%' : '0%'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Results Content */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Submissions</CardTitle>
            <div className="flex items-center space-x-2">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search submissions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Status</option>
                <option value="RECEIVED">Received</option>
                <option value="PROCESSING">Processing</option>
                <option value="COMPLETED">Completed</option>
                <option value="REJECTED">Rejected</option>
                <option value="SPAM">Spam</option>
                <option value="DRAFT">Draft</option>
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin h-8 w-8 border-4 border-blue-500 rounded-full border-t-transparent mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading submissions...</p>
            </div>
          ) : filteredSubmissions.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <BarChart3 className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No submissions yet</h3>
              <p className="text-gray-600 mb-4">
                {submissions.length === 0 
                  ? "Your form hasn't received any submissions yet."
                  : "No submissions match your current filters."
                }
              </p>
              {submissions.length === 0 && (
                <Button
                  variant="outline"
                  onClick={() => {
                    const url = `/forms/${form.slug}`;
                    window.open(url, '_blank');
                  }}
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  View Form
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <input
                        type="checkbox"
                        checked={selectedSubmissions.size === filteredSubmissions.length && filteredSubmissions.length > 0}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedSubmissions(new Set(filteredSubmissions.map(s => s.id)));
                          } else {
                            setSelectedSubmissions(new Set());
                          }
                        }}
                        className="rounded border-gray-300"
                      />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    {getFieldNames().slice(0, 3).map(fieldName => (
                      <th key={fieldName} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {form.fields?.find(f => f.name === fieldName)?.label || fieldName}
                      </th>
                    ))}
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredSubmissions.map((submission) => (
                    <tr key={submission.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={selectedSubmissions.has(submission.id)}
                          onChange={(e) => {
                            const newSelected = new Set(selectedSubmissions);
                            if (e.target.checked) {
                              newSelected.add(submission.id);
                            } else {
                              newSelected.delete(submission.id);
                            }
                            setSelectedSubmissions(newSelected);
                          }}
                          className="rounded border-gray-300"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(submission.createdAt || Date.now()).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge className={getStatusColor(submission.status)}>
                          {submission.status}
                        </Badge>
                      </td>
                      {getFieldNames().slice(0, 3).map(fieldName => (
                        <td key={fieldName} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 max-w-xs truncate">
                          {formatFieldValue(submission.data[fieldName])}
                        </td>
                      ))}
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 