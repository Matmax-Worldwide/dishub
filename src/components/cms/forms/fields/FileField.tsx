'use client';

import { useState, useEffect, ChangeEvent } from 'react';
import { FormFieldBase, FormFieldType } from '@/types/forms';
import { FieldProps, BaseFieldPreview, FieldLayout } from './FieldBase';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';

// Componente de vista previa para campos de Archivo (File)
export function FileFieldPreview({ field }: { field: FormFieldBase }) {
  return (
    <BaseFieldPreview field={field}>
      <Input
        type="file"
        id={`preview-${field.name}`}
        name={`preview-${field.name}`}
        disabled
        className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-not-allowed"
      />
    </BaseFieldPreview>
  );
}

// Componente de edición para campos de Archivo (File)
export function FileField({ field, onChange, showPreview = true }: FieldProps) {
  // Helper to process options
  const processOptions = (fieldOptions: Record<string, unknown> | undefined) => ({
    allowedFileTypes: Array.isArray(fieldOptions?.allowedFileTypes) 
      ? (fieldOptions.allowedFileTypes as string[]).join(', ') 
      : (fieldOptions?.allowedFileTypes as string) || '',
    maxFileSizeMB: fieldOptions?.maxFileSizeMB !== undefined 
      ? Number(fieldOptions.maxFileSizeMB) 
      : 5,
  });

  const [localField, setLocalField] = useState<FormFieldBase>({
    id: field?.id || '',
    type: FormFieldType.FILE,
    label: 'File Upload',
    name: 'fileUploadField',
    helpText: '',
    isRequired: false,
    order: field?.order || 0,
    width: 100,
    ...field,
    options: processOptions(field?.options),
  });

  useEffect(() => {
     setLocalField(prev => ({ 
        ...prev, 
        ...field,
        options: processOptions(field?.options),
    }));
  }, [field]);

  if (!localField) return null;

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const { name, value } = e.target;
    setLocalField(prev => {
        const updated = {...prev, [name]: value};
        onChange(updated);
        return updated;
    });
  };

  const handleOptionsChange = (e: ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const { name, value, type } = e.target;
    const val = type === 'number' ? (value === '' ? '' : parseFloat(value)) : value;
    
    setLocalField(prev => {
        const updated = { ...prev, options: { ...prev.options, [name]: val } };
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
        <Input id="label" name="label" value={localField.label} onChange={handleInputChange} onKeyDown={handleKeyDown} placeholder="e.g., Upload Your CV" />
      </div>
      <div>
        <Label htmlFor="name">Identifier Name <span className="text-red-500">*</span></Label>
        <Input id="name" name="name" value={localField.name} onChange={handleInputChange} onKeyDown={handleKeyDown} placeholder="e.g., resume_upload" />
      </div>
      <div>
        <Label htmlFor="helpText">Help Text</Label>
        <Input id="helpText" name="helpText" value={localField.helpText || ''} onChange={handleInputChange} onKeyDown={handleKeyDown} placeholder="e.g., PDF or DOCX, max 5MB" />
      </div>
      <div className="flex items-center space-x-2">
        <Checkbox id="isRequired" name="isRequired" checked={localField.isRequired || false} onCheckedChange={handleCheckboxChange} onClick={(e) => e.stopPropagation()} />
        <Label htmlFor="isRequired" className="text-sm font-medium">Field is Required</Label>
      </div>
      <div>
        <Label htmlFor="options.allowedFileTypes">Allowed File Types (comma-separated)</Label>
        <Input 
            id="options.allowedFileTypes" 
            name="allowedFileTypes" // Corresponds to key in options object
            value={String(localField.options?.allowedFileTypes || '')} 
            onChange={handleOptionsChange} 
            onKeyDown={handleKeyDown} 
            placeholder="e.g., .pdf, .doc, .docx, image/*" 
        />
        <p className="mt-1 text-xs text-gray-500">Example: .jpg, .png, application/pdf</p>
      </div>
      <div>
        <Label htmlFor="options.maxFileSizeMB">Max File Size (MB)</Label>
        <Input 
            type="number" 
            id="options.maxFileSizeMB" 
            name="maxFileSizeMB" // Corresponds to key in options object
            value={String(localField.options?.maxFileSizeMB || 5)} 
            onChange={handleOptionsChange} 
            onKeyDown={handleKeyDown} 
            min="1"
        />
      </div>
      <div>
        <Label htmlFor="width">Width (%)</Label>
        <Input type="number" id="width" name="width" min="25" max="100" step="25" value={localField.width || 100} onChange={handleInputChange} onKeyDown={handleKeyDown} />
      </div>
    </div>
  );

  if (!showPreview) {
    return editorContent;
  }

  return (
    <FieldLayout
      title="File Upload Field"
      description="Allows users to upload a file."
      preview={<FileFieldPreview field={localField} />}
      editor={editorContent}
    />
  );
}
