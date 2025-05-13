'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import crypto from 'crypto';
import {
  SaveIcon,
  ArrowLeftIcon,
  AlertCircleIcon,
  CheckIcon,
  InfoIcon,
  AlignLeftIcon,
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

interface PageInfo {
  id: string;
  title: string;
  slug: string;
  description: string;
  template: string;
  isPublished: boolean;
  pageType: string;
  locale: string;
  sections: string[]; // Array of section IDs
  metaTitle: string;
  metaDescription: string;
  featuredImage: string;
}

// Main Component
export default function CreatePageWithSections() {
  const params = useParams();
  const router = useRouter();
  const { locale } = params;
  
  // Page data state
  const [pageData, setPageData] = useState<PageInfo>({
    id: '',
    title: '',
    slug: '',
    description: '',
    template: 'default',
    isPublished: false,
    pageType: 'CONTENT',
    locale: locale as string,
    sections: [],
    metaTitle: '',
    metaDescription: '',
    featuredImage: ''
  });
  
  // UI states
  const [isSaving, setIsSaving] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isExitConfirmationOpen, setIsExitConfirmationOpen] = useState(false);
  const [redirectTarget, setRedirectTarget] = useState('');
  
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
    
    // If the current slug is empty or was auto-generated from the previous title,
    // then update it with the new title
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
  
  // Save the page and redirect to edit
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
      console.log('Preparando datos para guardar página...');
      
      // Create the input without including the 'id' field
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
        sections: [] // Empty sections array
      };
      
      console.log('Datos de la página a guardar:', pageInput);
      
      // Step 1: Create the page
      const result = await cmsOperations.createPage(pageInput);
      
      // Safely check if we have a valid page result
      if (result && result.success && result.page && result.page.id) {
        console.log('Página creada exitosamente:', result);
        
        // Destructure for type safety
        const pageId = result.page.id;
        
        // Step 2: Create default sections for the page based on pageType
        try {
          // Default section types based on page type
          const sectionTypes = pageData.pageType === 'LANDING' 
            ? ['Hero', 'Benefit'] // Landing pages get Hero and Benefit sections
            : ['Header', 'Text']; // Regular pages get Header and Text sections
            
          console.log(`Creando ${sectionTypes.length} secciones por defecto para la página...`);
          
          // Create page sections one by one
          for (let i = 0; i < sectionTypes.length; i++) {
            const sectionType = sectionTypes[i].toLowerCase();
            const sectionName = `${pageData.title} ${sectionTypes[i]}`;
            const sectionId = `${pageData.slug}-${sectionType}-${i}`;
            
            console.log(`Creando sección: ${sectionName} (${sectionId})`);
            
            // Step 2.1: Create a CMS Section for this page section with retry logic
            let cmsSectionResult;
            let retryCount = 0;
            const maxRetries = 3;
            
            while (retryCount < maxRetries) {
              try {
                cmsSectionResult = await cmsOperations.createCMSSection({
                  sectionId: sectionId,
                  name: sectionName,
                  description: `Section for ${pageData.title}`
                });
                
                if (cmsSectionResult.success && cmsSectionResult.section) {
                  console.log(`CMSSection creada: ${cmsSectionResult.section.name} (${cmsSectionResult.section.id})`);
                  break;
                } else {
                  console.error('Error al crear CMSSection:', cmsSectionResult.message);
                  retryCount++;
                  if (retryCount < maxRetries) {
                    console.log(`Reintentando (${retryCount}/${maxRetries})...`);
                    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait before retry
                  }
                }
              } catch (error) {
                console.error('Error al crear CMSSection:', error);
                retryCount++;
                if (retryCount < maxRetries) {
                  console.log(`Reintentando (${retryCount}/${maxRetries})...`);
                  await new Promise(resolve => setTimeout(resolve, 1000)); // Wait before retry
                }
              }
            }
            
            // If we couldn't create the CMS section after retries, continue to the next one
            if (!cmsSectionResult?.success || !cmsSectionResult?.section) {
              console.error(`No se pudo crear la sección CMS después de ${maxRetries} intentos. Continuando...`);
              continue;
            }
            
            // Step 2.2: Create a Page Section that links the page to the CMS Section
            const pageSectionResult = await cmsOperations.createPageSection({
              pageId: pageId,
              title: sectionName,
              componentType: 'CUSTOM', // Using CUSTOM because we're connecting to a CMSSection
              order: i,
              isVisible: true,
              data: { sectionId: cmsSectionResult.section.sectionId }
            });
            
            if (!pageSectionResult.success || !pageSectionResult.section) {
              console.error('Error al crear PageSection:', pageSectionResult.message);
              continue;
            }
            
            console.log(`PageSection creada: ${pageSectionResult.section.title} (${pageSectionResult.section.id})`);
            
            // Step 3: Create default component for this section
            // Get the appropriate component type
            const componentType = sectionType === 'hero' ? 'hero' : 
                                  sectionType === 'benefit' ? 'benefit' : 
                                  sectionType === 'header' ? 'header' : 'text';
            
            // Default data for the component
            const componentData = {
              title: componentType === 'hero' ? `Welcome to ${pageData.title}` : 
                     componentType === 'benefit' ? 'Our Benefits' :
                     componentType === 'header' ? 'Header' : `About ${pageData.title}`,
              componentTitle: `${sectionTypes[i]} Component`,
              description: componentType === 'text' ? 'Add your content here' : undefined,
              subtitle: componentType === 'hero' ? 'Your awesome page description' : undefined,
              badgeText: componentType === 'hero' ? 'New Page' : undefined
            };
            
            // Create the component in the section with retry logic
            let componentResult;
            retryCount = 0;
            
            while (retryCount < maxRetries) {
              try {
                componentResult = await cmsOperations.saveSectionComponents(
                  cmsSectionResult.section.sectionId,
                  [
                    {
                      id: crypto.randomUUID(),
                      type: componentType,
                      data: componentData
                    }
                  ]
                );
                
                if (componentResult.success) {
                  console.log(`Componente creado para sección ${sectionName}`);
                  break;
                } else {
                  console.error('Error al crear componente:', componentResult.message);
                  retryCount++;
                  if (retryCount < maxRetries) {
                    console.log(`Reintentando (${retryCount}/${maxRetries})...`);
                    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait before retry
                  }
                }
              } catch (error) {
                console.error('Error al crear componente:', error);
                retryCount++;
                if (retryCount < maxRetries) {
                  console.log(`Reintentando (${retryCount}/${maxRetries})...`);
                  await new Promise(resolve => setTimeout(resolve, 1000)); // Wait before retry
                }
              }
            }
            
            if (!componentResult?.success) {
              console.error(`No se pudo crear el componente después de ${maxRetries} intentos.`);
            }
          }
          
          console.log('Secciones y componentes creados exitosamente');
        } catch (sectionsError) {
          console.error('Error al crear secciones:', sectionsError);
          setNotification({
            type: 'error',
            message: `Error al crear secciones: ${sectionsError instanceof Error ? sectionsError.message : 'Error desconocido'}`
          });
          
          // Continue with the redirect even if sections creation failed
          // At least the page itself was created
        }
        
        setNotification({
          type: 'success',
          message: 'Página creada exitosamente'
        });
        
        setHasUnsavedChanges(false);
        
        // Navigate to the edit page for the newly created page
        setTimeout(() => {
          router.push(`/${locale}/cms/pages/edit/${pageData.slug}`);
        }, 1000);
      } else {
        throw new Error(result?.message || 'Error al crear la página');
      }
    } catch (error) {
      console.error('Error al crear la página:', error);
      
      setNotification({
        type: 'error',
        message: error instanceof Error ? error.message : 'Error al crear la página'
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
            Crear nueva página
          </h1>
        </div>
        
        <div className="flex items-center gap-2">
          {hasUnsavedChanges && (
            <div className="text-amber-600 bg-amber-50 text-sm px-3 py-1 rounded-full flex items-center">
              <AlertCircleIcon className="h-4 w-4 mr-1" />
              <span>Cambios sin guardar</span>
            </div>
          )}
          
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
                <span>Crear página</span>
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
      
      <Card>
        <CardHeader>
          <CardTitle>Información de la página</CardTitle>
          <CardDescription>
            Ingresa la información básica para tu nueva página. Después de crearla podrás añadir componentes.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="title">Título de la página *</Label>
              <Input
                id="title"
                name="title"
                value={pageData.title}
                onChange={handleTitleChange}
                placeholder="Ingresa el título de la página"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="slug">URL Slug *</Label>
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
            
            <div className="flex items-center space-x-2">
              <Switch
                id="isPublished"
                checked={pageData.isPublished}
                onCheckedChange={(checked) => handleCheckboxChange('isPublished', checked)}
              />
              <Label htmlFor="isPublished">Publicar inmediatamente</Label>
            </div>
          </div>

          <div className="border-t pt-4 mt-4">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Configuración SEO (opcional)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
              </div>
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
                  rows={2}
                />
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end">
          <Button 
            variant="default" 
            onClick={handleSavePage}
            disabled={isSaving || !pageData.title || !pageData.slug}
            className="flex items-center gap-2"
          >
            {isSaving ? (
              <>
                <span className="animate-spin h-4 w-4 border-2 border-white border-opacity-20 border-t-white rounded-full"></span>
                <span>Guardando...</span>
              </>
            ) : (
              <>
                <SaveIcon className="h-4 w-4" />
                <span>Crear página y continuar a edición</span>
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
      
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