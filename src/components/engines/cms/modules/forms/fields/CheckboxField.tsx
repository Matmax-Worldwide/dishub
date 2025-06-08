'use client';

import { useState, useEffect, ChangeEvent } from 'react';
import { FormFieldBase, FormFieldType } from '@/types/forms';
import { FieldProps, BaseFieldPreview, FieldLayout } from './FieldBase';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox as UiCheckbox } from '@/components/ui/checkbox'; // Renamed to avoid conflict
import { PlusCircle, XCircle, GripVertical } from 'lucide-react';
import { normalizeValue } from '@/lib/normalize';

interface CheckboxOption {
  label: string;
  value: string;
  disabled?: boolean;
}

// Componente de vista previa para Checkbox (grupo)
export function CheckboxFieldPreview({ field }: { field: FormFieldBase }) {
  const options = (field.options?.items || []) as CheckboxOption[];
  let defaultValues: string[] = [];
  
  // Parse defaultValue from string to array
  if (field.defaultValue) {
    try {
      const parsed = JSON.parse(field.defaultValue);
      if (Array.isArray(parsed)) {
        defaultValues = parsed;
      }
    } catch {
      // If parsing fails, treat as empty array
      defaultValues = [];
    }
  }

  return (
    <BaseFieldPreview field={field}>
      <div className="space-y-2">
        {options.length > 0 ? options.map((option, index) => (
          <div key={index} className="flex items-center space-x-2">
            <UiCheckbox
              id={`preview-${field.name}-${option.value}`}
              disabled
              checked={defaultValues.includes(option.value)}
              className="cursor-not-allowed"
            />
            <Label htmlFor={`preview-${field.name}-${option.value}`} className="text-sm font-normal text-gray-700 cursor-not-allowed">
              {option.label}
            </Label>
          </div>
        )) : (
          <p className="text-sm text-gray-500">No options defined.</p>
        )}
      </div>
    </BaseFieldPreview>
  );
}

