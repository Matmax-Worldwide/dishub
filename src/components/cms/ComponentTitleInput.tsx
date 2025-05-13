'use client';

import React, { useState, useRef } from 'react';
import { cmsOperations } from '@/lib/graphql-client';

// Type definition for component types
type ComponentType = 'Hero' | 'Text' | 'Image' | 'Feature' | 'Testimonial' | 'Header' | 'Card' | 'Benefit';

interface ComponentTitleInputProps {
  componentId: string;
  initialTitle: string | undefined;
  componentType: string;
  onRemove: (id: string) => void;
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
      handleTitleSave();
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
  const handleTitleSave = () => {
    setIsEditing(false);
    
    // Only show confirmation dialog if the title is actually changing from a previous value
    if (title !== originalTitle && originalTitle && originalTitle !== componentType) {
      setShowConfirmDialog(true);
    } else {
      // Apply the change without confirmation if it's a new component or minor change
      applyTitleChange();
    }
  };

  // Apply the title change after confirmation
  const applyTitleChange = () => {
    // Find the section ID - look for it in the parent context or ID
    const sectionId = document.querySelector('[data-section-id]')?.getAttribute('data-section-id');
    
    if (sectionId && componentId) {
      console.log(`Updating component title in database: ${originalTitle} → ${title}`);
      
      cmsOperations.updateComponentTitle(sectionId, componentId, title)
        .then(result => {
          if (result.success) {
            console.log('Component title updated in database successfully');
          } else {
            console.error('Failed to update component title in database:', result.message);
          }
        })
        .catch(error => {
          console.error('Error updating component title in database:', error);
        });
    } else {
      console.warn('Could not find section ID to update component title');
    }
    
    // Use CustomEvent to update the component title without removing it
    if (componentId) {
      // Get the component from the DOM
      const componentElement = document.querySelector(`[data-component-id="${componentId}"]`);
      
      if (componentElement) {
        // Get all component data attributes
        const componentData = componentElement.getAttributeNames()
          .filter(attr => attr.startsWith('data-'))
          .reduce((acc, attr) => {
            acc[attr.replace('data-', '')] = componentElement.getAttribute(attr);
            return acc;
          }, {} as Record<string, string | null>);
          
        // Create a component object
        const component = {
          id: componentId,
          type: componentType as ComponentType,
          data: {
            ...componentData,
            componentTitle: title
          },
          title: title
        };
        
        // Instead of removing and re-adding, just update the component in place
        document.dispatchEvent(new CustomEvent('component:update-title', { 
          detail: { 
            componentId,
            newTitle: title,
            component
          }
        }));
      }
    }
    
    // Close confirmation dialog if open
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
          onBlur={handleTitleSave}
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
                onClick={applyTitleChange}
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