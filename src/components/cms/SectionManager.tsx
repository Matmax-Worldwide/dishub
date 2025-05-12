'use client';

import { useState, useEffect, useCallback, useMemo, memo } from 'react';
import dynamic from 'next/dynamic';
import { PlusIcon, XMarkIcon } from '@heroicons/react/24/outline';
import React from 'react';

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
    loading: () => <div className="p-12 text-center">Loading Hero component...</div>
  }),
  Text: dynamic(() => import('./sections/TextSection'), {
    loading: () => <div className="p-12 text-center">Loading Text component...</div>
  }),
  Image: dynamic(() => import('./sections/ImageSection'), {
    loading: () => <div className="p-12 text-center">Loading Image component...</div>
  }),
  Feature: dynamic(() => import('./sections/FeatureSection'), {
    loading: () => <div className="p-12 text-center">Loading Feature component...</div>
  }),
  Testimonial: dynamic(() => import('./sections/TestimonialSection'), {
    loading: () => <div className="p-12 text-center">Loading Testimonial component...</div>
  }),
  Header: dynamic(() => import('./sections/HeaderSection'), {
    loading: () => <div className="p-12 text-center">Loading Header component...</div>
  }),
  Card: dynamic(() => import('./sections/CardSection'), {
    loading: () => <div className="p-12 text-center">Loading Card component...</div>
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
  const handleRemove = useCallback(() => {
    onRemove(component.id);
  }, [component.id, onRemove]);

  return (
    <div key={component.id} className={isEditing ? "relative mb-4" : ""}>
      {isEditing && (
        <button 
          onClick={handleRemove}
          className="absolute top-2 right-2 p-1 bg-red-100 hover:bg-red-200 rounded-full z-10"
        >
          <XMarkIcon className="h-4 w-4 text-red-500" />
        </button>
      )}
      {children}
    </div>
  );
});

// Componente memoizado para el selector de componentes
const ComponentPickerMemo = memo(function ComponentPicker({ 
  availableComponents, 
  onAddComponent 
}: { 
  availableComponents: ComponentType[]; 
  onAddComponent: (type: ComponentType) => void 
}) {
  return (
    <div className="absolute bottom-16 left-1/2 transform -translate-x-1/2 bg-white rounded-lg shadow-xl p-4 z-50">
      <div className="grid grid-cols-2 gap-2 w-64">
        {availableComponents.map(type => (
          <button
            key={type}
            onClick={() => onAddComponent(type)}
            className="p-2 text-sm bg-blue-50 hover:bg-blue-100 rounded transition-colors"
          >
            {type}
          </button>
        ))}
      </div>
    </div>
  );
});

// Componente memoizado para el botón de agregar componentes
const AddComponentButton = memo(function AddComponentButton({
  onClick
}: {
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
    >
      <PlusIcon className="h-4 w-4 mr-2" />
      Add Component
    </button>
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
  const [showComponentPicker, setShowComponentPicker] = useState(false);
  const initialComponentsRef = React.useRef(false);

  // Creamos un objeto memoizado para los componentes disponibles
  const availableComponents = useMemo<ComponentType[]>(() => {
    return ['Hero', 'Text', 'Image', 'Feature', 'Testimonial', 'Header', 'Card'];
  }, []);

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

  // Memorizamos las funciones para evitar recreaciones en cada renderizado
  // Add a new component
  const addComponent = useCallback((type: ComponentType) => {
    const newComponent: Component = {
      id: `component-${Date.now()}`,
      type,
      data: getDefaultData(type),
    };
    
    setComponents(prevComponents => [...prevComponents, newComponent]);
    setShowComponentPicker(false);
  }, []);

  // Get default data based on component type
  const getDefaultData = useCallback((type: ComponentType): Record<string, unknown> => {
    switch (type) {
      case 'Hero':
        return { title: 'New Hero Section', subtitle: 'Add your subtitle here', image: '' };
      case 'Text':
        return { title: 'Text Section', content: 'Add your content here' };
      case 'Image':
        return { src: '', alt: 'Image description', caption: '' };
      case 'Feature':
        return { title: 'Feature', description: 'Feature description', icon: 'star' };
      case 'Testimonial':
        return { quote: 'Testimonial quote', author: 'Author name', role: 'Author role' };
      case 'Header':
        return { title: 'Header Section', subtitle: 'Add your subtitle here' };
      case 'Card':
        return { title: 'Card Title', description: 'Card description', image: '', link: '', buttonText: 'Leer más' };
      default:
        return {};
    }
  }, []);

  // Remove a component
  const removeComponent = useCallback((id: string) => {
    setComponents(prevComponents => prevComponents.filter(comp => comp.id !== id));
  }, []);

  // Memoize the toggle function
  const toggleComponentPicker = useCallback(() => {
    setShowComponentPicker(prev => !prev);
  }, []);

  // Creamos una función memoizada para actualizar los componentes
  const handleUpdate = useCallback((component: Component, updatedData: Record<string, unknown>) => {
    const updatedComponent = {
      ...component,
      data: { ...component.data, ...updatedData }
    };
    
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
            <div className="p-4 bg-yellow-50 rounded border border-yellow-200 mb-4">
              <p className="text-yellow-700">Componente desconocido: {component.type}</p>
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

  return (
    <div className={isEditing ? "relative min-h-[200px] border-dashed border-2 border-blue-200 rounded-lg p-4 mb-8" : "w-full"}>
      {isEditing && components.length === 0 && !showComponentPicker && (
        <div className="flex items-center justify-center h-[200px] text-gray-400">
          Add components to this section
        </div>
      )}

      {/* Renderizar componentes memorizados */}
      <div className="section-components">
        {renderedComponents}
      </div>

      {/* Show component picker button only in editing mode */}
      {isEditing && (
        <div className="mt-4 flex justify-center">
          <AddComponentButton onClick={toggleComponentPicker} />
          {showComponentPicker && (
            <ComponentPickerMemo 
              availableComponents={availableComponents}
              onAddComponent={addComponent}
            />
          )}
        </div>
      )}
    </div>
  );
}

// Exportamos el componente memoizado
export default memo(SectionManagerBase); 