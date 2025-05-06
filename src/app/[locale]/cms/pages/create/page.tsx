'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  SaveIcon,
  ArrowLeftIcon,
  AlertCircleIcon,
  CheckIcon,
  FileTextIcon,
  GlobeIcon,
  TagIcon,
  LayoutIcon,
  EyeIcon,
  PencilIcon,
  MoveIcon,
  PlusIcon,
  XIcon,
  MinusIcon,
  CopyIcon,
  Loader2Icon
} from 'lucide-react';
import { CMSComponent, cmsOperations } from '@/lib/graphql-client';
import ManageableSection from '@/components/cms/ManageableSection';
import { deleteCMSSection } from '@/lib/cms-delete';

interface Response {
  components: CMSComponent[];
  lastUpdated: string | null;
}

interface DebugInfo {
  sectionId: string;
  response?: Response;
  timestamp: string;
  hasComponents?: boolean;
  error?: string;
}

interface Section {
  sectionId: string;
  name: string;
  description?: string;
  componentCount: number;
}

// Definir la interfaz para los datos de diagnóstico
interface DiagnosticData {
  pageSections: Array<{id: string; sectionId: string; order: number; name?: string}>;
  pageDataSections: string[];
  availableSections: Array<{id: string; name: string}>;
  editingSection: string | null;
}

const DiagnosticInfo = ({ data }: { data: DiagnosticData }) => {
  if (process.env.NODE_ENV === 'production') return null;
  
  return (
    <details className="my-2 p-2 border border-gray-200 rounded bg-gray-50 text-xs">
      <summary className="font-medium cursor-pointer">Diagnostic Info</summary>
      <pre className="mt-2 whitespace-pre-wrap text-left">
        {JSON.stringify(data, null, 2)}
      </pre>
    </details>
  );
};


// Interface para la sección en vista previa
interface PreviewSectionProps {
  section: {
    id: string;
    sectionId: string;
    order: number;
    name: string;
  };
  index: number;
  onEdit: (sectionId: string) => void;
  onMove: (index: number, direction: 'up' | 'down') => void;
  onRemove: (sectionId: string) => void;
  forceLoad: boolean;
}

