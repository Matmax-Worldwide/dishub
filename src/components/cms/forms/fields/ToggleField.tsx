'use client';

import { useState, useEffect, ChangeEvent } from 'react';
import { FormFieldBase, FormFieldType } from '@/types/forms';
import { FieldProps, BaseFieldPreview, FieldLayout } from './FieldBase';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch'; // ShadCN Switch
import { Checkbox } from '@/components/ui/checkbox'; // For setting default value in editor

// Componente de vista previa para campos de Toggle (Switch)
export function ToggleFieldPreview({ field }: { field: FormFieldBase }) {
  return (
    <BaseFieldPreview field={field}>
      <div className="flex items-center space-x-2">
        <Switch
          id={`preview-${field.name}`}
          checked={field.defaultValue === 'true'} // defaultValue is string from FormFieldBase
          disabled
          className="cursor-not-allowed"
        />
        <Label htmlFor={`preview-${field.name}`} className="text-sm text-gray-500 cursor-not-allowed">
          {field.label || 'Toggle Switch'}
        </Label>
      </div>
    </BaseFieldPreview>
  );
}

// Componente de edición para campos de Toggle (Switch)
export function ToggleField({ field, onChange, showPreview = true }: FieldProps) {
  const [localField, setLocalField] = useState<FormFieldBase>({
    id: field?.id || '',
    type: FormFieldType.TOGGLE,
    label: 'Toggle Switch',
    name: 'toggleField',
    helpText: '',
    isRequired: false, // Usually toggles always have a value (true/false)
    order: field?.order || 0,
    width: 100,
    ...field,
    // Ensure defaultValue is string for FormFieldBase consistency
    defaultValue: field?.defaultValue === 'true' ? 'true' : 'false',
  });

  useEffect(() => {
     setLocalField(prev => ({
        ...prev,
        ...field,
        defaultValue: field?.defaultValue === 'true' ? 'true' : 'false',
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
  
  const handleSwitchDefaultChange = (checked: boolean | 'indeterminate') => {
    const newDefaultValue = checked === true ? 'true' : 'false';
    setLocalField(prev => {
        const updated = {...prev, defaultValue: newDefaultValue };
        onChange(updated);
        return updated;
    });
  };

  const handleRequiredChange = (checked: boolean | 'indeterminate') => {
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
        <Input id="label" name="label" value={localField.label} onChange={handleInputChange} onKeyDown={handleKeyDown} placeholder="e.g., Enable Notifications" />
      </div>
      
      <div>
        <Label htmlFor="name">Identifier Name <span className="text-red-500">*</span></Label>
        <Input id="name" name="name" value={localField.name} onChange={handleInputChange} onKeyDown={handleKeyDown} placeholder="e.g., email_opt_in" />
        <p className="mt-1 text-xs text-gray-500">Unique identifier for the field.</p>
      </div>
      
      <div>
        <Label htmlFor="helpText">Help Text</Label>
        <Input id="helpText" name="helpText" value={localField.helpText || ''} onChange={handleInputChange} onKeyDown={handleKeyDown} placeholder="e.g., Toggle to receive updates." />
      </div>
      
      <div className="flex items-center space-x-2">
        <Checkbox
          id="defaultValueToggle" // Changed ID to avoid conflict if isRequired is also present
          checked={localField.defaultValue === 'true'}
          onCheckedChange={handleSwitchDefaultChange}
          onClick={(e) => e.stopPropagation()}
        />
        <Label htmlFor="defaultValueToggle" className="text-sm font-medium">Default Value (Checked = On)</Label>
      </div>
      
       {/* isRequired might be less relevant for a toggle, but can be included for consistency */}
      <div className="flex items-center space-x-2">
        <Checkbox
          id="isRequired"
          name="isRequired"
          checked={localField.isRequired || false}
          onCheckedChange={handleRequiredChange}
          onClick={(e) => e.stopPropagation()}
        />
        <Label htmlFor="isRequired" className="text-sm font-medium">Field is Required</Label>
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
      title="Toggle Switch Field"
      description="A boolean switch for on/off states."
      preview={<ToggleFieldPreview field={localField} />}
      editor={editorContent}
    />
  );
}
