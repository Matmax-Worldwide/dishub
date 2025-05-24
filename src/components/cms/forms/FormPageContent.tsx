'use client';

import { useState, useEffect } from 'react';
import graphqlClient from '@/lib/graphql-client';
import { FormBase } from '@/types/forms';
import { useRouter } from 'next/navigation';

import { FormPageHeader } from './FormPageHeader';
import { FormToolbar } from './FormToolbar';
import { FormsGridView } from './FormsGridView';
import { FormsListView } from './FormsListView';
import { FormEmptyState } from './FormEmptyState';
import { FormLoading } from './FormLoading';

export function FormPageContent() {
  const router = useRouter();
  const [forms, setForms] = useState<FormBase[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortField, setSortField] = useState<'title' | 'createdAt' | 'updatedAt'>('createdAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Load forms on component mount
  useEffect(() => {
    loadForms();
  }, []);

  async function loadForms() {
    setLoading(true);
    try {
      const formsList = await graphqlClient.getForms();
      setForms(formsList);
    } catch (error) {
      console.error('Error loading forms:', error);
    } finally {
      setLoading(false);
    }
  }

  // Navigate to create form page
  const handleCreateForm = () => {
    router.push('/cms/forms/new');
  };

  // Handle search change
  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
  };

  // Handle view mode change
  const handleViewModeChange = (mode: 'grid' | 'list') => {
    setViewMode(mode);
  };
  
  // Clear search query
  const handleClearSearch = () => {
    setSearchQuery('');
  };

  // Handle editing a form
  const handleEditForm = (id: string) => {
    router.push(`/cms/forms/edit/${id}`);
  };

  // Handle viewing form submissions
  const handleViewSubmissions = (id: string) => {
    router.push(`/cms/forms/submissions/${id}`);
  };

  // Handle form deletion
  const handleDeleteForm = async (id: string) => {
    const form = forms.find(f => f.id === id);
    if (!form) return;

    if (!window.confirm(`Are you sure you want to delete the form "${form.title}"?`)) {
      return;
    }

    try {
      const result = await graphqlClient.deleteForm(id);
      if (result.success) {
        setForms(forms.filter(form => form.id !== id));
      } else {
        alert(`Failed to delete form: ${result.message}`);
      }
    } catch (error) {
      console.error('Error deleting form:', error);
      alert('An error occurred while deleting the form. Please try again.');
    }
  };

  // Handle sort change
  const handleSort = (field: 'title' | 'createdAt' | 'updatedAt') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Filter forms based on search query
  const filteredForms = forms.filter(form => 
    form.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (form.description && form.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Sort filtered forms
  const sortedForms = [...filteredForms].sort((a, b) => {
    if (sortField === 'title') {
      return sortDirection === 'asc'
        ? a.title.localeCompare(b.title)
        : b.title.localeCompare(a.title);
    } else if (sortField === 'updatedAt') {
      const dateA = new Date(a.updatedAt || '').getTime();
      const dateB = new Date(b.updatedAt || '').getTime();
      return sortDirection === 'asc' ? dateA - dateB : dateB - dateA;
    } else {
      // Sort by createdAt
      const dateA = new Date(a.createdAt || '').getTime();
      const dateB = new Date(b.createdAt || '').getTime();
      return sortDirection === 'asc' ? dateA - dateB : dateB - dateA;
    }
  });

  return (
    <div className="container mx-auto py-8 px-4">
      <FormPageHeader 
        title="Forms" 
        onCreateClick={handleCreateForm} 
        createButtonLabel="Create Form" 
      />

      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        {/* Toolbar */}
        <FormToolbar 
          searchQuery={searchQuery}
          viewMode={viewMode}
          onSearchChange={handleSearchChange}
          onViewModeChange={handleViewModeChange}
        />

        {/* Content */}
        {loading ? (
          <FormLoading />
        ) : sortedForms.length > 0 ? (
          viewMode === 'grid' ? (
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
              sortField={sortField}
              sortDirection={sortDirection}
            />
          )
        ) : (
          <FormEmptyState 
            searchQuery={searchQuery} 
            onClearSearch={handleClearSearch}
            onCreateForm={handleCreateForm}
          />
        )}
      </div>
    </div>
  );
} 