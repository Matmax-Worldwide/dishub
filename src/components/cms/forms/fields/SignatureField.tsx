'use client';

import { useState, useEffect, ChangeEvent } from 'react';
import { FormFieldBase, FormFieldType } from '@/types/forms';
import { FieldProps, BaseFieldPreview, FieldLayout } from './FieldBase';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Edit3Icon } from 'lucide-react'; // Example icon

// Componente de vista previa para campos de Firma (Signature)
export function SignatureFieldPreview({ field }: { field: FormFieldBase }) {
  const height = field.options?.canvasHeight || 150;
  return (
    <BaseFieldPreview field={field}>
      <div 
        style={{ height: `${height}px` }}
        className="p-4 bg-gray-100 border border-dashed border-gray-300 rounded-md text-center flex flex-col items-center justify-center"
      >
        <Edit3Icon className="h-8 w-8 text-gray-400 mb-2" />
        <p className="text-sm text-gray-600">
          Signature Pad Area
        </p>
        <p className="text-xs text-gray-500">Signing area will appear here.</p>
      </div>
    </BaseFieldPreview>
  );
}

// Componente de edición para campos de Firma (Signature)
export function SignatureField({ field, onChange, showPreview = true }: FieldProps) {
  const [localField, setLocalField] = useState<FormFieldBase>({
    id: field?.id || '',
    type: FormFieldType.SIGNATURE,
    label: 'Signature',
    name: 'signatureField',
    helpText: '',
    isRequired: false,
    order: field?.order || 0,
    width: 100,
    options: { backgroundColor: '#ffffff', penColor: '#000000' },
    ...field,
  });

  useEffect(() => {
     setLocalField(prev => ({ 
        ...prev, 
        ...field,
        options: {
            canvasHeight: 150, canvasWidth: 300, lineColor: '#000000',
            ...prev.options,
            ...field?.options,
        }
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
    const val = type === 'number' ? (value === '' ? 0 : parseInt(value, 10)) : value;
    
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
        <Input id="label" name="label" value={localField.label} onChange={handleInputChange} onKeyDown={handleKeyDown} placeholder="e.g., Your Signature" />
      </div>
      <div>
        <Label htmlFor="name">Identifier Name <span className="text-red-500">*</span></Label>
        <Input id="name" name="name" value={localField.name} onChange={handleInputChange} onKeyDown={handleKeyDown} placeholder="e.g., user_signature" />
      </div>
      <div>
        <Label htmlFor="helpText">Help Text</Label>
        <Input id="helpText" name="helpText" value={localField.helpText || ''} onChange={handleInputChange} onKeyDown={handleKeyDown} placeholder="Use your mouse or touchscreen to sign." />
      </div>
      <div className="flex items-center space-x-2">
        <Checkbox id="isRequired" name="isRequired" checked={localField.isRequired || false} onCheckedChange={handleCheckboxChange} onClick={(e) => e.stopPropagation()} />
        <Label htmlFor="isRequired" className="text-sm font-medium">Field is Required</Label>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="options.canvasHeight">Canvas Height (px)</Label>
          <Input type="number" name="canvasHeight" id="options.canvasHeight" value={String(localField.options?.canvasHeight || 150)} onChange={handleOptionsChange} onKeyDown={handleKeyDown} min="50" />
        </div>
        <div>
          <Label htmlFor="options.canvasWidth">Canvas Width (px)</Label>
          <Input type="number" name="canvasWidth" id="options.canvasWidth" value={String(localField.options?.canvasWidth || 300)} onChange={handleOptionsChange} onKeyDown={handleKeyDown} min="100" />
        </div>
      </div>
       <div>
          <Label htmlFor="options.lineColor">Signature Color</Label>
          <Input type="color" name="lineColor" id="options.lineColor" value={String(localField.options?.lineColor || '#000000')} onChange={handleOptionsChange} className="h-10" />
        </div>
      <div>
        <Label htmlFor="width">Overall Width (%)</Label>
        <Input type="number" id="width" name="width" min="25" max="100" step="25" value={localField.width || 100} onChange={handleInputChange} onKeyDown={handleKeyDown} />
      </div>
    </div>
  );

  if (!showPreview) {
    return editorContent;
  }

  return (
    <FieldLayout
      title="Signature Field"
      description="Allows users to draw a signature."
      preview={<SignatureFieldPreview field={localField} />}
      editor={editorContent}
    />
  );
}
