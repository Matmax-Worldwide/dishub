'use client';

import React, { useEffect, useCallback } from 'react';
import Image from 'next/image';

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

function HeroSection({ 
  title, 
  subtitle, 
  image,
  cta,
  isEditing = false,
  onUpdate
}: HeroSectionProps) {
  // Optimize update handler with useCallback to prevent recreating on each render
  const handleUpdate = useCallback((field: string, value: string) => {
    if (onUpdate) {
      onUpdate({ [field]: value });
    }
  }, [onUpdate]);

  // Debug logging
  useEffect(() => {
    console.log('HeroSection rendering with:', { title, subtitle, image, isEditing });
  }, [title, subtitle, image, isEditing]);

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
          <div className="space-y-6">
            <div>
              <input
                type="text"
                value={title}
                onChange={(e) => {
                  // Use inline functions to reduce prop churn
                  const newValue = e.target.value;
                  handleUpdate('title', newValue);
                }}
                className="w-full text-4xl md:text-5xl font-bold text-gray-900 bg-white/90 p-3 border border-blue-300 rounded mb-4"
                placeholder="Enter hero title..."
              />
            </div>
            
            <div>
              <textarea
                value={subtitle}
                onChange={(e) => {
                  const newValue = e.target.value;
                  handleUpdate('subtitle', newValue);
                }}
                className="w-full text-xl md:text-2xl text-gray-600 bg-white/90 p-3 border border-blue-300 rounded mb-6"
                rows={3}
                placeholder="Enter hero subtitle..."
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Background Image URL (optional)
              </label>
              <input
                type="text"
                value={image || ''}
                onChange={(e) => {
                  const newValue = e.target.value;
                  handleUpdate('image', newValue);
                }}
                className="w-full p-2 border border-gray-300 rounded"
                placeholder="Enter image URL..."
              />
            </div>
            
            {/* CTA editing could be added here */}
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
}

// Use React.memo to prevent unnecessary re-renders
export default React.memo(HeroSection, (prevProps, nextProps) => {
  // If in editing mode, always allow updates for fluid typing
  if (prevProps.isEditing || nextProps.isEditing) {
    return false; // Always re-render for editing changes
  }

  // For non-editing, only re-render if core props actually changed
  return (
    prevProps.title === nextProps.title &&
    prevProps.subtitle === nextProps.subtitle &&
    prevProps.image === nextProps.image
  );
}); 