import React from 'react';
import { InfoIcon, AlignLeftIcon, GlobeIcon, ChevronRightIcon } from 'lucide-react';
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
import { PageData } from '@/types/cms';

interface SEOTabProps {
  pageData: PageData;
  locale: string;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onBackClick: () => void;
  onContinue: () => void;
}

export const SEOTab: React.FC<SEOTabProps> = ({
  pageData,
  locale,
  onInputChange,
  onBackClick,
  onContinue,
}) => {
  return (
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
              onChange={onInputChange}
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
              onChange={onInputChange}
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
              onChange={onInputChange}
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
        <Button variant="outline" onClick={onBackClick}>
          Volver a Detalles
        </Button>
        <Button onClick={onContinue} className="flex items-center">
          <span>Continuar a Secciones</span>
          <ChevronRightIcon className="h-4 w-4 ml-1" />
        </Button>
      </CardFooter>
    </Card>
  );
};

export default SEOTab; 