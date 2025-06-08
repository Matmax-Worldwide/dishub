'use client';

import { useState, useEffect } from 'react';
import { FormFieldBase } from '@/types/forms';
import { FieldProps, BaseFieldPreview, FieldLayout } from './FieldBase';
import { Eye, EyeOff } from 'lucide-react';

// Componente de vista previa para campos de contraseña
export function PasswordFieldPreview({ field }: { field: FormFieldBase }) {
  const [showPassword, setShowPassword] = useState(false);
  
  return (
    <BaseFieldPreview field={field}>
      <div className="relative">
        <input
          type={showPassword ? "text" : "password"}
          id={`preview-${field.name}`}
          name={`preview-${field.name}`}
          placeholder={field.placeholder || ''}
          disabled
          className="w-full p-2 border border-gray-300 rounded-md bg-gray-50 cursor-not-allowed pr-10"
        />
        <button 
          type="button" 
          className="absolute inset-y-0 right-0 px-3 text-gray-400 cursor-not-allowed"
          onClick={() => setShowPassword(!showPassword)}
          aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
          disabled
        >
          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
    </BaseFieldPreview>
  );
}

// Componente de edición para campos de contraseña
export function PasswordField({ field, onChange, showPreview = true }: FieldProps) {
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
    
    console.log(`Checkbox ${name} changed to ${checked}`); // Para debugging
    
    const updatedField = {
      ...localField,
      [name]: checked
    };
    
    console.log('Updated field after checkbox change:', updatedField);
    
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
          placeholder="Ej: Contraseña"
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
          placeholder="Ej: password"
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
          placeholder="Ej: Ingrese su contraseña"
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
          placeholder="Ej: Mínimo 8 caracteres, incluyendo letras y números"
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
            id="showToggle"
            name="showToggle"
            checked={!!(localField.options?.showToggle)}
            onChange={handleOptionChange}
            className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
          />
          <label htmlFor="showToggle" className="ml-2 text-sm text-gray-700">
            Mostrar/ocultar contraseña
          </label>
        </div>
      </div>
      
      <div className="space-y-2">
        <label htmlFor="minLength" className="block text-sm font-medium text-gray-700">
          Longitud mínima
        </label>
        <input
          type="number"
          id="minLength"
          name="minLength"
          min="0"
          value={(localField.options?.minLength as number) || 0}
          onChange={handleOptionChange}
          className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <p className="mt-1 text-xs text-gray-500">
          0 significa sin mínimo
        </p>
      </div>
      
      <div className="space-y-2">
        <label htmlFor="passwordStrength" className="block text-sm font-medium text-gray-700">
          Fortaleza de contraseña
        </label>
        <select
          id="passwordStrength"
          name="passwordStrength"
          value={(localField.options?.passwordStrength as string) || 'none'}
          onChange={handleOptionChange}
          className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="none">Sin validación</option>
          <option value="basic">Básica (letras y números)</option>
          <option value="medium">Media (mayúsculas, minúsculas y números)</option>
          <option value="strong">Fuerte (mayúsculas, minúsculas, números y símbolos)</option>
        </select>
      </div>
      
      <div className="flex items-center">
        <input
          type="checkbox"
          id="confirmPassword"
          name="confirmPassword"
          checked={!!(localField.options?.confirmPassword)}
          onChange={handleOptionChange}
          className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
        />
        <label htmlFor="confirmPassword" className="ml-2 text-sm text-gray-700">
          Requerir confirmación de contraseña
        </label>
      </div>
      
      {localField.options?.confirmPassword && (
        <div>
          <label htmlFor="confirmLabel" className="block text-sm font-medium text-gray-700 mb-1">
            Etiqueta para el campo de confirmación
          </label>
          <input
            type="text"
            id="confirmLabel"
            name="confirmLabel"
            value={(localField.options?.confirmLabel as string) || 'Confirmar Contraseña'}
            onChange={handleOptionChange}
            className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="Ej: Confirmar Contraseña"
          />
        </div>
      )}
      
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
          <strong>Nota:</strong> Por seguridad, las contraseñas nunca se almacenan en texto plano y no serán visibles en las respuestas del formulario.
        </p>
      </div>
    </div>
  );
  
  if (!showPreview) {
    return editorContent;
  }
  
  return (
    <FieldLayout
      title="Campo de Contraseña"
      description="Permite al usuario introducir una contraseña con opciones de seguridad"
      preview={<PasswordFieldPreview field={localField} />}
      editor={editorContent}
    />
  );
} 