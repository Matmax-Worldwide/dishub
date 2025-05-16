import { useState, useEffect } from 'react';
import { MediaItem } from './types';
import { uploadToS3, createMediaItemFromUpload } from './aws-utils';

interface UseMediaLibraryProps {
  initialItems?: MediaItem[];
}

export function useMediaLibrary({ initialItems = [] }: UseMediaLibraryProps = {}) {
  const [isLoading, setIsLoading] = useState(true);
  const [mediaItems, setMediaItems] = useState<MediaItem[]>(initialItems);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

  // Fetch media items on mount
  useEffect(() => {
    // In a real app, you would fetch media items from an API
    if (initialItems.length === 0) {
      const timer = setTimeout(() => {
        const dummyMediaItems: MediaItem[] = [
          {
            id: '1',
            title: 'Hero Image',
            description: 'Main homepage hero background',
            fileUrl: 'https://images.unsplash.com/photo-1604537466158-719b1972feb8',
            fileName: 'hero-image.jpg',
            fileSize: 1240000,
            fileType: 'image/jpeg',
            altText: 'People working in a modern office',
            uploadedAt: '2023-10-15',
            dimensions: '1920x1080'
          },
          {
            id: '2',
            title: 'Product Brochure',
            description: 'PDF brochure for services',
            fileUrl: '/documents/brochure.pdf',
            fileName: 'company-brochure.pdf',
            fileSize: 3540000,
            fileType: 'application/pdf',
            uploadedAt: '2023-10-12'
          },
          // Add more dummy items as needed
        ];
        setMediaItems(dummyMediaItems);
        setIsLoading(false);
      }, 1000);

      return () => clearTimeout(timer);
    } else {
      setIsLoading(false);
    }
  }, [initialItems]);

  // File upload handling
  const handleFileUpload = async (files: FileList) => {
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      setUploadProgress(0);
      
      try {
        // Upload file to S3
        const uploadedUrl = await uploadToS3(file, setUploadProgress);
        
        // Create media item
        const newMediaItem = createMediaItemFromUpload(file, uploadedUrl);
        
        // Add to media items
        setMediaItems(prev => [newMediaItem, ...prev]);
      } catch (error) {
        console.error('Error uploading file:', error);
        // Handle error - show notification, etc.
      } finally {
        setUploadProgress(null);
      }
    }
  };

  // Item selection
  const toggleItemSelection = (id: string) => {
    setSelectedItems(prev => 
      prev.includes(id) 
        ? prev.filter(item => item !== id)
        : [...prev, id]
    );
  };

  // Select/deselect all
  const toggleSelectAll = () => {
    if (selectedItems.length === filteredMedia.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(filteredMedia.map(item => item.id));
    }
  };

  // Delete items
  const deleteItem = (id: string) => {
    if (confirm(`Are you sure you want to delete this item?`)) {
      // In real-world app, would delete from S3 as well
      setMediaItems(mediaItems.filter(item => item.id !== id));
      setSelectedItems(prev => prev.filter(itemId => itemId !== id));
    }
  };

  // Delete selected items
  const deleteSelectedItems = () => {
    if (!selectedItems.length) return;
    
    if (confirm(`Are you sure you want to delete ${selectedItems.length} selected item(s)?`)) {
      setMediaItems(mediaItems.filter(item => !selectedItems.includes(item.id)));
      setSelectedItems([]);
    }
  };

  // Filter media items
  const filteredMedia = mediaItems
    .filter(item => {
      // Apply search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          item.title.toLowerCase().includes(query) || 
          item.fileName.toLowerCase().includes(query) ||
          (item.description?.toLowerCase().includes(query) || false)
        );
      }
      return true;
    })
    .filter(item => {
      // Apply type filter
      if (filterType !== 'all') {
        if (filterType === 'image' && !item.fileType.startsWith('image/')) return false;
        if (filterType === 'video' && !item.fileType.startsWith('video/')) return false;
        if (filterType === 'document' && !['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'].includes(item.fileType)) return false;
      }
      return true;
    });

  return {
    isLoading,
    mediaItems,
    filteredMedia,
    searchQuery,
    filterType,
    viewMode,
    selectedItems,
    uploadProgress,
    setSearchQuery,
    setFilterType,
    setViewMode,
    toggleItemSelection,
    toggleSelectAll,
    handleFileUpload,
    deleteItem,
    deleteSelectedItems
  };
} 