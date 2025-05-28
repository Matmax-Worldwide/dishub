'use client';

import React, { useState, useEffect, useImperativeHandle, forwardRef, useCallback, memo, useRef } from 'react';
import { cmsOperations } from '@/lib/graphql-client';
import SectionManager, { Component } from './SectionManager';
import { cn } from '@/lib/utils';
import BackgroundSelector from './BackgroundSelector';
import MediaSelector from './MediaSelector';
import { MediaItem } from '@/components/cms/media/types';
import { Palette } from 'lucide-react';

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
  // Track saving state for optimistic UI
  const [isSaving, setIsSaving] = useState(false);
  // Estado para gestionar componentes colapsados
  const [collapsedComponents, setCollapsedComponents] = useState<Record<string, boolean>>({});
  // Track inspection mode
  const [inspectionMode, setInspectionMode] = useState(false);
  // Background management state
  const [sectionBackground, setSectionBackground] = useState<string>('');
  const [sectionBackgroundType, setSectionBackgroundType] = useState<'image' | 'gradient'>('gradient');
  const [showBackgroundSelector, setShowBackgroundSelector] = useState(false);
  const [showMediaSelectorForBackground, setShowMediaSelectorForBackground] = useState(false);



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
        
        // Also load section background data
        try {
          // Get all sections and find the one with matching sectionId
          const allSections = await cmsOperations.getAllCMSSections();
          const sectionData = allSections.find(section => section.sectionId === normalizedSectionId) as unknown as {
            backgroundImage?: string;
            backgroundType?: string;
            id: string;
            sectionId: string;
            gridDesign?: string;
          };
          
          if (sectionData) {
            console.log(`✅ [${loadId}] Section background data loaded:`, {
              backgroundImage: sectionData.backgroundImage,
              backgroundType: sectionData.backgroundType,
              gridDesign: sectionData.gridDesign
            });
            
            if (sectionData.backgroundImage) {
              setSectionBackground(sectionData.backgroundImage);
            }
            if (sectionData.backgroundType) {
              setSectionBackgroundType(sectionData.backgroundType as 'image' | 'gradient');
            }
          }
        } catch (bgError) {
          console.warn(`⚠️ [${loadId}] Could not load section background data:`, bgError);
        }
        
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
            if (!['Hero', 'Text', 'Image', 'Feature', 'Testimonial', 'Header', 'Card', 'Benefit', 'Form', 'Footer', 'Article', 'Blog', 'Video', 'Gallery'].includes(componentType)) {
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
              type: componentType as 'Hero' | 'Text' | 'Image' | 'Feature' | 'Testimonial' | 'Header' | 'Card' | 'Benefit' | 'Form' | 'Footer' | 'Article' | 'Blog' | 'Video', // Tipo específico
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
          
          // Clear active component to ensure no component appears selected/focused on load
          setActiveComponentId(null);
        } else {
          // Initialize with empty array to avoid undefined issues
          console.warn(`⚠️ [${loadId}] No se recibieron componentes válidos. Inicializando con array vacío.`);
          setPendingComponents([]);
          
          // Clear active component
          setActiveComponentId(null);
        }
      } catch (error) {
        console.error(`❌ [${loadId}] Error fetching components:`, error);
        setError(error instanceof Error ? error.message : 'Unknown error occurred');
        
        // Clear active component on error as well
        setActiveComponentId(null);
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

  // Save components to the server - OPTIMISTIC UI implementation
  const handleSave = useCallback(async (componentsToSave: Component[], skipLoadingState = false): Promise<void> => {
    return new Promise<void>(async (resolve, reject) => {
      try {
        // Store current UI state to preserve it after save (OPTIMISTIC UI)
        const currentActiveElement = document.activeElement as HTMLElement;
        const currentActiveElementId = currentActiveElement?.id || '';
        const currentActiveComponentId = activeComponentId;
        const currentCollapsedState = { ...collapsedComponents };
        const currentViewMode = viewMode;
        const currentDevicePreview = devicePreview;
        const currentInspectionMode = inspectionMode;
        
        // Store selection state for text inputs
        let selectionStart: number | null = null;
        let selectionEnd: number | null = null;
        if (currentActiveElement && 
            (currentActiveElement.tagName === 'INPUT' || currentActiveElement.tagName === 'TEXTAREA')) {
          const inputElement = currentActiveElement as HTMLInputElement | HTMLTextAreaElement;
          if ('selectionStart' in inputElement && 'selectionEnd' in inputElement) {
            selectionStart = inputElement.selectionStart;
            selectionEnd = inputElement.selectionEnd;
          }
        }
        
        console.log(`🚀 OPTIMISTIC UI: Saving ${componentsToSave.length} components while preserving UI state`);
        
        // Show subtle saving indicator without disrupting the UI
        if (!skipLoadingState) {
          // Instead of setIsLoading(true), show a subtle indicator
          setIsSaving(true);
          console.log('💾 Saving changes...');
        }
        
        // Before saving, ensure all component titles are preserved in their data
        const componentsWithTitles = componentsToSave.map(comp => {
          const processedComponent = { ...comp };
          
          if (!processedComponent.data) {
            processedComponent.data = {};
          }
          
          if (processedComponent.data.componentTitle) {
            processedComponent.data.componentTitle = processedComponent.data.componentTitle;
          }
          
          return processedComponent;
        });
        
        // Save to API in background without affecting UI
        const result = await cmsOperations.saveSectionComponents(
          sectionId, 
          componentsWithTitles
        );
        
        console.log('✅ OPTIMISTIC UI: Save result:', result);
        
        if (result.success) {
          // Mark as saved without reloading anything
          setHasUnsavedChanges(false);
          console.log('✅ OPTIMISTIC UI: Changes saved successfully, UI state preserved');
        } else {
          console.warn('⚠️ OPTIMISTIC UI: Save failed, but UI state preserved');
        }
        
        // Restore all UI state immediately (OPTIMISTIC UI)
        setTimeout(() => {
          try {
            // Restore active component
            if (currentActiveComponentId) {
              setActiveComponentId(currentActiveComponentId);
            }
            
            // Restore collapsed state
            setCollapsedComponents(currentCollapsedState);
            
            // Restore view mode
            if (currentViewMode !== viewMode) {
              setViewMode(currentViewMode);
            }
            
            // Restore device preview
            if (currentDevicePreview !== devicePreview) {
              setDevicePreview(currentDevicePreview);
            }
            
            // Restore inspection mode
            if (currentInspectionMode !== inspectionMode) {
              setInspectionMode(currentInspectionMode);
            }
            
            // Restore focus and selection
            if (currentActiveElementId) {
              const elementToFocus = document.getElementById(currentActiveElementId);
              if (elementToFocus) {
                elementToFocus.focus();
                
                // Restore text selection if applicable
                if (selectionStart !== null && selectionEnd !== null &&
                    (elementToFocus.tagName === 'INPUT' || elementToFocus.tagName === 'TEXTAREA')) {
                  const inputElement = elementToFocus as HTMLInputElement | HTMLTextAreaElement;
                  if ('setSelectionRange' in inputElement) {
                    try {
                      inputElement.setSelectionRange(selectionStart, selectionEnd);
                    } catch (selectionError) {
                      console.warn('Could not restore text selection:', selectionError);
                    }
                  }
                }
              }
            }
            
            console.log('✅ OPTIMISTIC UI: All UI state restored successfully');
          } catch (restoreError) {
            console.warn('⚠️ OPTIMISTIC UI: Error restoring UI state:', restoreError);
          }
        }, 0);
        
        // Clear saving indicator
        setIsSaving(false);
        
        resolve();
      } catch (error) {
        console.error('❌ OPTIMISTIC UI: Error saving section:', error);
        setIsSaving(false);
        setErrorMessage('Error al guardar la sección. Por favor intenta de nuevo.');
        setTimeout(() => setErrorMessage(''), 5000);
        reject(error);
      }
    });
  }, [sectionId, activeComponentId, collapsedComponents, viewMode, devicePreview, inspectionMode]);

  // Function to toggle view mode
  const toggleViewMode = useCallback((mode: 'split' | 'edit' | 'preview') => {
    setViewMode(mode);
  }, []);


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

            // Only auto-expand/collapse components when user isn't actively editing
            if (!isEditingComponentRef.current) {
              // Expand the visible component and collapse others
              const newCollapsedState: Record<string, boolean> = {};
              pendingComponents.forEach(component => {
                newCollapsedState[component.id] = component.id !== componentId;
              });
              setCollapsedComponents(newCollapsedState);
            }
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



  // Add pulsating button animations
  useEffect(() => {
    // Create a style element
    const styleEl = document.createElement('style');
    styleEl.id = 'pulsating-buttons-styles';
    styleEl.innerHTML = `
      /* Pulsating button animations - more subtle for global buttons */
      .expand-button-global {
        animation: pulseExpandButtonSubtle 3s infinite;
        box-shadow: 0 0 0 rgba(59, 130, 246, 0);
        transform-origin: center;
      }
      
      .collapse-button-global {
        animation: pulseCollapseButtonSubtle 3s infinite;
        box-shadow: 0 0 0 rgba(59, 130, 246, 0);
        transform-origin: center;
      }
      
      /* Smaller toggle buttons for components */
      .small-toggle-button {
        padding: 0.15rem !important;
        width: 1.5rem;
        height: 1.5rem;
      }
      
      .small-toggle-button svg {
        width: 0.8rem;
        height: 0.8rem;
      }
      
      /* Regular animation for component-level buttons */
      .expand-button {
        animation: pulseExpandButton 2s infinite;
        box-shadow: 0 0 0 rgba(59, 130, 246, 0);
        transform-origin: center;
      }
      
      .collapse-button {
        animation: pulseCollapseButton 2s infinite;
        box-shadow: 0 0 0 rgba(59, 130, 246, 0);
        transform-origin: center;
      }
      
      @keyframes pulseExpandButtonSubtle {
        0% {
          box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.2);
          transform: scale(1);
        }
        
        50% {
          box-shadow: 0 0 0 5px rgba(14, 165, 233, 0);
          transform: scale(1.05);
        }
        
        100% {
          box-shadow: 0 0 0 0 rgba(59, 130, 246, 0);
          transform: scale(1);
        }
      }
      
      @keyframes pulseCollapseButtonSubtle {
        0% {
          box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.2);
          transform: scale(1);
        }
        
        50% {
          box-shadow: 0 0 0 5px rgba(14, 165, 233, 0);
          transform: scale(0.97);
        }
        
        100% {
          box-shadow: 0 0 0 0 rgba(59, 130, 246, 0);
          transform: scale(1);
        }
      }
      
      @keyframes pulseExpandButton {
        0% {
          box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.4);
          transform: scale(1);
        }
        
        50% {
          box-shadow: 0 0 0 10px rgba(14, 165, 233, 0);
          transform: scale(1.15);
        }
        
        100% {
          box-shadow: 0 0 0 0 rgba(59, 130, 246, 0);
          transform: scale(1);
        }
      }
      
      @keyframes pulseCollapseButton {
        0% {
          box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.4);
          transform: scale(1);
        }
        
        50% {
          box-shadow: 0 0 0 10px rgba(14, 165, 233, 0);
          transform: scale(0.9);
        }
        
        100% {
          box-shadow: 0 0 0 0 rgba(59, 130, 246, 0);
          transform: scale(1);
        }
      }
    `;
    
    // Add it to the document
    document.head.appendChild(styleEl);
    
    return () => {
      // Clean up
      const existingStyle = document.getElementById('pulsating-buttons-styles');
      if (existingStyle) {
        existingStyle.remove();
      }
    };
  }, []);

  // Toggle inspection mode
  const toggleInspectionMode = useCallback(() => {
    setInspectionMode(!inspectionMode);
  }, [inspectionMode]);

  // Background selection handlers
  const handleBackgroundSelect = useCallback((background: string, type: 'image' | 'gradient') => {
    console.log('Section background selected:', { background, type });
    
    // Immediately update local state for responsive UI
    setSectionBackground(background);
    setSectionBackgroundType(type);
    setShowBackgroundSelector(false);
    
    // Save background changes to the section
    if (normalizedSectionId) {
      cmsOperations.updateSectionBackground(normalizedSectionId, background, type)
        .then(result => {
          if (result.success) {
            console.log('Section background updated successfully');
          } else {
            console.error('Failed to update section background:', result.message);
          }
        })
        .catch(error => {
          console.error('Error updating section background:', error);
        });
    }
  }, [normalizedSectionId, sectionName]);

  const handleBackgroundMediaSelect = useCallback((mediaItem: MediaItem) => {
    setSectionBackground(mediaItem.fileUrl);
    setSectionBackgroundType('image');
    setShowMediaSelectorForBackground(false);
    setShowBackgroundSelector(false);
    
    // Save background changes to the section
    if (normalizedSectionId) {
      cmsOperations.updateSectionBackground(normalizedSectionId, mediaItem.fileUrl, 'image')
        .then(result => {
          if (result.success) {
            console.log('Section background updated with media successfully');
          } else {
            console.error('Failed to update section background with media:', result.message);
          }
        })
        .catch(error => {
          console.error('Error updating section background with media:', error);
        });
    }
  }, [normalizedSectionId, sectionName]);

  // Handle element inspection
  const handleInspectElement = useCallback((e: MouseEvent) => {
    if (!inspectionMode) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    // Find the nearest data attribute that would tell us what to edit
    let target = e.target as HTMLElement;
    let componentId = null;
    let fieldType = null;
    
    // Move up the DOM tree to find relevant attributes
    while (target && !componentId) {
      componentId = target.dataset.componentId;
      fieldType = target.dataset.fieldType;
      
      if (!componentId) {
        target = target.parentElement as HTMLElement;
      }
    }
    
    if (componentId) {
      console.log(`Inspected element: Component ID ${componentId}, Field type: ${fieldType}`);
      
      // Activate the component
      setActiveComponentId(componentId);
      
      // Set view mode to edit if in preview mode
      if (viewMode === 'preview') {
        setViewMode('split');
      }
      
      // Make sure component is expanded
      const newCollapsedState = { ...collapsedComponents };
      delete newCollapsedState[componentId];
      setCollapsedComponents(newCollapsedState);
      
      // Exit inspection mode
      setInspectionMode(false);
    }
  }, [inspectionMode, collapsedComponents, viewMode]);

  // Set up and clean up inspection mode listener
  useEffect(() => {
    if (inspectionMode) {
      // Add hover highlights to elements that can be inspected
      document.body.classList.add('inspection-mode');
      
      // Listen for click events to inspect elements
      document.addEventListener('click', handleInspectElement);
      
      // Add inspection styles
      const styleEl = document.createElement('style');
      styleEl.id = 'inspection-mode-styles';
      styleEl.innerHTML = `
        .inspection-mode [data-component-id]:hover {
          outline: 2px dashed #3b82f6 !important;
          cursor: crosshair !important;
          position: relative;
        }
        .inspection-mode [data-field-type]:hover {
          outline: 2px solid #ec4899 !important;
          cursor: crosshair !important;
          position: relative;
        }
        
        /* Pulsating button animations - more subtle for global buttons */
        .expand-button-global {
          animation: pulseExpandButtonSubtle 3s infinite;
          box-shadow: 0 0 0 rgba(59, 130, 246, 0);
          transform-origin: center;
        }
        
        .collapse-button-global {
          animation: pulseCollapseButtonSubtle 3s infinite;
          box-shadow: 0 0 0 rgba(59, 130, 246, 0);
          transform-origin: center;
        }
        
        /* Smaller toggle buttons for components */
        .small-toggle-button {
          padding: 0.15rem !important;
          width: 1.5rem;
          height: 1.5rem;
        }
        
        .small-toggle-button svg {
          width: 0.8rem;
          height: 0.8rem;
        }
        
        /* Regular animation for component-level buttons */
        .expand-button {
          animation: pulseExpandButton 2s infinite;
          box-shadow: 0 0 0 rgba(59, 130, 246, 0);
          transform-origin: center;
        }
        
        .collapse-button {
          animation: pulseCollapseButton 2s infinite;
          box-shadow: 0 0 0 rgba(59, 130, 246, 0);
          transform-origin: center;
        }
        
        @keyframes pulseExpandButtonSubtle {
          0% {
            box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.2);
            transform: scale(1);
          }
          
          50% {
            box-shadow: 0 0 0 5px rgba(14, 165, 233, 0);
            transform: scale(1.05);
          }
          
          100% {
            box-shadow: 0 0 0 0 rgba(59, 130, 246, 0);
            transform: scale(1);
          }
        }
        
        @keyframes pulseCollapseButtonSubtle {
          0% {
            box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.2);
            transform: scale(1);
          }
          
          50% {
            box-shadow: 0 0 0 5px rgba(14, 165, 233, 0);
            transform: scale(0.97);
          }
          
          100% {
            box-shadow: 0 0 0 0 rgba(59, 130, 246, 0);
            transform: scale(1);
          }
        }
        
        @keyframes pulseExpandButton {
          0% {
            box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.4);
            transform: scale(1);
          }
          
          50% {
            box-shadow: 0 0 0 10px rgba(14, 165, 233, 0);
            transform: scale(1.15);
          }
          
          100% {
            box-shadow: 0 0 0 0 rgba(59, 130, 246, 0);
            transform: scale(1);
          }
        }
        
        @keyframes pulseCollapseButton {
          0% {
            box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.4);
            transform: scale(1);
          }
          
          50% {
            box-shadow: 0 0 0 10px rgba(14, 165, 233, 0);
            transform: scale(0.9);
          }
          
          100% {
            box-shadow: 0 0 0 0 rgba(59, 130, 246, 0);
            transform: scale(1);
          }
        }
      `;
      document.head.appendChild(styleEl);
      
      return () => {
        document.body.classList.remove('inspection-mode');
        document.removeEventListener('click', handleInspectElement);
        
        // Remove inspection styles
        const existingStyle = document.getElementById('inspection-mode-styles');
        if (existingStyle) {
          existingStyle.remove();
        }
      };
    }
  }, [inspectionMode, handleInspectElement]);

  return (
    <div 
      className="my-6 manageable-section" 
      data-section-id={normalizedSectionId} 
      data-cms-editor={isEditing ? "true" : "false"}
      data-preview-mode={!isEditing ? "true" : "false"}
      style={{ zIndex: 1, position: 'relative' }}
    >
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
            <div className="flex items-center space-x-2">
              {/* Subtle saving indicator */}
              {isSaving && (
                <div className="flex items-center px-2 py-1 text-xs text-blue-600 bg-blue-50 rounded-md border border-blue-200">
                  <div className="animate-spin rounded-full h-3 w-3 border border-blue-600 border-t-transparent mr-1"></div>
                  Saving...
                </div>
              )}
              
              {/* Background selection button */}
              <button
                onClick={() => setShowBackgroundSelector(true)}
                className="flex items-center px-3 py-1.5 text-xs rounded-md border border-border bg-background text-muted-foreground hover:bg-muted/30 transition-colors"
                title="Change section background"
              >
                <Palette className="w-3 h-3 mr-1" />
                Background
              </button>
              
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
            <div className="w-full flex flex-row">
              {/* Editor section */}
              <div className={cn(
                "w-1/2 pr-4 border-r",
                activeComponentId ? "overflow-y-auto" : ""
              )}>
                <SectionManager
                  initialComponents={pendingComponents}
                  isEditing={true}
                  onComponentsChange={handleComponentsChange}
                  activeComponentId={activeComponentId}
                  onClickComponent={setActiveComponentId}
                  sectionBackground={sectionBackground}
                  sectionBackgroundType={sectionBackgroundType}
                />
              </div>
              
              {/* Preview section */}
              <div className="w-1/2 pl-4 bg-background">
                <div className="relative">
                  <div 
                    className={cn(
                      "w-full overflow-x-hidden transition-all duration-300 border rounded-md shadow-sm",
                      devicePreview === 'desktop' ? 'h-auto min-h-[400px]' : 'mx-auto',
                      devicePreview === 'mobile' ? 'w-[375px]' : 'w-full'
                    )}
                    style={{ position: 'relative', zIndex: 0 }}
                    ref={previewContainerRef}
                  >
                    <div className="px-1">
                      {/* Device preview switcher */}
                      <div className="flex justify-between mb-2 p-2">
                        {/* Inspect button on the left side */}
                        {isEditing && (
                          <button
                            onClick={toggleInspectionMode}
                            className={cn(
                              "flex items-center space-x-1 px-3 py-1.5 rounded text-sm shadow-md",
                              inspectionMode 
                                ? "bg-primary text-white hover:bg-primary/90" 
                                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                            )}
                            title="Select elements on page to edit"
                          >
                            <svg 
                              className="h-4 w-4 mr-1" 
                              viewBox="0 0 24 24" 
                              fill="none" 
                              stroke="currentColor" 
                              strokeWidth="2" 
                              strokeLinecap="round" 
                              strokeLinejoin="round"
                            >
                              <circle cx="12" cy="12" r="10"></circle>
                              <line x1="22" y1="12" x2="18" y2="12"></line>
                              <line x1="6" y1="12" x2="2" y2="12"></line>
                              <line x1="12" y1="6" x2="12" y2="2"></line>
                              <line x1="12" y1="22" x2="12" y2="18"></line>
                            </svg>
                            <span>{inspectionMode ? "Exit Inspection" : "Inspect Page"}</span>
                          </button>
                        )}
                        
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
                          {/* Desktop content */}
                          <div 
                            className="p-4 min-h-[300px] overflow-auto"
                            style={{
                              background: sectionBackground || 'white',
                              backgroundSize: sectionBackgroundType === 'image' ? 'cover' : undefined,
                              backgroundPosition: sectionBackgroundType === 'image' ? 'center' : undefined,
                              backgroundRepeat: sectionBackgroundType === 'image' ? 'no-repeat' : undefined
                            }}
                          >
                            <SectionManager
                              initialComponents={pendingComponents}
                              isEditing={false}
                              componentClassName={(type) => {
                                // Allow headers to use their own positioning logic (sticky in preview)
                                const isVideoComponent = type.toLowerCase() === 'video';
                                let classNames = `component-${type.toLowerCase()}`;
                                
                                if (isVideoComponent) {
                                  classNames += ' video-component';
                                }
                                
                                return classNames;
                              }}
                              sectionBackground={sectionBackground}
                              sectionBackgroundType={sectionBackgroundType}
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
                            <div 
                              className="h-[600px] overflow-hidden"
                              style={{
                                background: sectionBackground || 'white',
                                backgroundSize: sectionBackgroundType === 'image' ? 'cover' : undefined,
                                backgroundPosition: sectionBackgroundType === 'image' ? 'center' : undefined,
                                backgroundRepeat: sectionBackgroundType === 'image' ? 'no-repeat' : undefined
                              }}
                            >
                              <div className="h-full overflow-y-auto">
                                <SectionManager
                                  initialComponents={pendingComponents}
                                  isEditing={false}
                                  componentClassName={(type) => {
                                    // Allow headers to use their own positioning logic (sticky in preview)
                                    const isVideoComponent = type.toLowerCase() === 'video';
                                    let classNames = `component-${type.toLowerCase()}`;
                                    
                                    if (isVideoComponent) {
                                      classNames += ' video-component';
                                    }
                                    
                                    return classNames;
                                  }}
                                  sectionBackground={sectionBackground}
                                  sectionBackgroundType={sectionBackgroundType}
                                />
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
              <div className={cn(
                "w-full",
                activeComponentId ? "max-h-screen overflow-y-auto" : ""
              )}>
                <SectionManager
                  initialComponents={pendingComponents}
                  isEditing={true}
                  onComponentsChange={handleComponentsChange}
                  activeComponentId={activeComponentId}
                  sectionBackground={sectionBackground}
                  sectionBackgroundType={sectionBackgroundType}
                />
              </div>
            </div>
          )}

          {/* Preview View */}
          {viewMode === 'preview' && (
            <div className="w-full">
              <div className="relative mx-auto">
                <div 
                  className="w-full overflow-hidden transition-all duration-300 border rounded-md shadow-sm"
                  style={{ 
                    position: 'relative', 
                    zIndex: 1,
                    background: sectionBackground || 'white',
                    backgroundSize: sectionBackgroundType === 'image' ? 'cover' : undefined,
                    backgroundPosition: sectionBackgroundType === 'image' ? 'center' : undefined,
                    backgroundRepeat: sectionBackgroundType === 'image' ? 'no-repeat' : undefined
                  }}
                >
                  <SectionManager
                    initialComponents={pendingComponents}
                    isEditing={false}
                    componentClassName={(type) => {
                      // Allow headers to use their own positioning logic (sticky in preview)
                      const isVideoComponent = type.toLowerCase() === 'video';
                      let classNames = `component-${type.toLowerCase()}`;
                      
                      if (isVideoComponent) {
                        classNames += ' video-component';
                      }
                      
                      return classNames;
                    }}
                    sectionBackground={sectionBackground}
                    sectionBackgroundType={sectionBackgroundType}
                  />
                </div>
              </div>
            </div>
          )}
        </>
      )}
      
      {errorMessage && (
        <div className="fixed bottom-4 right-4 bg-red-500 text-white px-4 rounded shadow-lg z-50">
          {errorMessage}
        </div>
      )}

      {/* Background Selector */}
      <BackgroundSelector
        isOpen={showBackgroundSelector}
        onClose={() => setShowBackgroundSelector(false)}
        onSelect={handleBackgroundSelect}
        currentBackground={sectionBackground}
        onOpenMediaSelector={() => {
          setShowBackgroundSelector(false);
          setShowMediaSelectorForBackground(true);
        }}
      />

      {/* Media Selector for Background */}
      <MediaSelector
        isOpen={showMediaSelectorForBackground}
        onClose={() => setShowMediaSelectorForBackground(false)}
        onSelect={handleBackgroundMediaSelect}
        title="Select Background Image"
        initialType="image"
      />
    </div>
  );
});

// Add display name for better debugging
ManageableSection.displayName = 'ManageableSection';

// Exportar con memo para evitar re-renderizaciones innecesarias
export default memo(ManageableSection); 