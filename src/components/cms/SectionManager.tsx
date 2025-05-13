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
  onRemove 
}: { 
  component: Component; 
  isEditing: boolean; 
  children: React.ReactNode; 
  onRemove: (id: string) => void 
}) {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [componentTitle, setComponentTitle] = useState(component.title || component.type || 'Component');
  const [isHovered, setIsHovered] = useState(false);
  
  const handleRemove = useCallback(() => {
    onRemove(component.id);
  }, [component.id, onRemove]);

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
      
      // Update the local component title
      component.title = componentTitle;
      
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
        // Add the updated component back with the new title
        if (componentCopy.data) {
          componentCopy.data.componentTitle = componentTitle;
        }
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
    >
      {isEditing && (
        <>
          <div className="flex items-center justify-between mb-2 px-3 py-1">
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
            <button 
              onClick={handleRemove}
              className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-1 bg-destructive/10 hover:bg-destructive/20 rounded-full"
              aria-label="Eliminar componente"
            >
              <XMarkIcon className="h-3 w-3 text-destructive" />
            </button>
          </div>
          <div className="h-px bg-border w-full mb-3 opacity-60"></div>
        </>
      )}
      <div className={cn(isEditing && "px-3 py-1")}>
        {children}
      </div>
    </div>
  );
});

// Componente principal memoizado
function SectionManagerBase({ 
  initialComponents = [], 
  isEditing = false,
  onComponentsChange
}: SectionManagerProps) {
  // Create a ref to track if initialComponents have been set
  const [components, setComponents] = useState<Component[]>(initialComponents);
  const initialComponentsRef = React.useRef(false);
  const [showInsertHint, setShowInsertHint] = useState(false);

  // Update components when initialComponents change (from parent)
  // But only if they've not been initialized yet or have actually changed
  useEffect(() => {
    if (initialComponents && initialComponents.length > 0) {
      // Only set components from initialComponents on first render or
      // if they've actually changed and haven't been edited locally
      const initialString = JSON.stringify(initialComponents);
      const currentString = JSON.stringify(components);
      
      if (!initialComponentsRef.current || (initialString !== currentString && components.length === 0)) {
        console.log('Setting components from initialComponents:', initialComponents.length);
        setComponents(initialComponents);
        initialComponentsRef.current = true;
      }
    }
  }, [initialComponents]);

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
        
        // Asegurar que los datos del componente tengan la estructura correcta
        setComponents(prev => {
          const newComponents = [...prev, component];
          console.log(`[SectionManager] 📊 Componentes actualizados: ${newComponents.length}`);
          
          // Notificar inmediatamente el cambio dentro de la función setComponents 
          // para asegurar tener el valor más actualizado
          if (onComponentsChange) {
            setTimeout(() => {
              console.log('[SectionManager] 🔄 Notificando cambio de componentes con', newComponents.length, 'componentes');
              onComponentsChange(newComponents);
            }, 50);
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

  // Update parent component when components change, but only after initial render
  useEffect(() => {
    if (initialComponentsRef.current && onComponentsChange) {
      // Agregamos un pequeño delay para evitar múltiples actualizaciones
      const timer = setTimeout(() => {
        console.log('Notifying parent of component changes:', components.length);
        onComponentsChange(components);
      }, 10);
      
      return () => clearTimeout(timer);
    }
  }, [components, onComponentsChange]);

  // Remove a component
  const removeComponent = useCallback((id: string) => {
    setComponents(prevComponents => prevComponents.filter(comp => comp.id !== id));
  }, []);

  // Creamos una función memoizada para actualizar los componentes
  const handleUpdate = useCallback((component: Component, updatedData: Record<string, unknown>) => {
    const updatedComponent = {
      ...component,
      data: { ...component.data, ...updatedData }
    };
    
    // Preserve title if it exists
    if (component.title) {
      updatedComponent.title = component.title;
    }
    
    setComponents(prevComponents => 
      prevComponents.map(c => 
        c.id === component.id ? updatedComponent : c
      )
    );
  }, []);

  // Render each component - usamos una función memoizada
  const renderComponent = useCallback((component: Component) => {
    if (!component || !component.type || !componentMap[component.type]) {
      return null;
    }

    // Componente específico según el tipo
    const renderComponentContent = () => {
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
      >
        {renderComponentContent()}
      </ComponentWrapperMemo>
    );
  }, [isEditing, handleUpdate, removeComponent]);

  // Memorizamos la lista de componentes renderizados
  const renderedComponents = useMemo(() => {
    return components.map(component => renderComponent(component));
  }, [components, renderComponent]);

  // Función para activar el diálogo de agregar componente
  const handleClickAddComponent = useCallback(() => {
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