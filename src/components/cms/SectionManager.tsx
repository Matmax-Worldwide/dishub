'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { PlusIcon, XMarkIcon } from '@heroicons/react/24/outline';
import React from 'react';

// Type for available components
type ComponentType = 'Hero' | 'Text' | 'Image' | 'Feature' | 'Testimonial' | 'Header';

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
    'Hero', 'Text', 'Image', 'Feature', 'Testimonial', 'Header'
  ];

  // Add a new component
  const addComponent = (type: ComponentType) => {
    const newComponent: Component = {
      id: `component-${Date.now()}`,
      type,
      data: getDefaultData(type),
    };
    
    setComponents([...components, newComponent]);
    setShowComponentPicker(false);
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
      default:
        return {};
    }
  };

  // Remove a component
  const removeComponent = (id: string) => {
    setComponents(components.filter(comp => comp.id !== id));
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

  return (
    <div className="relative min-h-[200px] border-dashed border-2 border-blue-200 rounded-lg p-4 mb-8">
      {components.length === 0 && !showComponentPicker && (
        <div className="flex items-center justify-center h-[200px] text-gray-400">
          {isEditing ? 'Add components to this section' : 'No components in this section'}
        </div>
      )}

      {/* Render each component */}
      {components.map(component => {
        // Log to debug component data
        console.log(`Rendering component: ${component.id}, type: ${component.type}`, component.data);
        
        // Type-safe rendering based on component type
        switch(component.type) {
          case 'Hero':
            const HeroComponent = componentMap.Hero;
            return (
              <div key={component.id} className="relative mb-4">
                {isEditing && (
                  <button 
                    onClick={() => removeComponent(component.id)}
                    className="absolute top-2 right-2 p-1 bg-red-100 hover:bg-red-200 rounded-full z-10"
                  >
                    <XMarkIcon className="h-4 w-4 text-red-500" />
                  </button>
                )}
                <HeroComponent 
                  title={component.data.title as string || "Default Title"} 
                  subtitle={component.data.subtitle as string || "Default Subtitle"}
                  image={component.data.image as string}
                  cta={component.data.cta as { text: string; url: string }}
                  isEditing={isEditing}
                  onUpdate={(updatedData) => {
                    const updatedComponent = {
                      ...component,
                      data: { ...component.data, ...updatedData }
                    };
                    setComponents(
                      components.map(c => 
                        c.id === component.id ? updatedComponent : c
                      )
                    );
                  }}
                />
              </div>
            );
          
          case 'Header':
            const HeaderComponent = componentMap.Header;
            return (
              <div key={component.id} className="relative mb-4">
                {isEditing && (
                  <button 
                    onClick={() => removeComponent(component.id)}
                    className="absolute top-2 right-2 p-1 bg-red-100 hover:bg-red-200 rounded-full z-10"
                  >
                    <XMarkIcon className="h-4 w-4 text-red-500" />
                  </button>
                )}
                <HeaderComponent 
                  title={component.data.title as string || "Default Title"} 
                  subtitle={component.data.subtitle as string || "Default Subtitle"}
                  isEditing={isEditing}
                  onUpdate={(updatedData) => {
                    const updatedComponent = {
                      ...component,
                      data: { ...component.data, ...updatedData }
                    };
                    setComponents(
                      components.map(c => 
                        c.id === component.id ? updatedComponent : c
                      )
                    );
                  }}
                />
              </div>
            );
          
          case 'Text':
            const TextComponent = componentMap.Text;
            console.log(`TextComponent props:`, {
              title: component.data.title,
              content: component.data.content,
              isEditing
            });
            return (
              <div key={component.id} className="relative mb-4 border-2 border-transparent hover:border-blue-100">
                {isEditing && (
                  <button 
                    onClick={() => removeComponent(component.id)}
                    className="absolute top-2 right-2 p-1 bg-red-100 hover:bg-red-200 rounded-full z-10"
                  >
                    <XMarkIcon className="h-4 w-4 text-red-500" />
                  </button>
                )}
                <TextComponent 
                  title={component.data.title as string} 
                  content={component.data.content as string}
                  isEditing={isEditing}
                  onUpdate={(updatedData) => {
                    const updatedComponent = {
                      ...component,
                      data: { ...component.data, ...updatedData }
                    };
                    setComponents(
                      components.map(c => 
                        c.id === component.id ? updatedComponent : c
                      )
                    );
                  }}
                />
              </div>
            );
          
          case 'Image':
            const ImageComponent = componentMap.Image;
            return (
              <div key={component.id} className="relative mb-4 border-2 border-transparent hover:border-blue-100">
                {isEditing && (
                  <button 
                    onClick={() => removeComponent(component.id)}
                    className="absolute top-2 right-2 p-1 bg-red-100 hover:bg-red-200 rounded-full z-10"
                  >
                    <XMarkIcon className="h-4 w-4 text-red-500" />
                  </button>
                )}
                <ImageComponent 
                  src={component.data.src as string || ""} 
                  alt={component.data.alt as string || "Image"}
                  caption={component.data.caption as string}
                  isEditing={isEditing}
                  onUpdate={(updatedData) => {
                    const updatedComponent = {
                      ...component,
                      data: { ...component.data, ...updatedData }
                    };
                    setComponents(
                      components.map(c => 
                        c.id === component.id ? updatedComponent : c
                      )
                    );
                  }}
                />
              </div>
            );
          
          case 'Feature':
            const FeatureComponent = componentMap.Feature;
            return (
              <div key={component.id} className="relative mb-4">
                {isEditing && (
                  <button 
                    onClick={() => removeComponent(component.id)}
                    className="absolute top-2 right-2 p-1 bg-red-100 hover:bg-red-200 rounded-full z-10"
                  >
                    <XMarkIcon className="h-4 w-4 text-red-500" />
                  </button>
                )}
                <FeatureComponent 
                  title={component.data.title as string || "Feature Title"} 
                  description={component.data.description as string || "Feature Description"}
                  icon={component.data.icon as string || "star"}
                />
              </div>
            );
          
          case 'Testimonial':
            const TestimonialComponent = componentMap.Testimonial;
            return (
              <div key={component.id} className="relative mb-4">
                {isEditing && (
                  <button 
                    onClick={() => removeComponent(component.id)}
                    className="absolute top-2 right-2 p-1 bg-red-100 hover:bg-red-200 rounded-full z-10"
                  >
                    <XMarkIcon className="h-4 w-4 text-red-500" />
                  </button>
                )}
                <TestimonialComponent 
                  quote={component.data.quote as string || "Testimonial Quote"} 
                  author={component.data.author as string || "Author"}
                  role={component.data.role as string}
                  avatar={component.data.avatar as string}
                />
              </div>
            );
          
          default:
            return <div key={component.id}>Unknown component type: {component.type}</div>;
        }
      })}

      {/* Add component button (only in edit mode) */}
      {isEditing && (
        <>
          <button
            onClick={() => setShowComponentPicker(!showComponentPicker)}
            className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex items-center gap-1 px-3 py-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors"
          >
            <PlusIcon className="h-5 w-5" />
            <span>Add Component</span>
          </button>
          
          {showComponentPicker && <ComponentPicker />}
        </>
      )}
    </div>
  );
} 