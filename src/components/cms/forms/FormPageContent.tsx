'use client';

import { useState, useEffect } from 'react';
import graphqlClient from '@/lib/graphql-client';
import { FormBase } from '@/types/forms';

import { FormPageHeader } from './FormPageHeader';
import { FormToolbar } from './FormToolbar';
import { FormsGridView } from './FormsGridView';
import { FormsListView } from './FormsListView';
import { FormEmptyState } from './FormEmptyState';
import { FormLoading } from './FormLoading';

export function FormPageContent() {
  const [forms, setForms] = useState<FormBase[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortField, setSortField] = useState<'title' | 'createdAt'>('createdAt');
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

  // Handle form deletion
  const handleDeleteForm = async (id: string, title: string) => {
    if (!window.confirm(`Are you sure you want to delete the form "${title}"?`)) {
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

  // Handle duplicating a form
  const handleDuplicateForm = async (form: FormBase) => {
    try {
      const newFormInput = {
        title: `${form.title} (Copy)`,
        description: form.description,
        slug: `${form.slug}-copy-${Date.now().toString().slice(-6)}`,
        isMultiStep: form.isMultiStep,
        isActive: form.isActive,
        successMessage: form.successMessage,
        redirectUrl: form.redirectUrl,
        submitButtonText: form.submitButtonText,
        submitButtonStyle: form.submitButtonStyle,
        layout: form.layout,
        styling: form.styling,
        pageId: form.pageId
      };

      const result = await graphqlClient.createForm(newFormInput);
      if (result.success && result.form) {
        setForms([...forms, result.form]);
        alert('Form duplicated successfully');
      } else {
        alert(`Failed to duplicate form: ${result.message}`);
      }
    } catch (error) {
      console.error('Error duplicating form:', error);
      alert('An error occurred while duplicating the form. Please try again.');
    }
  };

  // Toggle sort direction or change sort field
  const handleSort = (field: 'title' | 'createdAt') => {
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
    } else {
      // Sort by createdAt
      const dateA = new Date(a.createdAt || '').getTime();
      const dateB = new Date(b.createdAt || '').getTime();
      return sortDirection === 'asc' ? dateA - dateB : dateB - dateA;
    }
  });

  return (
    <div className="container mx-auto py-8 px-4">
      <FormPageHeader />

      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        {/* Toolbar */}
        <FormToolbar 
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          viewMode={viewMode}
          setViewMode={setViewMode}
          sortField={sortField}
          sortDirection={sortDirection}
          handleSort={handleSort}
        />

        {/* Content */}
        {loading ? (
          <FormLoading />
        ) : sortedForms.length > 0 ? (
          viewMode === 'grid' ? (
            <FormsGridView 
              forms={sortedForms} 
              onDuplicate={handleDuplicateForm} 
              onDelete={handleDeleteForm} 
            />
          ) : (
            <FormsListView 
              forms={sortedForms} 
              onDuplicate={handleDuplicateForm} 
              onDelete={handleDeleteForm} 
            />
          )
        ) : (
          <FormEmptyState searchQuery={searchQuery} />
        )}
      </div>
    </div>
  );
} 