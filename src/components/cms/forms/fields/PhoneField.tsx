'use client';

import { useState, useEffect } from 'react';
import { FormFieldBase } from '@/types/forms';
import { FieldProps, BaseFieldPreview, FieldLayout } from './FieldBase';

// Country codes data
const COUNTRY_CODES = [
  { code: 'ES', name: 'España', dialCode: '+34', flag: '🇪🇸' },
  { code: 'US', name: 'Estados Unidos', dialCode: '+1', flag: '🇺🇸' },
  { code: 'MX', name: 'México', dialCode: '+52', flag: '🇲🇽' },
  { code: 'CO', name: 'Colombia', dialCode: '+57', flag: '🇨🇴' },
  { code: 'AR', name: 'Argentina', dialCode: '+54', flag: '🇦🇷' },
  { code: 'CL', name: 'Chile', dialCode: '+56', flag: '🇨🇱' },
  { code: 'PE', name: 'Perú', dialCode: '+51', flag: '🇵🇪' },
  { code: 'VE', name: 'Venezuela', dialCode: '+58', flag: '🇻🇪' },
  { code: 'EC', name: 'Ecuador', dialCode: '+593', flag: '🇪🇨' },
  { code: 'BO', name: 'Bolivia', dialCode: '+591', flag: '🇧🇴' },
  { code: 'UY', name: 'Uruguay', dialCode: '+598', flag: '🇺🇾' },
  { code: 'PY', name: 'Paraguay', dialCode: '+595', flag: '🇵🇾' },
  { code: 'BR', name: 'Brasil', dialCode: '+55', flag: '🇧🇷' },
  { code: 'FR', name: 'Francia', dialCode: '+33', flag: '🇫🇷' },
  { code: 'DE', name: 'Alemania', dialCode: '+49', flag: '🇩🇪' },
  { code: 'IT', name: 'Italia', dialCode: '+39', flag: '🇮🇹' },
  { code: 'GB', name: 'Reino Unido', dialCode: '+44', flag: '🇬🇧' },
  { code: 'CA', name: 'Canadá', dialCode: '+1', flag: '🇨🇦' },
];

// Phone input component for actual forms
interface PhoneInputProps {
  id: string;
  name: string;
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  inputClassName?: string;
  defaultCountry?: string;
  showCountryCode?: boolean;
  format?: 'international' | 'national' | 'any';
}

