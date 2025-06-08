import { MediaItem, Folder } from './types';
import { MediaActions } from './MediaActions';
import { MediaFileMenu } from './MediaFileMenu';
import { formatFileSize } from './utils';
import S3FilePreview from '@/components/shared/S3FilePreview';

interface MediaListItemProps {
  item: MediaItem;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onRename: (id: string, newName: string) => Promise<void>;
  onMove: (id: string, targetFolder: string) => Promise<void>;
  folders: Folder[];
  currentFolder: Folder;
}

export function MediaListItem({ 
  item, 
  isSelected, 
  onSelect, 
  onDelete,
  onRename,
  onMove,
  folders,
  currentFolder
}: MediaListItemProps) {
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
            <S3FilePreview
              src={fileUrl}
              alt={altText || title}
              className="object-contain rounded w-full h-full flex items-center justify-center"
              fileType={fileType}
              fileName={fileName}
              showDownload={true}
            />
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
        <div className="flex items-center justify-end relative z-10">
          <MediaActions fileUrl={fileUrl} s3Key={item.s3Key} onDelete={() => onDelete(id)} horizontal />
          <div className="ml-2">
            <MediaFileMenu
              id={id}
              fileName={fileName}
              fileUrl={fileUrl}
              s3Key={item.s3Key}
              onDelete={onDelete}
              onRename={onRename}
              onMove={onMove}
              folders={folders}
              currentFolder={currentFolder}
              position="down"
            />
          </div>
        </div>
      </td>
    </tr>
  );
} 