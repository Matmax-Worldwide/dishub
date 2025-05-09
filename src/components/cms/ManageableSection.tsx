'use client';

import React, { useState, useEffect, useImperativeHandle, forwardRef } from 'react';
import { cmsOperations, CMSComponent } from '@/lib/graphql-client';
import SectionManager, { Component } from './SectionManager';
import AdminControls from './AdminControls';

// ComponentType type is compatible with SectionManager's ComponentType
// The string union in SectionManager is more restrictive
// We'll ensure compatibility through proper type handling

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
  // Track changes between original and pending components
  const [hasChanges, setHasChanges] = useState(false);

  // Validate and normalize the section ID
  const normalizedSectionId = sectionId;

  // Expose saveChanges method to parent component
  useImperativeHandle(ref, () => ({
    saveChanges: async () => {
      // Devolver la promesa para que el componente padre pueda manejar el resultado
      return handleSave(pendingComponents);
    }
  }));

  // Fetch section components
  useEffect(() => {
    const loadComponents = async () => {
      // Identificador único para esta operación de carga
      const loadId = `load-${Math.random().toString(36).substring(2, 9)}`;
      
      console.log(`⏳ [${loadId}] INICIO CARGA de componentes para sección '${normalizedSectionId}'`);
      console.log(`🔍 [${loadId}] ID de sección original: '${sectionId}', normalizado: '${normalizedSectionId}'`);
      
      setIsLoading(true);
      setError(null);
      
      try {
        // Add a timestamp to avoid caching
        const timestamp = Date.now();
        console.log(`🔍 [${loadId}] Solicitando componentes con timestamp anti-caché: ${timestamp}`);
        console.log(`🔍 [${loadId}] URL efectiva para getSectionComponents: '${normalizedSectionId}?t=${timestamp}'`);
        
        console.log(`⏳ [${loadId}] Enviando solicitud a getSectionComponents...`);
        const result = await cmsOperations.getSectionComponents(`${normalizedSectionId}?t=${timestamp}`);
        
        // 🔍 DEBUG: Add more detailed logging to find the issue
        console.log(`🔍 [${loadId}] DEBUG: Full components response:`, JSON.stringify(result, null, 2));
        
        // Registrar información de diagnóstico sobre la respuesta
        if (result && Array.isArray(result.components)) {
          console.log(`⚙️ [${loadId}] Received ${result.components.length} components`);
          
          // Map the components to SectionManager format, ensuring type compatibility
          const mappedComponents = result.components.map((comp) => {
            // Ensure the component type is one of the allowed types in the ComponentType
            let componentType = comp.type;
            if (!['Hero', 'Text', 'Image', 'Feature', 'Testimonial', 'Header', 'Card'].includes(componentType)) {
              console.warn(`⚠️ [${loadId}] Component type "${componentType}" not recognized, using "Text" as fallback`);
              componentType = 'Text';
            }
            
            return {
              id: comp.id,
              type: componentType,
              data: comp.data
            } as Component;
          });
          
          console.log(`⚙️ [${loadId}] Mapped components:`, mappedComponents);
          setComponents(mappedComponents);
          setPendingComponents(mappedComponents);
          
          // No changes initially
          setHasChanges(false);
        } else {
          console.warn(`⚙️ [${loadId}] No components or invalid result:`, result);
          // Initialize with empty array to avoid undefined issues
          setComponents([]);
          setPendingComponents([]);
          setHasChanges(false);
        }
      } catch (error) {
        console.error(`❌ [${loadId}] Error fetching components:`, error);
        setError(error instanceof Error ? error.message : 'Unknown error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    loadComponents();
  }, [sectionId]);

  // Handle component changes
  const handleComponentsChange = (newComponents: Component[]) => {
    // Siempre imprimir información de depuración sobre los componentes
    console.log('Componentes actuales:', pendingComponents.length, 'Nuevos componentes:', newComponents.length);
    
    // Calcular si hay un cambio real comparando los arrays
    const currentJson = JSON.stringify(pendingComponents);
    const newJson = JSON.stringify(newComponents);
    const hasRealChanges = currentJson !== newJson;
    
    // Update the hasChanges state
    setHasChanges(hasRealChanges);
    
    // Si hay cambios, o los arrays tienen longitudes diferentes (añadido/eliminado), actualizar
    if (hasRealChanges || pendingComponents.length !== newComponents.length) {
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
          setHasChanges(false);
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
    setHasChanges(false);
  };

  // Log rendering state for debugging
  console.log('Rendering SectionManager with:', {
    componentCount: components.length,
    pendingComponentCount: pendingComponents.length,
    isEditing,
    isLoading,
    hasUnsavedChanges: hasChanges,
    hasError: !!error
  });

  return (
    <div className={isEditing ? "my-6" : ""}>
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