import React, { useState, useEffect, useCallback, useRef } from 'react';
import { cn } from '@/lib/utils';
import StableInput from './StableInput';
import IconSelector from '../IconSelector';
import StyleControls from '../StyleControls';
import { CmsTabs } from '../CmsTabs';
import { FileText, Palette } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { 
  ComponentStyling, 
  ComponentStyleProps, 
  DEFAULT_STYLING,
  generateStylesFromStyling,
  generateClassesFromStyling
} from '@/types/cms-styling';

interface FeatureSectionProps extends ComponentStyleProps {
  title: string;
  description: string;
  icon: string;
  styling?: ComponentStyling;
  isEditing?: boolean;
  onUpdate?: (data: { 
    title: string; 
    description: string; 
    icon: string;
    styling?: ComponentStyling;
  }) => void;
}

const FeatureSection = React.memo(function FeatureSection({ 
  title, 
  description, 
  icon = 'Star',
  styling = DEFAULT_STYLING,
  isEditing = false,
  onUpdate
}: FeatureSectionProps) {
  // Local state to maintain during typing
  const [localTitle, setLocalTitle] = useState(title);
  const [localDescription, setLocalDescription] = useState(description);
  const [localIcon, setLocalIcon] = useState(icon);
  const [localStyling, setLocalStyling] = useState<ComponentStyling>(styling);
  
  // Track if we're actively editing to prevent props from overriding local state
  const isEditingRef = useRef(false);
  
  // Optimize debounce updates
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Update local state when props change but only if not currently editing
  useEffect(() => {
    if (!isEditingRef.current) {
      if (title !== localTitle) setLocalTitle(title);
      if (description !== localDescription) setLocalDescription(description);
      if (icon !== localIcon) setLocalIcon(icon);
      if (styling && JSON.stringify(styling) !== JSON.stringify(localStyling)) {
        setLocalStyling(styling);
      }
    }
  }, [title, description, icon, styling, localTitle, localDescription, localIcon, localStyling]);
  
  // Get the icon component from the icon name
  const IconComponent = (LucideIcons[localIcon as keyof typeof LucideIcons] as React.ElementType) || LucideIcons.Star;
  
  // Optimize update handler with useCallback and debouncing
  const handleUpdateField = useCallback((field: string, value: string | ComponentStyling) => {
    if (onUpdate) {
      // Mark that we're in editing mode
      isEditingRef.current = true;
      
      // Clear any pending debounce
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      
      // Prepare data to update
      const updateData = {
        title: localTitle,
        description: localDescription,
        icon: localIcon,
        styling: localStyling,
        [field]: value
      };
      
      // Set timeout to update parent
      debounceRef.current = setTimeout(() => {
        onUpdate(updateData);
        
        // Reset editing flag after a short delay
        setTimeout(() => {
          isEditingRef.current = false;
        }, 500);
      }, 200);
    }
  }, [onUpdate, localTitle, localDescription, localIcon, localStyling]);
  
  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);
  
  // Individual change handlers to maintain state locally
  const handleTitleChange = useCallback((newValue: string) => {
    setLocalTitle(newValue);
    handleUpdateField('title', newValue);
  }, [handleUpdateField]);
  
  const handleDescriptionChange = useCallback((newValue: string) => {
    setLocalDescription(newValue);
    handleUpdateField('description', newValue);
  }, [handleUpdateField]);
  
  const handleIconChange = useCallback((newValue: string) => {
    setLocalIcon(newValue);
    handleUpdateField('icon', newValue);
  }, [handleUpdateField]);

  const handleStylingChange = useCallback((newStyling: ComponentStyling) => {
    setLocalStyling(newStyling);
    handleUpdateField('styling', newStyling);
  }, [handleUpdateField]);

  // Generate styles and classes from styling
  const inlineStyles = generateStylesFromStyling(localStyling);
  const cssClasses = generateClassesFromStyling(localStyling);
  
  if (isEditing) {
    return (
      <div className="w-full">
        <CmsTabs
          tabs={[
            {
              id: 'content',
              label: 'Content',
              icon: <FileText className="w-4 h-4" />,
              content: (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2 text-foreground">
                      Icon
                    </label>
                    <IconSelector 
                      selectedIcon={localIcon}
                      onSelectIcon={handleIconChange}
                    />
                  </div>
                  
                  <StableInput
                    value={localTitle}
                    onChange={handleTitleChange}
                    placeholder="Enter feature title..."
                    className="font-medium text-foreground"
                    label="Title"
                    debounceTime={300}
                  />
                  
                  <StableInput
                    value={localDescription}
                    onChange={handleDescriptionChange}
                    placeholder="Enter feature description..."
                    isTextArea={true}
                    rows={3}
                    className="text-muted-foreground text-sm"
                    label="Description"
                    debounceTime={300}
                  />
                  
                  {/* Preview */}
                  <div className="mt-6 bg-card p-4 rounded-md">
                    <div className="text-xs font-medium text-muted-foreground mb-2">Preview:</div>
                    <div className="flex flex-col items-center text-center">
                      <div className="p-3 bg-muted rounded-full text-primary mb-4">
                        <IconComponent className="h-10 w-10" />
                      </div>
                      <h3 className="text-lg font-medium text-foreground mb-2">{localTitle}</h3>
                      <p className="text-muted-foreground max-w-md text-sm">{localDescription}</p>
                    </div>
                  </div>
                </div>
              )
            },
            {
              id: 'styling',
              label: 'Styling',
              icon: <Palette className="w-4 h-4" />,
              content: (
                <StyleControls
                  styling={localStyling}
                  onStylingChange={handleStylingChange}
                  showAdvanced={true}
                />
              )
            }
          ]}
        />
      </div>
    );
  }

  return (
    <div 
      className={cn(
        "max-w-4xl mx-auto",
        cssClasses
      )}
      style={inlineStyles}
    >
      <div className="flex flex-col items-center text-center">
        <div className="p-3 bg-muted rounded-full text-primary mb-4">
          <IconComponent className="h-10 w-10" />
        </div>
        <h3 className="text-xl font-medium text-foreground mb-2">{localTitle}</h3>
        <p className="text-muted-foreground max-w-md">{localDescription}</p>
      </div>
    </div>
  );
});

export default FeatureSection; 