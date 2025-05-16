import { MediaItem } from './types';
import { MediaListItem } from './MediaListItem';

interface MediaListProps {
  items: MediaItem[];
  selectedItems: string[];
  onSelectItem: (id: string) => void;
  onSelectAll: () => void;
  onDeleteItem: (id: string) => void;
}

export function MediaList({ 
  items,
  selectedItems,
  onSelectItem,
  onSelectAll,
  onDeleteItem 
}: MediaListProps) {
  const allSelected = items.length > 0 && selectedItems.length === items.length;
  
  return (
    <div className="overflow-x-auto">
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
            <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">File</th>
            <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
            <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Size</th>
            <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Uploaded</th>
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
            />
          ))}
        </tbody>
      </table>
    </div>
  );
} 