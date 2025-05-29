'use client';

import { useState, useEffect, ChangeEvent } from 'react';
import { FormFieldBase, FormFieldType } from '@/types/forms';
import { FieldProps, BaseFieldPreview, FieldLayout } from './FieldBase';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { StarIcon, HeartIcon, CircleIcon } from 'lucide-react'; // Example icons

// Componente de vista previa para campos de Calificación (Rating)
export function RatingFieldPreview({ field }: { field: FormFieldBase }) {
  const maxRating = field.options?.maxRating as number || 5;
  const currentRating = field.defaultValue !== undefined ? Number(field.defaultValue) : 0;
  const iconType = field.options?.icon || 'star';

  const renderStars = () => {
    const stars = [];
    for (let i = 1; i <= maxRating; i++) {
      let IconComponent = StarIcon;
      if (iconType === 'heart') IconComponent = HeartIcon;
      else if (iconType === 'circle') IconComponent = CircleIcon;
      
      stars.push(
        <IconComponent
          key={i}
          className={`h-6 w-6 ${i <= currentRating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'} ${iconType === 'heart' && i <= currentRating ? 'text-red-500 fill-red-500' : ''}`}
        />
      );
    }
    return stars;
  };

  return (
    <BaseFieldPreview field={field}>
      <div className="flex items-center space-x-1">
        {renderStars()}
      </div>
       <p className="mt-1 text-xs text-gray-500">{currentRating} / {maxRating} {iconType}(s)</p>
    </BaseFieldPreview>
  );
}

// Componente de edición para campos de Calificación (Rating)
export function RatingField({ field, onChange, showPreview = true }: FieldProps) {
  const [localField, setLocalField] = useState<FormFieldBase>({
    type: FormFieldType.RATING,
    label: 'Rating Input',
    name: 'ratingField',
    helpText: '',
    isRequired: false,
    defaultValue: 0,
    width: 100,
    options: { maxRating: 5, icon: 'star' },
    ...field,
    defaultValue: field?.defaultValue !== undefined ? Number(field.defaultValue) : 0,
    options: {
        maxRating: 5, icon: 'star',
        ...field?.options,
        maxRating: field?.options?.maxRating !== undefined ? Number(field.options.maxRating) : 5,
        icon: field?.options?.icon || 'star',
    },
  });

  useEffect(() => {
     setLocalField(prev => ({ 
        ...prev, 
        ...field,
        defaultValue: field?.defaultValue !== undefined ? Number(field.defaultValue) : 0,
        options: {
            maxRating: 5, icon: 'star',
            ...prev.options,
            ...field?.options,
            maxRating: field?.options?.maxRating !== undefined ? Number(field.options.maxRating) : (prev.options?.maxRating !== undefined ? Number(prev.options.maxRating) : 5),
            icon: field?.options?.icon || (prev.options?.icon || 'star'),
        }
    }));
  }, [field]);

  if (!localField) return null;

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const { name, value, type } = e.target;
    let val: string | number = value;
    if (type === 'number') {
      val = value === '' ? '' : parseFloat(value);
      if (name === 'defaultValue' && localField.options?.maxRating) {
        val = Math.min(Math.max(val as number, 0), localField.options.maxRating as number);
      }
    }
    
    setLocalField(prev => {
        const updated = {...prev, [name]: val};
        onChange(updated);
        return updated;
    });
  };

  const handleOptionsChange = (e: ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const { name, value } = e.target; // name will be "maxRating"
    const numValue = value === '' ? 5 : parseInt(value, 10);
    setLocalField(prev => {
        const updated = { ...prev, options: { ...prev.options, [name]: numValue } };
        // Adjust defaultValue if it exceeds new maxRating
        if (name === 'maxRating' && prev.defaultValue !== undefined && Number(prev.defaultValue) > numValue) {
            updated.defaultValue = numValue;
        }
        onChange(updated);
        return updated;
    });
  };

  const handleSelectChange = (name: string, value: string) => {
    if (name === "options.icon") {
        setLocalField(prev => {
            const updated = { ...prev, options: { ...prev.options, icon: value } };
            onChange(updated);
            return updated;
        });
    }
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
        <Input id="label" name="label" value={localField.label} onChange={handleInputChange} onKeyDown={handleKeyDown} placeholder="e.g., Your Rating" />
      </div>
      <div>
        <Label htmlFor="name">Identifier Name <span className="text-red-500">*</span></Label>
        <Input id="name" name="name" value={localField.name} onChange={handleInputChange} onKeyDown={handleKeyDown} placeholder="e.g., product_rating" />
      </div>
      <div>
        <Label htmlFor="helpText">Help Text</Label>
        <Input id="helpText" name="helpText" value={localField.helpText || ''} onChange={handleInputChange} onKeyDown={handleKeyDown} placeholder="e.g., Rate from 1 to 5 stars" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="options.maxRating">Max Rating (e.g., 5 for 5 stars)</Label>
          <Input type="number" name="maxRating" id="options.maxRating" value={localField.options?.maxRating || 5} onChange={handleOptionsChange} onKeyDown={handleKeyDown} min="1" />
        </div>
        <div>
          <Label htmlFor="options.icon">Icon Type</Label>
          <Select name="options.icon" value={localField.options?.icon || 'star'} onValueChange={(value) => handleSelectChange('options.icon', value)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="star">Star</SelectItem>
              <SelectItem value="heart">Heart</SelectItem>
              <SelectItem value="circle">Circle</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div>
        <Label htmlFor="defaultValue">Default Value (Rating)</Label>
        <Input type="number" id="defaultValue" name="defaultValue" value={localField.defaultValue || 0} onChange={handleInputChange} onKeyDown={handleKeyDown} min="0" max={localField.options?.maxRating as number || 5} />
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
      title="Rating Field"
      description="Allows users to provide a rating, typically with stars."
      preview={<RatingFieldPreview field={localField} />}
      editor={editorContent}
    />
  );
}
