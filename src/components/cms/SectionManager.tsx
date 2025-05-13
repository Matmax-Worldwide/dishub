'use client';

import { useState, useEffect, useCallback, useMemo, memo, useRef } from 'react';
import dynamic from 'next/dynamic';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { PlusCircle } from 'lucide-react';
import React from 'react';
import { cn } from '@/lib/utils';
import ComponentTitleInput from './ComponentTitleInput';

// Type for available components
type ComponentType = 'Hero' | 'Text' | 'Image' | 'Feature' | 'Testimonial' | 'Header' | 'Card' | 'Benefit';

export interface Component {
  id: string;
  type: ComponentType;
  data: Record<string, unknown>;
  title?: string;
  subtitle?: string;
}

// Dynamic imports for components - fallback to a loading state
const componentMap = {
  Hero: dynamic(() => import('./sections/HeroSection'), {
    loading: () => <div className="flex items-center justify-center p-8 h-32 bg-muted/20 rounded-md animate-pulse">Cargando Hero...</div>
  }),
  Text: dynamic(() => import('./sections/TextSection'), {
    loading: () => <div className="flex items-center justify-center p-8 h-32 bg-muted/20 rounded-md animate-pulse">Cargando Text...</div>
  }),
  Image: dynamic(() => import('./sections/ImageSection'), {
    loading: () => <div className="flex items-center justify-center p-8 h-32 bg-muted/20 rounded-md animate-pulse">Cargando Image...</div>
  }),
  Feature: dynamic(() => import('./sections/FeatureSection'), {
    loading: () => <div className="flex items-center justify-center p-8 h-32 bg-muted/20 rounded-md animate-pulse">Cargando Feature...</div>
  }),
  Testimonial: dynamic(() => import('./sections/TestimonialSection'), {
    loading: () => <div className="flex items-center justify-center p-8 h-32 bg-muted/20 rounded-md animate-pulse">Cargando Testimonial...</div>
  }),
  Header: dynamic(() => import('./sections/HeaderSection'), {
    loading: () => <div className="flex items-center justify-center p-8 h-32 bg-muted/20 rounded-md animate-pulse">Cargando Header...</div>
  }),
  Card: dynamic(() => import('./sections/CardSection'), {
    loading: () => <div className="flex items-center justify-center p-8 h-32 bg-muted/20 rounded-md animate-pulse">Cargando Card...</div>
  }),
  Benefit: dynamic(() => import('./sections/BenefitSection'), {
    loading: () => <div className="flex items-center justify-center p-8 h-32 bg-muted/20 rounded-md animate-pulse">Cargando Benefit...</div>
  }),
};

interface SectionManagerProps {
  initialComponents?: Component[];
  isEditing?: boolean;
  onComponentsChange?: (components: Component[]) => void;
  componentClassName?: (type: string) => string;
}

// Utilidad para debounce
const useDebounce = <T,>(value: T, delay: number) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  
  return debouncedValue;
};

