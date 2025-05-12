'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  SaveIcon,
  ArrowLeftIcon,
  AlertCircleIcon,
  CheckIcon,
  FileTextIcon,
  LayoutIcon,
  PlusIcon,
  Loader2Icon,
  ChevronRightIcon,
  SearchIcon,
  InfoIcon,
  AlignLeftIcon,
  GlobeIcon,
  XIcon,
  EyeIcon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { cmsOperations } from '@/lib/graphql-client';
import ManageableSection from '@/components/cms/ManageableSection';

interface ManageableSectionHandle {
  saveChanges: () => Promise<void>;
}

interface Section {
  id: string;
  sectionId: string;
  name: string;
  type: string;
  data: Array<{
    sectionId: string;
    type: string;
    data: Record<string, unknown>;
  }>;
  order: number;
  description: string;
}

interface AvailableSection {
  id: string;
  sectionId: string;
  name: string;
  type: string;
  description?: string;
}

interface PageData {
  id: string;
  title: string;
  slug: string;
  description: string;
  template: string;
  isPublished: boolean;
  pageType: string;
  locale: string;
  sections: Section[];
  metaTitle: string;
  metaDescription: string;
  featuredImage: string;
}

interface PageParams {
  locale: string;
  slug: string;
  [key: string]: string;
}


interface PageResponse {
  id: string;
  title: string;
  slug: string;
  description?: string;
  template?: string;
  isPublished: boolean;
  pageType: string;
  locale?: string;
  sections: Array<{
    id: string;
    sectionId: string;
    data: {
      sectionId: string;
    };
    order?: number;
  }>;
  metaTitle?: string;
  metaDescription?: string;
  featuredImage?: string;
}

