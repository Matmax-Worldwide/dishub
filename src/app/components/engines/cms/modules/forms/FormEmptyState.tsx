import { Search, PlusCircle } from 'lucide-react';

export interface FormEmptyStateProps {
  searchQuery: string;
  onClearSearch: () => void;
  onCreateForm: () => void;
}

export function FormEmptyState({ searchQuery, onClearSearch, onCreateForm }: FormEmptyStateProps) {
  return (
    <div className="p-12 flex flex-col items-center justify-center text-center">
      {searchQuery ? (
        // No results for search query
        <div>
          <Search className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-1">No forms found</h3>
          <p className="text-gray-500 mb-4">
            No forms match your search <span className="font-medium">&quot;{searchQuery}&quot;</span>
          </p>
          <button
            onClick={onClearSearch}
            className="text-blue-600 hover:text-blue-800 underline"
          >
            Clear search
          </button>
        </div>
      ) : (
        // No forms exist
        <div>
          <div className="bg-blue-50 rounded-full p-3 w-16 h-16 flex items-center justify-center mx-auto mb-4">
            <PlusCircle className="h-8 w-8 text-blue-600" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-1">No forms yet</h3>
          <p className="text-gray-500 mb-4">
            Get started by creating your first form
          </p>
          <button
            onClick={onCreateForm}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center mx-auto"
          >
            <PlusCircle className="h-4 w-4 mr-1" />
            Create Form
          </button>
        </div>
      )}
    </div>
  );
} 