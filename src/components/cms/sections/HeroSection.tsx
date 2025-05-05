import React, { useState } from 'react';
import Image from 'next/image';
import { PencilIcon, CheckIcon } from '@heroicons/react/24/outline';

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
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isEditingSubtitle, setIsEditingSubtitle] = useState(false);
  const [titleValue, setTitleValue] = useState(title);
  const [subtitleValue, setSubtitleValue] = useState(subtitle);

  const handleTitleSave = () => {
    if (onUpdate) {
      onUpdate({ title: titleValue });
    }
    setIsEditingTitle(false);
  };

  const handleSubtitleSave = () => {
    if (onUpdate) {
      onUpdate({ subtitle: subtitleValue });
    }
    setIsEditingSubtitle(false);
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
        {isEditing && isEditingTitle ? (
          <div className="mb-6">
            <textarea
              value={titleValue}
              onChange={(e) => setTitleValue(e.target.value)}
              className="w-full text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 bg-white/80 p-2 border border-blue-300 rounded"
              rows={2}
            />
            <button
              onClick={handleTitleSave}
              className="mt-2 p-2 bg-green-500 text-white rounded-full"
            >
              <CheckIcon className="h-5 w-5" />
            </button>
          </div>
        ) : (
          <h1 className="relative text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-gray-900 group">
            {titleValue}
            {isEditing && (
              <button
                onClick={() => setIsEditingTitle(true)}
                className="absolute -right-10 top-1/2 transform -translate-y-1/2 p-2 bg-blue-100 text-blue-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <PencilIcon className="h-5 w-5" />
              </button>
            )}
          </h1>
        )}

        {isEditing && isEditingSubtitle ? (
          <div className="mb-10">
            <textarea
              value={subtitleValue}
              onChange={(e) => setSubtitleValue(e.target.value)}
              className="w-full text-xl md:text-2xl text-gray-600 bg-white/80 p-2 border border-blue-300 rounded"
              rows={3}
            />
            <button
              onClick={handleSubtitleSave}
              className="mt-2 p-2 bg-green-500 text-white rounded-full"
            >
              <CheckIcon className="h-5 w-5" />
            </button>
          </div>
        ) : (
          <p className="relative text-xl md:text-2xl mx-auto max-w-3xl mb-10 text-gray-600 group">
            {subtitleValue}
            {isEditing && (
              <button
                onClick={() => setIsEditingSubtitle(true)}
                className="absolute -right-10 top-1/2 transform -translate-y-1/2 p-2 bg-blue-100 text-blue-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <PencilIcon className="h-5 w-5" />
              </button>
            )}
          </p>
        )}
        
        {cta && (
          <button className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700">
            {cta.text}
          </button>
        )}
      </div>
    </div>
  );
} 