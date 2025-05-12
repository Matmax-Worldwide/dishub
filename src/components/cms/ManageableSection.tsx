'use client';

import React, { useState, useEffect, useImperativeHandle, forwardRef, useCallback, memo } from 'react';
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

// AdminControls memoizado para evitar re-renders
const MemoizedAdminControls = memo(AdminControls);

const ManageableSection = forwardRef<ManageableSectionHandle, ManageableSectionProps>(({
  sectionId,
  isEditing = false,
  autoSave = true,
  onComponentsChange
}, ref) => {
  // Estado local para manejar los componentes
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
  }), [pendingComponents]);

  // Fetch section components
  useEffect(() => {
    const loadComponents = async () => {
      // Identificador único para esta operación de carga
      const loadId = `load-${Math.random().toString(36).substring(2, 9)}`;
      
      console.log(`⏳ [${loadId}] INICIO CARGA de componentes para sección '${normalizedSectionId}'`);
      
      setIsLoading(true);
      setError(null);
      
      try {
        // Add a timestamp to avoid caching
        const timestamp = Date.now();
        const result = await cmsOperations.getSectionComponents(`${normalizedSectionId}?t=${timestamp}`);
        
        if (result && Array.isArray(result.components)) {
          // Map the components to SectionManager format, ensuring type compatibility
          const mappedComponents = result.components.map((comp) => {
            // Ensure the component type is one of the allowed types in the ComponentType
            let componentType = comp.type;
            if (!['Hero', 'Text', 'Image', 'Feature', 'Testimonial', 'Header', 'Card'].includes(componentType)) {
              componentType = 'Text';
            }
            
            return {
              id: comp.id,
              type: componentType,
              data: comp.data
            } as Component;
          });
          
          setPendingComponents(mappedComponents);
        } else {
          // Initialize with empty array to avoid undefined issues
          setPendingComponents([]);
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

  // Memoizar la función handleComponentsChange para evitar recreaciones
  const handleComponentsChange = useCallback((newComponents: Component[]) => {
    // Calcular si hay un cambio real comparando los arrays
    const currentJson = JSON.stringify(pendingComponents);
    const newJson = JSON.stringify(newComponents);
    const hasRealChanges = currentJson !== newJson;
    
    // Si hay cambios, o los arrays tienen longitudes diferentes, actualizar sin re-renderizaciones innecesarias
    if (hasRealChanges || pendingComponents.length !== newComponents.length) {
      setPendingComponents(newComponents);
      
      // Notificar al componente padre sobre los cambios solo si se proporciona un callback
      if (onComponentsChange) {
        // Usar setTimeout para evitar actualizaciones en cascada que causan pérdida de foco
        setTimeout(() => {
          onComponentsChange();
        }, 0);
      }
      
      // Si autoSave está habilitado, guardar los cambios con un debounce para evitar llamadas frecuentes
      if (autoSave) {
        // Usar setTimeout para debounce básico y evitar guardar durante la edición
        const timeoutId = setTimeout(() => {
          handleSave(newComponents);
        }, 2000); // 2 segundos de debounce
        
        return () => clearTimeout(timeoutId);
      }
    }
  }, [pendingComponents, autoSave, onComponentsChange]);

  // Save components to the server - memoizado para evitar recreaciones
  const handleSave = useCallback(async (componentsToSave: Component[]): Promise<void> => {
    return new Promise<void>(async (resolve, reject) => {
      try {
        setIsLoading(true);
        const result = await cmsOperations.saveSectionComponents(
          normalizedSectionId, 
          componentsToSave as unknown as CMSComponent[]
        );
        
        if (result.success) {
          setLastSaved(result.lastUpdated || new Date().toISOString());
          // Update the pending components to reflect what was saved
          setPendingComponents(componentsToSave);
          resolve();
        } else {
          setError(result.message || 'Failed to save components');
          reject(new Error(result.message || 'Failed to save components'));
        }
      } catch (error) {
        setError(error instanceof Error ? error.message : 'Unknown error occurred');
        reject(error);
      } finally {
        setIsLoading(false);
      }
    });
  }, [normalizedSectionId]);

  // Load components - memoizado para evitar recreaciones
  const handleLoad = useCallback((loadedComponents: Component[]) => {
    setPendingComponents(loadedComponents);
  }, []);

  return (
    <div className={isEditing ? "my-6" : ""}>
      {isEditing && autoSave && (
        <MemoizedAdminControls
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
        initialComponents={pendingComponents}
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

// Exportar con memo para evitar re-renderizaciones innecesarias
export default memo(ManageableSection); 