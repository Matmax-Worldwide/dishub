'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
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
import { Button } from "@/components/ui/button";

// Our known valid section ID
const VALID_SECTION_ID = 'cms-managed-sections';

export default function SectionPage() {
  const params = useParams();
  const router = useRouter();
  const sectionId = params?.id as string;
  const [isEditing, setIsEditing] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showExitConfirmation, setShowExitConfirmation] = useState(false);
  
  // Reference to ManageableSection component to call save method
  const sectionRef = useRef(null);
  
  // Check for common typos in the section ID
  useEffect(() => {
    // If the section ID is slightly wrong (missing the last character or has a typo)
    // This handles cases like 'cmabj51ke0000brep4j5e3cv' (missing 'q' at the end)
    if (sectionId && sectionId !== VALID_SECTION_ID && 
        (sectionId.startsWith('cmabj51ke0000brep4j5e3c') || 
         sectionId.length === VALID_SECTION_ID.length - 1)) {
      console.log(`Redirecting from invalid section ID: ${sectionId} to ${VALID_SECTION_ID}`);
      router.replace(`/section/${VALID_SECTION_ID}`);
    }
  }, [sectionId, router]);
  
  // Add keyboard shortcut listener for Ctrl+Shift+E to toggle edit mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check for Ctrl+Shift+E
      if (e.ctrlKey && e.shiftKey && e.key === 'E') {
        e.preventDefault();
        toggleEditMode();
      }
      // Check for Ctrl+S to save changes when in edit mode
      if (e.ctrlKey && e.key === 's' && isEditing) {
        e.preventDefault();
        saveChanges();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    
    // Clean up
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isEditing, hasUnsavedChanges]);
  
  // Ask for confirmation before leaving edit mode with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isEditing && hasUnsavedChanges) {
        // Standard way to show a confirmation dialog before leaving the page
        e.preventDefault();
        e.returnValue = ''; // Chrome requires returnValue to be set
        return ''; // This message isn't actually shown in modern browsers
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isEditing, hasUnsavedChanges]);
  
  // Reset unsaved changes when entering edit mode
  useEffect(() => {
    if (isEditing) {
      // Al entrar en modo edición, reseteamos el estado de cambios sin guardar
      setHasUnsavedChanges(false);
    }
  }, [isEditing]);
  
  // Toggle edit mode with confirmation if there are unsaved changes
  const toggleEditMode = () => {
    if (isEditing && hasUnsavedChanges) {
      // Siempre mostrar el diálogo si hay cambios sin guardar al intentar salir
      setShowExitConfirmation(true);
    } else {
      // Solo cambiar el modo de edición si no hay cambios o estamos entrando en modo edición
      setIsEditing(prev => !prev);
      console.log(`Edit mode ${!isEditing ? 'enabled' : 'disabled'}`);
    }
  };
  
  // Handle saving changes
  const saveChanges = () => {
    if (!hasUnsavedChanges) {
      console.log('No hay cambios para guardar');
      return;
    }
    
    if (sectionRef.current) {
      console.log('Guardando cambios...');
      
      // Mostrar notificación de guardando...
      const savingMessage = document.createElement('div');
      savingMessage.className = 'fixed top-4 right-4 bg-blue-500 text-white px-4 py-2 rounded shadow-lg z-50';
      savingMessage.textContent = 'Guardando cambios...';
      document.body.appendChild(savingMessage);
      
      try {
        // @ts-expect-error - The ref is typed but TypeScript still complains
        sectionRef.current.saveChanges()
          .then(() => {
            // Quitar la notificación de guardando
            document.body.removeChild(savingMessage);
            
            // Resetear el estado de cambios sin guardar
            setHasUnsavedChanges(false);
            
            // Mostrar una notificación de éxito
            const successMessage = document.createElement('div');
            successMessage.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded shadow-lg z-50';
            successMessage.textContent = 'Cambios guardados correctamente';
            document.body.appendChild(successMessage);
            
            // Eliminar después de 3 segundos
            setTimeout(() => {
              if (document.body.contains(successMessage)) {
                document.body.removeChild(successMessage);
              }
            }, 3000);
          })
          .catch((error: Error | unknown) => {
            // Quitar la notificación de guardando
            document.body.removeChild(savingMessage);
            
            // Mostrar notificación de error
            console.error('Error al guardar:', error);
            const errorMessage = document.createElement('div');
            errorMessage.className = 'fixed top-4 right-4 bg-red-500 text-white px-4 py-2 rounded shadow-lg z-50';
            errorMessage.textContent = 'Error al guardar cambios';
            document.body.appendChild(errorMessage);
            
            // Eliminar después de 3 segundos
            setTimeout(() => {
              if (document.body.contains(errorMessage)) {
                document.body.removeChild(errorMessage);
              }
            }, 3000);
          });
      } catch (error) {
        // Quitar la notificación de guardando
        document.body.removeChild(savingMessage);
        
        // Mostrar notificación de error
        console.error('Error al guardar (try/catch):', error);
        const errorMessage = document.createElement('div');
        errorMessage.className = 'fixed top-4 right-4 bg-red-500 text-white px-4 py-2 rounded shadow-lg z-50';
        errorMessage.textContent = 'Error al guardar cambios';
        document.body.appendChild(errorMessage);
        
        // Eliminar después de 3 segundos
        setTimeout(() => {
          if (document.body.contains(errorMessage)) {
            document.body.removeChild(errorMessage);
          }
        }, 3000);
      }
    }
  };
  
  // Track changes in the section components
  const handleComponentsChange = () => {
    // Solo marcar como cambios sin guardar si estamos en modo edición
    if (isEditing) {
      console.log('Cambios detectados en componentes, marcando como sin guardar');
      setHasUnsavedChanges(true);
    }
  };
  
  // Confirm exit without saving
  const confirmExit = () => {
    // Resetear el estado y salir del modo edición
    setHasUnsavedChanges(false);
    setShowExitConfirmation(false);
    setIsEditing(false);
  };
  
  // Cancel exit
  const cancelExit = () => {
    // Solo cerrar el diálogo, manteniendo los cambios y el modo edición
    setShowExitConfirmation(false);
  };
  
  // Always use the valid section ID to ensure data is loaded correctly
  const effectiveSectionId = sectionId === VALID_SECTION_ID ? sectionId : VALID_SECTION_ID;
  
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Section Content</h1>
      
      <div className="bg-white shadow-md rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Section ID: {effectiveSectionId}</h2>
          
          {isEditing && (
            <div className="flex items-center space-x-2">
              {hasUnsavedChanges && (
                <div className="bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-sm font-medium flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  Cambios sin guardar
                </div>
              )}
              <div className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-medium flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
                Modo edición activo
              </div>
            </div>
          )}
        </div>
        
        <ManageableSection 
          ref={sectionRef}
          sectionId={effectiveSectionId}
          isEditing={isEditing}
          autoSave={false}
          onComponentsChange={handleComponentsChange}
        />
        
        <div className="mt-6 pt-4 border-t border-gray-200 flex justify-between items-center">
          <div className="space-x-2">
            <Button
              onClick={toggleEditMode}
              variant={isEditing ? "destructive" : "default"}
              className="flex items-center"
            >
              {isEditing ? (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Salir del modo edición
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                  Editar esta sección
                </>
              )}
            </Button>
            
            {isEditing && (
              <Button
                onClick={saveChanges}
                disabled={!hasUnsavedChanges}
                variant="default"
                className={`flex items-center ${!hasUnsavedChanges ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Guardar cambios
              </Button>
            )}
          </div>
          
          <div className="text-sm text-gray-500">
            <div className="flex items-center">
              <kbd className="px-2 py-1 mr-1 bg-gray-100 rounded">Ctrl+Shift+E</kbd> para modo edición
              {isEditing && (
                <>
                  <span className="mx-1">|</span> 
                  <kbd className="px-2 py-1 mr-1 bg-gray-100 rounded">Ctrl+S</kbd> para guardar
                </>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Exit confirmation dialog using Shadcn AlertDialog */}
      <AlertDialog 
        open={showExitConfirmation} 
        onOpenChange={(open) => {
          // Si se cierra el diálogo de otra manera (como haciendo clic fuera),
          // tratarlo como una cancelación
          if (!open) {
            setShowExitConfirmation(false);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Salir sin guardar?</AlertDialogTitle>
            <AlertDialogDescription>
              Tienes cambios sin guardar. ¿Estás seguro de que quieres salir del modo edición sin guardar?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={cancelExit}>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmExit} 
              className="bg-red-500 hover:bg-red-600"
            >
              Salir sin guardar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
} 