// Main Component
export default function EditPageWithSections() {
  const params = useParams<PageParams>();
  const router = useRouter();
  const { locale, slug } = params;
  
  // Page data state
  const [pageData, setPageData] = useState<PageData>({
    id: '',
    title: '',
    slug: '',
    description: '',
    template: 'default',
    isPublished: false,
    pageType: 'CONTENT',
    locale: locale,
    sections: [],
    metaTitle: '',
    metaDescription: '',
    featuredImage: ''
  });
  
  // UI states
  const [activeTab, setActiveTab] = useState('details');
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isExitConfirmationOpen, setIsExitConfirmationOpen] = useState(false);
  const [redirectTarget, setRedirectTarget] = useState('');
  
  // Section management states
  const [availableSections, setAvailableSections] = useState<AvailableSection[]>([]);
  const [pageSections, setPageSections] = useState<Section[]>([]);
  const [showAddSectionDialog, setShowAddSectionDialog] = useState(false);
  const [selectedTemplateSection, setSelectedTemplateSection] = useState<string>('');
  const [forceReloadSection, setForceReloadSection] = useState(false);
  
  // Delete confirmation states
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [sectionToDelete, setSectionToDelete] = useState<Section | null>(null);
  
  // Reference to the section editor
  const sectionRef = useRef<ManageableSectionHandle>(null);
  
  // New states for section creation
  const [isCreatingSection, setIsCreatingSection] = useState(false);
  const [newSectionName, setNewSectionName] = useState('');
  const [isSavingSection, setIsSavingSection] = useState(false);

  // Load page data
  useEffect(() => {
    const loadPageData = async () => {
      try {
        setIsLoading(true);
        const response = await cmsOperations.getPageBySlug(slug as string) as PageResponse;
        
        console.log('Raw response:', response);
        
        if (!response) {
          console.error('No se encontró la página');
          setNotification({
            type: 'error',
            message: 'No se encontró la página'
          });
          return;
        }

        console.log('Page data received:', response);
        
        // First set the page data
        setPageData({
          id: response.id,
          title: response.title,
          slug: response.slug,
          description: response.description || '',
          template: response.template || 'default',
          isPublished: response.isPublished,
          pageType: response.pageType,
          locale: response.locale || locale,
          sections: [],
          metaTitle: response.metaTitle || '',
          metaDescription: response.metaDescription || '',
          featuredImage: response.featuredImage || ''
        });
        
        // Then load components for each section
        if (response.sections && response.sections.length > 0) {
          console.log('Sections from response:', JSON.stringify(response.sections, null, 2));
          
          // First get all CMS sections
          const allCMSSections = await cmsOperations.getAllCMSSections();
          console.log('All CMS sections:', JSON.stringify(allCMSSections.map(s => ({ 
            id: s.id,
            sectionId: s.sectionId,
            name: s.name
          })), null, 2));
          
          // Create a map of sectionId to corresponding CMS section for faster lookup
          const cmsSectionMap = new Map();
          allCMSSections.forEach(section => {
            cmsSectionMap.set(section.id, section);
            cmsSectionMap.set(section.sectionId, section);
          });
          
          const sectionsWithComponents = await Promise.all(
            response.sections.map(async (section, index) => {
              console.log(`Processing section ${index}:`, JSON.stringify(section, null, 2));
              
              // Check if section has an ID at minimum
              if (!section.id) {
                console.error('Section missing ID:', JSON.stringify(section, null, 2));
                return null;
              }
              
              try {
                // First try: look for section in the data.sectionId or data.cmsSection
                let cmsSectionId = null;
                if (section.data) {
                  // Verify data fields exist using safer approach
                  const sectionData = section.data as Record<string, unknown>;
                  cmsSectionId = sectionData.sectionId as string || sectionData.cmsSection as string;
                }
                console.log(`Looking for CMS section with data.sectionId/cmsSection: ${cmsSectionId || 'None'}`);
                
                // Try to find CMS section using different strategies
                let cmsSection = null;
                
                // Strategy 1: Use sectionId from section.data if available
                if (cmsSectionId) {
                  cmsSection = cmsSectionMap.get(cmsSectionId) || 
                               allCMSSections.find(s => s.sectionId === cmsSectionId);
                  if (cmsSection) {
                    console.log(`Found section via data.sectionId: ${cmsSection.name}`);
                  }
                }
                
                // Strategy 2: Use section.sectionId if available
                if (!cmsSection && section.sectionId) {
                  cmsSection = cmsSectionMap.get(section.sectionId) || 
                               allCMSSections.find(s => s.sectionId === section.sectionId);
                  if (cmsSection) {
                    console.log(`Found section via section.sectionId: ${cmsSection.name}`);
                  }
                }
                
                // Strategy 3: Direct match by page section's ID
                if (!cmsSection) {
                  cmsSection = cmsSectionMap.get(section.id) || 
                               allCMSSections.find(s => s.id === section.id);
                  if (cmsSection) {
                    console.log(`Found section via direct ID match: ${cmsSection.name}`);
                  }
                }
                
                // Final fallback: use first available section
                if (!cmsSection && allCMSSections.length > 0) {
                  cmsSection = allCMSSections[0];
                  console.log(`Using first available section as fallback: ${cmsSection.name}`);
                }
                
                console.log(`Section lookup result:`, cmsSection ? 
                  { id: cmsSection.id, sectionId: cmsSection.sectionId, name: cmsSection.name } : 
                  'Not found');
                
                if (!cmsSection) {
                  console.error(`No CMSSection found in system for section ${section.id}`);
                  return null;
                }
                
                // Create section data with the found CMS section
                const sectionData: Section = {
                  id: section.id, // Keep original section ID from page
                  sectionId: cmsSection.sectionId, // IMPORTANT: Use CMS section's sectionId
                  name: cmsSection.name || 'Unknown Section',
                  type: 'default',
                  data: [], // Start with empty data that will be populated later
                  order: section.order || index,
                  description: cmsSection.description || ''
                };
                
                console.log('Created section data:', JSON.stringify({
                  id: sectionData.id,
                  sectionId: sectionData.sectionId,
                  name: sectionData.name,
                  order: sectionData.order
                }, null, 2));
                
                return sectionData;
              } catch (error) {
                console.error(`Error processing section with ID ${section.id}:`, error);
                return null;
              }
            })
          );
          
          // Filter out any null sections
          const validSections = sectionsWithComponents.filter((section): section is Section => section !== null);
          
          // Sort by order
          validSections.sort((a, b) => a.order - b.order);
          
          console.log(`Final processed sections (${validSections.length}):`, JSON.stringify(
            validSections.map(s => ({ 
              id: s.id, 
              sectionId: s.sectionId,
              name: s.name,
              order: s.order 
            })), null, 2));
          
          setPageSections(validSections);
          setPageData(prev => ({
            ...prev,
            sections: validSections
          }));
        }
      } catch (error) {
        console.error('Error al cargar la página:', error);
        setNotification({
          type: 'error',
          message: 'Error al cargar la página'
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (slug) {
      loadPageData();
    }
  }, [slug, locale]);

  // Load available sections
  useEffect(() => {
    const loadSections = async () => {
      try {
        const response = await cmsOperations.getAllCMSSections();
        const formattedSections: AvailableSection[] = response.map((section) => ({
          id: section.id,
          sectionId: section.id,
          name: section.name,
          type: 'default',
          description: section.description
        }));
        setAvailableSections(formattedSections);
      } catch (error) {
        console.error('Error loading sections:', error);
        setNotification({
          type: 'error',
          message: 'Error al cargar las secciones disponibles'
        });
      }
    };

    loadSections();
  }, []);
  
  // Exit confirmation
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = ''; // Required for Chrome
        return '';
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [hasUnsavedChanges]);
  
  // Generate slug from title
  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };
  
  // Handle title change and auto-generate slug if not manually edited
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    const currentSlug = pageData.slug;
    
    const shouldUpdateSlug = 
      !currentSlug || 
      currentSlug === generateSlug(pageData.title || '');
    
    setPageData(prev => ({
      ...prev,
      title: newTitle,
      ...(shouldUpdateSlug ? { slug: generateSlug(newTitle) } : {})
    }));
    
    setHasUnsavedChanges(true);
  };
  
  // Handle general input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setPageData(prev => ({ ...prev, [name]: value }));
    setHasUnsavedChanges(true);
  };
  
  // Handle select changes
  const handleSelectChange = (name: string, value: string) => {
    setPageData(prev => ({ ...prev, [name]: value }));
    setHasUnsavedChanges(true);
  };
  
  // Handle checkbox/switch changes
  const handleCheckboxChange = (name: string, checked: boolean) => {
    setPageData(prev => ({ ...prev, [name]: checked }));
    setHasUnsavedChanges(true);
  };
  
  // Add section to page
  const handleAddSection = (section: AvailableSection) => {
    const newSection: Section = {
      id: section.id,
      sectionId: section.sectionId,
      name: section.name,
      type: section.type,
      data: [],
      order: pageSections.length,
      description: section.description || ''
    };
    
    setPageSections([...pageSections, newSection]);
    setHasUnsavedChanges(true);
  };

  const handleAddSectionClick = () => {
    const selectedSection = availableSections.find(s => s.sectionId === selectedTemplateSection);
    if (selectedSection) {
      handleAddSection(selectedSection);
      setShowAddSectionDialog(false);
      setSelectedTemplateSection('');
    }
  };


  // Confirm section removal
  const confirmDeleteSection = () => {
    if (!sectionToDelete) return;
    
    console.log(`Eliminando sección: ${sectionToDelete.name} (${sectionToDelete.sectionId})`);
    
    setPageSections(prev => prev
      .filter(s => s.sectionId !== sectionToDelete.sectionId)
      .map((section, index) => ({ ...section, order: index }))
    );
    
    setIsDeleteConfirmOpen(false);
    setSectionToDelete(null);
    setHasUnsavedChanges(true);
  };
  
  // Cancel section removal
  const cancelDeleteSection = () => {
    setIsDeleteConfirmOpen(false);
    setSectionToDelete(null);
  };

  // Save the entire page
  const handleSavePage = async () => {
    if (!pageData.title) {
      setNotification({
        type: 'error',
        message: 'Por favor, ingresa un título para la página'
      });
      return;
    }
    
    setIsSaving(true);
    
    try {
      // First save the section components if they exist
      if (sectionRef.current && pageSections.length > 0) {
        console.log(`Guardando componentes para la sección: ${pageSections[0]?.sectionId}`);
        await sectionRef.current.saveChanges();
      }
      
      console.log('Preparando datos para actualizar página...');
      console.log('Secciones a guardar:', JSON.stringify(pageSections.map(s => ({
        id: s.id,
        sectionId: s.sectionId,
        name: s.name,
        order: s.order
      })), null, 2));
      
      // Prepare sections for API format - matching expected PageSectionInput type
      const sections = pageSections.map((section, index) => ({
        // Don't include id in update operation for new sections
        ...(section.id && !section.id.startsWith('temp-') ? { id: section.id } : {}),
        order: index,
        title: section.name,
        // Use a valid ComponentType enum value from Prisma schema (instead of 'default' or 'CUSTOM')
        componentType: 'CUSTOM', // Valid enum value from ComponentType
        data: { 
          components: section.data,
          // Include a reference to the CMS section ID in the data
          sectionId: section.sectionId, // Store sectionId consistently
          cmsSection: section.sectionId // For backward compatibility
        },
        isVisible: true
      }));
      
      console.log(`Actualizando página con ${sections.length} secciones:`, JSON.stringify(sections, null, 2));
      
      // Create the input WITHOUT including the 'id' field in the main input
      const pageInput = {
        title: pageData.title,
        slug: pageData.slug,
        description: pageData.description,
        template: pageData.template,
        isPublished: pageData.isPublished,
        pageType: pageData.pageType,
        locale: pageData.locale,
        metaTitle: pageData.metaTitle || undefined,
        metaDescription: pageData.metaDescription || undefined,
        featuredImage: pageData.featuredImage || undefined,
        sections
      };
      
      console.log('Datos de la página a actualizar:', JSON.stringify(pageInput, null, 2));
      
      const result = await cmsOperations.updatePage(pageData.id, pageInput);
      
      if (result && result.success) {
        console.log('Página actualizada exitosamente:', result);
        setNotification({
          type: 'success',
          message: 'Página actualizada exitosamente'
        });
        setHasUnsavedChanges(false);
        // Refresh section view to show updated components
        setForceReloadSection(!forceReloadSection);
        // Briefly pause to ensure the update is processed before redirecting
        setTimeout(() => {
          router.push(`/${locale}/cms/pages`);
        }, 500);
      } else {
        throw new Error('Error al actualizar la página');
      }
    } catch (error) {
      console.error('Error al actualizar la página:', error);
      setNotification({
        type: 'error',
        message: error instanceof Error ? error.message : 'Error al actualizar la página'
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  // Handle cancel/back button
  const handleCancel = () => {
    if (hasUnsavedChanges) {
      setRedirectTarget(`/${locale}/cms/pages`);
      setIsExitConfirmationOpen(true);
    } else {
      router.push(`/${locale}/cms/pages`);
    }
  };
  
  // Confirm exit without saving
  const handleConfirmExit = () => {
    setIsExitConfirmationOpen(false);
    
    if (redirectTarget) {
      router.push(redirectTarget);
    }
  };
  
  // Cancel exit
  const handleCancelExit = () => {
    setIsExitConfirmationOpen(false);
    setRedirectTarget('');
  };

  // Create a new section
  const handleCreateSection = async () => {
    if (!newSectionName.trim()) {
      setNotification({
        type: 'error',
        message: 'Debes proporcionar un nombre para la sección'
      });
      return;
    }
    
    const sectionId = `section-${newSectionName
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')}-${Date.now()}`;
      
    setIsSavingSection(true);
    
    try {
      console.log(`Creando nueva sección "${newSectionName}" con ID: ${sectionId}`);
      
      const result = await cmsOperations.saveSectionComponents(sectionId, []);
      
      if (result && result.success) {
        console.log('Sección creada exitosamente:', sectionId);
        
        const newSection: AvailableSection = {
          sectionId: sectionId,
          name: newSectionName,
          description: '',
          type: 'default',
          id: sectionId
        };
        
        setAvailableSections(prev => [...prev, newSection]);
        
        const newPageSection: Section = {
          id: `temp-${Date.now()}`, 
          sectionId: sectionId,
          name: newSectionName,
          type: 'default',
          data: [],
          order: pageSections.length,
          description: ''
        };
        
        setPageSections(prev => [...prev, newPageSection]);
        setHasUnsavedChanges(true);
        
        setNewSectionName('');
        setIsCreatingSection(false);
        
        setNotification({
          type: 'success',
          message: `Sección "${newSectionName}" creada y añadida a la página`
        });
        
        setTimeout(() => {
          setNotification(null);
        }, 3000);
      } else {
        throw new Error(result?.message || 'Error al crear la sección');
      }
    } catch (error) {
      console.error('Error al crear la sección:', error);
      setNotification({
        type: 'error',
        message: error instanceof Error ? error.message : 'Error al crear la sección'
      });
    } finally {
      setIsSavingSection(false);
    }
  };

  // Render the new section creation UI
  const renderNewSectionUI = () => {
    if (isCreatingSection) {
      return (
        <div className="max-w-md mx-auto">
          <div className="flex items-center space-x-4">
            <Input
              value={newSectionName}
              onChange={(e) => setNewSectionName(e.target.value)}
              placeholder="Nombre para los componentes"
              className="flex-1 border-blue-300 focus:ring-blue-500"
              autoFocus
              disabled={isSavingSection}
            />
            <Button
              onClick={handleCreateSection}
              disabled={!newSectionName.trim() || isSavingSection}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
            >
              {isSavingSection ? (
                <>
                  <span className="animate-spin h-4 w-4 border-2 border-white border-opacity-20 border-t-white rounded-full"></span>
                  <span>Creando...</span>
                </>
              ) : (
                <>
                  <CheckIcon className="h-4 w-4" />
                  <span>Crear</span>
                </>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setIsCreatingSection(false);
                setNewSectionName('');
              }}
              className="h-10 w-10 p-0 border-blue-300 text-blue-600"
              disabled={isSavingSection}
            >
              <XIcon className="h-4 w-4" />
            </Button>
          </div>
        </div>
      );
    }

    return (
      <div className="max-w-xs mx-auto">
        <Button 
          className="w-full bg-blue-600 hover:bg-blue-700"
          onClick={() => setIsCreatingSection(true)}
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          <span>Añadir componentes</span>
        </Button>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2Icon className="h-8 w-8 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-gray-600">Cargando página...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button 
            variant="ghost" 
            size="sm" 
            className="flex items-center gap-1"
            onClick={handleCancel}
          >
            <ArrowLeftIcon className="h-4 w-4" />
            <span>Volver</span>
          </Button>
          <h1 className="text-2xl font-bold">
            Editar página: {pageData.title}
          </h1>
        </div>
        
        <div className="flex items-center gap-2">
          {hasUnsavedChanges && (
            <div className="text-amber-600 bg-amber-50 text-sm px-3 py-1 rounded-full flex items-center">
              <AlertCircleIcon className="h-4 w-4 mr-1" />
              <span>Cambios sin guardar</span>
            </div>
          )}
          
          <div className="flex items-center gap-2 border border-gray-200 rounded-md px-3 py-1 bg-white">
            <Switch
              id="header-isPublished"
              checked={pageData.isPublished}
              onCheckedChange={(checked) => handleCheckboxChange('isPublished', checked)}
            />
            <Label htmlFor="header-isPublished" className="text-sm font-medium text-gray-700">
              {pageData.isPublished ? 'Publicada' : 'Borrador'}
            </Label>
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleCancel}
          >
            Cancelar
          </Button>
          
          <Button
            variant="default"
            size="sm"
            onClick={handleSavePage}
            disabled={isSaving}
            className="flex items-center gap-1"
          >
            {isSaving ? (
              <>
                <span className="animate-spin h-4 w-4 border-2 border-white border-opacity-20 border-t-white rounded-full mr-1"></span>
                <span>Guardando...</span>
              </>
            ) : (
              <>
                <SaveIcon className="h-4 w-4" />
                <span>Guardar cambios</span>
              </>
            )}
          </Button>
        </div>
      </div>
      
      {/* Notification */}
      {notification && (
        <div 
          className={`p-3 rounded-md ${
            notification.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
          } flex items-center`}
        >
          {notification.type === 'success' ? (
            <CheckIcon className="h-5 w-5 mr-2" />
          ) : (
            <AlertCircleIcon className="h-5 w-5 mr-2" />
          )}
          {notification.message}
        </div>
      )}
      
      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-3 mb-6">
          <TabsTrigger value="details" className="flex items-center">
            <FileTextIcon className="h-4 w-4 mr-2" />
            <span>Detalles</span>
          </TabsTrigger>
          <TabsTrigger value="seo" className="flex items-center">
            <SearchIcon className="h-4 w-4 mr-2" />
            <span>SEO</span>
          </TabsTrigger>
          <TabsTrigger value="sections" className="flex items-center">
            <LayoutIcon className="h-4 w-4 mr-2" />
            <span>Secciones</span>
          </TabsTrigger>
        </TabsList>
        
        {/* Page Details Tab */}
        <TabsContent value="details" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Información de la página</CardTitle>
              <CardDescription>
                Edita la información básica de la página.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="title">Título de la página</Label>
                  <Input
                    id="title"
                    name="title"
                    value={pageData.title}
                    onChange={handleTitleChange}
                    placeholder="Ingresa el título de la página"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="slug">URL Slug</Label>
                  <Input
                    id="slug"
                    name="slug"
                    value={pageData.slug}
                    onChange={handleInputChange}
                    placeholder="url-slug-de-la-pagina"
                  />
                  <p className="text-sm text-gray-500">
                    URL: /{locale}/{pageData.slug || 'url-slug'}
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="description">Descripción</Label>
                  <Textarea
                    id="description"
                    name="description"
                    value={pageData.description || ''}
                    onChange={handleInputChange}
                    placeholder="Breve descripción de la página"
                    rows={3}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="template">Plantilla</Label>
                  <Select 
                    name="template" 
                    value={pageData.template || 'default'} 
                    onValueChange={(value) => handleSelectChange('template', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona una plantilla" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="default">Por defecto</SelectItem>
                      <SelectItem value="landing">Landing Page</SelectItem>
                      <SelectItem value="sidebar">Con barra lateral</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="pageType">Tipo de página</Label>
                  <Select 
                    name="pageType" 
                    value={pageData.pageType} 
                    onValueChange={(value) => handleSelectChange('pageType', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona el tipo de página" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CONTENT">Página de contenido</SelectItem>
                      <SelectItem value="LANDING">Landing Page</SelectItem>
                      <SelectItem value="BLOG">Página de blog</SelectItem>
                      <SelectItem value="HOME">Página de inicio</SelectItem>
                      <SelectItem value="CONTACT">Página de contacto</SelectItem>
                      <SelectItem value="SERVICES">Página de servicios</SelectItem>
                      <SelectItem value="ABOUT">Página de acerca de</SelectItem>
                      <SelectItem value="CUSTOM">Página personalizada</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={handleCancel}>
                Cancelar
              </Button>
              <Button onClick={() => setActiveTab('sections')} className="flex items-center">
                <span>Continuar a Secciones</span>
                <ChevronRightIcon className="h-4 w-4 ml-1" />
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* SEO Tab */}
        <TabsContent value="seo" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Información SEO</CardTitle>
              <CardDescription>
                Configura cómo se mostrará tu página en los resultados de búsqueda.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                {/* Meta Title */}
                <div className="space-y-2">
                  <Label htmlFor="metaTitle" className="flex items-center">
                    <InfoIcon className="h-4 w-4 mr-2" />
                    <span>Título meta</span>
                  </Label>
                  <Input
                    id="metaTitle"
                    name="metaTitle"
                    value={pageData.metaTitle || ''}
                    onChange={handleInputChange}
                    placeholder="Título para motores de búsqueda"
                  />
                  <p className="text-sm text-gray-500">
                    {!pageData.metaTitle && "Si se deja vacío, se utilizará el título de la página"}
                  </p>
                </div>
                
                {/* Meta Description */}
                <div className="space-y-2">
                  <Label htmlFor="metaDescription" className="flex items-center">
                    <AlignLeftIcon className="h-4 w-4 mr-2" />
                    <span>Descripción meta</span>
                  </Label>
                  <Textarea
                    id="metaDescription"
                    name="metaDescription"
                    value={pageData.metaDescription || ''}
                    onChange={handleInputChange}
                    placeholder="Descripción para motores de búsqueda"
                    rows={3}
                  />
                  <p className="text-sm text-gray-500">
                    {!pageData.metaDescription && "Si se deja vacío, se utilizará la descripción de la página"}
                  </p>
                </div>

                {/* Featured Image */}
                <div className="space-y-2">
                  <Label htmlFor="featuredImage" className="flex items-center">
                    <GlobeIcon className="h-4 w-4 mr-2" />
                    <span>URL de imagen destacada</span>
                  </Label>
                  <Input
                    id="featuredImage"
                    name="featuredImage"
                    value={pageData.featuredImage || ''}
                    onChange={handleInputChange}
                    placeholder="https://ejemplo.com/imagen.jpg"
                  />
                </div>
              </div>

              {/* Search result preview */}
              <div className="mt-8 border border-gray-200 rounded-lg p-4 bg-gray-50">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Vista previa en resultados de búsqueda</h3>
                <div className="p-4 border border-gray-200 rounded bg-white">
                  <div className="text-blue-600 text-lg font-medium line-clamp-1">
                    {pageData.metaTitle || pageData.title || 'Título de la página'}
                  </div>
                  <div className="text-green-600 text-sm line-clamp-1">
                    {`/${locale}/${pageData.slug || 'url-pagina'}`}
                  </div>
                  <div className="text-gray-700 text-sm mt-1 line-clamp-2">
                    {pageData.metaDescription || pageData.description || 'Descripción de la página...'}
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={() => setActiveTab('details')}>
                Volver a Detalles
              </Button>
              <Button onClick={() => setActiveTab('sections')} className="flex items-center">
                <span>Continuar a Secciones</span>
                <ChevronRightIcon className="h-4 w-4 ml-1" />
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        {/* Sections Tab */}
        <TabsContent value="sections" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Editor de componentes</CardTitle>
                  <CardDescription>
                    Arrastra y suelta componentes para construir el contenido de tu página
                  </CardDescription>
                </div>
                <Button 
                  variant="outline" 
                  onClick={() => setForceReloadSection(!forceReloadSection)}
                  className="flex items-center gap-2"
                >
                  <EyeIcon className="h-4 w-4" />
                  <span>Refrescar vista</span>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {pageSections.length > 0 ? (
                <div className="bg-blue-50 border-2 border-dashed border-blue-200 p-6 rounded-lg">
                  <div className="text-center text-blue-700 font-medium mb-4">
                    <LayoutIcon className="h-5 w-5 inline-block mr-2" />
                    Editor de componentes
                  </div>
                  
                  <div className="bg-white rounded-lg shadow-sm p-6">
                    <ManageableSection
                      ref={sectionRef}
                      sectionId={pageSections[0]?.sectionId || ''}
                      isEditing={true}
                      autoSave={false}
                    />
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 border-2 border-dashed border-blue-200 rounded-lg bg-blue-50">
                  <LayoutIcon className="h-12 w-12 text-blue-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-blue-700 mb-1">No hay componentes en la página</h3>
                  <p className="text-blue-600 mb-6">Añade componentes para comenzar a construir tu página</p>
                  
                  {renderNewSectionUI()}
                </div>
              )}
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={() => setActiveTab('details')}>
                Volver a Detalles
              </Button>
              <Button 
                variant="default" 
                onClick={handleSavePage}
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
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Add Section Dialog */}
      <Dialog open={showAddSectionDialog} onOpenChange={setShowAddSectionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Añadir sección</DialogTitle>
            <DialogDescription>
              Selecciona una sección para añadir a tu página.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <Select 
              value={selectedTemplateSection} 
              onValueChange={setSelectedTemplateSection}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecciona una plantilla de sección" />
              </SelectTrigger>
              <SelectContent>
                {availableSections.map(section => (
                  <SelectItem key={section.sectionId} value={section.sectionId}>
                    {section.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setShowAddSectionDialog(false);
                setSelectedTemplateSection('');
              }}
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleAddSectionClick}
              disabled={!selectedTemplateSection}
            >
              Añadir sección
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Delete Section Confirmation */}
      <AlertDialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar sección</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de que quieres eliminar esta sección de la página?
              <br />
              <span className="font-medium">{sectionToDelete?.name}</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={cancelDeleteSection}>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDeleteSection}
              className="bg-red-600 hover:bg-red-700"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Exit Confirmation */}
      <AlertDialog open={isExitConfirmationOpen} onOpenChange={setIsExitConfirmationOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center text-amber-600">
              <AlertCircleIcon className="h-5 w-5 mr-2" />
              <span>Cambios sin guardar</span>
            </AlertDialogTitle>
            <AlertDialogDescription>
              Tienes cambios sin guardar. ¿Qué deseas hacer?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel onClick={handleCancelExit}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmExit}
              className="bg-red-600 hover:bg-red-700"
            >
              Salir sin guardar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
