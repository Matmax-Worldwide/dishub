import React, { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';

interface ComponentTitleInputProps {
  componentId: string;
  initialTitle: string;
  componentType: string;
  onTitleChange?: (componentId: string, newTitle: string) => void;
}

const ComponentTitleInput: React.FC<ComponentTitleInputProps> = ({
  componentId,
  initialTitle,
  componentType,
  onTitleChange
}) => {
  const [title, setTitle] = useState(initialTitle);
  const [isEditing, setIsEditing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setTitle(initialTitle);
  }, [initialTitle]);

  const handleClick = () => {
    setIsEditing(true);
    setTimeout(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    }, 0);
  };

  const handleBlur = () => {
    setIsEditing(false);
    if (onTitleChange && title !== initialTitle) {
      onTitleChange(componentId, title);
    }
    
    // Dispatch custom event for backward compatibility
    const event = new CustomEvent('componentTitleUpdate', {
      detail: {
        componentId,
        newTitle: title,
        componentType
      }
    });
    window.dispatchEvent(event);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      inputRef.current?.blur();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setTitle(initialTitle);
      inputRef.current?.blur();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value);
  };

  if (isEditing) {
    return (
      <Input
        ref={inputRef}
        value={title}
        onChange={handleChange}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        className="h-6 px-2 py-0 text-sm font-semibold bg-white border border-blue-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
        placeholder={`${componentType} title...`}
      />
    );
  }

  return (
    <span
      onClick={handleClick}
      className="cursor-pointer hover:bg-gray-100 px-1 py-0.5 rounded text-sm font-semibold truncate"
      title="Click to edit title"
    >
      {title || `${componentType} Component`}
    </span>
  );
};

export default ComponentTitleInput; 