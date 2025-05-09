'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  FileTextIcon,
  PlusIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  SearchIcon,
  FilterIcon,
  ArrowUpDownIcon,
  CheckIcon,
  XIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  AlertCircleIcon,
  Loader2Icon,
  LayoutIcon
} from 'lucide-react';
import { cmsOperations } from '@/lib/graphql-client';
import { deleteCMSSection } from '@/lib/cms-delete';
import SectionManager, { Component } from '@/components/cms/SectionManager';

interface PageItem {
  id: string;
  title: string;
  slug: string;
  pageType: string;
  isPublished: boolean;
  updatedAt: string;
  sections: number;
}

interface Section {
  sectionId: string;
  name: string;
  description?: string;
  componentCount: number;
}

interface SectionComponent {
  id: string;
  type: string;
  data: Record<string, unknown>;
}

// Define the component types that match SectionManager's ComponentType exactly
type ComponentType = 'Hero' | 'Text' | 'Image' | 'Feature' | 'Testimonial' | 'Header' | 'Card';

// Add a function to ensure component types are valid
function validateComponentType(type: string): ComponentType {
  const validTypes: ComponentType[] = ['Hero', 'Text', 'Image', 'Feature', 'Testimonial', 'Header', 'Card'];
  
  // Check if the type is already valid
  if (validTypes.includes(type as ComponentType)) {
    return type as ComponentType;
  }
  
  // If not valid, try to find a matching type (case insensitive)
  const normalizedType = type.charAt(0).toUpperCase() + type.slice(1).toLowerCase();
  if (validTypes.includes(normalizedType as ComponentType)) {
    console.log(`⚠️ Fixed component type case: ${type} → ${normalizedType}`);
    return normalizedType as ComponentType;
  }
  
  // If still not valid, default to Text
  console.log(`⚠️ Invalid component type: ${type}, defaulting to Text`);
  return 'Text';
}

