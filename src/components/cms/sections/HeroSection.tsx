'use client';

import React, { useEffect, useCallback, useState, useRef } from 'react';
import Image from 'next/image';
import StableInput from './StableInput';
import { cn } from '@/lib/utils';

interface HeroSectionProps {
  title: string;
  subtitle: string;
  image?: string;
  cta?: {
    text: string;
    url: string;
  };
  isEditing?: boolean;
  onUpdate?: (data: Partial<HeroSectionProps>) => void;
}

const HeroSection = React.memo(function HeroSection({ 
  title, 
  subtitle, 
  image,
  cta,
  isEditing = false,
  onUpdate
}: HeroSectionProps) {
  // Local state to maintain during typing
  const [localTitle, setLocalTitle] = useState(title);
  const [localSubtitle, setLocalSubtitle] = useState(subtitle);
  const [localImage, setLocalImage] = useState(image || '');
  const [localCta, setLocalCta] = useState(cta || { text: '', url: '' });
  
  // Track if we're actively editing to prevent props from overriding local state
  const isEditingRef = useRef(false);

  // Update local state when props change but only if not currently editing
  useEffect(() => {
    if (!isEditingRef.current) {
      if (title !== localTitle) setLocalTitle(title);
      if (subtitle !== localSubtitle) setLocalSubtitle(subtitle);
      if ((image || '') !== localImage) setLocalImage(image || '');
      if (cta && JSON.stringify(cta) !== JSON.stringify(localCta)) {
        setLocalCta(cta || { text: '', url: '' });
      }
    }
  }, [title, subtitle, image, cta, localTitle, localSubtitle, localImage, localCta]);

  // Optimized update function with debouncing
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  
  const handleUpdateField = useCallback((field: string, value: string) => {
    if (onUpdate) {
      // Mark that we're in editing mode to prevent useEffect override
      isEditingRef.current = true;
      
      // Clear any pending debounce
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      
      // Set timeout to update parent
      debounceRef.current = setTimeout(() => {
        const updateData: Partial<HeroSectionProps> = {};
        
        // Handle nested fields like 'cta.text'
        if (field.includes('.')) {
          const [parent, child] = field.split('.');
          if (parent === 'cta') {
            updateData.cta = {
              ...(cta || { text: '', url: '' }),
              [child]: value
            };
          }
        } else {
          // @ts-expect-error: Dynamic field assignment
          updateData[field] = value;
        }
        
        onUpdate(updateData);
        
        // Reset editing flag after a short delay to prevent immediate override
        setTimeout(() => {
          isEditingRef.current = false;
        }, 500);
      }, 200);
    }
  }, [onUpdate, cta]);

  // Individual change handlers to avoid focus loss
  const handleTitleChange = useCallback((newValue: string) => {
    setLocalTitle(newValue);
    handleUpdateField('title', newValue);
  }, [handleUpdateField]);

  const handleSubtitleChange = useCallback((newValue: string) => {
    setLocalSubtitle(newValue);
    handleUpdateField('subtitle', newValue);
  }, [handleUpdateField]);

  const handleImageChange = useCallback((newValue: string) => {
    setLocalImage(newValue);
    handleUpdateField('image', newValue);
  }, [handleUpdateField]);

  const handleCtaTextChange = useCallback((newValue: string) => {
    setLocalCta(prev => ({ ...prev, text: newValue }));
    handleUpdateField('cta.text', newValue);
  }, [handleUpdateField]);

  const handleCtaUrlChange = useCallback((newValue: string) => {
    setLocalCta(prev => ({ ...prev, url: newValue }));
    handleUpdateField('cta.url', newValue);
  }, [handleUpdateField]);
  
  // Clean up timeouts on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  return (
    <div className={cn(
      "relative overflow-hidden",
      isEditing ? "rounded-lg border-none" : ""
    )}>
      {/* Background image or gradient - only show when not editing */}
      {!isEditing && (
        <>
          {image ? (
            <div className="absolute inset-0 z-0">
              <Image
                src={image}
                alt={title}
                fill
                className="object-cover opacity-30"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-background/80 to-background/30"></div>
            </div>
          ) : (
            <div className="absolute inset-0 bg-gradient-to-b from-muted/50 to-background"></div>
          )}
        </>
      )}

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {isEditing ? (
          <div className="flex flex-col space-y-4">
            <StableInput
              value={localTitle}
              onChange={handleTitleChange}
              placeholder="Título principal..."
              className="text-foreground font-bold text-xl"
              label="Título"
              debounceTime={300}
            />
            
            <StableInput
              value={localSubtitle}
              onChange={handleSubtitleChange}
              placeholder="Subtítulo..."
              className="text-muted-foreground"
              multiline={true}
              label="Subtítulo"
              debounceTime={300}
            />
            
            <StableInput
              value={localImage}
              onChange={handleImageChange}
              placeholder="URL de la imagen de fondo..."
              label="URL de imagen"
              debounceTime={300}
            />
            
            {localCta && (
              <>
                <StableInput
                  value={localCta.text}
                  onChange={handleCtaTextChange}
                  placeholder="Texto del botón..."
                  label="Texto del botón CTA"
                  debounceTime={300}
                />
                
                <StableInput
                  value={localCta.url}
                  onChange={handleCtaUrlChange}
                  placeholder="URL del botón..."
                  label="URL del botón CTA"
                  debounceTime={300}
                />
              </>
            )}
          </div>
        ) : (
          <>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-foreground">
              {title}
            </h1>
            <p className="text-xl md:text-2xl mx-auto max-w-3xl mb-10 text-muted-foreground">
              {subtitle}
            </p>
            
            {cta && cta.text && (
              <button className="inline-flex items-center px-6 py-3 rounded-md font-medium text-primary-foreground bg-primary hover:bg-primary/90 transition-colors">
                {cta.text}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
});

export default HeroSection; 