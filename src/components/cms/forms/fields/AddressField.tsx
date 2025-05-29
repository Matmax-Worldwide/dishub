'use client';

import { useState, useEffect, ChangeEvent } from 'react';
import { FormFieldBase, FormFieldType } from '@/types/forms';
import { FieldProps, BaseFieldPreview, FieldLayout } from './FieldBase';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';

interface AddressSubfield {
  name: string;
  label: string;
  placeholder?: string;
}

const defaultSubfields: AddressSubfield[] = [
  { name: 'street', label: 'Street Address', placeholder: '123 Main St' },
  { name: 'street2', label: 'Apartment, suite, etc. (Optional)', placeholder: 'Apt #100' },
  { name: 'city', label: 'City', placeholder: 'Anytown' },
  { name: 'state', label: 'State / Province', placeholder: 'CA' },
  { name: 'postalCode', label: 'Postal Code', placeholder: '90210' },
  { name: 'country', label: 'Country', placeholder: 'United States' },
];

// Componente de vista previa para Address
export function AddressFieldPreview({ field }: { field: FormFieldBase }) {
  // const subfields = (field.options?.subfieldsConfig || defaultSubfields) as AddressSubfield[];
  // For preview, always show all default subfields for simplicity.
  // Actual displayed subfields in live form would depend on configuration.

  return (
    <BaseFieldPreview field={field}>
      <div className="space-y-2">
        {defaultSubfields.map(sf => (
          <div key={sf.name}>
            <Label htmlFor={`preview-${field.name}-${sf.name}`} className="text-xs text-gray-600">
              {sf.label}
            </Label>
            <Input
              type="text"
              id={`preview-${field.name}-${sf.name}`}
              name={`preview-${field.name}-${sf.name}`}
              placeholder={sf.placeholder || ''}
              disabled
              className="w-full bg-gray-50 cursor-not-allowed mt-1"
            />
          </div>
        ))}
      </div>
    </BaseFieldPreview>
  );
}

// Componente de edición para Address
export function AddressField({ field, onChange, showPreview = true }: FieldProps) {
  const [localField, setLocalField] = useState<FormFieldBase>({
    type: FormFieldType.ADDRESS,
    label: 'Address Block',
    name: 'addressField',
    helpText: '',
    isRequired: false, // Applies to the block or specific subfields based on further config
    width: 100,
    options: { 
      // subfieldsConfig: defaultSubfields // For future configuration
    }, 
    ...field,
     options: {
        // ...field?.options, // For future configuration options
    }
  });

  useEffect(() => {
     setLocalField(prev => ({ 
        ...prev, 
        ...field,
        options: {
            // ...prev.options,
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
        <Label htmlFor="label">Overall Address Label <span className="text-red-500">*</span></Label>
        <Input id="label" name="label" value={localField.label} onChange={handleInputChange} onKeyDown={handleKeyDown} placeholder="e.g., Shipping Address" />
      </div>
      <div>
        <Label htmlFor="name">Identifier Name (Base) <span className="text-red-500">*</span></Label>
        <Input id="name" name="name" value={localField.name} onChange={handleInputChange} onKeyDown={handleKeyDown} placeholder="e.g., shipping_address" />
        <p className="mt-1 text-xs text-gray-500">Base name for address fields (e.g., 'shipping_address' becomes 'shipping_address_street').</p>
      </div>
      <div>
        <Label htmlFor="helpText">Help Text (for the whole block)</Label>
        <Input id="helpText" name="helpText" value={localField.helpText || ''} onChange={handleInputChange} onKeyDown={handleKeyDown} />
      </div>
      <div className="flex items-center space-x-2">
        <Checkbox id="isRequired" name="isRequired" checked={localField.isRequired || false} onCheckedChange={handleCheckboxChange} />
        <Label htmlFor="isRequired">Make entire address block required</Label>
      </div>
      {/* 
        Future: Add configuration for subfields here.
        For example, checkboxes to enable/disable street2, state, etc.
        Or make individual subfields required.
        <p className="text-sm font-medium mt-2">Subfield Configuration:</p>
        ...
      */}
      <div>
        <Label htmlFor="width">Width (%)</Label>
        <Input type="number" id="width" name="width" min="25" max="100" step="25" value={localField.width || 100} onChange={handleInputChange} onKeyDown={handleKeyDown}/>
      </div>
       <p className="text-sm text-gray-500 border p-3 rounded-md bg-gray-50">
        Note: Subfields (Street, City, State, Postal Code, Country) are predefined. 
        Default value configuration for address fields is not available in this editor version.
      </p>
    </div>
  );

  if (!showPreview) {
    return editorContent;
  }

  return (
    <FieldLayout
      title="Address Field"
      description="Collects structured address information."
      preview={<AddressFieldPreview field={localField} />}
      editor={editorContent}
    />
  );
}
