import React, { useState } from 'react';
import { ChevronRightIcon, Trash2Icon } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PageData } from '@/types/cms';
import DeletePageDialog from './DeletePageDialog';

interface PageDetailsTabProps {
  pageData: PageData;
  locale: string;
  onTitleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onSelectChange: (name: string, value: string) => void;
  onCancel: () => void;
  onContinue: () => void;
  onDelete: () => void;
}

export const PageDetailsTab: React.FC<PageDetailsTabProps> = ({
  pageData,
  locale,
  onTitleChange,
  onInputChange,
  onSelectChange,
  onCancel,
  onContinue,
  onDelete,
}) => {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

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
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button 
            variant="destructive" 
            onClick={() => setIsDeleteDialogOpen(true)}
            className="flex items-center gap-2"
          >
            <Trash2Icon className="h-4 w-4" />
            <span>Delete Page</span>
          </Button>
          <Button onClick={onContinue} className="flex items-center">
            <span>Continuar a Secciones</span>
            <ChevronRightIcon className="h-4 w-4 ml-1" />
          </Button>
        </CardFooter>
      </Card>

      <DeletePageDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={onDelete}
        onCancel={() => setIsDeleteDialogOpen(false)}
        pageTitle={pageData.title}
      />
    </>
  );
};

export default PageDetailsTab; 