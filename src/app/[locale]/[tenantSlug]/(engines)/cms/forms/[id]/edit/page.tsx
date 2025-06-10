'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useFormComponent } from '@/components/engines/cms/modules/forms/hooks/useFormComponent';
import { FormFieldBase, FormBase, FormFieldInput } from '@/types/forms';
import { ArrowLeft, Save, PlusCircle, Trash2, X, Edit2, Loader, ChevronUp, ChevronDown } from 'lucide-react';
import Link from 'next/link';
import { FieldEditor } from '@/components/engines/cms/modules/forms/fields';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import FormStepManager from '@/components/engines/cms/modules/forms/FormStepManager';
import FormPreview from '@/components/engines/cms/modules/forms/FormPreview';
import FormResults from '@/components/engines/cms/modules/forms/FormResults';

interface RouteParams {
  locale: string;
  id: string;
  [key: string]: string;
}

export default function EditFormPage() {
  const params = useParams<RouteParams>();
  const { id } = params;
  const { locale, tenantSlug } = useParams();
  const { loadForm, updateForm, createFormField, updateFormField, updateFieldOrders, deleteFormField } = useFormComponent();
  const [form, setForm] = useState<FormBase | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'general' | 'fields' | 'steps' | 'preview' | 'results'>('general');
  const [isEditingField, setIsEditingField] = useState(false);
  const [currentEditingField, setCurrentEditingField] = useState<FormFieldBase | null>(null);

  useEffect(() => {
    let isMounted = true;
    
    const fetchForm = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        const formData = await loadForm(id);
        
        if (isMounted && formData) {
          setForm(formData as FormBase);
        }
      } catch (err) {
        if (isMounted) {
          setError('Failed to load form');
          console.error('Error loading form:', err);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchForm();
    
    return () => {
      isMounted = false;
    };
  }, [id]);

  const handleGeneralFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (!form) return;
    
    if (type === 'checkbox') {
      setForm({
        ...form,
        [name]: (e.target as HTMLInputElement).checked,
      });
    } else {
      setForm({
        ...form,
        [name]: value,
      });
    }
  };


  const handleSaveForm = async () => {
    if (!form) return;
    
    setSaving(true);
    setError(null);
    
    try {
      const result = await updateForm(form.id, {
        title: form.title,
        description: form.description,
        slug: form.slug,
        isMultiStep: form.isMultiStep,
        isActive: form.isActive,
        successMessage: form.successMessage,
        redirectUrl: form.redirectUrl,
        submitButtonText: form.submitButtonText,
      });
      
      if (!result.success) {
        setError(result.message || 'Failed to update form');
      }
    } catch (err) {
      setError('An unexpected error occurred');
      console.error('Error updating form:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleAddField = async (fieldData: FormFieldBase) => {
    if (!form) return;
    
    setError(null);
    
    try {
      // Create a temporary ID for optimistic UI
      const tempId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      // Calculate the next order value
      const nextOrder = form.fields ? form.fields.length : 0;
      
      // Create optimistic field for immediate UI update
      const optimisticField: FormFieldBase = {
        ...fieldData,
        id: tempId,
        formId: form.id,
        order: nextOrder,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      // Apply optimistic update to UI immediately
      setForm(prevForm => {
        if (!prevForm) return prevForm;
        
        const updatedFields = prevForm.fields ? [...prevForm.fields, optimisticField] : [optimisticField];
        
        return {
          ...prevForm,
          fields: updatedFields
        };
      });
      
      // Show optimistic notification
      toast.success(`Agregando campo "${fieldData.label}"...`);
      
      // Prepare data for API call
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { id, createdAt, updatedAt, ...fieldDataWithoutIdAndDates } = fieldData as FormFieldBase;
      
      const apiFieldData: FormFieldInput = {
        ...fieldDataWithoutIdAndDates,
        formId: form.id,
        order: nextOrder,
      };
      
      console.log('Creating field with data:', apiFieldData);
      
      // Make API call
      const result = await createFormField(apiFieldData);
      
      if (result.success && result.field) {
        console.log('Field created successfully:', result.field);
        
        // Replace optimistic field with real server data
        setForm(prevForm => {
          if (!prevForm || !prevForm.fields) return prevForm;
          
          const updatedFields = prevForm.fields.map(field => 
            field.id === tempId ? result.field! : field
          );
          
          return {
            ...prevForm,
            fields: updatedFields as FormFieldBase[]
          };
        });
        
        toast.success(`El campo "${result.field.label}" ha sido creado correctamente.`);
      } else {
        // Revert optimistic UI if request failed
        setForm(prevForm => {
          if (!prevForm || !prevForm.fields) return prevForm;
          
          const updatedFields = prevForm.fields.filter(field => field.id !== tempId);
          
          return {
            ...prevForm,
            fields: updatedFields
          };
        });
        
        const errorMessage = result.message || 'Failed to add field';
        setError(errorMessage);
        toast.error(errorMessage);
      }
    } catch (err) {
      console.error('Error adding field:', err);
      
      // Revert optimistic updates by reloading form data
      try {
        const formData = await loadForm(form.id);
        if (formData) {
          setForm(formData as FormBase);
        }
      } catch (reloadError) {
        console.error('Error reloading form after failed field creation:', reloadError);
      }
      
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError('An unexpected error occurred while adding field');
      toast.error(errorMessage);
    } finally {
      // Don't set saving to false here since we're not using it for this operation
      // The optimistic UI provides immediate feedback
    }
  };

  const handleEditField = async (fieldData: FormFieldBase) => {
    if (!form || !fieldData.id) return;
    
    setError(null);
    
    try {
      // Keep a reference to the original ID
      const fieldId = fieldData.id;
      
      // Store original field data for potential rollback
      const originalField = form.fields?.find(field => field.id === fieldId);
      
      // Apply optimistic update immediately
      setForm(prevForm => {
        if (!prevForm || !prevForm.fields) return prevForm;
        
        const updatedFields = prevForm.fields.map(field => 
          field.id === fieldId ? { ...field, ...fieldData } : field
        );
        
        return {
          ...prevForm,
          fields: updatedFields as FormFieldBase[]
        };
      });
      
      // Show optimistic success notification
      toast.success(`Actualizando el campo "${fieldData.label}"...`);
      
      // Remove ID and timestamps from the data object to avoid GraphQL errors
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { id, createdAt, updatedAt, ...fieldDataWithoutIdAndDates } = fieldData as FormFieldBase;
      
      const apiFieldData: FormFieldInput = {
        ...fieldDataWithoutIdAndDates,
        formId: form.id,
      };
      
      console.log('Updating field with ID:', fieldId, 'Data:', apiFieldData);
      
      // Make API call
      const result = await updateFormField(fieldId, apiFieldData);
      
      if (result.success && result.field) {
        console.log('Field updated successfully:', result.field);
        
        // Update the field in the form state with actual server data
        setForm(prevForm => {
          if (!prevForm || !prevForm.fields) return prevForm;
          
          const updatedFields = prevForm.fields.map(field => 
            field.id === fieldId ? result.field! : field
          );
          
          return {
            ...prevForm,
            fields: updatedFields as FormFieldBase[]
          };
        });
        
        toast.success(`El campo "${result.field.label}" ha sido actualizado correctamente.`);
      } else {
        // Revert optimistic update if the request failed
        if (originalField) {
          setForm(prevForm => {
            if (!prevForm || !prevForm.fields) return prevForm;
            
            const updatedFields = prevForm.fields.map(field => 
              field.id === fieldId ? originalField : field
            );
            
            return {
              ...prevForm,
              fields: updatedFields as FormFieldBase[]
            };
          });
        } else {
          // Fallback: reload form data
          try {
            const formData = await loadForm(form.id);
            if (formData) {
              setForm(formData as FormBase);
            }
          } catch (reloadError) {
            console.error('Error reloading form after failed field update:', reloadError);
          }
        }
        
        const errorMessage = result.message || 'Failed to update field';
        setError(errorMessage);
        toast.error(errorMessage);
      }
    } catch (err) {
      console.error('Error updating field:', err);
      
      // Revert optimistic update if there was an error
      try {
        const formData = await loadForm(form.id);
        if (formData) {
          setForm(formData as FormBase);
        }
      } catch (reloadError) {
        console.error('Error reloading form after failed field update:', reloadError);
      }
      
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError('An unexpected error occurred while updating field');
      toast.error(errorMessage);
    } finally {
      // Don't set saving to false here since we're not using it for this operation
      // The optimistic UI provides immediate feedback
    }
  };

  const handleDeleteField = async (fieldId: string) => {
    if (!form) return;
    
    // Use toast confirm instead of window.confirm
    if (!window.confirm('¿Estás seguro de que deseas eliminar este campo? Esta acción no se puede deshacer.')) {
      return;
    }
    
    setError(null);
    
    try {
      // Store the field being deleted for potential rollback
      const fieldToDelete = form.fields?.find(field => field.id === fieldId);
      
      if (!fieldToDelete) {
        toast.error('Campo no encontrado');
        return;
      }
      
      // Apply optimistic update immediately - remove field from UI
      setForm(prevForm => {
        if (!prevForm || !prevForm.fields) return prevForm;
        
        const updatedFields = prevForm.fields.filter(field => field.id !== fieldId);
        
        return {
          ...prevForm,
          fields: updatedFields
        };
      });
      
      // Show optimistic notification
      toast.success(`Eliminando campo "${fieldToDelete.label}"...`);
      
      // Make API call
      const result = await deleteFormField(fieldId);
      
      if (result.success) {
        toast.success(`El campo "${fieldToDelete.label}" ha sido eliminado correctamente.`);
      } else {
        // Revert optimistic update if the request failed
        setForm(prevForm => {
          if (!prevForm) return prevForm;
          
          // Re-insert the field at its original position
          const updatedFields = prevForm.fields ? [...prevForm.fields] : [];
          
          // Find the correct position to insert the field back
          const insertIndex = updatedFields.findIndex(field => field.order > fieldToDelete.order);
          
          if (insertIndex === -1) {
            // Insert at the end
            updatedFields.push(fieldToDelete);
          } else {
            // Insert at the correct position
            updatedFields.splice(insertIndex, 0, fieldToDelete);
          }
          
          return {
            ...prevForm,
            fields: updatedFields
          };
        });
        
        const errorMessage = result.message || 'Failed to delete field';
        setError(errorMessage);
        toast.error(errorMessage);
      }
    } catch (err) {
      console.error('Error deleting field:', err);
      
      // Revert optimistic update if there was an error
      try {
        const formData = await loadForm(form.id);
        if (formData) {
          setForm(formData as FormBase);
        }
      } catch (reloadError) {
        console.error('Error reloading form after failed field deletion:', reloadError);
      }
      
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError('An unexpected error occurred while deleting field');
      toast.error(errorMessage);
    } finally {
      // Don't set saving to false here since we're not using it for this operation
      // The optimistic UI provides immediate feedback
    }
  };

  // Handle moving a field up in order
  const handleMoveFieldUp = async (field: FormFieldBase) => {
    if (!form || !form.fields || field.order <= 0) return;
    
    try {
      // Ordenar los campos primero para asegurar que tenemos el orden correcto
      const sortedFields = [...form.fields].sort((a, b) => a.order - b.order);
      
      // Encontrar el índice del campo en la lista ordenada
      const currentIndex = sortedFields.findIndex(f => f.id === field.id);
      if (currentIndex <= 0) return; // Ya está en la primera posición
      
      // Intercambiar posiciones en el array
      const newSortedFields = [...sortedFields];
      const temp = newSortedFields[currentIndex];
      newSortedFields[currentIndex] = newSortedFields[currentIndex - 1];
      newSortedFields[currentIndex - 1] = temp;
      
      // Reasignar valores de orden a todos los campos para evitar duplicados
      const fieldsWithNewOrder = newSortedFields.map((f, index) => ({
        ...f,
        order: index
      }));
      
      // Actualizar UI optimistamente
      setForm({
        ...form,
        fields: fieldsWithNewOrder as FormFieldBase[]
      });
      
      // Preparar los datos para actualizar todos los órdenes
      const orderUpdates = fieldsWithNewOrder.map(f => ({
        id: f.id,
        order: f.order
      }));
      
      // Actualizar todos los campos en la base de datos
      const result = await updateFieldOrders(orderUpdates);
      
      if (!result.success) {
        // Revertir actualización optimista si falló
        loadForm(form.id);
        toast.error("Error al reordenar los campos");
      } else {
        toast.success("Campos reordenados correctamente");
      }
    } catch (error) {
      // Revertir actualización optimista si hubo error
      loadForm(form.id);
      toast.error("Error al mover el campo");
      console.error("Error moving field up:", error);
    }
  };

  // Handle moving a field down in order
  const handleMoveFieldDown = async (field: FormFieldBase) => {
    if (!form || !form.fields) return;
    
    try {
      // Ordenar los campos primero para asegurar que tenemos el orden correcto
      const sortedFields = [...form.fields].sort((a, b) => a.order - b.order);
      
      // Encontrar el índice del campo en la lista ordenada
      const currentIndex = sortedFields.findIndex(f => f.id === field.id);
      if (currentIndex === -1 || currentIndex >= sortedFields.length - 1) return; // Ya está en la última posición
      
      // Intercambiar posiciones en el array
      const newSortedFields = [...sortedFields];
      const temp = newSortedFields[currentIndex];
      newSortedFields[currentIndex] = newSortedFields[currentIndex + 1];
      newSortedFields[currentIndex + 1] = temp;
      
      // Reasignar valores de orden a todos los campos para evitar duplicados
      const fieldsWithNewOrder = newSortedFields.map((f, index) => ({
        ...f,
        order: index
      }));
      
      // Actualizar UI optimistamente
      setForm({
        ...form,
        fields: fieldsWithNewOrder as FormFieldBase[]
      });
      
      // Preparar los datos para actualizar todos los órdenes
      const orderUpdates = fieldsWithNewOrder.map(f => ({
        id: f.id,
        order: f.order
      }));
      
      // Actualizar todos los campos en la base de datos
      const result = await updateFieldOrders(orderUpdates);
      
      if (!result.success) {
        // Revertir actualización optimista si falló
        loadForm(form.id);
        toast.error("Error al reordenar los campos");
      } else {
        toast.success("Campos reordenados correctamente");
      }
    } catch (error) {
      // Revertir actualización optimista si hubo error
      loadForm(form.id);
      toast.error("Error al mover el campo");
      console.error("Error moving field down:", error);
    }
  };

  const handleFormUpdate = async () => {
    // Refresh form data to update preview and other tabs
    try {
      const formData = await loadForm(id);
      if (formData) {
        setForm(formData as FormBase);
      }
    } catch (err) {
      console.error('Error refreshing form data:', err);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4 flex justify-center items-center h-64">
        <div className="animate-spin h-8 w-8 border-4 border-blue-500 rounded-full border-t-transparent"></div>
      </div>
    );
  }

  if (!form) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="bg-red-50 border border-red-200 rounded-md p-4 text-red-600">
          Form not found or failed to load
        </div>
        <div className="mt-4">
          <Link href={`/${locale}/${tenantSlug}/cms/forms`} className="text-blue-600 hover:underline">
            Back to forms list
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center">
          <Link 
            href={`/${locale}/${tenantSlug}/cms/forms`} 
            className="mr-4 p-2 rounded-full hover:bg-gray-100"
          >
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </Link>
          <h1 className="text-2xl font-bold tracking-tight">Edit Form: {form.title}</h1>
        </div>
        <button
          onClick={handleSaveForm}
          disabled={saving}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
        >
          {saving ? 'Saving...' : (
            <>
              <Save className="h-4 w-4 mr-1" />
              Save Changes
            </>
          )}
        </button>
      </div>
      
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md text-red-600">
          {error}
        </div>
      )}
      
      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          <button
            onClick={() => setActiveTab('general')}
            className={`${
              activeTab === 'general'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } py-4 px-1 border-b-2 font-medium text-sm`}
          >
            General Settings
          </button>

          <button
            onClick={() => setActiveTab('fields')}
            className={`${
              activeTab === 'fields'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Fields
            {form.fields && form.fields.length > 0 && (
              <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                {form.fields.length}
              </span>
            )}
          </button>

            <button
              onClick={() => setActiveTab('steps')}
              className={`${
                activeTab === 'steps'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Form Steps
            {form.isMultiStep && (
              <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                Multi-step
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('preview')}
            className={`${
              activeTab === 'preview'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Preview
          </button>

          <button
            onClick={() => setActiveTab('results')}
            className={`${
              activeTab === 'results'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Results
            <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
              Live
            </span>
          </button>
        </nav>
      </div>
      
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        {/* General Settings Tab */}
        {activeTab === 'general' && (
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                    Form Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="title"
                    name="title"
                    required
                    value={form.title}
                    onChange={handleGeneralFormChange}
                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label htmlFor="slug" className="block text-sm font-medium text-gray-700 mb-1">
                    Form Slug <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="slug"
                    name="slug"
                    required
                    value={form.slug}
                    onChange={handleGeneralFormChange}
                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    value={form.description || ''}
                    onChange={handleGeneralFormChange}
                    rows={3}
                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label htmlFor="submitButtonText" className="block text-sm font-medium text-gray-700 mb-1">
                    Submit Button Text
                  </label>
                  <input
                    type="text"
                    id="submitButtonText"
                    name="submitButtonText"
                    value={form.submitButtonText}
                    onChange={handleGeneralFormChange}
                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label htmlFor="successMessage" className="block text-sm font-medium text-gray-700 mb-1">
                    Success Message
                  </label>
                  <textarea
                    id="successMessage"
                    name="successMessage"
                    value={form.successMessage || ''}
                    onChange={handleGeneralFormChange}
                    rows={3}
                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label htmlFor="redirectUrl" className="block text-sm font-medium text-gray-700 mb-1">
                    Redirect URL
                  </label>
                  <input
                    type="text"
                    id="redirectUrl"
                    name="redirectUrl"
                    value={form.redirectUrl || ''}
                    onChange={handleGeneralFormChange}
                    placeholder="e.g., /thank-you"
                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    If set, users will be redirected to this URL after form submission.
                  </p>
                </div>
                
                <div className="flex items-center space-x-6 mt-4">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="isMultiStep"
                      name="isMultiStep"
                      checked={form.isMultiStep}
                      onChange={e => setForm({ ...form, isMultiStep: e.target.checked })}
                      className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                    />
                    <label htmlFor="isMultiStep" className="ml-2 text-sm text-gray-700">
                      Multi-step Form
                    </label>
                  </div>
                  
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="isActive"
                      name="isActive"
                      checked={form.isActive}
                      onChange={e => setForm({ ...form, isActive: e.target.checked })}
                      className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                    />
                    <label htmlFor="isActive" className="ml-2 text-sm text-gray-700">
                      Active
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Fields Tab */}
        {activeTab === 'fields' && (
            <div className="p-6">
            <div className="mb-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Form Fields</h2>
              <p className="text-sm text-gray-600 mb-6">
                Manage the fields for your form. You can add, edit, reorder, and delete fields as needed.
              </p>
              
              {/* Estado para gestionar la edición de campo */}
              {isEditingField ? (
                <div className="mb-6 relative p-6 border rounded-lg bg-gray-50">
                  <div className="flex justify-between items-center mb-4 border-b pb-2">
                    <h3 className="text-md font-medium">
                      {currentEditingField?.id ? 'Edit Field' : 'Create New Field'}
                    </h3>
                    <button 
                      onClick={() => setIsEditingField(false)} 
                      className="p-2 rounded-full hover:bg-gray-200 transition-colors"
                      aria-label="Close editor"
                    >
                      <X className="h-5 w-5 text-gray-600" />
                    </button>
                  </div>
                  <FieldEditor 
                    field={currentEditingField}
                    onSave={(updatedField) => {
                      if (currentEditingField?.id) {
                        // Update existing field
                        handleEditField(updatedField);
                        setIsEditingField(false);
                      } else {
                        // Create new field
                        handleAddField(updatedField);
                        setIsEditingField(false);
                      }
                    }}
                    onCancel={() => setIsEditingField(false)}
                    formId={form.id}
                  />
                </div>
              ) : (
                <>
                  {/* Existing fields */}
                  {form.fields && form.fields.length > 0 ? (
                    <div className="mb-8">
                      <div className="overflow-hidden border border-gray-200 rounded-md">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Label</th>
                              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Required</th>
                              <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Reorder</th>
                              <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {form.fields.map((field: FormFieldBase) => (
                              <tr key={field.id} className="hover:bg-gray-50">
                                <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">{field.label}</td>
                                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">{field.name}</td>
                                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">{field.type}</td>
                                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                                  {field.isRequired ? 
                                    <span className="text-green-600">Yes</span> : 
                                    <span className="text-gray-400">No</span>
                                  }
                                </td>
                                <td className="px-4 py-2 whitespace-nowrap text-sm">
                                  <div className="flex justify-center space-x-1">
                                    <button 
                                      className="text-gray-500 hover:text-gray-700 disabled:opacity-30"
                                      title="Move up"
                                      onClick={() => handleMoveFieldUp(field)}
                                      disabled={field.order === 0}
                                    >
                                      <ChevronUp className="h-4 w-4" />
                                    </button>
                                    <button 
                                      className="text-gray-500 hover:text-gray-700 disabled:opacity-30"
                                      title="Move down"
                                      onClick={() => handleMoveFieldDown(field)}
                                      disabled={field.order === (form.fields?.length || 0) - 1}
                                    >
                                      <ChevronDown className="h-4 w-4" />
                                    </button>
                                  </div>
                                </td>
                                <td className="px-4 py-2 whitespace-nowrap text-right text-sm">
                                  <div className="flex justify-end space-x-2">
                                    <button 
                                      className="text-blue-600 hover:text-blue-800"
                                      title="Edit field"
                                      onClick={() => {
                                        setCurrentEditingField(field);
                                        setIsEditingField(true);
                                      }}
                                    >
                                      <Edit2 className="h-4 w-4" />
                                    </button>
                                    <button 
                                      className="text-red-600 hover:text-red-800"
                                      title="Delete field"
                                      onClick={() => handleDeleteField(field.id)}
                                      disabled={saving}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-gray-50 p-8 text-center rounded-md mb-8">
                      <p className="text-gray-500">No fields added yet. Use the button below to add your first field.</p>
                    </div>
                  )}
                  
                  {/* Add new field button */}
                  <div className="flex justify-center">
                    <Button
                      type="button"
                      onClick={() => {
                        setCurrentEditingField(null);
                        setIsEditingField(true);
                      }}
                      className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                      disabled={saving}
                    >
                      {saving ? (
                        <>
                          <Loader className="h-4 w-4 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <PlusCircle className="h-4 w-4 mr-2" />
                          Add Field
                        </>
                      )}
                    </Button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Form Steps Tab */}
        {activeTab === 'steps' && (
          <div className="p-6">
            <div className="mb-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Form Steps Management</h2>
              
              {form.isMultiStep ? (
                <>
                  <p className="text-sm text-gray-600 mb-6">
                    Create and manage steps for your multi-step form. Each step can contain multiple fields and can be reordered as needed.
                  </p>
                  
                  <FormStepManager 
                    form={form} 
                    onFormUpdate={handleFormUpdate}
                  />
                </>
              ) : (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-blue-800">
                        Multi-Step Mode Not Enabled
                      </h3>
                      <div className="mt-2 text-sm text-blue-700">
                        <p>
                          This form is currently configured as a single-step form. To manage form steps, 
                          you need to enable multi-step mode in the General Settings tab.
                  </p>
                </div>
                      <div className="mt-4">
                        <div className="flex">
                          <button
                            onClick={() => {
                              setForm({ ...form, isMultiStep: true });
                              toast.success('Multi-step mode enabled! Don\'t forget to save your changes.');
                            }}
                            className="bg-blue-100 px-3 py-2 rounded-md text-sm font-medium text-blue-800 hover:bg-blue-200 transition-colors"
                          >
                            Enable Multi-Step Mode
                          </button>
                          <button
                            onClick={() => setActiveTab('general')}
                            className="ml-3 bg-white px-3 py-2 rounded-md text-sm font-medium text-blue-800 hover:bg-blue-50 border border-blue-200 transition-colors"
                          >
                            Go to General Settings
                          </button>
                  </div>
                  </div>
                </div>
              </div>
            </div>
              )}
          </div>
          </div>
        )}
        
        {/* Preview Tab */}
        {activeTab === 'preview' && (
          <div className="p-6">
            <FormPreview form={form} />
          </div>
        )}

        {/* Results Tab */}
        {activeTab === 'results' && (
          <div className="p-6">
            <FormResults form={form} />
          </div>
        )}
      </div>
    </div>
  );
} 