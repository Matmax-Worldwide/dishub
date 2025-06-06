import React from 'react';
import { CheckIcon, PlusIcon, XIcon } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';

interface CreateSectionFormProps {
  isCreatingSection: boolean;
  isSavingSection: boolean;
  newSectionName: string;
  onNameChange: (name: string) => void;
  onCreateSection: () => Promise<boolean>;
  onCancel: () => void;
  onStartCreating: () => void;
  onCreateSuccess?: () => void;
}

export const CreateSectionForm: React.FC<CreateSectionFormProps> = ({
  isCreatingSection,
  isSavingSection,
  newSectionName,
  onNameChange,
  onCreateSection,
  onCancel,
  onStartCreating,
  onCreateSuccess
}) => {
  const handleCreate = async () => {
    const success = await onCreateSection();
    if (success && onCreateSuccess) {
      onCreateSuccess();
    }
  };

  if (isCreatingSection) {
    return (
      <div className="max-w-md mx-auto">
        <div className="flex items-center space-x-4">
          <Input
            value={newSectionName}
            onChange={(e) => onNameChange(e.target.value)}
            placeholder="Nombre para la sección"
            className="flex-1 border-blue-300 focus:ring-blue-500"
            autoFocus
            disabled={isSavingSection}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && newSectionName.trim() && !isSavingSection) {
                handleCreate();
              } else if (e.key === 'Escape') {
                onCancel();
              }
            }}
          />
          <Button
            onClick={handleCreate}
            disabled={!newSectionName.trim() || isSavingSection}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
          >
            {isSavingSection ? (
              <>
                <span className="animate-spin h-4 w-4 border-2 border-white border-opacity-20 border-t-white rounded-full"></span>
                <span>Creando...</span>
              </>
            ) : (
              <>
                <CheckIcon className="h-4 w-4" />
                <span>Crear</span>
              </>
            )}
          </Button>
          <Button
            variant="outline"
            onClick={onCancel}
            className="h-10 w-10 p-0 border-blue-300 text-blue-600"
            disabled={isSavingSection}
          >
            <XIcon className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-xs mx-auto">
      <Button 
        className="w-full bg-blue-600 hover:bg-blue-700"
        onClick={onStartCreating}
      >
        <PlusIcon className="h-5 w-5 mr-2" />
        <span>Añadir sección</span>
      </Button>
    </div>
  );
};

export default CreateSectionForm; 