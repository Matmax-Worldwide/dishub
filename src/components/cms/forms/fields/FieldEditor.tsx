'use client';

import { useState, useEffect } from 'react';
import { FieldOptions, FormFieldBase, FormFieldType } from '@/types/forms';
import { TextField } from './TextField';
import { TextAreaField } from './TextAreaField';
import { SelectField } from './SelectField';
import { RadioField } from './RadioField';
import { CheckboxField } from './CheckboxField';
import { EmailField } from './EmailField';
import { PasswordField } from './PasswordField';
import { PhoneField } from './PhoneField';
import { fieldTypeNames } from './FieldBase';

// Propiedades para el editor de campos
interface FieldEditorProps {
  field: FormFieldBase | null;
  onSave: (field: FormFieldBase) => void;
  onCancel: () => void;
  formId?: string;
}

// Helper para verificar si un componente está implementado
const isComponentImplemented = (fieldType: FormFieldType): boolean => {
  switch (fieldType) {
    case FormFieldType.TEXT:
    case FormFieldType.TEXTAREA:
    case FormFieldType.EMAIL:
    case FormFieldType.PASSWORD:
    case FormFieldType.PHONE:
    case FormFieldType.SELECT:
    case FormFieldType.RADIO:
    case FormFieldType.CHECKBOX:
      return true;
    default:
      return false;
  }
};

// Componente para seleccionar el tipo de campo
const FieldTypeSelector = ({ selectedType, onChange }: { 
  selectedType: FormFieldType;
  onChange: (type: FormFieldType) => void;
}) => {
  const fieldTypes = Object.keys(fieldTypeNames) as FormFieldType[];
  
  return (
    <div className="mb-6">
      <h3 className="text-lg font-medium text-gray-900 mb-3">Tipo de Campo</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {fieldTypes.map((type) => {
          const isImplemented = isComponentImplemented(type);
          return (
            <div
              key={type}
              className={`p-3 border rounded-md cursor-pointer transition-colors ${
                selectedType === type 
                  ? 'border-blue-500 bg-blue-50 shadow-sm' 
                  : isImplemented 
                    ? 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    : 'border-yellow-400 border-2 hover:border-yellow-500 bg-black bg-opacity-70 text-white'
              }`}
              onClick={() => onChange(type)}
              title={isImplemented ? 'Componente implementado' : 'Componente pendiente de implementación'}
            >
              <div className="text-sm font-medium">
                {fieldTypeNames[type]}
                {!isImplemented && ' 🚧'}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Componente principal de editor de campos
export function FieldEditor({ field, onSave, onCancel, formId }: FieldEditorProps) {
  const [editingField, setEditingField] = useState<FormFieldBase | null>(field);
  const [fieldType, setFieldType] = useState<FormFieldType>(field?.type || FormFieldType.TEXT);
  
  // Inicializar el campo si se proporciona
  useEffect(() => {
    if (field) {
      setEditingField({
        ...field, 
        isRequired: field.isRequired === true  // Asegurarse que sea booleano
      });
      setFieldType(field.type);
    } else if (formId) {
      // Inicializar un nuevo campo si no se proporciona uno
      setEditingField({
        id: 'temp-id', // ID temporal para gestión local, se elimina antes de enviar al servidor
        formId,
        label: '',
        name: '',
        type: fieldType,
        isRequired: false,  // Explícitamente false
        order: 0
      });
    }
  }, [field, formId, fieldType]);
  
  // Manejar el cambio de tipo de campo
  const handleTypeChange = (newType: FormFieldType) => {
    setFieldType(newType);
    
    if (editingField) {
      // Actualizamos solo el tipo y mantenemos el resto de propiedades
      const updatedField: FormFieldBase = {
        ...editingField,
        type: newType,
        // Reiniciar opciones específicas al cambiar el tipo
        options: {} as FieldOptions
      };
      
      setEditingField(updatedField);
    }
  };
  
  // Manejar cambios en las propiedades del campo
  const handleFieldChange = (updatedField: Partial<FormFieldBase>) => {
    if (editingField) {
      setEditingField({
        ...editingField,
        ...updatedField
      });
    }
  };
  
  // Manejar guardado del campo
  const handleSave = () => {
    if (editingField) {
      onSave(editingField);
    }
  };
  
  // Renderizar el editor para el tipo de campo seleccionado
  const renderFieldEditor = () => {
    if (!editingField) return null;
    
    switch (fieldType) {
      case FormFieldType.TEXT:
        return <TextField field={editingField} onChange={handleFieldChange} />;
      case FormFieldType.TEXTAREA:
        return <TextAreaField field={editingField} onChange={handleFieldChange} />;
      case FormFieldType.EMAIL:
        return <EmailField field={editingField} onChange={handleFieldChange} />;
      case FormFieldType.PASSWORD:
        return <PasswordField field={editingField} onChange={handleFieldChange} />;
      case FormFieldType.PHONE:
        return <PhoneField field={editingField} onChange={handleFieldChange} />;
      case FormFieldType.SELECT:
        return <SelectField field={editingField} onChange={handleFieldChange} />;
      case FormFieldType.RADIO:
        return <RadioField field={editingField} onChange={handleFieldChange} />;
      case FormFieldType.CHECKBOX:
        return <CheckboxField field={editingField} onChange={handleFieldChange} />;
      default:
        // Para componentes no implementados, mostrar un mensaje con estilo especial
        return (
          <div className="bg-black bg-opacity-70 border-2 border-yellow-400 p-6 rounded-lg text-white">
            <h3 className="text-xl font-bold mb-3">Componente no implementado</h3>
            <p>
              El componente para el tipo de campo <strong>{fieldTypeNames[fieldType]}</strong> aún no ha sido implementado.
            </p>
            <p className="mt-2">
              Se utilizará el editor de texto por defecto temporalmente.
            </p>
            <div className="mt-4 pt-4 border-t border-yellow-400">
              <TextField field={editingField} onChange={handleFieldChange} />
            </div>
          </div>
        );
    }
  };
  
  return (
    <div className="field-editor">
      <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
        <div className="mb-4 pb-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">
            {field ? 'Editar Campo' : 'Nuevo Campo'}
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Configure las propiedades del campo para su formulario
          </p>
        </div>
        
        <FieldTypeSelector selectedType={fieldType} onChange={handleTypeChange} />
        
        <div className="field-editor-content">
          {renderFieldEditor()}
        </div>
        
        <div className="mt-8 pt-4 border-t border-gray-200 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Guardar Campo
          </button>
        </div>
      </div>
    </div>
  );
} 