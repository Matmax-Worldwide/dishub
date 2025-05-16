import Image from 'next/image';
import { MediaItem } from './types';
import { MediaItemIcon } from './MediaItemIcon';
import { MediaActions } from './MediaActions';
import { formatFileSize } from './utils';

interface MediaListItemProps {
  item: MediaItem;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
}

export function MediaListItem({ item, isSelected, onSelect, onDelete }: MediaListItemProps) {
  const {
    id,
    title,
    fileUrl,
    fileName,
    fileSize,
    fileType,
    altText,
    uploadedAt
  } = item;

  const handleSelect = () => {
    onSelect(id);
  };

  const handleDelete = () => {
    onDelete(id);
  };

  return (
    <tr className="border-t hover:bg-gray-50">
      <td className="px-6 py-4 whitespace-nowrap">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={handleSelect}
          className="h-4 w-4"
        />
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center">
          <div className="flex-shrink-0 h-10 w-10 mr-3">
            {fileType.startsWith('image/') ? (
              <Image
                src={fileUrl}
                alt={altText || title}
                width={40}
                height={40}
                className="object-cover rounded"
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                <MediaItemIcon fileType={fileType} className="h-6 w-6" />
              </div>
            )}
          </div>
          <div>
            <div className="font-medium">{title}</div>
            <div className="text-sm text-gray-500">{fileName}</div>
          </div>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm">
        {fileType}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        {formatFileSize(fileSize)}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        {uploadedAt}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
        <MediaActions fileUrl={fileUrl} onDelete={handleDelete} horizontal />
      </td>
    </tr>
  );
} 