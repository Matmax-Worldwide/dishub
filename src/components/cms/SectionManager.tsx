'use client';

import { useState, useEffect } from 'react';
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

export default function SectionManager({ 
  initialComponents = [], 
  isEditing = false,
  onComponentsChange
}: SectionManagerProps) {
  // Create a ref to track if initialComponents have been set
  const [components, setComponents] = useState<Component[]>(initialComponents);
  const [showComponentPicker, setShowComponentPicker] = useState(false);
  const initialComponentsRef = React.useRef(false);

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
      console.log('Notifying parent of component changes:', components.length);
      onComponentsChange(components);
    }
  }, [components, onComponentsChange]);

  // Available component types
  const availableComponents: ComponentType[] = [
    'Hero', 'Text', 'Image', 'Feature', 'Testimonial', 'Header', 'Card'
  ];

  // Add a new component
  const addComponent = (type: ComponentType) => {
    const newComponent: Component = {
      id: `component-${Date.now()}`,
      type,
      data: getDefaultData(type),
    };
    
    const updatedComponents = [...components, newComponent];
    setComponents(updatedComponents);
    setShowComponentPicker(false);
    
    // Forzar la notificación de cambios al padre inmediatamente
    // Esto ayuda especialmente cuando se añade el primer componente a una sección vacía
    if (onComponentsChange) {
      console.log('Notificando al padre inmediatamente después de añadir componente:', 
                 updatedComponents.length);
      onComponentsChange(updatedComponents);
    }
  };

  // Get default data based on component type
  const getDefaultData = (type: ComponentType): Record<string, unknown> => {
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
  };

  // Remove a component
  const removeComponent = (id: string) => {
    const updatedComponents = components.filter(comp => comp.id !== id);
    setComponents(updatedComponents);
    
    // Forzar la notificación de cambios al padre inmediatamente
    if (onComponentsChange) {
      console.log('Notificando al padre inmediatamente después de eliminar componente:', 
                 updatedComponents.length);
      onComponentsChange(updatedComponents);
    }
  };

  // ComponentPicker popover
  const ComponentPicker = () => (
    <div className="absolute bottom-16 left-1/2 transform -translate-x-1/2 bg-white rounded-lg shadow-xl p-4 z-50">
      <div className="grid grid-cols-2 gap-2 w-64">
        {availableComponents.map(type => (
          <button
            key={type}
            onClick={() => addComponent(type)}
            className="p-2 text-sm bg-blue-50 hover:bg-blue-100 rounded transition-colors"
          >
            {type}
          </button>
        ))}
      </div>
    </div>
  );

  // Render each component
  const renderComponent = (component: Component) => {
    // Generar un ID único para este evento de renderizado
    const renderId = `render-${component.id.substring(0, 4)}-${Math.random().toString(36).substring(2, 5)}`;
    console.log(`🔄 [${renderId}] Iniciando renderizado de componente: ${component.id}, tipo: ${component.type}`);
    
    // Verificar que el componente tenga los campos necesarios
    if (!component.type) {
      console.error(`❌ [${renderId}] Tipo de componente no definido:`, component);
      return (
        <div key={component.id} className="p-4 bg-red-50 rounded border border-red-200 mb-4">
          <p className="text-red-500">Error: Tipo de componente no definido</p>
        </div>
      );
    }
    
    // Verificar que el tipo de componente exista en el mapa
    if (!componentMap[component.type]) {
      console.error(`❌ [${renderId}] Tipo de componente no soportado: ${component.type}`);
      return (
        <div key={component.id} className="p-4 bg-red-50 rounded border border-red-200 mb-4">
          <p className="text-red-500">Error: Tipo de componente no soportado: {component.type}</p>
        </div>
      );
    }
    
    console.log(`🔍 [${renderId}] Datos del componente:`, JSON.stringify(component.data, null, 2));
    
    // Definir un wrapper común para todos los componentes - solo aplicable en modo edición
    const ComponentWrapper = ({ children }: { children: React.ReactNode }) => (
      <div key={component.id} className={isEditing ? "relative mb-4" : ""}>
        {isEditing && (
          <button 
            onClick={() => removeComponent(component.id)}
            className="absolute top-2 right-2 p-1 bg-red-100 hover:bg-red-200 rounded-full z-10"
          >
            <XMarkIcon className="h-4 w-4 text-red-500" />
          </button>
        )}
        {children}
      </div>
    );
    
    // Función común para actualizar componentes
    const handleUpdate = (updatedData: Record<string, unknown>) => {
      console.log(`🔄 [${renderId}] Actualizando datos de componente:`, updatedData);
      const updatedComponent = {
        ...component,
        data: { ...component.data, ...updatedData }
      };
      setComponents(
        components.map(c => 
          c.id === component.id ? updatedComponent : c
        )
      );
    };
    
    try {
      // Renderizar el componente según su tipo
      switch(component.type) {
        case 'Hero': {
          console.log(`🔄 [${renderId}] Renderizando Hero Component`);
          const HeroComponent = componentMap.Hero;
          return (
            <ComponentWrapper key={component.id}>
              <HeroComponent 
                title={component.data.title as string || "Default Title"} 
                subtitle={component.data.subtitle as string || "Default Subtitle"}
                image={component.data.image as string}
                cta={component.data.cta as { text: string; url: string }}
                isEditing={isEditing}
                onUpdate={handleUpdate}
              />
            </ComponentWrapper>
          );
        }
        
        case 'Header': {
          console.log(`🔄 [${renderId}] Renderizando Header Component`);
          const HeaderComponent = componentMap.Header;
          return (
            <ComponentWrapper key={component.id}>
              <HeaderComponent 
                title={component.data.title as string || "Default Title"} 
                subtitle={component.data.subtitle as string || "Default Subtitle"}
                isEditing={isEditing}
                onUpdate={handleUpdate}
              />
            </ComponentWrapper>
          );
        }
        
        case 'Text': {
          console.log(`🔄 [${renderId}] Renderizando Text Component`);
          const TextComponent = componentMap.Text;
          return (
            <ComponentWrapper key={component.id}>
              <TextComponent 
                title={component.data.title as string} 
                content={component.data.content as string}
                isEditing={isEditing}
                onUpdate={handleUpdate}
              />
            </ComponentWrapper>
          );
        }
        
        case 'Image': {
          console.log(`🔄 [${renderId}] Renderizando Image Component`);
          const ImageComponent = componentMap.Image;
          return (
            <ComponentWrapper key={component.id}>
              <ImageComponent 
                src={component.data.src as string} 
                alt={component.data.alt as string}
                caption={component.data.caption as string}
                isEditing={isEditing}
                onUpdate={handleUpdate}
              />
            </ComponentWrapper>
          );
        }
        
        case 'Feature': {
          console.log(`🔄 [${renderId}] Renderizando Feature Component`);
          const FeatureComponent = componentMap.Feature;
          return (
            <ComponentWrapper key={component.id}>
              <FeatureComponent 
                title={component.data.title as string} 
                description={component.data.description as string}
                icon={component.data.icon as string}
              />
            </ComponentWrapper>
          );
        }
        
        case 'Testimonial': {
          console.log(`🔄 [${renderId}] Renderizando Testimonial Component`);
          const TestimonialComponent = componentMap.Testimonial;
          return (
            <ComponentWrapper key={component.id}>
              <TestimonialComponent 
                quote={component.data.quote as string} 
                author={component.data.author as string}
                role={component.data.role as string}
              />
            </ComponentWrapper>
          );
        }
        
        case 'Card': {
          console.log(`🔄 [${renderId}] Renderizando Card Component`);
          const CardComponent = componentMap.Card;
          return (
            <ComponentWrapper key={component.id}>
              <CardComponent 
                title={component.data.title as string} 
                description={component.data.description as string}
                image={component.data.image as string}
                link={component.data.link as string}
                buttonText={component.data.buttonText as string}
                isEditing={isEditing}
                onUpdate={handleUpdate}
              />
            </ComponentWrapper>
          );
        }
        
        default: {
          console.error(`❌ [${renderId}] Tipo de componente no manejado: ${component.type}`);
          return (
            <div key={component.id} className="p-4 bg-yellow-50 rounded border border-yellow-200 mb-4">
              <p className="text-yellow-700">Componente desconocido: {component.type}</p>
            </div>
          );
        }
      }
    } catch (error) {
      console.error(`❌ [${renderId}] Error al renderizar componente:`, error);
      return (
        <div key={component.id} className="p-4 bg-red-50 rounded border border-red-200 mb-4">
          <p className="text-red-500">Error al renderizar: {error instanceof Error ? error.message : String(error)}</p>
        </div>
      );
    }
  };

  return (
    <div className={isEditing ? "relative min-h-[200px] border-dashed border-2 border-blue-200 rounded-lg p-4 mb-8" : "w-full"}>
      {isEditing && components.length === 0 && !showComponentPicker && (
        <div className="flex items-center justify-center h-[200px] text-gray-400">
          Add components to this section
        </div>
      )}

      {/* Renderizar cada componente usando la función de renderizado */}
      <div className="section-components">
        {components.map(component => renderComponent(component))}
      </div>

      {/* Show component picker button only in editing mode */}
      {isEditing && (
        <div className="mt-4 flex justify-center">
          <button
            onClick={() => setShowComponentPicker(!showComponentPicker)}
            className="flex items-center px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Add Component
          </button>
          {showComponentPicker && <ComponentPicker />}
        </div>
      )}
    </div>
  );
} 