import { useState } from 'react';
import { Search, Grid, List, X } from 'lucide-react';

interface BlogToolbarProps {
  searchQuery: string;
  viewMode: 'grid' | 'list';
  onSearchChange: (query: string) => void;
  onViewModeChange: (mode: 'grid' | 'list') => void;
}

export function BlogToolbar({ 
  searchQuery, 
  viewMode, 
  onSearchChange, 
  onViewModeChange 
}: BlogToolbarProps) {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <div className="flex items-center p-4 border-b border-gray-200 bg-gray-50">
      <div className={`relative flex-1 ${isFocused ? 'ring-2 ring-blue-500' : ''}`}>
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-4 w-4 text-gray-400" />
        </div>
        <input
          type="search"
          placeholder="Search blogs..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
        />
        {searchQuery && (
          <button
            type="button"
            className="absolute inset-y-0 right-0 pr-3 flex items-center"
            onClick={() => onSearchChange('')}
          >
            <X className="h-4 w-4 text-gray-400 hover:text-gray-500" />
          </button>
        )}
      </div>
      <div className="flex ml-4 space-x-2">
        <button
          onClick={() => onViewModeChange('grid')}
          className={`p-2 rounded-md ${
            viewMode === 'grid'
              ? 'bg-gray-100 text-gray-800'
              : 'text-gray-500 hover:bg-gray-100 hover:text-gray-600'
          }`}
          title="Grid view"
        >
          <Grid className="h-5 w-5" />
        </button>
        <button
          onClick={() => onViewModeChange('list')}
          className={`p-2 rounded-md ${
            viewMode === 'list'
              ? 'bg-gray-100 text-gray-800'
              : 'text-gray-500 hover:bg-gray-100 hover:text-gray-600'
          }`}
          title="List view"
        >
          <List className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
} 