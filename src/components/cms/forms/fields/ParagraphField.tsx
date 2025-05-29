'use client';

import { useState, useEffect, ChangeEvent } from 'react';
import { FormFieldBase, FormFieldType } from '@/types/forms';
import { FieldProps, BaseFieldPreview, FieldLayout } from './FieldBase';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

// Componente de vista previa para campos de párrafo
export function ParagraphFieldPreview({ field }: { field: FormFieldBase }) {
  return (
    <BaseFieldPreview field={{...field, label: field.label || "Paragraph Preview" }}>
      <p className="text-sm text-gray-700 whitespace-pre-wrap">
        {String(field.options?.content || "This is a sample paragraph.")}
      </p>
    </BaseFieldPreview>
  );
}

// Componente de edición para campos de párrafo
export function ParagraphField({ field, onChange, showPreview = true }: FieldProps) {
  const [localField, setLocalField] = useState<FormFieldBase>({
    id: field?.id || '',
    type: FormFieldType.PARAGRAPH,
    label: 'Paragraph Block', // Admin label
    name: 'paragraphField',
    isRequired: false,
    order: field?.order || 0,
    options: { content: '' },
    width: 100,
    ...field,
  });

  useEffect(() => {
    setLocalField(prev => ({
        ...prev,
        ...field,
        options: { content: '', ...field?.options, ...prev.options },
    }));
  }, [field]);

  if (!localField) return null;

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const { name, value } = e.target;
    setLocalField(prev => {
        const updated = {...prev, [name]: value};
        onChange(updated);
        return updated;
    });
  };

  const handleOptionsChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const { name, value } = e.target; // name will be "content"
    setLocalField(prev => {
        const updated = {
            ...prev,
            options: {
                ...prev.options,
                [name]: value,
            }
        };
        onChange(updated);
        return updated;
    });
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Allow Enter key for Textarea
    if (e.key === 'Enter' && !(e.target instanceof HTMLTextAreaElement)) {
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
          onChange={handleInputChange}
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
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder="e.g., intro_paragraph"
        />
        <p className="mt-1 text-xs text-gray-500">Unique identifier for this paragraph block (optional).</p>
      </div>

      <div>
        <Label htmlFor="content">Paragraph Text <span className="text-red-500">*</span></Label>
        <Textarea
          id="content"
          name="content" // This name will be used in handleOptionsChange
          value={String(localField.options?.content || '')}
          onChange={handleOptionsChange}
          onKeyDown={handleKeyDown}
          placeholder="Enter paragraph text here..."
          rows={6}
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
          onChange={handleInputChange}
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
      title="Paragraph Field"
      description="Displays a block of text."
      preview={<ParagraphFieldPreview field={localField} />}
      editor={editorContent}
    />
  );
}
