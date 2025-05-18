'use client';

import { useState, useEffect } from 'react';
import { FormFieldBase } from '@/types/forms';
import { FieldProps, BaseFieldPreview, FieldLayout } from './FieldBase';
import { PlusCircle, XCircle, GripVertical } from 'lucide-react';

// Interfaz para opciones de selección
interface SelectOption {
  label: string;
  value: string;
  disabled?: boolean;
}

// Componente de vista previa para selección
export function SelectFieldPreview({ field }: { field: FormFieldBase }) {
  const options = (field.options?.items || []) as SelectOption[];
  
  return (
    <BaseFieldPreview field={field}>
      <select
        id={`preview-${field.name}`}
        name={`preview-${field.name}`}
        disabled
        className="w-full p-2 border border-gray-300 rounded-md bg-gray-50 cursor-not-allowed"
      >
        {field.placeholder && (
          <option value="">{field.placeholder}</option>
        )}
        
        {options.map((option, index) => (
          <option key={index} value={option.value} disabled={option.disabled}>
            {option.label}
          </option>
        ))}
      </select>
    </BaseFieldPreview>
  );
}

// Componente de edición para selección
export function SelectField({ field, onChange, showPreview = true }: FieldProps) {
  const [localField, setLocalField] = useState<FormFieldBase | null>(field);
  const [options, setOptions] = useState<SelectOption[]>([]);
  const [newOption, setNewOption] = useState<{ label: string; value: string }>({ label: '', value: '' });
  
  // Inicializar opciones desde el campo
  useEffect(() => {
    if (field) {
      setLocalField(field);
      setOptions((field.options?.items || []) as SelectOption[]);
    }
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
  
  const handleNewOptionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    // Auto-generate value from label if value is empty
    if (name === 'label' && !newOption.value) {
      setNewOption({
        ...newOption,
        label: value,
        value: value.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '')
      });
    } else {
      setNewOption({
        ...newOption,
        [name]: value
      });
    }
  };
  
  const handleAddOption = () => {
    if (!newOption.label || !newOption.value) return;
    
    const updatedOptions = [...options, { ...newOption }];
    setOptions(updatedOptions);
    
    // Update the field with new options
    const updatedField = {
      ...localField,
      options: {
        ...localField.options,
        items: updatedOptions
      }
    };
    
    setLocalField(updatedField);
    onChange(updatedField);
    
    // Reset new option form
    setNewOption({ label: '', value: '' });
  };
  
  const handleRemoveOption = (index: number) => {
    const updatedOptions = options.filter((_, i) => i !== index);
    setOptions(updatedOptions);
    
    // Update the field with new options
    const updatedField = {
      ...localField,
      options: {
        ...localField.options,
        items: updatedOptions
      }
    };
    
    setLocalField(updatedField);
    onChange(updatedField);
  };
  
  const handleToggleOptionDisabled = (index: number) => {
    const updatedOptions = [...options];
    updatedOptions[index] = {
      ...updatedOptions[index],
      disabled: !updatedOptions[index].disabled
    };
    
    setOptions(updatedOptions);
    
    // Update the field with new options
    const updatedField = {
      ...localField,
      options: {
        ...localField.options,
        items: updatedOptions
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
          placeholder="Ej: País"
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
          placeholder="Ej: country"
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
          placeholder="Ej: Seleccione un país"
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
          placeholder="Ej: Seleccione su país de residencia"
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
      
      {/* Opciones del select */}
      <div className="border border-gray-200 rounded-md p-4 bg-gray-50">
        <h4 className="text-sm font-medium text-gray-900 mb-3">Opciones de selección</h4>
        
        {options.length > 0 ? (
          <ul className="space-y-2 mb-4">
            {options.map((option, index) => (
              <li key={index} className="flex items-center gap-2 p-2 bg-white border border-gray-200 rounded-md">
                <span className="text-gray-400 cursor-move">
                  <GripVertical size={16} />
                </span>
                <div className="flex-1 flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-700">{option.label}</span>
                  <span className="text-xs text-gray-500">({option.value})</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleToggleOptionDisabled(index)}
                    className={`text-xs px-2 py-1 rounded ${option.disabled ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}
                  >
                    {option.disabled ? 'Deshabilitado' : 'Habilitado'}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRemoveOption(index)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <XCircle size={16} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="bg-white p-3 text-center text-gray-500 border border-dashed border-gray-300 rounded-md mb-4">
            No hay opciones. Agrega al menos una opción para este campo.
          </div>
        )}
        
        {/* Formulario para agregar nueva opción */}
        <div className="flex gap-2 items-end">
          <div className="flex-1">
            <label htmlFor="optionLabel" className="block text-xs font-medium text-gray-700 mb-1">
              Etiqueta
            </label>
            <input
              type="text"
              id="optionLabel"
              name="label"
              value={newOption.label}
              onChange={handleNewOptionChange}
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="Ej: España"
            />
          </div>
          <div className="flex-1">
            <label htmlFor="optionValue" className="block text-xs font-medium text-gray-700 mb-1">
              Valor
            </label>
            <input
              type="text"
              id="optionValue"
              name="value"
              value={newOption.value}
              onChange={handleNewOptionChange}
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="Ej: spain"
            />
          </div>
          <button
            type="button"
            onClick={handleAddOption}
            disabled={!newOption.label || !newOption.value}
            className="p-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <PlusCircle size={20} />
          </button>
        </div>
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
      title="Menú Desplegable"
      description="Permite al usuario seleccionar una opción de una lista desplegable"
      preview={<SelectFieldPreview field={localField} />}
      editor={editorContent}
    />
  );
} 