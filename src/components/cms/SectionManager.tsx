'use client';

import React, { useState, useEffect, useCallback, useMemo, memo, useRef } from 'react';
import dynamic from 'next/dynamic';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { PlusCircle, ChevronDown, ChevronUp, Trash2, GripHorizontal, Minimize2, Maximize2, Crosshair } from 'lucide-react';
import { cn } from '@/lib/utils';
import ComponentTitleInput from './ComponentTitleInput';

// Confirmation Dialog Component
const ConfirmationDialog = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title = "Confirm Action", 
  message = "Are you sure you want to perform this action?"
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message?: string;
}) => {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999]" onClick={onClose}>
      <div 
        className="bg-white rounded-lg p-6 shadow-2xl w-full max-w-md transform transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-medium mb-2">{title}</h3>
        <p className="text-gray-600 mb-6">{message}</p>
        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="px-4 py-2 rounded-md bg-red-600 text-white hover:bg-red-700"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

// Type for available components
type ComponentType = 'Hero' | 'Text' | 'Image' | 'Feature' | 'Testimonial' | 'Header' | 'Card' | 'Benefit' | 'Footer';

export interface Component {
  id: string;
  type: ComponentType;
  data: Record<string, unknown>;
  subtitle?: string;
}

// Dynamic imports for components - fallback to a loading state
const componentMap = {
  Header: dynamic(() => import('./sections/HeaderSection'), {
    loading: () => <div className="flex items-center justify-center p-8 h-32 bg-muted/20 rounded-md animate-pulse">Cargando Header...</div>
  }),
  Hero: dynamic(() => import('./sections/HeroSection'), {
    loading: () => <div className="flex items-center justify-center p-8 h-32 bg-muted/20 rounded-md animate-pulse">Cargando Hero...</div>
  }),
  Benefit: dynamic(() => import('./sections/BenefitSection'), {
    loading: () => <div className="flex items-center justify-center p-8 h-32 bg-muted/20 rounded-md animate-pulse">Cargando Benefit...</div>
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
  Card: dynamic(() => import('./sections/CardSection'), {
    loading: () => <div className="flex items-center justify-center p-8 h-32 bg-muted/20 rounded-md animate-pulse">Cargando Card...</div>
  }),
  Footer: dynamic(() => import('./sections/FooterSection'), {
    loading: () => <div className="flex items-center justify-center p-8 h-32 bg-muted/20 rounded-md animate-pulse">Cargando Footer...</div>
  }),
};

// Props for the SectionManager component
interface SectionManagerProps {
  initialComponents?: Component[];
  isEditing?: boolean;
  onComponentsChange?: (components: Component[]) => void;
  componentClassName?: (type: string) => string;
  activeComponentId?: string | null;
  onClickComponent?: (componentId: string) => void;
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
  onToggleCollapse,
  isActive = false,
  onComponentClick
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
  isActive?: boolean;
  onComponentClick?: (componentId: string) => void;
}) {
  const [isHovered, setIsHovered] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  // Get component title from component data if it exists
  const title = (component.data.componentTitle as string) || `${component.type} Component`;
  
  const handleRemoveClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowDeleteConfirm(true);
  };
  
  const confirmDelete = () => {
    onRemove(component.id);
  };

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

  const handleToggle = useCallback((e?: React.MouseEvent) => {
    // Always stop propagation to prevent conflict with component click
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    console.log(`Toggle button clicked for component ${component.id}. Current state: ${isCollapsed ? 'collapsed' : 'expanded'}`);
    
    if (onToggleCollapse) {
      // We're passing the *current* state for the component
      // The parent will invert it (expand if collapsed, collapse if expanded)
      onToggleCollapse(component.id, isCollapsed);
    }
  }, [component.id, isCollapsed, onToggleCollapse]);

  const handleClick = useCallback(() => {
    console.log(`Component ${component.id} clicked`);
    
    if (onComponentClick) {
      onComponentClick(component.id);
      
      // We're no longer auto-expanding the component when clicked
      // This will allow our toggle button to work independently
    }
  }, [component.id, onComponentClick]);

  return (
    <div 
      className={cn(
        "component-wrapper relative group border rounded-md transition-all",
        isEditing ? "border-border bg-card/50 hover:border-foreground/20" : "",
        isActive && isEditing ? "border-primary border-2 ring-0 outline-none bg-primary/5" : "",
        !isEditing && "border-transparent",
        isHovered && isEditing && "bg-accent/5",
        isEditing && "cursor-pointer"
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      data-component-id={component.id}
      onClick={handleClick}
    >
      
      {isEditing && (
        <div className="flex items-center justify-between px-3 py-2 bg-muted/20 border-b border-border/30 rounded-t-md">
          <div className="flex items-center space-x-2">
            <div 
              className="cursor-ns-resize touch-none p-1 rounded hover:bg-muted/50"
              title="Arrastrar para reordenar"
              onClick={(e) => e.stopPropagation()}
            >
              <GripHorizontal className="h-4 w-4 text-muted-foreground" />
            </div>
            
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleToggle(e);
              }}
              className={cn(
                "p-1.5 rounded transition-all",
                isCollapsed 
                  ? "bg-primary/10 hover:bg-primary/20 text-primary" 
                  : "bg-muted/40 hover:bg-muted/60 text-muted-foreground hover:text-foreground"
              )}
              title={isCollapsed ? "Expandir componente" : "Colapsar componente"}
              aria-label={isCollapsed ? "Expandir componente" : "Colapsar componente"}
              data-collapsed={isCollapsed}
              data-component-id={component.id}
              type="button"
            >
              {isCollapsed ? (
                <Maximize2 className="h-4 w-4" />
              ) : (
                <Minimize2 className="h-4 w-4" />
              )}
            </button>
            
            <div className="text-sm font-medium text-foreground flex-1 min-w-0">
              {isEditing ? (
                <ComponentTitleInput
                  componentId={component.id}
                  initialTitle={title}
                  componentType={component.type}
                />
              ) : (
                <span className="truncate">{title}</span>
              )}
            </div>
          </div>
          
          {isEditing && (
            <div className="flex items-center space-x-1">
              {onMoveUp && !isFirst && (
                <div 
                  onClick={handleMoveUp}
                  className="cursor-pointer p-1 rounded hover:bg-muted/50"
                  title="Mover arriba"
                >
                  <ChevronUp className="h-4 w-4 text-muted-foreground" />
                </div>
              )}
              
              {onMoveDown && !isLast && (
                <div 
                  onClick={handleMoveDown}
                  className="cursor-pointer p-1 rounded hover:bg-muted/50"
                  title="Mover abajo"
                >
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                </div>
              )}
              
              <div 
                onClick={handleRemoveClick}
                className="opacity-60 hover:opacity-100 transition-opacity duration-200 p-1 bg-destructive hover:bg-destructive/90 rounded-full cursor-pointer"
                aria-label="Eliminar componente"
                title="Eliminar componente"
              >
                <Trash2 className="h-3.5 w-3.5 text-white" />
              </div>
            </div>
          )}
        </div>
      )}
      
      <div className={cn(
        isEditing ? (!isCollapsed ? 'block p-4' : 'hidden') : 'block'
      )}>
        {children}
      </div>
      
      {/* Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={confirmDelete}
        title="Delete Component"
        message={`Are you sure you want to delete the "${title}" component? This action cannot be undone.`}
      />
    </div>
  );
});

// Componente principal memoizado
function SectionManagerBase({ 
  initialComponents = [], 
  isEditing = false,
  onComponentsChange,
  componentClassName,
  activeComponentId,
  onClickComponent
}: SectionManagerProps) {
  const [components, setComponents] = useState<Component[]>(initialComponents);
  // Track collapsed components by ID - initialize with empty set (all expanded)
  const [collapsedComponents, setCollapsedComponents] = useState<Set<string>>(new Set());
  // Track components that were explicitly collapsed by user clicks
  const [userCollapsedComponents, setUserCollapsedComponents] = useState<Set<string>>(new Set());
  // Referencia para guardar el elemento activo antes del autoguardado
  const activeElementRef = useRef<Element | null>(null);
  // Estado para controlar las actualizaciones debounced de los componentes
  const [pendingUpdate, setPendingUpdate] = useState<{component: Component, data: Record<string, unknown>} | null>(null);
  // Aplicar debounce al pendingUpdate para evitar actualizaciones demasiado frecuentes
  const debouncedPendingUpdate = useDebounce(pendingUpdate, 1000);
  // State for inspection mode
  const [inspectionMode, setInspectionMode] = useState(false);
  // Track the field to focus after inspection
  const [fieldToFocus, setFieldToFocus] = useState<string | null>(null);
  
  // Creamos un ID único para cada conjunto de componentes para optimizar
  const componentsDataString = useMemo(() => JSON.stringify(components), [components]);

  // Efecto para inicializar componentes iniciales
  useEffect(() => {
    if (initialComponents.length > 0) {
      setComponents(initialComponents);
    }
  }, [initialComponents]);
  
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
      if (component.data.componentTitle) {
        updatedComponent.data.componentTitle = component.data.componentTitle;
      }
      
      // Capture current collapse state to preserve it
      const currentlyCollapsed = collapsedComponents.has(component.id);
      
      // Actualizar componentes - FIX: Only update if data actually changed
      const stringifiedOriginalData = JSON.stringify(component.data);
      const stringifiedUpdatedData = JSON.stringify(updatedComponent.data);
      
      if (stringifiedOriginalData !== stringifiedUpdatedData) {
        setComponents(prevComponents => 
          prevComponents.map(c => 
            c.id === component.id ? updatedComponent : c
          )
        );
        
        // Maintain the collapse state after the update
        if (!currentlyCollapsed) {
          setCollapsedComponents(prev => {
            const newSet = new Set(prev);
            newSet.delete(component.id);
            return newSet;
          });
        }
      }
      
      // Limpiar el pendingUpdate
      setPendingUpdate(null);
    }
  }, [debouncedPendingUpdate]); // Only dependency should be the debounced update
  

  // State for component selector
  const [isComponentSelectorOpen, setIsComponentSelectorOpen] = useState(false);
  const [activeComponent, setActiveComponent] = useState<ComponentType>('Text');
  const [sliderPosition, setSliderPosition] = useState(0);

  // Handler for showing component selector
  const handleAddButtonClick = () => {
    setIsComponentSelectorOpen(true);
  };

  // Handler for adding components
  const handleClickAddComponent = (type: ComponentType = 'Text') => {
    // Generate a unique ID with crypto.randomUUID or a fallback
    const id = typeof crypto !== 'undefined' && 'randomUUID' in crypto 
      ? crypto.randomUUID()
      : `temp-${Math.random().toString(36).substr(2, 9)}`;
    
    // Create the new component
    const newComponent: Component = {
      id,
      type,
      data: {
        ...(type === 'Benefit' ? {
          title: 'Feature Title',
          description: 'Description of this feature',
          iconType: 'CheckCircle',
          accentColor: '#01319c',
          backgroundColor: 'from-[#ffffff] to-[#f0f9ff]',
          showGrid: true,
          showDots: true,
        } : {}),
        componentTitle: `${type} Component`
      }
    };
    
    let updatedComponents: Component[];
    
    // Determine where to place the component based on its type
    if (type === 'Header') {
      // Place Header at the beginning
      updatedComponents = [newComponent, ...components];
    } else if (type === 'Footer') {
      // Place Footer at the end
      updatedComponents = [...components, newComponent];
    } else {
      // If there's a Header, place after Header
      // If there's a Footer, place before Footer
      const headerIndex = components.findIndex(c => c.type === 'Header');
      const footerIndex = components.findIndex(c => c.type === 'Footer');
      
      if (headerIndex !== -1 && footerIndex !== -1) {
        // If both Header and Footer exist, place in the middle
        updatedComponents = [
          ...components.slice(0, footerIndex),
          newComponent,
          ...components.slice(footerIndex)
        ];
      } else if (headerIndex !== -1) {
        // If only Header exists, place after Header
        updatedComponents = [
          ...components.slice(0, headerIndex + 1),
          newComponent,
          ...components.slice(headerIndex + 1)
        ];
      } else if (footerIndex !== -1) {
        // If only Footer exists, place before Footer
        updatedComponents = [
          ...components.slice(0, footerIndex),
          newComponent,
          ...components.slice(footerIndex)
        ];
      } else {
        // Default case: just append at the end
        updatedComponents = [...components, newComponent];
      }
    }
    
    // Update components array
    setComponents(updatedComponents);
    
    // Notify parent of changes if callback exists - MOVED OUTSIDE setState
    if (onComponentsChange) {
      // Use setTimeout to prevent render cycle issues
      setTimeout(() => {
        onComponentsChange(updatedComponents);
      }, 0);
    }
  };

  const ComponentSelector = () => {
    // Definición de los componentes disponibles con sus metadatos
    const availableComponents: Array<{
      type: ComponentType;
      title: string;
      description: string;
      icon: React.ReactNode;
      color: string;
      preview: React.ReactNode;
      disabled?: boolean;
    }> = [
      {
        type: 'Header',
        title: 'Header Component',
        description: 'Navigation headers for the website',
        icon: (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M3 5H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            <path d="M3 12H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            <path d="M3 19H17" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        ),
        color: 'text-slate-500 bg-slate-100 border-slate-200',
        disabled: false,
        preview: (
          <div className="flex flex-col p-3 bg-gradient-to-br from-slate-50 to-slate-100 rounded-md opacity-50">
            <div className="flex justify-between items-center">
              <div className="w-8 h-3 bg-slate-300 rounded"></div>
              <div className="flex space-x-2">
                <div className="w-4 h-2 bg-slate-300 rounded"></div>
                <div className="w-4 h-2 bg-slate-300 rounded"></div>
                <div className="w-4 h-2 bg-slate-300 rounded"></div>
                <div className="w-6 h-2 bg-slate-400 rounded"></div>
              </div>
            </div>
          </div>
        )
      },
      {
        type: 'Hero',
        title: 'Hero Component',
        description: 'Large banner sections for page headers',
        icon: (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="2" y="3" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="2"/>
            <path d="M8 21H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            <path d="M12 17V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        ),
        color: 'text-indigo-500 bg-indigo-100 border-indigo-200',
        disabled: false,
        preview: (
          <div className="flex flex-col p-3 bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-md opacity-50">
            <div className="bg-indigo-200 w-full h-16 rounded-md mb-2 flex items-center justify-center">
              <div className="w-1/2 h-8 flex flex-col justify-center items-center">
                <div className="h-2 bg-indigo-300 rounded w-full mb-2"></div>
                <div className="h-1.5 bg-indigo-300 rounded w-3/4"></div>
              </div>
            </div>
            <div className="flex justify-center">
              <div className="h-4 w-16 bg-indigo-300 rounded-full"></div>
            </div>
          </div>
        )
      },
      {
        type: 'Benefit',
        title: 'Benefit Component',
        description: 'Showcase the benefits of your product or service',
        icon: (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M9 11L12 14L22 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M21 12V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        ),
        color: 'text-teal-500 bg-teal-100 border-teal-200',
        preview: (
          <div className="flex flex-col p-3 bg-gradient-to-br from-teal-50 to-teal-100 rounded-md">
            <div className="flex items-center justify-center mb-2">
              <div className="w-8 h-8 rounded-full bg-teal-200 flex items-center justify-center">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" className="text-teal-500">
                  <path d="M9 11L12 14L22 4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </div>
            <div className="h-2 bg-teal-200 rounded w-3/4 mx-auto mb-2"></div>
            <div className="h-1.5 bg-teal-200 rounded w-5/6 mx-auto"></div>
          </div>
        )
      },
      {
        type: 'Text',
        title: 'Text Component',
        description: 'For paragraphs, articles and general text content',
        icon: (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M4 7V5H20V7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M12 5V19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M8 19H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        ),
        color: 'text-blue-500 bg-blue-100 border-blue-200',
        preview: (
          <div className="flex flex-col p-3 bg-gradient-to-br from-blue-50 to-blue-100 rounded-md">
            <h3 className="text-sm font-medium text-blue-900 mb-2">Text Component</h3>
            <div className="space-y-2">
              <div className="h-2 bg-blue-200 rounded w-3/4"></div>
              <div className="h-2 bg-blue-200 rounded"></div>
              <div className="h-2 bg-blue-200 rounded"></div>
              <div className="h-2 bg-blue-200 rounded w-5/6"></div>
              <div className="h-2 bg-blue-200 rounded w-4/6"></div>
            </div>
          </div>
        )
      },
      {
        type: 'Image',
        title: 'Image Component',
        description: 'For displaying images and visual content',
        disabled: true,
        icon: (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2"/>
            <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor"/>
            <path d="M21 15L16 10L9 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        ),
        color: 'text-emerald-500 bg-emerald-100 border-emerald-200',
        preview: (
          <div className="flex flex-col p-3 bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-md">
            <div className="bg-emerald-200 w-full h-20 rounded-md flex items-center justify-center">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-emerald-400">
                <rect x="3" y="3" width="18" height="18" rx="2" strokeWidth="2"/>
                <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor"/>
                <path d="M21 15L16 10L9 17" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div className="h-2 bg-emerald-200 rounded w-1/2 mt-2 mx-auto"></div>
          </div>
        )
      },
      {
        type: 'Feature',
        title: 'Feature Component',
        description: 'Highlight key features with icons and text',
        disabled: true,
        icon: (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="2"/>
            <path d="M16 12L10 8V16L16 12Z" fill="currentColor"/>
          </svg>
        ),
        color: 'text-amber-500 bg-amber-100 border-amber-200',
        preview: (
          <div className="flex flex-col p-3 bg-gradient-to-br from-amber-50 to-amber-100 rounded-md">
            <div className="flex mb-2">
              <div className="w-6 h-6 rounded-full bg-amber-300 mr-2 flex-shrink-0"></div>
              <div>
                <div className="h-2 bg-amber-200 rounded w-20 mb-1"></div>
                <div className="h-1.5 bg-amber-200 rounded w-24"></div>
              </div>
            </div>
            <div className="flex mb-2">
              <div className="w-6 h-6 rounded-full bg-amber-300 mr-2 flex-shrink-0"></div>
              <div>
                <div className="h-2 bg-amber-200 rounded w-24 mb-1"></div>
                <div className="h-1.5 bg-amber-200 rounded w-20"></div>
              </div>
            </div>
          </div>
        )
      },
      {
        type: 'Testimonial',
        title: 'Testimonial Component',
        description: 'Display customer testimonials and reviews',
        icon: (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M21 15C21 16.6569 19.6569 18 18 18H8L4 22V8C4 6.34315 5.34315 5 7 5H18C19.6569 5 21 6.34315 21 8V15Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        ),
        color: 'text-fuchsia-500 bg-fuchsia-100 border-fuchsia-200',
        disabled: true,
        preview: (
          <div className="flex flex-col p-3 bg-gradient-to-br from-fuchsia-50 to-fuchsia-100 rounded-md opacity-50">
            <div className="text-fuchsia-700 mb-1 text-lg">&ldquo;</div>
            <p className="text-xs text-fuchsia-900 italic">This product has completely transformed our business processes.</p>
            <div className="mt-2 flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-fuchsia-200"></div>
              <div className="h-2 bg-fuchsia-200 rounded w-20"></div>
            </div>
          </div>
        )
      },
      {
        type: 'Card',
        title: 'Card Component',
        description: 'Display information in card format',
        disabled: true,
        icon: (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2"/>
            <path d="M7 8H17" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            <path d="M7 12H11" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            <path d="M7 16H11" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        ),
        color: 'text-rose-500 bg-rose-100 border-rose-200',
        preview: (
          <div className="flex flex-col p-3 bg-gradient-to-br from-rose-50 to-rose-100 rounded-md">
            <div className="bg-rose-200 w-full h-10 rounded-t-md"></div>
            <div className="p-2 border border-t-0 border-rose-200 rounded-b-md bg-white">
              <div className="h-2 bg-rose-200 rounded w-3/4 mb-2"></div>
              <div className="h-1.5 bg-rose-200 rounded w-full mb-1"></div>
              <div className="h-1.5 bg-rose-200 rounded w-4/5"></div>
            </div>
          </div>
        )
      },
      {
        type: 'Footer',
        title: 'Footer Component',
        description: 'Page footer with links and copyright information',
        icon: (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M4 19H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            <path d="M4 15H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            <path d="M10 19V15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        ),
        color: 'text-gray-500 bg-gray-100 border-gray-200',
        disabled: false,
        preview: (
          <div className="flex flex-col p-3 bg-gradient-to-br from-gray-50 to-gray-100 rounded-md opacity-50">
            <div className="mt-auto">
              <div className="h-px w-full bg-gray-200 mb-2"></div>
              <div className="flex justify-between items-center">
                <div className="w-20 h-2 bg-gray-300 rounded"></div>
                <div className="flex space-x-1">
                  <div className="w-3 h-3 rounded-full bg-gray-300"></div>
                  <div className="w-3 h-3 rounded-full bg-gray-300"></div>
                  <div className="w-3 h-3 rounded-full bg-gray-300"></div>
                </div>
              </div>
            </div>
          </div>
        )
      },
    ];

    // Ensure sliderPosition is in bounds
    useEffect(() => {
      if (sliderPosition < 0) {
        setSliderPosition(0);
      } else if (sliderPosition >= availableComponents.length) {
        setSliderPosition(availableComponents.length - 1);
      }
    }, [sliderPosition, availableComponents.length]);

    // Update active component based on slider position
    useEffect(() => {
      if (!availableComponents[sliderPosition].disabled) {
        setActiveComponent(availableComponents[sliderPosition].type);
      }
    }, [sliderPosition, availableComponents]);

    const handleSliderChange = (newPosition: number) => {
      setSliderPosition(newPosition);
    };

    const handleSelectComponent = () => {
      // Skip if the component is disabled
      if (availableComponents[sliderPosition].disabled) return;
      
      handleClickAddComponent(activeComponent);
      setIsComponentSelectorOpen(false);
    };

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999]" onClick={() => setIsComponentSelectorOpen(false)} style={{ isolation: 'isolate' }}>
        <div 
          className="bg-white rounded-xl p-4 shadow-2xl w-full max-w-2xl transform transition-all relative z-[9999]"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium">Select Component Type</h3>
            <button
              onClick={() => setIsComponentSelectorOpen(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>

          {/* Slider View */}
          <div className="mb-6">
            <div className="relative rounded-xl border border-gray-200 p-4 bg-gray-50">
              {/* Preview of Current Component */}
              <div className="mb-4">
                {availableComponents[sliderPosition].preview}
              </div>
              
              {/* Component Info */}
              <div className="mb-4">
                <div className="flex items-center mb-2">
                  <div className={`mr-3 p-2 rounded-lg ${
                    availableComponents[sliderPosition].disabled 
                      ? 'bg-gray-200 text-gray-400' 
                      : availableComponents[sliderPosition].color
                  }`}>
                    {availableComponents[sliderPosition].icon}
                  </div>
                  <div>
                    <h4 className={`font-medium ${availableComponents[sliderPosition].disabled ? 'text-gray-400' : ''}`}>
                      {availableComponents[sliderPosition].title}
                    </h4>
                    <p className={`text-sm ${availableComponents[sliderPosition].disabled ? 'text-gray-400' : 'text-gray-500'}`}>
                      {availableComponents[sliderPosition].description}
                    </p>
                    {availableComponents[sliderPosition].disabled && (
                      <p className="text-xs text-gray-500 mt-1">
                        Este componente estará disponible en próximas actualizaciones
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Navigation Controls */}
              <div className="flex justify-between items-center">
                <button 
                  onClick={() => handleSliderChange(sliderPosition - 1)}
                  disabled={sliderPosition === 0}
                  className="p-1 rounded bg-gray-200 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M15 19L8 12L15 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
                
                <div className="text-sm text-gray-500">
                  {sliderPosition + 1} of {availableComponents.length}
                </div>
                
                <button 
                  onClick={() => handleSliderChange(sliderPosition + 1)}
                  disabled={sliderPosition === availableComponents.length - 1}
                  className="p-1 rounded bg-gray-200 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M9 5L16 12L9 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* Thumbnail Navigation */}
          <div className="mb-6 overflow-x-auto">
            <div className="flex space-x-2">
              {availableComponents.map((component, index) => (
                <button
                  key={component.type}
                  onClick={() => !component.disabled && handleSliderChange(index)}
                  className={cn(
                    "flex-shrink-0 p-2 rounded-lg border-2 transition-all",
                    component.disabled 
                      ? "border-gray-200 cursor-not-allowed opacity-60" 
                      : sliderPosition === index 
                        ? "border-primary bg-primary/10" 
                        : "border-transparent hover:bg-gray-100"
                  )}
                  disabled={component.disabled}
                  title={component.disabled ? "Disponible próximamente" : component.title}
                >
                  <div className={`w-10 h-10 rounded-md flex items-center justify-center ${
                    component.disabled ? 'text-gray-400 bg-gray-100 border-gray-200' : component.color
                  }`}>
                    {component.icon}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3">
            <button
              onClick={() => setIsComponentSelectorOpen(false)}
              className="px-4 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSelectComponent}
              disabled={availableComponents[sliderPosition].disabled}
              className={`px-4 py-2 rounded-md ${
                availableComponents[sliderPosition].disabled
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-primary text-white hover:bg-primary/90'
              }`}
            >
              {availableComponents[sliderPosition].disabled
                ? 'Próximamente'
                : `Add ${availableComponents[sliderPosition].title}`}
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Efecto para restaurar el foco después de actualizar componentes
  useEffect(() => {
    // Si teníamos un elemento activo, restaurar el foco después de la actualización
    if (activeElementRef.current && activeElementRef.current instanceof HTMLElement) {
      const activeEl = activeElementRef.current;
      
      // Esperar a que el DOM se actualice
      setTimeout(() => {
        try {
          activeEl.focus();
          // Si es un elemento de entrada de texto, mover el cursor al final
          if (
            activeEl instanceof HTMLInputElement || 
            activeEl instanceof HTMLTextAreaElement
          ) {
            // Only set selection for text-type inputs that support it
            const inputType = activeEl.getAttribute('type');
            const isSelectable = !inputType || ['text', 'textarea', 'email', 'password', 'tel', 'url', 'search', 'number'].includes(inputType);
            
            if (isSelectable) {
              const length = activeEl.value.length;
              activeEl.selectionStart = length;
              activeEl.selectionEnd = length;
            }
          }
          
          // Limpiar la referencia
          activeElementRef.current = null;
        } catch (e) {
          console.error("Error restoring focus:", e);
        }
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

  // Initialize components as collapsed by default
  useEffect(() => {
    // When components are loaded initially, they should start collapsed
    if (components.length > 0 && collapsedComponents.size === 0) {
      // Start with all components collapsed by default
      const allComponentIds = new Set(components.map(c => c.id));
      setCollapsedComponents(allComponentIds);
      console.log('Starting with all components collapsed');
    }
  }, [componentsDataString]); // Only run when component data actually changes

  // Auto-expand active component (but respect user's explicit collapse actions)
  useEffect(() => {
    if (activeComponentId && collapsedComponents.has(activeComponentId)) {
      // Only auto-expand if the user didn't explicitly collapse it
      if (!userCollapsedComponents.has(activeComponentId)) {
        // Expand the active component if it's collapsed
        setCollapsedComponents(prev => {
          const newSet = new Set(prev);
          newSet.delete(activeComponentId);
          return newSet;
        });
      }
    }
  }, [activeComponentId, collapsedComponents, userCollapsedComponents]);

  // Handle collapsing/expanding components - ONLY called by explicit collapse toggle button
  const handleToggleCollapse = useCallback((componentId: string, isCollapsed: boolean) => {
    console.log(`Explicitly toggling collapse for component ${componentId}. Current state: ${isCollapsed ? 'collapsed' : 'expanded'}`);
    
    // Note: isCollapsed parameter now represents the CURRENT state, not the target state
    // So if isCollapsed is true, we need to expand it, and vice versa
    
    const wasCollapsed = isCollapsed;
    const willBeCollapsed = !wasCollapsed;
    
    console.log(`Component ${componentId} WAS ${wasCollapsed ? 'collapsed' : 'expanded'}, WILL BE ${willBeCollapsed ? 'collapsed' : 'expanded'}`);
    
    setCollapsedComponents(prev => {
      const newSet = new Set(prev);
      
      // If currently collapsed, expand it (remove from set)
      // If currently expanded, collapse it (add to set)
      if (wasCollapsed) {
        console.log(`Expanding component ${componentId}`);
        newSet.delete(componentId);
        
        // Remove from user collapsed components when explicitly expanded
        setUserCollapsedComponents(prevUserCollapsed => {
          const newUserCollapsed = new Set(prevUserCollapsed);
          newUserCollapsed.delete(componentId);
          return newUserCollapsed;
        });
      } else {
        console.log(`Collapsing component ${componentId}`);
        newSet.add(componentId);
        
        // Add to user collapsed components when explicitly collapsed
        setUserCollapsedComponents(prevUserCollapsed => {
          const newUserCollapsed = new Set(prevUserCollapsed);
          newUserCollapsed.add(componentId);
          return newUserCollapsed;
        });
      }
      
      return newSet;
    });
  }, []);

  // Agregar de vuelta el event listener para component:update-title
  useEffect(() => {
    const handleComponentTitleUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<{
        componentId: string;
        newTitle: string;
      }>;
      
      if (customEvent.detail) {
        const { componentId, newTitle } = customEvent.detail;
        console.log(`[SectionManager] 📝 Updating title for component ${componentId}: ${newTitle}`);
        
        setComponents(prev => {
          // Create a shallow copy to preserve component references
          const newComponents = [...prev];
          
          // Find the component to update
          const existingIndex = newComponents.findIndex(c => c.id === componentId);
          if (existingIndex !== -1) {
            // Create a new component object to avoid reference issues
            newComponents[existingIndex] = {
              ...newComponents[existingIndex],
              // Store title in data.componentTitle instead of in title property
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
            setTimeout(() => {
              onComponentsChange(newComponents);
            }, 100);
          }
          
          return newComponents;
        });
      } else {
        console.error('[SectionManager] ❌ component:update-title event received without data');
      }
    };

    document.addEventListener('component:update-title', handleComponentTitleUpdate);
    
    return () => {
      document.removeEventListener('component:update-title', handleComponentTitleUpdate);
    };
  }, [onComponentsChange]);

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

  // Handle when a component is clicked to collapse others
  const handleComponentClick = useCallback((componentId: string) => {
    // Set as active component
    if (onClickComponent) {
      onClickComponent(componentId);
    }
    
    // We're no longer toggling components when clicked
    // Instead, we only collapse other components
    setCollapsedComponents(prev => {
      const newSet = new Set<string>();
      
      // Add all component IDs to the set (all collapsed) except the active one
      components.forEach(component => {
        if (component.id !== componentId) {
          newSet.add(component.id);
        } else {
          // For the active component, preserve its current state
          if (prev.has(componentId)) {
            newSet.add(componentId);
          }
        }
      });
      
      return newSet;
    });
  }, [components, onClickComponent]);

  // Manejar el movimiento de componentes hacia arriba
  const handleMoveComponentUp = useCallback((componentId: string) => {
    const component = components.find(c => c.id === componentId);
    if (!component) return;
    
    // No mover si es Header o si es el primer componente
    if (component.type === 'Header' || components.indexOf(component) === 0) {
      return;
    }
    
    // No mover si justo arriba hay un Header
    const index = components.indexOf(component);
    if (index <= 0) return;
    
    const prevComponent = components[index - 1];
    if (prevComponent.type === 'Header') {
      return;
    }
    
    setComponents(prevComponents => {
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
  }, [components]);

  // Manejar el movimiento de componentes hacia abajo
  const handleMoveComponentDown = useCallback((componentId: string) => {
    const component = components.find(c => c.id === componentId);
    if (!component) return;
    
    // No mover si es Footer o si es el último componente
    if (component.type === 'Footer' || components.indexOf(component) === components.length - 1) {
      return;
    }
    
    // No mover si justo abajo hay un Footer
    const index = components.indexOf(component);
    if (index >= components.length - 1) return;
    
    const nextComponent = components[index + 1];
    if (nextComponent.type === 'Footer') {
      return;
    }
    
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
  }, [components]);

  // Toggle inspection mode
  const toggleInspectionMode = useCallback(() => {
    setInspectionMode(prev => !prev);
  }, []);

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
      if (onClickComponent) {
        onClickComponent(componentId);
        
        // Make sure component is expanded
        setCollapsedComponents(prev => {
          const newSet = new Set(prev);
          newSet.delete(componentId as string);
          return newSet;
        });
        
        // Set the field to focus
        if (fieldType) {
          setFieldToFocus(fieldType);
        }
      }
      
      // Exit inspection mode
      setInspectionMode(false);
    }
  }, [inspectionMode, onClickComponent]);

  // Set up and clean up inspection mode listener
  useEffect(() => {
    if (inspectionMode) {
      // Add hover highlights to elements that can be inspected
      document.body.classList.add('inspection-mode');
      
      // Listen for click events to inspect elements
      document.addEventListener('click', handleInspectElement);
      
      return () => {
        document.body.classList.remove('inspection-mode');
        document.removeEventListener('click', handleInspectElement);
      };
    }
  }, [inspectionMode, handleInspectElement]);

  // Add these styles to the document head
  useEffect(() => {
    if (isEditing) {
      // Create a style element
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
      `;
      
      // Add it to the document
      document.head.appendChild(styleEl);
      
      return () => {
        // Clean up
        const existingStyle = document.getElementById('inspection-mode-styles');
        if (existingStyle) {
          existingStyle.remove();
        }
      };
    }
  }, [isEditing]);

  // Additional effect to focus the appropriate field after inspection
  useEffect(() => {
    if (fieldToFocus && activeComponentId) {
      // Wait for the DOM to update
      setTimeout(() => {
        try {
          // Try to find an input with a matching data attribute
          const input = document.querySelector(`[data-field-id="${fieldToFocus}"]`) as HTMLInputElement;
          
          if (input) {
            input.focus();
            console.log(`Focused input field: ${fieldToFocus}`);
          } else {
            console.log(`Could not find input field: ${fieldToFocus}`);
          }
          
          // Clear the field to focus
          setFieldToFocus(null);
        } catch (error) {
          console.error("Error focusing field:", error);
        }
      }, 300);
    }
  }, [fieldToFocus, activeComponentId]);

  // Render each component - usamos una función memoizada
  const renderComponent = useCallback((component: Component) => {
    if (!component || !component.type || !componentMap[component.type]) {
      return null;
    }

    // Allow component to be collapsed in edit mode
    const isComponentCollapsed = collapsedComponents.has(component.id);
    
    // Determine if this is Header, Footer, first or last component
    const isHeader = component.type === 'Header';
    const isFooter = component.type === 'Footer';
    const componentIndex = components.indexOf(component);
    const isFirst = componentIndex === 0;
    const isLast = componentIndex === components.length - 1;

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
              secondaryCta={component.data.secondaryCta as { text: string; url: string }}
              badgeText={component.data.badgeText as string}
              showAnimatedDots={component.data.showAnimatedDots as boolean}
              showIcon={component.data.showIcon as boolean}
              isEditing={isEditing}
              onUpdate={isEditing ? (data) => handleUpdate(component, data) : undefined}
            />
            </div>
          );
        }
        
        case 'Text': {
          const TextComponent = componentMap.Text;
          return (
            <div {...containerProps}>
            <TextComponent 
              title={component.data.title as string || "Default Title"} 
              content={component.data.content as string || "Default Content"}
              isEditing={isEditing}
              onUpdate={isEditing ? (data) => handleUpdate(component, data) : undefined}
            />
            </div>
          );
        }
        
        case 'Image': {
          const ImageComponent = componentMap.Image;
          return (
            <div {...containerProps}>
            <ImageComponent 
              src={component.data.src as string || ""} 
              alt={component.data.alt as string || ""}
              caption={component.data.caption as string || ""}
              isEditing={isEditing}
              onUpdate={isEditing ? (data) => handleUpdate(component, data) : undefined}
            />
            </div>
          );
        }
        
        case 'Feature': {
          const FeatureComponent = componentMap.Feature;
          return (
            <div {...containerProps}>
            <FeatureComponent 
              title={component.data.title as string || "Feature Title"} 
              description={component.data.description as string || "Feature Description"}
              icon={component.data.icon as string || "star"}
              isEditing={isEditing}
              onUpdate={isEditing ? (data) => handleUpdate(component, data) : undefined}
            />
            </div>
          );
        }
        
        case 'Testimonial': {
          const TestimonialComponent = componentMap.Testimonial;
          return (
            <div {...containerProps}>
            <TestimonialComponent 
              quote={component.data.quote as string || "Testimonial Quote"} 
              author={component.data.author as string || "Author Name"}
              role={component.data.role as string || ""}
              avatar={component.data.avatar as string || ""}
              isEditing={isEditing}
              onUpdate={isEditing ? (data) => handleUpdate(component, data) : undefined}
            />
            </div>
          );
        }
        
        case 'Card': {
          const CardComponent = componentMap.Card;
          return (
            <div {...containerProps}>
            <CardComponent 
              title={component.data.title as string || "Card Title"} 
              description={component.data.description as string || "Card Description"}
              image={component.data.image as string || ""}
              link={component.data.link as string || ""}
              buttonText={component.data.buttonText as string || ""}
              isEditing={isEditing}
              onUpdate={isEditing ? (data) => handleUpdate(component, data) : undefined}
            />
            </div>
          );
        }
        
        case 'Header': {
          const HeaderComponent = componentMap.Header;
          return (
            <div {...containerProps}>
            <HeaderComponent 
              title={component.data.title as string || "Header Title"} 
              subtitle={component.data.subtitle as string || "Header Subtitle"}
              menuId={component.data.menuId as string || ""} 
              backgroundColor={component.data.backgroundColor as string || "#ffffff"}
              textColor={component.data.textColor as string || "#000000"}
              logoUrl={component.data.logoUrl as string || ""}
              isEditing={isEditing}
              onUpdate={isEditing ? (data) => handleUpdate(component, data) : undefined}
            />
            </div>
          );
        }
        
        case 'Benefit': {
          const BenefitComponent = componentMap.Benefit;
          return (
            <div {...containerProps}>
              <BenefitComponent 
                title={component.data.title as string || "Benefit Title"} 
                description={component.data.description as string || "Benefit Description"}
                iconType={component.data.iconType as string || 'CheckCircle'}
                accentColor={component.data.accentColor as string || '#01319c'}
                backgroundColor={component.data.backgroundColor as string || 'from-[#ffffff] to-[#f0f9ff]'}
                showGrid={component.data.showGrid as boolean ?? true}
                showDots={component.data.showDots as boolean ?? true}
                isEditing={isEditing}
                onUpdate={isEditing ? (data) => handleUpdate(component, data) : undefined}
              />
            </div>
          );
        }
        
        default: {
          return (
            <div {...containerProps} className={containerClass}>
              <div className="p-4 bg-warning/10 rounded-md border border-warning/20 mb-4">
                <div className="flex-1">
                  <span className="text-sm opacity-80">
                    {component.type}
                  </span>
                  <h4 className="text-base opacity-80 font-medium line-clamp-1 mb-1">
                    {(component.data.componentTitle as string) || `${component.type} Component`}
                  </h4>
                  <p className="text-warning-foreground text-sm">Componente desconocido</p>
                </div>
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
        onMoveUp={!(isHeader || isFirst) ? handleMoveComponentUp : undefined}
        onMoveDown={!(isFooter || isLast) ? handleMoveComponentDown : undefined}
        isFirst={isFirst || isHeader}
        isLast={isLast || isFooter}
        isCollapsed={isComponentCollapsed}
        onToggleCollapse={handleToggleCollapse}
        isActive={activeComponentId === component.id}
        onComponentClick={handleComponentClick}
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
    componentClassName,
    activeComponentId,
    handleComponentClick
  ]);


  // If we're editing, render the add component button and component list
  return (
    <div className="relative">
      {isEditing && (
        <div className="flex justify-between items-center mb-2 sticky top-0 z-50 bg-white border-b pb-2">
          <h2 className="text-lg font-medium text-gray-900">Page Components</h2>
          <button
            onClick={toggleInspectionMode}
            className={cn(
              "flex items-center space-x-1 px-3 py-1.5 rounded text-sm",
              inspectionMode 
                ? "bg-primary text-white hover:bg-primary/90" 
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            )}
            title="Select elements on page to edit"
          >
            <Crosshair className="h-4 w-4 mr-1" />
            <span>{inspectionMode ? "Exit Inspection" : "Inspect Page"}</span>
          </button>
        </div>
      )}

      {inspectionMode && isEditing && (
        <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mb-3 text-sm text-blue-700">
          Click on any element on the page to select it for editing. The component containing that element will be activated.
        </div>
      )}
      
      {/* Components */}
      <div className="flex flex-col gap-1">
        {components.map((component) => 
          renderComponent(component)
        )}
      </div>

      {/* Component Type Selector Modal */}
      {isComponentSelectorOpen && <ComponentSelector />}

      {isEditing && (
        <div className="mb-6 mt-2">
          <button
            onClick={handleAddButtonClick}
            className={cn(
              "flex items-center justify-center w-full py-2 px-4 rounded-md border-2 border-dashed",
              "transition-colors hover:border-primary/60 hover:bg-primary/5 group",
              "focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40"
            )}
          >
            <PlusCircle className="h-5 w-5 mr-2 text-muted-foreground group-hover:text-primary" />
            <span className="text-sm font-medium text-muted-foreground group-hover:text-primary">
              Add Component
            </span>
          </button>
        </div>
      )}
    </div>
  );
}

// Exportamos el componente memoizado
export default memo(SectionManagerBase); 