'use client';

import React, { useState, useEffect, useImperativeHandle, forwardRef, useCallback, memo, useRef } from 'react';
import { cmsOperations } from '@/lib/graphql-client';
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
import { ArrowUpIcon, ArrowDownIcon, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';

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
  saveChanges: (skipLoadingState?: boolean) => Promise<void>;
}

const ManageableSection = forwardRef<ManageableSectionHandle, ManageableSectionProps>(({
  sectionId,
  isEditing = false,
  onComponentsChange,
  sectionName,
  onSectionNameChange,
}, ref) => {
  // Estado local para manejar los componentes
  const [pendingComponents, setPendingComponents] = useState<Component[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState(sectionName || '');
  // Estado para manejar modo de visualización
  const [viewMode, setViewMode] = useState<'split' | 'edit' | 'preview'>('split');
  // Track if there are unsaved changes
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  // Track device preview mode (desktop or mobile)
  const [devicePreview, setDevicePreview] = useState<'desktop' | 'mobile'>('desktop');
  // Track active component in viewport
  const [activeComponentId, setActiveComponentId] = useState<string | null>(null);
  // Reference to track component change debounce timeout
  const componentChangeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  // Reference to track when we're editing to prevent focus loss
  const isEditingComponentRef = useRef(false);
  // Reference to the preview container
  const previewContainerRef = useRef<HTMLDivElement>(null);
  // Track error message
  const [errorMessage, setErrorMessage] = useState<string>('');
 // Estado para gestionar componentes colapsados
  const [collapsedComponents, setCollapsedComponents] = useState<Record<string, boolean>>({});

  // Configure DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      // Adding activation constraints to prevent accidental drags
      activationConstraint: {
        // Only activate after a delay (helps prevent accidental drags during editing)
        delay: 250,
        // Require a minimum distance to start dragging (helps prevent accidental drags during clicks)
        tolerance: 5,
      }
    }),
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
    saveChanges: async (skipLoadingState = false) => {
      // Devolver la promesa para que el componente padre pueda manejar el resultado
      return handleSave(pendingComponents, skipLoadingState);
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
            if (!['Hero', 'Text', 'Image', 'Feature', 'Testimonial', 'Header', 'Card', 'Benefit'].includes(componentType)) {
              console.warn(`⚠️ [${loadId}] Tipo de componente no reconocido: ${comp.type}, usando 'Text' como valor predeterminado`);
              componentType = 'Text';
            } else {
              console.log(`✅ [${loadId}] Tipo de componente reconocido: ${comp.type} -> ${componentType}`);
            }
            
            // Restore component title if it exists in data
            const componentTitle = comp.data?.componentTitle as string || null;
            
            // Store this in the component data if it exists
            if (componentTitle) {
              comp.data = { ...comp.data, componentTitle };
            }
            
            const mappedComponent = {
              id: comp.id,
              type: componentType as 'Hero' | 'Text' | 'Image' | 'Feature' | 'Testimonial' | 'Header' | 'Card' | 'Benefit', // Tipo específico
              data: comp.data || {},
            } as Component;
            
            console.log(`✅ [${loadId}] Componente mapeado:`, {
              id: mappedComponent.id,
              type: mappedComponent.type,
              title: mappedComponent.data.componentTitle
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
        // Use a debounce here to prevent immediate API calls during typing
        if (componentChangeTimeoutRef.current) {
          clearTimeout(componentChangeTimeoutRef.current);
        }
        
        componentChangeTimeoutRef.current = setTimeout(() => {
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
        }, 500);
      }
    }
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault(); // Prevent default to avoid form submission
      handleTitleSave();
    } else if (e.key === 'Escape') {
      // Cancel editing and revert to previous title
      setIsEditingTitle(false);
      setEditedTitle(sectionName || '');
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
      
      // Only mark that we have unsaved changes when debounced changes happen
      // This prevents marking changes during active typing
      if (componentChangeTimeoutRef.current) {
        clearTimeout(componentChangeTimeoutRef.current);
      }
      
      componentChangeTimeoutRef.current = setTimeout(() => {
        setHasUnsavedChanges(true);
      }, 1000); // Longer debounce for unsaved changes flag
      
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
        // Don't reset editing flag immediately after updating parent
        // This preserves focus during typing
        setTimeout(() => {
          if (!document.activeElement || 
              !document.activeElement.tagName || 
              !['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) {
          isEditingComponentRef.current = false;
          }
        }, 500);
      }, 800); // Increased from 500ms to 800ms to reduce interruptions
    }
  }, [onComponentsChange]);
  
  // Clean up timeouts when component unmounts
  useEffect(() => {
    return () => {
      if (componentChangeTimeoutRef.current) {
        clearTimeout(componentChangeTimeoutRef.current);
      }
    };
  }, []);

  // Save components to the server - memoizado para evitar recreaciones
  const handleSave = useCallback(async (componentsToSave: Component[], skipLoadingState = false): Promise<void> => {
    return new Promise<void>(async (resolve, reject) => {
      try {
        // Store current active element to restore focus after save
        const activeElement = document.activeElement as HTMLElement;
        const activeElementId = activeElement?.id || '';
        const activeElementSelector = activeElement?.tagName && activeElement.tagName.toLowerCase() !== 'body' 
          ? `${activeElement.tagName.toLowerCase()}${activeElement.id ? `#${activeElement.id}` : ''}`
          : '';
        
        // Only show loading state if not skipped
        if (!skipLoadingState) {
          setIsLoading(true);
        }
        
        // Before saving, ensure all component titles are preserved in their data
        const componentsWithTitles = componentsToSave.map(comp => {
          // Create a new object to avoid reference issues
          const processedComponent = { ...comp };
          
          // Create/update the data field if it doesn't exist
          if (!processedComponent.data) {
            processedComponent.data = {};
          }
          
          // Make sure the component title is in the data
          if (processedComponent.data.componentTitle) {
            // If componentTitle already exists, keep it
            processedComponent.data.componentTitle = processedComponent.data.componentTitle;
          }
          
          return processedComponent;
        });
        
        console.log(`Saving ${componentsWithTitles.length} components for section ${sectionId}`);
          
        // Guardar los componentes en la API
        const result = await cmsOperations.saveSectionComponents(
          sectionId, 
          componentsWithTitles
        );
        
        console.log('Save result:', result);
        
        // Actualizar el estado solo si la operación fue exitosa
        if (result.success) {
          // Marcar como que ya no hay cambios sin guardar
          setHasUnsavedChanges(false);
        }
        
        // Restaurar focus al elemento que lo tenía antes de guardar
        setTimeout(() => {
          try {
            const elementToFocus = activeElementId
              ? document.getElementById(activeElementId)
              : document.querySelector(activeElementSelector);
              
            if (elementToFocus && 'focus' in elementToFocus) {
              // Check input type before focusing to avoid selection issues with color inputs
              const inputElement = elementToFocus as HTMLInputElement;
              if (inputElement.tagName === 'INPUT' && 
                  ['color', 'checkbox', 'radio', 'range', 'file', 'submit', 'button', 'reset'].includes(inputElement.type)) {
                // For inputs that don't support selection, just focus
                inputElement.focus();
              } else if (inputElement.tagName === 'INPUT' || inputElement.tagName === 'TEXTAREA') {
                // For text-like inputs, restore cursor position if it was stored
                inputElement.focus();
                
                // Try to restore selection if the element supports it
                const selectionStart = inputElement.getAttribute('data-selection-start');
                const selectionEnd = inputElement.getAttribute('data-selection-end');
                
                if (selectionStart && selectionEnd && 'setSelectionRange' in inputElement) {
                  try {
                    // Only apply selection if the input type supports it
                    const inputType = inputElement.getAttribute('type');
                    const isSelectable = !inputType || ['text', 'textarea', 'email', 'password', 'tel', 'url', 'search', 'number'].includes(inputType);
                    
                    if (isSelectable) {
                      inputElement.setSelectionRange(parseInt(selectionStart), parseInt(selectionEnd));
                    }
                  } catch (selectionError) {
                    console.warn('Could not restore selection:', selectionError);
                  }
                }
              } else {
                // Other focusable elements
                (elementToFocus as HTMLElement).focus();
              }
            }
          } catch (focusError) {
            console.warn('Error restoring focus:', focusError);
          }
        }, 0);
        
        // Desactivar estado de carga
        setIsLoading(false);
          
          resolve();
      } catch (error) {
        console.error('Error al guardar sección:', error);
        setIsLoading(false);
        setErrorMessage('Error al guardar la sección. Por favor intenta de nuevo.');
        setTimeout(() => setErrorMessage(''), 5000);
        reject(error);
      }
    });
  }, [sectionId]);

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

   // Function to render badges and indicators for component status
   const renderComponentBadges = useCallback((component: Component) => {
    const badges = [];
    
    // Add badge for new component
    if (component.id.includes('temp-')) {
      badges.push(
        <span key="new" className="text-xs px-1.5 py-0.5 bg-green-100 text-green-800 rounded-full mr-1">
          Nuevo
        </span>
      );
    }
    
    // Add badge if component has been modified
    if (hasUnsavedChanges) {
      badges.push(
        <span key="modified" className="text-xs px-1.5 py-0.5 bg-amber-100 text-amber-800 rounded-full">
          Modificado
        </span>
      );
    }
    
    return badges.length > 0 ? <div className="flex ml-2 items-center">{badges}</div> : null;
  }, [hasUnsavedChanges]);

  // Handle adding a new component
  const handleAddComponent = useCallback(() => {
    // Generate a unique id using timestamp
    const newId = `temp-${Date.now()}`;
    
    // Create a new Text component as default
    const newComponent: Component = {
      id: newId,
      type: 'Text',
      data: {
        componentTitle: 'Nuevo componente de texto',
        content: 'Edita este contenido...'
      }
    };
    
    // Add to pending components
    setPendingComponents(prev => [...prev, newComponent]);
    
    // Scroll to the new component after rendering
    setTimeout(() => {
      const newComponentElement = document.querySelector(`[data-component-id="${newId}"]`);
      if (newComponentElement) {
        newComponentElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        
        // Set as active and expanded
        setActiveComponentId(newId);
        setCollapsedComponents(prev => ({
          ...prev,
          [newId]: false
        }));
        
        // Add pulse animation temporarily
        newComponentElement.classList.add('pulse-animation');
        setTimeout(() => {
          newComponentElement.classList.remove('pulse-animation');
        }, 3000);
      }
    }, 100);
    
    // Mark changes
    setHasUnsavedChanges(true);
  }, []);

  // Render empty state when no components are available
  const renderEmptyState = useCallback(() => {
    return (
      <div className="border border-dashed border-muted-foreground/30 rounded-md p-6 text-center">
        <div className="flex flex-col items-center justify-center space-y-3">
          <div className="bg-muted rounded-full p-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium">No hay componentes</h3>
          <p className="text-muted-foreground text-sm">
            Esta sección aún no tiene componentes. Añade uno para empezar.
          </p>
          <button
            onClick={handleAddComponent}
            className="px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded-md transition-colors mt-2"
          >
            Añadir componente
          </button>
        </div>
      </div>
    );
  }, [handleAddComponent]);


  // Add scroll observer to detect which component is in view
  useEffect(() => {
    if (viewMode !== 'split' || !previewContainerRef.current || pendingComponents.length === 0) {
      return;
    }

    const previewContainer = previewContainerRef.current;
    
    // Create IntersectionObserver to detect which component is in view
    const observer = new IntersectionObserver(
      (entries) => {
        // Find entries that are intersecting and get the one with highest ratio
        const visibleEntries = entries.filter(entry => entry.isIntersecting);
        
        if (visibleEntries.length > 0) {
          // Sort by intersection ratio to find the most visible element
          visibleEntries.sort((a, b) => b.intersectionRatio - a.intersectionRatio);
          const mostVisibleEntry = visibleEntries[0];
          
          const componentId = mostVisibleEntry.target.getAttribute('data-component-id');
          if (componentId) {
            setActiveComponentId(componentId);
            
          }
        }
      },
      {
        root: previewContainer,
        rootMargin: '0px',
        threshold: [0, 0.25, 0.5, 0.75, 1], // Check multiple thresholds for better accuracy
      }
    );
    
    // Get all component elements in the preview container
    const componentElements = previewContainer.querySelectorAll('[data-component-id]');
    
    // Observe each component element
    componentElements.forEach(element => {
      observer.observe(element);
    });
    
    return () => {
      observer.disconnect();
    };
  }, [viewMode, pendingComponents]);

  // Handler for clicking on component in editor to scroll preview
  const handleScrollToComponent = useCallback((componentId: string) => {
    setActiveComponentId(componentId);

    if (viewMode === 'split' && previewContainerRef.current) {
      // Find the corresponding component in preview
      const previewComponent = previewContainerRef.current.querySelector(`[data-component-id="${componentId}"]`);
      if (previewComponent) {
        previewComponent.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    }
  }, [viewMode, previewContainerRef]);

  // Toggle component collapse state
  const toggleComponentCollapse = useCallback((componentId: string) => {
    setCollapsedComponents(prevState => ({
      ...prevState,
      [componentId]: !prevState[componentId]
    }));
  }, []);

  // Collapse all components
  const collapseAllComponents = useCallback(() => {
    const allCollapsed: Record<string, boolean> = {};
    pendingComponents.forEach(component => {
      allCollapsed[component.id] = true;
    });
    setCollapsedComponents(allCollapsed);
  }, [pendingComponents]);

  // Expand all components
  const expandAllComponents = useCallback(() => {
    setCollapsedComponents({});
  }, []);

  // Memoizamos el SectionManager para optimizar el rendimiento en modo de vista previa
  const MemoizedPreviewSectionManager = memo(function PreviewSectionManager({
    components
  }: {
    components: Component[];
  }) {
    return (
      <div className="space-y-6">
        {components.map(component => (
          <div 
            key={component.id} 
            data-component-id={component.id}
            data-component-type={component.type.toLowerCase()}
            className={`relative component-preview-item ${
              activeComponentId === component.id ? 'active-preview' : ''
            }`}
          >
            {/* Type label for reference */}
            <div className="absolute -right-1 -top-1 z-10 text-xs bg-primary/10 px-1 py-0.5 rounded text-primary/70 font-medium">
              {component.type}
            </div>
            
            {/* Render actual component using SectionManager */}
            <SectionManager
              initialComponents={[component]}
              isEditing={false}
              componentClassName={(type) => `component-${type.toLowerCase()}`}
            />
          </div>
        ))}
      </div>
    );
  }, (prevProps, nextProps) => {
    // Don't rerender if the components didn't change, unless the active component changed
    if (prevProps.components === nextProps.components && 
        prevActiveComponentId.current === activeComponentId) {
      return true;
    }
    
    // Update the ref to cache the current activeComponentId for the next comparison
    prevActiveComponentId.current = activeComponentId;
    
    // Also perform the JSON comparison for components
    const currentJson = JSON.stringify(prevProps.components);
    const nextJson = JSON.stringify(nextProps.components);
    
    // Only re-render if components changed
    return currentJson === nextJson;
  });

  // Add a ref to track the previous activeComponentId for the memo comparison
  const prevActiveComponentId = useRef<string | null>(null);

  // Add a type definition for SectionManagerWithDrag props
  interface SectionManagerWithDragProps {
    initialComponents: Component[];
    isEditing: boolean;
    onComponentsChange?: (components: Component[]) => void;
    activeComponentId?: string | null;
  }

  // Override SectionManager to add drag handles and positioning buttons
  const SectionManagerWithDrag = useCallback(({ 
    initialComponents, 
    isEditing, 
    onComponentsChange,
    activeComponentId 
  }: SectionManagerWithDragProps) => {
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
          <div className="space-y-2">
            {/* Add instructions about the pinned functionality */}
            {isEditing && (
              <div className="bg-muted/20 text-muted-foreground text-xs p-2 rounded-md mb-4">
                <div className="flex justify-between items-center">
                  
                  <div className="flex space-x-2">
                    <button
                      onClick={collapseAllComponents}
                      className="text-xs px-2 py-1 rounded border border-muted hover:bg-muted/30 transition-colors"
                      title="Colapsar todos los componentes"
                    >
                      <ChevronDown className="h-3.5 w-3.5 inline-block mr-1" />
                      Colapsar todos
                    </button>
                    <button
                      onClick={expandAllComponents}
                      className="text-xs px-2 py-1 rounded border border-muted hover:bg-muted/30 transition-colors"
                      title="Expandir todos los componentes"
                    >
                      <ChevronUp className="h-3.5 w-3.5 inline-block mr-1" />
                      Expandir todos
                    </button>
                  </div>
                </div>
              </div>
            )}
            
            {/* Components with collapse functionality */}
            {initialComponents.length > 0 ? (
              <>
                <div className="mb-4 flex justify-end">
                  <button
                    onClick={handleAddComponent}
                    className="inline-flex items-center px-3 py-1.5 bg-primary text-primary-foreground hover:bg-primary/90 rounded-md transition-colors text-sm"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Añadir componente
                  </button>
                </div>
                <div className="space-y-4">
                  {initialComponents.map((component, index) => (
                    <div key={component.id} className="relative component-item">
                      {/* Component header with collapse toggle */}
                      <div 
                        className={`component-header flex items-center justify-between p-2 border bg-muted/10 rounded-t-md cursor-pointer transition-all duration-200 ${
                          activeComponentId === component.id ? 'border-primary bg-primary/5 active-component' : 'border-border'
                        } ${collapsedComponents[component.id] ? 'component-header-collapsed' : ''}`}
                        onClick={() => toggleComponentCollapse(component.id)}
                        data-component-id={component.id}
                      >
                        <div className="flex items-center">
                          <button 
                            className="mr-2 p-1 rounded-full hover:bg-muted/30 transition-colors text-muted-foreground"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleComponentCollapse(component.id);
                            }}
                            aria-label={collapsedComponents[component.id] ? "Expandir componente" : "Colapsar componente"}
                          >
                            {collapsedComponents[component.id] ? (
                              <ChevronDown className="h-4 w-4 transition-transform duration-200" />
                            ) : (
                              <ChevronUp className="h-4 w-4 transition-transform duration-200" />
                            )}
                          </button>
                          <div className="flex items-center">
                            <span className="font-medium text-sm">
                              {component.data.componentTitle ? 
                                (component.data.componentTitle as string) : 
                                `Componente ${component.type}`}
                            </span>
                            <span className="ml-2 text-xs px-1.5 py-0.5 bg-muted rounded-full text-muted-foreground">
                              {component.type}
                            </span>
                            {renderComponentBadges(component)}
                          </div>
                        </div>
                        <div className="flex items-center space-x-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              moveComponentUp(component.id);
                            }}
                            disabled={index === 0}
                            className="p-1 bg-background border border-border rounded-sm hover:bg-accent/10 disabled:opacity-30 disabled:hover:bg-background transition-colors"
                            title="Mover componente arriba"
                            aria-label="Mover componente arriba"
                          >
                            <ArrowUpIcon className="h-3 w-3" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              moveComponentDown(component.id);
                            }}
                            disabled={index === initialComponents.length - 1}
                            className="p-1 bg-background border border-border rounded-sm hover:bg-accent/10 disabled:opacity-30 disabled:hover:bg-background transition-colors"
                            title="Mover componente abajo"
                            aria-label="Mover componente abajo"
                          >
                            <ArrowDownIcon className="h-3 w-3" />
                          </button>
                          <div 
                            className="component-drag-handle cursor-move p-1 bg-background border border-border rounded-sm hover:bg-accent/10 ml-1 transition-colors"
                            title="Arrastrar para reordenar"
                            aria-label="Arrastrar para reordenar"
                          >
                            <svg viewBox="0 0 20 20" width="12" height="12" className="text-muted-foreground">
                              <path d="M7 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 2zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 14zm6-8a2 2 0 1 0-.001-4.001A2 2 0 0 0 13 6zm0 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 14z"></path>
                            </svg>
                          </div>
                        </div>
                      </div>

                      {/* Component content (collapsible) */}
                      <div className={`component-content ${!collapsedComponents[component.id] ? 'component-content-expanded' : ''}`}>
                        {!collapsedComponents[component.id] && (
                          <div className="border border-t-0 border-border rounded-b-md p-3">
                            <SectionManager
                              initialComponents={[component]}
                              isEditing={isEditing}
                              onComponentsChange={(updatedComponents) => {
                                if (onComponentsChange && updatedComponents.length > 0) {
                                  const updatedAllComponents = [...initialComponents];
                                  const index = updatedAllComponents.findIndex(c => c.id === component.id);
                                  if (index !== -1) {
                                    updatedAllComponents[index] = updatedComponents[0];
                                    onComponentsChange(updatedAllComponents);
                                  }
                                }
                              }}
                              activeComponentId={activeComponentId}
                              onClickComponent={handleScrollToComponent}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              renderEmptyState()
            )}
          </div>
        </SortableContext>
      </DndContext>
    );
  }, [
    sensors, 
    moveComponentUp, 
    moveComponentDown, 
    handleScrollToComponent, 
    collapsedComponents, 
    toggleComponentCollapse, 
    collapseAllComponents, 
    expandAllComponents,
    renderComponentBadges,
    renderEmptyState,
    handleAddComponent
  ]);

 
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
    
      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">
          <div className="animate-spin h-8 w-8 border-4 border-muted border-t-foreground/30 rounded-full mx-auto mb-3"></div>
          <p>Loading section content...</p>
        </div>
      ) : error ? (
        <div className="text-center py-4 text-muted-foreground bg-muted/20 rounded-md border border-border">
          Error: {error}
        </div>
      ) : (
        <>
          {/* Split View (edit + preview) */}
          {viewMode === 'split' && (
            <div className="w-full flex flex-row mt-4">
              {/* Editor section */}
              <div className="w-1/2 pr-4 border-r">
                <SectionManager
                  initialComponents={pendingComponents}
                  isEditing={true}
                  onComponentsChange={handleComponentsChange}
                  activeComponentId={activeComponentId}
                  onClickComponent={setActiveComponentId}
                />
              </div>
              
              {/* Preview section */}
              <div className="w-1/2 pl-4 bg-background">
                <div className="relative">
                  <div 
                    className={cn(
                      "preview-container w-full overflow-x-hidden transition-all duration-300 border rounded-md shadow-sm",
                      devicePreview === 'desktop' ? 'h-auto min-h-[400px]' : 'h-[667px] mx-auto',
                      devicePreview === 'mobile' ? 'w-[375px]' : 'w-full'
                    )}
                    style={{ position: 'relative', zIndex: 1 }}
                    ref={previewContainerRef}
                  >
                    <div className="mb-4 flex items-center justify-between text-sm font-medium text-foreground pb-2 border-b border-border sticky top-0 bg-background z-10">
                      
                    </div>
                    
                    {/* Browser-like container for preview */}
                    <div className="pl-1">
                      {/* Device preview switcher */}
                      <div className="flex justify-end mb-2">
                        <div className="flex items-center bg-background/80 p-0.5 rounded-full border border-muted">
                          <button 
                            onClick={() => setDevicePreview('desktop')}
                            className={`flex items-center justify-center h-6 px-2 rounded-full text-xs transition-colors ${
                              devicePreview === 'desktop' 
                                ? 'bg-primary text-primary-foreground' 
                                : 'text-muted-foreground hover:text-foreground'
                            }`}
                            title="Vista de escritorio"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
                              <line x1="8" y1="21" x2="16" y2="21"></line>
                              <line x1="12" y1="17" x2="12" y2="21"></line>
                            </svg>
                            <span className="ml-1">Escritorio</span>
                          </button>
                          <button 
                            onClick={() => setDevicePreview('mobile')}
                            className={`flex items-center justify-center h-6 px-2 rounded-full text-xs transition-colors ${
                              devicePreview === 'mobile' 
                                ? 'bg-primary text-primary-foreground' 
                                : 'text-muted-foreground hover:text-foreground'
                            }`}
                            title="Vista móvil"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect>
                              <line x1="12" y1="18" x2="12" y2="18.01"></line>
                            </svg>
                            <span className="ml-1">Móvil</span>
                          </button>
                        </div>
                      </div>

                      {devicePreview === 'desktop' ? (
                        // Desktop view with browser frame
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
                          {/* Desktop content */}
                          <div className="p-4 bg-white min-h-[300px] overflow-auto">
                            <MemoizedPreviewSectionManager 
                              components={pendingComponents}
                            />
                          </div>
                        </div>
                      ) : (
                        // Mobile view - iPhone style frame
                        <div className="max-w-[375px] mx-auto">
                          <div className="overflow-hidden rounded-[36px] border-[8px] border-black shadow-lg bg-black">
                            {/* Status bar */}
                            <div className="bg-black text-white relative h-8">
                              {/* Dynamic Island */}
                              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-[35%] h-[22px] bg-black rounded-b-[18px] flex justify-center items-end pb-1">
                                <div className="h-2 w-2 rounded-full bg-zinc-700 mx-0.5"></div>
                                <div className="h-1 w-5 rounded-full bg-zinc-800 mx-0.5"></div>
                                <div className="h-2 w-2 rounded-full bg-zinc-700 mx-0.5"></div>
                              </div>
                              {/* Status icons */}
                              <div className="flex justify-between px-5 pt-1.5 text-[10px] font-medium">
                                <div>9:41</div>
                                <div className="flex items-center space-x-1.5">
                                  <div className="w-3.5 h-3">
                                    <svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                                      <path d="M17 5.33C17.58 5.33 18.04 5.79 18.04 6.37V11.11C18.04 11.69 17.58 12.15 17 12.15C16.42 12.15 15.96 11.69 15.96 11.11V6.37C15.96 5.79 16.42 5.33 17 5.33ZM10.5 8.37C11.08 8.37 11.54 8.83 11.54 9.41V11.11C11.54 11.69 11.08 12.15 10.5 12.15C9.92 12.15 9.46 11.69 9.46 11.11V9.41C9.46 8.83 9.92 8.37 10.5 8.37ZM7.25 10.26C7.83 10.26 8.29 10.72 8.29 11.3V11.11C8.29 11.69 7.83 12.15 7.25 12.15C6.67 12.15 6.21 11.69 6.21 11.11V11.3C6.21 10.72 6.67 10.26 7.25 10.26ZM13.75 7.04C14.33 7.04 14.79 7.5 14.79 8.08V11.11C14.79 11.69 14.33 12.15 13.75 12.15C13.17 12.15 12.71 11.69 12.71 11.11V8.08C12.71 7.5 13.17 7.04 13.75 7.04Z"/>
                                    </svg>
                                  </div>
                                  <div className="w-3.5 h-3">
                                    <svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                                      <path d="M12 2C7.58 2 4 5.58 4 10C4 14.42 7.58 18 12 18C16.42 18 20 14.42 20 10C20 5.58 16.42 2 12 2ZM7 9H17V11H7V9Z"/>
                                    </svg>
                                  </div>
                                  <div className="w-4 h-3">
                                    <svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                                      <path d="M15.67 4H14V2H10V4H8.33C7.6 4 7 4.6 7 5.33V20.66C7 21.4 7.6 22 8.33 22H15.67C16.4 22 17 21.4 17 20.66V5.33C17 4.6 16.4 4 15.67 4ZM13 18H11V16H13V18ZM16.2 13.37C15.07 14.07 14.5 14.68 14.5 16H13.5V9.26C13.5 8.73 13.3 8.35 12.87 8.04C12.43 7.73 11.5 7.7 11.5 7.7C10.8 7.7 10.3 7.92 9.97 8.36C9.64 8.8 9.5 9.36 9.5 10.07H10.5C10.5 9.58 10.6 9.23 10.77 9.04C10.93 8.83 11.38 8.5 11.83 8.5C12.4 8.5 12.5 8.95 12.5 9.27V10.88C10.77 11.3 9.35 11.82 9.35 14.19C9.35 15.94 10.05 16.28 12.36 16.04V17.04H13.36V16.92C14.36 16.74 14.84 16.07 15.42 15.68C15.9 15.36 16.24 15.03 16.24 14.31C16.24 13.8 15.93 13.5 15.75 13.37H16.2Z"/>
                                    </svg>
                                  </div>
                                </div>
                              </div>
                            </div>
                            
                            {/* Content area */}
                            <div className="bg-white h-[600px] overflow-hidden">
                              <div className="h-full overflow-y-auto">
                                <div className="py-4 px-3">
                                  <MemoizedPreviewSectionManager 
                                    components={pendingComponents}
                                  />
                                </div>
                              </div>
                            </div>
                            
                            {/* Home bar */}
                            <div className="h-8 bg-black flex justify-center items-center">
                              <div className="w-32 h-1.5 rounded-full bg-zinc-600/70"></div>
                            </div>
                          </div>
                          
                          {/* Device label */}
                          <div className="text-center text-xs text-muted-foreground mt-2">
                            iPhone 14 Pro
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Edit View */}
          {viewMode === 'edit' && (
            <div className="w-full">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-muted-foreground">Modo Editor</h3>
              </div>
              <SectionManagerWithDrag
                initialComponents={pendingComponents}
                isEditing={true}
                onComponentsChange={handleComponentsChange}
                activeComponentId={activeComponentId}
              />
            </div>
          )}

          {/* Preview View */}
          {viewMode === 'preview' && (
            <div className="w-full">
              <div className="relative mx-auto">
                <div 
                  className="w-full overflow-hidden transition-all duration-300 border rounded-md shadow-sm"
                  style={{ position: 'relative', zIndex: 1 }}
                >
                  <MemoizedPreviewSectionManager 
                    components={pendingComponents}
                  />
                </div>
              </div>
            </div>
          )}
        </>
      )}
      
      {errorMessage && (
        <div className="fixed bottom-4 right-4 bg-red-500 text-white px-4 py-2 rounded shadow-lg z-50">
          {errorMessage}
        </div>
      )}
    </div>
  );
});

// Add display name for better debugging
ManageableSection.displayName = 'ManageableSection';

// Exportar con memo para evitar re-renderizaciones innecesarias
export default memo(ManageableSection); 