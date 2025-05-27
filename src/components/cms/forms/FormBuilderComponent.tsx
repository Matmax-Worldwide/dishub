'use client';

import { useState, useEffect } from 'react';
import { FormComponent } from './FormComponent';
import { FormSettings } from './FormComponentSettings';
import { FormDesignType } from './MultiStepFormRenderer';

interface FormBuilderComponentProps {
  data?: {
    formId?: string;
    settings?: FormSettings;
    designType?: FormDesignType;
  };
  isEditing?: boolean;
  onSettingsChange?: (settings: FormSettings & { designType?: FormDesignType }) => void;
}

export function FormBuilderComponent({
  data = {},
  isEditing = false,
  onSettingsChange
}: FormBuilderComponentProps) {
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  
  // Extract form ID, settings, and design type from data
  const formId = data.formId || '';
  const settings = data.settings || {
    formId: formId || null,
    showTitle: true,
    showDescription: true
  };
  const designType = data.designType || 'modern';
  
  // Reset submission status when form changes
  useEffect(() => {
    setFormSubmitted(false);
    setFormError(null);
  }, [formId]);
  
  // Apply settings when they change
  useEffect(() => {
    if (onSettingsChange) {
      onSettingsChange({ ...settings, designType });
    }
  }, [settings, designType, onSettingsChange]);
  
  const handleFormSubmitSuccess = () => {
    setFormSubmitted(true);
    setFormError(null);
    
    // If redirect URL is set in settings, redirect after a short delay
    if (settings.redirectAfterSubmit) {
      setTimeout(() => {
        window.location.href = settings.redirectAfterSubmit as string;
      }, 1500);
    }
  };
  
  const handleFormSubmitError = (error: string) => {
    setFormError(error);
    setFormSubmitted(false);
  };

  const handleDesignChange = (newDesignType: FormDesignType) => {
    if (onSettingsChange) {
      onSettingsChange({ ...settings, designType: newDesignType });
    }
  };
  
  // If in editing mode and no form is selected, show placeholder
  if (isEditing && !formId) {
    return (
      <div className="border-2 border-dashed border-gray-300 rounded-md p-8 bg-gray-50">
        <div className="text-center">
          <p className="text-gray-500 mb-4">
            Please select a form in the settings panel.
          </p>
          
          {/* Design Type Selector */}
          <div className="mt-6">
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-gray-700">Form Design Style</h4>
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-2">
                {[
                  { value: 'modern', label: 'Modern', description: 'Blue gradients', color: 'from-blue-500 to-purple-600' },
                  { value: 'elegant', label: 'Elegant', description: 'Warm amber', color: 'from-amber-400 to-orange-500' },
                  { value: 'futuristic', label: 'Futuristic', description: 'Cyan neon', color: 'from-cyan-400 to-blue-500' },
                  { value: 'minimal', label: 'Minimal', description: 'Clean B&W', color: 'from-gray-700 to-gray-900' },
                  { value: 'corporate', label: 'Corporate', description: 'Professional', color: 'from-blue-600 to-indigo-600' }
                ].map((design) => (
                  <button
                    key={design.value}
                    type="button"
                    onClick={() => handleDesignChange(design.value as FormDesignType)}
                    className={`p-2 rounded-md border text-left transition-all ${
                      designType === design.value
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className={`w-full h-6 rounded mb-1 bg-gradient-to-r ${design.color}`}></div>
                    <div className="font-medium text-xs">{design.label}</div>
                    <div className="text-xs text-gray-500 leading-tight">{design.description}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  // Construct custom class names based on settings
  const formClassName = settings.customClassName || '';
  
  return (
    <div className="form-builder-component">
      {/* Design Type Selector for editing mode */}
      {isEditing && formId && (
        <div className="mb-4 p-4 bg-gray-50 rounded-lg border">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Multi-Step Form Design</h4>
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-2">
            {[
              { value: 'modern', label: 'Modern', description: 'Blue gradients', color: 'from-blue-500 to-purple-600' },
              { value: 'elegant', label: 'Elegant', description: 'Warm amber', color: 'from-amber-400 to-orange-500' },
              { value: 'futuristic', label: 'Futuristic', description: 'Cyan neon', color: 'from-cyan-400 to-blue-500' },
              { value: 'minimal', label: 'Minimal', description: 'Clean B&W', color: 'from-gray-700 to-gray-900' },
              { value: 'corporate', label: 'Corporate', description: 'Professional', color: 'from-blue-600 to-indigo-600' }
            ].map((design) => (
              <button
                key={design.value}
                type="button"
                onClick={() => handleDesignChange(design.value as FormDesignType)}
                className={`p-2 rounded-md border text-left transition-all ${
                  designType === design.value
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className={`w-full h-6 rounded mb-1 bg-gradient-to-r ${design.color}`}></div>
                <div className="font-medium text-xs">{design.label}</div>
                <div className="text-xs text-gray-500 leading-tight">{design.description}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {formError && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md text-red-600">
          {formError}
        </div>
      )}
      
      {formSubmitted && settings.successMessage && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-md text-green-600">
          {settings.successMessage}
        </div>
      )}
      
      {!formId ? (
        // Show placeholder if no form selected
        <div className="p-4 bg-gray-50 border border-gray-200 rounded-md text-center text-gray-500">
          No form selected.
        </div>
      ) : (
        // Render the actual form
        <FormComponent
          formId={formId}
          className={formClassName}
          onSubmitSuccess={handleFormSubmitSuccess}
          onSubmitError={handleFormSubmitError}
        />
      )}
    </div>
  );
} 