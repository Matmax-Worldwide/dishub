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
  disabled = false
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
      // Leave editing mode active briefly to prevent immediate prop updates
      setTimeout(() => {
        isEditingRef.current = false;
      }, 300);
    }, debounceTime);
  }, [onChange, debounceTime]);
  
  // Handle focus events
  const handleFocus = useCallback(() => {
    isEditingRef.current = true;
    
    // Ensure input is selected on focus
    if (inputRef.current) {
      // Use requestAnimationFrame to ensure the selection happens after focus
      requestAnimationFrame(() => {
        if (inputRef.current) {
          // Select all text for easier editing
          // inputRef.current.select(); // For inputs
          // For textareas, position cursor at end
          if (isTextArea && inputRef.current instanceof HTMLTextAreaElement) {
            const length = inputRef.current.value.length;
            inputRef.current.setSelectionRange(length, length);
          }
        }
      });
    }
  }, [isTextArea]);
  
  const handleBlur = useCallback(() => {
    // Small delay before considering editing complete
    // This prevents immediate state updates when clicking within the field
    setTimeout(() => {
      isEditingRef.current = false;
    }, 200);
  }, []);
  
  // Stop propagation of clicks to prevent parent components from rerendering
  const handleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    isEditingRef.current = true; // Mark as editing on click
  }, []);
  
  // Clear timeout when component unmounts
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);
  
  // Render textarea or input based on configuration
  const renderInput = () => {
    const commonProps = {
      value: localValue,
      onChange: handleChange,
      onFocus: handleFocus,
      onBlur: handleBlur,
      onClick: handleClick,
      placeholder,
      disabled,
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
    <div className="w-full" onClick={handleClick}>
      {label && (
        <label className="block text-sm font-medium mb-2 text-foreground">
          {label}
        </label>
      )}
      {renderInput()}
    </div>
  );
} 