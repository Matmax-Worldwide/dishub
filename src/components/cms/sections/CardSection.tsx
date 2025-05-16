import React, { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import StableInput from './StableInput';
import { cn } from '@/lib/utils';

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
  
  // Track if we're actively editing to prevent props from overriding local state
  const isEditingRef = useRef(false);
  
  // Optimize debounce updates
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  
  // Update local state when props change but only if not currently editing
  useEffect(() => {
    if (!isEditingRef.current) {
      if (title !== localTitle) setLocalTitle(title);
      if (description !== localDescription) setLocalDescription(description);
      if ((image || '') !== localImage) setLocalImage(image || '');
      if ((link || '') !== localLink) setLocalLink(link || '');
      if (buttonText !== localButtonText) setLocalButtonText(buttonText);
    }
  }, [title, description, image, link, buttonText, localTitle, localDescription, localImage, localLink, localButtonText]);
  
  // Optimize update handler with useCallback and debouncing
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
  
  // Individual change handlers to maintain state locally
  const handleTitleChange = useCallback((newValue: string) => {
    setLocalTitle(newValue);
    handleUpdateField('title', newValue);
  }, [handleUpdateField]);
  
  const handleDescriptionChange = useCallback((newValue: string) => {
    setLocalDescription(newValue);
    handleUpdateField('description', newValue);
  }, [handleUpdateField]);
  
  const handleImageChange = useCallback((newValue: string) => {
    setLocalImage(newValue);
    handleUpdateField('image', newValue);
  }, [handleUpdateField]);
  
  const handleLinkChange = useCallback((newValue: string) => {
    setLocalLink(newValue);
    handleUpdateField('link', newValue);
  }, [handleUpdateField]);
  
  const handleButtonTextChange = useCallback((newValue: string) => {
    setLocalButtonText(newValue);
    handleUpdateField('buttonText', newValue);
  }, [handleUpdateField]);

  return (
    <div className={cn(
      "max-w-md mx-auto rounded-lg",
      isEditing ? "" : "bg-card shadow-sm overflow-hidden"
    )}>
      {isEditing ? (
        <div className="space-y-4">
          <StableInput
            value={localTitle}
            onChange={handleTitleChange}
            placeholder="Título de la tarjeta..."
            className="font-medium text-card-foreground"
            label="Título"
            debounceTime={300}
            data-field-id="title"
            data-component-type="Card"
          />
          
          <StableInput
            value={localDescription}
            onChange={handleDescriptionChange}
            placeholder="Descripción de la tarjeta..."
            isTextArea={true}
            rows={3}
            className="text-muted-foreground text-sm"
            label="Descripción"
            debounceTime={300}
            data-field-id="description"
            data-component-type="Card"
          />
          
          <StableInput
            value={localImage}
            onChange={handleImageChange}
            placeholder="URL de la imagen..."
            label="URL de la imagen (opcional)"
            debounceTime={300}
            data-field-id="image"
            data-component-type="Card"
          />
          
          <StableInput
            value={localLink}
            onChange={handleLinkChange}
            placeholder="URL del enlace..."
            label="URL del enlace (opcional)"
            debounceTime={300}
            data-field-id="link"
            data-component-type="Card"
          />
          
          <StableInput
            value={localButtonText}
            onChange={handleButtonTextChange}
            placeholder="Texto del botón..."
            label="Texto del botón"
            debounceTime={300}
            data-field-id="buttonText"
            data-component-type="Card"
          />
          
          {/* Preview */}
          {localImage && (
            <div className="mt-4">
              <div className="text-xs font-medium text-muted-foreground mb-2">Vista previa de imagen:</div>
              <div className="h-40 w-full relative rounded-md overflow-hidden">
                <Image
                  src={localImage}
                  alt={localTitle}
                  fill
                  className="object-cover"
                />
              </div>
            </div>
          )}
        </div>
      ) : (
        <>
          {image && (
            <div className="relative" data-field-type="image" data-component-type="Card">
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
          <div className="p-6">
            <h3 className="text-lg font-medium text-card-foreground mb-2" data-field-type="title" data-component-type="Card">
              {title}
            </h3>
            <p className="text-muted-foreground text-sm mb-4" data-field-type="description" data-component-type="Card">
              {description}
            </p>
            {link && (
              <div className="mt-4">
                <Link
                  href={link}
                  className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-md text-primary-foreground bg-primary hover:bg-primary/90 transition-colors"
                  data-field-type="buttonText"
                  data-component-type="Card"
                >
                  {buttonText}
                </Link>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
});

export default CardSection; 