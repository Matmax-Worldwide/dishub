'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import RichTextEditor from '@/components/ui/rich-text-editor';

interface RichStableInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  className?: string;
  disabled?: boolean;
  maxLength?: number;
  showWordCount?: boolean;
  toolbar?: 'full' | 'basic' | 'minimal';
  height?: string;
}

export const RichStableInput: React.FC<RichStableInputProps> = ({
  value: externalValue,
  onChange,
  placeholder = '',
  label,
  className = '',
  disabled = false,
  maxLength,
  showWordCount = false,
  toolbar = 'basic',
  height = '80px',
}) => {
  const [localValue, setLocalValue] = useState(externalValue);
  const [isEditing, setIsEditing] = useState(false);
  
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

  // Manejar cambios con debounce optimizado
  const handleChange = useCallback((newValue: string) => {
    setLocalValue(newValue);
    isEditingRef.current = true;
    
    // Limpiar timeout anterior
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    
    // Configurar nuevo timeout con tiempo más largo para mejor estabilidad
    debounceRef.current = setTimeout(() => {
      // Solo llamar onChange si el valor realmente cambió
      if (newValue !== lastExternalValueRef.current) {
        onChange(newValue);
        lastExternalValueRef.current = newValue;
      }
      isEditingRef.current = false;
    }, 1000); // Aumentado a 1 segundo para mejor estabilidad
  }, [onChange]);

  // Manejar cambios en Rich Text Editor
  const handleRichTextChange = useCallback((html: string) => {
    // Evitar cambios si el valor es el mismo
    if (html === localValue) {
      return;
    }
    handleChange(html);
  }, [handleChange, localValue]);

  // Manejar foco
  const handleFocus = useCallback(() => {
    setIsEditing(true);
    isEditingRef.current = true;
  }, []);

  // Manejar pérdida de foco
  const handleBlur = useCallback(() => {
    setIsEditing(false);
    isEditingRef.current = false;
  }, []);

  // Limpiar timeout al desmontar
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  return (
    <div className="space-y-2">
      {/* Label */}
      {label && (
        <label className="text-sm font-medium text-gray-700">
          {label}
        </label>
      )}

      {/* Rich Text Editor siempre activo */}
      <div className="relative">
        <motion.div
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
          className="rich-text-input-wrapper"
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
            className={cn(
              "transition-all duration-200 border-gray-300 focus-within:border-blue-500",
              "rich-text-simple-mode", // Clase especial para estilos más simples
              className
            )}
          />
        </motion.div>

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
    </div>
  );
};

export default RichStableInput; 