import React, { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import StableInput from './StableInput';
import StyleControls from '../../StyleControls';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/app/components/ui/tabs";
import { cn } from '@/lib/utils';
import { 
  ComponentStyling, 
  ComponentStyleProps, 
  DEFAULT_STYLING,
  generateStylesFromStyling,
  generateClassesFromStyling
} from '@/types/cms-styling';

interface CardSectionProps extends ComponentStyleProps {
  title: string;
  description: string;
  image?: string;
  link?: string;
  buttonText?: string;
  styling?: ComponentStyling;
  isEditing?: boolean;
  onUpdate?: (data: { 
    title: string; 
    description: string; 
    image?: string; 
    link?: string; 
    buttonText?: string;
    styling?: ComponentStyling;
  }) => void;
}

const CardSection = React.memo(function CardSection({ 
  title, 
  description, 
  image,
  link,
  buttonText = 'Leer más',
  styling = DEFAULT_STYLING,
  isEditing = false,
  onUpdate
}: CardSectionProps) {
  // Local state to maintain during typing
  const [localTitle, setLocalTitle] = useState(title);
  const [localDescription, setLocalDescription] = useState(description);
  const [localImage, setLocalImage] = useState(image || '');
  const [localLink, setLocalLink] = useState(link || '');
  const [localButtonText, setLocalButtonText] = useState(buttonText);
  const [localStyling, setLocalStyling] = useState<ComponentStyling>(styling);
  
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
      if (styling && JSON.stringify(styling) !== JSON.stringify(localStyling)) {
        setLocalStyling(styling);
      }
    }
  }, [title, description, image, link, buttonText, styling, localTitle, localDescription, localImage, localLink, localButtonText, localStyling]);
  
  // Optimize update handler with useCallback and debouncing
  const handleUpdateField = useCallback((field: string, value: string | ComponentStyling) => {
    if (onUpdate) {
      // Mark that we're in editing mode
      isEditingRef.current = true;
      
      // Clear any pending debounce
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      
      // Prepare data to update
      const updateData = {
        title: localTitle,
        description: localDescription,
        image: localImage,
        link: localLink,
        buttonText: localButtonText,
        styling: localStyling,
        [field]: value
      };
      
      // Set timeout to update parent
      debounceRef.current = setTimeout(() => {
        onUpdate(updateData);
        
        // Reset editing flag after a short delay
        setTimeout(() => {
          isEditingRef.current = false;
        }, 500);
      }, 200);
    }
  }, [onUpdate, localTitle, localDescription, localImage, localLink, localButtonText, localStyling]);
  
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

  const handleStylingChange = useCallback((newStyling: ComponentStyling) => {
    setLocalStyling(newStyling);
    handleUpdateField('styling', newStyling);
  }, [handleUpdateField]);

  // Generate styles and classes from styling
  const inlineStyles = generateStylesFromStyling(localStyling);
  const cssClasses = generateClassesFromStyling(localStyling);

  if (isEditing) {
    return (
      <div className="w-full bg-white/95 backdrop-blur-sm border border-gray-200/60 rounded-xl shadow-lg shadow-gray-900/5 ring-1 ring-gray-900/5">
        <Tabs defaultValue="content" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-gradient-to-r from-gray-50 to-gray-100/80 p-2 rounded-xl border border-gray-200/50 shadow-inner">
            <TabsTrigger 
              value="content" 
              className="data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:shadow-gray-900/10 data-[state=active]:ring-1 data-[state=active]:ring-gray-900/5 rounded-lg py-3 px-6 text-sm font-semibold transition-all duration-200 hover:bg-white/60 active:scale-[0.98]"
            >
              Content
            </TabsTrigger>
            <TabsTrigger 
              value="styling" 
              className="data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:shadow-gray-900/10 data-[state=active]:ring-1 data-[state=active]:ring-gray-900/5 rounded-lg py-3 px-6 text-sm font-semibold transition-all duration-200 hover:bg-white/60 active:scale-[0.98]"
            >
              Styling
            </TabsTrigger>
            <TabsTrigger 
              value="preview" 
              className="data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:shadow-gray-900/10 data-[state=active]:ring-1 data-[state=active]:ring-gray-900/5 rounded-lg py-3 px-6 text-sm font-semibold transition-all duration-200 hover:bg-white/60 active:scale-[0.98]"
            >
              Preview
            </TabsTrigger>
          </TabsList>

          {/* CONTENT TAB */}
          <TabsContent value="content" className="p-8 space-y-8 max-h-[650px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-1 h-6 bg-gradient-to-b from-blue-500 to-blue-600 rounded-full"></div>
                <h3 className="text-lg font-semibold text-gray-900">Card Content</h3>
              </div>
              <div className="pl-6 space-y-4">
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
            </div>
          </TabsContent>

          {/* STYLING TAB */}
          <TabsContent value="styling" className="p-8 space-y-8 max-h-[650px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
            <StyleControls
              styling={localStyling}
              onStylingChange={handleStylingChange}
              showAdvanced={true}
            />
          </TabsContent>

          {/* PREVIEW TAB */}
          <TabsContent value="preview" className="p-6 space-y-6 max-h-[600px] overflow-y-auto">
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-1 h-6 bg-gradient-to-b from-purple-500 to-purple-600 rounded-full"></div>
                <h3 className="text-lg font-semibold text-gray-900">Live Preview</h3>
              </div>
              <div className="pl-6 space-y-4">
                <div className="max-w-md mx-auto rounded-lg bg-card shadow-sm overflow-hidden">
                  {localImage && (
                    <div className="relative">
                      <div className="h-48 w-full relative">
                        <Image
                          src={localImage}
                          alt={localTitle}
                          fill
                          className="object-cover"
                        />
                      </div>
                    </div>
                  )}
                  <div className="p-6">
                    <h3 className="text-lg font-medium text-card-foreground mb-2">
                      {localTitle}
                    </h3>
                    <p className="text-muted-foreground text-sm mb-4">
                      {localDescription}
                    </p>
                    {localLink && (
                      <div className="mt-4">
                        <div className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-md text-primary-foreground bg-primary hover:bg-primary/90 transition-colors">
                          {localButtonText}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    );
  }

  return (
    <div 
      className={cn(
        "max-w-md mx-auto rounded-lg bg-card shadow-sm overflow-hidden",
        cssClasses
      )}
      style={inlineStyles}
    >
      {localImage && (
        <div className="relative" data-field-type="image" data-component-type="Card">
          <div className="h-48 w-full relative">
            <Image
              src={localImage}
              alt={localTitle}
              fill
              className="object-cover"
            />
          </div>
        </div>
      )}
      <div className="p-6">
        <h3 className="text-lg font-medium text-card-foreground mb-2" data-field-type="title" data-component-type="Card">
          {localTitle}
        </h3>
        <p className="text-muted-foreground text-sm mb-4" data-field-type="description" data-component-type="Card">
          {localDescription}
        </p>
        {localLink && (
          <div className="mt-4">
            <Link
              href={localLink}
              className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-md text-primary-foreground bg-primary hover:bg-primary/90 transition-colors"
              data-field-type="buttonText"
              data-component-type="Card"
            >
              {localButtonText}
            </Link>
          </div>
        )}
      </div>
    </div>
  );
});

export default CardSection; 