'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import StableInput from './StableInput';
import StyleControls from '../../StyleControls';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
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
      <div className="w-full bg-white/95 backdrop-blur-sm border border-gray-200/60 rounded-xl shadow-lg shadow-gray-900/5 ring-1 ring-gray-900/5">
        <Tabs defaultValue="content" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-gradient-to-r from-gray-50 to-gray-100/80 p-2 rounded-xl border border-gray-200/50 shadow-inner">
            <TabsTrigger 
              value="content" 
              className="data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:shadow-gray-900/10 data-[state=active]:ring-1 data-[state=active]:ring-gray-900/5 rounded-lg py-3 px-6 text-sm font-semibold transition-all duration-200 hover:bg-white/60 active:scale-[0.98]"
            >
              Content
            </TabsTrigger>
            <TabsTrigger 
              value="styling" 
              className="data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:shadow-gray-900/10 data-[state=active]:ring-1 data-[state=active]:ring-gray-900/5 rounded-lg py-3 px-6 text-sm font-semibold transition-all duration-200 hover:bg-white/60 active:scale-[0.98]"
            >
              Styling
            </TabsTrigger>
            <TabsTrigger 
              value="preview" 
              className="data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:shadow-gray-900/10 data-[state=active]:ring-1 data-[state=active]:ring-gray-900/5 rounded-lg py-3 px-6 text-sm font-semibold transition-all duration-200 hover:bg-white/60 active:scale-[0.98]"
            >
              Preview
            </TabsTrigger>
          </TabsList>

          {/* CONTENT TAB */}
          <TabsContent value="content" className="p-8 space-y-8 max-h-[650px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-1 h-6 bg-gradient-to-b from-blue-500 to-blue-600 rounded-full"></div>
                <h3 className="text-lg font-semibold text-gray-900">Image Content</h3>
              </div>
              <div className="pl-6 space-y-4">
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
            </div>
          </TabsContent>

          {/* STYLING TAB */}
          <TabsContent value="styling" className="p-8 space-y-8 max-h-[650px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
            <StyleControls
              styling={localStyling}
              onStylingChange={handleStylingChange}
              showAdvanced={true}
            />
          </TabsContent>

          {/* PREVIEW TAB */}
          <TabsContent value="preview" className="p-6 space-y-6 max-h-[600px] overflow-y-auto">
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-1 h-6 bg-gradient-to-b from-purple-500 to-purple-600 rounded-full"></div>
                <h3 className="text-lg font-semibold text-gray-900">Live Preview</h3>
              </div>
              <div className="pl-6 space-y-4">
                <div className="w-full max-w-4xl mx-auto">
                  <figure className="relative">
                    {localSrc ? (
                      <div className="relative w-full h-[400px] rounded-md overflow-hidden">
                        <Image 
                          src={localSrc} 
                          alt={localAlt || 'Image'} 
                          fill 
                          className="object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-full h-[400px] bg-muted flex items-center justify-center rounded-md">
                        <p className="text-muted-foreground">Image placeholder</p>
                      </div>
                    )}
                    {localCaption && (
                      <figcaption className="text-center text-sm text-muted-foreground mt-2">
                        {localCaption}
                      </figcaption>
                    )}
                  </figure>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
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