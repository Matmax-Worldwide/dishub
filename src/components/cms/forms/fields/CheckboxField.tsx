'use client';

import { useState, useEffect } from 'react';
import { FormFieldBase } from '@/types/forms';
import { FieldProps, BaseFieldPreview, FieldLayout } from './FieldBase';

// Componente de vista previa para checkbox
export function CheckboxFieldPreview({ field }: { field: FormFieldBase }) {
  return (
    <BaseFieldPreview field={field}>
      <div className="flex items-center">
        <input
          type="checkbox"
          id={`preview-${field.name}`}
          name={`preview-${field.name}`}
          disabled
          className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-not-allowed"
        />
        <label htmlFor={`preview-${field.name}`} className="ml-2 text-sm text-gray-700">
          {field.label} {field.isRequired && <span className="text-red-500">*</span>}
        </label>
      </div>
    </BaseFieldPreview>
  );
}

// Componente de edición para checkbox
export function CheckboxField({ field, onChange, showPreview = true }: FieldProps) {
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
          Texto de la casilla <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="label"
          name="label"
          value={localField.label}
          onChange={handleChange}
          className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
          placeholder="Ej: Acepto los términos y condiciones"
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
          placeholder="Ej: accept_terms"
        />
        <p className="mt-1 text-xs text-gray-500">
          Identificador único para el campo (sin espacios ni caracteres especiales)
        </p>
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
          placeholder="Ej: Al marcar esta casilla, confirmas que has leído y aceptado nuestros términos"
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
            id="defaultChecked"
            name="defaultValue"
            checked={localField.defaultValue === 'true'}
            onChange={(e) => handleChange({ ...e, target: { ...e.target, name: 'defaultValue', value: e.target.checked ? 'true' : '' } } as React.ChangeEvent<HTMLInputElement>)}
            className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
          />
          <label htmlFor="defaultChecked" className="ml-2 text-sm text-gray-700">
            Marcado por defecto
          </label>
        </div>
      </div>
      
      <div className="space-y-2">
        <label htmlFor="labelPosition" className="block text-sm font-medium text-gray-700">
          Posición de la etiqueta
        </label>
        <select
          id="labelPosition"
          name="labelPosition"
          value={(localField.options?.labelPosition as string) || 'right'}
          onChange={(e) => {
            const updatedField = {
              ...localField,
              options: {
                ...localField.options,
                labelPosition: e.target.value as 'left' | 'right'
              }
            };
            setLocalField(updatedField);
            onChange(updatedField);
          }}
          className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="right">Derecha (predeterminado)</option>
          <option value="left">Izquierda</option>
        </select>
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
      
      <div>
        <label htmlFor="linkText" className="block text-sm font-medium text-gray-700 mb-1">
          Texto con enlace (opcional)
        </label>
        <input
          type="text"
          id="linkText"
          name="linkText"
          value={(localField.options?.linkText as string) || ''}
          onChange={(e) => {
            const updatedField = {
              ...localField,
              options: {
                ...localField.options,
                linkText: e.target.value
              }
            };
            setLocalField(updatedField);
            onChange(updatedField);
          }}
          className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
          placeholder="Ej: Ver nuestros términos y condiciones"
        />
      </div>
      
      <div>
        <label htmlFor="linkUrl" className="block text-sm font-medium text-gray-700 mb-1">
          URL del enlace
        </label>
        <input
          type="url"
          id="linkUrl"
          name="linkUrl"
          value={(localField.options?.linkUrl as string) || ''}
          onChange={(e) => {
            const updatedField = {
              ...localField,
              options: {
                ...localField.options,
                linkUrl: e.target.value
              }
            };
            setLocalField(updatedField);
            onChange(updatedField);
          }}
          className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
          placeholder="Ej: https://ejemplo.com/terminos"
        />
      </div>
    </div>
  );
  
  if (!showPreview) {
    return editorContent;
  }
  
  return (
    <FieldLayout
      title="Casilla de Verificación"
      description="Permite al usuario marcar o desmarcar una opción"
      preview={<CheckboxFieldPreview field={localField} />}
      editor={editorContent}
    />
  );
} 