import React, { useEffect } from 'react';
import Image from 'next/image';

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
  // Debug logging
  useEffect(() => {
    console.log('ImageSection rendering with:', { src, alt, caption, isEditing });
  }, [src, alt, caption, isEditing]);

  const handleUpdate = (field: string, value: string) => {
    if (onUpdate) {
      onUpdate({ [field]: value });
    }
  };

  return (
    <div className="py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {isEditing ? (
          <div className="space-y-4 border border-gray-200 rounded p-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Image URL
              </label>
              <input
                type="text"
                value={src}
                onChange={(e) => handleUpdate('src', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded"
                placeholder="Enter image URL..."
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Alt Text
              </label>
              <input
                type="text"
                value={alt}
                onChange={(e) => handleUpdate('alt', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded"
                placeholder="Enter alt text..."
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Caption (optional)
              </label>
              <input
                type="text"
                value={caption || ''}
                onChange={(e) => handleUpdate('caption', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded"
                placeholder="Enter caption..."
              />
            </div>
            
            {/* Preview */}
            <div className="mt-4">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Preview:</h3>
              {src ? (
                <div className="relative w-full h-[200px]">
                  <Image 
                    src={src} 
                    alt={alt || 'Image'} 
                    fill 
                    className="object-cover rounded-lg"
                  />
                </div>
              ) : (
                <div className="w-full h-[200px] bg-gray-200 flex items-center justify-center rounded-lg">
                  <p className="text-gray-400">Image preview</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <figure className="relative">
            {src ? (
              <div className="relative w-full h-[400px]">
                <Image 
                  src={src} 
                  alt={alt || 'Image'} 
                  fill 
                  className="object-cover rounded-lg"
                />
              </div>
            ) : (
              <div className="w-full h-[400px] bg-gray-200 flex items-center justify-center rounded-lg">
                <p className="text-gray-400">Image placeholder</p>
              </div>
            )}
            {caption && (
              <figcaption className="text-center text-sm text-gray-500 mt-2">
                {caption}
              </figcaption>
            )}
          </figure>
        )}
      </div>
    </div>
  );
} 