// Add a SectionPreview component similar to the one in other pages
function SectionPreview({ sectionId, refreshKey }: { sectionId: string; refreshKey?: string | number }) {
  const [isLoading, setIsLoading] = useState(true);
  const [components, setComponents] = useState<SectionComponent[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [sectionLoaded, setSectionLoaded] = useState(false);

  useEffect(() => {
    const loadSectionComponents = async () => {
      // Generate a unique operation ID for this load operation
      const loadId = `load-${Math.random().toString(36).substring(2, 9)}`;
      const startTime = Date.now();
      
      console.log(`⏳ [${loadId}] INICIO CARGA de componentes para sección '${sectionId}'`);
      
      setIsLoading(true);
      setError(null);
      
      try {
        // Make sure to pass just the sectionId without query parameters
        const cleanSectionId = sectionId.split('?')[0];
        console.log(`🔍 [${loadId}] Solicitando componentes para sección: ${cleanSectionId}`);
        
        // Call the getSectionComponents method from the GraphQL client
        const result = await cmsOperations.getSectionComponents(cleanSectionId);
        
        // Log diagnostic information about the response
        console.log(`✅ [${loadId}] Respuesta recibida después de ${Date.now() - startTime}ms`);
        console.log(`🔍 [${loadId}] Respuesta completa:`, JSON.stringify(result));
        
        if (!result) {
          console.error(`❌ [${loadId}] La respuesta es NULL o UNDEFINED`);
          setError('No se recibió respuesta del servidor');
          setComponents([]);
          setSectionLoaded(false);
          return;
        }
        
        // Check that the response has a components property that is an array
        if (!result.components) {
          console.error(`❌ [${loadId}] La respuesta NO contiene el campo 'components' o es NULL`);
          setError('La respuesta no contiene datos de componentes');
          setComponents([]);
          setSectionLoaded(false);
          return;
        }
        
        if (!Array.isArray(result.components)) {
          console.error(`❌ [${loadId}] El campo 'components' NO ES UN ARRAY, es:`, typeof result.components);
          setError(`El campo 'components' no es un array válido (${typeof result.components})`);
          setComponents([]);
          setSectionLoaded(false);
          return;
        }
        
        // Log detail about the components
        console.log(`🔍 [${loadId}] Cantidad de componentes:`, result.components.length);
        if (result.components.length > 0) {
          result.components.forEach((comp, idx) => {
            console.log(`🔍 [${loadId}] Componente #${idx+1}:`, JSON.stringify({
              id: comp.id,
              type: comp.type,
              dataKeys: comp.data ? Object.keys(comp.data) : 'no data'
            }));
          });
        }
        
        // Set components state
        setComponents(result.components);
        setSectionLoaded(true);
        console.log(`✅ [${loadId}] CARGA COMPLETADA en ${Date.now() - startTime}ms`);
      } catch (error) {
        console.error(`❌ [${loadId}] ERROR al cargar componentes:`, error);
        setError(error instanceof Error ? error.message : 'Error desconocido al cargar componentes');
        setComponents([]);
        setSectionLoaded(false);
      } finally {
        setIsLoading(false);
      }
    };

    loadSectionComponents();
  }, [sectionId, refreshKey]);

  // Log the state of the component for debugging
  useEffect(() => {
    console.log(`⚡ SectionPreview state for ${sectionId}:`, {
      isLoading,
      componentsCount: components.length,
      sectionLoaded,
      error
    });
  }, [isLoading, components, sectionLoaded, error, sectionId]);

  if (isLoading) {
    return (
      <div className="py-4 text-center">
        <div className="inline-block animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
        <p className="mt-1 text-sm text-gray-500">Cargando...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 p-3 rounded-md text-red-600 text-xs">
        <AlertCircleIcon className="h-4 w-4 inline-block mr-1" />
        Error: {error}
      </div>
    );
  }

  // Section loaded successfully
  if (sectionLoaded) {
    console.log(`🎯 Rendering section ${sectionId} with ${components.length} components`);
    
    // Check if components array really has valid items
    if (!components || components.length === 0) {
      return (
        <div className="py-4 text-center bg-gray-50 rounded-lg border border-dashed border-gray-300">
          <LayoutIcon className="h-5 w-5 text-gray-400 mx-auto mb-1" />
          <p className="text-gray-600 text-sm">Esta sección no tiene componentes</p>
        </div>
      );
    }

    // Make sure we're working with valid component objects
    const validComponents = components.filter(comp => 
      comp && typeof comp === 'object' && comp.id && comp.type
    );
    
    console.log(`🎯 Valid components for section ${sectionId}: ${validComponents.length}/${components.length}`);
    
    if (validComponents.length === 0) {
      return (
        <div className="py-4 text-center bg-gray-50 rounded-lg border border-dashed border-gray-300">
          <LayoutIcon className="h-5 w-5 text-gray-400 mx-auto mb-1" />
          <p className="text-gray-600 text-sm">Componentes inválidos en la sección</p>
        </div>
      );
    }

    // Map the components to the format expected by SectionManager
    const mappedComponents: Component[] = validComponents.map(comp => ({
      id: comp.id,
      type: validateComponentType(comp.type),
      data: comp.data || {}
    }));

    console.log(`🎯 Mapped ${mappedComponents.length} components for SectionManager`);

    // We have components, display them using SectionManager directly
    return (
      <div className="bg-white rounded-md">
        <SectionManager 
          initialComponents={mappedComponents}
          isEditing={false}
        />
      </div>
    );
  }

  // Fallback if none of the above conditions are met
  return (
    <div className="py-4 text-center bg-gray-50 rounded-lg border border-dashed border-gray-300">
      <AlertCircleIcon className="h-5 w-5 text-amber-500 mx-auto mb-1" />
      <p className="text-gray-600 text-sm">No se pudo cargar la vista previa</p>
    </div>
  );
}

export default function PagesManagement() {
  const { locale } = useParams();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [pages, setPages] = useState<PageItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [sortOrder, setSortOrder] = useState('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [notification, setNotification] = useState<{type: 'success' | 'error', message: string} | null>(null);
  const itemsPerPage = 10;
  
  // Section management states
  const [availableSections, setAvailableSections] = useState<Section[]>([]);
  const [isLoadingSections, setIsLoadingSections] = useState(false);
  const [showNewSectionModal, setShowNewSectionModal] = useState(false);
  const [isCreatingSectionMode, setIsCreatingSectionMode] = useState(true);
  const [newSection, setNewSection] = useState({
    name: '',
    description: '',
    fromExisting: ''
  });
  const [isCreatingSection, setIsCreatingSection] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [sectionToDelete, setSectionToDelete] = useState<Section | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    // Fetch real page data from API
    const fetchPages = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const pagesData = await cmsOperations.getAllPages();
        
        // Transform the data to match our PageItem interface
        const formattedPages: PageItem[] = pagesData.map(page => ({
          id: page.id,
          title: page.title,
          slug: page.slug,
          pageType: page.pageType,
          isPublished: page.isPublished,
          updatedAt: new Date(page.updatedAt).toISOString().split('T')[0], // Format date as YYYY-MM-DD
          sections: page.sections?.length || 0
        }));
        
        setPages(formattedPages);
      } catch (error) {
        console.error('Error fetching pages:', error);
        setError('Failed to load pages. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPages();
  }, []);

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

  const filteredPages = pages
    .filter(page => {
      // Apply search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        if (!page.title.toLowerCase().includes(query) && 
            !page.slug.toLowerCase().includes(query)) {
          return false;
        }
      }
      // Apply type filter
      if (filterType !== 'all' && page.pageType !== filterType) {
        return false;
      }
      return true;
    })
    .sort((a, b) => {
      // Apply sorting
      if (sortOrder === 'newest') {
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      } else if (sortOrder === 'oldest') {
        return new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
      } else if (sortOrder === 'title-asc') {
        return a.title.localeCompare(b.title);
      } else if (sortOrder === 'title-desc') {
        return b.title.localeCompare(a.title);
      }
      return 0;
    });

  // Pagination logic
  const totalPages = Math.ceil(filteredPages.length / itemsPerPage);
  const paginatedPages = filteredPages.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleCreatePage = () => {
    router.push(`/${locale}/cms/pages/create`);
  };

  const handleEditPage = (id: string, slug: string) => {
    // Navigate to the edit page route
    router.push(`/${locale}/cms/pages/edit/${slug}`);
  };

  const handleViewPage = (slug: string) => {
    // Open the page in a new tab
    window.open(`/${locale}/${slug}`, '_blank');
  };

  const handleViewSection = (sectionId: string) => {
    // Navigate to the section preview page
    router.push(`/${locale}/cms/sections/preview/${sectionId}`);
  };

  const handleDeletePage = async (id: string, title: string) => {
    if (confirm(`¿Estás seguro de que deseas eliminar la página "${title}"? Esta acción no se puede deshacer.`)) {
      try {
        setIsLoading(true);
        
        const result = await cmsOperations.deletePage(id);
        
        if (result.success) {
          // Actualizar la lista de páginas localmente
          setPages(prevPages => prevPages.filter(page => page.id !== id));
          setNotification({
            type: 'success',
            message: `La página "${title}" ha sido eliminada correctamente.`
          });
          
          // Ocultar la notificación después de 5 segundos
          setTimeout(() => {
            setNotification(null);
          }, 5000);
        } else {
          setError(`Error al eliminar la página: ${result.message}`);
        }
      } catch (error) {
        console.error('Error eliminando página:', error);
        setError('Error al eliminar la página. Por favor, inténtalo de nuevo.');
      } finally {
        setIsLoading(false);
      }
    }
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
        
        setNotification({
          type: 'success',
          message: `Sección "${newSection.name}" creada exitosamente`
        });
        
        // Limpiar y cerrar modal
        setNewSection({ name: '', description: '', fromExisting: '' });
        setShowNewSectionModal(false);
        
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

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-4 bg-red-50 text-red-700 rounded-md flex items-center">
          <AlertCircleIcon className="h-5 w-5 mr-2" />
          {error}
        </div>
      )}
      
      {notification && (
        <div className={`p-4 ${notification.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'} rounded-md flex items-center`}>
          {notification.type === 'success' ? (
            <CheckIcon className="h-5 w-5 mr-2" />
          ) : (
            <AlertCircleIcon className="h-5 w-5 mr-2" />
          )}
          {notification.message}
        </div>
      )}
      
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight">Pages</h1>
        <div className="flex space-x-3">

          <button
            onClick={handleCreatePage}
            className="px-4 py-2 bg-blue-600 text-white rounded-md flex items-center hover:bg-blue-700"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Create Page
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="flex flex-col md:flex-row justify-between items-center p-4 border-b">
          <div className="w-full md:w-1/3 mb-4 md:mb-0">
            <div className="relative">
              <input
                type="text"
                placeholder="Search pages..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-md"
              />
              <SearchIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            </div>
          </div>

          <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-2 w-full md:w-auto">
            <div className="relative">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="appearance-none pl-10 pr-8 py-2 border rounded-md bg-white"
              >
                <option value="all">All Types</option>
                <option value="HOME">Home</option>
                <option value="CONTENT">Content</option>
                <option value="BLOG">Blog</option>
                <option value="LANDING">Landing</option>
                <option value="CONTACT">Contact</option>
                <option value="SERVICES">Services</option>
                <option value="ABOUT">About</option>
                <option value="CUSTOM">Custom</option>
              </select>
              <FilterIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            </div>

            <div className="relative">
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                className="appearance-none pl-10 pr-8 py-2 border rounded-md bg-white"
              >
                <option value="newest">Newest</option>
                <option value="oldest">Oldest</option>
                <option value="title-asc">Title (A-Z)</option>
                <option value="title-desc">Title (Z-A)</option>
              </select>
              <ArrowUpDownIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="p-6 animate-pulse">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="py-4 border-b last:border-0">
                <div className="h-6 bg-gray-200 rounded w-1/4 mb-2"></div>
                <div className="h-4 bg-gray-100 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : paginatedPages.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left bg-gray-50">
                  <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                  <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Updated</th>
                  <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Sections</th>
                  <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedPages.map((page) => (
                  <tr key={page.id} className="border-t hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <FileTextIcon className="h-5 w-5 text-gray-400 mr-3" />
                        <span className="font-medium">{page.title}</span>
                      </div>
                      <div className="text-sm text-gray-500">{`/${page.slug}`}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm">{page.pageType}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {page.isPublished ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <CheckIcon className="h-3 w-3 mr-1" />
                          Published
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          <XIcon className="h-3 w-3 mr-1" />
                          Draft
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {page.updatedAt}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {page.sections}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => handleViewPage(page.slug)}
                          className="text-indigo-600 hover:text-indigo-900"
                          title="View page"
                        >
                          <EyeIcon className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleEditPage(page.id, page.slug)}
                          className="text-blue-600 hover:text-blue-900"
                          title="Edit page"
                        >
                          <PencilIcon className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleDeletePage(page.id, page.title)}
                          className="text-red-600 hover:text-red-900"
                          title="Delete page"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-6 text-center text-gray-500">
            No pages found matching your criteria
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-3 flex items-center justify-between border-t">
            <div className="text-sm text-gray-500">
              Showing {(currentPage - 1) * itemsPerPage + 1}-
              {Math.min(currentPage * itemsPerPage, filteredPages.length)} of {filteredPages.length} pages
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className={`p-2 rounded ${currentPage === 1 ? 'text-gray-300' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                <ChevronLeftIcon className="h-5 w-5" />
              </button>
              {[...Array(totalPages)].map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentPage(i + 1)}
                  className={`px-3 py-1 rounded ${
                    currentPage === i + 1
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className={`p-2 rounded ${
                  currentPage === totalPages ? 'text-gray-300' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <ChevronRightIcon className="h-5 w-5" />
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
                        onClick={() => handleViewSection(section.sectionId)}
                      >
                        <div>
                          <h4 className="font-medium">{section.name}</h4>
                          {section.description && (
                            <p className="text-sm text-gray-500">{section.description}</p>
                          )}
                          <div className="text-xs text-gray-400 mt-1">
                            {section.componentCount} {section.componentCount === 1 ? 'component' : 'components'}
                          </div>
                          
                          {/* Section preview */}
                          <div className="mt-2 border border-gray-100 rounded overflow-hidden">
                            <SectionPreview sectionId={section.sectionId} />
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