// Componente de sección para vista previa (fuera del componente principal para evitar problemas con hooks)
function PreviewSectionComponent({ 
  section, 
  index, 
  onEdit, 
  onMove, 
  onRemove, 
  forceLoad 
}: PreviewSectionProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasSectionComponents, setHasSectionComponents] = useState(false);
  const [debugInfo, setDebugInfo] = useState<DebugInfo | null>(null);
  
  // Cargar componentes cuando cambia el id de la sección o cuando se fuerza una recarga
  useEffect(() => {
    const loadSectionComponents = async () => {
      setIsLoading(true);
      try {
        console.log(`🔍 DEBUG - Cargando componentes para sección [${section.sectionId}]...`);
        
        // Verificar si la sección tiene componentes
        const result = await cmsOperations.getSectionComponents(section.sectionId);
        console.log(`🔍 DEBUG - Respuesta del servidor para sección [${section.sectionId}]:`, JSON.stringify(result));
        
        // Guardar información detallada para depuración
        setDebugInfo({
          sectionId: section.sectionId,
          response: result,
          timestamp: new Date().toISOString(),
          hasComponents: !!result && Array.isArray(result.components) && result.components.length > 0
        });
        
        setHasSectionComponents(!!result && Array.isArray(result.components) && result.components.length > 0);
        
        if (result && Array.isArray(result.components)) {
          console.log(`🔍 DEBUG - Componentes encontrados: ${result.components.length}`);
          if (result.components.length > 0) {
            console.log(`🔍 DEBUG - Primer componente: ${JSON.stringify(result.components[0])}`);
          } else {
            console.log(`🔍 DEBUG - Array de componentes vacío, verificando estructura:`, result);
          }
        } else {
          console.log(`🔍 DEBUG - Estructura de respuesta inesperada:`, result);
        }
        
        // Desactivar estado de carga después de un tiempo
        setTimeout(() => {
          setIsLoading(false);
        }, 500);
      } catch (error) {
        console.error(`❌ ERROR - Error cargando sección ${section.sectionId}:`, error);
        setHasSectionComponents(false);
        setIsLoading(false);
        setDebugInfo({
          sectionId: section.sectionId,
          error: error instanceof Error ? error.message : String(error),
          timestamp: new Date().toISOString()
        });
      }
    };
    
    loadSectionComponents();
  }, [section.sectionId, forceLoad]);
  
  // Función para activar la edición de esta sección
  const handleEdit = () => onEdit(section.sectionId);
  
  return (
    <div className="relative border rounded-lg overflow-hidden group mb-8">
      {/* Identificador visual de la sección */}
      <div className="absolute top-0 left-0 bg-blue-500 text-white text-xs px-2 py-1 rounded-br z-10">
        Section: {section.name} ({section.sectionId.substring(0, 6)}...)
      </div>
      
      {/* Controles de la sección */}
      <div className="absolute top-2 right-2 flex space-x-2 z-20 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={handleEdit}
          className="p-1 bg-blue-500 text-white rounded"
          title="Edit section"
        >
          <PencilIcon className="h-4 w-4" />
        </button>
        {index > 0 && (
          <button
            onClick={() => onMove(index, 'up')}
            className="p-1 bg-gray-500 text-white rounded"
            title="Move up"
          >
            <MoveIcon className="h-4 w-4 transform rotate-180" />
          </button>
        )}
        {index < 1000 && ( // Se reemplazará con la longitud real en el componente principal
          <button
            onClick={() => onMove(index, 'down')}
            className="p-1 bg-gray-500 text-white rounded"
            title="Move down"
          >
            <MoveIcon className="h-4 w-4" />
          </button>
        )}
        <button
          onClick={() => onRemove(section.sectionId)}
          className="p-1 bg-red-500 text-white rounded"
          title="Remove section"
        >
          <MinusIcon className="h-4 w-4" />
        </button>
      </div>
      
      {/* Contenido de la sección usando ManageableSection */}
      <div className="p-6 pt-10">
        {isLoading ? (
          <div className="py-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <p className="mt-2 text-gray-500">Loading components...</p>
          </div>
        ) : hasSectionComponents ? (
          <div className="bg-white rounded-lg shadow-sm p-4">
            <ManageableSection
              sectionId={section.sectionId}
              isEditing={false}
              autoSave={false}
            />
          </div>
        ) : (
          <div className="py-8 text-center bg-gray-50 rounded-lg border border-dashed border-gray-300">
            <LayoutIcon className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-600 mb-2">No components in this section</p>
            <button
              onClick={handleEdit}
              className="px-3 py-1 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 text-sm"
            >
              <PencilIcon className="h-3 w-3 inline-block mr-1" />
              Edit this section
            </button>
            
            {/* Panel de depuración (solo en desarrollo) */}
            {process.env.NODE_ENV !== 'production' && debugInfo && (
              <details className="mt-4 text-left text-xs border-t border-gray-200 pt-3">
                <summary className="cursor-pointer text-blue-500 font-mono">Debug information</summary>
                <div className="mt-2 bg-gray-800 text-white p-2 rounded overflow-x-auto">
                  <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
                </div>
              </details>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Añadir la interfaz de SectionComponent
interface SectionComponent {
  id: string;
  type: string;
  data: Record<string, unknown>;
}

export default function CreatePage() {
  const { locale } = useParams();
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [availableSections, setAvailableSections] = useState<Section[]>([]);
  const [isLoadingSections, setIsLoadingSections] = useState(true);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [sectionToDelete, setSectionToDelete] = useState<Section | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showNewSectionModal, setShowNewSectionModal] = useState(false);
  const [isCreatingSectionMode, setIsCreatingSectionMode] = useState(false);
  const [newSection, setNewSection] = useState({
    name: '',
    description: '',
    fromExisting: ''
  });
  const [isCreatingSection, setIsCreatingSection] = useState(false);
  
  // Datos de la página
  const [pageData, setPageData] = useState({
    title: '',
    slug: '',
    description: '',
    isPublished: false,
    pageType: 'CONTENT',
    sections: [] as string[] // IDs de las secciones seleccionadas
  });

  // Convertir secciones seleccionadas al formato que espera PageWrapper
  const [pageSections, setPageSections] = useState<Array<{id: string; sectionId: string; order: number; name: string}>>([]);
  const [forcedSectionLoad, setForcedSectionLoad] = useState(false);

  // Actualizar pageSections cuando cambian las secciones seleccionadas
  useEffect(() => {
    if (!pageData.sections.length) {
      setPageSections([]);
      return;
    }
    
    console.log('Updating pageSections from pageData.sections:', pageData.sections);
    
    const newPageSections = pageData.sections.map((sectionId, index) => {
      // Buscar sección exacta por ID
      let section = availableSections.find(s => s.sectionId === sectionId);
      
      // Si no encontramos coincidencia exacta, usamos la primera sección disponible como fallback
      if (!section && availableSections.length > 0 && index === 0) {
        section = availableSections[0];
        console.log('No se encontró sección para ID:', sectionId, 'usando primera sección disponible:', section.sectionId);
      }
      
      // Para secciones adicionales (posiblemente creadas dinámicamente), mantener su ID original
      return {
        id: `temp-${sectionId}-${index}`,
        sectionId: sectionId, // Mantener el ID original para cargar correctamente los componentes
        order: index,
        name: section?.name || `Section ${index + 1}`
      };
    });
    
    console.log('New pageSections:', newPageSections);
    setPageSections(newPageSections);
  }, [pageData.sections, availableSections]);

  // Opciones de tipo de página
  const pageTypes = [
    { value: 'HOME', label: 'Home' },
    { value: 'CONTENT', label: 'Content' },
    { value: 'BLOG', label: 'Blog' },
    { value: 'LANDING', label: 'Landing' },
    { value: 'CONTACT', label: 'Contact' },
    { value: 'SERVICES', label: 'Services' },
    { value: 'ABOUT', label: 'About' },
    { value: 'CUSTOM', label: 'Custom' }
  ];

  // Cargar las secciones disponibles
  useEffect(() => {
    const fetchSections = async () => {
      try {
        setIsLoadingSections(true);
        const sectionsData = await cmsOperations.getAllCMSSections();
        
        // Transformar los datos para la interfaz
        if (Array.isArray(sectionsData)) {
          const formattedSections = sectionsData.map(section => ({
            sectionId: section.sectionId,
            name: section.name || section.sectionId,
            description: section.description || '',
            componentCount: Array.isArray(section.components) ? section.components.length : 0
          }));
          setAvailableSections(formattedSections);
        }
      } catch (error) {
        console.error('Error loading sections:', error);
        setNotification({
          type: 'error',
          message: 'Failed to load available sections'
        });
      } finally {
        setIsLoadingSections(false);
      }
    };

    fetchSections();
  }, []);

  // Generar slug a partir del título
  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '') // Eliminar caracteres especiales
      .replace(/\s+/g, '-') // Reemplazar espacios por guiones
      .replace(/-+/g, '-'); // Eliminar guiones múltiples
  };

  // Actualizar el slug cuando cambia el título
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    setPageData(prev => ({
      ...prev,
      title: newTitle,
      slug: generateSlug(newTitle)
    }));
  };

  // Manejar cambios en formulario
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setPageData(prev => ({ ...prev, [name]: value }));
  };

  // Manejar cambio en checkbox
  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setPageData(prev => ({ ...prev, [name]: checked }));
  };

  // Agregar o quitar una sección
  const toggleSection = (sectionId: string) => {
    setPageData(prev => {
      if (prev.sections.includes(sectionId)) {
        return {
          ...prev,
          sections: prev.sections.filter(id => id !== sectionId)
        };
      } else {
        return {
          ...prev,
          sections: [...prev.sections, sectionId]
        };
      }
    });
  };

  // Reordenar secciones
  const moveSection = (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) || 
      (direction === 'down' && index === pageData.sections.length - 1)
    ) {
      return;
    }

    const newSections = [...pageData.sections];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    
    // Swap positions
    [newSections[index], newSections[newIndex]] = [newSections[newIndex], newSections[index]];
    
    setPageData(prev => ({
      ...prev,
      sections: newSections
    }));
  };

  // Guardar la página
  const handleSave = async () => {
    try {
      setIsSaving(true);
      // Aquí iría la lógica para guardar la página en la base de datos
      // Por ahora solo simulamos el guardado
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setNotification({
        type: 'success',
        message: 'Page created successfully!'
      });
      
      // Después de un breve delay, redirigir a la lista de páginas
      setTimeout(() => {
        router.push(`/${locale}/cms/pages`);
      }, 1500);
    } catch (error) {
      console.error('Error saving page:', error);
      setNotification({
        type: 'error',
        message: 'Failed to create page. Please try again.'
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Volver a la lista de páginas
  const handleCancel = () => {
    router.push(`/${locale}/cms/pages`);
  };

  // Dentro del componente CreatePage, añadir los estados y funciones para edición directa
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);

  // Reemplazar la definición del callback con funciones de manejo
  const handleEditSection = (sectionId: string) => {
    setEditingSectionId(sectionId);
    setActiveTab('edit');
  };

  const handleRemoveSection = (sectionId: string) => {
    const actualId = sectionId.replace(/^temp-([^-]+).*$/, '$1');
    toggleSection(actualId);
  };

  // Inicia el proceso de eliminación de sección (mostrar modal)
  const handleDeleteSection = (section: Section) => {
    setSectionToDelete(section);
    setShowDeleteModal(true);
  };

  // Confirma y ejecuta la eliminación permanente de la sección
  const confirmDeleteSection = async () => {
    if (!sectionToDelete) return;
    
    setIsDeleting(true);
    try {
      console.log(`Eliminando permanentemente sección: ${sectionToDelete.sectionId}`);
      const result = await deleteCMSSection(sectionToDelete.sectionId);
      
      if (result.success) {
        // Eliminar la sección de la lista de disponibles
        setAvailableSections(prev => prev.filter(s => s.sectionId !== sectionToDelete.sectionId));
        
        // Quitar la sección de las seleccionadas si estaba incluida
        if (pageData.sections.includes(sectionToDelete.sectionId)) {
          setPageData(prev => ({
            ...prev,
            sections: prev.sections.filter(id => id !== sectionToDelete.sectionId)
          }));
        }
        
        setNotification({
          type: 'success',
          message: `Sección "${sectionToDelete.name}" eliminada permanentemente`
        });
        
        // Limpiar después de 3 segundos
        setTimeout(() => {
          setNotification(null);
        }, 3000);
      } else {
        setNotification({
          type: 'error',
          message: `Error al eliminar la sección: ${result.message || 'Error desconocido'}`
        });
      }
    } catch (error) {
      console.error('Error eliminando sección:', error);
      setNotification({
        type: 'error',
        message: error instanceof Error ? error.message : 'Error desconocido al eliminar la sección'
      });
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
      setSectionToDelete(null);
    }
  };

  // Cancelar la eliminación
  const cancelDeleteSection = () => {
    setShowDeleteModal(false);
    setSectionToDelete(null);
  };

  // Manejar creación de una nueva sección
  const handleCreateSection = async () => {
    if (!newSection.name.trim()) {
      setNotification({
        type: 'error',
        message: 'El nombre de la sección es obligatorio'
      });
      return;
    }

    setIsCreatingSection(true);
    try {
      // Generar un ID único para la nueva sección
      const sectionId = `section-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      
      let components: SectionComponent[] = [];
      
      // Si se seleccionó crear desde una sección existente, obtener sus componentes
      if (newSection.fromExisting) {
        try {
          const existingSection = availableSections.find(s => s.sectionId === newSection.fromExisting);
          if (existingSection) {
            console.log(`Copiando componentes de sección existente: ${existingSection.sectionId}`);
            const result = await cmsOperations.getSectionComponents(existingSection.sectionId);
            if (result && Array.isArray(result.components)) {
              components = result.components as SectionComponent[];
            }
          }
        } catch (error) {
          console.error('Error al obtener componentes de sección existente:', error); 
        }
      }
      
      // Guardar la nueva sección con componentes (vacíos o copiados)
      const saveResult = await cmsOperations.saveSectionComponents(sectionId, components);
      
      if (saveResult.success) {
        // Crear objeto de sección para añadirlo a la lista
        const createdSection = {
          sectionId: sectionId,
          name: newSection.name,
          description: newSection.description,
          componentCount: components.length
        };
        
        // Añadir a la lista de secciones disponibles
        setAvailableSections(prev => [createdSection, ...prev]);
        
        // Seleccionar automáticamente la nueva sección
        setPageData(prev => ({
          ...prev,
          sections: [sectionId, ...prev.sections]
        }));
        
        setNotification({
          type: 'success',
          message: `Sección "${newSection.name}" creada exitosamente`
        });
        
        // Limpiar y cerrar modal
        setNewSection({ name: '', description: '', fromExisting: '' });
        setShowNewSectionModal(false);
        
        // Añadir un retraso para asegurar que la operación de base de datos se complete
        // antes de intentar cargar los componentes de la nueva sección
        setTimeout(() => {
          // Si estamos en el modo de edición, cambiar a la pestaña de edición
          // para permitir editar inmediatamente la nueva sección
          setActiveTab('edit');
          
          // Quizá también queremos establecer esto como la sección en edición
          setEditingSectionId(sectionId);
        }, 1000); // Retraso de 1 segundo
        
        // Limpiar la notificación después de 3 segundos
        setTimeout(() => {
          setNotification(null);
        }, 3000);
      } else {
        throw new Error(saveResult.message || 'Error al crear la sección');
      }
    } catch (error) {
      console.error('Error creando nueva sección:', error);
      setNotification({
        type: 'error',
        message: error instanceof Error ? error.message : 'Error desconocido al crear la sección'
      });
    } finally {
      setIsCreatingSection(false);
    }
  };

  // Renderizar el componente de previsualización
  const renderPreview = () => {
    console.log('Rendering preview with sections:', pageSections);
    
    return (
      <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
        <DiagnosticInfo data={{ 
          pageSections, 
          pageDataSections: pageData.sections,
          availableSections: availableSections.map(s => ({ id: s.sectionId, name: s.name })),
          editingSection: editingSectionId
        }} />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl font-bold text-center mb-8">{pageData.title || "Page Title"}</h1>
          {pageData.description && (
            <p className="text-center text-gray-600 mb-8">{pageData.description}</p>
          )}
          
          {pageSections.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-96 bg-gray-50 rounded-lg border border-dashed border-gray-300">
              <LayoutIcon className="h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-700">No sections added yet</h3>
              <p className="text-gray-500 mt-2 text-center max-w-md">
                Add a section to start building your page.
              </p>
              <button
                onClick={() => setShowNewSectionModal(true)}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded flex items-center"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Add New Section
              </button>
            </div>
          ) : (
            <div className="space-y-8">
              {pageSections.map((section, index) => (
                <PreviewSectionComponent
                  key={`preview-${section.sectionId}-${forcedSectionLoad ? 'forced' : 'normal'}`}
                  section={section}
                  index={index}
                  onEdit={handleEditSection}
                  onMove={moveSection}
                  onRemove={handleRemoveSection}
                  forceLoad={forcedSectionLoad}
                />
              ))}
              
              {/* Botón para añadir sección al final, más prominente para nueva sección */}
              <div className="flex justify-center mt-4 space-x-3">
                <button
                  onClick={() => {
                    setIsCreatingSectionMode(true);
                    setShowNewSectionModal(true);
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded flex items-center"
                >
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Add New Section
                </button>
                <button
                  onClick={() => {
                    setIsCreatingSectionMode(false);
                    setShowNewSectionModal(true);
                  }}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded flex items-center"
                >
                  <CopyIcon className="h-4 w-4 mr-2" />
                  Add Existing Section
                </button>
              </div>
            </div>
          )}
        </div>
        
        {/* Modal para añadir sección - Nueva versión con pestañas para nuevo/existente */}
        {showNewSectionModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium">
                  {isCreatingSectionMode ? "Create New Section" : "Select Existing Section"}
                </h3>
                <button
                  onClick={() => setShowNewSectionModal(false)}
                  className="p-1 rounded-full hover:bg-gray-100"
                >
                  <XIcon className="h-5 w-5" />
                </button>
              </div>
              
              {/* Pestañas para alternar entre crear nuevo y seleccionar existente */}
              <div className="flex border-b border-gray-200 mb-4">
                <button
                  className={`px-4 py-2 font-medium ${
                    isCreatingSectionMode 
                      ? 'text-blue-600 border-b-2 border-blue-600' 
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                  onClick={() => setIsCreatingSectionMode(true)}
                >
                  Create New Section
                </button>
                <button
                  className={`px-4 py-2 font-medium ${
                    !isCreatingSectionMode 
                      ? 'text-blue-600 border-b-2 border-blue-600' 
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                  onClick={() => setIsCreatingSectionMode(false)}
                >
                  Use Existing Section
                </button>
              </div>
              
              {isCreatingSectionMode ? (
                /* Formulario para crear nueva sección */
                <div className="space-y-4">
                  <div>
                    <label htmlFor="sectionName" className="block text-sm font-medium text-gray-700 mb-1">
                      Section Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="sectionName"
                      type="text"
                      value={newSection.name}
                      onChange={(e) => setNewSection({...newSection, name: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter a name for your new section"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="sectionDescription" className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <textarea
                      id="sectionDescription"
                      value={newSection.description}
                      onChange={(e) => setNewSection({...newSection, description: e.target.value})}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Optional description for this section"
                    />
                  </div>
                  
                  <div className="border-t border-gray-200 pt-4 mt-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Start with:</h4>
                    
                    <div className="flex space-x-4 mb-4">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          checked={!newSection.fromExisting}
                          onChange={() => setNewSection({...newSection, fromExisting: ''})}
                          className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">Empty Section</span>
                      </label>
                      
                      <label className="flex items-center">
                        <input
                          type="radio"
                          checked={!!newSection.fromExisting}
                          onChange={() => {
                            if (availableSections.length > 0) {
                              setNewSection({...newSection, fromExisting: availableSections[0].sectionId});
                            }
                          }}
                          className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">Copy from Existing</span>
                      </label>
                    </div>
                    
                    {newSection.fromExisting && (
                      <div className="ml-6 mt-2">
                        <label htmlFor="existingSection" className="block text-sm font-medium text-gray-700 mb-1">
                          Select Section to Copy
                        </label>
                        <select
                          id="existingSection"
                          value={newSection.fromExisting}
                          onChange={(e) => setNewSection({...newSection, fromExisting: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          {availableSections.map(section => (
                            <option key={section.sectionId} value={section.sectionId}>
                              {section.name} ({section.componentCount} components)
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex justify-end mt-6">
                    <button
                      onClick={() => setShowNewSectionModal(false)}
                      className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 mr-2"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleCreateSection}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md flex items-center disabled:bg-blue-300"
                      disabled={!newSection.name.trim() || isCreatingSection}
                    >
                      {isCreatingSection ? (
                        <>
                          <Loader2Icon className="h-4 w-4 mr-2 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        <>
                          <PlusIcon className="h-4 w-4 mr-2" />
                          Create Section
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                /* Lista de secciones existentes */
                <div>
                  {isLoadingSections ? (
                    <div className="animate-pulse space-y-4">
                      {[...Array(4)].map((_, i) => (
                        <div key={i} className="h-16 bg-gray-200 rounded"></div>
                      ))}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {availableSections.map((section) => (
                        <div
                          key={section.sectionId}
                          className="p-4 border rounded-md cursor-pointer hover:border-blue-300 hover:bg-blue-50 relative group"
                        >
                          <div onClick={() => {
                            toggleSection(section.sectionId);
                            setShowNewSectionModal(false);
                          }}>
                            <h4 className="font-medium">{section.name}</h4>
                            {section.description && (
                              <p className="text-sm text-gray-500">{section.description}</p>
                            )}
                            <div className="text-xs text-gray-400 mt-1">
                              {section.componentCount} {section.componentCount === 1 ? 'component' : 'components'}
                            </div>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteSection(section);
                            }}
                            className="absolute top-2 right-2 p-1 text-red-400 hover:text-red-600 bg-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Eliminar permanentemente"
                          >
                            <XIcon className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  // Efecto para forzar la recarga de las secciones cuando cambiamos a vista previa
  useEffect(() => {
    if (activeTab === 'preview') {
      console.log('Cambiando a modo vista previa - forzando recarga de secciones');
      setForcedSectionLoad(true);
      
      // Después de un tiempo, desactivar el forzado para futuras actualizaciones
      const timer = setTimeout(() => {
        setForcedSectionLoad(false);
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [activeTab]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <button 
            onClick={handleCancel}
            className="p-2 rounded-full hover:bg-gray-100"
            title="Back to pages"
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </button>
          <h1 className="text-2xl font-bold tracking-tight">Create New Page</h1>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={handleCancel}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            disabled={isSaving}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-600 text-white rounded-md flex items-center hover:bg-blue-700 disabled:bg-blue-300"
            disabled={!pageData.title || !pageData.slug || isSaving}
          >
            {isSaving ? (
              <>Saving...</>
            ) : (
              <>
                <SaveIcon className="h-4 w-4 mr-2" />
                Save Page
              </>
            )}
          </button>
        </div>
      </div>

      {/* Notification */}
      {notification && (
        <div 
          className={`p-4 rounded-md ${
            notification.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
          }`}
        >
          <div className="flex">
            <div className="flex-shrink-0">
              {notification.type === 'success' ? (
                <CheckIcon className="h-5 w-5 text-green-400" />
              ) : (
                <AlertCircleIcon className="h-5 w-5 text-red-400" />
              )}
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium">{notification.message}</p>
            </div>
          </div>
        </div>
      )}

      {/* Tab switcher */}
      <div className="flex border-b border-gray-200">
        <button
          className={`px-4 py-2 font-medium text-sm focus:outline-none ${
            activeTab === 'edit'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
          onClick={() => setActiveTab('edit')}
        >
          <div className="flex items-center">
            <PencilIcon className="h-4 w-4 mr-2" />
            Edit
          </div>
        </button>
        <button
          className={`px-4 py-2 font-medium text-sm focus:outline-none ${
            activeTab === 'preview'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
          onClick={() => setActiveTab('preview')}
        >
          <div className="flex items-center">
            <EyeIcon className="h-4 w-4 mr-2" />
            Preview
          </div>
        </button>
      </div>

      {activeTab === 'edit' ? (
        /* Editor view */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column - Page details */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
              <div className="p-6">
                <h2 className="text-lg font-medium mb-4">Page Details</h2>
                
                <div className="space-y-4">
                  {/* Título */}
                  <div>
                    <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                      <div className="flex items-center">
                        <FileTextIcon className="h-4 w-4 mr-1" />
                        Title <span className="text-red-500">*</span>
                      </div>
                    </label>
                    <input
                      type="text"
                      id="title"
                      name="title"
                      value={pageData.title}
                      onChange={handleTitleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter page title"
                      required
                    />
                  </div>
                  
                  {/* Slug */}
                  <div>
                    <label htmlFor="slug" className="block text-sm font-medium text-gray-700 mb-1">
                      <div className="flex items-center">
                        <GlobeIcon className="h-4 w-4 mr-1" />
                        URL Slug <span className="text-red-500">*</span>
                      </div>
                    </label>
                    <div className="flex items-center">
                      <span className="text-gray-500 mr-1">/{locale}/</span>
                      <input
                        type="text"
                        id="slug"
                        name="slug"
                        value={pageData.slug}
                        onChange={handleChange}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="page-url-slug"
                        required
                      />
                    </div>
                  </div>
                  
                  {/* Descripción */}
                  <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                      <div className="flex items-center">
                        <TagIcon className="h-4 w-4 mr-1" />
                        Description
                      </div>
                    </label>
                    <textarea
                      id="description"
                      name="description"
                      value={pageData.description}
                      onChange={handleChange}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Brief description of the page"
                    />
                  </div>
                  
                  {/* Tipo de página */}
                  <div>
                    <label htmlFor="pageType" className="block text-sm font-medium text-gray-700 mb-1">
                      Page Type
                    </label>
                    <select
                      id="pageType"
                      name="pageType"
                      value={pageData.pageType}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {pageTypes.map(type => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  {/* Publicada */}
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="isPublished"
                      name="isPublished"
                      checked={pageData.isPublished}
                      onChange={handleCheckboxChange}
                      className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label htmlFor="isPublished" className="ml-2 block text-sm text-gray-700">
                      Publish page (make it visible to users)
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Right column - Secciones */}
          <div>
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-medium flex items-center">
                    <LayoutIcon className="h-5 w-5 mr-2" />
                    Sections
                  </h2>
                  <button
                    onClick={() => {
                      setIsCreatingSectionMode(true);
                      setShowNewSectionModal(true);
                    }}
                    className="px-2 py-1 bg-blue-600 text-white text-sm rounded flex items-center"
                  >
                    <PlusIcon className="h-3 w-3 mr-1" />
                    New Section
                  </button>
                </div>
                
                {isLoadingSections ? (
                  <div className="animate-pulse space-y-4">
                    {[...Array(4)].map((_, i) => (
                      <div key={i} className="h-16 bg-gray-200 rounded"></div>
                    ))}
                  </div>
                ) : (
                  <>
                    {/* Selected Sections */}
                    {pageData.sections.length > 0 && (
                      <div className="mb-6 border rounded-md p-2">
                        <h3 className="text-sm font-medium text-gray-700 mb-2">Selected Sections</h3>
                        <div className="space-y-2">
                          {pageData.sections.map((sectionId, index) => {
                            const section = availableSections.find(s => s.sectionId === sectionId);
                            if (!section) return null;
                            
                            return (
                              <div key={`selected-${sectionId}`} className="flex items-center justify-between bg-blue-50 rounded-md p-2 border border-blue-200">
                                <div className="flex items-center">
                                  <span className="font-medium text-sm">{section.name}</span>
                                </div>
                                <div className="flex space-x-1">
                                  <button
                                    onClick={() => moveSection(index, 'up')}
                                    disabled={index === 0}
                                    className="p-1 text-gray-500 hover:text-gray-700 disabled:opacity-30"
                                    title="Move up"
                                  >
                                    <MoveIcon className="h-4 w-4 transform rotate-180" />
                                  </button>
                                  <button
                                    onClick={() => moveSection(index, 'down')}
                                    disabled={index === pageData.sections.length - 1}
                                    className="p-1 text-gray-500 hover:text-gray-700 disabled:opacity-30"
                                    title="Move down"
                                  >
                                    <MoveIcon className="h-4 w-4" />
                                  </button>
                                  <button
                                    onClick={() => toggleSection(sectionId)}
                                    className="p-1 text-red-500 hover:text-red-700"
                                    title="Remove"
                                  >
                                    <span>×</span>
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                    
                    {/* Available Sections */}
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="text-sm font-medium text-gray-700">Available Sections</h3>
                    </div>
                    {availableSections.length > 0 ? (
                      <div className="space-y-3">
                        {availableSections.map(section => (
                          <div
                            key={section.sectionId}
                            className={`p-3 border rounded-md transition-colors ${
                              pageData.sections.includes(section.sectionId)
                                ? 'border-blue-300 bg-blue-50'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <div className="flex justify-between items-start">
                              <div className="cursor-pointer" onClick={() => toggleSection(section.sectionId)}>
                                <h3 className="font-medium">{section.name}</h3>
                                {section.description && (
                                  <p className="text-sm text-gray-500">{section.description}</p>
                                )}
                                <div className="text-xs text-gray-400 mt-1">
                                  {section.componentCount} {section.componentCount === 1 ? 'component' : 'components'}
                                </div>
                              </div>
                              <div className="flex items-center space-x-2">
                                <div className={`w-5 h-5 rounded-full flex items-center justify-center cursor-pointer ${
                                  pageData.sections.includes(section.sectionId) ? 'bg-blue-500 text-white' : 'border border-gray-300'
                                }`} onClick={() => toggleSection(section.sectionId)}>
                                  {pageData.sections.includes(section.sectionId) && (
                                    <CheckIcon className="h-3 w-3" />
                                  )}
                                </div>
                                <button
                                  onClick={() => handleDeleteSection(section)}
                                  className="w-5 h-5 rounded-full flex items-center justify-center text-red-500 hover:bg-red-50"
                                  title="Eliminar permanentemente"
                                >
                                  <XIcon className="h-3 w-3" />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-4 text-gray-500">
                        <p>No sections available.</p>
                        <p className="text-sm mt-2">Create sections first to add them to pages.</p>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Preview view */
        <div>
          <div className="mb-4 bg-yellow-50 border border-yellow-200 rounded-md p-3 text-yellow-800">
            <div className="flex">
              <div className="flex-shrink-0">
                <AlertCircleIcon className="h-5 w-5 text-yellow-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm">
                  This is a preview of how your page will look when published. Any changes you make in the edit tab will be reflected here.
                </p>
              </div>
            </div>
          </div>
          
          {renderPreview()}
        </div>
      )}

      {/* Modal de confirmación de eliminación */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full">
            <h3 className="text-lg font-medium text-red-600 mb-4">Eliminar sección permanentemente</h3>
            <p className="mb-4">
              ¿Estás seguro de que deseas eliminar permanentemente la sección &ldquo;<strong>{sectionToDelete?.name}</strong>&rdquo;?
            </p>
            <p className="mb-6 text-sm text-gray-500">
              Esta acción no se puede deshacer y eliminará la sección de la base de datos. Todos los componentes asociados a esta sección se perderán.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={cancelDeleteSection}
                className="px-4 py-2 border border-gray-300 rounded-md"
                disabled={isDeleting}
              >
                Cancelar
              </button>
              <button
                onClick={confirmDeleteSection}
                className="px-4 py-2 bg-red-600 text-white rounded-md flex items-center"
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <>
                    <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></span>
                    Eliminando...
                  </>
                ) : (
                  <>
                    <XIcon className="h-4 w-4 mr-2" />
                    Eliminar permanentemente
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 