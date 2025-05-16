import { Inbox, XCircle, RefreshCw } from 'lucide-react';
import { MediaUploadButton } from './MediaUploadButton';

interface EmptyStateProps {
  searchQuery: string;
  filterType: string;
  onClearFilters: () => void;
  onRefresh?: () => void;
  onUpload?: (files: FileList) => void;
}

export function EmptyState({ 
  searchQuery, 
  filterType, 
  onClearFilters, 
  onRefresh,
  onUpload 
}: EmptyStateProps) {
  const isFiltered = searchQuery || filterType !== 'all';
  
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="bg-gray-100 rounded-full p-4 mb-4">
        <Inbox className="h-8 w-8 text-gray-400" />
      </div>
      
      {isFiltered ? (
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-1">No matching items found</h3>
          <p className="text-gray-500 mb-6">
            {searchQuery ? `No results for "${searchQuery}"` : 'No items match the selected filter'}
          </p>
          <div className="flex justify-center space-x-4">
            <button
              onClick={onClearFilters}
              className="flex items-center px-4 py-2 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200"
            >
              <XCircle className="h-4 w-4 mr-2" />
              Clear Filters
            </button>
            
            {onRefresh && (
              <button
                onClick={onRefresh}
                className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </button>
            )}
          </div>
        </div>
      ) : (
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-1">No media files yet</h3>
          <p className="text-gray-500 mb-6">
            Upload your first file to get started
          </p>
          <div className="flex justify-center space-x-4">
            {onUpload && (
              <MediaUploadButton 
                onFileSelect={onUpload} 
                className="px-4 py-2 bg-blue-600 text-white rounded-md flex items-center hover:bg-blue-700"
              >
                Upload Now
              </MediaUploadButton>
            )}
            
            {onRefresh && (
              <button
                onClick={onRefresh}
                className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
} 