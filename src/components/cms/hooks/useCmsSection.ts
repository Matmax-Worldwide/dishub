'use client';

import { useState, useEffect } from 'react';

export interface CmsComponent {
  id: string;
  type: string;
  data: Record<string, unknown>;
}

interface UseCmsSectionProps {
  sectionId?: string;
  initialComponents?: CmsComponent[];
}

export function useCmsSection({ 
  sectionId = 'cms-managed-sections',
  initialComponents = []
}: UseCmsSectionProps = {}) {
  const [components, setComponents] = useState<CmsComponent[]>(initialComponents);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastSaved, setLastSaved] = useState<string | null>(null);

  // Load components from API
  const loadComponents = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/cms/sections?sectionId=${encodeURIComponent(sectionId)}`);
      
      if (!response.ok) {
        throw new Error(`Error fetching section data: ${response.status}`);
      }
      
      const { status, data } = await response.json();
      
      if (status === 'success' && data) {
        setComponents(data.components || []);
        setLastSaved(data.lastUpdated || null);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
      
      // Fallback to localStorage if API fails
      try {
        const savedState = localStorage.getItem(`cms_section_${sectionId}`);
        if (savedState) {
          const parsed = JSON.parse(savedState);
          setComponents(parsed.components || []);
          setLastSaved(parsed.lastUpdated || null);
        }
      } catch {
        // If localStorage also fails, just use initialComponents
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Save components to API
  const saveComponents = async (newComponents: CmsComponent[]) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/cms/sections', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sectionId,
          components: newComponents,
        }),
      });
      
      if (!response.ok) {
        throw new Error(`Error saving section data: ${response.status}`);
      }
      
      const { status } = await response.json();
      
      if (status === 'success') {
        setComponents(newComponents);
        const timestamp = new Date().toISOString();
        setLastSaved(timestamp);
        
        // Also save to localStorage as a backup
        localStorage.setItem(`cms_section_${sectionId}`, JSON.stringify({
          components: newComponents,
          lastUpdated: timestamp,
        }));
      } else {
        throw new Error('Failed to save section data');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
      
      // Fallback to localStorage if API fails
      try {
        const timestamp = new Date().toISOString();
        localStorage.setItem(`cms_section_${sectionId}`, JSON.stringify({
          components: newComponents,
          lastUpdated: timestamp,
        }));
        setComponents(newComponents);
        setLastSaved(timestamp);
      } catch {
        // If localStorage also fails, just update the state
        setComponents(newComponents);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Load components on initial render
  useEffect(() => {
    loadComponents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sectionId]);

  return {
    components,
    setComponents,
    saveComponents,
    loadComponents,
    isLoading,
    error,
    lastSaved,
  };
} 