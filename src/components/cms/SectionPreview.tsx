'use client';

import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import SectionManager, { Component } from './SectionManager';

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

const SectionPreview: React.FC<SectionPreviewProps> = ({
  pendingComponents = [],
  isEditing = false,
  inspectionMode = false,
  toggleInspectionMode = () => {},
  sectionBackground = 'white',
  sectionBackgroundType = 'gradient',
  setActiveComponentId = () => {},
  setCollapsedComponents = () => {},
  isEditingComponentRef
}) => {
  const [devicePreview, setDevicePreview] = useState<'desktop' | 'mobile'>('desktop');
  const previewContainerRef = useRef<HTMLDivElement>(null);

  // Add scroll observer to detect which component is in view
  useEffect(() => {
    if (!previewContainerRef.current || pendingComponents.length === 0) {
      return;
    }

    const previewContainer = previewContainerRef.current;
    
    // Create IntersectionObserver to detect which component is in view
    const observer = new IntersectionObserver(
      (entries) => {
        // Find entries that are intersecting and get the one with highest ratio
        const visibleEntries = entries.filter(entry => entry.isIntersecting);
        
        if (visibleEntries.length > 0) {
          // Sort by intersection ratio to find the most visible element
          visibleEntries.sort((a, b) => b.intersectionRatio - a.intersectionRatio);
          const mostVisibleEntry = visibleEntries[0];
          
          const componentId = mostVisibleEntry.target.getAttribute('data-component-id');
          if (componentId && setActiveComponentId) {
            setActiveComponentId(componentId);

            // Only auto-expand/collapse components when user isn't actively editing
            if (!isEditingComponentRef?.current) {
              // Expand the visible component and collapse others
              const newCollapsedState: Record<string, boolean> = {};
              pendingComponents.forEach(component => {
                newCollapsedState[component.id] = component.id !== componentId;
              });
              setCollapsedComponents(newCollapsedState);
            }
          }
        }
      },
      {
        root: previewContainer,
        rootMargin: '0px',
        threshold: [0, 0.25, 0.5, 0.75, 1], // Check multiple thresholds for better accuracy
      }
    );
    
    // Get all component elements in the preview container
    const componentElements = previewContainer.querySelectorAll('[data-component-id]');
    
    // Observe each component element
    componentElements.forEach(element => {
      observer.observe(element);
    });
    
    return () => {
      observer.disconnect();
    };
  }, [pendingComponents, setActiveComponentId, setCollapsedComponents, isEditingComponentRef]);

  return (
    <div className="w-1/2 pl-4 bg-background">
      <div className="relative">
        <div 
          className={cn(
            "w-full overflow-x-hidden transition-all duration-300 border rounded-md shadow-sm",
            devicePreview === 'desktop' ? 'h-auto min-h-[400px]' : 'mx-auto',
            devicePreview === 'mobile' ? 'w-[375px]' : 'w-full'
          )}
          style={{ position: 'relative', zIndex: 0 }}
          ref={previewContainerRef}
        >
          <div className="px-1">
            {/* Device preview switcher */}
            <div className="flex justify-between mb-2 p-2">
              {/* Inspect button on the left side */}
              {isEditing && (
                <button
                  onClick={toggleInspectionMode}
                  className={cn(
                    "flex items-center space-x-1 px-3 py-1.5 rounded text-sm shadow-md",
                    inspectionMode 
                      ? "bg-primary text-white hover:bg-primary/90" 
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  )}
                  title="Select elements on page to edit"
                >
                  <svg 
                    className="h-4 w-4 mr-1" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                  >
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="22" y1="12" x2="18" y2="12"></line>
                    <line x1="6" y1="12" x2="2" y2="12"></line>
                    <line x1="12" y1="6" x2="12" y2="2"></line>
                    <line x1="12" y1="22" x2="12" y2="18"></line>
                  </svg>
                  <span>{inspectionMode ? "Exit Inspection" : "Inspect Page"}</span>
                </button>
              )}
              
              <div className="flex items-center bg-background/80 p-0.5 rounded-full border border-muted">
                <button 
                  onClick={() => setDevicePreview('desktop')}
                  className={`flex items-center justify-center h-6 px-2 rounded-full text-xs transition-colors ${
                    devicePreview === 'desktop' 
                      ? 'bg-primary text-primary-foreground' 
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                  title="Vista de escritorio"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
                    <line x1="8" y1="21" x2="16" y2="21"></line>
                    <line x1="12" y1="17" x2="12" y2="21"></line>
                  </svg>
                  <span className="ml-1">Escritorio</span>
                </button>
                <button 
                  onClick={() => setDevicePreview('mobile')}
                  className={`flex items-center justify-center h-6 px-2 rounded-full text-xs transition-colors ${
                    devicePreview === 'mobile' 
                      ? 'bg-primary text-primary-foreground' 
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                  title="Vista móvil"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect>
                    <line x1="12" y1="18" x2="12" y2="18.01"></line>
                  </svg>
                  <span className="ml-1">Móvil</span>
                </button>
              </div>
            </div>

            {devicePreview === 'desktop' ? (
              // Desktop view with browser frame
              <div className="bg-white rounded-md border-2 border-muted/40 shadow-sm overflow-hidden">
                {/* Desktop content */}
                <div 
                  className="p-4 min-h-[300px] overflow-auto"
                  style={{
                    background: sectionBackground || 'white',
                    backgroundSize: sectionBackgroundType === 'image' ? 'cover' : undefined,
                    backgroundPosition: sectionBackgroundType === 'image' ? 'center' : undefined,
                    backgroundRepeat: sectionBackgroundType === 'image' ? 'no-repeat' : undefined
                  }}
                >
                  <SectionManager
                    initialComponents={pendingComponents}
                    isEditing={false}
                    componentClassName={(type) => {
                      // Allow headers to use their own positioning logic (sticky in preview)
                      const isVideoComponent = type.toLowerCase() === 'video';
                      let classNames = `component-${type.toLowerCase()}`;
                      
                      if (isVideoComponent) {
                        classNames += ' video-component';
                      }
                      
                      return classNames;
                    }}
                    sectionBackground={sectionBackground}
                    sectionBackgroundType={sectionBackgroundType}
                  />
                </div>
              </div>
            ) : (
              // Mobile view - iPhone style frame
              <div className="max-w-[375px] mx-auto">
                <div className="overflow-hidden rounded-[36px] border-[8px] border-black shadow-lg bg-black">
                  {/* Status bar */}
                  <div className="bg-black text-white relative h-8">
                    {/* Dynamic Island */}
                    <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-[35%] h-[22px] bg-black rounded-b-[18px] flex justify-center items-end pb-1">
                      <div className="h-2 w-2 rounded-full bg-zinc-700 mx-0.5"></div>
                      <div className="h-1 w-5 rounded-full bg-zinc-800 mx-0.5"></div>
                      <div className="h-2 w-2 rounded-full bg-zinc-700 mx-0.5"></div>
                    </div>
                    {/* Status icons */}
                    <div className="flex justify-between px-5 pt-1.5 text-[10px] font-medium">
                      <div>9:41</div>
                      <div className="flex items-center space-x-1.5">
                        <div className="w-3.5 h-3">
                          <svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                            <path d="M17 5.33C17.58 5.33 18.04 5.79 18.04 6.37V11.11C18.04 11.69 17.58 12.15 17 12.15C16.42 12.15 15.96 11.69 15.96 11.11V6.37C15.96 5.79 16.42 5.33 17 5.33ZM10.5 8.37C11.08 8.37 11.54 8.83 11.54 9.41V11.11C11.54 11.69 11.08 12.15 10.5 12.15C9.92 12.15 9.46 11.69 9.46 11.11V9.41C9.46 8.83 9.92 8.37 10.5 8.37ZM7.25 10.26C7.83 10.26 8.29 10.72 8.29 11.3V11.11C8.29 11.69 7.83 12.15 7.25 12.15C6.67 12.15 6.21 11.69 6.21 11.11V11.3C6.21 10.72 6.67 10.26 7.25 10.26ZM13.75 7.04C14.33 7.04 14.79 7.5 14.79 8.08V11.11C14.79 11.69 14.33 12.15 13.75 12.15C13.17 12.15 12.71 11.69 12.71 11.11V8.08C12.71 7.5 13.17 7.04 13.75 7.04Z"/>
                          </svg>
                        </div>
                        <div className="w-3.5 h-3">
                          <svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 2C7.58 2 4 5.58 4 10C4 14.42 7.58 18 12 18C16.42 18 20 14.42 20 10C20 5.58 16.42 2 12 2ZM7 9H17V11H7V9Z"/>
                          </svg>
                        </div>
                        <div className="w-4 h-3">
                          <svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                            <path d="M15.67 4H14V2H10V4H8.33C7.6 4 7 4.6 7 5.33V20.66C7 21.4 7.6 22 8.33 22H15.67C16.4 22 17 21.4 17 20.66V5.33C17 4.6 16.4 4 15.67 4ZM13 18H11V16H13V18ZM16.2 13.37C15.07 14.07 14.5 14.68 14.5 16H13.5V9.26C13.5 8.73 13.3 8.35 12.87 8.04C12.43 7.73 11.5 7.7 11.5 7.7C10.8 7.7 10.3 7.92 9.97 8.36C9.64 8.8 9.5 9.36 9.5 10.07H10.5C10.5 9.58 10.6 9.23 10.77 9.04C10.93 8.83 11.38 8.5 11.83 8.5C12.4 8.5 12.5 8.95 12.5 9.27V10.88C10.77 11.3 9.35 11.82 9.35 14.19C9.35 15.94 10.05 16.28 12.36 16.04V17.04H13.36V16.92C14.36 16.74 14.84 16.07 15.42 15.68C15.9 15.36 16.24 15.03 16.24 14.31C16.24 13.8 15.93 13.5 15.75 13.37H16.2Z"/>
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Content area */}
                  <div 
                    className="h-[600px] overflow-hidden"
                    style={{
                      background: sectionBackground || 'white',
                      backgroundSize: sectionBackgroundType === 'image' ? 'cover' : undefined,
                      backgroundPosition: sectionBackgroundType === 'image' ? 'center' : undefined,
                      backgroundRepeat: sectionBackgroundType === 'image' ? 'no-repeat' : undefined
                    }}
                  >
                    <div className="h-full overflow-y-auto">
                      <SectionManager
                        initialComponents={pendingComponents}
                        isEditing={false}
                        componentClassName={(type) => {
                          // Allow headers to use their own positioning logic (sticky in preview)
                          const isVideoComponent = type.toLowerCase() === 'video';
                          let classNames = `component-${type.toLowerCase()}`;
                          
                          if (isVideoComponent) {
                            classNames += ' video-component';
                          }
                          
                          return classNames;
                        }}
                        sectionBackground={sectionBackground}
                        sectionBackgroundType={sectionBackgroundType}
                      />
                    </div>
                  </div>
                  
                  {/* Home bar */}
                  <div className="h-8 bg-black flex justify-center items-center">
                    <div className="w-32 h-1.5 rounded-full bg-zinc-600/70"></div>
                  </div>
                </div>
                
                {/* Device label */}
                <div className="text-center text-xs text-muted-foreground mt-2">
                  iPhone 14 Pro
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SectionPreview;