'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  SaveIcon,
  ArrowLeftIcon,
  AlertCircleIcon,
  CheckIcon,
  FileTextIcon,
  GlobeIcon,
  TagIcon,
  LayoutIcon
} from 'lucide-react';
import { cmsOperations } from '@/lib/graphql-client';

interface Section {
  id: string;
  name: string;
  description?: string;
  componentCount: number;
}

export default function CreatePage() {
  const { locale } = useParams();
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [availableSections, setAvailableSections] = useState<Section[]>([]);
  const [isLoadingSections, setIsLoadingSections] = useState(true);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  
  // Datos de la página
  const [pageData, setPageData] = useState({
    title: '',
    slug: '',
    description: '',
    isPublished: false,
    pageType: 'CONTENT',
    sections: [] as string[] // IDs de las secciones seleccionadas
  });

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
            id: section.id,
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
        router.push(`/${locale}/admin/cms/pages`);
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
    router.push(`/${locale}/admin/cms/pages`);
  };

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

      {/* Main content */}
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
              <h2 className="text-lg font-medium mb-4 flex items-center">
                <LayoutIcon className="h-5 w-5 mr-2" />
                Sections
              </h2>
              
              {isLoadingSections ? (
                <div className="animate-pulse space-y-4">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="h-16 bg-gray-200 rounded"></div>
                  ))}
                </div>
              ) : availableSections.length > 0 ? (
                <div className="space-y-3">
                  {availableSections.map(section => (
                    <div
                      key={section.id}
                      className={`p-3 border rounded-md cursor-pointer transition-colors ${
                        pageData.sections.includes(section.id)
                          ? 'border-blue-300 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => toggleSection(section.id)}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium">{section.name}</h3>
                          {section.description && (
                            <p className="text-sm text-gray-500">{section.description}</p>
                          )}
                          <div className="text-xs text-gray-400 mt-1">
                            {section.componentCount} {section.componentCount === 1 ? 'component' : 'components'}
                          </div>
                        </div>
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                          pageData.sections.includes(section.id) ? 'bg-blue-500 text-white' : 'border border-gray-300'
                        }`}>
                          {pageData.sections.includes(section.id) && (
                            <CheckIcon className="h-3 w-3" />
                          )}
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
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 