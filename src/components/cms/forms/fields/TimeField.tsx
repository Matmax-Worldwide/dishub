'use client';

import { useState, useEffect, ChangeEvent } from 'react';
import { FormFieldBase, FormFieldType } from '@/types/forms';
import { FieldProps, BaseFieldPreview, FieldLayout } from './FieldBase';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';

// Componente de vista previa para campos de hora
export function TimeFieldPreview({ field }: { field: FormFieldBase }) {
  return (
    <BaseFieldPreview field={field}>
      <Input
        type="time"
        id={`preview-${field.name}`}
        name={`preview-${field.name}`}
        disabled
        className="w-full bg-gray-50 cursor-not-allowed"
        // defaultValue={field.defaultValue} // HTML input type=time takes string HH:MM
      />
    </BaseFieldPreview>
  );
}

// Componente de edición para campos de hora
export function TimeField({ field, onChange, showPreview = true }: FieldProps) {
  const [localField, setLocalField] = useState<FormFieldBase>({
    type: FormFieldType.TIME,
    label: 'Time Input',
    name: 'timeField',
    placeholder: '',
    helpText: '',
    isRequired: false,
    defaultValue: '', // Should be in HH:MM format if pre-filled
    width: 100,
    ...field,
  });

  useEffect(() => {
     setLocalField(prev => ({ ...prev, ...field }));
  }, [field]);

  if (!localField) return null;

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const { name, value } = e.target;
    setLocalField(prev => {
        const updated = {...prev, [name]: value};
        onChange(updated);
        return updated;
    });
  };
  
  const handleCheckboxChange = (checked: boolean | 'indeterminate') => {
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
        <Input id="label" name="label" value={localField.label} onChange={handleChange} onKeyDown={handleKeyDown} placeholder="e.g., Appointment Time" />
      </div>
      
      <div>
        <Label htmlFor="name">Identifier Name <span className="text-red-500">*</span></Label>
        <Input id="name" name="name" value={localField.name} onChange={handleChange} onKeyDown={handleKeyDown} placeholder="e.g., appt_time" />
        <p className="mt-1 text-xs text-gray-500">Unique identifier for the field.</p>
      </div>
      
      <div>
        <Label htmlFor="placeholder">Placeholder</Label>
        <Input id="placeholder" name="placeholder" value={localField.placeholder || ''} onChange={handleChange} onKeyDown={handleKeyDown} placeholder="e.g., Select a time" />
      </div>
      
      <div>
        <Label htmlFor="helpText">Help Text</Label>
        <Input id="helpText" name="helpText" value={localField.helpText || ''} onChange={handleChange} onKeyDown={handleKeyDown} placeholder="e.g., Select your preferred time" />
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
          type="time" // HTML5 time picker
          id="defaultValue"
          name="defaultValue"
          value={localField.defaultValue || ''} // Expects HH:MM
          onChange={handleChange}
          onKeyDown={handleKeyDown}
        />
        <p className="mt-1 text-xs text-gray-500">Format: HH:MM (24-hour).</p>
      </div>
      
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
      title="Time Input Field"
      description="Allows users to select a time."
      preview={<TimeFieldPreview field={localField} />}
      editor={editorContent}
    />
  );
}
