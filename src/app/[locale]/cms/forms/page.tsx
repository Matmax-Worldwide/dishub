'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FormBase } from '@/types/forms';
import { FormToolbar } from '@/components/cms/forms/FormToolbar';
import { FormsGridView } from '@/components/cms/forms/FormsGridView';
import { FormsListView } from '@/components/cms/forms/FormsListView';
import { FormEmptyState } from '@/components/cms/forms/FormEmptyState';
import { FormLoading } from '@/components/cms/forms/FormLoading';
import graphqlClient from '@/lib/graphql-client';
import { motion, AnimatePresence } from 'framer-motion';
import { PlusIcon, DocumentTextIcon, EyeIcon, ClipboardDocumentListIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';

export default function FormsPage() {
  const router = useRouter();
  const [forms, setForms] = useState<FormBase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'title' | 'updatedAt' | 'createdAt'>('updatedAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    let isMounted = true;
    
    const loadForms = async () => {
      try {
        if (isMounted) setLoading(true);
        setError(null);
        
        const formsList = await graphqlClient.getForms();
        
        if (isMounted) {
          setForms(formsList);
          setLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          setError('Failed to load forms');
          setLoading(false);
          console.error('Error loading forms:', err);
        }
      }
    };
    
    loadForms();
    
    // Cleanup function
    return () => {
      isMounted = false;
    };
  }, []);

  const handleCreateForm = () => {
    router.push('/cms/forms/new');
  };

  const handleEditForm = (formId: string) => {
    router.push(`/cms/forms/edit/${formId}`);
  };

  const handleViewSubmissions = (formId: string) => {
    router.push(`/cms/forms/submissions/${formId}`);
  };

  // These functions can be implemented when the component interfaces support them
  // const handleViewForm = (formId: string) => {
  //   router.push(`/cms/forms/preview/${formId}`);
  // };

  // const handleDuplicateForm = async (form: FormBase) => {
  //   // Implementation for form duplication
  // };

  const handleDeleteForm = async (formId: string) => {
    if (window.confirm('Are you sure you want to delete this form? This action cannot be undone.')) {
      try {
        const result = await graphqlClient.deleteForm(formId);
        
        if (result.success) {
          // Remove the deleted form from the state
          setForms(prevForms => prevForms.filter(form => form.id !== formId));
        } else {
          setError(result.message || 'Failed to delete form');
        }
      } catch (err) {
        setError('An error occurred while deleting the form');
        console.error('Error deleting form:', err);
      }
    }
  };

  // Filter forms based on search query
  const filteredForms = forms.filter(form => 
    form.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (form.description && form.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Sort forms
  const sortedForms = [...filteredForms].sort((a, b) => {
    let aValue, bValue;
    
    if (sortBy === 'title') {
      aValue = a.title.toLowerCase();
      bValue = b.title.toLowerCase();
    } else if (sortBy === 'createdAt') {
      aValue = new Date(a.createdAt || 0).getTime();
      bValue = new Date(b.createdAt || 0).getTime();
    } else {
      aValue = new Date(a.updatedAt || 0).getTime();
      bValue = new Date(b.updatedAt || 0).getTime();
    }
    
    if (sortDirection === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleViewModeChange = (mode: 'grid' | 'list') => {
    setViewMode(mode);
  };

  const handleSort = (field: 'title' | 'updatedAt' | 'createdAt') => {
    if (sortBy === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortDirection('desc');
    }
  };

  // Calculate stats
  const stats = {
    total: forms.length,
    published: Math.floor(forms.length * 0.7), // Placeholder - replace with actual logic
    draft: Math.floor(forms.length * 0.3), // Placeholder - replace with actual logic
    submissions: forms.length * 12 // Placeholder - replace with actual logic
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-4 sm:p-6 lg:p-8"
    >
      <div className="max-w-7xl mx-auto">
        {/* Enhanced Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Forms Manager</h1>
              <p className="text-gray-600">Create, manage, and analyze your forms in one place</p>
            </div>
            
            <Button 
              onClick={handleCreateForm}
              size="lg"
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Create New Form
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <ClipboardDocumentListIcon className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Forms</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                </div>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center">
                <div className="p-3 bg-green-100 rounded-lg">
                  <EyeIcon className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Published</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.published}</p>
                </div>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center">
                <div className="p-3 bg-yellow-100 rounded-lg">
                  <DocumentTextIcon className="h-6 w-6 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Drafts</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.draft}</p>
                </div>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 }}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <ClipboardDocumentListIcon className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Submissions</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.submissions}</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Error Alert */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 shadow-sm"
            >
              <div className="flex items-center">
                <div className="p-2 bg-red-100 rounded-lg mr-3">
                  <svg className="h-5 w-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-medium">Error</h3>
                  <p className="text-sm">{error}</p>
                </div>
                <button 
                  onClick={() => setError(null)}
                  className="ml-auto p-1 hover:bg-red-100 rounded-lg transition-colors"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Main Content */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-2xl border border-gray-200 shadow-xl overflow-hidden"
        >
        <FormToolbar
          searchQuery={searchQuery}
          viewMode={viewMode}
          onSearchChange={handleSearch}
          onViewModeChange={handleViewModeChange}
        />
        
          <AnimatePresence mode="wait">
        {loading ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
          <FormLoading />
              </motion.div>
        ) : sortedForms.length > 0 ? (
              <motion.div
                key="content"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                                 {viewMode === 'grid' ? (
            <FormsGridView
              forms={sortedForms}
              onEdit={handleEditForm}
              onDelete={handleDeleteForm}
              onViewSubmissions={handleViewSubmissions}
            />
          ) : (
            <FormsListView
              forms={sortedForms}
              onEdit={handleEditForm}
              onDelete={handleDeleteForm}
              onViewSubmissions={handleViewSubmissions}
              onSort={handleSort}
              sortField={sortBy}
              sortDirection={sortDirection}
            />
                )}
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3 }}
              >
          <FormEmptyState
            searchQuery={searchQuery}
            onClearSearch={() => setSearchQuery('')}
            onCreateForm={handleCreateForm}
          />
              </motion.div>
        )}
          </AnimatePresence>
        </motion.div>
      </div>
    </motion.div>
  );
}
