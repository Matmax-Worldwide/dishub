'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import StableInput from './StableInput';

interface HeaderSectionProps {
  title: string;
  subtitle?: string;
  isEditing?: boolean;
  onUpdate?: (data: { title: string; subtitle?: string }) => void;
}

export default function HeaderSection({ 
  title, 
  subtitle, 
  isEditing = false, 
  onUpdate 
}: HeaderSectionProps) {
  // Local state to maintain during typing
  const [localTitle, setLocalTitle] = useState(title);
  const [localSubtitle, setLocalSubtitle] = useState(subtitle || '');
  
  // Track if we're actively editing to prevent props from overriding local state
  const isEditingRef = useRef(false);
  
  // Optimize debounce updates
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  
  // Update local state when props change but only if not currently editing
  useEffect(() => {
    if (!isEditingRef.current) {
      if (title !== localTitle) setLocalTitle(title);
      if ((subtitle || '') !== localSubtitle) setLocalSubtitle(subtitle || '');
    }
  }, [title, subtitle, localTitle, localSubtitle]);
  
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
        subtitle: localSubtitle,
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
  }, [onUpdate, localTitle, localSubtitle]);
  
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
  
  const handleSubtitleChange = useCallback((newValue: string) => {
    setLocalSubtitle(newValue);
    handleUpdateField('subtitle', newValue);
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
              placeholder="Enter title..."
              className="font-medium text-xl"
              label="Title"
              debounceTime={300}
            />
            
            <StableInput
              value={localSubtitle}
              onChange={handleSubtitleChange}
              placeholder="Enter subtitle (optional)..."
              className="text-muted-foreground"
              label="Subtitle (optional)"
              debounceTime={300}
            />
          </div>
        ) : (
          <>
            <h2 className="text-2xl font-medium pb-2 mb-3 text-foreground">
              {localTitle}
            </h2>
            
            {localSubtitle && (
              <p className="text-base text-muted-foreground">
                {localSubtitle}
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
} 