'use client';

import { useState, useEffect, ChangeEvent } from 'react';
import { FormFieldBase, FormFieldType } from '@/types/forms';
import { FieldProps, BaseFieldPreview, FieldLayout } from './FieldBase';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

// Componente de vista previa para campos de divisor
export function DividerFieldPreview({ field }: { field: FormFieldBase }) {
  return (
    <BaseFieldPreview field={{...field, label: field.label || "Divider Preview" }}>
      <hr className="my-2 border-gray-300" />
    </BaseFieldPreview>
  );
}

// Componente de edición para campos de divisor
export function DividerField({ field, onChange, showPreview = true }: FieldProps) {
  const [localField, setLocalField] = useState<FormFieldBase>({
    type: FormFieldType.DIVIDER,
    label: 'Divider', // Admin label
    name: 'dividerField',
    width: 100,
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
        <Label htmlFor="name">Identifier Name <span className="text-red-500">*</span></Label>
        <Input
          id="name"
          name="name"
          value={localField.name}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="e.g., section_divider"
        />
         <p className="mt-1 text-xs text-gray-500">Unique identifier for this divider (optional).</p>
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
        <p className="mt-1 text-xs text-gray-500">Visual width of the divider line.</p>
      </div>
    </div>
  );

  if (!showPreview) {
    return editorContent;
  }

  return (
    <FieldLayout
      title="Divider Field"
      description="Adds a horizontal line to separate content."
      preview={<DividerFieldPreview field={localField} />}
      editor={editorContent}
    />
  );
}
