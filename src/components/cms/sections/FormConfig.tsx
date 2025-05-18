'use client';

import React, { useState, useCallback } from 'react';
import { Settings, AlertCircle } from 'lucide-react';
import { FormBase } from '@/types/forms';
import StableInput from './StableInput';

interface FormConfigProps {
  form: FormBase | null;
  onCustomConfigChange: (config: FormCustomConfig) => void;
  initialConfig?: FormCustomConfig;
}

export interface FormCustomConfig {
  customSuccessMessage?: string;
  customRedirectUrl?: string;
  hideTitle?: boolean;
  hideDescription?: boolean;
  customSubmitText?: string;
  disableFormAfterSubmit?: boolean;
  showResetButton?: boolean;
  resetButtonText?: string;
}

export const FormConfig: React.FC<FormConfigProps> = ({
  form,
  onCustomConfigChange,
  initialConfig = {}
}) => {
  const [config, setConfig] = useState<FormCustomConfig>(initialConfig);
  const [expanded, setExpanded] = useState(false);

  const handleConfigChange = useCallback((key: keyof FormCustomConfig, value: string | boolean) => {
    const updatedConfig = {
      ...config,
      [key]: value
    };
    
    setConfig(updatedConfig);
    onCustomConfigChange(updatedConfig);
  }, [config, onCustomConfigChange]);

  if (!form) {
    return (
      <div className="border rounded-md p-3 bg-card/50 text-muted-foreground text-sm flex items-center">
        <AlertCircle className="h-4 w-4 mr-2" />
        Select a form to configure options
      </div>
    );
  }

  return (
    <div className="border rounded-md p-3 bg-card">
      <div 
        className="flex items-center justify-between cursor-pointer" 
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center">
          <Settings className="h-4 w-4 mr-2 text-muted-foreground" />
          <span className="text-sm font-medium">Form Options</span>
        </div>
        <button className="text-muted-foreground hover:text-foreground">
          {expanded ? '−' : '+'}
        </button>
      </div>
      
      {expanded && (
        <div className="mt-4 space-y-4">
          {/* Display Options */}
          <div className="space-y-3">
            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Display</div>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                id="hideTitle"
                checked={config.hideTitle || false}
                onChange={(e) => handleConfigChange('hideTitle', e.target.checked)}
                className="rounded border-gray-300 text-blue-600 mr-2"
              />
              <label htmlFor="hideTitle" className="text-sm">
                Hide form title
              </label>
            </div>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                id="hideDescription"
                checked={config.hideDescription || false}
                onChange={(e) => handleConfigChange('hideDescription', e.target.checked)}
                className="rounded border-gray-300 text-blue-600 mr-2"
              />
              <label htmlFor="hideDescription" className="text-sm">
                Hide form description
              </label>
            </div>
          </div>
          
          {/* Form Button Options */}
          <div className="space-y-3">
            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Buttons</div>
            
            <div className="space-y-2">
              <label htmlFor="customSubmitText" className="text-sm block">
                Custom Submit Button Text:
              </label>
              <StableInput
                value={config.customSubmitText || ''}
                onChange={(value) => handleConfigChange('customSubmitText', value)}
                placeholder={form.submitButtonText || "Submit"}
                className="text-sm p-2 border rounded w-full"
              />
            </div>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                id="showResetButton"
                checked={config.showResetButton || false}
                onChange={(e) => handleConfigChange('showResetButton', e.target.checked)}
                className="rounded border-gray-300 text-blue-600 mr-2"
              />
              <label htmlFor="showResetButton" className="text-sm">
                Show reset button
              </label>
            </div>
            
            {config.showResetButton && (
              <div className="space-y-2 pl-6">
                <label htmlFor="resetButtonText" className="text-sm block">
                  Reset Button Text:
                </label>
                <StableInput
                  value={config.resetButtonText || ''}
                  onChange={(value) => handleConfigChange('resetButtonText', value)}
                  placeholder="Reset"
                  className="text-sm p-2 border rounded w-full"
                />
              </div>
            )}
          </div>
          
          {/* Form Submission Options */}
          <div className="space-y-3">
            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Submission</div>
            
            <div className="space-y-2">
              <label htmlFor="customSuccessMessage" className="text-sm block">
                Custom Success Message:
              </label>
              <StableInput
                value={config.customSuccessMessage || ''}
                onChange={(value) => handleConfigChange('customSuccessMessage', value)}
                placeholder={form.successMessage || "Form submitted successfully!"}
                className="text-sm p-2 border rounded w-full"
              />
              <p className="text-xs text-muted-foreground">
                Overrides the default success message from the form.
              </p>
            </div>
            
            <div className="space-y-2">
              <label htmlFor="customRedirectUrl" className="text-sm block">
                Custom Redirect URL:
              </label>
              <StableInput
                value={config.customRedirectUrl || ''}
                onChange={(value) => handleConfigChange('customRedirectUrl', value)}
                placeholder={form.redirectUrl || ""}
                className="text-sm p-2 border rounded w-full"
              />
              <p className="text-xs text-muted-foreground">
                Redirect to this URL after successful submission.
              </p>
            </div>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                id="disableFormAfterSubmit"
                checked={config.disableFormAfterSubmit || false}
                onChange={(e) => handleConfigChange('disableFormAfterSubmit', e.target.checked)}
                className="rounded border-gray-300 text-blue-600 mr-2"
              />
              <label htmlFor="disableFormAfterSubmit" className="text-sm">
                Disable form after successful submission
              </label>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}; 