// Crear un componente memoizado para el wrapper de cada componente
const ComponentWrapperMemo = memo(function ComponentWrapper({ 
  component, 
  isEditing, 
  children, 
  onRemove,
  onMoveUp,
  onMoveDown,
  isFirst = false,
  isLast = false,
  isCollapsed = false,
  onToggleCollapse
}: { 
  component: Component; 
  isEditing: boolean; 
  children: React.ReactNode; 
  onRemove: (id: string) => void;
  onMoveUp?: (id: string) => void;
  onMoveDown?: (id: string) => void;
  isFirst?: boolean;
  isLast?: boolean;
  isCollapsed?: boolean;
  onToggleCollapse?: (id: string, isCollapsed: boolean) => void;
}) {
  const [isHovered, setIsHovered] = useState(false);
  
  const handleRemove = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onRemove(component.id);
  }, [component.id, onRemove]);

  const handleMoveUp = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onMoveUp) onMoveUp(component.id);
  }, [component.id, onMoveUp]);

  const handleMoveDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onMoveDown) onMoveDown(component.id);
  }, [component.id, onMoveDown]);

  const handleToggleCollapse = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log(`Component ${component.id} toggling collapse. Current state: ${isCollapsed ? 'collapsed' : 'expanded'}`);
    if (onToggleCollapse) {
      // Si está colapsado, lo expandimos, y viceversa
      onToggleCollapse(component.id, isCollapsed);
    }
  }, [component.id, isCollapsed, onToggleCollapse]);

  return (
    <div 
      key={component.id} 
      className={cn(
        "relative transition-all duration-200",
        isEditing && "pt-2 rounded-lg mb-6",
        isHovered && isEditing && "bg-accent/5"
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      data-component-id={component.id}
    >
      {isEditing && (
        <>
          <div className="flex items-center justify-between mb-2 px-3 py-1">
            <div className="flex items-center gap-2">
              {/* Reorder controls */}
              <div className="flex items-center">
                <div
                  onClick={handleMoveUp}
                  className={cn(
                    "p-1 text-muted-foreground hover:text-foreground cursor-pointer",
                    isFirst && "opacity-30 cursor-not-allowed hover:text-muted-foreground"
                  )}
                  title="Mover componente arriba"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 15l-6-6-6 6"/>
                  </svg>
                </div>
                <div
                  onClick={handleMoveDown}
                  className={cn(
                    "p-1 text-muted-foreground hover:text-foreground cursor-pointer",
                    isLast && "opacity-30 cursor-not-allowed hover:text-muted-foreground"
                  )}
                  title="Mover componente abajo"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M6 9l6 6 6-6"/>
                  </svg>
                </div>
              </div>
              
              {/* Use the ComponentTitleInput component */}
              <div className="flex items-center">
                <ComponentTitleInput
                  componentId={component.id}
                  initialTitle={component.title}
                  componentType={component.type}
                  onRemove={onRemove}
                />
              </div>
            </div>
            <div className="flex items-center space-x-1">
              {/* Collapse button - only visible control that can collapse */}
              <div
                onClick={handleToggleCollapse}
                className="opacity-60 hover:opacity-100 transition-opacity duration-200 p-1 hover:bg-accent/10 rounded-full cursor-pointer"
                aria-label={isCollapsed ? "Expandir componente" : "Colapsar componente"}
                title={isCollapsed ? "Expandir componente" : "Colapsar componente"}
              >
                {isCollapsed ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="8" x2="12" y2="16"></line>
                    <line x1="8" y1="12" x2="16" y2="12"></line>
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="8" y1="12" x2="16" y2="12"></line>
                  </svg>
                )}
              </div>
            <div 
              onClick={handleRemove}
              className="opacity-60 hover:opacity-100 transition-opacity duration-200 p-1 bg-destructive hover:bg-destructive/90 rounded-full cursor-pointer"
              aria-label="Eliminar componente"
            >
                <XMarkIcon className="h-3 w-3 text-destructive-foreground" />
            </div>
            </div>
          </div>
          <div className="h-px bg-border w-full mb-3 opacity-60"></div>
        </>
      )}
      {(!isCollapsed || !isEditing) && (
        <div className={cn(isEditing && "px-3 py-1")}
             onClick={(e) => e.stopPropagation()}>
          {children}
        </div>
      )}
    </div>
  );
});

