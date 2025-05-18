'use client';

import { useState, useEffect } from 'react';
import { FormFieldBase } from '@/types/forms';
import { FieldProps, BaseFieldPreview, FieldLayout } from './FieldBase';

// Componente de vista previa para campos de teléfono
export function PhoneFieldPreview({ field }: { field: FormFieldBase }) {
  return (
    <BaseFieldPreview field={field}>
      <input
        type="tel"
        id={`preview-${field.name}`}
        name={`preview-${field.name}`}
        placeholder={field.placeholder || ''}
        disabled
        className="w-full p-2 border border-gray-300 rounded-md bg-gray-50 cursor-not-allowed"
      />
    </BaseFieldPreview>
  );
}

// Componente de edición para campos de teléfono
export function PhoneField({ field, onChange, showPreview = true }: FieldProps) {
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
  
  const handleOptionChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const newValue = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
    
    const updatedField = {
      ...localField,
      options: {
        ...localField.options,
        [name]: newValue
      }
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
          placeholder="Ej: Teléfono"
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
          placeholder="Ej: phone"
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
          placeholder="Ej: +34 600 00 00 00"
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
          placeholder="Ej: Incluya el código de país"
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
      
      <div className="space-y-2">
        <label htmlFor="format" className="block text-sm font-medium text-gray-700">
          Formato de teléfono
        </label>
        <select
          id="format"
          name="format"
          value={(localField.options?.format as string) || 'international'}
          onChange={handleOptionChange}
          className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="international">Internacional (+34 600 00 00 00)</option>
          <option value="national">Nacional (600 00 00 00)</option>
          <option value="any">Cualquier formato</option>
        </select>
      </div>
      
      <div className="space-y-2">
        <label htmlFor="defaultCountry" className="block text-sm font-medium text-gray-700">
          País por defecto
        </label>
        <select
          id="defaultCountry"
          name="defaultCountry"
          value={(localField.options?.defaultCountry as string) || 'ES'}
          onChange={handleOptionChange}
          className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="ES">España (+34)</option>
          <option value="US">Estados Unidos (+1)</option>
          <option value="MX">México (+52)</option>
          <option value="CO">Colombia (+57)</option>
          <option value="AR">Argentina (+54)</option>
          <option value="CL">Chile (+56)</option>
          <option value="PE">Perú (+51)</option>
          <option value="none">Sin país por defecto</option>
        </select>
      </div>
      
      <div className="flex items-center">
        <input
          type="checkbox"
          id="showCountryCode"
          name="showCountryCode"
          checked={!!(localField.options?.showCountryCode)}
          onChange={handleOptionChange}
          className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
        />
        <label htmlFor="showCountryCode" className="ml-2 text-sm text-gray-700">
          Mostrar selector de código de país
        </label>
      </div>
      
      <div>
        <label htmlFor="defaultValue" className="block text-sm font-medium text-gray-700 mb-1">
          Valor predeterminado
        </label>
        <input
          type="tel"
          id="defaultValue"
          name="defaultValue"
          value={localField.defaultValue || ''}
          onChange={handleChange}
          className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
          placeholder="Ej: +34 600 00 00 00"
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
      </div>
      
      <div className="p-4 bg-blue-50 border-l-4 border-blue-500 rounded">
        <p className="text-sm text-blue-700">
          <strong>Nota:</strong> El número de teléfono será validado según el formato seleccionado.
        </p>
      </div>
    </div>
  );
  
  if (!showPreview) {
    return editorContent;
  }
  
  return (
    <FieldLayout
      title="Campo de Teléfono"
      description="Permite al usuario introducir un número de teléfono con formato específico"
      preview={<PhoneFieldPreview field={localField} />}
      editor={editorContent}
    />
  );
} 