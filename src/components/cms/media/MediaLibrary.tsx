import { useMediaLibrary } from './useMediaLibrary';
import { MediaToolbar } from './MediaToolbar';
import { UploadProgress } from './UploadProgress';
import { MediaGrid } from './MediaGrid';
import { MediaList } from './MediaList';
import { EmptyState } from './EmptyState';
import { MediaItem } from './types';

export interface MediaLibraryProps {
  onSelect?: (mediaItem: MediaItem) => void;
  isSelectionMode?: boolean;
}

export function MediaLibrary({ onSelect, isSelectionMode = false }: MediaLibraryProps) {
  const {
    isLoading,
    filteredMedia,
    searchQuery,
    filterType,
    viewMode,
    selectedItems,
    uploadProgress,
    setSearchQuery,
    setFilterType,
    setViewMode,
    toggleItemSelection,
    toggleSelectAll,
    handleFileUpload,
    deleteItem,
    deleteSelectedItems
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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight">Media Library</h1>
      </div>

      {uploadProgress !== null && (
        <UploadProgress progress={uploadProgress} />
      )}

      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
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
            onUpload={() => document.getElementById('media-upload-button')?.click()}
          />
        )}
      </div>
    </div>
  );
} 