'use client';

import React, { useEffect, useCallback, useState } from 'react';
import Image from 'next/image';
import StableInput from './StableInput';

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

  // Update local state when props change but only if not currently editing
  useEffect(() => {
    if (title !== localTitle) setLocalTitle(title);
    if (subtitle !== localSubtitle) setLocalSubtitle(subtitle);
    if ((image || '') !== localImage) setLocalImage(image || '');
    if (cta !== localCta) setLocalCta(cta || { text: '', url: '' });
  }, [title, subtitle, image, cta]);

  // Optimized update function
  const handleUpdateField = useCallback((field: string, value: string) => {
    if (onUpdate) {
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
    }
  }, [onUpdate, cta]);

  // Individual change handlers to avoid focus loss
  const handleTitleChange = (newValue: string) => {
    setLocalTitle(newValue);
    handleUpdateField('title', newValue);
  };

  const handleSubtitleChange = (newValue: string) => {
    setLocalSubtitle(newValue);
    handleUpdateField('subtitle', newValue);
  };

  const handleImageChange = (newValue: string) => {
    setLocalImage(newValue);
    handleUpdateField('image', newValue);
  };

  const handleCtaTextChange = (newValue: string) => {
    setLocalCta({ ...localCta, text: newValue });
    handleUpdateField('cta.text', newValue);
  };

  const handleCtaUrlChange = (newValue: string) => {
    setLocalCta({ ...localCta, url: newValue });
    handleUpdateField('cta.url', newValue);
  };

  return (
    <div className="relative py-16 md:py-24 overflow-hidden">
      {/* Background image or gradient */}
      {image ? (
        <div className="absolute inset-0 z-0">
          <Image
            src={image}
            alt={title}
            fill
            className="object-cover opacity-30"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/30 to-transparent"></div>
        </div>
      ) : (
        <div className="absolute inset-0 bg-gradient-to-b from-blue-50 to-white"></div>
      )}

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {isEditing ? (
          <div className="flex flex-col space-y-4">
            <StableInput
              value={localTitle}
              onChange={handleTitleChange}
              placeholder="Título principal..."
              className="text-3xl font-bold"
              label="Título"
            />
            
            <StableInput
              value={localSubtitle}
              onChange={handleSubtitleChange}
              placeholder="Subtítulo..."
              className="text-xl"
              multiline={true}
              label="Subtítulo"
            />
            
            <StableInput
              value={localImage}
              onChange={handleImageChange}
              placeholder="URL de la imagen de fondo..."
              label="URL de imagen"
            />
            
            {localCta && (
              <>
                <StableInput
                  value={localCta.text}
                  onChange={handleCtaTextChange}
                  placeholder="Texto del botón..."
                  label="Texto del botón CTA"
                />
                
                <StableInput
                  value={localCta.url}
                  onChange={handleCtaUrlChange}
                  placeholder="URL del botón..."
                  label="URL del botón CTA"
                />
              </>
            )}
          </div>
        ) : (
          <>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-gray-900">
              {title}
            </h1>
            <p className="text-xl md:text-2xl mx-auto max-w-3xl mb-10 text-gray-600">
              {subtitle}
            </p>
            
            {cta && (
              <button className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700">
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