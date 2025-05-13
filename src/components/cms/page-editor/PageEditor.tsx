import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { FileTextIcon, SearchIcon, LayoutIcon } from 'lucide-react';
import { cmsOperations, CMSComponent } from '@/lib/graphql-client';
import {
  PageData,
  AvailableSection,
  Section,
  PageResponse,
  ManageableSectionHandle,
  NotificationType
} from '@/types/cms';
import {
  LoadingSpinner,
  Notification,
  PageHeader,
  PageDetailsTab,
  SEOTab,
  SectionsTab,
  AddSectionDialog,
  DeleteSectionDialog,
  ExitConfirmationDialog
} from '@/components/cms/page-editor';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';

interface PageEditorProps {
  slug: string;
  locale: string;
}

const PageEditor: React.FC<PageEditorProps> = ({ slug, locale }) => {
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
  const [notification, setNotification] = useState<NotificationType | null>(null);
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

  const router = useRouter();

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
                
                // Create a fallback section if no CMS section is found
                if (!cmsSection) {
                  console.warn(`No CMSSection found in system for section ${section.id}. Creating fallback.`);
                  
                  // Create a fallback section with the ID as the name
                  cmsSection = {
                    id: section.id,
                    sectionId: section.id,
                    name: `Section ${section.id.substring(0, 8)}...`,
                    description: 'Fallback section created for compatibility'
                  };
                }
                
                // Check if the section has a stored name in its data
                let sectionName = cmsSection.name || 'Unknown Section';
                if (section.data) {
                  const sectionData = section.data as Record<string, unknown>;
                  if (sectionData.sectionName && typeof sectionData.sectionName === 'string') {
                    sectionName = sectionData.sectionName;
                    console.log(`Using stored section name from data: ${sectionName}`);
                  }
                }

                // Log the original data structure for debugging
                if (section.data) {
                  console.log('Original section data:', JSON.stringify(section.data, null, 2));
                }
                
                // Create section data with the found CMS section
                const sectionData: Section = {
                  id: section.id, // Keep original section ID from page
                  sectionId: cmsSection.sectionId, // IMPORTANT: Use CMS section's sectionId
                  name: sectionName,
                  type: 'default',
                  data: [], // Keep empty data array 
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
        try {
          await sectionRef.current.saveChanges();
          console.log('Componentes guardados exitosamente');
        } catch (error) {
          console.error('Error al guardar componentes de la sección:', error);
          // Continuamos con el guardado de la página aunque falle el guardado de los componentes
        }
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
          components: section.data || [],
          // Include a reference to the CMS section ID in the data
          sectionId: section.sectionId, // Store sectionId consistently
          cmsSection: section.sectionId, // For backward compatibility
          sectionName: section.name, // Store section name in data for persistence
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
        
        // Clear notification after 3 seconds
        setTimeout(() => {
          setNotification(null);
        }, 3000);
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
      
      // Crear componentes con tipos en minúsculas para coincidir con los slugs en la BD
      // Estos son los tipos exactos que serán buscados en la base de datos
      const sectionComponents: CMSComponent[] = [
        {
          id: `header-${Date.now()}`,
          type: 'header', // Minúsculas para coincidir con los slugs en la BD
          data: {
            componentTitle: 'Encabezado',
            title: newSectionName,
            subtitle: 'Nueva sección personalizada'
          }
        },
        {
          id: `text-${Date.now() + 1}`,
          type: 'text', // Minúsculas para coincidir con los slugs en la BD
          data: {
            componentTitle: 'Contenido principal',
            content: 'Edite este contenido para personalizar su sección.'
          }
        }
      ];
      
      console.log('Componentes a guardar:', JSON.stringify(sectionComponents, null, 2));
      
      // Comprobar si los componentes existen en el sistema
      try {
        const availableComponents = await cmsOperations.getAllComponents();
        console.log('Tipos de componentes disponibles en el sistema:', 
          availableComponents.map((c: { name: string; slug: string }) => ({ name: c.name, slug: c.slug }))
        );
      } catch (err) {
        console.warn('No se pudieron obtener los componentes disponibles:', err);
      }
      
      // Guardar la sección en el sistema
      const result = await cmsOperations.saveSectionComponents(sectionId, sectionComponents);
      console.log('Resultado al guardar sección:', JSON.stringify(result, null, 2));
      
      if (result && result.success) {
        console.log('Sección creada exitosamente:', sectionId);
        
        // Agregar a la lista de secciones disponibles
        const newSection: AvailableSection = {
          sectionId: sectionId,
          name: newSectionName,
          description: 'Sección personalizada',
          type: 'default',
          id: sectionId
        };
        
        setAvailableSections(prev => [...prev, newSection]);
        
        // Agregar a las secciones de la página
        const newPageSection: Section = {
          id: `temp-${Date.now()}`, 
          sectionId: sectionId,
          name: newSectionName,
          type: 'default',
          data: [],
          order: pageSections.length,
          description: 'Sección personalizada'
        };
        
        setPageSections(prev => [...prev, newPageSection]);
        setHasUnsavedChanges(true);
        
        setNewSectionName('');
        setIsCreatingSection(false);
        
        setNotification({
          type: 'success',
          message: `Sección "${newSectionName}" creada exitosamente`
        });
        
        // Ahora el usuario podrá editar los componentes dentro de esta sección
        
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

  if (isLoading) {
    return <LoadingSpinner size="lg" text="Cargando página..." className="min-h-screen" />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title={pageData.title}
        isPublished={pageData.isPublished}
        hasUnsavedChanges={hasUnsavedChanges}
        isSaving={isSaving}
        onPublishChange={(checked) => handleCheckboxChange('isPublished', checked)}
        onCancel={handleCancel}
        onSave={handleSavePage}
      />
      
      {/* Notification */}
      {notification && (
        <Notification 
          type={notification.type} 
          message={notification.message} 
        />
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
          <PageDetailsTab 
            pageData={pageData}
            locale={locale}
            onTitleChange={handleTitleChange}
            onInputChange={handleInputChange}
            onSelectChange={handleSelectChange}
            onCancel={handleCancel}
            onContinue={() => setActiveTab('sections')}
          />
        </TabsContent>

        {/* SEO Tab */}
        <TabsContent value="seo" className="space-y-6">
          <SEOTab
            pageData={pageData}
            locale={locale}
            onInputChange={handleInputChange}
            onBackClick={() => setActiveTab('details')}
            onContinue={() => setActiveTab('sections')}
          />
        </TabsContent>
        
        {/* Sections Tab */}
        <TabsContent value="sections" className="space-y-6">
          <SectionsTab
            pageSections={pageSections}
            isSaving={isSaving}
            isCreatingSection={isCreatingSection}
            isSavingSection={isSavingSection}
            newSectionName={newSectionName}
            onNameChange={setNewSectionName}
            onCreateSection={handleCreateSection}
            onCancelCreate={() => {
              setIsCreatingSection(false);
              setNewSectionName('');
            }}
            onStartCreating={() => setIsCreatingSection(true)}
            onSectionNameChange={(newName) => {
              setPageSections(prev => prev.map((section, idx) => 
                idx === 0 ? { ...section, name: newName } : section
              ));
              setHasUnsavedChanges(true);
            }}
            onRefreshView={() => setForceReloadSection(!forceReloadSection)}
            onBackClick={() => setActiveTab('details')}
            onSavePage={handleSavePage}
            sectionRef={sectionRef}
          />
        </TabsContent>
      </Tabs>
      
      {/* Add Section Dialog */}
      <AddSectionDialog
        open={showAddSectionDialog}
        onOpenChange={setShowAddSectionDialog}
        selectedSection={selectedTemplateSection}
        onSectionChange={setSelectedTemplateSection}
        availableSections={availableSections}
        onAddSection={handleAddSectionClick}
      />
      
      {/* Delete Section Confirmation */}
      <DeleteSectionDialog
        open={isDeleteConfirmOpen}
        onOpenChange={setIsDeleteConfirmOpen}
        section={sectionToDelete}
        onConfirm={confirmDeleteSection}
        onCancel={cancelDeleteSection}
      />
      
      {/* Exit Confirmation */}
      <ExitConfirmationDialog
        open={isExitConfirmationOpen}
        onOpenChange={setIsExitConfirmationOpen}
        onConfirm={handleConfirmExit}
        onCancel={handleCancelExit}
      />
    </div>
  );
};

export default PageEditor; 