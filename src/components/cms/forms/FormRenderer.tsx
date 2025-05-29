'use client';

import React, { useState } from 'react';
import { FormBase, FormFieldType, FieldOption, FormFieldBase } from '@/types/forms';
import { PhoneInput } from './fields/PhoneField';

interface FormRendererProps {
  form: FormBase;
  buttonClassName?: string;
  buttonStyles?: React.CSSProperties;
  inputClassName?: string;
  labelClassName?: string;
  onSubmit?: (formData: Record<string, unknown>) => Promise<void>;
  submitStatus?: 'idle' | 'submitting' | 'success' | 'error';
}

export default function FormRenderer({
  form,
  buttonClassName = 'w-full px-6 py-3 text-white bg-primary hover:bg-primary/90 rounded-md transition-colors',
  buttonStyles,
  inputClassName = 'w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50',
  labelClassName = 'block text-sm font-medium text-gray-700 mb-1',
  onSubmit,
  submitStatus = 'idle'
}: FormRendererProps) {
  const [formData, setFormData] = useState<Record<string, unknown>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    const newErrors: Record<string, string> = {};
    form.fields?.forEach(field => {
      if (field.isRequired && !formData[field.name]) {
        newErrors[field.name] = 'This field is required';
      }
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    if (onSubmit) {
      await onSubmit(formData);
    }
  };

  const handleInputChange = (fieldName: string, value: unknown) => {
    setFormData(prev => ({
      ...prev,
      [fieldName]: value
    }));
    // Clear error when user starts typing
    if (errors[fieldName]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[fieldName];
        return newErrors;
      });
    }
  };

  // Prevenir envío del formulario cuando se presiona Enter en un input (excepto textarea)
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.target instanceof HTMLElement) {
      const tagName = e.target.tagName.toLowerCase();
      // Permitir Enter en textareas, pero prevenir envío en otros inputs
      if (tagName !== 'textarea') {
        e.preventDefault();
      }
    }
  };

  const renderField = (field: FormFieldBase) => {
    const fieldError = errors[field.name];
    const fieldValue = formData[field.name];
    const baseInputClass = `${inputClassName} ${fieldError ? 'border-red-500' : ''}`;

    switch (field.type) {
      case FormFieldType.TEXT:
  return (
            <input
              type="text"
              id={field.name}
              name={field.name}
            value={fieldValue as string || field.defaultValue || ''}
              onChange={(e) => handleInputChange(field.name, e.target.value)}
            className={baseInputClass}
              placeholder={field.placeholder}
              required={field.isRequired}
            />
        );

      case FormFieldType.EMAIL:
        return (
            <input
              type="email"
              id={field.name}
              name={field.name}
            value={fieldValue as string || field.defaultValue || ''}
              onChange={(e) => handleInputChange(field.name, e.target.value)}
            className={baseInputClass}
              placeholder={field.placeholder}
              required={field.isRequired}
            />
        );

      case FormFieldType.PASSWORD:
        return (
            <input
              type="password"
              id={field.name}
              name={field.name}
            value={fieldValue as string || ''}
              onChange={(e) => handleInputChange(field.name, e.target.value)}
            className={baseInputClass}
              placeholder={field.placeholder}
              required={field.isRequired}
            />
        );

      case FormFieldType.NUMBER:
        return (
            <input
              type="number"
              id={field.name}
              name={field.name}
            value={fieldValue as string || field.defaultValue || ''}
              onChange={(e) => handleInputChange(field.name, e.target.value)}
            className={baseInputClass}
              placeholder={field.placeholder}
              required={field.isRequired}
            min={field.options?.min as number}
            max={field.options?.max as number}
            step={field.options?.step as number}
            />
        );

      case FormFieldType.DATE:
        return (
            <input
              type="date"
              id={field.name}
              name={field.name}
            value={fieldValue as string || field.defaultValue || ''}
              onChange={(e) => handleInputChange(field.name, e.target.value)}
            className={baseInputClass}
              required={field.isRequired}
            min={field.options?.minDate as string}
            max={field.options?.maxDate as string}
            />
        );

      case FormFieldType.TIME:
        return (
            <input
              type="time"
              id={field.name}
              name={field.name}
            value={fieldValue as string || field.defaultValue || ''}
              onChange={(e) => handleInputChange(field.name, e.target.value)}
            className={baseInputClass}
              required={field.isRequired}
            />
        );

      case FormFieldType.DATETIME:
        return (
            <input
              type="datetime-local"
              id={field.name}
              name={field.name}
            value={fieldValue as string || field.defaultValue || ''}
              onChange={(e) => handleInputChange(field.name, e.target.value)}
            className={baseInputClass}
              required={field.isRequired}
            />
        );

      case FormFieldType.PHONE:
        return (
            <PhoneInput
              id={field.name}
              name={field.name}
            value={fieldValue as string || field.defaultValue || ''}
              onChange={(value) => handleInputChange(field.name, value)}
              placeholder={field.placeholder}
              required={field.isRequired}
              defaultCountry={(field.options?.defaultCountry as string) || 'ES'}
              showCountryCode={field.options?.showCountryCode !== false}
              format={(field.options?.format as 'international' | 'national' | 'any') || 'international'}
              inputClassName={inputClassName}
            className={fieldError ? 'border-red-500' : ''}
          />
        );

      case FormFieldType.TEXTAREA:
        return (
          <textarea
            id={field.name}
            name={field.name}
            value={fieldValue as string || field.defaultValue || ''}
            onChange={(e) => handleInputChange(field.name, e.target.value)}
            className={`${baseInputClass} min-h-[100px]`}
            placeholder={field.placeholder}
            required={field.isRequired}
            rows={field.options?.rows as number || 4}
            maxLength={field.options?.maxLength as number}
          />
        );

      case FormFieldType.SELECT:
        return (
          <select
            id={field.name}
            name={field.name}
            value={fieldValue as string || field.defaultValue || ''}
            onChange={(e) => handleInputChange(field.name, e.target.value)}
            className={baseInputClass}
            required={field.isRequired}
          >
            <option value="">Select an option</option>
            {field.options?.items?.map((option: FieldOption) => (
              <option key={option.value} value={option.value} disabled={option.disabled}>
                {option.label}
              </option>
            ))}
          </select>
        );

      case FormFieldType.MULTISELECT:
        return (
          <select
            id={field.name}
            name={field.name}
            multiple
            value={Array.isArray(fieldValue) ? fieldValue as string[] : (fieldValue as string || field.defaultValue || '').split(',')}
            onChange={(e) => {
              const selectedValues = Array.from(e.target.selectedOptions, option => option.value);
              handleInputChange(field.name, selectedValues);
            }}
            className={`${baseInputClass} min-h-[120px]`}
            required={field.isRequired}
          >
            {field.options?.items?.map((option: FieldOption) => (
              <option key={option.value} value={option.value} disabled={option.disabled}>
                {option.label}
              </option>
            ))}
          </select>
        );

      case FormFieldType.RADIO:
        return (
          <div className={`space-y-2 ${field.options?.layout === 'horizontal' ? 'flex flex-wrap gap-4' : ''}`}>
            {field.options?.items?.map((option: FieldOption) => (
              <div key={option.value} className="flex items-center space-x-2">
                <input
                  type="radio"
                  id={`${field.name}-${option.value}`}
                  name={field.name}
                  value={option.value}
                  checked={fieldValue === option.value || (!fieldValue && field.defaultValue === option.value)}
                  onChange={(e) => handleInputChange(field.name, e.target.value)}
                  className="w-4 h-4 text-primary focus:ring-primary"
                  required={field.isRequired}
                  disabled={option.disabled}
                />
                <label htmlFor={`${field.name}-${option.value}`} className="text-sm font-medium text-gray-700">
                  {option.label}
                </label>
              </div>
            ))}
          </div>
        );

      case FormFieldType.CHECKBOX:
        return (
          <div className="flex items-start space-x-2">
            <input
              type="checkbox"
              id={field.name}
              name={field.name}
              checked={fieldValue as boolean || field.defaultValue === 'true' || false}
              onChange={(e) => handleInputChange(field.name, e.target.checked)}
              className="w-4 h-4 text-primary focus:ring-primary mt-1"
              required={field.isRequired}
            />
            <div className="flex-1">
              <label htmlFor={field.name} className="text-sm font-medium text-gray-700">
                {field.label}
                {field.isRequired && <span className="text-red-500 ml-1">*</span>}
              </label>
              {field.options?.linkText && field.options?.linkUrl && (
                <div className="mt-1">
                  <a 
                    href={field.options.linkUrl as string} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary hover:underline text-sm"
                  >
                    {field.options.linkText as string}
                  </a>
                </div>
              )}
            </div>
          </div>
        );

      case FormFieldType.TOGGLE:
        return (
          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={() => handleInputChange(field.name, !(fieldValue as boolean))}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
                fieldValue ? 'bg-primary' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  fieldValue ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
            <label className="text-sm font-medium text-gray-700">
              {field.label}
              {field.isRequired && <span className="text-red-500 ml-1">*</span>}
            </label>
          </div>
        );

      case FormFieldType.SLIDER:
        const minValue = (field.options?.min as number) || 0;
        const maxValue = (field.options?.max as number) || 100;
        const defaultNum = field.defaultValue ? parseInt(field.defaultValue) : minValue;
        const currentValue = (fieldValue as number) || defaultNum;
        
        return (
          <div className="space-y-2">
            <input
              type="range"
              id={field.name}
              name={field.name}
              value={currentValue}
              onChange={(e) => handleInputChange(field.name, parseInt(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              min={minValue}
              max={maxValue}
              step={field.options?.step as number || 1}
              required={field.isRequired}
            />
            <div className="flex justify-between text-sm text-gray-500">
              <span>{minValue}</span>
              <span className="font-medium">{currentValue}</span>
              <span>{maxValue}</span>
            </div>
          </div>
        );

      case FormFieldType.RATING:
        const maxRating = field.options?.maxRating as number || 5;
        const currentRating = fieldValue as number || 0;
        return (
          <div className="flex space-x-1">
            {Array.from({ length: maxRating }, (_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleInputChange(field.name, i + 1)}
                className={`w-8 h-8 ${
                  i < currentRating ? 'text-yellow-400' : 'text-gray-300'
                } hover:text-yellow-400 transition-colors`}
              >
                ★
              </button>
            ))}
          </div>
        );

      case FormFieldType.FILE:
        return (
          <input
            type="file"
            id={field.name}
            name={field.name}
            onChange={(e) => {
              const file = e.target.files?.[0];
              handleInputChange(field.name, file);
            }}
            className={baseInputClass}
            required={field.isRequired}
            accept={field.options?.acceptedTypes as string}
            multiple={field.options?.multiple as boolean}
          />
        );

      case FormFieldType.HIDDEN:
        return (
          <input
            type="hidden"
            id={field.name}
            name={field.name}
            value={fieldValue as string || field.defaultValue || ''}
          />
        );

      case FormFieldType.HEADING:
        const headingLevel = (field.options?.level as string) || 'h3';
        const headingClass = `font-bold ${
          headingLevel === 'h1' ? 'text-3xl' :
          headingLevel === 'h2' ? 'text-2xl' :
          headingLevel === 'h3' ? 'text-xl' :
          headingLevel === 'h4' ? 'text-lg' :
          headingLevel === 'h5' ? 'text-base' :
          'text-sm'
        } text-gray-900`;
        
        if (headingLevel === 'h1') {
          return <h1 className={headingClass}>{field.label}</h1>;
        } else if (headingLevel === 'h2') {
          return <h2 className={headingClass}>{field.label}</h2>;
        } else if (headingLevel === 'h3') {
          return <h3 className={headingClass}>{field.label}</h3>;
        } else if (headingLevel === 'h4') {
          return <h4 className={headingClass}>{field.label}</h4>;
        } else if (headingLevel === 'h5') {
          return <h5 className={headingClass}>{field.label}</h5>;
        } else {
          return <h6 className={headingClass}>{field.label}</h6>;
        }

      case FormFieldType.PARAGRAPH:
        return (
          <p className="text-gray-700 leading-relaxed">
            {field.label}
          </p>
        );

      case FormFieldType.DIVIDER:
        return (
          <hr className={`border-gray-300 ${field.options?.style === 'dashed' ? 'border-dashed' : 'border-solid'}`} />
        );

      case FormFieldType.SPACER:
        const height = field.options?.height as number || 20;
        return <div style={{ height: `${height}px` }} />;

      case FormFieldType.HTML:
        return (
          <div 
            className="prose max-w-none"
            dangerouslySetInnerHTML={{ __html: field.options?.content as string || field.label }}
          />
        );

      case FormFieldType.CAPTCHA:
        return (
          <div className="bg-gray-100 border border-gray-300 rounded p-4 text-center">
            <p className="text-sm text-gray-600 mb-2">CAPTCHA Verification</p>
            <div className="bg-white border rounded p-2 inline-block">
              <span className="font-mono text-lg">{Math.random().toString(36).substring(2, 8).toUpperCase()}</span>
            </div>
            <input
              type="text"
              placeholder="Enter CAPTCHA"
              className={`${baseInputClass} mt-2`}
              onChange={(e) => handleInputChange(field.name, e.target.value)}
              required={field.isRequired}
            />
          </div>
        );

      case FormFieldType.SIGNATURE:
        return (
          <div className="border border-gray-300 rounded p-4">
            <p className="text-sm text-gray-600 mb-2">Digital Signature</p>
            <div className="bg-gray-50 border border-dashed border-gray-300 rounded h-32 flex items-center justify-center">
              <span className="text-gray-400">Signature pad would go here</span>
            </div>
            <input
              type="hidden"
              name={field.name}
              value={fieldValue as string || ''}
            />
          </div>
        );

      case FormFieldType.AUTOCOMPLETE:
        const suggestions = field.options?.suggestions as string[] || [];
        return (
          <div className="relative">
            <input
              type="text"
              id={field.name}
              name={field.name}
              value={fieldValue as string || field.defaultValue || ''}
              onChange={(e) => handleInputChange(field.name, e.target.value)}
              className={baseInputClass}
              placeholder={field.placeholder}
              required={field.isRequired}
              list={`${field.name}-suggestions`}
            />
            <datalist id={`${field.name}-suggestions`}>
              {suggestions.map((suggestion, index) => (
                <option key={index} value={suggestion} />
              ))}
            </datalist>
          </div>
        );

      case FormFieldType.ADDRESS:
        return (
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Street Address"
              className={baseInputClass}
              onChange={(e) => {
                const currentAddress = (fieldValue as Record<string, string>) || {};
                handleInputChange(field.name, { ...currentAddress, street: e.target.value });
              }}
              required={field.isRequired}
            />
            <div className="grid grid-cols-2 gap-3">
              <input
                type="text"
                placeholder="City"
                className={baseInputClass}
                onChange={(e) => {
                  const currentAddress = (fieldValue as Record<string, string>) || {};
                  handleInputChange(field.name, { ...currentAddress, city: e.target.value });
                }}
              />
              <input
                type="text"
                placeholder="State/Province"
                className={baseInputClass}
                onChange={(e) => {
                  const currentAddress = (fieldValue as Record<string, string>) || {};
                  handleInputChange(field.name, { ...currentAddress, state: e.target.value });
                }}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <input
                type="text"
                placeholder="ZIP/Postal Code"
                className={baseInputClass}
                onChange={(e) => {
                  const currentAddress = (fieldValue as Record<string, string>) || {};
                  handleInputChange(field.name, { ...currentAddress, zip: e.target.value });
                }}
              />
              <input
                type="text"
                placeholder="Country"
                className={baseInputClass}
                onChange={(e) => {
                  const currentAddress = (fieldValue as Record<string, string>) || {};
                  handleInputChange(field.name, { ...currentAddress, country: e.target.value });
                }}
              />
            </div>
          </div>
        );

      default:
        return (
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded">
            <p className="text-sm text-yellow-800">
              Unsupported field type: {field.type}
            </p>
          </div>
        );
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6" onKeyDown={handleKeyDown}>
      {form.fields?.map(field => {
        // Skip rendering label for certain field types
        const skipLabel = [
          FormFieldType.HEADING,
          FormFieldType.PARAGRAPH,
          FormFieldType.DIVIDER,
          FormFieldType.SPACER,
          FormFieldType.HTML,
          FormFieldType.HIDDEN,
          FormFieldType.CHECKBOX,
          FormFieldType.TOGGLE
        ].includes(field.type);

        return (
          <div key={field.id} className="space-y-2">
            {!skipLabel && (
              <label htmlFor={field.name} className={labelClassName}>
                {field.label}
                {field.isRequired && <span className="text-red-500 ml-1">*</span>}
              </label>
          )}

            {renderField(field)}
            
            {field.helpText && (
              <p className="text-sm text-gray-500">{field.helpText}</p>
          )}

          {errors[field.name] && (
            <p className="text-sm text-red-500">{errors[field.name]}</p>
          )}
        </div>
        );
      })}

      <button
        type="submit"
        className={buttonClassName}
        style={buttonStyles}
        disabled={submitStatus === 'submitting'}
      >
        {submitStatus === 'submitting' ? 'Submitting...' : form.submitButtonText || 'Submit'}
      </button>

      {submitStatus === 'success' && (
        <div className="p-4 bg-green-50 text-green-700 rounded-md">
          {form.successMessage || 'Form submitted successfully!'}
        </div>
      )}

      {submitStatus === 'error' && (
        <div className="p-4 bg-red-50 text-red-700 rounded-md">
          An error occurred while submitting the form. Please try again.
        </div>
      )}
    </form>
  );
} 