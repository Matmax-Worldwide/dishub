import React from 'react';
import Image from 'next/image';
import Link from 'next/link';

interface CardSectionProps {
  title: string;
  description: string;
  image?: string;
  link?: string;
  buttonText?: string;
  isEditing?: boolean;
  onUpdate?: (data: Partial<CardSectionProps>) => void;
}

export default function CardSection({ 
  title, 
  description, 
  image,
  link,
  buttonText = 'Leer más',
  isEditing = false,
  onUpdate
}: CardSectionProps) {
  
  const handleUpdate = (field: string, value: string) => {
    if (onUpdate) {
      onUpdate({ [field]: value });
    }
  };

  return (
    <div className="py-8 px-4">
      <div className="max-w-md mx-auto bg-white rounded-xl shadow-md overflow-hidden md:max-w-2xl">
        {isEditing ? (
          <div className="p-6 space-y-4">
            <input
              type="text"
              value={title}
              onChange={(e) => handleUpdate('title', e.target.value)}
              className="w-full text-xl font-bold text-gray-900 bg-white p-2 border border-blue-300 rounded"
              placeholder="Título de la tarjeta..."
            />
            
            <textarea
              value={description}
              onChange={(e) => handleUpdate('description', e.target.value)}
              className="w-full text-gray-600 bg-white p-2 border border-blue-300 rounded"
              rows={3}
              placeholder="Descripción de la tarjeta..."
            />
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                URL de la imagen (opcional)
              </label>
              <input
                type="text"
                value={image || ''}
                onChange={(e) => handleUpdate('image', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded"
                placeholder="URL de la imagen..."
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                URL del enlace (opcional)
              </label>
              <input
                type="text"
                value={link || ''}
                onChange={(e) => handleUpdate('link', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded"
                placeholder="URL del enlace..."
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Texto del botón
              </label>
              <input
                type="text"
                value={buttonText}
                onChange={(e) => handleUpdate('buttonText', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded"
                placeholder="Texto del botón..."
              />
            </div>
          </div>
        ) : (
          <>
            {image && (
              <div className="md:flex-shrink-0">
                <div className="h-48 w-full relative">
                  <Image
                    src={image}
                    alt={title}
                    fill
                    className="object-cover"
                  />
                </div>
              </div>
            )}
            <div className="p-8">
              <div className="uppercase tracking-wide text-sm text-indigo-500 font-semibold">
                {title}
              </div>
              <p className="mt-2 text-gray-500">
                {description}
              </p>
              {link && (
                <div className="mt-4">
                  <Link
                    href={link}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
                  >
                    {buttonText}
                  </Link>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
} 