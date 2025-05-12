'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';

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
}

/**
 * Un componente de input que mantiene su propio estado local y solo notifica
 * al componente padre cuando es necesario, evitando así pérdidas de foco
 * durante la edición en componentes CMS.
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
  debounceTime = 500
}: StableInputProps) {
  // Estado local para mantener el valor durante la edición
  const [localValue, setLocalValue] = useState(value);
  
  // Referencia para mantener el timeout de debounce
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  
  // Referencia al elemento input/textarea
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);
  
  // Actualizar el estado local cuando cambie el prop value (solo si es diferente)
  useEffect(() => {
    if (value !== localValue && !inputRef.current?.matches(':focus')) {
      setLocalValue(value);
    }
  }, [value]);
  
  // Manejar cambios en el input con debounce para notificar al padre
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    
    // Actualizar el estado local inmediatamente para mantener el input responsive
    setLocalValue(newValue);
    
    // Limpiar timeout anterior si existe
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    
    // Establecer nuevo timeout para notificar al padre solo después del tiempo de debounce
    debounceRef.current = setTimeout(() => {
      onChange(newValue);
    }, debounceTime);
  }, [onChange, debounceTime]);
  
  // Limpiar el timeout al desmontar el componente
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);
  
  // Renderizar un textarea o un input según la configuración
  const renderInput = () => {
    const commonProps = {
      value: localValue,
      onChange: handleChange,
      placeholder,
      className: `w-full p-2 border border-blue-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${className}`,
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
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}
      {renderInput()}
    </div>
  );
} 