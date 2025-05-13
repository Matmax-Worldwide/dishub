'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';

interface HeaderSectionProps {
  title: string;
  subtitle?: string;
  isEditing?: boolean;
  onUpdate?: (data: { title: string; subtitle?: string }) => void;
}

export default function HeaderSection({ 
  title, 
  subtitle, 
  isEditing = false, 
  onUpdate 
}: HeaderSectionProps) {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isEditingSubtitle, setIsEditingSubtitle] = useState(false);
  const [titleValue, setTitleValue] = useState(title);
  const [subtitleValue, setSubtitleValue] = useState(subtitle || '');

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setTitleValue(e.target.value);
  };

  const handleSubtitleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setSubtitleValue(e.target.value);
  };

  const handleTitleBlur = () => {
    setIsEditingTitle(false);
    if (onUpdate) {
      onUpdate({ title: titleValue, subtitle: subtitleValue });
    }
  };

  const handleSubtitleBlur = () => {
    setIsEditingSubtitle(false);
    if (onUpdate) {
      onUpdate({ title: titleValue, subtitle: subtitleValue });
    }
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      setIsEditingTitle(false);
      if (onUpdate) {
        onUpdate({ title: titleValue, subtitle: subtitleValue });
      }
    }
  };

  const handleSubtitleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      setIsEditingSubtitle(false);
      if (onUpdate) {
        onUpdate({ title: titleValue, subtitle: subtitleValue });
      }
    }
  };

  return (
    <div className={cn(
      "w-full",
      isEditing ? "p-4" : "p-8 bg-background border border-border/20 rounded-lg shadow-sm"
    )}>
      <div className="max-w-4xl mx-auto">
        {isEditing && isEditingTitle ? (
          <div className="mb-4">
            <label className="block text-xs font-medium text-muted-foreground mb-1">
              Title
            </label>
            <textarea
              value={titleValue}
              onChange={handleTitleChange}
              onBlur={handleTitleBlur}
              onKeyDown={handleTitleKeyDown}
              className="w-full text-xl font-semibold border border-input rounded-md p-2 min-h-[60px] focus:ring-1 focus:ring-ring focus:outline-none resize-y bg-background"
              autoFocus
            />
          </div>
        ) : (
          <h2 
            className={cn(
              "text-3xl font-bold pb-2 mb-4",
              isEditing && "cursor-pointer hover:bg-muted transition-colors rounded-md p-1"
            )}
            onClick={() => isEditing && setIsEditingTitle(true)}
          >
            {titleValue}
          </h2>
        )}

        {isEditing && isEditingSubtitle ? (
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">
              Subtitle
            </label>
            <textarea
              value={subtitleValue}
              onChange={handleSubtitleChange}
              onBlur={handleSubtitleBlur}
              onKeyDown={handleSubtitleKeyDown}
              className="w-full text-base text-foreground/80 border border-input rounded-md p-2 min-h-[60px] focus:ring-1 focus:ring-ring focus:outline-none resize-y bg-background"
              autoFocus
              placeholder="Enter subtitle..."
            />
          </div>
        ) : (
          subtitle || isEditing ? (
            <p 
              className={cn(
                "text-lg text-muted-foreground",
                isEditing && !subtitleValue && "text-muted-foreground/50 italic",
                isEditing && "cursor-pointer hover:bg-muted transition-colors rounded-md p-1"
              )}
              onClick={() => isEditing && setIsEditingSubtitle(true)}
            >
              {subtitleValue || (isEditing ? "Click to add subtitle..." : "")}
            </p>
          ) : null
        )}
      </div>
    </div>
  );
} 