import React, { useEffect } from 'react';
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

export default function HeroSection({ 
  title, 
  subtitle, 
  image,
  cta,
  isEditing = false,
  onUpdate
}: HeroSectionProps) {
  // Debug logging
  useEffect(() => {
    console.log('HeroSection rendering with:', { title, subtitle, image, isEditing });
  }, [title, subtitle, image, isEditing]);

  const handleUpdate = (field: string, value: string) => {
    if (onUpdate) {
      onUpdate({ [field]: value });
    }
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
          <div className="space-y-6">
            <input
              type="text"
              value={title}
              onChange={(e) => handleUpdate('title', e.target.value)}
              className="w-full text-4xl md:text-5xl font-bold text-gray-900 bg-white/90 p-3 border border-blue-300 rounded mb-4"
              placeholder="Enter hero title..."
            />
            
            <textarea
              value={subtitle}
              onChange={(e) => handleUpdate('subtitle', e.target.value)}
              className="w-full text-xl md:text-2xl text-gray-600 bg-white/90 p-3 border border-blue-300 rounded mb-6"
              rows={3}
              placeholder="Enter hero subtitle..."
            />
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Background Image URL (optional)
              </label>
              <input
                type="text"
                value={image || ''}
                onChange={(e) => handleUpdate('image', e.target.value)}
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