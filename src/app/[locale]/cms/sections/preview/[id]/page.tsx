'use client';

import { useState, useRef, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  ArrowLeftIcon, 
  PencilIcon, 
  SaveIcon, 
  CheckIcon, 
  AlertTriangleIcon, 
  EyeIcon 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import ManageableSection from '@/components/cms/ManageableSection';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ManageableSectionHandle {
  saveChanges: () => Promise<void>;
}

export default function PreviewSectionPage() {
  const params = useParams();
  const router = useRouter();
  const { locale, id } = params;
  const sectionId = id as string;
  
  const [isEditing, setIsEditing] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showExitConfirmation, setShowExitConfirmation] = useState(false);
  const [redirectTarget, setRedirectTarget] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean | null>(null);
  const [saveMessage, setSaveMessage] = useState('');
  
  // Reference to ManageableSection component to call its saveChanges method
  const sectionRef = useRef<ManageableSectionHandle>(null);

  // Add keyboard shortcut listener for Ctrl+Shift+E to toggle edit mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Toggle edit mode with Ctrl+Shift+E
      if (e.ctrlKey && e.shiftKey && e.key === 'E') {
        e.preventDefault();
        toggleEditMode();
      }
      
      // Save changes with Ctrl+S when in edit mode
      if (e.ctrlKey && e.key === 's' && isEditing) {
        e.preventDefault();
        handleSave();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    
    // Clean up
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isEditing, hasUnsavedChanges]);
  
  // Force set unsaved changes to true when switching to edit mode
  useEffect(() => {
    if (isEditing) {
      // No configuramos hasUnsavedChanges=true aquí para no indicar al usuario
      // que tiene cambios sin guardar inmediatamente al entrar en modo edición
      console.log('Modo edición activado, preparado para detectar cambios');
    }
  }, [isEditing]);
  
  // Ask for confirmation before leaving with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isEditing && hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = ''; // Required for Chrome
        return '';
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isEditing, hasUnsavedChanges]);
  
  // Track changes in the section components
  const handleComponentsChange = () => {
    console.log('Cambios detectados en componentes desde ManageableSection');
    if (isEditing) {
      // Siempre marcar como con cambios sin guardar cuando estamos en modo edición
      // y se detecta un cambio en los componentes
      setHasUnsavedChanges(true);
      console.log('Se han detectado cambios sin guardar');
    }
  };
  
  // Toggle edit mode
  const toggleEditMode = () => {
    if (isEditing && hasUnsavedChanges) {
      setShowExitConfirmation(true);
    } else {
      setIsEditing(!isEditing);
      // Si estamos entrando al modo edición, reiniciamos el estado de cambios sin guardar
      if (!isEditing) {
        console.log('Entrando a modo edición - preparando para detectar cambios');
        setHasUnsavedChanges(false);
      }
    }
  };
  
  // Save changes
  const handleSave = async () => {
    if (!hasUnsavedChanges) {
      console.log('No hay cambios sin guardar, no se ejecuta guardado');
      return;
    }
    
    setIsSaving(true);
    setSaveSuccess(null);
    setSaveMessage('');
    console.log('Intentando guardar cambios en sección:', sectionId);
    
    try {
      if (sectionRef.current) {
        await sectionRef.current.saveChanges();
        setHasUnsavedChanges(false);
        setSaveSuccess(true);
        setSaveMessage('Los cambios se guardaron correctamente');
        console.log('Cambios guardados exitosamente en sección:', sectionId);
        
        // Auto-hide success message after 3 seconds
        setTimeout(() => {
          setSaveSuccess(null);
          setSaveMessage('');
        }, 3000);
      }
    } catch (error) {
      console.error('Error al guardar cambios:', error);
      setSaveSuccess(false);
      setSaveMessage('No se pudieron guardar los cambios. Intenta de nuevo.');
    } finally {
      setIsSaving(false);
    }
  };
  
  // Navigation functions
  const handleBackClick = () => {
    if (isEditing && hasUnsavedChanges) {
      setRedirectTarget(`/${locale}/cms/sections`);
      setShowExitConfirmation(true);
    } else {
      router.push(`/${locale}/cms/sections`);
    }
  };
  
  // Exit confirmation handlers
  const handleConfirmExit = () => {
    setShowExitConfirmation(false);
    
    if (redirectTarget) {
      router.push(redirectTarget);
    } else {
      // Exit edit mode without saving
      setIsEditing(false);
      setHasUnsavedChanges(false);
    }
  };
  
  const handleCancelExit = () => {
    setShowExitConfirmation(false);
    setRedirectTarget('');
  };
  
  const handleSaveAndExit = async () => {
    if (hasUnsavedChanges && sectionRef.current) {
      setIsSaving(true);
      try {
        await sectionRef.current.saveChanges();
        setHasUnsavedChanges(false);
        
        if (redirectTarget) {
          router.push(redirectTarget);
        } else {
          // Exit edit mode after saving
          setIsEditing(false);
        }
      } catch (error) {
        console.error('Error al guardar antes de salir:', error);
        setSaveSuccess(false);
        setSaveMessage('No se pudieron guardar los cambios. Intenta de nuevo antes de salir.');
        setIsSaving(false);
      }
    } else {
      if (redirectTarget) {
        router.push(redirectTarget);
      } else {
        // Exit edit mode
        setIsEditing(false);
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button 
            variant="ghost" 
            size="sm" 
            className="flex items-center gap-1"
            onClick={handleBackClick}
          >
            <ArrowLeftIcon className="h-4 w-4" />
            <span>Volver</span>
          </Button>
          <h1 className="text-2xl font-bold">
            {isEditing ? "Editando sección: " : "Vista previa: "}
            <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded ml-2">
              {sectionId}
            </span>
          </h1>
        </div>
        
        <div className="flex items-center gap-2">
          {isEditing && hasUnsavedChanges && (
            <div className="text-amber-600 bg-amber-50 text-sm px-3 py-1 rounded-full flex items-center">
              <AlertTriangleIcon className="h-4 w-4 mr-1" />
              <span>Cambios sin guardar</span>
            </div>
          )}
          
          <Button
            variant={isEditing ? "outline" : "default"}
            size="sm"
            onClick={toggleEditMode}
            className="flex items-center gap-1"
          >
            {isEditing ? (
              <>
                <EyeIcon className="h-4 w-4" />
                <span>Vista previa</span>
              </>
            ) : (
              <>
                <PencilIcon className="h-4 w-4" />
                <span>Editar</span>
              </>
            )}
          </Button>
          
          {isEditing && (
            <Button
              variant="default"
              size="sm"
              onClick={handleSave}
              disabled={!hasUnsavedChanges || isSaving}
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
                  <span>Guardar</span>
                </>
              )}
            </Button>
          )}
        </div>
      </div>
      
      {saveSuccess !== null && (
        <div className={`p-3 rounded-md ${saveSuccess ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'} flex items-center`}>
          {saveSuccess ? (
            <CheckIcon className="h-5 w-5 mr-2" />
          ) : (
            <AlertTriangleIcon className="h-5 w-5 mr-2" />
          )}
          {saveMessage}
        </div>
      )}
      
      <div className={`${isEditing ? 'bg-amber-50' : 'bg-gray-50'} border-2 border-dashed ${isEditing ? 'border-amber-200' : 'border-gray-200'} p-6 rounded-lg`}>
        <div className="text-center text-gray-500 mb-4 text-sm">
          {isEditing ? (
            <>
              🖋️ Modo de edición - Haz cambios en los componentes de la sección<br/>
              <span className="text-xs bg-blue-100 px-2 py-1 rounded mt-1 inline-block">
                ID de sección: <code className="font-mono">{sectionId}</code>
              </span>
            </>
          ) : (
            <>👁️ Así es como se verá la sección en el sitio web</>
          )}
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-6">
          <ManageableSection
            ref={sectionRef}
            sectionId={sectionId}
            isEditing={isEditing}
            onComponentsChange={handleComponentsChange}
          />
        </div>
      </div>
      
      {isEditing && !hasUnsavedChanges && (
        <div className="bg-blue-50 p-3 rounded-md mt-4 text-sm text-blue-700 flex items-center">
          <div className="mr-2">ℹ️</div>
          <div>
            <p className="font-medium">Consejo:</p>
            <p>Si has añadido o eliminado componentes pero el botón &ldquo;Guardar&rdquo; no se activa,
            haz un pequeño cambio en algún texto o edita un componente existente.</p>
          </div>
        </div>
      )}
      
      <div className="flex justify-between items-center">
        <div className="text-sm text-gray-500">
          <kbd className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded border border-gray-300 font-mono text-xs">Ctrl+Shift+E</kbd>
          <span className="ml-1">para {isEditing ? 'salir del' : 'entrar en'} modo edición</span>
          
          {isEditing && (
            <>
              <span className="mx-2">|</span>
              <kbd className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded border border-gray-300 font-mono text-xs">Ctrl+S</kbd>
              <span className="ml-1">para guardar</span>
            </>
          )}
        </div>
        
        {isEditing && (
          <Button 
            variant="default" 
            size="sm" 
            onClick={handleSave} 
            disabled={!hasUnsavedChanges || isSaving}
          >
            {isSaving ? 'Guardando...' : 'Guardar cambios'}
          </Button>
        )}
      </div>
      
      {/* Exit confirmation dialog */}
      <AlertDialog open={showExitConfirmation} onOpenChange={setShowExitConfirmation}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center text-amber-600">
              <AlertTriangleIcon className="h-5 w-5 mr-2" />
              <span>Cambios sin guardar</span>
            </AlertDialogTitle>
            <AlertDialogDescription>
              Tienes cambios sin guardar. ¿Qué deseas hacer?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel onClick={handleCancelExit}>
              Cancelar
            </AlertDialogCancel>
            <div className="flex flex-col sm:flex-row gap-2">
              <AlertDialogAction
                onClick={handleSaveAndExit}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Guardar y salir
              </AlertDialogAction>
              <AlertDialogAction
                onClick={handleConfirmExit}
                className="bg-red-600 hover:bg-red-700"
              >
                Salir sin guardar
              </AlertDialogAction>
            </div>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
} 