'use client';

import { useState, useEffect, ChangeEvent } from 'react';
import { FormFieldBase, FormFieldType }_from '@/types/forms';
import { FieldProps, BaseFieldPreview, FieldLayout } from './FieldBase';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { PlusCircle, XCircle, GripVertical } from 'lucide-react';
import { normalizeValue } from '@/lib/normalize'; // Assuming this utility exists

interface SelectOption {
  label: string;
  value: string;
  disabled?: boolean;
}

// Componente de vista previa para MultiSelect
export function MultiSelectFieldPreview({ field }: { field: FormFieldBase }) {
  const options = (field.options?.items || []) as SelectOption[];
  const defaultValues = (Array.isArray(field.defaultValue) ? field.defaultValue : []) as string[];
  
  const selectedLabels = defaultValues
    .map(val => options.find(opt => opt.value === val)?.label)
    .filter(Boolean)
    .join(', ');

  return (
    <BaseFieldPreview field={field}>
      <div className="p-2 border border-gray-300 rounded-md bg-gray-50 min-h-[40px]">
        <span className="text-sm text-gray-500">
          {selectedLabels || field.placeholder || 'Select one or more options'}
        </span>
        {/* Add a dropdown arrow icon for visual consistency if desired */}
      </div>
    </BaseFieldPreview>
  );
}

