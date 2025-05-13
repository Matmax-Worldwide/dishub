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
  sectionName?: string;
  onSectionNameChange?: (newName: string) => void;
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
  onComponentsChange,
  sectionName,
  onSectionNameChange
}, ref) => {
  // Estado local para manejar los componentes
  const [pendingComponents, setPendingComponents] = useState<Component[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState(sectionName || '');

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
            
            // Restore component title if it exists in data
            const componentTitle = comp.data?.componentTitle as string || null;
            
            return {
              id: comp.id,
              type: componentType,
              data: comp.data,
              title: componentTitle || undefined
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

  useEffect(() => {
    if (sectionName) {
      setEditedTitle(sectionName);
    }
  }, [sectionName]);

  const handleTitleClick = () => {
    if (isEditing) {
      setIsEditingTitle(true);
    }
  };

  const handleTitleSave = () => {
    setIsEditingTitle(false);
    if (onSectionNameChange && editedTitle !== sectionName) {
      onSectionNameChange(editedTitle);
      
      // Also update the section name in the database
      if (normalizedSectionId) {
        console.log(`Updating section name in database to: ${editedTitle}`);
        cmsOperations.updateSectionName(normalizedSectionId, editedTitle)
          .then(result => {
            if (result.success) {
              console.log('Section name updated in database successfully');
            } else {
              console.error('Failed to update section name in database:', result.message);
            }
          })
          .catch(error => {
            console.error('Error updating section name in database:', error);
          });
      }
    }
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleTitleSave();
    }
  };

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
        
        // Ensure component titles are preserved in the saved data
        const componentsWithTitles = componentsToSave.map(comp => {
          if (comp.title) {
            // If the component has a title, store it in the data
            return {
              ...comp,
              data: {
                ...comp.data,
                componentTitle: comp.title // Store title in data for persistence
              }
            };
          }
          return comp;
        });
        
        console.log('Saving components with titles:', componentsWithTitles);
        
        const result = await cmsOperations.saveSectionComponents(
          normalizedSectionId, 
          componentsWithTitles as unknown as CMSComponent[]
        );
        
        if (result.success) {
          setLastSaved(result.lastUpdated || new Date().toISOString());
          // Update the pending components to reflect what was saved
          setPendingComponents(componentsWithTitles);
          
          // If section name has changed, notify parent
          if (onSectionNameChange && editedTitle !== sectionName) {
            onSectionNameChange(editedTitle);
          }
          
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
  }, [normalizedSectionId, editedTitle, sectionName, onSectionNameChange]);

  // Load components - memoizado para evitar recreaciones
  const handleLoad = useCallback((loadedComponents: Component[]) => {
    setPendingComponents(loadedComponents);
  }, []);

  return (
    <div className={isEditing ? "my-6" : ""} data-section-id={normalizedSectionId}>
      {isEditing && (
        <div className="mb-4">
          {isEditingTitle ? (
            <div className="flex items-center mb-2">
              <input
                type="text"
                value={editedTitle}
                onChange={(e) => setEditedTitle(e.target.value)}
                onBlur={handleTitleSave}
                onKeyDown={handleTitleKeyDown}
                className="border border-gray-300 rounded px-2 py-1 mr-2 text-sm font-medium"
                autoFocus
              />
              <button 
                onClick={handleTitleSave}
                className="px-2 py-1 bg-blue-500 text-white text-sm rounded"
              >
                Save
              </button>
            </div>
          ) : (
            <div 
              onClick={handleTitleClick} 
              className="text-sm font-medium text-gray-700 hover:text-blue-600 cursor-pointer mb-2 inline-flex items-center"
            >
              {editedTitle || "Untitled Section"}
              <span className="ml-2 text-xs text-gray-400">(click to edit)</span>
            </div>
          )}
          <div className="h-px bg-gray-200 w-full mb-4"></div>
        </div>
      )}
      
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