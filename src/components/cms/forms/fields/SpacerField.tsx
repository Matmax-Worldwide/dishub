'use client';

import { useState, useEffect, ChangeEvent } from 'react';
import { FormFieldBase, FormFieldType } from '@/types/forms';
import { FieldProps, BaseFieldPreview, FieldLayout } from './FieldBase';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

// Componente de vista previa para campos de espaciador
export function SpacerFieldPreview({ field }: { field: FormFieldBase }) {
  const height = field.options?.height || 20; // Default height if not specified
  return (
    <BaseFieldPreview field={{...field, label: field.label || "Spacer Preview" }}>
      <div 
        style={{ height: `${height}px` }} 
        className="w-full bg-slate-100 border border-dashed border-slate-300 rounded-md flex items-center justify-center"
      >
        <span className="text-xs text-slate-500">{height}px Spacer</span>
      </div>
    </BaseFieldPreview>
  );
}

// Componente de edición para campos de espaciador
export function SpacerField({ field, onChange, showPreview = true }: FieldProps) {
  const [localField, setLocalField] = useState<FormFieldBase>({
    type: FormFieldType.SPACER,
    label: 'Spacer Block', // Admin label
    name: 'spacerField',
    options: { height: 20 }, // Default height
    width: 100,
    ...field,
  });

  useEffect(() => {
    setLocalField(prev => ({
        ...prev,
        ...field,
        options: { height: 20, ...field?.options, ...prev.options },
    }));
  }, [field]);

  if (!localField) return null;

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const { name, value, type } = e.target;
    const val = type === 'number' ? parseInt(value, 10) : value;

    if (name === "options.height") {
        setLocalField(prev => {
            const updated = { ...prev, options: { ...prev.options, height: val as number } };
            onChange(updated);
            return updated;
        });
    } else {
        setLocalField(prev => {
            const updated = { ...prev, [name]: val };
            onChange(updated);
            return updated;
        });
    }
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
          placeholder="e.g., top_spacer"
        />
        <p className="mt-1 text-xs text-gray-500">Unique identifier for this spacer (optional).</p>
      </div>

      <div>
        <Label htmlFor="options.height">Spacer Height (pixels) <span className="text-red-500">*</span></Label>
        <Input
          type="number"
          id="options.height"
          name="options.height"
          min="5"
          step="5"
          value={localField.options?.height || 20}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
        />
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
        <p className="mt-1 text-xs text-gray-500">Typically 100% for spacers, adjust if needed.</p>
      </div>
    </div>
  );

  if (!showPreview) {
    return editorContent;
  }

  return (
    <FieldLayout
      title="Spacer Field"
      description="Adds empty vertical space between fields."
      preview={<SpacerFieldPreview field={localField} />}
      editor={editorContent}
    />
  );
}
