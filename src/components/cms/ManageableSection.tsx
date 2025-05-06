'use client';

import React, { useState, useEffect, useImperativeHandle, forwardRef } from 'react';
import { cmsOperations, CMSComponent } from '@/lib/graphql-client';
import SectionManager, { Component } from './SectionManager';
import AdminControls from './AdminControls';

interface ManageableSectionProps {
  sectionId: string;
  isEditing?: boolean;
  autoSave?: boolean;
  onComponentsChange?: () => void;
}

// Definir la interfaz para el handle del ref
interface ManageableSectionHandle {
  saveChanges: () => Promise<void>;
}

const ManageableSection = forwardRef<ManageableSectionHandle, ManageableSectionProps>(({
  sectionId,
  isEditing = false,
  autoSave = true,
  onComponentsChange
}, ref) => {
  const [components, setComponents] = useState<Component[]>([]);
  const [pendingComponents, setPendingComponents] = useState<Component[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastSaved, setLastSaved] = useState<string | null>(null);

  // Validate and normalize the section ID
  const normalizedSectionId = sectionId;

  // Expose saveChanges method to parent component
  useImperativeHandle(ref, () => ({
    saveChanges: async () => {
      // Devolver la promesa para que el componente padre pueda manejar el resultado
      return handleSave(pendingComponents);
    }
  }));

  // Load components on initial render
  useEffect(() => {
    const loadComponents = async () => {
      // Identificador único para esta operación de carga
      const loadId = `load-${Math.random().toString(36).substring(2, 9)}`;
      const startTime = Date.now();
      
      console.log(`⏳ [${loadId}] INICIO CARGA de componentes para sección '${normalizedSectionId}'`);
      console.log(`🔍 [${loadId}] ID de sección original: '${sectionId}', normalizado: '${normalizedSectionId}'`);
      
      setIsLoading(true);
      setError(null);
      
      try {
        // Add a timestamp to avoid caching
        const timestamp = Date.now();
        console.log(`🔍 [${loadId}] Solicitando componentes con timestamp anti-caché: ${timestamp}`);
        console.log(`🔍 [${loadId}] URL efectiva para getSectionComponents: '${normalizedSectionId}?t=${timestamp}'`);
        
        console.log(`⏳ [${loadId}] Enviando solicitud a getSectionComponents...`);
        const result = await cmsOperations.getSectionComponents(`${normalizedSectionId}?t=${timestamp}`);
        
        // Registrar información de diagnóstico sobre la respuesta
        console.log(`✅ [${loadId}] Respuesta recibida después de ${Date.now() - startTime}ms:`);
        console.log(`🔍 [${loadId}] Tipo de respuesta:`, result ? typeof result : 'null/undefined');
        
        // Verificar si result es nulo o indefinido
        if (!result) {
          console.error(`❌ [${loadId}] La respuesta es NULL o UNDEFINED`);
          setError('No se recibió respuesta del servidor');
          setComponents([]);
          setPendingComponents([]);
          return;
        }
        
        // Verificar la estructura de la respuesta
        console.log(`🔍 [${loadId}] Claves en la respuesta:`, Object.keys(result).join(', '));
        
        // Verificar el campo components
        if (!('components' in result)) {
          console.error(`❌ [${loadId}] La respuesta NO contiene el campo 'components'`);
          console.error(`❌ [${loadId}] Respuesta completa:`, JSON.stringify(result, null, 2));
          setError('La respuesta del servidor no tiene el formato esperado (falta components)');
          setComponents([]);
          setPendingComponents([]);
          return;
        }
        
        // Verificar si components es un array
        if (!Array.isArray(result.components)) {
          console.error(`❌ [${loadId}] El campo 'components' NO ES UN ARRAY, es:`, typeof result.components);
          setError(`El campo 'components' no es un array válido (${typeof result.components})`);
          setComponents([]);
          setPendingComponents([]);
          return;
        }
        
        // Verificar el lastUpdated
        if (!result.lastUpdated) {
          console.warn(`⚠️ [${loadId}] El campo 'lastUpdated' es ${result.lastUpdated === null ? 'NULL' : 'UNDEFINED'}`);
        } else {
          console.log(`🔍 [${loadId}] lastUpdated:`, result.lastUpdated);
        }
        
        // Información sobre los componentes recibidos
        if (result.components.length === 0) {
          console.warn(`⚠️ [${loadId}] Se recibió un array de componentes VACÍO`);
        } else {
          console.log(`✅ [${loadId}] Se recibieron ${result.components.length} componentes`);
          
          // Analizar cada componente para verificar su estructura
          result.components.forEach((comp, idx) => {
            console.log(`🔍 [${loadId}] Componente #${idx+1}:`);
            console.log(`  - ID: ${comp.id || 'FALTA'}`);
            console.log(`  - Type: ${comp.type || 'FALTA'}`);
            console.log(`  - Data: ${comp.data ? 'PRESENTE' : 'FALTA'}`);
            
            if (comp.data) {
              console.log(`  - Data keys: ${Object.keys(comp.data).join(', ')}`);
            }
            
            // Verificar si el componente es válido
            if (!comp.id || !comp.type) {
              console.warn(`⚠️ [${loadId}] El componente #${idx+1} tiene estructura INCOMPLETA`);
            }
            
            if (!comp.data) {
              console.warn(`⚠️ [${loadId}] El componente #${idx+1} NO TIENE data`);
            }
          });
        }
        
        console.log(`✅ [${loadId}] Actualizando estados con ${result.components.length} componentes`);
        const loadedComponents = result.components as unknown as Component[];
        setComponents(loadedComponents);
        setPendingComponents(loadedComponents);
        setLastSaved(result.lastUpdated || null);
        
        // Registrar la finalización exitosa
        console.log(`✅ [${loadId}] CARGA COMPLETADA en ${Date.now() - startTime}ms`);
      } catch (error) {
        console.error(`❌ [${loadId}] ERROR al cargar componentes:`, error);
        console.error(`❌ [${loadId}] Detalles del error:`, error instanceof Error ? {
          message: error.message,
          stack: error.stack
        } : 'Error no es una instancia de Error');
        
        setError(error instanceof Error ? error.message : 'Error desconocido al cargar componentes');
        setComponents([]);
        setPendingComponents([]);
      } finally {
        console.log(`⏳ [${loadId}] Finalizando carga, tiempo total: ${Date.now() - startTime}ms`);
        setIsLoading(false);
      }
    };

    loadComponents();
  }, [normalizedSectionId, sectionId]);

  // Handle component changes
  const handleComponentsChange = (newComponents: Component[]) => {
    // Siempre imprimir información de depuración sobre los componentes
    console.log('Componentes actuales:', pendingComponents.length, 'Nuevos componentes:', newComponents.length);
    
    // Calcular si hay un cambio real comparando los arrays
    const currentJson = JSON.stringify(pendingComponents);
    const newJson = JSON.stringify(newComponents);
    const hasChanges = currentJson !== newJson;
    
    // Si hay cambios, o los arrays tienen longitudes diferentes (añadido/eliminado), actualizar
    if (hasChanges || pendingComponents.length !== newComponents.length) {
      console.log('Componentes cambiados en ManageableSection, actualizando estado');
      setPendingComponents(newComponents);
      
      // Notificar al componente padre sobre los cambios si se proporcionó un callback
      if (onComponentsChange) {
        console.log('Notificando al padre sobre cambios en componentes');
        onComponentsChange();
      }
      
      // Si autoSave está habilitado, guardar los cambios inmediatamente
      if (autoSave) {
        handleSave(newComponents);
      }
    } else {
      console.log('Los componentes no han cambiado, omitiendo actualización');
    }
  };

  // Save components to the server
  const handleSave = async (componentsToSave: Component[]): Promise<void> => {
    return new Promise<void>(async (resolve, reject) => {
      try {
        console.log(`Saving ${componentsToSave.length} components to section ${normalizedSectionId}`);
        console.log('Components to save:', componentsToSave.map(c => `${c.id} (${c.type})`));
        
        setIsLoading(true);
        const result = await cmsOperations.saveSectionComponents(
          normalizedSectionId, 
          componentsToSave as unknown as CMSComponent[]
        );
        
        if (result.success) {
          console.log('Components saved successfully:', result);
          setLastSaved(result.lastUpdated || new Date().toISOString());
          // Update the components state to reflect what was saved
          setComponents(componentsToSave);
          setIsLoading(false);
          resolve();
        } else {
          console.error('Failed to save components:', result.message);
          setError(result.message || 'Failed to save components');
          setIsLoading(false);
          reject(new Error(result.message || 'Failed to save components'));
        }
      } catch (error) {
        console.error('Error saving components:', error);
        setError(error instanceof Error ? error.message : 'Unknown error occurred');
        setIsLoading(false);
        reject(error);
      }
    });
  };

  // Load components
  const handleLoad = (loadedComponents: Component[]) => {
    setComponents(loadedComponents);
    setPendingComponents(loadedComponents);
  };

  // Log rendering state for debugging
  console.log('Rendering SectionManager with:', {
    componentCount: components.length,
    pendingComponentCount: pendingComponents.length,
    isEditing,
    isLoading,
    hasUnsavedChanges: JSON.stringify(components) !== JSON.stringify(pendingComponents),
    hasError: !!error
  });

  return (
    <div className={isEditing ? "my-6" : ""}>
      {isEditing && autoSave && (
        <AdminControls
          components={pendingComponents}
          onSave={handleSave}
          onLoad={handleLoad}
          sectionId={normalizedSectionId}
          isLoading={isLoading}
          lastSaved={lastSaved}
          error={error}
        />
      )}
      
      <SectionManager
        initialComponents={autoSave ? pendingComponents : components}
        isEditing={isEditing}
        onComponentsChange={handleComponentsChange}
      />
      
      {isLoading && (
        <div className="text-center py-8 text-gray-500">
          Loading section content...
        </div>
      )}
      
      {error && !isLoading && (
        <div className="text-center py-4 text-red-500 bg-red-50 rounded">
          Error: {error}
        </div>
      )}
    </div>
  );
});

// Add display name for better debugging
ManageableSection.displayName = 'ManageableSection';

export default ManageableSection; 