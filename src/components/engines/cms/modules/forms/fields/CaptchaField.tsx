'use client';

import { useState, useEffect, ChangeEvent } from 'react';
import { FormFieldBase, FormFieldType } from '@/types/forms';
import { FieldProps, BaseFieldPreview, FieldLayout } from './FieldBase';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'; // Assuming Select is available
import { ShieldCheck } from 'lucide-react';

// Componente de vista previa para campos de CAPTCHA
export function CaptchaFieldPreview({ field }: { field: FormFieldBase }) {
  return (
    <BaseFieldPreview field={field}>
      <div className="p-4 bg-gray-100 border border-dashed border-gray-300 rounded-md text-center flex flex-col items-center justify-center">
        <ShieldCheck className="h-8 w-8 text-gray-400 mb-2" />
        <p className="text-sm text-gray-600">
          CAPTCHA ({(field.options?.captchaType as string) || 'Not configured'})
        </p>
        <p className="text-xs text-gray-500">Verification challenge will appear here.</p>
      </div>
    </BaseFieldPreview>
  );
}

// Componente de edición para campos de CAPTCHA
export function CaptchaField({ field, onChange, showPreview = true }: FieldProps) {
  const [localField, setLocalField] = useState<FormFieldBase>({
    id: field?.id || `field-${Date.now()}`,
    type: FormFieldType.CAPTCHA,
    label: 'CAPTCHA Verification',
    name: 'captchaField',
    defaultValue: '',
    isRequired: false,
    order: 0,
    width: 100,
    options: { captchaType: 'reCAPTCHA_v2', siteKey: '' },
    ...field,
  });

  useEffect(() => {
     setLocalField(prev => ({ 
        ...prev, 
        ...field,
        options: {
            captchaType: 'reCAPTCHA_v2', siteKey: '',
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
    const { name, value } = e.target; // name will be "siteKey"
    setLocalField(prev => {
        const updated = { ...prev, options: { ...prev.options, [name]: value } };
        onChange(updated);
        return updated;
    });
  };

  const handleSelectChange = (name: string, value: string) => {
    if (name === "options.captchaType") {
        setLocalField(prev => {
            const updated = { ...prev, options: { ...prev.options, captchaType: value } };
            onChange(updated);
            return updated;
        });
    }
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
        <Label htmlFor="label">Admin Label</Label>
        <Input id="label" name="label" value={localField.label} onChange={handleInputChange} onKeyDown={handleKeyDown} placeholder="e.g., Security Check" />
        <p className="mt-1 text-xs text-gray-500">Internal label for this field.</p>
      </div>
      <div>
        <Label htmlFor="name">Identifier Name <span className="text-red-500">*</span></Label>
        <Input id="name" name="name" value={localField.name} onChange={handleInputChange} onKeyDown={handleKeyDown} placeholder="e.g., recaptcha_response" />
         <p className="mt-1 text-xs text-gray-500">Name for the CAPTCHA response data.</p>
      </div>
      <div>
        <Label htmlFor="options.captchaType">CAPTCHA Type</Label>
        <Select
          name="options.captchaType"
          value={(localField.options?.captchaType as string) || 'reCAPTCHA_v2'}
          onValueChange={(value) => handleSelectChange('options.captchaType', value)}
        >
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="reCAPTCHA_v2">reCAPTCHA v2</SelectItem>
            <SelectItem value="reCAPTCHA_v3">reCAPTCHA v3</SelectItem>
            <SelectItem value="hCaptcha">hCaptcha</SelectItem>
            <SelectItem value="Turnstile">Cloudflare Turnstile</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label htmlFor="options.siteKey">Site Key</Label>
        <Input 
            id="options.siteKey" 
            name="siteKey"
            value={(localField.options?.siteKey as string) || ''} 
            onChange={handleOptionsChange} 
            onKeyDown={handleKeyDown} 
            placeholder="Enter CAPTCHA Site Key" 
        />
        <p className="mt-1 text-xs text-gray-500">The site key provided by your CAPTCHA service.</p>
      </div>
       <div>
        <Label htmlFor="width">Width (%)</Label>
        <Input type="number" id="width" name="width" min="25" max="100" step="25" value={localField.width || 100} onChange={handleInputChange} onKeyDown={handleKeyDown} />
         <p className="mt-1 text-xs text-gray-500">Usually full-width for CAPTCHA elements.</p>
      </div>
    </div>
  );

  if (!showPreview) {
    return editorContent;
  }

  return (
    <FieldLayout
      title="CAPTCHA Field"
      description="Adds a CAPTCHA challenge to prevent spam."
      preview={<CaptchaFieldPreview field={localField} />}
      editor={editorContent}
    />
  );
}
