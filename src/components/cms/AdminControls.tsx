'use client';

import { useState } from 'react';
import { Component } from './SectionManager';
import { cmsOperations, CMSComponent } from '@/lib/graphql-client';

interface AdminControlsProps {
  components: Component[];
  onSave: (components: Component[]) => void;
  onLoad: (components: Component[]) => void;
  sectionId?: string;
  isLoading?: boolean;
  lastSaved?: string | null;
  error?: string | null;
}

export default function AdminControls({ 
  components, 
  onSave, 
  onLoad,
  sectionId = 'cms-managed-sections',
  isLoading: initialIsLoading = false,
  lastSaved = null,
  error = null
}: AdminControlsProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(initialIsLoading);
  const [errorMsg, setErrorMsg] = useState<string | null>(error);
  const [lastSavedTime, setLastSavedTime] = useState<string | null>(lastSaved);

  // Save current state
  const saveState = async () => {
    setIsSaving(true);
    setErrorMsg(null);
    
    try {
      // First call the local onSave handler to update UI
      onSave(components);
      
      // Log what we're saving for debugging
      console.log(`Saving ${components.length} components for section: ${sectionId}`);
      
      // Then save to the server via GraphQL
      const result = await cmsOperations.saveSectionComponents(
        sectionId,
        components as unknown as CMSComponent[]
      );
      
      if (result?.success) {
        setLastSavedTime(result.lastUpdated || null);
        console.log('Components saved successfully at:', result.lastUpdated);
      } else {
        throw new Error(result.message || 'Unknown error');
      }
      
      // Show success message temporarily
      const successMessage = document.createElement('div');
      successMessage.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded shadow-lg z-50';
      successMessage.textContent = 'Componentes guardados correctamente';
      document.body.appendChild(successMessage);
      
      // Remove success message after 3 seconds
      setTimeout(() => {
        document.body.removeChild(successMessage);
      }, 3000);
      
    } catch (error) {
      console.error('Error saving components:', error);
      setErrorMsg(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setIsSaving(false);
    }
  };

  // Load components from the server
  const loadComponents = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    
    try {
      const result = await cmsOperations.getSectionComponents(sectionId);
      if (result && result.components) {
        onLoad(result.components as unknown as Component[]);
        setLastSavedTime(result.lastUpdated);
      }
    } catch (error) {
      console.error('Error loading components:', error);
      setErrorMsg(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleString();
    } catch {
      return dateString;
    }
  };

  return (
    <div className="flex flex-col gap-3 p-4 bg-gray-100 rounded-lg mb-4">
      <div className="flex flex-wrap gap-2">
        <button 
          onClick={saveState}
          disabled={isLoading || isSaving}
          className={`px-3 py-1.5 rounded text-sm ${
            isLoading || isSaving
              ? 'bg-blue-300 text-blue-100 cursor-not-allowed'
              : 'bg-blue-500 text-white hover:bg-blue-600'
          }`}
        >
          {isSaving ? 'Guardando...' : 'Guardar Sección'}
        </button>
        <button 
          onClick={loadComponents}
          disabled={isLoading}
          className={`px-3 py-1.5 rounded text-sm ${
            isLoading
              ? 'bg-green-300 text-green-100 cursor-not-allowed'
              : 'bg-green-500 text-white hover:bg-green-600'
          }`}
        >
          {isLoading ? 'Cargando...' : 'Cargar Última Versión'}
        </button>
      </div>
      
      {errorMsg && (
        <div className="text-xs text-red-500 p-2 bg-red-50 rounded">
          Error: {errorMsg}
        </div>
      )}
      
      {lastSavedTime && (
        <div className="text-xs text-gray-500">
          Última actualización: {formatDate(lastSavedTime)}
        </div>
      )}
    </div>
  );
} 