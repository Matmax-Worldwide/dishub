'use client';

import { useState } from 'react';

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

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitleValue(e.target.value);
  };

  const handleSubtitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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

  return (
    <div className="bg-white p-8 rounded-lg shadow-md w-full">
      <div className="max-w-4xl mx-auto">
        {isEditing && isEditingTitle ? (
          <input
            type="text"
            value={titleValue}
            onChange={handleTitleChange}
            onBlur={handleTitleBlur}
            className="w-full text-3xl font-bold border-b-2 border-blue-500 pb-2 mb-4 focus:outline-none"
            autoFocus
          />
        ) : (
          <h2 
            className={`text-3xl font-bold pb-2 mb-4 ${isEditing ? 'cursor-pointer hover:bg-blue-50 hover:px-2 transition-all' : ''}`}
            onClick={() => isEditing && setIsEditingTitle(true)}
          >
            {titleValue}
          </h2>
        )}

        {isEditing && isEditingSubtitle ? (
          <input
            type="text"
            value={subtitleValue}
            onChange={handleSubtitleChange}
            onBlur={handleSubtitleBlur}
            className="w-full text-lg text-gray-600 border-b-2 border-blue-500 pb-2 focus:outline-none"
            autoFocus
          />
        ) : (
          subtitle && (
            <p 
              className={`text-lg text-gray-600 ${isEditing ? 'cursor-pointer hover:bg-blue-50 hover:px-2 transition-all' : ''}`}
              onClick={() => isEditing && setIsEditingSubtitle(true)}
            >
              {subtitleValue}
            </p>
          )
        )}
      </div>
    </div>
  );
} 