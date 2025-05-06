'use client';

import { useState, useEffect } from 'react';
import { cmsOperations, CMSComponent } from '@/lib/graphql-client';
import SectionManager, { Component } from './SectionManager';
import AdminControls from './AdminControls';

// Define the valid section ID as a constant
const VALID_SECTION_ID = 'cms-managed-sections';

interface ManageableSectionProps {
  sectionId: string;
  isEditing?: boolean;
}

export default function ManageableSection({
  sectionId,
  isEditing = false
}: ManageableSectionProps) {
  const [components, setComponents] = useState<Component[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastSaved, setLastSaved] = useState<string | null>(null);

  // Validate and normalize the section ID
  const normalizedSectionId = sectionId === VALID_SECTION_ID ? 
    sectionId : 
    (sectionId.startsWith('cmabj51ke0000brep4j5e3c') ? VALID_SECTION_ID : sectionId);

  // Load components on initial render
  useEffect(() => {
    const loadComponents = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        console.log(`Loading components for section ${normalizedSectionId}...`);
        console.log(`Original section ID: ${sectionId}, Normalized: ${normalizedSectionId}`);
        
        // Add a timestamp to avoid caching
        const timestamp = new Date().getTime();
        const result = await cmsOperations.getSectionComponents(`${normalizedSectionId}?t=${timestamp}`);
        
        if (result && result.components && Array.isArray(result.components)) {
          console.log(`Loaded ${result.components.length} components from section ${normalizedSectionId}`);
          setComponents(result.components as unknown as Component[]);
          setLastSaved(result.lastUpdated || null);
        } else {
          console.warn(`No components found for section ${normalizedSectionId}`);
          setComponents([]);
        }
      } catch (error) {
        console.error(`Error loading components for section ${normalizedSectionId}:`, error);
        setError(error instanceof Error ? error.message : 'Unknown error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    loadComponents();
  }, [normalizedSectionId, sectionId]);

  // Handle component changes
  const handleComponentsChange = (newComponents: Component[]) => {
    setComponents(newComponents);
  };

  // Save components
  const handleSave = async (componentsToSave: Component[]) => {
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
      } else {
        console.error('Failed to save components:', result.message);
        setError(result.message || 'Failed to save components');
      }
    } catch (error) {
      console.error('Error saving components:', error);
      setError(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  // Load components
  const handleLoad = (loadedComponents: Component[]) => {
    setComponents(loadedComponents);
  };

  // Log rendering state for debugging
  console.log('Rendering SectionManager with:', {
    componentCount: components.length,
    isEditing,
    isLoading,
    hasError: !!error
  });

  return (
    <div className="my-6">
      {isEditing && (
        <AdminControls
          components={components}
          onSave={handleSave}
          onLoad={handleLoad}
          sectionId={normalizedSectionId}
          isLoading={isLoading}
          lastSaved={lastSaved}
          error={error}
        />
      )}
      
      <SectionManager
        initialComponents={components}
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
} 