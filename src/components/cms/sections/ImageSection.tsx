'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import StableInput from './StableInput';

interface ImageSectionProps {
  src: string;
  alt: string;
  caption?: string;
  isEditing?: boolean;
  onUpdate?: (data: Partial<ImageSectionProps>) => void;
}

export default function ImageSection({ 
  src, 
  alt, 
  caption,
  isEditing = false,
  onUpdate
}: ImageSectionProps) {
  // Local state to maintain during typing
  const [localSrc, setLocalSrc] = useState(src || '');
  const [localAlt, setLocalAlt] = useState(alt || '');
  const [localCaption, setLocalCaption] = useState(caption || '');
  
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
    }
  }, [src, alt, caption, localSrc, localAlt, localCaption]);
  
  // Optimize update handler with debouncing
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

  return (
    <div className={cn(
      "w-full", 
      isEditing ? "rounded-lg" : "p-6 bg-card text-card-foreground rounded-lg shadow-sm"
    )}>
      <div className="max-w-4xl mx-auto">
        {isEditing ? (
          <div className="space-y-4">
            <StableInput
              value={localSrc}
              onChange={handleSrcChange}
              placeholder="Enter image URL..."
              className="text-base"
              label="Image URL"
              debounceTime={300}
            />
            
            <StableInput
              value={localAlt}
              onChange={handleAltChange}
              placeholder="Enter alt text..."
              className="text-base"
              label="Alt Text"
              debounceTime={300}
            />
            
            <StableInput
              value={localCaption}
              onChange={handleCaptionChange}
              placeholder="Enter caption (optional)..."
              className="text-base"
              label="Caption (optional)"
              debounceTime={300}
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
        ) : (
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
        )}
      </div>
    </div>
  );
} 