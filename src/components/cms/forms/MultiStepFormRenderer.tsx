'use client';

import React, { useState } from 'react';
import { FormBase, FormStepBase, FormFieldBase, FormFieldType } from '@/types/forms';
import { PhoneInput } from './fields/PhoneField';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface MultiStepFormRendererProps {
  form: FormBase;
  buttonClassName?: string;
  buttonStyles?: React.CSSProperties;
  inputClassName?: string;
  labelClassName?: string;
  onSubmit?: (formData: Record<string, unknown>) => Promise<void>;
  submitStatus?: 'idle' | 'submitting' | 'success' | 'error';
}

export default function MultiStepFormRenderer({
  form,
  buttonClassName = 'w-full px-6 py-3 text-white bg-primary hover:bg-primary/90 rounded-md transition-colors',
  buttonStyles,
  inputClassName = 'w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50',
  labelClassName = 'block text-sm font-medium text-gray-700 mb-1',
  onSubmit,
  submitStatus = 'idle'
}: MultiStepFormRendererProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<Record<string, unknown>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());

  // Get visible steps
  const visibleSteps = form.steps?.filter(step => step.isVisible) || [];
  const totalSteps = visibleSteps.length;

  // Calculate progress percentage
  const progressPercentage = totalSteps > 0 ? ((currentStep + 1) / totalSteps) * 100 : 0;

  // Get current step data
  const getCurrentStep = (): FormStepBase | null => {
    return visibleSteps[currentStep] || null;
  };

  // Validate current step
  const validateCurrentStep = (): boolean => {
    const step = getCurrentStep();
    if (!step || !step.fields) return true;

    const newErrors: Record<string, string> = {};
    let isValid = true;

    step.fields.forEach(field => {
      if (field.isRequired && !formData[field.name]) {
        newErrors[field.name] = 'This field is required';
        isValid = false;
      }

      // Email validation
      if (field.type === FormFieldType.EMAIL && formData[field.name]) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData[field.name] as string)) {
          newErrors[field.name] = 'Please enter a valid email address';
          isValid = false;
        }
      }

      // Phone validation
      if (field.type === FormFieldType.PHONE && formData[field.name]) {
        const phoneValue = formData[field.name] as string;
        if (phoneValue.length < 10) {
          newErrors[field.name] = 'Please enter a valid phone number';
          isValid = false;
        }
      }
    });

    setErrors(newErrors);
    return isValid;
  };

  // Handle next step
  const handleNext = () => {
    if (validateCurrentStep()) {
      setCompletedSteps(prev => new Set([...prev, currentStep]));
      if (currentStep < totalSteps - 1) {
        setCurrentStep(currentStep + 1);
      }
    }
  };

  // Handle previous step
  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateCurrentStep()) {
      return;
    }

    if (onSubmit) {
      await onSubmit(formData);
    }
  };

  // Handle input change
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

  // Render form field
  const renderField = (field: FormFieldBase) => {
    const fieldError = errors[field.name];
    const fieldClassName = `${inputClassName} ${fieldError ? 'border-red-500' : ''}`;

    switch (field.type) {
      case FormFieldType.TEXT:
        return (
          <input
            type="text"
            id={field.name}
            name={field.name}
            value={formData[field.name] as string || ''}
            onChange={(e) => handleInputChange(field.name, e.target.value)}
            className={fieldClassName}
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
            value={formData[field.name] as string || ''}
            onChange={(e) => handleInputChange(field.name, e.target.value)}
            className={fieldClassName}
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
            value={formData[field.name] as string || ''}
            onChange={(e) => handleInputChange(field.name, e.target.value)}
            className={fieldClassName}
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
            value={formData[field.name] as string || ''}
            onChange={(e) => handleInputChange(field.name, e.target.value)}
            className={fieldClassName}
            placeholder={field.placeholder}
            required={field.isRequired}
          />
        );

      case FormFieldType.DATE:
        return (
          <input
            type="date"
            id={field.name}
            name={field.name}
            value={formData[field.name] as string || ''}
            onChange={(e) => handleInputChange(field.name, e.target.value)}
            className={fieldClassName}
            required={field.isRequired}
          />
        );

      case FormFieldType.TIME:
        return (
          <input
            type="time"
            id={field.name}
            name={field.name}
            value={formData[field.name] as string || ''}
            onChange={(e) => handleInputChange(field.name, e.target.value)}
            className={fieldClassName}
            required={field.isRequired}
          />
        );

      case FormFieldType.DATETIME:
        return (
          <input
            type="datetime-local"
            id={field.name}
            name={field.name}
            value={formData[field.name] as string || ''}
            onChange={(e) => handleInputChange(field.name, e.target.value)}
            className={fieldClassName}
            required={field.isRequired}
          />
        );

      case FormFieldType.PHONE:
        return (
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
            className={fieldError ? 'border-red-500' : ''}
          />
        );

      case FormFieldType.TEXTAREA:
        return (
          <textarea
            id={field.name}
            name={field.name}
            value={formData[field.name] as string || ''}
            onChange={(e) => handleInputChange(field.name, e.target.value)}
            className={`${fieldClassName} min-h-[100px]`}
            placeholder={field.placeholder}
            required={field.isRequired}
            rows={field.options?.rows as number || 4}
          />
        );

      case FormFieldType.SELECT:
        return (
          <select
            id={field.name}
            name={field.name}
            value={formData[field.name] as string || ''}
            onChange={(e) => handleInputChange(field.name, e.target.value)}
            className={fieldClassName}
            required={field.isRequired}
          >
            <option value="">Select an option</option>
            {field.options?.items?.map((option: { value: string; label: string; disabled?: boolean }) => (
              <option key={option.value} value={option.value} disabled={option.disabled}>
                {option.label}
              </option>
            ))}
          </select>
        );

      case FormFieldType.RADIO:
        return (
          <div className={`space-y-2 ${field.options?.layout === 'horizontal' ? 'flex space-x-4 space-y-0' : ''}`}>
            {field.options?.items?.map((option: { value: string; label: string; disabled?: boolean }) => (
              <label key={option.value} className="flex items-center space-x-2">
                <input
                  type="radio"
                  name={field.name}
                  value={option.value}
                  checked={formData[field.name] === option.value}
                  onChange={(e) => handleInputChange(field.name, e.target.value)}
                  className="text-primary focus:ring-primary"
                  required={field.isRequired}
                  disabled={option.disabled}
                />
                <span className="text-sm">{option.label}</span>
              </label>
            ))}
          </div>
        );

      case FormFieldType.CHECKBOX:
        return (
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              name={field.name}
              checked={formData[field.name] as boolean || false}
              onChange={(e) => handleInputChange(field.name, e.target.checked)}
              className="text-primary focus:ring-primary"
              required={field.isRequired}
            />
            <span className="text-sm">{field.label}</span>
          </label>
        );

      default:
        return (
          <input
            type="text"
            id={field.name}
            name={field.name}
            value={formData[field.name] as string || ''}
            onChange={(e) => handleInputChange(field.name, e.target.value)}
            className={fieldClassName}
            placeholder={field.placeholder}
            required={field.isRequired}
          />
        );
    }
  };

  const currentStepData = getCurrentStep();

  if (!form.isMultiStep || totalSteps === 0) {
    return (
      <div className="text-center p-6 bg-gray-50 rounded-lg">
        <p className="text-gray-600">This form is not configured for multi-step or has no steps.</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700">
            Step {currentStep + 1} of {totalSteps}
          </span>
          <span className="text-sm text-gray-500">
            {Math.round(progressPercentage)}% Complete
          </span>
        </div>
        <Progress value={progressPercentage} className="h-2" />
      </div>

      {/* Step Indicators */}
      <div className="flex justify-center mb-8">
        <div className="flex space-x-4">
          {visibleSteps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                  index < currentStep || completedSteps.has(index)
                    ? 'bg-green-500 text-white'
                    : index === currentStep
                    ? 'bg-primary text-white'
                    : 'bg-gray-200 text-gray-600'
                }`}
              >
                {index < currentStep || completedSteps.has(index) ? (
                  <Check className="w-4 h-4" />
                ) : (
                  index + 1
                )}
              </div>
              {index < totalSteps - 1 && (
                <div
                  className={`w-12 h-0.5 mx-2 transition-colors ${
                    index < currentStep || completedSteps.has(index)
                      ? 'bg-green-500'
                      : 'bg-gray-200'
                  }`}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Form Content */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            {/* Step Title and Description */}
            {currentStepData && (
              <div className="text-center mb-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {currentStepData.title}
                </h3>
                {currentStepData.description && (
                  <p className="text-gray-600">{currentStepData.description}</p>
                )}
              </div>
            )}

            {/* Step Fields */}
            {currentStepData?.fields?.map(field => (
              <div key={field.id} className="space-y-2">
                {field.type !== FormFieldType.CHECKBOX && (
                  <label htmlFor={field.name} className={labelClassName}>
                    {field.label}
                    {field.isRequired && <span className="text-red-500 ml-1">*</span>}
                  </label>
                )}
                
                {renderField(field)}
                
                {errors[field.name] && (
                  <p className="text-red-500 text-sm">{errors[field.name]}</p>
                )}
                
                {field.helpText && (
                  <p className="text-gray-500 text-sm">{field.helpText}</p>
                )}
              </div>
            ))}
          </motion.div>
        </AnimatePresence>

        {/* Navigation Buttons */}
        <div className="flex justify-between pt-6">
          <Button
            type="button"
            variant="outline"
            onClick={handlePrevious}
            disabled={currentStep === 0}
            className="flex items-center space-x-2"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Previous</span>
          </Button>

          {currentStep === totalSteps - 1 ? (
            <Button
              type="submit"
              disabled={submitStatus === 'submitting'}
              className={buttonClassName}
              style={buttonStyles}
            >
              {submitStatus === 'submitting' ? 'Submitting...' : form.submitButtonText || 'Submit'}
            </Button>
          ) : (
            <Button
              type="button"
              onClick={handleNext}
              className="flex items-center space-x-2"
            >
              <span>Next</span>
              <ChevronRight className="w-4 h-4" />
            </Button>
          )}
        </div>
      </form>

      {/* Submit Status Messages */}
      {submitStatus === 'success' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 p-4 bg-green-50 border border-green-200 rounded-md"
        >
          <p className="text-green-800 text-center">
            {form.successMessage || 'Form submitted successfully!'}
          </p>
        </motion.div>
      )}

      {submitStatus === 'error' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 p-4 bg-red-50 border border-red-200 rounded-md"
        >
          <p className="text-red-800 text-center">
            There was an error submitting the form. Please try again.
          </p>
        </motion.div>
      )}
    </div>
  );
} 