// Componente principal memoizado
function SectionManagerBase({ 
  initialComponents = [], 
  isEditing = false,
  onComponentsChange,
  componentClassName
}: SectionManagerProps) {
  const [components, setComponents] = useState<Component[]>(initialComponents);
  // Track collapsed components by ID - initialize with empty set (all expanded)
  const [collapsedComponents, setCollapsedComponents] = useState<Set<string>>(new Set());
  // Add a flag to track if all components are collapsed - start with false (all expanded)
  const [allCollapsed, setAllCollapsed] = useState(false);
  // Referencia para guardar el elemento activo antes del autoguardado
  const activeElementRef = useRef<Element | null>(null);
  // Estado para controlar las actualizaciones debounced de los componentes
  const [pendingUpdate, setPendingUpdate] = useState<{component: Component, data: Record<string, unknown>} | null>(null);
  // Reference to track component change debounce timeout
  const componentChangeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  // Aplicar debounce al pendingUpdate para evitar actualizaciones demasiado frecuentes
  const debouncedPendingUpdate = useDebounce(pendingUpdate, 1000);
  
  // Cache component data stringified to prevent unnecessary re-renders
  const componentsDataString = useMemo(() => JSON.stringify(components), [components]);

  // Efecto para inicializar componentes iniciales
  useEffect(() => {
    // Solo actualizar los componentes si es una primera carga o una actualización importante
    // pero no si solo estamos reordenando o colapsando/expandiendo
    if (initialComponents.length > 0 && components.length === 0) {
      setComponents(initialComponents);
      // Always start with all components expanded
      setCollapsedComponents(new Set());
      setAllCollapsed(false);
    }
  }, [initialComponents, components.length]);

  // Efecto para aplicar las actualizaciones debounced
  useEffect(() => {
    if (debouncedPendingUpdate) {
      const { component, data } = debouncedPendingUpdate;
      
      // Guardar referencia al elemento activo
      activeElementRef.current = document.activeElement;
      
      // Crear componente actualizado
      const updatedComponent = {
        ...component,
        data: { ...component.data, ...data }
      };
      
      // Preserve title if it exists
      if (component.title) {
        updatedComponent.title = component.title;
      }
      
      // Capture current collapse state to preserve it
      const currentlyCollapsed = collapsedComponents.has(component.id);
      
      // Actualizar componentes
      setComponents(prevComponents => {
        // For better performance, only update if the component data actually changed
        if (JSON.stringify(component.data) === JSON.stringify(updatedComponent.data)) {
          return prevComponents;
        }
        
        // Create a new array to trigger re-render
        return prevComponents.map(c => 
          c.id === component.id ? updatedComponent : c
        );
      });
      
      // Maintain the collapse state after the update
      if (!currentlyCollapsed) {
        setCollapsedComponents(prev => {
          const newSet = new Set(prev);
          newSet.delete(component.id);
          return newSet;
        });
      }
      
      // Limpiar el pendingUpdate
      setPendingUpdate(null);
    }
  }, [debouncedPendingUpdate, collapsedComponents]);
  
  // Efecto para restaurar el foco después de actualizar componentes
  useEffect(() => {
    // Si teníamos un elemento activo, restaurar el foco después de la actualización
    if (activeElementRef.current && activeElementRef.current instanceof HTMLElement) {
      const activeElement = activeElementRef.current;
      
      // Esperar a que el DOM se actualice
      setTimeout(() => {
        if (activeElement instanceof HTMLElement) {
          try {
            activeElement.focus();
            
            // Solo establecer la posición del cursor para inputs y textareas de texto
            if (
              (activeElement instanceof HTMLInputElement || 
               activeElement instanceof HTMLTextAreaElement) && 
              'selectionStart' in activeElement
            ) {
              // Verificar que el tipo de input soporte selección
              const inputElement = activeElement as HTMLInputElement;
              const nonSelectableTypes = ['color', 'checkbox', 'radio', 'range', 'file', 'submit', 'button', 'reset'];
              
              // Solo establecer selección para tipos que lo soporten
              if (!(inputElement.tagName === 'INPUT' && nonSelectableTypes.includes(inputElement.type))) {
                const len = activeElement.value.length;
                activeElement.selectionStart = len;
                activeElement.selectionEnd = len;
              }
            }
          } catch (err) {
            console.warn('[SectionManager] Error al restaurar el foco:', err);
          }
        }
        
        // Limpiar la referencia
        activeElementRef.current = null;
      }, 10);
    }
  }, [components]);

  // Efecto para enviar cambios al padre
  useEffect(() => {
    // Notificar al padre cuando los componentes cambian, si hay un callback
    if (onComponentsChange && components !== initialComponents) {
      onComponentsChange(components);
    }
  }, [components, onComponentsChange, initialComponents]);

  // Listen for component:add events to handle component re-addition
  useEffect(() => {
    const handleComponentAdd = (e: Event) => {
      const customEvent = e as CustomEvent<Component>;
      if (customEvent.detail) {
        console.log('[SectionManager] 📥 Recibido evento component:add:', customEvent.detail);
        
        // Verificar que el tipo de componente sea válido
        const component = customEvent.detail;
        if (!component.type || !['Hero', 'Text', 'Image', 'Feature', 'Testimonial', 'Header', 'Card', 'Benefit'].includes(component.type)) {
          console.error(`[SectionManager] ❌ Tipo de componente no válido: ${component.type}`);
          return;
        }
        
        console.log(`[SectionManager] ✅ Agregando componente: ${component.id} (${component.type})`);
        
        // Do NOT automatically collapse components - leave them expanded
        // setCollapsedComponents stays the same
        
        // Asegurar que los datos del componente tengan la estructura correcta
        try {
          // Attempt to deep clone the component to prevent reference issues
          const safeComponent = JSON.parse(JSON.stringify(component));
          
          // Ensure the component has all required properties
          if (!safeComponent.id) {
            safeComponent.id = crypto.randomUUID();
          }
          
          if (!safeComponent.data) {
            safeComponent.data = {};
          }
          
          // Ensure the title is preserved
          const componentTitle = safeComponent.title || safeComponent.data?.componentTitle || `${safeComponent.type} Component`;
          safeComponent.title = componentTitle;
          safeComponent.data.componentTitle = componentTitle;
          
          setComponents(prev => {
            // Create a shallow copy to preserve component references where possible
            // This is important to prevent unnecessary re-renders
            const newComponents = [...prev];
            
            // If component already exists with same ID, preserve its reference
            const existingIndex = newComponents.findIndex(c => c.id === safeComponent.id);
            if (existingIndex >= 0) {
              // Update existing component without changing its reference
              newComponents[existingIndex] = {
                ...newComponents[existingIndex],
                ...safeComponent,
                data: { ...newComponents[existingIndex].data, ...safeComponent.data }
              };
            } else {
              // Add new component
              newComponents.push(safeComponent);
            }
            
            console.log(`[SectionManager] 📊 Componentes actualizados: ${newComponents.length}`);
            
            // Use a timeout to prevent React batching issues and ensure
            // the UI is updated before notifying the parent
            if (onComponentsChange) {
              if (componentChangeTimeoutRef.current) {
                clearTimeout(componentChangeTimeoutRef.current);
              }
              
              componentChangeTimeoutRef.current = setTimeout(() => {
                console.log('[SectionManager] 🔄 Notificando cambio de componentes con', newComponents.length, 'componentes');
                onComponentsChange(newComponents);
              }, 800); // Incrementar a 800ms para evitar problemas de autoguardado demasiado rápido
            }
            
            return newComponents;
          });
        } catch (processingError) {
          console.error('[SectionManager] ❌ Error processing component:', processingError);
        }
      } else {
        console.error('[SectionManager] ❌ Evento component:add recibido sin datos');
      }
    };

    // Add new event listener for updating component titles
    const handleComponentTitleUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<{
        componentId: string;
        newTitle: string;
        component: Component;
      }>;
      
      if (customEvent.detail) {
        const { componentId, newTitle } = customEvent.detail;
        console.log(`[SectionManager] 📝 Updating title for component ${componentId}: ${newTitle}`);
        
        setComponents(prev => {
          // Create a shallow copy to preserve component references
          const newComponents = [...prev];
          
          // Find the component to update
          const existingIndex = newComponents.findIndex(c => c.id === componentId);
          if (existingIndex >= 0) {
            // Update existing component's title without changing its reference
            newComponents[existingIndex] = {
              ...newComponents[existingIndex],
              title: newTitle,
              data: { 
                ...newComponents[existingIndex].data, 
                componentTitle: newTitle 
              }
            };
            
            console.log(`[SectionManager] ✅ Component title updated successfully`);
          } else {
            console.warn(`[SectionManager] ⚠️ Component with ID ${componentId} not found`);
          }
          
          // Notify parent component of changes
          if (onComponentsChange) {
            if (componentChangeTimeoutRef.current) {
              clearTimeout(componentChangeTimeoutRef.current);
            }
            
            componentChangeTimeoutRef.current = setTimeout(() => {
              console.log('[SectionManager] 🔄 Notifying parent of title change');
              onComponentsChange(newComponents);
            }, 500);
          }
          
          return newComponents;
        });
      } else {
        console.error('[SectionManager] ❌ component:update-title event received without data');
      }
    };

    document.addEventListener('component:add', handleComponentAdd);
    document.addEventListener('component:update-title', handleComponentTitleUpdate);
    
    return () => {
      document.removeEventListener('component:add', handleComponentAdd);
      document.removeEventListener('component:update-title', handleComponentTitleUpdate);
    };
  }, [onComponentsChange]); // Eliminar components de las dependencias para evitar re-renderizados innecesarios

  // Remove a component without triggering a full re-render of the section
  const removeComponent = useCallback((id: string) => {
    setComponents(prevComponents => {
      const newComponents = prevComponents.filter(comp => comp.id !== id);
      return newComponents;
    });
  }, []);

  // Creamos una función memoizada para actualizar los componentes de forma eficiente
  const handleUpdate = useCallback((component: Component, updatedData: Record<string, unknown>) => {
    // En lugar de actualizar inmediatamente, establecer un pendingUpdate
    setPendingUpdate({ component, data: updatedData });
  }, []);

  // Handle collapsing/expanding components - ONLY called by explicit collapse toggle button
  const handleToggleCollapse = useCallback((componentId: string, isCollapsed: boolean) => {
    console.log(`Explicitly toggling collapse for component ${componentId}. Current state: ${isCollapsed ? 'collapsed' : 'expanded'}`);
    setCollapsedComponents(prev => {
      const newSet = new Set(prev);
      // Si isCollapsed es true, significa que está colapsado y queremos expandirlo
      // Si isCollapsed es false, significa que está expandido y queremos colapsarlo
      if (isCollapsed) {
        console.log(`Expanding component ${componentId}`);
        newSet.delete(componentId);
      } else {
        console.log(`Collapsing component ${componentId}`);
        newSet.add(componentId);
      }
      return newSet;
    });
  }, []);

  // Manejar el movimiento de componentes hacia arriba
  const handleMoveComponentUp = useCallback((componentId: string) => {
    // No actualizamos selectedComponentId para evitar que afecte el estado de colapso
    
    setComponents(prevComponents => {
      const index = prevComponents.findIndex(component => component.id === componentId);
      if (index <= 0) return prevComponents;
      
      // Crear un nuevo array con el componente movido una posición hacia arriba
      const newComponents = [...prevComponents];
      const temp = newComponents[index];
      newComponents[index] = newComponents[index - 1];
      newComponents[index - 1] = temp;
      
      return newComponents;
    });
    
    // Preserve expanded state during reordering
    setCollapsedComponents(prev => {
      // Just return the same set - no changes to collapsed state during reordering
      return new Set(prev);
    });
  }, []);

  // Manejar el movimiento de componentes hacia abajo
  const handleMoveComponentDown = useCallback((componentId: string) => {
    // No actualizamos selectedComponentId para evitar que afecte el estado de colapso
    
    setComponents(prevComponents => {
      const index = prevComponents.findIndex(component => component.id === componentId);
      if (index < 0 || index >= prevComponents.length - 1) return prevComponents;
      
      // Crear un nuevo array con el componente movido una posición hacia abajo
      const newComponents = [...prevComponents];
      const temp = newComponents[index];
      newComponents[index] = newComponents[index + 1];
      newComponents[index + 1] = temp;
      
      return newComponents;
    });
    
    // Preserve expanded state during reordering
    setCollapsedComponents(prev => {
      // Just return the same set - no changes to collapsed state during reordering
      return new Set(prev);
    });
  }, []);

  // Function to collapse or expand all components
  const handleCollapseAll = useCallback((e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent event bubbling
    setAllCollapsed(prev => {
      const newAllCollapsed = !prev;
      
      // Update collapsed components set based on new state
      if (newAllCollapsed) {
        // Collapse all components
        const allComponentIds = new Set(components.map(c => c.id));
        setCollapsedComponents(allComponentIds);
        console.log('Collapsing all components:', [...allComponentIds]);
      } else {
        // Expand all components
        setCollapsedComponents(new Set());
        console.log('Expanding all components');
      }
      
      return newAllCollapsed;
    });
  }, [components]);

  // Initialize components as expanded by default
  useEffect(() => {
    // When components change (like when loading initially or adding new ones)
    // Components should be expanded by default, not collapsed
    if (components.length > 0 && collapsedComponents.size === 0) {
      // Keep components expanded
      setAllCollapsed(false);
    }
  }, [components, collapsedComponents.size]);

  // Render each component - usamos una función memoizada
  const renderComponent = useCallback((component: Component) => {
    if (!component || !component.type || !componentMap[component.type]) {
      return null;
    }

    // Allow component to be collapsed in edit mode
    const isComponentCollapsed = collapsedComponents.has(component.id);

    // Componente específico según el tipo
    const renderComponentContent = () => {
      // Only render content if the component is not collapsed in edit mode
      if (isEditing && isComponentCollapsed) {
        return null;
      }

      // Obtener las clases específicas para este tipo de componente
      const customClassName = componentClassName ? componentClassName(component.type) : '';
      
      // Aplicamos la clase personalizada al elemento contenedor
      const containerClass = customClassName || '';

      // Añadir atributos especiales para componentes en páginas LANDING
      const containerProps = {
        className: containerClass,
        'data-component-type': component.type.toLowerCase(),
        'data-component-id': component.id
      };

      switch(component.type) {
        case 'Hero': {
          const HeroComponent = componentMap.Hero;
          return (
            <div {...containerProps}>
            <HeroComponent 
              title={component.data.title as string || "Default Title"} 
              subtitle={component.data.subtitle as string || "Default Subtitle"}
              image={component.data.image as string}
              cta={component.data.cta as { text: string; url: string }}
              isEditing={isEditing}
              onUpdate={(data) => handleUpdate(component, data)}
            />
            </div>
          );
        }
        
        case 'Text': {
          const TextComponent = componentMap.Text;
          return (
            <div {...containerProps}>
            <TextComponent 
              title={component.data.title as string} 
              content={component.data.content as string}
              isEditing={isEditing}
              onUpdate={(data) => handleUpdate(component, data)}
            />
            </div>
          );
        }
        
        case 'Image': {
          const ImageComponent = componentMap.Image;
          return (
            <div {...containerProps}>
            <ImageComponent 
              src={component.data.src as string} 
              alt={component.data.alt as string}
              caption={component.data.caption as string}
              isEditing={isEditing}
              onUpdate={(data) => handleUpdate(component, data)}
            />
            </div>
          );
        }
        
        case 'Feature': {
          const FeatureComponent = componentMap.Feature;
          return (
            <div {...containerProps}>
            <FeatureComponent 
              title={component.data.title as string} 
              description={component.data.description as string}
              icon={component.data.icon as string}
              isEditing={isEditing}
              onUpdate={(data) => handleUpdate(component, data)}
            />
            </div>
          );
        }
        
        case 'Testimonial': {
          const TestimonialComponent = componentMap.Testimonial;
          return (
            <div {...containerProps}>
            <TestimonialComponent 
              quote={component.data.quote as string} 
              author={component.data.author as string}
              role={component.data.role as string}
              avatar={component.data.avatar as string}
              isEditing={isEditing}
              onUpdate={(data) => handleUpdate(component, data)}
            />
            </div>
          );
        }
        
        case 'Card': {
          const CardComponent = componentMap.Card;
          return (
            <div {...containerProps}>
            <CardComponent 
              title={component.data.title as string} 
              description={component.data.description as string}
              image={component.data.image as string}
              link={component.data.link as string}
              buttonText={component.data.buttonText as string}
              isEditing={isEditing}
              onUpdate={(data) => handleUpdate(component, data)}
            />
            </div>
          );
        }
        
        case 'Header': {
          const HeaderComponent = componentMap.Header;
          return (
            <div {...containerProps}>
            <HeaderComponent 
              title={component.data.title as string} 
              subtitle={component.data.subtitle as string}
              isEditing={isEditing}
              onUpdate={(data) => handleUpdate(component, data)}
            />
            </div>
          );
        }
        
        case 'Benefit': {
          const BenefitComponent = componentMap.Benefit;
          return (
            <div {...containerProps}>
              <BenefitComponent 
                title={component.data.title as string} 
                description={component.data.description as string}
                iconType={component.data.iconType as string || 'check'}
                accentColor={component.data.accentColor as string || '#01319c'}
                backgroundColor={component.data.backgroundColor as string || 'from-[#ffffff] to-[#f0f9ff]'}
                showGrid={component.data.showGrid as boolean || true}
                showDots={component.data.showDots as boolean || true}
                isEditing={isEditing}
                onUpdate={(data) => handleUpdate(component, data)}
              />
            </div>
          );
        }
        
        default: {
          return (
            <div {...containerProps} className={containerClass}>
            <div className="p-4 bg-warning/10 rounded-md border border-warning/20 mb-4">
              <p className="text-warning-foreground text-sm">Componente desconocido: {component.type}</p>
              </div>
            </div>
          );
        }
      }
    };

    return (
      <ComponentWrapperMemo 
        key={component.id}
        component={component}
        isEditing={isEditing}
        onRemove={removeComponent}
        onMoveUp={handleMoveComponentUp}
        onMoveDown={handleMoveComponentDown}
        isFirst={components.indexOf(component) === 0}
        isLast={components.indexOf(component) === components.length - 1}
        isCollapsed={isComponentCollapsed}
        onToggleCollapse={handleToggleCollapse}
      >
        {renderComponentContent()}
      </ComponentWrapperMemo>
    );
  }, [
    isEditing, 
    handleUpdate, 
    removeComponent,
    handleMoveComponentUp, 
    handleMoveComponentDown, 
    components, 
    collapsedComponents, 
    handleToggleCollapse,
    componentClassName
  ]);

  // Memorizamos la lista de componentes renderizados
  const renderedComponents = useMemo(() => {
    return components.map(component => renderComponent(component));
  }, [components, renderComponent, componentsDataString]);

  // Función para activar el diálogo de agregar componente
  const handleClickAddComponent = useCallback(() => {
    console.log('[SectionManager] Solicitando diálogo para agregar componente');
    // Dispatch event to notify SectionsTab to open the component dialog
    document.dispatchEvent(new CustomEvent('section:request-add-component'));
  }, []);

  return (
    <div 
      className={cn(
        "w-full transition-all duration-200",
        isEditing && "relative min-h-[200px] border border-border/40 rounded-lg p-4 mb-8 hover:border-border",
        // Remove any spacing between components when not in editing mode
        !isEditing && "flex flex-col"
      )}
      data-section-manager="true"
    >
      {isEditing && (
        <div className="flex justify-end mb-4">
          <div
            onClick={handleCollapseAll}
            className="flex items-center space-x-1 px-2 py-1 text-xs rounded-md bg-muted/50 hover:bg-muted text-muted-foreground transition-colors cursor-pointer"
            aria-label={allCollapsed ? "Expandir todos" : "Colapsar todos"}
            title={allCollapsed ? "Expandir todos" : "Colapsar todos"}
          >
            <span>{allCollapsed ? "Expandir todos los componentes" : "Colapsar todos los componentes"}</span>
            {allCollapsed ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="3" y1="12" x2="21" y2="12"></line>
                <polyline points="8 5 3 12 8 19"></polyline>
                <polyline points="16 5 21 12 16 19"></polyline>
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="3" y1="12" x2="21" y2="12"></line>
                <polyline points="16 19 21 12 16 5"></polyline>
                <polyline points="8 19 3 12 8 5"></polyline>
              </svg>
            )}
          </div>
        </div>
      )}
      
      {isEditing && components.length === 0 && (
        <div 
          onClick={handleClickAddComponent}
          className="flex flex-col items-center justify-center h-[200px] text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
        >
          <PlusCircle className="h-8 w-8 mb-2 text-muted-foreground/60" />
          <p className="text-sm">Haz clic para agregar componentes</p>
        </div>
      )}

      {/* Renderizar componentes memorizados */}
      <div className="section-components">
        {renderedComponents}
      </div>

      {/* Indicador para agregar nuevo componente - siempre visible en modo edición */}
      {isEditing && components.length > 0 && (
        <div 
          className="flex justify-center items-center py-3 mt-4 border-t border-border/30 pt-4"
          onClick={handleClickAddComponent}
        >
          <div className="flex items-center gap-2 px-4 py-2 border border-dashed border-primary/30 rounded-full text-xs text-muted-foreground hover:text-foreground hover:border-primary hover:bg-accent/5 transition-all cursor-pointer">
            <PlusCircle className="h-3 w-3" />
            <span>Agregar nuevo componente</span>
          </div>
        </div>
      )}
    </div>
  );
}

// Exportamos el componente memoizado
export default memo(SectionManagerBase); 