// Componente de edición para MultiSelect
export function MultiSelectField({ field, onChange, showPreview = true }: FieldProps) {
  const [localField, setLocalField] = useState<FormFieldBase>({
    type: FormFieldType.MULTISELECT,
    label: 'Multi-Select Field',
    name: 'multiSelectField',
    placeholder: 'Select options...',
    helpText: '',
    isRequired: false,
    defaultValue: [], // Array of strings
    width: 100,
    options: { items: [] },
    ...field,
    // Ensure defaultValue is always an array, even if input field.defaultValue is string or undefined
    defaultValue: Array.isArray(field?.defaultValue) 
        ? field.defaultValue 
        : (typeof field?.defaultValue === 'string' && field.defaultValue !== '' ? field.defaultValue.split(',').map(s => s.trim()) : []),
    options: { items: [], ...field?.options },
  });

  const [options, setOptions] = useState<SelectOption[]>((localField.options?.items || []) as SelectOption[]);
  const [newOption, setNewOption] = useState<{ label: string; value: string }>({ label: '', value: '' });
  // For managing defaultValue input as a comma-separated string
  const [defaultValueStr, setDefaultValueStr] = useState<string>(
    Array.isArray(localField.defaultValue) ? localField.defaultValue.join(', ') : ''
  );


  useEffect(() => {
    const currentDefaultValue = Array.isArray(field?.defaultValue) 
        ? field.defaultValue 
        : (typeof field?.defaultValue === 'string' && field.defaultValue !== '' ? field.defaultValue.split(',').map(s => s.trim()) : []);

    setLocalField(prev => ({
        ...prev,
        ...field,
        defaultValue: currentDefaultValue,
        options: { items: [], ...prev.options, ...field?.options },
    }));
    setOptions((field?.options?.items || []) as SelectOption[]);
    setDefaultValueStr(currentDefaultValue.join(', '));
  }, [field]);

  if (!localField) return null;

  const handleMainInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    e.preventDefault(); e.stopPropagation();
    const { name, value } = e.target;
    const updated = { ...localField, [name]: value };
    setLocalField(updated);
    onChange(updated);
  };
  
  const handleCheckboxChange = (checked: boolean | 'indeterminate', name: keyof FormFieldBase) => {
    const isChecked = checked === true;
    const updated = { ...localField, [name]: isChecked };
    setLocalField(updated);
    onChange(updated);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !(e.target instanceof HTMLTextAreaElement)) {
      e.preventDefault(); e.stopPropagation();
    }
  };

  // Option management (similar to SelectField)
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
    onChange(updatedField);
    setNewOption({ label: '', value: '' });
  };

  const handleRemoveOption = (index: number, e?: React.MouseEvent) => {
    if (e) { e.preventDefault(); e.stopPropagation(); }
    const removedOptionValue = options[index].value;
    const updatedOptions = options.filter((_, i) => i !== index);
    setOptions(updatedOptions);
    
    // Also remove from defaultValue if it was there
    const currentDefault = Array.isArray(localField.defaultValue) ? localField.defaultValue : [];
    const newDefault = currentDefault.filter(val => val !== removedOptionValue);
    setDefaultValueStr(newDefault.join(', '));

    const updatedField = { 
        ...localField, 
        options: { ...localField.options, items: updatedOptions },
        defaultValue: newDefault 
    };
    setLocalField(updatedField);
    onChange(updatedField);
  };

  const handleDefaultValueStrChange = (e: ChangeEvent<HTMLInputElement>) => {
    e.preventDefault(); e.stopPropagation();
    const strVal = e.target.value;
    setDefaultValueStr(strVal);
    const arrVal = strVal.split(',').map(s => s.trim()).filter(s => s);
    const updated = { ...localField, defaultValue: arrVal };
    setLocalField(updated);
    onChange(updated);
  };

  const editorContent = (
    <div className="space-y-4" onClick={(e) => e.stopPropagation()} onMouseDown={(e) => e.stopPropagation()}>
      <Label htmlFor="label">Field Label <span className="text-red-500">*</span></Label>
      <Input id="label" name="label" value={localField.label} onChange={handleMainInputChange} onKeyDown={handleKeyDown} />
      
      <Label htmlFor="name">Identifier Name <span className="text-red-500">*</span></Label>
      <Input id="name" name="name" value={localField.name} onChange={handleMainInputChange} onKeyDown={handleKeyDown} />
      
      <Label htmlFor="placeholder">Placeholder</Label>
      <Input id="placeholder" name="placeholder" value={localField.placeholder || ''} onChange={handleMainInputChange} onKeyDown={handleKeyDown} />
      
      <Label htmlFor="helpText">Help Text</Label>
      <Input id="helpText" name="helpText" value={localField.helpText || ''} onChange={handleMainInputChange} onKeyDown={handleKeyDown} />

      <div className="flex items-center space-x-2">
        <Checkbox id="isRequired" name="isRequired" checked={localField.isRequired || false} onCheckedChange={(checked) => handleCheckboxChange(checked, 'isRequired')} />
        <Label htmlFor="isRequired">Field is Required</Label>
      </div>

      {/* Options Management */}
      <div className="border border-gray-200 rounded-md p-4 bg-gray-50 space-y-3">
        <h4 className="text-sm font-medium text-gray-900">Select Options</h4>
        {options.map((option, index) => (
          <div key={index} className="flex items-center gap-2 p-2 bg-white border rounded-md">
            <GripVertical size={16} className="text-gray-400 cursor-move" />
            <span className="flex-1 text-sm">{option.label} ({option.value})</span>
            <Button variant="ghost" size="icon" onClick={(e) => handleRemoveOption(index, e)} className="text-red-500 hover:text-red-700">
              <XCircle size={16} />
            </Button>
          </div>
        ))}
        <div className="flex gap-2 items-end pt-2">
          <div className="flex-1">
            <Label htmlFor="optionLabel" className="text-xs">New Option Label</Label>
            <Input id="optionLabel" name="label" value={newOption.label} onChange={handleNewOptionChange} onKeyDown={handleKeyDown} />
          </div>
          <div className="flex-1">
            <Label htmlFor="optionValue" className="text-xs">Value (auto-generated)</Label>
            <Input id="optionValue" name="value" value={newOption.value} disabled className="bg-gray-100" />
          </div>
          <Button onClick={handleAddOption} disabled={!newOption.label} variant="outline" size="icon"><PlusCircle size={20} /></Button>
        </div>
      </div>
      
      <div>
        <Label htmlFor="defaultValueStr">Default Values (comma-separated values)</Label>
        <Input 
            id="defaultValueStr" 
            name="defaultValueStr" 
            value={defaultValueStr} 
            onChange={handleDefaultValueStrChange} 
            onKeyDown={handleKeyDown}
            placeholder="e.g., value1,value2"
        />
         <p className="mt-1 text-xs text-gray-500">Enter values from the options above, separated by commas.</p>
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
      title="Multi-Select Field"
      description="Allows users to select multiple options from a list."
      preview={<MultiSelectFieldPreview field={localField} />}
      editor={editorContent}
    />
  );
}
