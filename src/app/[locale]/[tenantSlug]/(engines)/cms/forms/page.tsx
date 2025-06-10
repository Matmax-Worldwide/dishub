'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';

import { 
  Plus, 
  Search, 
  Filter, 
  RefreshCw, 
  FileText, 
  Eye, 
  Edit3, 
  Trash2, 
  Copy, 
  Download, 
  MoreVertical,
  AlertCircle,
  Calendar,
  BarChart3,
  Users,
  Activity,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { motion } from 'framer-motion';
import graphqlClient from '@/lib/graphql-client';
import { FormBase, FormInput } from '@/types/forms';

type FormStatus = 'ACTIVE' | 'INACTIVE';

interface ExtendedFormBase extends FormBase {
  status: FormStatus;
  id: string;
}

interface FormWithStats extends ExtendedFormBase {
  submissionCount: number;
  lastSubmissionDate?: string;
  last30DaysCount: number;
  completionRate: number;
}

interface FormStats {
  totalCount: number;
  lastSubmissionDate?: string;
  last30DaysCount: number;
  completionRate: number;
  statusCounts: Array<{
    status: string;
    count: number;
  }>;
}

interface FormUpdateInput extends Partial<FormInput> {
  isActive?: boolean;
}

interface FormCreateResult {
  success: boolean;
  form?: ExtendedFormBase;
  message?: string;
}

interface FormError {
  message: string;
}

export default function FormsPage() {
  const router = useRouter();
  const { locale, tenantSlug } = useParams();
  const [forms, setForms] = useState<FormWithStats[]>([]);
  const [filteredForms, setFilteredForms] = useState<FormWithStats[]>([]);
  const [overallStats, setOverallStats] = useState<{
    totalForms: number;
    totalSubmissions: number;
    activeForms: number;
    avgCompletionRate: number;
    formsCreatedLast30Days: number;
  } | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<FormStatus | 'ALL'>('ALL');
  const [sortBy, setSortBy] = useState<'title' | 'createdAt' | 'submissionCount' | 'lastSubmissionDate'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedForms, setSelectedForms] = useState<string[]>([]);
  const [isShowingBulkActions, setIsShowingBulkActions] = useState(false);
  const [loadingStates, setLoadingStates] = useState<{
    duplicating: string | null;
    deleting: string | null;
    bulkOperating: boolean;
  }>({
    duplicating: null,
    deleting: null,
    bulkOperating: false,
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
  
  // Toast helper function
  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ message, type, show: true });
    setTimeout(() => {
      setToast(prev => ({ ...prev, show: false }));
    }, 4000);
  };
  
  // Fetch forms and stats
  useEffect(() => {
    fetchFormsAndStats();
  }, []);
  
  const fetchFormsAndStats = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Fetch all forms
      const formsData = await graphqlClient.getForms() as FormBase[];
      
      // Fetch stats for each form and map isActive to status
      const formsWithStats = await Promise.all(
        formsData.map(async (form: FormBase) => {
          try {
            const stats = await graphqlClient.getFormSubmissionStats(form.id) as FormStats;
            return {
              ...form,
              status: form.isActive ? 'ACTIVE' : 'INACTIVE' as FormStatus,
              submissionCount: stats?.totalCount || 0,
              lastSubmissionDate: stats?.lastSubmissionDate,
              last30DaysCount: stats?.last30DaysCount || 0,
              completionRate: stats?.completionRate || 0,
            };
          } catch (err) {
            console.warn(`Failed to fetch stats for form ${form.id}:`, err);
            return {
              ...form,
              status: form.isActive ? 'ACTIVE' : 'INACTIVE' as FormStatus,
              submissionCount: 0,
              lastSubmissionDate: undefined,
              last30DaysCount: 0,
              completionRate: 0,
            };
          }
        })
      );
      
      setForms(formsWithStats);
      setFilteredForms(formsWithStats);
      
      // Calculate overall stats
      const totalForms = formsWithStats.length;
      const totalSubmissions = formsWithStats.reduce((sum: number, form: FormWithStats) => sum + form.submissionCount, 0);
      const activeForms = formsWithStats.filter((form: FormWithStats) => form.status === 'ACTIVE').length;
      const avgCompletionRate = totalForms > 0 
        ? formsWithStats.reduce((sum: number, form: FormWithStats) => sum + form.completionRate, 0) / totalForms 
        : 0;
      
      // Forms created in last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const formsCreatedLast30Days = formsWithStats.filter((form: FormWithStats) => 
        form.createdAt && new Date(form.createdAt) > thirtyDaysAgo
      ).length;
      
      setOverallStats({
        totalForms,
        totalSubmissions,
        activeForms,
        avgCompletionRate,
        formsCreatedLast30Days,
      });
      
    } catch (err) {
      console.error('Error fetching forms:', err);
      setError('Failed to load forms. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Filter and sort forms
  useEffect(() => {
    if (!forms.length) return;
    
    let filtered = [...forms];
    
    // Apply status filter
    if (statusFilter !== 'ALL') {
      filtered = filtered.filter(form => form.status === statusFilter);
    }
    
    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(form => 
        form.title.toLowerCase().includes(query) ||
        form.description?.toLowerCase().includes(query) ||
        form.id.toLowerCase().includes(query)
      );
    }
    
    // Apply sorting
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'title':
          comparison = a.title.localeCompare(b.title);
          break;
        case 'createdAt':
          comparison = new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
          break;
        case 'submissionCount':
          comparison = a.submissionCount - b.submissionCount;
          break;
        case 'lastSubmissionDate':
          const aDate = a.lastSubmissionDate ? new Date(a.lastSubmissionDate).getTime() : 0;
          const bDate = b.lastSubmissionDate ? new Date(b.lastSubmissionDate).getTime() : 0;
          comparison = aDate - bDate;
          break;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });
    
    setFilteredForms(filtered);
  }, [forms, searchQuery, statusFilter, sortBy, sortOrder]);
  
  // Handle form selection
  const handleFormSelection = (formId: string, selected: boolean) => {
    if (selected) {
      setSelectedForms(prev => [...prev, formId]);
    } else {
      setSelectedForms(prev => prev.filter(id => id !== formId));
    }
  };
  
  const handleSelectAll = (selected: boolean) => {
    if (selected) {
      setSelectedForms(filteredForms.map(form => form.id));
    } else {
      setSelectedForms([]);
    }
  };
  
  // Handle bulk status change
  const handleBulkStatusChange = async (newStatus: FormStatus) => {
    if (!selectedForms.length) return;
    
    setLoadingStates(prev => ({ ...prev, bulkOperating: true }));
    
    // Store original forms for potential rollback
    const originalForms = forms.filter(f => selectedForms.includes(f.id));
    const isActive = newStatus === 'ACTIVE';
    
    try {
      // Optimistically update the forms
      setForms(prev => prev.map(form => 
        selectedForms.includes(form.id) 
          ? { ...form, status: newStatus, isActive }
          : form
      ));
      setFilteredForms(prev => prev.map(form => 
        selectedForms.includes(form.id) 
          ? { ...form, status: newStatus, isActive }
          : form
      ));
      
      // Update overall stats optimistically
      if (overallStats) {
        const statusChanges = originalForms.reduce((acc, form) => {
          if (form.status !== newStatus) {
            if (newStatus === 'ACTIVE') acc.activating++;
            else acc.deactivating++;
          }
          return acc;
        }, { activating: 0, deactivating: 0 });
        
        setOverallStats(prev => prev ? {
          ...prev,
          activeForms: prev.activeForms + statusChanges.activating - statusChanges.deactivating,
        } : null);
      }
      
      await Promise.all(
        selectedForms.map(formId => graphqlClient.updateForm(formId, { isActive } as FormUpdateInput))
      );
      
      setSelectedForms([]);
      setIsShowingBulkActions(false);
      showToast('Form statuses updated successfully!', 'success');
    } catch (err) {
      const error = err as FormError;
      console.error('Error updating form statuses:', error.message);
      showToast('Failed to update form statuses. Please try again.', 'error');
      
      // Rollback: restore original forms
      setForms(prev => prev.map(form => {
        const original = originalForms.find(o => o.id === form.id);
        return original || form;
      }));
      setFilteredForms(prev => prev.map(form => {
        const original = originalForms.find(o => o.id === form.id);
        return original || form;
      }));
      
      // Rollback stats
      await fetchFormsAndStats();
    } finally {
      setLoadingStates(prev => ({ ...prev, bulkOperating: false }));
    }
  };
  
  const handleBulkDelete = async () => {
    if (!selectedForms.length) return;
    
    const confirmDelete = confirm(`Are you sure you want to delete ${selectedForms.length} form(s)? This action cannot be undone.`);
    if (!confirmDelete) return;
    
    setLoadingStates(prev => ({ ...prev, bulkOperating: true }));
    
    // Store forms for potential rollback
    const formsToDelete = forms.filter(f => selectedForms.includes(f.id));
    
    try {
      // Optimistically remove from the lists
      setForms(prev => prev.filter(f => !selectedForms.includes(f.id)));
      setFilteredForms(prev => prev.filter(f => !selectedForms.includes(f.id)));
      
      // Update overall stats optimistically
      if (overallStats) {
        const deletedStats = formsToDelete.reduce((acc, form) => {
          acc.totalSubmissions += form.submissionCount;
          if (form.status === 'ACTIVE') acc.activeForms++;
          return acc;
        }, { totalSubmissions: 0, activeForms: 0 });
        
        setOverallStats(prev => prev ? {
          ...prev,
          totalForms: prev.totalForms - formsToDelete.length,
          activeForms: prev.activeForms - deletedStats.activeForms,
          totalSubmissions: prev.totalSubmissions - deletedStats.totalSubmissions,
        } : null);
      }
      
      await Promise.all(
        selectedForms.map(formId => graphqlClient.deleteForm(formId))
      );
      
      setSelectedForms([]);
      setIsShowingBulkActions(false);
      showToast('Forms deleted successfully!', 'success');
    } catch (err) {
      console.error('Error deleting forms:', err);
      showToast('Failed to delete forms. Please try again.', 'error');
      
      // Rollback: add the forms back
      setForms(prev => [...formsToDelete, ...prev]);
      setFilteredForms(prev => [...formsToDelete, ...prev]);
      
      // Rollback stats
      await fetchFormsAndStats();
    } finally {
      setLoadingStates(prev => ({ ...prev, bulkOperating: false }));
    }
  };
  
  // Handle duplicate form
  const handleDuplicateForm = async (form: ExtendedFormBase) => {
    setLoadingStates(prev => ({ ...prev, duplicating: form.id }));
    
    try {
      // Create optimistic form entry
      const optimisticForm: FormWithStats = {
        ...form,
        id: `temp-${Date.now()}`, // Temporary ID
        title: `${form.title} (Copy)`,
        slug: `${form.slug}-copy-${Date.now()}`,
        submissionCount: 0,
        lastSubmissionDate: undefined,
        last30DaysCount: 0,
        completionRate: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Optimistically add to the forms list
      setForms(prev => [optimisticForm, ...prev]);
      setFilteredForms(prev => [optimisticForm, ...prev]);

      // Create a new form with only the allowed FormInput fields
      const formInput: FormInput = {
        title: `${form.title} (Copy)`,
        description: form.description,
        slug: `${form.slug}-copy-${Date.now()}`, // Ensure unique slug
        isMultiStep: form.isMultiStep,
        isActive: form.isActive,
        successMessage: form.successMessage,
        redirectUrl: form.redirectUrl,
        submitButtonText: form.submitButtonText,
        submitButtonStyle: form.submitButtonStyle,
        layout: form.layout,
        styling: form.styling,
        pageId: form.pageId,
      };
      
      const result = await graphqlClient.createForm(formInput) as FormCreateResult;
      
      if (!result.success || !result.form) {
        // Remove optimistic entry on failure
        setForms(prev => prev.filter(f => f.id !== optimisticForm.id));
        setFilteredForms(prev => prev.filter(f => f.id !== optimisticForm.id));
        throw new Error(result.message || 'Failed to create form');
      }
      
      // Get the original form's fields
      const originalFormData = await graphqlClient.getFormById(form.id);
      if (originalFormData?.fields && originalFormData.fields.length > 0) {
        // Duplicate all form fields
        await Promise.all(
          originalFormData.fields.map(async (field) => {
            const fieldInput = {
              formId: result.form!.id,
              label: field.label,
              name: field.name,
              type: field.type,
              placeholder: field.placeholder,
              defaultValue: field.defaultValue,
              helpText: field.helpText,
              isRequired: field.isRequired,
              order: field.order,
              options: field.options,
              validationRules: field.validationRules,
              styling: field.styling,
              width: field.width,
            };
            
            try {
              await graphqlClient.createFormField(fieldInput);
            } catch (fieldError) {
              console.warn(`Failed to duplicate field ${field.name}:`, fieldError);
            }
          })
        );
      }

      // Update the optimistic entry with real data
      setForms(prev => prev.map(f => 
        f.id === optimisticForm.id 
          ? { ...result.form!, status: result.form!.isActive ? 'ACTIVE' : 'INACTIVE' as FormStatus, submissionCount: 0, lastSubmissionDate: undefined, last30DaysCount: 0, completionRate: 0 }
          : f
      ));
      setFilteredForms(prev => prev.map(f => 
        f.id === optimisticForm.id 
          ? { ...result.form!, status: result.form!.isActive ? 'ACTIVE' : 'INACTIVE' as FormStatus, submissionCount: 0, lastSubmissionDate: undefined, last30DaysCount: 0, completionRate: 0 }
          : f
      ));
      
      // Navigate to edit the new form
      router.push(`/${locale}/${tenantSlug}/cms/forms/${result.form.id}/edit`);
      showToast('Form duplicated successfully!', 'success');
    } catch (err) {
      const error = err as FormError;
      console.error('Error duplicating form:', error.message);
      showToast('Failed to duplicate form. Please try again.', 'error');
      
      // Remove optimistic entry on error
      setForms(prev => prev.filter(f => !f.id.startsWith('temp-')));
      setFilteredForms(prev => prev.filter(f => !f.id.startsWith('temp-')));
    } finally {
      setLoadingStates(prev => ({ ...prev, duplicating: null }));
    }
  };
  
  const handleDeleteForm = async (formId: string) => {
    const confirmDelete = confirm('Are you sure you want to delete this form? This action cannot be undone.');
    if (!confirmDelete) return;
    
    setLoadingStates(prev => ({ ...prev, deleting: formId }));
    
    // Store the form for potential rollback
    const formToDelete = forms.find(f => f.id === formId);
    if (!formToDelete) return;
    
    try {
      // Optimistically remove from the list
      setForms(prev => prev.filter(f => f.id !== formId));
      setFilteredForms(prev => prev.filter(f => f.id !== formId));
      
      await graphqlClient.deleteForm(formId);
      
      // Update overall stats
      if (overallStats) {
        setOverallStats(prev => prev ? {
          ...prev,
          totalForms: prev.totalForms - 1,
          activeForms: formToDelete.status === 'ACTIVE' ? prev.activeForms - 1 : prev.activeForms,
          totalSubmissions: prev.totalSubmissions - formToDelete.submissionCount,
        } : null);
      }
      
      showToast('Form deleted successfully!', 'success');
    } catch (err) {
      console.error('Error deleting form:', err);
      showToast('Failed to delete form. Please try again.', 'error');
      
      // Rollback: add the form back to the list
      setForms(prev => [formToDelete, ...prev]);
      setFilteredForms(prev => [formToDelete, ...prev]);
    } finally {
      setLoadingStates(prev => ({ ...prev, deleting: null }));
    }
  };
  
  const handleExportForms = () => {
    if (!filteredForms.length) return;
    
    const exportData = filteredForms.map(form => ({
      id: form.id,
      title: form.title,
      description: form.description,
      status: form.status,
      submissionCount: form.submissionCount,
      lastSubmissionDate: form.lastSubmissionDate,
      createdAt: form.createdAt,
      updatedAt: form.updatedAt,
    }));
    
    const csv = [
      ['ID', 'Title', 'Description', 'Status', 'Submissions', 'Last Submission', 'Created', 'Updated'],
      ...exportData.map(form => [
        form.id,
        form.title,
        form.description || '',
        form.status,
        form.submissionCount,
        form.lastSubmissionDate || '',
        form.createdAt || '',
        form.updatedAt || '',
      ])
    ].map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', 'forms-export.csv');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };
  
  const getStatusBadgeColor = (status: FormStatus) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800';
      case 'INACTIVE':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  const getStatusIcon = (status: FormStatus) => {
    switch (status) {
      case 'ACTIVE':
        return <CheckCircle className="h-4 w-4" />;
      case 'INACTIVE':
        return <XCircle className="h-4 w-4" />;
      default:
        return null;
    }
  };
  
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString();
  };
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="flex flex-col items-center">
          <RefreshCw className="h-8 w-8 text-blue-500 animate-spin mb-4" />
          <h2 className="text-xl font-medium text-gray-700">Loading forms...</h2>
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
            <button 
              onClick={fetchFormsAndStats}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 inline-flex items-center"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </button>
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
          className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6"
        >
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Forms Dashboard</h1>
            <p className="text-gray-600">Manage and monitor all your forms</p>
          </div>
          <Link 
            href={`/${locale}/${tenantSlug}/cms/forms/create`}
            className="mt-4 sm:mt-0 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 inline-flex items-center shadow-md hover:shadow-lg transition-all duration-200"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create New Form
          </Link>
        </motion.div>
        
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 flex items-center"
          >
            <div className="bg-blue-100 rounded-full p-3 mr-4">
              <FileText className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <div className="text-2xl font-bold">{overallStats?.totalForms || 0}</div>
              <div className="text-sm text-gray-500">Total Forms</div>
            </div>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 flex items-center"
          >
            <div className="bg-green-100 rounded-full p-3 mr-4">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <div className="text-2xl font-bold">{overallStats?.activeForms || 0}</div>
              <div className="text-sm text-gray-500">Active Forms</div>
            </div>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 }}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 flex items-center"
          >
            <div className="bg-purple-100 rounded-full p-3 mr-4">
              <Users className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <div className="text-2xl font-bold">{overallStats?.totalSubmissions || 0}</div>
              <div className="text-sm text-gray-500">Total Submissions</div>
            </div>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6 }}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 flex items-center"
          >
            <div className="bg-yellow-100 rounded-full p-3 mr-4">
              <BarChart3 className="h-6 w-6 text-yellow-600" />
            </div>
            <div>
              <div className="text-2xl font-bold">{Math.round(overallStats?.avgCompletionRate || 0)}%</div>
              <div className="text-sm text-gray-500">Avg Completion</div>
            </div>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.7 }}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 flex items-center"
          >
            <div className="bg-indigo-100 rounded-full p-3 mr-4">
              <Calendar className="h-6 w-6 text-indigo-600" />
            </div>
            <div>
              <div className="text-2xl font-bold">{overallStats?.formsCreatedLast30Days || 0}</div>
              <div className="text-sm text-gray-500">New (30 days)</div>
            </div>
          </motion.div>
        </div>
        
        {/* Filters and Actions */}
        <div className="bg-white rounded-xl shadow-md border border-gray-200 p-4 mb-6">
          <div className="flex flex-col lg:flex-row justify-between gap-4">
            <div className="flex-1 flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search forms..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div className="flex gap-3">
                <div className="relative">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as FormStatus | 'ALL')}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 appearance-none"
                  >
                    <option value="ALL">All Statuses</option>
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                  </select>
                  <Filter className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                </div>
                
                <div className="relative">
                  <select
                    value={`${sortBy}-${sortOrder}`}
                    onChange={(e) => {
                      const [field, order] = e.target.value.split('-');
                      setSortBy(field as 'title' | 'createdAt' | 'submissionCount' | 'lastSubmissionDate');
                      setSortOrder(order as 'asc' | 'desc');
                    }}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 appearance-none"
                  >
                    <option value="createdAt-desc">Newest First</option>
                    <option value="createdAt-asc">Oldest First</option>
                    <option value="title-asc">Title A-Z</option>
                    <option value="title-desc">Title Z-A</option>
                    <option value="submissionCount-desc">Most Submissions</option>
                    <option value="submissionCount-asc">Least Submissions</option>
                    <option value="lastSubmissionDate-desc">Recent Activity</option>
                  </select>
                  <Activity className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                </div>
              </div>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={fetchFormsAndStats}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 inline-flex items-center"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </button>
              
              <button
                onClick={handleExportForms}
                disabled={!filteredForms.length}
                className={`px-4 py-2 border border-blue-500 text-blue-500 rounded-lg inline-flex items-center 
                  ${!filteredForms.length ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-50'}`}
              >
                <Download className="w-4 h-4 mr-2" />
                Export
              </button>
            </div>
          </div>
          
          {/* Bulk Actions */}
          {isShowingBulkActions && selectedForms.length > 0 && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-blue-800">
                  {selectedForms.length} form(s) selected
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleBulkStatusChange('ACTIVE')}
                    disabled={loadingStates.bulkOperating}
                    className={`px-3 py-1 bg-green-100 text-green-800 rounded-md text-sm hover:bg-green-200 ${loadingStates.bulkOperating ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {loadingStates.bulkOperating ? (
                      <RefreshCw className="h-3 w-3 animate-spin inline mr-1" />
                    ) : null}
                    Activate
                  </button>
                  <button
                    onClick={() => handleBulkStatusChange('INACTIVE')}
                    disabled={loadingStates.bulkOperating}
                    className={`px-3 py-1 bg-gray-100 text-gray-800 rounded-md text-sm hover:bg-gray-200 ${loadingStates.bulkOperating ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {loadingStates.bulkOperating ? (
                      <RefreshCw className="h-3 w-3 animate-spin inline mr-1" />
                    ) : null}
                    Deactivate
                  </button>
                  <button
                    onClick={handleBulkDelete}
                    disabled={loadingStates.bulkOperating}
                    className={`px-3 py-1 bg-red-100 text-red-800 rounded-md text-sm hover:bg-red-200 ${loadingStates.bulkOperating ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {loadingStates.bulkOperating ? (
                      <RefreshCw className="h-3 w-3 animate-spin inline mr-1" />
                    ) : null}
                    Delete
                  </button>
                  <button
                    onClick={() => setIsShowingBulkActions(false)}
                    disabled={loadingStates.bulkOperating}
                    className={`px-3 py-1 bg-gray-100 text-gray-800 rounded-md text-sm hover:bg-gray-200 ${loadingStates.bulkOperating ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Forms Table */}
        <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
          {filteredForms.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={selectedForms.length === filteredForms.length}
                        onChange={(e) => handleSelectAll(e.target.checked)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Form
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Submissions
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Last Activity
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredForms.map((form) => (
                    <tr 
                      key={form.id}
                      className={`hover:bg-gray-50 transition-colors ${
                        form.id.startsWith('temp-') ? 'bg-blue-50 border-l-4 border-blue-400' : ''
                      } ${
                        loadingStates.deleting === form.id ? 'opacity-50' : ''
                      }`}
                    >
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={selectedForms.includes(form.id)}
                          onChange={(e) => handleFormSelection(form.id, e.target.checked)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                              <FileText className="h-5 w-5 text-blue-600" />
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {form.title}
                            </div>
                            {form.description && (
                              <div className="text-sm text-gray-500 truncate max-w-xs">
                                {form.description}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeColor(form.status)}`}>
                          {getStatusIcon(form.status)}
                          <span className="ml-1">{form.status}</span>
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{form.submissionCount}</div>
                        <div className="text-sm text-gray-500">
                          {form.last30DaysCount} in 30 days
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(form.lastSubmissionDate)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(form.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <Link 
                            href={`/${locale}/${tenantSlug}/cms/forms/${form.id}/submissions`}
                            className="text-blue-600 hover:text-blue-900"
                            title="View Submissions"
                          >
                            <Eye className="h-4 w-4" />
                          </Link>
                          <Link 
                            href={`/${locale}/${tenantSlug}/cms/forms/${form.id}/edit`}
                            className="text-gray-600 hover:text-gray-900"
                            title="Edit Form"
                          >
                            <Edit3 className="h-4 w-4" />
                          </Link>
                          <button
                            onClick={() => handleDuplicateForm(form)}
                            disabled={loadingStates.duplicating === form.id}
                            className={`text-gray-600 hover:text-gray-900 ${loadingStates.duplicating === form.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                            title="Duplicate Form"
                          >
                            {loadingStates.duplicating === form.id ? (
                              <RefreshCw className="h-4 w-4 animate-spin" />
                            ) : (
                            <Copy className="h-4 w-4" />
                            )}
                          </button>
                          <button
                            onClick={() => handleDeleteForm(form.id)}
                            disabled={loadingStates.deleting === form.id}
                            className={`text-red-600 hover:text-red-900 ${loadingStates.deleting === form.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                            title="Delete Form"
                          >
                            {loadingStates.deleting === form.id ? (
                              <RefreshCw className="h-4 w-4 animate-spin" />
                            ) : (
                            <Trash2 className="h-4 w-4" />
                            )}
                          </button>
                          <button
                            onClick={() => setIsShowingBulkActions(true)}
                            className="text-gray-600 hover:text-gray-900"
                            title="More Actions"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8 text-center">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No forms found</h3>
              <p className="text-gray-500 mb-4">
                {searchQuery
                  ? 'No forms match your search criteria'
                  : 'Get started by creating your first form'}
              </p>
              <Link
                href={`/${locale}/${tenantSlug}/cms/forms/create`}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create New Form
              </Link>
            </div>
          )}
        </div>
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
            {toast.type === 'info' && <AlertCircle className="h-5 w-5 mr-2" />}
            <span>{toast.message}</span>
      </div>
        </motion.div>
      )}
    </motion.div>
  );
}