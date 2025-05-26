'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
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

interface ImageSectionProps extends ComponentStyleProps {
  src: string;
  alt: string;
  caption?: string;
  styling?: ComponentStyling;
  isEditing?: boolean;
  onUpdate?: (data: { 
    src: string; 
    alt: string; 
    caption?: string;
    styling?: ComponentStyling;
  }) => void;
}

export default function ImageSection({ 
  src, 
  alt, 
  caption,
  styling = DEFAULT_STYLING,
  isEditing = false,
  onUpdate
}: ImageSectionProps) {
  // Local state to maintain during typing
  const [localSrc, setLocalSrc] = useState(src || '');
  const [localAlt, setLocalAlt] = useState(alt || '');
  const [localCaption, setLocalCaption] = useState(caption || '');
  const [localStyling, setLocalStyling] = useState<ComponentStyling>(styling);
  
  // Track if we're actively editing to prevent props from overriding local state
  const isEditingRef = useRef(false);
  
  // Optimize debounce updates
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  
  // Update local state when props change but only if not currently editing
  useEffect(() => {
    if (!isEditingRef.current) {
      if ((src || '') !== localSrc) setLocalSrc(src || '');
      if ((alt || '') !== localAlt) setLocalAlt(alt || '');
      if ((caption || '') !== localCaption) setLocalCaption(caption || '');
      if (styling && JSON.stringify(styling) !== JSON.stringify(localStyling)) {
        setLocalStyling(styling);
      }
    }
  }, [src, alt, caption, styling, localSrc, localAlt, localCaption, localStyling]);
  
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
        src: localSrc,
        alt: localAlt,
        caption: localCaption,
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
  }, [onUpdate, localSrc, localAlt, localCaption, localStyling]);
  
  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);
  
  // Individual change handlers
  const handleSrcChange = useCallback((newValue: string) => {
    setLocalSrc(newValue);
    handleUpdateField('src', newValue);
  }, [handleUpdateField]);
  
  const handleAltChange = useCallback((newValue: string) => {
    setLocalAlt(newValue);
    handleUpdateField('alt', newValue);
  }, [handleUpdateField]);
  
  const handleCaptionChange = useCallback((newValue: string) => {
    setLocalCaption(newValue);
    handleUpdateField('caption', newValue);
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
                    value={localSrc}
                    onChange={handleSrcChange}
                    placeholder="Enter image URL..."
                    className="text-base"
                    label="Image URL"
                    debounceTime={300}
                    data-field-id="src"
                    data-component-type="Image"
                  />
                  
                  <StableInput
                    value={localAlt}
                    onChange={handleAltChange}
                    placeholder="Enter alt text..."
                    className="text-base"
                    label="Alt Text"
                    debounceTime={300}
                    data-field-id="alt"
                    data-component-type="Image"
                  />
                  
                  <StableInput
                    value={localCaption}
                    onChange={handleCaptionChange}
                    placeholder="Enter caption (optional)..."
                    className="text-base"
                    label="Caption (optional)"
                    debounceTime={300}
                    data-field-id="caption"
                    data-component-type="Image"
                  />
                  
                  {/* Preview */}
                  <div className="mt-4 bg-background border border-input rounded-md p-3">
                    <div className="text-sm font-medium text-muted-foreground mb-2">Preview</div>
                    {localSrc ? (
                      <div className="relative w-full h-[220px] rounded-md overflow-hidden">
                        <Image 
                          src={localSrc} 
                          alt={localAlt || 'Image preview'} 
                          fill 
                          className="object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-full h-[220px] bg-muted flex items-center justify-center rounded-md">
                        <p className="text-muted-foreground">Image preview</p>
                      </div>
                    )}
                    {localCaption && (
                      <div className="text-center text-sm text-muted-foreground mt-2">
                        {localCaption}
                      </div>
                    )}
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
        "w-full max-w-4xl mx-auto",
        cssClasses
      )}
      style={inlineStyles}
    >
      <figure className="relative">
        {localSrc ? (
          <div className="relative w-full h-[400px] rounded-md overflow-hidden" data-field-type="src" data-component-type="Image">
            <Image 
              src={localSrc} 
              alt={localAlt || 'Image'} 
              fill 
              className="object-cover"
            />
          </div>
        ) : (
          <div className="w-full h-[400px] bg-muted flex items-center justify-center rounded-md" data-field-type="src" data-component-type="Image">
            <p className="text-muted-foreground">Image placeholder</p>
          </div>
        )}
        {localCaption && (
          <figcaption className="text-center text-sm text-muted-foreground mt-2" data-field-type="caption" data-component-type="Image">
            {localCaption}
          </figcaption>
        )}
      </figure>
    </div>
  );
} 