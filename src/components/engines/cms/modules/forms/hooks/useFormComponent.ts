import { useState } from 'react';
import graphqlClient from '@/lib/graphql-client';
import { FormBase, FormInput, FormFieldInput, FormFieldResult } from '@/types/forms';

export function useFormComponent(initialFormId?: string) {
  const [form, setForm] = useState<FormBase | null>(null);
  const [loading, setLoading] = useState(initialFormId ? true : false);
  const [error, setError] = useState<string | null>(null);

  const loadForm = async (id: string) => {
    try {
      setLoading(true);
      setError(null);

      const formData = await graphqlClient.getFormById(id);
      
      if (formData) {
        setForm(formData);
        return formData;
      } else {
        setError('Form not found');
        setForm(null);
        return null;
      }
    } catch (err) {
      setError('Failed to load form data');
      console.error('Error loading form data:', err);
      setForm(null);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // If initialFormId is provided, load the form on hook initialization
  if (initialFormId && !form && !loading && !error) {
    loadForm(initialFormId);
  }

  const createForm = async (formData: FormInput) => {
    try {
      setLoading(true);
      setError(null);

      const result = await graphqlClient.createForm(formData);
      
      if (result.success && result.form) {
        setForm(result.form);
        return { success: true, form: result.form };
      } else {
        setError(result.message || 'Failed to create form');
        return { success: false, error: result.message };
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(`Failed to create form: ${errorMessage}`);
      console.error('Error creating form:', err);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const updateForm = async (id: string, formData: Partial<FormInput>) => {
    try {
      setLoading(true);
      setError(null);

      const result = await graphqlClient.updateForm(id, formData);
      
      if (result.success && result.form) {
        setForm(result.form);
        return { success: true, message: 'Form updated successfully', form: result.form };
      } else {
        setError(result.message || 'Failed to update form');
        return { success: false, message: result.message || 'Failed to update form' };
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(`Failed to update form: ${errorMessage}`);
      console.error('Error updating form:', err);
      return { success: false, message: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const deleteForm = async (id: string) => {
    try {
      setLoading(true);
      setError(null);

      const result = await graphqlClient.deleteForm(id);
      
      if (result.success) {
        setForm(null);
        return { success: true, message: 'Form deleted successfully' };
      } else {
        setError(result.message || 'Failed to delete form');
        return { success: false, message: result.message || 'Failed to delete form' };
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(`Failed to delete form: ${errorMessage}`);
      console.error('Error deleting form:', err);
      return { success: false, message: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const createFormField = async (fieldData: FormFieldInput): Promise<FormFieldResult> => {
    try {
      setLoading(true);
      setError(null);

      // Verify that the field data doesn't contain an id
      // If it comes from FormFieldBase, it might have an id that needs to be removed
      // to avoid GraphQL schema validation errors
      const cleanedFieldData = { 
        ...fieldData,
        // Asegurarse que isRequired sea booleano y no undefined
        isRequired: fieldData.isRequired === true
      };
      
      if ('id' in cleanedFieldData) {
        // Using type assertion to Record<string, unknown> to safely delete extra properties
        delete (cleanedFieldData as Record<string, unknown>)['id'];
      }

      console.log('Sending to API with isRequired:', cleanedFieldData.isRequired);
      
      const result = await graphqlClient.createFormField(cleanedFieldData);
      
      if (result.success && result.field) {
        // If we have a form loaded, update it with the new field
        if (form && form.id === fieldData.formId) {
          await loadForm(form.id);
        }
        return result;
      } else {
        setError(result.message || 'Failed to create form field');
        return result;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(`Failed to create field: ${errorMessage}`);
      console.error('Error creating form field:', err);
      return { 
        success: false, 
        message: errorMessage,
        field: null
      };
    } finally {
      setLoading(false);
    }
  };

  // Update an existing form field
  const updateFormField = async (id: string, fieldData: FormFieldInput): Promise<FormFieldResult> => {
    try {
      setLoading(true);
      setError(null);

      // Create a new object with only the specific fields needed for UpdateFormFieldInput
      const cleanedFieldData = {
        formId: fieldData.formId,
        stepId: fieldData.stepId,
        label: fieldData.label,
        name: fieldData.name,
        type: fieldData.type,
        placeholder: fieldData.placeholder,
        defaultValue: fieldData.defaultValue,
        helpText: fieldData.helpText,
        isRequired: !!fieldData.isRequired,
        order: fieldData.order,
        options: fieldData.options,
        validationRules: fieldData.validationRules,
        styling: fieldData.styling,
        width: fieldData.width
      };
      
      console.log('Updating field with data:', cleanedFieldData);
      
      const result = await graphqlClient.updateFormField(id, cleanedFieldData);
      
      if (result.success && result.field) {
        // If we have a form loaded, update it with the updated field
        if (form && form.id === fieldData.formId) {
          await loadForm(form.id);
        }
        return result;
      } else {
        setError(result.message || 'Failed to update form field');
        return result;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(`Failed to update field: ${errorMessage}`);
      console.error('Error updating form field:', err);
      return { 
        success: false, 
        message: errorMessage,
        field: null
      };
    } finally {
      setLoading(false);
    }
  };

  // Delete a form field
  const deleteFormField = async (id: string): Promise<{success: boolean; message: string}> => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await graphqlClient.deleteFormField(id);
      
      if (result.success) {
        // If we have a form loaded, refresh it to reflect the deletion
        if (form) {
          await loadForm(form.id);
        }
        return result;
      } else {
        setError(result.message || 'Failed to delete form field');
        return result;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(`Failed to delete field: ${errorMessage}`);
      console.error('Error deleting form field:', err);
      return { 
        success: false, 
        message: errorMessage
      };
    } finally {
      setLoading(false);
    }
  };

  // Update field order
  const updateFieldOrder = async (id: string, newOrder: number): Promise<FormFieldResult> => {
    try {
      setLoading(true);
      setError(null);
      
      console.log(`Updating field ${id} order to ${newOrder}`);
      
      const result = await graphqlClient.updateFieldOrder(id, newOrder);
      
      if (result.success && result.field) {
        // If we have a form loaded, refresh it to get the latest order
        if (form) {
          await loadForm(form.id);
        }
        return result;
      } else {
        setError(result.message || 'Failed to update field order');
        return result;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(`Failed to update field order: ${errorMessage}`);
      console.error('Error updating field order:', err);
      return { 
        success: false, 
        message: errorMessage,
        field: null
      };
    } finally {
      setLoading(false);
    }
  };

  // Update multiple field orders at once
  const updateFieldOrders = async (updates: Array<{ id: string; order: number }>): Promise<{success: boolean; message: string}> => {
    try {
      setLoading(true);
      setError(null);
      
      console.log(`Updating orders for ${updates.length} fields:`, updates);
      
      const result = await graphqlClient.updateFieldOrders(updates);
      
      if (result.success) {
        // If we have a form loaded, refresh it to get the latest orders
        if (form) {
          await loadForm(form.id);
        }
        return result;
      } else {
        setError(result.message || 'Failed to update field orders');
        return result;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(`Failed to update field orders: ${errorMessage}`);
      console.error('Error updating field orders:', err);
      return { 
        success: false, 
        message: errorMessage
      };
    } finally {
      setLoading(false);
    }
  };

  return {
    form,
    loading,
    error,
    loadForm,
    createForm,
    updateForm,
    deleteForm,
    createFormField,
    updateFormField,
    updateFieldOrder,
    updateFieldOrders,
    deleteFormField
  };
} 