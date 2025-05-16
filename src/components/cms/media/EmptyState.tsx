import { ImageIcon, UploadIcon } from 'lucide-react';

interface EmptyStateProps {
  searchQuery: string;
  filterType: string;
  onUpload: () => void;
}

export function EmptyState({ searchQuery, filterType, onUpload }: EmptyStateProps) {
  return (
    <div className="p-12 text-center text-gray-500">
      <ImageIcon className="h-12 w-12 mx-auto text-gray-400 mb-4" />
      <h3 className="text-lg font-medium text-gray-900 mb-1">No media found</h3>
      <p className="max-w-md mx-auto mb-6">
        {searchQuery || filterType !== 'all'
          ? "No media matches your search criteria. Try adjusting your filters."
          : "Your media library is empty. Upload files to get started."}
      </p>
      <button
        onClick={onUpload}
        className="px-4 py-2 bg-blue-600 text-white rounded-md inline-flex items-center hover:bg-blue-700"
      >
        <UploadIcon className="h-4 w-4 mr-2" />
        Upload Files
      </button>
    </div>
  );
} 