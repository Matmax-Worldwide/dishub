'use client';

import React, { useEffect, useCallback, useState } from 'react';
import StableInput from './StableInput';

interface TextSectionProps {
  title?: string;
  subtitle?: string;
  content?: string;
  isEditing?: boolean;
  onUpdate?: (data: { title?: string; subtitle?: string; content?: string }) => void;
}

const TextSection = React.memo(function TextSection({ 
  title, 
  subtitle, 
  content,
  isEditing = false,
  onUpdate
}: TextSectionProps) {
  // Local state to maintain during typing
  const [localTitle, setLocalTitle] = useState(title || '');
  const [localSubtitle, setLocalSubtitle] = useState(subtitle || '');
  const [localContent, setLocalContent] = useState(content || '');

  // Update local state when props change
  useEffect(() => {
    if (title !== localTitle) setLocalTitle(title || '');
    if (subtitle !== localSubtitle) setLocalSubtitle(subtitle || '');
    if (content !== localContent) setLocalContent(content || '');
  }, [title, subtitle, content]);

  // Optimized update function
  const handleUpdateField = useCallback((field: string, value: string) => {
    if (onUpdate) {
      onUpdate({ [field]: value });
    }
  }, [onUpdate]);

  // Individual change handlers
  const handleTitleChange = (newValue: string) => {
    setLocalTitle(newValue);
    handleUpdateField('title', newValue);
  };

  const handleSubtitleChange = (newValue: string) => {
    setLocalSubtitle(newValue);
    handleUpdateField('subtitle', newValue);
  };

  const handleContentChange = (newValue: string) => {
    setLocalContent(newValue);
    handleUpdateField('content', newValue);
  };

  return (
    <div className="py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {isEditing ? (
          <div className="space-y-6">
            <StableInput
              value={localTitle}
              onChange={handleTitleChange}
              placeholder="Título de la sección..."
              className="text-3xl font-bold"
              label="Título"
            />
            
            <StableInput
              value={localSubtitle}
              onChange={handleSubtitleChange}
              placeholder="Subtítulo..."
              className="text-xl"
              label="Subtítulo"
            />
            
            <StableInput
              value={localContent}
              onChange={handleContentChange}
              placeholder="Contenido principal..."
              isTextArea={true}
              rows={6}
              label="Contenido"
            />
          </div>
        ) : (
          <>
            {title && (
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                {title}
              </h2>
            )}
            
            {subtitle && (
              <h3 className="text-xl md:text-2xl text-gray-600 mb-6">
                {subtitle}
              </h3>
            )}
            
            {content && (
              <div className="prose prose-lg max-w-none">
                {content.split('\n').map((paragraph, index) => (
                  <p key={index} className="mb-4">
                    {paragraph}
                  </p>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
});

// Use simple React.memo to prevent unnecessary re-renders
export default TextSection; 