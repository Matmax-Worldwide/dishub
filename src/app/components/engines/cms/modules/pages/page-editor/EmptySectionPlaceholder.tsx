import React from 'react';
import { LayoutIcon, MonitorIcon, SmartphoneIcon, SplitIcon, EyeIcon } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent } from '@/app/components/ui/card';

interface EmptySectionPlaceholderProps {
  isCreatingSection: boolean;
  isSavingSection: boolean;
  newSectionName: string;
  onNameChange: (name: string) => void;
  onCreateSection: () => Promise<boolean>;
  onCancelCreate: () => void;
  onStartCreating: () => void;
}

export const EmptySectionPlaceholder: React.FC<EmptySectionPlaceholderProps> = (props) => {
  // Handle section creation with async/await
  const handleCreateSection = async () => {
    console.log('[EmptySectionPlaceholder] Creating section...');
    
    try {
      const success = await props.onCreateSection();
      
      if (success) {
        console.log('[EmptySectionPlaceholder] Section created successfully');
        // El PageEditor se encarga de toda la lógica de actualización de estado
        // No necesitamos disparar eventos adicionales aquí
      } else {
        console.log('[EmptySectionPlaceholder] Section creation failed');
      }
      
      return success;
    } catch (error) {
      console.error('[EmptySectionPlaceholder] Error creating section:', error);
      return false;
    }
  };

  return (
    <div className="space-y-4">
      {/* Header with section name and controls */}
      <div className="flex justify-between items-center border-b pb-3">
        <div className="flex items-center">
          {props.isCreatingSection ? (
            <div className="flex items-center">
              <input
                type="text"
                value={props.newSectionName}
                onChange={(e) => props.onNameChange(e.target.value)}
                className="text-lg font-medium border-0 border-b border-dashed border-gray-300 focus:border-blue-500 focus:ring-0 bg-transparent py-1 px-0 w-60"
                placeholder="Nombre de la sección"
                disabled={props.isSavingSection}
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && props.newSectionName.trim() && !props.isSavingSection) {
                    handleCreateSection();
                  } else if (e.key === 'Escape') {
                    props.onCancelCreate();
                  }
                }}
              />
              <div className="flex items-center ml-4">
                <Button 
                  variant="default"
                  size="sm"
                  onClick={handleCreateSection}
                  disabled={!props.newSectionName.trim() || props.isSavingSection}
                  className="mr-2"
                >
                  {props.isSavingSection ? (
                    <>
                      <span className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-current border-r-transparent" />
                      Guardando...
                    </>
                  ) : (
                    'Crear sección'
                  )}
                </Button>
                <Button 
                  variant="outline"
                  size="sm"
                  onClick={props.onCancelCreate}
                  disabled={props.isSavingSection}
                >
                  Cancelar
                </Button>
              </div>
            </div>
          ) : (
            <Button 
              variant="outline"
              onClick={props.onStartCreating}
              className="flex items-center"
            >
              <LayoutIcon className="h-4 w-4 mr-2" />
              <span>Crear sección</span>
            </Button>
          )}
        </div>
        
        {/* Simulated view controls */}
        <div className="flex space-x-2">
          <div className="bg-gray-100 rounded-md p-1 flex">
            <Button variant="ghost" size="sm" className="px-2 py-1 h-8 rounded-md hover:bg-white">
              <SplitIcon className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" className="px-2 py-1 h-8 rounded-md hover:bg-white">
              <MonitorIcon className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" className="px-2 py-1 h-8 rounded-md hover:bg-white">
              <SmartphoneIcon className="h-4 w-4" />
            </Button>
          </div>
          <Button variant="ghost" size="sm" className="px-2 h-8">
            <EyeIcon className="h-4 w-4 mr-1" />
            <span className="text-xs">Vista previa</span>
          </Button>
        </div>
      </div>

      {/* Placeholder content */}
      {!props.isCreatingSection && (
        <Card className="border-2 border-dashed border-gray-200 bg-gray-50">
          <CardContent className="flex flex-col items-center justify-center py-20">
            <LayoutIcon className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-700 mb-1">No hay secciones en la página</h3>
            <p className="text-gray-600 mb-6">Añade una sección para comenzar a construir tu página</p>
          </CardContent>
        </Card>
      )}

      {/* When creating a section, but the name field is already at the top */}
      {props.isCreatingSection && (
        <Card className="border border-gray-200 bg-gray-50">
          <CardContent className="p-6">
            <div className="text-center">
              <LayoutIcon className="h-10 w-10 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">
                Ingresa el nombre para tu nueva sección y haz clic en &ldquo;Crear sección&rdquo;
              </p>
              
              {/* Mock editor area */}
              <div className="mt-6 border border-dashed border-gray-300 rounded-md p-8 bg-white">
                <div className="h-32 flex items-center justify-center">
                  <p className="text-gray-400 italic">El editor de secciones aparecerá aquí</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default EmptySectionPlaceholder; 