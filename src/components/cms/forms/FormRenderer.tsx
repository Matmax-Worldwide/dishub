'use client';

import React, { useState } from 'react';
import { FormBase, FormFieldType } from '@/types/forms';
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

  return (
    <form onSubmit={handleSubmit} className="space-y-6" onKeyDown={handleKeyDown}>
      {form.fields?.map(field => (
        <div key={field.id} className="space-y-2">
          <label htmlFor={field.name} className={labelClassName}>
            {field.label}
            {field.isRequired && <span className="text-red-500 ml-1">*</span>}
          </label>
          
          {field.type === FormFieldType.TEXT && (
            <input
              type="text"
              id={field.name}
              name={field.name}
              value={formData[field.name] as string || ''}
              onChange={(e) => handleInputChange(field.name, e.target.value)}
              className={`${inputClassName} ${errors[field.name] ? 'border-red-500' : ''}`}
              placeholder={field.placeholder}
              required={field.isRequired}
            />
          )}

          {field.type === FormFieldType.EMAIL && (
            <input
              type="email"
              id={field.name}
              name={field.name}
              value={formData[field.name] as string || ''}
              onChange={(e) => handleInputChange(field.name, e.target.value)}
              className={`${inputClassName} ${errors[field.name] ? 'border-red-500' : ''}`}
              placeholder={field.placeholder}
              required={field.isRequired}
            />
          )}

          {field.type === FormFieldType.PASSWORD && (
            <input
              type="password"
              id={field.name}
              name={field.name}
              value={formData[field.name] as string || ''}
              onChange={(e) => handleInputChange(field.name, e.target.value)}
              className={`${inputClassName} ${errors[field.name] ? 'border-red-500' : ''}`}
              placeholder={field.placeholder}
              required={field.isRequired}
            />
          )}

          {field.type === FormFieldType.NUMBER && (
            <input
              type="number"
              id={field.name}
              name={field.name}
              value={formData[field.name] as string || ''}
              onChange={(e) => handleInputChange(field.name, e.target.value)}
              className={`${inputClassName} ${errors[field.name] ? 'border-red-500' : ''}`}
              placeholder={field.placeholder}
              required={field.isRequired}
            />
          )}

          {field.type === FormFieldType.DATE && (
            <input
              type="date"
              id={field.name}
              name={field.name}
              value={formData[field.name] as string || ''}
              onChange={(e) => handleInputChange(field.name, e.target.value)}
              className={`${inputClassName} ${errors[field.name] ? 'border-red-500' : ''}`}
              required={field.isRequired}
            />
          )}

          {field.type === FormFieldType.TIME && (
            <input
              type="time"
              id={field.name}
              name={field.name}
              value={formData[field.name] as string || ''}
              onChange={(e) => handleInputChange(field.name, e.target.value)}
              className={`${inputClassName} ${errors[field.name] ? 'border-red-500' : ''}`}
              required={field.isRequired}
            />
          )}

          {field.type === FormFieldType.DATETIME && (
            <input
              type="datetime-local"
              id={field.name}
              name={field.name}
              value={formData[field.name] as string || ''}
              onChange={(e) => handleInputChange(field.name, e.target.value)}
              className={`${inputClassName} ${errors[field.name] ? 'border-red-500' : ''}`}
              required={field.isRequired}
            />
          )}

          {field.type === FormFieldType.PHONE && (
            <PhoneInput
              id={field.name}
              name={field.name}
              value={formData[field.name] as string || ''}
              onChange={(value) => handleInputChange(field.name, value)}
              placeholder={field.placeholder}
              required={field.isRequired}
              defaultCountry={(field.options?.defaultCountry as string) || 'ES'}
              showCountryCode={field.options?.showCountryCode !== false}
              format={(field.options?.format as 'international' | 'national' | 'any') || 'international'}
              inputClassName={inputClassName}
              className={errors[field.name] ? 'border-red-500' : ''}
            />
          )}

          {field.type === FormFieldType.TEXTAREA && (
            <textarea
              id={field.name}
              name={field.name}
              value={formData[field.name] as string || ''}
              onChange={(e) => handleInputChange(field.name, e.target.value)}
              className={`${inputClassName} min-h-[100px] ${errors[field.name] ? 'border-red-500' : ''}`}
              placeholder={field.placeholder}
              required={field.isRequired}
            />
          )}

          {field.type === FormFieldType.SELECT && (
            <select
              id={field.name}
              name={field.name}
              value={formData[field.name] as string || ''}
              onChange={(e) => handleInputChange(field.name, e.target.value)}
              className={`${inputClassName} ${errors[field.name] ? 'border-red-500' : ''}`}
              required={field.isRequired}
            >
              <option value="">Select an option</option>
              {field.options?.items?.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          )}

          {field.type === FormFieldType.CHECKBOX && (
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id={field.name}
                name={field.name}
                checked={formData[field.name] as boolean || false}
                onChange={(e) => handleInputChange(field.name, e.target.checked)}
                className={`${inputClassName} w-4 h-4`}
                required={field.isRequired}
              />
              <label htmlFor={field.name} className={labelClassName}>
                {field.label}
                {field.isRequired && <span className="text-red-500 ml-1">*</span>}
              </label>
            </div>
          )}

          {field.type === FormFieldType.RADIO && (
            <div className="space-y-2">
              {field.options?.items?.map(option => (
                <div key={option.value} className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id={`${field.name}-${option.value}`}
                    name={field.name}
                    value={option.value}
                    checked={formData[field.name] === option.value}
                    onChange={(e) => handleInputChange(field.name, e.target.value)}
                    className={`${inputClassName} w-4 h-4`}
                    required={field.isRequired}
                  />
                  <label htmlFor={`${field.name}-${option.value}`} className={labelClassName}>
                    {option.label}
                  </label>
                </div>
              ))}
            </div>
          )}

          {errors[field.name] && (
            <p className="text-sm text-red-500">{errors[field.name]}</p>
          )}
        </div>
      ))}

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