// Componente de edición para Checkbox (grupo)
export function CheckboxField({ field, onChange, showPreview = true }: FieldProps) {
  // Parse defaultValue properly from field
  const parseDefaultValue = (value: string | string[] | undefined): string => {
    if (Array.isArray(value)) return JSON.stringify(value);
    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed) ? value : '[]';
      } catch {
        return '[]';
      }
    }
    return '[]';
  };

  const [localField, setLocalField] = useState<FormFieldBase>({
    id: field?.id || '',
    type: FormFieldType.CHECKBOX,
    label: 'Checkbox Group',
    name: 'checkboxGroupField',
    helpText: '',
    isRequired: false,
    order: 0,
    width: 100,
    ...field, // Apply incoming field props
    // Override with properly parsed values
    defaultValue: parseDefaultValue(field?.defaultValue),
    options: { items: [], ...field?.options },
  });

  const [options, setOptions] = useState<CheckboxOption[]>((localField.options?.items || []) as CheckboxOption[]);
  const [newOption, setNewOption] = useState<{ label: string; value: string }>({ label: '', value: '' });

  useEffect(() => {
    setLocalField(prev => ({
      ...prev,
      ...field,
      defaultValue: parseDefaultValue(field?.defaultValue),
      options: { items: [], ...prev.options, ...field?.options },
    }));
    setOptions((field?.options?.items || []) as CheckboxOption[]);
  }, [field]);

  if (!localField) return null;

  // Helper function to get current default values as array
  const getCurrentDefaultValues = (): string[] => {
    try {
      const parsed = JSON.parse(localField.defaultValue || '[]');
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  };

  // Centralized function to prepare data for onChange prop
  const dispatchChanges = (updatedLocalField: FormFieldBase) => {
    onChange(updatedLocalField);
  };

  const handleMainInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    e.preventDefault(); e.stopPropagation();
    const { name, value } = e.target;
    setLocalField(prev => {
        const updated = {...prev, [name]: value};
        dispatchChanges(updated);
        return updated;
    });
  };
  
  const handleIsRequiredChange = (checked: boolean | 'indeterminate') => {
    const isChecked = checked === true;
    setLocalField(prev => {
        const updated = {...prev, isRequired: isChecked};
        dispatchChanges(updated);
        return updated;
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !(e.target instanceof HTMLTextAreaElement)) {
      e.preventDefault(); e.stopPropagation();
    }
  };

  // Option management
  const handleNewOptionChange = (e: ChangeEvent<HTMLInputElement>) => {
    e.preventDefault(); e.stopPropagation();
    const { name, value } = e.target;
    if (name === 'label') {
      setNewOption({ label: value, value: normalizeValue(value) });
    } else {
      setNewOption(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleAddOption = (e?: React.MouseEvent) => {
    if (e) { e.preventDefault(); e.stopPropagation(); }
    if (!newOption.label) return;
    const optionToAdd = { label: newOption.label, value: normalizeValue(newOption.label) };
    const updatedOptions = [...options, optionToAdd];
    setOptions(updatedOptions);
    const updatedField = { ...localField, options: { ...localField.options, items: updatedOptions } };
    setLocalField(updatedField);
    dispatchChanges(updatedField);
    setNewOption({ label: '', value: '' });
  };

  const handleRemoveOption = (index: number, e?: React.MouseEvent) => {
    if (e) { e.preventDefault(); e.stopPropagation(); }
    const removedOptionValue = options[index].value;
    const updatedOptions = options.filter((_, i) => i !== index);
    setOptions(updatedOptions);
    
    const currentDefault = getCurrentDefaultValues();
    const newDefault = currentDefault.filter(val => val !== removedOptionValue);

    const updatedField = { 
        ...localField, 
        options: { ...localField.options, items: updatedOptions },
        defaultValue: JSON.stringify(newDefault)
    };
    setLocalField(updatedField);
    dispatchChanges(updatedField);
  };

  const handleDefaultValueChange = (optionValue: string, checked: boolean) => {
    let currentDefault = getCurrentDefaultValues();
    if (checked) {
      if (!currentDefault.includes(optionValue)) {
        currentDefault.push(optionValue);
      }
    } else {
      currentDefault = currentDefault.filter(val => val !== optionValue);
    }
    setLocalField(prev => {
        const updated = { ...prev, defaultValue: JSON.stringify(currentDefault) };
        dispatchChanges(updated);
        return updated;
    });
  };

  const editorContent = (
    <div className="space-y-4" onClick={(e) => e.stopPropagation()} onMouseDown={(e) => e.stopPropagation()}>
      <Label htmlFor="label">Group Label <span className="text-red-500">*</span></Label>
      <Input id="label" name="label" value={localField.label} onChange={handleMainInputChange} onKeyDown={handleKeyDown} placeholder="e.g., Your Interests" />
      
      <Label htmlFor="name">Identifier Name <span className="text-red-500">*</span></Label>
      <Input id="name" name="name" value={localField.name} onChange={handleMainInputChange} onKeyDown={handleKeyDown} placeholder="e.g., user_interests" />
      
      <Label htmlFor="helpText">Help Text</Label>
      <Input id="helpText" name="helpText" value={localField.helpText || ''} onChange={handleMainInputChange} onKeyDown={handleKeyDown} />

      <div className="flex items-center space-x-2">
        <UiCheckbox id="isRequired" name="isRequired" checked={localField.isRequired || false} onCheckedChange={handleIsRequiredChange} />
        <Label htmlFor="isRequired">Required (at least one option)</Label>
      </div>

      {/* Options Management UI */}
      <div className="border border-gray-200 rounded-md p-4 bg-gray-50 space-y-3">
        <h4 className="text-sm font-medium text-gray-900 mb-1">Checkbox Options</h4>
        <p className="text-xs text-gray-500 mb-3">Define the individual checkboxes for this group. Mark which ones should be checked by default.</p>
        
        {options.length > 0 ? (
          <ul className="space-y-2 mb-4">
            {options.map((option, index) => (
              <li key={index} className="flex items-center gap-2 p-2 bg-white border border-gray-200 rounded-md">
                 <GripVertical size={16} className="text-gray-400 cursor-move flex-shrink-0" />
                <div className="flex-1 flex items-center gap-2">
                    <UiCheckbox 
                        id={`default-${option.value}`}
                        checked={getCurrentDefaultValues().includes(option.value)}
                        onCheckedChange={(checked) => handleDefaultValueChange(option.value, checked === true)}
                    />
                    <Label htmlFor={`default-${option.value}`} className="text-sm font-normal flex-grow cursor-pointer">
                        {option.label} <span className="text-xs text-gray-400">({option.value})</span>
                    </Label>
                </div>
                <Button variant="ghost" size="icon" onClick={(e) => handleRemoveOption(index, e)} className="text-red-500 hover:text-red-700 flex-shrink-0">
                  <XCircle size={16} />
                </Button>
              </li>
            ))}
          </ul>
        ) : (
          <div className="bg-white p-3 text-center text-gray-500 border border-dashed border-gray-300 rounded-md mb-4">
            No options defined. Add at least one checkbox option.
          </div>
        )}
        
        <div className="flex gap-2 items-end pt-2 border-t mt-3">
          <div className="flex-1">
            <Label htmlFor="optionLabel" className="text-xs">New Option Label</Label>
            <Input id="optionLabel" name="label" value={newOption.label} onChange={handleNewOptionChange} onKeyDown={handleKeyDown} />
          </div>
          <div className="flex-1">
            <Label htmlFor="optionValue" className="text-xs">Value (auto-generated)</Label>
            <Input id="optionValue" name="value" value={newOption.value} disabled className="bg-gray-100" />
          </div>
          <Button onClick={handleAddOption} disabled={!newOption.label} variant="outline" size="icon" className="flex-shrink-0"><PlusCircle size={20} /></Button>
        </div>
      </div>
      
      <Label htmlFor="width">Width (%)</Label>
      <Input type="number" id="width" name="width" min="25" max="100" step="25" value={localField.width || 100} onChange={handleMainInputChange} onKeyDown={handleKeyDown}/>
    </div>
  );

  if (!showPreview) {
    return editorContent;
  }

  return (
    <FieldLayout
      title="Checkbox Group Field"
      description="Allows users to select multiple options from a list of checkboxes."
      preview={<CheckboxFieldPreview field={localField} />}
      editor={editorContent}
    />
  );
}