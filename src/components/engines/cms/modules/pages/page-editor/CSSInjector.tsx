'use client';

import React, { useEffect } from 'react';

/**
 * This component injects the necessary CSS for draggable components
 * Used as a fallback in case the global CSS import doesn't work
 */
const CSSInjector: React.FC = () => {
  useEffect(() => {
    // Add a style tag with the necessary CSS
    const styleTag = document.createElement('style');
    styleTag.textContent = `
      /* CSS for CMS Editor components */
      /* Drag handle styles */
      .component-drag-handle {
        cursor: grab;
        opacity: 0;
        transition: opacity 0.2s ease-in-out;
      }
      
      .component-drag-handle:active {
        cursor: grabbing;
      }
      
      /* Show drag handle and controls when hovering over the component */
      .section-components .group:hover .component-drag-handle,
      .section-components .group:hover .component-controls {
        opacity: 1;
      }
      
      /* Position component reordering controls */
      .component-reorder-controls {
        position: relative;
        z-index: 20;
      }
      
      /* Component being dragged */
      .component-dragging {
        opacity: 0.7;
        box-shadow: 0 5px 10px rgba(0, 0, 0, 0.15);
        background-color: var(--background);
        border: 1px dashed var(--border);
      }
      
      /* Component drop indicator */
      .component-drop-indicator {
        height: 2px;
        margin: 8px 0;
        background-color: var(--primary);
        border-radius: 1px;
        box-shadow: 0 0 0 1px var(--primary);
        opacity: 0;
        transition: opacity 0.2s ease-in-out;
      }
      
      .component-drop-indicator.active {
        opacity: 1;
      }
      
      /* Component controls positioned correctly in editor */
      .component-controls {
        position: absolute;
        top: 4px;
        right: 4px;
        display: flex;
        gap: 4px;
        opacity: 0;
        transition: opacity 0.2s ease-in-out;
        z-index: 10;
      }

      /* Ensure modals and dialogs always have the highest z-index */
      .fixed.inset-0[class*="z-[9999]"] {
        z-index: 9999 !important;
        position: fixed !important;
        isolation: isolate !important;
      }

      /* Ensure content within modals has correct stacking */
      .fixed.inset-0[class*="z-[9999]"] > * {
        z-index: 10000 !important;
        position: relative !important;
      }

      /* Ensure dialog content is always at the top */
      [class*="DialogContent"],
      [role="dialog"] {
        z-index: 9999 !important;
        position: relative !important;
      }

      /* Prevent section preview from appearing over modals and dialogs */
      .benefit-section, 
      [data-component-type="benefit"],
      .hero-section,
      [data-component-type="hero"],
      .preview-container {
        z-index: 1 !important;
        position: relative !important;
      }

      /* Improve modal backdrop */
      .fixed.inset-0.bg-black\/50 {
        background-color: rgba(0, 0, 0, 0.75) !important;
      }

      /* CSS for drag and drop functionality */
      .section-container {
        position: relative;
        transition: padding 0.2s ease-in-out;
      }
      
      .section-container.dragging {
        opacity: 0.5;
      }
      
      .section-container.drag-over {
        padding-top: 30px;
        padding-bottom: 30px;
      }
      
      .drag-handle {
        cursor: grab;
        z-index: 20;
      }
      
      .section-controls {
        position: absolute;
        top: 0;
        right: 0;
        padding: 5px;
        z-index: 10;
      }
      
      /* Ensure modals and dialogs always have the highest z-index */
      .modal, .dialog, .popover {
        z-index: 9999 !important;
      }
      
      /* Make the media selector appear above everything else */
      .media-selector-overlay,
      #media-selector-root,
      [id^="media-selector"] {
        z-index: 2147483647 !important; /* Máximo z-index posible */
        position: fixed !important;
        isolation: isolate !important;
      }
      
      /* Ensure the MediaSelector and its children have proper stacking */
      .media-selector-overlay > *,
      #media-selector-root > *,
      [id^="media-selector"] > * {
        z-index: 2147483647 !important; 
        position: relative !important;
      }
      
      /* Específicamente para portales montados en el body */
      body > [id^="media-selector"],
      body > .fixed.inset-0 {
        z-index: 2147483647 !important;
      }
      
      /* Special selector for the HeaderSection MediaSelector */
      body > .fixed.inset-0[style*="z-index: 2147483647"] {
        z-index: 2147483647 !important;
      }
      
      /* Priority levels for z-index */
      .z-priority-high {
        z-index: 9999 !important;
      }
      
      .z-priority-highest {
        z-index: 999999 !important;
      }
      
      .z-priority-lower {
        z-index: 1 !important;
      }
    `;
    document.head.appendChild(styleTag);
    
    // Clean up function removes the style element when component unmounts
    return () => {
      document.head.removeChild(styleTag);
    };
  }, []);
  
  return null;
};

export default CSSInjector; 