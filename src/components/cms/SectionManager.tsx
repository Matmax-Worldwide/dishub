'use client';

import { useState, useEffect, useCallback, useMemo, memo } from 'react';
import dynamic from 'next/dynamic';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { PlusCircle } from 'lucide-react';
import React from 'react';
import { cmsOperations } from '@/lib/graphql-client';
import { cn } from '@/lib/utils';

// Type for available components
type ComponentType = 'Hero' | 'Text' | 'Image' | 'Feature' | 'Testimonial' | 'Header' | 'Card';

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
};

interface SectionManagerProps {
  initialComponents?: Component[];
  isEditing?: boolean;
  onComponentsChange?: (components: Component[]) => void;
}

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
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [componentTitle, setComponentTitle] = useState(component.title || component.type || 'Component');
  const [isHovered, setIsHovered] = useState(false);
  
  const handleRemove = useCallback(() => {
    onRemove(component.id);
  }, [component.id, onRemove]);

  const handleMoveUp = useCallback(() => {
    if (onMoveUp) onMoveUp(component.id);
  }, [component.id, onMoveUp]);

  const handleMoveDown = useCallback(() => {
    if (onMoveDown) onMoveDown(component.id);
  }, [component.id, onMoveDown]);

  const handleTitleClick = () => {
    if (isEditing) {
      setIsEditingTitle(true);
    }
  };

  const handleTitleSave = () => {
    setIsEditingTitle(false);
    // Update component title on parent component if changed
    if (component.title !== componentTitle) {
      // Store the old title for comparison
      const oldTitle = component.title;
      
      // We'll no longer update the title directly, just through data
      // This avoids issues with the GraphQL API schema
      
      // Directly update the title in the database
      if (component.id) {
        console.log(`Updating component title in database: ${oldTitle} → ${componentTitle}`);
        
        // Find the section ID - look for it in the parent context or ID
        const sectionId = document.querySelector('[data-section-id]')?.getAttribute('data-section-id');
        
        if (sectionId) {
          cmsOperations.updateComponentTitle(sectionId, component.id, componentTitle)
            .then(result => {
              if (result.success) {
                console.log('Component title updated in database successfully');
              } else {
                console.error('Failed to update component title in database:', result.message);
              }
            })
            .catch(error => {
              console.error('Error updating component title in database:', error);
            });
        } else {
          console.warn('Could not find section ID to update component title');
        }
      }
      
      // Force an update to the component data
      const componentCopy = { ...component };
      onRemove(component.id);
      
      // Small delay to avoid React rendering issues
      setTimeout(() => {
        // Add the updated component back with the new title in data
        if (!componentCopy.data) {
          componentCopy.data = {};
        }
        componentCopy.data.componentTitle = componentTitle;
        
        // Update the title property for UI display (it won't be sent to API)
        componentCopy.title = componentTitle;
        
        // This re-adding will trigger the parent's onComponentsChange
        document.dispatchEvent(new CustomEvent('component:add', { detail: componentCopy }));
      }, 10);
    }
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleTitleSave();
    }
  };

  const handleToggleCollapse = useCallback(() => {
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
        "relative mb-6 group transition-all duration-200",
        isEditing && "pt-2 rounded-lg",
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
              
              {isEditingTitle ? (
              <div className="flex items-center">
                <input
                  type="text"
                  value={componentTitle}
                  onChange={(e) => setComponentTitle(e.target.value)}
                  onBlur={handleTitleSave}
                  onKeyDown={handleTitleKeyDown}
                    className="border border-input rounded-md px-2 py-1 mr-2 text-xs w-full focus:outline-none focus:ring-2 focus:ring-ring focus:border-input"
                  autoFocus
                />
              </div>
            ) : (
              <div 
                onClick={handleTitleClick} 
                  className="text-xs font-medium text-muted-foreground hover:text-foreground cursor-pointer"
              >
                {componentTitle}
              </div>
            )}
            </div>
            <div className="flex items-center space-x-1">
              {/* Collapse button */}
              <div
                onClick={handleToggleCollapse}
                className="opacity-30 hover:opacity-100 transition-opacity duration-200 p-1 hover:bg-accent/10 rounded-full cursor-pointer"
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
                className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-1 bg-destructive/10 hover:bg-destructive/20 rounded-full cursor-pointer"
                aria-label="Eliminar componente"
            >
                <XMarkIcon className="h-3 w-3 text-destructive" />
            </div>
            </div>
          </div>
          <div className="h-px bg-border w-full mb-3 opacity-60"></div>
        </>
      )}
      {(!isEditing || !isCollapsed) && (
        <div className={cn(isEditing && "px-3 py-1")}>
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
  onComponentsChange
}: SectionManagerProps) {
  const [components, setComponents] = useState<Component[]>(initialComponents);
  // Track if the insert hint should be shown
  const [showInsertHint, setShowInsertHint] = useState(false);
  // Track collapsed components by ID - initialize with all components collapsed
  const [collapsedComponents, setCollapsedComponents] = useState<Set<string>>(() => 
    new Set(initialComponents.map(comp => comp.id))
  );
  // Add a flag to track if all components are collapsed - start with true if there are components
  const [allCollapsed, setAllCollapsed] = useState(initialComponents.length > 0);
  
  // Cache component data stringified to prevent unnecessary re-renders
  const componentsDataString = useMemo(() => JSON.stringify(components), [components]);

  // Efecto para inicializar componentes iniciales
  useEffect(() => {
    // Solo actualizar los componentes si es una primera carga o una actualización importante
    // pero no si solo estamos reordenando o colapsando/expandiendo
    if (initialComponents.length > 0 && components.length === 0) {
      setComponents(initialComponents);
      // Ensure all initial components are collapsed by default
      setCollapsedComponents(new Set(initialComponents.map(comp => comp.id)));
      setAllCollapsed(true);
    }
  }, [initialComponents, components.length]);

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
        if (!component.type || !['Hero', 'Text', 'Image', 'Feature', 'Testimonial', 'Header', 'Card'].includes(component.type)) {
          console.error(`[SectionManager] ❌ Tipo de componente no válido: ${component.type}`);
          return;
        }
        
        console.log(`[SectionManager] ✅ Agregando componente: ${component.id} (${component.type})`);
        
        // Make sure new component is collapsed by default
        setCollapsedComponents(prev => {
          const newSet = new Set(prev);
          newSet.add(component.id);
          return newSet;
        });
        
        // Asegurar que los datos del componente tengan la estructura correcta
        setComponents(prev => {
          // Create a shallow copy to preserve component references where possible
          // This is important to prevent unnecessary re-renders
          const newComponents = [...prev];
          
          // If component already exists with same ID, preserve its reference
          const existingIndex = newComponents.findIndex(c => c.id === component.id);
          if (existingIndex >= 0) {
            // Update existing component without changing its reference
            newComponents[existingIndex] = {
              ...newComponents[existingIndex],
              ...component,
              data: { ...newComponents[existingIndex].data, ...component.data }
            };
          } else {
            // Add new component
            newComponents.push(component);
          }
          
          console.log(`[SectionManager] 📊 Componentes actualizados: ${newComponents.length}`);
          
          // Use a timeout to prevent React batching issues and ensure
          // the UI is updated before notifying the parent
          if (onComponentsChange) {
            window.setTimeout(() => {
              console.log('[SectionManager] 🔄 Notificando cambio de componentes con', newComponents.length, 'componentes');
              onComponentsChange(newComponents);
            }, 0);
          }
          
          return newComponents;
        });
      } else {
        console.error('[SectionManager] ❌ Evento component:add recibido sin datos');
      }
    };

    document.addEventListener('component:add', handleComponentAdd);
    return () => {
      document.removeEventListener('component:add', handleComponentAdd);
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
    // Create a new component object with updated data
    const updatedComponent = {
      ...component,
      data: { ...component.data, ...updatedData }
    };
    
    // Preserve title if it exists
    if (component.title) {
      updatedComponent.title = component.title;
    }
    
    // Update components using functional update to avoid stale closures
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
  }, []);

  // Handle collapsing/expanding components
  const handleToggleCollapse = useCallback((componentId: string, isCollapsed: boolean) => {
    console.log(`Toggling collapse for component ${componentId}. Current state: ${isCollapsed ? 'collapsed' : 'expanded'}`);
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

  // Function to collapse or expand all components
  const handleCollapseAll = useCallback(() => {
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

  // Initialize components as collapsed by default
  useEffect(() => {
    // When components change (like when loading initially or adding new ones)
    // make sure all new components are collapsed by default
    const newComponentIds = components
      .filter(comp => !initialComponents.some(ic => ic.id === comp.id))
      .map(comp => comp.id);
    
    if (newComponentIds.length > 0) {
      setCollapsedComponents(prev => {
        const newSet = new Set(prev);
        newComponentIds.forEach(id => newSet.add(id));
        return newSet;
      });
    }
  }, [components, initialComponents]);

  // Render each component - usamos una función memoizada
  const renderComponent = useCallback((component: Component) => {
    if (!component || !component.type || !componentMap[component.type]) {
      return null;
    }

    // Check if component is collapsed
    const isComponentCollapsed = collapsedComponents.has(component.id);

    // Componente específico según el tipo
    const renderComponentContent = () => {
      // Only render content if the component is not collapsed in edit mode
      if (isEditing && isComponentCollapsed) {
        return null;
      }

      switch(component.type) {
        case 'Hero': {
          const HeroComponent = componentMap.Hero;
          return (
            <HeroComponent 
              title={component.data.title as string || "Default Title"} 
              subtitle={component.data.subtitle as string || "Default Subtitle"}
              image={component.data.image as string}
              cta={component.data.cta as { text: string; url: string }}
              isEditing={isEditing}
              onUpdate={(data) => handleUpdate(component, data)}
            />
          );
        }
        
        case 'Text': {
          const TextComponent = componentMap.Text;
          return (
            <TextComponent 
              title={component.data.title as string} 
              content={component.data.content as string}
              isEditing={isEditing}
              onUpdate={(data) => handleUpdate(component, data)}
            />
          );
        }
        
        case 'Image': {
          const ImageComponent = componentMap.Image;
          return (
            <ImageComponent 
              src={component.data.src as string} 
              alt={component.data.alt as string}
              caption={component.data.caption as string}
              isEditing={isEditing}
              onUpdate={(data) => handleUpdate(component, data)}
            />
          );
        }
        
        case 'Feature': {
          const FeatureComponent = componentMap.Feature;
          return (
            <FeatureComponent 
              title={component.data.title as string} 
              description={component.data.description as string}
              icon={component.data.icon as string}
              isEditing={isEditing}
              onUpdate={(data) => handleUpdate(component, data)}
            />
          );
        }
        
        case 'Testimonial': {
          const TestimonialComponent = componentMap.Testimonial;
          return (
            <TestimonialComponent 
              quote={component.data.quote as string} 
              author={component.data.author as string}
              role={component.data.role as string}
              avatar={component.data.avatar as string}
              isEditing={isEditing}
              onUpdate={(data) => handleUpdate(component, data)}
            />
          );
        }
        
        case 'Card': {
          const CardComponent = componentMap.Card;
          return (
            <CardComponent 
              title={component.data.title as string} 
              description={component.data.description as string}
              image={component.data.image as string}
              link={component.data.link as string}
              buttonText={component.data.buttonText as string}
              isEditing={isEditing}
              onUpdate={(data) => handleUpdate(component, data)}
            />
          );
        }
        
        case 'Header': {
          const HeaderComponent = componentMap.Header;
          return (
            <HeaderComponent 
              title={component.data.title as string} 
              subtitle={component.data.subtitle as string}
              isEditing={isEditing}
              onUpdate={(data) => handleUpdate(component, data)}
            />
          );
        }
        
        default: {
          return (
            <div className="p-4 bg-warning/10 rounded-md border border-warning/20 mb-4">
              <p className="text-warning-foreground text-sm">Componente desconocido: {component.type}</p>
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
    handleToggleCollapse
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
        isEditing && "relative min-h-[200px] border border-border/40 rounded-lg p-4 mb-8 hover:border-border"
      )}
      onMouseEnter={() => setShowInsertHint(true)}
      onMouseLeave={() => setShowInsertHint(false)}
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

      {/* Indicador para agregar nuevo componente */}
      {isEditing && components.length > 0 && (
        <div 
          className={cn(
            "flex justify-center items-center py-3 mt-2 transition-all duration-300 cursor-pointer",
            showInsertHint ? "opacity-100" : "opacity-0"
          )}
          onClick={handleClickAddComponent}
        >
          <div className="flex items-center gap-2 px-4 py-2 border border-dashed border-border rounded-full text-xs text-muted-foreground hover:text-foreground hover:border-primary/30 hover:bg-accent/5 transition-all">
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