'use client';

import React, { useEffect, useCallback } from 'react';

interface TextSectionProps {
  title?: string;
  subtitle?: string;
  content?: string;
  isEditing?: boolean;
  onUpdate?: (data: { title?: string; subtitle?: string; content?: string }) => void;
}

function TextSection({ 
  title, 
  subtitle, 
  content,
  isEditing = false,
  onUpdate
}: TextSectionProps) {
  // Debug logging
  useEffect(() => {
    console.log('TextSection rendering with:', { title, subtitle, content, isEditing });
  }, [title, subtitle, content, isEditing]);

  // Optimize update handler with useCallback
  const handleUpdate = useCallback((field: string, value: string) => {
    if (onUpdate) {
      onUpdate({ [field]: value });
    }
  }, [onUpdate]);

  return (
    <div className="py-12 px-4 border border-gray-200 rounded">
      <div className="max-w-4xl mx-auto">
        {isEditing ? (
          <>
            <div className="mb-4">
              <input
                type="text"
                value={title || ''}
                onChange={(e) => {
                  const newValue = e.target.value;
                  handleUpdate('title', newValue);
                }}
                className="w-full text-3xl font-bold mb-4 p-2 border border-gray-300 rounded"
                placeholder="Enter title..."
              />
            </div>
            <div>
              <textarea
                value={content || ''}
                onChange={(e) => {
                  const newValue = e.target.value;
                  handleUpdate('content', newValue);
                }}
                className="w-full h-40 p-2 border border-gray-300 rounded"
                placeholder="Enter content..."
              />
            </div>
          </>
        ) : (
          <>
            {title && <h2 className="text-3xl font-bold mb-6">{title}</h2>}
            {subtitle && <h3 className="text-xl font-bold mb-6">{subtitle}</h3>}
            <div className="prose lg:prose-xl">
              {content && <p>{content}</p>}
              {!content && <p className="text-gray-400">No content provided</p>}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// Add React.memo to prevent unnecessary re-renders
export default React.memo(TextSection, (prevProps, nextProps) => {
  // If in editing mode, always re-render for fluid typing
  if (prevProps.isEditing || nextProps.isEditing) {
    return false;
  }
  
  // For view mode, only re-render if content changed
  return (
    prevProps.title === nextProps.title &&
    prevProps.subtitle === nextProps.subtitle &&
    prevProps.content === nextProps.content
  );
}); 