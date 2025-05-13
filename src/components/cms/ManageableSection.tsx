'use client';

import React, { useState, useEffect, useImperativeHandle, forwardRef, useCallback, memo, useRef } from 'react';
import { cmsOperations, CMSComponent } from '@/lib/graphql-client';
import SectionManager, { Component } from './SectionManager';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { SaveIcon, ArrowUpIcon, ArrowDownIcon, Eye } from 'lucide-react';

// ComponentType type is compatible with SectionManager's ComponentType
// The string union in SectionManager is more restrictive
// We'll ensure compatibility through proper type handling

interface ManageableSectionProps {
  sectionId: string;
  isEditing?: boolean;
  onComponentsChange?: () => void;
  sectionName?: string;
  onSectionNameChange?: (newName: string) => void;
}

// Definir la interfaz para el handle del ref
interface ManageableSectionHandle {
  saveChanges: () => Promise<void>;
}

const ManageableSection = forwardRef<ManageableSectionHandle, ManageableSectionProps>(({
  sectionId,
  isEditing = false,
  onComponentsChange,
  sectionName,
  onSectionNameChange
}, ref) => {
  // Estado local para manejar los componentes
  const [pendingComponents, setPendingComponents] = useState<Component[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState(sectionName || '');
  const [isSaving, setIsSaving] = useState(false);
  // Estado para manejar modo de visualización
  const [viewMode, setViewMode] = useState<'split' | 'edit' | 'preview'>('split');
  // Track if there are unsaved changes
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  // Reference to track component change debounce timeout
  const componentChangeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  // Reference to track when we're editing to prevent focus loss
  const isEditingComponentRef = useRef(false);

  // Configure DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Validate and normalize the section ID
  const normalizedSectionId = sectionId;

  // Add beforeunload event handler for unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        const message = "You have unsaved changes. Are you sure you want to leave?";
        e.preventDefault();
        e.returnValue = message;
        return message;
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

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
        
        // Log más detallado antes de la carga
        console.log(`⏳ [${loadId}] Solicitando componentes para sección: ${normalizedSectionId}?t=${timestamp}`);
        
        const result = await cmsOperations.getSectionComponents(`${normalizedSectionId}?t=${timestamp}`);
        
        console.log(`✅ [${loadId}] Respuesta recibida:`, result);
        
        if (result && Array.isArray(result.components)) {
          if (result.components.length === 0) {
            console.warn(`⚠️ [${loadId}] La sección existe pero no tiene componentes. Verificar si se guardaron correctamente.`);
          } else {
            console.log(`✅ [${loadId}] Se encontraron ${result.components.length} componentes.`);
          }
          
          // Map the components to SectionManager format, ensuring type compatibility
          const mappedComponents = result.components.map((comp) => {
            // Ensure the component type is one of the allowed types in the ComponentType
            // Primero convertimos a formato de título (primera letra mayúscula)
            let componentType = comp.type.charAt(0).toUpperCase() + comp.type.slice(1);
            if (!['Hero', 'Text', 'Image', 'Feature', 'Testimonial', 'Header', 'Card'].includes(componentType)) {
              console.warn(`⚠️ [${loadId}] Tipo de componente no reconocido: ${comp.type}, usando 'Text' como valor predeterminado`);
              componentType = 'Text';
            } else {
              console.log(`✅ [${loadId}] Tipo de componente reconocido: ${comp.type} -> ${componentType}`);
            }
            
            // Restore component title if it exists in data
            const componentTitle = comp.data?.componentTitle as string || null;
            
            const mappedComponent = {
              id: comp.id,
              type: componentType as 'Hero' | 'Text' | 'Image' | 'Feature' | 'Testimonial' | 'Header' | 'Card', // Tipo específico
              data: comp.data || {},
              title: componentTitle || undefined
            } as Component;
            
            console.log(`✅ [${loadId}] Componente mapeado:`, {
              id: mappedComponent.id,
              type: mappedComponent.type,
              title: mappedComponent.title || componentTitle
            });
            
            return mappedComponent;
          });
          
          console.log(`✅ [${loadId}] Componentes mapeados:`, mappedComponents.length);
          setPendingComponents(mappedComponents);
        } else {
          // Initialize with empty array to avoid undefined issues
          console.warn(`⚠️ [${loadId}] No se recibieron componentes válidos. Inicializando con array vacío.`);
          setPendingComponents([]);
        }
      } catch (error) {
        console.error(`❌ [${loadId}] Error fetching components:`, error);
        setError(error instanceof Error ? error.message : 'Unknown error occurred');
      } finally {
        setIsLoading(false);
        console.log(`⏳ [${loadId}] FINALIZADA CARGA de componentes para sección '${normalizedSectionId}'`);
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
    // Mark that we're editing to prevent focus loss
    isEditingComponentRef.current = true;
    
    // Update the local components state immediately for live preview
    // Use a functional update to avoid stale closures
    setPendingComponents(prevComponents => {
      // Skip update if components haven't actually changed
      if (JSON.stringify(prevComponents) === JSON.stringify(newComponents)) {
        return prevComponents;
      }
      
      // Mark that we have unsaved changes
      if (hasUnsavedChanges === false) {
        setTimeout(() => setHasUnsavedChanges(true), 0);
      }
      
      // Return new components
      return newComponents;
    });
    
    // Notificar al componente padre sobre los cambios solo si se proporciona un callback
    if (onComponentsChange) {
      // Usar un debounce largo para evitar muchas actualizaciones
      if (componentChangeTimeoutRef.current) {
        clearTimeout(componentChangeTimeoutRef.current);
      }
      
      componentChangeTimeoutRef.current = setTimeout(() => {
        onComponentsChange();
        // Reset editing flag after updating parent
        setTimeout(() => {
          isEditingComponentRef.current = false;
        }, 300);
      }, 500); // Retraso importante para evitar actualizaciones frecuentes mientras se edita
    }
  }, [onComponentsChange, hasUnsavedChanges]);
  
  // Clean up timeouts when component unmounts
  useEffect(() => {
    return () => {
      if (componentChangeTimeoutRef.current) {
        clearTimeout(componentChangeTimeoutRef.current);
      }
    };
  }, []);

  // Save components to the server - memoizado para evitar recreaciones
  const handleSave = useCallback(async (componentsToSave: Component[]): Promise<void> => {
    return new Promise<void>(async (resolve, reject) => {
      try {
        setIsLoading(true);
        setIsSaving(true);
        
        // Log de diagnóstico
        console.log(`[ManageableSection] Iniciando guardado de ${componentsToSave.length} componentes para sección: ${normalizedSectionId}`);
        console.log(`[ManageableSection] Tipos de componentes:`, componentsToSave.map(c => c.type));
        
        // Ensure component titles are preserved in the saved data
        const componentsWithTitles = componentsToSave.map(comp => {
          // Preparamos los datos para guardar pero sin modificar el tipo original
          // que debe mantenerse como ComponentType
          return {
            ...comp,
            data: {
              ...comp.data,
              componentTitle: comp.title || comp.data?.componentTitle || 'Componente sin título' // Store title in data for persistence
            }
          };
        });
        
        // Log de los componentes preparados
        componentsWithTitles.forEach(comp => {
          console.log(`[ManageableSection] Componente preparado:`, {
            id: comp.id,
            type: comp.type,
            title: comp.data.componentTitle
          });
        });
        
        // Verificación de componentes antes de enviar
        if (componentsWithTitles.length === 0) {
          console.warn('[ManageableSection] Advertencia: Intentando guardar 0 componentes');
        }
        
        console.log('[ManageableSection] Enviando componentes al servidor...');
        
        // Para el API, convertimos los tipos a minúsculas según sea necesario
        // y eliminamos el campo title directo, ya que está dentro de data
        const componentsForAPI = componentsWithTitles.map(comp => {
          // Pick only the fields that the API expects
          const { id, type, data } = comp;
          return {
            id,
            type: type.toLowerCase(), // Convertir a minúsculas solo para la API
            data
          };
        });
        
        // Llamada a la API para guardar
        const result = await cmsOperations.saveSectionComponents(
          normalizedSectionId, 
          componentsForAPI as unknown as CMSComponent[]
        );
        
        console.log('[ManageableSection] Resultado del guardado:', result);
        
        if (result.success) {
          console.log('[ManageableSection] Guardado exitoso. Última actualización:', result.lastUpdated);
          // Update the pending components to reflect what was saved - preservando el tipo ComponentType
          setPendingComponents(componentsWithTitles);
          
          // Reset unsaved changes flag
          setHasUnsavedChanges(false);
          
          // If section name has changed, notify parent
          if (onSectionNameChange && editedTitle !== sectionName) {
            console.log(`[ManageableSection] Actualizando nombre de sección de "${sectionName}" a "${editedTitle}"`);
            onSectionNameChange(editedTitle);
          }
          
          resolve();
        } else {
          console.error('[ManageableSection] Error de servidor al guardar:', result.message);
          setError(result.message || 'Failed to save components');
          reject(new Error(result.message || 'Failed to save components'));
        }
      } catch (error) {
        console.error('[ManageableSection] Error de excepción al guardar:', error);
        setError(error instanceof Error ? error.message : 'Unknown error occurred');
        reject(error);
      } finally {
        setIsLoading(false);
        setIsSaving(false);
      }
    });
  }, [normalizedSectionId, editedTitle, sectionName, onSectionNameChange]);

  // Move component down in the list
  const moveComponentDown = useCallback((componentId: string) => {
    setPendingComponents((items) => {
      const index = items.findIndex((item) => item.id === componentId);
      if (index < 0 || index >= items.length - 1) return items;
      
      // Move component without reloading
      const newArray = arrayMove(items, index, index + 1);
      
      // Mark that we have unsaved changes
      setHasUnsavedChanges(true);
      
      return newArray;
    });
  }, []);

  // Function to toggle view mode
  const toggleViewMode = useCallback((mode: 'split' | 'edit' | 'preview') => {
    setViewMode(mode);
  }, []);

  // Move component up in the list
  const moveComponentUp = useCallback((componentId: string) => {
    setPendingComponents((items) => {
      const index = items.findIndex((item) => item.id === componentId);
      if (index <= 0) return items;
      
      // Move component without reloading
      const newArray = arrayMove(items, index, index - 1);
      
      // Mark that we have unsaved changes
      setHasUnsavedChanges(true);
      
      return newArray;
    });
  }, []);

  // Override SectionManager to add drag handles and positioning buttons
  const SectionManagerWithDrag = useCallback(({ 
    initialComponents, 
    isEditing, 
    onComponentsChange 
  }: { 
    initialComponents: Component[],
    isEditing: boolean,
    onComponentsChange?: (components: Component[]) => void
  }) => {
    // Enhance SectionManager with draggable components
    const componentIds = initialComponents.map(c => c.id);

    return (
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={(event) => {
          const { active, over } = event;
          if (over && active.id !== over.id) {
            const oldIndex = initialComponents.findIndex(item => item.id === active.id);
            const newIndex = initialComponents.findIndex(item => item.id === over.id);
            
            if (oldIndex !== -1 && newIndex !== -1) {
              const newComponents = arrayMove([...initialComponents], oldIndex, newIndex);
              if (onComponentsChange) {
                onComponentsChange(newComponents);
              }
            }
          }
        }}
      >
        <SortableContext
          items={componentIds}
          strategy={verticalListSortingStrategy}
        >
          <SectionManager
            initialComponents={initialComponents}
            isEditing={isEditing}
            onComponentsChange={onComponentsChange}
          />
          
          {/* Floatable controls for reordering when in edit mode */}
          {isEditing && (
            <div className="component-reorder-controls">
              {initialComponents.map((component, index) => (
                <div 
                  key={component.id}
                  className="flex items-center justify-end space-x-1 p-1 -mt-7 mb-8 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                  data-component-id={component.id}
                >
                  <button
                    onClick={() => moveComponentUp(component.id)}
                    disabled={index === 0}
                    className="p-1 bg-background border border-border rounded-sm hover:bg-accent/10 disabled:opacity-30 disabled:hover:bg-background"
                    title="Move component up"
                  >
                    <ArrowUpIcon className="h-3 w-3" />
                  </button>
                  <button
                    onClick={() => moveComponentDown(component.id)}
                    disabled={index === initialComponents.length - 1}
                    className="p-1 bg-background border border-border rounded-sm hover:bg-accent/10 disabled:opacity-30 disabled:hover:bg-background"
                    title="Move component down"
                  >
                    <ArrowDownIcon className="h-3 w-3" />
                  </button>
                  <div className="component-drag-handle cursor-move p-1 bg-background border border-border rounded-sm hover:bg-accent/10 ml-1">
                    <svg viewBox="0 0 20 20" width="12" height="12" className="text-muted-foreground">
                      <path d="M7 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 2zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 14zm6-8a2 2 0 1 0-.001-4.001A2 2 0 0 0 13 6zm0 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 14z"></path>
                    </svg>
                  </div>
                </div>
              ))}
            </div>
          )}
        </SortableContext>
      </DndContext>
    );
  }, [sensors, moveComponentUp, moveComponentDown]);

  // Memoizamos el SectionManager para optimizar el rendimiento en modo de vista previa
  const MemoizedPreviewSectionManager = memo(function PreviewSectionManager({
    components
  }: {
    components: Component[];
  }) {
    return (
      <SectionManager
        initialComponents={components}
        isEditing={false}
        onComponentsChange={undefined}
      />
    );
  }, (prevProps, nextProps) => {
    // Realizar comparación superficial que evite re-renderizados innecesarios
    // Retornar true previene el re-renderizado
    const currentJson = JSON.stringify(prevProps.components);
    const nextJson = JSON.stringify(nextProps.components);
    
    // Solo re-renderizar si realmente cambian los componentes
    return currentJson === nextJson;
  });

  return (
    <div className="my-6" data-section-id={normalizedSectionId}>
      {isEditing && (
        <div className="mb-4">
          <div className="flex justify-between items-center">
            <div className="flex-1">
              {isEditingTitle ? (
                <div className="flex items-center mb-2">
                  <input
                    type="text"
                    value={editedTitle}
                    onChange={(e) => setEditedTitle(e.target.value)}
                    onBlur={handleTitleSave}
                    onKeyDown={handleTitleKeyDown}
                    className="border border-input rounded-md px-3 py-1 mr-2 text-sm font-medium w-full focus:outline-none focus:ring-1 focus:ring-ring"
                    autoFocus
                  />
                  <button 
                    onClick={handleTitleSave}
                    className="px-3 py-1 bg-muted text-muted-foreground text-sm rounded-md hover:bg-muted/80 transition-colors"
                  >
                    Save
                  </button>
                </div>
              ) : (
                <div 
                  onClick={handleTitleClick} 
                  className="text-lg font-medium text-foreground hover:text-accent-foreground cursor-pointer mb-2 inline-flex items-center"
                >
                  {editedTitle || "Untitled Section"}
                  <span className="ml-2 text-xs text-muted-foreground">(click to edit)</span>
                </div>
              )}
            </div>
            
            {/* View mode toggle buttons */}
            <div className="flex items-center space-x-1">
              <button
                onClick={() => toggleViewMode('edit')}
                className={`px-3 py-1 text-xs rounded-l-md border ${
                  viewMode === 'edit' 
                    ? 'bg-accent text-accent-foreground border-accent' 
                    : 'bg-background text-muted-foreground border-border hover:bg-muted/30'
                }`}
              >
                Editor
              </button>
              <button
                onClick={() => toggleViewMode('split')}
                className={`px-3 py-1 text-xs border-t border-b ${
                  viewMode === 'split' 
                    ? 'bg-accent text-accent-foreground border-accent' 
                    : 'bg-background text-muted-foreground border-border hover:bg-muted/30'
                }`}
              >
                Split
              </button>
              <button
                onClick={() => toggleViewMode('preview')}
                className={`px-3 py-1 text-xs rounded-r-md border ${
                  viewMode === 'preview' 
                    ? 'bg-accent text-accent-foreground border-accent' 
                    : 'bg-background text-muted-foreground border-border hover:bg-muted/30'
                }`}
              >
                Preview
              </button>
            </div>
          </div>
          <div className="h-px bg-border w-full mt-2 mb-4"></div>
        </div>
      )}
      
      {isEditing && (
        <div className="flex items-center justify-between mb-4">
          {/* Removed AdminControls which had redundant save functionality */}
          {/* Save button directly in the component */}
          <button
            onClick={() => handleSave(pendingComponents)}
            disabled={isLoading || isSaving}
            className={`flex items-center space-x-1 px-3 py-1 rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50 text-xs ml-auto ${
              hasUnsavedChanges 
                ? 'bg-amber-500 text-amber-950' 
                : 'bg-primary text-primary-foreground'
            }`}
          >
            <SaveIcon className="h-3 w-3" />
            <span>{isSaving ? 'Guardando...' : hasUnsavedChanges ? 'Guardar*' : 'Guardar'}</span>
          </button>
        </div>
      )}
      
      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">
          <div className="animate-spin h-8 w-8 border-4 border-muted border-t-foreground/30 rounded-full mx-auto mb-3"></div>
          <p>Loading section content...</p>
        </div>
      ) : error && !isLoading ? (
        <div className="text-center py-4 text-muted-foreground bg-muted/20 rounded-md border border-border">
          Error: {error}
        </div>
      ) : (
        <>
          {/* Split view or single view based on mode */}
          <div className={`${viewMode === 'split' ? 'grid grid-cols-2 gap-6' : 'block'}`}>
            {/* Edit Panel - Show in edit or split mode */}
            {(viewMode === 'edit' || viewMode === 'split') && (
              <div className={`${viewMode === 'split' ? 'border-r pr-5 border-border/50' : ''}`}>
                {viewMode === 'split' && (
                  <div className="mb-4 text-sm font-medium text-muted-foreground pb-2 border-b border-border/50">Editor</div>
                )}
                <SectionManagerWithDrag
                  initialComponents={pendingComponents}
                  isEditing={true}
                  onComponentsChange={handleComponentsChange}
                />
              </div>
            )}
            
            {/* Preview Panel - Show in preview or split mode */}
            {(viewMode === 'preview' || viewMode === 'split') && (
              <div>
                {viewMode === 'split' && (
                  <div className="mb-4 flex items-center justify-between text-sm font-medium text-foreground pb-2 border-b border-border">
                    <div className="flex items-center">
                      <Eye className="w-4 h-4 mr-2 text-muted-foreground" />
                      Vista Previa
                    </div>
                    <div className="text-xs px-2 py-0.5 bg-muted/30 rounded-full text-muted-foreground">
                      Visualización final
                    </div>
                  </div>
                )}
                
                {/* Browser-like container for preview */}
                <div className={`${viewMode === 'split' ? 'pl-1' : ''}`}>
                  <div className="bg-white rounded-md border-2 border-muted/40 shadow-sm overflow-hidden">
                    {/* Browser header */}
                    <div className="bg-muted/20 border-b border-muted/30 px-3 py-2 flex items-center">
                      <div className="flex space-x-1.5 mr-3">
                        <div className="w-3 h-3 rounded-full bg-red-400/60"></div>
                        <div className="w-3 h-3 rounded-full bg-amber-400/60"></div>
                        <div className="w-3 h-3 rounded-full bg-green-400/60"></div>
                      </div>
                      <div className="flex-1 bg-background/80 text-xs text-center py-1 px-3 rounded-full truncate text-muted-foreground">
                        Vista previa de página
                      </div>
                    </div>
                    
                    {/* Page preview content */}
                    <div className="p-4 bg-white">
                      <MemoizedPreviewSectionManager 
                        components={pendingComponents}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
});

// Add display name for better debugging
ManageableSection.displayName = 'ManageableSection';

// Exportar con memo para evitar re-renderizaciones innecesarias
export default memo(ManageableSection); 