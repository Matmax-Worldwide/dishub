'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { cn } from '@/lib/utils';

interface StableInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  isTextArea?: boolean;
  rows?: number;
  multiline?: boolean;
  label?: string;
  debounceTime?: number;
  disabled?: boolean;
  'data-field-id'?: string;
  'data-component-type'?: string;
}

/**
 * A input component that maintains its own local state and only notifies
 * the parent component when necessary, avoiding focus loss
 * during editing in CMS components.
 */
export default function StableInput({
  value,
  onChange,
  placeholder = '',
  className = '',
  isTextArea = false,
  rows = 3,
  multiline = false,
  label,
  debounceTime = 500,
  disabled = false,
  'data-field-id': fieldId,
  'data-component-type': componentType
}: StableInputProps) {
  // Local state to maintain value during editing
  const [localValue, setLocalValue] = useState(value);
  
  // Reference to maintain debounce timeout
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  
  // Reference to input/textarea element
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);
  
  // Reference to track if we're currently editing
  const isEditingRef = useRef(false);
  
  // Flag to know if the component has mounted
  const hasMountedRef = useRef(false);
  
  // Update local state when prop value changes (only if different and not editing)
  useEffect(() => {
    // Skip the first update to avoid unexpected behavior
    if (!hasMountedRef.current) {
      hasMountedRef.current = true;
      return;
    }
    
    // Only update if we're not actively editing AND the value actually changed
    if (!isEditingRef.current && value !== localValue) {
      setLocalValue(value);
    }
  }, [value, localValue]);
  
  // Handle input changes with debounce to notify parent
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    // Stop propagation to prevent parent form triggers
    e.stopPropagation();
    
    const newValue = e.target.value;
    
    // Mark that we're editing
    isEditingRef.current = true;
    
    // Update local state immediately to keep input responsive
    setLocalValue(newValue);
    
    // Clear previous timeout if exists
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    
    // Set new timeout to notify parent only after debounce time
    debounceRef.current = setTimeout(() => {
      onChange(newValue);
    }, debounceTime);
  }, [onChange, debounceTime]);

  // Handle keydown to ensure special key combinations work and prevent form submission
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    // Prevent enter key from submitting the form
    if (e.key === 'Enter' && !isTextArea) {
      e.preventDefault();
    }
    
    // Stop propagation for all key events
    e.stopPropagation();
    
    // Mark that we're editing
    isEditingRef.current = true;
  }, [isTextArea]);
  
  // Handle focus events
  const handleFocus = useCallback(() => {
    isEditingRef.current = true;
    
    // Ensure input is selected on focus
    if (inputRef.current) {
      // Use requestAnimationFrame to ensure the selection happens after focus
      requestAnimationFrame(() => {
        if (inputRef.current) {
          // Only try to set selection for text inputs and textareas
          const inputType = inputRef.current.getAttribute('type');
          const isSelectable = !inputType || ['text', 'textarea', 'email', 'password', 'tel', 'url'].includes(inputType);
          
          if (isSelectable) {
            // For textareas, position cursor at end
            if (isTextArea && inputRef.current instanceof HTMLTextAreaElement) {
              const length = inputRef.current.value.length;
              inputRef.current.setSelectionRange(length, length);
            }
          }
        }
      });
    }
  }, [isTextArea]);
  
  const handleBlur = useCallback(() => {
    // Reset editing state only when user completely leaves the input
    setTimeout(() => {
      isEditingRef.current = false;
    }, 300);
  }, []);
  
  // Stop all event propagation
  const stopAllPropagation = useCallback((e: React.SyntheticEvent) => {
    e.stopPropagation();
  }, []);
  
  // Render textarea or input based on configuration
  const renderInput = () => {
    const commonProps = {
      value: localValue,
      onChange: handleChange,
      onKeyDown: handleKeyDown,
      onFocus: handleFocus,
      onBlur: handleBlur,
      placeholder,
      disabled,
      'data-field-id': fieldId,
      'data-component-type': componentType,
      className: cn(
        "w-full px-3 py-2 bg-background border border-input rounded-md",
        "focus:outline-none focus:ring-2 focus:ring-ring focus:border-input",
        "placeholder:text-muted-foreground text-foreground",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className
      ),
    };
    
    if (isTextArea || multiline) {
      return (
        <textarea
          ref={inputRef as React.RefObject<HTMLTextAreaElement>}
          rows={rows}
          {...commonProps}
        />
      );
    }
    
    return (
      <input
        ref={inputRef as React.RefObject<HTMLInputElement>}
        type="text"
        {...commonProps}
      />
    );
  };
  
  return (
    <div 
      className="w-full isolate" 
      onClick={stopAllPropagation}
      onMouseDown={stopAllPropagation}
      onPointerDown={stopAllPropagation}
    >
      {label && (
        <label 
          className="block text-sm font-medium mb-2 text-foreground"
          onClick={stopAllPropagation}
        >
          {label}
        </label>
      )}
      {renderInput()}
    </div>
  );
} 