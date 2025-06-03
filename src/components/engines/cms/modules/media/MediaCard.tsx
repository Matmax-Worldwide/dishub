import { MediaItem, Folder } from './types';
import { MediaActions } from './MediaActions';
import { MediaFileMenu } from './MediaFileMenu';
import { formatFileSize } from './utils';
import S3FilePreview from '@/components/shared/S3FilePreview';
import { useRef } from 'react';

interface MediaCardProps {
  item: MediaItem;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onRename: (id: string, newName: string) => void;
  onMove: (id: string, targetFolder: string) => void;
  folders: Folder[];
  currentFolder: Folder;
  position?: 'up' | 'down' | 'auto';
}

export function MediaCard({ 
  item, 
  isSelected, 
  onSelect, 
  onDelete,
  onRename,
  onMove,
  folders,
  currentFolder,
  position = 'up'
}: MediaCardProps) {
  const {
    id,
    title,
    fileUrl,
    fileName,
    fileSize,
    fileType,
    altText
  } = item;
  
  const cardRef = useRef<HTMLDivElement>(null);

  const handleSelect = () => {
    onSelect(id);
  };

  return (
    <div 
      ref={cardRef}
      className={`border rounded-lg overflow-hidden group cursor-pointer ${
        isSelected ? 'ring-2 ring-blue-500' : ''
      }`}
      onClick={handleSelect}
    >
      <div className="relative aspect-square bg-gray-50">
        <S3FilePreview
          src={fileUrl}
          alt={altText || title}
          className="w-full h-full"
          width={300}
          height={300}
          fileType={fileType}
          fileName={fileName}
          showDownload={true}
          showMetadata={true}
        />
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-opacity flex items-center justify-center opacity-0 group-hover:opacity-100">
          <MediaActions fileUrl={fileUrl} s3Key={item.s3Key} onDelete={() => onDelete(id)} />
        </div>
        <div className="absolute top-2 left-2 z-10">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={handleSelect}
            onClick={(e) => e.stopPropagation()}
            className="h-4 w-4"
          />
        </div>
      </div>
      <div className="p-3 relative">
        <h3 className="font-medium text-sm truncate pr-8" title={title}>
          {title}
        </h3>
        <p className="text-xs text-gray-500 truncate pr-8" title={fileName}>
          {fileName}
        </p>
        <p className="text-xs text-gray-400 mt-1 pr-8">
          {formatFileSize(fileSize)}
        </p>
        <div className="absolute bottom-3 right-3" onClick={(e) => e.stopPropagation()}>
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
            position={position}
          />
        </div>
      </div>
    </div>
  );
} 