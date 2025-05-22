import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {  SearchIcon, LayoutIcon, Settings } from 'lucide-react';
import { useUnsavedChanges } from '@/contexts/UnsavedChangesContext';
import { cmsOperations } from '@/lib/graphql-client';
import { useTabContext } from '@/app/[locale]/cms/pages/layout';
import {
  PageData as BasePageData,
  AvailableSection,
  Section,
  PageResponse,
  ManageableSectionHandle,
  NotificationType
} from '@/types/cms';
import { CMSSection } from '@/app/api/graphql/types';
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
interface PageData extends Omit<BasePageData, 'sections'> {
  publishDate?: string;
  // Use CMSSection directly for better type safety and ensure it's initialized as empty array
  sections: CMSSection[];
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
  // Unsaved changes context
  const { 
    setHasUnsavedChanges: setGlobalUnsavedChanges, 
    setOnSave: setGlobalOnSave 
  } = useUnsavedChanges();
  
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
    sections: [], // Initialize as empty array to avoid null issues
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

  // Load page data with full refresh
  const loadPageDataWithSections = async () => {
    try {
      // Solamente establecer isLoading a true si no hay secciones actuales
      // para evitar flashear la UI en blanco durante una recarga
      const shouldShowLoading = pageSections.length === 0;
      if (shouldShowLoading) {
        setIsLoading(true);
      }
      
      const response = await cmsOperations.getPageBySlug(slug as string) as PageResponse;
      
      if (!response) {
        console.error('No se encontró la página');
        setNotification({
          type: 'error',
          message: 'No se encontró la página'
        });
        return;
      }

      console.log('Page data reloaded completely:', response);
      
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
      const metaTitle = response.metaTitle || '';
      const metaDescription = response.metaDescription || '';
      
      // Ensure the SEO title/description always has a value
      seoData.title = seoData.title || metaTitle;
      seoData.description = seoData.description || metaDescription;
      
      // Set the page data with sections
      setPageData({
        id: response.id,
        title: response.title,
        slug: response.slug,
        description: response.description || '',
        template: response.template || 'default',
        isPublished: response.isPublished,
        pageType: response.pageType,
        locale: response.locale || locale,
        sections: (response.sections || []) as CMSSection[],
        metaTitle: metaTitle,
        metaDescription: metaDescription,
        featuredImage: response.featuredImage || '',
        publishDate: response.publishDate || '',
        seo: seoData
      });
      
      // Process sections if they exist
      if (response.sections && response.sections.length > 0) {
        console.log(`Found ${response.sections.length} sections, processing...`);
        
        // Get all CMS sections for reference
        const allCMSSections = await cmsOperations.getAllCMSSections();
        const cmsSectionMap = new Map();
        allCMSSections.forEach(section => {
          cmsSectionMap.set(section.id, section);
          cmsSectionMap.set(section.sectionId, section);
        });
        
        // Convert API sections to application format
        const processedSections = await Promise.all(
          response.sections.map(async (section, index) => {
            if (!section.id) return null;
            
            try {
              // Find the CMS section definition
              let cmsSection = null;
              
              // Try by section.sectionId first
              if (section.sectionId) {
                cmsSection = cmsSectionMap.get(section.sectionId) || 
                  allCMSSections.find(s => s.sectionId === section.sectionId);
              }
              
              // Try by section.id if still not found
              if (!cmsSection) {
                cmsSection = cmsSectionMap.get(section.id) || 
                  allCMSSections.find(s => s.id === section.id);
              }
              
              // If still not found, create fallback
              if (!cmsSection) {
                cmsSection = {
                  id: section.id,
                  sectionId: section.id,
                  name: `Section ${section.id.substring(0, 8)}...`,
                  description: 'Fallback section'
                };
              }
              
              // Get section name
              let sectionName = cmsSection.name || 'Unknown Section';
              if (section.data && section.data.sectionName) {
                sectionName = section.data.sectionName as string;
              }
              
              // Get order
              const order = typeof section.order === 'number' ? section.order : index;
              
              // Create the section object
              const sectionData: Section = {
                id: section.id,
                sectionId: cmsSection.sectionId,
                name: sectionName,
                type: 'default',
                data: [],
                order: order,
                description: cmsSection.description || '',
                pageId: response.id
              };
              
              return sectionData;
            } catch (error) {
              console.error(`Error processing section ${section.id}:`, error);
              return null;
            }
          })
        );
        
        // Filter out nulls and sort by order
        const validSections = processedSections
          .filter((section): section is Section => section !== null)
          .sort((a, b) => a.order - b.order);
        
        console.log(`Processed ${validSections.length} valid sections`);
        
        // Update the page sections state
        setPageSections(validSections);
      } else {
        console.log('No sections found for this page');
        setPageSections([]);
      }
      
      // Also load the available sections
      const sections = await cmsOperations.getAllCMSSections();
      const formattedSections: AvailableSection[] = sections.map((section) => ({
        id: section.id,
        sectionId: section.sectionId || section.id,
        name: section.name,
        type: 'default',
        description: section.description || '',
        pageId: response.id
      }));
      setAvailableSections(formattedSections);
      
    } catch (error) {
      console.error('Error loading page with sections:', error);
      setNotification({
        type: 'error',
        message: 'Error loading page with sections'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Initial page load
  useEffect(() => {
    if (slug) {
      loadPageDataWithSections();
    }
  }, [slug, locale]);



  // Sync local unsaved changes with global context
  useEffect(() => {
    setGlobalUnsavedChanges(hasUnsavedChanges);
  }, [hasUnsavedChanges, setGlobalUnsavedChanges]);

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
  const handleSavePage = useCallback(async (): Promise<boolean> => {
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
        sections?: string[];
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
        
        // Extract sectionIds as an array of strings
        const sectionIdsArray = pageSections.map(section => section.sectionId);
        
        console.log('Enviando sectionIds para actualizar:', JSON.stringify(sectionIdsArray, null, 2));

        // Actualizar la página con las secciones
        const result = await cmsOperations.updatePage(pageData.id, {
          ...updateInput,
          sections: sectionIdsArray
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
          shouldRefresh: true 
        });
        
        // Actualizar vista de secciones
        setForceReloadSection(!forceReloadSection);
        
        // Limpiar notificación después de 3 segundos
        setTimeout(() => {
          setNotification(null);
        }, 3000);
        
        return true;
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
          shouldRefresh: true 
        });
        
        // Refresh section view to show updated components
        setForceReloadSection(!forceReloadSection);
        
        return true;
      } else {
        setNotification({
          type: 'error',
          message: result.message || 'Error updating page'
        });
        return false;
      }
      
      // Clear notification after 3 seconds
      setTimeout(() => {
        setNotification(null);
      }, 3000);
      
    } catch (error) {
      console.error('Error saving page:', error);
      setNotification({
        type: 'error',
        message: error instanceof Error ? error.message : 'Unknown error saving page'
      });
      // IMPORTANTE: Asegurarse de que isSaving se establezca a false en caso de error
      setIsSaving(false);
      return false;
    } finally {
      // IMPORTANTE: Siempre establecer isSaving a false, incluso si hay un error
      setIsSaving(false);
    }
  }, [slug, locale]);

