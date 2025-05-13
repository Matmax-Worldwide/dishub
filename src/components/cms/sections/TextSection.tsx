'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';

interface TextSectionProps {
  title?: string;
  content: string;
  isEditing?: boolean;
  onUpdate?: (data: { title?: string; content: string }) => void;
}

export default function TextSection({ 
  title, 
  content, 
  isEditing = false, 
  onUpdate 
}: TextSectionProps) {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isEditingContent, setIsEditingContent] = useState(false);
  const [titleValue, setTitleValue] = useState(title || '');
  const [contentValue, setContentValue] = useState(content);

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setTitleValue(e.target.value);
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContentValue(e.target.value);
  };

  const handleTitleBlur = () => {
    setIsEditingTitle(false);
    if (onUpdate) {
      onUpdate({ title: titleValue, content: contentValue });
    }
  };

  const handleContentBlur = () => {
    setIsEditingContent(false);
    if (onUpdate) {
      onUpdate({ title: titleValue, content: contentValue });
    }
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      setIsEditingTitle(false);
      if (onUpdate) {
        onUpdate({ title: titleValue, content: contentValue });
      }
    }
  };

  return (
    <div className={cn(
      "w-full",
      isEditing ? "p-4" : "p-8 bg-white rounded-lg shadow-sm"
    )}>
      <div className="max-w-4xl mx-auto">
        {title && !isEditing ? (
          <h3 className="text-2xl font-semibold mb-4">{titleValue}</h3>
        ) : isEditing && (
          <>
            {isEditingTitle ? (
              <div className="mb-4">
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  Section Title (optional)
                </label>
                <input
                  type="text"
                  value={titleValue}
                  onChange={handleTitleChange}
                  onBlur={handleTitleBlur}
                  onKeyDown={handleTitleKeyDown}
                  className="w-full text-xl font-semibold border border-input rounded-md p-2 focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none"
                  autoFocus
                  placeholder="Enter section title..."
                />
              </div>
            ) : (
              <div 
                className={cn(
                  "text-xl font-semibold mb-4 cursor-pointer hover:bg-accent/20 hover:px-2 transition-all rounded-md p-1",
                  !titleValue && "text-muted-foreground/60 italic"
                )}
                onClick={() => setIsEditingTitle(true)}
              >
                {titleValue || "Click to add title..."}
              </div>
            )}
          </>
        )}

        {isEditing && isEditingContent ? (
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">
              Content
            </label>
            <textarea
              value={contentValue}
              onChange={handleContentChange}
              onBlur={handleContentBlur}
              className="w-full min-h-[200px] text-base border border-input rounded-md p-2 focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none resize-y"
              autoFocus
            />
          </div>
        ) : (
          <div 
            className={cn(
              "text-base leading-relaxed whitespace-pre-wrap",
              isEditing && "cursor-pointer hover:bg-accent/20 hover:px-2 transition-all rounded-md p-1"
            )}
            onClick={() => isEditing && setIsEditingContent(true)}
          >
            {contentValue.split('\n').map((paragraph, index) => (
              <p key={index} className="mb-4">
                {paragraph}
              </p>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 