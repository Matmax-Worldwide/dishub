'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import StableInput from './StableInput';
import StyleControls from '../StyleControls';
import { CmsTabs } from '../CmsTabs';
import { FileText, Palette } from 'lucide-react';
import { 
  ComponentStyling, 
  ComponentStyleProps, 
  DEFAULT_STYLING,
  generateStylesFromStyling,
  generateClassesFromStyling
} from '@/types/cms-styling';

interface TextSectionProps extends ComponentStyleProps {
  title?: string;
  content: string;
  isEditing?: boolean;
  onUpdate?: (data: { 
    title?: string; 
    content: string;
    styling?: ComponentStyling;
  }) => void;
}

export default function TextSection({ 
  title, 
  content, 
  styling = DEFAULT_STYLING,
  isEditing = false, 
  onUpdate 
}: TextSectionProps) {
  // Local state to maintain during typing
  const [localTitle, setLocalTitle] = useState(title || '');
  const [localContent, setLocalContent] = useState(content || '');
  const [localStyling, setLocalStyling] = useState<ComponentStyling>(styling);
  
  // Track if we're actively editing to prevent props from overriding local state
  const isEditingRef = useRef(false);
  
  // Optimize debounce updates
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  
  // Update local state when props change but only if not currently editing
  useEffect(() => {
    if (!isEditingRef.current) {
      if (title !== localTitle) setLocalTitle(title || '');
      if (content !== localContent) setLocalContent(content || '');
      if (styling && JSON.stringify(styling) !== JSON.stringify(localStyling)) {
        setLocalStyling(styling);
      }
    }
  }, [title, content, styling, localTitle, localContent, localStyling]);
  
  // Optimize update handler with debouncing
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
        content: localContent,
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
  }, [onUpdate, localTitle, localContent, localStyling]);
  
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
    setLocalTitle(newValue);
    handleUpdateField('title', newValue);
  }, [handleUpdateField]);
  
  const handleContentChange = useCallback((newValue: string) => {
    setLocalContent(newValue);
    handleUpdateField('content', newValue);
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
                  <StableInput
                    value={localTitle}
                    onChange={handleTitleChange}
                    placeholder="Enter section title..."
                    className="font-medium text-lg"
                    label="Section Title (optional)"
                    debounceTime={300}
                    data-field-id="title"
                    data-component-type="Text"
                  />
                  
                  <StableInput
                    value={localContent}
                    onChange={handleContentChange}
                    placeholder="Enter content..."
                    isTextArea={true}
                    rows={8}
                    className="text-base"
                    label="Content"
                    debounceTime={300}
                    data-field-id="content"
                    data-component-type="Text"
                  />
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
        "w-full max-w-4xl mx-auto",
        cssClasses
      )}
      style={inlineStyles}
    >
      {localTitle && (
        <h3 className="text-xl font-medium mb-4" data-field-type="title" data-component-type="Text">
          {localTitle}
        </h3>
      )}
      <div className="text-base leading-relaxed whitespace-pre-wrap" data-field-type="content" data-component-type="Text">
        {(localContent || '').split('\n').map((paragraph, index) => (
          <p key={index} className="mb-4">
            {paragraph}
          </p>
        ))}
      </div>
    </div>
  );
} 