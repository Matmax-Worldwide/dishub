'use client';

import { useState, useEffect, ChangeEvent } from 'react';
import { FormFieldBase, FormFieldType } from '@/types/forms';
import { FieldProps, BaseFieldPreview, FieldLayout } from './FieldBase';
import { Label } from '@/app/components/ui/label';
import { Input } from '@/app/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';

// Componente de vista previa para campos de encabezado
export function HeadingFieldPreview({ field }: { field: FormFieldBase }) {
  const level = field.options?.level || 'h2';
  const HeadingTag = level as keyof JSX.IntrinsicElements; // h1, h2, etc.
  
  return (
    <BaseFieldPreview field={{...field, label: ''}}> {/* Hide base label as heading text is the label */}
      <HeadingTag className={`font-bold ${
        level === 'h1' ? 'text-3xl' : 
        level === 'h2' ? 'text-2xl' : 
        level === 'h3' ? 'text-xl' : 
        level === 'h4' ? 'text-lg' : 
        level === 'h5' ? 'text-base' : 
        'text-sm' // h6
      }`}>
        {field.label || "Heading Text"}
      </HeadingTag>
    </BaseFieldPreview>
  );
}

// Componente de edición para campos de encabezado
export function HeadingField({ field, onChange, showPreview = true }: FieldProps) {
  const [localField, setLocalField] = useState<FormFieldBase>({
    id: field?.id || '',
    order: field?.order || 0,
    isRequired: field?.isRequired || false,
    type: FormFieldType.HEADING,
    label: 'New Heading',
    name: 'headingField',
    options: { level: 'h2' },
    width: 100,
    ...field, // Override defaults with incoming field props
  });

  useEffect(() => {
    // Ensure options object exists
    setLocalField(prev => ({
        ...prev,
        ...field,
        options: { level: 'h2', ...field?.options, ...prev.options  },
    }));
  }, [field]);

  if (!localField) return null;

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const { name, value } = e.target;
    const updatedField = { ...localField, [name]: value };
    setLocalField(updatedField);
    onChange(updatedField);
  };
  
  const handleSelectChange = (name: string, value: string) => {
     // For options, we need to update nested property
    if (name === "options.level") {
        const updatedField = {
            ...localField,
            options: {
                ...localField.options,
                level: value
            }
        };
        setLocalField(updatedField);
        onChange(updatedField);
    } else {
        const updatedField = { ...localField, [name]: value };
        setLocalField(updatedField);
        onChange(updatedField);
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
        <Label htmlFor="label">Heading Text <span className="text-red-500">*</span></Label>
        <Input
          id="label"
          name="label"
          value={localField.label}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="Enter heading text"
        />
      </div>
      
      <div>
        <Label htmlFor="name">Identifier Name <span className="text-red-500">*</span></Label>
        <Input
          id="name"
          name="name"
          value={localField.name}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="e.g., section_title"
        />
         <p className="mt-1 text-xs text-gray-500">Unique identifier for this heading (optional for display fields).</p>
      </div>

      <div>
        <Label htmlFor="options.level">Heading Level</Label>
        <Select
          name="options.level"
          value={localField.options?.level as string || 'h2'}
          onValueChange={(value) => handleSelectChange('options.level', value)}
        >
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="h1">H1 (Largest)</SelectItem>
            <SelectItem value="h2">H2</SelectItem>
            <SelectItem value="h3">H3</SelectItem>
            <SelectItem value="h4">H4</SelectItem>
            <SelectItem value="h5">H5</SelectItem>
            <SelectItem value="h6">H6 (Smallest)</SelectItem>
          </SelectContent>
        </Select>
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
        <p className="mt-1 text-xs text-gray-500">Field width (25%, 50%, 75%, 100%). Affects layout.</p>
      </div>
    </div>
  );

  if (!showPreview) {
    return editorContent;
  }

  return (
    <FieldLayout
      title="Heading Field"
      description="Displays a section heading or title."
      preview={<HeadingFieldPreview field={localField} />}
      editor={editorContent}
    />
  );
}
