import { useState, useEffect, useCallback, useReducer } from 'react';
import { MediaItem, Folder, MediaLibraryState } from './types';
import { getCachedMediaItems, getCachedFolders } from '@/lib/media-cache';

interface UseMediaLibraryProps {
  initialItems?: MediaItem[];
}

// Root folder definition
const ROOT_FOLDER: Folder = {
  id: 'root',
  name: 'Media Library',
  path: '',
  parentPath: '',
  isRoot: true
};


// Initial state for the media library
const initialMediaState: MediaLibraryState = {
  currentFolder: ROOT_FOLDER,
  folderHistory: [],
  folders: [],
  mediaItems: [],
  isLoading: true,
  error: null
};

// Reducer function to handle media library state
type MediaLibraryAction = 
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_MEDIA_ITEMS'; payload: MediaItem[] }
  | { type: 'SET_FOLDERS'; payload: Folder[] }
  | { type: 'NAVIGATE_FOLDER'; payload: Folder }
  | { type: 'NAVIGATE_BACK' }
  | { type: 'ADD_FOLDER'; payload: Folder }
  | { type: 'UPDATE_FOLDER'; payload: { id: string; update: Partial<Folder> } }
  | { type: 'REMOVE_FOLDER'; payload: string }
  | { type: 'ADD_MEDIA_ITEM'; payload: MediaItem }
  | { type: 'UPDATE_MEDIA_ITEM'; payload: { id: string; update: Partial<MediaItem> } }
  | { type: 'REMOVE_MEDIA_ITEM'; payload: string }
  | { type: 'UPDATE_MEDIA_ITEMS_IN_FOLDER'; payload: { folderPath: string; newFolderPath: string } };

function mediaLibraryReducer(state: MediaLibraryState, action: MediaLibraryAction): MediaLibraryState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'SET_MEDIA_ITEMS':
      return { ...state, mediaItems: action.payload };
    case 'SET_FOLDERS':
      return { ...state, folders: action.payload };
    case 'NAVIGATE_FOLDER':
      return { 
        ...state, 
        currentFolder: action.payload,
        folderHistory: [...state.folderHistory, state.currentFolder]
      };
    case 'NAVIGATE_BACK':
      if (state.folderHistory.length === 0) return state;
      const previousFolder = state.folderHistory[state.folderHistory.length - 1];
      return {
        ...state,
        currentFolder: previousFolder,
        folderHistory: state.folderHistory.slice(0, -1)
      };
    case 'ADD_FOLDER':
      return {
        ...state,
        folders: [...state.folders, action.payload]
      };
    case 'UPDATE_FOLDER':
      return {
        ...state,
        folders: state.folders.map(folder => 
          folder.id === action.payload.id ? { ...folder, ...action.payload.update } : folder
        )
      };
    case 'REMOVE_FOLDER':
      return {
        ...state,
        folders: state.folders.filter(folder => folder.id !== action.payload)
      };
    case 'ADD_MEDIA_ITEM':
      return {
        ...state,
        mediaItems: [action.payload, ...state.mediaItems]
      };
    case 'UPDATE_MEDIA_ITEM':
      return {
        ...state,
        mediaItems: state.mediaItems.map(item => 
          item.id === action.payload.id ? { ...item, ...action.payload.update } : item
        )
      };
    case 'REMOVE_MEDIA_ITEM':
      return {
        ...state,
        mediaItems: state.mediaItems.filter(item => item.id !== action.payload)
      };
    case 'UPDATE_MEDIA_ITEMS_IN_FOLDER':
      const { folderPath, newFolderPath } = action.payload;
      
      // Normalize paths to ensure consistent matching
      const normalizedFolderPath = folderPath.endsWith('/') ? folderPath : `${folderPath}/`;
      const normalizedNewPath = newFolderPath.endsWith('/') ? newFolderPath : `${newFolderPath}/`;
      
      return {
        ...state,
        mediaItems: state.mediaItems.map(item => {
          // Skip items not in this folder
          if (!item.s3Key || !item.s3Key.startsWith(normalizedFolderPath)) {
            return item;
          }
          
          // Get the part of the key after the folder path
          const fileNamePart = item.s3Key.substring(normalizedFolderPath.length);
          const newS3Key = `${normalizedNewPath}${fileNamePart}`;
          
          // Return updated item
          return {
            ...item,
            s3Key: newS3Key,
            folder: newFolderPath
          };
        })
      };
    default:
      return state;
  }
}

