import React from 'react';
import { EyeIcon, SaveIcon } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import ManageableSection from '@/components/cms/ManageableSection';
import EmptySectionPlaceholder from './EmptySectionPlaceholder';
import { Section, ManageableSectionHandle } from '@/types/cms';

interface SectionsTabProps {
  pageSections: Section[];
  isSaving: boolean;
  isCreatingSection: boolean;
  isSavingSection: boolean;
  newSectionName: string;
  onNameChange: (name: string) => void;
  onCreateSection: () => void;
  onCancelCreate: () => void;
  onStartCreating: () => void;
  onSectionNameChange: (newName: string) => void;
  onRefreshView: () => void;
  onBackClick: () => void;
  onSavePage: () => void;
  sectionRef: React.RefObject<ManageableSectionHandle>;
}

export const SectionsTab: React.FC<SectionsTabProps> = ({
  pageSections,
  isSaving,
  isCreatingSection,
  isSavingSection,
  newSectionName,
  onNameChange,
  onCreateSection,
  onCancelCreate,
  onStartCreating,
  onSectionNameChange,
  onRefreshView,
  onBackClick,
  onSavePage,
  sectionRef,
}) => {
  return (
    <Card className="border-none shadow-none pb-4">
      <CardHeader className="px-0">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Componentes de la página</CardTitle>
            <CardDescription>
              Edita los componentes de tu página
            </CardDescription>
          </div>
          <Button 
            variant="outline" 
            onClick={onRefreshView}
            className="flex items-center gap-2"
          >
            <EyeIcon className="h-4 w-4" />
            <span>Refrescar vista</span>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="px-0">
        {pageSections.length > 0 ? (
          <div className="rounded-lg">
            <ManageableSection
              ref={sectionRef}
              sectionId={pageSections[0]?.sectionId || ''}
              sectionName={pageSections[0]?.name}
              onSectionNameChange={onSectionNameChange}
              isEditing={true}
              autoSave={false}
            />
          </div>
        ) : (
          <EmptySectionPlaceholder
            isCreatingSection={isCreatingSection}
            isSavingSection={isSavingSection}
            newSectionName={newSectionName}
            onNameChange={onNameChange}
            onCreateSection={onCreateSection}
            onCancelCreate={onCancelCreate}
            onStartCreating={onStartCreating}
          />
        )}
      </CardContent>
      <CardFooter className="px-0 flex justify-between">
        <Button variant="outline" onClick={onBackClick}>
          Volver a Detalles
        </Button>
        <Button 
          variant="default" 
          onClick={onSavePage}
          disabled={isSaving}
        >
          {isSaving ? (
            <>
              <span className="animate-spin h-4 w-4 border-2 border-white border-opacity-20 border-t-white rounded-full mr-1"></span>
              <span>Guardando...</span>
            </>
          ) : (
            <>
              <SaveIcon className="h-4 w-4 mr-1" />
              <span>Guardar cambios</span>
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default SectionsTab; 