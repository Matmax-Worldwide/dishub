import { useState, useEffect, useCallback } from 'react';
import { MediaItem } from './types';

interface UseMediaLibraryProps {
  initialItems?: MediaItem[];
}

// Sample data for development when S3 is not configured
const FALLBACK_MEDIA_ITEMS: MediaItem[] = [
  {
    id: 'fallback-1',
    title: 'Sample Image',
    description: 'This is a sample image for development',
    fileUrl: 'https://images.unsplash.com/photo-1604537466158-719b1972feb8',
    fileName: 'sample-image.jpg',
    fileSize: 1240000,
    fileType: 'image/jpeg',
    altText: 'Sample development image',
    uploadedAt: new Date().toISOString().split('T')[0],
    dimensions: '1920x1080'
  },
  {
    id: 'fallback-2',
    title: 'Sample Document',
    description: 'This is a sample document for development',
    fileUrl: '/documents/sample.pdf',
    fileName: 'sample-document.pdf',
    fileSize: 2450000,
    fileType: 'application/pdf',
    uploadedAt: new Date().toISOString().split('T')[0],
  }
];

export function useMediaLibrary({ initialItems = [] }: UseMediaLibraryProps = {}) {
  const [isLoading, setIsLoading] = useState(true);
  const [mediaItems, setMediaItems] = useState<MediaItem[]>(initialItems);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isConfigError, setIsConfigError] = useState(false);

  // Fetch media items using API route
  const fetchMediaItems = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setIsConfigError(false);
    
    try {
      console.log('Fetching media items from API...');
      const response = await fetch('/api/media/list', {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        cache: 'no-store',
      });
      
      console.log(`API response status: ${response.status} ${response.statusText}`);
      
      if (!response.ok) {
        // Try to get more details from the error response
        let errorDetail = '';
        try {
          const errorData = await response.json();
          errorDetail = errorData.error || '';
        } catch (_unused) {
          // Ignore JSON parsing errors
        }
        
        throw new Error(`API Error: ${response.status} ${response.statusText}${errorDetail ? ` - ${errorDetail}` : ''}`);
      }
      
      const data = await response.json();
      console.log(`API returned ${data.items?.length || 0} items`);
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      if (data.items) {
        setMediaItems(data.items);
      } else {
        setMediaItems([]);
      }
    } catch (err: unknown) {
      console.error('Error fetching media items:', err);
      
      // Check if it's a configuration error or API error
      const errorMessage = err instanceof Error ? err.message : String(err);
      
      if (errorMessage.includes('Failed to fetch') || errorMessage.includes('Network Error')) {
        console.warn('API route not accessible. Using fallback data for development.');
        setIsConfigError(true);
        setError('API route not accessible. Check server logs for details.');
        setMediaItems(FALLBACK_MEDIA_ITEMS);
      } else {
        setError(`Failed to load media items: ${errorMessage}`);
        
        // In development mode, use fallback data
        if (process.env.NODE_ENV === 'development') {
          console.log('Using fallback media items for development');
          setMediaItems(FALLBACK_MEDIA_ITEMS);
        }
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMediaItems();
  }, [fetchMediaItems]);

  // File upload handling with API route
  const handleFileUpload = async (files: FileList) => {
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      setUploadProgress(0);
      setError(null);
      
      try {
        // Create FormData for the file
        const formData = new FormData();
        formData.append('file', file);
        
        // Upload progress simulation (since fetch doesn't provide progress)
        setUploadProgress(10);
        setTimeout(() => setUploadProgress(30), 500);
        setTimeout(() => setUploadProgress(50), 1000);
        
        // Send to upload API route
        const response = await fetch('/api/media/upload', {
          method: 'POST',
          body: formData,
        });
        
        setUploadProgress(90);
        
        if (!response.ok) {
          throw new Error(`API Error: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        
        if (data.error) {
          throw new Error(data.error);
        }
        
        // Create media item from response
        const newMediaItem: MediaItem = {
          id: `s3-${Date.now()}`,
          title: file.name.split('.')[0],
          fileUrl: data.url,
          fileName: data.fileName,
          fileSize: data.fileSize,
          fileType: data.fileType,
          uploadedAt: new Date().toISOString().split('T')[0],
          s3Key: data.key
        };
        
        // Add to media items
        setMediaItems(prev => [newMediaItem, ...prev]);
        setUploadProgress(100);
      } catch (error: unknown) {
        console.error('Error uploading file:', error);
        
        const errorMessage = error instanceof Error ? error.message : String(error);
        setError(`Failed to upload file: ${errorMessage}`);
      } finally {
        // Reset progress after a short delay to show completion
        setTimeout(() => setUploadProgress(null), 500);
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

  // Delete item with API route
  const deleteItem = async (id: string) => {
    if (confirm(`Are you sure you want to delete this item?`)) {
      const itemToDelete = mediaItems.find(item => item.id === id);
      
      if (itemToDelete && itemToDelete.s3Key) {
        try {
          // Send to delete API route
          const response = await fetch('/api/media/delete', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ key: itemToDelete.s3Key })
          });
          
          if (!response.ok) {
            throw new Error(`API Error: ${response.status} ${response.statusText}`);
          }
          
          const data = await response.json();
          
          if (data.error) {
            throw new Error(data.error);
          }
          
          // Remove from local state
          setMediaItems(mediaItems.filter(item => item.id !== id));
          setSelectedItems(prev => prev.filter(itemId => itemId !== id));
          setError(null);
        } catch (error: unknown) {
          console.error('Error deleting file:', error);
          
          const errorMessage = error instanceof Error ? error.message : String(error);
          setError(`Failed to delete file: ${errorMessage}`);
        }
      } else {
        // Handle case when s3Key is missing (older items)
        setMediaItems(mediaItems.filter(item => item.id !== id));
        setSelectedItems(prev => prev.filter(itemId => itemId !== id));
      }
    }
  };

  // Delete selected items with API route
  const deleteSelectedItems = async () => {
    if (!selectedItems.length) return;
    
    if (confirm(`Are you sure you want to delete ${selectedItems.length} selected item(s)?`)) {
      // Track any failures
      let hasErrors = false;
      
      // Copy arrays to avoid mutation issues during deletion
      const itemsToDelete = [...selectedItems];
      
      for (const id of itemsToDelete) {
        const itemToDelete = mediaItems.find(item => item.id === id);
        
        if (itemToDelete && itemToDelete.s3Key) {
          try {
            // Send to delete API route
            const response = await fetch('/api/media/delete', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({ key: itemToDelete.s3Key })
            });
            
            if (!response.ok) {
              throw new Error(`API Error: ${response.status} ${response.statusText}`);
            }
            
            const data = await response.json();
            
            if (data.error) {
              throw new Error(data.error);
            }
          } catch (error) {
            console.error('Error deleting file:', error);
            hasErrors = true;
          }
        }
      }
      
      // Update state after all delete operations
      setMediaItems(mediaItems.filter(item => !selectedItems.includes(item.id)));
      setSelectedItems([]);
      
      if (hasErrors) {
        setError('Some files could not be deleted. Please refresh and try again.');
      } else {
        setError(null);
      }
    }
  };

  // Refresh media items
  const refreshMediaItems = () => {
    fetchMediaItems();
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
    error,
    isConfigError,
    setSearchQuery,
    setFilterType,
    setViewMode,
    toggleItemSelection,
    toggleSelectAll,
    handleFileUpload,
    deleteItem,
    deleteSelectedItems,
    refreshMediaItems
  };
} 