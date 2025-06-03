import { MediaItem, Folder } from './types';
import { MediaCard } from './MediaCard';
import { ArrowUp, ArrowDown, ChevronDown } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

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
  const dropdownRef = useRef<HTMLDivElement>(null);
  
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
  
  return (
    <div className="p-4 min-h-[400px]">
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
      
      {/* Grid view */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {items.map((item) => (
          <MediaCard
            key={item.id}
            item={item}
            isSelected={selectedItems.includes(item.id)}
            onSelect={onSelectItem}
            onDelete={onDeleteItem}
            onRename={onRenameItem}
            onMove={onMoveItem}
            folders={folders}
            currentFolder={currentFolder}
          />
        ))}
      </div>
    </div>
  );
} 