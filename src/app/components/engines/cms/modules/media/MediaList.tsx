import { MediaItem, Folder } from './types';
import { MediaListItem } from './MediaListItem';
import { ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';

interface MediaListProps {
  items: MediaItem[];
  selectedItems: string[];
  onSelectItem: (id: string) => void;
  onSelectAll: () => void;
  onDeleteItem: (id: string) => void;
  onRenameItem: (id: string, newName: string) => Promise<void>;
  onMoveItem: (id: string, targetFolder: string) => Promise<void>;
  folders: Folder[];
  currentFolder: Folder;
  onSort?: (field: keyof MediaItem) => void;
  sortField?: keyof MediaItem;
  sortDirection?: 'asc' | 'desc';
}

export function MediaList({ 
  items,
  selectedItems,
  onSelectItem,
  onSelectAll,
  onDeleteItem,
  onRenameItem,
  onMoveItem,
  folders,
  currentFolder,
  onSort,
  sortField,
  sortDirection
}: MediaListProps) {
  const allSelected = items.length > 0 && selectedItems.length === items.length;
  
  return (
    <div className="overflow-x-auto min-h-[400px]">
      <table className="w-full">
        <thead>
          <tr className="text-left bg-gray-50">
            <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider w-10">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={onSelectAll}
                className="h-4 w-4"
              />
            </th>
            <th 
              className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition"
              onClick={() => onSort?.('fileName')}
            >
              <div className="flex items-center">
                File
                {sortField === 'fileName' ? (
                  sortDirection === 'asc' ? (
                    <ArrowUp className="h-3 w-3 ml-1" />
                  ) : (
                    <ArrowDown className="h-3 w-3 ml-1" />
                  )
                ) : (
                  <ArrowUpDown className="h-3 w-3 ml-1 text-gray-400" />
                )}
              </div>
            </th>
            <th 
              className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition"
              onClick={() => onSort?.('fileType')}
            >
              <div className="flex items-center">
                Type
                {sortField === 'fileType' ? (
                  sortDirection === 'asc' ? (
                    <ArrowUp className="h-3 w-3 ml-1" />
                  ) : (
                    <ArrowDown className="h-3 w-3 ml-1" />
                  )
                ) : (
                  <ArrowUpDown className="h-3 w-3 ml-1 text-gray-400" />
                )}
              </div>
            </th>
            <th 
              className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition"
              onClick={() => onSort?.('fileSize')}
            >
              <div className="flex items-center">
                Size
                {sortField === 'fileSize' ? (
                  sortDirection === 'asc' ? (
                    <ArrowUp className="h-3 w-3 ml-1" />
                  ) : (
                    <ArrowDown className="h-3 w-3 ml-1" />
                  )
                ) : (
                  <ArrowUpDown className="h-3 w-3 ml-1 text-gray-400" />
                )}
              </div>
            </th>
            <th 
              className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition"
              onClick={() => onSort?.('uploadedAt')}
            >
              <div className="flex items-center">
                Uploaded
                {sortField === 'uploadedAt' ? (
                  sortDirection === 'asc' ? (
                    <ArrowUp className="h-3 w-3 ml-1" />
                  ) : (
                    <ArrowDown className="h-3 w-3 ml-1" />
                  )
                ) : (
                  <ArrowUpDown className="h-3 w-3 ml-1 text-gray-400" />
                )}
              </div>
            </th>
            <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <MediaListItem
              key={item.id}
              item={item}
              isSelected={selectedItems.includes(item.id)}
              onSelect={onSelectItem}
              onDelete={onDeleteItem}
              onRename={onRenameItem}
              onMove={onMoveItem}
              folders={folders}
              currentFolder={currentFolder}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
} 