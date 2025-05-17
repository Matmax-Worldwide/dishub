'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FormBase } from '@/types/forms';
import { FormPageHeader } from '@/components/cms/forms/FormPageHeader';
import { FormToolbar } from '@/components/cms/forms/FormToolbar';
import { FormsGridView } from '@/components/cms/forms/FormsGridView';
import { FormsListView } from '@/components/cms/forms/FormsListView';
import { FormEmptyState } from '@/components/cms/forms/FormEmptyState';
import { FormLoading } from '@/components/cms/forms/FormLoading';
import graphqlClient from '@/lib/graphql-client';

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
    const loadForms = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const formsList = await graphqlClient.getForms();
        setForms(formsList);
      } catch (err) {
        setError('Failed to load forms');
        console.error('Error loading forms:', err);
      } finally {
        setLoading(false);
      }
    };
    
    loadForms();
  }, []);

  const handleCreateForm = () => {
    router.push('/cms/forms/new');
  };

  const handleEditForm = (formId: string) => {
    router.push(`/cms/forms/edit/${formId}`);
  };

  const handleDeleteForm = async (formId: string) => {
    if (window.confirm('Are you sure you want to delete this form? This action cannot be undone.')) {
      try {
        setLoading(true);
        const result = await graphqlClient.deleteForm(formId);
        
        if (result.success) {
          // Remove the deleted form from the state
          setForms(forms.filter(form => form.id !== formId));
        } else {
          setError(result.message || 'Failed to delete form');
        }
      } catch (err) {
        setError('An error occurred while deleting the form');
        console.error('Error deleting form:', err);
      } finally {
        setLoading(false);
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

  return (
    <div className="container mx-auto py-8 px-4">
      <FormPageHeader 
        title="Forms" 
        onCreateClick={handleCreateForm}
        createButtonLabel="Create Form"
      />
      
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md text-red-600">
          {error}
        </div>
      )}
      
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <FormToolbar
          searchQuery={searchQuery}
          viewMode={viewMode}
          onSearchChange={handleSearch}
          onViewModeChange={handleViewModeChange}
        />
        
        {loading ? (
          <FormLoading />
        ) : sortedForms.length > 0 ? (
          viewMode === 'grid' ? (
            <FormsGridView
              forms={sortedForms}
              onEdit={handleEditForm}
              onDelete={handleDeleteForm}
            />
          ) : (
            <FormsListView
              forms={sortedForms}
              onEdit={handleEditForm}
              onDelete={handleDeleteForm}
              onSort={handleSort}
              sortField={sortBy}
              sortDirection={sortDirection}
            />
          )
        ) : (
          <FormEmptyState
            searchQuery={searchQuery}
            onClearSearch={() => setSearchQuery('')}
            onCreateForm={handleCreateForm}
          />
        )}
      </div>
    </div>
  );
}
