'use client';

import { useState, useEffect } from 'react';
import { FormFieldBase } from '@/types/forms';
import { FieldProps, BaseFieldPreview, FieldLayout } from './FieldBase';

// Componente de vista previa para campos de texto
export function TextFieldPreview({ field }: { field: FormFieldBase }) {
  return (
    <BaseFieldPreview field={field}>
      <input
        type="text"
        id={`preview-${field.name}`}
        name={`preview-${field.name}`}
        placeholder={field.placeholder || ''}
        disabled
        className="w-full p-2 border border-gray-300 rounded-md bg-gray-50 cursor-not-allowed"
      />
    </BaseFieldPreview>
  );
}

// Componente de edición para campos de texto
export function TextField({ field, onChange, showPreview = true }: FieldProps) {
  const [localField, setLocalField] = useState<FormFieldBase | null>(field);
  
  // Actualizar el estado local cuando cambian las propiedades
  useEffect(() => {
    setLocalField(field);
  }, [field]);
  
  if (!localField) return null;
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    const updatedField = {
      ...localField,
      [name]: value
    };
    
    setLocalField(updatedField);
    onChange(updatedField);
  };
  
  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    
    const updatedField = {
      ...localField,
      [name]: checked
    };
    
    setLocalField(updatedField);
    onChange(updatedField);
  };
  
  const editorContent = (
    <div className="space-y-4">
      <div>
        <label htmlFor="label" className="block text-sm font-medium text-gray-700 mb-1">
          Etiqueta del campo <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="label"
          name="label"
          value={localField.label}
          onChange={handleChange}
          className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
          placeholder="Ej: Nombre completo"
        />
      </div>
      
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
          Nombre de identificación <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="name"
          name="name"
          value={localField.name}
          onChange={handleChange}
          className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
          placeholder="Ej: full_name"
        />
        <p className="mt-1 text-xs text-gray-500">
          Identificador único para el campo (sin espacios ni caracteres especiales)
        </p>
      </div>
      
      <div>
        <label htmlFor="placeholder" className="block text-sm font-medium text-gray-700 mb-1">
          Placeholder
        </label>
        <input
          type="text"
          id="placeholder"
          name="placeholder"
          value={localField.placeholder || ''}
          onChange={handleChange}
          className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
          placeholder="Ej: Ingrese su nombre completo"
        />
      </div>
      
      <div>
        <label htmlFor="helpText" className="block text-sm font-medium text-gray-700 mb-1">
          Texto de ayuda
        </label>
        <input
          type="text"
          id="helpText"
          name="helpText"
          value={localField.helpText || ''}
          onChange={handleChange}
          className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
          placeholder="Ej: Ingrese su nombre tal como aparece en su identificación"
        />
      </div>
      
      <div className="flex items-center">
        <input
          type="checkbox"
          id="isRequired"
          name="isRequired"
          checked={localField.isRequired || false}
          onChange={handleCheckboxChange}
          className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
        />
        <label htmlFor="isRequired" className="ml-2 text-sm text-gray-700">
          Campo requerido
        </label>
      </div>
      
      <div>
        <label htmlFor="defaultValue" className="block text-sm font-medium text-gray-700 mb-1">
          Valor predeterminado
        </label>
        <input
          type="text"
          id="defaultValue"
          name="defaultValue"
          value={localField.defaultValue || ''}
          onChange={handleChange}
          className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
          placeholder="Ej: John Doe"
        />
      </div>
      
      <div>
        <label htmlFor="width" className="block text-sm font-medium text-gray-700 mb-1">
          Ancho del campo (%)
        </label>
        <input
          type="number"
          id="width"
          name="width"
          min="25"
          max="100"
          step="25"
          value={localField.width || 100}
          onChange={handleChange}
          className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <p className="mt-1 text-xs text-gray-500">
          Ancho del campo (25%, 50%, 75% o 100%)
        </p>
      </div>
    </div>
  );
  
  if (!showPreview) {
    return editorContent;
  }
  
  return (
    <FieldLayout
      title="Campo de Texto"
      description="Permite al usuario introducir una línea de texto"
      preview={<TextFieldPreview field={localField} />}
      editor={editorContent}
    />
  );
} 