'use client';

import { useState, useEffect } from 'react';
import { useFormComponent } from './hooks/useFormComponent';
import { FormFieldBase, FormSubmissionInput, FormBase, FormSubmissionBase, FieldOption } from '@/types/forms';
import graphqlClient from '@/lib/graphql-client';

interface FormComponentProps {
  formId?: string;
  slug?: string;
  onSubmitSuccess?: (data: FormSubmissionBase | null) => void;
  onSubmitError?: (error: string) => void;
  className?: string;
}

export function FormComponent({ 
  formId, 
  slug, 
  onSubmitSuccess, 
  onSubmitError,
  className = ''
}: FormComponentProps) {
  const [formData, setFormData] = useState<Record<string, string | boolean | number>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  // Use the custom hook to load the form
  const { form, loading, error } = useFormComponent(formId);
  
  // If no formId is provided but slug is, load the form by slug
  useEffect(() => {
    const loadFormBySlug = async () => {
      if (!formId && slug) {
        try {
          const formData = await graphqlClient.getFormBySlug(slug);
          if (formData) {
            // Set the form data here if needed
          }
        } catch (err) {
          console.error('Error loading form by slug:', err);
        }
      }
    };
    
    loadFormBySlug();
  }, [formId, slug]);

  if (loading) {
    return <div className="animate-pulse h-40 bg-gray-100 rounded-md"></div>;
  }

  if (error || !form) {
    return <div className="p-4 text-red-500">Failed to load form. Please try again later.</div>;
  }

  const handleInputChange = (fieldName: string, value: string | boolean | number) => {
    setFormData({
      ...formData,
      [fieldName]: value
    });
    
    // Clear error for this field when user changes input
    if (errors[fieldName]) {
      const newErrors = { ...errors };
      delete newErrors[fieldName];
      setErrors(newErrors);
    }
  };

  const validateForm = (fields: FormFieldBase[]) => {
    const newErrors: Record<string, string> = {};
    
    fields.forEach(field => {
      // Check required fields
      if (field.isRequired && (!formData[field.name] || formData[field.name] === '')) {
        newErrors[field.name] = `${field.label} is required`;
      }
      
      // Email validation
      if (field.name === 'email' && formData[field.name]) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const emailValue = formData[field.name].toString();
        if (!emailRegex.test(emailValue)) {
          newErrors[field.name] = 'Please enter a valid email address';
        }
      }
      
      // Add more validations as needed based on field types
    });
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // If multi-step form and not on last step, go to next step
    if (form.isMultiStep && form.steps && currentStepIndex < form.steps.length - 1) {
      const currentStepFields = form.steps[currentStepIndex].fields || [];
      if (validateForm(currentStepFields)) {
        setCurrentStepIndex(currentStepIndex + 1);
      }
      return;
    }
    
    // For single-step form or last step of multi-step form
    const fieldsToValidate = form.isMultiStep && form.steps 
      ? (form.steps[currentStepIndex].fields || [])
      : (form.fields || []);
    
    if (!validateForm(fieldsToValidate)) {
      return;
    }
    
    setSubmitting(true);
    
    try {
      const submissionData: FormSubmissionInput = {
        formId: form.id,
        data: formData,
        metadata: {
          userAgent: navigator.userAgent,
          timestamp: new Date().toISOString()
        }
      };
      
      const result = await graphqlClient.submitForm(submissionData);
      
      if (result.success) {
        setSubmitted(true);
        setFormData({});
        if (onSubmitSuccess) {
          onSubmitSuccess(result.submission);
        }
      } else {
        if (onSubmitError) {
          onSubmitError(result.message || 'Form submission failed');
        }
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      if (onSubmitError) {
        onSubmitError('An unexpected error occurred. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };
  
  const goToPreviousStep = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(currentStepIndex - 1);
    }
  };
  
  const renderField = (field: FormFieldBase) => {
    const commonProps = {
      id: field.name,
      name: field.name,
      placeholder: field.placeholder || '',
      value: typeof formData[field.name] === 'boolean' ? 
        (formData[field.name] ? 'true' : '') : 
        (formData[field.name]?.toString() || ''),
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => 
        handleInputChange(field.name, e.target.value),
      className: `w-full p-2 border ${errors[field.name] ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500`,
      required: field.isRequired
    };
    
    switch (field.type) {
      case 'TEXT':
      case 'EMAIL':
      case 'PASSWORD':
      case 'PHONE':
      case 'DATE':
      case 'TIME':
      case 'DATETIME':
        return (
          <input 
            type={
              field.type === 'TEXT' ? 'text' : 
              field.type === 'EMAIL' ? 'email' : 
              field.type === 'PASSWORD' ? 'password' : 
              field.type === 'PHONE' ? 'tel' : 
              field.type === 'DATE' ? 'date' : 
              field.type === 'TIME' ? 'time' : 
              'datetime-local'
            } 
            {...commonProps} 
          />
        );
      
      case 'TEXTAREA':
        return (
          <textarea 
            {...commonProps}
            rows={4}
          ></textarea>
        );
      
      case 'SELECT':
        return (
          <select {...commonProps}>
            <option value="">-- Select an option --</option>
            {field.options?.items?.map((option: FieldOption, idx: number) => (
              <option key={idx} value={option.value} disabled={option.disabled}>
                {option.label}
              </option>
            ))}
          </select>
        );
      
      case 'CHECKBOX':
        return (
          <div className="flex items-center">
            <input 
              type="checkbox"
              id={field.name}
              name={field.name}
              checked={!!formData[field.name]}
              onChange={(e) => handleInputChange(field.name, e.target.checked)}
              className="mr-2 h-4 w-4 text-blue-600"
            />
            <label htmlFor={field.name} className="text-sm text-gray-700">
              {field.label}
            </label>
          </div>
        );
      
      // Add more field types as needed
      
      default:
        return (
          <input type="text" {...commonProps} />
        );
    }
  };
  
  const renderForm = (form: FormBase) => {
    if (submitted) {
      return (
        <div className="p-6 bg-green-50 border border-green-100 rounded-md text-center">
          <h3 className="text-lg font-medium text-green-800 mb-2">Form Submitted Successfully</h3>
          <p className="text-green-600">{form.successMessage || 'Thank you for your submission.'}</p>
          {form.redirectUrl && (
            <p className="mt-4">
              <a href={form.redirectUrl} className="text-blue-600 hover:underline">
                Continue
              </a>
            </p>
          )}
        </div>
      );
    }
    
    // For multi-step forms
    let fieldsToRender: FormFieldBase[] = [];
    let currentStep = null;
    
    if (form.isMultiStep && form.steps && form.steps.length > 0) {
      currentStep = form.steps[currentStepIndex];
      fieldsToRender = currentStep.fields || [];
    } else {
      fieldsToRender = form.fields || [];
    }
    
    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Form title and description */}
        {!form.isMultiStep && (
          <>
            <h2 className="text-xl font-semibold text-gray-800">{form.title}</h2>
            {form.description && <p className="text-gray-600 mb-4">{form.description}</p>}
          </>
        )}
        
        {/* For multi-step forms, show step title and description */}
        {form.isMultiStep && currentStep && (
          <>
            <h2 className="text-xl font-semibold text-gray-800">{currentStep.title}</h2>
            {currentStep.description && <p className="text-gray-600 mb-4">{currentStep.description}</p>}
            
            {/* Progress indicator */}
            <div className="flex items-center mb-4">
              {form.steps?.map((step, idx) => (
                <div 
                  key={idx} 
                  className={`h-2 flex-1 ${
                    idx < currentStepIndex 
                      ? 'bg-blue-500' 
                      : idx === currentStepIndex 
                        ? 'bg-blue-300' 
                        : 'bg-gray-200'
                  } ${idx === 0 ? 'rounded-l-full' : ''} ${idx === form.steps!.length - 1 ? 'rounded-r-full' : ''}`}
                ></div>
              ))}
            </div>
            <p className="text-sm text-gray-500 text-center mb-4">
              Step {currentStepIndex + 1} of {form.steps?.length}
            </p>
          </>
        )}
        
        {/* Form fields */}
        <div className="space-y-4">
          {fieldsToRender.map((field) => (
            <div key={field.id} className="form-field" style={{ width: field.width ? `${field.width}%` : '100%' }}>
              {field.type !== 'CHECKBOX' && (
                <label htmlFor={field.name} className="block text-sm font-medium text-gray-700 mb-1">
                  {field.label} {field.isRequired && <span className="text-red-500">*</span>}
                </label>
              )}
              
              {renderField(field)}
              
              {field.helpText && (
                <p className="mt-1 text-xs text-gray-500">{field.helpText}</p>
              )}
              
              {errors[field.name] && (
                <p className="mt-1 text-xs text-red-500">{errors[field.name]}</p>
              )}
            </div>
          ))}
        </div>
        
        {/* Form buttons */}
        <div className="flex justify-between mt-6">
          {form.isMultiStep && currentStepIndex > 0 && (
            <button
              type="button"
              onClick={goToPreviousStep}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Previous
            </button>
          )}
          
          <button
            type="submit"
            disabled={submitting}
            className={`px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 ${
              submitting ? 'opacity-70 cursor-not-allowed' : ''
            } ${form.isMultiStep && currentStepIndex > 0 ? 'ml-auto' : ''}`}
          >
            {submitting ? 'Submitting...' : form.isMultiStep && currentStepIndex < (form.steps?.length || 1) - 1 
              ? 'Next' 
              : form.submitButtonText || 'Submit'}
          </button>
        </div>
      </form>
    );
  };
  
  return (
    <div className={`form-component ${className}`}>
      {renderForm(form)}
    </div>
  );
} 