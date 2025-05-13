'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import StableInput from './StableInput';

interface TextSectionProps {
  title?: string;
  content: string;
  isEditing?: boolean;
  onUpdate?: (data: { title?: string; content: string }) => void;
}

export default function TextSection({ 
  title, 
  content, 
  isEditing = false, 
  onUpdate 
}: TextSectionProps) {
  // Local state to maintain during typing
  const [localTitle, setLocalTitle] = useState(title || '');
  const [localContent, setLocalContent] = useState(content);
  
  // Track if we're actively editing to prevent props from overriding local state
  const isEditingRef = useRef(false);
  
  // Optimize debounce updates
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  
  // Update local state when props change but only if not currently editing
  useEffect(() => {
    if (!isEditingRef.current) {
      if (title !== localTitle) setLocalTitle(title || '');
      if (content !== localContent) setLocalContent(content);
    }
  }, [title, content, localTitle, localContent]);
  
  // Optimize update handler with debouncing
  const handleUpdateField = useCallback((field: string, value: string) => {
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
  }, [onUpdate, localTitle, localContent]);
  
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

  return (
    <div className={cn(
      "w-full",
      isEditing ? "rounded-lg" : "p-6 bg-card text-card-foreground rounded-lg shadow-sm"
    )}>
      <div className="max-w-4xl mx-auto">
        {isEditing ? (
          <div className="space-y-4">
            <StableInput
              value={localTitle}
              onChange={handleTitleChange}
              placeholder="Enter section title..."
              className="font-medium text-lg"
              label="Section Title (optional)"
              debounceTime={300}
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
            />
          </div>
        ) : (
          <>
            {localTitle && (
              <h3 className="text-xl font-medium mb-4">{localTitle}</h3>
            )}
            <div className="text-base leading-relaxed whitespace-pre-wrap text-muted-foreground">
              {localContent.split('\n').map((paragraph, index) => (
                <p key={index} className="mb-4">
                  {paragraph}
                </p>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
} 