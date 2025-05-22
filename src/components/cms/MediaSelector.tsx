'use client';

import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MediaLibrary } from '@/components/cms/media/MediaLibrary';
import { MediaItem } from '@/components/cms/media/types';
import { Search, FolderOpen, Upload, X } from 'lucide-react';

interface MediaSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (mediaItem: MediaItem) => void;
  title?: string;
  initialType?: 'image' | 'video' | 'any';
  allowUpload?: boolean;
}

export default function MediaSelector({
  isOpen,
  onClose,
  onSelect,
  title = 'Select Media',
  initialType = 'image',
  allowUpload = true
}: MediaSelectorProps) {
  const [selectedTab, setSelectedTab] = useState<string>('browse');
  const [mediaType, setMediaType] = useState<'image' | 'video' | 'any'>(initialType);
  const [searchQuery, setSearchQuery] = useState('');

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

  // Handler for media selection
  const handleMediaSelect = (item: MediaItem) => {
    onSelect(item);
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

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center p-4"
      style={{ zIndex: 2147483646 }} // One level below BackgroundSelector
      onClick={handleBackdropClick}
    >
      <div 
        className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[80vh] overflow-hidden flex flex-col"
        onClick={handleModalClick}
        style={{ isolation: 'isolate' }} // Create new stacking context
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
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
            defaultValue="browse" 
            value={selectedTab} 
            onValueChange={setSelectedTab} 
            className="flex-1 flex flex-col overflow-hidden h-full"
          >
            <div className="flex items-center justify-between mb-4">
              <TabsList>
                <TabsTrigger 
                  value="browse" 
                  className="flex items-center gap-1"
                  onClick={(e) => e.stopPropagation()}
                >
                  <FolderOpen className="w-4 h-4" />
                  Browse Library
                </TabsTrigger>
                {allowUpload && (
                  <TabsTrigger 
                    value="upload" 
                    className="flex items-center gap-1"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Upload className="w-4 h-4" />
                    Upload New
                  </TabsTrigger>
                )}
              </TabsList>
              
              <div className="relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search media..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  className="pl-8 pr-4 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 w-[200px]"
                />
              </div>
            </div>
            
            <div className="flex-1 overflow-hidden">
              <TabsContent value="browse" className="h-full overflow-hidden flex flex-col m-0 data-[state=active]:flex-1">
                <div className="flex gap-2 mb-4">
                  <select 
                    value={mediaType}
                    onChange={(e) => setMediaType(e.target.value as 'image' | 'video' | 'any')}
                    onClick={(e) => e.stopPropagation()}
                    className="px-3 py-1 rounded-md border text-sm"
                  >
                    <option value="any">All Types</option>
                    <option value="image">Images</option>
                    <option value="video">Videos</option>
                  </select>
                </div>
                
                <div className="flex-1 overflow-y-auto">
                  <MediaLibrary 
                    onSelect={handleMediaSelect}
                    isSelectionMode={true}
                  />
                </div>
              </TabsContent>
              
              <TabsContent value="upload" className="h-full overflow-auto m-0 data-[state=active]:flex-1">
                <div className="p-4 bg-gray-50 rounded-lg border border-dashed border-gray-300 text-center">
                  <Upload className="mx-auto h-12 w-12 text-gray-400" />
                  <p className="mt-2 text-sm text-gray-600">
                    Drop files here or click to upload
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Supports: JPG, PNG, GIF, SVG, MP4, WebM
                  </p>
                  <button
                    className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                    onClick={(e) => e.stopPropagation()}
                  >
                    Select Files
                  </button>
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>
    </div>
  );
} 