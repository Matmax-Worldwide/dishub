import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { AvailableSection } from '@/types/cms';

interface AddSectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedSection: string;
  onSectionChange: (value: string) => void;
  availableSections: AvailableSection[];
  onAddSection: () => void;
}

export const AddSectionDialog: React.FC<AddSectionDialogProps> = ({
  open,
  onOpenChange,
  selectedSection,
  onSectionChange,
  availableSections,
  onAddSection
}) => {
  const handleClose = () => {
    onOpenChange(false);
    onSectionChange('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Añadir sección</DialogTitle>
          <DialogDescription>
            Selecciona una sección para añadir a tu página.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <Select 
            value={selectedSection} 
            onValueChange={onSectionChange}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Selecciona una plantilla de sección" />
            </SelectTrigger>
            <SelectContent>
              {availableSections.map(section => (
                <SelectItem key={section.sectionId} value={section.sectionId}>
                  {section.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={handleClose}
          >
            Cancelar
          </Button>
          <Button 
            onClick={onAddSection}
            disabled={!selectedSection}
          >
            Añadir sección
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddSectionDialog; 