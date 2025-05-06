'use client';

import React, { useState, useEffect, useImperativeHandle, forwardRef } from 'react';
import { cmsOperations, CMSComponent } from '@/lib/graphql-client';
import SectionManager, { Component } from './SectionManager';
import AdminControls from './AdminControls';

interface ManageableSectionProps {
  sectionId: string;
  isEditing?: boolean;
  autoSave?: boolean;
  onComponentsChange?: () => void;
}

// Definir la interfaz para el handle del ref
interface ManageableSectionHandle {
  saveChanges: () => Promise<void>;
}

const ManageableSection = forwardRef<ManageableSectionHandle, ManageableSectionProps>(({
  sectionId,
  isEditing = false,
  autoSave = true,
  onComponentsChange
}, ref) => {
  const [components, setComponents] = useState<Component[]>([]);
  const [pendingComponents, setPendingComponents] = useState<Component[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastSaved, setLastSaved] = useState<string | null>(null);

  // Validate and normalize the section ID
  const normalizedSectionId = sectionId;

  // Expose saveChanges method to parent component
  useImperativeHandle(ref, () => ({
    saveChanges: async () => {
      // Devolver la promesa para que el componente padre pueda manejar el resultado
      return handleSave(pendingComponents);
    }
  }));

  // Load components on initial render
  useEffect(() => {
    const loadComponents = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        console.log(`Loading components for section ${normalizedSectionId}...`);
        console.log(`Original section ID: ${sectionId}, Normalized: ${normalizedSectionId}`);
        
        // Add a timestamp to avoid caching
        const timestamp = new Date().getTime();
        const result = await cmsOperations.getSectionComponents(`${normalizedSectionId}?t=${timestamp}`);
        
        if (result && result.components && Array.isArray(result.components)) {
          console.log(`Loaded ${result.components.length} components from section ${normalizedSectionId}`);
          const loadedComponents = result.components as unknown as Component[];
          setComponents(loadedComponents);
          setPendingComponents(loadedComponents);
          setLastSaved(result.lastUpdated || null);
        } else {
          console.warn(`No components found for section ${normalizedSectionId}`);
          setComponents([]);
          setPendingComponents([]);
        }
      } catch (error) {
        console.error(`Error loading components for section ${normalizedSectionId}:`, error);
        setError(error instanceof Error ? error.message : 'Unknown error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    loadComponents();
  }, [normalizedSectionId, sectionId]);

  // Handle component changes
  const handleComponentsChange = (newComponents: Component[]) => {
    // Siempre imprimir información de depuración sobre los componentes
    console.log('Componentes actuales:', pendingComponents.length, 'Nuevos componentes:', newComponents.length);
    
    // Calcular si hay un cambio real comparando los arrays
    const currentJson = JSON.stringify(pendingComponents);
    const newJson = JSON.stringify(newComponents);
    const hasChanges = currentJson !== newJson;
    
    // Si hay cambios, o los arrays tienen longitudes diferentes (añadido/eliminado), actualizar
    if (hasChanges || pendingComponents.length !== newComponents.length) {
      console.log('Componentes cambiados en ManageableSection, actualizando estado');
      setPendingComponents(newComponents);
      
      // Notificar al componente padre sobre los cambios si se proporcionó un callback
      if (onComponentsChange) {
        console.log('Notificando al padre sobre cambios en componentes');
        onComponentsChange();
      }
      
      // Si autoSave está habilitado, guardar los cambios inmediatamente
      if (autoSave) {
        handleSave(newComponents);
      }
    } else {
      console.log('Los componentes no han cambiado, omitiendo actualización');
    }
  };

  // Save components to the server
  const handleSave = async (componentsToSave: Component[]): Promise<void> => {
    return new Promise<void>(async (resolve, reject) => {
      try {
        console.log(`Saving ${componentsToSave.length} components to section ${normalizedSectionId}`);
        console.log('Components to save:', componentsToSave.map(c => `${c.id} (${c.type})`));
        
        setIsLoading(true);
        const result = await cmsOperations.saveSectionComponents(
          normalizedSectionId, 
          componentsToSave as unknown as CMSComponent[]
        );
        
        if (result.success) {
          console.log('Components saved successfully:', result);
          setLastSaved(result.lastUpdated || new Date().toISOString());
          // Update the components state to reflect what was saved
          setComponents(componentsToSave);
          setIsLoading(false);
          resolve();
        } else {
          console.error('Failed to save components:', result.message);
          setError(result.message || 'Failed to save components');
          setIsLoading(false);
          reject(new Error(result.message || 'Failed to save components'));
        }
      } catch (error) {
        console.error('Error saving components:', error);
        setError(error instanceof Error ? error.message : 'Unknown error occurred');
        setIsLoading(false);
        reject(error);
      }
    });
  };

  // Load components
  const handleLoad = (loadedComponents: Component[]) => {
    setComponents(loadedComponents);
    setPendingComponents(loadedComponents);
  };

  // Log rendering state for debugging
  console.log('Rendering SectionManager with:', {
    componentCount: components.length,
    pendingComponentCount: pendingComponents.length,
    isEditing,
    isLoading,
    hasUnsavedChanges: JSON.stringify(components) !== JSON.stringify(pendingComponents),
    hasError: !!error
  });

  return (
    <div className="my-6">
      {isEditing && autoSave && (
        <AdminControls
          components={pendingComponents}
          onSave={handleSave}
          onLoad={handleLoad}
          sectionId={normalizedSectionId}
          isLoading={isLoading}
          lastSaved={lastSaved}
          error={error}
        />
      )}
      
      <SectionManager
        initialComponents={autoSave ? pendingComponents : components}
        isEditing={isEditing}
        onComponentsChange={handleComponentsChange}
      />
      
      {isLoading && (
        <div className="text-center py-8 text-gray-500">
          Loading section content...
        </div>
      )}
      
      {error && !isLoading && (
        <div className="text-center py-4 text-red-500 bg-red-50 rounded">
          Error: {error}
        </div>
      )}
    </div>
  );
});

// Add display name for better debugging
ManageableSection.displayName = 'ManageableSection';

export default ManageableSection; 