import { useState, useEffect } from 'react';
import graphqlClient from '@/lib/graphql-client';
import { FormBase, FormInput } from '@/types/forms';

export function useFormComponent(formId?: string) {
  const [form, setForm] = useState<FormBase | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (formId) {
      loadForm(formId);
    } else {
      setLoading(false);
    }
  }, [formId]);

  const loadForm = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const formData = await graphqlClient.getFormById(id);
      setForm(formData);
    } catch (err) {
      setError('Failed to load form');
      console.error('Error loading form:', err);
    } finally {
      setLoading(false);
    }
  };

  const createForm = async (formData: FormInput) => {
    setLoading(true);
    setError(null);
    try {
      const result = await graphqlClient.createForm(formData);
      if (result.success && result.form) {
        setForm(result.form);
        return { success: true, form: result.form };
      } else {
        setError(result.message || 'Failed to create form');
        return { success: false, error: result.message };
      }
    } catch (err) {
      const errorMessage = 'Failed to create form';
      setError(errorMessage);
      console.error('Error creating form:', err);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const updateForm = async (id: string, formData: Partial<FormInput>) => {
    setLoading(true);
    setError(null);
    try {
      const result = await graphqlClient.updateForm(id, formData);
      if (result.success && result.form) {
        setForm(result.form);
        return { success: true, form: result.form };
      } else {
        setError(result.message || 'Failed to update form');
        return { success: false, error: result.message };
      }
    } catch (err) {
      const errorMessage = 'Failed to update form';
      setError(errorMessage);
      console.error('Error updating form:', err);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const deleteForm = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const result = await graphqlClient.deleteForm(id);
      if (result.success) {
        setForm(null);
        return { success: true };
      } else {
        setError(result.message || 'Failed to delete form');
        return { success: false, error: result.message };
      }
    } catch (err) {
      const errorMessage = 'Failed to delete form';
      setError(errorMessage);
      console.error('Error deleting form:', err);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const attachFormToComponent = async (componentId: string, formId: string) => {
    // This function would handle connecting a form to a specific component
    // Implementation would depend on how components and forms are linked
    console.log(`Attaching form ${formId} to component ${componentId}`);
    return { success: true };
  };

  return {
    form,
    loading,
    error,
    loadForm,
    createForm,
    updateForm,
    deleteForm,
    attachFormToComponent
  };
} 