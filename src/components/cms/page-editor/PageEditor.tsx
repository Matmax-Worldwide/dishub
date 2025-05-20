import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {  SearchIcon, LayoutIcon, Settings } from 'lucide-react';
import { cmsOperations, CMSComponent, generatePageSectionId } from '@/lib/graphql-client';
import { useTabContext } from '@/app/[locale]/cms/pages/layout';
import {
  PageData as BasePageData,
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
  ExitConfirmationDialog,
  CSSInjector,
} from '@/components/cms/page-editor';
import { Button } from '@/components/ui/button';
import { PageEvents } from './PagesSidebar';

// Extend PageData to include SEO properties
interface PageData extends BasePageData {
  publishDate?: string;
  seo?: {
    title?: string;
    description?: string;
    keywords?: string;
    ogTitle?: string;
    ogDescription?: string;
    ogImage?: string;
    twitterTitle?: string;
    twitterDescription?: string;
    twitterImage?: string;
    canonicalUrl?: string;
    structuredData?: Record<string, unknown>;
  };
}

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
    featuredImage: '',
    publishDate: '',
    seo: {
      title: '',
      description: '',
      keywords: '',
      ogTitle: '',
      ogDescription: '',
      ogImage: '',
      twitterTitle: '',
      twitterDescription: '',
      twitterImage: '',
      canonicalUrl: '',
      structuredData: {}
    }
  });
  
  // UI states
  const { activeTab, setActiveTab } = useTabContext();
  
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
  
  
  // Reference to the section editor
  const sectionRef = useRef<ManageableSectionHandle>(null);
  
  // New states for section creation
  const [isCreatingSection, setIsCreatingSection] = useState(false);
  const [newSectionName, setNewSectionName] = useState('');
  const [isSavingSection, setIsSavingSection] = useState(false);

  const router = useRouter();

  // Save section components function
  const saveSectionEdits = async () => {
    // First save the section components if they exist
    if (sectionRef.current && pageSections.length > 0) {
      console.log(`Saving components for section: ${pageSections[0]?.sectionId}`);
      try {
        await sectionRef.current.saveChanges(false);
        console.log('Section components saved successfully');
      } catch (error) {
        console.error('Error saving section components:', error);
        // Continue with page saving even if component saving fails
      }
    }
  };

  // Load page data
  useEffect(() => {
    const loadPageData = async () => {
      try {
        setIsLoading(true);
        const response = await cmsOperations.getPageBySlug(slug as string) as PageResponse;
        
        console.log('=== DEBUG: Raw API response ===');
        console.log(JSON.stringify(response, null, 2));
        console.log('==============================');
        
        if (!response) {
          console.error('No se encontró la página');
          setNotification({
            type: 'error',
            message: 'No se encontró la página'
          });
          return;
        }

        console.log('Page data received:', response);
        // Ensure SEO data is properly extracted and synchronized
        // Initialize seoData with default values if it doesn't exist
        const seoData = response.seo || {
          title: '',
          description: '',
          keywords: '',
          ogTitle: '',
          ogDescription: '',
          ogImage: '',
          twitterTitle: '',
          twitterDescription: '',
          twitterImage: '',
          canonicalUrl: '',
          structuredData: {}
        };
        

        // Use metaTitle/metaDescription as the primary source of truth if they exist
        // Otherwise, fall back to seo.title/seo.description
        const metaTitle = response.metaTitle || '';
        const metaDescription = response.metaDescription || '';
        
        // Ensure the SEO title/description always has a value
        // If not present in the SEO object, use the metaTitle/metaDescription
        seoData.title = seoData.title || metaTitle;
        seoData.description = seoData.description || metaDescription;
        
        
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
          metaTitle: metaTitle,
          metaDescription: metaDescription,
          featuredImage: response.featuredImage || '',
          publishDate: response.publishDate || '',
          seo: seoData
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
                  id: section.id,
                  sectionId: cmsSection.sectionId,
                  name: sectionName,
                  type: 'default',
                  data: [],
                  order: section.order || index,
                  description: cmsSection.description || '',
                  pageId: pageData.id
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

        // En la función loadPageData, actualizar la carga de secciones disponibles
        const sections = await cmsOperations.getAllCMSSections();
        const formattedSections: AvailableSection[] = sections.map((section) => ({
          id: section.id,
          sectionId: section.sectionId || section.id,
          name: section.name,
          type: 'default',
          description: section.description || '',
          pageId: pageData.id
        }));
        setAvailableSections(formattedSections);
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
  const loadSections = async () => {
    if (!pageData.id) return;
    
    console.log(`Cargando secciones para la página ${pageData.id}`);
    setIsSectionsLoading(true);
    
    try {
      // Obtener secciones directamente desde la página actualizada
      const sections = pageData.sections || [];
      console.log(`Se encontraron ${sections.length} secciones para la página`);
      
      // Cargar los datos completos de cada sección incluyendo componentes
      const sectionsData = await Promise.all(
        sections.map(async (section) => {
          try {
            // Cargar componentes de la sección
            const sectionData = await cmsOperations.getSectionComponents(section.sectionId);
            
            return {
              id: section.id,
              title: section.name || `Sección ${section.order}`,
              sectionId: section.sectionId,
              order: section.order,
              components: sectionData.components || []
            };
          } catch (error) {
            console.error(`Error cargando componentes para la sección ${section.id}:`, error);
            return {
              id: section.id,
              title: section.name || `Sección ${section.order}`,
              sectionId: section.sectionId,
              order: section.order,
              components: []
            };
          }
        })
      );
      
      // Ordenar las secciones por su campo order
      const sortedSections = sectionsData.sort((a, b) => a.order - b.order);
      setSections(sortedSections);
    } catch (error) {
      console.error('Error cargando secciones:', error);
      setNotification({
        type: 'error',
        message: 'Error al cargar las secciones de la página'
      });
    } finally {
      setIsSectionsLoading(false);
    }
  };
  
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
    
    console.log(`Input change: ${name} = ${value}`);
    
    // Special handling for meta fields to sync with SEO fields
    if (name === 'metaTitle') {
      console.log('Syncing metaTitle with seo.title');
      setPageData(prevState => ({
        ...prevState,
        metaTitle: value,
        seo: {
          ...prevState.seo,
          title: value
        }
      }));
    } else if (name === 'metaDescription') {
      console.log('Syncing metaDescription with seo.description');
      setPageData(prevState => ({
        ...prevState,
        metaDescription: value,
        seo: {
          ...prevState.seo,
          description: value
        }
      }));
    } else {
      // Handle other fields normally
      setPageData(prevState => ({
        ...prevState,
        [name]: value
      }));
    }
    
    setHasUnsavedChanges(true);
  };
  
  // Handle select changes
  const handleSelectChange = (name: string, value: string) => {
    setPageData(prev => ({ ...prev, [name]: value }));
    setHasUnsavedChanges(true);
  };
  
  // Handle checkbox/switch changes
  const handleCheckboxChange = (name: string, checked: boolean) => {
    // Si el cambio es en isPublished, emitir el evento para actualizar la UI optimistamente
    if (name === 'isPublished') {
      // Emitir el evento con los datos actualizados
      PageEvents.emit('page:publish-state-change', { 
        id: pageData.id, 
        isPublished: checked 
      });
      console.log('Emitting page:publish-state-change event:', { id: pageData.id, isPublished: checked });
    }
    
    setPageData(prev => ({ ...prev, [name]: checked }));
    setHasUnsavedChanges(true);
  };
  
  // Handle nested SEO property changes
  const handleSEOChange = (path: string, value: string) => {
    console.log(`SEO change: ${path} = ${value}`);
    
    setPageData(prevState => {
      // Ensure SEO object exists
      const newSeo = JSON.parse(JSON.stringify(prevState.seo || {}));
      
      // Update the specific field in the SEO object
      const setNestedField = (obj: Record<string, unknown>, path: string, value: string | unknown) => {
        const parts = path.split('.');
        let current = obj as Record<string, unknown>;
        
        for (let i = 0; i < parts.length - 1; i++) {
          if (!current[parts[i]]) {
            current[parts[i]] = {};
          }
          current = current[parts[i]] as Record<string, unknown>;
        }
        
        current[parts[parts.length - 1]] = value;
      };
      
      // The path should be like 'seo.title', so we remove the prefix
      setNestedField(newSeo, path.replace('seo.', ''), value);
      
      // Also update metaTitle/metaDescription if the SEO title/description is changed
      const updatedState = {
        ...prevState,
        seo: newSeo
      };
      
      // Sync SEO title with metaTitle when SEO title changes
      if (path === 'seo.title') {
        console.log('Syncing seo.title with metaTitle');
        updatedState.metaTitle = value as string;
      }
      
      // Sync SEO description with metaDescription when SEO description changes
      if (path === 'seo.description') {
        console.log('Syncing seo.description with metaDescription');
        updatedState.metaDescription = value as string;
      }
      
      return updatedState;
    });
    
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
      description: section.description || '',
      pageId: pageData.id
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


  // Save the entire page
  const handleSavePage = async () => {
    try {
      setIsSaving(true);
      
      // First save any section component changes
      await saveSectionEdits();
      
      console.log('Saving page with data:', pageData);
      
      // Sincronizar metaTitle/metaDescription con seo.title/seo.description
      const metaTitle = pageData.metaTitle || '';
      const metaDescription = pageData.metaDescription || '';
      const seoTitle = pageData.seo?.title || '';
      const seoDescription = pageData.seo?.description || '';
      
      // Si alguno de los campos está vacío, usar el valor del otro
      const finalMetaTitle = metaTitle || seoTitle;
      const finalMetaDescription = metaDescription || seoDescription;
      const finalSeoTitle = seoTitle || metaTitle;
      const finalSeoDescription = seoDescription || metaDescription;
      
      console.log('SEO data synchronization:', {
        originalMetaTitle: metaTitle,
        originalMetaDescription: metaDescription,
        originalSeoTitle: seoTitle,
        originalSeoDescription: seoDescription,
        finalMetaTitle,
        finalMetaDescription,
        finalSeoTitle,
        finalSeoDescription
      });
      
      // Preparar input para actualización
      const updateInput: {
        title: string;
        slug: string;
        description: string;
        template: string;
        isPublished: boolean;
        pageType: string;
        locale: string;
        metaTitle: string;
        metaDescription: string;
        featuredImage: string;
        publishDate: string;
        seo: {
          title: string;
          description: string;
          keywords: string;
          ogTitle: string;
          ogDescription: string;
          ogImage: string;
          twitterTitle: string;
          twitterDescription: string;
          twitterImage: string;
          canonicalUrl: string;
          structuredData: Record<string, unknown>;
        };
        sections?: Array<{
          id: string;
          order: number;
          title: string;
          componentType: string;
          isVisible: boolean;
          data: Record<string, unknown>;
        }>;
      } = {
        title: pageData.title,
        slug: pageData.slug,
        description: pageData.description,
        template: pageData.template,
        isPublished: pageData.isPublished,
        pageType: pageData.pageType,
        locale: pageData.locale,
        metaTitle: finalMetaTitle,
        metaDescription: finalMetaDescription,
        featuredImage: pageData.featuredImage || '',
        publishDate: pageData.publishDate || '',
        // Ensure SEO data is properly formatted and includes all fields
        seo: {
          title: finalSeoTitle,
          description: finalSeoDescription,
          keywords: pageData.seo?.keywords || '',
          ogTitle: pageData.seo?.ogTitle || '',
          ogDescription: pageData.seo?.ogDescription || '',
          ogImage: pageData.seo?.ogImage || '',
          twitterTitle: pageData.seo?.twitterTitle || '',
          twitterDescription: pageData.seo?.twitterDescription || '',
          twitterImage: pageData.seo?.twitterImage || '',
          canonicalUrl: pageData.seo?.canonicalUrl || '',
          structuredData: pageData.seo?.structuredData || {}
        }
      };
      
      // Log the SEO data being sent
      console.log('Saving SEO data:', {
        metaTitle: updateInput.metaTitle,
        metaDescription: updateInput.metaDescription,
        seo: updateInput.seo
      });
      
      // Si hay secciones, crear nueva estructura para actualización
      if (pageSections.length > 0) {
        console.log('Creando/actualizando secciones de página. Datos disponibles:', JSON.stringify(pageSections.map(s => ({
          id: s.id,
          name: s.name,
          sectionId: s.sectionId,
          componentId: s.componentId
        })), null, 2));
        
        // Create new sections array for the update
        const newSections = pageSections.map((section, index) => ({
          order: index,
          title: section.name || `Section ${index + 1}`,
          componentType: 'CUSTOM',
          isVisible: true,
          data: {
            name: section.name,
            sectionId: section.sectionId, // Incluir sectionId en los datos
            sectionName: section.name
          },
          sectionId: section.sectionId, // Pasar el sectionId a nivel raíz para la relación
          componentId: section.componentId // Keep the componentId if it exists
        }));
        
        console.log('Enviando secciones para actualizar:', JSON.stringify(newSections, null, 2));

        // Actualizar la página con las nuevas secciones
        const result = await cmsOperations.updatePage(pageData.id, {
          ...updateInput,
          sections: newSections
        });

        if (!result.success) {
          throw new Error(result.message || 'Error al actualizar la página');
        }

        setNotification({
          type: 'success',
          message: 'Página actualizada exitosamente'
        });
        
        // IMPORTANTE: Actualizar el estado para finalizar la animación de guardado
        setIsSaving(false);
        setHasUnsavedChanges(false);
        
        // Notificar al PagesSidebar de que la página se ha actualizado
        PageEvents.emit('page:updated', { 
          id: pageData.id, 
          isPublished: pageData.isPublished 
        });
        
        // Actualizar vista de secciones
        setForceReloadSection(!forceReloadSection);
        
        // Limpiar notificación después de 3 segundos
        setTimeout(() => {
          setNotification(null);
        }, 3000);
        
        return;
      }
      
      console.log('Updating page with:', updateInput);
      
      // Update the page through GraphQL
      const result = await cmsOperations.updatePage(pageData.id, updateInput);
      
      console.log('Page update result:', result);
      
      if (result.success) {
        setNotification({
          type: 'success',
          message: 'Page updated successfully'
        });
        
        setHasUnsavedChanges(false);
        // Notificar al PagesSidebar de que la página se ha actualizado
        PageEvents.emit('page:updated', { 
          id: pageData.id, 
          isPublished: pageData.isPublished 
        });
        
        // Refresh section view to show updated components
        setForceReloadSection(!forceReloadSection);
      } else {
        setNotification({
          type: 'error',
          message: result.message || 'Error updating page'
        });
      }
      
      // Clear notification after 3 seconds
      setTimeout(() => {
        setNotification(null);
      }, 3000);
      
      // IMPORTANTE: Siempre establecer isSaving a false, incluso si hay un error
      setIsSaving(false);
    } catch (error) {
      console.error('Error saving page:', error);
      setNotification({
        type: 'error',
        message: error instanceof Error ? error.message : 'Unknown error saving page'
      });
      // IMPORTANTE: Asegurarse de que isSaving se establezca a false en caso de error
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
    
    // Generar ID único para la sección usando el ID de la página
    const sectionId = generatePageSectionId(pageData.id, newSectionName);
      
    setIsSavingSection(true);
    
    try {
      console.log(`Creando nueva sección "${newSectionName}" con ID: ${sectionId}`);
      
      // Crear una nueva sección CMS
      const cmsSectionResult = await cmsOperations.createCMSSection({
        sectionId,
        name: newSectionName,
        description: `Sección para la página "${pageData.title}"`
      });
      
      if (!cmsSectionResult.success || !cmsSectionResult.section) {
        throw new Error(cmsSectionResult.message || 'Error creando la sección CMS');
      }
      
      console.log('CMSSection creada:', cmsSectionResult.section);
      
      // Asociar la sección a la página
      const order = (pageSections.length > 0) 
        ? Math.max(...pageSections.map(s => s.order)) + 1 
        : 0;
      
      const associateResult = await cmsOperations.associateSectionToPage(
        pageData.id, 
        cmsSectionResult.section.id, 
        order
      );
      
      if (!associateResult.success) {
        throw new Error(associateResult.message || 'Error asociando la sección a la página');
      }
      
      setNotification({
        type: 'success',
        message: `Sección "${newSectionName}" creada y asociada correctamente`
      });
      
      // Limpiar el formulario
      setNewSectionName('');
      setIsCreatingSection(false);
      
      // Recargar la página para obtener las nuevas secciones
      await loadSections();
      
      // Cargar las secciones de nuevo
      loadSections();
      
      // Si falla loadSections, crear una sección de respaldo
      if (!associateResult.page) {
        const newSection = {
          id: cmsSectionResult.section.id,
          title: newSectionName,
          sectionId: sectionId,
          order: order,
          components: []
        };
        
        setPageSections(prevSections => [...prevSections, newSection]);
      }
    } catch (error) {
      console.error('Error creando sección:', error);
      setNotification({
        type: 'error',
        message: error instanceof Error 
          ? `Error al crear la sección: ${error.message}` 
          : 'Error desconocido al crear la sección'
      });
    } finally {
      setIsSavingSection(false);
    }
  };

  // Add a test function to directly query the database
  const testDatabaseQuery = async () => {
    try {
      // Try to fetch the page directly
      const query = `
        query {
          getPageBySlug(slug: "${pageData.slug}") {
            id
            title
            metaTitle
            metaDescription
            seo {
              title
              description
              keywords
            }
          }
        }
      `;
      
      // Make a direct API call to verify data
      const response = await fetch('/api/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query,
        }),
      });
      
      const result = await response.json();
      console.log('Direct GraphQL query result:', result);
      
    } catch (error) {
      console.error('Error testing database query:', error);
    }
  };
  
  // This will run the test query when the component mounts
  useEffect(() => {
    if (pageData.id) {
      console.log('Running test database query...');
      testDatabaseQuery();
    }
  }, [pageData.id]);


  if (isLoading) {
    return <LoadingSpinner size="lg" text="Cargando página..." className="min-h-screen" />;
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* CSS Injector for drag-and-drop functionality */}
      <CSSInjector />
      
      {/* Header */}
      <PageHeader
        title={pageData.title}
        isPublished={pageData.isPublished}
        hasUnsavedChanges={hasUnsavedChanges}
        isSaving={isSaving}
        onPublishChange={(checked) => handleCheckboxChange('isPublished', checked)}
        onCancel={handleCancel}
        onSave={handleSavePage}
      >
         {/* Tab Navigation Controls - con visual feedback */}
         <div className="flex space-x-1">
  <Button 
    variant={activeTab === 'details' ? "secondary" : "ghost"}
    size="sm" 
    className="h-7 px-2 flex items-center gap-x-1"
    title="Detalles"
    onClick={() => setActiveTab('details')}
  >
    <Settings className="h-4 w-4" />
    <span className="text-xs text-muted-foreground">Detalles</span>
  </Button>
  <Button 
    variant={activeTab === 'sections' ? "secondary" : "ghost"}
    size="sm" 
    className="h-7 px-2 flex items-center gap-x-1"
    title="Secciones"
    onClick={() => setActiveTab('sections')}
  >
    <LayoutIcon className="h-4 w-4" />
    <span className="text-xs text-muted-foreground">Secciones</span>
  </Button>
  <Button 
    variant={activeTab === 'seo' ? "secondary" : "ghost"}
    size="sm" 
    className="h-7 px-2 flex items-center gap-x-1"
    title="SEO"
    onClick={() => setActiveTab('seo')}
  >
    <SearchIcon className="h-4 w-4" />
    <span className="text-xs text-muted-foreground">SEO</span>
  </Button>


</div>
          
      </PageHeader>
      
      {/* Notification */}
      {notification && (
        <Notification 
          type={notification.type} 
          message={notification.message} 
        />
      )}
      
      <div className="flex flex-1 overflow-hidden">

        
        {/* Main Content Area */}
        <div className="flex-1 overflow-auto">
          {/* Contenido - sin TabsList */}
          <div className="p-6 space-y-6">
            <div className="w-full">
              {/* Sections Tab */}
              <div className={activeTab === 'sections' ? 'block space-y-6' : 'hidden'}>
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
                  onBackClick={() => setActiveTab('details')}
                  onSavePage={handleSavePage}
                  sectionRef={sectionRef}
                />
              </div>
              
              {/* SEO Tab */}
              <div className={activeTab === 'seo' ? 'block space-y-6' : 'hidden'}>
                <SEOTab
                  pageData={pageData}
                  locale={locale}
                  onInputChange={handleInputChange}
                  onBackClick={() => setActiveTab('details')}
                  onContinue={() => setActiveTab('sections')}
                  onSEOChange={handleSEOChange}
                />
              </div>
              
              {/* Page Details Tab */}
              <div className={activeTab === 'details' ? 'block space-y-6' : 'hidden'}>
                <PageDetailsTab 
                  pageData={pageData}
                  locale={locale}
                  onTitleChange={handleTitleChange}
                  onInputChange={handleInputChange}
                  onSelectChange={handleSelectChange}
                  onCancel={handleCancel}
                  onContinue={() => setActiveTab('sections')}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Dialogs */}
      <AddSectionDialog
        open={showAddSectionDialog}
        onOpenChange={setShowAddSectionDialog}
        selectedSection={selectedTemplateSection}
        onSectionChange={setSelectedTemplateSection}
        availableSections={availableSections}
        onAddSection={handleAddSectionClick}
      />
      
      
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