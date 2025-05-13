'use client';

import React, { useState, useRef } from 'react';

interface ComponentTitleInputProps {
  componentId: string;
  initialTitle: string | undefined;
  componentType: string;
}

export default function ComponentTitleInput({
  componentId,
  initialTitle,
  componentType,
}: ComponentTitleInputProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(initialTitle || componentType || 'Component');
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [originalTitle, setOriginalTitle] = useState(initialTitle || componentType || 'Component');
  const inputRef = useRef<HTMLInputElement>(null);

  // Handle clicking on the title to edit
  const handleTitleClick = () => {
    setOriginalTitle(title); // Store original value
    setIsEditing(true);
    // Focus will be set via useEffect and ref
  };

  // Handle key events in the input field
  const handleTitleKeyDown = (e: React.KeyboardEvent) => {
    e.stopPropagation();
    if (e.key === 'Enter') {
      handleSaveTitle();
    } else if (e.key === 'Escape') {
      cancelEdit();
    }
  };

  // Cancel editing and restore original title
  const cancelEdit = () => {
    setIsEditing(false);
    setTitle(originalTitle);
  };

  // Save the updated title with confirmation if needed
  const handleSaveTitle = () => {
    if (title.trim() === '') {
      // Si el título está vacío, revertir al título original
      setTitle(originalTitle);
      setIsEditing(false);
      return;
    }

    if (title !== originalTitle) {
      // Set original title to new title
      setOriginalTitle(title);
      
      // Dispatch event to notify SectionManager
      const updateEvent = new CustomEvent('component:update-title', {
        bubbles: true,
        detail: {
          componentId,
          newTitle: title
        }
      });
      
      // First dispatch the event to update the component in SectionManager
      document.dispatchEvent(updateEvent);
    }
    
    setIsEditing(false);
    setShowConfirmDialog(false);
  };

  // Effect to focus the input when editing starts
  React.useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      // Select all text
      inputRef.current.select();
    }
  }, [isEditing]);

  return (
    <div className="w-full">
      {isEditing ? (
        <input
          ref={inputRef}
          type="text"
          className="w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 px-3 py-1"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={handleSaveTitle}
          onKeyDown={handleTitleKeyDown}
          autoFocus
        />
      ) : (
        <div
          className="cursor-pointer text-gray-800 font-medium hover:text-blue-600 truncate"
          onClick={handleTitleClick}
          title="Click to edit component title"
        >
          {title}
        </div>
      )}

      {/* Title Change Confirmation Dialog */}
      {showConfirmDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Confirm Title Change</h3>
            <p className="text-gray-600 mb-4">
              Changing a component title might affect how it&apos;s displayed. Do you want to proceed?
            </p>
            
            <div className="mb-4 bg-gray-50 p-3 rounded">
              <div className="flex items-center">
                <span className="font-medium text-gray-700 w-20">From:</span>
                <span className="text-gray-800 bg-gray-200 px-2 py-1 rounded">{originalTitle}</span>
              </div>
              <div className="flex items-center mt-2">
                <span className="font-medium text-gray-700 w-20">To:</span>
                <span className="text-gray-800 bg-blue-100 px-2 py-1 rounded">{title}</span>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3">
              <div
                onClick={() => {
                  setTitle(originalTitle);
                  setShowConfirmDialog(false);
                }}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition-colors cursor-pointer"
              >
                Cancel
              </div>
              <div
                onClick={handleSaveTitle}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors cursor-pointer"
              >
                Confirm
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 