import React from 'react';
import { LayoutIcon } from 'lucide-react';
import CreateSectionForm from './CreateSectionForm';

interface EmptySectionPlaceholderProps {
  isCreatingSection: boolean;
  isSavingSection: boolean;
  newSectionName: string;
  onNameChange: (name: string) => void;
  onCreateSection: () => void;
  onCancelCreate: () => void;
  onStartCreating: () => void;
}

export const EmptySectionPlaceholder: React.FC<EmptySectionPlaceholderProps> = (props) => {
  return (
    <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-lg bg-gray-50">
      <LayoutIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
      <h3 className="text-lg font-medium text-gray-700 mb-1">No hay secciones en la página</h3>
      <p className="text-gray-600 mb-6">Añade una sección para comenzar a construir tu página</p>
      
      <CreateSectionForm 
        isCreatingSection={props.isCreatingSection}
        isSavingSection={props.isSavingSection}
        newSectionName={props.newSectionName}
        onNameChange={props.onNameChange}
        onCreateSection={props.onCreateSection}
        onCancel={props.onCancelCreate}
        onStartCreating={props.onStartCreating}
      />
    </div>
  );
};

export default EmptySectionPlaceholder; 