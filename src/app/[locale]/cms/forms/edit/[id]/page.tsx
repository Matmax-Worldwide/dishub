'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useFormComponent } from '@/components/cms/forms/hooks/useFormComponent';
import { FormFieldBase, FormBase, FormFieldInput } from '@/types/forms';
import { ArrowLeft, Save, PlusCircle, Trash2, X, Edit2, Loader, ChevronUp, ChevronDown } from 'lucide-react';
import Link from 'next/link';
import { FieldEditor } from '@/components/cms/forms/fields';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface RouteParams {
  locale: string;
  id: string;
  [key: string]: string;
}

export default function EditFormPage() {
  const params = useParams<RouteParams>();
  const { id } = params;
  
  const { loadForm, updateForm, createFormField, updateFormField, updateFieldOrders, deleteFormField } = useFormComponent();
  const [form, setForm] = useState<FormBase | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'general' | 'fields' | 'steps'>('general');
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
    setSaving(true);
    
    try {
      // Convertir a FormFieldInput para compatibilidad con la API
      // Eliminar id ya que será generado por el servidor
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { id, createdAt, updatedAt, ...fieldDataWithoutIdAndDates } = fieldData as FormFieldBase;
      
      // Asegurarse que isRequired se haya establecido correctamente
      console.log('Field data before API call:', fieldDataWithoutIdAndDates);
      
      const apiFieldData: FormFieldInput = {
        ...fieldDataWithoutIdAndDates,
        formId: form.id,
        order: form.fields ? form.fields.length : 0,
      };
      
      // Create a temporary ID for optimistic UI
      const tempId = `temp-${Date.now()}`;
      
      // Create optimistic field for UI update
      const optimisticField: FormFieldBase = {
        ...fieldData,
        id: tempId,
        formId: form.id,
        order: form.fields ? form.fields.length : 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      // Apply optimistic update to UI
      if (form.fields) {
        setForm({
          ...form,
          fields: [...form.fields, optimisticField] as FormFieldBase[]
        });
      } else {
        setForm({
          ...form,
          fields: [optimisticField]
        });
      }
      
      // Show optimistic notification
      toast.success(`Creando campo "${fieldData.label}"...`);
      
      const result = await createFormField(apiFieldData);
      
      if (result.success && result.field) {
        console.log('Field created successfully:', result.field);
        // Update optimistic field with server data
        if (form.fields) {
          setForm({
            ...form,
            fields: form.fields.map(field => 
              field.id === tempId && result.field ? result.field : field
            ) as FormFieldBase[]
          });
        }
        
        toast.success(`El campo "${result.field.label}" ha sido creado correctamente.`);
      } else {
        // Revert optimistic UI if request failed
        if (form.fields) {
          setForm({
            ...form,
            fields: form.fields.filter(field => field.id !== tempId) as FormFieldBase[]
          });
        }
        
        setError(result.message || 'Failed to add field');
        toast.error(result.message || 'Failed to add field');
      }
    } catch (err) {
      // Revert any optimistic updates by reloading form
      loadForm(form.id);
      
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError('An unexpected error occurred while adding field');
      console.error('Error adding field:', err);
      
      toast.error(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleEditField = async (fieldData: FormFieldBase) => {
    if (!form || !fieldData.id) return;
    
    setError(null);
    setSaving(true);
    
    try {
      // Keep a reference to the original ID
      const fieldId = fieldData.id;
      
      // Remove ID and timestamps from the data object to avoid GraphQL errors
      const { ...fieldDataWithoutIdAndDates } = fieldData as FormFieldBase;
      
      const apiFieldData: FormFieldInput = {
        ...fieldDataWithoutIdAndDates,
        formId: form.id,
      };
      
      console.log('Updating field with ID:', fieldId, 'Data:', apiFieldData);
      
      // Apply optimistic update immediately
      if (form.fields) {
        setForm({
          ...form,
          fields: form.fields.map(field => 
            field.id === fieldId ? { ...field, ...fieldData } : field
          ) as FormFieldBase[] // Cast to ensure type safety
        });
      }
      
      // Show optimistic success notification
      toast.success(`Actualizando el campo "${fieldData.label}"...`);
      
      const result = await updateFormField(fieldId, apiFieldData);
      
      if (result.success && result.field) {
        console.log('Field updated successfully:', result.field);
        // Update the field in the form state with actual server data
        if (form.fields) {
          setForm({
            ...form,
            fields: form.fields.map(field => 
              field.id === fieldId && result.field ? result.field : field
            ) as FormFieldBase[] // Cast to ensure type safety
          });
        }
        
        toast.success(`El campo "${result.field.label}" ha sido actualizado correctamente.`);
      } else {
        // Revert optimistic update if the request failed
        loadForm(form.id);
        
        setError(result.message || 'Failed to update field');
        toast.error(result.message || 'Failed to update field');
      }
    } catch (err) {
      // Revert optimistic update if there was an error
      loadForm(form.id);
      
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError('An unexpected error occurred while updating field');
      console.error('Error updating field:', err);
      
      toast.error(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteField = async (fieldId: string) => {
    if (!form) return;
    
    // Use toast confirm instead of window.confirm
    if (!window.confirm('¿Estás seguro de que deseas eliminar este campo? Esta acción no se puede deshacer.')) {
      return;
    }
    
    setError(null);
    setSaving(true);
    
    try {
      // Apply optimistic update immediately
      if (form.fields) {
        // Update UI immediately
        setForm({
          ...form,
          fields: form.fields.filter(field => field.id !== fieldId)
        });
        
        // Show optimistic notification
        toast.success("Eliminando campo...");
      }
      
      const result = await deleteFormField(fieldId);
      
      if (result.success) {
        toast.success('El campo ha sido eliminado correctamente.');
      } else {
        // Revert optimistic update if the request failed
        loadForm(form.id);
        
        setError(result.message || 'Failed to delete field');
        toast.error(result.message || 'Failed to delete field');
      }
    } catch (err) {
      // Revert optimistic update if there was an error
      loadForm(form.id);
      
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError('An unexpected error occurred while deleting field');
      console.error('Error deleting field:', err);
      
      toast.error(errorMessage);
    } finally {
      setSaving(false);
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
          <Link href="/cms/forms" className="text-blue-600 hover:underline">
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
            href="/cms/forms" 
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

          {form.isMultiStep && (
            <button
              onClick={() => setActiveTab('steps')}
              className={`${
                activeTab === 'steps'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Form Steps
            </button>
          )}
        </nav>
      </div>
      
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        {/* General Settings Tab */}
        {activeTab === 'general' && (
            <>
            <div className="p-6">
            <div className="mb-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Campos del Formulario</h2>
              
              {/* Estado para gestionar la edición de campo */}
              {isEditingField ? (
                <div className="mb-6 relative p-6 border rounded-lg bg-gray-50">
                  <div className="flex justify-between items-center mb-4 border-b pb-2">
                    <h3 className="text-md font-medium">
                      {currentEditingField?.id ? 'Editar campo' : 'Crear nuevo campo'}
                    </h3>
                    <button 
                      onClick={() => setIsEditingField(false)} 
                      className="p-2 rounded-full hover:bg-gray-200 transition-colors"
                      aria-label="Cerrar editor"
                    >
                      <X className="h-5 w-5 text-gray-600" />
                    </button>
                  </div>
                  <FieldEditor 
                    field={currentEditingField}
                    onSave={(updatedField) => {
                      if (currentEditingField?.id) {
                        // Actualizar campo existente
                        handleEditField(updatedField);
                        setIsEditingField(false);
                      } else {
                        // Crear nuevo campo
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
                              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Etiqueta</th>
                              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
                              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
                              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Requerido</th>
                              <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Reordenar</th>
                              <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
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
                                    <span className="text-green-600">Sí</span> : 
                                    <span className="text-gray-400">No</span>
                                  }
                                </td>
                                <td className="px-4 py-2 whitespace-nowrap text-sm">
                                  <div className="flex justify-center space-x-1">
                                    <button 
                                      className="text-gray-500 hover:text-gray-700 disabled:opacity-30"
                                      title="Mover hacia arriba"
                                      onClick={() => handleMoveFieldUp(field)}
                                      disabled={field.order === 0}
                                    >
                                      <ChevronUp className="h-4 w-4" />
                                    </button>
                                    <button 
                                      className="text-gray-500 hover:text-gray-700 disabled:opacity-30"
                                      title="Mover hacia abajo"
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
                                      title="Editar campo"
                                      onClick={() => {
                                        setCurrentEditingField(field);
                                        setIsEditingField(true);
                                      }}
                                    >
                                      <Edit2 className="h-4 w-4" />
                                    </button>
                                    <button 
                                      className="text-red-600 hover:text-red-800"
                                      title="Eliminar campo"
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
                      <p className="text-gray-500">No hay campos añadidos. Utiliza el botón a continuación para agregar tu primer campo.</p>
                    </div>
                  )}
                  
                  {/* Botón para agregar nuevo campo */}
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
                          Procesando...
                        </>
                      ) : (
                        <>
                          <PlusCircle className="h-4 w-4 mr-2" />
                          Agregar Campo
                        </>
                      )}
                    </Button>
                  </div>
                </>
              )}
            </div>
          </div>

          <Separator className="my-4" />
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
          </>
        )}
        
        {/* Form Steps Tab (only shown if isMultiStep is true) */}
        {activeTab === 'steps' && form.isMultiStep && (
          <div className="p-6">
            <div className="mb-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Form Steps</h2>
              
              {/* Steps content will go here */}
              <div className="bg-gray-50 p-8 text-center rounded-md">
                <p className="text-gray-500">Steps functionality is under development.</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 