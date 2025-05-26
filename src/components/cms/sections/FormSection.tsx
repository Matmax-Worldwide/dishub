'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { FormSelector } from '@/components/cms/forms/FormSelector';
import { FormBase } from '@/types/forms';
import { FormPreview } from './FormPreview';
import { FormStyleConfig, FormStyles } from './FormStyleConfig';
import { FormConfig, FormCustomConfig } from './FormConfig';
import { FileText, LayoutPanelTop, FormInput } from 'lucide-react';
import graphqlClient from '@/lib/graphql-client';
import FormRenderer from '@/components/cms/forms/FormRenderer';
import MultiStepFormRenderer from '@/components/cms/forms/MultiStepFormRenderer';
import { motion } from 'framer-motion';
import { PaperAirplaneIcon } from '@heroicons/react/24/outline';
import IconSelector from '@/components/cms/IconSelector';
import BackgroundSelector, { BACKGROUND_TEMPLATES } from '@/components/cms/BackgroundSelector';
import MediaSelector from '@/components/cms/MediaSelector';
import { MediaItem } from '@/components/cms/media/types';
import * as LucideIcons from 'lucide-react';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { toast } from 'sonner';

interface FormSectionProps {
  title?: string;
  description?: string;
  formId?: string;
  formSlug?: string;
  styles?: FormStyles;
  customConfig?: FormCustomConfig;
  isEditing?: boolean;
  template?: 'DEFAULT' | string;
  selectedIcon?: string;
  backgroundImage?: string;
  backgroundType?: 'image' | 'gradient';
  onUpdate?: (data: {
    title?: string;
    description?: string;
    formId?: string;
    styles?: FormStyles;
    customConfig?: FormCustomConfig;
    selectedIcon?: string;
    backgroundImage?: string;
    backgroundType?: 'image' | 'gradient';
  }) => void;
  className?: string;
}

