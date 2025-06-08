'use client';

import { useState, useEffect, ChangeEvent } from 'react';
import { FormFieldBase, FormFieldType } from '@/types/forms';
import { FieldProps, BaseFieldPreview, FieldLayout } from './FieldBase';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { AlertTriangle } from 'lucide-react';

// Componente de vista previa para campos HTML personalizados
export function HtmlFieldPreview({ field }: { field: FormFieldBase }) {
  return (
    <BaseFieldPreview field={{...field, label: field.label || "Custom HTML Preview" }}>
      <div className="p-3 bg-amber-50 border border-dashed border-amber-300 rounded-md text-center">
        <AlertTriangle className="inline-block h-5 w-5 text-amber-500 mr-2" />
        <p className="text-sm text-amber-700">
          Custom HTML Content.
        </p>
        <p className="text-xs text-amber-600 mt-1">
          Preview is not available here for security reasons. Test on a live form.
        </p>
      </div>
    </BaseFieldPreview>
  );
}

// Componente de edición para campos HTML personalizados
export function HtmlField({ field, onChange, showPreview = true }: FieldProps) {
  const [localField, setLocalField] = useState<FormFieldBase>({
    id: field?.id || '',
    type: FormFieldType.HTML,
    label: 'Custom HTML Block', // Admin label
    name: 'customHtmlField',
    options: { htmlContent: '' },
    width: 100,
    order: 0,
    isRequired: false,
    ...field,
  });

  useEffect(() => {
    setLocalField(prev => ({
        ...prev,
        ...field,
        options: { htmlContent: '', ...field?.options, ...prev.options },
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
    const { name, value } = e.target; // name will be "htmlContent"
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
        <Label htmlFor="name">Identifier Name</Label>
        <Input
          id="name"
          name="name"
          value={localField.name}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder="e.g., custom_script_section"
        />
        <p className="mt-1 text-xs text-gray-500">Unique identifier (optional, for scripting or reference).</p>
      </div>

      <div>
        <Label htmlFor="htmlContent">HTML Content <span className="text-red-500">*</span></Label>
        <Textarea
          id="htmlContent"
          name="htmlContent" 
          value={(localField.options?.htmlContent as string) || ''}
          onChange={handleOptionsChange}
          onKeyDown={handleKeyDown}
          placeholder="Enter your custom HTML code here..."
          rows={10}
          className="font-mono text-sm"
        />
        <p className="mt-1 text-xs text-gray-500">
          Enter raw HTML. Be cautious with scripts or external content.
        </p>
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
        <p className="mt-1 text-xs text-gray-500">Content width (25%, 50%, 75%, 100%).</p>
      </div>
    </div>
  );

  if (!showPreview) {
    return editorContent;
  }

  return (
    <FieldLayout
      title="Custom HTML Field"
      description="Embeds raw HTML content into the form. Use with caution."
      preview={<HtmlFieldPreview field={localField} />}
      editor={editorContent}
    />
  );
}
