import React from 'react';
import { AlertCircleIcon, XIcon, LoaderIcon } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { useRouter } from 'next/navigation';

interface DeletePageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  onCancel: () => void;
  pageTitle: string;
  isLoading?: boolean;
}

export const DeletePageDialog: React.FC<DeletePageDialogProps> = ({
  open,
  onOpenChange,
  onConfirm,
  onCancel,
  pageTitle,
  isLoading = false
}) => {
  const router = useRouter();
  
  const handleConfirm = async () => {
    await onConfirm();
    router.push('/cms/pages/edit');
  };
  
  if (!open) return null;
  
  return (
    <div className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center p-4" onClick={() => onOpenChange(false)}>
      <div 
        className="bg-background rounded-lg shadow-lg w-full max-w-[340px] border border-border animate-in fade-in-50 zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative p-4">
          {/* Close button */}
          <button 
            onClick={() => onOpenChange(false)}
            className="absolute right-3 top-3 rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            aria-label="Cerrar"
            disabled={isLoading}
          >
            <XIcon className="h-3.5 w-3.5" />
          </button>
          
          {/* Header */}
          <div className="mb-4">
            <div className="flex items-center gap-2 text-red-600 mb-2">
              <div className="p-1.5 bg-red-50 rounded-full">
                <AlertCircleIcon className="h-4 w-4" />
              </div>
              <h2 className="text-base font-semibold">¿Eliminar página?</h2>
            </div>
            <p className="text-muted-foreground text-xs">
              Esta acción eliminará la página y no se puede deshacer.
            </p>
            <div className="mt-2 py-1 px-2 bg-muted/50 rounded border-l-2 border-primary text-xs font-medium">
              {pageTitle}
            </div>
          </div>
          
          {/* Buttons */}
          <div className="flex gap-2 mt-4">
            <Button 
              variant="outline"  
              onClick={onCancel}
              className="flex-1 h-8 text-xs rounded"
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleConfirm}
              className="flex-1 h-8 text-xs rounded"
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="flex items-center gap-1">
                  <LoaderIcon className="h-3 w-3 animate-spin" />
                  Eliminando...
                </span>
              ) : (
                'Eliminar'
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeletePageDialog; 