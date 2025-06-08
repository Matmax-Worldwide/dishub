'use client';

import React, { memo, useMemo, useCallback } from 'react';
import { cn } from '@/lib/utils';

// Define Component interface locally to avoid import issues
export interface Component {
  id: string;
  type: 'Hero' | 'Text' | 'Image' | 'Feature' | 'Testimonial' | 'Header' | 'Card' | 'Benefit' | 'Form' | 'Footer' | 'Article' | 'Blog' | 'Video' | 'Gallery' | 'Calendar' | 'CtaButton';
  data: Record<string, unknown>;
  subtitle?: string;
}

interface SectionPreviewProps {
  pendingComponents: Component[];
  isEditing?: boolean;
  inspectionMode?: boolean;
  toggleInspectionMode?: () => void;
  sectionBackground?: string;
  sectionBackgroundType?: 'image' | 'gradient';
  activeComponentId?: string | null;
  setActiveComponentId?: (id: string | null) => void;
  collapsedComponents?: Record<string, boolean>;
  setCollapsedComponents?: (state: Record<string, boolean>) => void;
  isEditingComponentRef?: React.MutableRefObject<boolean>;
}

// Memoized SectionPreview component to prevent unnecessary re-renders
const SectionPreview: React.FC<SectionPreviewProps> = memo(({
  pendingComponents = [],
  isEditing = false,
  inspectionMode = false,
  toggleInspectionMode = () => {},
  sectionBackground = 'white',
  sectionBackgroundType = 'gradient',
}) => {
  
  // Memoize the background style to prevent recalculation
  const backgroundStyle = useMemo(() => ({
    position: 'relative' as const,
    zIndex: 1,
    background: sectionBackground || 'white',
    backgroundSize: sectionBackgroundType === 'image' ? 'cover' : undefined,
    backgroundPosition: sectionBackgroundType === 'image' ? 'center' : undefined,
    backgroundRepeat: sectionBackgroundType === 'image' ? 'no-repeat' : undefined
  }), [sectionBackground, sectionBackgroundType]);

  // Memoize the inspection mode toggle handler
  const handleInspectionToggle = useCallback(() => {
    if (toggleInspectionMode) {
      toggleInspectionMode();
    }
  }, [toggleInspectionMode]);

  // Early return if no components to render
  if (!pendingComponents || pendingComponents.length === 0) {
    return (
      <div className="w-1/2 pl-4 flex items-center justify-center bg-muted/10 rounded-lg border-2 border-dashed border-muted">
        <div className="text-center py-12">
          <p className="text-sm text-muted-foreground">No components to preview</p>
        </div>
      </div>
    );
  }

  // Render a simplified preview for now
  return (
    <div className="w-1/2 pl-4">
      <div className="relative mx-auto">
        {/* Inspection mode toggle - only show if editing */}
        {isEditing && (
          <div className="absolute top-2 right-2 z-10">
            <button
              onClick={handleInspectionToggle}
              className={cn(
                "px-2 py-1 text-xs rounded-md border transition-colors",
                inspectionMode
                  ? "bg-blue-500 text-white border-blue-500"
                  : "bg-background text-muted-foreground border-border hover:bg-muted/30"
              )}
              title={inspectionMode ? "Exit inspection mode" : "Enter inspection mode"}
            >
              {inspectionMode ? "Exit Inspect" : "Inspect"}
            </button>
          </div>
        )}
        
        <div 
          className="w-full overflow-hidden transition-all duration-300 border rounded-md shadow-sm"
          style={backgroundStyle}
        >
          {/* Simplified preview - will be enhanced later */}
          <div className="p-4 min-h-[300px]">
            <div className="text-center py-8">
              <h3 className="text-lg font-medium text-muted-foreground mb-2">Preview Mode</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {pendingComponents.length} component{pendingComponents.length !== 1 ? 's' : ''} ready for preview
              </p>
              <div className="space-y-2">
                {pendingComponents.map((component, index) => (
                  <div 
                    key={component.id} 
                    className="p-3 bg-muted/20 rounded-md border border-muted text-left"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{component.type}</span>
                      <span className="text-xs text-muted-foreground">#{index + 1}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

SectionPreview.displayName = 'SectionPreview';

export default SectionPreview;