import { useState } from 'react';
import { Search, Grid, List, Trash2, RefreshCw } from 'lucide-react';
import { MediaUploadButton } from './MediaUploadButton';

interface MediaToolbarProps {
  searchQuery: string;
  filterType: string;
  viewMode: 'grid' | 'list';
  selectedCount: number;
  onSearchChange: (query: string) => void;
  onFilterChange: (type: string) => void;
  onViewModeChange: (mode: 'grid' | 'list') => void;
  onFileSelect: (files: FileList) => void;
  onDeleteSelected: () => void;
  onRefresh?: () => void;
}

export function MediaToolbar({
  searchQuery,
  filterType,
  viewMode,
  selectedCount,
  onSearchChange,
  onFilterChange,
  onViewModeChange,
  onFileSelect,
  onDeleteSelected,
  onRefresh
}: MediaToolbarProps) {
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);

  return (
    <div className="border-b border-gray-200 p-4 flex flex-col sm:flex-row items-center justify-between space-y-3 sm:space-y-0">
      <div className="flex items-center space-x-2 w-full sm:w-1/2">
        <div 
          className={`flex items-center bg-gray-100 rounded-md ${
            isSearchExpanded ? 'w-full' : 'w-auto'
          }`}
        >
          <button 
            className="p-2 text-gray-500 hover:text-gray-700"
            onClick={() => setIsSearchExpanded(!isSearchExpanded)}
          >
            <Search className="h-4 w-4" />
          </button>
          {isSearchExpanded && (
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search media..."
              className="w-full bg-transparent text-sm px-2 py-1 focus:outline-none"
            />
          )}
        </div>
        
        <select
          value={filterType}
          onChange={(e) => onFilterChange(e.target.value)}
          className="block bg-gray-100 text-sm text-gray-700 rounded-md px-3 py-2 border-none focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="all">All Types</option>
          <option value="image">Images</option>
          <option value="video">Videos</option>
          <option value="document">Documents</option>
        </select>
      </div>
      
      <div className="flex items-center space-x-2">
        {onRefresh && (
          <button 
            onClick={onRefresh}
            className="p-2 text-gray-500 hover:text-gray-700 bg-gray-100 rounded-md flex items-center justify-center"
            title="Refresh media"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        )}
      
        <div className="flex border border-gray-200 rounded-md overflow-hidden">
          <button
            className={`p-2 ${viewMode === 'grid' 
              ? 'bg-blue-500 text-white' 
              : 'bg-white text-gray-500 hover:bg-gray-50'}`}
            onClick={() => onViewModeChange('grid')}
            title="Grid view"
          >
            <Grid className="h-4 w-4" />
          </button>
          <button
            className={`p-2 ${viewMode === 'list' 
              ? 'bg-blue-500 text-white' 
              : 'bg-white text-gray-500 hover:bg-gray-50'}`}
            onClick={() => onViewModeChange('list')}
            title="List view"
          >
            <List className="h-4 w-4" />
          </button>
        </div>
        
        {selectedCount > 0 && (
          <button
            onClick={onDeleteSelected}
            className="px-3 py-2 flex items-center space-x-1 bg-red-500 text-white rounded-md text-sm hover:bg-red-600"
          >
            <Trash2 className="h-4 w-4" />
            <span>Delete ({selectedCount})</span>
          </button>
        )}
        
        <MediaUploadButton onFileSelect={onFileSelect}>
          Upload
        </MediaUploadButton>
      </div>
    </div>
  );
} 