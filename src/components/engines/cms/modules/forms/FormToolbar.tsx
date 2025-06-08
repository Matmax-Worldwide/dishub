import { Search, Grid, List } from 'lucide-react';

export interface FormToolbarProps {
  searchQuery: string;
  viewMode: 'grid' | 'list';
  onSearchChange: (query: string) => void;
  onViewModeChange: (mode: 'grid' | 'list') => void;
}

export function FormToolbar({ 
  searchQuery, 
  viewMode, 
  onSearchChange, 
  onViewModeChange 
}: FormToolbarProps) {
  return (
    <div className="flex flex-col md:flex-row justify-between items-center p-4 border-b border-gray-200">
      <div className="relative w-full md:w-auto mb-4 md:mb-0">
        <div className="flex items-center w-full md:w-64 relative">
          <Search className="absolute left-3 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search forms..."
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-md w-full focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>
      
      <div className="flex items-center space-x-4">
        <div className="border rounded-md flex">
          <button
            onClick={() => onViewModeChange('grid')}
            className={`p-2 ${viewMode === 'grid' ? 'bg-gray-100 text-blue-600' : 'text-gray-500'}`}
            title="Grid view"
          >
            <Grid className="h-4 w-4" />
          </button>
          <button
            onClick={() => onViewModeChange('list')}
            className={`p-2 ${viewMode === 'list' ? 'bg-gray-100 text-blue-600' : 'text-gray-500'}`}
            title="List view"
          >
            <List className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
} 