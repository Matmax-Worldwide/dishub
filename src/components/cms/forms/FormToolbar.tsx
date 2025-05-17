import { Search, LayoutGrid, ListFilter, ArrowUpDown } from 'lucide-react';

interface FormToolbarProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  viewMode: 'grid' | 'list';
  setViewMode: (mode: 'grid' | 'list') => void;
  sortField: 'title' | 'createdAt';
  sortDirection: 'asc' | 'desc';
  handleSort: (field: 'title' | 'createdAt') => void;
}

export function FormToolbar({ 
  searchQuery, 
  setSearchQuery, 
  viewMode, 
  setViewMode, 
  sortField, 
  sortDirection, 
  handleSort 
}: FormToolbarProps) {
  return (
    <div className="p-4 border-b border-gray-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      {/* Search input */}
      <div className="relative flex-1 max-w-md">
        <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search forms..."
          className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Controls */}
      <div className="flex items-center gap-2">
        {/* View mode toggle */}
        <div className="flex border border-gray-300 rounded-md overflow-hidden">
          <button
            className={`p-2 ${viewMode === 'grid' ? 'bg-blue-50 text-blue-600' : 'bg-white text-gray-500'}`}
            onClick={() => setViewMode('grid')}
            title="Grid view"
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
          <button
            className={`p-2 ${viewMode === 'list' ? 'bg-blue-50 text-blue-600' : 'bg-white text-gray-500'}`}
            onClick={() => setViewMode('list')}
            title="List view"
          >
            <ListFilter className="h-4 w-4" />
          </button>
        </div>

        {/* Sort buttons */}
        <button
          className={`p-2 border border-gray-300 rounded-md flex items-center gap-1 ${
            sortField === 'title' ? 'bg-blue-50 text-blue-600' : 'bg-white text-gray-500'
          }`}
          onClick={() => handleSort('title')}
          title={`Sort by title ${sortField === 'title' && sortDirection === 'asc' ? '(Z-A)' : '(A-Z)'}`}
        >
          <span className="text-xs font-medium">Name</span>
          <ArrowUpDown className="h-3 w-3" />
        </button>
        
        <button
          className={`p-2 border border-gray-300 rounded-md flex items-center gap-1 ${
            sortField === 'createdAt' ? 'bg-blue-50 text-blue-600' : 'bg-white text-gray-500'
          }`}
          onClick={() => handleSort('createdAt')}
          title={`Sort by date ${sortField === 'createdAt' && sortDirection === 'asc' ? '(oldest first)' : '(newest first)'}`}
        >
          <span className="text-xs font-medium">Date</span>
          <ArrowUpDown className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
} 