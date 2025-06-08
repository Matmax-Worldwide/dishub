'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { 
  PlusIcon, 
  ArrowLeftIcon, 
  LayoutIcon,
  TrashIcon, 
  CopyIcon,
  MoreHorizontalIcon,
  EyeIcon,
  CheckIcon,
  PencilIcon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cmsOperations } from '@/lib/graphql-client';
import { deleteCMSSection } from '@/lib/cms-delete';
import { updateCMSSection } from '@/lib/cms-update';

// Tipos para las secciones
interface Section {
  id: string;
  name: string;
  description: string;
  type: string;
  componentsCount: number;
  lastUpdated: string;
  usedInPages?: Array<{
    id: string;
    title: string;
    slug: string;
  }>;
}

export default function CmsSectionsPage() {
  const { locale } = useParams();
  const [sections, setSections] = useState<Section[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPagesLoading, setIsPagesLoading] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newSectionName, setNewSectionName] = useState('');
  const [newSectionDescription, setNewSectionDescription] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isDeletingSection, setIsDeletingSection] = useState<string | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteProgress, setDeleteProgress] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
  const [editSectionName, setEditSectionName] = useState('');
  const [editSectionDescription, setEditSectionDescription] = useState('');

  useEffect(() => {
    // Obtener las secciones desde GraphQL
    const loadSections = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Obtener los datos de la API GraphQL
        const cmsSections = await cmsOperations.getAllCMSSections();
        
        if (!cmsSections || cmsSections.length === 0) {
          // Si no hay secciones, establecer una lista vacía
          setSections([]);
          setIsLoading(false);
          return;
        }
        
        // Transformar los datos al formato requerido por la interfaz
        const formattedSections: Section[] = cmsSections.map((section) => {
          // Asegurarse que components sea un array para contar elementos
          const components = Array.isArray(section.components) 
            ? section.components 
            : [];
            
          // Derivar un nombre más amigable del sectionId
          
            const name = section.name
          // Determinar si es un tipo 'page' o 'component' basado en el nombre
          // Esto es una simplificación, idealmente vendría del servidor
          const type = name.includes('Page') || name.includes('Página') 
            ? 'page' 
            : 'component';
            
          return {
            id: section.sectionId,
            name,
            description: section.description,
            type,
            componentsCount: components.length,
            lastUpdated: section.lastUpdated || section.updatedAt,
            usedInPages: [] // Inicializar vacío y será llenado en el siguiente paso
          };
        });
        
        // Cargar las páginas que usan cada sección
        setIsPagesLoading(true);
        const sectionsWithPages = await Promise.all(
          formattedSections.map(async (section) => {
            try {
              const usedInPages = await cmsOperations.getPagesUsingSectionId(section.id);
              return {
                ...section,
                usedInPages: usedInPages.map(page => ({
                  id: page.id,
                  title: page.title,
                  slug: page.slug
                }))
              };
            } catch (err) {
              console.error(`Error al cargar páginas para la sección ${section.id}:`, err);
              return section;
            }
          })
        );
        setIsPagesLoading(false);
        
        setSections(sectionsWithPages);
      } catch (err) {
        console.error('Error al cargar las secciones:', err);
        setError('No se pudieron cargar las secciones. Por favor, inténtalo de nuevo más tarde.');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadSections();
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(locale as string, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  const handleCreateSection = async () => {
    if (!newSectionName.trim()) return;
    
    // Convertir el nombre a un ID válido (slug) - kebab-case
    const sectionId = newSectionName
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '');
      
    try {
      setIsLoading(true);
      
      // En una implementación real, aquí se crearía la sección en la base de datos
      // usando una mutación GraphQL. Por ahora simulamos la creación.
      
      // Crear la nueva sección con datos vacíos
      const result = await cmsOperations.saveSectionComponents(sectionId, []);
      
      if (result && result.success) {
        // Refrescar la lista de secciones para mostrar la nueva
        const cmsSections = await cmsOperations.getAllCMSSections();
        
        // Buscar la sección recién creada
        const newCmsSection = cmsSections.find(section => section.sectionId === sectionId);
        
        if (newCmsSection) {
          const newSection: Section = {
            id: sectionId,
            name: newSectionName,
            description: newSectionDescription || 'Sin descripción',
            type: 'component',
            componentsCount: 0,
            lastUpdated: new Date().toISOString(),
            usedInPages: []
          };
          
          setSections([...sections, newSection]);
        }
      } else {
        setError('No se pudo crear la sección. Por favor, inténtalo de nuevo.');
      }
    } catch (err) {
      console.error('Error al crear la sección:', err);
      setError('Error al crear la sección. Por favor, inténtalo de nuevo.');
    } finally {
      setIsLoading(false);
      setNewSectionName('');
      setNewSectionDescription('');
      setIsCreateDialogOpen(false);
    }
  };
  
  const handleDeleteSection = async (id: string) => {
    // Al hacer clic en el botón de eliminar, abrir el diálogo de confirmación
    setIsDeletingSection(id);
    setDeleteConfirmOpen(true);
    setDeleteProgress('idle');
    setDeleteError(null);
  };

  const confirmDeleteSection = async () => {
    if (!isDeletingSection) return;
    
    setDeleteProgress('loading');
    setDeleteError(null);
    
    try {
      // Enviar la petición para eliminar la sección
      const result = await deleteCMSSection(isDeletingSection);
      
      if (result.success) {
        // Actualizar localmente la lista de secciones
        setSections(sections.filter(section => section.id !== isDeletingSection));
        setDeleteProgress('success');
        
        // Cerrar automáticamente después de un breve retraso
        setTimeout(() => {
          setDeleteConfirmOpen(false);
          setIsDeletingSection(null);
          setDeleteProgress('idle');
        }, 1500);
      } else {
        setDeleteProgress('error');
        setDeleteError(result.message || 'Error al eliminar la sección');
      }
    } catch (err) {
      console.error('Error al eliminar la sección:', err);
      setDeleteProgress('error');
      setDeleteError('Error al eliminar la sección: ' + (err instanceof Error ? err.message : 'Error desconocido'));
    }
  };

  const cancelDeleteSection = () => {
    setDeleteConfirmOpen(false);
    setIsDeletingSection(null);
    setDeleteProgress('idle');
    setDeleteError(null);
  };

  const handleEditSection = (section: Section) => {
    setEditingSectionId(section.id);
    setEditSectionName(section.name);
    setEditSectionDescription(section.description);
    setIsEditDialogOpen(true);
  };

  const updateSectionDetails = async () => {
    if (!editingSectionId || !editSectionName.trim()) return;
    
    try {
      setIsLoading(true);
      
      // Call the GraphQL mutation to update the section
      const result = await updateCMSSection(
        editingSectionId, 
        {
          name: editSectionName,
          description: editSectionDescription || 'Sin descripción'
        }
      );
      
      if (result && result.success) {
        // Update section data locally
        setSections(sections.map(section => 
          section.id === editingSectionId 
            ? { 
                ...section, 
                name: editSectionName,
                description: editSectionDescription || 'Sin descripción',
                lastUpdated: result.lastUpdated || new Date().toISOString()
              } 
            : section
        ));
        
        // Close the dialog and reset state
        setIsEditDialogOpen(false);
        setEditingSectionId(null);
        setEditSectionName('');
        setEditSectionDescription('');
      } else {
        setError(result?.message || 'Error al actualizar la sección. Por favor, inténtalo de nuevo.');
      }
    } catch (err) {
      console.error('Error al actualizar la sección:', err);
      setError('Error al actualizar la sección. Por favor, inténtalo de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Link href={`/${locale}/cms`} className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700">
            <ArrowLeftIcon className="w-4 h-4 mr-1" />
            Volver al CMS
          </Link>
          <h1 className="text-2xl font-bold">Gestión de Secciones</h1>
        </div>
        
        <Button 
          className="flex items-center"
          onClick={() => setIsCreateDialogOpen(!isCreateDialogOpen)}
        >
          <PlusIcon className="w-4 h-4 mr-2" />
          Nueva Sección
        </Button>
      </div>

      {/* Create Section Form */}
      {isCreateDialogOpen && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Crear nueva sección</CardTitle>
            <CardDescription>
              Las secciones son componentes reutilizables que puedes añadir a tus páginas.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre</Label>
                <Input 
                  id="name" 
                  placeholder="Ej: Hero Principal" 
                  value={newSectionName}
                  onChange={(e) => setNewSectionName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Descripción</Label>
                <Input 
                  id="description" 
                  placeholder="Ej: Sección de héroe para la página principal" 
                  value={newSectionDescription}
                  onChange={(e) => setNewSectionDescription(e.target.value)}
                />
              </div>
              <div className="flex space-x-2 pt-4">
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>Cancelar</Button>
                <Button onClick={handleCreateSection}>Crear sección</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded relative mb-4">
          {error}
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          // Mostrar indicadores de carga
          Array.from({ length: 3 }).map((_, i) => (
            <Card key={`skeleton-${i}`} className="overflow-hidden">
              <div className="p-6 animate-pulse">
                <div className="h-5 bg-gray-200 rounded w-3/4 mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                <div className="mt-4 flex justify-between items-center">
                  <div className="h-8 bg-gray-200 rounded w-12"></div>
                  <div className="h-6 bg-gray-200 rounded-full w-6"></div>
                </div>
              </div>
            </Card>
          ))
        ) : sections.length === 0 ? (
          // Mostrar mensaje de no hay secciones
          <div className="col-span-full text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-300">
            <LayoutIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900">No hay secciones</h3>
            <p className="mt-2 text-sm text-gray-500 max-w-md mx-auto">
              No se encontraron secciones. Crea una nueva sección para comenzar a gestionar el contenido de tu sitio web.
            </p>
            <Button 
              className="mt-4"
              onClick={() => setIsCreateDialogOpen(true)}
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Crear primera sección
            </Button>
          </div>
        ) : (
          // Mostrar las secciones existentes
          sections.map(section => (
            <Card key={section.id} className="overflow-hidden">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {section.type === 'page' ? (
                      <LayoutIcon className="h-5 w-5 text-blue-500" />
                    ) : (
                      <CopyIcon className="h-5 w-5 text-purple-500" />
                    )}
                    <CardTitle className="text-lg">{section.name}</CardTitle>
                  </div>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Abrir menú</span>
                        <MoreHorizontalIcon className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                      <DropdownMenuItem 
                        onClick={() => handleEditSection(section)}
                      >
                        <PencilIcon className="h-4 w-4 mr-2" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href={`/${locale}/cms/sections/preview/${section.id}`}>
                          <EyeIcon className="h-4 w-4 mr-2" />
                          Ver y Personalizar
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => handleDeleteSection(section.id)}
                        className="text-red-600 focus:text-red-700"
                      >
                        <TrashIcon className="h-4 w-4 mr-2" />
                        Eliminar
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <CardDescription>{section.description}</CardDescription>
              </CardHeader>
              
              <CardContent>
                <div className="text-sm text-gray-500">
                  {section.componentsCount} componente{section.componentsCount !== 1 ? 's' : ''}
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  Última actualización: {formatDate(section.lastUpdated)}
                </div>
                
                {isPagesLoading ? (
                  <div className="mt-3 border-t pt-2">
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin h-3 w-3 border-2 border-blue-500 border-opacity-20 border-t-blue-500 rounded-full"></div>
                      <p className="text-xs text-gray-400">Cargando páginas donde se usa esta sección...</p>
                    </div>
                  </div>
                ) : section.usedInPages && section.usedInPages.length > 0 ? (
                  <div className="mt-3 border-t pt-2">
                    <div className="text-xs font-medium text-gray-500 mb-1">
                      Utilizada en {section.usedInPages.length} página{section.usedInPages.length !== 1 ? 's' : ''}:
                    </div>
                    <ul className="space-y-1 max-h-24 overflow-y-auto pr-1">
                      {section.usedInPages.map(page => (
                        <li key={page.id} className="text-xs flex items-center space-x-1">
                          <span className="h-1.5 w-1.5 rounded-full bg-blue-500 flex-shrink-0"></span>
                          <Link 
                            href={`/${locale}/cms/pages/edit/${page.id}`}
                            className="text-blue-600 hover:text-blue-800 truncate max-w-full"
                            title={page.title}
                          >
                            {page.title}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <div className="mt-3 border-t pt-2">
                    <p className="text-xs text-gray-400">
                      Esta sección no está asignada a ninguna página actualmente.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
      
      {/* Delete Confirmation Section */}
      {deleteConfirmOpen && (
        <Card className="mb-6 border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-900">Confirmar eliminación</CardTitle>
            <CardDescription className="text-red-700">
              ¿Estás seguro de que deseas eliminar esta sección?
            </CardDescription>
            {isDeletingSection && (
              <div className="mt-2 bg-amber-50 p-2 rounded border border-amber-200">
                <code className="text-xs font-mono">{isDeletingSection}</code>
              </div>
            )}
            <div className="mt-2 text-red-600 text-sm">
              Esta acción no se puede deshacer. Solo se eliminará la sección, los componentes podrán seguir siendo utilizados en otras secciones.
            </div>
          </CardHeader>
          
          <CardContent>
            {deleteError && (
              <div className="bg-red-50 text-red-600 p-3 rounded-md mb-4">
                {deleteError}
              </div>
            )}
            
            <div className="flex space-x-2">
              <Button 
                variant="outline" 
                onClick={cancelDeleteSection}
                disabled={deleteProgress === 'loading'}
              >
                Cancelar
              </Button>
              <Button 
                variant="destructive"
                onClick={confirmDeleteSection}
                disabled={deleteProgress === 'loading' || deleteProgress === 'success'}
                className="gap-2"
              >
                {deleteProgress === 'loading' ? (
                  <>
                    <span className="animate-spin h-4 w-4 border-2 border-white border-opacity-20 border-t-white rounded-full"></span>
                    Eliminando...
                  </>
                ) : deleteProgress === 'success' ? (
                  <>
                    <CheckIcon className="h-4 w-4" />
                    Eliminado
                  </>
                ) : (
                  <>
                    <TrashIcon className="h-4 w-4" />
                    Eliminar
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Edit Section Form */}
      {isEditDialogOpen && (
        <Card className="mb-6 border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-blue-900">Editar sección</CardTitle>
            <CardDescription className="text-blue-700">
              Actualiza el nombre y la descripción de esta sección.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Nombre</Label>
                <Input 
                  id="edit-name" 
                  placeholder="Ej: Hero Principal" 
                  value={editSectionName}
                  onChange={(e) => setEditSectionName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-description">Descripción</Label>
                <Input 
                  id="edit-description" 
                  placeholder="Ej: Sección de héroe para la página principal" 
                  value={editSectionDescription}
                  onChange={(e) => setEditSectionDescription(e.target.value)}
                />
              </div>
              <div className="flex space-x-2 pt-4">
                <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancelar</Button>
                <Button onClick={updateSectionDetails}>Guardar cambios</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 