export function PhoneInput({
  id,
  name,
  value = '',
  onChange,
  placeholder = '',
  required = false,
  disabled = false,
  className = '',
  inputClassName = '',
  defaultCountry = 'ES',
  showCountryCode = true,
  format = 'international'
}: PhoneInputProps) {
  const [selectedCountry, setSelectedCountry] = useState(() => {
    return COUNTRY_CODES.find(country => country.code === defaultCountry) || COUNTRY_CODES[0];
  });
  const [phoneNumber, setPhoneNumber] = useState('');

  // Parse existing value on mount
  useEffect(() => {
    if (value) {
      // Try to parse the value to extract country code and number
      const country = COUNTRY_CODES.find(c => value.startsWith(c.dialCode));
      if (country) {
        setSelectedCountry(country);
        setPhoneNumber(value.substring(country.dialCode.length).trim());
      } else {
        setPhoneNumber(value);
      }
    }
  }, [value]);

  const handleCountryChange = (countryCode: string) => {
    const country = COUNTRY_CODES.find(c => c.code === countryCode);
    if (country) {
      setSelectedCountry(country);
      const fullNumber = format === 'national' ? phoneNumber : `${country.dialCode} ${phoneNumber}`.trim();
      onChange?.(fullNumber);
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const number = e.target.value;
    setPhoneNumber(number);
    
    let fullNumber = number;
    if (format === 'international' && showCountryCode) {
      fullNumber = `${selectedCountry.dialCode} ${number}`.trim();
    }
    
    onChange?.(fullNumber);
  };

  // Use inputClassName if provided, otherwise fall back to default styling
  const baseInputClasses = inputClassName || "flex-1 px-3 py-2 border border-gray-300 rounded-r-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500";
  const countrySelectClasses = inputClassName ? 
    inputClassName.replace('rounded-md', 'rounded-l-md rounded-r-none').replace('flex-1', '').replace('w-full', '') + ' border-r-0' :
    "px-3 py-2 border border-gray-300 border-r-0 rounded-l-md bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500";

  if (!showCountryCode) {
    return (
      <input
        type="tel"
        id={id}
        name={name}
        value={phoneNumber}
        onChange={handlePhoneChange}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        className={`${inputClassName || 'w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500'} ${className}`}
      />
    );
  }

  return (
    <div className={`flex ${className}`}>
      <select
        value={selectedCountry.code}
        onChange={(e) => handleCountryChange(e.target.value)}
        disabled={disabled}
        className={countrySelectClasses}
        style={{ minWidth: '120px' }}
      >
        {COUNTRY_CODES.map((country) => (
          <option key={country.code} value={country.code}>
            {country.flag} {country.dialCode}
          </option>
        ))}
      </select>
      <input
        type="tel"
        id={id}
        name={name}
        value={phoneNumber}
        onChange={handlePhoneChange}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        className={baseInputClasses.replace('w-full', 'flex-1').replace('rounded-md', 'rounded-r-md rounded-l-none')}
      />
    </div>
  );
}

// Componente de vista previa para campos de teléfono
export function PhoneFieldPreview({ field }: { field: FormFieldBase }) {
  const showCountryCode = field.options?.showCountryCode !== false;
  const defaultCountry = (field.options?.defaultCountry as string) || 'ES';
  const format = (field.options?.format as string) || 'international';

  return (
    <BaseFieldPreview field={field}>
      <PhoneInput
        id={`preview-${field.name}`}
        name={`preview-${field.name}`}
        placeholder={field.placeholder || ''}
        disabled={true}
        defaultCountry={defaultCountry}
        showCountryCode={showCountryCode}
        format={format as 'international' | 'national' | 'any'}
        className="opacity-60"
      />
    </BaseFieldPreview>
  );
}

// Componente de edición para campos de teléfono
export function PhoneField({ field, onChange, showPreview = true }: FieldProps) {
  const [localField, setLocalField] = useState<FormFieldBase | null>(field);
  
  // Actualizar el estado local cuando cambian las propiedades
  useEffect(() => {
    setLocalField(field);
  }, [field]);
  
  if (!localField) return null;
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    const updatedField = {
      ...localField,
      [name]: value
    };
    
    setLocalField(updatedField);
    onChange(updatedField);
  };
  
  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    
    const updatedField = {
      ...localField,
      [name]: checked
    };
    
    setLocalField(updatedField);
    onChange(updatedField);
  };
  
  const handleOptionChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const newValue = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
    
    const updatedField = {
      ...localField,
      options: {
        ...localField.options,
        [name]: newValue
      }
    };
    
    setLocalField(updatedField);
    onChange(updatedField);
  };
  
  const editorContent = (
    <div className="space-y-4">
      <div>
        <label htmlFor="label" className="block text-sm font-medium text-gray-700 mb-1">
          Etiqueta del campo <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="label"
          name="label"
          value={localField.label}
          onChange={handleChange}
          className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
          placeholder="Ej: Teléfono"
        />
      </div>
      
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
          Nombre de identificación <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="name"
          name="name"
          value={localField.name}
          onChange={handleChange}
          className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
          placeholder="Ej: phone"
        />
        <p className="mt-1 text-xs text-gray-500">
          Identificador único para el campo (sin espacios ni caracteres especiales)
        </p>
      </div>
      
      <div>
        <label htmlFor="placeholder" className="block text-sm font-medium text-gray-700 mb-1">
          Placeholder
        </label>
        <input
          type="text"
          id="placeholder"
          name="placeholder"
          value={localField.placeholder || ''}
          onChange={handleChange}
          className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
          placeholder="Ej: 600 00 00 00"
        />
      </div>
      
      <div>
        <label htmlFor="helpText" className="block text-sm font-medium text-gray-700 mb-1">
          Texto de ayuda
        </label>
        <input
          type="text"
          id="helpText"
          name="helpText"
          value={localField.helpText || ''}
          onChange={handleChange}
          className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
          placeholder="Ej: Incluya el código de país"
        />
      </div>
      
      <div className="flex items-center">
        <input
          type="checkbox"
          id="isRequired"
          name="isRequired"
          checked={localField.isRequired || false}
          onChange={handleCheckboxChange}
          className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
        />
        <label htmlFor="isRequired" className="ml-2 text-sm text-gray-700">
          Campo requerido
        </label>
      </div>
      
      <div className="space-y-2">
        <label htmlFor="format" className="block text-sm font-medium text-gray-700">
          Formato de teléfono
        </label>
        <select
          id="format"
          name="format"
          value={(localField.options?.format as string) || 'international'}
          onChange={handleOptionChange}
          className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="international">Internacional (con código de país)</option>
          <option value="national">Nacional (sin código de país)</option>
          <option value="any">Cualquier formato</option>
        </select>
      </div>
      
      <div className="space-y-2">
        <label htmlFor="defaultCountry" className="block text-sm font-medium text-gray-700">
          País por defecto
        </label>
        <select
          id="defaultCountry"
          name="defaultCountry"
          value={(localField.options?.defaultCountry as string) || 'ES'}
          onChange={handleOptionChange}
          className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          {COUNTRY_CODES.map((country) => (
            <option key={country.code} value={country.code}>
              {country.flag} {country.name} ({country.dialCode})
            </option>
          ))}
        </select>
      </div>
      
      <div className="flex items-center">
        <input
          type="checkbox"
          id="showCountryCode"
          name="showCountryCode"
          checked={localField.options?.showCountryCode !== false}
          onChange={handleOptionChange}
          className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
        />
        <label htmlFor="showCountryCode" className="ml-2 text-sm text-gray-700">
          Mostrar selector de código de país
        </label>
      </div>
      
      <div>
        <label htmlFor="defaultValue" className="block text-sm font-medium text-gray-700 mb-1">
          Valor predeterminado
        </label>
        <input
          type="tel"
          id="defaultValue"
          name="defaultValue"
          value={localField.defaultValue || ''}
          onChange={handleChange}
          className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
          placeholder="Ej: +34 600 00 00 00"
        />
      </div>
      
      <div>
        <label htmlFor="width" className="block text-sm font-medium text-gray-700 mb-1">
          Ancho del campo (%)
        </label>
        <input
          type="number"
          id="width"
          name="width"
          min="25"
          max="100"
          step="25"
          value={localField.width || 100}
          onChange={handleChange}
          className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>
      
      <div className="p-4 bg-blue-50 border-l-4 border-blue-500 rounded">
        <p className="text-sm text-blue-700">
          <strong>Nota:</strong> El número de teléfono será validado según el formato seleccionado.
        </p>
      </div>
    </div>
  );
  
  if (!showPreview) {
    return editorContent;
  }
  
  return (
    <FieldLayout
      title="Campo de Teléfono"
      description="Permite al usuario introducir un número de teléfono con formato específico"
      preview={<PhoneFieldPreview field={localField} />}
      editor={editorContent}
    />
  );
} 