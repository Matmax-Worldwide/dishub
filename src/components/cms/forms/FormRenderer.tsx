'use client';

import React, { useState } from 'react';
import { FormBase, FormFieldBase, FormFieldType } from '@/types/forms';

interface FormRendererProps {
  form: FormBase;
  buttonClassName?: string;
  buttonStyles?: React.CSSProperties;
}

const FormRenderer: React.FC<FormRendererProps> = ({ 
  form, 
  buttonClassName = '', 
  buttonStyles = {} 
}) => {
  const [formData, setFormData] = useState<Record<string, unknown>>({});
  
  // Get all fields from the form
  const getFormFields = () => {
    // If it's a multi-step form, combine fields from all steps
    if (form.isMultiStep && form.steps && form.steps.length > 0) {
      return form.steps.flatMap(step => step.fields || []);
    }
    
    // Otherwise, use the direct fields
    return form.fields || [];
  };

  const allFields = getFormFields();
  
  const handleChange = (name: string, value: unknown) => {
    setFormData({
      ...formData,
      [name]: value
    });
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitted with data:', formData);
    // Here you would usually send the data to an API
  };
  
  const renderField = (field: FormFieldBase) => {
    const { 
      id, 
      label, 
      name, 
      type, 
      placeholder, 
      defaultValue, 
      isRequired,
      options 
    } = field;
    
    // Convert to string for form values (or use defaultValue if nothing in form data)
    const stringValue = typeof formData[name] !== 'undefined' 
      ? String(formData[name]) 
      : (defaultValue || '');
    
    // Basic props shared by most input fields
    const commonProps = {
      id,
      name,
      value: stringValue,
      placeholder,
      required: isRequired,
      className: "w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500",
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => 
        handleChange(name, e.target.value),
    };
    
    switch (type) {
      case FormFieldType.TEXT:
        return (
          <input 
            type="text" 
            {...commonProps} 
          />
        );
        
      case FormFieldType.TEXTAREA:
        return (
          <textarea 
            {...commonProps} 
            rows={options?.rows as number || 4}
          />
        );
        
      case FormFieldType.EMAIL:
        return (
          <input 
            type="email" 
            {...commonProps} 
          />
        );
        
      case FormFieldType.PASSWORD:
        return (
          <input 
            type="password" 
            {...commonProps} 
          />
        );
        
      case FormFieldType.NUMBER:
        return (
          <input 
            type="number" 
            {...commonProps} 
          />
        );
        
      case FormFieldType.PHONE:
        return (
          <input 
            type="tel" 
            {...commonProps} 
          />
        );
        
      case FormFieldType.DATE:
        return (
          <input 
            type="date" 
            {...commonProps} 
          />
        );
        
      case FormFieldType.SELECT:
        return (
          <select {...commonProps}>
            <option value="">Select an option</option>
            {options?.items?.map(option => (
              <option 
                key={option.value} 
                value={option.value}
                disabled={option.disabled}
              >
                {option.label}
              </option>
            ))}
          </select>
        );
        
      case FormFieldType.CHECKBOX:
        return (
          <div className="flex items-center">
            <input
              type="checkbox"
              id={id}
              name={name}
              checked={Boolean(formData[name] ?? defaultValue === 'true')}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              onChange={(e) => handleChange(name, e.target.checked)}
              required={isRequired}
            />
            <label
              htmlFor={id}
              className={`ml-2 block text-sm ${options?.labelPosition === 'left' ? 'order-first mr-2 ml-0' : ''}`}
            >
              {label}
              {options?.linkText && options?.linkUrl && (
                <a 
                  href={options.linkUrl as string} 
                  className="ml-1 text-blue-600 hover:underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {options.linkText as string}
                </a>
              )}
            </label>
          </div>
        );
        
      case FormFieldType.RADIO:
        return (
          <div className={`space-y-2 ${options?.layout === 'horizontal' ? 'flex space-y-0 space-x-4' : ''}`}>
            {options?.items?.map(option => (
              <div key={option.value} className="flex items-center">
                <input
                  type="radio"
                  id={`${id}-${option.value}`}
                  name={name}
                  value={option.value}
                  checked={stringValue === option.value}
                  disabled={option.disabled}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  onChange={(e) => handleChange(name, e.target.value)}
                  required={isRequired}
                />
                <label htmlFor={`${id}-${option.value}`} className="ml-2 block text-sm">
                  {option.label}
                </label>
              </div>
            ))}
          </div>
        );
        
      case FormFieldType.HEADING:
        return (
          <h3 className="text-lg font-semibold">{label}</h3>
        );
        
      case FormFieldType.PARAGRAPH:
        return (
          <p className="text-sm text-gray-600">{defaultValue}</p>
        );
        
      case FormFieldType.DIVIDER:
        return (
          <hr className="my-4" />
        );
        
      case FormFieldType.SPACER:
        return (
          <div className="h-6"></div>
        );
        
      default:
        return (
          <input 
            type="text" 
            {...commonProps} 
          />
        );
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {allFields.map(field => (
        <div key={field.id} className="space-y-1">
          {/* Don't show labels for headings, paragraphs, dividers, etc. */}
          {![
            FormFieldType.HEADING, 
            FormFieldType.PARAGRAPH, 
            FormFieldType.DIVIDER, 
            FormFieldType.SPACER,
            FormFieldType.CHECKBOX
          ].includes(field.type) && (
            <label htmlFor={field.id} className="block text-sm font-medium">
              {field.label}
              {field.isRequired && <span className="text-red-500 ml-1">*</span>}
            </label>
          )}
          
          {renderField(field)}
          
          {field.helpText && (
            <p className="text-xs text-gray-500 mt-1">{field.helpText}</p>
          )}
        </div>
      ))}
      
      {/* Submit button */}
      <div className="pt-4">
        <button 
          type="submit"
          className={buttonClassName}
          style={buttonStyles}
        >
          {form.submitButtonText || "Submit"}
        </button>
      </div>
    </form>
  );
};

export default FormRenderer; 