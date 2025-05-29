'use client';

import { useState, useEffect, ChangeEvent } from 'react';
import { FormFieldBase, FormFieldType } from '@/types/forms';
import { FieldProps, BaseFieldPreview, FieldLayout } from './FieldBase';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

// Componente de vista previa para campos ocultos
export function HiddenFieldPreview({ field }: { field: FormFieldBase }) {
  return (
    <BaseFieldPreview field={{...field, label: field.label || "Hidden Field Preview" }}>
      <div className="p-3 bg-gray-100 border border-dashed border-gray-300 rounded-md text-center">
        <p className="text-sm text-gray-600 font-mono">
          Hidden Field: <strong>{field.name}</strong>
        </p>
        <p className="text-xs text-gray-500 mt-1">
          Default Value: "{field.defaultValue || ''}"
        </p>
      </div>
    </BaseFieldPreview>
  );
}

// Componente de edición para campos ocultos
export function HiddenField({ field, onChange, showPreview = true }: FieldProps) {
  const [localField, setLocalField] = useState<FormFieldBase>({
    type: FormFieldType.HIDDEN,
    label: 'Hidden Field', // Admin label
    name: 'hiddenField',
    defaultValue: '',
    width: 100, // Not visually relevant, but part of base type
    ...field,
  });

  useEffect(() => {
    setLocalField(prev => ({ ...prev, ...field }));
  }, [field]);

  if (!localField) return null;

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const { name, value } = e.target;
    setLocalField(prev => {
        const updated = {...prev, [name]: value};
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
        <Label htmlFor="label">Admin Label</Label>
        <Input
          id="label"
          name="label"
          value={localField.label}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="Label for admin reference"
        />
        <p className="mt-1 text-xs text-gray-500">Internal label for managing this field.</p>
      </div>
      
      <div>
        <Label htmlFor="name">Identifier Name / Key <span className="text-red-500">*</span></Label>
        <Input
          id="name"
          name="name"
          value={localField.name}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="e.g., user_id, source_campaign"
        />
        <p className="mt-1 text-xs text-gray-500">The name/key used when submitting the form data.</p>
      </div>

      <div>
        <Label htmlFor="defaultValue">Default Value <span className="text-red-500">*</span></Label>
        <Input
          id="defaultValue"
          name="defaultValue"
          value={localField.defaultValue || ''}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="Enter the hidden value"
        />
        <p className="mt-1 text-xs text-gray-500">This value will be submitted with the form.</p>
      </div>
    </div>
  );

  if (!showPreview) {
    return editorContent;
  }

  return (
    <FieldLayout
      title="Hidden Field"
      description="Includes data in the form submission that is not visible to the user."
      preview={<HiddenFieldPreview field={localField} />}
      editor={editorContent}
    />
  );
}
