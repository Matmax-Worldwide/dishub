'use client';

import { useState, useEffect, ChangeEvent } from 'react';
import { FormFieldBase, FormFieldType } from '@/types/forms';
import { FieldProps, BaseFieldPreview, FieldLayout } from './FieldBase';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox'; // Assuming Checkbox is used like this

// Componente de vista previa para campos de número
export function NumberFieldPreview({ field }: { field: FormFieldBase }) {
  return (
    <BaseFieldPreview field={field}>
      <Input
        type="number"
        id={`preview-${field.name}`}
        name={`preview-${field.name}`}
        placeholder={field.placeholder || ''}
        disabled
        className="w-full bg-gray-50 cursor-not-allowed"
        // defaultValue={field.defaultValue} // HTML input type=number takes string for defaultValue/value
      />
    </BaseFieldPreview>
  );
}

// Componente de edición para campos de número
export function NumberField({ field, onChange, showPreview = true }: FieldProps) {
  const [localField, setLocalField] = useState<FormFieldBase>({
    type: FormFieldType.NUMBER,
    label: 'Number Input',
    name: 'numberField',
    placeholder: '',
    helpText: '',
    isRequired: false,
    defaultValue: '',
    width: 100,
    options: {}, // For min, max, step if needed later
    ...field,
  });

  useEffect(() => {
     setLocalField(prev => ({ ...prev, ...field }));
  }, [field]);

  if (!localField) return null;

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const { name, value, type } = e.target;
    const val = type === 'number' ? (value === '' ? '' : parseFloat(value)) : value;
    
    setLocalField(prev => {
        const updated = {...prev, [name]: val};
        onChange(updated);
        return updated;
    });
  };
  
  const handleCheckboxChange = (checked: boolean | 'indeterminate') => {
    // indeterminateto false for simplicity, or handle as needed
    const isChecked = checked === true; 
    setLocalField(prev => {
        const updated = {...prev, isRequired: isChecked };
        onChange(updated);
        return updated;
    });
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  const editorContent = (
    <div className="space-y-4" onClick={(e) => e.stopPropagation()} onMouseDown={(e) => e.stopPropagation()}>
      <div>
        <Label htmlFor="label">Field Label <span className="text-red-500">*</span></Label>
        <Input id="label" name="label" value={localField.label} onChange={handleChange} onKeyDown={handleKeyDown} placeholder="e.g., Age" />
      </div>
      
      <div>
        <Label htmlFor="name">Identifier Name <span className="text-red-500">*</span></Label>
        <Input id="name" name="name" value={localField.name} onChange={handleChange} onKeyDown={handleKeyDown} placeholder="e.g., user_age" />
        <p className="mt-1 text-xs text-gray-500">Unique identifier for the field.</p>
      </div>
      
      <div>
        <Label htmlFor="placeholder">Placeholder</Label>
        <Input id="placeholder" name="placeholder" value={localField.placeholder || ''} onChange={handleChange} onKeyDown={handleKeyDown} placeholder="e.g., Enter your age" />
      </div>
      
      <div>
        <Label htmlFor="helpText">Help Text</Label>
        <Input id="helpText" name="helpText" value={localField.helpText || ''} onChange={handleChange} onKeyDown={handleKeyDown} placeholder="e.g., Must be 18 or older" />
      </div>
      
      <div className="flex items-center space-x-2">
        <Checkbox
          id="isRequired"
          name="isRequired"
          checked={localField.isRequired || false}
          onCheckedChange={handleCheckboxChange}
          onClick={(e) => e.stopPropagation()}
        />
        <Label htmlFor="isRequired" className="text-sm font-medium">Field is Required</Label>
      </div>
      
      <div>
        <Label htmlFor="defaultValue">Default Value</Label>
        <Input
          type="number"
          id="defaultValue"
          name="defaultValue"
          value={localField.defaultValue || ''}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="e.g., 30"
        />
      </div>

      {/* Consider adding min, max, step to localField.options if needed */}
      {/* Example:
      <div>
        <Label htmlFor="options.min">Min Value</Label>
        <Input type="number" id="options.min" name="options.min" ... />
      </div> 
      */}
      
      <div>
        <Label htmlFor="width">Width (%)</Label>
        <Input
          type="number"
          id="width"
          name="width"
          min="25" max="100" step="25"
          value={localField.width || 100}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
        />
        <p className="mt-1 text-xs text-gray-500">Field width (25%, 50%, 75%, 100%).</p>
      </div>
    </div>
  );

  if (!showPreview) {
    return editorContent;
  }

  return (
    <FieldLayout
      title="Number Input Field"
      description="Allows users to enter numerical values."
      preview={<NumberFieldPreview field={localField} />}
      editor={editorContent}
    />
  );
}
