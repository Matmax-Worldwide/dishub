import React, { useEffect } from 'react';

interface TextSectionProps {
  title?: string;
  subtitle?: string;
  content?: string;
  isEditing?: boolean;
  onUpdate?: (data: { title?: string; subtitle?: string; content?: string }) => void;
}

export default function TextSection({ 
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

  const handleUpdate = (field: string, value: string) => {
    if (onUpdate) {
      onUpdate({ [field]: value });
    }
  };

  return (
    <div className="py-12 px-4 border border-gray-200 rounded">
      <div className="max-w-4xl mx-auto">
        {isEditing ? (
          <>
            <input
              type="text"
              value={title || ''}
              onChange={(e) => handleUpdate('title', e.target.value)}
              className="w-full text-3xl font-bold mb-6 p-2 border border-gray-300 rounded"
              placeholder="Enter title..."
            />
            <textarea
              value={content || ''}
              onChange={(e) => handleUpdate('content', e.target.value)}
              className="w-full h-40 p-2 border border-gray-300 rounded mb-4"
              placeholder="Enter content..."
            />
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