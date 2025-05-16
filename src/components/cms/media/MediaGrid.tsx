import { MediaItem } from './types';
import { MediaCard } from './MediaCard';

interface MediaGridProps {
  items: MediaItem[];
  selectedItems: string[];
  onSelectItem: (id: string) => void;
  onDeleteItem: (id: string) => void;
}

export function MediaGrid({ items, selectedItems, onSelectItem, onDeleteItem }: MediaGridProps) {
  return (
    <div className="p-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {items.map((item) => (
          <MediaCard
            key={item.id}
            item={item}
            isSelected={selectedItems.includes(item.id)}
            onSelect={onSelectItem}
            onDelete={onDeleteItem}
          />
        ))}
      </div>
    </div>
  );
} 