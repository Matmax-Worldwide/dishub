import { useMediaLibrary } from './useMediaLibrary';
import { MediaToolbar } from './MediaToolbar';
import { UploadProgress } from './UploadProgress';
import { MediaGrid } from './MediaGrid';
import { MediaList } from './MediaList';
import { EmptyState } from './EmptyState';
import { MediaItem } from './types';
import { AlertCircle, Settings } from 'lucide-react';

export interface MediaLibraryProps {
  onSelect?: (mediaItem: MediaItem) => void;
  isSelectionMode?: boolean;
  showHeader?: boolean;
}

export function MediaLibrary({ 
  onSelect, 
  isSelectionMode = false,
  showHeader = false
}: MediaLibraryProps) {
  const {
    isLoading,
    filteredMedia,
    searchQuery,
    filterType,
    viewMode,
    selectedItems,
    uploadProgress,
    error,
    isConfigError,
    setSearchQuery,
    setFilterType,
    setViewMode,
    toggleItemSelection,
    toggleSelectAll,
    handleFileUpload,
    deleteItem,
    deleteSelectedItems,
    refreshMediaItems
  } = useMediaLibrary();

  // Handle item selection in selection mode
  const handleItemSelect = (id: string) => {
    if (isSelectionMode && onSelect) {
      const item = filteredMedia.find(item => item.id === id);
      if (item) {
        onSelect(item);
        return;
      }
    }
    toggleItemSelection(id);
  };

  return (
    <div className="min-h-[80vh] flex flex-col">
      {showHeader && (
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight">Media Library</h1>
        </div>
      )}

      {uploadProgress !== null && (
        <UploadProgress progress={uploadProgress} />
      )}

      {isConfigError && (
        <div className="bg-amber-50 border-l-4 border-amber-500 p-4 mb-4 rounded">
          <div className="flex">
            <Settings className="h-5 w-5 text-amber-500 mr-2 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-medium text-amber-800">API Configuration Issue</h3>
              <p className="text-sm text-amber-700 mt-1">
                We&apos;re having trouble connecting to the media storage service (AWS S3). This could be due to:
              </p>
              <ul className="mt-2 text-xs text-amber-700 list-disc list-inside space-y-1">
                <li>Missing or incorrect environment variables on the server</li>
                <li>API routes not properly set up</li>
                <li>CORS configuration issues with your S3 bucket</li>
                <li>Network connectivity problems</li>
              </ul>
              <div className="text-xs text-amber-700 mt-2">
                <p className="font-medium">To fix this:</p>
                <ol className="list-decimal list-inside ml-2 mt-1 space-y-1">
                  <li>Check your server-side environment variables</li>
                  <li>Ensure S3 bucket CORS settings allow requests from your domain</li>
                  <li>Check browser console for detailed error messages</li>
                  <li>Verify network connectivity to AWS S3</li>
                </ol>
                <p className="mt-2">For now, we&apos;re showing you sample media items to preview the interface.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {error && !isConfigError && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4 rounded">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden flex-1">
        <MediaToolbar
          searchQuery={searchQuery}
          filterType={filterType}
          viewMode={viewMode}
          selectedCount={selectedItems.length}
          onSearchChange={setSearchQuery}
          onFilterChange={setFilterType}
          onViewModeChange={setViewMode}
          onFileSelect={handleFileUpload}
          onDeleteSelected={deleteSelectedItems}
          onRefresh={refreshMediaItems}
        />

        {isLoading ? (
          <div className="p-6 animate-pulse">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="bg-gray-100 rounded-lg aspect-square"></div>
              ))}
            </div>
          </div>
        ) : filteredMedia.length > 0 ? (
          viewMode === 'grid' ? (
            <MediaGrid
              items={filteredMedia}
              selectedItems={selectedItems}
              onSelectItem={handleItemSelect}
              onDeleteItem={deleteItem}
            />
          ) : (
            <MediaList
              items={filteredMedia}
              selectedItems={selectedItems}
              onSelectItem={handleItemSelect}
              onSelectAll={toggleSelectAll}
              onDeleteItem={deleteItem}
            />
          )
        ) : (
          <EmptyState
            searchQuery={searchQuery}
            filterType={filterType}
            onClearFilters={() => {
              setSearchQuery('');
              setFilterType('all');
            }}
            onRefresh={refreshMediaItems}
            onUpload={!isConfigError ? handleFileUpload : undefined}
          />
        )}
      </div>
    </div>
  );
} 