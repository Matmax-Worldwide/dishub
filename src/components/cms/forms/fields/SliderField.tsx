'use client';

import { useState, useEffect, ChangeEvent } from 'react';
import { FormFieldBase, FormFieldType } from '@/types/forms';
import { FieldProps, BaseFieldPreview, FieldLayout } from './FieldBase';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
// Assuming a Slider component from shadcn/ui or similar is available.
// If not, a standard HTML range input will be used for preview.
// import { Slider as UiSlider } from '@/components/ui/slider'; 

// Componente de vista previa para campos de Slider
export function SliderFieldPreview({ field }: { field: FormFieldBase }) {
  const min = field.options?.min as number || 0;
  const max = field.options?.max as number || 100;
  const defaultValue = field.defaultValue !== undefined ? Number(field.defaultValue) : (min + max) / 2;

  return (
    <BaseFieldPreview field={field}>
      {/* Basic HTML range input for preview if no UI component or for simplicity */}
      <div className="flex items-center space-x-2">
        <span>{min}</span>
        <input
          type="range"
          id={`preview-${field.name}`}
          name={`preview-${field.name}`}
          min={min}
          max={max}
          step={field.options?.step as number || 1}
          defaultValue={defaultValue}
          disabled
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-not-allowed dark:bg-gray-700"
        />
        <span>{max}</span>
      </div>
      <div className="text-center text-sm text-gray-500 mt-1">Current Value: {defaultValue}</div>
    </BaseFieldPreview>
  );
}

// Componente de edición para campos de Slider
export function SliderField({ field, onChange, showPreview = true }: FieldProps) {
  const [localField, setLocalField] = useState<FormFieldBase>({
    id: field?.id || `field-${Date.now()}`,
    type: FormFieldType.SLIDER,
    label: 'Slider Input',
    name: 'sliderField',
    helpText: '',
    isRequired: false,
    defaultValue: '50',
    width: 100,
    order: 0,
    options: { min: 0, max: 100, step: 1 },
    ...field,
  });

  useEffect(() => {
     setLocalField(prev => ({ 
        ...prev, 
        ...field,
        options: {
            min: 0, 
            max: 100, 
            step: 1,
            ...prev.options,
            ...field?.options,
        }
    }));
  }, [field]);

  if (!localField) return null;

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const { name, value, type } = e.target;
    const val = type === 'number' ? (value === '' ? '' : parseFloat(value)) : value;
    
    setLocalField(prev => {
        const updated = {...prev, [name]: val};
        onChange(updated);
        return updated;
    });
  };

  const handleOptionsChange = (e: ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const { name, value } = e.target; // name will be "min", "max", or "step"
    const numValue = value === '' ? '' : parseFloat(value);

    setLocalField(prev => {
        const updated = {
            ...prev,
            options: { ...prev.options, [name]: numValue }
        };
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
        <Input id="label" name="label" value={localField.label} onChange={handleInputChange} onKeyDown={handleKeyDown} placeholder="e.g., Volume Level" />
      </div>
      <div>
        <Label htmlFor="name">Identifier Name <span className="text-red-500">*</span></Label>
        <Input id="name" name="name" value={localField.name} onChange={handleInputChange} onKeyDown={handleKeyDown} placeholder="e.g., volume_level" />
        <p className="mt-1 text-xs text-gray-500">Unique identifier for the field.</p>
      </div>
      <div>
        <Label htmlFor="helpText">Help Text</Label>
        <Input id="helpText" name="helpText" value={localField.helpText || ''} onChange={handleInputChange} onKeyDown={handleKeyDown} placeholder="e.g., Adjust the volume" />
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div>
          <Label htmlFor="options.min">Min Value</Label>
          <Input type="number" name="min" id="options.min" value={(localField.options?.min as number) || 0} onChange={handleOptionsChange} onKeyDown={handleKeyDown} />
        </div>
        <div>
          <Label htmlFor="options.max">Max Value</Label>
          <Input type="number" name="max" id="options.max" value={(localField.options?.max as number) || 100} onChange={handleOptionsChange} onKeyDown={handleKeyDown} />
        </div>
        <div>
          <Label htmlFor="options.step">Step</Label>
          <Input type="number" name="step" id="options.step" value={(localField.options?.step as number) || 1} onChange={handleOptionsChange} onKeyDown={handleKeyDown} />
        </div>
      </div>
      <div>
        <Label htmlFor="defaultValue">Default Value</Label>
        <Input type="number" id="defaultValue" name="defaultValue" value={localField.defaultValue || ''} onChange={handleInputChange} onKeyDown={handleKeyDown} 
               min={localField.options?.min as number || 0} 
               max={localField.options?.max as number || 100} 
               step={localField.options?.step as number || 1}
        />
      </div>
      <div className="flex items-center space-x-2">
        <Checkbox id="isRequired" name="isRequired" checked={localField.isRequired || false} onCheckedChange={handleCheckboxChange} onClick={(e) => e.stopPropagation()} />
        <Label htmlFor="isRequired" className="text-sm font-medium">Field is Required</Label>
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
      title="Slider Field"
      description="Allows users to select a value from a range using a slider."
      preview={<SliderFieldPreview field={localField} />}
      editor={editorContent}
    />
  );
}
