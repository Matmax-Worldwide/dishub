import React, { useState, useEffect } from 'react';
import { EyeIcon, SaveIcon, PlusIcon } from 'lucide-react';
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
  onRefreshView: () => void;
  onBackClick: () => void;
  onSavePage: () => void;
  sectionRef: React.RefObject<ManageableSectionHandle>;
}

// Tipos de componentes disponibles
const AVAILABLE_COMPONENTS = [
  { type: 'header', displayType: 'Header', name: 'Encabezado', description: 'Título y subtítulo' },
  { type: 'text', displayType: 'Text', name: 'Texto', description: 'Bloque de contenido textual' },
  { type: 'image', displayType: 'Image', name: 'Imagen', description: 'Imagen con descripción' },
  { type: 'card', displayType: 'Card', name: 'Tarjeta', description: 'Tarjeta con título e imagen' },
  { type: 'feature', displayType: 'Feature', name: 'Característica', description: 'Destacar una característica' },
  { type: 'testimonial', displayType: 'Testimonial', name: 'Testimonio', description: 'Cita con autor' },
  { type: 'hero', displayType: 'Hero', name: 'Banner Hero', description: 'Banner principal con imagen' }
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
  onRefreshView,
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
    // Verificar que la sección existe y el ref está disponible
    if (pageSections.length > 0 && sectionRef.current) {
      console.log(`[SectionsTab] 🛠️ Intentando crear componente: ${componentType}/${displayType}`);
      
      // Definimos mapeos para datos iniciales específicos por tipo
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
          default:
            return {
              componentTitle: `Nuevo ${componentType}`,
              title: 'Título del componente'
            };
        }
      };
      
      // Crear un evento personalizado para agregar el componente
      // Para SectionManager necesitamos usar el displayType (con mayúscula)
      const newComponent = {
        id: `component-${componentType}-${Date.now()}`,
        type: displayType, // Usar el tipo con formato correcto para SectionManager
        data: getInitialData(componentType)
      };
      
      // Disparar el evento para que SectionManager lo capte
      console.log('[SectionsTab] 🚀 Agregando nuevo componente:', newComponent);
      document.dispatchEvent(new CustomEvent('component:add', { detail: newComponent }));
      
      // Cerrar el diálogo
      setIsAddComponentOpen(false);
      
      // Programar guardado automático después de que el componente se agregue
      setTimeout(async () => {
        try {
          console.log('[SectionsTab] 💾 Guardando automáticamente después de agregar componente...');
          await sectionRef.current?.saveChanges();
          console.log('[SectionsTab] ✅ Componentes guardados exitosamente');
          // Refrescar vista para mostrar cambios
          onRefreshView();
        } catch (error) {
          console.error('[SectionsTab] ❌ Error al guardar componentes después de agregar:', error);
        }
      }, 1000); // Aumentamos el retraso para asegurar que el evento se procese primero
    } else {
      console.error('[SectionsTab] ❌ No hay sección activa o el ref no está disponible');
    }
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
          <div className="flex space-x-2">
            {pageSections.length > 0 && (
              <Button 
                onClick={() => setIsAddComponentOpen(true)}
                className="flex items-center gap-2"
              >
                <PlusIcon className="h-4 w-4" />
                <span>Agregar componente</span>
              </Button>
            )}
            <Button 
              variant="outline" 
              onClick={onRefreshView}
              className="flex items-center gap-2"
            >
              <EyeIcon className="h-4 w-4" />
              <span>Refrescar vista</span>
            </Button>
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
              autoSave={false}
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
        <DialogContent className="sm:max-w-md">
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