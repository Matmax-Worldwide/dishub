'use client';

import { useState, useEffect } from 'react';
import { FormSelector } from './FormSelector';
import { FormBase } from '@/types/forms';

interface FormComponentSettingsProps {
  formId?: string;
  onFormSelect: (formId: string | null) => void;
  onSettingsChange?: (settings: FormSettings) => void;
  settings?: FormSettings;
}

export interface FormSettings {
  formId: string | null;
  showTitle: boolean;
  showDescription: boolean;
  customClassName?: string;
  customSubmitButtonText?: string;
  customSubmitButtonClass?: string;
  customFieldClass?: string;
  customLabelClass?: string;
  redirectAfterSubmit?: string;
  successMessage?: string;
}

const defaultSettings: FormSettings = {
  formId: null,
  showTitle: true,
  showDescription: true,
  customClassName: '',
  customSubmitButtonText: '',
  customSubmitButtonClass: '',
  customFieldClass: '',
  customLabelClass: '',
  redirectAfterSubmit: '',
  successMessage: '',
};

export function FormComponentSettings({ 
  formId, 
  onFormSelect, 
  onSettingsChange,
  settings = defaultSettings 
}: FormComponentSettingsProps) {
  const [currentSettings, setCurrentSettings] = useState<FormSettings>({
    ...defaultSettings,
    ...settings,
    formId: formId || settings.formId
  });

  // Update settings when props change
  useEffect(() => {
    setCurrentSettings(prev => ({
      ...prev,
      ...settings,
      formId: formId || settings.formId
    }));
  }, [formId, settings]);

  const handleFormSelect = (form: FormBase | null) => {
    const newFormId = form?.id || null;
    setCurrentSettings(prev => ({
      ...prev,
      formId: newFormId
    }));
    onFormSelect(newFormId);
    
    if (onSettingsChange) {
      onSettingsChange({
        ...currentSettings,
        formId: newFormId
      });
    }
  };

  const handleSettingChange = (key: keyof FormSettings, value: string | boolean) => {
    setCurrentSettings(prev => ({
      ...prev,
      [key]: value
    }));
    
    if (onSettingsChange) {
      onSettingsChange({
        ...currentSettings,
        [key]: value
      });
    }
  };

  return (
    <div className="form-component-settings space-y-4 p-4 bg-white rounded-md border border-gray-200">
      <h3 className="text-lg font-medium text-gray-900">Form Settings</h3>
      
      <div className="mb-4">
        <FormSelector
          selectedFormId={currentSettings.formId || undefined}
          onSelect={handleFormSelect}
          label="Select Form"
          required
        />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={currentSettings.showTitle}
              onChange={e => handleSettingChange('showTitle', e.target.checked)}
              className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
            />
            <span className="text-sm">Show form title</span>
          </label>
        </div>
        
        <div>
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={currentSettings.showDescription}
              onChange={e => handleSettingChange('showDescription', e.target.checked)}
              className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
            />
            <span className="text-sm">Show form description</span>
          </label>
        </div>
      </div>
      
      <div className="space-y-4 mt-4">
        <h4 className="text-sm font-medium text-gray-700">Custom Styling</h4>
        
        <div>
          <label className="block text-xs text-gray-500 mb-1">Custom Form Class</label>
          <input
            type="text"
            value={currentSettings.customClassName || ''}
            onChange={e => handleSettingChange('customClassName', e.target.value)}
            placeholder="E.g., my-custom-form max-w-lg mx-auto"
            className="w-full p-2 text-sm border border-gray-300 rounded-md"
          />
        </div>
        
        <div>
          <label className="block text-xs text-gray-500 mb-1">Custom Submit Button Text</label>
          <input
            type="text"
            value={currentSettings.customSubmitButtonText || ''}
            onChange={e => handleSettingChange('customSubmitButtonText', e.target.value)}
            placeholder="E.g., Send Message"
            className="w-full p-2 text-sm border border-gray-300 rounded-md"
          />
        </div>
        
        <div>
          <label className="block text-xs text-gray-500 mb-1">Custom Submit Button Class</label>
          <input
            type="text"
            value={currentSettings.customSubmitButtonClass || ''}
            onChange={e => handleSettingChange('customSubmitButtonClass', e.target.value)}
            placeholder="E.g., bg-green-600 hover:bg-green-700"
            className="w-full p-2 text-sm border border-gray-300 rounded-md"
          />
        </div>
      </div>
      
      <div className="space-y-4 mt-4">
        <h4 className="text-sm font-medium text-gray-700">Submission Settings</h4>
        
        <div>
          <label className="block text-xs text-gray-500 mb-1">Success Message</label>
          <textarea
            value={currentSettings.successMessage || ''}
            onChange={e => handleSettingChange('successMessage', e.target.value)}
            placeholder="E.g., Thank you! Your message has been sent successfully."
            className="w-full p-2 text-sm border border-gray-300 rounded-md"
            rows={2}
          />
        </div>
        
        <div>
          <label className="block text-xs text-gray-500 mb-1">Redirect URL After Submit</label>
          <input
            type="text"
            value={currentSettings.redirectAfterSubmit || ''}
            onChange={e => handleSettingChange('redirectAfterSubmit', e.target.value)}
            placeholder="E.g., /thank-you"
            className="w-full p-2 text-sm border border-gray-300 rounded-md"
          />
        </div>
      </div>
    </div>
  );
} 