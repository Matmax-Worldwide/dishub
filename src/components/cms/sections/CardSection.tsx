import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import StableInput from './StableInput';

interface CardSectionProps {
  title: string;
  description: string;
  image?: string;
  link?: string;
  buttonText?: string;
  isEditing?: boolean;
  onUpdate?: (data: Partial<CardSectionProps>) => void;
}

const CardSection = React.memo(function CardSection({ 
  title, 
  description, 
  image,
  link,
  buttonText = 'Leer más',
  isEditing = false,
  onUpdate
}: CardSectionProps) {
  // Local state to maintain during typing
  const [localTitle, setLocalTitle] = useState(title);
  const [localDescription, setLocalDescription] = useState(description);
  const [localImage, setLocalImage] = useState(image || '');
  const [localLink, setLocalLink] = useState(link || '');
  const [localButtonText, setLocalButtonText] = useState(buttonText);
  
  // Update local state when props change but only if values are different
  useEffect(() => {
    if (title !== localTitle) setLocalTitle(title);
    if (description !== localDescription) setLocalDescription(description);
    if ((image || '') !== localImage) setLocalImage(image || '');
    if ((link || '') !== localLink) setLocalLink(link || '');
    if (buttonText !== localButtonText) setLocalButtonText(buttonText);
  }, [title, description, image, link, buttonText]);
  
  // Optimize update handler with useCallback
  const handleUpdateField = useCallback((field: string, value: string) => {
    if (onUpdate) {
      onUpdate({ [field]: value });
    }
  }, [onUpdate]);
  
  // Individual change handlers to maintain state locally
  const handleTitleChange = (newValue: string) => {
    setLocalTitle(newValue);
    handleUpdateField('title', newValue);
  };
  
  const handleDescriptionChange = (newValue: string) => {
    setLocalDescription(newValue);
    handleUpdateField('description', newValue);
  };
  
  const handleImageChange = (newValue: string) => {
    setLocalImage(newValue);
    handleUpdateField('image', newValue);
  };
  
  const handleLinkChange = (newValue: string) => {
    setLocalLink(newValue);
    handleUpdateField('link', newValue);
  };
  
  const handleButtonTextChange = (newValue: string) => {
    setLocalButtonText(newValue);
    handleUpdateField('buttonText', newValue);
  };

  return (
    <div className="py-8 px-4">
      <div className="max-w-md mx-auto bg-white rounded-xl shadow-md overflow-hidden md:max-w-2xl">
        {isEditing ? (
          <div className="p-6 space-y-4">
            <StableInput
              value={localTitle}
              onChange={handleTitleChange}
              placeholder="Título de la tarjeta..."
              className="font-bold"
              label="Título"
            />
            
            <StableInput
              value={localDescription}
              onChange={handleDescriptionChange}
              placeholder="Descripción de la tarjeta..."
              isTextArea={true}
              rows={3}
              label="Descripción"
            />
            
            <StableInput
              value={localImage}
              onChange={handleImageChange}
              placeholder="URL de la imagen..."
              label="URL de la imagen (opcional)"
            />
            
            <StableInput
              value={localLink}
              onChange={handleLinkChange}
              placeholder="URL del enlace..."
              label="URL del enlace (opcional)"
            />
            
            <StableInput
              value={localButtonText}
              onChange={handleButtonTextChange}
              placeholder="Texto del botón..."
              label="Texto del botón"
            />
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
});

export default CardSection; 