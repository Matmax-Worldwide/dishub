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
  const inputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  // Reference to track if we're currently editing
  const isEditingRef = useRef(false);
  
  // Reference to track if we have focus
  const hasFocusRef = useRef(false);
  
  // Flag to know if the component has mounted
  const hasMountedRef = useRef(false);
  
  // Track the last external value to avoid unnecessary updates
  const lastExternalValueRef = useRef(value);
  
  // Update local state when prop value changes (only if different and not editing)
  useEffect(() => {
    // Skip the first update to avoid unexpected behavior
    if (!hasMountedRef.current) {
      hasMountedRef.current = true;
      lastExternalValueRef.current = value;
      return;
    }
    
    // Only update if:
    // 1. We're not actively editing
    // 2. We don't have focus
    // 3. The value actually changed from the last external value
    // 4. The new value is different from our local value
    if (!isEditingRef.current && 
        !hasFocusRef.current && 
        value !== lastExternalValueRef.current && 
        value !== localValue) {
      setLocalValue(value);
      lastExternalValueRef.current = value;
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
      // Don't reset editing flag here - let blur handle it
    }, debounceTime);
  }, [onChange, debounceTime]);

  // Handle keydown to ensure special key combinations work and prevent form submission
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    // Prevent enter key from submitting the form
    if (e.key === 'Enter' && !isTextArea && !multiline) {
      e.preventDefault();
    }
    
    // Stop propagation for all key events
    e.stopPropagation();
    
    // Mark that we're editing
    isEditingRef.current = true;
  }, [isTextArea, multiline]);
  
  // Handle focus events
  const handleFocus = useCallback((e: React.FocusEvent) => {
    e.stopPropagation();
    
    isEditingRef.current = true;
    hasFocusRef.current = true;
    
    // Ensure input is selected on focus
    const currentElement = (isTextArea || multiline) ? textareaRef.current : inputRef.current;
    if (currentElement) {
      // Use requestAnimationFrame to ensure the selection happens after focus
      requestAnimationFrame(() => {
        if (currentElement && hasFocusRef.current) {
          // For textareas, position cursor at end
          if ((isTextArea || multiline) && currentElement instanceof HTMLTextAreaElement) {
            const length = currentElement.value.length;
            currentElement.setSelectionRange(length, length);
          }
        }
      });
    }
  }, [isTextArea, multiline]);
  
  const handleBlur = useCallback((e: React.FocusEvent) => {
    e.stopPropagation();
    
    hasFocusRef.current = false;
    
    // Reset editing state after a delay to ensure any pending changes are processed
    setTimeout(() => {
      if (!hasFocusRef.current) {
        isEditingRef.current = false;
      }
    }, 100);
  }, []);
  
  // Stop all event propagation
  const stopAllPropagation = useCallback((e: React.SyntheticEvent) => {
    e.stopPropagation();
  }, []);
  
  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);
  
  // Render textarea or input based on configuration
  const renderInput = () => {
    const baseProps = {
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
      // Prevent the input from losing focus due to parent re-renders
      autoComplete: "off" as const,
      spellCheck: false,
    };
    
    if (isTextArea || multiline) {
      return (
        <textarea
          ref={textareaRef}
          rows={rows}
          {...baseProps}
        />
      );
    }
    
    return (
      <input
        ref={inputRef}
        type="text"
        {...baseProps}
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