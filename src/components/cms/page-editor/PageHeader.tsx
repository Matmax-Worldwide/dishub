import React from 'react';
import { ArrowLeftIcon, AlertCircleIcon, SaveIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

interface PageHeaderProps {
  title: string;
  isPublished: boolean;
  hasUnsavedChanges: boolean;
  isSaving: boolean;
  onPublishChange: (checked: boolean) => void;
  onCancel: () => void;
  onSave: () => void;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  isPublished,
  hasUnsavedChanges,
  isSaving,
  onPublishChange,
  onCancel,
  onSave
}) => {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-4">
        <Button 
          variant="ghost" 
          size="sm" 
          className="flex items-center gap-1"
          onClick={onCancel}
        >
          <ArrowLeftIcon className="h-4 w-4" />
          <span>Volver</span>
        </Button>
        <h1 className="text-2xl font-bold">
          Editar página: {title}
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
            checked={isPublished}
            onCheckedChange={onPublishChange}
          />
          <Label htmlFor="header-isPublished" className="text-sm font-medium text-gray-700">
            {isPublished ? 'Publicada' : 'Borrador'}
          </Label>
        </div>
        
        <Button
          variant="outline"
          size="sm"
          onClick={onCancel}
        >
          Cancelar
        </Button>
        
        <Button
          variant="default"
          size="sm"
          onClick={onSave}
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
  );
};

export default PageHeader; 