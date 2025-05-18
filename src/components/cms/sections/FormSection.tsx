'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { FormSelector } from '@/components/cms/forms/FormSelector';
import { FormBase } from '@/types/forms';
import { FormPreview } from './FormPreview';
import { FormStyleConfig, FormStyles } from './FormStyleConfig';
import { FormConfig, FormCustomConfig } from './FormConfig';
import StableInput from './StableInput';
import { FileText, LayoutPanelTop, FormInput } from 'lucide-react';
import graphqlClient from '@/lib/graphql-client';
import FormRenderer from '@/components/cms/forms/FormRenderer';

interface FormSectionProps {
  title?: string;
  description?: string;
  formId?: string;
  styles?: FormStyles;
  customConfig?: FormCustomConfig;
  isEditing?: boolean;
  onUpdate?: (data: {
    title?: string;
    description?: string;
    formId?: string;
    styles?: FormStyles;
    customConfig?: FormCustomConfig;
  }) => void;
}

export default function FormSection({
  title: initialTitle = '',
  description: initialDescription = '',
  formId: initialFormId = '',
  styles: initialStyles = {},
  customConfig: initialCustomConfig = {},
  isEditing = false,
  onUpdate
}: FormSectionProps) {
  // Local state
  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState(initialDescription);
  const [formId, setFormId] = useState(initialFormId);
  const [selectedForm, setSelectedForm] = useState<FormBase | null>(null);
  const [styles, setStyles] = useState<FormStyles>(initialStyles);
  const [customConfig, setCustomConfig] = useState<FormCustomConfig>(initialCustomConfig);
  const [loading, setLoading] = useState(false);
  
  // Track if we're actively editing to prevent props from overriding local state
  const isEditingRef = React.useRef(false);
  
  // Debounce updates
  const debounceRef = React.useRef<NodeJS.Timeout | null>(null);
  
  // Load form data when formId changes or on initial load
  useEffect(() => {
    async function loadFormData() {
      if (formId) {
        setLoading(true);
        try {
          const form = await graphqlClient.getFormById(formId);
          setSelectedForm(form);
        } catch (error) {
          console.error('Error loading form data:', error);
          setSelectedForm(null);
        } finally {
          setLoading(false);
        }
      } else {
        setSelectedForm(null);
      }
    }
    
    loadFormData();
  }, [formId]);
  
  // Update local state when props change, but only if not currently editing
  useEffect(() => {
    if (!isEditingRef.current) {
      if (initialTitle !== title) setTitle(initialTitle);
      if (initialDescription !== description) setDescription(initialDescription);
      if (initialFormId !== formId) setFormId(initialFormId);
      if (JSON.stringify(initialStyles) !== JSON.stringify(styles)) setStyles(initialStyles);
      if (JSON.stringify(initialCustomConfig) !== JSON.stringify(customConfig)) setCustomConfig(initialCustomConfig);
    }
  }, [initialTitle, initialDescription, initialFormId, initialStyles, initialCustomConfig, 
      title, description, formId, styles, customConfig]);
  
  // Update parent with changes
  const handleUpdateField = useCallback((field: string, value: string | FormStyles | FormCustomConfig) => {
    if (onUpdate) {
      // Mark that we're in editing mode
      isEditingRef.current = true;
      
      // Clear any pending debounce
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      
      // Prepare data to update
      const updateData = {
        title,
        description,
        formId,
        styles,
        customConfig
      };
      
      // Update the specific field
      switch (field) {
        case 'title':
          updateData.title = value as string;
          break;
        case 'description':
          updateData.description = value as string;
          break;
        case 'formId':
          updateData.formId = value as string;
          break;
        case 'styles':
          updateData.styles = value as FormStyles;
          break;
        case 'customConfig':
          updateData.customConfig = value as FormCustomConfig;
          break;
      }
      
      // Set up a debounced update
      debounceRef.current = setTimeout(() => {
        onUpdate(updateData);
        // Reset the editing ref after a short delay
        setTimeout(() => {
          isEditingRef.current = false;
        }, 300);
      }, 500);
    }
  }, [title, description, formId, styles, customConfig, onUpdate]);
  
  // Handle form selection
  const handleFormSelect = useCallback((form: FormBase | null) => {
    setSelectedForm(form);
    setFormId(form?.id || '');
    handleUpdateField('formId', form?.id || '');
  }, [handleUpdateField]);
  
  // Handle style changes
  const handleStyleChange = useCallback((newStyles: FormStyles) => {
    setStyles(newStyles);
    handleUpdateField('styles', newStyles);
  }, [handleUpdateField]);
  
  // Handle custom config changes
  const handleCustomConfigChange = useCallback((newConfig: FormCustomConfig) => {
    setCustomConfig(newConfig);
    handleUpdateField('customConfig', newConfig);
  }, [handleUpdateField]);
  
  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);
  
  // Individual change handlers
  const handleTitleChange = useCallback((newValue: string) => {
    setTitle(newValue);
    handleUpdateField('title', newValue);
  }, [handleUpdateField]);
  
  const handleDescriptionChange = useCallback((newValue: string) => {
    setDescription(newValue);
    handleUpdateField('description', newValue);
  }, [handleUpdateField]);
  
  // Generate class names for form container based on styles
  const getContainerClassNames = () => {
    const classes = ['rounded-md'];
    
    // Padding
    if (styles.padding === 'small') classes.push('p-3');
    else if (styles.padding === 'medium') classes.push('p-5');
    else if (styles.padding === 'large') classes.push('p-8');
    
    // Alignment
    if (styles.alignment === 'center') classes.push('text-center mx-auto');
    else if (styles.alignment === 'right') classes.push('ml-auto text-right');
    
    // Container styles
    if (styles.containerStyles) {
      // Border radius
      if (styles.containerStyles.borderRadius === 'sm') classes.push('rounded-sm');
      else if (styles.containerStyles.borderRadius === 'md') classes.push('rounded-md');
      else if (styles.containerStyles.borderRadius === 'lg') classes.push('rounded-lg');
      else if (styles.containerStyles.borderRadius === 'full') classes.push('rounded-full');
      
      // Shadow
      if (styles.containerStyles.shadow === 'sm') classes.push('shadow-sm');
      else if (styles.containerStyles.shadow === 'md') classes.push('shadow');
      else if (styles.containerStyles.shadow === 'lg') classes.push('shadow-lg');
      
      // Border
      if (styles.containerStyles.borderColor) classes.push('border');
    }
    
    return classes.join(' ');
  };
  
  // Generate inline styles for form container
  const getContainerStyles = () => {
    const inlineStyles: React.CSSProperties = {};
    
    if (styles.containerStyles) {
      if (styles.containerStyles.backgroundColor) {
        inlineStyles.backgroundColor = styles.containerStyles.backgroundColor;
      }
      
      if (styles.containerStyles.borderColor) {
        inlineStyles.borderColor = styles.containerStyles.borderColor;
      }
      
      if (styles.containerStyles.borderWidth) {
        inlineStyles.borderWidth = styles.containerStyles.borderWidth;
      }
    }
    
    return inlineStyles;
  };
  
  // Generate class and styles for button
  const getButtonClassNames = () => {
    const classes = ['px-4 py-2 rounded'];
    
    if (styles.buttonStyles) {
      // Border radius
      if (styles.buttonStyles.borderRadius === 'sm') classes.push('rounded-sm');
      else if (styles.buttonStyles.borderRadius === 'md') classes.push('rounded-md');
      else if (styles.buttonStyles.borderRadius === 'lg') classes.push('rounded-lg');
      else if (styles.buttonStyles.borderRadius === 'full') classes.push('rounded-full');
    }
    
    return classes.join(' ');
  };
  
  const getButtonStyles = () => {
    const inlineStyles: React.CSSProperties = {};
    
    if (styles.buttonStyles) {
      if (styles.buttonStyles.backgroundColor) {
        inlineStyles.backgroundColor = styles.buttonStyles.backgroundColor;
      }
      
      if (styles.buttonStyles.textColor) {
        inlineStyles.color = styles.buttonStyles.textColor;
      }
    }
    
    return inlineStyles;
  };
  
  return (
    <div className="space-y-4">
      {isEditing ? (
        // Editor mode UI
        <div className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-start space-x-2">
              <FormInput className="h-5 w-5 mt-1 text-muted-foreground" />
              <div className="flex-1">
                <StableInput
                  value={title}
                  onChange={handleTitleChange}
                  placeholder="Form Section Title..."
                  className="font-medium text-xl"
                  label="Section Title"
                  debounceTime={300}
                />
                
                <StableInput
                  value={description}
                  onChange={handleDescriptionChange}
                  placeholder="Section description..."
                  className="text-muted-foreground mt-2"
                  label="Section Description"
                  debounceTime={300}
                />
              </div>
            </div>
            
            <div className="border-t pt-4">
              <h3 className="text-sm font-medium mb-3 flex items-center">
                <FileText className="h-4 w-4 mr-2 text-muted-foreground" />
                Form Selection
              </h3>
              <FormSelector
                onSelect={handleFormSelect}
                selectedFormId={formId}
                required={true}
                className="mb-4"
              />
              
              {loading ? (
                <div className="mt-4 p-4 bg-muted/20 rounded-md flex items-center justify-center">
                  <span className="animate-pulse">Loading form preview...</span>
                </div>
              ) : selectedForm && (
                <div className="mt-4">
                  <div className="text-sm font-medium mb-2">Selected Form Preview</div>
                  <FormPreview form={selectedForm} compact />
                </div>
              )}
            </div>
            
            <div className="border-t pt-4 space-y-4">
              <h3 className="text-sm font-medium mb-2 flex items-center">
                <LayoutPanelTop className="h-4 w-4 mr-2 text-muted-foreground" />
                Form Display Options
              </h3>
              
              <div className="space-y-4">
                <FormStyleConfig 
                  initialStyles={styles}
                  onChange={handleStyleChange}
                />
                
                <FormConfig
                  form={selectedForm}
                  initialConfig={customConfig}
                  onCustomConfigChange={handleCustomConfigChange}
                />
              </div>
            </div>
            
            {/* Preview section */}
            {selectedForm && (
              <div className="border-t pt-4">
                <h3 className="text-sm font-medium mb-3">Form Preview</h3>
                <div 
                  className={getContainerClassNames()}
                  style={getContainerStyles()}
                >
                  {!customConfig.hideTitle && (
                    <h3 className="text-lg font-medium mb-2">
                      {selectedForm.title}
                    </h3>
                  )}
                  
                  {!customConfig.hideDescription && selectedForm.description && (
                    <p className="text-muted-foreground mb-4">
                      {selectedForm.description}
                    </p>
                  )}
                  
                  {/* Form fields representation */}
                  <div className="space-y-4 mb-6">
                    {[...Array(Math.min(selectedForm.fields?.length || 3, 3))].map((_, i) => (
                      <div key={i} className="h-10 bg-muted/30 rounded-md animate-pulse" />
                    ))}
                  </div>
                  
                  {/* Submit button */}
                  <button
                    type="button"
                    className={getButtonClassNames()}
                    style={getButtonStyles()}
                  >
                    {customConfig.customSubmitText || selectedForm.submitButtonText || "Submit"}
                  </button>
                  
                  {/* Reset button if enabled */}
                  {customConfig.showResetButton && (
                    <button
                      type="button"
                      className="px-4 py-2 bg-gray-200 text-gray-800 rounded ml-2"
                    >
                      {customConfig.resetButtonText || "Reset"}
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        // Visitor-facing UI with actual form here
        <div
          className={getContainerClassNames()}
          style={getContainerStyles()}
        >
          {title && !customConfig.hideTitle && (
            <h3 className="text-xl font-medium mb-2">{title}</h3>
          )}
          
          {description && !customConfig.hideDescription && (
            <p className="text-muted-foreground mb-4">{description}</p>
          )}
          
          {/* Form placeholder - in a real implementation, you would fetch and render the form here */}
          {loading ? (
            <div className="p-6 bg-muted/20 rounded-md border border-dashed border-muted text-center">
              <div className="animate-pulse">Loading form...</div>
            </div>
          ) : selectedForm ? (
            <div className="form-placeholder">
              {!customConfig.hideTitle && (
                <h4 className="text-lg font-medium mb-2">{selectedForm.title}</h4>
              )}
              
              {!customConfig.hideDescription && selectedForm.description && (
                <p className="text-sm text-muted-foreground mb-4">{selectedForm.description}</p>
              )}
              
              {/* Actual form fields rendering instead of placeholder */}
              <div className="space-y-4 mb-6">
                {/* Import and use the FormRenderer component */}
                <FormRenderer
                  form={selectedForm}
                  buttonClassName={getButtonClassNames()}
                  buttonStyles={getButtonStyles()}
                />
              </div>
            </div>
          ) : (
            <div className="p-6 bg-muted/20 rounded-md border border-dashed border-muted text-center">
              <FileText className="w-10 h-10 mx-auto text-muted-foreground/50 mb-2" />
              <p className="text-muted-foreground">No form selected for this section</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
} 