'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Edit3, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';
import RichTextEditor from '@/app/components/ui/rich-text-editor';
import { EditorUtils } from '@/app/components/ui/rich-text-editor/utils';

interface RichStableInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  isTextArea?: boolean;
  rows?: number;
  className?: string;
  debounceTime?: number;
  disabled?: boolean;
  maxLength?: number;
  showWordCount?: boolean;
  toolbar?: 'full' | 'basic' | 'minimal';
  enableRichText?: boolean;
  height?: string;
  'data-field-id'?: string;
  'data-component-type'?: string;
}

export const RichStableInput: React.FC<RichStableInputProps> = ({
  value: externalValue,
  onChange,
  placeholder = '',
  label,
  isTextArea = false,
  rows = 3,
  className = '',
  debounceTime = 300,
  disabled = false,
  maxLength,
  showWordCount = false,
  toolbar = 'basic',
  enableRichText = false,
  height = isTextArea ? '150px' : '40px',
  'data-field-id': fieldId,
  'data-component-type': componentType,
}) => {
  const [localValue, setLocalValue] = useState(externalValue);
  const [isEditing, setIsEditing] = useState(false);
  const [isRichMode, setIsRichMode] = useState(enableRichText);
  const [isFocused, setIsFocused] = useState(false);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const isEditingRef = useRef(false);
  const lastExternalValueRef = useRef(externalValue);

  // Actualizar valor local cuando cambia el valor externo
  useEffect(() => {
    if (!isEditingRef.current && externalValue !== lastExternalValueRef.current) {
      setLocalValue(externalValue);
      lastExternalValueRef.current = externalValue;
    }
  }, [externalValue]);

  // Manejar cambios con debounce
  const handleChange = useCallback((newValue: string) => {
    setLocalValue(newValue);
    isEditingRef.current = true;
    
    // Limpiar timeout anterior
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    
    // Configurar nuevo timeout
    debounceRef.current = setTimeout(() => {
      onChange(newValue);
      lastExternalValueRef.current = newValue;
      isEditingRef.current = false;
    }, debounceTime);
  }, [onChange, debounceTime]);

  // Manejar cambios en input/textarea normal
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    handleChange(newValue);
  }, [handleChange]);

  // Manejar cambios en Rich Text Editor
  const handleRichTextChange = useCallback((html: string) => {
    handleChange(html);
  }, [handleChange]);

  // Manejar foco
  const handleFocus = useCallback(() => {
    setIsFocused(true);
    setIsEditing(true);
    isEditingRef.current = true;
  }, []);

  // Manejar pérdida de foco
  const handleBlur = useCallback(() => {
    setIsFocused(false);
    
    // Retrasar el reset del flag de edición
    setTimeout(() => {
      setIsEditing(false);
      isEditingRef.current = false;
    }, 100);
  }, []);

  // Alternar modo rich text
  const toggleRichMode = useCallback(() => {
    if (isRichMode) {
      // Convertir de HTML a texto plano
      const plainText = EditorUtils.htmlToText(localValue);
      setLocalValue(plainText);
      handleChange(plainText);
    } else {
      // Convertir de texto plano a HTML
      const htmlText = EditorUtils.textToHTML(localValue);
      setLocalValue(htmlText);
      handleChange(htmlText);
    }
    setIsRichMode(!isRichMode);
  }, [isRichMode, localValue, handleChange]);

  // Limpiar timeout al desmontar
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  // Obtener el valor para mostrar
  const displayValue = isRichMode ? localValue : (typeof localValue === 'string' ? EditorUtils.htmlToText(localValue) : localValue);

  return (
    <div className="space-y-2">
      {/* Label y controles */}
      {(label || enableRichText) && (
        <div className="flex items-center justify-between">
          {label && (
            <label className="text-sm font-medium text-gray-700">
              {label}
            </label>
          )}
          
          {enableRichText && (
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={toggleRichMode}
                className={cn(
                  "flex items-center space-x-1 px-2 py-1 text-xs rounded transition-colors",
                  isRichMode 
                    ? "bg-blue-100 text-blue-700 hover:bg-blue-200" 
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                )}
                title={isRichMode ? "Cambiar a texto simple" : "Cambiar a texto enriquecido"}
              >
                {isRichMode ? (
                  <>
                    <Eye className="w-3 h-3" />
                    <span>Simple</span>
                  </>
                ) : (
                  <>
                    <Edit3 className="w-3 h-3" />
                    <span>Rico</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Campo de entrada */}
      <div className="relative">
        <AnimatePresence mode="wait">
          {isRichMode ? (
            // Rich Text Editor
            <motion.div
              key="rich-editor"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.2 }}
            >
              <RichTextEditor
                value={localValue}
                onChange={handleRichTextChange}
                placeholder={placeholder}
                disabled={disabled}
                maxLength={maxLength}
                showWordCount={showWordCount}
                toolbar={toolbar}
                height={height}
                onFocus={handleFocus}
                onBlur={handleBlur}
                className={cn("transition-all duration-200", className)}
              />
            </motion.div>
          ) : (
            // Input/Textarea normal
            <motion.div
              key="simple-input"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {isTextArea ? (
                <textarea
                  ref={textareaRef}
                  value={displayValue}
                  onChange={handleInputChange}
                  onFocus={handleFocus}
                  onBlur={handleBlur}
                  placeholder={placeholder}
                  disabled={disabled}
                  rows={rows}
                  maxLength={maxLength}
                  autoComplete="off"
                  spellCheck={false}
                  data-field-id={fieldId}
                  data-component-type={componentType}
                  className={cn(
                    "w-full px-3 py-2 border border-gray-300 rounded-md transition-all duration-200",
                    "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent",
                    "disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-50",
                    isFocused && "ring-2 ring-blue-500 ring-opacity-20",
                    className
                  )}
                  style={{ height: isTextArea ? height : undefined }}
                />
              ) : (
                <input
                  ref={inputRef}
                  type="text"
                  value={displayValue}
                  onChange={handleInputChange}
                  onFocus={handleFocus}
                  onBlur={handleBlur}
                  placeholder={placeholder}
                  disabled={disabled}
                  maxLength={maxLength}
                  autoComplete="off"
                  spellCheck={false}
                  data-field-id={fieldId}
                  data-component-type={componentType}
                  className={cn(
                    "w-full px-3 py-2 border border-gray-300 rounded-md transition-all duration-200",
                    "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent",
                    "disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-50",
                    isFocused && "ring-2 ring-blue-500 ring-opacity-20",
                    className
                  )}
                />
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Indicador de estado */}
        {isEditing && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full"
          />
        )}
      </div>

      {/* Contador de caracteres (solo para modo simple) */}
      {!isRichMode && maxLength && (
        <div className="flex justify-end">
          <span className={cn(
            "text-xs",
            displayValue.length > maxLength * 0.9 ? "text-orange-600" : "text-gray-500",
            displayValue.length >= maxLength && "text-red-600"
          )}>
            {displayValue.length}/{maxLength}
          </span>
        </div>
      )}
    </div>
  );
};

export default RichStableInput; 