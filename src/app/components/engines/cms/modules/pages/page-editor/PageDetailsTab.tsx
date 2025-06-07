import React, { useState } from 'react';
import { ChevronRightIcon, Trash2Icon, SaveIcon } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Textarea } from '@/app/components/ui/textarea';
import { Switch } from '@/app/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/components/ui/select';
import { PageData } from '@/types/cms';
import { cmsOperations } from '@/lib/graphql-client';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import DeletePageDialog from './DeletePageDialog';
import { PageEvents } from './PagesSidebar';

interface PageDetailsTabProps {
  pageData: PageData;
  locale: string;
  onTitleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onSelectChange: (name: string, value: string) => void;
  onCheckboxChange?: (name: string, checked: boolean) => void;
  onContinue: () => void;
  onSave?: () => Promise<boolean>;
}

export const PageDetailsTab: React.FC<PageDetailsTabProps> = ({
  pageData,
  locale,
  onTitleChange,
  onInputChange,
  onSelectChange,
  onCheckboxChange,
  onContinue,
  onSave,
}) => {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const router = useRouter();

  const handleDeletePage = async () => {
    if (!pageData.id) return;
    
    setIsDeleting(true);
    
    try {
      const result = await cmsOperations.deletePage(pageData.id);
      
      if (result.success) {
        // Emit event to update the sidebar
        PageEvents.emit('page:deleted', { id: pageData.id });
        
        toast.success('Página eliminada correctamente');
        router.push('/cms/pages');
      } else {
        toast.error(result.message || 'Error al eliminar la página');
      }
    } catch (error) {
      toast.error('Error al eliminar la página');
      console.error('Error deleting page:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSave = async () => {
    if (onSave) {
      setIsSaving(true);
      try {
        const success = await onSave();
        if (success) {
          // Emit event to update sidebar
          PageEvents.emit('page:updated', { 
            id: pageData.id, 
            shouldRefresh: true 
          });
          toast.success('Página actualizada correctamente');
          return true;
        } else {
          toast.error('Error al actualizar la página');
          return false;
        }
      } catch (error) {
        toast.error('Error al actualizar la página');
        console.error('Error saving page:', error);
        return false;
      } finally {
        setIsSaving(false);
      }
    } else {
      // If no onSave provided, save directly using API
      setIsSaving(true);
      try {
        const result = await cmsOperations.updatePage(pageData.id, {
          title: pageData.title,
          slug: pageData.slug,
          description: pageData.description || '',
          template: pageData.template || 'default',
          pageType: pageData.pageType,
          isPublished: pageData.isPublished,
          locale: pageData.locale,
          metaTitle: pageData.metaTitle || pageData.title,
          metaDescription: pageData.metaDescription || '',
          isDefault: pageData.isDefault || false,
        });

        if (result && result.success) {
          // Emit event to update sidebar with latest data
          PageEvents.emit('page:updated', { 
            id: pageData.id, 
            shouldRefresh: true 
          });
          toast.success('Página actualizada correctamente');
          return true;
        } else {
          toast.error(result?.message || 'Error al actualizar la página');
          return false;
        }
      } catch (error) {
        toast.error('Error al actualizar la página');
        console.error('Error saving page directly:', error);
        return false;
      } finally {
        setIsSaving(false);
      }
    }
  };

  const handleContinue = async () => {
    // Save first if possible
    if (onSave) {
      const saved = await handleSave();
      if (saved) {
        onContinue();
      }
    } else {
      onContinue();
    }
  };

  return (
    <>
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
                onChange={onTitleChange}
                placeholder="Ingresa el título de la página"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="slug">URL Slug</Label>
              <Input
                id="slug"
                name="slug"
                value={pageData.slug}
                onChange={onInputChange}
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
                onChange={onInputChange}
                placeholder="Breve descripción de la página"
                rows={3}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="template">Plantilla</Label>
              <Select 
                name="template" 
                value={pageData.template || 'default'} 
                onValueChange={(value) => onSelectChange('template', value)}
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
                onValueChange={(value) => onSelectChange('pageType', value)}
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
              <p className="text-sm text-gray-500 mt-1">
                Las páginas de tipo &ldquo;Landing Page&rdquo; utilizan un desplazamiento suave estilo TikTok para navegar entre secciones.
              </p>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Switch
                  id="isDefault"
                  checked={pageData.isDefault || false}
                  onCheckedChange={(checked) => onCheckboxChange?.('isDefault', checked)}
                />
                <Label htmlFor="isDefault">Página por defecto</Label>
              </div>
              <p className="text-sm text-gray-500">
                La página por defecto se mostrará en la URL raíz del sitio (/{locale}/)
              </p>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <div className="flex gap-2">
            <Button 
              variant="destructive" 
              onClick={() => setIsDeleteDialogOpen(true)}
              className="flex items-center gap-2"
            >
              <Trash2Icon className="h-4 w-4" />
              <span>Eliminar página</span>
            </Button>
            
            <Button
              variant="outline"
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-2"
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <SaveIcon className="h-4 w-4" />
              )}
              <span>{isSaving ? 'Guardando...' : 'Guardar'}</span>
            </Button>
          </div>
          
          <Button 
            onClick={handleContinue} 
            disabled={isSaving}
            className="flex items-center"
          >
            <span>Continuar a Secciones</span>
            <ChevronRightIcon className="h-4 w-4 ml-1" />
          </Button>
        </CardFooter>
      </Card>

      <DeletePageDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={handleDeletePage}
        onCancel={() => setIsDeleteDialogOpen(false)}
        pageTitle={pageData.title}
        isLoading={isDeleting}
      />
    </>
  );
};

export default PageDetailsTab; 