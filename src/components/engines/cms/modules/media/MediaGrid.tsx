import { MediaItem, Folder } from './types';
import { MediaCard } from './MediaCard';
import { ArrowUp, ArrowDown, ChevronDown } from 'lucide-react';
import { useState, useRef, useEffect, useCallback } from 'react';

interface MediaGridProps {
  items: MediaItem[];
  selectedItems: string[];
  onSelectItem: (id: string) => void;
  onDeleteItem: (id: string) => void;
  onRenameItem: (id: string, newName: string) => Promise<void>;
  onMoveItem: (id: string, targetFolder: string) => Promise<void>;
  folders: Folder[];
  currentFolder: Folder;
  onSort?: (field: keyof MediaItem) => void;
  sortField?: keyof MediaItem;
  sortDirection?: 'asc' | 'desc';
}

export function MediaGrid({ 
  items, 
  selectedItems, 
  onSelectItem, 
  onDeleteItem,
  onRenameItem,
  onMoveItem,
  folders,
  currentFolder,
  onSort,
  sortField = 'uploadedAt',
  sortDirection = 'desc'
}: MediaGridProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [visibleItems, setVisibleItems] = useState<string[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // Progressive loading configuration
  const BATCH_SIZE = 6; // Number of items to load simultaneously (increased for better UX)
  const LOAD_DELAY = 150; // Delay between batches in ms (slightly increased for smoother loading)
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Initialize progressive loading when items change
  useEffect(() => {
    if (items.length === 0) {
      setVisibleItems([]);
      return;
    }

    // Reset state
    setVisibleItems([]);
    
    // Create loading queue with image items first, then other files
    const imageItems = items.filter(item => 
      item.fileType?.startsWith('image/') || 
      item.fileUrl?.toLowerCase().includes('.jpg') ||
      item.fileUrl?.toLowerCase().includes('.jpeg') ||
      item.fileUrl?.toLowerCase().includes('.png') ||
      item.fileUrl?.toLowerCase().includes('.gif') ||
      item.fileUrl?.toLowerCase().includes('.webp') ||
      item.fileUrl?.toLowerCase().includes('.svg')
    );
    
    const nonImageItems = items.filter(item => !imageItems.includes(item));
    
    // Prioritize images, then add other files
    const queue = [...imageItems.map(item => item.id), ...nonImageItems.map(item => item.id)];
  
    
    // Start loading the first batch
    startProgressiveLoading(queue);
  }, [items]);

  const startProgressiveLoading = useCallback((queue: string[]) => {
    if (queue.length === 0) return;

    // Load first batch immediately
    const firstBatch = queue.slice(0, BATCH_SIZE);
    setVisibleItems(firstBatch);
    
    // Load remaining items progressively
    let currentIndex = BATCH_SIZE;
    
    const loadNextBatch = () => {
      if (currentIndex >= queue.length) return;
      
      const nextBatch = queue.slice(currentIndex, currentIndex + BATCH_SIZE);
      setVisibleItems(prev => [...prev, ...nextBatch]);
      currentIndex += BATCH_SIZE;
      
      if (currentIndex < queue.length) {
        setTimeout(loadNextBatch, LOAD_DELAY);
      }
    };

    if (currentIndex < queue.length) {
      setTimeout(loadNextBatch, LOAD_DELAY);
    }
  }, []);

  
  const sortOptions: {label: string; field: keyof MediaItem}[] = [
    { label: 'Name', field: 'fileName' },
    { label: 'Type', field: 'fileType' },
    { label: 'Size', field: 'fileSize' },
    { label: 'Upload Date', field: 'uploadedAt' }
  ];
  
  const handleSort = (field: keyof MediaItem) => {
    if (onSort) {
      onSort(field);
      setDropdownOpen(false);
    }
  };
  
  const getSortLabel = () => {
    const option = sortOptions.find(opt => opt.field === sortField);
    return option ? option.label : 'Sort by';
  };

  // Filter items to show only visible ones
  const itemsToShow = items.filter(item => visibleItems.includes(item.id));
  
  return (
    <div className="p-4 min-h-[400px]">
      {/* Loading indicator */}
      {visibleItems.length < items.length && (
        <div className="mb-4 text-center">
          <div className="inline-flex items-center px-4 py-2 text-sm text-blue-600 bg-blue-50 rounded-full border border-blue-200">
            <div className="w-4 h-4 mr-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <span className="font-medium">
              Loading {visibleItems.length} of {items.length} items
            </span>
            <div className="ml-3 w-16 bg-blue-200 rounded-full h-1.5">
              <div 
                className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${(visibleItems.length / items.length) * 100}%` }}
              ></div>
            </div>
          </div>
        </div>
      )}

      {/* Sort dropdown */}
      <div className="flex justify-end mb-4 relative" ref={dropdownRef}>
        <button 
          className="px-3 py-1.5 text-xs font-medium bg-white border border-gray-200 rounded-md flex items-center hover:bg-gray-50"
          onClick={() => setDropdownOpen(!dropdownOpen)}
        >
          <span>Sort by: {getSortLabel()}</span>
          <span className="ml-1">
            {sortDirection === 'asc' ? (
              <ArrowUp className="h-3 w-3 inline-block" />
            ) : (
              <ArrowDown className="h-3 w-3 inline-block" />
            )}
          </span>
          <ChevronDown className="h-3 w-3 ml-1 text-gray-500" />
        </button>
        
        {dropdownOpen && (
          <div className="absolute right-0 top-full mt-1 w-48 bg-white shadow-lg rounded-md border border-gray-200 z-50">
            {sortOptions.map(option => (
              <button
                key={option.field}
                className={`w-full text-left px-3 py-1.5 text-xs hover:bg-gray-50 flex items-center justify-between ${
                  sortField === option.field ? 'font-medium bg-gray-50' : ''
                }`}
                onClick={() => handleSort(option.field)}
              >
                {option.label}
                {sortField === option.field && (
                  sortDirection === 'asc' ? (
                    <ArrowUp className="h-3 w-3" />
                  ) : (
                    <ArrowDown className="h-3 w-3" />
                  )
                )}
              </button>
            ))}
          </div>
        )}
      </div>
      
      {/* Grid view with progressive loading */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {itemsToShow.map((item, index) => (
          <div
            key={item.id}
            className="animate-fadeIn"
            style={{
              animationDelay: `${Math.min(index * 50, 500)}ms`,
              animationFillMode: 'both'
            }}
          >
            <MediaCard
              item={item}
              isSelected={selectedItems.includes(item.id)}
              onSelect={onSelectItem}
              onDelete={onDeleteItem}
              onRename={onRenameItem}
              onMove={onMoveItem}
              folders={folders}
              currentFolder={currentFolder}
            />
          </div>
        ))}
      </div>

      {/* Skeleton placeholders for items still loading */}
      {visibleItems.length < items.length && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 mt-4">
          {Array.from({ length: Math.min(BATCH_SIZE, items.length - visibleItems.length) }).map((_, index) => (
            <div
              key={`skeleton-${index}`}
              className="border rounded-lg overflow-hidden bg-white"
            >
              <div className="aspect-square bg-gray-200 animate-shimmer"></div>
              <div className="p-3 space-y-2">
                <div className="h-4 bg-gray-200 rounded animate-shimmer"></div>
                <div className="h-3 bg-gray-200 rounded w-3/4 animate-shimmer"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2 animate-shimmer"></div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 