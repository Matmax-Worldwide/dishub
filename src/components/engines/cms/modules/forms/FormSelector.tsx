'use client';

import { useState, useEffect } from 'react';
import graphqlClient from '@/lib/graphql-client';
import { FormBase } from '@/types/forms';
import { Search, ChevronDown, CheckCircle2 } from 'lucide-react';

interface FormSelectorProps {
  onSelect: (form: FormBase | null, event?: React.SyntheticEvent) => void;
  selectedFormId?: string;
  label?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
}

export function FormSelector({
  onSelect,
  selectedFormId,
  label = 'Select a form',
  required = false,
  disabled = false,
  className = ''
}: FormSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [forms, setForms] = useState<FormBase[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedForm, setSelectedForm] = useState<FormBase | null>(null);

  // Load forms on component mount
  useEffect(() => {
    const loadForms = async () => {
      setLoading(true);
      try {
        const formsData = await graphqlClient.getForms();
        if (Array.isArray(formsData)) {
          setForms(formsData);
        } else {
          // If we get an error or no data, provide a fallback
          console.warn('Failed to load forms data, using empty array');
          setForms([]);
        }
      } catch (error) {
        console.error('Error loading forms:', error);
        // Don't break the UI when forms can't be loaded
        setForms([]);
      } finally {
        setLoading(false);
      }
    };

    loadForms();
  }, []);

  // Find and set selected form if selectedFormId is provided
  useEffect(() => {
    if (selectedFormId && forms.length > 0) {
      const form = forms.find(f => f.id === selectedFormId) || null;
      setSelectedForm(form);
    }
  }, [selectedFormId, forms]);

  const filteredForms = searchQuery 
    ? forms.filter(form => 
        form.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
        (form.description && form.description.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : forms;

  const handleSelectForm = (form: FormBase, event?: React.SyntheticEvent) => {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    setSelectedForm(form);
    onSelect(form, event);
    setIsOpen(false);
  };

  const handleClearSelection = (event?: React.SyntheticEvent) => {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    setSelectedForm(null);
    onSelect(null, event);
  };

  // Evitar que la tecla Enter se propague y cause un envío del formulario
  const handleKeyDown = (e: React.KeyboardEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  // Manejar cambio en el input de búsqueda
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    // Evitar propagación del evento para prevenir envío del formulario
    e.preventDefault();
    e.stopPropagation();
  };

  return (
    <div 
      className={`form-selector relative ${className}`} 
      onKeyDown={handleKeyDown}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }} // Prevent click events from propagating up
    >
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <div className="relative">
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault(); // Evitar envío de formulario si el botón está dentro de un form
            e.stopPropagation();
            if (!disabled) setIsOpen(!isOpen);
          }}
          className={`w-full flex items-center justify-between p-2.5 text-left border border-gray-300 rounded-md bg-white ${
            disabled ? 'bg-gray-100 cursor-not-allowed' : 'hover:border-gray-400'
          }`}
          disabled={disabled}
        >
          <span className={selectedForm ? 'text-gray-900' : 'text-gray-500'}>
            {selectedForm ? selectedForm.title : 'Select a form...'}
          </span>
          <ChevronDown className={`h-4 w-4 text-gray-500 ${isOpen ? 'transform rotate-180' : ''}`} />
        </button>
        
        {selectedForm && !disabled && (
          <button
            type="button"
                          onClick={(e) => {
                e.preventDefault(); // Evitar envío de formulario
                e.stopPropagation();
                handleClearSelection(e);
              }}
            className="absolute right-10 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <span className="sr-only">Clear selection</span>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
            </svg>
          </button>
        )}
        
        {isOpen && (
          <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg">
            {/* Search input */}
            <div className="p-2 border-b border-gray-200">
              <div className="relative">
                <Search className="h-4 w-4 absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search forms..."
                  className="w-full pl-8 pr-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  value={searchQuery}
                  onChange={handleSearchChange}
                  onKeyDown={handleKeyDown}
                  onClick={(e) => e.stopPropagation()} // Prevent click from reaching other components
                />
              </div>
            </div>
            
            {/* Forms list */}
            <div className="max-h-60 overflow-y-auto">
              {loading ? (
                <div className="p-4 text-center text-gray-500">Loading forms...</div>
              ) : filteredForms.length > 0 ? (
                <ul className="py-1">
                  {filteredForms.map(form => (
                    <li 
                      key={form.id}
                      onClick={(e) => {
                        e.preventDefault(); // Evitar envío de formulario
                        e.stopPropagation();
                        handleSelectForm(form, e);
                      }}
                      className={`px-3 py-2 cursor-pointer flex items-center justify-between hover:bg-gray-100 ${
                        selectedForm?.id === form.id ? 'bg-blue-50' : ''
                      }`}
                    >
                      <div>
                        <div className="font-medium text-gray-900">{form.title}</div>
                        {form.description && (
                          <div className="text-xs text-gray-500 truncate">{form.description}</div>
                        )}
                      </div>
                      {selectedForm?.id === form.id && (
                        <CheckCircle2 className="h-4 w-4 text-blue-600" />
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="p-4 text-center text-gray-500">
                  No forms match your search criteria.
                </div>
              )}
            </div>
            
            {/* Create new form link */}
            <div className="p-2 border-t border-gray-200">
              <a 
                href="/cms/forms/create" 
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full text-center text-xs text-blue-600 hover:text-blue-800 hover:underline"
                onClick={(e) => e.stopPropagation()} // Evitar propagación
              >
                + Create a new form
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 