import React, { useState, useEffect } from 'react';
import { SaveIcon } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import ManageableSection from '@/components/cms/ManageableSection';
import EmptySectionPlaceholder from './EmptySectionPlaceholder';
import { Section, ManageableSectionHandle } from '@/types/cms';

interface SectionsTabProps {
  pageSections: Section[];
  isSaving: boolean;
  isCreatingSection: boolean;
  isSavingSection: boolean;
  newSectionName: string;
  onNameChange: (name: string) => void;
  onCreateSection: () => void;
  onCancelCreate: () => void;
  onStartCreating: () => void;
  onSectionNameChange: (newName: string) => void;
  onBackClick: () => void;
  onSavePage: () => void;
  sectionRef: React.RefObject<ManageableSectionHandle>;
}

// Tipos de componentes disponibles
const AVAILABLE_COMPONENTS = [
  { type: 'hero', displayType: 'Hero', name: 'Banner Hero', description: 'Banner principal con imagen' },
  { type: 'benefit', displayType: 'Benefit', name: 'Beneficio', description: 'Sección de beneficio con icono y animaciones' },
  { type: 'header', displayType: 'Header', name: 'Encabezado', description: 'Título y subtítulo' },
  { type: 'text', displayType: 'Text', name: 'Texto', description: 'Bloque de contenido textual' },
  { type: 'image', displayType: 'Image', name: 'Imagen', description: 'Imagen con descripción' },
  { type: 'card', displayType: 'Card', name: 'Tarjeta', description: 'Tarjeta con título e imagen' },
  { type: 'feature', displayType: 'Feature', name: 'Característica', description: 'Destacar una característica' },
  { type: 'testimonial', displayType: 'Testimonial', name: 'Testimonio', description: 'Cita con autor' },
];

