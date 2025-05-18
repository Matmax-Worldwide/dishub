'use client';

import { useState, useEffect } from 'react';
import { FormFieldBase } from '@/types/forms';
import { FieldProps, BaseFieldPreview, FieldLayout } from './FieldBase';

// Componente de vista previa para áreas de texto
export function TextAreaFieldPreview({ field }: { field: FormFieldBase }) {
  return (
    <BaseFieldPreview field={field}>
      <textarea
        id={`preview-${field.name}`}
        name={`preview-${field.name}`}
        placeholder={field.placeholder || ''}
        disabled
        rows={4}
        className="w-full p-2 border border-gray-300 rounded-md bg-gray-50 cursor-not-allowed"
      ></textarea>
    </BaseFieldPreview>
  );
}

// Componente de edición para áreas de texto
export function TextAreaField({ field, onChange, showPreview = true }: FieldProps) {
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
    
    console.log(`Checkbox ${name} changed to ${checked}`); // Log para depuración
    
    const updatedField = {
      ...localField,
      [name]: checked
    };
    
    setLocalField(updatedField);
    onChange(updatedField);
  };

  // Configuración específica para textarea
  const options = localField.options || {};
  
  const handleOptionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    // Determine the proper value based on input type
    const newValue = type === 'checkbox' ? checked : type === 'number' ? parseInt(value) : value;
    
    const updatedOptions = {
      ...options,
      [name]: newValue
    };
    
    const updatedField = {
      ...localField,
      options: updatedOptions
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
          placeholder="Ej: Descripción"
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
          placeholder="Ej: description"
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
          placeholder="Ej: Escriba una descripción detallada..."
        />
      </div>
      
      <div>
        <label htmlFor="rows" className="block text-sm font-medium text-gray-700 mb-1">
          Filas visibles
        </label>
        <input
          type="number"
          id="rows"
          name="rows"
          min="2"
          max="20"
          value={(options.rows as number) || 4}
          onChange={handleOptionChange}
          className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
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
          placeholder="Ej: Proporcione todos los detalles relevantes"
        />
      </div>
      
      <div className="flex items-center space-x-4">
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
        
        <div className="flex items-center">
          <input
            type="checkbox"
            id="resize"
            name="resize"
            checked={(options.resize as boolean) || false}
            onChange={handleOptionChange}
            className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
          />
          <label htmlFor="resize" className="ml-2 text-sm text-gray-700">
            Permitir redimensionar
          </label>
        </div>
      </div>
      
      <div>
        <label htmlFor="defaultValue" className="block text-sm font-medium text-gray-700 mb-1">
          Valor predeterminado
        </label>
        <textarea
          id="defaultValue"
          name="defaultValue"
          value={localField.defaultValue || ''}
          onChange={handleChange}
          className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
          placeholder="Valor predeterminado"
          rows={2}
        ></textarea>
      </div>
      
      <div>
        <label htmlFor="maxLength" className="block text-sm font-medium text-gray-700 mb-1">
          Longitud máxima
        </label>
        <input
          type="number"
          id="maxLength"
          name="maxLength"
          min="0"
          value={(options.maxLength as number) || ''}
          onChange={handleOptionChange}
          className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
          placeholder="Sin límite"
        />
        <p className="mt-1 text-xs text-gray-500">
          Dejar en blanco para sin límite
        </p>
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
      </div>
    </div>
  );
  
  if (!showPreview) {
    return editorContent;
  }
  
  return (
    <FieldLayout
      title="Área de Texto"
      description="Permite al usuario introducir texto de múltiples líneas"
      preview={<TextAreaFieldPreview field={localField} />}
      editor={editorContent}
    />
  );
} 