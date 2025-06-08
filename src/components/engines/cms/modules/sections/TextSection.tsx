'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import StableInput from '@/app/components/engines/cms/modules/sections/StableInput';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/app/components/ui/tabs";
import { 
  ComponentStyling, 
  ComponentStyleProps, 
  DEFAULT_STYLING,
  generateStylesFromStyling,
  generateClassesFromStyling
} from '@/types/cms-styling';
import StyleControls from '../../StyleControls';

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
                <h3 className="text-lg font-semibold text-gray-900">Text Content</h3>
              </div>
              <div className="pl-6 space-y-4">
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
                  {localTitle && (
                    <h3 className="text-xl font-medium mb-4">
                      {localTitle}
                    </h3>
                  )}
                  <div className="text-base leading-relaxed whitespace-pre-wrap">
                    {(localContent || '').split('\n').map((paragraph, index) => (
                      <p key={index} className="mb-4">
                        {paragraph}
                      </p>
                    ))}
                  </div>
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