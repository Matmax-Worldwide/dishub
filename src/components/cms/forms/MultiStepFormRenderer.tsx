'use client';

import React, { useState, useEffect } from 'react';
import { FormBase, FormStepBase, FormFieldBase, FormFieldType } from '@/types/forms';
import { PhoneInput } from './fields/PhoneField';
import { ChevronLeft, ChevronRight, Check, Sparkles, Zap, Circle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export type FormDesignType = 'modern' | 'elegant' | 'futuristic' | 'minimal' | 'corporate' | 'gradient' | 'glassmorphism' | 'neon' | 'retro';

interface MultiStepFormRendererProps {
  form: FormBase;
  onSubmit?: (formData: Record<string, unknown>) => Promise<void>;
  submitStatus?: 'idle' | 'submitting' | 'success' | 'error';
  designType?: FormDesignType;
  showStepTitle?: boolean;
}

export default function MultiStepFormRenderer({
  form,
  onSubmit,
  submitStatus = 'idle',
  designType = 'modern',
  showStepTitle = true
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

  // Emit initial progress event when component mounts
  useEffect(() => {
    const progressEvent = new CustomEvent('multistep-form-progress', {
      detail: {
        step: currentStep,
        totalSteps,
        completed: Array.from(completedSteps)
      }
    });
    window.dispatchEvent(progressEvent);
  }, [currentStep, totalSteps, completedSteps]);

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
    // Don't validate when moving to next step, just move forward
    const newCompletedSteps = new Set([...completedSteps, currentStep]);
    setCompletedSteps(newCompletedSteps);
    
      if (currentStep < totalSteps - 1) {
      const newStep = currentStep + 1;
      setCurrentStep(newStep);
      
      // Clear any existing errors when moving to next step
      setErrors({});
      
      // Emit progress event for FormSection to listen
      const progressEvent = new CustomEvent('multistep-form-progress', {
        detail: {
          step: newStep,
          totalSteps,
          completed: Array.from(newCompletedSteps)
        }
      });
      window.dispatchEvent(progressEvent);
    }
  };

  // Handle previous step
  const handlePrevious = () => {
    if (currentStep > 0) {
      const newStep = currentStep - 1;
      setCurrentStep(newStep);
      
      // Emit progress event for FormSection to listen
      const progressEvent = new CustomEvent('multistep-form-progress', {
        detail: {
          step: newStep,
          totalSteps,
          completed: Array.from(completedSteps)
        }
      });
      window.dispatchEvent(progressEvent);
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

  // Design-specific styles and components
  const getDesignStyles = () => {
    switch (designType) {
      case 'modern':
        return {
          container: 'bg-white rounded-2xl shadow-xl border border-gray-100',
          progressBar: 'bg-gradient-to-r from-blue-500 to-purple-600',
          progressBg: 'bg-gray-100',
          stepIndicator: {
            active: 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg',
            completed: 'bg-green-500 text-white shadow-lg',
            inactive: 'bg-gray-200 text-gray-600'
          },
          input: 'w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-300',
          label: 'block text-sm font-semibold text-gray-700 mb-2',
          button: {
            primary: 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-8 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300',
            secondary: 'bg-gray-100 hover:bg-gray-200 text-gray-700 px-8 py-3 rounded-xl font-semibold transition-all duration-300'
          }
        };
      
      case 'elegant':
        return {
          container: 'bg-gradient-to-br from-gray-50 to-white rounded-3xl shadow-2xl border border-gray-200',
          progressBar: 'bg-gradient-to-r from-amber-400 to-orange-500',
          progressBg: 'bg-gray-200',
          stepIndicator: {
            active: 'bg-gradient-to-r from-amber-400 to-orange-500 text-white shadow-xl',
            completed: 'bg-emerald-500 text-white shadow-xl',
            inactive: 'bg-white text-gray-500 border-2 border-gray-300'
          },
          input: 'w-full px-5 py-4 border border-gray-300 rounded-2xl focus:border-amber-400 focus:ring-4 focus:ring-amber-100 bg-white/80 backdrop-blur-sm transition-all duration-300',
          label: 'block text-sm font-medium text-gray-800 mb-3',
          button: {
            primary: 'bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600 text-white px-10 py-4 rounded-2xl font-medium shadow-xl hover:shadow-2xl transition-all duration-300',
            secondary: 'bg-white hover:bg-gray-50 text-gray-700 px-10 py-4 rounded-2xl font-medium border-2 border-gray-300 hover:border-gray-400 transition-all duration-300'
          }
        };
      
      case 'futuristic':
        return {
          container: 'bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl shadow-2xl border border-cyan-500/20',
          progressBar: 'bg-gradient-to-r from-cyan-400 to-blue-500',
          progressBg: 'bg-slate-700',
          stepIndicator: {
            active: 'bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-900 shadow-xl shadow-cyan-500/30',
            completed: 'bg-green-400 text-slate-900 shadow-xl shadow-green-400/30',
            inactive: 'bg-slate-700 text-slate-400 border border-slate-600'
          },
          input: 'w-full px-4 py-3 bg-slate-800/50 border border-slate-600 rounded-xl focus:border-cyan-400 focus:ring-4 focus:ring-cyan-400/20 text-white placeholder-slate-400 transition-all duration-300',
          label: 'block text-sm font-medium text-cyan-300 mb-2',
          button: {
            primary: 'bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-slate-900 px-8 py-3 rounded-xl font-bold shadow-xl shadow-cyan-500/30 hover:shadow-cyan-500/50 transition-all duration-300',
            secondary: 'bg-slate-700 hover:bg-slate-600 text-cyan-300 px-8 py-3 rounded-xl font-bold border border-slate-600 hover:border-slate-500 transition-all duration-300'
          }
        };
      
      case 'minimal':
        return {
          container: 'bg-white rounded-lg shadow-md border border-gray-200',
          progressBar: 'bg-gray-900',
          progressBg: 'bg-gray-200',
          stepIndicator: {
            active: 'bg-gray-900 text-white',
            completed: 'bg-gray-700 text-white',
            inactive: 'bg-gray-100 text-gray-500 border border-gray-300'
          },
          input: 'w-full px-3 py-2 border border-gray-300 rounded-md focus:border-gray-900 focus:ring-2 focus:ring-gray-100 transition-all duration-200',
          label: 'block text-sm font-medium text-gray-900 mb-1',
          button: {
            primary: 'bg-gray-900 hover:bg-gray-800 text-white px-6 py-2 rounded-md font-medium transition-all duration-200',
            secondary: 'bg-white hover:bg-gray-50 text-gray-900 px-6 py-2 rounded-md font-medium border border-gray-300 hover:border-gray-400 transition-all duration-200'
          }
        };
      
      case 'corporate':
        return {
          container: 'bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl shadow-xl border border-blue-200',
          progressBar: 'bg-gradient-to-r from-blue-600 to-indigo-600',
          progressBg: 'bg-blue-100',
          stepIndicator: {
            active: 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg',
            completed: 'bg-green-600 text-white shadow-lg',
            inactive: 'bg-white text-blue-600 border-2 border-blue-200'
          },
          input: 'w-full px-4 py-3 border border-blue-200 rounded-lg focus:border-blue-600 focus:ring-3 focus:ring-blue-100 bg-white transition-all duration-300',
          label: 'block text-sm font-semibold text-blue-900 mb-2',
          button: {
            primary: 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 py-3 rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300',
            secondary: 'bg-white hover:bg-blue-50 text-blue-600 px-8 py-3 rounded-lg font-semibold border-2 border-blue-200 hover:border-blue-300 transition-all duration-300'
          }
        };
      
      case 'gradient':
        return {
          container: 'bg-gradient-to-br from-pink-100 via-purple-50 to-indigo-100 rounded-3xl shadow-2xl border border-purple-200',
          progressBar: 'bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500',
          progressBg: 'bg-white/50',
          stepIndicator: {
            active: 'bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-xl',
            completed: 'bg-gradient-to-r from-green-400 to-emerald-500 text-white shadow-xl',
            inactive: 'bg-white/80 text-purple-600 border-2 border-purple-200'
          },
          input: 'w-full px-4 py-3 bg-white/80 backdrop-blur-sm border border-purple-200 rounded-2xl focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all duration-300',
          label: 'block text-sm font-semibold text-purple-800 mb-2',
          button: {
            primary: 'bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 hover:from-pink-600 hover:via-purple-600 hover:to-indigo-600 text-white px-8 py-3 rounded-2xl font-semibold shadow-xl hover:shadow-2xl transition-all duration-300',
            secondary: 'bg-white/80 backdrop-blur-sm hover:bg-white text-purple-600 px-8 py-3 rounded-2xl font-semibold border-2 border-purple-200 hover:border-purple-300 transition-all duration-300'
          }
        };
      
      case 'glassmorphism':
        return {
          container: 'bg-white/20 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/30',
          progressBar: 'bg-gradient-to-r from-blue-500/80 to-purple-500/80 backdrop-blur-sm',
          progressBg: 'bg-white/30 backdrop-blur-sm',
          stepIndicator: {
            active: 'bg-white/30 backdrop-blur-md text-gray-800 shadow-xl border border-white/40',
            completed: 'bg-green-400/80 backdrop-blur-md text-white shadow-xl',
            inactive: 'bg-white/10 backdrop-blur-md text-gray-600 border border-white/20'
          },
          input: 'w-full px-4 py-3 bg-white/20 backdrop-blur-md border border-white/30 rounded-2xl focus:border-white/50 focus:ring-4 focus:ring-white/20 text-gray-800 placeholder-gray-600 transition-all duration-300',
          label: 'block text-sm font-semibold text-gray-800 mb-2',
          button: {
            primary: 'bg-white/30 backdrop-blur-md hover:bg-white/40 text-gray-800 px-8 py-3 rounded-2xl font-semibold shadow-xl hover:shadow-2xl border border-white/40 transition-all duration-300',
            secondary: 'bg-white/10 backdrop-blur-md hover:bg-white/20 text-gray-700 px-8 py-3 rounded-2xl font-semibold border border-white/20 hover:border-white/30 transition-all duration-300'
          }
        };
      
      case 'neon':
        return {
          container: 'bg-black rounded-3xl shadow-2xl border border-cyan-500/50 relative overflow-hidden',
          progressBar: 'bg-gradient-to-r from-cyan-400 to-pink-400',
          progressBg: 'bg-gray-800',
          stepIndicator: {
            active: 'bg-cyan-400 text-black shadow-xl shadow-cyan-400/50 border-2 border-cyan-400',
            completed: 'bg-green-400 text-black shadow-xl shadow-green-400/50',
            inactive: 'bg-gray-800 text-cyan-400 border-2 border-cyan-400/30'
          },
          input: 'w-full px-4 py-3 bg-gray-900 border-2 border-cyan-400/50 rounded-xl focus:border-cyan-400 focus:ring-4 focus:ring-cyan-400/20 text-cyan-100 placeholder-cyan-400/50 transition-all duration-300 shadow-inner',
          label: 'block text-sm font-bold text-cyan-400 mb-2 uppercase tracking-wide',
          button: {
            primary: 'bg-gradient-to-r from-cyan-400 to-pink-400 hover:from-cyan-300 hover:to-pink-300 text-black px-8 py-3 rounded-xl font-bold shadow-xl shadow-cyan-400/30 hover:shadow-cyan-400/50 transition-all duration-300 uppercase tracking-wide',
            secondary: 'bg-gray-800 hover:bg-gray-700 text-cyan-400 px-8 py-3 rounded-xl font-bold border-2 border-cyan-400/50 hover:border-cyan-400 transition-all duration-300 uppercase tracking-wide'
          }
        };
      
      case 'retro':
        return {
          container: 'bg-gradient-to-br from-orange-100 to-yellow-100 rounded-2xl shadow-xl border-4 border-orange-300',
          progressBar: 'bg-gradient-to-r from-orange-400 to-red-400',
          progressBg: 'bg-orange-200',
          stepIndicator: {
            active: 'bg-orange-400 text-white shadow-lg border-4 border-orange-600',
            completed: 'bg-green-500 text-white shadow-lg border-4 border-green-700',
            inactive: 'bg-yellow-200 text-orange-800 border-4 border-orange-300'
          },
          input: 'w-full px-4 py-3 bg-yellow-50 border-4 border-orange-300 rounded-lg focus:border-orange-500 focus:ring-4 focus:ring-orange-200 text-orange-900 placeholder-orange-500 transition-all duration-300 font-mono',
          label: 'block text-sm font-bold text-orange-800 mb-2 uppercase tracking-wider',
          button: {
            primary: 'bg-gradient-to-r from-orange-400 to-red-400 hover:from-orange-500 hover:to-red-500 text-white px-8 py-3 rounded-lg font-bold shadow-lg hover:shadow-xl border-4 border-orange-600 transition-all duration-300 uppercase tracking-wide',
            secondary: 'bg-yellow-200 hover:bg-yellow-300 text-orange-800 px-8 py-3 rounded-lg font-bold border-4 border-orange-300 hover:border-orange-400 transition-all duration-300 uppercase tracking-wide'
          }
        };
      
      default:
        return getDesignStyles(); // fallback to modern
    }
  };

  const styles = getDesignStyles();

  // Render form field with design-specific styling
  const renderField = (field: FormFieldBase) => {
    const fieldError = errors[field.name];
    const fieldClassName = `${styles.input} ${fieldError ? 'border-red-500 ring-red-100' : ''}`;

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
            inputClassName={styles.input}
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
            className={`${fieldClassName} min-h-[120px] resize-none`}
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
          <div className={`space-y-3 ${field.options?.layout === 'horizontal' ? 'flex space-x-6 space-y-0' : ''}`}>
            {field.options?.items?.map((option: { value: string; label: string; disabled?: boolean }) => (
              <label key={option.value} className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="radio"
                  name={field.name}
                  value={option.value}
                  checked={formData[field.name] === option.value}
                  onChange={(e) => handleInputChange(field.name, e.target.value)}
                  className={`w-4 h-4 ${designType === 'futuristic' ? 'text-cyan-400 focus:ring-cyan-400' : designType === 'elegant' ? 'text-amber-500 focus:ring-amber-400' : 'text-blue-500 focus:ring-blue-400'}`}
                  required={field.isRequired}
                  disabled={option.disabled}
                />
                <span className={`text-sm ${designType === 'futuristic' ? 'text-slate-300' : 'text-gray-700'}`}>{option.label}</span>
              </label>
            ))}
          </div>
        );

      case FormFieldType.CHECKBOX:
        return (
          <label className="flex items-center space-x-3 cursor-pointer">
            <input
              type="checkbox"
              name={field.name}
              checked={formData[field.name] as boolean || false}
              onChange={(e) => handleInputChange(field.name, e.target.checked)}
              className={`w-4 h-4 rounded ${designType === 'futuristic' ? 'text-cyan-400 focus:ring-cyan-400' : designType === 'elegant' ? 'text-amber-500 focus:ring-amber-400' : 'text-blue-500 focus:ring-blue-400'}`}
              required={field.isRequired}
            />
            <span className={`text-sm ${designType === 'futuristic' ? 'text-slate-300' : 'text-gray-700'}`}>{field.label}</span>
          </label>
        );

      case FormFieldType.MULTISELECT:
        return (
          <select
            id={field.name}
            name={field.name}
            multiple
            value={Array.isArray(formData[field.name]) ? formData[field.name] as string[] : (formData[field.name] as string || '').split(',')}
            onChange={(e) => {
              const selectedValues = Array.from(e.target.selectedOptions, option => option.value);
              handleInputChange(field.name, selectedValues);
            }}
            className={`${fieldClassName} min-h-[120px]`}
            required={field.isRequired}
          >
            {field.options?.items?.map((option: { value: string; label: string; disabled?: boolean }) => (
              <option key={option.value} value={option.value} disabled={option.disabled}>
                {option.label}
              </option>
            ))}
          </select>
        );

      case FormFieldType.TOGGLE:
        return (
          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={() => handleInputChange(field.name, !(formData[field.name] as boolean))}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                formData[field.name] 
                  ? designType === 'futuristic' ? 'bg-cyan-400' : designType === 'elegant' ? 'bg-amber-500' : 'bg-blue-500'
                  : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  formData[field.name] ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
            <label className={`text-sm font-medium ${designType === 'futuristic' ? 'text-slate-300' : 'text-gray-700'}`}>
              {field.label}
              {field.isRequired && <span className="text-red-500 ml-1">*</span>}
            </label>
          </div>
        );

      case FormFieldType.SLIDER:
        const minValue = (field.options?.min as number) || 0;
        const maxValue = (field.options?.max as number) || 100;
        const defaultNum = field.defaultValue ? parseInt(field.defaultValue) : minValue;
        const currentValue = (formData[field.name] as number) || defaultNum;
        
        return (
          <div className="space-y-2">
            <input
              type="range"
              id={field.name}
              name={field.name}
              value={currentValue}
              onChange={(e) => handleInputChange(field.name, parseInt(e.target.value))}
              className={`w-full h-2 rounded-lg appearance-none cursor-pointer ${
                designType === 'futuristic' ? 'bg-slate-700' : 'bg-gray-200'
              }`}
              min={minValue}
              max={maxValue}
              step={field.options?.step as number || 1}
              required={field.isRequired}
            />
            <div className={`flex justify-between text-sm ${designType === 'futuristic' ? 'text-slate-400' : 'text-gray-500'}`}>
              <span>{minValue}</span>
              <span className="font-medium">{currentValue}</span>
              <span>{maxValue}</span>
            </div>
          </div>
        );

      case FormFieldType.RATING:
        const maxRating = field.options?.maxRating as number || 5;
        const currentRating = formData[field.name] as number || 0;
        return (
          <div className="flex space-x-1">
            {Array.from({ length: maxRating }, (_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleInputChange(field.name, i + 1)}
                className={`w-8 h-8 ${
                  i < currentRating ? 'text-yellow-400' : designType === 'futuristic' ? 'text-slate-600' : 'text-gray-300'
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
            className={fieldClassName}
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
            value={formData[field.name] as string || field.defaultValue || ''}
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
        } ${designType === 'futuristic' ? 'text-white' : 'text-gray-900'}`;
        
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
          <p className={`leading-relaxed ${designType === 'futuristic' ? 'text-slate-300' : 'text-gray-700'}`}>
            {field.label}
          </p>
        );

      case FormFieldType.DIVIDER:
        return (
          <hr className={`${
            designType === 'futuristic' ? 'border-slate-600' : 'border-gray-300'
          } ${field.options?.style === 'dashed' ? 'border-dashed' : 'border-solid'}`} />
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
          <div className={`border rounded p-4 text-center ${
            designType === 'futuristic' ? 'bg-slate-800 border-slate-600' : 'bg-gray-100 border-gray-300'
          }`}>
            <p className={`text-sm mb-2 ${designType === 'futuristic' ? 'text-slate-400' : 'text-gray-600'}`}>
              CAPTCHA Verification
            </p>
            <div className={`border rounded p-2 inline-block ${
              designType === 'futuristic' ? 'bg-slate-900 border-slate-500' : 'bg-white border-gray-300'
            }`}>
              <span className="font-mono text-lg">{Math.random().toString(36).substring(2, 8).toUpperCase()}</span>
            </div>
            <input
              type="text"
              placeholder="Enter CAPTCHA"
              className={`${fieldClassName} mt-2`}
              onChange={(e) => handleInputChange(field.name, e.target.value)}
              required={field.isRequired}
            />
          </div>
        );

      case FormFieldType.SIGNATURE:
        return (
          <div className={`border rounded p-4 ${
            designType === 'futuristic' ? 'border-slate-600' : 'border-gray-300'
          }`}>
            <p className={`text-sm mb-2 ${designType === 'futuristic' ? 'text-slate-400' : 'text-gray-600'}`}>
              Digital Signature
            </p>
            <div className={`border border-dashed rounded h-32 flex items-center justify-center ${
              designType === 'futuristic' ? 'bg-slate-800 border-slate-500 text-slate-500' : 'bg-gray-50 border-gray-300 text-gray-400'
            }`}>
              <span>Signature pad would go here</span>
            </div>
            <input
              type="hidden"
              name={field.name}
              value={formData[field.name] as string || ''}
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
              value={formData[field.name] as string || ''}
              onChange={(e) => handleInputChange(field.name, e.target.value)}
              className={fieldClassName}
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
              className={fieldClassName}
              onChange={(e) => {
                const currentAddress = (formData[field.name] as Record<string, string>) || {};
                handleInputChange(field.name, { ...currentAddress, street: e.target.value });
              }}
              required={field.isRequired}
            />
            <div className="grid grid-cols-2 gap-3">
              <input
                type="text"
                placeholder="City"
                className={fieldClassName}
                onChange={(e) => {
                  const currentAddress = (formData[field.name] as Record<string, string>) || {};
                  handleInputChange(field.name, { ...currentAddress, city: e.target.value });
                }}
              />
              <input
                type="text"
                placeholder="State/Province"
                className={fieldClassName}
                onChange={(e) => {
                  const currentAddress = (formData[field.name] as Record<string, string>) || {};
                  handleInputChange(field.name, { ...currentAddress, state: e.target.value });
                }}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <input
                type="text"
                placeholder="ZIP/Postal Code"
                className={fieldClassName}
                onChange={(e) => {
                  const currentAddress = (formData[field.name] as Record<string, string>) || {};
                  handleInputChange(field.name, { ...currentAddress, zip: e.target.value });
                }}
              />
              <input
                type="text"
                placeholder="Country"
                className={fieldClassName}
                onChange={(e) => {
                  const currentAddress = (formData[field.name] as Record<string, string>) || {};
                  handleInputChange(field.name, { ...currentAddress, country: e.target.value });
                }}
              />
            </div>
          </div>
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
      <div className="text-center p-8 bg-gray-50 rounded-2xl border border-gray-200">
        <p className="text-gray-600">This form is not configured for multi-step or has no steps.</p>
      </div>
    );
  }

  // Design-specific icons
  const getDesignIcon = () => {
    switch (designType) {
      case 'modern':
        return <Circle className="w-4 h-4" />;
      case 'elegant':
        return <Sparkles className="w-4 h-4" />;
      case 'futuristic':
        return <Zap className="w-4 h-4" />;
      default:
        return <Circle className="w-4 h-4" />;
    }
  };

  return (
    <div className={`w-full p-4 lg:p-8 ${styles.container} relative`}>
      {/* Design-specific background effects */}
      {designType === 'futuristic' && (
        <div className="absolute inset-0 overflow-hidden rounded-3xl pointer-events-none z-0">
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-blue-500/5" />
          {Array.from({ length: 8 }).map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-cyan-400/20 rounded-full"
              style={{
                left: `${10 + Math.random() * 80}%`,
                top: `${10 + Math.random() * 80}%`,
              }}
              animate={{
                opacity: [0.2, 0.6, 0.2],
                scale: [1, 1.2, 1],
              }}
              transition={{
                duration: 3 + Math.random() * 2,
                repeat: Infinity,
                delay: Math.random() * 2,
                ease: "easeInOut"
              }}
            />
          ))}
        </div>
      )}
      
      {/* Neon design effects */}
      {designType === 'neon' && (
        <div className="absolute inset-0 overflow-hidden rounded-3xl">
          {/* Neon grid background */}
          <div className="absolute inset-0 opacity-20">
            <svg width="100%" height="100%" className="absolute inset-0">
              <pattern id="neonGrid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="cyan" strokeWidth="0.5" />
              </pattern>
              <rect width="100%" height="100%" fill="url(#neonGrid)" />
            </svg>
          </div>
          
          {/* Floating neon particles */}
          {Array.from({ length: 15 }).map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 rounded-full"
              style={{
                background: i % 2 === 0 ? '#00ffff' : '#ff00ff',
                boxShadow: `0 0 10px ${i % 2 === 0 ? '#00ffff' : '#ff00ff'}`,
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              animate={{
                opacity: [0.2, 0.8, 0.2],
                scale: [0.5, 1.2, 0.5],
                y: [0, -20, 0],
              }}
              transition={{
                duration: 3 + Math.random() * 2,
                repeat: Infinity,
                delay: Math.random() * 3,
              }}
            />
          ))}
          
          {/* Neon border glow */}
          <div className="absolute inset-0 rounded-3xl border border-cyan-400/50 shadow-[0_0_20px_rgba(0,255,255,0.3)]"></div>
        </div>
      )}
      
      {/* Glassmorphism effects */}
      {designType === 'glassmorphism' && (
        <div className="absolute inset-0 overflow-hidden rounded-3xl">
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl" />
          {Array.from({ length: 8 }).map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-32 h-32 rounded-full bg-white/5 backdrop-blur-sm"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.1, 0.3, 0.1],
              }}
              transition={{
                duration: 4 + Math.random() * 2,
                repeat: Infinity,
                delay: Math.random() * 2,
              }}
            />
          ))}
        </div>
      )}
      
      {/* Retro effects */}
      {designType === 'retro' && (
        <div className="absolute inset-0 overflow-hidden rounded-2xl">
          <div className="absolute inset-0 bg-gradient-to-br from-orange-50/50 to-yellow-50/50" />
          {Array.from({ length: 12 }).map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-4 h-4 bg-orange-300/30 transform rotate-45"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              animate={{
                rotate: [45, 225, 45],
                scale: [0.8, 1.2, 0.8],
              }}
              transition={{
                duration: 4 + Math.random() * 2,
                repeat: Infinity,
                delay: Math.random() * 2,
              }}
            />
          ))}
        </div>
      )}

      {/* Progress Section - Compact for mobile, detailed for desktop */}
      <div className="mb-6 lg:mb-10 relative z-10">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-2">
          <span className={`text-sm font-semibold ${designType === 'futuristic' ? 'text-cyan-300' : designType === 'elegant' ? 'text-amber-600' : 'text-blue-600'}`}>
            Step {currentStep + 1} of {totalSteps}
          </span>
          <span className={`text-sm ${designType === 'futuristic' ? 'text-slate-400' : 'text-gray-500'}`}>
            {Math.round(progressPercentage)}% Complete
          </span>
        </div>
        
        {/* Custom Progress Bar */}
        <div className={`w-full h-2 lg:h-3 ${styles.progressBg} rounded-full overflow-hidden`}>
          <motion.div
            className={`h-full ${styles.progressBar} rounded-full`}
            initial={{ width: 0 }}
            animate={{ width: `${progressPercentage}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        </div>
      </div>

      {/* Step Indicators - Hidden on mobile to save space */}
      <div className="hidden md:flex justify-center mb-8 lg:mb-12 relative z-10">
        <div className="flex items-center space-x-2 lg:space-x-4">
          {visibleSteps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <motion.div
                className={`w-8 h-8 lg:w-12 lg:h-12 rounded-full flex items-center justify-center text-xs lg:text-sm font-bold transition-all duration-300 ${
                  index < currentStep || completedSteps.has(index)
                    ? styles.stepIndicator.completed
                    : index === currentStep
                    ? styles.stepIndicator.active
                    : styles.stepIndicator.inactive
                }`}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                {index < currentStep || completedSteps.has(index) ? (
                  <Check className="w-3 h-3 lg:w-5 lg:h-5" />
                ) : (
                  <span>{index + 1}</span>
                )}
              </motion.div>
              {index < totalSteps - 1 && (
                <div
                  className={`w-8 lg:w-16 h-1 mx-2 lg:mx-4 rounded-full transition-all duration-500 ${
                    index < currentStep || completedSteps.has(index)
                      ? styles.progressBar
                      : styles.progressBg
                  }`}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Form Content */}
      <div className="space-y-6 lg:space-y-8 relative z-10">
        <form onSubmit={handleSubmit} className="space-y-6 lg:space-y-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
              initial={{ opacity: 0, x: 50, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: -50, scale: 0.95 }}
              transition={{ duration: 0.4, ease: "easeInOut" }}
              className="space-y-6 lg:space-y-8"
          >
            {/* Step Title and Description */}
              {currentStepData && showStepTitle && (
                <div className="text-center mb-6 lg:mb-10">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="mb-4"
                  >
                    {getDesignIcon()}
                  </motion.div>
                  <h3 className={`text-xl lg:text-2xl font-bold mb-4 ${designType === 'futuristic' ? 'text-white' : designType === 'elegant' ? 'text-gray-800' : 'text-gray-900'}`}>
                  {currentStepData.title}
                </h3>
                {currentStepData.description && (
                    <p className={`text-base lg:text-lg ${designType === 'futuristic' ? 'text-slate-300' : 'text-gray-600'} max-w-xl mx-auto`}>
                      {currentStepData.description}
                    </p>
                )}
              </div>
            )}

              {/* Step Fields - Flexible direction layout */}
              <div className="flex flex-col lg:flex-row lg:flex-wrap gap-4 lg:gap-6">
                {currentStepData?.fields?.map((field, index) => (
                  <motion.div
                    key={field.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 * index }}
                    className={`space-y-3 ${
                      field.type === FormFieldType.TEXTAREA 
                        ? 'w-full' 
                        : 'w-full lg:w-[calc(50%-12px)]'
                    }`}
                  >
                {field.type !== FormFieldType.CHECKBOX && (
                      <label htmlFor={field.name} className={styles.label}>
                    {field.label}
                    {field.isRequired && <span className="text-red-500 ml-1">*</span>}
                  </label>
                )}
                
                {renderField(field)}
                
                {errors[field.name] && (
                      <motion.p
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-red-500 text-sm font-medium"
                      >
                        {errors[field.name]}
                      </motion.p>
                )}
                
                {field.helpText && (
                      <p className={`text-sm ${designType === 'futuristic' ? 'text-slate-400' : 'text-gray-500'}`}>
                        {field.helpText}
                      </p>
                )}
                  </motion.div>
                ))}
              </div>
          </motion.div>
        </AnimatePresence>

          {/* Hidden submit button for final step */}
          {currentStep === totalSteps - 1 && (
            <button
              type="submit"
              style={{ display: 'none' }}
              id="hidden-submit-button"
            />
          )}
        </form>

        {/* Navigation Buttons - Outside form to prevent validation conflicts */}
        <div className="flex flex-col sm:flex-row justify-between items-center pt-6 lg:pt-8 relative z-10 gap-4 sm:gap-0">
          <motion.button
            type="button"
            onClick={handlePrevious}
            disabled={currentStep === 0}
            className={`${styles.button.secondary} flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto justify-center sm:justify-start`}
            whileHover={{ scale: currentStep === 0 ? 1 : 1.05 }}
            whileTap={{ scale: currentStep === 0 ? 1 : 0.95 }}
          >
            <div className="flex items-center space-x-2 w-full sm:w-auto justify-center sm:justify-start">
              <ChevronLeft className="w-5 h-5" />
            <span>Previous</span>
            </div>
          </motion.button>

          {currentStep === totalSteps - 1 ? (
            <motion.button
              type="button"
              onClick={() => {
                // Trigger the hidden submit button
                const hiddenSubmit = document.getElementById('hidden-submit-button') as HTMLButtonElement;
                if (hiddenSubmit) {
                  hiddenSubmit.click();
                }
              }}
              disabled={submitStatus === 'submitting'}
              className={`${styles.button.primary} flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto`}
              whileHover={{ scale: submitStatus === 'submitting' ? 1 : 1.05 }}
              whileTap={{ scale: submitStatus === 'submitting' ? 1 : 0.95 }}
            >
              {submitStatus === 'submitting' ? (
                <div className="flex items-center space-x-2">
                  <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  <span>Submitting...</span>
                </div>
              ) : (
                form.submitButtonText || 'Submit'
              )}
            </motion.button>
          ) : (
            <motion.button
              type="button"
              onClick={handleNext}
              className={`${styles.button.primary} flex items-center justify-center space-x-2 w-full sm:w-auto`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <span>Next</span>
              <ChevronRight className="w-5 h-5" />
            </motion.button>
          )}
        </div>
      </div>

      {/* Submit Status Messages */}
      <AnimatePresence>
      {submitStatus === 'success' && (
        <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className={`mt-8 p-6 rounded-2xl border-2 ${
              designType === 'futuristic' 
                ? 'bg-green-400/10 border-green-400/30 text-green-300' 
                : 'bg-green-50 border-green-200 text-green-800'
            }`}
          >
            <div className="flex items-center justify-center space-x-3">
              <Check className="w-6 h-6" />
              <p className="font-semibold text-center">
            {form.successMessage || 'Form submitted successfully!'}
          </p>
            </div>
        </motion.div>
      )}

      {submitStatus === 'error' && (
        <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className={`mt-8 p-6 rounded-2xl border-2 ${
              designType === 'futuristic' 
                ? 'bg-red-400/10 border-red-400/30 text-red-300' 
                : 'bg-red-50 border-red-200 text-red-800'
            }`}
          >
            <p className="font-semibold text-center">
            There was an error submitting the form. Please try again.
          </p>
        </motion.div>
      )}
      </AnimatePresence>
    </div>
  );
} 