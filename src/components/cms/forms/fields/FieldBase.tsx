'use client';

import { FormFieldType, FormFieldBase } from '@/types/forms';

// Interfaz base para todos los componentes de campo
export interface FieldProps {
  // Propiedades comunes
  field: FormFieldBase | null;
  onChange: (field: Partial<FormFieldBase>) => void;
  showPreview?: boolean;
}

// Interfaz para la previsualización
export interface FieldPreviewProps {
  field: FormFieldBase;
}

// Mapa de nombres amigables para los tipos de campo
export const fieldTypeNames: Record<FormFieldType, string> = {
  TEXT: 'Text Input',
  TEXTAREA: 'Multi-line Text',
  EMAIL: 'Email Address',
  PASSWORD: 'Password',
  NUMBER: 'Number',
  PHONE: 'Phone Number',
  DATE: 'Date Picker',
  TIME: 'Time Picker',
  DATETIME: 'Date & Time',
  SELECT: 'Dropdown Selection',
  MULTISELECT: 'Multi-select',
  RADIO: 'Radio Buttons',
  CHECKBOX: 'Checkbox',
  TOGGLE: 'Toggle Switch',
  SLIDER: 'Slider',
  RATING: 'Rating',
  FILE: 'File Upload',
  HIDDEN: 'Hidden Field',
  HEADING: 'Heading',
  PARAGRAPH: 'Paragraph Text',
  DIVIDER: 'Divider',
  SPACER: 'Spacer',
  HTML: 'Custom HTML',
  CAPTCHA: 'CAPTCHA',
  SIGNATURE: 'Signature',
  AUTOCOMPLETE: 'Autocomplete',
  ADDRESS: 'Address'
};

// Componente de Vista Previa Base
export function BaseFieldPreview({ field, children }: { field: FormFieldBase; children: React.ReactNode }) {
  return (
    <div className="field-preview p-4 border border-gray-200 rounded-md bg-white">
      <div className="field-preview-header mb-2 pb-2 border-b border-gray-100">
        <div className="text-xs text-gray-500">Vista previa</div>
      </div>
      
      <div className="field-preview-content">
        {field.type !== 'CHECKBOX' && field.type !== 'HIDDEN' && (
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {field.label} {field.isRequired && <span className="text-red-500">*</span>}
          </label>
        )}
        
        {children}
        
        {field.helpText && (
          <p className="mt-1 text-xs text-gray-500">{field.helpText}</p>
        )}
      </div>
    </div>
  );
}

// Layout base para componentes de campo
export function FieldLayout({ 
  title, 
  description,
  preview, 
  editor 
}: { 
  title: string;
  description?: string;
  preview: React.ReactNode;
  editor: React.ReactNode;
}) {
  return (
    <div className="field-editor-layout">
      <div className="mb-4">
        <h3 className="text-lg font-medium text-gray-900">{title}</h3>
        {description && <p className="text-sm text-gray-500 mt-1">{description}</p>}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="field-editor-section">{editor}</div>
        <div className="field-preview-section">{preview}</div>
      </div>
    </div>
  );
} 