  // Set up global save function for unsaved changes context
  useEffect(() => {
    setGlobalOnSave(handleSavePage);
  }, [setGlobalOnSave, handleSavePage]);
  
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
      return false;
    }
    
    setIsSavingSection(true);
    
    try {
      // Asegurarse de tener el ID de la página correcto obteniendo la página por su slug
      let pageId = pageData.id;
      
      // Si hay dudas sobre la validez del ID de página actual, obtenerla de nuevo
      if (!pageId || pageId.trim() === '') {
        console.log(`Obteniendo página por slug: ${slug}`);
        const pageResponse = await cmsOperations.getPageBySlug(slug);
        
        if (!pageResponse || !pageResponse.id) {
          throw new Error('No se pudo obtener el ID de la página');
        }
        
        pageId = pageResponse.id;
        console.log(`ID de página obtenido: ${pageId}`);
      }
      
      // Generar ID único para la sección usando el ID de la página
      const sectionIdentifier = generatePageSectionId(pageId, newSectionName);
      
      console.log(`Creando nueva sección "${newSectionName}" con ID: ${sectionIdentifier}`);
      
      // Crear una nueva sección CMS
      const cmsSectionResult = await cmsOperations.createCMSSection({
        sectionId: sectionIdentifier,
        name: newSectionName,
        description: `Sección para la página "${pageData.title}"`
      });
      
      console.log('Resultado de createCMSSection:', cmsSectionResult);
      
      if (!cmsSectionResult || !cmsSectionResult.success || !cmsSectionResult.section) {
        throw new Error(cmsSectionResult?.message || 'Error creando la sección CMS');
      }
      
      // Obtener datos seguros de la sección creada
      const createdSectionId = cmsSectionResult.section.id;
      const createdSectionSectionId = cmsSectionResult.section.sectionId;
      
      if (!createdSectionId || !createdSectionSectionId) {
        throw new Error('IDs de sección incompletos en la respuesta');
      }
      
      console.log('CMSSection creada:', { id: createdSectionId, sectionId: createdSectionSectionId });
      
      // Asociar la sección a la página
      const newOrder = (pageSections.length > 0) 
        ? Math.max(...pageSections.map(s => s.order)) + 1 
        : 0;
      
      console.log(`Asociando sección ${createdSectionId} a página ${pageId} con orden ${newOrder}`);
      
      const associateResult = await cmsOperations.associateSectionToPage(
        pageId, 
        createdSectionId, 
        newOrder
      );
      
      console.log('Resultado de associateSectionToPage:', associateResult);
      
      // Extraer descripción si está disponible
      const sectionDescription = 
        typeof cmsSectionResult.section === 'object' && 
        'description' in cmsSectionResult.section && 
        typeof cmsSectionResult.section.description === 'string' 
          ? cmsSectionResult.section.description 
          : '';
      
      // Crear una sección local con los datos recibidos para mostrar inmediatamente
      const newSection: Section = {
        id: createdSectionId,
        sectionId: createdSectionSectionId,
        name: newSectionName,
        type: 'default',
        order: newOrder,
        data: [],
        description: sectionDescription,
        pageId: pageId,
        componentId: undefined
      };
      
      // Actualizar ambos estados inmediatamente para reflejar cambios en UI
      setPageSections([newSection]);  // Reemplazar cualquier sección existente para asegurar actualización UI
      setPageData(prev => ({
        ...prev,
        sections: [{
          id: createdSectionId,
          sectionId: createdSectionSectionId,
          name: newSectionName,
          order: newOrder
        } as CMSSection]
      }));
      
      if (!associateResult || !associateResult.success) {
        setNotification({
          type: 'warning',
          message: `Sección "${newSectionName}" creada. ${associateResult?.message || 'Error al asociarla automáticamente a la página. Se actualizará al guardar.'}`
        });
      } else {
        setNotification({
          type: 'success',
          message: `Sección "${newSectionName}" creada y asociada correctamente`
        });
        
        // Tenemos los datos locales ya, pero aún así recargar completo en segundo plano
        if (associateResult.page) {
          // Recargar la página para obtener las nuevas secciones, pero después de un breve retraso
          // para permitir que la UI se actualice primero
          setTimeout(() => {
            loadPageDataWithSections();
          }, 500);
        }
      }
      
      // Limpiar el formulario
      setNewSectionName('');
      setIsCreatingSection(false);
      
      console.log('[PageEditor] Section creation completed. Clearing form and updating UI state.');
      console.log('[PageEditor] New pageSections state:', [newSection]);
      
      // Marcar que hay cambios sin guardar
      setHasUnsavedChanges(true);
      
      // Ya hemos actualizado la UI inmediatamente arriba.
      // No necesitamos recargar aquí porque 1) ya lo hicimos si hubo éxito, y
      // 2) sobreescribiría nuestras actualizaciones inmediatas del UI
      // loadPageDataWithSections();
      
      return true;
      
    } catch (error) {
      console.error('Error creando sección:', error);
      setNotification({
        type: 'error',
        message: error instanceof Error 
          ? `Error al crear la sección: ${error.message}` 
          : 'Error desconocido al crear la sección'
      });
      return false;
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

  // Generate a section ID from the page ID and name
  const generatePageSectionId = (pageId: string, sectionName: string): string => {
    const cleanName = sectionName
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '');
    return `${pageId.substring(0, 8)}-${cleanName}-${Date.now().toString(36)}`;
  };

  // Monitor pageSections changes for debugging
  useEffect(() => {
    console.log('[PageEditor] pageSections updated:', pageSections.length, 'sections');
    if (pageSections.length > 0) {
      console.log('[PageEditor] First section:', pageSections[0]);
    }
  }, [pageSections]);

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
                  key={`sections-${pageSections.length}-${pageSections[0]?.id || 'empty'}`}
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
                  fetchSections={loadPageDataWithSections}
                />
              </div>
              
              {/* SEO Tab */}
              <div className={activeTab === 'seo' ? 'block space-y-6' : 'hidden'}>
                <SEOTab
                  pageData={pageData as import('@/types/cms').PageData}
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
                  pageData={pageData as import('@/types/cms').PageData}
                  locale={locale}
                  onTitleChange={handleTitleChange}
                  onInputChange={handleInputChange}
                  onSelectChange={handleSelectChange}
                  onContinue={() => setActiveTab('sections')}
                  onSave={handleSavePage}
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