export function useMediaLibrary({ initialItems = [] }: UseMediaLibraryProps = {}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [isConfigError, setIsConfigError] = useState(false);
  const [sortField, setSortField] = useState<keyof MediaItem>('uploadedAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc'); // Newest first by default

  // Use reducer for complex state management
  const [state, dispatch] = useReducer(mediaLibraryReducer, {
    ...initialMediaState,
    mediaItems: initialItems
  });
  
  const { currentFolder, folders, mediaItems, isLoading, error } = state;

  // Fetch media items and folders
  const fetchMediaContent = useCallback(async () => {
    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });
    setIsConfigError(false);
    
    try {
      console.log(`Fetching media content for folder: ${currentFolder.path}`);
      
      // Try to get from cache first, fallback to original API calls if cache fails
      try {
        const [itemsData, foldersData] = await Promise.all([
          getCachedMediaItems(currentFolder.path),
          getCachedFolders(currentFolder.path)
        ]);
        
        // Set media items
        dispatch({ type: 'SET_MEDIA_ITEMS', payload: itemsData });
        
        // foldersData from cache is already a Folder[] array, so we can use it directly
        // but we need to ensure each folder has a valid ID
        const foldersList: Folder[] = foldersData.map((folder, index) => {
          // Ensure folder has a valid ID - only fallback if ID is truly missing
          const validId = folder.id && folder.id.trim() ? folder.id : `folder-${folder.path || `unknown-${index}`}`;
          
          return {
            ...folder,
            id: validId
            // Keep the original name from the cache - it should be the real folder name from S3
          };
        });
        
        dispatch({ type: 'SET_FOLDERS', payload: foldersList });
        
      } catch (cacheError) {
        console.warn('Cache failed, falling back to direct API calls:', cacheError);
        
        // Fallback to original API calls
        const itemsResponse = await fetch(`/api/media/list?prefix=${encodeURIComponent(currentFolder.path)}`, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          },
          cache: 'no-store',
        });
        
        if (!itemsResponse.ok) {
          throw new Error(`API Error: ${itemsResponse.status} ${itemsResponse.statusText}`);
        }
        
        const itemsData = await itemsResponse.json();
        
        if (itemsData.error) {
          throw new Error(itemsData.error);
        }
        
        // Set media items
        if (itemsData.items) {
          dispatch({ type: 'SET_MEDIA_ITEMS', payload: itemsData.items });
        } else {
          dispatch({ type: 'SET_MEDIA_ITEMS', payload: [] });
        }
        
        // Then fetch folders 
        const foldersResponse = await fetch(`/api/media/folders?prefix=${encodeURIComponent(currentFolder.path)}`, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          },
          cache: 'no-store',
        });
        
        if (!foldersResponse.ok) {
          throw new Error(`API Error: ${foldersResponse.status} ${foldersResponse.statusText}`);
        }
        
        const foldersData = await foldersResponse.json();
        
        if (foldersData.error) {
          throw new Error(foldersData.error);
        }
        
        // Map folder data to our Folder interface with item counts
        const foldersList: Folder[] = foldersData.folders.map((folderName: string, index: number) => {
          // Ensure folderName is valid and not empty
          const validFolderName = folderName && folderName.trim() ? folderName.trim() : `folder-${index}`;
          
          const folderPath = currentFolder.path 
            ? `${currentFolder.path}/${validFolderName}` 
            : validFolderName;
            
          // Count items in this folder from the just-fetched data
          let itemsInFolder;
          
          // Special case for root folder
          if (folderPath === '' || folderPath === '/') {
            itemsInFolder = itemsData.filter((item: { s3Key?: string }) => {
              if (!item.s3Key) return false;
              
              // For root folder, count items that don't have a slash 
              // or items where the first slash is also the last slash (no subdirectories)
              const firstSlashIndex = item.s3Key.indexOf('/');
              return firstSlashIndex === -1 || firstSlashIndex === item.s3Key.lastIndexOf('/');
            });
          } else {
            // For other folders, count items directly in this folder (not in subfolders)
            const folderPathWithSlash = folderPath.endsWith('/') ? folderPath : `${folderPath}/`;
            itemsInFolder = itemsData.filter((item: { s3Key?: string }) => {
              if (!item.s3Key) return false;
              
              // The item must start with the folder path
              if (!item.s3Key.startsWith(folderPathWithSlash)) {
                return false;
              }
              
              // And must not have additional slashes after the folder path
              // (which would indicate it's in a subfolder)
              const remainingPath = item.s3Key.substring(folderPathWithSlash.length);
              return !remainingPath.includes('/');
            });
          }
          
          // Get subfolder count from the new folderDetails API response
          let subfolderCount = 0;
          if (foldersData.folderDetails && foldersData.folderDetails[index]) {
            subfolderCount = foldersData.folderDetails[index].subfolderCount || 0;
          }
            
          return {
            id: `folder-${folderPath}`,
            name: validFolderName,
            path: folderPath,
            parentPath: currentFolder.path,
            isRoot: false,
            itemCount: itemsInFolder.length,
            subfolderCount
          };
        });
        
        dispatch({ type: 'SET_FOLDERS', payload: foldersList });
      }
      
    } catch (error) {
      console.error('Error fetching media content:', error);
      
      if (error instanceof Error) {
        if (error.message.includes('AWS S3 is not properly configured')) {
          setIsConfigError(true);
          dispatch({ type: 'SET_ERROR', payload: 'AWS S3 configuration error. Please check your environment variables.' });
        } else {
          dispatch({ type: 'SET_ERROR', payload: error.message });
        }
      } else {
        dispatch({ type: 'SET_ERROR', payload: 'An unexpected error occurred while fetching media content.' });
      }
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [currentFolder.path]);

  useEffect(() => {
    fetchMediaContent();
  }, [fetchMediaContent]);

  // Navigate to a folder
  const navigateToFolder = (folder: Folder) => {
    dispatch({ type: 'NAVIGATE_FOLDER', payload: folder });
  };
  
  // Navigate back to previous folder
  const navigateBack = () => {
    dispatch({ type: 'NAVIGATE_BACK' });
  };
  
  // Utility function to sanitize folder and file names
  const sanitizeName = (name: string): string => {
    if (!name) return '';
    
    console.log(`Sanitizing name: "${name}"`);
    
    const sanitized = name
      .normalize('NFD')                           // Normaliza caracteres compuestos
      .replace(/[\u0300-\u036f]/g, '')           // Elimina diacríticos (tildes, etc.)
      .replace(/[^\w\s-]/g, '')                  // Elimina caracteres especiales
      .trim()                                     // Elimina espacios al inicio y final
      .replace(/\s+/g, '-')                       // Reemplaza espacios con guiones
      .toLowerCase();                             // Convierte a minúsculas
    
    console.log(`Sanitized result: "${sanitized}"`);
    
    return sanitized || 'unnamed'; // Asegurar que nunca devuelve un string vacío
  };

  // Create a new folder with Optimistic UI
  const createFolder = async (folderName: string) => {
    if (!folderName.trim()) return;
    
    // Mantener el nombre original para mostrar en la UI
    const originalName = folderName.trim();
    
    // Sanitize the folder name before creating
    const sanitizedFolderName = sanitizeName(folderName);
    
    console.log(`Creating folder with original name: "${originalName}", sanitized name: "${sanitizedFolderName}"`);
    
    const folderPath = currentFolder.path 
      ? `${currentFolder.path}/${sanitizedFolderName}` 
      : sanitizedFolderName;
      
    console.log(`Folder path will be: ${folderPath}`);
    
    // Create the new folder object
    const newFolder: Folder = {
      id: `folder-${folderPath}`,
      name: originalName, // Usar el nombre original para UI
      path: folderPath,   // Usar nombre sanitizado para el path
      parentPath: currentFolder.path,
      itemCount: 0,
      isRoot: false
    };
    
    console.log(`New folder object:`, newFolder);
    
    // 1. Apply optimistic update
    dispatch({ type: 'ADD_FOLDER', payload: newFolder });
    
    // 2. Perform the actual API call
    try {
      const response = await fetch('/api/media/folder', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ folderPath })
      });
      
      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      // Success case: update with data from the server if available
      if (data.folderPath) {
        // Check if the path returned by server matches our expected path
        if (data.folderPath !== folderPath) {
          console.log(`Server returned a different path: ${data.folderPath} vs expected: ${folderPath}`);
          
          // Update our folder with the server-provided path
          const updatedFolder = {
            ...newFolder,
            path: data.folderPath
          };
          
          dispatch({ 
            type: 'UPDATE_FOLDER', 
            payload: { 
              id: newFolder.id, 
              update: updatedFolder 
            } 
          });
        }
      }
      
      // Success already handled by optimistic update
      console.log(`Successfully created folder: ${sanitizedFolderName}`);
      
      // Refresh content to ensure we have the latest state
      setTimeout(() => {
        fetchMediaContent();
      }, 500);
    } catch (err: unknown) {
      console.error('Error creating folder:', err);
      const errorMessage = err instanceof Error ? err.message : String(err);
      dispatch({ type: 'SET_ERROR', payload: `Failed to create folder: ${errorMessage}` });
      
      // 3. Revert optimistic update on error
      dispatch({ 
        type: 'SET_FOLDERS', 
        payload: folders.filter(folder => folder.id !== newFolder.id)
      });
    }
  };

  // Delete a folder and its contents with Optimistic UI
  const deleteFolder = async (folderPath: string) => {
    if (confirm(`Are you sure you want to delete this folder and all its contents?`)) {
      // Store original folders and items for potential revert
      const originalFolders = [...folders];
      const originalItems = [...mediaItems];
      
      // 1. Apply optimistic update
      // Remove the folder and any subfolders from our state
      dispatch({ 
        type: 'SET_FOLDERS', 
        payload: folders.filter(folder => !folder.path.startsWith(folderPath))
      });
      
      // Also remove any files in this folder from our state
      dispatch({
        type: 'SET_MEDIA_ITEMS',
        payload: mediaItems.filter(item => {
          return !item.s3Key || !item.s3Key.startsWith(folderPath);
        })
      });
      
      // Navigate back if we were in the deleted folder
      if (currentFolder.path.startsWith(folderPath)) {
        navigateBack();
      }
      
      // 2. Perform the actual API call
      try {
        const response = await fetch(`/api/media/folder?path=${encodeURIComponent(folderPath)}`, {
          method: 'DELETE'
        });
        
        if (!response.ok) {
          throw new Error(`API Error: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        
        if (data.error) {
          throw new Error(data.error);
        }
        
        // Success already handled by optimistic update
        console.log(`Successfully deleted folder: ${folderPath}`);
      } catch (err: unknown) {
        console.error('Error deleting folder:', err);
        const errorMessage = err instanceof Error ? err.message : String(err);
        dispatch({ type: 'SET_ERROR', payload: `Failed to delete folder: ${errorMessage}` });
        
        // 3. Revert optimistic update on error
        dispatch({ type: 'SET_FOLDERS', payload: originalFolders });
        dispatch({ type: 'SET_MEDIA_ITEMS', payload: originalItems });
      }
    }
  };

  // File upload handling
  const handleFileUpload = async (files: FileList) => {
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      setUploadProgress(0);
      dispatch({ type: 'SET_ERROR', payload: null });
      
      try {
        // Sanitize the file name
        const originalFileName = file.name;
        const fileNameParts = originalFileName.split('.');
        const fileExtension = fileNameParts.pop() || '';
        const fileBaseName = fileNameParts.join('.');
        const sanitizedBaseName = sanitizeName(fileBaseName);
        const sanitizedFileName = `${sanitizedBaseName}.${fileExtension.toLowerCase()}`;
        
        // Create a new File object with the sanitized name
        const sanitizedFile = new File([file], sanitizedFileName, { type: file.type });
        
        // Create FormData for the file
        const formData = new FormData();
        formData.append('file', sanitizedFile);
        
        // Always add current folder path, even for root folder
        formData.append('folderPath', currentFolder.path);
        
        // Upload progress simulation
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
          title: sanitizedBaseName,
          fileUrl: data.url,
          fileName: sanitizedFileName,
          fileSize: data.fileSize,
          fileType: data.fileType,
          uploadedAt: new Date().toISOString().split('T')[0],
          s3Key: data.key,
          folder: currentFolder.path
        };
        
        // Add to media items
        dispatch({ type: 'ADD_MEDIA_ITEM', payload: newMediaItem });
        setUploadProgress(100);
      } catch (error: unknown) {
        console.error('Error uploading file:', error);
        
        const errorMessage = error instanceof Error ? error.message : String(error);
        dispatch({ type: 'SET_ERROR', payload: `Failed to upload file: ${errorMessage}` });
      } finally {
        // Reset progress after a short delay to show completion
        setTimeout(() => setUploadProgress(null), 500);
      }
    }
  };

  // Delete item with Optimistic UI
  const deleteItem = async (id: string) => {
    if (confirm(`Are you sure you want to delete this item?`)) {
      const itemToDelete = mediaItems.find(item => item.id === id);
      
      if (!itemToDelete) return;
      
      // 1. Apply optimistic update first
      dispatch({ type: 'REMOVE_MEDIA_ITEM', payload: id });
      setSelectedItems(prev => prev.filter(itemId => itemId !== id));
      
      // 2. Then perform the actual API call
      if (itemToDelete.s3Key) {
        try {
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
          
          // Success case already handled by optimistic update
          console.log(`Successfully deleted file: ${itemToDelete.fileName}`);
        } catch (error: unknown) {
          console.error('Error deleting file:', error);
          
          // 3. Revert optimistic update on error
          const errorMessage = error instanceof Error ? error.message : String(error);
          dispatch({ type: 'SET_ERROR', payload: `Failed to delete file: ${errorMessage}` });
          
          // Restore the deleted item to the state
          if (itemToDelete) {
            dispatch({ type: 'ADD_MEDIA_ITEM', payload: itemToDelete });
          }
        }
      }
    }
  };

  // Rename file with Optimistic UI
  const renameFile = async (id: string, newName: string) => {
    const item = mediaItems.find(item => item.id === id);
    
    if (!item || !item.s3Key) {
      dispatch({ type: 'SET_ERROR', payload: 'Cannot rename file: item not found' });
      return;
    }
    
    // Sanitize the new file name
    const nameParts = newName.split('.');
    const fileExtension = nameParts.pop() || '';
    const fileBaseName = nameParts.join('.');
    const sanitizedBaseName = sanitizeName(fileBaseName);
    const sanitizedFileName = `${sanitizedBaseName}.${fileExtension.toLowerCase()}`;
    
    // Store original values for potential revert
    const originalItem = { ...item };
    
    // 1. Apply optimistic update
    dispatch({ 
      type: 'UPDATE_MEDIA_ITEM', 
      payload: { 
        id, 
        update: { 
          title: sanitizedBaseName,
          fileName: sanitizedFileName,
          // We don't update fileUrl and s3Key optimistically as we don't know what they'll be
        } 
      } 
    });
    
    // 2. Perform the actual API call
    try {
      const response = await fetch('/api/media/rename', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          key: item.s3Key,
          newName: sanitizedFileName
        })
      });
      
      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      // Update with actual data from API
      dispatch({ 
        type: 'UPDATE_MEDIA_ITEM', 
        payload: { 
          id, 
          update: { 
            fileUrl: data.url,
            s3Key: data.key
          } 
        } 
      });
      
      console.log(`Successfully renamed file to: ${sanitizedFileName}`);
    } catch (error: unknown) {
      console.error('Error renaming file:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      dispatch({ type: 'SET_ERROR', payload: `Failed to rename file: ${errorMessage}` });
      
      // 3. Revert the optimistic update on error
      dispatch({ 
        type: 'UPDATE_MEDIA_ITEM', 
        payload: { 
          id, 
          update: { 
            title: originalItem.title,
            fileName: originalItem.fileName,
            fileUrl: originalItem.fileUrl,
            s3Key: originalItem.s3Key
          } 
        } 
      });
    }
  };

  // Move file to a folder with Optimistic UI
  const moveFile = async (id: string, targetFolder: string) => {
    const item = mediaItems.find(item => item.id === id);
    
    if (!item || !item.s3Key) {
      dispatch({ type: 'SET_ERROR', payload: 'Cannot move file: item not found' });
      return;
    }
    
    // Store original values for potential revert
    const originalItem = { ...item };
    
    // Determine if we're moving to a different folder
    const currentItemFolder = item.s3Key ? item.s3Key.split('/').slice(0, -1).join('/') : '';
    const isDifferentFolder = targetFolder !== currentItemFolder;
    
    // 1. Apply optimistic update
    if (isDifferentFolder) {
      // If moving to a different folder, remove from current view
      dispatch({ type: 'REMOVE_MEDIA_ITEM', payload: id });
      setSelectedItems(prev => prev.filter(itemId => itemId !== id));
      
      // If we're moving to the current folder, add it to the view
      if (targetFolder === currentFolder.path) {
        // Create a new version of the item with updated path
        const updatedItem: MediaItem = {
          ...item,
          // Simulate the new S3 key and file URL - will be updated with actual values if API call succeeds
          s3Key: targetFolder ? `${targetFolder}/${item.fileName}` : item.fileName,
        };
        dispatch({ type: 'ADD_MEDIA_ITEM', payload: updatedItem });
      }
    } else {
      // If moving within the same folder, just update the item
      dispatch({ 
        type: 'UPDATE_MEDIA_ITEM', 
        payload: { 
          id, 
          update: { 
            s3Key: targetFolder ? `${targetFolder}/${item.fileName}` : item.fileName,
          } 
        } 
      });
    }
    
    // 2. Perform the actual API call
    try {
      const response = await fetch('/api/media/move', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          key: item.s3Key,
          targetFolder
        })
      });
      
      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      // If we're in the same folder as the target, update with actual data from API
      if (targetFolder === currentFolder.path && !isDifferentFolder) {
        dispatch({ 
          type: 'UPDATE_MEDIA_ITEM', 
          payload: { 
            id, 
            update: { 
              fileUrl: data.url,
              s3Key: data.key,
              folder: targetFolder
            } 
          } 
        });
      }
      
      // If we're moving to root folder and we're in root, refresh to show actual data
      if (data.isMovingToRoot && currentFolder.path === '' && isDifferentFolder) {
        // Since we're already showing optimistic UI, we can delay the refresh
        setTimeout(() => {
          fetchMediaContent();
        }, 2000); // Give some time for the operation to complete on S3
      }
    } catch (error: unknown) {
      console.error('Error moving file:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      dispatch({ type: 'SET_ERROR', payload: `Failed to move file: ${errorMessage}` });
      
      // 3. Revert the optimistic update on error
      if (isDifferentFolder) {
        // First remove the optimistically added item if it's in the current view
        if (targetFolder === currentFolder.path) {
          dispatch({ type: 'REMOVE_MEDIA_ITEM', payload: id });
        }
        
        // Then restore the original item if it was in this view
        if (originalItem.folder === currentFolder.path || 
           (currentFolder.path === '' && !originalItem.folder)) {
          dispatch({ type: 'ADD_MEDIA_ITEM', payload: originalItem });
        }
      } else {
        // Just revert the update
        dispatch({ 
          type: 'UPDATE_MEDIA_ITEM', 
          payload: { 
            id, 
            update: { 
              fileUrl: originalItem.fileUrl,
              s3Key: originalItem.s3Key,
              folder: originalItem.folder
            } 
          } 
        });
      }
    }
  };

  // Move multiple files to a folder with Optimistic UI
  const moveFilesInBulk = async (ids: string[], targetFolder: string) => {
    // Filter out items that don't have a valid s3Key
    const itemsToMove = ids
      .map(id => mediaItems.find(item => item.id === id))
      .filter((item): item is MediaItem => !!item && !!item.s3Key);
    
    if (itemsToMove.length === 0) {
      dispatch({ type: 'SET_ERROR', payload: 'No valid files to move' });
      return;
    }
    
    // Store original items for potential revert
    const originalItems = itemsToMove.map(item => ({ ...item }));
    
    // Determine if we're moving to a different folder than current view
    const isDifferentFolder = targetFolder !== currentFolder.path;
    
    // 1. Apply optimistic update
    if (isDifferentFolder) {
      // If moving to a different folder, remove items from current view
      dispatch({ 
        type: 'SET_MEDIA_ITEMS', 
        payload: mediaItems.filter(item => !ids.includes(item.id)) 
      });
      
      // Clear selection
      setSelectedItems([]);
    } else {
      // If moving within the same folder, update the items
      for (const item of itemsToMove) {
        dispatch({ 
          type: 'UPDATE_MEDIA_ITEM', 
          payload: { 
            id: item.id, 
            update: { 
              folder: targetFolder,
              s3Key: targetFolder ? `${targetFolder}/${item.fileName}` : item.fileName
            } 
          } 
        });
      }
    }
    
    // 2. Perform the actual API call
    try {
      const response = await fetch('/api/media/move', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          keys: itemsToMove.map(item => item.s3Key as string),
          targetFolder
        })
      });
      
      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      // Process successful moves
      if (data.results && Array.isArray(data.results)) {
        // If we're in the same folder as the target, update with actual data from API
        if (!isDifferentFolder) {
          // Update each item with actual data from the server
          for (const result of data.results) {
            const movedItem = itemsToMove.find(item => item.s3Key === result.originalKey);
            if (movedItem) {
              dispatch({ 
                type: 'UPDATE_MEDIA_ITEM', 
                payload: { 
                  id: movedItem.id, 
                  update: { 
                    fileUrl: result.url,
                    s3Key: result.newKey,
                    folder: targetFolder
                  } 
                } 
              });
            }
          }
        }
        
        // If we're moving to root folder and we're in root
        if (data.isMovingToRoot && currentFolder.path === '' && isDifferentFolder) {
          // Since we're already showing optimistic UI, we can delay the refresh
          setTimeout(() => {
            fetchMediaContent();
          }, 2000); // Give some time for the operation to complete on S3
        }
      }
      
      // Report any errors
      if (data.errors && data.errors.length > 0) {
        dispatch({ 
          type: 'SET_ERROR', 
          payload: `Some files could not be moved: ${data.errors.length} error(s)` 
        });
      } else {
        // Give feedback on successful operation
        console.log(`Successfully moved ${data.totalMoved} files to ${targetFolder}`);
      }
    } catch (error: unknown) {
      console.error('Error moving files in bulk:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      dispatch({ type: 'SET_ERROR', payload: `Failed to move files: ${errorMessage}` });
      
      // 3. Revert the optimistic update on error
      if (isDifferentFolder) {
        // Restore original items if they were in the current view
        const itemsToRestore = originalItems.filter(
          item => item.folder === currentFolder.path || 
                 (currentFolder.path === '' && !item.folder)
        );
        
        if (itemsToRestore.length > 0) {
          // Add back the original items to our state
          const updatedItems = [...mediaItems, ...itemsToRestore];
          dispatch({ type: 'SET_MEDIA_ITEMS', payload: updatedItems });
        }
      } else {
        // Revert each item back to its original state
        for (const original of originalItems) {
          dispatch({ 
            type: 'UPDATE_MEDIA_ITEM', 
            payload: { 
              id: original.id, 
              update: { 
                fileUrl: original.fileUrl,
                s3Key: original.s3Key,
                folder: original.folder
              } 
            } 
          });
        }
      }
    }
  };

  // Delete selected items with Optimistic UI
  const deleteSelectedItems = async () => {
    if (!selectedItems.length) return;
    
    if (confirm(`Are you sure you want to delete ${selectedItems.length} selected item(s)?`)) {
      // Copy array to avoid mutation issues during deletion
      const itemsToDelete = [...selectedItems];
      const keysToDelete: string[] = [];
      const itemsMap = new Map<string, MediaItem>();
      
      // Get all the S3 keys for the selected items
      for (const id of itemsToDelete) {
        const itemToDelete = mediaItems.find(item => item.id === id);
        if (itemToDelete) {
          itemsMap.set(id, itemToDelete);
          if (itemToDelete.s3Key) {
            keysToDelete.push(itemToDelete.s3Key);
          }
        }
      }
      
      if (keysToDelete.length === 0 && itemsMap.size === 0) {
        dispatch({ type: 'SET_ERROR', payload: 'No valid files to delete' });
        return;
      }
      
      // 1. Apply optimistic update first
      dispatch({ 
        type: 'SET_MEDIA_ITEMS',
        payload: mediaItems.filter(item => !selectedItems.includes(item.id)) 
      });
      
      // Clear selection
      setSelectedItems([]);
      
      // 2. Then perform the API call if there are S3 keys to delete
      if (keysToDelete.length > 0) {
        try {
          // Send bulk delete request
            const response = await fetch('/api/media/delete', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
            body: JSON.stringify({ keys: keysToDelete })
            });
            
            if (!response.ok) {
              throw new Error(`API Error: ${response.status} ${response.statusText}`);
            }
            
            const data = await response.json();
            
            if (data.error) {
              throw new Error(data.error);
            }
          
          // Success already handled by optimistic update
          console.log(`Successfully deleted ${data.totalDeleted} files`);
          
          // Report any errors but don't revert the UI
          if (data.errors && data.errors.length > 0) {
            dispatch({ 
              type: 'SET_ERROR', 
              payload: `Some files could not be deleted: ${data.errors.length} error(s)` 
            });
          }
        } catch (error: unknown) {
          console.error('Error deleting files in bulk:', error);
          const errorMessage = error instanceof Error ? error.message : String(error);
          dispatch({ type: 'SET_ERROR', payload: `Failed to delete files: ${errorMessage}` });
          
          // 3. Revert optimistic update on error
          const restoredItems: MediaItem[] = [];
          itemsMap.forEach(item => restoredItems.push(item));
          
          if (restoredItems.length > 0) {
            dispatch({ 
              type: 'SET_MEDIA_ITEMS',
              payload: [...mediaItems, ...restoredItems] 
            });
            dispatch({ type: 'SET_ERROR', payload: 'Delete operation failed. Items have been restored.' });
          }
        }
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

  // Refresh media items
  const refreshMediaItems = () => {
    fetchMediaContent();
  };

  // Filter media items
  const filteredMedia = mediaItems
    .filter(item => {
      // Only show items in the current folder
      
      // When we're in the root folder
      if (currentFolder.isRoot || currentFolder.path === '') {
        // Check S3 key for files directly in root
        if (item.s3Key) {
          // Files in root either have no slashes or have only one part before first slash
          const firstSlashIndex = item.s3Key.indexOf('/');
          return firstSlashIndex === -1 || firstSlashIndex === item.s3Key.lastIndexOf('/');
        }
        
        // Fallback to folder property
        return (item.folder || '') === '';
      }
      
      // For other folders, check S3 key path for matching folder
      if (item.s3Key) {
        // Files must be directly in this folder, not in subfolders
        // Construct the expected prefix including trailing slash
        const prefix = currentFolder.path.endsWith('/') ? currentFolder.path : `${currentFolder.path}/`;
        
        // Files in this folder must start with the prefix and not have additional subfolders
        if (item.s3Key.startsWith(prefix)) {
          const remainingPath = item.s3Key.substring(prefix.length);
          return !remainingPath.includes('/'); // No additional slashes means it's directly in this folder
        }
      }
      
      // Fallback to folder property
      return (item.folder || '') === currentFolder.path;
    })
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
    })
    .sort((a, b) => {
      // Apply sorting
      const aValue = a[sortField];
      const bValue = b[sortField];
      
      // Handle specific field types differently
      if (sortField === 'fileSize') {
        // Number comparison
        return sortDirection === 'asc' 
          ? (a.fileSize || 0) - (b.fileSize || 0)
          : (b.fileSize || 0) - (a.fileSize || 0);
      } 
      else if (sortField === 'uploadedAt') {
        // Date comparison (ISO strings can be compared lexicographically)
        return sortDirection === 'asc'
          ? a.uploadedAt.localeCompare(b.uploadedAt)
          : b.uploadedAt.localeCompare(a.uploadedAt);
      }
      else {
        // String comparison
        const aStr = String(aValue || '').toLowerCase();
        const bStr = String(bValue || '').toLowerCase();
        return sortDirection === 'asc'
          ? aStr.localeCompare(bStr)
          : bStr.localeCompare(aStr);
      }
    });

  // Toggle sorting field or direction
  const toggleSort = (field: keyof MediaItem) => {
    if (sortField === field) {
      // Same field, toggle direction
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      // New field, set it with default direction based on field type
      setSortField(field);
      // For dates and numbers, default to descending (newest/largest first)
      // For text, default to ascending (A-Z)
      if (field === 'uploadedAt' || field === 'fileSize') {
        setSortDirection('desc');
      } else {
        setSortDirection('asc');
      }
    }
  };

  // Rename folder with Optimistic UI
  const renameFolder = async (folderPath: string, newName: string) => {
    // Don't do anything if the folder path is empty or the name is the same
    if (!folderPath || !newName.trim()) return;
    
    // Sanitize the new folder name
    const sanitizedNewName = sanitizeName(newName);
    
    // Log the current state of folders
    console.log("Current folders:", folders);
    
    // Try finding the folder using multiple approaches
    const folderId = `folder-${folderPath}`;
    
    // Approach 1: Direct path match
    let folderToRename = folders.find(f => f.path === folderPath);
    
    // Approach 2: ID match
    if (!folderToRename) {
      folderToRename = folders.find(f => f.id === folderId);
      console.log(`Trying to find by ID ${folderId}:`, folderToRename);
    }
    
    // Approach 3: Check if it's the current folder
    if (!folderToRename && currentFolder.path === folderPath) {
      folderToRename = currentFolder;
      console.log("Using current folder:", folderToRename);
    }
    
    // Approach 4: Try with sanitized path
    if (!folderToRename) {
      const sanitizedPath = sanitizeName(folderPath);
      folderToRename = folders.find(f => f.path === sanitizedPath);
      console.log(`Trying with sanitized path ${sanitizedPath}:`, folderToRename);
    }
    
    // Approach 5: Substring match for path
    if (!folderToRename) {
      folderToRename = folders.find(f => 
        folderPath.includes(f.path) || f.path.includes(folderPath)
      );
      console.log("Trying substring match:", folderToRename);
    }
    
    if (!folderToRename) {
      console.error(`Cannot find folder with path: ${folderPath} or id: ${folderId}`);
      dispatch({ 
        type: 'SET_ERROR', 
        payload: `Cannot rename folder: folder not found. Path: ${folderPath}` 
      });
      return;
    }
    
    // Store original values for potential revert
    const originalFolder = { ...folderToRename };
    
    // Get the actual path that's stored (which may have been sanitized)
    const actualFolderPath = folderToRename.path;
    
    const parentPath = actualFolderPath.includes('/') 
      ? actualFolderPath.substring(0, actualFolderPath.lastIndexOf('/')) 
      : '';
      
    // Determine the new folder path
    const newFolderPath = parentPath 
      ? `${parentPath}/${sanitizedNewName}` 
      : sanitizedNewName;
      
    // Create updated folder object
    const updatedFolder: Folder = {
      ...folderToRename,
      name: newName, // Mantener el nombre original para mostrar
      path: newFolderPath
    };
    
    console.log("Going to update folder to:", updatedFolder);
    
    // Find files in the folder being renamed (for potential revert)
    const filesToUpdate = mediaItems.filter(item => {
      if (!item.s3Key) return false;
      
      // Check if the item is in the folder that's being renamed
      const normalizedFolderPath = actualFolderPath.endsWith('/') 
        ? actualFolderPath 
        : `${actualFolderPath}/`;
        
      return item.s3Key.startsWith(normalizedFolderPath);
    });
    
    // Store original file data for potential revert
    const originalFiles = filesToUpdate.map(file => ({ ...file }));
    
    // Mostrar mensaje de progreso
    dispatch({ 
      type: 'SET_ERROR', 
      payload: `Renombrando carpeta y moviendo archivos...` 
    });
    
    // 1. Apply optimistic update to folder
    dispatch({ 
      type: 'UPDATE_FOLDER', 
      payload: { 
        id: folderToRename.id, 
        update: updatedFolder 
      } 
    });
    
    // If this is the current folder, update currentFolder as well
    if (currentFolder.path === actualFolderPath) {
      dispatch({ 
        type: 'NAVIGATE_FOLDER', 
        payload: updatedFolder 
      });
    }
    
    // 2. Apply optimistic updates to files in the folder
    dispatch({
      type: 'UPDATE_MEDIA_ITEMS_IN_FOLDER',
      payload: {
        folderPath: actualFolderPath,
        newFolderPath: newFolderPath
      }
    });
    
    // 3. Perform the actual API call
    try {
      const response = await fetch('/api/media/rename-folder', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          oldPath: actualFolderPath,
          newName: sanitizedNewName
        })
      });
      
      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      // Mostrar mensaje de éxito
      dispatch({ 
        type: 'SET_ERROR', 
        payload: data.message || `Carpeta renombrada con éxito. Archivos actualizados.` 
      });
      
      // Clear message after a delay
      setTimeout(() => {
        dispatch({ type: 'SET_ERROR', payload: null });
      }, 3000);
      
    } catch (error: unknown) {
      console.error('Error renaming folder:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      dispatch({ type: 'SET_ERROR', payload: `Failed to rename folder: ${errorMessage}` });
      
      // 4. Revert the optimistic update on error
      dispatch({ 
        type: 'UPDATE_FOLDER', 
        payload: { 
          id: folderToRename.id, 
          update: originalFolder 
        } 
      });
      
      // If this was the current folder, revert the navigation too
      if (currentFolder.path === newFolderPath) {
        dispatch({ 
          type: 'NAVIGATE_FOLDER', 
          payload: originalFolder 
        });
      }
      
      // Revert file updates by replacing all media items
      const updatedMediaItems = [...mediaItems];
      for (let i = 0; i < updatedMediaItems.length; i++) {
        const item = updatedMediaItems[i];
        const originalItem = originalFiles.find(original => original.id === item.id);
        if (originalItem) {
          updatedMediaItems[i] = originalItem;
        }
      }
      dispatch({ type: 'SET_MEDIA_ITEMS', payload: updatedMediaItems });
      
      // Refresh to ensure we have the latest state
      fetchMediaContent();
    }
  };

  // Move folder to another location with Optimistic UI
  const moveFolder = async (sourceFolderPath: string, targetFolderPath: string) => {
    // Don't do anything if las rutas son iguales
    if (sourceFolderPath === targetFolderPath) return;
    
    // Log the current state of folders
    console.log("Current folders for moving:", folders);
    
    // Try finding the folder using multiple approaches
    const folderId = `folder-${sourceFolderPath}`;
    
    // Approach 1: Direct path match
    let folderToMove = folders.find(f => f.path === sourceFolderPath);
    
    // Approach 2: ID match
    if (!folderToMove) {
      folderToMove = folders.find(f => f.id === folderId);
      console.log(`Moving: Trying to find by ID ${folderId}:`, folderToMove);
    }
    
    // Approach 3: Check if it's the current folder
    if (!folderToMove && currentFolder.path === sourceFolderPath) {
      folderToMove = currentFolder;
      console.log("Moving: Using current folder:", folderToMove);
    }
    
    if (!folderToMove) {
      console.error(`Cannot find folder to move with path: ${sourceFolderPath} or id: ${folderId}`);
      dispatch({ 
        type: 'SET_ERROR', 
        payload: `Cannot move folder: folder not found. Path: ${sourceFolderPath}` 
      });
      return;
    }
    
    // Simple implementation for now - just refresh after move
    try {
      const response = await fetch('/api/media/move-folder', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          sourcePath: sourceFolderPath,
          targetPath: targetFolderPath
        })
      });
      
      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      // Refresh content after successful move
      await fetchMediaContent();
      
    } catch (error: unknown) {
      console.error('Error moving folder:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      dispatch({ type: 'SET_ERROR', payload: `Failed to move folder: ${errorMessage}` });
    }
  };

  return {
    isLoading,
    filteredMedia,
    searchQuery,
    filterType,
    viewMode,
    selectedItems,
    uploadProgress,
    error,
    isConfigError,
    currentFolder,
    folders,
    setSearchQuery,
    setFilterType,
    setViewMode,
    toggleItemSelection,
    toggleSelectAll,
    handleFileUpload,
    deleteItem,
    deleteSelectedItems,
    refreshMediaItems,
    navigateToFolder,
    navigateBack,
    createFolder,
    deleteFolder,
    renameFolder,
    renameFile,
    moveFile,
    moveFolder,
    moveFilesInBulk,
    toggleSort,
    sortField,
    sortDirection
  };
}