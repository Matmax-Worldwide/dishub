'use client';

import { useState, useEffect, ChangeEvent } from 'react';
import { FormFieldBase, FormFieldType } from '@/types/forms';
import { FieldProps, BaseFieldPreview, FieldLayout } from './FieldBase';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';

// Componente de vista previa para Autocomplete
export function AutocompleteFieldPreview({ field }: { field: FormFieldBase }) {
  return (
    <BaseFieldPreview field={field}>
      <Input
        type="text"
        id={`preview-${field.name}`}
        name={`preview-${field.name}`}
        placeholder={field.placeholder || 'Start typing to see suggestions...'}
        disabled
        className="w-full bg-gray-50 cursor-not-allowed"
        defaultValue={field.defaultValue as string || ''}
      />
    </BaseFieldPreview>
  );
}

// Componente de edición para Autocomplete
export function AutocompleteField({ field, onChange, showPreview = true }: FieldProps) {
  const [localField, setLocalField] = useState<FormFieldBase>({
    type: FormFieldType.AUTOCOMPLETE,
    label: 'Autocomplete Input',
    name: 'autocompleteField',
    placeholder: 'Type to search...',
    helpText: '',
    isRequired: false,
    defaultValue: '',
    width: 100,
    options: { dataSourceUrl: '', staticItems: '' }, // staticItems as comma-separated string
    ...field,
    options: {
        dataSourceUrl: '', staticItems: '',
        ...field?.options,
    }
  });

  useEffect(() => {
     setLocalField(prev => ({ 
        ...prev, 
        ...field,
        options: {
            dataSourceUrl: '', staticItems: '',
            ...prev.options,
            ...field?.options,
        }
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

  const handleOptionsChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const { name, value } = e.target;
    setLocalField(prev => {
        const updated = { ...prev, options: { ...prev.options, [name]: value } };
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
    if (e.key === 'Enter' && !(e.target instanceof HTMLTextAreaElement)) {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  const editorContent = (
    <div className="space-y-4" onClick={(e) => e.stopPropagation()} onMouseDown={(e) => e.stopPropagation()}>
      <div>
        <Label htmlFor="label">Field Label <span className="text-red-500">*</span></Label>
        <Input id="label" name="label" value={localField.label} onChange={handleInputChange} onKeyDown={handleKeyDown} placeholder="e.g., Search Country" />
      </div>
      <div>
        <Label htmlFor="name">Identifier Name <span className="text-red-500">*</span></Label>
        <Input id="name" name="name" value={localField.name} onChange={handleInputChange} onKeyDown={handleKeyDown} placeholder="e.g., country_autocomplete" />
      </div>
      <div>
        <Label htmlFor="placeholder">Placeholder</Label>
        <Input id="placeholder" name="placeholder" value={localField.placeholder || ''} onChange={handleInputChange} onKeyDown={handleKeyDown} placeholder="e.g., Start typing..." />
      </div>
      <div>
        <Label htmlFor="helpText">Help Text</Label>
        <Input id="helpText" name="helpText" value={localField.helpText || ''} onChange={handleInputChange} onKeyDown={handleKeyDown} />
      </div>
      <div className="flex items-center space-x-2">
        <Checkbox id="isRequired" name="isRequired" checked={localField.isRequired || false} onCheckedChange={handleCheckboxChange} />
        <Label htmlFor="isRequired">Field is Required</Label>
      </div>
      <div>
        <Label htmlFor="defaultValue">Default Value</Label>
        <Input id="defaultValue" name="defaultValue" value={localField.defaultValue as string || ''} onChange={handleInputChange} onKeyDown={handleKeyDown} />
      </div>
      <div>
        <Label htmlFor="options.dataSourceUrl">Data Source URL (for dynamic suggestions)</Label>
        <Input id="options.dataSourceUrl" name="dataSourceUrl" value={localField.options?.dataSourceUrl || ''} onChange={handleOptionsChange} onKeyDown={handleKeyDown} placeholder="e.g., /api/suggestions?q=" />
        <p className="mt-1 text-xs text-gray-500">URL to fetch suggestions from. Not implemented in this version.</p>
      </div>
      <div>
        <Label htmlFor="options.staticItems">Static Items (comma-separated for basic suggestions)</Label>
        <Textarea id="options.staticItems" name="staticItems" value={localField.options?.staticItems || ''} onChange={handleOptionsChange} onKeyDown={handleKeyDown} placeholder="e.g., Apple, Banana, Cherry" rows={3}/>
         <p className="mt-1 text-xs text-gray-500">Simple list for client-side suggestions. Not a functional autocomplete in this editor version.</p>
      </div>
      <div>
        <Label htmlFor="width">Width (%)</Label>
        <Input type="number" id="width" name="width" min="25" max="100" step="25" value={localField.width || 100} onChange={handleInputChange} onKeyDown={handleKeyDown}/>
      </div>
    </div>
  );

  if (!showPreview) {
    return editorContent;
  }

  return (
    <FieldLayout
      title="Autocomplete Field"
      description="Provides text input with suggestions. Basic configuration for now."
      preview={<AutocompleteFieldPreview field={localField} />}
      editor={editorContent}
    />
  );
}
