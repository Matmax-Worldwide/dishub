'use client';

import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Palette, Image, X, Check } from 'lucide-react';

interface BackgroundSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (background: string, type: 'image' | 'gradient') => void;
  currentBackground?: string;
  onOpenMediaSelector?: () => void;
}

// Define a template type for consistency
interface BackgroundTemplate {
  label: string;
  value: string;
  type: 'image' | 'gradient';
}

// Export the background templates to be reused elsewhere if needed
export const BACKGROUND_TEMPLATES: BackgroundTemplate[] = [
  {
    label: 'Blue Gradient',
    value: 'linear-gradient(to bottom right, #01112A, #01319c, #1E0B4D)',
    type: 'gradient'
  },
  {
    label: 'Purple Gradient',
    value: 'linear-gradient(to bottom right, #3b0764, #6b21a8, #581c87)',
    type: 'gradient'
  },
  {
    label: 'Teal Gradient',
    value: 'linear-gradient(to bottom right, #042f2e, #0f766e, #115e59)',
    type: 'gradient'
  },
  {
    label: 'Sunset Gradient',
    value: 'linear-gradient(to bottom right, #7c2d12, #c2410c, #ea580c)',
    type: 'gradient'
  },
  {
    label: 'Forest Gradient',
    value: 'linear-gradient(to bottom right, #14532d, #15803d, #16a34a)',
    type: 'gradient'
  },
  {
    label: 'Gray Gradient',
    value: 'linear-gradient(to bottom right, #1f2937, #4b5563, #6b7280)',
    type: 'gradient'
  },
  {
    label: 'Light Blue',
    value: 'linear-gradient(to bottom, white, #dbeafe)',
    type: 'gradient'
  },
  {
    label: 'Light Purple',
    value: 'linear-gradient(to bottom, white, #ede9fe)',
    type: 'gradient'
  },
  {
    label: 'Light Teal',
    value: 'linear-gradient(to bottom, white, #ccfbf1)',
    type: 'gradient'
  }
];

export default function BackgroundSelector({
  isOpen,
  onClose,
  onSelect,
  currentBackground = '',
  onOpenMediaSelector
}: BackgroundSelectorProps) {
  const [selectedTab, setSelectedTab] = useState<string>('templates');
  
  // Determine if the current background is an image URL or gradient
  const isCurrentImage = currentBackground && (
    currentBackground.startsWith('http') || 
    currentBackground.startsWith('/') || 
    currentBackground.startsWith('data:')
  );

  // Set initial tab based on current background
  useEffect(() => {
    if (isCurrentImage) {
      setSelectedTab('media');
    }
  }, [isCurrentImage]);

  // Close on escape key
  useEffect(() => {
    const handleEscapeKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    
    if (isOpen) {
      window.addEventListener('keydown', handleEscapeKey);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    }
    
    return () => {
      window.removeEventListener('keydown', handleEscapeKey);
      document.body.style.overflow = 'unset';
    };
  }, [onClose, isOpen]);



  // Handler for template selection
  const handleTemplateSelect = (template: BackgroundTemplate) => {
    onSelect(template.value, template.type);
    onClose();
  };

  // Handle backdrop click
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Prevent modal from closing when clicking inside
  const handleModalClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  // Handle media selector button click
  const handleMediaSelectorClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onOpenMediaSelector) {
      onOpenMediaSelector();
    }
  };

  if (!isOpen) return null;

  return (
    <div 
        className="fixed inset-0 bg-black/50 flex items-center justify-center p-4"
        style={{ zIndex: 2147483647 }} // Maximum safe z-index to ensure it appears above everything
        onClick={handleBackdropClick}
      >
        <div 
          className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[80vh] overflow-hidden flex flex-col"
          onClick={handleModalClick}
          style={{ isolation: 'isolate' }} // Create new stacking context
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Select Background</h2>
            <button 
              onClick={onClose}
              className="rounded-full p-1 hover:bg-gray-100 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          
          {/* Content */}
          <div className="flex-1 overflow-hidden p-6">
            <Tabs 
              defaultValue={selectedTab} 
              value={selectedTab} 
              onValueChange={setSelectedTab} 
              className="flex-1 flex flex-col overflow-hidden h-full"
            >
              <TabsList className="mb-4">
                <TabsTrigger 
                  value="templates" 
                  className="flex items-center gap-1"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Palette className="w-4 h-4" />
                  Gradient Templates
                </TabsTrigger>
                <TabsTrigger 
                  value="media" 
                  className="flex items-center gap-1"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Image className="w-4 h-4" />
                  Media Library
                </TabsTrigger>
              </TabsList>
              
              <div className="flex-1 overflow-hidden">
                <TabsContent value="templates" className="h-full overflow-auto m-0 data-[state=active]:flex-1">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {BACKGROUND_TEMPLATES.map((template, index) => (
                      <div 
                        key={index}
                        className={`relative h-32 rounded-md cursor-pointer overflow-hidden transition-all hover:opacity-90 hover:shadow-md ${
                          currentBackground === template.value ? 'ring-2 ring-blue-500 ring-offset-2' : 'border border-gray-200'
                        }`}
                        style={{ background: template.value }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleTemplateSelect(template);
                        }}
                      >
                        {currentBackground === template.value && (
                          <div className="absolute top-2 right-2 bg-blue-500 rounded-full p-1">
                            <Check className="h-4 w-4 text-white" />
                          </div>
                        )}
                        <div className="absolute bottom-0 left-0 right-0 bg-black/40 text-white text-xs p-2">
                          {template.label}
                        </div>
                      </div>
                    ))}
                  </div>
                </TabsContent>
                
                <TabsContent value="media" className="h-full overflow-auto m-0 data-[state=active]:flex-1">
                  <div className="flex flex-col items-center justify-center py-8">
                    {isCurrentImage && (
                      <div className="mb-8">
                        <p className="text-sm text-gray-500 mb-2">Current background image:</p>
                        <div 
                          className="h-40 w-full rounded-md border border-gray-200 bg-contain bg-center bg-no-repeat" 
                          style={{ backgroundImage: `url(${currentBackground})` }}
                        />
                      </div>
                    )}
                    
                    <button
                      onClick={handleMediaSelectorClick}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                    >
                      Browse Media Library
                    </button>
                    
                    <p className="text-sm text-gray-500 mt-4">
                      Select an image from your media library to use as a background.
                    </p>
                  </div>
                </TabsContent>
              </div>
            </Tabs>
          </div>
        </div>
      </div>
  );
} 