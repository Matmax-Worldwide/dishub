'use client';

import { useState, useCallback, memo } from 'react';
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

// Componente botón memoizado
const MemoButton = memo(function Button({ 
  onClick, 
  disabled, 
  className, 
  children 
}: { 
  onClick: () => void;
  disabled?: boolean;
  className: string;
  children: React.ReactNode;
}) {
  return (
    <button 
      onClick={onClick}
      disabled={disabled}
      className={className}
    >
      {children}
    </button>
  );
});

function AdminControlsBase({ 
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

  // Save current state - memoizado para estabilidad de referencia
  const saveState = useCallback(async () => {
    if (isSaving) return; // Prevent multiple save operations
    
    setIsSaving(true);
    setErrorMsg(null);
    
    try {
      // Log what we're saving for debugging
      console.log(`AdminControls: Saving ${components.length} components for section: ${sectionId}`);
      
      // Then save to the server via GraphQL
      const result = await cmsOperations.saveSectionComponents(
        sectionId,
        components as unknown as CMSComponent[]
      );
      
      if (result?.success) {
        // Update the last saved time
        setLastSavedTime(result.lastUpdated || null);
        console.log('AdminControls: Components saved successfully at:', result.lastUpdated);
        
        // Now call the onSave handler to update the parent component
        onSave(components);
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
  }, [isSaving, components, sectionId, onSave]);

  // Load components from the server - memoizado para estabilidad de referencia
  const loadComponents = useCallback(async () => {
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
  }, [sectionId, onLoad]);

  // Format date for display
  const formatDate = useCallback((dateString: string) => {
    try {
      return new Date(dateString).toLocaleString();
    } catch {
      return dateString;
    }
  }, []);

  // Clases para los botones
  const saveButtonClass = useCallback(() => {
    return `px-3 py-1.5 rounded text-sm ${
      isLoading || isSaving
        ? 'bg-blue-300 text-blue-100 cursor-not-allowed'
        : 'bg-blue-500 text-white hover:bg-blue-600'
    }`;
  }, [isLoading, isSaving]);

  const loadButtonClass = useCallback(() => {
    return `px-3 py-1.5 rounded text-sm ${
      isLoading
        ? 'bg-green-300 text-green-100 cursor-not-allowed'
        : 'bg-green-500 text-white hover:bg-green-600'
    }`;
  }, [isLoading]);

  return (
    <div className="flex flex-col gap-3 p-4 bg-gray-100 rounded-lg mb-4">
      <div className="flex flex-wrap gap-2">
        <MemoButton 
          onClick={saveState}
          disabled={isLoading || isSaving}
          className={saveButtonClass()}
        >
          {isSaving ? 'Guardando...' : 'Guardar Sección'}
        </MemoButton>
        
        <MemoButton 
          onClick={loadComponents}
          disabled={isLoading}
          className={loadButtonClass()}
        >
          {isLoading ? 'Cargando...' : 'Cargar Última Versión'}
        </MemoButton>
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

// Exportar componente memoizado para evitar re-renderizaciones innecesarias
export default memo(AdminControlsBase); 