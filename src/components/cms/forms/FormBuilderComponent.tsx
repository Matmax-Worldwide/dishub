'use client';

import { useState, useEffect } from 'react';
import { FormComponent } from './FormComponent';
import { FormSettings } from './FormComponentSettings';

interface FormBuilderComponentProps {
  data?: {
    formId?: string;
    settings?: FormSettings;
  };
  isEditing?: boolean;
  onSettingsChange?: (settings: FormSettings) => void;
}

export function FormBuilderComponent({
  data = {},
  isEditing = false,
  onSettingsChange
}: FormBuilderComponentProps) {
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  
  // Extract form ID and settings from data
  const formId = data.formId || '';
  const settings = data.settings || {
    formId: formId || null,
    showTitle: true,
    showDescription: true
  };
  
  // Reset submission status when form changes
  useEffect(() => {
    setFormSubmitted(false);
    setFormError(null);
  }, [formId]);
  
  // Apply settings when they change
  useEffect(() => {
    if (onSettingsChange) {
      onSettingsChange(settings);
    }
  }, [settings, onSettingsChange]);
  
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
  
  // If in editing mode and no form is selected, show placeholder
  if (isEditing && !formId) {
    return (
      <div className="border-2 border-dashed border-gray-300 rounded-md p-8 bg-gray-50 text-center">
        <p className="text-gray-500">
          Please select a form in the settings panel.
        </p>
      </div>
    );
  }
  
  // Construct custom class names based on settings
  const formClassName = settings.customClassName || '';
  
  return (
    <div className="form-builder-component">
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