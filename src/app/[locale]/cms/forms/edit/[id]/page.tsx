'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useFormComponent } from '@/components/cms/forms/hooks/useFormComponent';
import { FormFieldBase, FormBase, FormFieldInput } from '@/types/forms';
import { ArrowLeft, Save, PlusCircle, Trash2, X, Edit2 } from 'lucide-react';
import Link from 'next/link';
import { FieldEditor } from '@/components/cms/forms/fields';

interface RouteParams {
  locale: string;
  id: string;
  [key: string]: string;
}

export default function EditFormPage() {
  const params = useParams<RouteParams>();
  const { id } = params;
  
  const { loadForm, updateForm, createFormField } = useFormComponent();
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
      const { id, ...fieldDataWithoutId } = fieldData;
      
      // Asegurarse que isRequired se haya establecido correctamente
      console.log('Field data before API call:', fieldDataWithoutId);
      
      const apiFieldData: FormFieldInput = {
        ...fieldDataWithoutId,
        formId: form.id,
        order: form.fields ? form.fields.length : 0,
      };
      
      const result = await createFormField(apiFieldData);
      
      if (result.success && result.field) {
        console.log('Field created successfully:', result.field);
        if (form.fields) {
          setForm({
            ...form,
            fields: [...form.fields, result.field]
          });
        } else {
          setForm({
            ...form,
            fields: [result.field]
          });
        }
      } else {
        setError(result.message || 'Failed to add field');
      }
    } catch (err) {
      setError('An unexpected error occurred while adding field');
      console.error('Error adding field:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteField = async (fieldId: string) => {
    if (!form) return;
    
    if (!window.confirm('¿Estás seguro de que deseas eliminar este campo? Esta acción no se puede deshacer.')) {
      return;
    }
    
    setError(null);
    setSaving(true);
    
    try {
      // Aquí iría la llamada a la API para eliminar el campo
      // Por ahora solo actualizamos el estado local
      if (form.fields) {
        setForm({
          ...form,
          fields: form.fields.filter(field => field.id !== fieldId)
        });
      }
    } catch (err) {
      setError('An unexpected error occurred while deleting field');
      console.error('Error deleting field:', err);
    } finally {
      setSaving(false);
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
          <button
            onClick={() => setActiveTab('fields')}
            className={`${
              activeTab === 'fields'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Form Fields
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
        
        {/* Form Fields Tab */}
        {activeTab === 'fields' && (
          <div className="p-6">
            <div className="mb-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Campos del Formulario</h2>
              
              {/* Estado para gestionar la edición de campo */}
              {isEditingField ? (
                <div className="mb-6 relative">
                  <button 
                    onClick={() => setIsEditingField(false)} 
                    className="absolute top-2 right-2 p-2 rounded-full hover:bg-gray-100"
                    aria-label="Cerrar editor"
                  >
                    <X className="h-5 w-5 text-gray-600" />
                  </button>
                  <FieldEditor 
                    field={currentEditingField}
                    onSave={(updatedField) => {
                      if (currentEditingField?.id) {
                        // Actualizar campo existente
                        // Aquí iría la lógica para actualizar un campo
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
                              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Orden</th>
                              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Etiqueta</th>
                              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
                              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
                              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Requerido</th>
                              <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {form.fields.map((field: FormFieldBase) => (
                              <tr key={field.id} className="hover:bg-gray-50">
                                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">{field.order}</td>
                                <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">{field.label}</td>
                                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">{field.name}</td>
                                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">{field.type}</td>
                                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                                  {field.isRequired ? 
                                    <span className="text-green-600">Sí</span> : 
                                    <span className="text-gray-400">No</span>
                                  }
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
                    <button
                      type="button"
                      onClick={() => {
                        setCurrentEditingField(null);
                        setIsEditingField(true);
                      }}
                      className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                      <PlusCircle className="h-4 w-4 mr-2" />
                      Agregar Campo
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
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