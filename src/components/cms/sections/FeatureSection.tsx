import React, { useState, useEffect, useCallback, useRef } from 'react';
import { cn } from '@/lib/utils';
import StableInput from './StableInput';
import IconSelector from '../IconSelector';
import * as LucideIcons from 'lucide-react';

interface FeatureSectionProps {
  title: string;
  description: string;
  icon: string;
  isEditing?: boolean;
  onUpdate?: (data: Partial<FeatureSectionProps>) => void;
}

const FeatureSection = React.memo(function FeatureSection({ 
  title, 
  description, 
  icon = 'Star',
  isEditing = false,
  onUpdate
}: FeatureSectionProps) {
  // Local state to maintain during typing
  const [localTitle, setLocalTitle] = useState(title);
  const [localDescription, setLocalDescription] = useState(description);
  const [localIcon, setLocalIcon] = useState(icon);
  
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
    }
  }, [title, description, icon, localTitle, localDescription, localIcon]);
  
  // Get the icon component from the icon name
  const IconComponent = (LucideIcons[localIcon as keyof typeof LucideIcons] as React.ElementType) || LucideIcons.Star;
  
  // Optimize update handler with useCallback and debouncing
  const handleUpdateField = useCallback((field: string, value: string) => {
    if (onUpdate) {
      // Mark that we're in editing mode
      isEditingRef.current = true;
      
      // Clear any pending debounce
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      
      // Set timeout to update parent
      debounceRef.current = setTimeout(() => {
        onUpdate({ [field]: value });
        
        // Reset editing flag after a short delay
        setTimeout(() => {
          isEditingRef.current = false;
        }, 500);
      }, 200);
    }
  }, [onUpdate]);
  
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
  
  return (
    <div className={cn(
      "max-w-4xl mx-auto",
      isEditing ? "" : ""
    )}>
      {isEditing ? (
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
      ) : (
        <div className="flex flex-col items-center text-center">
          <div className="p-3 bg-muted rounded-full text-primary mb-4">
            <IconComponent className="h-10 w-10" />
          </div>
          <h3 className="text-xl font-medium text-foreground mb-2">{localTitle}</h3>
          <p className="text-muted-foreground max-w-md">{localDescription}</p>
        </div>
      )}
    </div>
  );
});

export default FeatureSection; 