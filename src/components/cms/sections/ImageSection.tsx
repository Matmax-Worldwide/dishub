import React from 'react';
import Image from 'next/image';

interface ImageSectionProps {
  src: string;
  alt: string;
  caption?: string;
}

export default function ImageSection({ src, alt, caption }: ImageSectionProps) {
  return (
    <div className="py-12 px-4">
      <div className="max-w-4xl mx-auto">
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
      </div>
    </div>
  );
} 