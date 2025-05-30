'use client';

import React, { useState, useEffect, useImperativeHandle, forwardRef, useCallback, memo, useRef } from 'react';
import { cmsOperations } from '@/lib/graphql-client';
import SectionManager, { Component } from './SectionManager';
import SectionPreview from './SectionPreview';
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
  // Track active component in viewport
  const [activeComponentId, setActiveComponentId] = useState<string | null>(null);
  // Reference to track component change debounce timeout
  const componentChangeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  // Reference to track when we're editing to prevent focus loss
  const isEditingComponentRef = useRef(false);
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
            if (!['Hero', 'Text', 'Image', 'Feature', 'Testimonial', 'Header', 'Card', 'Benefit', 'Form', 'Footer', 'Article', 'Blog', 'Video', 'Gallery', 'Calendar'].includes(componentType)) {
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
  }, [sectionId, activeComponentId, collapsedComponents, viewMode]);

  // Function to toggle view mode
  const toggleViewMode = useCallback((mode: 'split' | 'edit' | 'preview') => {
    setViewMode(mode);
  }, []);

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
              
              {/* Preview section - Using dedicated SectionPreview component */}
              <SectionPreview
                pendingComponents={pendingComponents}
                isEditing={isEditing}
                inspectionMode={inspectionMode}
                toggleInspectionMode={toggleInspectionMode}
                sectionBackground={sectionBackground}
                sectionBackgroundType={sectionBackgroundType}
                activeComponentId={activeComponentId}
                setActiveComponentId={setActiveComponentId}
                collapsedComponents={collapsedComponents}
                setCollapsedComponents={setCollapsedComponents}
                isEditingComponentRef={isEditingComponentRef}
              />
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