export default function FormSection({
  title: initialTitle = '',
  description: initialDescription = '',
  formId: initialFormId = '',
  formSlug,
  styles: initialStyles = {},
  customConfig: initialCustomConfig = {},
  isEditing = false,
  template = 'DEFAULT',
  selectedIcon: initialSelectedIcon = 'PaperAirplaneIcon',
  backgroundImage: initialBackgroundImage = '',
  backgroundType: initialBackgroundType = 'gradient',
  onUpdate,
  className = '',
}: FormSectionProps) {
  // Local state
  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState(initialDescription);
  const [formId, setFormId] = useState(initialFormId);
  const [selectedForm, setSelectedForm] = useState<FormBase | null>(null);
  const [styles, setStyles] = useState<FormStyles>(initialStyles);
  const [customConfig, setCustomConfig] = useState<FormCustomConfig>(initialCustomConfig);
  const [selectedIcon, setSelectedIcon] = useState(initialSelectedIcon);
  const [backgroundImage, setBackgroundImage] = useState(initialBackgroundImage);
  const [backgroundType, setBackgroundType] = useState<'image' | 'gradient'>(initialBackgroundType);
  const [showBackgroundSelector, setShowBackgroundSelector] = useState(false);
  const [showMediaSelectorForBackground, setShowMediaSelectorForBackground] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  
  // Track if we're actively editing to prevent props from overriding local state
  const isEditingRef = React.useRef(false);
  
  // Debounce updates
  const debounceRef = React.useRef<NodeJS.Timeout | null>(null);
  
  // Load form data when formId changes or on initial load
  useEffect(() => {
    async function loadFormData() {
      if (formId || formSlug) {
        setLoading(true);
        try {
          let formData: FormBase | null = null;

          if (formId) {
            formData = await graphqlClient.getFormById(formId);
          } else if (formSlug) {
            formData = await graphqlClient.getFormBySlug(formSlug);
          }

          if (formData) {
            setSelectedForm(formData);
            
            // Auto-detect multi-step forms and update UI accordingly
            if (formData.isMultiStep) {
              console.log('Multi-step form detected:', formData.title);
              // Update custom config to show multi-step indicators
              setCustomConfig(prev => ({
                ...prev,
                showProgressIndicator: true,
                enableStepValidation: true,
                allowStepNavigation: true,
              }));
            }
          } else {
            console.error('Form not found');
            setSelectedForm(null);
          }
        } catch (error) {
          console.error('Error loading form:', error);
          setSelectedForm(null);
        } finally {
          setLoading(false);
        }
      } else {
        setSelectedForm(null);
        setLoading(false);
      }
    }
    
    loadFormData();
  }, [formId, formSlug]);
  
  // Update local state when props change, but only if not currently editing
  useEffect(() => {
    if (!isEditingRef.current) {
      if (initialTitle !== title) setTitle(initialTitle);
      if (initialDescription !== description) setDescription(initialDescription);
      if (initialFormId !== formId) setFormId(initialFormId);
      if (JSON.stringify(initialStyles) !== JSON.stringify(styles)) setStyles(initialStyles);
      if (JSON.stringify(initialCustomConfig) !== JSON.stringify(customConfig)) setCustomConfig(initialCustomConfig);
      if (initialBackgroundImage !== backgroundImage) setBackgroundImage(initialBackgroundImage);
      if (initialBackgroundType !== backgroundType) setBackgroundType(initialBackgroundType);
    }
  }, [initialTitle, initialDescription, initialFormId, initialStyles, initialCustomConfig, 
      initialBackgroundImage, initialBackgroundType, title, description, formId, styles, customConfig,
      backgroundImage, backgroundType]);
  
  // Update parent with changes
  const handleUpdateField = useCallback((field: string, value: string | FormStyles | FormCustomConfig, event?: React.SyntheticEvent) => {
    // Solo para los campos que no son title y description, hacemos stopPropagation
    if (event && field !== 'title' && field !== 'description') {
      event.stopPropagation();
    }
    
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
        customConfig,
        selectedIcon
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
        case 'selectedIcon':
          updateData.selectedIcon = value as string;
          // Also update the customConfig to persist the icon
          updateData.customConfig = {
            ...customConfig,
            selectedIcon: value as string
          };
          break;
      }
      
      try {
        // Set up a debounced update
        debounceRef.current = setTimeout(() => {
          onUpdate(updateData);
          // Don't reset the editing ref right away to prevent props from overriding local state
          // Allow changes to persist during the editing session
        }, 500);
      } catch (error) {
        console.error("Error updating field:", error);
      }
    }
  }, [title, description, formId, styles, customConfig, selectedIcon, onUpdate]);
  
  // Handle form selection
  const handleFormSelect = useCallback((form: FormBase | null, event?: React.SyntheticEvent) => {
    setSelectedForm(form);
    setFormId(form?.id || '');
    handleUpdateField('formId', form?.id || '', event);
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
  
  // Handle icon selection
  const handleIconSelect = useCallback((iconName: string) => {
    setSelectedIcon(iconName);
    handleUpdateField('selectedIcon', iconName);
  }, [handleUpdateField]);
  
  // Handle background selection with immediate local update and debounced parent update
  const handleBackgroundSelect = useCallback((background: string, type: 'image' | 'gradient') => {
    console.log('Background selected:', { background, type });
    
    // Immediately update local state for responsive UI
    setBackgroundImage(background);
    setBackgroundType(type);
    setShowBackgroundSelector(false); // Close the selector immediately
    
    // Update parent component data with both fields
    if (onUpdate) {
      // Mark that we're in editing mode
      isEditingRef.current = true;
      
      // Clear any pending debounce
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      
      // Set up a debounced update with both background properties
      debounceRef.current = setTimeout(() => {
        console.log('Updating parent with background data:', { backgroundImage: background, backgroundType: type });
        
        onUpdate({
          title,
          description,
          formId,
          styles,
          customConfig,
          selectedIcon,
          backgroundImage: background,
          backgroundType: type
        });
        
        // Reset editing flag after update
        setTimeout(() => {
          isEditingRef.current = false;
        }, 500);
      }, 300); // Shorter debounce for background changes
    }
  }, [onUpdate, title, description, formId, styles, customConfig, selectedIcon]);

  // Handler for background media selection
  const handleBackgroundMediaSelect = (mediaItem: MediaItem) => {
    setBackgroundImage(mediaItem.fileUrl);
    setBackgroundType('image');
    setShowMediaSelectorForBackground(false);
    setShowBackgroundSelector(false);
    
    // Update parent with the new background
    if (onUpdate) {
      onUpdate({
        title,
        description,
        formId,
        styles,
        customConfig,
        selectedIcon,
        backgroundImage: mediaItem.fileUrl,
        backgroundType: 'image'
      });
    }
  };
  
  // Get the icon component based on the selected icon name
  const getIconComponent = () => {
    // First check if there's a saved icon in customConfig
    const savedIcon = customConfig.selectedIcon || selectedIcon;
    
    if (savedIcon === 'PaperAirplaneIcon') {
      return <PaperAirplaneIcon className="h-14 w-14 text-white" />;
    }
    const IconComponent = LucideIcons[savedIcon as keyof typeof LucideIcons] as React.ElementType;
    return IconComponent ? <IconComponent className="h-14 w-14 text-white" /> : <PaperAirplaneIcon className="h-14 w-14 text-white" />;
  };
  
  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);
  
  // Add this function to handle form submission
  const handleFormSubmit = async (formData: Record<string, unknown>) => {
    if (!selectedForm) {
      toast.error('No form selected');
      return;
    }

    try {
      setSubmitStatus('submitting');
      
      // Enhanced metadata for better tracking
      const metadata = {
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString(),
        url: window.location.href,
        formType: selectedForm.isMultiStep ? 'multi-step' : 'single-step',
        stepCount: selectedForm.isMultiStep ? selectedForm.steps?.length || 0 : 1,
        locale: document.documentElement.lang || 'en',
      };

      const result = await graphqlClient.submitForm({
        formId: selectedForm.id,
        data: formData,
        metadata,
      });

      if (result.success) {
        setSubmitStatus('success');
        
        // Enhanced success feedback based on form type
        const successMessage = selectedForm.isMultiStep 
          ? selectedForm.successMessage || 'Multi-step form completed successfully!'
          : selectedForm.successMessage || 'Form submitted successfully!';
          
        toast.success(successMessage);
        
        // Handle redirect if specified
        if (selectedForm.redirectUrl) {
          setTimeout(() => {
            window.location.href = selectedForm.redirectUrl!;
          }, 2000);
        }
        
        // Reset form status after successful submission
        setTimeout(() => {
          setSubmitStatus('idle');
        }, 3000);
      } else {
        setSubmitStatus('error');
        const errorMessage = result.message || 
          (selectedForm.isMultiStep ? 'Failed to complete multi-step form' : 'Failed to submit form');
        toast.error(errorMessage);
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      setSubmitStatus('error');
      const errorMessage = selectedForm.isMultiStep 
        ? 'An error occurred while processing your multi-step form'
        : 'An error occurred while submitting the form';
      toast.error(errorMessage);
    }
  };
  
  // Generate class names for form container based on styles and template
  const getContainerClassNames = () => {
    if (template === 'DEFAULT') {
      return 'relative overflow-hidden h-screen';
    }

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
    if (template === 'DEFAULT') {
      if (backgroundType === 'image' && backgroundImage) {
        return {
          backgroundImage: `url(${backgroundImage})`,
          backgroundPosition: 'center',
          backgroundSize: 'cover',
          backgroundRepeat: 'no-repeat',
          opacity: 0.95
        };
      } else {
        return {
          background: backgroundImage || 'linear-gradient(to bottom right, #01112A, #01319c, #1E0B4D)',
          opacity: 0.95
        };
      }
    }

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
  
  // Generate class names for button
  const getButtonClassNames = () => {
    if (template === 'DEFAULT') {
      return 'w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white py-3 px-6 rounded-md font-bold text-lg shadow-lg shadow-blue-500/30 transition-all duration-300';
    }

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
    if (template === 'DEFAULT') {
      return {};
    }

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
  
  // Generate class names for input fields
  const getInputClassNames = () => {
    if (template === 'DEFAULT') {
      return 'w-full px-4 py-3 border-white/20 bg-white/10 text-white rounded-md focus:ring-2 focus:ring-blue-400 focus:border-transparent placeholder-white/50 transition-all duration-300';
    }
    return '';
  };

  // Generate class names for labels
  const getLabelClassNames = () => {
    if (template === 'DEFAULT') {
      return 'block text-sm font-medium text-white mb-1';
    }
    return '';
  };

  // Generate class names for form wrapper
  const getFormWrapperClassNames = () => {
    if (template === 'DEFAULT') {
      return 'bg-white/10 backdrop-blur-md p-8 rounded-xl border border-white/20 shadow-2xl shadow-blue-500/10';
    }
    return '';
  };
  
  // Memoized Form Preview Component to prevent unnecessary re-renders
  const MemoizedFormPreview = React.memo(({ form }: { form: FormBase | null }) => {
    return form ? <FormPreview form={form} compact /> : null;
  });
  
  // Add display name for React DevTools and linter
  MemoizedFormPreview.displayName = 'MemoizedFormPreview';

  // Details Tab Component
  const DetailsTab = () => {
    // Estado local para los inputs
    const [localTitle, setLocalTitle] = useState(title);
    const [localDescription, setLocalDescription] = useState(description);
    
    // Manejador de submit para los inputs
    const handleInputSubmit = useCallback(() => {
      // Solo actualizar si los valores han cambiado
      if (localTitle !== title) {
        setTitle(localTitle);
        if (onUpdate) {
          onUpdate({
            title: localTitle,
            description,
            formId,
            styles,
            customConfig,
            selectedIcon
          });
        }
      }
      
      if (localDescription !== description) {
        setDescription(localDescription);
        if (onUpdate) {
          onUpdate({
            title,
            description: localDescription,
            formId,
            styles,
            customConfig,
            selectedIcon
          });
        }
      }
    }, [localTitle, localDescription, title, description, formId, styles, customConfig, selectedIcon, onUpdate]);

    // Actualizar estado local cuando cambian las props
    useEffect(() => {
      setLocalTitle(title);
      setLocalDescription(description);
    }, [title, description]);
    
    return (
      <div className="space-y-4">
        {/* Title and Description inputs */}
        <div className="flex items-start space-x-2">
          <FormInput className="h-5 w-5 mt-1 text-muted-foreground" />
          <div className="flex-1">
            {/* Wrapping StableInput in an isolation div */}
            <div className="isolate" onClick={(e) => e.stopPropagation()}>
              <label className="block text-sm font-medium mb-2 text-foreground">
                Section Title
              </label>
              <input
                type="text"
                value={localTitle}
                onChange={(e) => setLocalTitle(e.target.value)}
                onBlur={handleInputSubmit}
                placeholder="Form Section Title..."
                className="w-full px-3 py-2 bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-input placeholder:text-muted-foreground text-foreground font-medium text-xl"
              />
            </div>
            
            {/* Wrapping StableInput in an isolation div */}
            <div className="isolate mt-4" onClick={(e) => e.stopPropagation()}>
              <label className="block text-sm font-medium mb-2 text-foreground">
                Section Description
              </label>
              <textarea
                value={localDescription}
                onChange={(e) => setLocalDescription(e.target.value)}
                onBlur={handleInputSubmit}
                placeholder="Section description..."
                className="w-full px-3 py-2 bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-input placeholder:text-muted-foreground text-foreground text-muted-foreground"
                rows={3}
              />
            </div>
          </div>
        </div>
        
        {/* Icon Selector */}
        <div className="border-t pt-4">
          <h3 className="text-sm font-medium mb-3 flex items-center">
            <LayoutPanelTop className="h-4 w-4 mr-2 text-muted-foreground" />
            Section Icon
          </h3>
          <div>
            <IconSelector
              selectedIcon={selectedIcon}
              onSelectIcon={handleIconSelect}
              className="w-full"
            />
          </div>
        </div>
        
        {/* Form Selection section */}
        <div className="border-t pt-4">
          <h3 className="text-sm font-medium mb-3 flex items-center">
            <FileText className="h-4 w-4 mr-2 text-muted-foreground" />
            Form Selection
          </h3>
          <div onClick={(e) => e.stopPropagation()}>
            <FormSelector
              onSelect={handleFormSelect}
              selectedFormId={formId}
              required={true}
              className="mb-4"
            />
          </div>
          
          {/* Separated Form Preview to prevent re-renders affecting inputs */}
          <div className="mt-4">
            <div className="text-sm font-medium mb-2">Selected Form Preview</div>
            {loading ? (
              <div className="p-4 bg-muted/20 rounded-md flex items-center justify-center">
                <span className="animate-pulse">Loading form preview...</span>
              </div>
            ) : (
              <div className="form-preview-container">
                <MemoizedFormPreview form={selectedForm} />
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Styles Tab Component
  const StylesTab = () => (
    <div className="space-y-4">
      <h3 className="text-sm font-medium mb-2 flex items-center">
        <LayoutPanelTop className="h-4 w-4 mr-2 text-muted-foreground" />
        Form Display Options
      </h3>
      
      <div className="space-y-4">
        <div className="bg-gray-50 rounded-lg p-4 space-y-3">
          <h4 className="text-sm font-medium">Background</h4>
          
          <div 
            className="h-32 mb-3 rounded-md border border-gray-200 overflow-hidden relative"
            style={{
              ...(backgroundType === 'image' && backgroundImage ? {
                backgroundImage: `url(${backgroundImage})`,
                backgroundPosition: 'center',
                backgroundSize: 'cover',
                backgroundRepeat: 'no-repeat'
              } : {
                background: backgroundImage || BACKGROUND_TEMPLATES[0].value
              })
            }}
          >
            {(!backgroundImage) && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-100 text-gray-400">
                {template === 'DEFAULT' ? 'Using default template background' : 'No background selected'}
              </div>
            )}
          </div>
          
          <button
            type="button"
            onClick={() => setShowBackgroundSelector(true)}
            className="bg-white border border-gray-300 rounded-md shadow-sm px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none"
          >
            Select Background
          </button>
        </div>
        
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
  );

  // Preview Tab Component
  const PreviewTab = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Form Preview</h3>
      
      {selectedForm ? (
        <div className="space-y-4">
          {/* Form Type Indicator */}
          <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
            <div className={`w-3 h-3 rounded-full ${selectedForm.isMultiStep ? 'bg-purple-500' : 'bg-blue-500'}`}></div>
            <span className="text-sm font-medium">
              {selectedForm.isMultiStep ? 'Multi-Step Form' : 'Single-Step Form'}
            </span>
            {selectedForm.isMultiStep && selectedForm.steps && (
              <span className="text-xs text-gray-600 ml-2">
                ({selectedForm.steps.length} steps)
              </span>
            )}
          </div>

          {/* Form Details */}
          <div className="p-4 border rounded-md bg-gray-50">
            <h4 className="font-medium text-gray-900 mb-2">{selectedForm.title}</h4>
            {selectedForm.description && (
              <p className="text-sm text-gray-600 mb-3">{selectedForm.description}</p>
            )}
            
            {/* Multi-step specific info */}
            {selectedForm.isMultiStep && selectedForm.steps && (
              <div className="mt-4">
                <h5 className="text-sm font-medium text-gray-700 mb-2">Form Steps:</h5>
                <div className="space-y-2">
                  {selectedForm.steps.map((step, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm">
                      <div className="w-6 h-6 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center text-xs font-medium">
                        {index + 1}
                      </div>
                      <span className="text-gray-700">{step.title || `Step ${index + 1}`}</span>
                      <span className="text-xs text-gray-500">
                        ({step.fields?.length || 0} fields)
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Form fields preview for single-step forms */}
            {!selectedForm.isMultiStep && selectedForm.fields && (
              <div className="mt-4">
                <h5 className="text-sm font-medium text-gray-700 mb-2">Form Fields:</h5>
                <div className="space-y-1">
                  {selectedForm.fields.slice(0, 5).map((field, index) => (
                    <div key={index} className="text-sm text-gray-600">
                      • {field.label} ({field.type})
                      {field.isRequired && <span className="text-red-500 ml-1">*</span>}
                    </div>
                  ))}
                  {selectedForm.fields.length > 5 && (
                    <div className="text-xs text-gray-500">
                      ... and {selectedForm.fields.length - 5} more fields
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Form Actions Preview */}
          <div className="space-y-2">
            <h5 className="text-sm font-medium text-gray-700">Form Actions:</h5>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className={getButtonClassNames()}
                style={getButtonStyles()}
                disabled
              >
                {customConfig.customSubmitText || selectedForm.submitButtonText || "Submit"}
              </button>
              
              {/* Reset button if enabled */}
              {customConfig.showResetButton && (
                <button
                  type="button"
                  className="px-4 py-2 bg-white/10 text-white rounded ml-2 hover:bg-white/20 transition-colors"
                  disabled
                >
                  {customConfig.resetButtonText || "Reset"}
                </button>
              )}
            </div>
          </div>

          {/* Success/Error States Preview */}
          <div className="space-y-2">
            <h5 className="text-sm font-medium text-gray-700">Form States:</h5>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
              <div className="p-2 bg-green-50 border border-green-200 rounded">
                <strong>Success:</strong> {selectedForm.successMessage || 'Form submitted successfully!'}
              </div>
              <div className="p-2 bg-red-50 border border-red-200 rounded">
                <strong>Error:</strong> Failed to submit form
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-6 bg-muted/20 rounded-md border border-dashed border-muted text-center">
          <FileText className="w-10 h-10 mx-auto text-muted-foreground/50 mb-2" />
          <p className="text-muted-foreground">No form selected for preview</p>
        </div>
      )}
    </div>
  );
  
  return (
    <div data-section-id="form" className={`${getContainerClassNames()} ${className}`}>
      {showBackgroundSelector && (
        <BackgroundSelector
          isOpen={showBackgroundSelector}
          onClose={() => setShowBackgroundSelector(false)}
          onSelect={handleBackgroundSelect}
          currentBackground={backgroundImage}
          onOpenMediaSelector={() => {
            setShowBackgroundSelector(false);
            setShowMediaSelectorForBackground(true);
          }}
        />
      )}

      {showMediaSelectorForBackground && (
        <MediaSelector
          isOpen={showMediaSelectorForBackground}
          onClose={() => setShowMediaSelectorForBackground(false)}
          onSelect={handleBackgroundMediaSelect}
          title="Select Background Image"
          initialType="image"
        />
      )}

      {isEditing ? (
        // Editor mode UI with tabs
        <Tabs defaultValue="details" className="space-y-4 w-full max-w-full overflow-x-hidden">
          <TabsList className="flex flex-wrap space-x-2 w-full">
            <TabsTrigger value="details" className="flex-1 min-w-[100px]">Details</TabsTrigger>
            <TabsTrigger value="styles" className="flex-1 min-w-[100px]">Styles</TabsTrigger>
            <TabsTrigger value="preview" className="flex-1 min-w-[100px]">Preview</TabsTrigger>
          </TabsList>

          {/* DETAILS TAB */}
          <TabsContent value="details" className="space-y-4">
            <DetailsTab />
          </TabsContent>

          {/* STYLES TAB */}
          <TabsContent value="styles" className="space-y-4">
            <StylesTab />
          </TabsContent>

          {/* PREVIEW TAB */}
          <TabsContent value="preview" className="space-y-4">
            <PreviewTab />
          </TabsContent>
        </Tabs>
      ) : (
        // Visitor-facing UI with actual form here
        <div
          className={`${getContainerClassNames()}`}
          style={{
            ...getContainerStyles(),
            isolation: 'isolate' // Create new stacking context
          }}
          data-component-type="Form"
        >
          {template === 'DEFAULT' && (
            <>
              <div
                className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b z-[1] pointer-events-none"
              />
              <div className="absolute inset-0 overflow-hidden pointer-events-none z-[1]">
                {Array.from({ length: 30 }).map((_, i) => {
                  const width = 1 + ((i * 7) % 3);
                  const height = 1 + ((i * 13) % 3);
                  const left = ((i * 17) % 100);
                  const top = ((i * 23) % 100);
                  const duration = 2 + ((i * 11) % 3);
                  const delay = (i * 19) % 2;
                  
                  return (
                    <motion.div
                      key={i}
                      className="absolute rounded-full bg-white"
                      style={{
                        width: `${width}px`,
                        height: `${height}px`,
                        left: `${left}%`,
                        top: `${top}%`,
                      }}
                      animate={{ opacity: [0.1, 0.8, 0.1], scale: [1, 1.2, 1] }}
                      transition={{
                        duration: duration,
                        repeat: Infinity,
                        ease: 'easeInOut',
                        delay: delay,
                      }}
                    />
                  );
                })}
              </div>
            </>
          )}

          <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-[10] flex-1 flex flex-col justify-center">
            <div className="w-full flex flex-col items-center justify-center">
              {title && !customConfig.hideTitle && (
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.7 }}
                  className="text-center mb-8 z-[15] relative w-full"
                >
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.7 }}
                    className="mb-6 p-5 bg-white/10 backdrop-blur-sm rounded-full w-min mx-auto border border-white/30 shadow-lg shadow-blue-500/20 form-icon-container z-[20]"
                    style={{ position: 'relative' }}
                  >
                    {getIconComponent()}
                  </motion.div>

                  <h2 className="text-xl md:text-4xl lg:text-3xl font-bold text-white mb-2 drop-shadow-md relative z-[15]">
                    {title}
                  </h2>
                  {description && !customConfig.hideDescription && (
                    <p className="text-sm md:text-md text-white/80 max-w-xl mx-auto mb-8 relative z-[15]">
                      {description}
                    </p>
                  )}
                </motion.div>
              )}

              {loading ? (
                <div className="p-6 bg-muted/20 rounded-md border border-dashed border-muted text-center">
                  <div className="animate-pulse">Loading form...</div>
                </div>
              ) : selectedForm ? (
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.7, delay: 0.2 }}
                  className="w-full max-w-2xl mx-auto relative z-[15]"
                >
                  <div className={getFormWrapperClassNames()}>
                    {selectedForm.isMultiStep ? (
                      <MultiStepFormRenderer
                        form={selectedForm}
                        buttonClassName={getButtonClassNames()}
                        buttonStyles={getButtonStyles()}
                        inputClassName={getInputClassNames()}
                        labelClassName={getLabelClassNames()}
                        onSubmit={handleFormSubmit}
                        submitStatus={submitStatus}
                      />
                    ) : (
                      <FormRenderer
                        form={selectedForm}
                        buttonClassName={getButtonClassNames()}
                        buttonStyles={getButtonStyles()}
                        inputClassName={getInputClassNames()}
                        labelClassName={getLabelClassNames()}
                        onSubmit={handleFormSubmit}
                        submitStatus={submitStatus}
                      />
                    )}
                  </div>
                </motion.div>
              ) : (
                <div className="p-6 bg-muted/20 rounded-md border border-dashed border-muted text-center">
                  <FileText className="w-10 h-10 mx-auto text-muted-foreground/50 mb-2" />
                  <p className="text-muted-foreground">No form selected for this section</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 