export const SectionsTab: React.FC<SectionsTabProps> = ({
  pageSections,
  isSaving,
  isCreatingSection,
  isSavingSection,
  newSectionName,
  onNameChange,
  onCreateSection,
  onCancelCreate,
  onStartCreating,
  onSectionNameChange,
  onBackClick,
  onSavePage,
  sectionRef,
}) => {
  const [isAddComponentOpen, setIsAddComponentOpen] = useState(false);
  
  // Escuchar evento para abrir el diálogo desde SectionManager
  useEffect(() => {
    const handleRequestAddComponent = () => {
      console.log('[SectionsTab] 📣 Recibiendo solicitud para agregar componente');
      setIsAddComponentOpen(true);
    };
    
    document.addEventListener('section:request-add-component', handleRequestAddComponent);
    
    return () => {
      document.removeEventListener('section:request-add-component', handleRequestAddComponent);
    };
  }, []);
  
  // Función para agregar un componente
  const handleAddComponent = (componentType: string, displayType: string) => {
    // Only proceed if we have a section reference
    if (!sectionRef.current) {
      console.error('[SectionsTab] ❌ No hay sección activa o el ref no está disponible');
      return;
    }
    
    console.log(`[SectionsTab] 🛠️ Intentando crear componente: ${componentType}/${displayType}`);
    
    // Generate a truly unique ID using crypto if available
    const generateUniqueId = () => {
      try {
        if (typeof crypto !== 'undefined' && crypto.randomUUID) {
          return crypto.randomUUID();
        }
      } catch (error) {
        console.error('[SectionsTab] ❌ Error generando UUID:', error);
      }
      return `component-${componentType}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    };
    
    // Generate the unique ID
    const componentId = generateUniqueId();
    console.log(`[SectionsTab] 🔑 ID de componente generado: ${componentId}`);
    
    // Get initial data for the component type
    const getInitialData = (type: string) => {
      switch (type) {
        case 'header':
          return {
            componentTitle: 'Encabezado',
            title: 'Título principal', 
            subtitle: 'Subtítulo opcional'
          };
        case 'text':
          return {
            componentTitle: 'Bloque de texto',
            title: 'Título del contenido',
            content: 'Edite este contenido para personalizarlo según sus necesidades.'
          };
        case 'image':
          return {
            componentTitle: 'Imagen',
            alt: 'Descripción de la imagen',
            caption: 'Pie de foto',
            src: '' // URL de la imagen
          };
        case 'card':
          return {
            componentTitle: 'Tarjeta',
            title: 'Título de la tarjeta',
            description: 'Descripción de la tarjeta',
            buttonText: 'Leer más',
            link: '#'
          };
        case 'feature':
          return {
            componentTitle: 'Característica',
            title: 'Título de la característica',
            description: 'Descripción de la característica',
            icon: 'star'
          };
        case 'testimonial':
          return {
            componentTitle: 'Testimonio',
            quote: 'Este es un testimonio de ejemplo.',
            author: 'Nombre del autor',
            role: 'Cargo o empresa'
          };
        case 'hero':
          return {
            componentTitle: 'Banner Hero',
            title: 'Título del Hero', 
            subtitle: 'Subtítulo del Hero',
            image: '',
            cta: { text: 'Botón de acción', url: '#' }
          };
        case 'benefit':
          return {
            componentTitle: 'Sección Beneficio',
            title: 'Título del Beneficio',
            description: 'Descripción detallada del beneficio que ofrece tu servicio.',
            iconType: 'check',
            accentColor: '#01319c',
            backgroundColor: 'from-[#ffffff] to-[#f0f9ff]',
            showGrid: true,
            showDots: true
          };
        default:
          return {
            componentTitle: `Nuevo ${type}`,
            title: 'Título del componente'
          };
      }
    };
    
    // Get the initial data for the component
    const initialData = getInitialData(componentType);
    
    // Create the new component object
    const newComponent = {
      id: componentId,
      type: displayType, // Use the correct type for SectionManager
      data: initialData,
      // Do not include title directly, only in data
      // The title for UI will be displayed from data.componentTitle
    };
    
    // Dispatch the event for SectionManager to catch
    console.log('[SectionsTab] 🚀 Adding new component:', newComponent);
    document.dispatchEvent(new CustomEvent('component:add', { detail: newComponent }));
    
    // Close the dialog
    setIsAddComponentOpen(false);
    
    // Save the component without forcing a full reload
    setTimeout(async () => {
      try {
        console.log('[SectionsTab] 💾 Saving component without reloading...');
        await sectionRef.current?.saveChanges(true);
        console.log('[SectionsTab] ✅ Component saved successfully');
        // We don't call onRefreshView() to avoid full reload
      } catch (error) {
        console.error('[SectionsTab] ❌ Error saving component:', error);
      }
    }, 500);
  };

  return (
    <Card className="border-none shadow-none pb-4">
      <CardHeader className="px-0">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Componentes de la página</CardTitle>
            <CardDescription>
              Edita los componentes de tu página
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-0">
        {pageSections.length > 0 ? (
          <div className="rounded-lg">
            <ManageableSection
              ref={sectionRef}
              sectionId={pageSections[0]?.sectionId || ''}
              sectionName={pageSections[0]?.name}
              onSectionNameChange={onSectionNameChange}
              isEditing={true}
            />
          </div>
        ) : (
          <EmptySectionPlaceholder
            isCreatingSection={isCreatingSection}
            isSavingSection={isSavingSection}
            newSectionName={newSectionName}
            onNameChange={onNameChange}
            onCreateSection={onCreateSection}
            onCancelCreate={onCancelCreate}
            onStartCreating={onStartCreating}
          />
        )}
      </CardContent>
      <CardFooter className="px-0 flex justify-between">
        <Button variant="outline" onClick={onBackClick}>
          Volver a Detalles
        </Button>
        <Button 
          variant="default" 
          onClick={onSavePage}
          disabled={isSaving}
        >
          {isSaving ? (
            <>
              <span className="animate-spin h-4 w-4 border-2 border-white border-opacity-20 border-t-white rounded-full mr-1"></span>
              <span>Guardando...</span>
            </>
          ) : (
            <>
              <SaveIcon className="h-4 w-4 mr-1" />
              <span>Guardar cambios</span>
            </>
          )}
        </Button>
      </CardFooter>
      
      {/* Diálogo para agregar componentes */}
      <Dialog open={isAddComponentOpen} onOpenChange={setIsAddComponentOpen}>
        <DialogContent className="sm:max-w-md z-[9999]">
          <DialogHeader>
            <DialogTitle>Agregar nuevo componente</DialogTitle>
            <DialogDescription>
              Selecciona el tipo de componente que deseas agregar a tu sección.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            {AVAILABLE_COMPONENTS.map((component) => (
              <Button
                key={component.type}
                variant="outline"
                className="h-auto py-4 flex flex-col items-center justify-center text-center"
                onClick={() => handleAddComponent(component.type, component.displayType)}
              >
                <span className="font-medium mb-1">{component.name}</span>
                <span className="text-xs text-gray-500">{component.description}</span>
              </Button>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddComponentOpen(false)}>
              Cancelar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default SectionsTab; 