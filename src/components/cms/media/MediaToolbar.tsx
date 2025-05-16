import { SearchIcon, FilterIcon, GridIcon, ListIcon, TrashIcon } from 'lucide-react';
import { MediaUploadButton } from './MediaUploadButton';

interface MediaToolbarProps {
  searchQuery: string;
  filterType: string;
  viewMode: 'grid' | 'list';
  selectedCount: number;
  onSearchChange: (query: string) => void;
  onFilterChange: (filter: string) => void;
  onViewModeChange: (mode: 'grid' | 'list') => void;
  onFileSelect: (files: FileList) => void;
  onDeleteSelected: () => void;
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
  onDeleteSelected
}: MediaToolbarProps) {
  return (
    <div className="flex flex-col md:flex-row justify-between items-center p-4 border-b">
      <div className="w-full md:w-1/3 mb-4 md:mb-0">
        <div className="relative">
          <input
            type="text"
            placeholder="Search media..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-md"
          />
          <SearchIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
        </div>
      </div>

      <div className="flex items-center space-x-4">
        <div className="relative">
          <select
            value={filterType}
            onChange={(e) => onFilterChange(e.target.value)}
            className="appearance-none pl-10 pr-8 py-2 border rounded-md bg-white"
          >
            <option value="all">All Media</option>
            <option value="image">Images</option>
            <option value="video">Videos</option>
            <option value="document">Documents</option>
          </select>
          <FilterIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
        </div>

        <div className="flex border rounded-md">
          <button
            onClick={() => onViewModeChange('grid')}
            className={`p-2 ${viewMode === 'grid' ? 'bg-gray-100' : ''}`}
            title="Grid view"
          >
            <GridIcon className="h-5 w-5" />
          </button>
          <button
            onClick={() => onViewModeChange('list')}
            className={`p-2 ${viewMode === 'list' ? 'bg-gray-100' : ''}`}
            title="List view"
          >
            <ListIcon className="h-5 w-5" />
          </button>
        </div>

        {selectedCount > 0 && (
          <button
            onClick={onDeleteSelected}
            className="px-3 py-2 text-red-600 rounded-md flex items-center hover:bg-red-50"
          >
            <TrashIcon className="h-4 w-4 mr-1" />
            Delete ({selectedCount})
          </button>
        )}

        <MediaUploadButton onFileSelect={onFileSelect} />
      </div>
    </div>
  );
} 